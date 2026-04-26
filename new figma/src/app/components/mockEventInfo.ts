/**
 * Event metadata, agenda, materials, sponsors, and organizer contacts
 * for the Info screen (SOW §4.11). Hardcoded for the prototype — in
 * production these come from the organizer's admin panel.
 */

export type Material = {
  id: string;
  category: 'presentation' | 'transcript' | 'record';
  title: string;
  /** Optional speaker id (key in mockUsers). */
  speakerId?: string;
  /** Stub URL — would be a CDN link in production. */
  url: string;
};

export type Sponsor = {
  id: string;
  name: string;
  /** Logo URL via Clearbit (works for any company domain). */
  logoUrl: string;
  url: string;
};

export type AgendaSession = {
  id: string;
  /** YYYY-MM-DD */
  day: string;
  startTime: string; // HH:mm
  endTime: string;
  title: string;
  speakerId?: string;
  stage: string;
};

export const eventInfo = {
  name: 'Tech Summit 2026',
  startDate: '2026-04-28',
  endDate: '2026-04-29',
  city: 'San Francisco, CA',
  address: 'Moscone Center West · 800 Howard St',
  timezone: 'UTC+2',
  floorMapUrl:
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
};

/**
 * IDs reference users in `mockUsers.ts`. Speakers are simply users with
 * a "speaker" role at this event (per SOW §3 — User Roles).
 */
export const speakerIds: string[] = [
  'sarah-johnson', // Product Designer @ Figma
  '4',             // Liam Patel — Founder & CEO @ Stratify
  '2',             // Emma Rodriguez — UX Research Lead @ Airbnb
  '9',             // Yuki Tanaka — Investor @ Sequoia
  '13',            // Nikolai Dmitriev — Research Engineer @ Anthropic
  '6',             // Daniel Kovács — Backend Engineer @ Stripe
];

export const materials: Material[] = [
  {
    id: 'm-1',
    category: 'presentation',
    title: 'Opening Keynote — The State of Networking Software',
    speakerId: '4',
    url: '#',
  },
  {
    id: 'm-2',
    category: 'presentation',
    title: 'AI in Product Design — Slides',
    speakerId: 'sarah-johnson',
    url: '#',
  },
  {
    id: 'm-3',
    category: 'presentation',
    title: 'Distributed Systems at Payment Scale',
    speakerId: '6',
    url: '#',
  },
  {
    id: 'm-4',
    category: 'transcript',
    title: 'Day 1 Q&A — full transcript',
    url: '#',
  },
  {
    id: 'm-5',
    category: 'transcript',
    title: 'Investor Panel — transcript',
    speakerId: '9',
    url: '#',
  },
  {
    id: 'm-6',
    category: 'record',
    title: 'Workshop: Design Systems — video recording',
    speakerId: 'sarah-johnson',
    url: '#',
  },
  {
    id: 'm-7',
    category: 'record',
    title: 'Closing Talk — video recording',
    speakerId: '13',
    url: '#',
  },
];

export const sponsors: Sponsor[] = [
  { id: 's-1', name: 'Stripe', logoUrl: 'https://logo.clearbit.com/stripe.com', url: 'https://stripe.com' },
  { id: 's-2', name: 'Notion', logoUrl: 'https://logo.clearbit.com/notion.so', url: 'https://notion.so' },
  { id: 's-3', name: 'Vercel', logoUrl: 'https://logo.clearbit.com/vercel.com', url: 'https://vercel.com' },
  { id: 's-4', name: 'Figma', logoUrl: 'https://logo.clearbit.com/figma.com', url: 'https://figma.com' },
  { id: 's-5', name: 'Linear', logoUrl: 'https://logo.clearbit.com/linear.app', url: 'https://linear.app' },
  { id: 's-6', name: 'Anthropic', logoUrl: 'https://logo.clearbit.com/anthropic.com', url: 'https://anthropic.com' },
];

export const organizerContacts = {
  instagram: '@techsummit2026',
  instagramUrl: 'https://instagram.com/techsummit2026',
  linkedin: 'company/tech-summit',
  linkedinUrl: 'https://linkedin.com/company/tech-summit',
  email: 'hello@techsummit2026.com',
};

/** Agenda preview — sessions grouped by day. Hardcoded preview, mirrors CalendarScreen seeds where useful. */
export const agenda: AgendaSession[] = [
  // Day 1 — Friday Apr 28
  {
    id: 'a-1',
    day: '2026-04-28',
    startTime: '09:00',
    endTime: '10:30',
    title: 'Opening Keynote',
    speakerId: '4',
    stage: 'Main Stage',
  },
  {
    id: 'a-2',
    day: '2026-04-28',
    startTime: '11:00',
    endTime: '12:00',
    title: 'AI in Product Design',
    speakerId: 'sarah-johnson',
    stage: 'Room A',
  },
  {
    id: 'a-3',
    day: '2026-04-28',
    startTime: '14:00',
    endTime: '15:00',
    title: 'Mixed-methods Research at Scale',
    speakerId: '2',
    stage: 'Room B',
  },
  {
    id: 'a-4',
    day: '2026-04-28',
    startTime: '15:30',
    endTime: '17:00',
    title: 'Workshop: Design Systems',
    speakerId: 'sarah-johnson',
    stage: 'Room A',
  },
  // Day 2 — Saturday Apr 29
  {
    id: 'a-5',
    day: '2026-04-29',
    startTime: '09:30',
    endTime: '10:30',
    title: 'Distributed Systems at Payment Scale',
    speakerId: '6',
    stage: 'Main Stage',
  },
  {
    id: 'a-6',
    day: '2026-04-29',
    startTime: '11:00',
    endTime: '12:00',
    title: 'Interpretability for Production LLMs',
    speakerId: '13',
    stage: 'Main Stage',
  },
  {
    id: 'a-7',
    day: '2026-04-29',
    startTime: '14:00',
    endTime: '15:30',
    title: 'Investor Panel — funding in 2026',
    speakerId: '9',
    stage: 'Room A',
  },
  {
    id: 'a-8',
    day: '2026-04-29',
    startTime: '16:00',
    endTime: '17:00',
    title: 'Closing Talk',
    speakerId: '13',
    stage: 'Main Stage',
  },
];

/** Convenience accessor used by InfoScreen day-tabs. */
export function agendaByDay(): Map<string, AgendaSession[]> {
  const map = new Map<string, AgendaSession[]>();
  for (const session of agenda) {
    const list = map.get(session.day) ?? [];
    list.push(session);
    map.set(session.day, list);
  }
  return map;
}
