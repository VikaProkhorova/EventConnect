import { ArrowLeft, Plus, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { useApi, useAsync, useMutation } from '@/api/provider';
import type { EventId, ProximityMark, ProximityPosition } from '@/domain/types';

const distanceMeters = (a: ProximityPosition, b: ProximityPosition): number => {
  // Treat the venue as ~50m square for the demo. Convert normalized coords → meters.
  const VENUE_SIZE_M = 50;
  const dx = (a.point.x - b.point.x) * VENUE_SIZE_M;
  const dy = (a.point.y - b.point.y) * VENUE_SIZE_M;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
};

export function NetworkScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;
  const api = useApi();

  const me = useAsync((api) => api.profile.me(), []);
  const snap = useAsync((api) => api.proximity.getSnapshot(eventId), [eventId]);

  const [showAddMark, setShowAddMark] = useState(false);
  const [topic, setTopic] = useState('');

  const createMarkM = useMutation((api, t: string) => {
    const point = me.data
      ? snap.data?.positions.find((p) => p.userId === me.data!.id)?.point ?? { x: 0.5, y: 0.5 }
      : { x: 0.5, y: 0.5 };
    return api.proximity.createMark(eventId, t, point);
  });

  // Subscribe to live updates
  useEffect(() => {
    const unsub = api.proximity.subscribe(eventId, () => {
      snap.reload();
    });
    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, eventId]);

  const myPos =
    me.data && snap.data?.positions.find((p) => p.userId === me.data!.id);
  const otherPositions = me.data
    ? snap.data?.positions.filter((p) => p.userId !== me.data!.id) ?? []
    : (snap.data?.positions ?? []);
  const marks = (snap.data?.marks ?? []).filter((m) => !m.dissolvedAt);

  const handleCreate = async () => {
    if (!topic.trim()) return;
    await createMarkM.run(topic.trim());
    setTopic('');
    setShowAddMark(false);
    snap.reload();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-4 border-b flex items-center gap-3">
        <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-xl">Network in Real Time</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 border-b">
          {/* The user always at the centre conceptually; absolute positioning of others */}
          <div className="absolute inset-0">
            {/* Me */}
            {myPos && (
              <div
                className="absolute"
                style={{
                  left: `${myPos.point.x * 100}%`,
                  top: `${myPos.point.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-base">You</span>
                </div>
              </div>
            )}

            {/* Other people */}
            {otherPositions.map((p) => (
              <div
                key={p.userId}
                className="absolute"
                style={{
                  left: `${p.point.x * 100}%`,
                  top: `${p.point.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-blue-400">
                  <span className="text-xs font-semibold text-blue-700">•</span>
                </div>
                {myPos && (
                  <p className="text-[10px] text-gray-600 mt-1 text-center">
                    {distanceMeters(p, myPos)}m
                  </p>
                )}
              </div>
            ))}

            {/* Conversation marks */}
            {marks.map((m) => (
              <div
                key={m.id}
                className="absolute"
                style={{
                  left: `${m.point.x * 100}%`,
                  top: `${m.point.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-purple-500">
                  <span className="text-xs font-semibold">{m.participantIds.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => setShowAddMark(true)}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-5 h-5" />
            Add a mark
          </button>

          <h2 className="font-bold text-base mb-3">Most Relevant Conversations</h2>
          <div className="space-y-3">
            {marks.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-6">
                No active conversations on the map yet.
              </div>
            )}
            {marks.map((m) => (
              <MarkCard key={m.id} mark={m} myPosition={myPos ?? null} />
            ))}
          </div>
        </div>
      </div>

      {showAddMark && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowAddMark(false)}
        >
          <div className="bg-white rounded-t-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add a mark</h3>
              <button onClick={() => setShowAddMark(false)} className="p-1">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              What do you want to discuss? Others nearby will see this and can join.
            </p>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI design workflows"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={handleCreate}
              disabled={createMarkM.loading || !topic.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {createMarkM.loading ? 'Creating…' : 'Create mark'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MarkCard({
  mark,
  myPosition,
}: {
  mark: ProximityMark;
  myPosition: ProximityPosition | null;
}) {
  const distance =
    myPosition &&
    distanceMeters(myPosition, {
      userId: myPosition.userId,
      eventId: myPosition.eventId,
      point: mark.point,
      updatedAt: mark.createdAt,
    });
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{mark.topic}</h3>
          {distance !== null && (
            <p className="text-xs text-gray-500">{distance}m away</p>
          )}
        </div>
        <div className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
          {mark.participantIds.length} {mark.participantIds.length === 1 ? 'person' : 'people'}
        </div>
      </div>
    </div>
  );
}
