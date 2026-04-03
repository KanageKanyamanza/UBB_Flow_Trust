import { apiSlice } from './apiSlice'

export interface Account {
  id: string
  name: string
  type: 'BANK' | 'MOBILE_MONEY' | 'CASH' | 'OTHER'
  currency: string
  balance: number
  orgId: string
  createdAt: string
  updatedAt: string
}

export interface CreateAccountRequest {
  name: string
  type: 'BANK' | 'MOBILE_MONEY' | 'CASH' | 'OTHER'
  currency?: string
  balance?: number
}

export const accountApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAccounts: builder.query<Account[], void>({
      query: () => '/accounts',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Account' as const, id })),
              { type: 'Account' as const, id: 'LIST' },
            ]
          : [{ type: 'Account' as const, id: 'LIST' }],
    }),
    getAccount: builder.query<Account, string>({
      query: (id) => `/accounts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Account' as const, id }],
    }),
    createAccount: builder.mutation<Account, CreateAccountRequest>({
      query: (account) => ({
        url: '/accounts',
        method: 'POST',
        body: account,
      }),
      invalidatesTags: [{ type: 'Account' as const, id: 'LIST' }],
    }),
    updateAccount: builder.mutation<Account, { id: string; body: Partial<CreateAccountRequest> }>({
      query: ({ id, body }) => ({
        url: `/accounts/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Account' as const, id },
        { type: 'Account' as const, id: 'LIST' },
      ],
    }),
    deleteAccount: builder.mutation<void, string>({
      query: (id) => ({
        url: `/accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Account' as const, id: 'LIST' },
        { type: 'Account' as const, id },
      ],
    }),
  }),
})

export const {
  useGetAccountsQuery,
  useGetAccountQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} = accountApi
