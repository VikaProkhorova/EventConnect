import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, User } from 'lucide-react';
import { useEventPeriod } from './eventPeriodContext';
import { getMasterProfile } from './myProfileStore';

type MockEvent = {
  id: number;
  name: string;
  image: string;
  participants: number;
  timezone: string;
  startDate: string;
  endDate: string;
};

const mockEvents: MockEvent[] = [
  {
    id: 1,
    name: 'Tech Summit 2026',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    participants: 123,
    timezone: 'UTC+2',
    startDate: 'Apr 28, 2026',
    endDate: 'Apr 29, 2026',
  },
  {
    id: 2,
    name: 'Product Design Conference',
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
    participants: 87,
    timezone: 'UTC+2',
    startDate: 'May 15, 2026',
    endDate: 'May 16, 2026',
  },
];

/**
 * For the prototype, "archived" depends on the global event-period toggle:
 *  - 'after'  → Tech Summit (id=1) is archived; PDC (id=2, future) stays Active
 *  - other    → both events are Active
 */
const isArchived = (event: MockEvent, period: 'before' | 'during' | 'after') =>
  period === 'after' && event.id === 1;

export function EventsScreen() {
  const navigate = useNavigate();
  const { period } = useEventPeriod();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'archive'>('active');

  const masterProfile = getMasterProfile();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockEvents.filter((e) => {
      const inTab = tab === 'archive' ? isArchived(e, period) : !isArchived(e, period);
      if (!inTab) return false;
      if (!q) return true;
      return e.name.toLowerCase().includes(q);
    });
  }, [search, tab, period]);

  const counts = useMemo(() => {
    return {
      active: mockEvents.filter((e) => !isArchived(e, period)).length,
      archive: mockEvents.filter((e) => isArchived(e, period)).length,
    };
  }, [period]);

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h1 className="font-bold text-xl">Events</h1>
        <button
          onClick={() => navigate('/me')}
          className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center hover:ring-2 hover:ring-blue-500"
          aria-label="Open my master profile"
          title={masterProfile.name}
        >
          {masterProfile.photoUrl ? (
            <img
              src={masterProfile.photoUrl}
              alt={masterProfile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="px-4 pb-3 flex gap-2">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
            tab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Active{counts.active > 0 ? ` · ${counts.active}` : ''}
        </button>
        <button
          onClick={() => setTab('archive')}
          className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
            tab === 'archive' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Archive{counts.archive > 0 ? ` · ${counts.archive}` : ''}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            {search.trim() ? (
              <>No events match "{search}"</>
            ) : tab === 'archive' ? (
              <>No archived events yet — past events will appear here.</>
            ) : (
              <>No active events.</>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((event) => {
              const archived = tab === 'archive';
              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/event/${event.id}/home`)}
                  className={`bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 cursor-pointer active:scale-98 transition-transform ${
                    archived ? 'opacity-80' : ''
                  }`}
                >
                  <div className="relative h-40">
                    <img
                      src={event.image}
                      alt={event.name}
                      className={`w-full h-full object-cover ${archived ? 'grayscale' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {archived && (
                      <span className="absolute top-3 left-3 bg-gray-800 text-white text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
                        Archived
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-bold text-white text-lg">{event.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      <span>{event.participants} participants</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {event.startDate} - {event.endDate} • {event.timezone}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
