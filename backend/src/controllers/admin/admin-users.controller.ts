import type { Response } from 'express'
import { z } from 'zod'
import argon2 from 'argon2'
import type { Prisma, Role } from '@prisma/client'
import prisma from '../../config/prisma.js'
import type { AdminRequest } from '../../middleware/admin.middleware.js'

const PAGE_SIZE = 20

const updateSchema = z.object({
  role: z.string().optional(),
  isBlocked: z.boolean().optional(),
})

export class AdminUsersController {
  static async list(req: AdminRequest, res: Response) {
    const page = Math.max(1, Number(req.query.page) || 1)
    const search = req.query.search ? String(req.query.search) : undefined
    const role = req.query.role ? String(req.query.role) : undefined
    const orgId = req.query.orgId ? String(req.query.orgId) : undefined

    const where: Prisma.UserWhereInput = {}
    if (orgId) where.orgId = orgId
    if (role) where.role = role as Role
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          organization: { select: { id: true, name: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    const data = rows.map(({ organization, ...u }) => ({ ...u, org: organization }))
    res.json({ data, total, page, pageSize: PAGE_SIZE })
  }

  static async getOne(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const row = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        organization: { select: { id: true, name: true } },
        auditLogs: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!row) return res.status(404).json({ error: 'User not found' })
    const { organization, ...rest } = row
    res.json({ ...rest, org: organization })
  }

  static async update(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    try {
      const parsed = updateSchema.parse(req.body)
      const oldUser = await prisma.user.findUnique({ where: { id }, select: { role: true, isBlocked: true } })
      if (!oldUser) return res.status(404).json({ error: 'User not found' })

      const updateData: Prisma.UserUpdateInput = {}
      if (parsed.role !== undefined) updateData.role = parsed.role as Role
      if (parsed.isBlocked !== undefined) updateData.isBlocked = parsed.isBlocked

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: { id: true, email: true, role: true, isBlocked: true },
      })

      await prisma.auditLog.create({
        data: {
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: id,
          oldData: oldUser as Prisma.InputJsonValue,
          newData: parsed as Prisma.InputJsonValue,
          adminId: req.admin!.id,
        },
      })

      res.json(updated)
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid body', details: error.issues })
      res.status(404).json({ error: 'User not found' })
    }
  }

  static async resetPassword(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const random = Math.random().toString(36).slice(-8)
    const tempPassword = `${random}A1!`
    const hashed = await argon2.hash(tempPassword)

    await prisma.user.update({ where: { id }, data: { password: hashed } })
    await prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_RESET',
        entityType: 'User',
        entityId: id,
        adminId: req.admin!.id,
      },
    })

    res.json({ tempPassword })
  }

  static async delete(req: AdminRequest, res: Response) {
    const id = String(req.params.id)
    try {
      await prisma.user.delete({ where: { id } })
      await prisma.auditLog.create({
        data: {
          action: 'USER_DELETED',
          entityType: 'User',
          entityId: id,
          adminId: req.admin!.id,
        },
      })
      res.status(204).send()
    } catch {
      res.status(404).json({ error: 'User not found' })
    }
  }
}
