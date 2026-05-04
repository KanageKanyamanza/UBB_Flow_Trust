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
  }),
})

export const { useGetDocumentsQuery, useUploadDocumentMutation, useDeleteDocumentMutation } = documentApi
