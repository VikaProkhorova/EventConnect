import { ArrowLeft, FileText, Users, UserCircle, Images, Calendar, Radio, ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useState } from 'react';
import { useAsync } from '@/api/provider';
import type { EventId } from '@/domain/types';

export function HomeScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;
  const [showEventSwitcher, setShowEventSwitcher] = useState(false);

  const { data: events } = useAsync((api) => api.events.listMine(), []);
  const { data: dashboard, loading, error } = useAsync(
    (api) => api.home.getDashboard(eventId),
    [eventId],
  );

  const currentEvent = events?.find((e) => e.id === eventId);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="bg-white px-4 py-4 border-b flex items-center gap-3 relative">
        <button onClick={() => navigate('/events')} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <button
          onClick={() => setShowEventSwitcher(!showEventSwitcher)}
          className="flex items-center gap-2 flex-1"
        >
          {currentEvent && (
            <div
              className={`w-8 h-8 rounded-full ${currentEvent.brandColor} flex items-center justify-center`}
            >
              <span className="text-white text-sm font-bold">{currentEvent.shortName}</span>
            </div>
          )}
          <span className="font-semibold">{currentEvent?.name ?? 'Event'}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {showEventSwitcher && events && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-xl border border-gray-200 z-50">
            <div className="p-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    navigate(`/event/${event.id}/home`);
                    setShowEventSwitcher(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 ${
                    event.id === eventId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full ${event.brandColor} flex items-center justify-center flex-shrink-0`}
                  >
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
      </div>

      {loading && <div className="p-10 text-center text-gray-400 text-sm">Loading dashboard…</div>}
      {error && <div className="p-10 text-center text-red-500 text-sm">{error.message}</div>}

      {dashboard && (
        <div className="p-4 space-y-6">
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-lg mb-3">Networking Opportunities</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">{dashboard.interestOverlapCount}</span>
                </div>
                <span className="text-sm">people share your interests</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">{dashboard.industryOverlapCount}</span>
                </div>
                <span className="text-sm">people from {currentEvent ? 'your industry' : 'Technology'}</span>
              </div>
              <div className="mt-3 text-sm text-gray-500 italic">Try to meet at least 5 people</div>
            </div>
          </section>

          {dashboard.topMatch ? (
            <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-md">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Top Match</h3>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-full bg-white overflow-hidden flex-shrink-0">
                  {dashboard.topMatch.user.photoUrl && (
                    <img
                      src={dashboard.topMatch.user.photoUrl}
                      alt={dashboard.topMatch.user.fullName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-lg">{dashboard.topMatch.user.fullName}</h4>
                  <p className="text-blue-100 text-sm">
                    {dashboard.topMatch.user.position} | {dashboard.topMatch.user.company}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dashboard.topMatch.matchScore.matchTags.map((tag) => (
                      <span key={tag} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {dashboard.topMatch.user.wantToTalkAbout && (
                <div className="mt-4 bg-white/10 rounded-lg p-3">
                  <p className="text-white/90 text-sm italic">
                    "Want to talk about: {dashboard.topMatch.user.wantToTalkAbout}"
                  </p>
                </div>
              )}
              <div className="space-y-2 mt-4">
                <button
                  onClick={() => navigate(`/event/${eventId}/chat`)}
                  className="w-full bg-white text-blue-600 py-2.5 rounded-lg font-semibold text-sm"
                >
                  Write now!
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      dashboard.topMatch &&
                      navigate(`/event/${eventId}/user/${dashboard.topMatch.user.id}`)
                    }
                    className="flex-1 bg-white/20 text-white py-2.5 rounded-lg font-semibold text-sm"
                  >
                    See Profile
                  </button>
                  <button className="flex-1 bg-white/20 text-white py-2.5 rounded-lg font-semibold text-sm">
                    ❤️ Like
                  </button>
                  <button className="flex-1 bg-white/20 text-white py-2.5 rounded-lg font-semibold text-sm">
                    ✕ Hide
                  </button>
                </div>
              </div>
              {dashboard.unreviewedMatchCount > 0 && (
                <button
                  onClick={() => navigate(`/event/${eventId}/participants`)}
                  className="w-full mt-2 text-white/90 text-sm py-2"
                >
                  See {dashboard.unreviewedMatchCount} more matches →
                </button>
              )}
            </section>
          ) : null}

          <section>
            <h2 className="font-bold text-lg mb-3 px-1">Quick Access</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/event/${eventId}/info`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
              >
                <FileText className="w-6 h-6 text-blue-600 mb-2" />
                <h3 className="font-semibold text-sm mb-1">Info</h3>
                <p className="text-xs text-gray-500">Event details</p>
              </button>
              <button
                onClick={() => navigate(`/event/${eventId}/participants`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
              >
                <Users className="w-6 h-6 text-green-600 mb-2" />
                <h3 className="font-semibold text-sm mb-1">Participants</h3>
                <p className="text-xs text-gray-500">{dashboard.participantCount} people</p>
                {dashboard.newParticipantCount > 0 && (
                  <span className="inline-block mt-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">
                    +{dashboard.newParticipantCount} new
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate(`/event/${eventId}/profile`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
              >
                <UserCircle className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm mb-1">Your Profile</h3>
                <p className="text-xs text-gray-500">{dashboard.profileCompleteness.percent}% complete</p>
              </button>
              <button
                onClick={() => navigate(`/event/${eventId}/gallery`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:scale-98 transition-transform"
              >
                <Images className="w-6 h-6 text-orange-600 mb-2" />
                <h3 className="font-semibold text-sm mb-1">Gallery</h3>
                <p className="text-xs text-gray-500">{dashboard.galleryPhotoCount} photos</p>
                {dashboard.galleryNewCount > 0 && (
                  <span className="inline-block mt-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                    +{dashboard.galleryNewCount} new
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate(`/event/${eventId}/calendar`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 text-left hover:bg-gray-50 active:scale-98 transition-transform"
              >
                <Calendar className="w-6 h-6 text-indigo-600 mb-2" />
                <h3 className="font-semibold text-sm mb-1">Calendar</h3>
                <p className="text-xs text-gray-500">
                  {dashboard.calendarSummary.meetingsToday} meetings ·{' '}
                  {dashboard.calendarSummary.freeMinutesToday} min free ·{' '}
                  {dashboard.calendarSummary.sessionsWithoutNotesToday} sessions without notes
                </p>
              </button>
              {dashboard.lifecyclePhase === 'during-event' &&
                dashboard.event.features['network-real-time'] && (
                  <button
                    onClick={() => navigate(`/event/${eventId}/network`)}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-4 shadow-sm col-span-2 text-white text-left hover:opacity-90 active:scale-98 transition-all"
                  >
                    <Radio className="w-6 h-6 mb-2" />
                    <h3 className="font-semibold text-sm mb-1">Network in Real Time</h3>
                    <p className="text-xs opacity-90">See who's nearby and join conversations</p>
                  </button>
                )}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-base mb-3">Recent Notifications</h2>
            <div className="space-y-3">
              {dashboard.recentNotifications.length === 0 && (
                <p className="text-gray-400 text-sm">No recent notifications</p>
              )}
              {dashboard.recentNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 text-sm">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.kind === 'mutual-match' ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                  />
                  <div>
                    <p className="text-gray-800">{n.title}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
