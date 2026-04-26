/**
 * Tiny chat persistence layer over `sessionStorage`.
 *
 * Used by ChatScreen + ChatConversationScreen to keep chat state in sync
 * between Participants (Connections / Liked / Hidden buckets) and Messages.
 *
 * Keys:
 *   connections           Person[] — mutual matches (also written by ParticipantsScreen)
 *   likedProfiles         Person[] — people I liked (also written by ParticipantsScreen)
 *   messages_<chatId>     ChatMessage[] — per-chat history
 *   chatStore_seeded_v1   '1' once defaults are loaded the first time
 */

export type ChatMessage = {
  id: string;
  text: string;
  /** ISO timestamp. */
  sentAt: string;
  /** True if the local user is the sender. */
  isOutgoing: boolean;
  /** True for outgoing messages once the contact has read them (mocked). */
  read?: boolean;
  /**
   * For group chats: which user (by id from mockUsers) sent this message.
   * Ignored in 1:1 chats — `isOutgoing` is enough there.
   */
  senderId?: string;
};

/**
 * Person shape used by ParticipantsScreen sessionStorage buckets.
 * Defined loosely so existing writers (Participants) don't need to change.
 */
export type StoredPerson = {
  id: number | string;
  name: string;
  position: string;
  company: string;
  image: string;
  interests?: string[];
  matchTags?: string[];
  wantToTalkAbout?: string | string[];
};

/* ───────── low-level helpers ───────── */

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore in prototype */
  }
}

const messagesKey = (chatId: string) => `messages_${chatId}`;

/* ───────── messages ───────── */

export function getMessages(chatId: string): ChatMessage[] {
  return readJson<ChatMessage[]>(messagesKey(chatId), []);
}

export function appendMessage(chatId: string, message: ChatMessage): ChatMessage[] {
  const next = [...getMessages(chatId), message];
  writeJson(messagesKey(chatId), next);
  return next;
}

export function hasMessages(chatId: string): boolean {
  return getMessages(chatId).length > 0;
}

export function getLastMessage(chatId: string): ChatMessage | null {
  const list = getMessages(chatId);
  return list.length > 0 ? list[list.length - 1] : null;
}

/* ───────── people buckets ─────────
 *
 * Three mutually-exclusive buckets per (event, user):
 *   connections    — mutual matches
 *   likedProfiles  — I liked, no mutual yet
 *   hiddenProfiles — I dismissed
 *
 * ParticipantsScreen mounts its own useState mirrors and OtherUserProfile
 * uses these mutators directly. Both write to the same sessionStorage keys
 * so state is consistent on next mount.
 */

export function getConnections(): StoredPerson[] {
  return readJson<StoredPerson[]>('connections', []);
}

export function getLikedProfiles(): StoredPerson[] {
  return readJson<StoredPerson[]>('likedProfiles', []);
}

export function getHiddenProfiles(): StoredPerson[] {
  return readJson<StoredPerson[]>('hiddenProfiles', []);
}

const sameId = (a: StoredPerson, b: StoredPerson) => String(a.id) === String(b.id);
const matchId = (id: string) => (p: StoredPerson) => String(p.id) === id;

function setBucket(key: 'connections' | 'likedProfiles' | 'hiddenProfiles', list: StoredPerson[]): void {
  writeJson(key, list);
}

export function addToConnections(person: StoredPerson): void {
  const list = getConnections();
  if (list.some((p) => sameId(p, person))) return;
  setBucket('connections', [...list, person]);
}

export function removeFromConnections(id: string): void {
  setBucket('connections', getConnections().filter((p) => !matchId(id)(p)));
}

export function addToLiked(person: StoredPerson): void {
  const list = getLikedProfiles();
  if (list.some((p) => sameId(p, person))) return;
  setBucket('likedProfiles', [...list, person]);
}

export function removeFromLiked(id: string): void {
  setBucket('likedProfiles', getLikedProfiles().filter((p) => !matchId(id)(p)));
}

export function addToHidden(person: StoredPerson): void {
  const list = getHiddenProfiles();
  if (list.some((p) => sameId(p, person))) return;
  setBucket('hiddenProfiles', [...list, person]);
}

export function removeFromHidden(id: string): void {
  setBucket('hiddenProfiles', getHiddenProfiles().filter((p) => !matchId(id)(p)));
}

export type Relationship = 'default' | 'liked' | 'connection' | 'hidden';

/** Computed relationship between the local user and `userId` for the current event. */
export function getRelationship(userId: string): Relationship {
  if (getConnections().some(matchId(userId))) return 'connection';
  if (getLikedProfiles().some(matchId(userId))) return 'liked';
  if (getHiddenProfiles().some(matchId(userId))) return 'hidden';
  return 'default';
}

/* ───────── connection goal (drives the Networking Opportunities progress bar) ───────── */

const CONNECTION_GOAL_KEY = 'connectionGoal';
const DEFAULT_GOAL = 5;
const MIN_GOAL = 1;
const MAX_GOAL = 10;

export function getConnectionGoal(): number {
  try {
    const v = sessionStorage.getItem(CONNECTION_GOAL_KEY);
    if (v === null) return DEFAULT_GOAL;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return DEFAULT_GOAL;
    return Math.max(MIN_GOAL, Math.min(MAX_GOAL, n));
  } catch {
    return DEFAULT_GOAL;
  }
}

export function setConnectionGoal(n: number): void {
  const clamped = Math.max(MIN_GOAL, Math.min(MAX_GOAL, Math.round(n)));
  try {
    sessionStorage.setItem(CONNECTION_GOAL_KEY, String(clamped));
  } catch {
    /* ignore */
  }
}

export const CONNECTION_GOAL_OPTIONS = Array.from(
  { length: MAX_GOAL - MIN_GOAL + 1 },
  (_, i) => i + MIN_GOAL,
);

/* ───────── viewed-gallery flag (controls Home "+N new" badge) ───────── */

const VIEWED_GALLERY_KEY = 'viewedGallery';

export function getViewedGallery(): boolean {
  try {
    return sessionStorage.getItem(VIEWED_GALLERY_KEY) === '1';
  } catch {
    return false;
  }
}

export function markGalleryViewed(): void {
  try {
    sessionStorage.setItem(VIEWED_GALLERY_KEY, '1');
  } catch {
    /* ignore */
  }
}

/* ───────── default seed ───────── */

const SEED_FLAG = 'chatStore_seeded_v1';

/**
 * Seeds default state on first run so the Messages tab has content
 * to demo without going through Participants first.
 *
 * - Sarah Johnson — connection with a small message history.
 * - Michael Chen ('1') — connection without messages → "New connection" CTA.
 * - Emma Rodriguez ('2') — liked, with one inbound message → appears in Liked tab.
 *
 * Idempotent: only runs once per session (gated by SEED_FLAG).
 */
export function seedChatStoreOnce(): void {
  if (sessionStorage.getItem(SEED_FLAG)) return;

  // Connections
  const seedConnections: StoredPerson[] = [
    {
      id: 'sarah-johnson',
      name: 'Sarah Johnson',
      position: 'Product Designer',
      company: 'Figma',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      matchTags: ['UX Design', 'Product', 'AI'],
      wantToTalkAbout: ['AI in design tools and automation workflows'],
      interests: ['UX Design', 'Product Strategy', 'AI & Machine Learning', 'Design Systems'],
    },
    {
      id: '1',
      name: 'Michael Chen',
      position: 'Senior Product Manager',
      company: 'Google',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      matchTags: ['Product', 'AI', 'Technology'],
      wantToTalkAbout: ['Building AI-powered features', 'Scaling teams'],
      interests: ['Product Strategy', 'AI', 'Data Analytics', 'Leadership'],
    },
  ];
  const existingConnections = getConnections();
  if (existingConnections.length === 0) {
    writeJson('connections', seedConnections);
  }

  // Liked
  const seedLiked: StoredPerson[] = [
    {
      id: '2',
      name: 'Emma Rodriguez',
      position: 'UX Research Lead',
      company: 'Airbnb',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      matchTags: ['Design', 'Research', 'UX'],
      wantToTalkAbout: ['Quantitative vs qualitative research methods'],
      interests: ['User Research', 'Design Thinking', 'Psychology', 'UX Design'],
    },
  ];
  const existingLiked = getLikedProfiles();
  if (existingLiked.length === 0) {
    writeJson('likedProfiles', seedLiked);
  }

  // Sarah — populated history
  if (!hasMessages('sarah-johnson')) {
    const baseTs = Date.now() - 60 * 60 * 1000;
    const seed: ChatMessage[] = [
      {
        id: 'm1',
        text: "Hi! I saw we're both interested in AI in design tools. Would love to connect!",
        sentAt: new Date(baseTs).toISOString(),
        isOutgoing: false,
      },
      {
        id: 'm2',
        text: "Hey Sarah! Absolutely, I'd love to chat about that. Are you going to the AI workshop tomorrow?",
        sentAt: new Date(baseTs + 3 * 60 * 1000).toISOString(),
        isOutgoing: true,
        read: true,
      },
      {
        id: 'm3',
        text: 'Yes! Looking forward to it. Want to grab coffee before?',
        sentAt: new Date(baseTs + 5 * 60 * 1000).toISOString(),
        isOutgoing: false,
      },
      {
        id: 'm4',
        text: 'Looking forward to our meeting tomorrow!',
        sentAt: new Date(baseTs + 7 * 60 * 1000).toISOString(),
        isOutgoing: false,
      },
    ];
    writeJson(messagesKey('sarah-johnson'), seed);
  }

  // Emma — single inbound message so she shows up in Liked
  if (!hasMessages('2')) {
    const seed: ChatMessage[] = [
      {
        id: 'em1',
        text: 'Can you share that article you mentioned?',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isOutgoing: false,
      },
    ];
    writeJson(messagesKey('2'), seed);
  }

  // General event chat — welcome from organizer + a couple of attendee messages
  if (!hasMessages('general')) {
    const baseTs = Date.now() - 6 * 60 * 60 * 1000;
    const seed: ChatMessage[] = [
      {
        id: 'g1',
        text: 'Welcome everyone to Tech Summit 2026! 🎉 Schedule and floor map are in Info.',
        sentAt: new Date(baseTs).toISOString(),
        isOutgoing: false,
        senderId: 'sarah-johnson', // stand-in for organizer voice in the prototype
      },
      {
        id: 'g2',
        text: 'Anyone heading to the AI workshop at 11? Looking for company.',
        sentAt: new Date(baseTs + 2 * 60 * 60 * 1000).toISOString(),
        isOutgoing: false,
        senderId: '1',
      },
      {
        id: 'g3',
        text: 'I’ll be there 👋',
        sentAt: new Date(baseTs + 2 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
        isOutgoing: false,
        senderId: '2',
      },
    ];
    writeJson(messagesKey('general'), seed);
  }

  sessionStorage.setItem(SEED_FLAG, '1');
}
