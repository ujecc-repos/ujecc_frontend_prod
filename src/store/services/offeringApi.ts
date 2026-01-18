import { authApi } from './authApi';

interface Offering {
  id: string;
  contributorName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
  status?: string;
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
  currency?: string;
}

interface OfferingsByChurchResponse {
  offerings: Offering[];
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

interface CreateOfferingRequest {
  contributorName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  currency?: string;
  note?: string;
  status?: string;
  churchId?: string;
}

interface UpdateOfferingRequest {
  id: string;
  [key: string]: any;
}

export const offeringApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createOffering: builder.mutation<Offering, CreateOfferingRequest>({
      query: (offeringData) => ({
        url: 'offerings',
        method: 'POST',
        body: offeringData,
      }),
      invalidatesTags: ['Offering'],
    }),

    getOfferings: builder.query<Offering[], void>({
      query: () => '/offerings',
      providesTags: ['Offering'],
    }),

    getOfferingById: builder.query<Offering, string>({
      query: (id) => `/offerings/${id}`,
      providesTags: ["Offering"],
    }),

    updateOffering: builder.mutation<Offering, UpdateOfferingRequest>({
      query: ({ id, ...patch }) => ({
        url: `/offerings/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ["Offering"],
    }),

    deleteOffering: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/offerings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Offering'],
    }),

    getOfferingsByChurch: builder.query<OfferingsByChurchResponse, {
      churchId: string;
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      minAmount?: number;
      maxAmount?: number;
      sortBy?: string;
      sortOrder?: string;
      startDate?: string;
      endDate?: string;
    }>({
      query: ({ churchId, page, limit, search, status, minAmount, maxAmount, sortBy, sortOrder, startDate, endDate }) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (minAmount !== undefined) params.append('minAmount', minAmount.toString());
        if (maxAmount !== undefined) params.append('maxAmount', maxAmount.toString());
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/offerings/church/${churchId}?${params.toString()}`;
      },
      providesTags: ['Offering'],
    }),

    getOfferingsByDateRange: builder.query<
      OfferingsByChurchResponse,
      { churchId: string; startDate: string; endDate: string }
    >({
      query: ({ churchId, startDate, endDate }) =>
        `/offerings/church/${churchId}?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Offering'],
    }),
  }),
});

export const {
  useCreateOfferingMutation,
  useGetOfferingsQuery,
  useGetOfferingByIdQuery,
  useUpdateOfferingMutation,
  useDeleteOfferingMutation,
  useGetOfferingsByChurchQuery,
  useGetOfferingsByDateRangeQuery,
} = offeringApi;
