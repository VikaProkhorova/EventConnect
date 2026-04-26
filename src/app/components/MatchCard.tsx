import { X, Heart, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useEventPeriod } from './eventPeriodContext';

type MatchCardProps = {
  userId: string;
  name: string;
  position: string;
  company: string;
  photoUrl: string;
  matchScore: number;
  location: string;
  availableIn?: string;
  matchedInterests: string[];
  wantsToTalkAbout: string[];
  conversationStarters: {
    text: string;
    isAiGenerated?: boolean;
  }[];
  alsoInterestedIn: string[];
  state?: 'default' | 'liked-you' | 'you-liked' | 'mutual-match';
  onDismiss?: () => void;
  onLike?: () => void;
  onMessage?: () => void;
};

export function MatchCard({
  userId,
  name,
  position,
  company,
  photoUrl,
  matchScore,
  location,
  availableIn,
  matchedInterests,
  wantsToTalkAbout,
  conversationStarters,
  alsoInterestedIn,
  state = 'default',
  onDismiss,
  onLike,
  onMessage,
}: MatchCardProps) {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { period: eventPeriod } = useEventPeriod();

  const handleCardClick = () => {
    navigate(`/event/${eventId}/user/${userId}`);
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/event/${eventId}/user/${userId}`);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMessage?.();
  };

  const getGlowRing = () => {
    if (state === 'liked-you') {
      return 'ring-4 ring-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.6)]';
    }
    if (state === 'mutual-match') {
      return 'ring-4 ring-green-500/60 shadow-[0_0_16px_rgba(16,185,129,0.6)]';
    }
    return '';
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-[20px] shadow-[0_4px_16px_rgba(15,23,42,0.08)] overflow-hidden cursor-pointer transition-all ${getGlowRing()}`}
    >
      {/* Mutual match banner */}
      {state === 'mutual-match' && (
        <div className="bg-green-500 text-white text-center py-2 font-bold text-sm">
          ✨ It's a mutual match
        </div>
      )}

      {/* Card content with padding */}
      <div className="px-5">
        {/* SECTION 1 — Header with small photo */}
        <div className="pt-5 pb-4 flex items-start gap-3">
          {/* Small circular photo */}
          <img
            src={photoUrl}
            alt={name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />

          {/* Name, position, and badges */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              {position} · {company}
            </p>

            {/* Pills row */}
            <div className="flex flex-wrap gap-2">
              {/* Match score or "Liked you" pill */}
              {state === 'liked-you' ? (
                <div className="px-2 py-1 rounded-full bg-amber-500 text-white text-xs font-medium flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-white" />
                  Liked you
                </div>
              ) : (
                <div className="px-2 py-1 rounded-full bg-blue-50 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-blue-600 fill-blue-600" />
                  <span className="text-blue-600 text-xs font-bold">{matchScore}%</span>
                </div>
              )}

              {/* Live context */}
              {eventPeriod === 'during' && (
                <div className="px-2 py-1 rounded-full bg-gray-100 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-700 text-xs">
                    {location}{availableIn && ` · free in ${availableIn}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* SECTION 2 — Matched on */}
        <div className="pb-4 border-t border-gray-100 pt-4">
          <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            MATCHED ON
          </h4>
          <div className="flex flex-wrap gap-2">
            {matchedInterests.map((interest, i) => (
              <span
                key={i}
                className="bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-full text-xs font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 3 — Wants to talk about */}
        <div className="pt-4">
          <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            WANTS TO TALK ABOUT
          </h4>
          <div className="flex flex-wrap gap-2">
            {wantsToTalkAbout.map((topic, i) => (
              <div key={i} className="bg-gray-100 rounded-xl px-3 py-2">
                <p className="text-sm italic text-gray-900">{topic}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4 — Conversation starters */}
        <div className="pt-4">
          <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            CONVERSATION STARTERS
          </h4>
          <div className="flex flex-wrap gap-2">
            {conversationStarters.map((starter, i) => (
              <span
                key={i}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                  starter.isAiGenerated
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {starter.isAiGenerated && <Sparkles className="w-3 h-3" />}
                {starter.text}
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 5 — Also interested in */}
        <div className="pt-4 pb-5">
          <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            ALSO INTERESTED IN
          </h4>
          <p className="text-xs text-gray-500">
            {alsoInterestedIn.slice(0, 3).join(' · ')}
            {alsoInterestedIn.length > 3 && ` · +${alsoInterestedIn.length - 3}`}
          </p>
        </div>
      </div>

      {/* SECTION 6 — Action row */}
      <div className="border-t border-gray-100">
        <div className="px-5 py-4 flex items-center gap-3">
          {state !== 'mutual-match' && (
            <button
              onClick={handleDismiss}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 hover:bg-gray-200 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}

          <button
            onClick={handleViewProfile}
            className={`flex-1 py-3 rounded-full bg-blue-50 text-blue-600 font-medium text-sm hover:bg-blue-100 transition-colors ${
              state === 'mutual-match' || state === 'you-liked' ? 'flex-[2]' : ''
            }`}
          >
            View profile
          </button>

          {state === 'mutual-match' || state === 'you-liked' ? (
            <button
              onClick={handleMessage}
              className="flex-[3] py-3 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            >
              Message →
            </button>
          ) : (
            <button
              onClick={handleLike}
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Like"
            >
              <Heart className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
