import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck, Clock, MessageCircle, Sparkles, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import {
  getConnections,
  getLastMessage,
  getLikedProfiles,
  getMessages,
  hasMessages,
  seedChatStoreOnce,
  type ChatMessage,
} from './chatStore';
import { useEventPeriod } from './eventPeriodContext';

type Tab = 'all' | 'connections' | 'liked';

type ChatRow = {
  id: string;
  name: string;
  avatar: string | null;
  hashtag: string | null;
  isGroup: boolean;
  /** Source bucket: connection (always shown) | liked (only if has messages) | group. */
  kind: 'connection' | 'liked' | 'group';
  /** True for connections without any message yet → "Start conversation" CTA. */
  isNewConnection: boolean;
  /** Last message preview info, null when none yet. */
  last: ChatMessage | null;
};

const fmtTimestamp = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
};

function buildRows(): ChatRow[] {
  const rows: ChatRow[] = [];

  // Group chat (always present in All)
  rows.push({
    id: 'general',
    name: 'Tech Summit General',
    avatar: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200',
    hashtag: null,
    isGroup: true,
    kind: 'group',
    isNewConnection: false,
    last: getLastMessage('general'),
  });

  for (const p of getConnections()) {
    const id = String(p.id);
    rows.push({
      id,
      name: p.name,
      avatar: p.image,
      hashtag: null,
      isGroup: false,
      kind: 'connection',
      isNewConnection: !hasMessages(id),
      last: getLastMessage(id),
    });
  }

  for (const p of getLikedProfiles()) {
    const id = String(p.id);
    if (!hasMessages(id)) continue; // SOW: liked appears in Messages only when there are messages
    if (rows.some((r) => r.id === id)) continue; // dedupe in case someone is in both buckets
    rows.push({
      id,
      name: p.name,
      avatar: p.image,
      hashtag: null,
      isGroup: false,
      kind: 'liked',
      isNewConnection: false,
      last: getLastMessage(id),
    });
  }

  return rows;
}

function unreadCountFor(chatId: string, viewedChats: Set<string>): number {
  if (viewedChats.has(chatId)) return 0;
  return getMessages(chatId).filter((m) => !m.isOutgoing).length;
}

export function ChatScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { period } = useEventPeriod();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [viewedChats, setViewedChats] = useState<Set<string>>(new Set());
  const [storeVersion, setStoreVersion] = useState(0);

  // Seed defaults + load viewedChats on first render
  useEffect(() => {
    seedChatStoreOnce();
    const stored = sessionStorage.getItem('viewedChats');
    if (stored) {
      try {
        setViewedChats(new Set(JSON.parse(stored) as string[]));
      } catch {
        /* ignore corrupted state */
      }
    }
    setStoreVersion((v) => v + 1);
  }, []);

  // Refresh when window regains focus (covers messages sent in another tab)
  useEffect(() => {
    const handler = () => setStoreVersion((v) => v + 1);
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, []);

  const rows = useMemo<ChatRow[]>(() => {
    void storeVersion; // recompute when version changes
    return buildRows();
  }, [storeVersion]);

  const visible = useMemo(() => {
    switch (activeTab) {
      case 'connections':
        return rows.filter((r) => r.kind === 'connection');
      case 'liked':
        return rows.filter((r) => r.kind === 'liked');
      case 'all':
      default:
        return rows;
    }
  }, [rows, activeTab]);

  const handleChatClick = (chatId: string) => {
    setViewedChats((prev) => {
      if (prev.has(chatId)) return prev;
      const next = new Set(prev);
      next.add(chatId);
      sessionStorage.setItem('viewedChats', JSON.stringify(Array.from(next)));
      return next;
    });
    navigate(`/event/${eventId}/chat/${chatId}`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'connections', label: 'Connections' },
    { id: 'liked', label: 'Liked' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {period === 'after' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Event ended — chats remain active for 1.5 months, then archived.</span>
        </div>
      )}

      <div className="bg-white px-4 py-3 border-b">
        <h1 className="font-bold text-xl mb-3">Messages</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map((row) => (
              <ChatRowItem
                key={row.id}
                row={row}
                unread={unreadCountFor(row.id, viewedChats)}
                onClick={() => handleChatClick(row.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatRowItem({
  row,
  unread,
  onClick,
}: {
  row: ChatRow;
  unread: number;
  onClick: () => void;
}) {
  const showUnreadBadge = unread > 0;
  const last = row.last;
  const isOutgoing = !!last?.isOutgoing;
  const isRead = !!last?.read;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          )}
          {showUnreadBadge && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{unread}</span>
            </div>
          )}
          {row.isNewConnection && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{row.name}</h3>
              {row.hashtag && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  {row.hashtag}
                </span>
              )}
              {row.isNewConnection && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">
                  New connection
                </span>
              )}
            </div>
            {last && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {fmtTimestamp(last.sentAt)}
              </span>
            )}
          </div>

          {row.isNewConnection ? (
            <div className="flex items-center gap-1.5 text-blue-600">
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">Start conversation</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {isOutgoing && (
                isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-600 flex-shrink-0" />
                ) : (
                  <Check className="w-3 h-3 text-gray-400 flex-shrink-0" />
                )
              )}
              <p
                className={`text-sm truncate ${
                  showUnreadBadge ? 'font-medium text-gray-900' : 'text-gray-500'
                }`}
              >
                {last?.text ?? (row.isGroup ? 'No messages yet' : 'No messages yet')}
              </p>
            </div>
          )}

          {row.isGroup && (
            <div className="mt-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                Group Chat
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const copy =
    tab === 'liked'
      ? {
          title: 'No conversations with liked people yet',
          subtitle: 'Once you or they send a first message, they’ll appear here.',
        }
      : tab === 'connections'
        ? {
            title: 'No connections yet',
            subtitle: 'Mutual matches from Participants will appear here automatically.',
          }
        : {
            title: 'No conversations yet',
            subtitle: 'Match with people in Participants to start a chat.',
          };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCheck className="w-10 h-10 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">{copy.title}</p>
        <p className="text-gray-400 text-sm mt-1">{copy.subtitle}</p>
      </div>
    </div>
  );
}
