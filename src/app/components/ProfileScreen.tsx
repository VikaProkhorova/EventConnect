import { useEffect, useRef, useState } from 'react';
import { Edit2, Mail, Linkedin, MessageSquare, Settings, Camera } from 'lucide-react';
import { useAsync, useMutation } from '@/api/provider';
import { MIN_INTERESTS_FOR_MATCH } from '@/domain/types';
import type { Grade, PrivacySettings, User } from '@/domain/types';

const GRADES: Array<{ value: Grade; label: string }> = [
  { value: 'junior', label: 'Junior' },
  { value: 'middle', label: 'Middle' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'head', label: 'Head' },
  { value: 'cxo', label: 'C-level' },
];

const gradeLabel = (g: Grade | null) => GRADES.find((x) => x.value === g)?.label ?? '—';

export function ProfileScreen() {
  const { data: meData, loading, error, reload } = useAsync((api) => api.profile.me(), []);
  const updateM = useMutation((api, patch: Partial<User>) => api.profile.updateMe(patch));
  const updatePrivacyM = useMutation((api, patch: Partial<PrivacySettings>) =>
    api.profile.updatePrivacy(patch),
  );

  const [activeTab, setActiveTab] = useState<'intro' | 'interests'>('intro');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (meData) setDraft(meData);
  }, [meData]);

  if (loading || !draft) return <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>;
  if (error) return <div className="p-10 text-center text-red-500 text-sm">{error.message}</div>;

  const u = isEditing ? draft : meData!;

  const handleSave = async () => {
    if (!draft) return;
    await updateM.run({
      fullName: draft.fullName,
      company: draft.company,
      position: draft.position,
      industry: draft.industry,
      grade: draft.grade,
      wantToTalkAbout: draft.wantToTalkAbout,
      description: draft.description,
      interests: draft.interests,
      photoUrl: draft.photoUrl,
      contacts: draft.contacts,
    });
    setIsEditing(false);
    reload();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDraft((d) => (d ? { ...d, photoUrl: reader.result as string } : d));
    };
    reader.readAsDataURL(file);
  };

  const setPrivacy = async (patch: Partial<PrivacySettings>) => {
    await updatePrivacyM.run(patch);
    reload();
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-blue-600 to-blue-700"></div>
        <div className="px-4 pb-6">
          <div className="relative -mt-16 mb-4">
            <button
              onClick={() => isEditing && fileInputRef.current?.click()}
              className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg relative group"
            >
              {u.photoUrl && <img src={u.photoUrl} alt="Profile" className="w-full h-full object-cover" />}
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
              onClick={() => {
                if (isEditing) {
                  setDraft(meData!);
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
                  value={draft.fullName}
                  onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={draft.company ?? ''}
                  onChange={(e) => setDraft({ ...draft, company: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draft.position ?? ''}
                    onChange={(e) => setDraft({ ...draft, position: e.target.value || null })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Position"
                  />
                  <input
                    type="text"
                    value={draft.industry ?? ''}
                    onChange={(e) => setDraft({ ...draft, industry: e.target.value || null })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Industry"
                  />
                </div>
                <select
                  value={draft.grade ?? ''}
                  onChange={(e) => setDraft({ ...draft, grade: (e.target.value || null) as Grade | null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select grade…</option>
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <h1 className="font-bold text-2xl mb-1">{u.fullName}</h1>
                <p className="text-gray-600 mb-1">{u.company ?? '—'}</p>
                <p className="text-gray-600 text-sm">
                  {u.position ?? '—'} | {u.industry ?? '—'}
                </p>
                <div className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full mt-2 font-medium">
                  {gradeLabel(u.grade)}
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={updateM.loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold mb-4 disabled:opacity-50"
            >
              {updateM.loading ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border-y border-gray-100 mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab('intro')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'intro' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Intro
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'interests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Interests
          </button>
        </div>
      </div>

      {activeTab === 'intro' && (
        <div className="px-4 space-y-4 pb-6">
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Want to talk about</h3>
            {isEditing ? (
              <textarea
                value={draft.wantToTalkAbout ?? ''}
                onChange={(e) => setDraft({ ...draft, wantToTalkAbout: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="What do you want to talk about?"
              />
            ) : (
              <p className="text-gray-800">{u.wantToTalkAbout ?? '—'}</p>
            )}
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h3>
            {isEditing ? (
              <textarea
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Tell us about yourself"
              />
            ) : (
              <p className="text-gray-800">{u.description ?? '—'}</p>
            )}
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contacts</h3>
            <div className="space-y-3">
              <ContactRow
                Icon={Mail}
                label="Email"
                value={u.contacts.email}
                isEditing={isEditing}
                onChange={(v) => setDraft({ ...draft, contacts: { ...draft.contacts, email: v } })}
              />
              <ContactRow
                Icon={Linkedin}
                label="LinkedIn"
                value={u.contacts.linkedin}
                isEditing={isEditing}
                onChange={(v) => setDraft({ ...draft, contacts: { ...draft.contacts, linkedin: v } })}
              />
              <ContactRow
                Icon={MessageSquare}
                label="Telegram"
                value={u.contacts.telegram}
                isEditing={isEditing}
                onChange={(v) => setDraft({ ...draft, contacts: { ...draft.contacts, telegram: v } })}
              />
            </div>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold">Privacy Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-700 mb-2 block">Profile visibility in Match tab</label>
                <select
                  value={u.privacy.matchVisibility}
                  onChange={(e) => setPrivacy({ matchVisibility: e.target.value as 'all' | 'liked' })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All participants</option>
                  <option value="liked">Only people I liked</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">Who can message me</label>
                <select
                  value={u.privacy.whoCanWrite}
                  onChange={(e) =>
                    setPrivacy({
                      whoCanWrite: e.target.value as PrivacySettings['whoCanWrite'],
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All participants</option>
                  <option value="liked-or-match">Liked or Matched</option>
                  <option value="match-only">Only Matches</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-2 block">Who can see my contacts</label>
                <select
                  value={u.privacy.contactVisibility}
                  onChange={(e) =>
                    setPrivacy({
                      contactVisibility: e.target.value as PrivacySettings['contactVisibility'],
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All participants</option>
                  <option value="liked-or-match">Liked or Matched</option>
                  <option value="match-only">Only Matches</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'interests' && (
        <div className="px-4 pb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">My Interests</h3>
              <span className="text-sm text-gray-500">{u.interests.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.interests.map((interest) => (
                <span
                  key={interest}
                  className={`bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                    isEditing ? 'pr-2' : ''
                  }`}
                >
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() =>
                        setDraft({
                          ...draft,
                          interests: draft.interests.filter((i) => i !== interest),
                        })
                      }
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
                    const v = e.currentTarget.value.trim();
                    if (!draft.interests.includes(v)) {
                      setDraft({ ...draft, interests: [...draft.interests, v] });
                    }
                    e.currentTarget.value = '';
                  }
                }}
              />
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 bg-blue-50 text-blue-600 py-2.5 rounded-lg font-medium text-sm"
              >
                + Add more interests
              </button>
            )}
          </div>

          {u.interests.length < MIN_INTERESTS_FOR_MATCH && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Note:</span> You need at least{' '}
                {MIN_INTERESTS_FOR_MATCH} interests to unlock the Match tab and start discovering relevant
                connections. ({u.interests.length}/{MIN_INTERESTS_FOR_MATCH})
              </p>
            </div>
          )}
        </div>
      )}
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
  value: string | null;
  isEditing: boolean;
  onChange: (v: string | null) => void;
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
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-gray-800 font-medium truncate">{value ?? '—'}</p>
        )}
      </div>
    </div>
  );
}
