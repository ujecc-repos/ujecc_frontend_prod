import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Now, your User interface:
export type Role = 'Membre' | 'Admin' | 'Directeur' | 'SuperAdmin';

interface church {
  id: string;
  name: string;
  address?: string;
  mainPasteur?: string;
  phone?: string;
}

export interface User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  joinDate?: string | null;
  email: string;
  civilState?: string;
  firstname: string;
  lastname: string;
  password: string;
  profession?: string;
  sundayClass?: string;
  membreActif: boolean;
  age?: string;
  mobilePhone?: string;
  homePhone?: string;
  picture?: string;
  role?: string;
  city?: string;
  etatCivil?: string;
  spouseFullName?: string;
  personToContact?: string;
  country?: string;
  minister: string;
  birthCountry?: string;
  birthCity?: string;
  birthDate?: string;
  sex?: string;
  addressLine?: string;
  envelopeNumber?: string;
  baptismLocation?: string;
  baptismDate?: string;
  church: church;
  facebook?: string
  plainPassword?: string;
}

interface LoginRequest {
  email: string;
  password: string;

}

interface LoginResponse {
  token: string;
  user: {
    role: string;
  }
}

interface RegisterRequest {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  churchId?: string;
  [key: string]: any;
}

interface UpdateUserRequest {
  id: string;
  [key: string]: any;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  keepUnusedDataFor: 3600,
  refetchOnFocus: true,
  baseQuery: fetchBaseQuery({
    // baseUrl: 'http://localhost:4000/api',
    baseUrl: 'https://ujecc-backend.onrender.com/api',
    prepareHeaders: async (headers, { getState }) => {
      console.log(getState)

        try {
            const token = await localStorage.getItem('token');
            console.log("token : ", token)
            if (token) {
              headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
          } catch (error) {
            console.error('Error getting token from AsyncStorage:', error);
            return headers;
          }

    },
  }),
  tagTypes: ['User', "Pasteur", "Sanction", "Transfer", "Moisson", "Ministry", "Mission", "SundayClass", "Appointment", "Church", "Event", "Group", "Baptism", "Expense", "Funeral", "Committee", "Death", "Donation", "Offering", "Marriage", "Presentation", "Tithe"],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/users/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    changePassword: builder.mutation<{ message: string }, { id: string, oldPassword: string, newPassword: string }>({
      query: (data) => ({
        url: `/users/change-password/${data.id}`,
        method: 'PUT',
        body: { oldPassword: data.oldPassword, newPassword: data.newPassword },
      }),
      invalidatesTags: ['User'],
    }),

    register: builder.mutation<User, RegisterRequest | FormData>({
      query: (userData) => {
        // Check if userData is FormData (for image uploads)
        const isFormData = userData instanceof FormData;
        
        return {
          url: '/users',
          method: 'POST',
          // Don't set Content-Type when using FormData - browser will set it with boundary
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
          body: userData,
        };
      },
      invalidatesTags: ['User'],
    }),

    getLogout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: `/users/logout`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),

    getUsers: builder.query<User[], void>({
      query: () => '/users/allusers',
      providesTags: ['User'],
    }),

    // get users and administrators
    getUsersAndAdministrators: builder.query<User[], void>({
      query: () => '/users/directors/administrators',
      providesTags: ['User'],
    }),

    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: ["User"],
    }),

    getUserByToken: builder.query<User, void>({
      query: () => `/users/userbytoken/token`,
      providesTags: ["User"],
    }),

    updateUser: builder.mutation<User, UpdateUserRequest | FormData>({      query: (userData) => {
        // Check if userData is FormData (for image uploads)
        const isFormData = userData instanceof FormData;
        
        // Extract id from userData
        const id = isFormData 
          ? userData.get('id') 
          : (userData as UpdateUserRequest).id;
        
        // Remove id from body if it's not FormData
        // const body = isFormData 
        //   ? userData 
        //   : { ...(userData as UpdateUserRequest), id: undefined };
        
        return {
          url: `/users/${id}`,
          method: 'PUT',
          // Don't set Content-Type when using FormData - browser will set it with boundary
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
          body: isFormData ? userData : { ...(userData as UpdateUserRequest), id: undefined },
        };
      },
      invalidatesTags: ['User', 'Transfer'],   
    }),

    deleteUser: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    getUsersByChurch: builder.query<User[], string>({
      query: (churchId) => `/users/church/${churchId}`,
      providesTags: ['User'],
    }),
    
    getUpcomingBirthdays: builder.query<User[], { churchId: string, days?: number }>({      query: ({ churchId, days = 30 }) => `/users/birthdays/upcoming/${churchId}?days=${days}`,
      providesTags: ['User'],
      transformResponse: (response: any) => {
        // Extract users from the response object
        const users = response.users || [];
        
        // Ensure all users have the required properties
        return users.map((user: any) => ({
          ...user,
          // Ensure birthDate is defined or null, not undefined
          birthDate: user.birthDate || null
        }));
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUsersByChurchQuery,
  useGetUserByTokenQuery,
  useGetUpcomingBirthdaysQuery,
  useGetUsersAndAdministratorsQuery,
  useGetLogoutMutation,
  useChangePasswordMutation,
} = authApi;