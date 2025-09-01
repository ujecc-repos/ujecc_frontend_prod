import { authApi } from './authApi';

interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  picture?: string;
  anthem?: string;
  longitude?: string;
  latitude?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  users?: any[];
  groups?: any[];
  events?: any[];
  mariages?: any[];
  funerals?: any[];
  presentations?: any[];
  batism?: any[];
  death?: any[];
  mission: {
    missionName?: string;
    presidentName?: string;
  }
  fullAddress: {
    country?: string;
    departement?: string;
    commune?: string;
    sectionCommunale?: string;
    telephone?: string;
    rue?: string;
  }
}

interface CreateChurchRequest {
  name: string;
  departement: string;
  commune: string;
  sectionCommunale: string;
  longitude?: string;
  latitude?: string;
  [key: string]: any;
}

interface createChurchResponse {
    churchId: string;
    churchName: string;
    token: string;
}

interface UpdateChurchRequest {
  id: string;
  [key: string]: any;
}

interface AddUserToChurchResponse {
  message: string;
  user: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  church: {
    id: string;
    name: string;
  };
}

interface DepartementCommunesResponse {
  [communeName: string]: string[];
}

interface Tti {
  id: string;
  church?: Church;
  [key: string]: any;
}

interface ConnectTtiResponse {
  message: string;
  tti: Tti;
}

export const churchApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createChurch: builder.mutation<createChurchResponse, CreateChurchRequest>({
      query: (churchData) => ({
        url: '/churches',
        method: 'POST',
        body: churchData,
      }),
      invalidatesTags: ['Church', 'Transfer'],
    }),

    getChurches: builder.query<Church[], void>({
      query: () => '/churches',
      providesTags: ['Church'],
    }),

    getChurchById: builder.query<Church, string>({
      query: (id) => `/churches/${id}`,
      providesTags: ["Church"]
    }),

    updateChurch: builder.mutation<Church, UpdateChurchRequest | FormData>({
      query: (churchData) => {
        // Check if churchData is FormData
        const isFormData = churchData instanceof FormData;
        const id = isFormData 
          ? churchData.get('id')?.toString() 
          : (churchData as UpdateChurchRequest).id;
        
        return {
          url: `/churches/${id}`,
          method: 'PUT',
          // Don't set Content-Type when sending FormData, let the browser set it
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
          body: isFormData ? churchData : (churchData as UpdateChurchRequest),
        };
      },
      invalidatesTags: ["Church", "Transfer"]
    }),

    addUserToChurch: builder.mutation<AddUserToChurchResponse, { churchId: string, userId: string }>({
      query: ({ churchId, userId }) => ({
        url: `/churches/${churchId}/add-user`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ['Church'],
    }),

    deleteChurch: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/churches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Church', 'Transfer'],
    }),
    
    getDepartementCommunes: builder.query<DepartementCommunesResponse, string>({
      query: (departementName) => `/departement/${departementName}`,
      providesTags: ['Church'],
    }),

    connectTtiToChurch: builder.mutation<ConnectTtiResponse, { churchId: string, ttiId: string }>({
      query: ({ churchId, ttiId }) => ({
        url: `/churches/church/${churchId}/connect-tti/${ttiId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Church'],
    }),

    getTtisByChurch: builder.query<Tti[], string>({
      query: (churchId) => `/churches/church/${churchId}/ttis`,
      providesTags: ['Church'],
    }),

    getAllTtis: builder.query<Tti[], void>({
      query: () => '/churches/ttis/all-tti',
      providesTags: ['Church'],
    }),
  }),
});

export const {
  useCreateChurchMutation,
  useGetChurchesQuery,
  useGetChurchByIdQuery,
  useUpdateChurchMutation,
  useDeleteChurchMutation,
  useAddUserToChurchMutation,
  useGetDepartementCommunesQuery,
  useConnectTtiToChurchMutation,
  useGetTtisByChurchQuery,
  useGetAllTtisQuery,
} = churchApi;