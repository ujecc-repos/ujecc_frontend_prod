import { authApi } from './authApi';

interface Tithe {
  id: string;
  contributorName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface TithesByChurchResponse {
  tithings: Tithe[];
  totalAmount: number;
  period: string;
}

interface CreateTitheRequest {
  contributorName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
  churchId?: string;
}

interface UpdateTitheRequest {
  id: string;
  [key: string]: any;
}

export const titheApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createTithe: builder.mutation<Tithe, CreateTitheRequest>({
      query: (titheData) => ({
        url: 'tithings',
        method: 'POST',
        body: titheData,
      }),
      invalidatesTags: ['Tithe'],
    }),

    getTithes: builder.query<Tithe[], void>({
      query: () => '/tithings',
      providesTags: ['Tithe'],
    }),

    getTitheById: builder.query<Tithe, string>({
      query: (id) => `/tithings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Tithe', id }],
    }),

    updateTithe: builder.mutation<Tithe, UpdateTitheRequest>({
      query: ({ id, ...patch }) => ({
        url: `/tithings/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Tithe', id }],
    }),

    deleteTithe: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/tithings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tithe'],
    }),

    getTithesByChurch: builder.query<TithesByChurchResponse, string>({
      query: (churchId) => `/tithings/church/${churchId}`,
      providesTags: ['Tithe'],
    }),

    getTithesByDateRange: builder.query<
      TithesByChurchResponse,
      { churchId: string; startDate: string; endDate: string }
    >({
      query: ({ churchId, startDate, endDate }) =>
        `/tithings/church/${churchId}?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Tithe'],
    }),
  }),
});

export const {
  useCreateTitheMutation,
  useGetTithesQuery,
  useGetTitheByIdQuery,
  useUpdateTitheMutation,
  useDeleteTitheMutation,
  useGetTithesByChurchQuery,
  useGetTithesByDateRangeQuery,
} = titheApi;