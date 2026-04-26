/**
 * Auth state for the prototype (sessionStorage-backed).
 * Real product would back this with magic-link tokens + secure session
 * cookies. Here we just track three booleans + an email.
 */

const LOGGED_IN_KEY = 'isLoggedIn';
const EMAIL_KEY = 'userEmail';
const ONBOARDED_KEY = 'onboardingComplete';
const GEO_OPT_KEY = 'geoOptIn';

export function isLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(LOGGED_IN_KEY) === '1';
  } catch {
    return false;
  }
}

export function getUserEmail(): string | null {
  try {
    return sessionStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function setLoggedIn(email: string): void {
  try {
    sessionStorage.setItem(LOGGED_IN_KEY, '1');
    sessionStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* ignore */
  }
}

export function logout(): void {
  try {
    sessionStorage.removeItem(LOGGED_IN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

export function isOnboardingComplete(): boolean {
  try {
    return sessionStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboardingComplete(): void {
  try {
    sessionStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export type GeoOptIn = 'granted' | 'denied' | null;

export function getGeoOptIn(): GeoOptIn {
  try {
    const v = sessionStorage.getItem(GEO_OPT_KEY);
    if (v === 'granted' || v === 'denied') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setGeoOptIn(v: 'granted' | 'denied'): void {
  try {
    sessionStorage.setItem(GEO_OPT_KEY, v);
  } catch {
    /* ignore */
  }
}
