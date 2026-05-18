import prisma from '../src/config/prisma.js'

async function main() {
  console.log('Seeding checklist templates...')

  const localTemplate = await prisma.checklistTemplate.upsert({
    where: { market: 'LOCAL' },
    update: {},
    create: {
      market: 'LOCAL',
      requirements: [
        'Statuts de l\'entreprise',
        'Registre du Commerce (RCCM)',
        'Numéro d\'Identifiant Unique (NUI)',
        'Attestation de non-redevance fiscale',
        'États financiers (Dernier exercice)'
      ]
    }
  })

  const euTemplate = await prisma.checklistTemplate.upsert({
    where: { market: 'EU' },
    update: {},
    create: {
      market: 'EU',
      requirements: [
        'Statuts de l\'entreprise',
        'Extrait K-bis (ou équivalent)',
        'Numéro de TVA intracommunautaire',
        'Document d\'évaluation des risques (DUERP)',
        'Politique de protection des données (RGPD)',
        'États financiers certifiés'
      ]
    }
  })

  console.log('Templates seeded:', { localTemplate, euTemplate })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
