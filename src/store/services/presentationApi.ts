import { authApi } from './authApi';

interface Presentation {
  id: string;
  presentationDate: string;
  childName: string;
  dateOfBirth: string;
  placeOfBirth: string;
  fatherName: string;
  motherName: string;
  officiantName: string;
  address: string;
  phone: string;
  witness: string;
  description: string;
  birthCertificate?: string;
  churchId: string;
  church?: any;
  status?: 'pending' | 'completed';
}

interface CreatePresentationDto {
    childName: string;
    presentationDate: string; // likely YYYY-MM-DD format
    dateOfBirth: string;     // likely YYYY-MM-DD format
    placeOfBirth: string;
    fatherName: string;
    motherName: string;
    officiantName: string;
    address: string;
    phone: string;
    witness: string;
    description: string;
    churchId: string;
}

export const presentationApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getPresentations: builder.query<Presentation[], void>({
      query: () => '/presentations',
      providesTags: ['Presentation'],
    }),

    getPresentation: builder.query<Presentation, string>({
      query: (id) => `/presentations/${id}`,
      providesTags: ['Presentation'],
    }),

    getPresentationsByChurch: builder.query<Presentation[], string>({
      query: (churchId) => `/presentations/church/${churchId}`,
      providesTags: ['Presentation'],
    }),

    getPresentationsByDateRange: builder.query<
      Presentation[],
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) =>
        `/presentations/date-range?startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Presentation'],
    }),

    createPresentation: builder.mutation<Presentation, FormData | CreatePresentationDto>({
      query: (presentation) => ({
        url: '/presentations',
        method: 'POST',
        body: presentation,
        formData: true, // Indicates to RTK Query that we're sending FormData
      }),
      invalidatesTags: ['Presentation'],
    }),

    updatePresentation: builder.mutation<
      Presentation,
      { id: string; presentation: Partial<CreatePresentationDto> }
    >({
      query: ({ id, presentation }) => ({
        url: `/presentations/${id}`,
        method: 'PUT',
        body: presentation,
      }),
      invalidatesTags: ['Presentation'],
    }),

    deletePresentation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/presentations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Presentation'],
    }),

    downloadBirthCertificate: builder.query<Blob, string>({
      query: (id) => ({
        url: `/presentations/${id}/certificate`,
        method: 'GET',
        responseHandler: async (response) => await response.blob(),
      }),
    }),
  }),
});

export const {
  useGetPresentationsQuery,
  useGetPresentationQuery,
  useGetPresentationsByChurchQuery,
  useGetPresentationsByDateRangeQuery,
  useCreatePresentationMutation,
  useUpdatePresentationMutation,
  useDeletePresentationMutation,
  useLazyDownloadBirthCertificateQuery,
} = presentationApi;