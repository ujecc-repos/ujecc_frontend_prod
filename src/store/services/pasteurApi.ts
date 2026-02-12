import { authApi } from "./authApi";

interface Pasteur {
  id: string;
  pasteurName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  church?: any;
}

interface CreatePasteurRequest {
  pasteurName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  [index: string]: string;
}

interface TotalPasteurs {
  total: number;
}

export const pasteurApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getPasteurs: builder.query<Pasteur[], void>({
      query: () => '/pasteurs',
      providesTags: ["Pasteur"]
    }),

    getPasteurById: builder.query<Pasteur, string>({
      query: (id) => `/pasteurs/${id}`,
      providesTags: ['Pasteur'],
    }),

    createPasteur: builder.mutation<Pasteur, CreatePasteurRequest>({
      query: (pasteur) => ({
        url: '/pasteurs',
        method: 'POST',
        body: pasteur,
      }),
      invalidatesTags: ['Pasteur'],
    }),

    updatePasteur: builder.mutation<Pasteur, { id: string; pasteur: Partial<CreatePasteurRequest> }>({
      query: ({ id, pasteur }) => ({
        url: `/pasteurs/${id}`,
        method: 'PUT',
        body: pasteur,
      }),
      invalidatesTags: ['Pasteur'],
    }),

    deletePasteur: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/pasteurs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Pasteur'],
    }),

    getPasteursByChurch: builder.query<Pasteur[], string>({
      query: (churchId) => `/pasteurs/church/${churchId}`,
      providesTags: ['Pasteur'],
    }),
    getTotalPasteurs: builder.query<TotalPasteurs, void>({
      query: () => `/pasteurs/admin/total-pasteurs`,
      providesTags: ['Pasteur'],
    }),
  }),
  overrideExisting: true
});

export const {
  useGetPasteursQuery,
  useGetPasteurByIdQuery,
  useCreatePasteurMutation,
  useUpdatePasteurMutation,
  useDeletePasteurMutation,
  useGetPasteursByChurchQuery,
  useGetTotalPasteursQuery,
} = pasteurApi;