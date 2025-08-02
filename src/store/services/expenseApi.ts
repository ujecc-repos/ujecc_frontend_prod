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
}

interface CreateExpenseRequest {
  amount: number;
  quantity: number;
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
      providesTags: (result, error, id) => [{ type: 'Expense', id }],
    }),

    // Get expenses by church with type filter (current or global)
    getExpensesByChurch: builder.query<ExpensesByChurchResponse, { churchId: string; type: 'CURRENT' | 'GLOBAL' }>({
      query: ({ churchId, type }) => `/expenses/church/${churchId}?type=${type}`,
      providesTags: (result, error, { churchId }) => [{ type: 'Expense', id: `church-${churchId}` }],
    }),

    // Get monthly expense summary for charts
    getMonthlyExpenseSummary: builder.query<MonthlyExpenseSummaryResponse, { churchId: string; year?: number }>({
      query: ({ churchId, year }) => {
        const queryParams = year ? `?year=${year}` : '';
        return `/expenses/church/${churchId}/monthly-summary${queryParams}`;
      },
      providesTags: (result, error, { churchId }) => [{ type: 'Expense', id: `monthly-${churchId}` }],
    }),

    // Get quarterly expense summary for charts
    getQuarterlyExpenseSummary: builder.query<QuarterlyExpenseSummaryResponse, { churchId: string; year?: number }>({
      query: ({ churchId, year }) => {
        const queryParams = year ? `?year=${year}` : '';
        return `/expenses/church/${churchId}/quarterly-summary${queryParams}`;
      },
      providesTags: (result, error, { churchId }) => [{ type: 'Expense', id: `quarterly-${churchId}` }],
    }),

    // Get expenses by category
    getExpensesByCategory: builder.query<ExpensesByCategoryResponse, { churchId: string; period?: 'month' | 'year' }>({
      query: ({ churchId, period }) => {
        const queryParams = period ? `?period=${period}` : '';
        return `/expenses/church/${churchId}/by-category${queryParams}`;
      },
      providesTags: (result, error, { churchId }) => [{ type: 'Expense', id: `category-${churchId}` }],
    }),

    updateExpense: builder.mutation<Expense, UpdateExpenseRequest>({
      query: ({ id, ...patch }) => ({
        url: `/expenses/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }],
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