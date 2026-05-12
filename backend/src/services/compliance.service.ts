import prisma from '../config/prisma.js'

export class ComplianceService {
  private static requirementToTypeMap: { [key: string]: string } = {
    "Statuts de l'entreprise": "STATUTS",
    "Registre du Commerce (RCCM)": "RCCM",
    "Numéro d'Identifiant Unique (NUI)": "NUI",
    "Attestation de non-redevance fiscale": "ATTESTATION_FISCALE",
    "États financiers (Dernier exercice)": "ETATS_FINANCIERS",
    "Extrait K-bis (ou équivalent)": "KBIS",
    "Numéro de TVA intracommunautaire": "TVA",
    "Document d'évaluation des risques (DUERP)": "DUERP",
    "Politique de protection des données (RGPD)": "RGPD",
    "États financiers certifiés": "ETATS_FINANCIERS_CERTIFIES"
  }

  static async startJourney(orgId: string, market: string) {
    // 1. Get template
    const template = await prisma.checklistTemplate.findUnique({
      where: { market }
    })
    
    if (!template) {
      throw new Error(`No template found for market ${market}`)
    }

    // Check if a checklist already exists for this org and market
    const existingChecklist = await prisma.checklist.findFirst({
      where: { orgId, market },
      include: { items: true }
    })

    if (existingChecklist) {
      // If it exists, we might want to refresh the auto-mapping for missing items
      // or just return it. Let's return it for now to avoid duplicates.
      // But the user asked to "Start", so maybe we should return the existing one.
      return existingChecklist
    }

    // 2. Create Checklist
    const checklist = await prisma.checklist.create({
      data: {
        market,
        orgId,
      }
    })

    // 3. Create ChecklistItems and Auto-map
    // Get existing documents for this org
    const existingDocs = await prisma.document.findMany({
      where: { orgId }
    })

    const itemsData = []

    for (const requirement of template.requirements) {
      const targetType = this.requirementToTypeMap[requirement]
      let docId: string | null = null
      let status: 'MISSING' | 'IN_REVIEW' | 'PASS' | 'FAIL' | 'NOT_APPLICABLE' = 'MISSING'

      if (targetType) {
        // Find if there is an existing document of this type
        const matchingDoc = existingDocs.find(d => d.type.toUpperCase() === targetType.toUpperCase())
        if (matchingDoc) {
          docId = matchingDoc.id
          
          // Map document status to checklist item status
          switch (matchingDoc.status) {
            case 'VERIFIED':
              status = 'PASS'
              break
            case 'SUBMITTED':
            case 'DRAFT':
              status = 'IN_REVIEW'
              break
            case 'REJECTED':
            case 'EXPIRED':
              status = 'FAIL'
              break
            default:
              status = 'MISSING'
          }
        }
      }

      itemsData.push({
        requirement,
        status,
        checklistId: checklist.id,
        docId
      })
    }

    // Create items
    await prisma.checklistItem.createMany({
      data: itemsData
    })

    // Return the checklist with items
    return await prisma.checklist.findUnique({
      where: { id: checklist.id },
      include: { items: true }
    })
  }

  static async getJourney(orgId: string) {
    return await prisma.checklist.findFirst({
      where: { orgId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
  }
}
