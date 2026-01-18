import { authApi } from './authApi';

interface Expense {
    id: string;
    amount: number;
    quantity: number;
    category: string;
    date: string;
    paymentMethod: string;
    description: string;
    churchId?: string;
    createdAt?: string;
    updatedAt?: string;
    currency?: string;
}

interface CreateExpenseRequest {
    amount: number;
    quantity: number;
    currency?: string;
    category: string;
    date: string;
    paymentMethod: string;
    description: string;
    churchId?: string;
}

interface UpdateExpenseRequest {
    id: string;
    [key: string]: any;
}

interface ExpensesByChurchResponse {
    expenses: Expense[];
    totalAmount: number;
    period: 'monthly' | 'yearly';
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

interface MonthlySummaryItem {
    month: number;
    totalAmount: number;
    count: number;
}

interface MonthlyExpenseSummaryResponse {
    year: number;
    monthlySummary: MonthlySummaryItem[];
}

interface QuarterlySummaryItem {
    quarter: number;
    totalAmount: number;
    count: number;
}

interface QuarterlyExpenseSummaryResponse {
    year: number;
    quarterlySummary: QuarterlySummaryItem[];
}

interface CategorySummaryItem {
    category: string;
    totalAmount: number;
    count: number;
}

interface ExpensesByCategoryResponse {
    period: string;
    categories: CategorySummaryItem[];
}

export const expenseApi = authApi.injectEndpoints({
    endpoints: (builder) => ({
        createExpense: builder.mutation<Expense, CreateExpenseRequest>({
            query: (expenseData) => ({
                url: '/expenses',
                method: 'POST',
                body: expenseData,
            }),
            invalidatesTags: ['Expense'],
        }),

        getExpenses: builder.query<Expense[], void>({
            query: () => '/expenses',
            providesTags: ['Expense'],
        }),

        getExpenseById: builder.query<Expense, string>({
            query: (id) => `/expenses/${id}`,
            providesTags: ["Expense"],
        }),

        // Get expenses by church with type filter (current or global)
        getExpensesByChurch: builder.query<ExpensesByChurchResponse, {
            churchId: string;
            type: 'CURRENT' | 'GLOBAL';
            page?: number;
            limit?: number;
            search?: string;
            category?: string;
            minAmount?: number;
            maxAmount?: number;
            sortBy?: string;
            sortOrder?: string;
        }>({
            query: ({ churchId, type, page, limit, search, category, minAmount, maxAmount, sortBy, sortOrder }) => {
                const params = new URLSearchParams();
                params.append('type', type);
                if (page) params.append('page', page.toString());
                if (limit) params.append('limit', limit.toString());
                if (search) params.append('search', search);
                if (category) params.append('category', category);
                if (minAmount !== undefined) params.append('minAmount', minAmount.toString());
                if (maxAmount !== undefined) params.append('maxAmount', maxAmount.toString());
                if (sortBy) params.append('sortBy', sortBy);
                if (sortOrder) params.append('sortOrder', sortOrder);
                return `/expenses/church/${churchId}?${params.toString()}`;
            },
            providesTags: ["Expense"],
        }),

        // Get monthly expense summary for charts
        getMonthlyExpenseSummary: builder.query<MonthlyExpenseSummaryResponse, { churchId: string; year?: number }>({
            query: ({ churchId, year }) => {
                const queryParams = year ? `?year=${year}` : '';
                return `/expenses/church/${churchId}/monthly-summary${queryParams}`;
            },
            providesTags: ["Expense"],
        }),

        // Get quarterly expense summary for charts
        getQuarterlyExpenseSummary: builder.query<QuarterlyExpenseSummaryResponse, { churchId: string; year?: number }>({
            query: ({ churchId, year }) => {
                const queryParams = year ? `?year=${year}` : '';
                return `/expenses/church/${churchId}/quarterly-summary${queryParams}`;
            },
            providesTags: ["Expense"],
        }),

        // Get expenses by category
        getExpensesByCategory: builder.query<ExpensesByCategoryResponse, { churchId: string; period?: 'month' | 'year' }>({
            query: ({ churchId, period }) => {
                const queryParams = period ? `?period=${period}` : '';
                return `/expenses/church/${churchId}/by-category${queryParams}`;
            },
            providesTags: ["Expense"],
        }),

        updateExpense: builder.mutation<Expense, UpdateExpenseRequest>({
            query: ({ id, ...patch }) => ({
                url: `/expenses/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ["Expense"],
        }),

        deleteExpense: builder.mutation<{ message: string }, string>({
            query: (id) => ({
                url: `/expenses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Expense'],
        }),
    }),
});

export const {
    useCreateExpenseMutation,
    useGetExpensesQuery,
    useGetExpenseByIdQuery,
    useGetExpensesByChurchQuery,
    useGetMonthlyExpenseSummaryQuery,
    useGetQuarterlyExpenseSummaryQuery,
    useGetExpensesByCategoryQuery,
    useUpdateExpenseMutation,
    useDeleteExpenseMutation,
} = expenseApi;
