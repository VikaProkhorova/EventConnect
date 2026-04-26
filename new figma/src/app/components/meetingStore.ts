/**
 * User-created meetings (sessionStorage-backed) + helpers for the
 * +Meeting flow (SOW §4.8): mutual-free-time computation between
 * the user's daily schedule and a contact.
 *
 * For the prototype "mutual" simplifies to the local user's busy
 * times — the partner is assumed available everywhere they aren't.
 */

import { scheduleEvents, type ScheduleEvent } from './mockSchedule';

export type UserMeeting = {
  id: string;
  type: 'free-conversation' | 'personal-meeting';
  /** YYYY-MM-DD */
  day: string;
  startTime: string; // HH:mm
  endTime: string;
  title: string;
  location: string;
  topic?: string;
  partnerId?: string;
  partnerName?: string;
  /** ISO timestamp at which this meeting was created. */
  createdAt: string;
};

const KEY = 'userMeetings';

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
    /* ignore */
  }
}

export function getUserMeetings(): UserMeeting[] {
  return readJson<UserMeeting[]>(KEY, []);
}

export function addUserMeeting(input: Omit<UserMeeting, 'id' | 'createdAt'>): UserMeeting {
  const m: UserMeeting = {
    ...input,
    id: `um-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  writeJson(KEY, [...getUserMeetings(), m]);
  return m;
}

/* ───────── Time helpers ───────── */

export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fmtMinutes = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const DAY_START = '08:00';
const DAY_END = '21:00';

/** Available days in the schedule (sorted). */
export function getScheduleDays(): string[] {
  return Array.from(new Set(scheduleEvents.map((e) => e.day))).sort();
}

/**
 * Find free time-slots on `day` of at least `minMinutes` length.
 * "Busy" includes hardcoded schedule events on that day plus the
 * user's previously-added meetings.
 */
export function getFreeSlots(
  day: string,
  minMinutes = 15,
): { startTime: string; endTime: string; durationMinutes: number }[] {
  const busy: Array<{ start: number; end: number }> = [
    ...scheduleEvents.filter((e: ScheduleEvent) => e.day === day),
    ...getUserMeetings().filter((m) => m.day === day),
  ]
    .map((e) => ({ start: minutesOf(e.startTime), end: minutesOf(e.endTime) }))
    .sort((a, b) => a.start - b.start);

  // Merge overlapping busy ranges
  const merged: Array<{ start: number; end: number }> = [];
  for (const b of busy) {
    if (merged.length === 0 || b.start > merged[merged.length - 1].end) {
      merged.push({ ...b });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, b.end);
    }
  }

  const dayStart = minutesOf(DAY_START);
  const dayEnd = minutesOf(DAY_END);
  const slots: { startTime: string; endTime: string; durationMinutes: number }[] = [];
  let cursor = dayStart;
  for (const b of merged) {
    if (b.start - cursor >= minMinutes) {
      slots.push({
        startTime: fmtMinutes(cursor),
        endTime: fmtMinutes(b.start),
        durationMinutes: b.start - cursor,
      });
    }
    cursor = Math.max(cursor, b.end);
  }
  if (dayEnd - cursor >= minMinutes) {
    slots.push({
      startTime: fmtMinutes(cursor),
      endTime: fmtMinutes(dayEnd),
      durationMinutes: dayEnd - cursor,
    });
  }
  return slots;
}
