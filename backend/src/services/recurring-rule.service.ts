import prisma from '../config/prisma.js'
import { TxnDirection } from '@prisma/client'
import { RedisService } from './redis.service.js'

export interface CreateRecurringRuleInput {
  name: string
  amount: number
  direction: TxnDirection
  frequency: string
  startDate: Date
  endDate?: Date
  orgId: string
}

export interface UpdateRecurringRuleInput {
  name?: string
  amount?: number
  direction?: TxnDirection
  frequency?: string
  startDate?: Date
  endDate?: Date | null
}

export class RecurringRuleService {
  static async listByOrg(orgId: string) {
    return await prisma.recurringRule.findMany({
      where: { orgId },
      orderBy: { startDate: 'desc' }
    })
  }

  static async getById(id: string, orgId: string) {
    const rule = await prisma.recurringRule.findFirst({
      where: { id, orgId }
    })
    if (!rule) throw new Error('RecurringRule not found')
    return rule
  }

  static async create(data: CreateRecurringRuleInput) {
    const created = await prisma.recurringRule.create({
      data: {
        name: data.name,
        amount: data.amount,
        direction: data.direction,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate,
        orgId: data.orgId
      }
    })
    await RedisService.invalidatePattern(`proj:${data.orgId}:`)
    return created
  }

  static async update(id: string, orgId: string, data: UpdateRecurringRuleInput) {
    // ensure it exists
    await this.getById(id, orgId)

    const updated = await prisma.recurringRule.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount,
        direction: data.direction,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate
      }
    })
    await RedisService.invalidatePattern(`proj:${orgId}:`)
    return updated
  }

  static async delete(id: string, orgId: string) {
    // ensure it exists
    await this.getById(id, orgId)

    const deleted = await prisma.recurringRule.delete({
      where: { id }
    })
    await RedisService.invalidatePattern(`proj:${orgId}:`)
    return deleted
  }
}
