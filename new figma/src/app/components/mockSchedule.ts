/**
 * Schedule events for the event (sessions / personal meetings / free
 * conversations). Extracted from CalendarScreen so the +Meeting flow
 * in ChatConversationScreen can compute mutual free time without
 * duplicating data.
 */

export type ScheduleEventType = 'session' | 'meeting' | 'free-conversation';

export type ScheduleEvent = {
  id: string;
  type: ScheduleEventType;
  /** YYYY-MM-DD */
  day: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;
  location: string;
  speaker?: string;
  attendees?: { name: string; avatar: string; isMatch?: boolean }[];
  /** Match-attendee user ids (mockUsers keys) — clickable in session detail. */
  matchAttendeeIds?: string[];
  goingCount?: number;
  matchCount?: number;
  note?: string;
  rsvp?: 'yes' | 'maybe' | 'skip' | 'confirmed';
  openSlots?: number;
  /** For free-conversation: ids of users who have joined (besides the local user). */
  participantIds?: string[];
  partnerId?: string;
  partnerName?: string;
};

/**
 * Hardcoded schedule for Tech Summit 2026.
 * Day 1 (Apr 28): keynote, design talk, lunch-time gap, workshop.
 * Day 2 (Apr 29): backend talk, AI safety, investor panel, closing.
 */
export const scheduleEvents: ScheduleEvent[] = [
  {
    id: 's-1',
    type: 'session',
    day: '2026-04-28',
    title: 'Opening Keynote',
    startTime: '09:00',
    endTime: '10:30',
    location: 'Main Stage',
    speaker: 'Liam Patel',
    matchAttendeeIds: ['4', '9'], // Liam (speaker), Yuki (investor)
    goingCount: 45,
    matchCount: 2,
    rsvp: 'yes',
  },
  {
    id: 's-2',
    type: 'session',
    day: '2026-04-28',
    title: 'AI in Product Design',
    startTime: '11:00',
    endTime: '12:00',
    location: 'Room A',
    speaker: 'Sarah Johnson',
    matchAttendeeIds: ['1', '2', '7'], // Michael Chen, Emma Rodriguez, Olivia Nguyen
    goingCount: 12,
    matchCount: 3,
    note: '#aiproduct interesting takes',
    rsvp: 'maybe',
  },
  {
    id: 's-3',
    type: 'meeting',
    day: '2026-04-28',
    title: 'Catch-up with Sarah',
    startTime: '12:30',
    endTime: '13:00',
    location: 'Coffee Lounge',
    rsvp: 'confirmed',
    partnerId: 'sarah-johnson',
    partnerName: 'Sarah',
  },
  {
    id: 's-4',
    type: 'free-conversation',
    day: '2026-04-28',
    title: 'AI tooling rant',
    startTime: '13:30',
    endTime: '14:00',
    location: 'Coffee Lounge',
    openSlots: 4,
    participantIds: ['1', '7', '13'], // Michael, Olivia, Nikolai
  },
  {
    id: 's-fc1',
    type: 'free-conversation',
    day: '2026-04-28',
    title: 'How to break into product',
    startTime: '14:30',
    endTime: '15:15',
    location: 'Lounge B',
    openSlots: 3,
    participantIds: ['7', '15'], // Olivia, Diego
  },
  {
    id: 's-5',
    type: 'session',
    day: '2026-04-28',
    title: 'Workshop: Design Systems',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Room B',
    speaker: 'Michael Chen',
    matchAttendeeIds: ['sara-p', '12'], // Sara P, Camila
    goingCount: 8,
    matchCount: 2,
    rsvp: 'yes',
  },
  {
    id: 's-fc2',
    type: 'free-conversation',
    day: '2026-04-28',
    title: 'Hiring senior engineers in 2026',
    startTime: '17:30',
    endTime: '18:00',
    location: 'Coffee Lounge',
    openSlots: 5,
    participantIds: ['3', '6'], // James, Daniel
  },
  // Day 2
  {
    id: 's-6',
    type: 'session',
    day: '2026-04-29',
    title: 'Distributed Systems at Payment Scale',
    startTime: '09:30',
    endTime: '10:30',
    location: 'Main Stage',
    speaker: 'Daniel Kovács',
    matchAttendeeIds: ['3', '11'], // James, Felix
    goingCount: 22,
    matchCount: 2,
    rsvp: 'yes',
  },
  {
    id: 's-fc3',
    type: 'free-conversation',
    day: '2026-04-29',
    title: 'Frontend perf war stories',
    startTime: '10:30',
    endTime: '11:00',
    location: 'Lounge B',
    openSlots: 4,
    participantIds: ['11', '15'], // Felix, Diego
  },
  {
    id: 's-7',
    type: 'session',
    day: '2026-04-29',
    title: 'Interpretability for Production LLMs',
    startTime: '11:00',
    endTime: '12:00',
    location: 'Main Stage',
    speaker: 'Nikolai Dmitriev',
    matchAttendeeIds: ['13', '5'], // Nikolai (speaker), Maya
    goingCount: 18,
    matchCount: 2,
  },
  {
    id: 's-fc4',
    type: 'free-conversation',
    day: '2026-04-29',
    title: 'Career break — yes or no?',
    startTime: '12:30',
    endTime: '13:15',
    location: 'Garden Lounge',
    openSlots: 6,
    participantIds: ['2', '14'], // Emma, Zara
  },
  {
    id: 's-8',
    type: 'session',
    day: '2026-04-29',
    title: 'Investor Panel — funding in 2026',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Room A',
    speaker: 'Yuki Tanaka',
    matchAttendeeIds: ['4', '9'], // Liam (founder), Yuki (speaker)
    goingCount: 31,
    matchCount: 2,
  },
  {
    id: 's-fc5',
    type: 'free-conversation',
    day: '2026-04-29',
    title: 'Wearables — is the wrist over?',
    startTime: '15:30',
    endTime: '16:00',
    location: 'Coffee Lounge',
    openSlots: 4,
    participantIds: ['14', '8'], // Zara, Rasmus
  },
  {
    id: 's-9',
    type: 'session',
    day: '2026-04-29',
    title: 'Closing Talk',
    startTime: '16:00',
    endTime: '17:00',
    location: 'Main Stage',
    speaker: 'Nikolai Dmitriev',
    matchAttendeeIds: ['13', '4', '9'],
    goingCount: 40,
    matchCount: 3,
  },
];
