import { authApi } from './authApi';

export interface Ministry {
  id: string;
  name: string;
  description?: string;
  churchId?: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateMinistryRequest {
  name: string;
  description?: string;
  churchId?: string;
}

interface UpdateMinistryRequest {
  id: string;
  name?: string;
  description?: string;
}

export const ministryApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createMinistry: builder.mutation<Ministry, CreateMinistryRequest>({
      query: (ministryData) => ({
        url: '/ministries',
        method: 'POST',
        body: ministryData,
      }),
      invalidatesTags: ['Ministry'],
    }),

    getMinistries: builder.query<Ministry[], void>({
      query: () => '/ministries',
      providesTags: ['Ministry'],
    }),

    getMinistryById: builder.query<Ministry, string>({
      query: (id) => `/ministries/${id}`,
      transformResponse: (response: any): Ministry => {
        console.log('Ministry by ID response:', response);
        return response as Ministry;
      },
      providesTags: ["Ministry"],
    }),

    updateMinistry: builder.mutation<Ministry, UpdateMinistryRequest>({
      query: ({ id, ...patch }) => ({
        url: `/ministries/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ["Ministry"],
    }),

    deleteMinistry: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/ministries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Ministry'],
    }),

    getMinistriesByChurch: builder.query<Ministry[], string>({
      query: (churchId) => {
        return `/ministries/church/${churchId}`;
      },
      providesTags: ['Ministry'],
      transformResponse: (response: { data: Ministry[] } | Ministry[] | any) => {
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
  }),
});

export const {
  useCreateMinistryMutation,
  useGetMinistriesQuery,
  useGetMinistryByIdQuery,
  useUpdateMinistryMutation,
  useDeleteMinistryMutation,
  useGetMinistriesByChurchQuery,
} = ministryApi;