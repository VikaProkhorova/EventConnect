import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowRight, Edit2, Info, Mail, Linkedin, MessageSquare, Settings, Camera, Plus, X, ChevronDown, Target } from 'lucide-react';
import {
  CONNECTION_GOAL_OPTIONS,
  getConnectionGoal,
  hasSetConnectionGoal,
  setConnectionGoal,
} from './chatStore';
import {
  getEventInterests,
  getEventProfile,
  MIN_INTERESTS,
  setEventInterests,
  setEventProfile,
  type MyProfile,
} from './myProfileStore';
import { INDUSTRY_OPTIONS } from './interestsCatalog';
import { InterestPicker } from './InterestPicker';

export function ProfileScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get('setup') === '1';
  // In setup mode we open straight in edit state so the test user can
  // start typing right away.
  const [isEditing, setIsEditing] = useState(isSetupMode);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial state hydrated from per-event snapshot (snapshots from master on first entry).
  const initial = getEventProfile(eventId ?? '');
  const [profilePhoto, setProfilePhoto] = useState(initial.photoUrl);
  const [profile, setProfile] = useState<Omit<MyProfile, 'photoUrl'>>({
    name: initial.name,
    company: initial.company,
    position: initial.position,
    industry: initial.industry,
    grade: initial.grade,
    wantToTalkAbout: initial.wantToTalkAbout,
    description: initial.description,
    email: initial.email,
    linkedin: initial.linkedin,
    telegram: initial.telegram,
  });

  /* ───────── Connection goal (drives Networking Opportunities progress bar) ───────── */
  // Null means the user hasn't picked yet — in setup mode this is the
  // single hard requirement that gates "Save & continue".
  const [connectionGoal, setLocalGoal] = useState<number | null>(
    () => (hasSetConnectionGoal() ? getConnectionGoal() : null),
  );
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const updateGoal = (n: number) => {
    setConnectionGoal(n);
    setLocalGoal(n);
    setShowGoalPicker(false);
  };

  // Re-sync if storage changed elsewhere (e.g. another tab)
  useEffect(() => {
    if (hasSetConnectionGoal()) setLocalGoal(getConnectionGoal());
  }, []);

  /* ───────── Want-to-talk-about helpers ───────── */
  const updateWttaItem = (i: number, value: string) => {
    setProfile((p) => {
      const next = [...p.wantToTalkAbout];
      next[i] = value;
      return { ...p, wantToTalkAbout: next };
    });
  };
  const removeWttaItem = (i: number) => {
    setProfile((p) => ({
      ...p,
      wantToTalkAbout: p.wantToTalkAbout.filter((_, idx) => idx !== i),
    }));
  };
  const addWttaItem = () => {
    setProfile((p) => ({ ...p, wantToTalkAbout: [...p.wantToTalkAbout, ''] }));
  };

  const handleSaveProfile = () => {
    // In setup mode the connection goal is the only hard requirement.
    if (isSetupMode && connectionGoal === null) return;
    // Drop empty options on save (per spec)
    const cleaned = {
      ...profile,
      wantToTalkAbout: profile.wantToTalkAbout.map((s) => s.trim()).filter(Boolean),
    };
    setProfile(cleaned);
    setEventProfile(eventId ?? '', { ...cleaned, photoUrl: profilePhoto });
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [interests, setInterestsState] = useState<string[]>(() => getEventInterests(eventId ?? ''));

  const setInterests = (next: string[]) => {
    setInterestsState(next);
    setEventInterests(eventId ?? '', next);
  };


  return (
    <div className="h-full overflow-x-hidden overflow-y-auto bg-gray-50">
      {isSetupMode && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            Welcome to Tech Summit 2026! Set up your event profile —
            only <span className="font-semibold">connection goal</span> is required.
            {' '}You can keep editing later.
          </p>
        </div>
      )}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-blue-600 to-blue-700"></div>
        {!isSetupMode && (
          <button
            onClick={() => navigate(`/event/${eventId}/settings`)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
        )}
        <div className="px-4 pb-2">
          <div className="relative -mt-16 mb-4">
            <button
              onClick={() => isEditing && fileInputRef.current?.click()}
              className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg relative group"
            >
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <Edit2 className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="mb-4">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Position"
                  />
                  <input
                    type="text"
                    list="industry-suggestions-event"
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Industry"
                  />
                  <datalist id="industry-suggestions-event">
                    {INDUSTRY_OPTIONS.map((i) => (
                      <option key={i} value={i} />
                    ))}
                  </datalist>
                </div>
                <select
                  value={profile.grade}
                  onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Junior">Junior</option>
                  <option value="Middle">Middle</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Head">Head</option>
                </select>
              </div>
            ) : (
              <>
                <h1 className="font-bold text-2xl mb-1">{profile.name}</h1>
                <p className="text-gray-600 mb-1">{profile.company}</p>
                <p className="text-gray-600 text-sm">
                  {profile.position} | {profile.industry}
                </p>
                <div className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full mt-2 font-medium">
                  {profile.grade}
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <div className="mb-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSetupMode && connectionGoal === null}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSetupMode ? 'Save & continue' : 'Save Changes'}
              </button>
              {isSetupMode && connectionGoal === null && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Choose how many people you want to connect with to continue.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">
          {/* Connection goal — required in setup, editable always */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase">
                How many people do you want to connect with?
              </h3>
              {isSetupMode && connectionGoal === null && (
                <span className="ml-auto text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                  Required
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowGoalPicker(!showGoalPicker)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-colors ${
                  connectionGoal !== null
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span>
                  {connectionGoal !== null
                    ? `${connectionGoal} ${connectionGoal === 1 ? 'person' : 'people'}`
                    : 'Pick a number'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showGoalPicker ? 'rotate-180' : ''}`} />
              </button>
              {showGoalPicker && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-1 max-h-60 overflow-y-auto">
                  {CONNECTION_GOAL_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => updateGoal(n)}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 ${
                        n === connectionGoal ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {n} {n === 1 ? 'person' : 'people'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sets your event goal in the Networking Opportunities bar on Home.
            </p>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Want to talk about
            </h3>
            {isEditing ? (
              <div className="space-y-2">
                {profile.wantToTalkAbout.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateWttaItem(i, e.target.value)}
                      placeholder="What do you want to talk about?"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeWttaItem(i)}
                      className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 flex-shrink-0"
                      aria-label="Remove option"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addWttaItem}
                  className="w-full px-3 py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" />
                  Add option
                </button>
                <p className="text-xs text-gray-400 italic">
                  Empty fields are removed when you save.
                </p>
              </div>
            ) : profile.wantToTalkAbout.length > 0 ? (
              <ul className="space-y-1.5">
                {profile.wantToTalkAbout.map((item, i) => (
                  <li key={i} className="text-gray-800 text-sm flex gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">Nothing yet — add a topic in edit mode.</p>
            )}
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Description
            </h3>
            {isEditing ? (
              <textarea
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Tell us about yourself"
              />
            ) : (
              <p className="text-gray-800">{profile.description}</p>
            )}
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">My Interests</h3>
              <span className="text-sm text-gray-500">{interests.length} selected</span>
            </div>
            {isEditing ? (
              <InterestPicker selected={interests} onChange={setInterests} />
            ) : interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, i) => (
                  <span
                    key={i}
                    className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Nothing yet — pick a few in edit mode.</p>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium text-sm"
              >
                + Add more interests
              </button>
            )}
            {interests.length < MIN_INTERESTS && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
                <p className="text-xs text-yellow-800">
                  <span className="font-semibold">Note:</span> You need at least {MIN_INTERESTS} interests to unlock the Match tab. ({interests.length}/{MIN_INTERESTS})
                </p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Contacts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{profile.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Linkedin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">LinkedIn</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.linkedin}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{profile.linkedin}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-500 text-xs">Telegram</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.telegram}
                      onChange={(e) => setProfile({ ...profile, telegram: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{profile.telegram}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {isSetupMode && !isEditing && (
            <button
              onClick={() => navigate('/welcome?from=setup')}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mt-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
      </div>
    </div>
  );
}