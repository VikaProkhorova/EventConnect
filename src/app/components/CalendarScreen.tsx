import { ArrowLeft, Mic, MessageCircle, Radio, ChevronRight, Plus, Sparkles, X, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { useEventPeriod } from './eventPeriodContext';
import { scheduleEvents, type ScheduleEvent, type ScheduleEventType } from './mockSchedule';
import { addUserMeeting, getUserMeetings, minutesOf, type UserMeeting } from './meetingStore';
import { mockUsers, getMatchCandidates } from './mockUsers';
import { getConnections } from './chatStore';

// Local alias for readability
type EventType = ScheduleEventType;
type CalendarEvent = ScheduleEvent;

const TODAY_DAY_NUM = '28'; // Hardcoded "today" for the prototype.

/** Map a session speaker name to a mockUsers id. Best-effort: we look up by name. */
function findSpeakerId(name?: string): string | null {
  if (!name) return null;
  const found = Object.values(mockUsers).find(
    (u) => u.name === name || u.name.split(' ')[0] === name,
  );
  return found?.id ?? null;
}

const userMeetingToCalendarEvent = (m: UserMeeting): CalendarEvent => ({
  id: m.id,
  type: m.type === 'free-conversation' ? 'free-conversation' : 'meeting',
  day: m.day,
  title: m.title,
  startTime: m.startTime,
  endTime: m.endTime,
  location: m.location,
  rsvp: m.type === 'personal-meeting' ? 'confirmed' : undefined,
  partnerId: m.partnerId,
  partnerName: m.partnerName,
  note: m.topic,
});

export function CalendarScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { period } = useEventPeriod();
  const isPostEvent = period === 'after';
  const [activeDay, setActiveDay] = useState('28');
  const [viewMode, setViewMode] = useState<'my' | 'full'>('my');
  const [showSessions, setShowSessions] = useState(true);
  const [showMeetings, setShowMeetings] = useState(true);
  const [showFreeConv, setShowFreeConv] = useState(true);
  const [showMatchHighlight, setShowMatchHighlight] = useState(false);
  // RSVP and Join state — persisted in sessionStorage so they survive
  // navigation (otherwise joining a free-conv would "vanish" on remount).
  const [rsvpState, setRsvpState] = useState<Record<string, 'yes' | 'maybe' | 'skip' | 'confirmed' | undefined>>(
    () => {
      try {
        const raw = sessionStorage.getItem('calendarRsvp');
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    },
  );
  const [joinedFreeConv, setJoinedFreeConv] = useState<Record<string, boolean>>(() => {
    try {
      const raw = sessionStorage.getItem('calendarJoinedFreeConv');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem('calendarRsvp', JSON.stringify(rsvpState));
    } catch {
      /* ignore */
    }
  }, [rsvpState]);

  useEffect(() => {
    try {
      sessionStorage.setItem('calendarJoinedFreeConv', JSON.stringify(joinedFreeConv));
    } catch {
      /* ignore */
    }
  }, [joinedFreeConv]);

  const handleRsvp = (id: string, value: 'yes' | 'maybe' | 'skip') => {
    setRsvpState((prev) => ({ ...prev, [id]: prev[id] === value ? undefined : value }));
  };

  const toggleJoin = (id: string) => {
    setJoinedFreeConv((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentTime = '11:23';
  const currentHour = 11;
  const currentMins = minutesOf(currentTime);

  const days = [
    { id: '28', label: '28 Friday' },
    { id: '29', label: '29 Saturday' },
  ];

  const dayIso = `2026-04-${activeDay}`;

  // Bumped after addUserMeeting so the merged events list refreshes
  const [storeVersion, setStoreVersion] = useState(0);

  // Real connections (set of ids) — used to count *actual* match attendees
  const connectedIds = useMemo<Set<string>>(() => {
    void storeVersion;
    return new Set(getConnections().map((p) => String(p.id)));
  }, [storeVersion]);

  /** Number of attendees that are actually in my Connections list. */
  const realMatchCount = (e: CalendarEvent): number => {
    if (!e.matchAttendeeIds) return 0;
    return e.matchAttendeeIds.filter((id) => connectedIds.has(id)).length;
  };

  // Merged: hardcoded schedule + meetings the user has scheduled themselves
  const events = useMemo<CalendarEvent[]>(() => {
    void storeVersion;
    return [
      ...scheduleEvents,
      ...getUserMeetings().map(userMeetingToCalendarEvent),
    ];
  }, [storeVersion]);

  const eventsForDay = useMemo(
    () => events.filter((e) => e.day === dayIso),
    [events, dayIso],
  );

  /* ───────── My / All split (per "У my тільки поді на яких в мене yes") ───────── */

  const isInMy = (e: CalendarEvent): boolean => {
    if (e.type === 'meeting') return true; // user-owned by definition
    if (e.type === 'free-conversation') {
      // User-created free-conv (id starts with um-) is always My
      if (e.id.startsWith('um-')) return true;
      return joinedFreeConv[e.id] === true;
    }
    // session: default Yes when no rsvp set yet
    const r = rsvpState[e.id] ?? e.rsvp ?? 'yes';
    return r === 'yes';
  };

  const filteredEventsForDay = useMemo(
    () => eventsForDay.filter((e) => (viewMode === 'my' ? isInMy(e) : !isInMy(e))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsForDay, viewMode, rsvpState, joinedFreeConv],
  );

  /* ───────── Free-time gaps in the user's My-day (≥30 min, only in My view) ───────── */

  const freeTimeGaps = useMemo(() => {
    if (viewMode !== 'my') return [];
    const myEvents = eventsForDay
      .filter(isInMy)
      .slice()
      .sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime));
    const gaps: { startTime: string; endTime: string; minutes: number }[] = [];
    for (let i = 0; i < myEvents.length - 1; i++) {
      const endM = minutesOf(myEvents[i].endTime);
      const startM = minutesOf(myEvents[i + 1].startTime);
      if (startM - endM >= 30) {
        gaps.push({
          startTime: myEvents[i].endTime,
          endTime: myEvents[i + 1].startTime,
          minutes: startM - endM,
        });
      }
    }
    return gaps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsForDay, viewMode, rsvpState, joinedFreeConv]);

  const formatGap = (m: number) =>
    m >= 60
      ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim()
      : `${m}m`;

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);
  const [draftMeeting, setDraftMeeting] = useState<{
    type: 'personal-meeting' | 'free-conversation';
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    partnerId: string | null;
    partnerName: string | null;
    topic: string;
  }>({
    type: 'personal-meeting',
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    partnerId: null,
    partnerName: null,
    topic: '',
  });

  const openCreateSheet = (preset?: { startTime?: string; endTime?: string }) => {
    setDraftMeeting({
      type: 'personal-meeting',
      title: '',
      startTime: preset?.startTime ?? '',
      endTime: preset?.endTime ?? '',
      location: '',
      partnerId: null,
      partnerName: null,
      topic: '',
    });
    setShowCreateSheet(true);
  };

  const closeCreateSheet = () => {
    setShowCreateSheet(false);
    setShowPartnerPicker(false);
  };

  const pickerCandidates = useMemo(() => getMatchCandidates(), []);

  const submitMeeting = () => {
    if (!draftMeeting.startTime || !draftMeeting.endTime) return;
    if (draftMeeting.type === 'personal-meeting' && !draftMeeting.title.trim()) return;
    if (draftMeeting.type === 'free-conversation' && !draftMeeting.topic.trim()) return;

    const finalTitle =
      draftMeeting.type === 'free-conversation'
        ? draftMeeting.topic.trim()
        : draftMeeting.title.trim();

    addUserMeeting({
      type: draftMeeting.type,
      day: dayIso,
      title: finalTitle,
      startTime: draftMeeting.startTime,
      endTime: draftMeeting.endTime,
      location: draftMeeting.location.trim() || 'TBD',
      topic: draftMeeting.type === 'free-conversation' ? draftMeeting.topic.trim() : undefined,
      partnerId: draftMeeting.type === 'personal-meeting' ? draftMeeting.partnerId ?? undefined : undefined,
      partnerName: draftMeeting.type === 'personal-meeting' ? draftMeeting.partnerName ?? undefined : undefined,
    });
    setStoreVersion((v) => v + 1);
    closeCreateSheet();
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8);

  const timeToPosition = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return (hour - 8) * 80 + (minute / 60) * 80;
  };

  const getEventStyle = (event: CalendarEvent) => {
    const top = timeToPosition(event.startTime);
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const height = (duration / 60) * 80;

    return { top: `${top + 4}px`, height: `${height - 12}px` };
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'session':
        return { bg: 'bg-blue-50', border: 'border-l-blue-600' };
      case 'meeting':
        return { bg: 'bg-purple-50', border: 'border-l-purple-600' };
      case 'free-conversation':
        return { bg: 'bg-amber-50', border: 'border-l-amber-500' };
    }
  };

  const nowPosition = timeToPosition(currentTime);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 h-14 flex items-center border-b">
        <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-[22px] ml-3">Calendar</h1>
      </div>

      {/* Day Tabs */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto">
          {days.map((day) => (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              className={`px-3 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeDay === day.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Happening Now Banner — only on "today" (day 28) AND only for events I'm attending (My) */}
      {activeDay === TODAY_DAY_NUM && (() => {
        void currentHour; // intentionally unused here
        const happening = events.find(
          (e) =>
            e.day === `2026-04-${TODAY_DAY_NUM}` &&
            isInMy(e) &&
            minutesOf(e.startTime) <= currentMins &&
            minutesOf(e.endTime) > currentMins,
        );
        if (!happening) return null;
        const endsIn = minutesOf(happening.endTime) - currentMins;
        return (
          <div
            className="bg-green-50 mx-4 mt-4 rounded-xl p-3 cursor-pointer hover:bg-green-100"
            onClick={() => setSelectedEventId(happening.id)}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <span className="text-[10px] uppercase tracking-wider text-green-700 font-semibold">
                HAPPENING NOW
              </span>
            </div>
            <h3 className="font-bold text-base mb-1">{happening.title}</h3>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                {happening.location} · ends in {endsIn} min
                {realMatchCount(happening) ? ` · ${realMatchCount(happening)} of your match` : ''}
              </p>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        );
      })()}

      {/* Filter Bar */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex gap-2 overflow-x-auto">
          {/* Segmented Control */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('my')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'my' ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}
            >
              My
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'full' ? 'bg-blue-600 text-white' : 'text-gray-700'
              }`}
            >
              All
            </button>
          </div>

          {/* Type Chips */}
          <button
            onClick={() => setShowSessions(!showSessions)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
              showSessions ? 'bg-blue-50 text-blue-700 border-2 border-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            Sessions
          </button>
          <button
            onClick={() => setShowMeetings(!showMeetings)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
              showMeetings ? 'bg-purple-50 text-purple-700 border-2 border-purple-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-purple-600" />
            Meetings
          </button>
          <button
            onClick={() => setShowFreeConv(!showFreeConv)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
              showFreeConv ? 'bg-amber-50 text-amber-700 border-2 border-amber-500' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Free Conv
          </button>
          <button
            onClick={() => setShowMatchHighlight(!showMatchHighlight)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 ${
              showMatchHighlight ? 'bg-blue-100 text-blue-700 shadow-[0_0_0_2px_#3B82F6]' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            My match
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="flex">
          {/* Hour Column — small font so "10 AM" fits */}
          <div className="w-10 flex-shrink-0 relative">
            {hours.map((hour) => (
              <div key={hour} className="h-20 flex items-start justify-end pr-1.5">
                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 flex-shrink-0" />

          {/* Event Column */}
          <div className="flex-1 relative min-h-[1120px] px-3">
            {/* Hour Lines */}
            {hours.map((hour, i) => (
              <div
                key={hour}
                className="absolute -left-3 -right-3 border-t border-gray-100"
                style={{ top: `${i * 80}px` }}
              />
            ))}

            {/* Now Indicator — only on "today" (day 28) and only during the live event.
                Pre- and post-event lifecycles don't have a meaningful "now" line. */}
            {activeDay === TODAY_DAY_NUM && period === 'during' && (
              <div
                className="absolute -left-3 -right-3 border-t-2 border-red-600 z-20"
                style={{ top: `${nowPosition}px` }}
              >
                <div className="absolute left-0 -top-3 px-2 py-0.5 bg-white border-2 border-red-600 rounded-full">
                  <span className="text-red-600 text-[11px] font-bold">{currentTime}</span>
                </div>
              </div>
            )}

            {/* Free-time gaps — auto-computed between My-events on this day, only in My view */}
            {freeTimeGaps.map((gap) => {
              const top = timeToPosition(gap.startTime);
              const bottom = timeToPosition(gap.endTime);
              return (
                <div
                  key={`gap-${gap.startTime}`}
                  className="absolute -left-3 -right-3 z-0"
                  style={{ top: `${top}px`, height: `${bottom - top}px` }}
                >
                  <div className="absolute left-1/2 top-0 bottom-0 border-l-2 border-dashed border-gray-300 -translate-x-1/2" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10">
                    {!isPostEvent && (
                      <button
                        onClick={() =>
                          openCreateSheet({ startTime: gap.startTime, endTime: gap.endTime })
                        }
                        className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shadow-sm hover:bg-blue-100"
                        aria-label={`Schedule in ${formatGap(gap.minutes)} free slot`}
                      >
                        <Plus className="w-5 h-5 text-blue-600" />
                      </button>
                    )}
                    <span className="text-[11px] text-gray-500 whitespace-nowrap bg-gray-50 px-1.5 rounded">
                      {formatGap(gap.minutes)} free
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Events */}
            {filteredEventsForDay
              .filter((event) => {
                if (event.type === 'session' && !showSessions) return false;
                if (event.type === 'meeting' && !showMeetings) return false;
                if (event.type === 'free-conversation' && !showFreeConv) return false;
                return true;
              })
              .map((event, index) => {
                const colors = getEventColor(event.type);
                const style = getEventStyle(event);
                const isSelected = selectedEventId === event.id;
                const matchCount = realMatchCount(event);
                const isMatchEvent = matchCount > 0;
                const dimmed = showMatchHighlight && !isMatchEvent;

                // Resolve the avatar to show on the right of the card
                const speakerId = event.type === 'session' ? findSpeakerId(event.speaker) : null;
                const partnerId = event.type === 'meeting' ? event.partnerId ?? null : null;
                const avatarUserId = speakerId ?? partnerId;
                const avatarUser = avatarUserId ? mockUsers[avatarUserId] : null;

                const durationMin = minutesOf(event.endTime) - minutesOf(event.startTime);
                const isShort = durationMin <= 30;

                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`absolute left-0 right-0 ${colors.bg} rounded-xl border-l-4 ${colors.border} px-2.5 ${isShort ? 'py-1' : 'py-2'} shadow-sm overflow-hidden transition-opacity cursor-pointer min-h-[36px] ${dimmed ? 'opacity-40' : ''} ${isSelected ? 'shadow-[0_0_0_2px_#3B82F6]' : ''}`}
                    style={{ ...style, zIndex: 10 + index }}
                  >
                    {isShort ? (
                      // Single-row layout for events ≤30 min
                      <div className="flex items-center gap-1.5 h-full min-h-0">
                        <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap flex-shrink-0">
                          {event.startTime}
                        </span>
                        <h4 className="text-[12px] font-bold text-gray-900 truncate flex-1">
                          {event.title}
                        </h4>
                        {avatarUser ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/event/${eventId}/user/${avatarUser.id}`);
                            }}
                            className="flex-shrink-0"
                            aria-label={avatarUser.name}
                            title={avatarUser.name}
                          >
                            <img
                              src={avatarUser.image}
                              alt={avatarUser.name}
                              className="w-5 h-5 rounded-full object-cover ring-1 ring-white shadow-sm"
                            />
                          </button>
                        ) : event.type === 'free-conversation' ? (
                          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Radio className="w-2.5 h-2.5 text-amber-700" />
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      // Two-row layout for longer events
                      <div className="flex items-start gap-2 h-full min-h-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] text-gray-600 truncate">
                            {event.startTime}–{event.endTime} · {event.location}
                          </div>
                          <h4 className="font-bold text-[13px] text-gray-900 leading-tight truncate">
                            {event.title}
                          </h4>
                          {event.type === 'free-conversation' && event.openSlots !== undefined && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-700 mt-0.5">
                              <Radio className="w-2.5 h-2.5" />
                              {event.openSlots} open
                              {joinedFreeConv[event.id] && ' · Joined ✓'}
                            </div>
                          )}
                          {isMatchEvent && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                              <Sparkles className="w-2.5 h-2.5" />
                              {matchCount} match
                            </span>
                          )}
                        </div>

                        {avatarUser ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/event/${eventId}/user/${avatarUser.id}`);
                            }}
                            className="flex-shrink-0"
                            aria-label={`Open ${avatarUser.name}'s profile`}
                            title={avatarUser.name}
                          >
                            <img
                              src={avatarUser.image}
                              alt={avatarUser.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-white shadow-sm"
                            />
                          </button>
                        ) : event.type === 'free-conversation' ? (
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <Radio className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* FAB — hidden in post-event archive */}
      {!isPostEvent && (
        <button
          onClick={() => openCreateSheet()}
          className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-blue-600 shadow-lg flex items-center justify-center z-30 hover:bg-blue-700 active:scale-95"
          aria-label="Create new meeting"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Create Meeting Bottom Sheet */}
      {showCreateSheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={closeCreateSheet}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-3xl p-5 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-gray-900">
                {draftMeeting.type === 'free-conversation' ? 'New free conversation' : 'New meeting'}
              </h3>
              <button
                onClick={closeCreateSheet}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
            <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
              {(['personal-meeting', 'free-conversation'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDraftMeeting((d) => ({ ...d, type: t }))}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    draftMeeting.type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  {t === 'personal-meeting' ? 'Personal' : 'Free conversation'}
                </button>
              ))}
            </div>

            {draftMeeting.type === 'personal-meeting' ? (
              <>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                <input
                  autoFocus
                  value={draftMeeting.title}
                  onChange={(e) => setDraftMeeting((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Coffee with Sarah"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-3 outline-none focus:border-blue-500 focus:bg-white"
                />
              </>
            ) : (
              <>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Topic</label>
                <input
                  autoFocus
                  value={draftMeeting.topic}
                  onChange={(e) => setDraftMeeting((d) => ({ ...d, topic: e.target.value }))}
                  placeholder="What do you want to talk about?"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-3 outline-none focus:border-blue-500 focus:bg-white"
                />
              </>
            )}

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start</label>
                <input
                  type="time"
                  value={draftMeeting.startTime}
                  onChange={(e) => setDraftMeeting((d) => ({ ...d, startTime: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">End</label>
                <input
                  type="time"
                  value={draftMeeting.endTime}
                  onChange={(e) => setDraftMeeting((d) => ({ ...d, endTime: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {draftMeeting.type === 'personal-meeting' && (
              <>
            <label className="block text-xs font-semibold text-gray-600 mb-1">With</label>
            <button
              onClick={() => setShowPartnerPicker(true)}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left flex items-center gap-2 mb-3 hover:border-blue-500"
            >
              {draftMeeting.partnerId && mockUsers[draftMeeting.partnerId] ? (
                <>
                  <img
                    src={mockUsers[draftMeeting.partnerId].image}
                    alt={mockUsers[draftMeeting.partnerId].name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="text-gray-900 font-medium">
                    {mockUsers[draftMeeting.partnerId].name}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <span className="text-gray-500">Pick a participant</span>
                </>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
              </>
            )}

            <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
            <input
              value={draftMeeting.location}
              onChange={(e) => setDraftMeeting((d) => ({ ...d, location: e.target.value }))}
              placeholder="Coffee Lounge"
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-5 outline-none focus:border-blue-500 focus:bg-white"
            />

            <button
              onClick={submitMeeting}
              disabled={
                !draftMeeting.startTime ||
                !draftMeeting.endTime ||
                (draftMeeting.type === 'personal-meeting' && !draftMeeting.title.trim()) ||
                (draftMeeting.type === 'free-conversation' && !draftMeeting.topic.trim())
              }
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {draftMeeting.type === 'free-conversation' ? 'Create conversation' : 'Create meeting'}
            </button>
          </div>
        </div>
      )}

      {/* Partner picker (sub-modal of create-sheet) */}
      {showPartnerPicker && (
        <div className="fixed inset-0 z-[60] flex items-end" onClick={() => setShowPartnerPicker(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-3xl p-5 pb-6 shadow-2xl max-h-[80%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[18px] text-gray-900">Pick a participant</h3>
              <button
                onClick={() => setShowPartnerPicker(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                aria-label="Close picker"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <ul className="divide-y divide-gray-100 -mx-1">
              {pickerCandidates.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => {
                      setDraftMeeting((d) => ({
                        ...d,
                        partnerId: u.id,
                        partnerName: u.name,
                        title: d.title.trim() ? d.title : `Meeting with ${u.name.split(' ')[0]}`,
                      }));
                      setShowPartnerPicker(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <img
                      src={u.image}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {u.position} · {u.company}
                      </p>
                    </div>
                    {draftMeeting.partnerId === u.id && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Event Detail Bottom Sheet */}
      {selectedEventId && (() => {
        const e = events.find((ev) => ev.id === selectedEventId);
        if (!e) return null;
        const accent =
          e.type === 'session'
            ? { tint: 'bg-blue-50 text-blue-700', label: 'Session' }
            : e.type === 'meeting'
              ? { tint: 'bg-purple-50 text-purple-700', label: 'Personal meeting' }
              : { tint: 'bg-amber-50 text-amber-700', label: 'Free conversation' };
        return (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSelectedEventId(null)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative w-full bg-white rounded-t-3xl p-5 pb-6 shadow-2xl max-h-[80%] overflow-y-auto"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />

              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${accent.tint}`}>
                  {accent.label}
                </span>
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <h3 className="font-bold text-[20px] text-gray-900 mb-1">{e.title}</h3>
              <p className="text-sm text-gray-500 mb-4">
                {e.startTime} – {e.endTime} · {e.location}
              </p>

              {e.type === 'session' && e.speaker && (() => {
                const sId = findSpeakerId(e.speaker);
                const speaker = sId ? mockUsers[sId] : null;
                return (
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Speaker
                    </div>
                    {speaker ? (
                      <button
                        onClick={() => {
                          setSelectedEventId(null);
                          navigate(`/event/${eventId}/user/${speaker.id}`);
                        }}
                        className="flex items-center gap-2 text-sm text-gray-800 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg"
                      >
                        <img
                          src={speaker.image}
                          alt={speaker.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium">{e.speaker}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-800">
                        <Mic className="w-4 h-4 text-blue-600" />
                        {e.speaker}
                      </div>
                    )}
                  </div>
                );
              })()}

              {e.type === 'session' && (() => {
                const realCount = realMatchCount(e);
                const connectedAttendees = (e.matchAttendeeIds ?? [])
                  .filter((id) => connectedIds.has(id))
                  .map((id) => mockUsers[id])
                  .filter((u): u is typeof mockUsers[string] => Boolean(u));

                if (!e.goingCount && realCount === 0) return null;

                return (
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Going</div>
                    <p className="text-sm text-gray-800 mb-2">
                      {e.goingCount ?? 0} attendees
                      {realCount > 0 ? ` · ${realCount} of your connections` : ''}
                    </p>
                    {connectedAttendees.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {connectedAttendees.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedEventId(null);
                              navigate(`/event/${eventId}/user/${u.id}`);
                            }}
                            className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full hover:bg-green-100"
                            title={u.name}
                          >
                            <img
                              src={u.image}
                              alt={u.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-medium text-green-800 pr-1">
                              {u.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {e.type === 'meeting' && (() => {
                const partner = e.partnerId ? mockUsers[e.partnerId] : null;
                return (
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">With</div>
                    {partner ? (
                      <button
                        onClick={() => {
                          setSelectedEventId(null);
                          navigate(`/event/${eventId}/user/${partner.id}`);
                        }}
                        className="flex items-center gap-2 text-sm text-gray-800 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg"
                      >
                        <img
                          src={partner.image}
                          alt={partner.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium">You + {e.partnerName ?? partner.name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                      </button>
                    ) : (
                      <p className="text-sm text-gray-800">You + {e.partnerName ?? 'guest'}</p>
                    )}
                  </div>
                );
              })()}

              {e.type === 'free-conversation' && (
                <div className="mb-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Who's in
                  </div>
                  {e.openSlots !== undefined && (
                    <p className="text-sm text-gray-800 mb-2">
                      {e.openSlots} people · drop in any time
                    </p>
                  )}
                  {e.participantIds && e.participantIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {e.participantIds
                        .map((id) => mockUsers[id])
                        .filter((u): u is typeof mockUsers[string] => Boolean(u))
                        .map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedEventId(null);
                              navigate(`/event/${eventId}/user/${u.id}`);
                            }}
                            className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100"
                            title={u.name}
                          >
                            <img
                              src={u.image}
                              alt={u.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-xs font-medium text-amber-800 pr-1">
                              {u.name.split(' ')[0]}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {e.note && (
                <div className="mb-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Note</div>
                  <p className="text-sm italic text-gray-700">{e.note}</p>
                </div>
              )}

              {/* RSVP — sessions only, not in archived view */}
              {e.type === 'session' && !isPostEvent && (() => {
                // Default to Yes when nothing has been chosen yet
                const currentRsvp = rsvpState[e.id] ?? e.rsvp ?? 'yes';
                const setRsvp = (v: 'yes' | 'maybe' | 'skip') =>
                  setRsvpState((prev) => ({ ...prev, [e.id]: v }));
                const opts: Array<{ value: 'yes' | 'maybe' | 'skip'; label: string; activeCls: string }> = [
                  { value: 'yes', label: 'Yes', activeCls: 'bg-blue-600 text-white' },
                  { value: 'maybe', label: 'Maybe', activeCls: 'bg-blue-100 text-blue-700 border border-blue-600' },
                  { value: 'skip', label: 'Skip', activeCls: 'bg-gray-300 text-gray-800' },
                ];
                return (
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                      RSVP
                    </div>
                    <div className="flex gap-2">
                      {opts.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => setRsvp(o.value)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentRsvp === o.value
                              ? o.activeCls
                              : 'bg-white text-gray-700 border border-gray-300'
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 mt-2">
                {e.type === 'meeting' && e.partnerId && (
                  <button
                    onClick={() => {
                      setSelectedEventId(null);
                      navigate(`/event/${eventId}/chat/${e.partnerId}`);
                    }}
                    className="flex-1 h-11 rounded-xl bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat with {e.partnerName ?? 'guest'}
                  </button>
                )}
                {e.type === 'free-conversation' && !isPostEvent && (
                  <button
                    onClick={() => {
                      toggleJoin(e.id);
                      setSelectedEventId(null);
                    }}
                    className="flex-1 h-11 rounded-xl bg-amber-500 text-white font-semibold text-sm"
                  >
                    {joinedFreeConv[e.id] ? 'Joined ✓' : 'Join the conversation'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="flex-1 h-11 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
