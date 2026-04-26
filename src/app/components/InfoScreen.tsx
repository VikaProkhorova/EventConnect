import { ArrowLeft, MapPin, Mail, Linkedin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useAsync } from '@/api/provider';
import type { EventId } from '@/domain/types';

const fmtDateRange = (startIso: string, endIso: string): string => {
  const fmt = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  return `${fmt.format(new Date(startIso))} – ${fmt.format(new Date(endIso))}`;
};

export function InfoScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;

  const eventQuery = useAsync((api) => api.events.get(eventId), [eventId]);
  const speakers = useAsync((api) => api.info.getSpeakers(eventId), [eventId]);
  const sponsors = useAsync((api) => api.info.getSponsors(eventId), [eventId]);
  const agenda = useAsync((api) => api.info.getAgenda(eventId), [eventId]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-4 border-b flex items-center gap-3">
        <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-xl">Event Info</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {eventQuery.loading && <div className="text-center text-gray-400 text-sm py-6">Loading…</div>}
        {eventQuery.data && (
          <>
            <section className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="font-bold text-lg mb-4">{eventQuery.data.name}</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Date</p>
                  <p className="font-medium">
                    {fmtDateRange(eventQuery.data.startDate, eventQuery.data.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {eventQuery.data.city}, {eventQuery.data.address}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Timezone</p>
                  <p className="font-medium">{eventQuery.data.timezone}</p>
                </div>
              </div>
            </section>

            {speakers.data && speakers.data.length > 0 && (
              <section className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold mb-3">Speakers</h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {speakers.data.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => navigate(`/event/${eventId}/user/${u.id}`)}
                      className="flex-shrink-0 w-24 text-center"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 mx-auto mb-2">
                        {u.photoUrl && (
                          <img src={u.photoUrl} alt={u.fullName} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{u.fullName}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {agenda.data && Object.keys(agenda.data).length > 0 && (
              <section className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Agenda</h3>
                  <button
                    onClick={() => navigate(`/event/${eventId}/calendar`)}
                    className="text-sm text-blue-600 font-medium"
                  >
                    See in Calendar →
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(agenda.data).map(([day, sessions]) => (
                    <div key={day}>
                      <p className="text-xs uppercase font-semibold text-gray-500 mb-1">
                        {new Date(day).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric' })}
                      </p>
                      <div className="space-y-1">
                        {sessions.slice(0, 3).map((s) => (
                          <div key={s.id} className="text-xs text-gray-700">
                            <span className="font-medium">
                              {new Date(s.startAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>{' '}
                            · {s.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sponsors.data &&
              sponsors.data.length > 0 &&
              eventQuery.data.features.sponsors && (
                <section className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold mb-3">Sponsors</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {sponsors.data.map((sp) => (
                      <a
                        key={sp.id}
                        href={sp.link ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center p-3"
                      >
                        <img src={sp.logoUrl} alt={sp.name} className="max-w-full max-h-full" />
                      </a>
                    ))}
                  </div>
                </section>
              )}

            {(eventQuery.data.organizerContacts.email ||
              eventQuery.data.organizerContacts.linkedin) && (
              <section className="bg-white rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold mb-3">Organizer</h3>
                <div className="space-y-2 text-sm">
                  {eventQuery.data.organizerContacts.email && (
                    <a
                      href={`mailto:${eventQuery.data.organizerContacts.email}`}
                      className="flex items-center gap-2 text-blue-600"
                    >
                      <Mail className="w-4 h-4" />
                      {eventQuery.data.organizerContacts.email}
                    </a>
                  )}
                  {eventQuery.data.organizerContacts.linkedin && (
                    <a
                      href={`https://linkedin.com/${eventQuery.data.organizerContacts.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-blue-600"
                    >
                      <Linkedin className="w-4 h-4" />
                      {eventQuery.data.organizerContacts.linkedin}
                    </a>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
