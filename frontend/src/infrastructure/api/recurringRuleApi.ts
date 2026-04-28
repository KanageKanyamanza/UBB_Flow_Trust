import { apiSlice } from './apiSlice'

export interface RecurringRule {
  id: string
  name: string
  amount: string
  direction: 'IN' | 'OUT'
  frequency: string
  startDate: string
  endDate: string | null
}

export type CreateRecurringRuleInput = Omit<RecurringRule, 'id' | 'amount' | 'endDate'> & { 
  amount: number
  endDate?: string | null 
}

export const recurringRuleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecurringRules: builder.query<RecurringRule[], void>({
      query: () => '/recurring-rules',
      providesTags: ['RecurringRule']
    }),
    createRecurringRule: builder.mutation<RecurringRule, CreateRecurringRuleInput>({
      query: (body) => ({
        url: '/recurring-rules',
        method: 'POST',
        body
      }),
      invalidatesTags: ['RecurringRule']
    }),
    updateRecurringRule: builder.mutation<RecurringRule, Partial<RecurringRule> & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/recurring-rules/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['RecurringRule']
    }),
    deleteRecurringRule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/recurring-rules/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['RecurringRule']
    })
  })
})

export const {
  useGetRecurringRulesQuery,
  useCreateRecurringRuleMutation,
  useUpdateRecurringRuleMutation,
  useDeleteRecurringRuleMutation
} = recurringRuleApi
