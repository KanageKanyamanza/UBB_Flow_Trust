import prisma from '../config/prisma.js'
import { RedisService } from './redis.service.js'

export interface CreateAccountInput {
  name: string
  type: string
  currency?: string
  balance?: number
  orgId: string
}

export interface UpdateAccountInput {
  name?: string
  type?: string
  currency?: string
  balance?: number
}

export class AccountService {
  static async create(data: CreateAccountInput) {
    const created = await prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency || 'XAF',
        balance: data.balance || 0,
        orgId: data.orgId,
      },
    })
    await RedisService.invalidatePattern(`kpis:${data.orgId}:`)
    await RedisService.invalidatePattern(`proj:${data.orgId}:`)
    return created
  }

  static async listByOrg(orgId: string) {
    return await prisma.account.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getById(id: string, orgId: string) {
    const account = await prisma.account.findFirst({
      where: { id, orgId },
    })
    
    if (!account) {
      throw new Error('Account not found')
    }
    
    return account
  }

  static async update(id: string, orgId: string, data: UpdateAccountInput) {
    // Verify ownership first
    await this.getById(id, orgId)

    const updated = await prisma.account.update({
      where: { id },
      data,
    })
    await RedisService.invalidatePattern(`kpis:${orgId}:`)
    await RedisService.invalidatePattern(`proj:${orgId}:`)
    return updated
  }

  static async delete(id: string, orgId: string) {
    await this.getById(id, orgId)

    const txnCount = await prisma.transaction.count({ where: { accountId: id } })
    if (txnCount > 0) {
      throw new Error(
        `Ce compte contient ${txnCount} transaction(s). Supprimez d'abord les transactions avant de supprimer le compte.`
      )
    }

    // Nullify nullable FK references before deletion
    await prisma.user.updateMany({ where: { accountId: id }, data: { accountId: null } })
    await prisma.budget.updateMany({ where: { accountId: id }, data: { accountId: null } })

    await prisma.account.delete({ where: { id } })

    await RedisService.invalidatePattern(`kpis:${orgId}:`)
    await RedisService.invalidatePattern(`proj:${orgId}:`)
  }
}
