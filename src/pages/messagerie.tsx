import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { useGetUserByTokenQuery } from '../store/services/authApi';
import {
  type Conversation,
  type MessageUser,
  useAddGroupParticipantsMutation,
  useCreateGroupConversationMutation,
  useDeleteConversationMutation,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useGetConversationMessagesQuery,
  useGetConversationsQuery,
  useMarkConversationReadMutation,
  useRemoveGroupParticipantMutation,
  useSearchMessageUsersQuery,
  useSendMessageMutation,
  useStartConversationMutation,
} from '../store/services/messageApi';

const imageBaseUrl = import.meta.env.VITE_API_URL_PHOTO || 'http://localhost:3000';

const initials = (user?: MessageUser | null) =>
  `${user?.firstname?.[0] ?? ''}${user?.lastname?.[0] ?? ''}`.toUpperCase() || 'EC';

const fullName = (user?: MessageUser | null) =>
  user ? `${user.firstname} ${user.lastname}`.trim() : 'Utilisateur Ecclesys';

const formatTime = (value: string) => new Intl.DateTimeFormat('fr-HT', {
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));

const formatConversationDate = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return formatTime(value);
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return new Intl.DateTimeFormat('fr-HT', { day: '2-digit', month: 'short' }).format(date);
};

const formatDay = (value: string) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  return new Intl.DateTimeFormat('fr-HT', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
};

function Avatar({ user, size = 'md' }: { user?: MessageUser | null; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'h-12 w-12 text-sm' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm';
  return (
    <div className={`${dimensions} relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-sm`}>
      {user?.picture ? (
        <img src={`${imageBaseUrl}${user.picture}`} alt={fullName(user)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-bold tracking-wide">{initials(user)}</div>
      )}
    </div>
  );
}

function GroupAvatar({ title, size = 'md' }: { title?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <div className={`${dimensions} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-teal-600 text-white shadow-sm`} title={title || 'Groupe'}>
      <UserGroupIcon className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
    </div>
  );
}

const otherParticipant = (conversation: Conversation | undefined, currentUserId?: string) =>
  conversation?.participants.find((participant) => participant.userId !== currentUserId)?.user
  ?? conversation?.participants[0]?.user;

export default function Messagerie() {
  const { data: currentUser } = useGetUserByTokenQuery();
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    isError: conversationsError,
    refetch: refetchConversations,
  } = useGetConversationsQuery(undefined, { pollingInterval: 8000, refetchOnFocus: true });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversationSearch, setConversationSearch] = useState('');
  const [composer, setComposer] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [groupManagementOpen, setGroupManagementOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupUserSearch, setGroupUserSearch] = useState('');
  const [debouncedGroupUserSearch, setDebouncedGroupUserSearch] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<MessageUser[]>([]);
  const [managementSearch, setManagementSearch] = useState('');
  const [debouncedManagementSearch, setDebouncedManagementSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [conversationMenuOpen, setConversationMenuOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [confirmation, setConfirmation] = useState<
    | { type: 'conversation'; id: string }
    | { type: 'message'; conversationId: string; messageId: string }
    | null
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiAreaRef = useRef<HTMLDivElement>(null);
  const conversationMenuRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === selectedId);
  const activeContact = otherParticipant(activeConversation, currentUser?.id);
  const isActiveGroupOwner = Boolean(activeConversation?.isGroup && activeConversation.ownerId === currentUser?.id);
  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useGetConversationMessagesQuery(selectedId ?? '', {
    skip: !selectedId,
    pollingInterval: 5000,
    refetchOnFocus: true,
  });
  const { data: availableUsers = [], isLoading: usersLoading, isFetching: usersFetching } = useSearchMessageUsersQuery(debouncedUserSearch, {
    skip: !newConversationOpen || debouncedUserSearch.length < 2,
  });
  const { data: groupSearchUsers = [], isFetching: groupUsersFetching } = useSearchMessageUsersQuery(debouncedGroupUserSearch, {
    skip: !newGroupOpen || debouncedGroupUserSearch.length < 2,
  });
  const { data: managementSearchUsers = [], isFetching: managementUsersFetching } = useSearchMessageUsersQuery(debouncedManagementSearch, {
    skip: !groupManagementOpen || debouncedManagementSearch.length < 2,
  });
  const [startConversation, { isLoading: isStarting }] = useStartConversationMutation();
  const [createGroupConversation, { isLoading: isCreatingGroup }] = useCreateGroupConversationMutation();
  const [addGroupParticipants, { isLoading: isAddingGroupMember }] = useAddGroupParticipantsMutation();
  const [removeGroupParticipant, { isLoading: isRemovingGroupMember }] = useRemoveGroupParticipantMutation();
  const [sendMessage] = useSendMessageMutation();
  const [editMessage, { isLoading: isEditingMessage }] = useEditMessageMutation();
  const [deleteMessage, { isLoading: isDeletingMessage }] = useDeleteMessageMutation();
  const [deleteConversation, { isLoading: isDeletingConversation }] = useDeleteConversationMutation();
  const [markRead] = useMarkConversationReadMutation();

  const openNewConversation = () => {
    setUserSearch('');
    setDebouncedUserSearch('');
    setActionError('');
    setNewConversationOpen(true);
  };

  const closeNewConversation = () => {
    setNewConversationOpen(false);
    setUserSearch('');
    setDebouncedUserSearch('');
    setActionError('');
  };

  const openNewGroup = () => {
    setGroupTitle('');
    setGroupUserSearch('');
    setDebouncedGroupUserSearch('');
    setSelectedGroupUsers([]);
    setActionError('');
    setNewGroupOpen(true);
  };

  const closeNewGroup = () => {
    setNewGroupOpen(false);
    setGroupTitle('');
    setGroupUserSearch('');
    setDebouncedGroupUserSearch('');
    setSelectedGroupUsers([]);
    setActionError('');
  };

  useEffect(() => {
    if (!selectedId && conversations.length > 0 && window.innerWidth >= 1024) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    const normalizedSearch = userSearch.trim();
    const timer = window.setTimeout(() => {
      setDebouncedUserSearch(normalizedSearch.length >= 2 ? normalizedSearch : '');
    }, 350);

    return () => window.clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => {
    const normalizedSearch = groupUserSearch.trim();
    const timer = window.setTimeout(() => {
      setDebouncedGroupUserSearch(normalizedSearch.length >= 2 ? normalizedSearch : '');
    }, 350);
    return () => window.clearTimeout(timer);
  }, [groupUserSearch]);

  useEffect(() => {
    const normalizedSearch = managementSearch.trim();
    const timer = window.setTimeout(() => {
      setDebouncedManagementSearch(normalizedSearch.length >= 2 ? normalizedSearch : '');
    }, 350);
    return () => window.clearTimeout(timer);
  }, [managementSearch]);

  useEffect(() => {
    if (selectedId && activeConversation?.unreadCount) {
      markRead(selectedId);
    }
  }, [activeConversation?.unreadCount, markRead, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedId]);

  useEffect(() => {
    if (!emojiPickerOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!emojiAreaRef.current?.contains(event.target as Node)) setEmojiPickerOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEmojiPickerOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [emojiPickerOpen]);

  useEffect(() => {
    if (!conversationMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!conversationMenuRef.current?.contains(event.target as Node)) setConversationMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConversationMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [conversationMenuOpen]);

  useEffect(() => {
    setConversationMenuOpen(false);
    setEditingMessageId(null);
    setEditingContent('');
    setConfirmation(null);
    setGroupManagementOpen(false);
    setManagementSearch('');
    setDebouncedManagementSearch('');
  }, [selectedId]);

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const contact = otherParticipant(conversation, currentUser?.id);
      const conversationName = conversation.isGroup ? conversation.title || 'Groupe' : fullName(contact);
      return `${conversationName} ${contact?.role ?? ''} ${conversation.lastMessage?.content ?? ''}`
        .toLowerCase()
        .includes(query);
    });
  }, [conversationSearch, conversations, currentUser?.id]);

  const handleStartConversation = async (participantId: string) => {
    setActionError('');
    try {
      const conversation = await startConversation(participantId).unwrap();
      setSelectedId(conversation.id);
      setNewConversationOpen(false);
      setUserSearch('');
      setDebouncedUserSearch('');
      await refetchConversations();
    } catch {
      setActionError('Impossible de démarrer cette conversation. Réessayez.');
    }
  };

  const handleCreateGroup = async () => {
    if (groupTitle.trim().length < 2 || selectedGroupUsers.length === 0) return;

    setActionError('');
    try {
      const conversation = await createGroupConversation({
        title: groupTitle.trim(),
        participantIds: selectedGroupUsers.map((user) => user.id),
      }).unwrap();
      closeNewGroup();
      setSelectedId(conversation.id);
      await refetchConversations();
    } catch {
      setActionError('Le groupe n’a pas pu être créé. Vérifiez les participants et réessayez.');
    }
  };

  const handleAddGroupMember = async (participantId: string) => {
    if (!selectedId) return;
    setActionError('');
    try {
      await addGroupParticipants({ conversationId: selectedId, participantIds: [participantId] }).unwrap();
      setManagementSearch('');
      setDebouncedManagementSearch('');
      await refetchConversations();
    } catch {
      setActionError('Cette personne n’a pas pu être ajoutée au groupe.');
    }
  };

  const handleRemoveGroupMember = async (participantId: string) => {
    if (!selectedId) return;
    setActionError('');
    try {
      await removeGroupParticipant({ conversationId: selectedId, participantId }).unwrap();
      await refetchConversations();
    } catch {
      setActionError('Cette personne n’a pas pu être retirée du groupe.');
    }
  };

  const handleSend = async () => {
    if (!selectedId || (!composer.trim() && !attachment)) return;
    const contentToSend = composer.trim();
    const attachmentToSend = attachment;

    setActionError('');
    setComposer('');
    setAttachment(null);
    setEmojiPickerOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      await sendMessage({ conversationId: selectedId, content: contentToSend, attachment: attachmentToSend }).unwrap();
    } catch {
      setActionError("Le message n'a pas pu être envoyé. Vérifiez votre connexion.");
      setComposer(currentValue => currentValue || contentToSend);
      setAttachment(currentValue => currentValue || attachmentToSend);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? composer.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const nextComposer = `${composer.slice(0, selectionStart)}${emojiData.emoji}${composer.slice(selectionEnd)}`;
    const nextCursorPosition = selectionStart + emojiData.emoji.length;

    setComposer(nextComposer);
    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const beginEditingMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
    setActionError('');
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleEditMessage = async (messageId: string, hasAttachment: boolean) => {
    if (!selectedId || (!editingContent.trim() && !hasAttachment)) return;

    setActionError('');
    try {
      await editMessage({
        conversationId: selectedId,
        messageId,
        content: editingContent.trim(),
      }).unwrap();
      cancelEditingMessage();
    } catch {
      setActionError('Le message n’a pas pu être modifié. Réessayez.');
    }
  };

  const handleConfirmedDeletion = async () => {
    if (!confirmation) return;

    setActionError('');
    try {
      if (confirmation.type === 'conversation') {
        await deleteConversation(confirmation.id).unwrap();
        setSelectedId(null);
      } else {
        await deleteMessage({
          conversationId: confirmation.conversationId,
          messageId: confirmation.messageId,
        }).unwrap();
        if (editingMessageId === confirmation.messageId) cancelEditingMessage();
      }
      setConfirmation(null);
    } catch {
      setConfirmation(null);
      setActionError(confirmation.type === 'conversation'
        ? 'La conversation n’a pas pu être supprimée.'
        : 'Le message n’a pas pu être supprimé.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 ">
      <div className="mx-auto flex h-[calc(100vh-6rem)] min-h-[620px] max-w-[1600px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)]">
        <div className="flex min-h-0 flex-1">
          <aside className={`${selectedId ? 'hidden lg:flex' : 'flex'} w-full flex-col border-r border-slate-200 bg-white lg:w-[380px] xl:w-[420px]`}>
            <div className="border-b border-slate-200 px-5 pb-4 pt-5 sm:px-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">Communications</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Messagerie</h1>
                  <p className="mt-1 text-sm text-slate-500">Échangez avec les membres de votre communauté.</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={openNewGroup}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-700 transition hover:-translate-y-0.5 hover:bg-teal-100"
                    aria-label="Nouveau groupe"
                    title="Nouveau groupe"
                  >
                    <UserGroupIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={openNewConversation}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 transition hover:-translate-y-0.5 hover:bg-teal-700"
                    aria-label="Nouvelle conversation"
                    title="Nouveau message"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  placeholder="Rechercher une conversation..."
                  aria-label="Rechercher une conversation"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
                </div>
              ) : conversationsError ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500"><XMarkIcon className="h-7 w-7" /></div>
                  <h2 className="mt-4 font-semibold text-slate-900">Conversations indisponibles</h2>
                  <p className="mt-1 text-sm text-slate-500">Vérifiez la base de données puis réessayez.</p>
                  <button onClick={() => refetchConversations()} className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Réessayer</button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-600"><ChatBubbleLeftRightIcon className="h-8 w-8" /></div>
                  <h2 className="mt-4 font-semibold text-slate-900">{conversationSearch ? 'Aucun résultat' : 'Commencez une conversation'}</h2>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">{conversationSearch ? 'Essayez un autre nom ou contenu.' : 'Contactez un membre, un leader ou un administrateur en toute simplicité.'}</p>
                  {!conversationSearch && <button onClick={openNewConversation} className="mt-5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Nouveau message</button>}
                </div>
              ) : (
                <div className="space-y-1.5 p-3">
                  {filteredConversations.map((conversation) => {
                    const contact = otherParticipant(conversation, currentUser?.id);
                    const conversationName = conversation.isGroup ? conversation.title || 'Groupe' : fullName(contact);
                    const isActive = conversation.id === selectedId;
                    const preview = conversation.lastMessage?.attachmentName
                      ? `📎 ${conversation.lastMessage.attachmentName}`
                      : conversation.lastMessage?.content || 'Nouvelle conversation';
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => { setSelectedId(conversation.id); setActionError(''); }}
                        className={`group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${isActive ? 'bg-teal-50 ring-1 ring-teal-100' : 'hover:bg-slate-50'}`}
                      >
                        <div className="relative">
                          {conversation.isGroup ? <GroupAvatar title={conversation.title} /> : <Avatar user={contact} />}
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`min-w-0 flex-1 truncate text-sm ${conversation.unreadCount ? 'font-bold text-slate-950' : 'font-semibold text-slate-800'}`}>{conversationName}</p>
                            <time className="shrink-0 text-[11px] font-medium text-slate-400">{formatConversationDate(conversation.updatedAt)}</time>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <p className={`min-w-0 flex-1 truncate text-xs ${conversation.unreadCount ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{preview}</p>
                            {conversation.unreadCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-white">{conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-w-0 flex-1 flex-col bg-[#f8faf9]`}>
            {!selectedId ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-xl shadow-teal-700/20">
                  <ChatBubbleLeftRightIcon className="h-11 w-11" />
                  <span className="absolute -right-2 -top-2 h-7 w-7 rounded-full border-4 border-[#f8faf9] bg-amber-400" />
                </div>
                <h2 className="mt-7 text-2xl font-bold tracking-tight text-slate-900">Vos échanges, au même endroit</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Sélectionnez une conversation ou créez-en une nouvelle pour communiquer instantanément avec un utilisateur Ecclesys.</p>
                <button onClick={openNewConversation} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700"><PlusIcon className="h-5 w-5" /> Nouvelle conversation</button>
              </div>
            ) : (
              <>
                <header className="flex h-[82px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
                  <button onClick={() => setSelectedId(null)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Retour aux conversations"><ArrowLeftIcon className="h-5 w-5" /></button>
                  {activeConversation?.isGroup ? <GroupAvatar title={activeConversation.title} size="lg" /> : <Avatar user={activeContact} size="lg" />}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-slate-900">{activeConversation?.title || fullName(activeContact)}</h2>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="truncate">
                        {activeConversation?.isGroup
                          ? `${activeConversation.participants.length} membre${activeConversation.participants.length > 1 ? 's' : ''}${isActiveGroupOwner ? ' · Vous êtes administrateur' : ''}`
                          : `${activeContact?.role}${activeContact?.church?.name ? ` · ${activeContact.church.name}` : ''}`}
                      </span>
                    </div>
                  </div>
                  <div className="hidden rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 sm:block">{activeConversation?.isGroup ? 'Groupe privé' : 'Conversation privée'}</div>
                  {(!activeConversation?.isGroup || isActiveGroupOwner) && <div ref={conversationMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setConversationMenuOpen((open) => !open)}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label="Actions de la conversation"
                      aria-expanded={conversationMenuOpen}
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                    {conversationMenuOpen && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                        {isActiveGroupOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setGroupManagementOpen(true);
                              setConversationMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:text-teal-700"
                          >
                            <UserPlusIcon className="h-5 w-5" />
                            Gérer les membres
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedId) setConfirmation({ type: 'conversation', id: selectedId });
                            setConversationMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <TrashIcon className="h-5 w-5" />
                          {activeConversation?.isGroup ? 'Supprimer le groupe' : 'Supprimer la conversation'}
                        </button>
                      </div>
                    )}
                  </div>}
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
                  {messagesLoading ? (
                    <div className="space-y-5">
                      <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-slate-200" />
                      <div className="ml-auto h-16 w-1/2 animate-pulse rounded-2xl bg-teal-100" />
                      <div className="h-20 w-3/5 animate-pulse rounded-2xl bg-slate-200" />
                    </div>
                  ) : messagesError ? (
                    <div className="flex h-full items-center justify-center text-center"><div><p className="font-semibold text-slate-800">Impossible de charger les messages</p><p className="mt-1 text-sm text-slate-500">La conversation sera actualisée automatiquement.</p></div></div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      {activeConversation?.isGroup ? <GroupAvatar title={activeConversation.title} size="lg" /> : <Avatar user={activeContact} size="lg" />}
                      <h3 className="mt-4 font-bold text-slate-900">Démarrez la conversation</h3>
                      <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                        {activeConversation?.isGroup
                          ? `Envoyez le premier message dans ${activeConversation.title || 'ce groupe'}.`
                          : `Envoyez votre premier message à ${fullName(activeContact)}.`}
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-4xl space-y-3">
                      {messages.map((message, index) => {
                        const mine = message.senderId === currentUser?.id;
                        const previous = messages[index - 1];
                        const showDay = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                        const isOptimistic = message.id.startsWith('optimistic-');
                        const isBeingEdited = editingMessageId === message.id;
                        const wasEdited = new Date(message.updatedAt).getTime() - new Date(message.createdAt).getTime() > 1000;
                        return (
                          <div key={message.id}>
                            {showDay && <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{formatDay(message.createdAt)}</span><div className="h-px flex-1 bg-slate-200" /></div>}
                            <div className={`group flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                              {!mine && <Avatar user={message.sender} size="sm" />}
                              {mine && !isOptimistic && !isBeingEdited && (
                                <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => beginEditingMessage(message.id, message.content)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-teal-50 hover:text-teal-700"
                                    aria-label="Modifier le message"
                                    title="Modifier"
                                  >
                                    <PencilSquareIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmation({ type: 'message', conversationId: message.conversationId, messageId: message.id })}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600"
                                    aria-label="Supprimer le message"
                                    title="Supprimer"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                              <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${mine ? 'rounded-br-md bg-teal-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                                {isBeingEdited ? (
                                  <div className="min-w-[240px] sm:min-w-[320px]">
                                    <textarea
                                      autoFocus
                                      value={editingContent}
                                      onChange={(event) => setEditingContent(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Escape') cancelEditingMessage();
                                        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                                          event.preventDefault();
                                          handleEditMessage(message.id, Boolean(message.attachmentUrl));
                                        }
                                      }}
                                      rows={3}
                                      className="max-h-40 w-full resize-y rounded-xl border border-white/30 bg-white px-3 py-2 text-sm leading-6 text-slate-800 outline-none ring-4 ring-white/10 placeholder:text-slate-400"
                                      placeholder="Modifier votre message..."
                                    />
                                    <div className="mt-2 flex items-center justify-end gap-2">
                                      <button type="button" onClick={cancelEditingMessage} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-teal-50 transition hover:bg-white/10">Annuler</button>
                                      <button
                                        type="button"
                                        onClick={() => handleEditMessage(message.id, Boolean(message.attachmentUrl))}
                                        disabled={isEditingMessage || (!editingContent.trim() && !message.attachmentUrl)}
                                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {isEditingMessage ? 'Enregistrement…' : 'Enregistrer'}
                                      </button>
                                    </div>
                                  </div>
                                ) : message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p> : null}
                                {message.attachmentUrl && (
                                  <a href={`${imageBaseUrl}${message.attachmentUrl}`} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-3 rounded-xl p-3 ${mine ? 'bg-white/15 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${mine ? 'bg-white/15' : 'bg-teal-50 text-teal-600'}`}><DocumentIcon className="h-5 w-5" /></span>
                                    <span className="min-w-0"><span className="block truncate text-xs font-bold">{message.attachmentName || 'Pièce jointe'}</span><span className={`mt-0.5 block text-[10px] ${mine ? 'text-teal-100' : 'text-slate-400'}`}>Ouvrir le fichier</span></span>
                                  </a>
                                )}
                                {!message.attachmentUrl && message.attachmentName && isOptimistic && (
                                  <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/15 p-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><DocumentIcon className="h-5 w-5" /></span>
                                    <span className="min-w-0"><span className="block truncate text-xs font-bold">{message.attachmentName}</span><span className="mt-0.5 block text-[10px] text-teal-100">Envoi en cours…</span></span>
                                  </div>
                                )}
                                <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-teal-100' : 'text-slate-400'}`}>
                                  {wasEdited && <span>Modifié ·</span>}
                                  <time>{formatTime(message.createdAt)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <footer className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
                  {actionError && <div className="mx-auto mb-2 max-w-4xl rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{actionError}</div>}
                  {attachment && (
                    <div className="mx-auto mb-2 flex max-w-4xl items-center gap-2 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs text-teal-800">
                      <PaperClipIcon className="h-4 w-4" /><span className="min-w-0 flex-1 truncate font-semibold">{attachment.name}</span><button onClick={() => setAttachment(null)} aria-label="Retirer la pièce jointe"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                  )}
                  <div className="mx-auto flex max-w-4xl items-end gap-2">
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,application/pdf,.doc,.docx" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600" aria-label="Ajouter une pièce jointe"><PaperClipIcon className="h-5 w-5" /></button>
                    <div ref={emojiAreaRef} className="relative shrink-0">
                      {emojiPickerOpen && (
                        <div className="absolute bottom-full left-0 z-50 mb-3 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-slate-900/10">
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={Theme.LIGHT}
                            width="min(350px, calc(100vw - 2rem))"
                            height={400}
                            searchPlaceHolder="Rechercher un emoji..."
                            lazyLoadEmojis
                            previewConfig={{ showPreview: false }}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setEmojiPickerOpen((open) => !open)}
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${emojiPickerOpen
                          ? 'border-teal-300 bg-teal-50 text-teal-700 ring-4 ring-teal-500/10'
                          : 'border-slate-200 text-slate-500 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-600'
                          }`}
                        aria-label="Ajouter un emoji"
                        aria-expanded={emojiPickerOpen}
                      >
                        <FaceSmileIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={composer}
                      onChange={(event) => setComposer(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          handleSend();
                        }
                      }}
                      rows={1}
                      className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                      placeholder="Écrivez votre message..."
                      aria-label="Votre message"
                    />
                    <button type="button" onClick={handleSend} disabled={!composer.trim() && !attachment} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto sm:px-5" aria-label="Envoyer le message"><PaperAirplaneIcon className="h-5 w-5" /><span className="ml-2 hidden text-sm font-bold sm:inline">Envoyer</span></button>
                  </div>
                  <p className="mx-auto mt-2 hidden max-w-4xl text-center text-[10px] text-slate-400 sm:block">Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne · Fichiers de 10 Mo maximum</p>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>

      {newGroupOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target && !isCreatingGroup) closeNewGroup(); }}>
          <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">Nouvelle conversation</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">Créer un groupe</h2>
                <p className="mt-1 text-xs text-slate-500">Vous serez l’unique administrateur du groupe.</p>
              </div>
              <button onClick={closeNewGroup} disabled={isCreatingGroup} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Fermer"><XMarkIcon className="h-5 w-5" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <label className="block text-sm font-bold text-slate-700" htmlFor="group-title">Nom du groupe</label>
              <input
                id="group-title"
                autoFocus
                value={groupTitle}
                onChange={(event) => setGroupTitle(event.target.value.slice(0, 80))}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                placeholder="Ex. Équipe de coordination"
              />
              <div className="mt-1 text-right text-[10px] font-medium text-slate-400">{groupTitle.length}/80</div>

              <div className="mt-5 flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700" htmlFor="group-user-search">Participants</label>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">{selectedGroupUsers.length} sélectionné{selectedGroupUsers.length > 1 ? 's' : ''}</span>
              </div>

              {selectedGroupUsers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedGroupUsers.map((user) => (
                    <span key={user.id} className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 py-1 pl-2 pr-1 text-xs font-semibold text-teal-800">
                      {fullName(user)}
                      <button type="button" onClick={() => setSelectedGroupUsers((current) => current.filter((item) => item.id !== user.id))} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-teal-100" aria-label={`Retirer ${fullName(user)}`}><XMarkIcon className="h-3.5 w-3.5" /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative mt-3">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="group-user-search"
                  value={groupUserSearch}
                  onChange={(event) => setGroupUserSearch(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  placeholder="Rechercher un nom ou une adresse électronique..."
                />
              </div>

              <div className="mt-3 min-h-28 rounded-2xl border border-slate-100 bg-slate-50/60 p-2">
                {groupUserSearch.trim().length < 2 ? (
                  <div className="flex min-h-24 items-center justify-center px-4 text-center text-xs leading-5 text-slate-500">Saisissez au moins 2 caractères pour rechercher des participants.</div>
                ) : groupUsersFetching || groupUserSearch.trim() !== debouncedGroupUserSearch ? (
                  <div className="space-y-2">{[0, 1].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
                ) : groupSearchUsers.length === 0 ? (
                  <div className="flex min-h-24 items-center justify-center text-sm font-semibold text-slate-500">Aucun utilisateur trouvé</div>
                ) : groupSearchUsers.map((user) => {
                  const isSelected = selectedGroupUsers.some((item) => item.id === user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedGroupUsers((current) => isSelected ? current.filter((item) => item.id !== user.id) : [...current, user])}
                      className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${isSelected ? 'bg-teal-50 ring-1 ring-teal-100' : 'hover:bg-white'}`}
                    >
                      <Avatar user={user} size="sm" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{fullName(user)}</span><span className="block truncate text-xs text-slate-500">{user.role}{user.church?.name ? ` · ${user.church.name}` : ''}</span></span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isSelected ? 'bg-teal-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}>{isSelected ? 'Ajouté' : 'Ajouter'}</span>
                    </button>
                  );
                })}
              </div>

              {actionError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{actionError}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button type="button" onClick={closeNewGroup} disabled={isCreatingGroup} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
              <button
                type="button"
                onClick={handleCreateGroup}
                disabled={isCreatingGroup || groupTitle.trim().length < 2 || selectedGroupUsers.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <UserGroupIcon className="h-5 w-5" />
                {isCreatingGroup ? 'Création…' : 'Créer le groupe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {groupManagementOpen && activeConversation?.isGroup && isActiveGroupOwner && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setGroupManagementOpen(false); }}>
          <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">Administration du groupe</p><h2 className="mt-1 text-xl font-bold text-slate-900">Gérer les membres</h2><p className="mt-1 text-xs text-slate-500">{activeConversation.title} · {activeConversation.participants.length} membres</p></div>
              <button onClick={() => setGroupManagementOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fermer"><XMarkIcon className="h-5 w-5" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Membres actuels</h3>
              <div className="mt-3 space-y-2">
                {activeConversation.participants.map((participant) => {
                  const isOwner = participant.userId === activeConversation.ownerId;
                  return (
                    <div key={participant.userId} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                      <Avatar user={participant.user} size="sm" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{fullName(participant.user)}</p><p className="truncate text-xs text-slate-500">{participant.user.role}</p></div>
                      {isOwner ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">Administrateur</span> : (
                        <button
                          type="button"
                          onClick={() => handleRemoveGroupMember(participant.userId)}
                          disabled={isRemovingGroupMember}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          aria-label={`Retirer ${fullName(participant.user)}`}
                          title="Retirer du groupe"
                        ><TrashIcon className="h-4 w-4" /></button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="my-5 h-px bg-slate-200" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ajouter une personne</h3>
              <div className="relative mt-3"><MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input value={managementSearch} onChange={(event) => setManagementSearch(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10" placeholder="Rechercher une personne..." /></div>
              <div className="mt-3 space-y-1">
                {managementSearch.trim().length < 2 ? (
                  <p className="py-6 text-center text-xs text-slate-500">Saisissez au moins 2 caractères. Aucun utilisateur n’est chargé automatiquement.</p>
                ) : managementUsersFetching || managementSearch.trim() !== debouncedManagementSearch ? (
                  <div className="space-y-2">{[0, 1].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
                ) : managementSearchUsers.filter((user) => !activeConversation.participants.some((participant) => participant.userId === user.id)).length === 0 ? (
                  <p className="py-6 text-center text-sm font-semibold text-slate-500">Aucune nouvelle personne trouvée</p>
                ) : managementSearchUsers.filter((user) => !activeConversation.participants.some((participant) => participant.userId === user.id)).map((user) => (
                  <div key={user.id} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                    <Avatar user={user} size="sm" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{fullName(user)}</p><p className="truncate text-xs text-slate-500">{user.role}</p></div>
                    <button type="button" onClick={() => handleAddGroupMember(user.id)} disabled={isAddingGroupMember} className="rounded-xl bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-100 disabled:opacity-50">Ajouter</button>
                  </div>
                ))}
              </div>
              {actionError && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{actionError}</p>}
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isDeletingConversation && !isDeletingMessage) setConfirmation(null);
          }}
        >
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <TrashIcon className="h-6 w-6" />
            </div>
            <h2 id="delete-dialog-title" className="mt-5 text-xl font-bold text-slate-900">
              {confirmation.type === 'conversation'
                ? activeConversation?.isGroup ? 'Supprimer ce groupe ?' : 'Supprimer cette conversation ?'
                : 'Supprimer ce message ?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {confirmation.type === 'conversation'
                ? activeConversation?.isGroup
                  ? 'Le groupe, tous ses messages et ses pièces jointes seront définitivement supprimés pour tous les membres.'
                  : 'La conversation, tous ses messages et ses pièces jointes seront définitivement supprimés pour les deux participants.'
                : 'Ce message sera définitivement supprimé de la conversation. Cette action est irréversible.'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                disabled={isDeletingConversation || isDeletingMessage}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmedDeletion}
                disabled={isDeletingConversation || isDeletingMessage}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TrashIcon className="h-4 w-4" />
                {isDeletingConversation || isDeletingMessage ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {newConversationOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) closeNewConversation(); }}>
          <div className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">Nouveau message</p><h2 className="mt-1 text-xl font-bold text-slate-900">Choisir un contact</h2></div>
              <button onClick={closeNewConversation} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Fermer"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="border-b border-slate-100 p-4">
              <div className="relative"><MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" /><input autoFocus value={userSearch} onChange={(event) => setUserSearch(event.target.value)} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10" placeholder="Nom, prénom ou adresse électronique..." aria-label="Rechercher un utilisateur" /></div>
              {actionError && <p className="mt-2 text-xs font-medium text-red-600">{actionError}</p>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {userSearch.trim().length < 2 ? (
                <div className="flex flex-col items-center py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><MagnifyingGlassIcon className="h-7 w-7" /></div>
                  <p className="mt-4 font-semibold text-slate-800">Recherchez un utilisateur</p>
                  <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">Saisissez au moins 2 caractères du prénom, du nom ou de l’adresse électronique.</p>
                </div>
              ) : usersLoading || usersFetching || userSearch.trim() !== debouncedUserSearch ? <div className="space-y-2">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div> : availableUsers.length === 0 ? <div className="py-14 text-center"><p className="font-semibold text-slate-800">Aucun utilisateur trouvé</p><p className="mt-1 text-sm text-slate-500">Vérifiez l’orthographe ou essayez un autre nom.</p></div> : availableUsers.map((user) => (
                <button key={user.id} disabled={isStarting} onClick={() => handleStartConversation(user.id)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-teal-50 disabled:opacity-50">
                  <Avatar user={user} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{fullName(user)}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{user.role}{user.church?.name ? ` · ${user.church.name}` : ''}</span></span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">Écrire</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
