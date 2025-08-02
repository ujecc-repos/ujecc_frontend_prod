import { authApi } from './authApi';

interface Donation {
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

interface DonationsByChurchResponse {
  donations: Donation[];
  totalAmount: number;
  period: string;
}

interface CreateDonationRequest {
  contributorName: string;
  amount: number;
  date: string;
  paymentMethod: string;
  note?: string;
  churchId?: string;
}

interface UpdateDonationRequest {
  id: string;
  [key: string]: any;
}

export const donationApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createDonation: builder.mutation<Donation, CreateDonationRequest>({
      query: (donationData) => ({
        url: 'donations',
        method: 'POST',
        body: donationData,
      }),
      invalidatesTags: ['Donation'],
    }),

    getDonations: builder.query<Donation[], void>({
      query: () => '/donations',
      providesTags: ['Donation'],
    }),

    getDonationById: builder.query<Donation, string>({
      query: (id) => `/donations/${id}`,
      providesTags: ["Donation"],
    }),

    updateDonation: builder.mutation<Donation, UpdateDonationRequest>({
      query: ({ id, ...patch }) => ({
        url: `/donations/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ["Donation"],
    }),

    deleteDonation: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/donations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Donation'],
    }),

    getDonationsByChurch: builder.query<DonationsByChurchResponse, string>({
      query: (churchId) => `/donations/church/${churchId}`,
      providesTags: ['Donation'],
    }),

    getDonationsByDateRange: builder.query<
      DonationsByChurchResponse,
      { churchId: string; startDate: string; endDate: string }
    >({
      query: ({ churchId, startDate, endDate }) =>
        `/donations/church/${churchId}?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Donation'],
    }),
  }),
});

export const {
  useCreateDonationMutation,
  useGetDonationsQuery,
  useGetDonationByIdQuery,
  useUpdateDonationMutation,
  useDeleteDonationMutation,
  useGetDonationsByChurchQuery,
  useGetDonationsByDateRangeQuery,
} = donationApi;