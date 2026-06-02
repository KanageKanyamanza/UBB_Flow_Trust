import prisma from '../config/prisma.js'

async function main() {
  console.log('=== Checking Database Tables ===')
  const profiles = await prisma.publicProfile.findMany()
  console.log('Public Profiles in DB:', JSON.stringify(profiles, null, 2))
  
  const smes = await prisma.smeProfile.findMany()
  console.log('SME Profiles in DB:', JSON.stringify(smes, null, 2))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
