import { apiSlice } from './apiSlice'

export interface BeneficialOwner {
  id: string
  name: string
  role: string
  ownershipPct: number
}

export interface PartnerProfile {
  id: string
  orgId: string
  legalName: string
  registrationNo: string
  address: string
  description?: string
  beneficialOwners: BeneficialOwner[]
}

export interface PartnerAccount {
  id: string
  name: string
  type: string
  balance: number
  currency: string
}

export interface PartnerTransaction {
  id: string
  amount: number
  type: string
  category: string
  description: string
  occurredAt: string
}

export interface PartnerTrustScore {
  id: string
  score: number
  grade: string
  updatedAt: string
}

export interface PartnerDocument {
  id: string
  name: string
  type: string
  versions: { fileUrl: string; fileSize: number; fileName: string; createdAt: string }[]
  updatedAt: string
}

export const partnerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPartnerProfile: builder.query<PartnerProfile, void>({
      query: () => '/partner/profile',
    }),
    getPartnerAccounts: builder.query<PartnerAccount[], void>({
      query: () => '/partner/accounts',
    }),
    getPartnerTransactions: builder.query<PartnerTransaction[], void>({
      query: () => '/partner/transactions',
    }),
    getPartnerTrustScore: builder.query<PartnerTrustScore, void>({
      query: () => '/partner/trust-score',
    }),
    getPartnerDocuments: builder.query<PartnerDocument[], void>({
      query: () => '/partner/documents',
    }),
  }),
})

export const {
  useGetPartnerProfileQuery,
  useGetPartnerAccountsQuery,
  useGetPartnerTransactionsQuery,
  useGetPartnerTrustScoreQuery,
  useGetPartnerDocumentsQuery,
} = partnerApi
