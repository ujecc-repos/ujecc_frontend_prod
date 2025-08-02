import { authApi } from './authApi';

interface Baptism {
  id: string;
  fullName: string;
  birthDate: string;
  baptismDate: string;
  baptismLocation: string;
  officiantName: string;
  baptismClassDate: string;
  baptismCertificate: string;
  withness: string;
  placeOfBirth: string;
  testimony: string;
  conversionDate: string;
  previousChurch: string;
  status: 'pending' | 'completed';
  startDate?: string;
  endDate?: string;
  churchId: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}


interface CreateBaptismRequest {
  fullName: string;
  birthDate: string;
  baptismDate: string;
  baptismLocation: string;
  officiantName: string;
  baptismClassDate: string;
  churchId: string;
  withness: string;
  placeOfBirth: string;
  testimony: string;
  conversionDate: string;
  previousChurch: string;
  status?: 'pending' | 'completed';
  isCatechumene?: boolean;
  catechumeneStartDate?: string;
  catechumeneEndDate?: string;
}

interface UpdateBaptismRequest {
  id: string;
  [key: string]: any;
}

export const baptismApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createBaptism: builder.mutation<Baptism, FormData>({
      query: (baptismData) => ({
        url: '/baptisms',
        method: 'POST',
        body: baptismData,
        formData: true,
      }),
      invalidatesTags: ['Baptism'],
    }),

    getBaptisms: builder.query<Baptism[], void>({
      query: () => '/baptisms',
      providesTags: ['Baptism'],
    }),

    getBaptismById: builder.query<Baptism, string>({
      query: (id) => `/baptisms/${id}`,
      providesTags: (result, error, id) => [{ type: 'Baptism', id }],
    }),

    updateBaptism: builder.mutation<Baptism, UpdateBaptismRequest>({
      query: ({ id, ...patch }) => ({
        url: `/baptisms/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Baptism', id }],
    }),

    deleteBaptism: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/baptisms/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Baptism'],
    }),

    getBaptismsByChurch: builder.query<Baptism[], string>({
      query: (churchId) => `/baptisms/church/${churchId}`,
      providesTags: ['Baptism'],
    }),

    downloadBaptismCertificate: builder.query<Blob, string>({  
      query: (id) => ({
        url: `/baptisms/${id}/certificate`,
        method: 'GET',
        responseHandler: async (response) => await response.blob(),
      }),
    }),

    getBaptismsByDateRange: builder.query<
      Baptism[],
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) =>
        `/baptisms/date-range?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Baptism'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateBaptismMutation,
  useGetBaptismsQuery,
  useGetBaptismByIdQuery,
  useUpdateBaptismMutation,
  useDeleteBaptismMutation,
  useGetBaptismsByChurchQuery,
  useLazyDownloadBaptismCertificateQuery,
  useGetBaptismsByDateRangeQuery,
} = baptismApi;