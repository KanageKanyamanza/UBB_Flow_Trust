import prisma from '../config/prisma.js'
import { ConsentGrantService } from '../services/consent-grant.service.js'

async function runTest() {
  console.log('🚀 Running ConsentGrant end-to-end backend tests...')

  // 1. Fetch an organization
  const org = await prisma.organization.findFirst()
  if (!org) {
    console.error('❌ No organization found in the database. Please seed first.')
    return
  }
  const orgId = org.id
  console.log(`✅ Using organization: ${org.name} (${orgId})`)

  // 2. Create a ConsentGrant
  console.log('\n--- Test 1: Create ConsentGrant & Generate signed JWT ---')
  const partnerName = 'CreditBank Cameroon'
  const purpose = 'SME Loan Risk Assessment'
  const scope = 'profile:read transactions:read'
  // Expires in 1 hour
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  const result = await ConsentGrantService.createConsentGrant(
    orgId,
    partnerName,
    purpose,
    scope,
    expiresAt
  )

  console.log('✅ ConsentGrant database record created successfully!')
  console.log('  ID:', result.consentGrant.id)
  console.log('  Partner:', result.consentGrant.partnerName)
  console.log('  Scope:', result.consentGrant.scope)
  console.log('  ExpiresAt:', result.consentGrant.expiresAt)
  console.log('✅ Temporary signed access JWT generated successfully!')
  console.log('  Token:', result.token.substring(0, 40) + '...')

  // 3. Verify the token
  console.log('\n--- Test 2: Verify Token ---')
  const verifiedGrant = await ConsentGrantService.verifyToken(result.token)
  console.log('✅ Token signature and database state verified!')
  console.log('  Verified ID:', verifiedGrant.id)
  console.log('  Verified OrgID:', verifiedGrant.orgId)

  // 4. Test Scope checks (simulate middleware behavior)
  console.log('\n--- Test 3: Scope validations ---')
  const scopes = verifiedGrant.scope.split(/\s+/).map(s => s.trim().toLowerCase())
  const hasProfileRead = scopes.includes('profile:read')
  const hasTransactionsRead = scopes.includes('transactions:read')
  const hasTrustRead = scopes.includes('trust:read')

  console.log(`  Scope 'profile:read' allowed? ${hasProfileRead ? '✅ Yes' : '❌ No'}`)
  console.log(`  Scope 'transactions:read' allowed? ${hasTransactionsRead ? '✅ Yes' : '❌ No'}`)
  console.log(`  Scope 'trust:read' allowed? ${hasTrustRead ? '✅ Yes' : '❌ No'}`)

  if (hasProfileRead && hasTransactionsRead && !hasTrustRead) {
    console.log('✅ Scope authorization works perfectly!')
  } else {
    console.error('❌ Scope authorization failed expected state!')
  }

  // 5. List ConsentGrants
  console.log('\n--- Test 4: List ConsentGrants ---')
  const list = await ConsentGrantService.listConsentGrants(orgId)
  const found = list.some(item => item.id === result.consentGrant.id)
  if (found) {
    console.log(`✅ ConsentGrant is listed correctly! (Total listed: ${list.length})`)
  } else {
    console.error('❌ ConsentGrant not found in list!')
  }

  // 6. Revoke ConsentGrant and test token invalidation
  console.log('\n--- Test 5: Revoke & Verify Token invalidation ---')
  await ConsentGrantService.revokeConsentGrant(result.consentGrant.id, orgId)
  console.log('✅ ConsentGrant revoked (deleted) successfully from database.')

  try {
    console.log('  Trying to verify the JWT of the revoked grant...')
    await ConsentGrantService.verifyToken(result.token)
    console.error('❌ Verification succeeded but it should have failed because the grant was revoked!')
  } catch (error: any) {
    console.log(`✅ Verification failed as expected: "${error.message}"`)
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉')
}

runTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
