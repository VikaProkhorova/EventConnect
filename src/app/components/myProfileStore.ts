/**
 * Local-user profile store (sessionStorage-backed).
 *
 * Why a store: ProfileScreen owns the editable profile UI, but
 * ParticipantsScreen and HomeScreen need to gate the Match tab
 * (SOW §4.4: "Match tab locked until Name, Position, Grade,
 * Company, and 7+ Interests are completed"). Pulling profile
 * data from a single source keeps the gate consistent across screens.
 */

export type MyProfile = {
  name: string;
  company: string;
  position: string;
  industry: string;
  grade: string;
  wantToTalkAbout: string[];
  description: string;
  email: string;
  linkedin: string;
  telegram: string;
  photoUrl: string;
};

/**
 * Defaults are intentionally empty: a fresh session lands on the login
 * screen, then on the master-profile setup form so the test user fills
 * everything from scratch (used to measure profile-completion time).
 */
export const DEFAULT_PROFILE: MyProfile = {
  name: '',
  company: '',
  position: '',
  industry: '',
  grade: '',
  wantToTalkAbout: [],
  description: '',
  email: '',
  linkedin: '',
  telegram: '',
  photoUrl: '',
};

export const DEFAULT_INTERESTS: string[] = [];

/**
 * Two layers of storage:
 *
 *   master ............ The user's "current" profile. Edited from the /me
 *                       master-profile screen accessed via the events list.
 *                       New events copy this as their starting snapshot.
 *
 *   per-event snapshot. Each event has its own snapshot keyed by eventId.
 *                       Editing inside the event ProfileScreen only updates
 *                       this snapshot — master and other events stay frozen.
 */

const PROFILE_KEY = 'myProfile'; // master
const INTERESTS_KEY = 'myInterests'; // master
const eventProfileKey = (eventId: string) => `myProfile_${eventId}`;
const eventInterestsKey = (eventId: string) => `myInterests_${eventId}`;

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

/* ───────── master profile (events list) ───────── */

export function getMasterProfile(): MyProfile {
  return { ...DEFAULT_PROFILE, ...readJson<Partial<MyProfile>>(PROFILE_KEY, {}) };
}
export function setMasterProfile(p: MyProfile): void {
  writeJson(PROFILE_KEY, p);
}
export function getMasterInterests(): string[] {
  const stored = readJson<string[] | null>(INTERESTS_KEY, null);
  return stored ?? DEFAULT_INTERESTS;
}
export function setMasterInterests(i: string[]): void {
  writeJson(INTERESTS_KEY, i);
}

// Legacy aliases — gate checks (HomeScreen / ParticipantsScreen) use master.
export const getMyProfile = getMasterProfile;
export const setMyProfile = setMasterProfile;
export const getMyInterests = getMasterInterests;
export const setMyInterests = setMasterInterests;

/* ───────── per-event snapshot (within event ProfileScreen) ───────── */

/**
 * Returns the per-event profile snapshot. If none exists yet (first
 * time the user enters this event), copies master into the snapshot.
 * Subsequent calls return whatever the user has edited within the event.
 */
export function getEventProfile(eventId: string): MyProfile {
  const key = eventProfileKey(eventId);
  const stored = readJson<Partial<MyProfile> | null>(key, null);
  if (stored !== null) {
    return { ...DEFAULT_PROFILE, ...stored };
  }
  // First entry — snapshot from master and persist.
  const master = getMasterProfile();
  writeJson(key, master);
  return master;
}

export function setEventProfile(eventId: string, p: MyProfile): void {
  writeJson(eventProfileKey(eventId), p);
}

export function getEventInterests(eventId: string): string[] {
  const key = eventInterestsKey(eventId);
  const stored = readJson<string[] | null>(key, null);
  if (stored !== null) return stored;
  const master = getMasterInterests();
  writeJson(key, master);
  return master;
}

export function setEventInterests(eventId: string, i: string[]): void {
  writeJson(eventInterestsKey(eventId), i);
}

/* ───────── Profile-gate (SOW §4.4) ───────── */

export const REQUIRED_FIELDS: Array<keyof MyProfile> = [
  'name',
  'company',
  'position',
  'grade',
  'industry',
];
export const MIN_INTERESTS = 7;

export type GateMissing = {
  fields: Array<keyof MyProfile>;
  interests: number; // how many more interests are still needed
};

/** Returns missing pieces; if everything is satisfied, both arrays/numbers are empty. */
export function getProfileGateMissing(
  profile: MyProfile = getMyProfile(),
  interests: string[] = getMyInterests(),
): GateMissing {
  const missingFields = REQUIRED_FIELDS.filter((f) => !String(profile[f] ?? '').trim());
  const missingInterests = Math.max(0, MIN_INTERESTS - interests.length);
  return { fields: missingFields, interests: missingInterests };
}

export function isProfileGateOpen(
  profile?: MyProfile,
  interests?: string[],
): boolean {
  const m = getProfileGateMissing(profile, interests);
  return m.fields.length === 0 && m.interests === 0;
}

/**
 * Profile completion 0-100. Counts every meaningful piece of the profile
 * (5 required fields + 7 interest slots + the optional fields users can
 * fill). 100% only when the profile is fully populated, so the percent
 * moves up as the user edits.
 */
export function getProfileCompletionPercent(
  profile: MyProfile = getMasterProfile(),
  interests: string[] = getMasterInterests(),
): number {
  const filledFields = REQUIRED_FIELDS.filter((f) => String(profile[f] ?? '').trim()).length;
  const filledInterests = Math.min(interests.length, MIN_INTERESTS);

  const optional: Array<boolean> = [
    profile.description.trim().length > 0,
    profile.wantToTalkAbout.some((t) => t.trim().length > 0),
    profile.photoUrl.trim().length > 0,
    profile.email.trim().length > 0,
    profile.linkedin.trim().length > 0,
    profile.telegram.trim().length > 0,
  ];
  const filledOptional = optional.filter(Boolean).length;

  const total = REQUIRED_FIELDS.length + MIN_INTERESTS + optional.length;
  return Math.round(((filledFields + filledInterests + filledOptional) / total) * 100);
}

/** Human-readable label per required field, for the gate UI. */
export const FIELD_LABEL: Record<keyof MyProfile, string> = {
  name: 'Name',
  company: 'Company',
  position: 'Position',
  industry: 'Industry',
  grade: 'Grade',
  wantToTalkAbout: 'Want to talk about',
  description: 'Description',
  email: 'Email',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  photoUrl: 'Photo',
};
