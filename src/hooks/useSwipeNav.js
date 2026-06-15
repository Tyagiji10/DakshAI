import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptic } from '../lib/haptics';

/**
 * useSwipeNav
 *
 * Attaches horizontal swipe gesture detection to a given ref element.
 * - Mobile / tablet only (≤ 1023px)
 * - Cancels if vertical scroll intent is detected first
 * - Requires minimum distance (50px) AND velocity (0.3 px/ms) to fire
 * - Fires haptic feedback and triggers React Router navigation
 *
 * @param {React.RefObject} containerRef  The element to listen on (main-content)
 * @param {string[]}        routes        Ordered list of route paths from bottom nav
 * @param {object}          [options]
 * @param {number}          [options.minDistance=50]     Min px before accepting swipe
 * @param {number}          [options.minVelocity=0.3]   Min px/ms before accepting
 * @param {number}          [options.lockAngle=30]      Degrees — if swipe angle is
 *                                                       more vertical than this,
 *                                                       treat as scroll, not swipe
 */
export function useSwipeNav(containerRef, routes, {
  minDistance = 50,
  minVelocity = 0.3,
  lockAngle = 30,
} = {}) {
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  // Mutable refs — no re-renders during gesture
  const touchStart  = useRef(null);   // { x, y, t }
  const intentRef   = useRef(null);   // 'horizontal' | 'vertical' | null
  const isDesktop   = useRef(false);

  // Update desktop flag on resize
  useEffect(() => {
    const check = () => { isDesktop.current = window.innerWidth >= 1024; };
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (isDesktop.current) return;
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    intentRef.current  = null;   // reset for each new gesture
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (isDesktop.current || !touchStart.current) return;

    const t  = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    // Lock intent once we've moved enough to be sure of direction
    if (intentRef.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      const angle = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI);
      // angle=0 → perfectly horizontal, angle=90 → perfectly vertical
      intentRef.current = angle > lockAngle ? 'vertical' : 'horizontal';
    }

    // If horizontal swipe is confirmed, prevent the scroll event so the page
    // doesn't simultaneously scroll while we're computing the swipe
    if (intentRef.current === 'horizontal') {
      e.preventDefault();
    }
  }, [lockAngle]);

  const handleTouchEnd = useCallback((e) => {
    if (isDesktop.current || !touchStart.current || intentRef.current !== 'horizontal') {
      touchStart.current = null;
      return;
    }

    const t        = e.changedTouches[0];
    const dx       = t.clientX - touchStart.current.x;
    const elapsed  = Date.now() - touchStart.current.time;
    const velocity = Math.abs(dx) / elapsed;

    touchStart.current = null;

    if (Math.abs(dx) < minDistance || velocity < minVelocity) return;

    // Find current page in route list
    const currentIdx = routes.findIndex(r => pathname.startsWith(r));
    if (currentIdx === -1) return;

    // dx < 0 → swipe left  → go to NEXT page
    // dx > 0 → swipe right → go to PREV page
    const targetIdx = dx < 0 ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx < 0 || targetIdx >= routes.length) return;

    haptic.light();
    navigate(routes[targetIdx]);
  }, [minDistance, minVelocity, routes, pathname, navigate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // passive: false needed on touchmove so e.preventDefault() works
    el.addEventListener('touchstart',  handleTouchStart, { passive: true });
    el.addEventListener('touchmove',   handleTouchMove,  { passive: false });
    el.addEventListener('touchend',    handleTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener('touchstart',  handleTouchStart);
      el.removeEventListener('touchmove',   handleTouchMove);
      el.removeEventListener('touchend',    handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
