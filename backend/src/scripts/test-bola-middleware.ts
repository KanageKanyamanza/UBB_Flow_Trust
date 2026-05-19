import prisma from '../config/prisma.js'
import { ConsentGrantService } from '../services/consent-grant.service.js'
import {
  hasValidConsent,
  requireConsentScope,
  checkConsentGrantBola
} from '../middleware/consent-grant.middleware.js'
import type { ConsentGrantRequest } from '../middleware/consent-grant.middleware.js'
import type { Response } from 'express'

// Helper pour créer un mock de Response Express
const createMockResponse = () => {
  const res: any = {}
  res.statusCode = 200
  res.jsonData = null
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  res.json = (data: any) => {
    res.jsonData = data
    return res
  }
  res.send = () => {
    return res
  }
  return res as Response & { statusCode: number; jsonData: any }
}

async function runBolaTest() {
  console.log('🚀 Démarrage du test d\'intégration pour le BOLA renforcé et scopes du token invité...\n')

  // --- SETUP DES DONNÉES DE TEST ---
  console.log('📦 Configuration des organisations et ressources de test...')
  
  // 1. Création des Organisations
  const orgA = await prisma.organization.create({
    data: { name: 'Test Org A - Owner' }
  })
  const orgB = await prisma.organization.create({
    data: { name: 'Test Org B - Attacker' }
  })
  console.log(`   - Org A créée: ${orgA.id}`)
  console.log(`   - Org B créée: ${orgB.id}`)

  // 2. Création des Comptes
  const accountA = await prisma.account.create({
    data: {
      name: 'Compte Org A',
      type: 'BANK',
      orgId: orgA.id,
      balance: 1000
    }
  })
  const accountB = await prisma.account.create({
    data: {
      name: 'Compte Org B',
      type: 'BANK',
      orgId: orgB.id,
      balance: 2000
    }
  })
  console.log('   - Comptes créés.')

  // 3. Création des Transactions
  const transactionA = await prisma.transaction.create({
    data: {
      amount: 150,
      direction: 'IN',
      method: 'BANK_TRANSFER',
      category: 'SALES',
      accountId: accountA.id,
      orgId: orgA.id,
      occurredAt: new Date()
    }
  })
  const transactionB = await prisma.transaction.create({
    data: {
      amount: 500,
      direction: 'OUT',
      method: 'BANK_TRANSFER',
      category: 'RENT_UTILITIES',
      accountId: accountB.id,
      orgId: orgB.id,
      occurredAt: new Date()
    }
  })
  console.log('   - Transactions créées.')

  // 4. Création des Documents
  const documentA = await prisma.document.create({
    data: {
      type: 'TAX',
      name: 'Fiche Fiscale Org A',
      orgId: orgA.id
    }
  })
  const documentB = await prisma.document.create({
    data: {
      type: 'TAX',
      name: 'Fiche Fiscale Org B',
      orgId: orgB.id
    }
  })
  console.log('   - Documents créés.')

  // 5. Création des Consent Grants (Accords)
  // Accord A : Scopes limités
  const grantAResult = await ConsentGrantService.createConsentGrant(
    orgA.id,
    'Partenaire Audit A',
    'Audit Annuel',
    'profile:read transactions:read',
    new Date(Date.now() + 10 * 60 * 1000) // expire dans 10 min
  )
  
  // Accord A2 : Scope administration global (*)
  const grantA2Result = await ConsentGrantService.createConsentGrant(
    orgA.id,
    'Super Partenaire Admin',
    'Administration complète',
    '*',
    new Date(Date.now() + 10 * 60 * 1000)
  )

  console.log('   - Accords de consentement et tokens JWT créés.\n')

  let passed = true

  // --- TESTS ---

  try {
    // ==========================================
    // TEST 1 : Vérification de la signature du Token (hasValidConsent)
    // ==========================================
    console.log('--- Test 1: Validation du middleware hasValidConsent ---')
    
    // Cas 1.1: Token valide
    let req = {
      headers: { authorization: `Bearer ${grantAResult.token}` }
    } as unknown as ConsentGrantRequest
    let res = createMockResponse()
    let nextCalled = false
    await hasValidConsent(req, res, () => { nextCalled = true })
    
    if (nextCalled && req.consentGrant && req.consentGrant.orgId === orgA.id) {
      console.log('   ✅ Cas 1.1: Token valide accepté et décodé avec succès.')
    } else {
      console.log('   ❌ Cas 1.1: Échec de validation du token valide.')
      passed = false
    }

    // Cas 1.2: Sans token
    req = { headers: {} } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await hasValidConsent(req, res, () => { nextCalled = true })

    if (!nextCalled && res.statusCode === 401) {
      console.log('   ✅ Cas 1.2: Requête sans token rejetée en 401.')
    } else {
      console.log('   ❌ Cas 1.2: Une requête sans token n\'a pas retourné 401.')
      passed = false
    }

    // Cas 1.3: Mauvais format
    req = { headers: { authorization: `Basic ${grantAResult.token}` } } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await hasValidConsent(req, res, () => { nextCalled = true })

    if (!nextCalled && res.statusCode === 401) {
      console.log('   ✅ Cas 1.3: Token au mauvais format (Basic) rejeté en 401.')
    } else {
      console.log('   ❌ Cas 1.3: Mauvais format non rejeté.')
      passed = false
    }

    // ==========================================
    // TEST 2 : Vérification du contrôle des Scopes (requireConsentScope)
    // ==========================================
    console.log('\n--- Test 2: Validation du middleware requireConsentScope ---')

    // Injecter un accord décodé simulé pour Org A (profile:read transactions:read)
    const baseRequest = {
      consentGrant: {
        id: grantAResult.consentGrant.id,
        partnerName: grantAResult.consentGrant.partnerName,
        purpose: grantAResult.consentGrant.purpose,
        scope: grantAResult.consentGrant.scope,
        orgId: grantAResult.consentGrant.orgId,
        expiresAt: grantAResult.consentGrant.expiresAt
      }
    } as unknown as ConsentGrantRequest

    // Cas 2.1: Scope valide unique
    req = { ...baseRequest } as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    requireConsentScope('transactions:read')(req, res, () => { nextCalled = true })

    if (nextCalled) {
      console.log('   ✅ Cas 2.1: Scope valide unique autorisé.')
    } else {
      console.log('   ❌ Cas 2.1: Scope valide unique refusé.')
      passed = false
    }

    // Cas 2.2: Scope invalide / manquant
    req = { ...baseRequest } as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    requireConsentScope('documents:read')(req, res, () => { nextCalled = true })

    if (!nextCalled && res.statusCode === 403) {
      console.log('   ✅ Cas 2.2: Scope manquant (documents:read) rejeté en 403.')
    } else {
      console.log('   ❌ Cas 2.2: Scope manquant non rejeté.')
      passed = false
    }

    // Cas 2.3: Scopes multiples (OR logic)
    req = { ...baseRequest } as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    requireConsentScope(['documents:read', 'transactions:read'])(req, res, () => { nextCalled = true })

    if (nextCalled) {
      console.log('   ✅ Cas 2.3: Scopes multiples (OR) autorisé car au moins un correspond.')
    } else {
      console.log('   ❌ Cas 2.3: Scopes multiples (OR) refusés.')
      passed = false
    }

    // Cas 2.4: Wildcard scope (*)
    const adminRequest = {
      consentGrant: {
        id: grantA2Result.consentGrant.id,
        partnerName: grantA2Result.consentGrant.partnerName,
        purpose: grantA2Result.consentGrant.purpose,
        scope: grantA2Result.consentGrant.scope,
        orgId: grantA2Result.consentGrant.orgId,
        expiresAt: grantA2Result.consentGrant.expiresAt
      }
    } as unknown as ConsentGrantRequest

    req = { ...adminRequest } as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    requireConsentScope('documents:read')(req, res, () => { nextCalled = true })

    if (nextCalled) {
      console.log('   ✅ Cas 2.4: Le scope d\'administration global (*) autorise n\'importe quel scope requis.')
    } else {
      console.log('   ❌ Cas 2.4: Wildcard scope (*) bloqué.')
      passed = false
    }

    // ==========================================
    // TEST 3 : Validation du BOLA renforcé (checkConsentGrantBola)
    // ==========================================
    console.log('\n--- Test 3: Validation du BOLA renforcé (Broken Object Level Authorization) ---')

    // Cas 3.1: Transaction propre à Org A (Autorisé)
    req = {
      ...baseRequest,
      params: { id: transactionA.id }
    } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await checkConsentGrantBola('transaction')(req, res, () => { nextCalled = true })

    if (nextCalled) {
      console.log('   ✅ Cas 3.1: Accès à sa propre transaction autorisé.')
    } else {
      console.log('   ❌ Cas 3.1: Accès à sa propre transaction refusé.')
      passed = false
    }

    // Cas 3.2: Transaction appartenant à Org B (Tentative de BOLA)
    req = {
      ...baseRequest,
      params: { id: transactionB.id }
    } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await checkConsentGrantBola('transaction')(req, res, () => { nextCalled = true })

    if (!nextCalled && res.statusCode === 403) {
      console.log('   ✅ Cas 3.2: Tentative d\'accès à une transaction de l\'Org B détectée et bloquée (403 Forbidden). BOLA renforcé actif !')
    } else {
      console.log('   ❌ Cas 3.2: faille BOLA! La transaction d\'une autre organisation a été accédée.');
      passed = false
    }

    // Cas 3.3: Document propre à Org A (Autorisé)
    req = {
      ...baseRequest,
      params: { id: documentA.id }
    } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await checkConsentGrantBola('document')(req, res, () => { nextCalled = true })

    if (nextCalled) {
      console.log('   ✅ Cas 3.3: Accès à son propre document autorisé.')
    } else {
      console.log('   ❌ Cas 3.3: Accès à son propre document refusé.')
      passed = false
    }

    // Cas 3.4: Document appartenant à Org B (Tentative de BOLA)
    req = {
      ...baseRequest,
      params: { id: documentB.id }
    } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await checkConsentGrantBola('document')(req, res, () => { nextCalled = true })

    if (!nextCalled && res.statusCode === 403) {
      console.log('   ✅ Cas 3.4: Tentative d\'accès à un document de l\'Org B détectée et bloquée (403). BOLA renforcé actif !')
    } else {
      console.log('   ❌ Cas 3.4: faille BOLA! Le document d\'une autre organisation a été accédé.');
      passed = false
    }

    // Cas 3.5: Compte propre à Org A (Autorisé)
    req = {
      ...baseRequest,
      params: { id: accountA.id }
    } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await checkConsentGrantBola('account')(req, res, () => { nextCalled = true })

    if (nextCalled) {
      console.log('   ✅ Cas 3.5: Accès à son propre compte bancaire autorisé.')
    } else {
      console.log('   ❌ Cas 3.5: Accès à son propre compte refusé.')
      passed = false
    }

    // Cas 3.6: Compte appartenant à Org B (Tentative de BOLA)
    req = {
      ...baseRequest,
      params: { id: accountB.id }
    } as unknown as ConsentGrantRequest
    res = createMockResponse()
    nextCalled = false
    await checkConsentGrantBola('account')(req, res, () => { nextCalled = true })

    if (!nextCalled && res.statusCode === 403) {
      console.log('   ✅ Cas 3.6: Tentative d\'accès au compte bancaire de l\'Org B détectée et bloquée (403). BOLA renforcé actif !')
    } else {
      console.log('   ❌ Cas 3.6: faille BOLA! Le compte d\'une autre organisation a été accédé.');
      passed = false
    }

  } catch (error) {
    console.error('❌ Une exception est survenue pendant l\'exécution des tests:', error)
    passed = false
  } finally {
    // --- NETTOYAGE DES DONNÉES ---
    console.log('\n🧹 Nettoyage des données de test de la base de données...')
    
    // Supprimer les accords
    await prisma.consentGrant.deleteMany({
      where: { orgId: { in: [orgA.id, orgB.id] } }
    })

    // Supprimer les transactions
    await prisma.transaction.deleteMany({
      where: { orgId: { in: [orgA.id, orgB.id] } }
    })

    // Supprimer les documents
    await prisma.document.deleteMany({
      where: { orgId: { in: [orgA.id, orgB.id] } }
    })

    // Supprimer les comptes
    await prisma.account.deleteMany({
      where: { orgId: { in: [orgA.id, orgB.id] } }
    })

    // Supprimer les organisations
    await prisma.organization.delete({ where: { id: orgA.id } })
    await prisma.organization.delete({ where: { id: orgB.id } })
    
    console.log('🗑️ Base de données nettoyée avec succès.')
  }

  if (passed) {
    console.log('\n🎉 TOUS LES TESTS DE SÉCURITÉ BOLA & SCOPE ONT RÉUSSI ! 🎉')
  } else {
    console.error('\n❌ CERTAINS TESTS ONT ÉCHOUÉ. VEUILLEZ VÉRIFIER LES ERREURS.')
    process.exit(1)
  }
}

runBolaTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
