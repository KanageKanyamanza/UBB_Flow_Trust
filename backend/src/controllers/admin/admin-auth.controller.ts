import type { Request, Response } from 'express'
import { z } from 'zod'
import { AdminAuthService } from '../../services/admin/admin-auth.service.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string(),
})

export class AdminAuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body)
      const result = await AdminAuthService.login(email, password)
      res.status(200).json(result)
    } catch (error) {
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
      const result = await AdminAuthService.refresh(refreshToken)
      res.status(200).json(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.issues })
      }
      res.status(401).json({ error: 'Invalid refresh token' })
    }
  }

  static async getMe(req: AdminRequest, res: Response) {
    res.status(200).json(req.admin)
  }

  static async logout(req: AdminRequest, res: Response) {
    try {
      await AdminAuthService.logout(req.admin!.id)
      res.status(204).send()
    } catch {
      res.status(500).json({ error: 'Logout failed' })
    }
  }
}
