import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { type BaseQueryApi, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query'

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    let partnerToken = localStorage.getItem('partnerToken')
    let accessToken = localStorage.getItem('accessToken')
    
    if (partnerToken && partnerToken.startsWith('"') && partnerToken.endsWith('"')) {
      partnerToken = partnerToken.slice(1, -1)
    }
    if (accessToken && accessToken.startsWith('"') && accessToken.endsWith('"')) {
      accessToken = accessToken.slice(1, -1)
    }
    
    if (partnerToken && (!accessToken || window.location.pathname.startsWith('/partner'))) {
      headers.set('authorization', `Bearer ${partnerToken}`)
    } else if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`)
    }
    return headers
  },
})

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb)
}

const onRefreshed = (token: string) => {
  refreshSubscribers.map(cb => cb(token))
  refreshSubscribers = []
}

// Custom base query with automatic refresh token logic
const baseQueryWithReauth = async (
  args: string | FetchArgs,
  api: BaseQueryApi,
  extraOptions: {}
) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true
      
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (refreshToken) {
        const refreshResult = await baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
            body: { refreshToken },
          },
          api,
          extraOptions
        )

        if (refreshResult.data) {
          // Save new tokens
          const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as any
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', newRefreshToken)

          onRefreshed(accessToken)

          // Retry the original query
          result = await baseQuery(args, api, extraOptions)
        } else {
          // Refresh failed, logout
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
      }
      
      isRefreshing = false
    } else {
      // If already refreshing, wait for the new token
      await new Promise(resolve => {
        subscribeTokenRefresh((token: string) => {
          resolve(token)
        })
      })
      // Retry the original query
      result = await baseQuery(args, api, extraOptions)
    }
  }

  return result
}

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Account', 'Transaction', 'Budget', 'RecurringRule', 'Alerts', 'Profile', 'Document', 'Trust', 'ConsentGrant', 'Team', 'PublicProfileStatus'] as const,
  endpoints: () => ({}),
})
