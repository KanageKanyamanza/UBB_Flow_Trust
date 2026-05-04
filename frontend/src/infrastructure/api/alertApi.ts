import { apiSlice } from './apiSlice'

export interface Alert {
  id: string
  type: string
  severity: 'INFO' | 'WARN' | 'CRITICAL'
  message: string
  isAck: boolean
  createdAt: string
}

export const alertApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query<Alert[], void>({
      query: () => '/alerts',
      providesTags: ['Alerts'],
    }),
    acknowledgeAlert: builder.mutation<void, string>({
      query: (id) => ({
        url: `/alerts/${id}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: ['Alerts'],
    }),
  }),
})

export const { 
  useGetAlertsQuery, 
  useAcknowledgeAlertMutation 
} = alertApi
