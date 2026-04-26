import { useNavigate } from 'react-router';
import { Search, User } from 'lucide-react';
import { useState } from 'react';
import { useAsync } from '@/api/provider';

const formatRange = (startIso: string, endIso: string): string => {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt.format(new Date(startIso))} - ${fmt.format(new Date(endIso))}`;
};

export function EventsScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, loading, error } = useAsync(
    (api) => api.events.listMine({ search: search || undefined }),
    [search],
  );

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <h1 className="font-bold text-xl">Events</h1>
        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-700" />
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

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}
        {error && (
          <div className="py-10 text-center text-red-500 text-sm">Failed to load: {error.message}</div>
        )}
        <div className="space-y-4">
          {data?.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/event/${event.id}/home`)}
              className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 cursor-pointer active:scale-98 transition-transform"
            >
              <div className="relative h-40">
                <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-bold text-white text-lg">{event.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  <span>
                    {event.city} · {event.address}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatRange(event.startDate, event.endDate)} • {event.timezone}
                </div>
              </div>
            </div>
          ))}
          {!loading && data?.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">No events match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
