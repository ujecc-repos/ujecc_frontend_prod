import { authApi } from './authApi';

export interface Transfer {
  id: string;
  type: string;
  fromChurchId: string;
  toChurchId: string;
  userId: string;
  fromChurch?: any;
  toChurch?: any;
  member?: {
    firstname: string;
    lastname: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferRequest {
  userId: string;
  fromChurchId: string;
  toChurchId: string;
  type: string;
}

const extendedApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new transfer
    createTransfer: builder.mutation<Transfer, CreateTransferRequest>({
      query: (transferData) => ({
        url: '/transfers',
        method: 'POST',
        body: transferData,
      }),
      invalidatesTags: ['Transfer', 'User', 'Church'],
    }),

    // Get all transfers
    getTransfers: builder.query<Transfer[], void>({
      query: () => '/transfers',
      transformResponse: (response: Transfer[]) => {
        return response;
      },
      providesTags: ['Transfer'],
    }),

    // Get transfers by church ID (either as source or destination)
    getTransfersByChurch: builder.query<Transfer[], string>({
      query: (churchId) => `/transfers/church/${churchId}`,
      transformResponse: (response: Transfer[]) => {
        return response;
      },
      providesTags: ['Transfer'],
    }),

    // Get a single transfer by ID
    getTransferById: builder.query<Transfer, string>({
      query: (id) => `/transfers/${id}`,
      transformResponse: (response: Transfer) => {
        return response;
      },
      providesTags: ['Transfer'],
    }),
  }),
});

export const {
  useCreateTransferMutation,
  useGetTransfersQuery,
  useGetTransfersByChurchQuery,
  useGetTransferByIdQuery,
} = extendedApi;