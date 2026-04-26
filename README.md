# EventConnect — frontend prototype

Frontend implementation of the EventConnect MVP (B2B professional-event networking app)
built from the Figma Make export, with an in-memory typed backend implementing the
SOW v2 (`src/imports/EventConnect_MVP_SOW_v2.txt`).

## Run locally

```bash
cd Figma
pnpm install      # or: npm install
pnpm dev          # http://localhost:5173
pnpm build        # production bundle to dist/
pnpm preview      # serve the build
```

The mock backend re-seeds on every page reload — there's no persistence.

## Tech stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| UI           | React 18.3 + TypeScript                           |
| Build        | Vite 6, Tailwind v4 plugin                        |
| UI kit       | shadcn/ui (Radix primitives) + Tailwind utilities |
| Routing      | React Router 7 (BrowserRouter)                    |
| State / data | Custom `useAsync` / `useMutation` over an `ApiClient` interface (no Redux/TanStack Query yet — easy to swap in) |
| Backend      | In-memory `mockClient` implementing the same `ApiClient` interface a future HTTP/tRPC client will satisfy |

## Architecture

```
src/
├── app/                     React layer (existing Figma export)
│   ├── App.tsx              BrowserRouter + routes
│   └── components/          14 screens + shadcn primitives
├── api/
│   ├── contract.ts          ApiClient interface (the seam between UI and backend)
│   ├── mockClient.ts        In-memory implementation of every endpoint
│   ├── seed.ts              Deterministic seed data
│   └── provider.tsx         ApiProvider + useAsync / useMutation hooks
├── domain/
│   └── types.ts             All entities, enums, value objects, read models
└── styles/                  Tailwind + shadcn theme tokens
```

The boundary is `src/api/contract.ts`. The UI imports types from
`@/domain/types` and the client interface from `@/api/contract` — never from
the mock implementation directly.

A future server (Node + Postgres + WS, or tRPC, or REST) just needs to
ship a class that satisfies `ApiClient` and pass it to `<ApiProvider>`.

## Domain model — entities

All in `src/domain/types.ts`. Highlights:

| Entity                | Key fields                                                                        | Purpose                                              |
| --------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `User`                | `email`, `fullName`, `role`, `position`, `company`, `industry`, `grade`, `interests[]`, `wantToTalkAbout`, `contacts`, `privacy` | Cross-event identity                              |
| `Event`               | `name`, `dates`, `timezone`, `city`, `address`, `features`, `attendeeVisibilityLimit`, `organizerId`, `featureToggles` | Conference/meetup container                        |
| `EventMembership`     | `(userId, eventId, isSpeaker, geoOptIn, registeredAt)`                            | Per-event projection of a user                       |
| `Match`               | `(eventId, userAId, userBId, reactionByA, reactionByB, isMutual)` (canonical pair, ordered ids) | Symmetric per-pair reaction record         |
| `MatchScore`          | `positionOverlap`, `interestOverlap`, `industryOverlap`, `total`, `matchTags[]`   | Output of the rule-based ranking algo                |
| `HashtagNote`         | `(ownerId, targetId, eventId, text)`                                              | 1–2 word private note one user attaches to another  |
| `Conversation`        | `(eventId, kind, participantIds[], lastMessage)`                                  | 1:1 / group / event-general chat                     |
| `Message`             | `(conversationId, senderId, kind, text, attachmentUrl, location, readBy[], reactions, replyToId)` | Single message of any type                |
| `CalendarEntry`       | `kind: official-session \| personal-meeting \| free-conversation`, `startAt`, `endAt`, `participantIds[]`, `rsvp`, `topic`, `speakerIds[]`, `goingWith[]`, `proximityMarkId` | Unified calendar object covering all 3 SOW types     |
| `FreeTimeWindow`      | `startAt`, `endAt`, `otherFreeCount`, `freeConversationCount`                     | Smart-scheduling output for the chat "+ Meeting" overlay |
| `ProximityPosition`   | `(userId, eventId, point, updatedAt)`                                             | Latest known position on the venue map               |
| `ProximityMark`       | `topic`, `point`, `participantIds[]`, `dissolvedAt`, `linkedCalendarEntryId`      | Conversation cluster on the map (manual or auto-from-free-conversation) |
| `AppNotification`     | `kind`, `title`, `body`, `link`, `read`                                           | Push + Home strip                                    |
| `Photo`               | `(eventId, source, url, uploadedById, caption)`                                   | Gallery: photographer or guest source                |
| `Material`, `Sponsor` | `category`, `url`, …                                                              | Info screen content                                  |
| `MagicLink`           | `token`, `email`, `eventId`, `used`, `deviceFingerprint`                          | Email-bound, one-device authentication               |
| `Session`             | `userId`, `activeEventId`, `issuedAt`                                             | Authenticated session                                |

### Read models (composite, server-computed)

* `HomeDashboard` — single payload powering `HomeScreen` (Networking
  Opportunities counters, Top Match, Quick Access widget data, calendar
  summary, recent notifications, lifecycle phase).
* `ParticipantCard` — what every list item needs (`user` + `MatchScore`
  + my reaction + isMutual + my hashtag + isSpeaker).
* `ConversationListItem` — conversation + other user + hashtag + unread count
  + relationship-tab classification.
* `ProfileGate` / `ProfileCompleteness` — gate result for unlocking the
  Match tab (5 required fields + 7 interests).

## Backend logic that lives in the mock

The mock client (`src/api/mockClient.ts`) is faithful to the SOW for the
non-trivial operations:

* **Match ranking** — score = `position*1000 + sharedInterests*10 + industry*1`,
  satisfying the SOW priority `Position > Interests > Industry`. The chip
  list (`matchTags`) is built from the matched fields, capped at 3.
* **Match canonicalization** — one `Match` row per unordered pair `(min(a,b), max(a,b))`.
  Mutual = both reactions are `like`. The `mutualJustHappened` flag fires
  the `MatchOverlay` and emits a `mutual-match` notification.
* **Profile gate** — requires `fullName, position, grade, company` + ≥7
  interests, mirrors §4.4. Used by `getMatchGate(eventId)`.
* **Privacy filtering** — `getPublicProfile` zeroes contacts when the
  target's `contactVisibility` rule isn't satisfied by the viewer's
  reaction state.
* **Mutual free time** — gap-finding over both calendars; windows < 15
  min are dropped. Used by the chat "+ Meeting" overlay.
* **Free-time stats** — "34 people are free + 2 conversations" computed
  from busy-set inversion and free-conversation overlap.
* **Lifecycle phase** — `pre-event / during-event / post-event-active /
  archived`. Network-in-Real-Time button on Home is hidden outside
  `during-event`. (The 1.5-month archive cutoff matches §4.18.)
* **Proximity marks** — auto-dissolve when the last participant leaves
  (`leaveMark` sets `dissolvedAt` once `participantIds` is empty).
* **QR exchange** — payload is `ec://event/<eventId>/user/<userId>`,
  `resolveScan` enforces same-event constraint and returns the target
  user. UI then routes both sides to each other's profile so they can
  Like → mutual match (per §4.14).
* **Real-time** — chat and proximity expose `subscribe(callback)` via a
  tiny in-process `Emitter`. A future WebSocket transport plugs in here.
* **Notifications** — emitted server-side on mutual match; can be wired
  to FCM/APNs in production. `NotificationsApi.subscribe` mimics push.

## Screens — all wired to the typed API

| Screen                       | Endpoints used                                           |
| ---------------------------- | -------------------------------------------------------- |
| `EventsScreen`               | `events.listMine({ search })`                            |
| `HomeScreen`                 | `home.getDashboard()`, `events.listMine()` (event switcher) |
| `ParticipantsScreen`         | `participants.listMatchDeck/listAll/listByReaction/react`, `profile.getMatchGate` |
| `ChatScreen`                 | `chat.listConversations(eventId, tab)`                   |
| `ChatConversationScreen`     | `chat.getConversation`, `chat.listMessages`, `chat.sendMessage`, `chat.markRead`, `chat.subscribe` (live), `profile.getPublicProfile` |
| `ProfileScreen`              | `profile.me`, `profile.updateMe`, `profile.updatePrivacy` |
| `OtherUserProfile`           | `profile.getPublicProfile`, `participants.getScore/react/setHashtagNote`, `chat.openOneOnOne` |
| `QRScreen`                   | `qr.getMyPayload`, `qr.resolveScan`, `profile.me`        |
| `CalendarScreen`             | `events.get`, `calendar.listDay`, `calendar.rsvp`         |
| `NetworkScreen`              | `proximity.getSnapshot`, `proximity.createMark`, `proximity.subscribe`, `profile.me` |
| `GalleryScreen`              | `gallery.list`                                           |
| `InfoScreen`                 | `events.get`, `info.getSpeakers/getSponsors/getAgenda`   |
| `MainLayout`                 | Routing only — no data dependency                        |

The migration pattern is uniform across all screens:

```tsx
const { data, loading, error } = useAsync(
  (api) => api.chat.listConversations(eventId, tab),
  [eventId, tab],
);

const sendM = useMutation((api, text: string) =>
  api.chat.sendMessage({ conversationId, text }),
);
```

For real-time updates use `subscribe`:

```tsx
useEffect(() => {
  const unsub = api.chat.subscribe(conversationId, (e) => {
    if (e.kind === 'message-sent') setMessages((prev) => [...prev, e.message]);
  });
  return () => { unsub(); };
}, [api, conversationId]);
```

## Mapping SOW → code

| SOW section                 | Code touchpoint                                                                |
| --------------------------- | ------------------------------------------------------------------------------ |
| §3 User Roles               | `User.role: attendee | speaker | organizer`; `EventMembership.isSpeaker`        |
| §4.1 Bottom navigation      | `MainLayout.tsx`                                                                |
| §4.2 Events screen          | `events.listMine()` → `EventsScreen`                                            |
| §4.3 Home dashboard         | `home.getDashboard()` → `HomeScreen` (single round-trip)                       |
| §4.4 Match tab + profile gate | `participants.listMatchDeck()` + `profile.getMatchGate()`                     |
| §4.5 All tab + filters      | `participants.listAll(eventId, filters, sort)`                                 |
| §4.6 QR                     | `qr.getMyPayload()` / `qr.resolveScan()`                                       |
| §4.7-4.8 Chat               | `chat.listConversations()`, `chat.sendMessage()`, `chat.subscribe()`           |
| §4.9 Profile + privacy      | `profile.me()`, `profile.updatePrivacy()`, `profile.getPublicProfile()` (privacy-filtered contacts) |
| §4.10 Network in Real Time  | `proximity.*` (positions, marks, subscribe)                                    |
| §4.11 Info                  | `info.getMaterials/Sponsors/Speakers/Agenda()`                                 |
| §4.12 Gallery               | `gallery.list()` / `gallery.upload()`                                          |
| §4.13 Calendar              | `calendar.listDay()`, `calendar.getMutualFreeTime()`, `calendar.create()`, `calendar.rsvp()`, `calendar.findCompanions()` |
| §4.15 Magic-link auth       | `auth.requestMagicLink()`, `auth.consumeMagicLink()` (one-time, device-bound) |
| §4.16 Notifications         | `notifications.list()`, `notifications.subscribe()`                            |
| §4.18 Post-event lifecycle  | `HomeDashboard.lifecyclePhase` + `eventLifecyclePhase()` helper                |

## Replacing the mock with a real backend

1. Implement `ApiClient` with a real transport (HTTP / tRPC / GraphQL).
2. Pass it to `<ApiProvider client={realClient}>` in `src/main.tsx`.
3. Done — UI code does not change. Branded ID types ensure the
   serialization layer can't accidentally swap a `UserId` for an `EventId`.

For real-time (chat + proximity), `subscribe()` should be backed by a
WebSocket; the `Emitter` shape is intentionally minimal so the same
interface can be implemented on top of `socket.io`, `ws`, or
`EventSource`.
