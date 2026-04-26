import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Share2, Download, Camera } from 'lucide-react';
import { useAsync, useMutation } from '@/api/provider';
import type { EventId } from '@/domain/types';

export function QRScreen() {
  const navigate = useNavigate();
  const { eventId: eventIdParam } = useParams();
  const eventId = (eventIdParam ?? '') as EventId;

  const [activeTab, setActiveTab] = useState<'mycode' | 'scan'>('mycode');

  const me = useAsync((api) => api.profile.me(), []);
  const myQr = useAsync((api) => api.qr.getMyPayload(eventId), [eventId]);

  const resolveM = useMutation((api, payload: string) => api.qr.resolveScan(eventId, payload));
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

  const handleResolve = async () => {
    setScanError(null);
    try {
      const user = await resolveM.run(scanInput.trim());
      navigate(`/event/${eventId}/user/${user.id}`);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-3 border-b">
        <h1 className="font-bold text-xl mb-3">QR Code</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('mycode')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'mycode' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            My Code
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'scan' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Scan
          </button>
        </div>
      </div>

      {activeTab === 'mycode' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mx-auto mb-4 overflow-hidden">
                {me.data?.photoUrl && (
                  <img
                    src={me.data.photoUrl}
                    alt="Your profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <h2 className="font-bold text-xl mb-1">{me.data?.fullName ?? '—'}</h2>
              <p className="text-gray-600 text-sm">
                {me.data?.position ?? '—'} | {me.data?.company ?? '—'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-4 border-gray-100">
              {myQr.data ? (
                <PseudoQR value={myQr.data.payload} />
              ) : (
                <div className="aspect-square bg-gray-50 rounded animate-pulse" />
              )}
            </div>

            <p className="text-center text-gray-500 text-xs mt-4">
              Let others scan this code to connect with you
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                if (myQr.data) navigator.clipboard?.writeText(myQr.data.payload);
              }}
              className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 font-medium text-sm"
            >
              <Share2 className="w-4 h-4" />
              Copy
            </button>
            <button className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 font-medium text-sm">
              <Download className="w-4 h-4" />
              Save to photos
            </button>
          </div>
        </div>
      )}

      {activeTab === 'scan' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm aspect-square bg-gray-900 rounded-3xl overflow-hidden relative mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-white rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
              </div>
            </div>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Camera className="w-16 h-16 text-white/50" />
            </div>
          </div>

          <div className="text-center w-full max-w-sm">
            <h3 className="font-semibold text-lg mb-2">Scan QR Code</h3>
            <p className="text-gray-600 text-sm mx-auto mb-4">
              In the app this opens the camera. For the prototype, paste a QR payload below.
            </p>
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="ec://event/.../user/..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            {scanError && <p className="text-xs text-red-600 mb-2">{scanError}</p>}
            <button
              onClick={handleResolve}
              disabled={resolveM.loading || !scanInput.trim()}
              className="w-full bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              {resolveM.loading ? 'Resolving…' : 'Resolve scan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Deterministic visual QR placeholder. Production uses `qrcode.react`
 * or similar to render the real `payload`.
 */
function PseudoQR({ value }: { value: string }) {
  const N = 25;
  // Simple hash → pseudo-random grid that's stable for a given value.
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) & 0xffffffff;
  }
  const cells: boolean[] = [];
  for (let i = 0; i < N * N; i++) {
    h = (h * 1103515245 + 12345) & 0xffffffff;
    cells.push((h >>> 16) & 1 ? true : false);
  }
  return (
    <svg viewBox={`0 0 ${N * 8} ${N * 8}`} className="w-full h-auto">
      <rect width={N * 8} height={N * 8} fill="white" />
      <g fill="black">
        {cells.map((on, i) =>
          on ? (
            <rect key={i} x={(i % N) * 8} y={Math.floor(i / N) * 8} width={7} height={7} />
          ) : null,
        )}
        <rect x={8} y={8} width={56} height={56} fill="none" stroke="black" strokeWidth={8} />
        <rect x={24} y={24} width={24} height={24} />
        <rect x={N * 8 - 64} y={8} width={56} height={56} fill="none" stroke="black" strokeWidth={8} />
        <rect x={N * 8 - 48} y={24} width={24} height={24} />
        <rect x={8} y={N * 8 - 64} width={56} height={56} fill="none" stroke="black" strokeWidth={8} />
        <rect x={24} y={N * 8 - 48} width={24} height={24} />
      </g>
    </svg>
  );
}
