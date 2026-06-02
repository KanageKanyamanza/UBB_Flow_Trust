import { apiSlice } from './apiSlice.js'

export const complianceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCompliance: builder.query<any, void>({
      query: () => '/compliance',
      providesTags: ['Document'], // Refresh when documents change
    }),
    startCompliance: builder.mutation<any, { market: string }>({
      query: (body) => ({
        url: '/compliance/start',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Document'],
    }),
    getGap: builder.query<{ missing: string[] }, { market: string }>({
      query: ({ market }) => `/compliance/gap?market=${market}`,
      providesTags: ['Document'],
    }),
  }),
})

export const { useGetComplianceQuery, useStartComplianceMutation, useGetGapQuery } = complianceApi
