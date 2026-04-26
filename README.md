# EventConnect

**EventConnect** is a mobile-first networking app concept for in-person professional events (conferences, summits, meetups). The app helps attendees discover the right people to talk to, see who is nearby in real time, and keep the conversation going during and after the event.

This repository hosts the high-fidelity interactive prototype built for a Bachelor thesis on user research and prototyping of an MVP networking application.

> **Status:** Prototype only. All data is mocked client-side; there is no backend, authentication, or real geolocation. Persistence uses `sessionStorage`, so closing the tab resets the experience.

---

## Live demo

**[event-connect-phi.vercel.app](https://event-connect-phi.vercel.app/events)**

Auto-deployed from `main` via Vercel on every push. Open the link on a phone (or in browser DevTools mobile view, ~390px width) for the intended layout. The app uses `BrowserRouter`, so any deep link works after a hard reload thanks to the SPA fallback in [`vercel.json`](./vercel.json).

---

## What's inside

The prototype covers the SOW v2 feature set:

- **Events list** with Active / Archive split, master profile, and per-event snapshots
- **Home** with period-aware Quick Access (pre-event / live / post-event), a dynamic Calendar summary, profile-completion %, and a Top Match card
- **Participants** with five tabs (Matches / Liked / Connections / Hidden / All), swipe-to-like deck, multi-axis matching, axis-locked gestures, and exit / entrance animations
- **Smart Match card** — multiple talking-points, conversation starters (incl. AI-flagged), match score
- **Chat** — 1:1 and group, Quick Start chips for new connections, in-event "+ Meeting" flow
- **Calendar** — sessions / personal meetings / free conversations, RSVP, free-time gaps, "join free conversation" mechanic
- **Network in Real Life** — Google Maps-style location dot with directional cone, pinch-to-zoom map, ghost mode, "drop a mark" sheet
- **QR exchange** — generated visual code + scanner UI
- **Gallery, Info, Onboarding, Login, Settings, Master Profile, Feedback** screens

The product spec is in [`src/imports/EventConnect_MVP_SOW_v2.txt`](./src/imports/EventConnect_MVP_SOW_v2.txt). The interaction map is in [`src/imports/EventConnect_Interaction_Map.txt`](./src/imports/EventConnect_Interaction_Map.txt).

---

## Tech stack

- **React 18.3** + **TypeScript** + **Vite 6**
- **Tailwind CSS v4** with a custom shadcn-style token theme (`src/styles/theme.css`)
- **shadcn/ui** primitives on top of **Radix UI**
- **React Router 7** (`BrowserRouter`)
- **Lucide React** + **MUI Icons** for icons
- `sessionStorage` for all persistence (`chatStore.ts`, `myProfileStore.ts`, `meetingStore.ts`, etc.)

---

## Running locally

```bash
pnpm install
pnpm dev          # Vite dev server on http://localhost:5174
pnpm build        # production build → dist/
pnpm preview      # serve the production build locally
```

Node 18+ is required.

---

## Repository layout

```
.
├── index.html                       # Vite entry
├── vite.config.ts
├── tsconfig.json
├── vercel.json                      # SPA fallback for BrowserRouter
└── src/
    ├── main.tsx                     # createRoot mount
    ├── app/
    │   ├── App.tsx                  # Routes + EventPeriodProvider
    │   └── components/
    │       ├── EventsScreen.tsx     # /events
    │       ├── MainLayout.tsx       # in-event shell + bottom nav
    │       ├── HomeScreen.tsx
    │       ├── ParticipantsScreen.tsx
    │       ├── MatchCard.tsx
    │       ├── SwipeableCard.tsx    # gesture wrapper for the deck
    │       ├── ChatScreen.tsx
    │       ├── ChatConversationScreen.tsx
    │       ├── CalendarScreen.tsx
    │       ├── NetworkScreen.tsx
    │       ├── QRScreen.tsx
    │       ├── GalleryScreen.tsx
    │       ├── InfoScreen.tsx
    │       ├── ProfileScreen.tsx
    │       ├── MasterProfileScreen.tsx
    │       ├── OtherUserProfile.tsx
    │       ├── OnboardingScreen.tsx
    │       ├── LoginScreen.tsx
    │       ├── SettingsScreen.tsx
    │       ├── FeedbackScreen.tsx
    │       ├── *Store.ts            # sessionStorage-backed state
    │       ├── mock*.ts             # seed data (users, schedule, gallery, info)
    │       ├── eventPeriodContext.tsx
    │       └── ui/                  # shadcn/Radix primitives
    ├── imports/                     # SOW + interaction map
    └── styles/                      # tailwind, theme, fonts, index aggregator
```

---

## Notes & known limits

- **Single-session state.** Refreshing inside one tab keeps your edits; closing the tab clears them. There is no backend, so nothing syncs across devices.
- **Period switcher.** The clock icon in the in-event header lets you toggle between Pre-event / Live / Post-event so the same prototype can demo all three lifecycle states.
- **Match scoring.** For the prototype, the headline percentage is a deterministic 60–97% derived from the candidate's identity. The matching axes from the SOW are documented but not fully wired into the displayed score — see [`mockUsers.ts`](./src/app/components/mockUsers.ts).
- **QR.** The on-screen QR is a stylised pattern (correct finder / timing / alignment markers, random data fill); it does not encode a real payload.

---

## Credits

- shadcn/ui — MIT
- Radix UI primitives — MIT
- Lucide icons — ISC
- Photography — Unsplash (see [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md))
