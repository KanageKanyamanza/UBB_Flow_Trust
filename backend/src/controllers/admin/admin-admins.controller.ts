import type { Response } from 'express'
import { z } from 'zod'
import prisma from '../../config/prisma.js'
import { AdminAuthService } from '../../services/admin/admin-auth.service.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
  isSuperAdmin: z.boolean().optional(),
})

export class AdminAdminsController {
  static async list(_req: AdminRequest, res: Response) {
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, isSuperAdmin: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json(admins)
  }

  static async create(req: AdminRequest, res: Response) {
    try {
      const data = createSchema.parse(req.body)
      const admin = await AdminAuthService.createAdmin(data)
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_CREATED',
          entityType: 'Admin',
          entityId: admin.id,
          adminId: req.admin!.id,
        },
      })
      res.status(201).json(admin)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.issues })
      const msg = error instanceof Error ? error.message : 'Unknown error'
      res.status(400).json({ error: msg })
    }
  }

  static async delete(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    if (id === req.admin!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }
    try {
      await prisma.admin.delete({ where: { id } })
      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_DELETED',
          entityType: 'Admin',
          entityId: id,
          adminId: req.admin!.id,
        },
      })
      res.status(204).send()
    } catch {
      res.status(404).json({ error: 'Admin not found' })
    }
  }

  static async update(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const schema = z.object({
      email: z.string().email().optional(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      isSuperAdmin: z.boolean().optional(),
    })
    try {
      const data = schema.parse(req.body)
      const existing = await prisma.admin.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Admin not found' })

      const updated = await prisma.admin.update({
        where: { id },
        data,
        select: { id: true, email: true, firstName: true, lastName: true, isSuperAdmin: true, createdAt: true }
      })

      await prisma.auditLog.create({
        data: {
          action: 'ADMIN_UPDATED',
          entityType: 'Admin',
          entityId: id,
          adminId: req.admin!.id,
          newData: data as any,
        },
      })
      res.json(updated)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.issues })
      res.status(500).json({ error: (error as any).message })
    }
  }
}
