import { authApi } from './authApi';

interface GlobalStats {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  revenueBreakdown: {
    tithing: number;
    donations: number;
    offerings: number;
    moissons: number;
  }
}

interface ChurchStats extends GlobalStats {
  revenueBreakdown: {
    tithing: number;
    donations: number;
    offerings: number;
    moissons: number;
  }
}

interface PeriodStats extends ChurchStats {
  period: {
    startDate: string;
    endDate: string;
  }
}

interface MonthlyData {
  month: number;
  name: string;
  revenue: number;
  expenses: number;
  revenueBreakdown: {
    tithing: number;
    donations: number;
    offerings: number;
    moissons: number;
  }
}

interface MonthlyStats {
  year: number;
  months: MonthlyData[];
  yearlyTotals: {
    totalRevenue: number;
    totalExpenses: number;
    revenueBreakdown: {
      tithing: number;
      donations: number;
      offerings: number;
      moissons: number;
    }
  }
}

export const statsApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalStats: builder.query<GlobalStats, { year?: number }>({
      query: ({ year }) => {
        return year ? `/stats/global?year=${year}` : '/stats/global';
      },
      providesTags: ['Expense', 'Tithe', 'Donation', 'Offering', 'Moisson'],
    }),
    
    getChurchStats: builder.query<ChurchStats, string>({
      query: (churchId) => `/stats/church/${churchId}`,
      providesTags: ['Expense', 'Tithe', 'Donation', 'Offering', 'Moisson'],
    }),
    
    getPeriodStats: builder.query<PeriodStats, { startDate?: string; endDate?: string }>({
      query: ({ startDate, endDate }) => {
        const queryParams = [];
        if (startDate) queryParams.push(`startDate=${startDate}`);
        if (endDate) queryParams.push(`endDate=${endDate}`);
        
        return `/stats/period${queryParams.length > 0 ? `?${queryParams.join('&')}` : ''}`;
      },
      providesTags: ['Expense', 'Tithe', 'Donation', 'Offering', 'Moisson'],
    }),
    
    getMonthlyStats: builder.query<MonthlyStats, { year?: number }>({
      query: ({ year }) => {
        return year ? `/stats/monthly?year=${year}` : '/stats/monthly';
      },
      providesTags: ['Expense', 'Tithe', 'Donation', 'Offering', 'Moisson'],
    }),
  }),
});

export const {
  useGetGlobalStatsQuery,
  useGetChurchStatsQuery,
  useGetPeriodStatsQuery,
  useGetMonthlyStatsQuery
} = statsApi;