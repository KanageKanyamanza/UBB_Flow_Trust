import type { Response } from 'express'
import { z } from 'zod'
import { ProfileService } from '../services/profile.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

const beneficialOwnerSchema = z.object({
  name: z.string().min(2),
  role: z.string().nullable().optional(),
  ownershipPct: z.number().min(0).max(100).nullable().optional(),
  idType: z.string().nullable().optional(),
  idNumber: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  email: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
})

const updateProfileSchema = z.object({
  legalName: z.string().min(2).optional(),
  registrationNo: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  governanceType: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  website: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  email: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  phone: z.string().nullable().optional(),
  foundedDate: z.string().nullable().optional(),
  employeeCount: z.number().int().min(0).nullable().optional(),
  annualTurnover: z.number().min(0).nullable().optional(),
  currency: z.string().optional(),
  beneficialOwners: z.array(beneficialOwnerSchema).optional(),
})

export class ProfileController {
  static async get(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const profile = await ProfileService.getProfile(req.user.orgId)
      res.json(profile)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(500).json({ error: message })
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
      
      const validatedData = updateProfileSchema.parse(req.body)
      const profile = await ProfileService.updateProfile(req.user.orgId, validatedData)
      
      res.json(profile)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: message })
    }
  }
}
