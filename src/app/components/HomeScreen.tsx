import { ArrowLeft, ChevronRight, FileText, Users, UserCircle, Images, Calendar, Radio, ChevronDown, Clock, Lock, Trophy, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { MatchCard } from './MatchCard';
import { SwipeableCard } from './SwipeableCard';
import { getMatchCandidates, rankCandidatesByMatch, toStoredPerson } from './mockUsers';
import {
  addToHidden,
  addToLiked,
  getConnectionGoal,
  getConnections,
  getRelationship,
  getViewedGallery,
  seedChatStoreOnce,
} from './chatStore';
import { getTotalPhotoCount, NEW_PHOTOS_COUNT } from './mockGallery';
import { useEventPeriod } from './eventPeriodContext';
import { hasSubmittedFeedback } from './FeedbackScreen';
import {
  getEventInterests,
  getEventProfile,
  getProfileCompletionPercent,
  getProfileGateMissing,
  isProfileGateOpen,
} from './myProfileStore';
import { scheduleEvents } from './mockSchedule';
import { getUserMeetings, minutesOf } from './meetingStore';

const mockEvents = [
  { id: 1, name: 'Tech Summit 2026', shortName: 'TS', color: 'bg-blue-600' },
  { id: 2, name: 'Product Design Conference', shortName: 'PDC', color: 'bg-purple-600' },
];

export function HomeScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [showEventSwitcher, setShowEventSwitcher] = useState(false);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const { period: eventPeriod, setPeriod: setEventPeriod } = useEventPeriod();
  const currentEvent = mockEvents.find((e) => e.id === Number(eventId)) || mockEvents[0];

  // Bumped after Like/Dismiss to trigger re-derivation of candidates / counts.
  const [storeVersion, setStoreVersion] = useState(0);

  // Make sure default seeds (incl. connections) exist before reading counts.
  useEffect(() => {
    seedChatStoreOnce();
    setStoreVersion((v) => v + 1);
  }, []);

  /* ───────── Derived data (re-computed on storeVersion bump or remount) ───────── */

  const rankedCandidates = useMemo(() => {
    void storeVersion;
    const open = getMatchCandidates().filter((u) => getRelationship(u.id) === 'default');
    if (!eventId) return [];
    return rankCandidatesByMatch(
      open,
      getEventProfile(eventId),
      getEventInterests(eventId),
    );
  }, [storeVersion, eventId]);

  const topMatch = rankedCandidates[0]?.user ?? null;
  const topMatchScore = rankedCandidates[0]?.score ?? 0;
  const moreMatchesCount = Math.max(0, rankedCandidates.length - 1);

  const connectionsCount = useMemo(() => {
    void storeVersion;
    return getConnections().length;
  }, [storeVersion]);

  const connectionGoal = useMemo(() => {
    void storeVersion;
    return getConnectionGoal();
  }, [storeVersion]);
  const filledGoalSegments = Math.min(connectionsCount, connectionGoal);

  const totalPhotos = getTotalPhotoCount();
  const newPhotosCount = useMemo(() => {
    void storeVersion;
    return getViewedGallery() ? 0 : NEW_PHOTOS_COUNT;
  }, [storeVersion]);

  const participantsTotal = getMatchCandidates().length;

  // Profile gate (SOW §4.4) — uses the event-scoped profile, so the
  // user can unlock matches by editing in /event/:id/profile without
  // having to also touch the master profile.
  const gateOpen = useMemo(() => {
    void storeVersion;
    if (!eventId) return false;
    return isProfileGateOpen(getEventProfile(eventId), getEventInterests(eventId));
  }, [storeVersion, eventId]);

  const gateMissing = useMemo(() => {
    void storeVersion;
    if (!eventId) return { fields: [], interests: 0 } as ReturnType<typeof getProfileGateMissing>;
    return getProfileGateMissing(getEventProfile(eventId), getEventInterests(eventId));
  }, [storeVersion, eventId]);

  const profileCompletion = useMemo(() => {
    void storeVersion;
    if (eventId) {
      return getProfileCompletionPercent(getEventProfile(eventId), getEventInterests(eventId));
    }
    return getProfileCompletionPercent();
  }, [storeVersion, eventId]);

  /* ───────── Post-event stats (read straight from sessionStorage) ───────── */
  const postEventStats = useMemo(() => {
    void storeVersion;

    // Sessions attended: 'yes' (default) RSVP across all schedule sessions
    let rsvpMap: Record<string, string | undefined> = {};
    try {
      const raw = sessionStorage.getItem('calendarRsvp');
      if (raw) rsvpMap = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    const sessionsAttended = scheduleEvents
      .filter((e) => e.type === 'session')
      .filter((e) => {
        const r = rsvpMap[e.id] ?? e.rsvp ?? 'yes';
        return r === 'yes';
      }).length;

    // Conversations started: chats with at least 1 message
    let conversationsStarted = 0;
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key || !key.startsWith('messages_')) continue;
        const raw = sessionStorage.getItem(key);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) conversationsStarted++;
      }
    } catch {
      /* ignore */
    }

    return {
      connectionsMade: connectionsCount,
      conversationsStarted,
      sessionsAttended,
    };
  }, [storeVersion, connectionsCount]);

  const handleTopMatchLike = () => {
    if (!topMatch) return;
    addToLiked(toStoredPerson(topMatch));
    setStoreVersion((v) => v + 1);
  };

  const handleTopMatchDismiss = () => {
    if (!topMatch) return;
    addToHidden(toStoredPerson(topMatch));
    setStoreVersion((v) => v + 1);
  };

  /* ───────── Quick Access section (extracted so we can re-order per period) ───────── */
  const calendarSummary = useMemo(() => {
    void storeVersion;
    // "Today" in the prototype = day 1 of the schedule (2026-04-28).
    const today = scheduleEvents[0]?.day ?? '2026-04-28';

    let rsvpMap: Record<string, string | undefined> = {};
    try {
      const raw = sessionStorage.getItem('calendarRsvp');
      if (raw) rsvpMap = JSON.parse(raw);
    } catch { /* ignore */ }

    let joinedFreeConv: Record<string, boolean> = {};
    try {
      const raw = sessionStorage.getItem('calendarJoinedFreeConv');
      if (raw) joinedFreeConv = JSON.parse(raw);
    } catch { /* ignore */ }

    type Slot = { id: string; type: string; day: string; startTime: string; endTime: string };
    const all: Slot[] = [
      ...scheduleEvents,
      ...getUserMeetings().map((m) => ({ id: m.id, type: m.type, day: m.day, startTime: m.startTime, endTime: m.endTime })),
    ].filter((e) => e.day === today);

    const inMy = (e: Slot): boolean => {
      if (e.type === 'meeting') return true;
      if (e.type === 'free-conversation') {
        if (e.id.startsWith('um-')) return true;
        return joinedFreeConv[e.id] === true;
      }
      const r = rsvpMap[e.id] ?? (scheduleEvents.find((s) => s.id === e.id)?.rsvp ?? 'yes');
      return r === 'yes';
    };

    const myEvents = all.filter(inMy).sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime));

    let freeMinutes = 0;
    for (let i = 0; i < myEvents.length - 1; i++) {
      const gap = minutesOf(myEvents[i + 1].startTime) - minutesOf(myEvents[i].endTime);
      if (gap >= 30) freeMinutes += gap;
    }

    const freeConvOpenCount = scheduleEvents.filter(
      (e) => e.day === today && e.type === 'free-conversation' && !joinedFreeConv[e.id],
    ).length;

    return { meetingsCount: myEvents.length, freeMinutes, freeConvOpenCount };
  }, [storeVersion]);

  const renderQuickAccess = () => {
    const formatFreeTime = (m: number) => {
      if (m <= 0) return '0 min free';
      if (m < 60) return `${m} min free`;
      const h = Math.floor(m / 60);
      const rem = m % 60;
      return rem === 0 ? `${h}h free` : `${h}h ${rem}m free`;
    };
    const calendarSubtitle =
      eventPeriod === 'after'
        ? `${postEventStats.sessionsAttended} sessions · ${connectionsCount} ${connectionsCount === 1 ? 'meeting' : 'meetings'}`
        : `${calendarSummary.meetingsCount} ${calendarSummary.meetingsCount === 1 ? 'meeting' : 'meetings'} · ${formatFreeTime(calendarSummary.freeMinutes)}`;

    const showCalendarBadge = eventPeriod !== 'after' && calendarSummary.freeConvOpenCount > 0;

    const participantsBadge =
      eventPeriod === 'before'
        ? '+5 new'
        : `${connectionsCount} ${connectionsCount === 1 ? 'match' : 'matches'}`;

    const galleryCount =
      eventPeriod === 'before' ? '0 photos' : `${totalPhotos} photos`;
    const showGalleryBadge = eventPeriod !== 'before' && newPhotosCount > 0;

    const showNRT = eventPeriod !== 'after';
    const nrtDisabled = eventPeriod === 'before';
    const calendarAtBottom = eventPeriod === 'after';

    const calendarCard = (
      <button
        key="calendar"
        onClick={() => navigate(`/event/${eventId}/calendar`)}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 text-left hover:bg-gray-50 active:scale-98 transition-transform"
      >
        <Calendar className="w-6 h-6 text-indigo-600 mb-2" />
        <h3 className="font-semibold text-sm mb-1">Calendar</h3>
        <p className="text-xs text-gray-500">{calendarSubtitle}</p>
        {showCalendarBadge && (
          <span className="inline-block mt-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
            +{calendarSummary.freeConvOpenCount} free conversation
            {calendarSummary.freeConvOpenCount === 1 ? '' : 's'}
          </span>
        )}
      </button>
    );

    const nrtCard = nrtDisabled ? (
      <button
        key="nrt"
        disabled
        className="bg-gray-200 rounded-xl p-4 shadow-sm col-span-2 text-gray-400 text-left cursor-not-allowed opacity-60"
      >
        <Radio className="w-6 h-6 mb-2" />
        <h3 className="font-semibold text-sm mb-1">Network in Real Life</h3>
        <p className="text-xs">Activates when the event starts</p>
      </button>
    ) : (
      <button
        key="nrt"
        onClick={() => navigate(`/event/${eventId}/network`)}
        className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-4 shadow-sm col-span-2 text-white text-left hover:opacity-90 active:scale-98 transition-all"
      >
        <Radio className="w-6 h-6 mb-2" />
        <h3 className="font-semibold text-sm mb-1">Network in Real Life</h3>
        <p className="text-xs opacity-90">See who's nearby and join conversations</p>
      </button>
    );

    const smallCards = (
      <>
        <button
          key="info"
          onClick={() => navigate(`/event/${eventId}/info`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
        >
          <FileText className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-semibold text-sm mb-1">Info</h3>
          <p className="text-xs text-gray-500">Event details</p>
        </button>
        <button
          key="participants"
          onClick={() => navigate(`/event/${eventId}/participants`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
        >
          <Users className="w-6 h-6 text-green-600 mb-2" />
          <h3 className="font-semibold text-sm mb-1">Participants</h3>
          <p className="text-xs text-gray-500">{participantsTotal} people</p>
          <span className="inline-block mt-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
            {participantsBadge}
          </span>
        </button>
        <button
          key="profile"
          onClick={() => navigate(`/event/${eventId}/profile`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
        >
          <UserCircle className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="font-semibold text-sm mb-1">Your Profile</h3>
          <p className="text-xs text-gray-500">{profileCompletion}% complete</p>
        </button>
        <button
          key="gallery"
          onClick={() => navigate(`/event/${eventId}/gallery`)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
        >
          <Images className="w-6 h-6 text-orange-600 mb-2" />
          <h3 className="font-semibold text-sm mb-1">Gallery</h3>
          <p className="text-xs text-gray-500">{galleryCount}</p>
          {showGalleryBadge && (
            <span className="inline-block mt-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">
              +{newPhotosCount} new
            </span>
          )}
        </button>
      </>
    );

    return (
      <section>
        <h2 className="font-bold text-lg mb-3 px-1">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          {!calendarAtBottom && calendarCard}
          {showNRT && nrtCard}
          {smallCards}
          {calendarAtBottom && calendarCard}
        </div>
      </section>
    );
  };

  return (
    <div className="h-full overflow-x-hidden overflow-y-auto bg-gray-50">
      <div className="sticky top-0 z-10 bg-white px-4 py-4 border-b flex items-center gap-3 relative">
        <button onClick={() => navigate('/events')} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={() => setShowEventSwitcher(!showEventSwitcher)}
          className="flex items-center gap-2 flex-1"
        >
          <div className={`w-8 h-8 rounded-full ${currentEvent.color} flex items-center justify-center`}>
            <span className="text-white text-sm font-bold">{currentEvent.shortName}</span>
          </div>
          <span className="font-semibold">{currentEvent.name}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        <button
          onClick={() => setShowPeriodSelector(!showPeriodSelector)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Clock className="w-5 h-5 text-gray-700" />
        </button>

        {showEventSwitcher && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-xl border border-gray-200 z-50">
            <div className="p-2">
              {mockEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    navigate(`/event/${event.id}/home`);
                    setShowEventSwitcher(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 ${
                    event.id === Number(eventId) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${event.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold">{event.shortName}</span>
                  </div>
                  <span className="font-medium text-sm">{event.name}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  navigate('/events');
                  setShowEventSwitcher(false);
                }}
                className="w-full text-left p-3 text-sm text-blue-600 font-medium hover:bg-gray-50 rounded-lg mt-1"
              >
                See all events →
              </button>
            </div>
          </div>
        )}

        {showPeriodSelector && (
          <div className="absolute top-full right-4 mt-1 bg-white shadow-lg rounded-xl border border-gray-200 z-50 min-w-[180px]">
            <div className="p-2">
              <button
                onClick={() => {
                  setEventPeriod('before');
                  setShowPeriodSelector(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors ${
                  eventPeriod === 'before' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                Pre-Event
              </button>
              <button
                onClick={() => {
                  setEventPeriod('during');
                  setShowPeriodSelector(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors ${
                  eventPeriod === 'during' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                Live Event
              </button>
              <button
                onClick={() => {
                  setEventPeriod('after');
                  setShowPeriodSelector(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors ${
                  eventPeriod === 'after' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                Post-Event
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Post-event feedback CTA — only while the user hasn't submitted yet.
            Once feedback is in sessionStorage the card disappears so the
            user isn't asked twice. */}
        {eventPeriod === 'after' && !hasSubmittedFeedback() && (
          <button
            onClick={() => navigate(`/event/${eventId}/feedback`)}
            className="w-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">⭐</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">How was Tech Summit 2026?</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Help the organizers make the next event even better — 30 seconds, 4 quick questions.
                </p>
                <span className="text-blue-600 font-medium text-sm">Leave feedback →</span>
              </div>
            </div>
          </button>
        )}

        {/* Quick Access — sits above other sections except in 'before' (see below) */}
        {eventPeriod !== 'before' && renderQuickAccess()}

        <section className="bg-white rounded-[20px] p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
          <h2 className="font-bold text-[18px] text-[#0F172A] mb-3">
            {eventPeriod === 'after' ? 'Your Tech Summit recap' : 'Networking Opportunities'}
          </h2>

          {/* Progress bar — segments = your goal, filled = your connections */}
          <div className="mb-4">
            <div className="flex gap-1.5 mb-2">
              {Array.from({ length: connectionGoal }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-2 rounded-full ${
                    i < filledGoalSegments ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>
            <p className="text-[#64748B] text-[12px]">
              {eventPeriod === 'after'
                ? `Made ${connectionsCount} ${connectionsCount === 1 ? 'connection' : 'connections'} at the event`
                : eventPeriod === 'before'
                  ? `Goal: ${connectionGoal} connections — match deck opens when the event starts`
                  : `${filledGoalSegments} of ${connectionGoal} connections · set your event goal in Profile`}
            </p>
          </div>

          {eventPeriod === 'after' ? (
            // Post-event: stats grid (connections / conversations / sessions)
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/event/${eventId}/participants`)}
                className="w-full bg-[#ECFDF5] rounded-xl py-2.5 px-3 flex items-center gap-3 hover:bg-[#D1FAE5] active:bg-[#A7F3D0] transition-colors"
              >
                <Trophy className="w-5 h-5 text-[#047857] flex-shrink-0" />
                <span className="font-bold text-[28px] text-[#047857] leading-none">
                  {postEventStats.connectionsMade}
                </span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[14px] text-[#0F172A]">Connections made</p>
                  <p className="text-[11px] text-[#64748B]">people you matched with</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate(`/event/${eventId}/chat`)}
                className="w-full bg-[#EFF6FF] rounded-xl py-2.5 px-3 flex items-center gap-3 hover:bg-[#DBEAFE] active:bg-[#BFDBFE] transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-[#1D4ED8] flex-shrink-0" />
                <span className="font-bold text-[28px] text-[#1D4ED8] leading-none">
                  {postEventStats.conversationsStarted}
                </span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[14px] text-[#0F172A]">Conversations started</p>
                  <p className="text-[11px] text-[#64748B]">chats you opened</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate(`/event/${eventId}/calendar`)}
                className="w-full bg-[#FEF3C7] rounded-xl py-2.5 px-3 flex items-center gap-3 hover:bg-[#FDE68A] active:bg-[#FCD34D] transition-colors"
              >
                <Sparkles className="w-5 h-5 text-[#B45309] flex-shrink-0" />
                <span className="font-bold text-[28px] text-[#B45309] leading-none">
                  {postEventStats.sessionsAttended}
                </span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[14px] text-[#0F172A]">Sessions attended</p>
                  <p className="text-[11px] text-[#64748B]">where you said Yes</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>
            </div>
          ) : (
            // Pre-event / Live: counters
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/event/${eventId}/participants`)}
                className="w-full bg-[#EFF6FF] rounded-xl py-2.5 px-3 flex items-center gap-3 hover:bg-[#DBEAFE] active:bg-[#BFDBFE] transition-colors"
              >
                <span className="font-bold text-[28px] text-[#1D4ED8] leading-none">{rankedCandidates.length}</span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[14px] text-[#0F172A]">Potential matches</p>
                  <p className="text-[11px] text-[#64748B]">based on your interests</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate(`/event/${eventId}/participants`)}
                className="w-full bg-[#FEF3C7] rounded-xl py-2.5 px-3 flex items-center gap-3 hover:bg-[#FDE68A] active:bg-[#FCD34D] transition-colors"
              >
                <span className="font-bold text-[28px] text-[#B45309] leading-none">5</span>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[14px] text-[#0F172A]">Waiting for review</p>
                  <p className="text-[11px] text-[#64748B]">tap to swipe through them</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>

              <button
                onClick={() => navigate(`/event/${eventId}/participants`)}
                className="w-full bg-[#ECFDF5] rounded-xl py-2.5 px-3 flex items-center gap-3 hover:bg-[#D1FAE5] active:bg-[#A7F3D0] transition-colors"
              >
                <span className="font-bold text-[28px] text-[#047857] leading-none">5</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[14px] text-[#0F172A]">New since last visit</p>
                    <span className="bg-[#10B981] text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                      NEW
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">added today</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="font-bold text-lg">Top Matches</h2>
            {moreMatchesCount > 0 && (
              <button
                onClick={() => navigate(`/event/${eventId}/participants`)}
                className="text-blue-600 text-sm font-medium"
              >
                See {moreMatchesCount} more →
              </button>
            )}
          </div>

          <div>
            {!gateOpen ? (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Complete your profile to unlock matches
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  You still need to fill in:
                </p>
                <ul className="space-y-1.5 mb-3">
                  {gateMissing.interests > 0 && (
                    <li className="flex items-center gap-2 text-xs text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-gray-400">✕</span>
                      </span>
                      {gateMissing.interests} more {gateMissing.interests === 1 ? 'interest' : 'interests'}
                    </li>
                  )}
                </ul>
                <button
                  onClick={() => navigate(`/event/${eventId}/profile`)}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm"
                >
                  Edit profile
                </button>
              </div>
            ) : topMatch ? (
              <SwipeableCard
                key={topMatch.id}
                onLike={handleTopMatchLike}
                onHide={handleTopMatchDismiss}
              >
                <MatchCard
                  userId={topMatch.id}
                  name={topMatch.name}
                  position={topMatch.position}
                  company={topMatch.company}
                  photoUrl={topMatch.image}
                  matchScore={topMatchScore}
                  location="At the event"
                  matchedInterests={topMatch.matchTags}
                  wantsToTalkAbout={topMatch.wantToTalkAbout}
                  conversationStarters={[
                    { text: `${topMatch.interests[0] ?? topMatch.matchTags[0] ?? 'topic'}?` },
                    {
                      text: `${topMatch.matchTags[0] ?? topMatch.interests[0] ?? 'best'} best practices`,
                      isAiGenerated: true,
                    },
                  ]}
                  alsoInterestedIn={topMatch.interests}
                  state="default"
                  onLike={handleTopMatchLike}
                  onDismiss={handleTopMatchDismiss}
                />
              </SwipeableCard>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-500 shadow-sm">
                You're all caught up — no new matches at the moment.
              </div>
            )}
          </div>
        </section>

        {/* Quick Access for Pre-Event sits below Top Matches per the SOW pre-flight order */}
        {eventPeriod === 'before' && renderQuickAccess()}

        <section className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-base mb-3">Recent Notifications</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-gray-800">Meeting starts in 15 min</p>
                <p className="text-gray-400 text-xs">15:32</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0"></div>
              <div>
                <p className="text-gray-800">You and Alex are a mutual match!</p>
                <p className="text-gray-400 text-xs">14:20</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}