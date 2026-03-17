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
}
