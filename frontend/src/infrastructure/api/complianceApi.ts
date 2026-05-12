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
  }),
})

export const { useGetComplianceQuery, useStartComplianceMutation } = complianceApi
