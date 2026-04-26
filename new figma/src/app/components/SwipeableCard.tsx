/**
 * Lightweight pointer-based swipe wrapper for Participants > Matches deck.
 * Right swipe → onLike, left swipe → onHide. Internal button clicks still
 * work (we suppress only the synthetic click that follows an actual drag).
 */

import { useRef, useState, type ReactNode } from 'react';
import { Heart, X } from 'lucide-react';

const DRAG_THRESHOLD = 100; // px to commit a swipe
const TAP_THRESHOLD = 5; // px below this counts as a tap, not a drag

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
  const wasDragged = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // primary button only
    startX.current = e.clientX;
    wasDragged.current = false;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore capture errors */
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > TAP_THRESHOLD) {
      wasDragged.current = true;
      setIsDragging(true);
    }
    setDragX(dx);
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    const final = dragX;
    setDragX(0);
    setIsDragging(false);
    if (final > DRAG_THRESHOLD) onLike?.();
    else if (final < -DRAG_THRESHOLD) onHide?.();
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
      {dragX > 30 && (
        <div className="absolute top-6 left-6 z-30 px-3 py-1.5 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center gap-1 rotate-[-12deg] shadow-lg pointer-events-none">
          <Heart className="w-4 h-4 fill-white" /> LIKE
        </div>
      )}
      {dragX < -30 && (
        <div className="absolute top-6 right-6 z-30 px-3 py-1.5 rounded-full bg-gray-700 text-white font-bold text-sm flex items-center gap-1 rotate-[12deg] shadow-lg pointer-events-none">
          <X className="w-4 h-4" /> HIDE
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
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
