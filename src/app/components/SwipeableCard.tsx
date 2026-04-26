/**
 * Lightweight pointer-based swipe wrapper for Participants > Matches deck.
 * Right swipe → onLike, left swipe → onHide. Internal button clicks still
 * work (we suppress only the synthetic click that follows an actual drag).
 *
 * Move/up listeners are attached to `document` rather than the card, so
 * the swipe keeps tracking even when the finger lands on (or drifts over)
 * an inner button — `setPointerCapture` is flaky on mobile across nested
 * interactive elements.
 *
 * On commit, the card animates off-screen first (EXIT_DURATION_MS) before
 * the parent removes it — gives the user a clear "yes, that registered,
 * here comes the next one" beat. New cards animate in on mount.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Heart, X } from 'lucide-react';

const DRAG_THRESHOLD = 70;     // px to commit on slow drag
const FLICK_VELOCITY = 0.5;    // px/ms — fast flick commits even if shorter
const FLICK_MIN_DISTANCE = 25; // px — but flick still has to *go* somewhere
const TAP_THRESHOLD = 6;       // px under this counts as a tap, not a drag
const EXIT_DURATION_MS = 380;  // exit fly-off animation length
const EXIT_DISTANCE = 520;     // px — far enough that the card fully leaves
const SNAPBACK_MS = 220;       // when the drag didn't commit

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
  const [exiting, setExiting] = useState<null | 'like' | 'hide'>(null);
  const [mounted, setMounted] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const wasDragged = useRef(false);
  const activePointerId = useRef<number | null>(null);
  // Axis-lock: locked to 'x' once we know it's a horizontal swipe, 'y' if it
  // turned out to be a vertical scroll. Set on the first ~10px of motion.
  const axisLock = useRef<null | 'x' | 'y'>(null);
  const exitTimer = useRef<number | null>(null);

  // Trigger entrance animation after first paint; cleanup any timers.
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 10);
    return () => {
      window.clearTimeout(id);
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
      activePointerId.current = null;
    };
  }, []);

  const finish = (finalDx: number, dtMs: number) => {
    activePointerId.current = null;
    const velocity = dtMs > 0 ? finalDx / dtMs : 0;
    const isFlick = Math.abs(velocity) >= FLICK_VELOCITY && Math.abs(finalDx) >= FLICK_MIN_DISTANCE;
    const goLike = finalDx > DRAG_THRESHOLD || (isFlick && finalDx > 0);
    const goHide = finalDx < -DRAG_THRESHOLD || (isFlick && finalDx < 0);

    if (goLike || goHide) {
      const dir: 'like' | 'hide' = goLike ? 'like' : 'hide';
      setIsDragging(false);
      setExiting(dir);
      exitTimer.current = window.setTimeout(() => {
        if (dir === 'like') onLike?.();
        else onHide?.();
      }, EXIT_DURATION_MS);
    } else {
      setDragX(0);
      setIsDragging(false);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (activePointerId.current !== null) return;
    if (exiting) return;

    activePointerId.current = e.pointerId;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTime.current = performance.now();
    wasDragged.current = false;
    axisLock.current = null;

    const AXIS_DECIDE_PX = 10; // total movement before we commit to an axis

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId.current) return;
      const dx = ev.clientX - startX.current;
      const dy = ev.clientY - startY.current;

      // Decide axis on the first significant motion. If it's predominantly
      // vertical, we step out and let the browser handle native scroll.
      if (axisLock.current === null) {
        if (Math.hypot(dx, dy) < AXIS_DECIDE_PX) return;
        axisLock.current = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      }
      if (axisLock.current === 'y') return;

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

      // Vertical scroll — clean up but don't commit anything.
      if (axisLock.current === 'y') {
        activePointerId.current = null;
        axisLock.current = null;
        return;
      }

      const finalDx = ev.clientX - startX.current;
      const dt = performance.now() - startTime.current;
      axisLock.current = null;
      finish(finalDx, dt);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (wasDragged.current) {
      e.stopPropagation();
      e.preventDefault();
      wasDragged.current = false;
    }
  };

  /* ───────── Visual state derivation ───────── */

  let transform: string;
  let opacity = 1;
  let transitionMs: number;

  if (exiting === 'like') {
    transform = `translateX(${EXIT_DISTANCE}px) rotate(22deg)`;
    opacity = 0;
    transitionMs = EXIT_DURATION_MS;
  } else if (exiting === 'hide') {
    transform = `translateX(${-EXIT_DISTANCE}px) rotate(-22deg)`;
    opacity = 0;
    transitionMs = EXIT_DURATION_MS;
  } else if (!mounted) {
    transform = 'translateY(8px) scale(0.96)';
    opacity = 0;
    transitionMs = 0;
  } else if (isDragging) {
    transform = `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`;
    transitionMs = 0;
  } else {
    transform = `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`;
    transitionMs = SNAPBACK_MS;
  }

  // Badge intensity: ramps with drag distance; locks at 1 during exit.
  const likeStrength = exiting === 'like' ? 1 : Math.min(1, Math.max(0, dragX) / DRAG_THRESHOLD);
  const hideStrength = exiting === 'hide' ? 1 : Math.min(1, Math.max(0, -dragX) / DRAG_THRESHOLD);
  const showLike = likeStrength > 0;
  const showHide = hideStrength > 0;

  return (
    <div className="relative">
      {showLike && (
        <div
          className="absolute top-6 left-6 z-30 px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center gap-1 shadow-lg pointer-events-none"
          style={{
            transform: `rotate(-12deg) scale(${0.8 + likeStrength * 0.5})`,
            opacity: 0.5 + likeStrength * 0.5,
            transition: `transform ${EXIT_DURATION_MS}ms ease-out, opacity ${EXIT_DURATION_MS}ms ease-out`,
          }}
        >
          <Heart className="w-4 h-4 fill-white" /> LIKE
        </div>
      )}
      {showHide && (
        <div
          className="absolute top-6 right-6 z-30 px-3 py-1.5 rounded-full bg-gray-700 text-white font-bold text-sm flex items-center gap-1 shadow-lg pointer-events-none"
          style={{
            transform: `rotate(12deg) scale(${0.8 + hideStrength * 0.5})`,
            opacity: 0.5 + hideStrength * 0.5,
            transition: `transform ${EXIT_DURATION_MS}ms ease-out, opacity ${EXIT_DURATION_MS}ms ease-out`,
          }}
        >
          <X className="w-4 h-4" /> HIDE
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        style={{
          transform,
          opacity,
          transition: `transform ${transitionMs}ms cubic-bezier(.22,.9,.32,1), opacity ${transitionMs}ms ease-out`,
          touchAction: 'pan-y',
          pointerEvents: exiting ? 'none' : 'auto',
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </div>
    </div>
  );
}
