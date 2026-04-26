/**
 * Seed data for the in-memory mock backend.
 * Realistic enough that every screen has something to render.
 */

import type {
  AppNotification,
  CalendarEntry,
  Conversation,
  Event,
  EventId,
  EventMembership,
  HashtagNote,
  Match,
  Message,
  NotificationId,
  Photo,
  ProximityMark,
  ProximityPosition,
  Sponsor,
  User,
  UserId,
  CalendarEntryId,
  ConversationId,
  MessageId,
  PhotoId,
} from '@/domain/types';
import { DEFAULT_PRIVACY } from '@/domain/types';

const id = <T extends string>(s: string): T => s as T;

/* ───────── Users ───────── */

export const SEED_ME_ID = id<UserId>('u-me');

const photo = (slug: string) => `https://images.unsplash.com/${slug}?w=400`;

export const seedUsers: User[] = [
  {
    id: SEED_ME_ID,
    email: 'viktoriia@example.com',
    fullName: 'Viktoriia Prokhorova',
    photoUrl: photo('photo-1494790108377-be9c29b29330'),
    role: 'attendee',
    position: 'Software Engineer',
    company: 'Microsoft',
    industry: 'Technology',
    grade: 'middle',
    description: 'Building the bridge between research and product.',
    wantToTalkAbout: 'Networking-product UX, AI for events, indie research.',
    interests: ['Product Design', 'AI', 'UX Research', 'Conferences', 'Indie Hacking', 'TypeScript', 'Figma'],
    contacts: { email: 'viktoriia@example.com', linkedin: 'in/vprokhorova', telegram: '@vprokhorova' },
    privacy: DEFAULT_PRIVACY,
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: id<UserId>('u-sarah'),
    email: 'sarah@figma.com',
    fullName: 'Sarah Johnson',
    photoUrl: photo('photo-1438761681033-6461ffad8d80'),
    role: 'attendee',
    position: 'Product Designer',
    company: 'Figma',
    industry: 'Technology',
    grade: 'senior',
    description: 'Design systems @ Figma. Big fan of generative tools.',
    wantToTalkAbout: 'AI in design tools and automation workflows.',
    interests: ['UX Design', 'Product', 'AI', 'Design Systems', 'Workshops', 'TypeScript', 'Figma'],
    contacts: { email: 'sarah@figma.com', linkedin: 'in/sjohnson', telegram: null },
    privacy: DEFAULT_PRIVACY,
    createdAt: '2026-04-02T10:00:00Z',
  },
  {
    id: id<UserId>('u-michael'),
    email: 'michael@google.com',
    fullName: 'Michael Chen',
    photoUrl: photo('photo-1507003211169-0a1dd7228f2d'),
    role: 'attendee',
    position: 'Senior Product Manager',
    company: 'Google',
    industry: 'Technology',
    grade: 'senior',
    description: 'PM with an engineering background. Currently building AI features.',
    wantToTalkAbout: 'Building AI-powered product features and scaling teams.',
    interests: ['Product Strategy', 'AI', 'Data Analytics', 'TypeScript', 'Public Speaking', 'Hiring', 'Leadership'],
    contacts: { email: 'michael@google.com', linkedin: 'in/mchen', telegram: '@mchen' },
    privacy: DEFAULT_PRIVACY,
    createdAt: '2026-04-03T10:00:00Z',
  },
  {
    id: id<UserId>('u-emma'),
    email: 'emma@airbnb.com',
    fullName: 'Emma Rodriguez',
    photoUrl: photo('photo-1438761681033-6461ffad8d80'),
    role: 'speaker',
    position: 'UX Research Lead',
    company: 'Airbnb',
    industry: 'Technology',
    grade: 'lead',
    description: 'Mixed-methods research at scale.',
    wantToTalkAbout: 'Quantitative vs qualitative research methods.',
    interests: ['User Research', 'Design Thinking', 'Psychology', 'UX Design', 'Workshops', 'Hiring', 'Mentorship'],
    contacts: { email: 'emma@airbnb.com', linkedin: 'in/erodriguez', telegram: null },
    privacy: DEFAULT_PRIVACY,
    createdAt: '2026-04-04T10:00:00Z',
  },
  {
    id: id<UserId>('u-james'),
    email: 'james@meta.com',
    fullName: 'James Wilson',
    photoUrl: photo('photo-1500648767791-00dcc994a43e'),
    role: 'attendee',
    position: 'Engineering Manager',
    company: 'Meta',
    industry: 'Technology',
    grade: 'lead',
    description: 'Eng leader. Distributed systems person.',
    wantToTalkAbout: 'Scaling engineering teams and technical architecture.',
    interests: ['Engineering Leadership', 'System Design', 'Mentorship', 'Hiring', 'Public Speaking', 'AI', 'TypeScript'],
    contacts: { email: 'james@meta.com', linkedin: 'in/jwilson', telegram: null },
    privacy: DEFAULT_PRIVACY,
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: id<UserId>('u-anna'),
    email: 'anna@stripe.com',
    fullName: 'Anna Müller',
    photoUrl: photo('photo-1544005313-94ddf0286df2'),
    role: 'attendee',
    position: 'Staff Frontend Engineer',
    company: 'Stripe',
    industry: 'Fintech',
    grade: 'senior',
    description: 'Web platform & DX.',
    wantToTalkAbout: 'Migrating large frontends without freezing product.',
    interests: ['TypeScript', 'Performance', 'Web Platform', 'Design Systems', 'Engineering Leadership', 'AI', 'Indie Hacking'],
    contacts: { email: 'anna@stripe.com', linkedin: 'in/amuller', telegram: null },
    privacy: DEFAULT_PRIVACY,
    createdAt: '2026-04-06T10:00:00Z',
  },
  {
    id: id<UserId>('u-org'),
    email: 'organizer@techsummit.com',
    fullName: 'Tech Summit Organizers',
    photoUrl: null,
    role: 'organizer',
    position: 'Event Producer',
    company: 'Tech Summit Co.',
    industry: 'Events',
    grade: 'lead',
    description: 'Organizers of Tech Summit 2026.',
    wantToTalkAbout: null,
    interests: [],
    contacts: { email: 'hello@techsummit.com', linkedin: 'company/techsummit', telegram: null },
    privacy: DEFAULT_PRIVACY,
    createdAt: '2026-01-01T10:00:00Z',
  },
];

/* ───────── Events ───────── */

const EVT_TS = id<EventId>('e-techsummit');
const EVT_PDC = id<EventId>('e-pdc');

export const seedEvents: Event[] = [
  {
    id: EVT_TS,
    name: 'Tech Summit 2026',
    shortName: 'TS',
    brandColor: 'bg-blue-600',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    startDate: '2026-04-28T09:00:00Z',
    endDate: '2026-04-29T18:00:00Z',
    timezone: 'UTC+2',
    city: 'Lviv',
    address: 'Lviv IT Park, Stryiska 121',
    organizerId: id<UserId>('u-org'),
    features: {
      sponsors: true,
      gallery: true,
      'network-real-time': true,
      'general-chat': true,
      'free-conversations': true,
      'guest-photos': true,
    },
    attendeeVisibilityLimit: 100,
    hideAttendeesPostEvent: false,
    floorMapUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
    organizerContacts: { email: 'hello@techsummit.com', linkedin: 'company/techsummit', telegram: null },
  },
  {
    id: EVT_PDC,
    name: 'Product Design Conference',
    shortName: 'PDC',
    brandColor: 'bg-purple-600',
    imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
    startDate: '2026-05-15T09:00:00Z',
    endDate: '2026-05-16T18:00:00Z',
    timezone: 'UTC+2',
    city: 'Kyiv',
    address: 'UNIT.City',
    organizerId: id<UserId>('u-org'),
    features: {
      sponsors: false,
      gallery: true,
      'network-real-time': true,
      'general-chat': true,
      'free-conversations': true,
      'guest-photos': true,
    },
    attendeeVisibilityLimit: 200,
    hideAttendeesPostEvent: true,
    floorMapUrl: null,
    organizerContacts: { email: 'hello@pdc.ua', linkedin: null, telegram: null },
  },
];

/* ───────── Memberships ───────── */

const everyone = seedUsers.filter((u) => u.role !== 'organizer');

export const seedMemberships: EventMembership[] = [
  ...everyone.map((u): EventMembership => ({
    userId: u.id,
    eventId: EVT_TS,
    registeredAt: '2026-04-10T10:00:00Z',
    isSpeaker: u.role === 'speaker',
    geoOptIn: u.id === SEED_ME_ID,
  })),
  // PDC: only me + Sarah
  {
    userId: SEED_ME_ID,
    eventId: EVT_PDC,
    registeredAt: '2026-05-01T10:00:00Z',
    isSpeaker: false,
    geoOptIn: false,
  },
  {
    userId: id<UserId>('u-sarah'),
    eventId: EVT_PDC,
    registeredAt: '2026-05-01T10:00:00Z',
    isSpeaker: false,
    geoOptIn: false,
  },
];

/* ───────── Matches (existing reactions) ───────── */

const pair = (a: UserId, b: UserId): [UserId, UserId] => (a < b ? [a, b] : [b, a]);

export const seedMatches: Match[] = [
  // I liked Sarah, she liked me back → mutual
  {
    eventId: EVT_TS,
    userAId: pair(SEED_ME_ID, id<UserId>('u-sarah'))[0],
    userBId: pair(SEED_ME_ID, id<UserId>('u-sarah'))[1],
    reactionByA: 'like',
    reactionByB: 'like',
    isMutual: true,
    createdAt: '2026-04-28T10:00:00Z',
    updatedAt: '2026-04-28T10:05:00Z',
  },
  // I liked Michael, he hasn't reacted
  {
    eventId: EVT_TS,
    userAId: pair(SEED_ME_ID, id<UserId>('u-michael'))[0],
    userBId: pair(SEED_ME_ID, id<UserId>('u-michael'))[1],
    reactionByA: 'like',
    reactionByB: 'none',
    isMutual: false,
    createdAt: '2026-04-28T10:10:00Z',
    updatedAt: '2026-04-28T10:10:00Z',
  },
];

/* ───────── Hashtag notes ───────── */

export const seedHashtagNotes: HashtagNote[] = [
  {
    ownerId: SEED_ME_ID,
    targetId: id<UserId>('u-sarah'),
    eventId: EVT_TS,
    text: 'AIDesign',
    updatedAt: '2026-04-28T10:05:00Z',
  },
];

/* ───────── Conversations + messages ───────── */

const conv = (s: string) => id<ConversationId>(s);
const msg = (s: string) => id<MessageId>(s);

const m1: Message = {
  id: msg('m-1'),
  conversationId: conv('c-sarah'),
  senderId: id<UserId>('u-sarah'),
  kind: 'text',
  text: 'Hey, loved your talk. Want to grab a coffee?',
  attachmentUrl: null,
  attachmentMeta: null,
  location: null,
  readBy: [SEED_ME_ID],
  replyToId: null,
  reactions: {},
  sentAt: '2026-04-28T11:00:00Z',
};

const m2: Message = {
  id: msg('m-2'),
  conversationId: conv('c-sarah'),
  senderId: SEED_ME_ID,
  kind: 'text',
  text: 'Absolutely! Free at 14:00?',
  attachmentUrl: null,
  attachmentMeta: null,
  location: null,
  readBy: [SEED_ME_ID, id<UserId>('u-sarah')],
  replyToId: null,
  reactions: {},
  sentAt: '2026-04-28T11:02:00Z',
};

export const seedConversations: Conversation[] = [
  {
    id: conv('c-sarah'),
    eventId: EVT_TS,
    kind: 'one-on-one',
    participantIds: [SEED_ME_ID, id<UserId>('u-sarah')],
    lastMessage: m2,
    createdAt: '2026-04-28T11:00:00Z',
  },
  {
    id: conv('c-michael'),
    eventId: EVT_TS,
    kind: 'one-on-one',
    participantIds: [SEED_ME_ID, id<UserId>('u-michael')],
    lastMessage: null,
    createdAt: '2026-04-28T10:30:00Z',
  },
  {
    id: conv('c-general'),
    eventId: EVT_TS,
    kind: 'event-general',
    participantIds: everyone.map((u) => u.id),
    lastMessage: null,
    createdAt: '2026-04-28T09:00:00Z',
  },
];

export const seedMessages: Message[] = [m1, m2];

/* ───────── Calendar ───────── */

const cal = (s: string) => id<CalendarEntryId>(s);

export const seedCalendar: CalendarEntry[] = [
  {
    id: cal('cal-keynote'),
    eventId: EVT_TS,
    kind: 'official-session',
    title: 'Opening Keynote: The State of AI',
    startAt: '2026-04-28T09:30:00Z',
    endAt: '2026-04-28T10:30:00Z',
    location: 'Main Stage',
    participantIds: [SEED_ME_ID, id<UserId>('u-sarah'), id<UserId>('u-michael')],
    rsvp: {
      [SEED_ME_ID]: 'yes',
      [id<UserId>('u-sarah')]: 'yes',
      [id<UserId>('u-michael')]: 'maybe',
    },
    topic: null,
    speakerIds: [id<UserId>('u-emma')],
    stage: 'Main Stage',
    goingWith: [id<UserId>('u-sarah')],
    proximityMarkId: null,
    createdById: null,
    createdAt: '2026-04-10T10:00:00Z',
  },
  {
    id: cal('cal-workshop'),
    eventId: EVT_TS,
    kind: 'official-session',
    title: 'Workshop: AI in Design Tools',
    startAt: '2026-04-28T11:00:00Z',
    endAt: '2026-04-28T13:00:00Z',
    location: 'Workshop Room A',
    participantIds: [SEED_ME_ID],
    rsvp: { [SEED_ME_ID]: 'yes' },
    topic: null,
    speakerIds: [id<UserId>('u-emma')],
    stage: 'Workshop Room A',
    goingWith: [],
    proximityMarkId: null,
    createdById: null,
    createdAt: '2026-04-10T10:00:00Z',
  },
  {
    id: cal('cal-personal-sarah'),
    eventId: EVT_TS,
    kind: 'personal-meeting',
    title: 'Coffee with Sarah',
    startAt: '2026-04-28T14:00:00Z',
    endAt: '2026-04-28T14:15:00Z',
    location: 'Lobby Café',
    participantIds: [SEED_ME_ID, id<UserId>('u-sarah')],
    rsvp: { [SEED_ME_ID]: 'yes', [id<UserId>('u-sarah')]: 'yes' },
    topic: 'AI design workflows',
    speakerIds: [],
    stage: null,
    goingWith: [],
    proximityMarkId: null,
    createdById: SEED_ME_ID,
    createdAt: '2026-04-28T11:05:00Z',
  },
  {
    id: cal('cal-free-typescript'),
    eventId: EVT_TS,
    kind: 'free-conversation',
    title: 'Free conversation',
    startAt: '2026-04-28T15:30:00Z',
    endAt: '2026-04-28T16:00:00Z',
    location: 'Lounge B',
    participantIds: [id<UserId>('u-anna'), id<UserId>('u-michael')],
    rsvp: {},
    topic: 'Migrating large TypeScript codebases',
    speakerIds: [],
    stage: null,
    goingWith: [],
    proximityMarkId: null,
    createdById: id<UserId>('u-anna'),
    createdAt: '2026-04-28T13:30:00Z',
  },
];

/* ───────── Proximity ───────── */

export const seedPositions: ProximityPosition[] = [
  { userId: SEED_ME_ID, eventId: EVT_TS, point: { x: 0.4, y: 0.5 }, updatedAt: '2026-04-28T13:00:00Z' },
  { userId: id<UserId>('u-sarah'), eventId: EVT_TS, point: { x: 0.45, y: 0.52 }, updatedAt: '2026-04-28T13:00:00Z' },
  { userId: id<UserId>('u-michael'), eventId: EVT_TS, point: { x: 0.7, y: 0.3 }, updatedAt: '2026-04-28T13:00:00Z' },
  { userId: id<UserId>('u-anna'), eventId: EVT_TS, point: { x: 0.2, y: 0.7 }, updatedAt: '2026-04-28T13:00:00Z' },
];

export const seedMarks: ProximityMark[] = [
  {
    id: id('m-traffie'),
    eventId: EVT_TS,
    topic: 'Traffie — getting users without paid ads',
    point: { x: 0.45, y: 0.55 },
    createdById: id<UserId>('u-sarah'),
    participantIds: [id<UserId>('u-sarah'), SEED_ME_ID],
    linkedCalendarEntryId: null,
    createdAt: '2026-04-28T12:50:00Z',
    dissolvedAt: null,
  },
];

/* ───────── Notifications ───────── */

const n = (s: string) => id<NotificationId>(s);

export const seedNotifications: AppNotification[] = [
  {
    id: n('n-1'),
    userId: SEED_ME_ID,
    eventId: EVT_TS,
    kind: 'meeting-reminder',
    title: 'Meeting starts in 15 min',
    body: 'Coffee with Sarah · Lobby Café',
    link: `/event/${EVT_TS}/calendar`,
    read: false,
    createdAt: '2026-04-28T13:45:00Z',
  },
  {
    id: n('n-2'),
    userId: SEED_ME_ID,
    eventId: EVT_TS,
    kind: 'mutual-match',
    title: 'You and Sarah Johnson are a mutual match!',
    body: 'Open the chat to introduce yourself.',
    link: `/event/${EVT_TS}/chat/c-sarah`,
    read: false,
    createdAt: '2026-04-28T10:05:00Z',
  },
];

/* ───────── Gallery ───────── */

export const seedPhotos: Photo[] = [
  {
    id: id<PhotoId>('p-1'),
    eventId: EVT_TS,
    source: 'photographer',
    url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    uploadedById: null,
    caption: 'Opening keynote',
    uploadedAt: '2026-04-28T10:00:00Z',
  },
  {
    id: id<PhotoId>('p-2'),
    eventId: EVT_TS,
    source: 'guest',
    url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800',
    uploadedById: id<UserId>('u-sarah'),
    caption: 'Hallway energy',
    uploadedAt: '2026-04-28T11:30:00Z',
  },
];

/* ───────── Sponsors ───────── */

export const seedSponsors: Sponsor[] = [
  { id: id('sp-1'), eventId: EVT_TS, name: 'Stripe', logoUrl: 'https://logo.clearbit.com/stripe.com', link: 'https://stripe.com' },
  { id: id('sp-2'), eventId: EVT_TS, name: 'Figma', logoUrl: 'https://logo.clearbit.com/figma.com', link: 'https://figma.com' },
];

/* ───────── Aggregate constants used elsewhere ───────── */

export const SEED_EVENT_TS = EVT_TS;
export const SEED_EVENT_PDC = EVT_PDC;
