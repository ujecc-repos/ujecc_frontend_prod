import { authApi } from './authApi';

interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startPeriode?: string;
  endPeriode?: string;
  location?: string;
  churchId: string;
  church?: any;
  attendees?: any[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  type?: string;
  isRecurring?: boolean;
  frequency?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startPeriode?: string;
  endPeriode?: string;
  frequency?: string;
  location?: string;
  churchId?: string;
  [key: string]: any;
}

interface UpdateEventRequest {
  id: string;
  [key: string]: any;
}

export const eventApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createEvent: builder.mutation<Event, CreateEventRequest>({
      query: (eventData) => ({
        url: '/events',
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: ['Event'],
    }),

    getEvents: builder.query<Event[], void>({
      query: () => '/events',
      providesTags: ['Event'],
    }),

    getEventById: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: (result, error, id) => [{ type: 'Event', id }],
    }),

    updateEvent: builder.mutation<Event, UpdateEventRequest>({
      query: ({ id, ...patch }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ["Event"],
    }),

    deleteEvent: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Event'],
    }),

    getEventsByChurch: builder.query<Event[], string>({
      query: (churchId) => `/events/church/${churchId}`,
      providesTags: ['Event'],
    }),

    getUpcomingEvents: builder.query<Event[], void>({
      query: () => '/events/upcoming/all',
      providesTags: ['Event'],
    }),
  }),
  overrideExisting: true
});

export const {
  useCreateEventMutation,
  useGetEventsQuery,
  useGetEventByIdQuery,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetEventsByChurchQuery,
  useGetUpcomingEventsQuery,
} = eventApi;