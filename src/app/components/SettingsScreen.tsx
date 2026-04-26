import { ArrowLeft, Globe, Bell, LogOut, Trash2, HelpCircle, ChevronRight, Shield, Users, Heart, UserCheck, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useState } from 'react';
import {
  clearAllUserData,
  getAppLanguage,
  getNotificationToggles,
  getPrivacySettings,
  LANGUAGE_OPTIONS,
  setAppLanguage,
  setNotificationToggles,
  setPrivacySettings,
  type AppLanguage,
  type NotificationToggles,
  type PrivacySettings,
} from './settingsStore';
import { useEventPeriod, type EventPeriod } from './eventPeriodContext';

const PERIOD_OPTIONS: { value: EventPeriod; label: string }[] = [
  { value: 'before', label: 'Pre-Event' },
  { value: 'during', label: 'Live' },
  { value: 'after', label: 'Post-Event' },
];

const NOTIFICATION_LABELS: { key: keyof NotificationToggles; title: string; subtitle: string }[] = [
  { key: 'chat', title: 'New chat messages', subtitle: 'When someone sends you a message' },
  { key: 'match', title: 'Mutual matches', subtitle: 'When you and someone match' },
  { key: 'meetingReminder', title: 'Meeting reminders', subtitle: '10 min before each meeting' },
  { key: 'breakNetworking', title: 'Network in Real Life nudges', subtitle: 'During session breaks' },
  { key: 'engagementNudge', title: 'Engagement nudges', subtitle: '"Ready to meet someone new?"' },
];

export function SettingsScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [language, setLanguage] = useState<AppLanguage>(() => getAppLanguage());
  const [notifications, setNotifications] = useState<NotificationToggles>(() => getNotificationToggles());
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => getPrivacySettings());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { period, setPeriod } = useEventPeriod();

  const updatePrivacy = (patch: Partial<PrivacySettings>) => {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    setPrivacySettings(next);
  };

  const updateLanguage = (v: AppLanguage) => {
    setLanguage(v);
    setAppLanguage(v);
  };

  const toggleNotification = (key: keyof NotificationToggles) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setNotificationToggles(next);
  };

  const handleLogout = () => {
    clearAllUserData();
    navigate('/login');
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    clearAllUserData();
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-4 border-b flex items-center gap-3">
        <button onClick={() => navigate(`/event/${eventId}/profile`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-xl">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Event lifecycle (demo) — toggles what's available across the app */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-base">Event lifecycle (demo)</h2>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                  period === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Toggles what's available across the app: Network in Real Life, Match deck, RSVP, etc.
          </p>
        </section>

        {/* Language */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-base">App language</h2>
          </div>
          <div className="space-y-1">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateLanguage(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  language === opt.value
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{opt.label}</span>
                {language === opt.value && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-purple-600" />
            <h2 className="font-semibold text-base">Privacy</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Profile visibility in Match tab
              </label>
              <div className="space-y-1.5">
                <PrivacyOption
                  Icon={Users}
                  label="All participants"
                  active={privacy.matchVisibility === 'all'}
                  onClick={() => updatePrivacy({ matchVisibility: 'all' })}
                />
                <PrivacyOption
                  Icon={Heart}
                  label="Only people I liked"
                  active={privacy.matchVisibility === 'liked'}
                  onClick={() => updatePrivacy({ matchVisibility: 'liked' })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Who can message me
              </label>
              <div className="space-y-1.5">
                <PrivacyOption
                  Icon={Users}
                  label="All participants"
                  active={privacy.whoCanMessage === 'all'}
                  onClick={() => updatePrivacy({ whoCanMessage: 'all' })}
                />
                <PrivacyOption
                  Icon={Heart}
                  label="Liked or Matched"
                  active={privacy.whoCanMessage === 'liked-match'}
                  onClick={() => updatePrivacy({ whoCanMessage: 'liked-match' })}
                />
                <PrivacyOption
                  Icon={UserCheck}
                  label="Only Matches"
                  active={privacy.whoCanMessage === 'match'}
                  onClick={() => updatePrivacy({ whoCanMessage: 'match' })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Who can see my contacts
              </label>
              <div className="space-y-1.5">
                <PrivacyOption
                  Icon={Users}
                  label="All participants"
                  active={privacy.contactVisibility === 'all'}
                  onClick={() => updatePrivacy({ contactVisibility: 'all' })}
                />
                <PrivacyOption
                  Icon={Heart}
                  label="Liked or Matched"
                  active={privacy.contactVisibility === 'liked-match'}
                  onClick={() => updatePrivacy({ contactVisibility: 'liked-match' })}
                />
                <PrivacyOption
                  Icon={UserCheck}
                  label="Only Matches"
                  active={privacy.contactVisibility === 'match'}
                  onClick={() => updatePrivacy({ contactVisibility: 'match' })}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <h2 className="font-semibold text-base">Notifications</h2>
          </div>
          <ul className="divide-y divide-gray-100 -my-2">
            {NOTIFICATION_LABELS.map((n) => (
              <li key={n.key} className="flex items-center justify-between py-3">
                <div className="flex-1 pr-4 min-w-0">
                  <p className="text-sm text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.subtitle}</p>
                </div>
                <Toggle
                  on={notifications[n.key]}
                  onChange={() => toggleNotification(n.key)}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Account */}
        <section className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-base mb-3">Account</h2>
          <div className="space-y-1">
            <a
              href="mailto:hello@techsummit2026.com"
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-gray-500" />
                Support / help
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-gray-500" />
                Log out
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              onClick={handleDelete}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium ${
                confirmDelete ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Trash2 className="w-4 h-4" />
                {confirmDelete ? 'Tap again to confirm' : 'Delete account'}
              </span>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 pt-2">
          EventConnect prototype · v0.1
        </p>
      </div>
    </div>
  );
}

function PrivacyOption({
  Icon,
  label,
  active,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors border-2 flex items-center gap-2 ${
        active
          ? 'border-blue-600 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
        on ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
