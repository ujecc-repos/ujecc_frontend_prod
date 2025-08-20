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

    getPresencesByService: builder.query<Presence[], string>({
      query: (serviceId) => `/presences/services/${serviceId}/presences`,
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