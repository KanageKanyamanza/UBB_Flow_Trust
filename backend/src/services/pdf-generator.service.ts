import PDFDocument from 'pdfkit'
import prisma from '../config/prisma.js'
import { ProfileService } from './profile.service.js'
import { ComplianceService } from './compliance.service.js'
import { TrustService } from './trust.service.js'

export class PdfGeneratorService {
  /**
   * Génère un rapport PDF complet de synthèse financière et conformité (Bank Pack)
   */
  static async generateBankPackPdf(orgId: string): Promise<Buffer> {
    // 1. Récupération des données
    const profile = await ProfileService.getProfile(orgId)
    const scoreInfo = await TrustService.getLatestScore(orgId)
    const checklist = await ComplianceService.getJourney(orgId)
    
    const accounts = await prisma.account.findMany({
      where: { orgId },
      orderBy: { name: 'asc' }
    })
    
    const txnCount = await prisma.transaction.count({
      where: { orgId }
    })

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' })
        const chunks: Buffer[] = []

        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', (err) => reject(err))

        // Palette de couleurs
        const colors = {
          primary: '#1E3A8A',     // Bleu Marine
          secondary: '#3D80F5',   // Bleu UBB Trust
          success: '#10B981',     // Vert Émeraude
          warning: '#F59E0B',     // Ambre/Or
          danger: '#EF4444',      // Rouge
          textDark: '#0F172A',    // Slate 900
          textMuted: '#64748B',   // Slate 500
          border: '#E2E8F0',      // Slate 200
          bgLight: '#F8FAFC'      // Slate 50
        }

        // --- EN-TÊTE ---
        doc.rect(0, 0, 595.28, 12).fill(colors.primary) // Ligne décorative supérieure

        doc.y = 30
        doc.fillColor(colors.primary)
           .fontSize(22)
           .font('Helvetica-Bold')
           .text('UBB FLOW', { continued: true })
           .fillColor(colors.success)
           .text(' TRUST')

        doc.fillColor(colors.textMuted)
           .fontSize(9)
           .font('Helvetica')
           .text('Rapport d\'Éligibilité Financière & Conformité', 40, 55)

        const dateStr = new Date().toLocaleDateString('fr-FR', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
        
        doc.fillColor(colors.textMuted)
           .fontSize(8)
           .text(`Généré le : ${dateStr}`, 400, 35, { align: 'right' })
           .text('Statut : Certifié par UBB Flow', 400, 47, { align: 'right' })

        doc.moveTo(40, 70).lineTo(555, 70).strokeColor(colors.border).lineWidth(1).stroke()

        // --- DEUX COLONNES SUPÉRIEURES (TRUST SCORE & INFO COMPAGNIE) ---
        // Colonne Gauche : Trust Score
        const score = scoreInfo.score
        let scoreColor = colors.danger
        let scoreLabel = 'Faible'
        if (score >= 80) {
          scoreColor = colors.success
          scoreLabel = 'Excellente'
        } else if (score >= 50) {
          scoreColor = colors.warning
          scoreLabel = 'Moyenne'
        }

        doc.rect(40, 85, 240, 110).fill(colors.bgLight)
        doc.rect(40, 85, 240, 110).strokeColor(colors.border).lineWidth(1).stroke()

        doc.fillColor(colors.textDark).fontSize(10).font('Helvetica-Bold').text('SCORE DE CONFIANCE (TRUST)', 55, 95)
        
        // Cercle ou Badge de Score
        doc.circle(95, 145, 25).fill(scoreColor)
        doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text(`${score}`, 70, 138, { width: 50, align: 'center' })

        doc.fillColor(colors.textDark).fontSize(12).font('Helvetica-Bold').text(`Éligibilité : ${scoreLabel}`, 135, 130)
        doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica').text('Calculé sur la base de la Data Room et de l\'activité financière.', 135, 147, { width: 135 })

        // Colonne Droite : Informations Générales PME
        doc.fillColor(colors.primary).fontSize(12).font('Helvetica-Bold').text('Informations Entreprise', 300, 85)
        
        doc.fillColor(colors.textDark).fontSize(9).font('Helvetica-Bold').text('Raison sociale : ', 300, 105, { continued: true })
           .font('Helvetica').text(profile.legalName || 'Non spécifié')
           
        doc.font('Helvetica-Bold').text('N° Enregistrement / RCCM : ', 300, 120, { continued: true })
           .font('Helvetica').text(profile.registrationNo || 'Non spécifié')

        doc.font('Helvetica-Bold').text('Numéro Identifiant Unique (NUI) : ', 300, 135, { continued: true })
           .font('Helvetica').text(profile.taxId || 'Non spécifié')

        doc.font('Helvetica-Bold').text('Secteur d\'Activité : ', 300, 150, { continued: true })
           .font('Helvetica').text(profile.industry || 'Non spécifié')

        doc.font('Helvetica-Bold').text('Adresse : ', 300, 165, { continued: true })
           .font('Helvetica').text(profile.address || 'Non spécifié')

        doc.moveTo(40, 210).lineTo(555, 210).strokeColor(colors.border).lineWidth(1).stroke()

        // --- BÉNÉFICIAIRES EFFECTIFS (UBOs) ---
        doc.fillColor(colors.primary).fontSize(12).font('Helvetica-Bold').text('Bénéficiaires Effectifs (UBO)', 40, 225)

        const Ubos = profile.beneficialOwners || []
        if (Ubos.length === 0) {
          doc.fillColor(colors.textMuted).fontSize(9).font('Helvetica').text('Aucun bénéficiaire effectif déclaré.', 40, 245)
          doc.y = 265
        } else {
          // Dessiner le tableau des UBOs
          let currentY = 245
          
          // Entête tableau
          doc.rect(40, currentY, 515, 18).fill(colors.primary)
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
          doc.text('Nom & Prénom', 45, currentY + 5, { width: 140 })
          doc.text('Rôle / Fonction', 190, currentY + 5, { width: 100 })
          doc.text('Propriété', 300, currentY + 5, { width: 60 })
          doc.text('Nationalité', 370, currentY + 5, { width: 70 })
          doc.text('Pièce d\'Identité', 450, currentY + 5, { width: 100 })

          currentY += 18
          
          doc.fillColor(colors.textDark).fontSize(8).font('Helvetica')
          Ubos.forEach((ubo: any, index: number) => {
            // Fond alterné
            if (index % 2 === 1) {
              doc.rect(40, currentY, 515, 18).fill(colors.bgLight)
            }
            doc.fillColor(colors.textDark)
            doc.text(ubo.name, 45, currentY + 5, { width: 140, ellipsis: true })
            doc.text(ubo.role || 'Associé', 190, currentY + 5, { width: 100, ellipsis: true })
            doc.text(`${ubo.ownershipPct || 0}%`, 300, currentY + 5, { width: 60 })
            doc.text(ubo.nationality || '-', 370, currentY + 5, { width: 70 })
            doc.text(ubo.idType ? `${ubo.idType} (${ubo.idNumber || '-'})` : '-', 450, currentY + 5, { width: 100, ellipsis: true })
            
            currentY += 18
          })
          
          doc.y = currentY + 10
        }

        // --- CONFORMITÉ RÉGLEMENTAIRE (DATA ROOM CHECKLIST) ---
        doc.y = doc.y > 360 ? doc.y : 360 // S'assure que le contenu ne se chevauche pas
        
        doc.fillColor(colors.primary).fontSize(12).font('Helvetica-Bold').text('Conformité de la Data Room', 40, doc.y)
        
        const checklistItems = checklist?.items || []
        if (checklistItems.length === 0) {
          doc.fillColor(colors.textMuted).fontSize(9).font('Helvetica').text('Aucun élément de conformité vérifié.', 40, doc.y + 20)
          doc.y = doc.y + 40
        } else {
          let currentY = doc.y + 20
          
          // Entête Checklist
          doc.rect(40, currentY, 515, 18).fill(colors.primary)
          doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
          doc.text('Document requis', 45, currentY + 5, { width: 300 })
          doc.text('Statut de validation', 360, currentY + 5, { width: 100 })
          doc.text('Points / Impact', 470, currentY + 5, { width: 80 })
          
          currentY += 18

          doc.fillColor(colors.textDark).fontSize(8).font('Helvetica')
          checklistItems.forEach((item: any, index: number) => {
            // Fond alterné
            if (index % 2 === 1) {
              doc.rect(40, currentY, 515, 18).fill(colors.bgLight)
            }
            doc.fillColor(colors.textDark)
            doc.text(item.requirement, 45, currentY + 5, { width: 300 })

            // Couleur du statut
            let statusText = 'Manquant'
            let statusColor = colors.danger
            if (item.status === 'PASS') {
              statusText = 'Validé'
              statusColor = colors.success
            } else if (item.status === 'IN_REVIEW') {
              statusText = 'En cours'
              statusColor = colors.warning
            } else if (item.status === 'NOT_APPLICABLE') {
              statusText = 'Non applicable'
              statusColor = colors.textMuted
            }

            doc.fillColor(statusColor).font('Helvetica-Bold').text(statusText, 360, currentY + 5, { width: 100 })

            let pointsImpact = '-40 pts'
            if (item.status === 'PASS') pointsImpact = '+40 pts'
            else if (item.status === 'IN_REVIEW') pointsImpact = '0 pts'
            else if (item.status === 'NOT_APPLICABLE') pointsImpact = '-'
            
            // On n'affiche les points que pour les 3 requis majeurs (Statuts, RCCM, NUI)
            const mainDocs = ["Statuts de l'entreprise", "Registre du Commerce (RCCM)", "Numéro d'Identifiant Unique (NUI)"]
            const isMain = mainDocs.includes(item.requirement)

            doc.fillColor(statusColor).text(isMain ? pointsImpact : '-', 470, currentY + 5, { width: 80 })
            doc.font('Helvetica')

            currentY += 18
          })

          doc.y = currentY + 15
        }

        // Saut de page pour les comptes et transactions si nécessaire, ou affichage en bas
        if (doc.y > 600) {
          doc.addPage()
          doc.y = 40
        }

        // --- SYNTHÈSE COMPTABLE & TRANSACTIONNELLE ---
        doc.fillColor(colors.primary).fontSize(12).font('Helvetica-Bold').text('Résumé de l\'Activité Financière', 40, doc.y)

        let totalBalance = 0
        let accountsCount = accounts.length
        
        accounts.forEach(acc => {
          totalBalance += Number(acc.balance)
        })

        // Cartes de résumé rapide
        const cardY = doc.y + 15
        doc.rect(40, cardY, 160, 45).fill(colors.bgLight)
        doc.rect(40, cardY, 160, 45).strokeColor(colors.border).lineWidth(1).stroke()
        doc.fillColor(colors.textMuted).fontSize(7).font('Helvetica-Bold').text('COMPTES BANCAIRES', 50, cardY + 8)
        doc.fillColor(colors.textDark).fontSize(12).font('Helvetica-Bold').text(`${accountsCount}`, 50, cardY + 22)

        doc.rect(215, cardY, 160, 45).fill(colors.bgLight)
        doc.rect(215, cardY, 160, 45).strokeColor(colors.border).lineWidth(1).stroke()
        doc.fillColor(colors.textMuted).fontSize(7).font('Helvetica-Bold').text('TRANSACTIONS ENREGISTRÉES', 225, cardY + 8)
        doc.fillColor(colors.textDark).fontSize(12).font('Helvetica-Bold').text(`${txnCount}`, 225, cardY + 22)

        doc.rect(390, cardY, 165, 45).fill(colors.bgLight)
        doc.rect(390, cardY, 165, 45).strokeColor(colors.border).lineWidth(1).stroke()
        doc.fillColor(colors.textMuted).fontSize(7).font('Helvetica-Bold').text('SOLDE GLOBAL CUMULÉ', 400, cardY + 8)
        doc.fillColor(colors.success).fontSize(12).font('Helvetica-Bold').text(`${totalBalance.toLocaleString('fr-FR')} XAF`, 400, cardY + 22)

        // Tableau des comptes
        let tableY = cardY + 60
        doc.fillColor(colors.textDark).fontSize(9).font('Helvetica-Bold').text('Détail des comptes connectés', 40, tableY)
        
        tableY += 15
        doc.rect(40, tableY, 515, 18).fill(colors.primary)
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold')
        doc.text('Nom du Compte / Banque', 45, tableY + 5, { width: 220 })
        doc.text('Type de compte', 270, tableY + 5, { width: 100 })
        doc.text('Devise', 380, tableY + 5, { width: 50 })
        doc.text('Solde actuel', 440, tableY + 5, { width: 110, align: 'right' })

        tableY += 18
        doc.fillColor(colors.textDark).fontSize(8).font('Helvetica')
        accounts.forEach((acc, index) => {
          if (index % 2 === 1) {
            doc.rect(40, tableY, 515, 18).fill(colors.bgLight)
          }
          doc.fillColor(colors.textDark)
          doc.text(acc.name, 45, tableY + 5, { width: 220 })
          doc.text(acc.type, 270, tableY + 5, { width: 100 })
          doc.text(acc.currency, 380, tableY + 5, { width: 50 })
          doc.text(`${Number(acc.balance).toLocaleString('fr-FR')} XAF`, 440, tableY + 5, { width: 110, align: 'right' })
          
          tableY += 18
        })

        // --- BAS DE PAGE ---
        doc.moveTo(40, 750).lineTo(555, 750).strokeColor(colors.border).lineWidth(1).stroke()
        doc.fillColor(colors.textMuted).fontSize(7)
           .text('UBB Flow Trust - Tous droits réservés. Ce document fait office de certification pour la conformité de l\'entreprise.', 40, 760, { width: 515, align: 'center' })
           .text('Toute modification frauduleuse de ce PDF annule son authenticité auprès des partenaires bancaires.', 40, 770, { width: 515, align: 'center' })

        doc.end()
      } catch (err) {
        reject(err)
      }
    })
  }
}
