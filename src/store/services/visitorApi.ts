import { authApi } from './authApi';

export type VisitorStatus = 'Nouveau' | 'À contacter' | 'Contacté' | 'Revenu';

export interface Visitor {
  id: string;
  code: string;
  firstname: string;
  lastname: string;
  gender?: string | null;
  mobilePhone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
  visitDate: string;
  discoverySource?: string | null;
  invitedBy?: string | null;
  visitReason?: string | null;
  status: VisitorStatus;
  isAffiliated: boolean;
  churchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorPayload {
  firstname: string;
  lastname: string;
  gender?: string;
  mobilePhone?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  country?: string;
  visitDate: string;
  discoverySource?: string;
  invitedBy?: string;
  visitReason?: string;
  status?: VisitorStatus;
  isAffiliated: boolean;
}

export interface VisitorListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  affiliation?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface VisitorListResponse {
  items: Visitor[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface VisitorStats {
  total: number;
  newThisMonth: number;
  followUp: number;
  affiliated: number;
}

export interface VisitorReportParams {
  format: 'pdf' | 'xlsx' | 'docx';
  dateFrom?: string;
  dateTo?: string;
  gender?: string;
}

export const visitorApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getVisitors: builder.query<VisitorListResponse, VisitorListParams>({
      query: (params) => ({ url: '/visitors', params }),
      providesTags: (result) => result
        ? [...result.items.map(({ id }) => ({ type: 'Visitor' as const, id })), { type: 'Visitor', id: 'LIST' }]
        : [{ type: 'Visitor', id: 'LIST' }],
    }),
    getVisitorStats: builder.query<VisitorStats, void>({
      query: () => '/visitors/stats',
      providesTags: [{ type: 'Visitor', id: 'STATS' }],
    }),
    createVisitor: builder.mutation<Visitor, VisitorPayload>({
      query: (body) => ({ url: '/visitors', method: 'POST', body }),
      invalidatesTags: [{ type: 'Visitor', id: 'LIST' }, { type: 'Visitor', id: 'STATS' }],
    }),
    updateVisitor: builder.mutation<Visitor, { id: string; body: VisitorPayload }>({
      query: ({ id, body }) => ({ url: `/visitors/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Visitor', id },
        { type: 'Visitor', id: 'LIST' },
        { type: 'Visitor', id: 'STATS' },
      ],
    }),
    updateVisitorStatus: builder.mutation<Visitor, { id: string; status: VisitorStatus }>({
      query: ({ id, status }) => ({ url: `/visitors/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Visitor', id },
        { type: 'Visitor', id: 'LIST' },
        { type: 'Visitor', id: 'STATS' },
      ],
    }),
    deleteVisitor: builder.mutation<void, string>({
      query: (id) => ({ url: `/visitors/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Visitor', id: 'LIST' }, { type: 'Visitor', id: 'STATS' }],
    }),
    downloadVisitorReport: builder.mutation<Blob, VisitorReportParams>({
      query: (params) => ({
        url: '/visitors/reports/export',
        method: 'GET',
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVisitorsQuery,
  useGetVisitorStatsQuery,
  useCreateVisitorMutation,
  useUpdateVisitorMutation,
  useUpdateVisitorStatusMutation,
  useDeleteVisitorMutation,
  useDownloadVisitorReportMutation,
} = visitorApi;
