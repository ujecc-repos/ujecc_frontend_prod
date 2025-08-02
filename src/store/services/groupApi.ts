import { authApi } from './authApi';

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

interface CreateGroupRequest {
  name: string;
  description?: string;
  churchId?: string;
  [index: string]: any
}


interface UpdateGroupRequest {
  id: string;
  name?: string;
  description?: string;
  maxAge?: string;
  minAge?: string;
  meetingDay?: string;
  metingTime?: string;
  meetingLocation?: string;
  meetingFrequency?: string;
  maxMembers?: string;
  minister?: string
}

interface AddUserToGroupRequest {
  groupId: string;
  userId: string;
}

interface TransferUserRequest {
  sourceGroupId: string;
  userId: string;
  targetGroupId: string;
}

export const groupApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    createGroup: builder.mutation<Group, CreateGroupRequest | FormData>({
      query: (groupData) => {
        // Check if groupData is FormData (for image uploads)
        const isFormData = groupData instanceof FormData;
        
        return {
          url: '/groups',
          method: 'POST',
          body: groupData,
          // Set the appropriate Content-Type header based on the data type
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
          formData: isFormData,
        };
      },
      invalidatesTags: ['Group'],
    }),

    getGroups: builder.query<Group[], void>({
      query: () => '/groups',
      providesTags: ['Group'],
    }),

    getGroupById: builder.query<Group, string>({
      query: (id) => `/groups/${id}`,
      providesTags: ["Group"],
    }),

    getGroupsByChurch: builder.query<Group[], string>({
      query: (churchId) => `/groups/church/${churchId}`,
      providesTags: ['Group'],
    }),

    updateGroup: builder.mutation<Group, UpdateGroupRequest | FormData>({      query: (groupData) => {
        // Check if groupData is FormData (for image uploads)
        const isFormData = groupData instanceof FormData;
        
        // Extract id from groupData
        const id = isFormData 
          ? groupData.get('id') 
          : (groupData as UpdateGroupRequest).id;
        
        return {
          url: `/groups/${id}`,
          method: 'PUT',
          // Don't set Content-Type when using FormData - browser will set it with boundary
          headers: isFormData ? {} : { 'Content-Type': 'application/json' },
          body: isFormData ? groupData : { ...(groupData as UpdateGroupRequest), id: undefined },
        };
      },
      invalidatesTags: ["Group"]
    }),

    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Group'],
    }),

    addUserToGroup: builder.mutation<Group, AddUserToGroupRequest>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/users`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: ["Group"],
    }),

    removeUserFromGroup: builder.mutation<Group, AddUserToGroupRequest>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["Group"],
    }),

    transferUserBetweenGroups: builder.mutation<{message: string, targetGroup: Group}, TransferUserRequest>({
      query: ({ sourceGroupId, userId, targetGroupId }) => ({
        url: `/groups/${sourceGroupId}/transfer/${userId}`,
        method: 'POST',
        body: { targetGroupId },
      }),
      invalidatesTags:["Group"]
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateGroupMutation,
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useGetGroupsByChurchQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddUserToGroupMutation,
  useRemoveUserFromGroupMutation,
  useTransferUserBetweenGroupsMutation,
} = groupApi;