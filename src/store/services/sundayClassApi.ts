import { authApi } from './authApi';

interface SundayClass {
  id: string;
  nom: string;
  teacher: string;
  ageGroup: string;
  startTime: string;
  endTime: string;
  location?: string; // Added to match the interface in sunday-class/[id].tsx
  book?: string;
  maxStudents: number;
  description: string;
  churchId: string;
  church?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateSundayClassRequest {
  nom: string;
  teacher: string;
  ageGroup: string
  startTime: string;
  endTime: string;
  book: string;
  location?: string; // Added to match the interface in sunday-class/[id].tsx
  maxStudents: string;
  description: string;
  churchId: string;
}

interface UpdateSundayClassRequest {
  id: string;
  [key: string]: any;
}

export const sundayClassApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createSundayClass: builder.mutation<SundayClass, CreateSundayClassRequest>({
      query: (sundayClassData) => ({
        url: '/sunday-classes',
        method: 'POST',
        body: sundayClassData,
      }),
      invalidatesTags: ['SundayClass'],
    }),

    getSundayClasses: builder.query<SundayClass[], void>({
      query: () => '/sunday-classes',
      providesTags: ['SundayClass'],
    }),

    getSundayClassById: builder.query<SundayClass, string>({
      query: (id) => `/sunday-classes/${id}`,
      providesTags: (result, error, id) => [{ type: 'SundayClass', id }],
    }),

    updateSundayClass: builder.mutation<SundayClass, UpdateSundayClassRequest>({
      query: ({ id, ...patch }) => ({
        url: `/sunday-classes/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['SundayClass'],
    }),

    deleteSundayClass: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/sunday-classes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SundayClass'],
    }),

    getSundayClassesByChurch: builder.query<
      SundayClass[],
      { churchId: string }
    >({
      query: ({ churchId }) => `/sunday-classes/church/${churchId}`,
      providesTags: ['SundayClass'],
    }),
  }),
  overrideExisting: true
});

export const {
  useCreateSundayClassMutation,
  useGetSundayClassesQuery,
  useGetSundayClassByIdQuery,
  useUpdateSundayClassMutation,
  useDeleteSundayClassMutation,
  useGetSundayClassesByChurchQuery,
} = sundayClassApi;