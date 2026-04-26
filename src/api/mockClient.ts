/**
 * In-memory implementation of `ApiClient`.
 * Persists nothing — re-seeds on page reload.
 *
 * The intent is faithful behavior, not performance:
 *  - Match-ranking matches the SOW algorithm (Position > Interests > Industry).
 *  - Reactions create / mutate a single canonical Match record per pair.
 *  - Real-time endpoints use a tiny pub/sub.
 */

import type {
  ApiClient,
  AuthApi,
  CalendarApi,
  ChatApi,
  ChatEvent,
  EventsApi,
  GalleryApi,
  HomeApi,
  InfoApi,
  MessageIdInput,
  NotificationsApi,
  ParticipantsApi,
  ProfileApi,
  ProximityApi,
  ProximityEvent,
  QrApi,
} from './contract';
import type {
  AppNotification,
  CalendarEntry,
  CalendarEntryId,
  Conversation,
  ConversationId,
  ConversationListItem,
  Event,
  EventId,
  EventLifecyclePhase,
  EventMembership,
  FreeTimeWindow,
  HashtagNote,
  HomeDashboard,
  Iso,
  Match,
  MatchScore,
  Material,
  Message,
  MessageId,
  NotificationId,
  ParticipantCard,
  ParticipantFilters,
  ParticipantSort,
  Photo,
  PhotoId,
  PrivacySettings,
  ProfileCompleteness,
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
import {
  MIN_INTERESTS_FOR_MATCH,
  REQUIRED_PROFILE_FIELDS,
} from '@/domain/types';
import {
  SEED_ME_ID,
  seedCalendar,
  seedConversations,
  seedEvents,
  seedHashtagNotes,
  seedMarks,
  seedMatches,
  seedMemberships,
  seedMessages,
  seedNotifications,
  seedPhotos,
  seedPositions,
  seedSponsors,
  seedUsers,
} from './seed';

/* ───────── Utilities ───────── */

const wait = (ms = 50) => new Promise<void>((r) => setTimeout(r, ms));

const nowIso = (): Iso => new Date().toISOString();

const uid = <T extends string>(prefix: string): T =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}` as T;

const orderedPair = (a: UserId, b: UserId): [UserId, UserId] =>
  a < b ? [a, b] : [b, a];

class Emitter<T> {
  private listeners = new Set<(e: T) => void>();
  on(l: (e: T) => void): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  emit(e: T): void {
    for (const l of this.listeners) l(e);
  }
}

/* ───────── Store ───────── */

interface Store {
  meId: UserId;
  activeEventId: EventId | null;
  users: Map<UserId, User>;
  events: Map<EventId, Event>;
  memberships: EventMembership[];
  matches: Match[];
  hashtags: HashtagNote[];
  conversations: Map<ConversationId, Conversation>;
  messages: Message[]; // sorted by sentAt asc
  calendar: CalendarEntry[];
  positions: Map<UserId, ProximityPosition>;
  marks: Map<ProximityMarkId, ProximityMark>;
  notifications: AppNotification[];
  photos: Photo[];
  sponsors: Sponsor[];
  /** Per-conversation fan-out emitters. */
  chatEmitters: Map<ConversationId, Emitter<ChatEvent>>;
  proximityEmitter: Emitter<ProximityEvent>;
  notificationEmitter: Emitter<AppNotification>;
}

function buildStore(): Store {
  return {
    meId: SEED_ME_ID,
    activeEventId: null,
    users: new Map(seedUsers.map((u) => [u.id, u])),
    events: new Map(seedEvents.map((e) => [e.id, e])),
    memberships: [...seedMemberships],
    matches: [...seedMatches],
    hashtags: [...seedHashtagNotes],
    conversations: new Map(seedConversations.map((c) => [c.id, c])),
    messages: [...seedMessages].sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
    calendar: [...seedCalendar],
    positions: new Map(seedPositions.map((p) => [p.userId, p])),
    marks: new Map(seedMarks.map((m) => [m.id, m])),
    notifications: [...seedNotifications].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    ),
    photos: [...seedPhotos],
    sponsors: [...seedSponsors],
    chatEmitters: new Map(),
    proximityEmitter: new Emitter(),
    notificationEmitter: new Emitter(),
  };
}

/* ───────── Domain helpers ───────── */

function membersOf(s: Store, eventId: EventId): EventMembership[] {
  return s.memberships.filter((m) => m.eventId === eventId);
}

function memberUsers(s: Store, eventId: EventId, opts: { excludeMe?: boolean } = {}): User[] {
  const me = opts.excludeMe ? s.meId : null;
  return membersOf(s, eventId)
    .map((m) => s.users.get(m.userId))
    .filter((u): u is User => u !== undefined && u.id !== me);
}

function eventLifecyclePhase(e: Event, today = new Date()): EventLifecyclePhase {
  const start = new Date(e.startDate);
  const end = new Date(e.endDate);
  const archive = new Date(end);
  archive.setDate(archive.getDate() + 45); // 1.5 months
  if (today < start) return 'pre-event';
  if (today >= start && today <= end) return 'during-event';
  if (today > end && today <= archive) return 'post-event-active';
  return 'archived';
}

function findMatch(s: Store, eventId: EventId, a: UserId, b: UserId): Match | undefined {
  const [x, y] = orderedPair(a, b);
  return s.matches.find((m) => m.eventId === eventId && m.userAId === x && m.userBId === y);
}

function reactionFor(s: Store, eventId: EventId, viewer: UserId, target: UserId): ReactionKind {
  const m = findMatch(s, eventId, viewer, target);
  if (!m) return 'none';
  return m.userAId === viewer ? m.reactionByA : m.reactionByB;
}

function scoreCandidate(me: User, other: User): MatchScore {
  const positionOverlap =
    me.position && other.position && me.position.toLowerCase() === other.position.toLowerCase()
      ? 1
      : 0;
  const myInterests = new Set(me.interests.map((i) => i.toLowerCase()));
  const sharedInterests = other.interests.filter((i) => myInterests.has(i.toLowerCase()));
  const interestOverlap = sharedInterests.length;
  const industryOverlap =
    me.industry && other.industry && me.industry === other.industry ? 1 : 0;

  // Per SOW: Position > Interests > Industry. Weights chosen to make ordering strict
  // when one outranks another, while keeping ties tunable.
  const total = positionOverlap * 1000 + interestOverlap * 10 + industryOverlap;

  const matchTags: string[] = [];
  if (positionOverlap) matchTags.push(other.position!);
  matchTags.push(...sharedInterests.slice(0, 3));
  if (industryOverlap && other.industry) matchTags.push(other.industry);

  return {
    candidateId: other.id,
    positionOverlap,
    interestOverlap,
    industryOverlap,
    total,
    matchTags: matchTags.slice(0, 3),
  };
}

function profileCompleteness(u: User): ProfileCompleteness {
  // Weighted: required fields = 60%, interests = 20%, optional = 20%
  let percent = 0;
  const missing: string[] = [];

  for (const field of REQUIRED_PROFILE_FIELDS) {
    const v = u[field];
    if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
      missing.push(String(field));
    } else {
      percent += 60 / REQUIRED_PROFILE_FIELDS.length;
    }
  }

  if (u.interests.length >= MIN_INTERESTS_FOR_MATCH) percent += 20;
  else percent += (u.interests.length / MIN_INTERESTS_FOR_MATCH) * 20;

  let optional = 0;
  if (u.photoUrl) optional++;
  if (u.description) optional++;
  if (u.wantToTalkAbout) optional++;
  if (u.contacts.linkedin) optional++;
  if (u.contacts.telegram) optional++;
  percent += (optional / 5) * 20;

  const matchGateOpen = missing.length === 0 && u.interests.length >= MIN_INTERESTS_FOR_MATCH;

  return {
    percent: Math.round(percent),
    matchGateOpen,
    missingFields: missing,
  };
}

function hashtagFor(s: Store, eventId: EventId, owner: UserId, target: UserId): string | null {
  const h = s.hashtags.find(
    (n) => n.eventId === eventId && n.ownerId === owner && n.targetId === target,
  );
  return h?.text ?? null;
}

function buildParticipantCard(
  s: Store,
  eventId: EventId,
  me: User,
  other: User,
): ParticipantCard {
  const score = scoreCandidate(me, other);
  const m = findMatch(s, eventId, me.id, other.id);
  const isSpeaker = !!s.memberships.find(
    (mm) => mm.eventId === eventId && mm.userId === other.id && mm.isSpeaker,
  );
  return {
    user: other,
    matchScore: score,
    myReaction: reactionFor(s, eventId, me.id, other.id),
    isMutual: !!m?.isMutual,
    myHashtag: hashtagFor(s, eventId, me.id, other.id),
    isSpeaker,
  };
}

/* ───────── Client factory ───────── */

export function createMockClient(): ApiClient {
  const s = buildStore();

  const requireMe = (): User => {
    const u = s.users.get(s.meId);
    if (!u) throw new Error('Current user missing from store');
    return u;
  };

  const auth: AuthApi = {
    async requestMagicLink(email) {
      await wait();
      console.info('[mock auth] magic link sent to', email);
    },
    async consumeMagicLink(token, deviceFingerprint) {
      await wait();
      return { userId: s.meId, activeEventId: null, issuedAt: nowIso() };
    },
    async getSession() {
      await wait();
      return { userId: s.meId, activeEventId: s.activeEventId, issuedAt: nowIso() };
    },
    async setActiveEvent(eventId) {
      s.activeEventId = eventId;
    },
    async logout() {
      s.activeEventId = null;
    },
  };

  const events: EventsApi = {
    async listMine(query) {
      await wait();
      const myEventIds = new Set(
        s.memberships.filter((m) => m.userId === s.meId).map((m) => m.eventId),
      );
      let list = [...s.events.values()].filter((e) => myEventIds.has(e.id));
      if (query?.search) {
        const q = query.search.toLowerCase();
        list = list.filter((e) => e.name.toLowerCase().includes(q));
      }
      return list;
    },
    async get(id) {
      await wait();
      const e = s.events.get(id);
      if (!e) throw new Error(`Event ${id} not found`);
      return e;
    },
    async getMembership(eventId) {
      await wait();
      const m = s.memberships.find((mm) => mm.eventId === eventId && mm.userId === s.meId);
      if (!m) throw new Error('Not a member of this event');
      return m;
    },
    async setGeoOptIn(eventId, optIn) {
      await wait();
      s.memberships = s.memberships.map((m) =>
        m.eventId === eventId && m.userId === s.meId ? { ...m, geoOptIn: optIn } : m,
      );
    },
  };

  const profile: ProfileApi = {
    async me() {
      await wait();
      return requireMe();
    },
    async updateMe(patch) {
      await wait();
      const u = requireMe();
      const updated: User = { ...u, ...patch, contacts: { ...u.contacts, ...(patch.contacts ?? {}) } };
      s.users.set(updated.id, updated);
      return updated;
    },
    async updatePrivacy(patch) {
      await wait();
      const u = requireMe();
      const updated: User = { ...u, privacy: { ...u.privacy, ...patch } };
      s.users.set(updated.id, updated);
      return updated;
    },
    async getMatchGate(eventId) {
      await wait();
      const me = requireMe();
      const c = profileCompleteness(me);
      let gate: ProfileGate;
      if (c.matchGateOpen) gate = { open: true, reason: null };
      else if (c.missingFields.length > 0)
        gate = { open: false, reason: `Complete: ${c.missingFields.join(', ')}` };
      else
        gate = {
          open: false,
          reason: `Add at least ${MIN_INTERESTS_FOR_MATCH} interests (you have ${me.interests.length})`,
        };
      return gate;
    },
    async getPublicProfile(eventId, userId) {
      await wait();
      const u = s.users.get(userId);
      if (!u) throw new Error('User not found');
      // Privacy: hide contacts based on the target's privacy settings + reaction state
      const reaction = reactionFor(s, eventId, s.meId, userId);
      const m = findMatch(s, eventId, s.meId, userId);
      const isMatch = !!m?.isMutual;
      const isLikedByMe = reaction === 'like';
      const allowed =
        u.privacy.contactVisibility === 'all' ||
        (u.privacy.contactVisibility === 'liked-or-match' && (isLikedByMe || isMatch)) ||
        (u.privacy.contactVisibility === 'match-only' && isMatch);
      if (!allowed) {
        return {
          ...u,
          contacts: { email: null, linkedin: null, telegram: null },
        };
      }
      return u;
    },
    async importFromLinkedIn() {
      await wait(200);
      return {
        position: 'Software Engineer',
        company: 'Microsoft',
        industry: 'Technology',
      };
    },
  };

  const participants: ParticipantsApi = {
    async listMatchDeck(eventId) {
      await wait();
      const me = requireMe();
      const candidates = memberUsers(s, eventId, { excludeMe: true })
        .filter((u) => reactionFor(s, eventId, me.id, u.id) === 'none')
        .filter((u) => {
          // Respect target's matchVisibility setting
          if (u.privacy.matchVisibility === 'all') return true;
          // 'liked' = only if I've liked them (so exclude from deck)
          return false;
        });
      const cards = candidates.map((u) => buildParticipantCard(s, eventId, me, u));
      cards.sort((a, b) => b.matchScore.total - a.matchScore.total);
      return { items: cards, nextCursor: null };
    },
    async listAll(eventId, filters, sort, page) {
      await wait();
      const me = requireMe();
      const limit = Math.min(page?.limit ?? 50, s.events.get(eventId)?.attendeeVisibilityLimit ?? Infinity);
      let users = memberUsers(s, eventId, { excludeMe: true });

      if (filters.search) {
        const q = filters.search.toLowerCase();
        users = users.filter(
          (u) =>
            u.fullName.toLowerCase().includes(q) ||
            (u.company ?? '').toLowerCase().includes(q) ||
            (u.position ?? '').toLowerCase().includes(q),
        );
      }
      if (filters.company)
        users = users.filter((u) => (u.company ?? '').toLowerCase().includes(filters.company!.toLowerCase()));
      if (filters.position)
        users = users.filter((u) => (u.position ?? '').toLowerCase().includes(filters.position!.toLowerCase()));
      if (filters.industry)
        users = users.filter((u) => (u.industry ?? '').toLowerCase() === filters.industry!.toLowerCase());
      if (filters.grade) users = users.filter((u) => u.grade === filters.grade);
      if (filters.interests && filters.interests.length > 0) {
        const want = new Set(filters.interests.map((i) => i.toLowerCase()));
        users = users.filter((u) => u.interests.some((i) => want.has(i.toLowerCase())));
      }
      if (filters.wantToTalkAbout) {
        const q = filters.wantToTalkAbout.toLowerCase();
        users = users.filter((u) => (u.wantToTalkAbout ?? '').toLowerCase().includes(q));
      }

      const cards = users.map((u) => buildParticipantCard(s, eventId, me, u));
      switch (sort) {
        case 'name':
          cards.sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));
          break;
        case 'company':
          cards.sort((a, b) => (a.user.company ?? '').localeCompare(b.user.company ?? ''));
          break;
        case 'match-count':
        case 'relevance':
        default:
          cards.sort((a, b) => b.matchScore.total - a.matchScore.total);
      }
      const total = cards.length;
      return { items: cards.slice(0, limit), nextCursor: null, total };
    },
    async listByReaction(eventId, reaction) {
      await wait();
      const me = requireMe();
      const targets = s.matches
        .filter((m) => m.eventId === eventId)
        .filter((m) => {
          const isA = m.userAId === me.id;
          const isB = m.userBId === me.id;
          if (!isA && !isB) return false;
          const myReaction = isA ? m.reactionByA : m.reactionByB;
          return myReaction === reaction;
        })
        .map((m) => (m.userAId === me.id ? m.userBId : m.userAId));
      return targets
        .map((id) => s.users.get(id))
        .filter((u): u is User => !!u)
        .map((u) => buildParticipantCard(s, eventId, me, u));
    },
    async getScore(eventId, candidateId) {
      await wait();
      const me = requireMe();
      const other = s.users.get(candidateId);
      if (!other) throw new Error('Candidate not found');
      return scoreCandidate(me, other);
    },
    async react(eventId, targetId, reaction) {
      await wait();
      const me = requireMe();
      const [a, b] = orderedPair(me.id, targetId);
      const meIsA = a === me.id;
      const idx = s.matches.findIndex(
        (m) => m.eventId === eventId && m.userAId === a && m.userBId === b,
      );
      const existing = idx >= 0 ? s.matches[idx] : null;
      const next: Match = existing
        ? { ...existing, updatedAt: nowIso() }
        : {
            eventId,
            userAId: a,
            userBId: b,
            reactionByA: 'none',
            reactionByB: 'none',
            isMutual: false,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };
      if (meIsA) next.reactionByA = reaction;
      else next.reactionByB = reaction;
      const wasMutual = existing?.isMutual ?? false;
      next.isMutual = next.reactionByA === 'like' && next.reactionByB === 'like';
      if (idx >= 0) s.matches[idx] = next;
      else s.matches.push(next);

      const mutualJustHappened = !wasMutual && next.isMutual;

      if (mutualJustHappened) {
        const target = s.users.get(targetId);
        const notif: AppNotification = {
          id: uid<NotificationId>('n'),
          userId: me.id,
          eventId,
          kind: 'mutual-match',
          title: `You and ${target?.fullName ?? 'someone'} are a mutual match!`,
          body: 'Open the chat to introduce yourself.',
          link: `/event/${eventId}/participants`,
          read: false,
          createdAt: nowIso(),
        };
        s.notifications.unshift(notif);
        s.notificationEmitter.emit(notif);
      }
      return { match: next, mutualJustHappened };
    },
    async setHashtagNote(eventId, targetId, text) {
      await wait();
      const me = requireMe();
      s.hashtags = s.hashtags.filter(
        (h) => !(h.eventId === eventId && h.ownerId === me.id && h.targetId === targetId),
      );
      if (!text) return null;
      const note: HashtagNote = {
        ownerId: me.id,
        targetId,
        eventId,
        text,
        updatedAt: nowIso(),
      };
      s.hashtags.push(note);
      return note;
    },
  };

  const home: HomeApi = {
    async getDashboard(eventId) {
      await wait();
      const me = requireMe();
      const event = s.events.get(eventId);
      if (!event) throw new Error('Event not found');
      const membership = await events.getMembership(eventId);
      const allUsers = memberUsers(s, eventId, { excludeMe: true });
      const myInterests = new Set(me.interests.map((i) => i.toLowerCase()));
      const interestOverlapCount = allUsers.filter((u) =>
        u.interests.some((i) => myInterests.has(i.toLowerCase())),
      ).length;
      const industryOverlapCount = me.industry
        ? allUsers.filter((u) => u.industry === me.industry).length
        : 0;

      const deck = await participants.listMatchDeck(eventId);
      const topMatch = deck.items[0] ?? null;
      const liked = await participants.listByReaction(eventId, 'like');
      const unreviewedMatchCount = Math.max(0, deck.items.length - liked.length);

      const completeness = profileCompleteness(me);

      const allPhotos = s.photos.filter((p) => p.eventId === eventId);
      const since = new Date();
      since.setHours(since.getHours() - 24);
      const galleryNewCount = allPhotos.filter((p) => new Date(p.uploadedAt) >= since).length;

      const today = nowIso().slice(0, 10);
      const todays = s.calendar.filter(
        (e) => e.eventId === eventId && e.startAt.startsWith(today),
      );
      const meetingsToday = todays.filter(
        (e) => e.kind === 'personal-meeting' && e.participantIds.includes(me.id),
      ).length;
      const sessionsWithoutNotesToday = todays.filter(
        (e) => e.kind === 'official-session' && (e.topic === null || e.topic === ''),
      ).length;
      const myToday = todays
        .filter((e) => e.participantIds.includes(me.id))
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
      let freeMinutesToday = 0;
      for (let i = 0; i < myToday.length - 1; i++) {
        const gap =
          new Date(myToday[i + 1].startAt).getTime() - new Date(myToday[i].endAt).getTime();
        if (gap > 0) freeMinutesToday += Math.floor(gap / 60000);
      }

      const recentNotifications = s.notifications
        .filter((n) => n.userId === me.id && (n.eventId === null || n.eventId === eventId))
        .slice(0, 5);

      const newSinceCutoff = new Date();
      newSinceCutoff.setDate(newSinceCutoff.getDate() - 7);
      const newParticipantCount = s.memberships.filter(
        (m) =>
          m.eventId === eventId &&
          m.userId !== me.id &&
          new Date(m.registeredAt) >= newSinceCutoff,
      ).length;

      const dashboard: HomeDashboard = {
        event,
        membership,
        interestOverlapCount,
        industryOverlapCount,
        topMatch,
        unreviewedMatchCount,
        participantCount: membersOf(s, eventId).filter((m) => m.userId !== me.id).length,
        newParticipantCount,
        profileCompleteness: completeness,
        galleryPhotoCount: allPhotos.length,
        galleryNewCount,
        calendarSummary: { meetingsToday, freeMinutesToday, sessionsWithoutNotesToday },
        recentNotifications,
        lifecyclePhase: eventLifecyclePhase(event),
      };
      return dashboard;
    },
  };

  /* ───────── Chat ───────── */

  function emitterFor(convId: ConversationId): Emitter<ChatEvent> {
    let e = s.chatEmitters.get(convId);
    if (!e) {
      e = new Emitter();
      s.chatEmitters.set(convId, e);
    }
    return e;
  }

  function unwrapMsgId(input: MessageIdInput): MessageId {
    return typeof input === 'string' ? (input as MessageId) : input.id;
  }

  function reactionTab(
    s: Store,
    eventId: EventId,
    me: UserId,
    other: UserId,
  ): ConversationListItem['relationshipTab'] {
    const m = findMatch(s, eventId, me, other);
    if (!m) return 'all';
    if (m.isMutual) return 'match';
    const my = m.userAId === me ? m.reactionByA : m.reactionByB;
    if (my === 'like') return 'liked';
    if (my === 'hide') return 'hidden';
    return 'all';
  }

  const chat: ChatApi = {
    async listConversations(eventId, tab) {
      await wait();
      const me = requireMe();
      const items: ConversationListItem[] = [...s.conversations.values()]
        .filter((c) => c.eventId === eventId && c.participantIds.includes(me.id))
        .map((c) => {
          const otherId = c.kind === 'one-on-one' ? c.participantIds.find((p) => p !== me.id) ?? null : null;
          const otherUser = otherId ? s.users.get(otherId) ?? null : null;
          const hashtag = otherId ? hashtagFor(s, eventId, me.id, otherId) : null;
          const unread = s.messages.filter(
            (m) => m.conversationId === c.id && m.senderId !== me.id && !m.readBy.includes(me.id),
          ).length;
          const relationshipTab: ConversationListItem['relationshipTab'] =
            otherId ? reactionTab(s, eventId, me.id, otherId) : 'all';
          return {
            conversation: c,
            otherUser,
            hashtag,
            unreadCount: unread,
            relationshipTab,
          };
        })
        .sort((a, b) => {
          const ta = a.conversation.lastMessage?.sentAt ?? a.conversation.createdAt;
          const tb = b.conversation.lastMessage?.sentAt ?? b.conversation.createdAt;
          return tb.localeCompare(ta);
        });
      if (tab === 'all') return items;
      return items.filter((i) => i.relationshipTab === tab);
    },
    async openOneOnOne(eventId, otherUserId) {
      await wait();
      const me = requireMe();
      for (const c of s.conversations.values()) {
        if (
          c.eventId === eventId &&
          c.kind === 'one-on-one' &&
          c.participantIds.includes(me.id) &&
          c.participantIds.includes(otherUserId)
        )
          return c;
      }
      const c: Conversation = {
        id: uid<ConversationId>('c'),
        eventId,
        kind: 'one-on-one',
        participantIds: [me.id, otherUserId],
        lastMessage: null,
        createdAt: nowIso(),
      };
      s.conversations.set(c.id, c);
      return c;
    },
    async getConversation(id) {
      await wait();
      const c = s.conversations.get(id);
      if (!c) throw new Error('Conversation not found');
      return c;
    },
    async listMessages(id, page) {
      await wait();
      let list = s.messages.filter((m) => m.conversationId === id);
      if (page?.before)
        list = list.filter((m) => m.sentAt < page.before!);
      const limit = page?.limit ?? 50;
      const tail = list.slice(-limit);
      return { items: tail, hasMore: list.length > tail.length };
    },
    async sendMessage(input) {
      await wait();
      const me = requireMe();
      const newMsg: Message = {
        id: uid<MessageId>('m'),
        conversationId: input.conversationId,
        senderId: me.id,
        kind: input.kind ?? 'text',
        text: input.text ?? null,
        attachmentUrl: input.attachmentUrl ?? null,
        attachmentMeta: null,
        location: input.location ?? null,
        readBy: [me.id],
        replyToId: input.replyToId ?? null,
        reactions: {},
        sentAt: nowIso(),
      };
      s.messages.push(newMsg);
      const conv = s.conversations.get(input.conversationId);
      if (conv) {
        s.conversations.set(conv.id, { ...conv, lastMessage: newMsg });
      }
      emitterFor(input.conversationId).emit({ kind: 'message-sent', message: newMsg });
      return newMsg;
    },
    async markRead(conversationId, upToMessageId) {
      await wait();
      const me = requireMe();
      s.messages = s.messages.map((m) => {
        if (m.conversationId !== conversationId) return m;
        if (m.id > upToMessageId) return m;
        if (m.readBy.includes(me.id)) return m;
        return { ...m, readBy: [...m.readBy, me.id] };
      });
      emitterFor(conversationId).emit({
        kind: 'message-read',
        messageId: upToMessageId,
        readerId: me.id,
      });
    },
    async reactToMessage(messageIdInput, emoji) {
      await wait();
      const me = requireMe();
      const messageId = unwrapMsgId(messageIdInput);
      const idx = s.messages.findIndex((m) => m.id === messageId);
      if (idx < 0) throw new Error('Message not found');
      const m = s.messages[idx];
      const next: Message = {
        ...m,
        reactions: {
          ...m.reactions,
          [emoji]: [...(m.reactions[emoji] ?? []).filter((u) => u !== me.id), me.id],
        },
      };
      s.messages[idx] = next;
      emitterFor(m.conversationId).emit({ kind: 'message-reacted', message: next });
      return next;
    },
    async setTyping(conversationId, isTyping) {
      const me = requireMe();
      emitterFor(conversationId).emit({ kind: 'typing', userId: me.id, isTyping });
    },
    subscribe(conversationId, listener) {
      return emitterFor(conversationId).on(listener);
    },
  };

  /* ───────── Calendar ───────── */

  const calendar: CalendarApi = {
    async listDay(eventId, day) {
      await wait();
      const me = requireMe();
      const dayStart = day.slice(0, 10);
      return s.calendar
        .filter((e) => e.eventId === eventId && e.startAt.startsWith(dayStart))
        .filter((e) => e.kind !== 'personal-meeting' || e.participantIds.includes(me.id))
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
    },
    async listFreeConversations(eventId, day) {
      await wait();
      const dayStart = day.slice(0, 10);
      return s.calendar.filter(
        (e) =>
          e.eventId === eventId &&
          e.kind === 'free-conversation' &&
          e.startAt.startsWith(dayStart),
      );
    },
    async getMutualFreeTime(eventId, otherUserId, day) {
      await wait();
      const me = requireMe();
      const dayStart = day.slice(0, 10);
      const myEntries = s.calendar.filter(
        (e) =>
          e.eventId === eventId &&
          e.startAt.startsWith(dayStart) &&
          e.participantIds.includes(me.id),
      );
      const otherEntries = s.calendar.filter(
        (e) =>
          e.eventId === eventId &&
          e.startAt.startsWith(dayStart) &&
          e.participantIds.includes(otherUserId),
      );
      const busy = [...myEntries, ...otherEntries].sort((a, b) =>
        a.startAt.localeCompare(b.startAt),
      );
      const dayStartTs = new Date(`${dayStart}T08:00:00Z`).getTime();
      const dayEndTs = new Date(`${dayStart}T21:00:00Z`).getTime();
      const windows: FreeTimeWindow[] = [];
      let cursor = dayStartTs;
      for (const b of busy) {
        const bStart = new Date(b.startAt).getTime();
        if (bStart > cursor) {
          windows.push({
            startAt: new Date(cursor).toISOString(),
            endAt: new Date(bStart).toISOString(),
            otherFreeCount: 0,
            freeConversationCount: 0,
          });
        }
        cursor = Math.max(cursor, new Date(b.endAt).getTime());
      }
      if (cursor < dayEndTs) {
        windows.push({
          startAt: new Date(cursor).toISOString(),
          endAt: new Date(dayEndTs).toISOString(),
          otherFreeCount: 0,
          freeConversationCount: 0,
        });
      }
      return windows.filter((w) => new Date(w.endAt).getTime() - new Date(w.startAt).getTime() >= 15 * 60_000);
    },
    async getFreeTimeStats(eventId, window) {
      await wait();
      const startTs = new Date(window.startAt).getTime();
      const endTs = new Date(window.endAt).getTime();
      const everyone = memberUsers(s, eventId, { excludeMe: true });
      const otherFreeCount = everyone.filter((u) => {
        const busy = s.calendar.filter(
          (e) => e.eventId === eventId && e.participantIds.includes(u.id),
        );
        return !busy.some((b) => {
          const bs = new Date(b.startAt).getTime();
          const be = new Date(b.endAt).getTime();
          return bs < endTs && be > startTs;
        });
      }).length;
      const freeConversationCount = s.calendar.filter(
        (e) =>
          e.eventId === eventId &&
          e.kind === 'free-conversation' &&
          new Date(e.startAt).getTime() < endTs &&
          new Date(e.endAt).getTime() > startTs,
      ).length;
      return { otherFreeCount, freeConversationCount };
    },
    async create(input) {
      await wait();
      const me = requireMe();
      const entry: CalendarEntry = {
        id: uid<CalendarEntryId>('cal'),
        eventId: input.eventId,
        kind: input.kind,
        title: input.title,
        startAt: input.startAt,
        endAt: input.endAt,
        location: input.location ?? null,
        participantIds: [me.id, ...(input.inviteUserIds ?? [])],
        rsvp: { [me.id]: 'yes' },
        topic: input.topic ?? null,
        speakerIds: [],
        stage: null,
        goingWith: [],
        proximityMarkId: null,
        createdById: me.id,
        createdAt: nowIso(),
      };
      s.calendar.push(entry);
      return entry;
    },
    async rsvp(entryId, status) {
      await wait();
      const me = requireMe();
      const idx = s.calendar.findIndex((e) => e.id === entryId);
      if (idx < 0) throw new Error('Entry not found');
      const e = s.calendar[idx];
      const next: CalendarEntry = { ...e, rsvp: { ...e.rsvp, [me.id]: status } };
      if (status === 'none') delete next.rsvp[me.id];
      s.calendar[idx] = next;
      return next;
    },
    async findCompanions(eventId, opts) {
      await wait();
      const me = requireMe();
      let candidates = memberUsers(s, eventId, { excludeMe: true });
      if (opts.entryId) {
        const e = s.calendar.find((c) => c.id === opts.entryId);
        if (e) candidates = candidates.filter((u) => e.participantIds.includes(u.id));
      } else if (opts.window) {
        const startTs = new Date(opts.window.startAt).getTime();
        const endTs = new Date(opts.window.endAt).getTime();
        candidates = candidates.filter((u) => {
          const busy = s.calendar.filter(
            (e) => e.eventId === eventId && e.participantIds.includes(u.id),
          );
          return !busy.some((b) => {
            const bs = new Date(b.startAt).getTime();
            const be = new Date(b.endAt).getTime();
            return bs < endTs && be > startTs;
          });
        });
      }
      return candidates.map((u) => buildParticipantCard(s, eventId, me, u));
    },
  };

  /* ───────── Proximity ───────── */

  const proximity: ProximityApi = {
    async reportPosition(eventId, point) {
      const me = requireMe();
      const pos: ProximityPosition = {
        userId: me.id,
        eventId,
        point,
        updatedAt: nowIso(),
      };
      s.positions.set(me.id, pos);
      s.proximityEmitter.emit({ kind: 'position-update', position: pos });
    },
    async getSnapshot(eventId) {
      await wait();
      const positions = [...s.positions.values()].filter((p) => p.eventId === eventId);
      const marks = [...s.marks.values()].filter((m) => m.eventId === eventId && !m.dissolvedAt);
      return { positions, marks };
    },
    async createMark(eventId, topic, point) {
      await wait();
      const me = requireMe();
      const mark: ProximityMark = {
        id: uid<ProximityMarkId>('mk'),
        eventId,
        topic,
        point,
        createdById: me.id,
        participantIds: [me.id],
        linkedCalendarEntryId: null,
        createdAt: nowIso(),
        dissolvedAt: null,
      };
      s.marks.set(mark.id, mark);
      s.proximityEmitter.emit({ kind: 'mark-created', mark });
      return mark;
    },
    async joinMark(markId) {
      await wait();
      const me = requireMe();
      const m = s.marks.get(markId);
      if (!m) throw new Error('Mark not found');
      if (!m.participantIds.includes(me.id)) {
        const next = { ...m, participantIds: [...m.participantIds, me.id] };
        s.marks.set(markId, next);
        s.proximityEmitter.emit({ kind: 'mark-updated', mark: next });
        return next;
      }
      return m;
    },
    async leaveMark(markId) {
      await wait();
      const me = requireMe();
      const m = s.marks.get(markId);
      if (!m) return;
      const remaining = m.participantIds.filter((id) => id !== me.id);
      if (remaining.length === 0) {
        const next: ProximityMark = { ...m, participantIds: [], dissolvedAt: nowIso() };
        s.marks.set(markId, next);
        s.proximityEmitter.emit({ kind: 'mark-dissolved', markId });
      } else {
        const next = { ...m, participantIds: remaining };
        s.marks.set(markId, next);
        s.proximityEmitter.emit({ kind: 'mark-updated', mark: next });
      }
    },
    subscribe(_eventId, listener) {
      return s.proximityEmitter.on(listener);
    },
  };

  /* ───────── Notifications ───────── */

  const notifications: NotificationsApi = {
    async list(eventId, limit = 20) {
      await wait();
      const me = requireMe();
      return s.notifications
        .filter((n) => n.userId === me.id && (n.eventId === null || eventId === null || n.eventId === eventId))
        .slice(0, limit);
    },
    async markRead(id) {
      await wait();
      s.notifications = s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    },
    async markAllRead(eventId) {
      await wait();
      const me = requireMe();
      s.notifications = s.notifications.map((n) =>
        n.userId === me.id && (eventId === null || n.eventId === eventId) ? { ...n, read: true } : n,
      );
    },
    subscribe(listener) {
      return s.notificationEmitter.on(listener);
    },
  };

  /* ───────── Gallery ───────── */

  const gallery: GalleryApi = {
    async list(eventId, source) {
      await wait();
      return s.photos.filter((p) => p.eventId === eventId && p.source === source);
    },
    async upload(eventId, file) {
      await wait();
      const me = requireMe();
      const photo: Photo = {
        id: uid<PhotoId>('p'),
        eventId,
        source: 'guest',
        url: file.url,
        uploadedById: me.id,
        caption: file.caption ?? null,
        uploadedAt: nowIso(),
      };
      s.photos.unshift(photo);
      return photo;
    },
    async remove(photoId) {
      await wait();
      s.photos = s.photos.filter((p) => p.id !== photoId);
    },
  };

  /* ───────── Info ───────── */

  const info: InfoApi = {
    async getMaterials(eventId) {
      await wait();
      // No seed materials yet; return a minimal demo list.
      const demo: Material[] = [];
      void eventId;
      return demo;
    },
    async getSponsors(eventId) {
      await wait();
      return s.sponsors.filter((sp) => sp.eventId === eventId);
    },
    async getSpeakers(eventId) {
      await wait();
      const speakerIds = new Set(
        s.memberships.filter((m) => m.eventId === eventId && m.isSpeaker).map((m) => m.userId),
      );
      return [...s.users.values()].filter((u) => speakerIds.has(u.id));
    },
    async getAgenda(eventId) {
      await wait();
      const sessions = s.calendar.filter(
        (e) => e.eventId === eventId && e.kind === 'official-session',
      );
      const byDay: Record<string, CalendarEntry[]> = {};
      for (const e of sessions) {
        const day = e.startAt.slice(0, 10);
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(e);
      }
      for (const day of Object.keys(byDay)) byDay[day].sort((a, b) => a.startAt.localeCompare(b.startAt));
      return byDay;
    },
  };

  /* ───────── QR ───────── */

  const qr: QrApi = {
    async getMyPayload(eventId) {
      await wait();
      const me = requireMe();
      // Payload format: ec://event/<eventId>/user/<userId>
      return { payload: `ec://event/${eventId}/user/${me.id}`, userId: me.id };
    },
    async resolveScan(eventId, payload) {
      await wait();
      const m = /^ec:\/\/event\/([^/]+)\/user\/([^/]+)$/.exec(payload);
      if (!m) throw new Error('Invalid QR payload');
      const [, eId, uId] = m;
      if (eId !== eventId) throw new Error('QR is for a different event');
      const u = s.users.get(uId as UserId);
      if (!u) throw new Error('User not found');
      return u;
    },
  };

  return {
    auth,
    events,
    profile,
    participants,
    home,
    chat,
    calendar,
    proximity,
    notifications,
    gallery,
    info,
    qr,
  };
}
