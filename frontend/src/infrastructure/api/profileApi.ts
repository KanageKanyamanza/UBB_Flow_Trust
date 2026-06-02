import { apiSlice } from './apiSlice.js'

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<any, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<any, any>({
      query: (data) => ({
        url: '/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Profile', 'Trust'],
    }),
    getPublicProfileStatus: builder.query<any, void>({
      query: () => '/public/me/status',
      providesTags: ['PublicProfileStatus' as any],
    }),
    setupPublicProfile: builder.mutation<any, { slug: string; isActive: boolean }>({
      query: (data) => ({
        url: '/public/setup',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PublicProfileStatus' as any],
    }),
    getPublicProfile: builder.query<any, string>({
      query: (slug) => `/public/${slug}`,
    }),
  }),
})

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPublicProfileStatusQuery,
  useSetupPublicProfileMutation,
  useGetPublicProfileQuery,
} = profileApi
