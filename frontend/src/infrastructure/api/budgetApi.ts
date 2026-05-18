import { apiSlice } from './apiSlice'

export interface Budget {
  id: string
  category: string
  amount: number
  period: string
}

export interface BudgetComparison {
  category: string
  actual: number
  budget: number
  diff: number
  status: 'over' | 'under' | 'none'
}

export const budgetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBudgets: builder.query<Budget[], void>({
      query: () => '/budgets',
      providesTags: [{ type: 'Budget', id: 'LIST' }]
    }),
    setBudget: builder.mutation<Budget, { category: string, amount: number }>({
      query: (body) => ({
        url: '/budgets',
        method: 'POST',
        body
      }),
      invalidatesTags: [{ type: 'Budget', id: 'LIST' }]
    }),
    getBudgetComparison: builder.query<BudgetComparison[], { month?: number, year?: number } | void>({
      query: (params) => ({
        url: '/budgets/comparison',
        params: params || {}
      }),
      providesTags: [{ type: 'Budget', id: 'LIST' }, { type: 'Transaction', id: 'LIST' }]
    })
  })
})

export const {
  useGetBudgetsQuery,
  useSetBudgetMutation,
  useGetBudgetComparisonQuery
} = budgetApi
