import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, X, MessageCircle, Mail, Linkedin, MessageSquare, Eye, Mic } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { FALLBACK_USER_ID, getUser, toStoredPerson, type MockUser } from './mockUsers';
import { speakerIds } from './mockEventInfo';
import {
  addToHidden,
  addToLiked,
  getRelationship,
  removeFromHidden,
  removeFromLiked,
  type Relationship,
} from './chatStore';

export function OtherUserProfile() {
  const navigate = useNavigate();
  const { eventId, userId } = useParams();
  const [activeTab, setActiveTab] = useState<'intro' | 'interests'>('intro');
  const [hashtag, setHashtag] = useState('#AIDesign');

  const resolvedUser: MockUser = getUser(userId);
  const chatTargetId = userId ?? FALLBACK_USER_ID;

  const [relationship, setRelationship] = useState<Relationship>(() =>
    getRelationship(chatTargetId),
  );

  useEffect(() => {
    setRelationship(getRelationship(chatTargetId));
  }, [chatTargetId]);

  const stored = toStoredPerson(resolvedUser);

  const handleLike = () => {
    if (relationship === 'hidden') removeFromHidden(chatTargetId);
    addToLiked(stored);
    setRelationship('liked');
  };

  const handleHide = () => {
    if (relationship === 'liked') removeFromLiked(chatTargetId);
    addToHidden(stored);
    setRelationship('hidden');
  };

  const handleRestore = () => {
    removeFromHidden(chatTargetId);
    setRelationship('default');
  };

  const handleChat = () => navigate(`/event/${eventId}/chat/${chatTargetId}`);

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
              <img
                src={resolvedUser.image}
                alt={resolvedUser.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-bold text-2xl">{resolvedUser.name}</h1>
              <input
                type="text"
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[100px]"
                placeholder="#tag"
              />
            </div>
            <p className="text-gray-600 mb-1">{resolvedUser.company}</p>
            <p className="text-gray-600 text-sm">
              {resolvedUser.position} | {resolvedUser.industry}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="inline-block bg-purple-50 text-purple-700 text-xs px-3 py-1 rounded-full font-medium">
                {resolvedUser.grade}
              </div>
              {speakerIds.includes(chatTargetId) && (
                <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-semibold">
                  <Mic className="w-3 h-3" />
                  Speaker
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {resolvedUser.matchTags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full"
                >
                  Match: {tag}
                </span>
              ))}
            </div>
          </div>

          <RelationshipActions
            relationship={relationship}
            onLike={handleLike}
            onHide={handleHide}
            onRestore={handleRestore}
            onChat={handleChat}
          />
        </div>
      </div>

      <div className="bg-white border-y border-gray-100 mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab('intro')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'intro'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Intro
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'interests'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Interests
          </button>
        </div>
      </div>

      {activeTab === 'intro' && (
        <div className="px-4 space-y-4 pb-6">
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Want to talk about
            </h3>
            {resolvedUser.wantToTalkAbout.length > 0 ? (
              <ul className="space-y-1.5">
                {resolvedUser.wantToTalkAbout.map((topic, i) => (
                  <li key={i} className="text-gray-800 text-sm flex gap-2">
                    <span className="text-purple-500">•</span>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">Nothing yet.</p>
            )}
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Description
            </h3>
            <p className="text-gray-800">{resolvedUser.description}</p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Contacts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Email</p>
                  <p className="text-gray-800 font-medium">{resolvedUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Linkedin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">LinkedIn</p>
                  <p className="text-gray-800 font-medium">{resolvedUser.linkedin}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Telegram</p>
                  <p className="text-gray-800 font-medium">{resolvedUser.telegram}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'interests' && (
        <div className="px-4 pb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Interests</h3>
              <span className="text-sm text-gray-500">{resolvedUser.interests.length} interests</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resolvedUser.interests.map((interest, i) => (
                <span
                  key={i}
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

/**
 * Action buttons shown under the profile header. Set depends on the
 * current relationship between local user and the displayed person:
 *
 *   default     — Like / Hide / Chat
 *   liked       — Hide / Chat (no Like; already liked)
 *   connection  — Chat only (already connected)
 *   hidden      — Like / Restore (no Chat; user dismissed them)
 */
function RelationshipActions({
  relationship,
  onLike,
  onHide,
  onRestore,
  onChat,
}: {
  relationship: Relationship;
  onLike: () => void;
  onHide: () => void;
  onRestore: () => void;
  onChat: () => void;
}) {
  if (relationship === 'connection') {
    return (
      <div className="flex gap-2 mb-4">
        <button
          onClick={onChat}
          className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700"
        >
          <MessageCircle className="w-5 h-5" />
          Chat
        </button>
      </div>
    );
  }

  if (relationship === 'liked') {
    return (
      <div className="flex gap-2 mb-4">
        <button
          onClick={onHide}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
        >
          <X className="w-5 h-5" />
          Hide
        </button>
        <button
          onClick={onChat}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700"
        >
          <MessageCircle className="w-5 h-5" />
          Message
        </button>
      </div>
    );
  }

  if (relationship === 'hidden') {
    return (
      <div className="flex gap-2 mb-4">
        <button
          onClick={onLike}
          className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-100"
        >
          <Heart className="w-5 h-5" />
          Like
        </button>
        <button
          onClick={onRestore}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
        >
          <Eye className="w-5 h-5" />
          Restore
        </button>
      </div>
    );
  }

  // default
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={onLike}
        className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-100"
      >
        <Heart className="w-5 h-5" />
        Like
      </button>
      <button
        onClick={onHide}
        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
      >
        <X className="w-5 h-5" />
        Hide
      </button>
      <button
        onClick={onChat}
        className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-100"
      >
        <MessageCircle className="w-5 h-5" />
        Chat
      </button>
    </div>
  );
}
