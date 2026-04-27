import { apiSlice } from './apiSlice'

export interface UploadResponse {
  message: string
  url: string
  fileName: string
  size: number
  evidenceFile?: {
    id: string
    txnId: string
    fileUrl: string
    fileName: string
    createdAt: string
  }
}

export const uploadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation<UploadResponse, { file: File; txnId?: string }>({
      query: ({ file, txnId }) => {
        const formData = new FormData()
        formData.append('file', file)
        if (txnId) {
          formData.append('txnId', txnId)
        }
        return {
          url: '/upload',
          method: 'POST',
          body: formData,
          // Note: RTK Query fetchBaseQuery handles FormData headers automatically 
          // but we might need to be careful with Content-Type if we manually set it
        }
      },
      invalidatesTags: (result) => 
        result?.evidenceFile?.txnId 
          ? [{ type: 'Transaction', id: result.evidenceFile.txnId }, { type: 'Transaction', id: 'LIST' }] 
          : [],
    }),
  }),
})

export const { useUploadImageMutation } = uploadApi
