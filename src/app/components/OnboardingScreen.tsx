import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Sparkles,
  QrCode,
  Radio,
  ArrowRight,
  MapPin,
  X,
} from 'lucide-react';
import { markOnboardingComplete, setGeoOptIn } from './authStore';

/**
 * 3-step onboarding (SOW §4.15 step 5):
 *   1. Smart matching pitch
 *   2. QR-based IRL connect
 *   3. Geolocation consent for Network in Real Life
 *
 * Tap "Get started" on the final slide → mark onboarded → /events.
 */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromSetup = searchParams.get('from') === 'setup';
  // After the test flow we want to land directly inside Tech Summit;
  // any other entrypoint (re-running onboarding from settings, etc.)
  // goes back to the events list.
  const onboardingDest = fromSetup ? '/event/1/home' : '/events';
  const [step, setStep] = useState(0);

  const slides = [
    {
      icon: <Sparkles className="w-10 h-10 text-white" />,
      iconBg: 'bg-blue-600',
      title: 'Find people who get you',
      body:
        'We use your role, interests and what you want to talk about to recommend a small set of people worth meeting — not a giant list.',
    },
    {
      icon: <QrCode className="w-10 h-10 text-white" />,
      iconBg: 'bg-purple-600',
      title: 'Connect IRL with one scan',
      body:
        'Met someone interesting? Scan their QR. You\'ll both see each other\'s profile and can save the contact instantly.',
    },
    {
      icon: <Radio className="w-10 h-10 text-white" />,
      iconBg: 'bg-pink-600',
      title: 'See who\'s nearby',
      body:
        'Network in Real Life shows where conversations are happening at the venue. Drop a mark, join a circle, or just discover who\'s around.',
      askGeo: true,
    },
  ];

  const isLast = step === slides.length - 1;
  const slide = slides[step];

  const handleGeo = (granted: boolean) => {
    setGeoOptIn(granted ? 'granted' : 'denied');
  };

  const handlePrimary = () => {
    if (isLast) {
      markOnboardingComplete();
      navigate(onboardingDest);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
    navigate(onboardingDest);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white">
      {/* Skip / close */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1 text-sm text-gray-500 font-medium"
        >
          Skip
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Hero slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-md mx-auto w-full text-center">
        <div
          className={`w-20 h-20 rounded-2xl ${slide.iconBg} flex items-center justify-center shadow-lg mb-8`}
        >
          {slide.icon}
        </div>

        <h1 className="font-bold text-2xl text-gray-900 mb-3">{slide.title}</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-8">{slide.body}</p>

        {slide.askGeo && (
          <div className="w-full bg-pink-50 border border-pink-200 rounded-xl p-4 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-pink-600" />
              <p className="font-semibold text-sm text-pink-900">Allow location access?</p>
            </div>
            <p className="text-xs text-pink-700 mb-3">
              Used only at the venue, only during the event, and only when you open the
              Network in Real Life tab. You can change this any time.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleGeo(false)}
                className="flex-1 py-2 rounded-lg border border-pink-300 text-pink-700 font-medium text-sm"
              >
                Not now
              </button>
              <button
                onClick={() => handleGeo(true)}
                className="flex-1 py-2 rounded-lg bg-pink-600 text-white font-semibold text-sm"
              >
                Allow
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step dots + primary CTA */}
      <div className="px-8 pb-8 max-w-md mx-auto w-full">
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-8 bg-blue-600' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handlePrimary}
          className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
        >
          {isLast ? 'Get started' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
