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
  markedAt?: string;
  offlineOperationId?: string;
}

interface PresencesQueryParams {
  serviceId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  date?: string;
  timezoneOffset?: number;
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

export interface PresenceReportMember {
  id: string;
  code?: string | null;
  firstname: string;
  lastname: string;
  email?: string | null;
}

export interface PresenceReportParams {
  serviceId: string;
  memberId: string;
  dateFrom: string;
  dateTo: string;
  timezoneOffset: number;
  format: 'pdf' | 'xlsx' | 'docx';
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
      query: ({ serviceId, page = 1, limit = 10, search = '', status = '', date = '', timezoneOffset, userId = '' }) => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);
        if (status) params.append('status', status);
        if (date) {
          params.append('date', date);
          if (typeof timezoneOffset === 'number') params.append('timezoneOffset', timezoneOffset.toString());
        }
        if (userId) params.append('userId', userId);

        return `/presences/services/${serviceId}/presences?${params.toString()}`;
      },
      providesTags: ['Presence'],
    }),
    searchPresenceReportMembers: builder.query<PresenceReportMember[], { serviceId: string; search: string }>({
      query: ({ serviceId, search }) => ({
        url: `/presences/services/${serviceId}/report-members`,
        params: { search },
      }),
    }),
    downloadPresenceReport: builder.mutation<Blob, PresenceReportParams>({
      query: ({ serviceId, ...params }) => ({
        url: `/presences/services/${serviceId}/reports/export`,
        method: 'GET',
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: true
});

export const {
  useCreatePresenceMutation,
  useGetPresencesByUserQuery,
  useGetPresencesByServiceQuery,
  useSearchPresenceReportMembersQuery,
  useDownloadPresenceReportMutation,
} = presenceApi;
