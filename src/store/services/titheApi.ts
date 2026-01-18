import { authApi } from './authApi';

interface Tithe {
  id: string;
  contributorName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
  churchId?: string;
  currency?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface TithesByChurchResponse {
  tithings: Tithe[];
  totalAmount: number;
  period: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface CreateTitheRequest {
  contributorName: string;
  amount: number;
  currency?: string;
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
      providesTags: ["Tithe"],
    }),

    updateTithe: builder.mutation<Tithe, UpdateTitheRequest>({
      query: ({ id, ...patch }) => ({
        url: `/tithings/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ["Tithe"],
    }),

    deleteTithe: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/tithings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tithe'],
    }),

    getTithesByChurch: builder.query<TithesByChurchResponse, {
      churchId: string;
      page?: number;
      limit?: number;
      search?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: string;
      sortOrder?: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ churchId, page, limit, search, minAmount, maxAmount, sortBy, sortOrder, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (minAmount !== undefined) params.append('minAmount', minAmount.toString());
        if (maxAmount !== undefined) params.append('maxAmount', maxAmount.toString());
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/tithings/church/${churchId}?${params.toString()}`;
      },
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
