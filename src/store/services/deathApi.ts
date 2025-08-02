import { authApi } from './authApi';

interface Death {
  id: string;
  fullname: string;
  deathDate: string;
  deathTime: string;
  deathCause: string;
  deathCertificate?: string;
  nextOfKin: string;
  relationShip: string;
  email: string;
  officiantName: string;
  description: string;
  location: string;
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateDeathRequest {
  fullname: string;
  deathDate: string;
  deathTime: string;
  deathCause: string;
  deathCertificate?: string;
  nextOfKin: string;
  relationShip: string;
  email: string;
  officiantName: string;
  description: string;
  location: string;
  churchId?: string;
}

interface UpdateDeathRequest {
  id: string;
  [key: string]: any;
}

export const deathApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createDeath: builder.mutation<Death, CreateDeathRequest>({
      query: (deathData) => ({
        url: '/deaths',
        method: 'POST',
        body: deathData,
      }),
      invalidatesTags: ['Death'],
    }),

    getDeaths: builder.query<Death[], void>({
      query: () => '/deaths',
      providesTags: ['Death'],
    }),

    getDeathById: builder.query<Death, string>({
      query: (id) => `/deaths/${id}`,
      providesTags: (result, error, id) => [{ type: 'Death', id }],
    }),

    updateDeath: builder.mutation<Death, UpdateDeathRequest>({
      query: ({ id, ...patch }) => ({
        url: `/deaths/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Death', id }],
    }),

    deleteDeath: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/deaths/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Death'],
    }),

    getDeathsByChurch: builder.query<Death[], string>({
      query: (churchId) => `/deaths/church/${churchId}`,
      providesTags: ['Death'],
    }),

    getDeathsByDateRange: builder.query<
      Death[],
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) =>
        `/deaths/date-range?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Death'],
    }),
  }),
});

export const {
  useCreateDeathMutation,
  useGetDeathsQuery,
  useGetDeathByIdQuery,
  useUpdateDeathMutation,
  useDeleteDeathMutation,
  useGetDeathsByChurchQuery,
  useGetDeathsByDateRangeQuery,
} = deathApi;