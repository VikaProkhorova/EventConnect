import { ArrowLeft, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useMemo, useState } from 'react';
import { useAsync, useMutation } from '@/api/provider';
import type { CalendarEntry, EventId, RsvpStatus } from '@/domain/types';

const fmtTimeRange = (startIso: string, endIso: string): string => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const f = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${f(s)} – ${f(e)}`;
};

const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: '2-digit', weekday: 'long' });
};

export function CalendarScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;

  // Pull the event so we know which days to show as tabs.
  const eventQuery = useAsync((api) => api.events.get(eventId), [eventId]);

  const days = useMemo(() => {
    if (!eventQuery.data) return [];
    const out: string[] = [];
    const cur = new Date(eventQuery.data.startDate);
    const end = new Date(eventQuery.data.endDate);
    while (cur <= end) {
      out.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [eventQuery.data]);

  const [activeDay, setActiveDay] = useState<string | null>(null);
  const day = activeDay ?? days[0] ?? null;

  const dayQuery = useAsync(
    (api) => (day ? api.calendar.listDay(eventId, day) : Promise.resolve([])),
    [eventId, day],
  );

  const rsvpM = useMutation((api, entryId: CalendarEntry['id'], status: RsvpStatus) =>
    api.calendar.rsvp(entryId, status),
  );

  const handleRsvp = async (id: CalendarEntry['id'], status: RsvpStatus) => {
    await rsvpM.run(id, status);
    dayQuery.reload();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-bold text-xl">Calendar</h1>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                day === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {dayQuery.loading && (
          <div className="text-center text-gray-400 text-sm py-6">Loading…</div>
        )}
        {!dayQuery.loading && (dayQuery.data?.length ?? 0) === 0 && (
          <div className="text-center text-gray-400 text-sm py-12">No entries for this day.</div>
        )}
        {dayQuery.data?.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onRsvp={handleRsvp} />
        ))}
      </div>
    </div>
  );
}

function EntryCard({
  entry,
  onRsvp,
}: {
  entry: CalendarEntry;
  onRsvp: (id: CalendarEntry['id'], status: RsvpStatus) => void;
}) {
  const myRsvp: RsvpStatus | undefined = (() => {
    // We can't easily get current user's id here without an extra hook, so this card
    // shows the RSVP buttons unconditionally. The mock backend ignores irrelevant calls.
    return undefined;
  })();
  void myRsvp;

  const accent =
    entry.kind === 'official-session'
      ? { tint: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Session' }
      : entry.kind === 'personal-meeting'
        ? { tint: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Meeting' }
        : { tint: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Free conversation' };

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${accent.tint.split(' ').pop()} `}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className={`inline-block ${accent.tint} text-xs px-2 py-0.5 rounded mb-1`}>
            {accent.label}
          </div>
          <h3 className="font-semibold text-sm mb-1">{entry.title}</h3>
          <p className="text-xs text-gray-500">{fmtTimeRange(entry.startAt, entry.endAt)}</p>
          {entry.location && (
            <p className="text-xs text-gray-500 mt-1">
              {entry.location}
              {entry.stage && entry.stage !== entry.location ? ` · ${entry.stage}` : ''}
            </p>
          )}
          {entry.topic && (
            <p className="text-xs text-gray-700 italic mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {entry.topic}
            </p>
          )}
        </div>
      </div>

      {entry.kind === 'official-session' && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onRsvp(entry.id, 'maybe')}
            className="flex-1 bg-gray-50 text-gray-700 py-1.5 rounded-lg text-xs font-medium"
          >
            Maybe
          </button>
          <button
            onClick={() => onRsvp(entry.id, 'yes')}
            className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs font-medium"
          >
            Yes
          </button>
        </div>
      )}

      {entry.kind === 'free-conversation' && (
        <div className="mt-3 flex items-center gap-2">
          <button className="flex-1 bg-purple-50 text-purple-700 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            Free to join
          </button>
          <span className="text-xs text-gray-500">
            {entry.participantIds.length} {entry.participantIds.length === 1 ? 'person' : 'people'}
          </span>
        </div>
      )}

      {entry.kind === 'personal-meeting' && (
        <p className="text-xs text-gray-500 mt-2">
          With {entry.participantIds.length} {entry.participantIds.length === 1 ? 'person' : 'people'}
        </p>
      )}
    </div>
  );
}
