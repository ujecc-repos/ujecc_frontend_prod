import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface MessageUser {
  id: string;
  firstname: string;
  lastname: string;
  email?: string | null;
  role: string;
  picture?: string | null;
  church?: { name: string } | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  senderId: string;
  sender: MessageUser;
}

export interface Conversation {
  id: string;
  title?: string | null;
  isGroup: boolean;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage?: ChatMessage | null;
  participants: Array<{
    conversationId: string;
    userId: string;
    joinedAt: string;
    lastReadAt: string;
    user: MessageUser;
  }>;
}

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL || '/api'}/messages`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token');
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

export const messageApi = createApi({
  reducerPath: 'messageApi',
  baseQuery,
  tagTypes: ['Conversation', 'Message', 'MessageUser'],
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], void>({
      query: () => '/conversations',
      providesTags: (result) => result
        ? [
            ...result.map(({ id }) => ({ type: 'Conversation' as const, id })),
            { type: 'Conversation', id: 'LIST' },
          ]
        : [{ type: 'Conversation', id: 'LIST' }],
    }),
    getConversationMessages: builder.query<ChatMessage[], string>({
      query: (conversationId) => `/conversations/${conversationId}/messages`,
      providesTags: (_result, _error, id) => [{ type: 'Message', id }],
    }),
    searchMessageUsers: builder.query<MessageUser[], string>({
      query: (search) => ({ url: '/users', params: search ? { search } : undefined }),
      providesTags: ['MessageUser'],
    }),
    startConversation: builder.mutation<{ id: string }, string>({
      query: (participantId) => ({
        url: '/conversations',
        method: 'POST',
        body: { participantId },
      }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    createGroupConversation: builder.mutation<{ id: string }, { title: string; participantIds: string[] }>({
      query: (body) => ({
        url: '/conversations/groups',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    addGroupParticipants: builder.mutation<Conversation, { conversationId: string; participantIds: string[] }>({
      query: ({ conversationId, participantIds }) => ({
        url: `/conversations/${conversationId}/participants`,
        method: 'POST',
        body: { participantIds },
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    removeGroupParticipant: builder.mutation<void, { conversationId: string; participantId: string }>({
      query: ({ conversationId, participantId }) => ({
        url: `/conversations/${conversationId}/participants/${participantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    deleteConversation: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(conversationId, { dispatch, queryFulfilled }) {
        const conversationPatch = dispatch(
          messageApi.util.updateQueryData('getConversations', undefined, (draft) => {
            const index = draft.findIndex((conversation) => conversation.id === conversationId);
            if (index >= 0) draft.splice(index, 1);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          conversationPatch.undo();
        }
      },
      invalidatesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    sendMessage: builder.mutation<ChatMessage, { conversationId: string; content: string; attachment?: File | null }>({
      query: ({ conversationId, content, attachment }) => {
        const body = new FormData();
        body.append('content', content);
        if (attachment) body.append('attachment', attachment);
        return {
          url: `/conversations/${conversationId}/messages`,
          method: 'POST',
          body,
        };
      },
      async onQueryStarted({ conversationId, content, attachment }, { dispatch, queryFulfilled }) {
        let storedUser: Partial<MessageUser> = {};
        try {
          storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
          storedUser = {};
        }

        const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const now = new Date().toISOString();
        const optimisticMessage: ChatMessage = {
          id: optimisticId,
          content,
          attachmentName: attachment?.name ?? null,
          attachmentType: attachment?.type ?? null,
          attachmentUrl: null,
          createdAt: now,
          updatedAt: now,
          conversationId,
          senderId: storedUser.id || 'current-user',
          sender: {
            id: storedUser.id || 'current-user',
            firstname: storedUser.firstname || '',
            lastname: storedUser.lastname || '',
            email: storedUser.email,
            role: storedUser.role || 'Membre',
            picture: storedUser.picture,
          },
        };

        const optimisticPatch = dispatch(
          messageApi.util.updateQueryData('getConversationMessages', conversationId, (draft) => {
            draft.push(optimisticMessage);
          })
        );

        try {
          const { data: savedMessage } = await queryFulfilled;
          dispatch(messageApi.util.updateQueryData('getConversationMessages', conversationId, (draft) => {
            const optimisticIndex = draft.findIndex(message => message.id === optimisticId);
            if (optimisticIndex >= 0) draft[optimisticIndex] = savedMessage;
          }));
        } catch {
          optimisticPatch.undo();
        }
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    editMessage: builder.mutation<ChatMessage, { conversationId: string; messageId: string; content: string }>({
      query: ({ conversationId, messageId, content }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: 'PATCH',
        body: { content },
      }),
      async onQueryStarted({ conversationId, messageId, content }, { dispatch, queryFulfilled }) {
        const messagePatch = dispatch(
          messageApi.util.updateQueryData('getConversationMessages', conversationId, (draft) => {
            const message = draft.find((item) => item.id === messageId);
            if (message) {
              message.content = content;
              message.updatedAt = new Date().toISOString();
            }
          })
        );

        try {
          const { data: savedMessage } = await queryFulfilled;
          dispatch(messageApi.util.updateQueryData('getConversationMessages', conversationId, (draft) => {
            const index = draft.findIndex((message) => message.id === messageId);
            if (index >= 0) draft[index] = savedMessage;
          }));
        } catch {
          messagePatch.undo();
        }
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    deleteMessage: builder.mutation<void, { conversationId: string; messageId: string }>({
      query: ({ conversationId, messageId }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ conversationId, messageId }, { dispatch, queryFulfilled }) {
        const messagePatch = dispatch(
          messageApi.util.updateQueryData('getConversationMessages', conversationId, (draft) => {
            const index = draft.findIndex((message) => message.id === messageId);
            if (index >= 0) draft.splice(index, 1);
          })
        );

        try {
          await queryFulfilled;
        } catch {
          messagePatch.undo();
        }
      },
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
    markConversationRead: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Conversation', id }],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSearchMessageUsersQuery,
  useStartConversationMutation,
  useCreateGroupConversationMutation,
  useAddGroupParticipantsMutation,
  useRemoveGroupParticipantMutation,
  useDeleteConversationMutation,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useMarkConversationReadMutation,
} = messageApi;
