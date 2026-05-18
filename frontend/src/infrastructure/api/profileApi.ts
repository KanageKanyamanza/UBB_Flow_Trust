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
  }),
})

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi
