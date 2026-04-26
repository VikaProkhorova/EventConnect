import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { useState } from 'react';

type Feedback = {
  rating: number; // 1-5 stars
  enjoyed: string;
  improve: string;
  recommend: number; // 0-10 NPS
  submittedAt: string;
};

const FEEDBACK_KEY = 'eventFeedback';

function readFeedback(): Feedback | null {
  try {
    const raw = sessionStorage.getItem(FEEDBACK_KEY);
    return raw ? (JSON.parse(raw) as Feedback) : null;
  } catch {
    return null;
  }
}

export function FeedbackScreen() {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const existing = readFeedback();
  const [submitted, setSubmitted] = useState<boolean>(!!existing);

  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [enjoyed, setEnjoyed] = useState<string>(existing?.enjoyed ?? '');
  const [improve, setImprove] = useState<string>(existing?.improve ?? '');
  const [recommend, setRecommend] = useState<number>(existing?.recommend ?? 8);

  const canSubmit = rating > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const fb: Feedback = {
      rating,
      enjoyed: enjoyed.trim(),
      improve: improve.trim(),
      recommend,
      submittedAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb));
    } catch {
      /* ignore */
    }
    setSubmitted(true);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-4 border-b flex items-center gap-3">
        <button onClick={() => navigate(`/event/${eventId}/home`)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-xl">Event feedback</h1>
      </div>

      {submitted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-bold text-xl text-gray-900 mb-2">Thanks for sharing</h2>
          <p className="text-sm text-gray-600 max-w-xs mb-6">
            The organizers read every response — your input shapes the next event.
          </p>
          <button
            onClick={() => navigate(`/event/${eventId}/home`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-gray-600">
            How was Tech Summit 2026? A quick 30-second survey would help the organizers a lot.
          </p>

          {/* Star rating */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Overall, how was the event?
            </h3>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  className="p-1"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      n <= rating ? 'fill-amber-400 text-amber-500' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-xs text-gray-500 mt-2">
                {rating === 5 ? 'Loved it!' : rating === 4 ? 'Great' : rating === 3 ? 'OK' : rating === 2 ? 'Below expectations' : 'Disappointing'}
              </p>
            )}
          </section>

          {/* Enjoyed most */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
              What did you enjoy most?
            </label>
            <textarea
              value={enjoyed}
              onChange={(e) => setEnjoyed(e.target.value)}
              placeholder="Sessions, people you met, vibe…"
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </section>

          {/* What to improve */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 block">
              What could be better next time?
            </label>
            <textarea
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
              placeholder="Logistics, content, networking, app, anything…"
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </section>

          {/* NPS */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              How likely are you to recommend it to a colleague?
            </h3>
            <div className="grid grid-cols-11 gap-1 mb-2">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  onClick={() => setRecommend(n)}
                  className={`h-9 rounded text-xs font-semibold transition-colors ${
                    n === recommend
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Not at all</span>
              <span>Definitely</span>
            </div>
          </section>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit feedback
          </button>
        </div>
      )}
    </div>
  );
}
