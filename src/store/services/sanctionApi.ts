import { authApi } from './authApi';

export interface Sanction {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  churchId?: string;
  userId?: string;
  user?: any;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateSanctionRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: string;
  churchId?: string;
  userId?: string;
}

interface UpdateSanctionRequest {
  id: string;
  name?: string;
  description?: string;
  startDate?: string;
  status?: string;
}

export const sanctionApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createSanction: builder.mutation<Sanction, CreateSanctionRequest>({
      query: (sanctionData) => ({
        url: '/sanctions',
        method: 'POST',
        body: sanctionData,
      }),
      invalidatesTags: ['Sanction'],
    }),

    getSanctions: builder.query<Sanction[], void>({
      query: () => '/sanctions',
      providesTags: ['Sanction'],
    }),

    getSanctionById: builder.query<Sanction, string>({
      query: (id) => `/sanctions/${id}`,
      transformResponse: (response: any): Sanction => {
        console.log('Sanction by ID response:', response);
        return response as Sanction;
      },
      providesTags: ["Sanction"],
    }),

    updateSanction: builder.mutation<Sanction, UpdateSanctionRequest>({
      query: ({ id, ...patch }) => ({
        url: `/sanctions/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ["Sanction"],
    }),

    deleteSanction: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/sanctions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sanction'],
    }),

    getSanctionsByChurch: builder.query<Sanction[], string>({
      query: (churchId) => {
        return `/sanctions/church/${churchId}`;
      },
      providesTags: ['Sanction'],
      transformResponse: (response: { data: Sanction[] } | Sanction[] | any) => {
        console.log('Raw API response in transform:', response);
        
        if (!response) {
          console.log('Response is null or undefined');
          return [];
        }
        
        if (Array.isArray(response)) {
          console.log('Response is an array');
          return response;
        }
        
        if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
          console.log('Response is an object with data property (array)');
          return response.data;
        }
        
        if (response && typeof response === 'object' && 'data' in response) {
          console.log('Response is an object with data property (not array)');
          return Array.isArray(response.data) ? response.data : [];
        }
        
        console.log('Response format is unknown');
        return [];
      },
    }),

    getSanctionsByStatus: builder.query<Sanction[], string>({
      query: (status) => {
        return `/sanctions/status/${status}`;
      },
      providesTags: ['Sanction'],
      transformResponse: (response: { data: Sanction[] } | Sanction[] | any) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (response && typeof response === 'object' && 'data' in response) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      },
    }),
  }),
});

export const {
  useCreateSanctionMutation,
  useGetSanctionsQuery,
  useGetSanctionByIdQuery,
  useUpdateSanctionMutation,
  useDeleteSanctionMutation,
  useGetSanctionsByChurchQuery,
  useGetSanctionsByStatusQuery,
} = sanctionApi;