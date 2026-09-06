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
  deathDate?: string;
  memberId?: string | null;
  member?: FuneralMember | null;
}

export interface FuneralMember {
  id: string;
  code?: string | null;
  firstname: string;
  lastname: string;
  birthDate?: string | null;
  mobilePhone?: string | null;
  email?: string | null;
  picture?: string | null;
}

// Pour les requêtes JSON standard
interface CreateFuneralRequest {
  fullname: string;
  birthDate: string;
  deathDate: string;
  funeralDate: string;
  funeralTime: string;
  relationShip: string;
  email: string;
  telephone?: string;
  deathCertificate?: string;
  nextOfKin: string;
  officiantName: string;
  description: string;
  funeralLocation: string;
  churchId?: string;
  memberId?: string;
  status: "en attente" | "complété"
}

interface UpdateFuneralRequest { id: string; funeral: FormData | Partial<CreateFuneralRequest> }

export const funeralApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createFuneral: builder.mutation<Funeral, FormData | CreateFuneralRequest>({
      query: (funeralData) => ({
        url: '/funerals',
        method: 'POST',
        body: funeralData,
        formData: true, // Indique à RTK Query que nous envoyons FormData
      }),
      invalidatesTags: ['Funeral', 'User', 'Church', 'Mission'],
    }),

    searchFuneralMembers: builder.query<FuneralMember[], string>({
      query: (query) => `/funerals/member-search?query=${encodeURIComponent(query)}`,
    }),

    getFunerals: builder.query<Funeral[], void>({
      query: () => '/funerals',
      providesTags: ['Funeral'],
    }),

    getFuneralById: builder.query<Funeral, string>({
      query: (id) => `/funerals/${id}`,
      providesTags: ["Funeral"],
    }),

    updateFuneral: builder.mutation<Funeral, UpdateFuneralRequest>({
      query: ({ id, funeral }) => ({
        url: `/funerals/${id}`,
        method: 'PUT',
        body: funeral,
        formData: funeral instanceof FormData,
      }),
      invalidatesTags: ["Funeral"],
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
  useLazySearchFuneralMembersQuery,
  useGetFuneralsQuery,
  useGetFuneralByIdQuery,
  useUpdateFuneralMutation,
  useDeleteFuneralMutation,
  useGetFuneralsByChurchQuery,
  useGetFuneralsByDateRangeQuery,
} = funeralApi;
