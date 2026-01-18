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
    currency?: string;
}

interface DonationsByChurchResponse {
    donations: Donation[];
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

interface CreateDonationRequest {
    contributorName: string;
    amount: number;
    currency?: string;
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

        getDonationsByChurch: builder.query<DonationsByChurchResponse, {
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
                return `/donations/church/${churchId}?${params.toString()}`;
            },
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
