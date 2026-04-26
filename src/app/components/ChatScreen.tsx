import { useState } from 'react';
import { Check, CheckCheck, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useAsync } from '@/api/provider';
import type { ConversationListItem, EventId } from '@/domain/types';

type Tab = 'all' | 'match' | 'liked' | 'hidden';

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
};

export function ChatScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const { data, loading, error } = useAsync(
    (api) => api.chat.listConversations(eventId, activeTab),
    [eventId, activeTab],
  );
  const me = useAsync((api) => api.profile.me(), []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'match', label: 'Match' },
    { id: 'liked', label: 'Liked' },
    { id: 'hidden', label: 'Hidden' },
  ];

  const renderItem = (item: ConversationListItem) => {
    const c = item.conversation;
    const isGroup = c.kind !== 'one-on-one';
    const name = isGroup ? 'Event general chat' : item.otherUser?.fullName ?? 'Unknown';
    const avatar = isGroup ? null : item.otherUser?.photoUrl ?? null;
    const lastMsg = c.lastMessage;
    const isOutgoing = !!(lastMsg && me.data && lastMsg.senderId === me.data.id);
    const isRead = !!(lastMsg && item.otherUser && lastMsg.readBy.includes(item.otherUser.id));

    return (
      <button
        key={c.id}
        onClick={() => navigate(`/event/${eventId}/chat/${c.id}`)}
        className="w-full bg-white px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
      >
        <div className="flex gap-3">
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            )}
            {item.unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{item.unreadCount}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{name}</h3>
                {item.hashtag && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                    #{item.hashtag}
                  </span>
                )}
              </div>
              {lastMsg && (
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatTimestamp(lastMsg.sentAt)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isOutgoing && (isRead ? (
                <CheckCheck className="w-3 h-3 text-blue-600 flex-shrink-0" />
              ) : (
                <Check className="w-3 h-3 text-gray-400 flex-shrink-0" />
              ))}
              <p
                className={`text-sm truncate ${
                  item.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                }`}
              >
                {lastMsg?.text ?? (isGroup ? 'No messages yet' : 'Start a conversation')}
              </p>
            </div>

            {isGroup && (
              <div className="mt-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Group Chat</span>
              </div>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-3 border-b">
        <h1 className="font-bold text-xl mb-3">Messages</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}
        {error && <div className="py-10 text-center text-red-500 text-sm">{error.message}</div>}
        {data && data.length > 0 && <div className="divide-y divide-gray-100">{data.map(renderItem)}</div>}
        {!loading && data?.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCheck className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No conversations yet</p>
              <p className="text-gray-400 text-sm mt-1">
                {activeTab === 'all'
                  ? 'Open a participant profile and tap Chat to start.'
                  : `No conversations in the "${activeTab}" bucket.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
