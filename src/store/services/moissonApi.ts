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
    currency?: string;
}

interface CreateMoissonRequest {
    contributorName: string;
    amount: number;
    date: string;
    currency?: string;
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
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
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
            providesTags: ["Moisson"],
        }),

        updateMoisson: builder.mutation<Moisson, UpdateMoissonRequest>({
            query: ({ id, ...patch }) => ({
                url: `/moissons/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ["Moisson"],
        }),

        deleteMoisson: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/moissons/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Moisson'],
        }),

        getMoissonsByChurch: builder.query<MoissonsByChurchResponse, {
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
                if (endDate) params.append(' endDate', endDate);
                return `/moissons/church/${churchId}?${params.toString()}`;
            },
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
