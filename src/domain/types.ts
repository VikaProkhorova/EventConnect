/**
 * EventConnect — Domain Model
 *
 * Single source of truth for system entities. Derived from
 * `src/imports/EventConnect_MVP_SOW_v2.txt` and the Figma prototype.
 *
 * Conventions:
 * - All ids are opaque branded strings.
 * - All timestamps are ISO-8601 strings (`Iso`).
 * - Nullable fields use `null`; optional fields use `?`.
 *   `null` = explicitly absent; `undefined` = not loaded / not applicable.
 */

/* ───────── Branded ID types ───────── */

export type Id<T extends string> = string & { readonly __brand: T };
export type UserId = Id<'User'>;
export type EventId = Id<'Event'>;
export type ConversationId = Id<'Conversation'>;
export type MessageId = Id<'Message'>;
export type CalendarEntryId = Id<'CalendarEntry'>;
export type NotificationId = Id<'Notification'>;
export type ProximityMarkId = Id<'ProximityMark'>;
export type PhotoId = Id<'Photo'>;
export type MaterialId = Id<'Material'>;
export type SponsorId = Id<'Sponsor'>;
export type SpeakerId = UserId; // speakers are users with a flag

export type Iso = string;

/* ───────── Enums (string literal unions) ───────── */

export type UserRole = 'attendee' | 'speaker' | 'organizer';

export type Grade = 'junior' | 'middle' | 'senior' | 'lead' | 'head' | 'cxo';

/** Kano category — used for SOW traceability, not runtime logic. */
export type KanoCategory =
  | 'must-have'
  | 'performance'
  | 'attractive'
  | 'indifferent'
  | 'reverse';

/** Per-user reaction toward another user inside an event context. */
export type ReactionKind = 'like' | 'hide' | 'none';

/** Three privacy axes per SOW §4.9. Values are intentionally identical. */
export type PrivacyAudience = 'all' | 'liked-or-match' | 'match-only';

/** Match-tab visibility (only 2 levels per SOW). */
export type MatchVisibility = 'all' | 'liked';

export type ConversationKind = 'one-on-one' | 'group' | 'event-general';

export type MessageKind =
  | 'text'
  | 'photo'
  | 'file'
  | 'voice'
  | 'location'
  | 'system';

export type CalendarEntryKind =
  | 'official-session'
  | 'personal-meeting'
  | 'free-conversation';

export type RsvpStatus = 'yes' | 'maybe' | 'none';

export type NotificationKind =
  | 'new-message'
  | 'mutual-match'
  | 'meeting-reminder'
  | 'profile-incomplete'
  | 'engagement-nudge'
  | 'break-networking'
  | 'post-event-followup'
  | 'session-starting';

export type GallerySource = 'photographer' | 'guest';

export type EventLifecyclePhase =
  | 'pre-event'
  | 'during-event'
  | 'post-event-active' // ≤ 1.5 months after end
  | 'archived'; // read-only

export type FeatureFlag =
  | 'sponsors'
  | 'gallery'
  | 'network-real-time'
  | 'general-chat'
  | 'free-conversations'
  | 'guest-photos';

/* ───────── Value objects ───────── */

export interface Contacts {
  email: string | null;
  linkedin: string | null;
  telegram: string | null;
}

export interface PrivacySettings {
  /** Who sees me in the Match tab. */
  matchVisibility: MatchVisibility;
  /** Who can initiate chat with me. */
  whoCanWrite: PrivacyAudience;
  /** Who can see my contacts. */
  contactVisibility: PrivacyAudience;
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  matchVisibility: 'all',
  whoCanWrite: 'all',
  contactVisibility: 'liked-or-match',
};

export interface VenuePoint {
  /** Normalized venue coordinates [0, 1] x [0, 1]. */
  x: number;
  y: number;
}

/* ───────── Core entities ───────── */

/**
 * User — the platform-level identity. Cross-event.
 * Per-event projection of a user is represented by `EventMembership`.
 */
export interface User {
  id: UserId;
  email: string;
  fullName: string;
  photoUrl: string | null;
  role: UserRole;

  /** Profile fields used by matching + display. */
  position: string | null;
  company: string | null;
  industry: string | null;
  grade: Grade | null;
  description: string | null;
  /** Topics user wants to discuss now. Free text. */
  wantToTalkAbout: string | null;
  interests: string[];
  contacts: Contacts;

  privacy: PrivacySettings;

  createdAt: Iso;
}

/** Required-fields gate for unlocking the Match tab (SOW §4.4). */
export const REQUIRED_PROFILE_FIELDS: ReadonlyArray<keyof User> = [
  'fullName',
  'position',
  'grade',
  'company',
];
export const MIN_INTERESTS_FOR_MATCH = 7;

export interface ProfileCompleteness {
  /** 0..100. Percentage of total weight filled. */
  percent: number;
  /** True when user passed the gate (5 required fields + 7 interests). */
  matchGateOpen: boolean;
  /** Names of missing required fields, for nudge UI. */
  missingFields: ReadonlyArray<string>;
}

/** Event = the conference/meetup entity. */
export interface Event {
  id: EventId;
  name: string;
  shortName: string; // for the Instagram-style switcher
  brandColor: string; // tailwind class e.g. 'bg-blue-600'
  imageUrl: string;
  startDate: Iso;
  endDate: Iso;
  timezone: string;
  city: string;
  address: string;
  organizerId: UserId;

  /** Organizer-controlled toggles. */
  features: Readonly<Record<FeatureFlag, boolean>>;
  /** Cap on visible attendees in the All tab; null = unlimited. */
  attendeeVisibilityLimit: number | null;
  /** Whether attendee list is hidden after event ends. */
  hideAttendeesPostEvent: boolean;

  /** Materials, sponsors, floor map etc. (SOW §4.11) */
  floorMapUrl: string | null;
  organizerContacts: Contacts;
}

/** Per-event registration of a user. */
export interface EventMembership {
  userId: UserId;
  eventId: EventId;
  registeredAt: Iso;
  /** Speaker badge per-event (a user can be a speaker at one event, attendee at another). */
  isSpeaker: boolean;
  /** Has the user opted into geolocation for Network in Real Time? */
  geoOptIn: boolean;
}

/**
 * Match — symmetric per-pair, per-event reaction record.
 * Stored once per unordered (userA, userB) pair where userA.id < userB.id.
 */
export interface Match {
  eventId: EventId;
  userAId: UserId;
  userBId: UserId;
  reactionByA: ReactionKind;
  reactionByB: ReactionKind;
  /** True iff both reactions are 'like'. */
  isMutual: boolean;
  createdAt: Iso;
  updatedAt: Iso;
}

/** Match-ranking score breakdown for a candidate (SOW: Position > Interests > Industry). */
export interface MatchScore {
  candidateId: UserId;
  positionOverlap: number; // 1 if same position keyword, 0 otherwise
  interestOverlap: number; // count of shared interest tags
  industryOverlap: number; // 1 if same industry, 0 otherwise
  total: number; // weighted sum used for sort
  /** Human-readable tags for the match-card chips. */
  matchTags: string[];
}

/** Hashtag-style private note one user attaches to another (SOW §4.9). */
export interface HashtagNote {
  ownerId: UserId; // who wrote the note
  targetId: UserId; // about whom
  eventId: EventId;
  text: string; // 1–2 words ideally
  updatedAt: Iso;
}

/* ───────── Chat ───────── */

export interface Conversation {
  id: ConversationId;
  eventId: EventId;
  kind: ConversationKind;
  participantIds: UserId[];
  /** Last message preview cached for list rendering. */
  lastMessage: Message | null;
  createdAt: Iso;
}

export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  kind: MessageKind;
  text: string | null; // for text + caption
  attachmentUrl: string | null;
  /** For voice: duration seconds. For file: byte size. */
  attachmentMeta: Record<string, unknown> | null;
  /** Optional location pin (kind === 'location'). */
  location: VenuePoint | null;
  /** Set of user ids who have read this message. */
  readBy: UserId[];
  /** id of message being replied to. */
  replyToId: MessageId | null;
  /** Emoji → set of users who reacted. */
  reactions: Record<string, UserId[]>;
  sentAt: Iso;
}

/* ───────── Calendar / Meetings ───────── */

export interface CalendarEntry {
  id: CalendarEntryId;
  eventId: EventId;
  kind: CalendarEntryKind;
  title: string;
  startAt: Iso;
  endAt: Iso;
  location: string | null;

  /** All attendees (users) of this entry. */
  participantIds: UserId[];
  /** RSVP per user (only for entries the user was invited to). */
  rsvp: Record<UserId, RsvpStatus>;

  /** Topic text — used for free conversations and as session description. */
  topic: string | null;

  /** Speakers — only for `official-session`. */
  speakerIds: SpeakerId[];

  /** Stage / room — only for `official-session`. */
  stage: string | null;

  /** "Going with" snapshot used for the social-proof avatars on session cards. */
  goingWith: UserId[];

  /** Auto-generated proximity mark when ≥2 people gather (free-conversation only). */
  proximityMarkId: ProximityMarkId | null;

  createdById: UserId | null; // null for org-imported sessions
  createdAt: Iso;
}

/** Smart-scheduling result: a window of mutual free time. */
export interface FreeTimeWindow {
  startAt: Iso;
  endAt: Iso;
  /** How many other attendees are free in this window. */
  otherFreeCount: number;
  /** How many public free-conversations exist in this window. */
  freeConversationCount: number;
}

/* ───────── Network in Real Time ───────── */

/** A user's last-known position on the venue map. */
export interface ProximityPosition {
  userId: UserId;
  eventId: EventId;
  point: VenuePoint;
  updatedAt: Iso;
}

/** A "conversation mark" — manual or auto-generated cluster on the map. */
export interface ProximityMark {
  id: ProximityMarkId;
  eventId: EventId;
  topic: string;
  point: VenuePoint;
  createdById: UserId;
  participantIds: UserId[];
  /** If non-null, this mark is owned by a free-conversation calendar entry. */
  linkedCalendarEntryId: CalendarEntryId | null;
  createdAt: Iso;
  /**
   * Marks auto-delete when:
   *   - everyone leaves the cluster (group disperses), or
   *   - the solo creator walks away and no one else joined.
   * `dissolvedAt` is set when this happens.
   */
  dissolvedAt: Iso | null;
}

/* ───────── Notifications ───────── */

export interface AppNotification {
  id: NotificationId;
  userId: UserId;
  eventId: EventId | null;
  kind: NotificationKind;
  title: string;
  body: string | null;
  /** Deep link target (e.g. `/event/123/chat/45`). */
  link: string | null;
  read: boolean;
  createdAt: Iso;
}

/* ───────── Gallery ───────── */

export interface Photo {
  id: PhotoId;
  eventId: EventId;
  source: GallerySource;
  url: string;
  uploadedById: UserId | null;
  caption: string | null;
  uploadedAt: Iso;
}

/* ───────── Materials, Speakers, Sponsors (Info screen) ───────── */

export interface Material {
  id: MaterialId;
  eventId: EventId;
  category: 'presentation' | 'transcript' | 'record';
  title: string;
  url: string;
  speakerId: SpeakerId | null;
}

export interface Sponsor {
  id: SponsorId;
  eventId: EventId;
  name: string;
  logoUrl: string;
  link: string | null;
}

/* ───────── Auth ───────── */

export interface MagicLink {
  /** Opaque one-time token. */
  token: string;
  email: string;
  eventId: EventId;
  used: boolean;
  expiresAt: Iso;
  /** Bound to the first device that consumes it. */
  deviceFingerprint: string | null;
}

export interface Session {
  userId: UserId;
  /** Active membership context — the event the user is currently viewing. */
  activeEventId: EventId | null;
  issuedAt: Iso;
}

/* ───────── Composite read models ───────── */

/**
 * Home dashboard data — single round-trip per `useHome(eventId)`.
 * Computed server-side from primitives above.
 */
export interface HomeDashboard {
  event: Event;
  membership: EventMembership;
  /** "97 people share your interests" */
  interestOverlapCount: number;
  /** "20 people from Technology" */
  industryOverlapCount: number;
  topMatch: ParticipantCard | null;
  unreviewedMatchCount: number;
  participantCount: number;
  newParticipantCount: number;
  profileCompleteness: ProfileCompleteness;
  galleryPhotoCount: number;
  galleryNewCount: number;
  calendarSummary: {
    meetingsToday: number;
    freeMinutesToday: number;
    sessionsWithoutNotesToday: number;
  };
  recentNotifications: AppNotification[];
  lifecyclePhase: EventLifecyclePhase;
}

/** Card payload used by ParticipantsScreen, HomeScreen TopMatch, search list. */
export interface ParticipantCard {
  user: User;
  matchScore: MatchScore;
  /** Reaction current user already gave (none for fresh candidates). */
  myReaction: ReactionKind;
  /** Mutual match status. */
  isMutual: boolean;
  /** Hashtag note current user has on this person, if any. */
  myHashtag: string | null;
  isSpeaker: boolean;
}

/** Filters for Participants > All tab (SOW §4.5). */
export interface ParticipantFilters {
  search: string;
  company: string;
  position: string;
  industry: string;
  grade: Grade | null;
  interests: string[];
  /** Free-text search inside "want to talk about" field. */
  wantToTalkAbout: string;
}

export type ParticipantSort =
  | 'relevance'
  | 'name'
  | 'company'
  | 'match-count';

/** Conversation list item — used by ChatScreen tabs. */
export interface ConversationListItem {
  conversation: Conversation;
  /** The other user (for one-on-one) or null for group. */
  otherUser: User | null;
  hashtag: string | null;
  unreadCount: number;
  /** Relationship state with the other user (for tab filtering). */
  relationshipTab: 'all' | 'match' | 'liked' | 'hidden';
}

/** Result of profile-gate check used to lock the Match tab. */
export interface ProfileGate {
  open: boolean;
  /** What to tell the user is missing. */
  reason: string | null;
}
