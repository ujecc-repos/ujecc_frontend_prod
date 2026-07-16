import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';
import { useGetUserByTokenQuery } from '../store/services/authApi';
import {
  type Conversation,
  type MessageUser,
  useGetConversationMessagesQuery,
  useGetConversationsQuery,
  useMarkConversationReadMutation,
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
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiAreaRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === selectedId);
  const activeContact = otherParticipant(activeConversation, currentUser?.id);
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
  const [startConversation, { isLoading: isStarting }] = useStartConversationMutation();
  const [sendMessage] = useSendMessageMutation();
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

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const contact = otherParticipant(conversation, currentUser?.id);
      return `${fullName(contact)} ${contact?.role ?? ''} ${conversation.lastMessage?.content ?? ''}`
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
                <button
                  type="button"
                  onClick={openNewConversation}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 transition hover:-translate-y-0.5 hover:bg-teal-700"
                  aria-label="Nouvelle conversation"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
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
                          <Avatar user={contact} />
                          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`min-w-0 flex-1 truncate text-sm ${conversation.unreadCount ? 'font-bold text-slate-950' : 'font-semibold text-slate-800'}`}>{fullName(contact)}</p>
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
                  <Avatar user={activeContact} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-slate-900">{activeConversation?.title || fullName(activeContact)}</h2>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="truncate">{activeContact?.role}{activeContact?.church?.name ? ` · ${activeContact.church.name}` : ''}</span>
                    </div>
                  </div>
                  <div className="hidden rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 sm:block">Conversation privée</div>
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
                      <Avatar user={activeContact} size="lg" />
                      <h3 className="mt-4 font-bold text-slate-900">Démarrez la conversation</h3>
                      <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">Envoyez votre premier message à {fullName(activeContact)}.</p>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-4xl space-y-3">
                      {messages.map((message, index) => {
                        const mine = message.senderId === currentUser?.id;
                        const previous = messages[index - 1];
                        const showDay = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                        return (
                          <div key={message.id}>
                            {showDay && <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{formatDay(message.createdAt)}</span><div className="h-px flex-1 bg-slate-200" /></div>}
                            <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                              {!mine && <Avatar user={message.sender} size="sm" />}
                              <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${mine ? 'rounded-br-md bg-teal-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                                {message.content && <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>}
                                {message.attachmentUrl && (
                                  <a href={`${imageBaseUrl}${message.attachmentUrl}`} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-3 rounded-xl p-3 ${mine ? 'bg-white/15 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100'}`}>
                                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${mine ? 'bg-white/15' : 'bg-teal-50 text-teal-600'}`}><DocumentIcon className="h-5 w-5" /></span>
                                    <span className="min-w-0"><span className="block truncate text-xs font-bold">{message.attachmentName || 'Pièce jointe'}</span><span className={`mt-0.5 block text-[10px] ${mine ? 'text-teal-100' : 'text-slate-400'}`}>Ouvrir le fichier</span></span>
                                  </a>
                                )}
                                {!message.attachmentUrl && message.attachmentName && message.id.startsWith('optimistic-') && (
                                  <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/15 p-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><DocumentIcon className="h-5 w-5" /></span>
                                    <span className="min-w-0"><span className="block truncate text-xs font-bold">{message.attachmentName}</span><span className="mt-0.5 block text-[10px] text-teal-100">Envoi en cours…</span></span>
                                  </div>
                                )}
                                <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-teal-100' : 'text-slate-400'}`}><time>{formatTime(message.createdAt)}</time></div>
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
