import { authApi } from './authApi';

interface Presence {
  id: string;
  utilisateurId: string;
  serviceId: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  service?: {
    id: string;
    nom: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface CreatePresenceRequest {
  utilisateurId: string;
  serviceId: string;
  statut: string;
  attendanceDate?: string;
  offlineOperationId?: string;
}

interface PresencesQueryParams {
  serviceId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  date?: string;
  userId?: string;
}

interface PaginatedPresenceResponse {
  data: Presence[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const presenceApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createPresence: builder.mutation<Presence, CreatePresenceRequest>({
      query: (presenceData) => ({
        url: '/presences',
        method: 'POST',
        body: presenceData,
      }),
      invalidatesTags: ['Presence'],
    }),

    getPresencesByUser: builder.query<Presence[], string>({
      query: (userId) => `/presences/utilisateurs/${userId}/presences`,
      providesTags: ['Presence'],
    }),

    getPresencesByService: builder.query<PaginatedPresenceResponse, PresencesQueryParams>({
      query: ({ serviceId, page = 1, limit = 10, search = '', status = '', date = '', userId = '' }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (date) params.append('date', date);
        if (userId) params.append('userId', userId);

        return `/presences/services/${serviceId}/presences?${params.toString()}`;
      },
      providesTags: ['Presence'],
    }),
  }),
  overrideExisting: true
});

export const {
  useCreatePresenceMutation,
  useGetPresencesByUserQuery,
  useGetPresencesByServiceQuery,
} = presenceApi;
