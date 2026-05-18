import { apiSlice } from './apiSlice'

export interface CategorySummary {
  category: string
  totalIn: number
  totalOut: number
}

export interface DailyBalance {
  date: string
  totalIn: number
  totalOut: number
  net: number
}

export interface ForecastPoint {
  date: string
  balance: number
  isForecast: boolean
}

export interface DashboardStats {
  totalBalance: number
  currentMonthIn: number
  currentMonthOut: number
  monthlyBurnRate: number
  runwayMonths: number
}

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategorySummary: builder.query<CategorySummary[], { startDate?: string, endDate?: string } | void>({
      query: (params) => ({
        url: '/analytics/summary',
        params: params || {}
      }),
      providesTags: [{ type: 'Transaction', id: 'LIST' }, { type: 'Account', id: 'LIST' }]
    }),
    getDailyBalances: builder.query<DailyBalance[], { startDate?: string, endDate?: string } | void>({
      query: (params) => ({
        url: '/analytics/daily-balance',
        params: params || {}
      }),
      providesTags: [{ type: 'Transaction', id: 'LIST' }, { type: 'Account', id: 'LIST' }]
    }),
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => '/analytics/stats',
      providesTags: [{ type: 'Transaction', id: 'LIST' }, { type: 'Account', id: 'LIST' }]
    }),
    getCashFlowForecast: builder.query<ForecastPoint[], void>({
      query: () => '/analytics/forecast',
      providesTags: [{ type: 'Transaction', id: 'LIST' }, { type: 'Account', id: 'LIST' }]
    })
  })
})

export const {
  useGetCategorySummaryQuery,
  useGetDailyBalancesQuery,
  useGetDashboardStatsQuery,
  useGetCashFlowForecastQuery
} = analyticsApi
