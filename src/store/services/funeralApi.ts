import { authApi } from './authApi';

interface Funeral {
  id: string;
  fullname: string;
  birthDate: string;
  funeralDate: string;
  funeralTime: string;
  relationShip: string;
  email: string;
  deathCertificate?: string;
  nextOfKin: string;
  officiantName: string;
  description: string;
  funeralLocation: string;
  churchId?: string;
  church?: any;
  status: "en attente" | "complété"
  createdAt?: string;
  updatedAt?: string;
}

// Pour les requêtes JSON standard
interface CreateFuneralRequest {
  fullname: string;
  birthDate: string;
  funeralDate: string;
  funeralTime: string;
  relationShip: string;
  email: string;
  deathCertificate?: string;
  nextOfKin: string;
  officiantName: string;
  description: string;
  funeralLocation: string;
  churchId?: string;
  status: "en attente" | "complété"
}

interface UpdateFuneralRequest {
  id: string;
  [key: string]: any;
}

export const funeralApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createFuneral: builder.mutation<Funeral, FormData | CreateFuneralRequest>({
      query: (funeralData) => ({
        url: '/funerals',
        method: 'POST',
        body: funeralData,
        formData: true, // Indique à RTK Query que nous envoyons FormData
      }),
      invalidatesTags: ['Funeral'],
    }),

    getFunerals: builder.query<Funeral[], void>({
      query: () => '/funerals',
      providesTags: ['Funeral'],
    }),

    getFuneralById: builder.query<Funeral, string>({
      query: (id) => `/funerals/${id}`,
      providesTags: (result, error, id) => [{ type: 'Funeral', id }],
    }),

    updateFuneral: builder.mutation<Funeral, UpdateFuneralRequest>({
      query: ({ id, ...patch }) => ({
        url: `/funerals/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Funeral', id }],
    }),

    deleteFuneral: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/funerals/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Funeral'],
    }),

    getFuneralsByChurch: builder.query<Funeral[], string>({
      query: (churchId) => `/funerals/church/${churchId}`,
      providesTags: ['Funeral'],
    }),

    getFuneralsByDateRange: builder.query<
      Funeral[],
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) =>
        `/funerals/date-range?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Funeral'],
    }),
  }),
  overrideExisting: true
});

export const {
  useCreateFuneralMutation,
  useGetFuneralsQuery,
  useGetFuneralByIdQuery,
  useUpdateFuneralMutation,
  useDeleteFuneralMutation,
  useGetFuneralsByChurchQuery,
  useGetFuneralsByDateRangeQuery,
} = funeralApi;