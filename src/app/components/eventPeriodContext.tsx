/**
 * EventPeriodContext — single source of truth for the prototype's
 * "where in the event lifecycle are we" toggle.
 *
 * Replaces the previous pattern of every consumer reading
 * sessionStorage on mount and listening for a `eventPeriodChange`
 * CustomEvent. Anyone who needs the period now uses `useEventPeriod()`.
 *
 * The Provider is mounted in App.tsx around the router so all routes
 * share state and the switcher (HomeScreen / ProfileScreen) can update
 * it from anywhere.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type EventPeriod = 'before' | 'during' | 'after';

interface EventPeriodContextValue {
  period: EventPeriod;
  setPeriod: (next: EventPeriod) => void;
}

const STORAGE_KEY = 'eventPeriod';

function readInitial(): EventPeriod {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === 'before' || raw === 'during' || raw === 'after') return raw;
  } catch {
    /* ignore */
  }
  // Pre-event by default — fresh sessions land on this stage of the
  // lifecycle so the test user sees the full timeline (before → during
  // → after) as they explore.
  return 'before';
}

const EventPeriodContext = createContext<EventPeriodContextValue | null>(null);

export function EventPeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<EventPeriod>(readInitial);

  const setPeriod = useCallback((next: EventPeriod) => {
    setPeriodState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <EventPeriodContext.Provider value={{ period, setPeriod }}>
      {children}
    </EventPeriodContext.Provider>
  );
}

export function useEventPeriod(): EventPeriodContextValue {
  const ctx = useContext(EventPeriodContext);
  if (!ctx) {
    throw new Error('useEventPeriod() must be used inside <EventPeriodProvider>');
  }
  return ctx;
}
