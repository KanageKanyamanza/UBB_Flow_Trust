import { apiSlice } from './apiSlice'
import {
  type Transaction,
  type CreateTransactionRequest,
  type TxnCategory,
  type TxnDirection,
} from '@/domain/entities/transaction.entity'

export interface ListTransactionsFilters {
  accountId?: string
  category?: TxnCategory
  direction?: TxnDirection
  startDate?: string
  endDate?: string
}

export const transactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listTransactions: builder.query<Transaction[], ListTransactionsFilters | void>({
      query: (filters) => ({
        url: '/transactions',
        method: 'GET',
        params: filters || undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Transaction' as const, id })),
              { type: 'Transaction', id: 'LIST' },
            ]
          : [{ type: 'Transaction', id: 'LIST' }],
    }),

    getTransaction: builder.query<Transaction, string>({
      query: (id) => `/transactions/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Transaction', id }],
    }),

    createTransaction: builder.mutation<Transaction, CreateTransactionRequest>({
      query: (body) => ({
        url: '/transactions',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Transaction', id: 'LIST' },
        { type: 'Account', id: 'LIST' }, // Transactions affect account balance
      ],
    }),

    deleteTransaction: builder.mutation<void, string>({
      query: (id) => ({
        url: `/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Transaction', id },
        { type: 'Transaction', id: 'LIST' },
        { type: 'Account', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useListTransactionsQuery,
  useGetTransactionQuery,
  useCreateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionApi
