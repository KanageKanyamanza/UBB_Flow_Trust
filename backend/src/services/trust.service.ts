import prisma from '../config/prisma.js'

export class TrustService {
  static async calculateScore(orgId: string) {
    let score = 0
    const reasons: string[] = []

    // 1. Profile Completion (20 points)
    const profile = await prisma.smeProfile.findUnique({
      where: { orgId }
    })

    if (profile) {
      const fields = ['legalName', 'registrationNo', 'taxId', 'industry', 'address', 'email', 'phone']
      const filledFields = fields.filter(f => !!(profile as any)[f])
      const profileScore = Math.floor((filledFields.length / fields.length) * 20)
      score += profileScore
      if (profileScore < 20) reasons.push('PROFIL_INCOMPLET')
    } else {
      reasons.push('PROFIL_MANQUANT')
    }

    // 2. Beneficial Owners (20 points)
    const officers = await prisma.beneficialOwner.findMany({
      where: { smeProfile: { orgId } }
    })
    if (officers.length > 0) {
      score += 20
    } else {
      reasons.push('OFFICIERS_MANQUANTS')
    }

    // 3. Documents (40 points)
    const documents = await prisma.document.findMany({
      where: { orgId }
    })
    
    const requiredTypes = ['STATUTS', 'RCCM', 'NUI']
    const presentTypes = documents.map(d => d.type.toUpperCase())
    const docCount = requiredTypes.filter(t => presentTypes.includes(t)).length
    const docScore = Math.floor((docCount / requiredTypes.length) * 40)
    score += docScore
    if (docScore < 40) reasons.push('DOCUMENTS_MANQUANTS')

    // 4. Activity/Transactions (20 points)
    const txnCount = await prisma.transaction.count({
      where: { orgId }
    })
    if (txnCount > 10) {
      score += 20
    } else if (txnCount > 0) {
      score += 10
      reasons.push('ACTIVITE_FAIBLE')
    } else {
      reasons.push('AUCUNE_ACTIVITE')
    }

    // Save score history
    await prisma.trustScore.create({
      data: {
        orgId,
        score,
        reasonCodes: reasons
      }
    })

    return { score, reasons, reasonCodes: reasons }
  }

  static async getLatestScore(orgId: string) {
    // For now, always recalculate to ensure real-time updates in dev
    return this.calculateScore(orgId)
  }
}
