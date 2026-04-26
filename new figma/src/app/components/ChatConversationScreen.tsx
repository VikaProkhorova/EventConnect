import { ArrowLeft, Paperclip, Mic, Send, Plus, Check, CheckCheck, Sparkles, Users, Clock, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FALLBACK_USER_ID, getUser, mockUsers } from './mockUsers';
import {
  appendMessage,
  getMessages,
  hasMessages,
  seedChatStoreOnce,
  type ChatMessage,
} from './chatStore';
import { useEventPeriod } from './eventPeriodContext';
import { addUserMeeting, getFreeSlots, getScheduleDays } from './meetingStore';

const GROUP_CHAT_ID = 'general';

const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function ChatConversationScreen() {
  const navigate = useNavigate();
  const { eventId, chatId } = useParams();
  const { period } = useEventPeriod();
  const isPostEvent = period === 'after';
  const conversationId = chatId ?? FALLBACK_USER_ID;
  const isGroup = conversationId === GROUP_CHAT_ID;

  const contact = isGroup ? null : getUser(conversationId);

  const groupParticipants = Object.values(mockUsers); // for group chat avatar strip

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    seedChatStoreOnce();
    return getMessages(conversationId);
  });
  const [draft, setDraft] = useState('');

  /* ───────── + Meeting flow (SOW §4.8) ───────── */
  type SheetState =
    | { kind: 'closed' }
    | { kind: 'pickSlot' }
    | { kind: 'fillForm'; day: string; startTime: string; endTime: string };

  const [sheet, setSheet] = useState<SheetState>({ kind: 'closed' });
  const days = useMemo(() => getScheduleDays(), []);
  const [meetingDay, setMeetingDay] = useState<string>(() => days[0] ?? '');
  const [draftMeeting, setDraftMeeting] = useState<{
    type: 'personal-meeting' | 'free-conversation';
    topic: string;
    location: string;
    durationMinutes: number;
  }>({
    type: 'personal-meeting',
    topic: '',
    location: '',
    durationMinutes: 15,
  });
  const [meetingConfirmation, setMeetingConfirmation] = useState<string | null>(null);

  const freeSlots = useMemo(
    () => (sheet.kind === 'pickSlot' ? getFreeSlots(meetingDay, 15) : []),
    [sheet.kind, meetingDay],
  );

  const openMeetingSheet = () => {
    setMeetingDay(days[0] ?? '');
    setDraftMeeting({
      type: 'personal-meeting',
      topic: '',
      location: '',
      durationMinutes: 15,
    });
    setSheet({ kind: 'pickSlot' });
  };

  const closeMeetingSheet = () => setSheet({ kind: 'closed' });

  const pickSlot = (slot: { startTime: string; endTime: string; durationMinutes: number }) => {
    // Default duration to 15 min unless the slot is shorter.
    const slotMinutes = slot.durationMinutes;
    const defaultDuration = Math.min(15, slotMinutes);
    setDraftMeeting((d) => ({ ...d, durationMinutes: defaultDuration }));

    // Compute the actual end time based on default duration
    const [h, m] = slot.startTime.split(':').map(Number);
    const endTotal = h * 60 + m + defaultDuration;
    const endHH = String(Math.floor(endTotal / 60)).padStart(2, '0');
    const endMM = String(endTotal % 60).padStart(2, '0');

    setSheet({
      kind: 'fillForm',
      day: meetingDay,
      startTime: slot.startTime,
      endTime: `${endHH}:${endMM}`,
    });
  };

  const submitMeeting = () => {
    if (sheet.kind !== 'fillForm') return;
    const titleBase =
      draftMeeting.type === 'free-conversation'
        ? draftMeeting.topic.trim() || 'Free conversation'
        : `Meeting with ${contact?.name ?? 'guest'}`;

    addUserMeeting({
      type: draftMeeting.type,
      day: sheet.day,
      startTime: sheet.startTime,
      endTime: sheet.endTime,
      title: titleBase,
      location: draftMeeting.location.trim() || 'TBD',
      topic: draftMeeting.topic.trim() || undefined,
      partnerId: draftMeeting.type === 'personal-meeting' ? conversationId : undefined,
      partnerName: draftMeeting.type === 'personal-meeting' ? contact?.name : undefined,
    });
    setMeetingConfirmation(`Scheduled for ${sheet.day} ${sheet.startTime}–${sheet.endTime}`);
    setSheet({ kind: 'closed' });
    setTimeout(() => setMeetingConfirmation(null), 4000);
  };

  // If chatId changes (e.g. user navigates between conversations) reload
  useEffect(() => {
    seedChatStoreOnce();
    setMessages(getMessages(conversationId));
  }, [conversationId]);

  const handleSend = (override?: string) => {
    const text = (override ?? draft).trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `m-${Date.now()}`,
      text,
      sentAt: new Date().toISOString(),
      isOutgoing: true,
      read: false,
    };
    const next = appendMessage(conversationId, msg);
    setMessages(next);
    setDraft('');
  };

  const QUICK_START_CHIPS = [
    'Hi! Great to connect.',
    'Loved your talk — would love to chat.',
    'Coffee at the lounge later?',
    'What sessions are you most excited about?',
  ];

  const isEmpty = !hasMessages(conversationId);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b flex items-center gap-3">
        <button onClick={() => navigate(`/event/${eventId}/chat`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        {isGroup ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h2 className="font-semibold text-sm truncate">Tech Summit General</h2>
              <p className="text-xs text-gray-500 truncate">
                Group chat · {groupParticipants.length} participants
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/event/${eventId}/user/${conversationId}`)}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <img
              src={contact!.image}
              alt={contact!.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 text-left">
              <h2 className="font-semibold text-sm truncate">{contact!.name}</h2>
              <p className="text-xs text-gray-500 truncate">
                {contact!.position} | {contact!.company}
              </p>
            </div>
          </button>
        )}

        {!isGroup && !isPostEvent && (
          <button
            onClick={openMeetingSheet}
            className="p-2 text-blue-600 font-semibold text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Meeting
          </button>
        )}
      </div>

      {meetingConfirmation && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-xs text-green-800 flex items-center justify-between">
          <span>✓ {meetingConfirmation}</span>
          <button
            onClick={() => navigate(`/event/${eventId}/calendar`)}
            className="font-semibold underline"
          >
            See in Calendar
          </button>
        </div>
      )}

      {isPostEvent && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Event archived in 1.5 months — say what's left to say.</span>
        </div>
      )}

      {/* Group participants strip */}
      {isGroup && (
        <div className="bg-white border-b px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {groupParticipants.map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/event/${eventId}/user/${u.id}`)}
                className="flex flex-col items-center gap-1 flex-shrink-0 w-14"
              >
                <img
                  src={u.image}
                  alt={u.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-[10px] text-gray-600 truncate w-full text-center">
                  {u.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isEmpty && !isGroup && (
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              New connection
            </div>
            <h3 className="font-semibold text-sm text-gray-900 mb-1">Start the conversation</h3>
            <p className="text-xs text-gray-600">
              You're a mutual match with {contact!.name}. Send the first message to break the ice.
            </p>
          </div>
        )}

        {isEmpty && isGroup && (
          <div className="text-center text-gray-400 text-sm py-12">
            No messages in the group chat yet — say hi 👋
          </div>
        )}

        {messages.map((msg) => {
          const sender = isGroup && msg.senderId ? mockUsers[msg.senderId] : null;
          return (
            <div
              key={msg.id}
              className={`flex ${msg.isOutgoing ? 'justify-end' : 'justify-start'}`}
            >
              {/* Group: show avatar of sender on the left */}
              {isGroup && !msg.isOutgoing && sender && (
                <img
                  src={sender.image}
                  alt={sender.name}
                  className="w-8 h-8 rounded-full mr-2 object-cover self-end"
                />
              )}

              <div
                className={`max-w-[75%] ${
                  msg.isOutgoing
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md'
                } px-4 py-2.5 shadow-sm`}
              >
                {isGroup && !msg.isOutgoing && sender && (
                  <p className="text-[11px] font-semibold text-blue-700 mb-0.5">{sender.name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                <div
                  className={`flex items-center gap-1 justify-end mt-1 ${
                    msg.isOutgoing ? 'text-blue-100' : 'text-gray-400'
                  }`}
                >
                  <span className="text-xs">{fmtTime(msg.sentAt)}</span>
                  {msg.isOutgoing &&
                    (msg.read ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="bg-white border-t">
        {isEmpty && !isGroup && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-[11px] text-gray-500 mb-2">Quick start</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {QUICK_START_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  className="flex-shrink-0 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 text-xs font-medium rounded-full border border-blue-100 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 p-3">
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
            placeholder={isGroup ? 'Message the group…' : 'Type a message...'}
            className="flex-1 px-4 py-2 bg-gray-50 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {draft.trim() ? (
            <button
              onClick={() => handleSend()}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
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

      {/* + Meeting bottom sheet (SOW §4.8 mutual free-time overlay) */}
      {sheet.kind !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={closeMeetingSheet}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-3xl p-5 pb-6 shadow-2xl max-h-[85%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[18px] text-gray-900">
                {sheet.kind === 'pickSlot' ? 'Pick a free slot' : 'New meeting'}
              </h3>
              <button
                onClick={closeMeetingSheet}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {sheet.kind === 'pickSlot' && (
              <>
                {!isGroup && contact && (
                  <p className="text-sm text-gray-500 mb-3">
                    Mutual free time with <span className="font-semibold text-gray-900">{contact.name}</span>
                  </p>
                )}

                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {days.map((d) => (
                    <button
                      key={d}
                      onClick={() => setMeetingDay(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        meetingDay === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {new Date(d).toLocaleDateString('en-US', {
                        weekday: 'short',
                        day: 'numeric',
                      })}
                    </button>
                  ))}
                </div>

                {freeSlots.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-6 text-center">
                    No free slots on this day.
                  </p>
                ) : (
                  <div className="space-y-2 mb-2">
                    {freeSlots.map((slot) => (
                      <button
                        key={`${slot.startTime}-${slot.endTime}`}
                        onClick={() => pickSlot(slot)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-sm">
                            {slot.startTime} – {slot.endTime}
                          </p>
                          <p className="text-[11px] text-blue-600/70">
                            {slot.durationMinutes >= 60
                              ? `${Math.floor(slot.durationMinutes / 60)}h ${slot.durationMinutes % 60 ? `${slot.durationMinutes % 60}m` : ''}`.trim()
                              : `${slot.durationMinutes}m`}
                            {' '}free
                          </p>
                        </div>
                        <span className="text-xs font-medium">Pick →</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {sheet.kind === 'fillForm' && (
              <>
                <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm">
                  <p className="text-blue-900 font-semibold">
                    {new Date(sheet.day).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-blue-700 text-xs">
                    Starting {sheet.startTime} · {draftMeeting.durationMinutes} min
                  </p>
                </div>

                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
                  {(['personal-meeting', 'free-conversation'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDraftMeeting((d) => ({ ...d, type: t }))}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        draftMeeting.type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                      }`}
                    >
                      {t === 'personal-meeting' ? 'Personal' : 'Free conversation'}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                <div className="flex gap-2 mb-3">
                  {[15, 30, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        // Re-derive endTime from the chosen duration
                        const [h, mi] = sheet.startTime.split(':').map(Number);
                        const endTotal = h * 60 + mi + m;
                        const endHH = String(Math.floor(endTotal / 60)).padStart(2, '0');
                        const endMM = String(endTotal % 60).padStart(2, '0');
                        setDraftMeeting((d) => ({ ...d, durationMinutes: m }));
                        setSheet({ ...sheet, endTime: `${endHH}:${endMM}` });
                      }}
                      className={`flex-1 h-9 rounded-lg text-sm font-medium ${
                        draftMeeting.durationMinutes === m
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>

                {draftMeeting.type === 'free-conversation' && (
                  <>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Topic</label>
                    <input
                      autoFocus
                      value={draftMeeting.topic}
                      onChange={(e) =>
                        setDraftMeeting((d) => ({ ...d, topic: e.target.value }))
                      }
                      placeholder="What do you want to talk about?"
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-3 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </>
                )}

                <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                <input
                  value={draftMeeting.location}
                  onChange={(e) =>
                    setDraftMeeting((d) => ({ ...d, location: e.target.value }))
                  }
                  placeholder="Coffee Lounge"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-5 outline-none focus:border-blue-500 focus:bg-white"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setSheet({ kind: 'pickSlot' })}
                    className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={submitMeeting}
                    className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-bold"
                  >
                    Schedule
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
