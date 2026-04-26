import { useEffect, useMemo, useState } from 'react';
import { Heart, X, MessageCircle, Search, SlidersHorizontal, Eye, Lock, Mic } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { MatchOverlay } from './MatchOverlay';
import { MatchCard } from './MatchCard';
import { SwipeableCard } from './SwipeableCard';
import { computeMatchScore, getMatchCandidates, rankCandidatesByMatch } from './mockUsers';
import { useEventPeriod } from './eventPeriodContext';
import {
  FIELD_LABEL,
  getMasterInterests,
  getMasterProfile,
  getProfileGateMissing,
  type GateMissing,
} from './myProfileStore';
import { speakerIds } from './mockEventInfo';

const PARTICIPANTS_FILTER_FLAG_KEY = 'participantsFilter';

const mockParticipants = getMatchCandidates();

export function ParticipantsScreen() {
  const { period } = useEventPeriod();
  const isPostEvent = period === 'after';
  const initialTab = isPostEvent ? 'connections' : 'matches';
  const [activeTab, setActiveTab] = useState<'matches' | 'liked' | 'connections' | 'hidden' | 'all'>(initialTab);

  // If user switches to 'after' while sitting on Matches, bounce them off
  useEffect(() => {
    if (isPostEvent && activeTab === 'matches') setActiveTab('connections');
  }, [isPostEvent, activeTab]);

  const navigate = useNavigate();
  const { eventId } = useParams();

  // Re-read gate state on every render — cheap, syncs after Profile edits
  const gateMissing: GateMissing = getProfileGateMissing();
  const gateOpen = gateMissing.fields.length === 0 && gateMissing.interests === 0;

  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    company: '',
    position: '',
    industry: '',
    interests: [] as string[],
    grade: '',
    speakerOnly: false,
  });

  // Deep-link from InfoScreen "See more →" sets the flag; pick it up once.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PARTICIPANTS_FILTER_FLAG_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { speakerOnly?: boolean };
      if (parsed.speakerOnly) {
        setActiveTab('all');
        setFilters((f) => ({ ...f, speakerOnly: true }));
      }
      sessionStorage.removeItem(PARTICIPANTS_FILTER_FLAG_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const [likedProfiles, setLikedProfiles] = useState<any[]>(() => {
    const stored = sessionStorage.getItem('likedProfiles');
    return stored ? JSON.parse(stored) : [];
  });

  const [hiddenProfiles, setHiddenProfiles] = useState<any[]>(() => {
    const stored = sessionStorage.getItem('hiddenProfiles');
    return stored ? JSON.parse(stored) : [];
  });

  const [connections, setConnections] = useState<any[]>(() => {
    const stored = sessionStorage.getItem('connections');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    sessionStorage.setItem('likedProfiles', JSON.stringify(likedProfiles));
  }, [likedProfiles]);

  useEffect(() => {
    sessionStorage.setItem('hiddenProfiles', JSON.stringify(hiddenProfiles));
  }, [hiddenProfiles]);

  useEffect(() => {
    sessionStorage.setItem('connections', JSON.stringify(connections));
  }, [connections]);

  const tabs = [
    // Matches tab is removed entirely after the event ends (SOW §4.18)
    ...(isPostEvent
      ? []
      : [{ id: 'matches' as const, label: 'Matches' }]),
    { id: 'liked' as const, label: 'Liked' },
    { id: 'connections' as const, label: 'Connections' },
    { id: 'hidden' as const, label: 'Hidden' },
    { id: 'all' as const, label: 'All' },
  ];

  /* ───────── All-tab filter / sort / search pipeline ───────── */
  const allFilteredSorted = useMemo(() => {
    let list = [...mockParticipants];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q),
      );
    }

    if (filters.company.trim()) {
      const v = filters.company.toLowerCase();
      list = list.filter((p) => p.company.toLowerCase().includes(v));
    }
    if (filters.position.trim()) {
      const v = filters.position.toLowerCase();
      list = list.filter((p) => p.position.toLowerCase().includes(v));
    }
    if (filters.industry) {
      // Substring match: "technology" hits "Technology" / "Music Tech" / "Health Tech"
      const v = filters.industry.toLowerCase();
      list = list.filter((p) => p.industry.toLowerCase().includes(v));
    }
    if (filters.grade) {
      const v = filters.grade.toLowerCase();
      list = list.filter((p) => p.grade.toLowerCase() === v);
    }
    if (filters.speakerOnly) {
      list = list.filter((p) => speakerIds.includes(p.id));
    }

    switch (sortBy) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'company':
        list.sort((a, b) => a.company.localeCompare(b.company));
        break;
      case 'match count':
        list.sort((a, b) => b.matchTags.length - a.matchTags.length);
        break;
      case 'relevance':
      default:
        // keep registry order
        break;
    }

    return list;
  }, [search, filters, sortBy]);

  const handleDismiss = (person: any) => {
    if (!hiddenProfiles.find(p => p.id === person.id)) {
      setHiddenProfiles([...hiddenProfiles, person]);
    }
  };

  const handleLike = (person: any) => {
    const isMutualMatch = Math.random() > 0.5;
    if (isMutualMatch) {
      if (!connections.find(p => p.id === person.id)) {
        setConnections([...connections, person]);
      }
      setMatchedUser(person);
      setShowMatch(true);
    } else {
      if (!likedProfiles.find(p => p.id === person.id)) {
        setLikedProfiles([...likedProfiles, person]);
      }
    }
  };

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
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'matches' && !gateOpen && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">
              Complete your profile to unlock matches
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We use your profile to find people you'll actually want to meet.
              Add the missing pieces below to start getting recommendations.
            </p>

            <ul className="space-y-2 mb-5">
              {gateMissing.fields.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-gray-400" />
                  </span>
                  {FIELD_LABEL[f]}
                </li>
              ))}
              {gateMissing.interests > 0 && (
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-gray-400" />
                  </span>
                  Add {gateMissing.interests} more {gateMissing.interests === 1 ? 'interest' : 'interests'}
                </li>
              )}
            </ul>

            <button
              onClick={() => navigate(`/event/${eventId}/profile`)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold"
            >
              Edit profile
            </button>
          </div>
        </div>
      )}

      {activeTab === 'matches' && gateOpen && (
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          <p className="text-xs text-gray-500 italic mb-3 text-center">
            Swipe right to like · Swipe left to hide
          </p>
          <div className="space-y-4 overflow-x-hidden">
            {rankCandidatesByMatch(
              mockParticipants.filter(person =>
                !likedProfiles.find(p => p.id === person.id) &&
                !hiddenProfiles.find(p => p.id === person.id) &&
                !connections.find(p => p.id === person.id)
              ),
              getMasterProfile(),
              getMasterInterests(),
            )
              .map(({ user: person, score }) => (
                <SwipeableCard
                  key={person.id}
                  onLike={() => handleLike(person)}
                  onHide={() => handleDismiss(person)}
                >
                  <MatchCard
                    userId={String(person.id)}
                    name={person.name}
                    position={person.position}
                    company={person.company}
                    photoUrl={person.image}
                    matchScore={score}
                    location="At the event"
                    matchedInterests={person.matchTags}
                    wantsToTalkAbout={
                      Array.isArray(person.wantToTalkAbout)
                        ? person.wantToTalkAbout
                        : person.wantToTalkAbout
                          ? [person.wantToTalkAbout]
                          : []
                    }
                    conversationStarters={[
                      { text: `${person.interests?.[0] ?? person.matchTags?.[0] ?? 'topic'}?` },
                      { text: `${person.matchTags?.[0] ?? 'industry'} best practices`, isAiGenerated: true },
                    ]}
                    alsoInterestedIn={person.interests ?? []}
                    state="default"
                    onDismiss={() => handleDismiss(person)}
                    onLike={() => handleLike(person)}
                  />
                </SwipeableCard>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'connections' && (
        <>
          {connections.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {connections.map((person) => (
                  <MatchCard
                    key={person.id}
                    userId={String(person.id)}
                    name={person.name}
                    position={person.position}
                    company={person.company}
                    photoUrl={person.image}
                    matchScore={computeMatchScore(getMasterProfile(), getMasterInterests(), person)}
                    location="At the event"
                    matchedInterests={person.matchTags}
                    wantsToTalkAbout={
                      Array.isArray(person.wantToTalkAbout)
                        ? person.wantToTalkAbout
                        : person.wantToTalkAbout
                          ? [person.wantToTalkAbout]
                          : []
                    }
                    conversationStarters={[
                      { text: `${person.interests?.[0] ?? person.matchTags?.[0] ?? 'topic'}?` },
                      { text: `${person.matchTags?.[0] ?? 'industry'} best practices`, isAiGenerated: true },
                    ]}
                    alsoInterestedIn={person.interests ?? []}
                    state="mutual-match"
                    onMessage={() => navigate(`/event/${eventId}/chat/${person.id}`)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No connections yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Mutual matches will appear here
                </p>
              </div>
            </div>
          )}
        </>
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

            {allFilteredSorted.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-12">
                No participants match your filters.
              </div>
            )}

            <div className="space-y-3">
              {allFilteredSorted.map((person) => (
                <div
                  key={person.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/event/${eventId}/user/${person.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/event/${eventId}/user/${person.id}`);
                    }
                  }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex gap-3">
                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{person.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {person.position} | {person.company}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {speakerIds.includes(person.id) && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded font-semibold">
                            <Mic className="w-2.5 h-2.5" />
                            Speaker
                          </span>
                        )}
                        {person.matchTags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {person.wantToTalkAbout.length > 0 && (
                    <p className="text-xs text-gray-600 italic mt-3 line-clamp-2">
                      {person.wantToTalkAbout.map((t) => `"${t}"`).join(' · ')}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event/${eventId}/user/${person.id}`);
                      }}
                      className="flex-1 bg-gray-50 text-gray-700 py-1.5 rounded-lg text-xs font-medium"
                    >
                      Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(person);
                      }}
                      className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs font-medium"
                    >
                      <Heart className="w-3 h-3 inline mr-1" />
                      Like
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event/${eventId}/chat/${person.id}`);
                      }}
                      className="flex-1 bg-green-50 text-green-600 py-1.5 rounded-lg text-xs font-medium"
                    >
                      <MessageCircle className="w-3 h-3 inline mr-1" />
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'liked' && (
        <>
          {likedProfiles.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {likedProfiles.map((person) => (
                  <MatchCard
                    key={person.id}
                    userId={String(person.id)}
                    name={person.name}
                    position={person.position}
                    company={person.company}
                    photoUrl={person.image}
                    matchScore={computeMatchScore(getMasterProfile(), getMasterInterests(), person)}
                    location="At the event"
                    matchedInterests={person.matchTags}
                    wantsToTalkAbout={
                      Array.isArray(person.wantToTalkAbout)
                        ? person.wantToTalkAbout
                        : person.wantToTalkAbout
                          ? [person.wantToTalkAbout]
                          : []
                    }
                    conversationStarters={[
                      { text: `${person.interests?.[0] ?? person.matchTags?.[0] ?? 'topic'}?` },
                      { text: `${person.matchTags?.[0] ?? 'industry'} best practices`, isAiGenerated: true },
                    ]}
                    alsoInterestedIn={person.interests ?? []}
                    state="you-liked"
                    onDismiss={() => {
                      setLikedProfiles(likedProfiles.filter((p) => p.id !== person.id));
                      if (!hiddenProfiles.find((p) => p.id === person.id)) {
                        setHiddenProfiles([...hiddenProfiles, person]);
                      }
                    }}
                    onMessage={() => navigate(`/event/${eventId}/chat/${person.id}`)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No liked profiles yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Profiles you liked without mutual match will appear here
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'hidden' && (
        <>
          {hiddenProfiles.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {hiddenProfiles.map((person) => (
                  <div
                    key={person.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/event/${eventId}/user/${person.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/event/${eventId}/user/${person.id}`);
                      }
                    }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex gap-3">
                      <img
                        src={person.image}
                        alt={person.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0 grayscale"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{person.name}</h3>
                        <p className="text-xs text-gray-600 mb-2">
                          {person.position} | {person.company}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {person.matchTags.slice(0, 2).map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHiddenProfiles(hiddenProfiles.filter((p) => p.id !== person.id));
                          if (!likedProfiles.find((p) => p.id === person.id)) {
                            setLikedProfiles([...likedProfiles, person]);
                          }
                        }}
                        className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium flex items-center justify-center hover:bg-blue-700"
                        aria-label="Like"
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event/${eventId}/user/${person.id}`);
                        }}
                        className="flex-1 bg-blue-50 text-blue-600 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-100"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHiddenProfiles(hiddenProfiles.filter((p) => p.id !== person.id));
                        }}
                        className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-700"
                      >
                        <Eye className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No hidden profiles</p>
                <p className="text-gray-400 text-sm mt-1">
                  Profiles you dismissed will appear here
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {showSort && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowSort(false)}>
          <div className="bg-white rounded-t-3xl w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="font-bold text-lg mb-4">Sort by</h3>
            <div className="space-y-2">
              {['relevance', 'name', 'company', 'match count'].map((option) => (
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
                  {option.charAt(0).toUpperCase() + option.slice(1)}
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
                  onClick={() => setFilters({ company: '', position: '', industry: '', interests: [], grade: '', speakerOnly: false })}
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
                <select
                  value={filters.industry}
                  onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Industries</option>
                  <option value="technology">Technology</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                  <option value="finance">Finance</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Grade</label>
                <select
                  value={filters.grade}
                  onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="head">Head</option>
                </select>
              </div>

              <button
                onClick={() => setFilters((f) => ({ ...f, speakerOnly: !f.speakerOnly }))}
                className={`w-full px-4 py-3 rounded-lg text-sm font-medium border-2 flex items-center justify-between transition-colors ${
                  filters.speakerOnly
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Speakers only
                </span>
                <span className="text-xs">{filters.speakerOnly ? 'ON' : 'OFF'}</span>
              </button>

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

      <MatchOverlay
        show={showMatch}
        onClose={() => setShowMatch(false)}
        user={
          matchedUser
            ? {
                id: String(matchedUser.id),
                name: matchedUser.name,
                position: matchedUser.position,
                company: matchedUser.company,
                image: matchedUser.image,
              }
            : {
                id: String(mockParticipants[0].id),
                name: mockParticipants[0].name,
                position: mockParticipants[0].position,
                company: mockParticipants[0].company,
                image: mockParticipants[0].image,
              }
        }
        currentUser={{
          name: 'John Doe',
          position: 'Software Engineer',
          company: 'Microsoft',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        }}
      />
    </div>
  );
}