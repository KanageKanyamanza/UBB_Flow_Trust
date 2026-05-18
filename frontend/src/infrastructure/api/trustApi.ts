import { apiSlice } from './apiSlice.js'

export const trustApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrustScore: builder.query<any, void>({
      query: () => '/trust/score',
      providesTags: ['Trust' as any],
    }),
    refreshTrustScore: builder.mutation<any, void>({
      query: () => ({
        url: '/trust/score/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Trust' as any],
    }),
  }),
})

export const { useGetTrustScoreQuery, useRefreshTrustScoreMutation } = trustApi
