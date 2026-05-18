import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'
const CONSENT_JWT_SECRET = process.env.CONSENT_JWT_SECRET || JWT_SECRET || 'consent-secret'

export interface ConsentGrantPayload {
  consentGrantId: string
  orgId: string
  partnerName: string
  purpose: string
  scope: string
  exp: number
}

export class ConsentGrantService {
  /**
   * Crée un nouvel accord de consentement et génère son JWT temporaire.
   */
  static async createConsentGrant(
    orgId: string,
    partnerName: string,
    purpose: string,
    scope: string,
    expiresAt: Date
  ) {
    if (expiresAt.getTime() <= Date.now()) {
      throw new Error("La date d'expiration doit être dans le futur")
    }

    const consentGrant = await prisma.consentGrant.create({
      data: {
        orgId,
        partnerName,
        purpose,
        scope,
        expiresAt,
      },
    })

    const token = this.generateToken(consentGrant)

    return {
      consentGrant,
      token,
    }
  }

  /**
   * Génère un JWT temporaire signé pour un ConsentGrant.
   */
  static generateToken(consentGrant: {
    id: string
    orgId: string
    partnerName: string
    purpose: string
    scope: string
    expiresAt: Date
  }): string {
    const exp = Math.floor(new Date(consentGrant.expiresAt).getTime() / 1000)

    const payload: ConsentGrantPayload = {
      consentGrantId: consentGrant.id,
      orgId: consentGrant.orgId,
      partnerName: consentGrant.partnerName,
      purpose: consentGrant.purpose,
      scope: consentGrant.scope,
      exp,
    }

    return jwt.sign(payload, CONSENT_JWT_SECRET)
  }

  /**
   * Vérifie un JWT temporaire de consentement et retourne le ConsentGrant associé.
   */
  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, CONSENT_JWT_SECRET) as ConsentGrantPayload

      const consentGrant = await prisma.consentGrant.findUnique({
        where: { id: decoded.consentGrantId },
      })

      if (!consentGrant) {
        throw new Error('Accord de consentement introuvable ou révoqué')
      }

      if (new Date(consentGrant.expiresAt).getTime() < Date.now()) {
        throw new Error("L'accord de consentement a expiré")
      }

      return consentGrant
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Le token JWT a expiré')
      }
      throw new Error(error.message || 'Token invalide')
    }
  }

  /**
   * Liste les consentements accordés par une organisation.
   */
  static async listConsentGrants(orgId: string) {
    return await prisma.consentGrant.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Révoque (supprime) un accord de consentement.
   */
  static async revokeConsentGrant(id: string, orgId: string) {
    // Vérifier d'abord s'il appartient à l'organisation
    const consent = await prisma.consentGrant.findFirst({
      where: { id, orgId },
    })

    if (!consent) {
      throw new Error('Accord de consentement introuvable ou non autorisé')
    }

    await prisma.consentGrant.delete({
      where: { id },
    })

    return true
  }
}
