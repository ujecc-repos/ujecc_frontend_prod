import { authApi } from './authApi';

interface Service {
  id: string;
  nom: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateServiceRequest {
  nom: string;
  churchId: string;
}

interface UpdateServiceRequest {
  id: string;
  nom: string;
}

export const serviceApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createService: builder.mutation<Service, CreateServiceRequest>({
      query: (serviceData) => ({
        url: '/services',
        method: 'POST',
        body: serviceData,
      }),
      invalidatesTags: ['Service'],
    }),

    getServices: builder.query<Service[], void>({
      query: () => '/services',
      providesTags: ['Service'],
    }),

    getServiceById: builder.query<Service, string>({
      query: (id) => `/services/${id}`,
      providesTags: ['Service'],
    }),

    updateService: builder.mutation<Service, UpdateServiceRequest>({
      query: ({ id, nom }) => ({
        url: `/services/${id}`,
        method: 'PUT',
        body: { nom },
      }),
      invalidatesTags: ['Service'],
    }),

    deleteService: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/services/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),

    getServicesByChurch: builder.query<Service[], string>({
      query: (churchId) => `/services/church/${churchId}`,
      providesTags: ['Service'],
    }),
  }),
  overrideExisting: true
});

export const {
  useCreateServiceMutation,
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetServicesByChurchQuery,
} = serviceApi;