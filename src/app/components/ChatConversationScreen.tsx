import { ArrowLeft, Paperclip, Mic, Send, Plus, Check, CheckCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useApi, useAsync, useMutation } from '@/api/provider';
import type { ConversationId, EventId, Message, MessageId, UserId } from '@/domain/types';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function ChatConversationScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam, chatId } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;
  const conversationId = (chatId ?? '') as ConversationId;
  const api = useApi();

  const me = useAsync((api) => api.profile.me(), []);
  const conv = useAsync((api) => api.chat.getConversation(conversationId), [conversationId]);
  const initialMessages = useAsync(
    (api) => api.chat.listMessages(conversationId, { limit: 100 }),
    [conversationId],
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<{
    id: UserId;
    fullName: string;
    photoUrl: string | null;
    position: string | null;
    company: string | null;
    hashtag: string | null;
  } | null>(null);

  const [draft, setDraft] = useState('');
  const sendM = useMutation((api, text: string) =>
    api.chat.sendMessage({ conversationId, text, kind: 'text' }),
  );

  useEffect(() => {
    if (initialMessages.data) setMessages(initialMessages.data.items);
  }, [initialMessages.data]);

  // Resolve "other user" once we have conv + me
  useEffect(() => {
    if (!conv.data || !me.data) return;
    if (conv.data.kind !== 'one-on-one') {
      setOther(null);
      return;
    }
    const otherId = conv.data.participantIds.find((p) => p !== me.data!.id);
    if (!otherId) return;
    let cancelled = false;
    (async () => {
      const u = await api.profile.getPublicProfile(eventId, otherId);
      if (cancelled) return;
      setOther({
        id: u.id,
        fullName: u.fullName,
        photoUrl: u.photoUrl,
        position: u.position,
        company: u.company,
        hashtag: null, // populated by separate fetch if you wire setHashtagNote here
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [conv.data, me.data, api, eventId]);

  // Subscribe to live conversation events
  useEffect(() => {
    const unsub = api.chat.subscribe(conversationId, (e) => {
      if (e.kind === 'message-sent') {
        setMessages((prev) => (prev.some((m) => m.id === e.message.id) ? prev : [...prev, e.message]));
      } else if (e.kind === 'message-reacted') {
        setMessages((prev) => prev.map((m) => (m.id === e.message.id ? e.message : m)));
      } else if (e.kind === 'message-read') {
        const reader = e.readerId;
        const upTo = e.messageId as MessageId;
        setMessages((prev) =>
          prev.map((m) =>
            m.id <= upTo && !m.readBy.includes(reader) ? { ...m, readBy: [...m.readBy, reader] } : m,
          ),
        );
      }
    });
    return () => {
      unsub();
    };
  }, [api, conversationId]);

  // Mark read on mount
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    api.chat.markRead(conversationId, last.id).catch(() => undefined);
  }, [messages, api, conversationId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    await sendM.run(text);
  };

  const isGroup = conv.data?.kind !== 'one-on-one';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
        <button onClick={() => navigate(`/event/${eventId}/chat`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={() =>
            other ? navigate(`/event/${eventId}/user/${other.id}`) : undefined
          }
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {!isGroup && other?.photoUrl ? (
            <img
              src={other.photoUrl}
              alt={other.fullName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm truncate">
                {isGroup ? 'Event general chat' : other?.fullName ?? 'Conversation'}
              </h2>
              {other?.hashtag && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  #{other.hashtag}
                </span>
              )}
            </div>
            {!isGroup && other && (
              <p className="text-xs text-gray-500 truncate">
                {other.position} | {other.company}
              </p>
            )}
          </div>
        </button>
        <button className="p-2 text-blue-600 font-semibold text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" />
          Meeting
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {initialMessages.loading && (
          <div className="text-center text-gray-400 text-sm py-6">Loading messages…</div>
        )}
        {messages.map((msg) => {
          const isOutgoing = !!(me.data && msg.senderId === me.data.id);
          const isRead = !!(other && msg.readBy.includes(other.id));
          return (
            <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] ${
                  isOutgoing
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md'
                } px-4 py-2.5 shadow-sm`}
              >
                {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                <div
                  className={`flex items-center gap-1 justify-end mt-1 ${
                    isOutgoing ? 'text-blue-100' : 'text-gray-400'
                  }`}
                >
                  <span className="text-xs">{fmtTime(msg.sentAt)}</span>
                  {isOutgoing &&
                    (isRead ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
        {!initialMessages.loading && messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-12">No messages yet — say hi.</div>
        )}
      </div>

      <div className="bg-white border-t p-3">
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-50 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {draft.trim() ? (
            <button
              onClick={handleSend}
              disabled={sendM.loading}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
