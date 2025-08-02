import { authApi } from './authApi';

export interface Committee {
  id: string;
  comiteeName: string;
  description?: string;
  meetingDay: string;
  meetingTime: string;
  commiteeLeader: any[];
  commiteeMember: any[];
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateCommitteeRequest {
  comiteeName: string;
  description?: string;
  meetingDay: string;
  meetingTime: string;
  leaderIds: string[];
  memberIds: string[];
  churchId?: string;
}

interface UpdateCommitteeRequest {
  id: string;
  name?: string;
  description?: string;
  meetingDay?: string;
  meetingTime?: string;
  leaderIds?: string[];
  memberIds?: string[];
}

export const committeeApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createCommittee: builder.mutation<Committee, CreateCommitteeRequest>({
      query: (committeeData) => ({
        url: '/committees',
        method: 'POST',
        body: committeeData,
      }),
      invalidatesTags: ['Committee'],
    }),

    getCommittees: builder.query<Committee[], void>({
      query: () => '/committees',
      providesTags: ['Committee'],
    }),

    getCommitteeById: builder.query<Committee, string>({
      query: (id) => `/committees/${id}`,
      transformResponse: (response: any): Committee => {
        console.log('Committee by ID response:', response);
        return response as Committee;
      },
      providesTags: ["Committee"],
    }),

    updateCommittee: builder.mutation<Committee, UpdateCommitteeRequest>({
      query: ({ id, ...patch }) => ({
        url: `/committees/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ["Committee"],
    }),

    deleteCommittee: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/committees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Committee'],
    }),

    getCommitteesByChurch: builder.query<Committee[], string>({
      query: (churchId) => {
        return `/committees/church/${churchId}`;
      },
      providesTags: ['Committee'],
      transformResponse: (response: { data: Committee[] } | Committee[] | any) => {
        // Handle both old (array) and new (object with data) response formats
        console.log('Raw API response in transform:', response);
        
        // Si la réponse est null ou undefined, retourner un tableau vide
        if (!response) {
          console.log('Response is null or undefined');
          return [];
        }
        
        // Si la réponse est un tableau, la retourner directement
        if (Array.isArray(response)) {
          console.log('Response is an array');
          return response;
        }
        
        // Si la réponse est un objet avec une propriété data qui est un tableau
        if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
          console.log('Response is an object with data property (array)');
          return response.data;
        }
        
        // Si la réponse est un objet avec une propriété data qui n'est pas un tableau
        if (response && typeof response === 'object' && 'data' in response) {
          console.log('Response is an object with data property (not array)');
          return Array.isArray(response.data) ? response.data : [];
        }
        
        // Cas par défaut: retourner un tableau vide
        console.log('Response format is unknown');
        return [];
      },
    }),
  }),
});

export const {
  useCreateCommitteeMutation,
  useGetCommitteesQuery,
  useGetCommitteeByIdQuery,
  useUpdateCommitteeMutation,
  useDeleteCommitteeMutation,
  useGetCommitteesByChurchQuery,
} = committeeApi;