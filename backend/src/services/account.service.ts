import prisma from '../config/prisma.js'

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
    return await prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency || 'XAF',
        balance: data.balance || 0,
        orgId: data.orgId,
      },
    })
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

    return await prisma.account.update({
      where: { id },
      data,
    })
  }

  static async delete(id: string, orgId: string) {
    // Verify ownership first
    await this.getById(id, orgId)

    return await prisma.account.delete({
      where: { id },
    })
  }
}
