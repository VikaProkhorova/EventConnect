import { ArrowLeft, ChevronRight, MapPin, Mail, Linkedin, Instagram, FileText, Mic, Video, Calendar as CalendarIcon, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useMemo, useState } from 'react';
import {
  agenda,
  agendaByDay,
  eventInfo,
  materials,
  organizerContacts,
  speakerIds,
  sponsors,
  type AgendaSession,
  type Material,
} from './mockEventInfo';
import { mockUsers } from './mockUsers';
import { useEventPeriod } from './eventPeriodContext';

const formatDateRange = (startIso: string, endIso: string): string => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long' });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${monthLong.format(start)} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${monthLong.format(start)} ${start.getDate()} – ${monthLong.format(end)} ${end.getDate()}, ${end.getFullYear()}`;
};

const formatDayTab = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleDateString('en-US', { weekday: 'long' })}`;
};

const materialIcon = (cat: Material['category']) => {
  switch (cat) {
    case 'presentation':
      return <FileText className="w-4 h-4 text-blue-600" />;
    case 'transcript':
      return <Mic className="w-4 h-4 text-purple-600" />;
    case 'record':
      return <Video className="w-4 h-4 text-rose-600" />;
  }
};

export function InfoScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { period } = useEventPeriod();
  const isPostEvent = period === 'after';

  const [materialTab, setMaterialTab] = useState<Material['category']>('presentation');
  const days = useMemo(() => Array.from(new Set(agenda.map((s) => s.day))).sort(), []);
  const [agendaDay, setAgendaDay] = useState<string>(() => days[0]);

  const dayBuckets = useMemo(() => agendaByDay(), []);
  const dayAgenda: AgendaSession[] = dayBuckets.get(agendaDay) ?? [];

  // Transcripts and Records show their files only in post-event mode (per SOW lifecycle)
  const isCategoryAvailable = (cat: Material['category']) =>
    cat === 'presentation' ? true : isPostEvent;
  const filteredMaterials = isCategoryAvailable(materialTab)
    ? materials.filter((m) => m.category === materialTab)
    : [];

  const goToSpeakers = () => {
    try {
      sessionStorage.setItem('participantsFilter', JSON.stringify({ speakerOnly: true }));
    } catch {
      /* ignore */
    }
    navigate(`/event/${eventId}/participants`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-4 border-b flex items-center gap-3">
        <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-xl">Event Info</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Event meta */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4">{eventInfo.name}</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Date</p>
              <p className="font-medium">{formatDateRange(eventInfo.startDate, eventInfo.endDate)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Location</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-500" />
                {eventInfo.city}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 ml-5">{eventInfo.address}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Timezone</p>
              <p className="font-medium">{eventInfo.timezone}</p>
            </div>
          </div>
        </section>

        {/* Speakers */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base">Speakers</h3>
            <button
              onClick={goToSpeakers}
              className="text-sm text-blue-600 font-medium flex items-center gap-0.5"
            >
              See more <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {speakerIds.map((id) => {
              const u = mockUsers[id];
              if (!u) return null;
              return (
                <button
                  key={id}
                  onClick={() => navigate(`/event/${eventId}/user/${id}`)}
                  className="flex-shrink-0 w-24 text-center"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-2 mx-auto ring-2 ring-amber-400">
                    <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{u.company}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* All Materials */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-base mb-3">All Materials</h3>
          <div className="flex bg-gray-100 rounded-lg p-1 mb-3">
            {(['presentation', 'transcript', 'record'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setMaterialTab(c)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  materialTab === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {c}s
              </button>
            ))}
          </div>
          {!isCategoryAvailable(materialTab) ? (
            <div className="bg-gray-50 rounded-lg p-5 text-center">
              {materialTab === 'transcript' ? (
                <Mic className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              ) : (
                <Video className="w-5 h-5 text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-sm text-gray-700 font-medium mb-1">
                Nothing here yet
              </p>
              <p className="text-xs text-gray-500">
                {materialTab === 'transcript' ? 'Transcripts' : 'Recordings'} appear after each session ends.
              </p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No {materialTab}s uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {filteredMaterials.map((m) => {
                const speaker = m.speakerId ? mockUsers[m.speakerId] : null;
                return (
                  <li key={m.id}>
                    <a
                      href={m.url}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {materialIcon(m.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 truncate">{m.title}</p>
                        {speaker && (
                          <p className="text-xs text-gray-500 truncate">{speaker.name}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Agenda preview */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-base">Agenda</h3>
            <button
              onClick={() => navigate(`/event/${eventId}/calendar`)}
              className="text-sm text-blue-600 font-medium flex items-center gap-0.5"
            >
              See in Calendar <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setAgendaDay(day)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  agendaDay === day ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {formatDayTab(day)}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {dayAgenda.map((s) => {
              const speaker = s.speakerId ? mockUsers[s.speakerId] : null;
              return (
                <li
                  key={s.id}
                  className="border-l-2 border-blue-500 pl-3 py-1"
                >
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
                    {s.startTime} – {s.endTime} · {s.stage}
                  </p>
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  {speaker && (
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                      <Mic className="w-3 h-3" />
                      {speaker.name}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Floor map */}
        {eventInfo.floorMapUrl && (
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              Floor Map
            </h3>
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img
                src={eventInfo.floorMapUrl}
                alt="Venue floor map"
                className="w-full h-auto"
              />
            </div>
          </section>
        )}

        {/* Sponsors */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-base mb-3">Sponsors</h3>
          <div className="grid grid-cols-3 gap-3">
            {sponsors.map((sp) => (
              <a
                key={sp.id}
                href={sp.url}
                target="_blank"
                rel="noreferrer"
                className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center p-3 hover:bg-gray-100 transition-colors"
              >
                <img
                  src={sp.logoUrl}
                  alt={sp.name}
                  className="max-w-full max-h-full object-contain"
                />
              </a>
            ))}
          </div>
        </section>

        {/* Organizer contacts */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-base mb-3">Organizer</h3>
          <div className="space-y-2">
            <a
              href={organizerContacts.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-9 h-9 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Instagram className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Instagram</p>
                <p className="text-sm text-gray-900 font-medium">{organizerContacts.instagram}</p>
              </div>
            </a>
            <a
              href={organizerContacts.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Linkedin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">LinkedIn</p>
                <p className="text-sm text-gray-900 font-medium">{organizerContacts.linkedin}</p>
              </div>
            </a>
            <a
              href={`mailto:${organizerContacts.email}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900 font-medium">{organizerContacts.email}</p>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
