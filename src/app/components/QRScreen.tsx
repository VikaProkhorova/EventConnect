import { useState } from 'react';
import { Share2, Download, Camera } from 'lucide-react';

export function QRScreen() {
  const [activeTab, setActiveTab] = useState<'mycode' | 'scan'>('mycode');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white px-4 py-3 border-b">
        <h1 className="font-bold text-xl mb-3">QR Code</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('mycode')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'mycode'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            My Code
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'scan'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
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
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200"
                  alt="Your profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="font-bold text-xl mb-1">John Doe</h2>
              <p className="text-gray-600 text-sm">Software Engineer | Microsoft</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-4 border-gray-100">
              <QRCodeSVG
                value="https://eventconnect.app/user/johndoe123"
                size={200}
                level="H"
                className="w-full h-auto"
              />
            </div>

            <p className="text-center text-gray-500 text-xs mt-4">
              Let others scan this code to connect with you
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="flex items-center gap-2 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 font-medium text-sm">
              <Share2 className="w-4 h-4" />
              Share
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

          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">Scan QR Code</h3>
            <p className="text-gray-600 text-sm max-w-xs mx-auto">
              Point your camera at someone's QR code to instantly connect with them
            </p>
          </div>

          <button className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold">
            Open Camera
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Visual placeholder for a real QR payload. Imitates the structural
 * features of a proper code (3 finder patterns, timing rows, an
 * alignment pattern, deterministic data fill) so it scans like a code
 * to the eye, but does not encode `value` for real readers.
 *
 * Production should swap this for `qrcode.react` or similar.
 */
function QRCodeSVG({ value, className }: { value: string; size: number; level: string; className?: string }) {
  const N = 29; // module count (~Version 3)
  const QUIET = 2; // quiet-zone modules on each side
  const TOTAL = N + QUIET * 2;

  // Mulberry32 — small, well-distributed deterministic PRNG.
  let seed = 0x9e3779b9 ^ value.length;
  for (let i = 0; i < value.length; i++) {
    seed = Math.imul(seed ^ value.charCodeAt(i), 0x85ebca6b);
    seed = (seed << 13) | (seed >>> 19);
  }
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // dark[r][c] is true when that module is dark; reserved keeps
  // structural cells out of the random fill.
  const dark: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
  const reserved: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const onOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const onInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        dark[r0 + dr][c0 + dc] = onOuter || onInner;
        reserved[r0 + dr][c0 + dc] = true;
      }
    }
    // 1-module separator around finder (kept white but reserved)
    for (let d = -1; d <= 7; d++) {
      const cells: Array<[number, number]> = [
        [r0 - 1, c0 + d], [r0 + 7, c0 + d],
        [r0 + d, c0 - 1], [r0 + d, c0 + 7],
      ];
      for (const [r, c] of cells) {
        if (r >= 0 && r < N && c >= 0 && c < N) reserved[r][c] = true;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, N - 7);
  drawFinder(N - 7, 0);

  // Timing patterns (row 6 and column 6, alternating dark/light).
  for (let i = 8; i < N - 8; i++) {
    dark[6][i] = i % 2 === 0;
    reserved[6][i] = true;
    dark[i][6] = i % 2 === 0;
    reserved[i][6] = true;
  }

  // Alignment pattern (single 5x5 near bottom-right, like Version 3).
  const ar = N - 9, ac = N - 9;
  for (let dr = 0; dr < 5; dr++) {
    for (let dc = 0; dc < 5; dc++) {
      const onOuter = dr === 0 || dr === 4 || dc === 0 || dc === 4;
      const center = dr === 2 && dc === 2;
      dark[ar + dr][ac + dc] = onOuter || center;
      reserved[ar + dr][ac + dc] = true;
    }
  }

  // Format-info strip (reserved as a band — kept white).
  for (let i = 0; i < 8; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
    reserved[8][N - 1 - i] = true;
    reserved[N - 1 - i][8] = true;
  }
  // The "dark module" required by spec (next to bottom-left finder).
  dark[N - 8][8] = true;
  reserved[N - 8][8] = true;

  // Fill remaining modules pseudo-randomly at ~48% density.
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (!reserved[r][c]) dark[r][c] = rand() < 0.48;
    }
  }

  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (dark[r][c]) cells.push({ r, c });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${TOTAL} ${TOTAL}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code"
    >
      <rect width={TOTAL} height={TOTAL} fill="white" />
      <g fill="#0F172A">
        {cells.map(({ r, c }) => (
          <rect key={`${r}-${c}`} x={c + QUIET} y={r + QUIET} width={1} height={1} />
        ))}
      </g>
    </svg>
  );
}