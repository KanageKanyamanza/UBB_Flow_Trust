import prisma from '../config/prisma.js'

export class AnalyticsService {
  /**
   * Get transaction sums by category within a date range
   */
  static async getSummaryByCategory(orgId: string, startDate?: Date, endDate?: Date) {
    const summary = await prisma.transaction.groupBy({
      by: ['category', 'direction'],
      where: {
        orgId,
        ...(startDate || endDate ? {
          occurredAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          }
        } : {})
      },
      _sum: {
        amount: true
      }
    })

    // Transform into a more usable format: { category: string, totalIn: number, totalOut: number }
    const formatted: Record<string, { category: string, totalIn: number, totalOut: number }> = {}

    summary.forEach(item => {
      if (!formatted[item.category]) {
        formatted[item.category] = { category: item.category, totalIn: 0, totalOut: 0 }
      }
      
      const catData = formatted[item.category]! // Non-null because we just initialized it
      const amount = Number(item._sum.amount || 0)
      
      if (item.direction === 'IN') {
        catData.totalIn += amount
      } else {
        catData.totalOut += amount
      }
    })

    return Object.values(formatted)
  }

  /**
   * Get daily net balances within a date range
   */
  static async getDailyBalances(orgId: string, startDate: Date, endDate: Date) {
    // We use a raw query for better date grouping in PostgreSQL
    // If using SQLite or another DB, this might need adjustment.
    // For now, assuming PostgreSQL as per schema.prisma datasource provider
    
    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('day', "occurredAt") as date,
        SUM(CASE WHEN direction = 'IN' THEN amount ELSE 0 END) as "totalIn",
        SUM(CASE WHEN direction = 'OUT' THEN amount ELSE 0 END) as "totalOut"
      FROM "Transaction"
      WHERE "orgId" = ${orgId}
        AND "occurredAt" >= ${startDate}
        AND "occurredAt" <= ${endDate}
      GROUP BY DATE_TRUNC('day', "occurredAt")
      ORDER BY date ASC
    `

    // Fill the gaps for every day in the range
    const filledData = []
    const currentDate = new Date(startDate)
    
    // Create a map for quick lookup
    const resultMap = new Map()
    results.forEach(row => {
      const dateStr = new Date(row.date).toISOString().split('T')[0]
      resultMap.set(dateStr, row)
    })

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const row = resultMap.get(dateStr)

      filledData.push({
        date: currentDate.toISOString(),
        totalIn: row ? Number(row.totalIn) : 0,
        totalOut: row ? Number(row.totalOut) : 0,
        net: row ? Number(row.totalIn) - Number(row.totalOut) : 0
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return filledData
  }

  /**
   * Get advanced KPIs (Total Balance, Cash Burn, Runway, Current Month Inflow)
   */
  static async getKpis(orgId: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

    // 1. Total Balance across all accounts
    const accounts = await prisma.account.aggregate({
      where: { orgId },
      _sum: { balance: true }
    })
    const totalBalance = Number(accounts._sum.balance || 0)

    // 2. Current Month Inflow
    const monthInflow = await prisma.transaction.aggregate({
      where: {
        orgId,
        direction: 'IN',
        occurredAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    })
    const currentMonthIn = Number(monthInflow._sum.amount || 0)

    // 3. Current Month Outflow
    const monthOutflow = await prisma.transaction.aggregate({
      where: {
        orgId,
        direction: 'OUT',
        occurredAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    })
    const currentMonthOut = Number(monthOutflow._sum.amount || 0)

    // 4. Monthly Burn Rate (Average of expenses over last 3 months)
    const burnRows = await prisma.transaction.groupBy({
      by: ['direction'],
      where: {
        orgId,
        direction: 'OUT',
        occurredAt: { gte: threeMonthsAgo }
      },
      _sum: { amount: true }
    })
    
    const totalOutThreeMonths = Number(burnRows.find(b => b.direction === 'OUT')?._sum.amount || 0)
    const monthlyBurnRate = totalOutThreeMonths / 3 || currentMonthOut || 0

    // 5. Runway (Months)
    const runwayMonths = monthlyBurnRate > 0 ? totalBalance / monthlyBurnRate : Infinity

    return {
      totalBalance,
      currentMonthIn,
      currentMonthOut,
      monthlyBurnRate,
      runwayMonths: runwayMonths === Infinity ? 99 : Math.round(runwayMonths * 10) / 10,
    }
  }

  /**
   * Get cash flow forecast for the next 30 days
   */
  static async getForecast(orgId: string) {
    const now = new Date()
    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30))
    const ninetyDaysAgo = new Date(new Date().setDate(now.getDate() - 90))
    
    // 1. Current Total Balance
    const accounts = await prisma.account.aggregate({
      where: { orgId },
      _sum: { balance: true }
    })
    const currentBalance = Number(accounts._sum.balance || 0)

    // 2. Average daily inflow/outflow over last 90 days
    const historicalStats = await prisma.transaction.groupBy({
      by: ['direction'],
      where: {
        orgId,
        occurredAt: { gte: ninetyDaysAgo, lte: now }
      },
      _sum: { amount: true }
    })

    const totalIn = Number(historicalStats.find(s => s.direction === 'IN')?._sum.amount || 0)
    const totalOut = Number(historicalStats.find(s => s.direction === 'OUT')?._sum.amount || 0)
    
    const avgDailyIn = totalIn / 90
    const avgDailyOut = totalOut / 90
    const projectedDailyNet = avgDailyIn - avgDailyOut

    // 3. Last 7 days of actual balances (relative to current balance)
    // To simplify, we'll just show the last 7 days of net change leading up to current balance
    const last7DaysNet = await this.getDailyBalances(orgId, new Date(new Date().setDate(now.getDate() - 7)), now)
    
    const forecast = []
    
    // Historical part (actuals)
    let runningBalance = currentBalance
    // Calculate historical balance by working backwards from current
    const historicalPoints = []
    for (let i = last7DaysNet.length - 1; i >= 0; i--) {
      const day = last7DaysNet[i]
      if (!day) continue

      historicalPoints.unshift({
        date: day.date,
        balance: runningBalance,
        isForecast: false
      })
      runningBalance -= day.net
    }
    forecast.push(...historicalPoints)

    // Forecast part (projected)
    runningBalance = currentBalance
    for (let i = 1; i <= 30; i++) {
      const forecastDate = new Date(now)
      forecastDate.setDate(now.getDate() + i)
      
      runningBalance += projectedDailyNet
      
      forecast.push({
        date: forecastDate.toISOString(),
        balance: Math.max(0, runningBalance), // Cash can't be negative in theory for this chart
        isForecast: true
      })
    }

    return forecast
  }
}
