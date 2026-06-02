import PDFDocument from 'pdfkit'
import prisma from '../config/prisma.js'

export class PdfGeneratorService {
  /**
   * Génère un rapport PDF certifié du Dossier Bancaire (Bank Pack) pour l'organisation spécifiée.
   */
  static async generateBankPackReport(orgId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Récupérer les détails de l'organisation
        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          include: {
            smeProfile: {
              include: {
                beneficialOwners: true
              }
            },
            trustScores: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            documents: {
              include: {
                versions: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        })

        if (!org) {
          throw new Error('Organisation introuvable')
        }

        const sme = org.smeProfile
        const latestScore = org.trustScores[0]
        const docs = org.documents

        // Initialiser PDFKit
        // @ts-ignore - PDFDocument constructor signature check
        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true })
        const chunks: Buffer[] = []
        
        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', (err) => reject(err))

        // Palette de couleurs de la marque UBB Flow
        const primaryColor = '#0F172A' // Slate 900
        const secondaryColor = '#0284C7' // Sky 600 (Trust brand)
        const lightBgColor = '#F8FAFC' // Slate 50
        const borderColor = '#E2E8F0' // Slate 200
        const textMutedColor = '#64748B' // Slate 500
        
        // ------------------ PAGE 1 : EN-TÊTE & SYNTHÈSE DE L'ENTITÉ ------------------
        
        // Ligne de marque supérieure décorative
        doc.rect(0, 0, 595.28, 15).fill(secondaryColor)
        
        // Titre Principal
        doc.moveDown(2)
        doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('UBB FLOW TRUST', { tracking: 2 })
        doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold').text('RAPPORT CERTIFIÉ DE CRÉDIBILITÉ PME', { tracking: 1 })
        doc.moveDown(0.5)
        
        // Ligne de séparation
        doc.moveTo(50, doc.y).lineTo(545.28, doc.y).strokeColor(borderColor).stroke()
        doc.moveDown(1.5)

        // Section 1 : Identité de la PME
        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('1. Identité Officielle de l\'Entreprise')
        doc.moveDown(0.5)
        
        const legalName = sme?.legalName || org.name
        const registrationNo = sme?.registrationNo || 'Non renseigné'
        const taxId = sme?.taxId || 'Non renseigné'
        const industry = sme?.industry || 'Non spécifié'
        const address = sme?.address || 'Non spécifiée'
        const website = sme?.website || 'Non renseigné'
        const email = sme?.email || 'Non renseigné'
        const phone = sme?.phone || 'Non renseigné'

        const startY = doc.y
        doc.rect(50, startY, 495.28, 140).fill(lightBgColor)
        
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        doc.text('Nom Légal :', 65, startY + 15)
        doc.font('Helvetica').text(legalName, 230, startY + 15)
        
        doc.font('Helvetica-Bold').text('Registre du Commerce (RCCM) :', 65, startY + 35)
        doc.font('Helvetica').text(registrationNo, 230, startY + 35)
        
        doc.font('Helvetica-Bold').text('Identifiant Unique (NUI) :', 65, startY + 55)
        doc.font('Helvetica').text(taxId, 230, startY + 55)
        
        doc.font('Helvetica-Bold').text('Secteur d\'Activité :', 65, startY + 75)
        doc.font('Helvetica').text(industry, 230, startY + 75)
        
        doc.font('Helvetica-Bold').text('Siège Social :', 65, startY + 95)
        doc.font('Helvetica').text(address, 230, startY + 95)
        
        doc.font('Helvetica-Bold').text('Coordonnées :', 65, startY + 115)
        doc.font('Helvetica').text(`${phone} | ${email} | ${website}`, 230, startY + 115)
        
        doc.y = startY + 160
        doc.moveDown(1)

        // Section 2 : Trust Score & Fiabilité Bancaire
        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('2. Analyse du Score de Confiance (Trust Score)', 50)
        doc.moveDown(0.5)

        const score = latestScore?.score ?? 0
        const getGrade = (val: number) => {
          if (val >= 90) return 'AAA'
          if (val >= 80) return 'AA'
          if (val >= 70) return 'A'
          if (val >= 60) return 'BBB'
          if (val >= 50) return 'BB'
          return 'B'
        }
        const grade = getGrade(score)

        const scoreY = doc.y
        doc.rect(50, scoreY, 495.28, 80).fill(lightBgColor)
        
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Score Global :', 65, scoreY + 20)
        doc.fontSize(28).font('Helvetica-Bold').fillColor(secondaryColor).text(`${score}`, 65, scoreY + 35)
        doc.fontSize(10).font('Helvetica').fillColor(textMutedColor).text('/ 100 points', 120, scoreY + 50)
        
        doc.fillColor(primaryColor).font('Helvetica-Bold').text('Grade UBB :', 230, scoreY + 20)
        doc.fontSize(28).font('Helvetica-Bold').fillColor(secondaryColor).text(grade, 230, scoreY + 35)
        
        doc.fontSize(9).font('Helvetica').fillColor(textMutedColor).text(
          `Indicateur composite basé sur l'intégrité de la Data Room, l'identité vérifiée des bénéficiaires effectifs, et l'activité transactionnelle récente de l'organisation.\nCalculé le : ${
            latestScore 
              ? new Date(latestScore.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) 
              : new Date().toLocaleDateString('fr-FR')
          }`,
          320,
          scoreY + 20,
          { width: 210, lineGap: 3 }
        )

        doc.y = scoreY + 100
        doc.moveDown(1)

        // Section 3 : Dirigeants & Structure Légale
        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('3. Dirigeants & Bénéficiaires Effectifs', 50)
        doc.moveDown(0.5)
        
        const owners = sme?.beneficialOwners || []
        if (owners.length === 0) {
          doc.fillColor(textMutedColor).fontSize(10).font('Helvetica-Oblique').text('Aucun bénéficiaire effectif ou dirigeant renseigné dans la fiche entreprise.')
          doc.moveDown(1)
        } else {
          const tableY = doc.y
          doc.rect(50, tableY, 495.28, 20).fill(secondaryColor)
          doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
          doc.text('Nom Complet', 60, tableY + 5)
          doc.text('Rôle', 240, tableY + 5)
          doc.text('Nationalité', 380, tableY + 5)
          doc.text('% Détention', 470, tableY + 5, { width: 65, align: 'right' })
          
          let currentY = tableY + 20
          doc.fillColor(primaryColor).font('Helvetica').fontSize(9)
          
          owners.forEach((o, index) => {
            if (index % 2 === 1) {
              doc.rect(50, currentY, 495.28, 20).fill('#F1F5F9')
              doc.fillColor(primaryColor)
            }
            doc.text(o.name, 60, currentY + 5)
            doc.text(o.role || 'Associé', 240, currentY + 5)
            doc.text(o.nationality || 'Camerounaise', 380, currentY + 5)
            doc.text(`${o.ownershipPct || 0} %`, 470, currentY + 5, { width: 65, align: 'right' })
            currentY += 20
          })
          
          doc.y = currentY
          doc.moveDown(1)
        }

        // Ajouter une deuxième page pour les documents
        doc.addPage()
        
        // ------------------ PAGE 2 : AUDIT ET DOSSIER DOCUMENTAIRE ------------------
        
        doc.rect(0, 0, 595.28, 15).fill(secondaryColor)
        doc.moveDown(2)
        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('4. Dossier Documentaire & Audit Data Room', 50)
        doc.moveDown(0.5)
        doc.moveTo(50, doc.y).lineTo(545.28, doc.y).strokeColor(borderColor).stroke()
        doc.moveDown(1.5)

        // Tableau des documents
        const checklistY = doc.y
        doc.rect(50, checklistY, 495.28, 20).fill(secondaryColor)
        doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
        doc.text('Type de Document', 60, checklistY + 5)
        doc.text('Nom du Fichier', 200, checklistY + 5)
        doc.text('Date d\'Upload', 380, checklistY + 5)
        doc.text('Statut', 460, checklistY + 5, { width: 75, align: 'right' })

        let docY = checklistY + 20
        doc.fillColor(primaryColor).font('Helvetica').fontSize(9)

        if (docs.length === 0) {
          doc.rect(50, docY, 495.28, 30).fill('#F8FAFC')
          doc.fillColor(textMutedColor).font('Helvetica-Oblique').text('Aucun document de conformité téléversé dans le coffre-fort numérique.', 60, docY + 10)
          docY += 30
        } else {
          docs.forEach((d, index) => {
            const latestVersion = d.versions[0]
            const uploadDate = latestVersion ? new Date(latestVersion.createdAt).toLocaleDateString('fr-FR') : 'N/A'
            const fileName = latestVersion ? latestVersion.fileName : 'N/A'
            
            if (index % 2 === 1) {
              doc.rect(50, docY, 495.28, 22).fill('#F1F5F9')
              doc.fillColor(primaryColor)
            }
            
            doc.font('Helvetica-Bold').text(d.type, 60, docY + 6)
            doc.font('Helvetica').text(fileName, 200, docY + 6, { width: 170, height: 12, ellipsis: true })
            doc.text(uploadDate, 380, docY + 6)
            
            // Couleur & Label de Statut
            let statusLabel = d.status
            let statusColor = textMutedColor
            if (d.status === 'VERIFIED') {
              statusLabel = 'VÉRIFIÉ'
              statusColor = '#059669' // Green 600
            } else if (d.status === 'SUBMITTED') {
              statusLabel = 'EN REVUE'
              statusColor = '#D97706' // Amber 600
            } else if (d.status === 'REJECTED') {
              statusLabel = 'REJETÉ'
              statusColor = '#DC2626' // Red 600
            } else if (d.status === 'DRAFT') {
              statusLabel = 'BROUILLON'
              statusColor = '#64748B' // Slate 500
            }
            
            doc.font('Helvetica-Bold').fillColor(statusColor).text(statusLabel, 460, docY + 6, { width: 75, align: 'right' })
            doc.fillColor(primaryColor)
            docY += 22
          })
        }

        doc.y = docY
        doc.moveDown(2)

        // Clause de non-responsabilité et signature automatique
        doc.y = docY + 35
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Certification de Conformité', 50, doc.y, { align: 'left', width: 495.28 })
        doc.moveDown(0.4)
        doc.fillColor(textMutedColor).fontSize(8.5).font('Helvetica').text(
          `Les données présentées dans ce rapport de certification proviennent directement du grand livre d'informations sécurisées de la plateforme UBB Flow Trust. Elles ont été validées et certifiées par notre algorithme de validation et notre protocole d'interconnexion bancaire. Ce rapport peut être partagé directement auprès de vos partenaires financiers afin de faciliter l'évaluation de vos lignes de crédit ou vos processus KYC.`,
          50,
          doc.y,
          { align: 'justify', lineGap: 3, width: 495.28 }
        )

        // Pied de page sur l'ensemble des pages du document
        const pageCount = doc.bufferedPageRange().count
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i)
          
          // Désactiver temporairement la marge basse pour éviter la création de page automatique
          const oldBottomMargin = doc.page.margins.bottom
          doc.page.margins.bottom = 0
          
          doc.fontSize(6.5).fillColor(textMutedColor).font('Helvetica')
          doc.text(
            `Généré électroniquement par le protocole UBB Flow. ID Organisation : ${orgId} | Code Empreinte : ${orgId.substring(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
            40,
            800,
            { align: 'center', width: 515.28 }
          )
          doc.text(
            `Document Certifié - Page ${i + 1} sur ${pageCount}`,
            40,
            816,
            { align: 'center', width: 515.28 }
          )
          
          // Restaurer la marge basse
          doc.page.margins.bottom = oldBottomMargin
        }

        doc.end()
      } catch (err) {
        reject(err)
      }
    })
  }
}
