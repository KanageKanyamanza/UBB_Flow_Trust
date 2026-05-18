import { apiSlice } from './apiSlice'

export interface ConsentGrant {
  id: string
  orgId: string
  partnerName: string
  purpose: string
  scope: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateConsentGrantRequest {
  partnerName: string
  purpose: string
  scope: string
  expiresAt: string
}

export interface CreateConsentGrantResponse {
  consentGrant: ConsentGrant
  token: string
}

export const consentGrantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConsentGrants: builder.query<ConsentGrant[], void>({
      query: () => '/consent-grants',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'ConsentGrant' as const, id })),
              { type: 'ConsentGrant' as const, id: 'LIST' },
            ]
          : [{ type: 'ConsentGrant' as const, id: 'LIST' }],
    }),
    createConsentGrant: builder.mutation<CreateConsentGrantResponse, CreateConsentGrantRequest>({
      query: (grant) => ({
        url: '/consent-grants',
        method: 'POST',
        body: grant,
      }),
      invalidatesTags: [{ type: 'ConsentGrant' as const, id: 'LIST' }],
    }),
    revokeConsentGrant: builder.mutation<void, string>({
      query: (id) => ({
        url: `/consent-grants/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ConsentGrant' as const, id: 'LIST' },
        { type: 'ConsentGrant' as const, id },
      ],
    }),
  }),
})

export const {
  useGetConsentGrantsQuery,
  useCreateConsentGrantMutation,
  useRevokeConsentGrantMutation,
} = consentGrantApi
