import { authApi } from "./authApi";
import type {User} from "./authApi"

interface Pasteur {
  id: string;
  pasteurName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  church?: any;
}


interface CreateMissionRequest {
  missionName: string;
  description: string;
  status: string;
  location: string;
  presidentName?: string;
}

interface Mission {
  id: string;
  missionName: string;
  description: string;
  status: string;
  location: string;
  presidentName?: string;
  church?: any;
}

interface ChurchStatistics {
  membership: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    maleMembers: number;
    femaleMembers: number;
  };
  sacraments: {
    baptismsTotal: number;
    baptismsThisYear: number;
    marriagesTotal: number;
    marriagesThisYear: number;
    funeralsTotal: number;
    funeralsThisYear: number;
    deathsTotal: number;
    deathsThisYear: number;
  };
  transfers: {
    total: number;
    incoming: number;
    outgoing: number;
  };
  leadership: {
    totalPastors: number;
    activePastors: number;
  };
  finances: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    revenueBreakdown: {
      tithing: number;
      donations: number;
      offerings: number;
      moissons: number;
    };
  };
}

interface ChurchWithStats {
  id: string;
  name: string;
  address: string;
  phone: string;
  picture: string;
  statistics: ChurchStatistics;
}

interface MissionStats {
  totalChurches: number;
  totalMembers: number;
  totalPastors: number;
  totalBaptisms: number;
  baptismsThisYear: number;
  totalFunerals: number;
  funeralsThisYear: number;
  totalTransfers: number;
  transfersIn: number;
  transfersOut: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface MissionByPresidentResponse {
  id: string;
  missionName: string;
  description: string;
  startDate: string;
  status: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  statistics: MissionStats;
  churches: ChurchWithStats[];
  year: number;
}


export interface Group {
  id: string;
  name: string;
  description?: string;
  church?: any;
  users?: any[];
  ageGroup: string;
  meetingDays?: string;
  meetingTime?: string;
  meetingLocation?: string;
  meetingFrequency?: string;
  maxMembers?: string;
  minister?: string;
  picture?: string;
  createdAt: string;
  updatedAt: string;
}

export const missionApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    getMissions: builder.query<Mission[], void>({
      query: () => '/missions',
      providesTags: ['Mission'],
    }),
    
    getPeopleByPresident: builder.query<User[], string>({
      query: (presidentName) => `/missions/people/${presidentName}`,
      providesTags: ['User'],
    }),

    getGroupsByPresident: builder.query<Group[], string>({
      query: (presidentName) => `/missions/groups/${presidentName}`,
      providesTags: ['Group'],
    }),

    getPasteursByPresident: builder.query<Pasteur[], string>({
      query: (presidentName) => `/missions/pasteurs/${presidentName}`,
      providesTags: ['Mission'],
    }),

    getMissionById: builder.query<Mission, string>({
      query: (id) => `/missions/${id}`,
      providesTags: ['Mission'],
    }),

    getMissionByPresident: builder.query<MissionByPresidentResponse, { presidentName: string; year?: number }>({
      query: ({ presidentName, year }) => {
        const queryParams = year ? `?year=${year}` : '';
        return `/missions/president/${presidentName}${queryParams}`;
      },
      providesTags: ['Mission'],
    }),

    createMission: builder.mutation<Mission, CreateMissionRequest>({
      query: (mission) => ({
        url: '/missions',
        method: 'POST',
        body: mission,
      }),
      invalidatesTags: ['Mission'],
    }),

    updateMission: builder.mutation<Mission, { id: string; mission: Partial<CreateMissionRequest> }>({
      query: ({ id, mission }) => ({
        url: `/missions/${id}`,
        method: 'PUT',
        body: mission,
      }),
      invalidatesTags: ['Mission'],
    }),

    deleteMission: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/missions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Mission'],
    }),
  }),
  overrideExisting: true,
});



export const {
  useGetMissionsQuery,
  useGetMissionByIdQuery,
  useGetMissionByPresidentQuery,
  useCreateMissionMutation,
  useUpdateMissionMutation,
  useDeleteMissionMutation,
  useGetPeopleByPresidentQuery,
  useGetGroupsByPresidentQuery,
  useGetPasteursByPresidentQuery,
} = missionApi;