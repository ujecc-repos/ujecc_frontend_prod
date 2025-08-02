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
}

interface OfferingsByChurchResponse {
  offerings: Offering[];
  totalAmount: number;
  period: string;
}

interface CreateOfferingRequest {
  contributorName: string;
  amount: number;
  date: string;
  paymentMethod: string;
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
      providesTags: (result, error, id) => [{ type: 'Offering', id }],
    }),

    updateOffering: builder.mutation<Offering, UpdateOfferingRequest>({
      query: ({ id, ...patch }) => ({
        url: `/offerings/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Offering', id }],
    }),

    deleteOffering: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/offerings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Offering'],
    }),

    getOfferingsByChurch: builder.query<OfferingsByChurchResponse, string>({
      query: (churchId) => `/offerings/church/${churchId}`,
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