/**
 * EventConnect — API contract.
 *
 * This is the single boundary between UI and the backend. Both the
 * in-memory mock client (`mockClient.ts`) and a future HTTP client
 * (REST / tRPC / GraphQL) MUST implement `ApiClient`.
 *
 * Each method either returns a Promise<T> or accepts a callback for
 * subscription-style endpoints (chat, proximity).
 */

import type {
  AppNotification,
  CalendarEntry,
  CalendarEntryId,
  CalendarEntryKind,
  Conversation,
  ConversationId,
  ConversationListItem,
  Event,
  EventId,
  EventMembership,
  FreeTimeWindow,
  Grade,
  HashtagNote,
  HomeDashboard,
  Iso,
  Material,
  Match,
  MatchScore,
  Message,
  MessageId,
  ParticipantCard,
  ParticipantFilters,
  ParticipantSort,
  Photo,
  PhotoId,
  PrivacySettings,
  ProfileGate,
  ProximityMark,
  ProximityMarkId,
  ProximityPosition,
  ReactionKind,
  Session,
  Sponsor,
  User,
  UserId,
  VenuePoint,
} from '@/domain/types';

/* ───────── Auth ───────── */

export interface AuthApi {
  /** Request a magic link be emailed to `email` (rate-limited). */
  requestMagicLink(email: string): Promise<void>;
  /** Consume a magic-link token. Returns a session bound to one device. */
  consumeMagicLink(token: string, deviceFingerprint: string): Promise<Session>;
  /** Current session, or null if logged out. */
  getSession(): Promise<Session | null>;
  setActiveEvent(eventId: EventId): Promise<void>;
  logout(): Promise<void>;
}

/* ───────── Events ───────── */

export interface EventsApi {
  /** Events the current user is registered for. */
  listMine(query?: { search?: string }): Promise<Event[]>;
  get(id: EventId): Promise<Event>;
  /** Active membership for the current user in this event. */
  getMembership(eventId: EventId): Promise<EventMembership>;
  setGeoOptIn(eventId: EventId, optIn: boolean): Promise<void>;
}

/* ───────── Profile ───────── */

export interface ProfileApi {
  me(): Promise<User>;
  updateMe(patch: Partial<User>): Promise<User>;
  updatePrivacy(patch: Partial<PrivacySettings>): Promise<User>;
  /** Fetch the gating result for the current user inside the given event. */
  getMatchGate(eventId: EventId): Promise<ProfileGate>;
  /** Public profile of another user, scoped to the event for privacy rules. */
  getPublicProfile(eventId: EventId, userId: UserId): Promise<User>;
  /** LinkedIn import — returns a partial user the caller can review/save. */
  importFromLinkedIn(): Promise<Partial<User>>;
}

/* ───────── Participants & Matching ───────── */

export interface ParticipantsApi {
  /** Recommended candidates for the swipe deck (Participants > Match). */
  listMatchDeck(
    eventId: EventId,
    opts?: { limit?: number; cursor?: string },
  ): Promise<{ items: ParticipantCard[]; nextCursor: string | null }>;

  /** Full directory (Participants > All). */
  listAll(
    eventId: EventId,
    filters: Partial<ParticipantFilters>,
    sort: ParticipantSort,
    page?: { limit: number; cursor?: string },
  ): Promise<{ items: ParticipantCard[]; nextCursor: string | null; total: number }>;

  /** Liked / Hidden buckets. */
  listByReaction(
    eventId: EventId,
    reaction: 'like' | 'hide',
  ): Promise<ParticipantCard[]>;

  /** Computed score for a single candidate — debug / details modal. */
  getScore(eventId: EventId, candidateId: UserId): Promise<MatchScore>;

  /** Apply a swipe / button reaction. Returns whether this caused a mutual match. */
  react(
    eventId: EventId,
    targetId: UserId,
    reaction: ReactionKind,
  ): Promise<{ match: Match; mutualJustHappened: boolean }>;

  /** Current user's hashtag note for `targetId`. */
  setHashtagNote(eventId: EventId, targetId: UserId, text: string | null): Promise<HashtagNote | null>;
}

/* ───────── Home / Dashboard ───────── */

export interface HomeApi {
  getDashboard(eventId: EventId): Promise<HomeDashboard>;
}

/* ───────── Chat ───────── */

export interface ChatApi {
  listConversations(
    eventId: EventId,
    tab: 'all' | 'match' | 'liked' | 'hidden',
  ): Promise<ConversationListItem[]>;

  /** Open or create a 1:1 conversation with another user. */
  openOneOnOne(eventId: EventId, otherUserId: UserId): Promise<Conversation>;

  getConversation(id: ConversationId): Promise<Conversation>;
  listMessages(
    id: ConversationId,
    page?: { before?: Iso; limit?: number },
  ): Promise<{ items: Message[]; hasMore: boolean }>;

  sendMessage(input: {
    conversationId: ConversationId;
    text?: string;
    attachmentUrl?: string;
    kind?: 'text' | 'photo' | 'file' | 'voice' | 'location';
    location?: VenuePoint;
    replyToId?: MessageId;
  }): Promise<Message>;

  markRead(conversationId: ConversationId, upToMessageId: MessageId): Promise<void>;

  reactToMessage(messageId: MessageIdInput, emoji: string): Promise<Message>;

  setTyping(conversationId: ConversationId, isTyping: boolean): Promise<void>;

  /** Subscribe to live updates for a conversation. Returns unsubscribe fn. */
  subscribe(
    conversationId: ConversationId,
    listener: (e: ChatEvent) => void,
  ): () => void;
}

/** Allow either { id } or raw id string at call sites. */
export type MessageIdInput = MessageId | { id: MessageId };

export type ChatEvent =
  | { kind: 'message-sent'; message: Message }
  | { kind: 'message-read'; messageId: MessageId; readerId: UserId }
  | { kind: 'message-reacted'; message: Message }
  | { kind: 'typing'; userId: UserId; isTyping: boolean };

/* ───────── Calendar ───────── */

export interface CalendarApi {
  /** All entries on a given day for the current user. */
  listDay(eventId: EventId, day: Iso): Promise<CalendarEntry[]>;

  /** Public free-conversations across the event (used by "See free conversation"). */
  listFreeConversations(eventId: EventId, day: Iso): Promise<CalendarEntry[]>;

  /** Mutual free-time computation for "+ Meeting" chat overlay. */
  getMutualFreeTime(
    eventId: EventId,
    otherUserId: UserId,
    day: Iso,
  ): Promise<FreeTimeWindow[]>;

  /** "34 persons are free in this time and 2 conversations" stats for the home/calendar nudge. */
  getFreeTimeStats(
    eventId: EventId,
    window: { startAt: Iso; endAt: Iso },
  ): Promise<{ otherFreeCount: number; freeConversationCount: number }>;

  /** Create a new entry. Permissions: only personal-meeting / free-conversation by attendees; official sessions are imported. */
  create(input: {
    eventId: EventId;
    kind: Exclude<CalendarEntryKind, 'official-session'>;
    title: string;
    startAt: Iso;
    endAt: Iso;
    location?: string;
    topic?: string;
    inviteUserIds?: UserId[];
  }): Promise<CalendarEntry>;

  rsvp(entryId: CalendarEntryId, status: 'yes' | 'maybe' | 'none'): Promise<CalendarEntry>;

  /** "Find someone to network" / "Find someone to go with". */
  findCompanions(
    eventId: EventId,
    opts: { entryId?: CalendarEntryId; window?: { startAt: Iso; endAt: Iso } },
  ): Promise<ParticipantCard[]>;
}

/* ───────── Network in Real Time ───────── */

export interface ProximityApi {
  /** Push current user's position. Throttled server-side to 1/30s. */
  reportPosition(eventId: EventId, point: VenuePoint): Promise<void>;

  /** Snapshot of nearby people + active marks. */
  getSnapshot(
    eventId: EventId,
  ): Promise<{ positions: ProximityPosition[]; marks: ProximityMark[] }>;

  /** Create a new conversation mark at the user's current location. */
  createMark(eventId: EventId, topic: string, point: VenuePoint): Promise<ProximityMark>;

  /** Join an existing mark — counts toward the auto-dissolve logic. */
  joinMark(markId: ProximityMarkId): Promise<ProximityMark>;
  leaveMark(markId: ProximityMarkId): Promise<void>;

  /** Subscribe to real-time mark + position deltas (WebSocket). */
  subscribe(
    eventId: EventId,
    listener: (e: ProximityEvent) => void,
  ): () => void;
}

export type ProximityEvent =
  | { kind: 'position-update'; position: ProximityPosition }
  | { kind: 'mark-created'; mark: ProximityMark }
  | { kind: 'mark-updated'; mark: ProximityMark }
  | { kind: 'mark-dissolved'; markId: ProximityMarkId };

/* ───────── Notifications ───────── */

export interface NotificationsApi {
  /** Most recent notifications for the home strip (newest first). */
  list(eventId: EventId | null, limit?: number): Promise<AppNotification[]>;
  markRead(id: AppNotification['id']): Promise<void>;
  markAllRead(eventId: EventId | null): Promise<void>;
  /** Subscribe to push updates (in mock: in-memory event bus). */
  subscribe(listener: (n: AppNotification) => void): () => void;
}

/* ───────── Gallery ───────── */

export interface GalleryApi {
  list(eventId: EventId, source: 'photographer' | 'guest'): Promise<Photo[]>;
  /** Attendee upload — published immediately, organizer can remove. */
  upload(eventId: EventId, file: { url: string; caption?: string }): Promise<Photo>;
  remove(photoId: PhotoId): Promise<void>;
}

/* ───────── Info (Event details) ───────── */

export interface InfoApi {
  getMaterials(eventId: EventId): Promise<Material[]>;
  getSponsors(eventId: EventId): Promise<Sponsor[]>;
  /** Speakers = users with `isSpeaker = true` in their membership. */
  getSpeakers(eventId: EventId): Promise<User[]>;
  /** Agenda preview: official sessions grouped by day. */
  getAgenda(eventId: EventId): Promise<Record<Iso, CalendarEntry[]>>;
}

/* ───────── QR ───────── */

export interface QrApi {
  /** Get the dynamic QR payload for the current user inside this event. */
  getMyPayload(eventId: EventId): Promise<{ payload: string; userId: UserId }>;
  /**
   * Resolve a scanned QR payload to the target user inside this event.
   * Both sides see each other's profiles and may Like → mutual match.
   */
  resolveScan(eventId: EventId, payload: string): Promise<User>;
}

/* ───────── Aggregate ───────── */

export interface ApiClient {
  auth: AuthApi;
  events: EventsApi;
  profile: ProfileApi;
  participants: ParticipantsApi;
  home: HomeApi;
  chat: ChatApi;
  calendar: CalendarApi;
  proximity: ProximityApi;
  notifications: NotificationsApi;
  gallery: GalleryApi;
  info: InfoApi;
  qr: QrApi;
}
