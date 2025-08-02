import { authApi } from './authApi';

interface Marriage {
  id: string;
  brideFullname: string;
  birthDate: string;
  groomFullname: string;
  goomBirthDate: string; // Notez que c'est 'goom' et non 'groom' dans le backend
  weddingDate: string;
  weddingLocation: string;
  weddingCertificate?: string;
  brideCertificate?: string;
  grooomCertificate?: string; // Notez les trois 'o'
  officiantName: string;
  civilStateOfficer: string;
  witnessSignature: string;
  churchId: string;
  church?: any;
  status?: "en attente" | "complèt"
}

// Pour les requêtes normales JSON
interface CreateMarriageDto {
  brideFullname: string;
  birthDate: string;
  groomFullname: string;
  goomBirthDate: string; // Notez que c'est 'goom' et non 'groom' dans le backend
  weddingDate: string;
  weddingLocation: string;
  weddingCertificate?: string;
  brideCertificate?: string;
  grooomCertificate?: string; // Notez les trois 'o'
  officiantName: string;
  civilStateOfficer: string;
  witnessSignature: string;
  churchId: string;
  status?: "en attente" | "complèt"
}

export const mariageApi = authApi.injectEndpoints({
//   reducerPath: 'mariageApi',
//   baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000/api' }),
  endpoints: (builder) => ({
    getMarriages: builder.query<Marriage[], void>({
      query: () => '/mariages',
      providesTags: ['Marriage'],
    }),

    getMarriage: builder.query<Marriage, string>({
      query: (id) => `/mariages/${id}`,
      providesTags: ['Marriage'],
    }),

    createMarriage: builder.mutation<Marriage, FormData | CreateMarriageDto>({
      query: (marriage) => ({
        url: '/mariages',
        method: 'POST',
        body: marriage,
        formData: true, // Indique à RTK Query que nous envoyons FormData
      }),
      invalidatesTags: ['Marriage'],
    }),

    updateMarriage: builder.mutation<Marriage, { id: string; marriage: FormData | Partial<CreateMarriageDto> }>({
      query: ({ id, marriage }) => ({
        url: `/mariages/${id}`,
        method: 'PUT',
        body: marriage,
        formData: marriage instanceof FormData, // Indique à RTK Query que nous envoyons FormData si c'est le cas
      }),
      invalidatesTags: ['Marriage'],
    }),

    deleteMarriage: builder.mutation<void, string>({
      query: (id) => ({
        url: `/mariages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Marriage'],
    }),
    
    getMarriagesByChurch: builder.query<Marriage[], string>({
      query: (churchId) => `/mariages/mariage/church/${churchId}`,
      providesTags: ['Marriage'],
    }),
  }),
  overrideExisting: true
});

export const {
  useGetMarriagesQuery,
  useGetMarriageQuery,
  useCreateMarriageMutation,
  useUpdateMarriageMutation,
  useDeleteMarriageMutation,
  useGetMarriagesByChurchQuery,
} = mariageApi;