import { ArrowLeft, Plus, Ghost, Sparkles, Radio, X, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useRef, useState } from 'react';
import { useEventPeriod } from './eventPeriodContext';

type ViewState = 'default' | 'ghost';

type Conversation = {
  id: string;
  title: string;
  location: string;
  distance: string;
  pillType: 'count' | 'match';
  pillText: string;
  dotColor: string;
  avatar?: string;
};

export function NetworkScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { period } = useEventPeriod();
  const [view, setView] = useState<ViewState>('default');
  const [showSheet, setShowSheet] = useState(false);
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('3');
  const [openToJoin, setOpenToJoin] = useState(true);

  const isGhost = view === 'ghost';

  const [userMarks, setUserMarks] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  /* ───────── Pinch-to-zoom on the map area ───────── */
  const MIN_SCALE = 0.6;
  const MAX_SCALE = 3;
  const [mapScale, setMapScale] = useState(1);
  const pinchRef = useRef<{ initialDistance: number; initialScale: number } | null>(null);

  const pinchDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };
  const onMapTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = {
        initialDistance: pinchDistance(e.touches),
        initialScale: mapScale,
      };
    }
  };
  const onMapTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const ratio = pinchDistance(e.touches) / pinchRef.current.initialDistance;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.initialScale * ratio));
      setMapScale(next);
    }
  };
  const onMapTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
  };
  const onMapWheel = (e: React.WheelEvent) => {
    // Trackpad pinch arrives as wheel + ctrlKey on macOS — handle only that
    // case so a normal vertical scroll over the map still pages the screen.
    if (e.ctrlKey) {
      const delta = -e.deltaY * 0.01;
      setMapScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s + delta)));
    }
  };
  const resetZoom = () => setMapScale(1);

  const conversationParticipants: Record<
    string,
    { id: string; name: string; role: string; avatar: string; isMatch?: boolean }[]
  > = {
    '1': [
      { id: 'anna-k', name: 'Anna K.', role: 'Marketing Lead · Traffie', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
      { id: 'david-l', name: 'David L.', role: 'Growth · Indie', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
      { id: 'yuki-m', name: 'Yuki M.', role: 'AI PM · Notch', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100' },
    ],
    '2': [
      { id: 'sara-p', name: 'Sara P.', role: 'Design Lead · Pixel', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', isMatch: true },
      { id: 'marco-t', name: 'Marco T.', role: 'Designer · Pixel', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', isMatch: true },
    ],
    '3': [
      { id: 'olha-s', name: 'Olha S.', role: 'Head of Product · Locales', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' },
      { id: 'ben-k', name: 'Ben K.', role: 'PM · Locales', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100' },
      { id: 'riya-n', name: 'Riya N.', role: 'PM · Indie', avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100' },
      { id: 'tom-w', name: 'Tom W.', role: 'Founder', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100' },
    ],
  };


  const closeSheet = () => {
    setShowSheet(false);
    setTopic('');
    setLocation('');
    setDistance('3');
    setOpenToJoin(true);
  };

  const submitMark = () => {
    if (!topic.trim()) return;
    const newMark: Conversation = {
      id: `mark-${Date.now()}`,
      title: topic.trim(),
      location: location.trim() || 'Your spot',
      distance: `${distance} meters`,
      pillType: 'count',
      pillText: openToJoin ? '1 person · open' : '1 person',
      dotColor: 'bg-amber-500',
    };
    setUserMarks((prev) => [newMark, ...prev]);
    closeSheet();
  };

  const baseConversations: Conversation[] = [
    {
      id: '1',
      title: 'AI Marketing Tools',
      location: 'Traffie corner',
      distance: '15 meters',
      pillType: 'count' as const,
      pillText: '3 people',
      dotColor: 'bg-purple-500',
    },
    {
      id: '2',
      title: 'Design Systems',
      location: 'Pixel',
      distance: '20 meters',
      pillType: 'match' as const,
      pillText: 'Sara + 1',
      dotColor: 'bg-blue-500',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    },
    {
      id: '3',
      title: 'Product Strategy',
      location: 'Locales',
      distance: '5 meters',
      pillType: 'count' as const,
      pillText: '4 people',
      dotColor: 'bg-pink-500',
    },
  ];

  const conversations = [...userMarks, ...baseConversations];

  const activeConv = activeConvId ? conversations.find((c) => c.id === activeConvId) : null;
  const activeParticipants = activeConvId
    ? (conversationParticipants[activeConvId] ?? [])
    : [];

  // SOW §4.10/§4.18 — Network in Real Life is only active during the event.
  if (period !== 'during') {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white px-4 h-14 flex items-center gap-3 border-b">
          <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-bold text-[18px] text-gray-900">Network in Real Life</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-xs">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="font-bold text-base text-gray-900 mb-2">
              Network in Real Life is offline
            </h2>
            <p className="text-sm text-gray-500">
              {period === 'before'
                ? 'This feature activates when the event starts. Come back during Tech Summit 2026.'
                : 'The event has ended. Live proximity networking was active during the event only.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 h-14 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="font-bold text-[18px] text-gray-900">Network in Real Life</h1>
        </div>
        <button
          onClick={() => setView(isGhost ? 'default' : 'ghost')}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isGhost ? 'bg-purple-600' : 'bg-gray-100'
          }`}
        >
          <Ghost className={`w-4 h-4 ${isGhost ? 'text-white' : 'text-gray-600'}`} />
        </button>
      </div>

      {/* Status Strip */}
      <div className={`h-8 flex items-center px-4 ${isGhost ? 'bg-gray-100' : 'bg-blue-50'}`}>
        {isGhost ? (
          <span className="text-xs text-gray-600">👻 Ghost mode · seeing 8 marks</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-blue-700">Visible · Tech Summit venue · Hall A</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Map Area — pinch to zoom (mobile) / Ctrl+wheel to zoom (desktop) */}
        <div className="px-4 pt-4">
          <div
            className="relative rounded-2xl overflow-hidden select-none"
            style={{
              height: '340px',
              background: 'linear-gradient(135deg, #F5F3FF 0%, #ECFDF5 100%)',
              touchAction: 'none',
            }}
            onTouchStart={onMapTouchStart}
            onTouchMove={onMapTouchMove}
            onTouchEnd={onMapTouchEnd}
            onTouchCancel={onMapTouchEnd}
            onWheel={onMapWheel}
          >
            {/* Zoom controls + scale indicator */}
            <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
              <button
                onClick={() => setMapScale((s) => Math.max(MIN_SCALE, s - 0.25))}
                className="w-7 h-7 rounded-full bg-white/90 shadow text-gray-700 font-bold text-sm hover:bg-white"
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                onClick={() => setMapScale((s) => Math.min(MAX_SCALE, s + 0.25))}
                className="w-7 h-7 rounded-full bg-white/90 shadow text-gray-700 font-bold text-sm hover:bg-white"
                aria-label="Zoom in"
              >
                +
              </button>
              {mapScale !== 1 && (
                <button
                  onClick={resetZoom}
                  className="px-2 h-7 rounded-full bg-white/90 shadow text-gray-700 text-[11px] font-medium hover:bg-white"
                >
                  {mapScale.toFixed(1)}× · reset
                </button>
              )}
            </div>

            {/* Scaling layer — every bubble lives here so pinch zooms them together */}
            <div
              className="absolute inset-0 origin-center"
              style={{
                transform: `scale(${mapScale})`,
                transition: pinchRef.current ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              {/* You — Google Maps-style location dot:
                    • outer ring = surrounding accuracy area
                    • directional cone = field of view (pointing up)
                    • blue dot with white ring = user position */}
              <div
                className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
                style={{ bottom: '70px' }}
              >
                <svg
                  width="92"
                  height="92"
                  viewBox="0 0 92 92"
                  className={isGhost ? 'opacity-40' : ''}
                  aria-label="Your location and direction"
                >
                  <defs>
                    <radialGradient id="you-cone" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.7" />
                      <stop offset="55%" stopColor="#3B82F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Surrounding-area circle */}
                  <circle
                    cx="46"
                    cy="46"
                    r="44"
                    fill="rgba(59,130,246,0.08)"
                    stroke="rgba(59,130,246,0.22)"
                    strokeWidth="0.75"
                  />

                  {/* Direction wedge — ~60° pointing up */}
                  <path
                    d="M 46 46 L 24 8 A 44 44 0 0 1 68 8 Z"
                    fill="url(#you-cone)"
                  />

                  {/* White ring around the dot */}
                  <circle cx="46" cy="46" r="10" fill="white" />
                  {/* Inner blue dot */}
                  <circle
                    cx="46"
                    cy="46"
                    r="6.5"
                    fill={isGhost ? '#94A3B8' : '#2563EB'}
                  />
                </svg>
                <span className="-mt-1 px-1.5 py-0.5 rounded-full bg-white/90 text-[10px] font-semibold text-gray-700 shadow-sm">
                  {isGhost ? '👻 You' : 'You'}
                </span>
              </div>

              {/* Bubble A — AI purple */}
              <div className="absolute top-6 left-[28%] -translate-x-1/2 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white border-4 border-purple-500 flex items-center justify-center shadow">
                  <span className="font-bold text-[22px] text-gray-900">3</span>
                </div>
                <span className="text-[11px] text-gray-600 mt-1">15m</span>
              </div>

              {/* Bubble B — Product MATCH */}
              <div className="absolute top-12 right-6 flex flex-col items-center">
                <div className="relative flex flex-col items-center">
                  <div className="absolute -top-6 px-2 py-0.5 rounded-full bg-green-600 z-10 whitespace-nowrap">
                    <span className="text-[10px] text-white flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> 2 of your match
                    </span>
                  </div>
                  <div className="absolute w-[68px] h-[68px] rounded-full bg-blue-300 opacity-50 animate-ping" />
                  <div className="relative w-14 h-14 rounded-full border-4 border-blue-500 bg-white flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
                      alt="match"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                  </div>
                </div>
                <span className="text-[11px] text-gray-600 mt-1">20m</span>
              </div>

              {/* Bubble C — Design pink */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-white border-4 border-pink-500 flex items-center justify-center shadow">
                  <span className="font-bold text-[22px] text-gray-900">4</span>
                </div>
                <span className="text-[11px] text-gray-600 mt-1">5m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Add a mark CTA */}
        <div className="px-4 pt-4">
          <button
            onClick={() => setShowSheet(true)}
            className="w-full h-14 rounded-2xl bg-blue-600 flex items-center justify-center gap-2 shadow-md active:opacity-90"
          >
            <Plus className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-base">Add a mark</span>
          </button>
        </div>

        {/* List Section */}
        <div className="px-4 pt-4 pb-6">
          <h2 className="font-bold text-[17px] text-gray-900 mb-3">Most Relevant Conversations</h2>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className="w-full text-left bg-white rounded-xl p-3.5 shadow-sm flex items-center justify-between transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {conv.avatar ? (
                    <img src={conv.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${conv.dotColor} flex-shrink-0`} />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-[15px] text-gray-900 truncate">{conv.title}</h3>
                    <p className="text-[13px] text-gray-500 truncate">
                      {conv.location} · {conv.distance}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                    conv.pillType === 'match'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {conv.pillType === 'match' && <Sparkles className="w-3 h-3" />}
                  {conv.pillText}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Circle Detail Sheet */}
      {activeConv && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setActiveConvId(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-3xl p-5 pb-6 shadow-2xl max-h-[80%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />

            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs uppercase tracking-wider font-semibold text-green-700">You're here</span>
            </div>
            <h3 className="font-bold text-[20px] text-gray-900 mb-1">{activeConv.title}</h3>
            <p className="text-[13px] text-gray-500 mb-4">
              {activeConv.location} · {activeConv.distance}
            </p>

            <div className="bg-blue-50 rounded-xl p-3 mb-4 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-[13px] text-blue-900">
                You joined the circle. Say hi or just listen.
              </span>
            </div>

            <h4 className="font-bold text-[15px] text-gray-900 mb-2">
              Participants {activeParticipants.length > 0 && `(${activeParticipants.length + 1})`}
            </h4>
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  You
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">You</div>
                  <div className="text-xs text-gray-500">just arrived</div>
                </div>
              </div>
              {activeParticipants.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/event/${eventId}/user/${p.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/event/${eventId}/user/${p.id}`);
                    }
                  }}
                  className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
                >
                  <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      {p.name}
                      {p.isMatch && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> match
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{p.role}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/event/${eventId}/chat/${p.id}`);
                    }}
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100"
                  >
                    Say hi
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveConvId(null)}
              className="w-full h-12 rounded-xl border border-gray-300 text-gray-700 font-bold"
            >
              Leave circle
            </button>
          </div>
        </div>
      )}

      {/* Add a Mark Bottom Sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={closeSheet}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white rounded-t-3xl p-5 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[18px] text-gray-900">Add a mark</h3>
              <button onClick={closeSheet} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full -mt-2 mb-4 absolute top-2 left-1/2 -translate-x-1/2" />

            <label className="block text-xs font-semibold text-gray-600 mb-1">Topic</label>
            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to talk about?"
              className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-3 outline-none focus:border-blue-500 focus:bg-white"
            />

            <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
            <div className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-900">My current location</span>
              <span className="text-gray-500">· Hall A</span>
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-1">Radius</label>
            <div className="flex gap-2 mb-4">
              {['3', '5', '10', '20'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDistance(d)}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium ${
                    distance === d ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Visibility</label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setOpenToJoin(true)}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                    openToJoin ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700'
                  }`}
                >
                  Show to everyone
                </button>
                <button
                  onClick={() => setOpenToJoin(false)}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                    !openToJoin ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700'
                  }`}
                >
                  Show to matches only
                </button>
              </div>
            </div>

            <button
              onClick={submitMark}
              disabled={!topic.trim()}
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Drop mark
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
