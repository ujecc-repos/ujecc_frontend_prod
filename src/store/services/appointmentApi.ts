import { authApi } from "./authApi";

interface Appointment {
  id: string;
  name: string;
  visibility: string;
  description: string;
  endPeriod?: string;
  startPeriode?: string;
  startDate?: string;
  endDate?: string;
  time: string;
  duration: string;
  notes: string;
  assignedUsers: User[];
  churchId?: string;
}

interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface CreateAppointmentRequest {
  name: string;
  visibility: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
  userIds: string[];
  churchId?: string;
}

export const appointmentApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createAppointment: builder.mutation<Appointment, CreateAppointmentRequest>({
      query: (appointment) => ({
        url: '/appointments',
        method: 'POST',
        body: appointment,
      }),
      invalidatesTags: ['Appointment'],
    }),
    getAppointments: builder.query<Appointment[], void>({
      query: () => '/appointments',
      providesTags: ['Appointment'],
    }),
    getAppointmentById: builder.query<Appointment, string>({
      query: (id) => `/appointments/${id}`,
      providesTags: ['Appointment'],
    }),
    updateAppointment: builder.mutation<Appointment, { id: string } & CreateAppointmentRequest>({
      query: ({ id, ...appointment }) => ({
        url: `/appointments/${id}`,
        method: 'PUT',
        body: appointment,
      }),
      invalidatesTags: ['Appointment'],
    }),
    deleteAppointment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/appointments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Appointment'],
    }),
    getAppointmentsByChurch: builder.query<Appointment[], string>({
      query: (churchId) => `/appointments/church/${churchId}`,
      providesTags: ['Appointment'],
    }),
  }),
});

export const {
  useCreateAppointmentMutation,
  useGetAppointmentsQuery,
  useGetAppointmentByIdQuery,
  useUpdateAppointmentMutation,
  useDeleteAppointmentMutation,
  useGetAppointmentsByChurchQuery,
} = appointmentApi;