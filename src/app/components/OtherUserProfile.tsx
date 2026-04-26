import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, X, MessageCircle, Mail, Linkedin, MessageSquare } from 'lucide-react';
import { useApi, useAsync, useMutation } from '@/api/provider';
import { useNavigate, useParams } from 'react-router';
import type { EventId, Grade, ReactionKind, UserId } from '@/domain/types';

const gradeLabel: Record<Grade, string> = {
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
  lead: 'Lead',
  head: 'Head',
  cxo: 'C-level',
};

export function OtherUserProfile() {
  const navigate = useNavigate();
  const { eventId: eventIdParam, userId: userIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;
  const userId = (userIdParam ?? '') as UserId;
  const api = useApi();

  const profileQuery = useAsync(
    (api) => api.profile.getPublicProfile(eventId, userId),
    [eventId, userId],
  );
  const scoreQuery = useAsync(
    (api) => api.participants.getScore(eventId, userId),
    [eventId, userId],
  );

  const reactM = useMutation((api, reaction: ReactionKind) =>
    api.participants.react(eventId, userId, reaction),
  );
  const setHashtagM = useMutation((api, text: string | null) =>
    api.participants.setHashtagNote(eventId, userId, text),
  );

  const [activeTab, setActiveTab] = useState<'intro' | 'interests'>('intro');
  const [hashtag, setHashtag] = useState('');
  const [myReaction, setMyReaction] = useState<ReactionKind>('none');

  // Initial state from server when profile loads
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // No standalone "get my reaction" endpoint — derive via match deck reload not needed;
      // for an MVP, we leave myReaction in 'none' until the user clicks.
      // Hashtag: there's no explicit getter, but the participants API exposes it on cards.
      // We'll attempt to load via listMatchDeck or listAll; simpler: skip for now.
      void cancelled;
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, userId]);

  if (profileQuery.loading) {
    return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;
  }
  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="p-10 text-center text-red-500 text-sm">
        {profileQuery.error?.message ?? 'User not found'}
      </div>
    );
  }

  const u = profileQuery.data;
  const matchTags = scoreQuery.data?.matchTags ?? [];

  const handleReact = async (kind: ReactionKind) => {
    setMyReaction(kind);
    await reactM.run(kind);
  };

  const handleChat = async () => {
    const conv = await api.chat.openOneOnOne(eventId, userId);
    navigate(`/event/${eventId}/chat/${conv.id}`);
  };

  const commitHashtag = async () => {
    const cleaned = hashtag.trim().replace(/^#/, '');
    await setHashtagM.run(cleaned || null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-purple-600 to-purple-700"></div>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="px-4 pb-6">
          <div className="relative -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
              {u.photoUrl && <img src={u.photoUrl} alt={u.fullName} className="w-full h-full object-cover" />}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-bold text-2xl">{u.fullName}</h1>
              <input
                type="text"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                onBlur={commitHashtag}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitHashtag();
                }}
                className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[100px]"
                placeholder="#tag"
              />
            </div>
            <p className="text-gray-600 mb-1">{u.company ?? '—'}</p>
            <p className="text-gray-600 text-sm">
              {u.position ?? '—'} | {u.industry ?? '—'}
            </p>
            {u.grade && (
              <div className="inline-block bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full mt-2 font-medium">
                {gradeLabel[u.grade]}
              </div>
            )}
            {matchTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {matchTags.map((tag) => (
                  <span key={tag} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    Match: {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleReact('like')}
              disabled={reactM.loading}
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                myReaction === 'like'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              } disabled:opacity-50`}
            >
              <Heart className={`w-5 h-5 ${myReaction === 'like' ? 'fill-white' : ''}`} />
              {myReaction === 'like' ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={() => handleReact('hide')}
              disabled={reactM.loading}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
              Hide
            </button>
            <button
              onClick={handleChat}
              className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-100"
            >
              <MessageCircle className="w-5 h-5" />
              Chat
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-y border-gray-100 mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab('intro')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'intro' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
            }`}
          >
            Intro
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'interests' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
            }`}
          >
            Interests
          </button>
        </div>
      </div>

      {activeTab === 'intro' && (
        <div className="px-4 space-y-4 pb-6">
          {u.wantToTalkAbout && (
            <section className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Want to talk about</h3>
              <p className="text-gray-800">{u.wantToTalkAbout}</p>
            </section>
          )}

          {u.description && (
            <section className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h3>
              <p className="text-gray-800">{u.description}</p>
            </section>
          )}

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contacts</h3>
            <div className="space-y-3">
              <ContactRow Icon={Mail} label="Email" value={u.contacts.email} />
              <ContactRow Icon={Linkedin} label="LinkedIn" value={u.contacts.linkedin} />
              <ContactRow Icon={MessageSquare} label="Telegram" value={u.contacts.telegram} />
            </div>
            {u.contacts.email === null &&
              u.contacts.linkedin === null &&
              u.contacts.telegram === null && (
                <p className="text-xs text-gray-400 italic mt-3">
                  Contacts hidden by user's privacy settings.
                </p>
              )}
          </section>
        </div>
      )}

      {activeTab === 'interests' && (
        <div className="px-4 pb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Interests</h3>
              <span className="text-sm text-gray-500">{u.interests.length} interests</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.interests.map((interest) => (
                <span
                  key={interest}
                  className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-purple-600" />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-gray-800 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
