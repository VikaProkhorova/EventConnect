import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { setLoggedIn } from './authStore';
import { isProfileGateOpen } from './myProfileStore';

/**
 * Magic-link login (SOW §4.15).
 *
 * Real product: organizer imports attendee emails, attendee receives a
 * one-time link. For the prototype, any email accepts; tapping
 * "Send magic link" simulates email delivery, then "Open the link"
 * completes login and routes to onboarding (first time) or /events.
 */
export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);

  const validEmail = /\S+@\S+\.\S+/.test(email);

  const handleSendLink = () => {
    if (!validEmail) return;
    setLinkSent(true);
  };

  const handleConsumeLink = () => {
    setLoggedIn(email);
    // Test flow: empty account → straight to profile setup. Returning users
    // with a complete profile skip past it to /events.
    if (!isProfileGateOpen()) {
      navigate('/me?setup=1');
    } else {
      navigate('/events');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Brand */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-sm mx-auto w-full">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-bold text-2xl text-gray-900 mb-2 text-center">EventConnect</h1>
        <p className="text-sm text-gray-600 text-center mb-8">
          Professional networking for live events. Smart matching, real-time
          proximity, structured follow-up.
        </p>

        {!linkSent ? (
          <div className="w-full">
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Email used at registration
            </label>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendLink();
                }}
                placeholder="you@company.com"
                className="w-full h-12 pl-10 pr-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={handleSendLink}
              disabled={!validEmail}
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Send magic link
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              We'll email you a one-time sign-in link. No password required.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-sm text-green-800">Check your inbox</p>
              </div>
              <p className="text-xs text-green-700">
                Magic link sent to <span className="font-semibold">{email}</span>.
                Open it to finish signing in.
              </p>
            </div>
            <button
              onClick={handleConsumeLink}
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              Open the link (demo)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLinkSent(false)}
              className="w-full mt-2 h-10 text-sm text-gray-600 font-medium"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 pb-6">
        Each link is one-time-use and bound to one device.
      </p>
    </div>
  );
}
