import prisma from '../config/prisma.js'
import { ComplianceService } from '../services/compliance.service.js'

async function runTest() {
  const market = 'TEST_MARKET'

  console.log('Setting up test data...')
  
  const org = await prisma.organization.findFirst()
  if (!org) {
    console.error('❌ No organization found in database. Please run the seed script first.')
    return
  }
  const orgId = org.id
  console.log(`Using organization ID: \${orgId}`)
  
  // Create template if not exists
  let template = await prisma.checklistTemplate.findUnique({
    where: { market }
  })

  if (!template) {
    template = await prisma.checklistTemplate.create({
      data: {
        market,
        requirements: ["Statuts de l'entreprise", "Registre du Commerce (RCCM)", "Autre Document Inconnu"]
      }
    })
    console.log('Created test template.')
  } else {
    console.log('Test template already exists.')
  }

  // Create a document for the org to simulate partial match
  // "Statuts de l'entreprise" maps to "STATUTS"
  const targetType = "STATUTS"
  
  const existingDoc = await prisma.document.findFirst({
    where: { orgId, type: targetType }
  })

  if (!existingDoc) {
    await prisma.document.create({
      data: {
        orgId,
        type: targetType,
        name: 'Statuts',
        status: 'VERIFIED'
      }
    })
    console.log('Created test document (STATUTS).')
  } else {
    console.log('Test document already exists.')
  }

  console.log('Running getMissingDocuments...')
  const missing = await ComplianceService.getMissingDocuments(orgId, market)
  
  console.log('\n--- TEST RESULT ---')
  console.log('Expected missing: ["Registre du Commerce (RCCM)", "Autre Document Inconnu"]')
  console.log('Actual missing:', missing)
  
  // Verify result
  const expected = ["Registre du Commerce (RCCM)", "Autre Document Inconnu"]
  const isCorrect = missing.length === expected.length && missing.every(val => expected.includes(val))
  
  if (isCorrect) {
    console.log('\n✅ Test PASSED!')
  } else {
    console.log('\n❌ Test FAILED!')
  }
}

runTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
