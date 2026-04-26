import { useState } from 'react';
import { Heart, X, MessageCircle, Search, SlidersHorizontal, Lock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { MatchOverlay } from './MatchOverlay';
import { useApi, useAsync, useMutation } from '@/api/provider';
import type { EventId, Grade, ParticipantCard, ParticipantSort, UserId } from '@/domain/types';

type Tab = 'match' | 'liked' | 'hidden' | 'all';

export function ParticipantsScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;
  const api = useApi();

  const [activeTab, setActiveTab] = useState<Tab>('match');
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedCard, setMatchedCard] = useState<ParticipantCard | null>(null);
  const [sortBy, setSortBy] = useState<ParticipantSort>('relevance');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{
    company: string;
    position: string;
    industry: string;
    interests: string[];
    grade: Grade | '';
  }>({ company: '', position: '', industry: '', interests: [], grade: '' });

  const gate = useAsync((api) => api.profile.getMatchGate(eventId), [eventId]);
  const me = useAsync((api) => api.profile.me(), []);

  const deckQuery = useAsync(
    (api) => api.participants.listMatchDeck(eventId),
    [eventId, activeTab],
  );
  const likedQuery = useAsync(
    (api) => api.participants.listByReaction(eventId, 'like'),
    [eventId, activeTab],
  );
  const hiddenQuery = useAsync(
    (api) => api.participants.listByReaction(eventId, 'hide'),
    [eventId, activeTab],
  );
  const allQuery = useAsync(
    (api) =>
      api.participants.listAll(
        eventId,
        {
          search,
          company: filters.company,
          position: filters.position,
          industry: filters.industry,
          grade: filters.grade || null,
          interests: filters.interests,
          wantToTalkAbout: '',
        },
        sortBy,
      ),
    [eventId, activeTab, search, filters, sortBy],
  );

  const reactM = useMutation((api, targetId: UserId, reaction: 'like' | 'hide') =>
    api.participants.react(eventId, targetId, reaction),
  );

  const handleReact = async (card: ParticipantCard, reaction: 'like' | 'hide') => {
    const result = await reactM.run(card.user.id, reaction);
    if (result.mutualJustHappened) {
      setMatchedCard(card);
      setShowMatch(true);
    }
    deckQuery.reload();
    likedQuery.reload();
    hiddenQuery.reload();
    allQuery.reload();
  };

  const openChat = async (card: ParticipantCard) => {
    const conv = await api.chat.openOneOnOne(eventId, card.user.id);
    navigate(`/event/${eventId}/chat/${conv.id}`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'match', label: 'Match' },
    { id: 'liked', label: 'Liked' },
    { id: 'hidden', label: 'Hidden' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-3 border-b">
        <h1 className="font-bold text-xl mb-3">Participants</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'match' && gate.data && !gate.data.open && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-700 font-semibold mb-1">Complete your profile to unlock matches</p>
            <p className="text-gray-500 text-sm mb-4">{gate.data.reason}</p>
            <button
              onClick={() => navigate(`/event/${eventId}/profile`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Edit profile
            </button>
          </div>
        </div>
      )}

      {activeTab === 'match' && gate.data?.open && (
        <div className="flex-1 overflow-y-auto p-4">
          {deckQuery.loading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}
          {!deckQuery.loading && (deckQuery.data?.items.length ?? 0) === 0 && (
            <div className="py-10 text-center text-gray-500">
              <p className="font-medium">You're all caught up!</p>
              <p className="text-sm text-gray-400 mt-1">No new matches at the moment.</p>
            </div>
          )}
          <div className="space-y-4">
            {deckQuery.data?.items.map((card) => (
              <CardLarge
                key={card.user.id}
                card={card}
                onLike={() => handleReact(card, 'like')}
                onHide={() => handleReact(card, 'hide')}
                onProfile={() => navigate(`/event/${eventId}/user/${card.user.id}`)}
                onChat={() => openChat(card)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search participants..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowSort(true)}
                className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"
              >
                <span className="text-gray-600 font-bold text-lg">⇅</span>
              </button>
              <button
                onClick={() => setShowFilter(true)}
                className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {allQuery.loading && <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>}

            <div className="space-y-3">
              {allQuery.data?.items.map((card) => (
                <CardSmall
                  key={card.user.id}
                  card={card}
                  onProfile={() => navigate(`/event/${eventId}/user/${card.user.id}`)}
                  onLike={() => handleReact(card, 'like')}
                  onChat={() => openChat(card)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'liked' || activeTab === 'hidden') && (
        <div className="flex-1 overflow-y-auto p-4">
          {(() => {
            const data = activeTab === 'liked' ? likedQuery.data : hiddenQuery.data;
            const loading = activeTab === 'liked' ? likedQuery.loading : hiddenQuery.loading;
            if (loading) {
              return <div className="py-10 text-center text-gray-400 text-sm">Loading…</div>;
            }
            if (!data || data.length === 0) {
              return (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'liked' ? (
                        <Heart className="w-10 h-10 text-gray-400" />
                      ) : (
                        <X className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <p className="text-gray-600 font-medium">
                      {activeTab === 'liked' ? 'No liked profiles yet' : 'No hidden profiles'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {activeTab === 'liked'
                        ? 'Start swiping to find your matches'
                        : 'Hidden profiles will appear here'}
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {data.map((card) => (
                  <CardSmall
                    key={card.user.id}
                    card={card}
                    onProfile={() => navigate(`/event/${eventId}/user/${card.user.id}`)}
                    onLike={() => handleReact(card, 'like')}
                    onChat={() => openChat(card)}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {showSort && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowSort(false)}>
          <div className="bg-white rounded-t-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="font-bold text-lg mb-4">Sort by</h3>
            <div className="space-y-2">
              {(['relevance', 'name', 'company', 'match-count'] as ParticipantSort[]).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSortBy(option);
                    setShowSort(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl ${
                    sortBy === option ? 'bg-blue-50 text-blue-600 font-semibold' : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {option.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showFilter && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowFilter(false)}>
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Filters</h3>
                <button
                  onClick={() => setFilters({ company: '', position: '', industry: '', interests: [], grade: '' })}
                  className="text-sm text-blue-600"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Company</label>
                <input
                  type="text"
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  placeholder="Search company..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Job Position</label>
                <input
                  type="text"
                  value={filters.position}
                  onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                  placeholder="Search position..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Industry</label>
                <input
                  type="text"
                  value={filters.industry}
                  onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                  placeholder="e.g. Technology"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Grade</label>
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value as Grade | '' })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="head">Head</option>
                  <option value="cxo">C-level</option>
                </select>
              </div>

              <button
                onClick={() => setShowFilter(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {me.data && matchedCard && (
        <MatchOverlay
          show={showMatch}
          onClose={() => setShowMatch(false)}
          user={{
            name: matchedCard.user.fullName,
            position: matchedCard.user.position ?? '',
            company: matchedCard.user.company ?? '',
            image: matchedCard.user.photoUrl ?? '',
          }}
          currentUser={{
            name: me.data.fullName,
            position: me.data.position ?? '',
            company: me.data.company ?? '',
            image: me.data.photoUrl ?? '',
          }}
        />
      )}
    </div>
  );
}

function CardLarge({
  card,
  onLike,
  onHide,
  onProfile,
  onChat,
}: {
  card: ParticipantCard;
  onLike: () => void;
  onHide: () => void;
  onProfile: () => void;
  onChat: () => void;
}) {
  const u = card.user;
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      <div className="relative h-64">
        {u.photoUrl && <img src={u.photoUrl} alt={u.fullName} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg mb-1">{u.fullName}</h3>
          <p className="text-white/90 text-sm">
            {u.position} | {u.company}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {card.matchScore.matchTags.map((tag) => (
              <span key={tag} className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {card.isSpeaker && (
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">Speaker</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {u.wantToTalkAbout && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Want to talk about:</p>
            <p className="text-sm text-gray-800 italic line-clamp-2">"{u.wantToTalkAbout}"</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {u.interests.slice(0, 4).map((interest) => (
              <span key={interest} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                {interest}
              </span>
            ))}
            {u.interests.length > 4 && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                +{u.interests.length - 4} more
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onLike}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Like
          </button>
          <button onClick={onProfile} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium">
            Profile
          </button>
          <button onClick={onHide} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium">
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>

        <button onClick={onChat} className="w-full mt-2 bg-gray-50 text-gray-700 py-2 rounded-xl font-medium text-sm">
          Write now
        </button>
      </div>
    </div>
  );
}

function CardSmall({
  card,
  onLike,
  onProfile,
  onChat,
}: {
  card: ParticipantCard;
  onLike: () => void;
  onProfile: () => void;
  onChat: () => void;
}) {
  const u = card.user;
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex gap-3">
        {u.photoUrl && (
          <img src={u.photoUrl} alt={u.fullName} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{u.fullName}</h3>
          <p className="text-xs text-gray-600 mb-2">
            {u.position} | {u.company}
          </p>
          <div className="flex flex-wrap gap-1">
            {card.matchScore.matchTags.slice(0, 2).map((tag) => (
              <span key={tag} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {card.isSpeaker && (
              <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded">Speaker</span>
            )}
          </div>
        </div>
      </div>
      {u.wantToTalkAbout && (
        <p className="text-xs text-gray-600 italic mt-3 line-clamp-2">"{u.wantToTalkAbout}"</p>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={onProfile} className="flex-1 bg-gray-50 text-gray-700 py-1.5 rounded-lg text-xs font-medium">
          Profile
        </button>
        <button onClick={onLike} className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs font-medium">
          <Heart className="w-3 h-3 inline mr-1" />
          Like
        </button>
        <button onClick={onChat} className="flex-1 bg-green-50 text-green-600 py-1.5 rounded-lg text-xs font-medium">
          <MessageCircle className="w-3 h-3 inline mr-1" />
          Chat
        </button>
      </div>
    </div>
  );
}
