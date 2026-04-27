/**
 * Master profile — edited from the events list (top-right avatar) and
 * used as the starting snapshot for new events the user joins.
 *
 * Editing here does NOT change profiles inside events the user has
 * already entered (those have their own snapshot). It only affects
 * the next-event-entry default.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Linkedin,
  MessageSquare,
  Camera,
  Plus,
  X,
  Info,
} from 'lucide-react';
import {
  DEFAULT_PROFILE,
  getMasterInterests,
  getMasterProfile,
  isProfileGateOpen,
  MIN_INTERESTS,
  REQUIRED_FIELDS,
  setMasterInterests,
  setMasterProfile,
  type MyProfile,
} from './myProfileStore';

const GRADES = ['Junior', 'Middle', 'Senior', 'Lead', 'Head', 'C-level'];

export function MasterProfileScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get('setup') === '1';
  const fileInputRef = useRef<HTMLInputElement>(null);
  // In setup mode the form opens straight in edit state — the test user
  // shouldn't have to find the pencil button before they can type.
  const [isEditing, setIsEditing] = useState(isSetupMode);

  const initial = getMasterProfile();
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
  const [interests, setInterestsState] = useState<string[]>(() => getMasterInterests());

  // Initial defaulting if storage was empty
  useEffect(() => {
    if (!profile.name) setProfile((p) => ({ ...p, ...DEFAULT_PROFILE, photoUrl: undefined as never }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSave = () => {
    const cleaned = {
      ...profile,
      wantToTalkAbout: profile.wantToTalkAbout.map((s) => s.trim()).filter(Boolean),
    };
    setProfile(cleaned);
    const fullProfile: MyProfile = { ...cleaned, photoUrl: profilePhoto };
    setMasterProfile(fullProfile);
    setMasterInterests(interests);
    if (isSetupMode && isProfileGateOpen(fullProfile, interests)) {
      navigate('/events');
      return;
    }
    setIsEditing(false);
  };

  // Live gate-check on the current draft so the Save button can disable
  // and explain what's still missing while the user types.
  const draftFullProfile: MyProfile = { ...profile, photoUrl: profilePhoto };
  const draftGateOpen = isProfileGateOpen(draftFullProfile, interests);
  const missingFieldCount = REQUIRED_FIELDS.filter(
    (f) => !String((draftFullProfile as MyProfile)[f] ?? '').trim(),
  ).length;
  const missingInterestCount = Math.max(0, MIN_INTERESTS - interests.length);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="bg-white px-4 py-4 border-b flex items-center gap-3">
        {!isSetupMode && (
          <button onClick={() => navigate('/events')} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        <h1 className="font-bold text-xl">
          {isSetupMode ? 'Set up your profile' : 'My profile'}
        </h1>
      </div>

      {/* Top banner — different copy in setup vs. normal master-profile mode */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        {isSetupMode ? (
          <p className="text-xs text-blue-900">
            Welcome! Fill in the basics so we can match you with the right people.
            Required: <span className="font-semibold">all five top fields + at least {MIN_INTERESTS} interests</span>.
          </p>
        ) : (
          <p className="text-xs text-blue-900">
            This is your master profile. Changes here apply to <span className="font-semibold">future events you join</span>.
            Inside events you've already opened, edit the profile within the event.
          </p>
        )}
      </div>

      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-blue-600 to-blue-700"></div>
        <div className="px-4 pb-2">
          <div className="relative -mt-16 mb-4">
            <button
              onClick={() => isEditing && fileInputRef.current?.click()}
              className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg relative group"
            >
              {profilePhoto && <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />}
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            <button
              onClick={() => {
                if (isEditing) {
                  // Reset draft from store
                  const fresh = getMasterProfile();
                  setProfile({
                    name: fresh.name,
                    company: fresh.company,
                    position: fresh.position,
                    industry: fresh.industry,
                    grade: fresh.grade,
                    wantToTalkAbout: fresh.wantToTalkAbout,
                    description: fresh.description,
                    email: fresh.email,
                    linkedin: fresh.linkedin,
                    telegram: fresh.telegram,
                  });
                  setProfilePhoto(fresh.photoUrl);
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
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
                  placeholder="Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder="Company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    placeholder="Position"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={profile.industry}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    placeholder="Industry"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={profile.grade}
                  onChange={(e) => setProfile({ ...profile, grade: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <h1 className="font-bold text-2xl mb-1">{profile.name}</h1>
                <p className="text-gray-600 mb-1">{profile.company}</p>
                <p className="text-gray-600 text-sm">{profile.position} | {profile.industry}</p>
                <div className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full mt-2 font-medium">
                  {profile.grade}
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <div className="mb-4">
              <button
                onClick={handleSave}
                disabled={isSetupMode && !draftGateOpen}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSetupMode ? 'Save & continue' : 'Save Changes'}
              </button>
              {isSetupMode && !draftGateOpen && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Still missing
                  {missingFieldCount > 0 && ` ${missingFieldCount} required field${missingFieldCount === 1 ? '' : 's'}`}
                  {missingFieldCount > 0 && missingInterestCount > 0 && ' and'}
                  {missingInterestCount > 0 && ` ${missingInterestCount} more interest${missingInterestCount === 1 ? '' : 's'}`}
                  .
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">
        {/* Want to talk about */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Want to talk about</h3>
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

        {/* Description */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h3>
          {isEditing ? (
            <textarea
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              rows={4}
              placeholder="Tell us about yourself"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-gray-800">{profile.description || 'Nothing yet'}</p>
          )}
        </section>

        {/* Interests */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Interests</h3>
            <span className="text-sm text-gray-500">{interests.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest, i) => (
              <span
                key={i}
                className={`bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                  isEditing ? 'pr-2' : ''
                }`}
              >
                {interest}
                {isEditing && (
                  <button
                    onClick={() => setInterestsState(interests.filter((_, idx) => idx !== i))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && (
            <input
              type="text"
              placeholder="Type interest and press Enter"
              className="w-full mt-4 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setInterestsState([...interests, e.currentTarget.value.trim()]);
                  e.currentTarget.value = '';
                }
              }}
            />
          )}
          {interests.length < MIN_INTERESTS && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">Note:</span> You need at least {MIN_INTERESTS} interests to unlock the Match tab. ({interests.length}/{MIN_INTERESTS})
              </p>
            </div>
          )}
        </section>

        {/* Contacts */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contacts</h3>
          <div className="space-y-3">
            <ContactRow
              Icon={Mail}
              label="Email"
              value={profile.email}
              isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, email: v })}
            />
            <ContactRow
              Icon={Linkedin}
              label="LinkedIn"
              value={profile.linkedin}
              isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, linkedin: v })}
            />
            <ContactRow
              Icon={MessageSquare}
              label="Telegram"
              value={profile.telegram}
              isEditing={isEditing}
              onChange={(v) => setProfile({ ...profile, telegram: v })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ContactRow({
  Icon,
  label,
  value,
  isEditing,
  onChange,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-xs">{label}</p>
        {isEditing ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-gray-800 font-medium truncate">{value || '—'}</p>
        )}
      </div>
    </div>
  );
}
