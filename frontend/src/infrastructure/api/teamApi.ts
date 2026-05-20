import { apiSlice } from './apiSlice'

export interface TeamMember {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role: string
  accountId?: string | null
  createdAt: string
}

export interface CreateMemberInput {
  email: string
  password?: string
  firstName?: string
  lastName?: string
  role: string
  accountId?: string | null
}

export interface UpdateMemberInput {
  firstName?: string
  lastName?: string
  role?: string
  accountId?: string | null
}

export const teamApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTeamMembers: builder.query<TeamMember[], void>({
      query: () => '/auth/users',
      providesTags: ['Team'],
    }),
    createTeamMember: builder.mutation<TeamMember, CreateMemberInput>({
      query: (body) => ({
        url: '/auth/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Team'],
    }),
    updateTeamMember: builder.mutation<TeamMember, { id: string; body: UpdateMemberInput }>({
      query: ({ id, body }) => ({
        url: `/auth/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Team'],
    }),
    deleteTeamMember: builder.mutation<void, string>({
      query: (id) => ({
        url: `/auth/users/${id}`,
        method: 'DELETE',
        path: `/auth/users/${id}`,
      } as any),
      invalidatesTags: ['Team'],
    }),
  }),
})

export const {
  useGetTeamMembersQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
} = teamApi
