import type { Request, Response } from 'express'
import { AuthService, type RegisterInput } from '../services/auth.service.js'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().min(2),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body)
      const result = await AuthService.register(validatedData as RegisterInput)
      
      res.status(201).json(result)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: message })
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body)
      const result = await AuthService.login(email, password)
      
      res.status(200).json(result)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(401).json({ error: message })
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body)
      const result = await AuthService.refresh(refreshToken)
      
      res.status(200).json(result)
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(401).json({ error: message })
    }
  }

  static async getMe(req: any, res: Response) {
    try {
      res.status(200).json(req.user)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      res.status(401).json({ error: message })
    }
  }

  static async listTeam(req: any, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        return res.status(403).json({ error: 'Forbidden: Owner permissions required' })
      }
      const members = await AuthService.listTeamMembers(req.user.orgId)
      res.status(200).json(members)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  static async createMember(req: any, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        return res.status(403).json({ error: 'Forbidden: Owner permissions required' })
      }
      const validated = z.object({
        email: z.string().email(),
        password: z.string().min(6).optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.string(),
        accountId: z.string().nullable().optional(),
      }).parse(req.body)

      const member = await AuthService.createTeamMember(req.user.orgId, validated)
      res.status(201).json(member)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      res.status(400).json({ error: error.message })
    }
  }

  static async updateMember(req: any, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        return res.status(403).json({ error: 'Forbidden: Owner permissions required' })
      }
      const id = req.params.id as string
      const validated = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.string().optional(),
        accountId: z.string().nullable().optional(),
      }).parse(req.body)

      const member = await AuthService.updateTeamMember(id, req.user.orgId, validated)
      res.status(200).json(member)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      res.status(400).json({ error: error.message })
    }
  }

  static async deleteMember(req: any, res: Response) {
    try {
      if (!req.user || req.user.role !== 'OWNER') {
        return res.status(403).json({ error: 'Forbidden: Owner permissions required' })
      }
      const id = req.params.id as string
      await AuthService.deleteTeamMember(id, req.user.orgId)
      res.status(204).send()
    } catch (error: any) {
      res.status(400).json({ error: error.message })
    }
  }
}
