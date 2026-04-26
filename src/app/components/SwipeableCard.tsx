/**
 * Lightweight pointer-based swipe wrapper for Participants > Matches deck.
 * Right swipe → onLike, left swipe → onHide. Internal button clicks still
 * work (we suppress only the synthetic click that follows an actual drag).
 *
 * Move/up listeners are attached to `document` rather than the card, so
 * the swipe keeps tracking even when the finger lands on (or drifts over)
 * an inner button — `setPointerCapture` is flaky on mobile across nested
 * interactive elements.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Heart, X } from 'lucide-react';

const DRAG_THRESHOLD = 70;     // px to commit on slow drag
const FLICK_VELOCITY = 0.5;    // px/ms — fast flick commits even if shorter
const FLICK_MIN_DISTANCE = 25; // px — but flick still has to *go* somewhere
const TAP_THRESHOLD = 6;       // px under this counts as a tap, not a drag

export function SwipeableCard({
  children,
  onLike,
  onHide,
}: {
  children: ReactNode;
  onLike?: () => void;
  onHide?: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startTime = useRef(0);
  const wasDragged = useRef(false);
  const activePointerId = useRef<number | null>(null);

  // Cleanup any stragglers if component unmounts mid-drag.
  useEffect(() => () => {
    activePointerId.current = null;
  }, []);

  const finish = (finalDx: number, dtMs: number) => {
    setDragX(0);
    setIsDragging(false);
    activePointerId.current = null;

    const velocity = dtMs > 0 ? finalDx / dtMs : 0;
    const isFlick = Math.abs(velocity) >= FLICK_VELOCITY && Math.abs(finalDx) >= FLICK_MIN_DISTANCE;

    if (finalDx > DRAG_THRESHOLD || (isFlick && finalDx > 0)) {
      onLike?.();
    } else if (finalDx < -DRAG_THRESHOLD || (isFlick && finalDx < 0)) {
      onHide?.();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (activePointerId.current !== null) return; // ignore extra fingers

    activePointerId.current = e.pointerId;
    startX.current = e.clientX;
    startTime.current = performance.now();
    wasDragged.current = false;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId.current) return;
      const dx = ev.clientX - startX.current;
      if (Math.abs(dx) > TAP_THRESHOLD) {
        wasDragged.current = true;
        setIsDragging(true);
      }
      setDragX(dx);
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId.current) return;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      const finalDx = ev.clientX - startX.current;
      const dt = performance.now() - startTime.current;
      finish(finalDx, dt);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  };

  // Drags that exceeded TAP_THRESHOLD shouldn't trigger child onClicks.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      wasDragged.current = false;
    }
  };

  return (
    <div className="relative">
      {/* Like/Hide hint badges that appear during the drag */}
      {dragX > 25 && (
        <div className="absolute top-6 left-6 z-30 px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center gap-1 rotate-[-12deg] shadow-lg pointer-events-none">
          <Heart className="w-4 h-4 fill-white" /> LIKE
        </div>
      )}
      {dragX < -25 && (
        <div className="absolute top-6 right-6 z-30 px-3 py-1.5 rounded-full bg-gray-700 text-white font-bold text-sm flex items-center gap-1 rotate-[12deg] shadow-lg pointer-events-none">
          <X className="w-4 h-4" /> HIDE
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        style={{
          transform: `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`,
          transition: isDragging ? 'none' : 'transform 0.25s ease-out',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}
