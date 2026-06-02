import { apiSlice } from './apiSlice.js'

export const documentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query<any[], { type?: string } | void>({
      query: (params) => ({
        url: '/documents',
        params: params || undefined,
      }),
      providesTags: ['Document'],
    }),
    uploadDocument: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/documents',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Document', 'Trust'],
    }),
    deleteDocument: builder.mutation<any, string>({
      query: (id) => ({
        url: `/documents/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Document', 'Trust'],
    }),
    addVersion: builder.mutation<any, { id: string, formData: FormData }>({
      query: ({ id, formData }) => ({
        url: `/documents/${id}/versions`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Document'],
    }),
    getDocumentLogs: builder.query<any[], void>({
      query: () => ({
        url: '/documents/logs',
      }),
      providesTags: ['Document'],
    }),
  }),
})

export const {
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useAddVersionMutation,
  useGetDocumentLogsQuery,
} = documentApi

