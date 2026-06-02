import { apiSlice } from './apiSlice.js'

export const trustApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTrustScore: builder.query<any, void>({
      query: () => '/trust/score',
      providesTags: ['Trust' as any],
    }),

    /**
     * refreshTrustScore — POST /trust/score/refresh
     *
     * Le backend enfile un recalcul asynchrone et répond immédiatement 202 Accepted.
     * On invalide le tag 'Trust' après un délai de 3 secondes pour laisser le
     * job en arrière-plan terminer avant de re-fetcher le score mis à jour.
     */
    refreshTrustScore: builder.mutation<any, void>({
      query: () => ({
        url: '/trust/score/refresh',
        method: 'POST',
      }),
      // Pas d'invalidation immédiate — le job s'exécute en arrière-plan.
      // Le score frais sera affiché lors du prochain polling ou re-fetch.
      invalidatesTags: [],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled
          // Attendre 3s pour que le job asynchrone se termine, puis invalider le cache
          setTimeout(() => {
            dispatch(apiSlice.util.invalidateTags(['Trust' as any]))
          }, 3000)
        } catch {
          // Ignore errors
        }
      }
    }),
  }),
})

export const { useGetTrustScoreQuery, useRefreshTrustScoreMutation } = trustApi
