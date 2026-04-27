import prisma from '../config/prisma.js'
import { TxnDirection } from '@prisma/client'

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
    return await prisma.recurringRule.create({
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
  }

  static async update(id: string, orgId: string, data: UpdateRecurringRuleInput) {
    // ensure it exists
    await this.getById(id, orgId)

    return await prisma.recurringRule.update({
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
  }

  static async delete(id: string, orgId: string) {
    // ensure it exists
    await this.getById(id, orgId)

    return await prisma.recurringRule.delete({
      where: { id }
    })
  }
}
