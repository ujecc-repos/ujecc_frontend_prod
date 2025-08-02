import { authApi } from './authApi';

interface Moisson {
  id: string;
  contributorName: string;
  amount: number;
  date: string;
  status: string;
  paymentMethod: string;
  note?: string;
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateMoissonRequest {
  contributorName: string;
  amount: number;
  date: string;
  status: string;
  paymentMethod: string;
  note?: string;
  churchId?: string;
}

interface UpdateMoissonRequest {
  id: string;
  [key: string]: any;
}

interface MoissonsByChurchResponse {
  moissons: Moisson[];
  totalAmount: number;
  period: string;
}

export const moissonApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createMoisson: builder.mutation<Moisson, CreateMoissonRequest>({
      query: (moissonData) => ({
        url: 'moissons',
        method: 'POST',
        body: moissonData,
      }),
      invalidatesTags: ['Moisson'],
    }),

    getMoissons: builder.query<Moisson[], void>({
      query: () => '/moissons',
      providesTags: ['Moisson'],
    }),

    getMoissonById: builder.query<Moisson, string>({
      query: (id) => `/moissons/${id}`,
      providesTags: (result, error, id) => [{ type: 'Moisson', id }],
    }),

    updateMoisson: builder.mutation<Moisson, UpdateMoissonRequest>({
      query: ({ id, ...patch }) => ({
        url: `/moissons/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Moisson', id }],
    }),

    deleteMoisson: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/moissons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Moisson'],
    }),

    getMoissonsByChurch: builder.query<MoissonsByChurchResponse, string>({
      query: (churchId) => `/moissons/church/${churchId}`,
      providesTags: ['Moisson'],
    }),

    getMoissonsByDateRange: builder.query<
      MoissonsByChurchResponse,
      { churchId: string; startDate: string; endDate: string }
    >({
      query: ({ churchId, startDate, endDate }) =>
        `/moissons/church/${churchId}?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Moisson'],
    }),
  }),
});

export const {
  useCreateMoissonMutation,
  useGetMoissonsQuery,
  useGetMoissonByIdQuery,
  useUpdateMoissonMutation,
  useDeleteMoissonMutation,
  useGetMoissonsByChurchQuery,
  useGetMoissonsByDateRangeQuery,
} = moissonApi;