import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { haptic } from '../lib/haptics';

/**
 * useSwipeNav — Premium real-time gesture-driven page transitions
 *
 * Architecture:
 *   • ZERO React re-renders during drag — all animation via rAF + direct style mutation
 *   • Spring physics settle (stiffness/damping/mass) with velocity-aware commit detection
 *   • Rolling velocity window sampled with performance.now() for 120 Hz accuracy
 *   • Ghost overlay creates dual-page simultaneous transition (current exits, next enters)
 *   • Gesture state machine: IDLE → LOCKING → DRAGGING → SETTLING
 *   • Hardware-accelerated GPU transforms only (translateX — compositor-thread safe)
 *
 * @param {React.RefObject} mainRef      Scrollable <main> element
 * @param {React.RefObject} stageRef     Clipping wrapper — ghost is appended here
 * @param {React.RefObject} committedRef Set true before navigate() to suppress CSS anim
 * @param {string[]}        routes       Ordered route paths matching BottomNav order
 */
export function useSwipeNav(mainRef, stageRef, committedRef, routes) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ── Stable refs — allow the imperative gesture engine to always see latest values
  //    without needing to be recreated on every render
  const navigateRef = useRef(navigate);
  const pathnameRef = useRef(pathname);
  const routesRef   = useRef(routes);
  const isDesktop   = useRef(false);

  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);
  useEffect(() => { routesRef.current   = routes;   }, [routes]);

  // Desktop detection (swipe nav disabled on ≥ 1024px)
  useEffect(() => {
    const check = () => { isDesktop.current = window.innerWidth >= 1024; };
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Main gesture engine ─────────────────────────────────────────────────────
  // Single effect with local closure state — no React involvement during gesture.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    // ── Tuning constants ────────────────────────────────────────
    const STIFFNESS        = 300;   // spring: px/s² per px of displacement
    const DAMPING          = 30;    // spring: px/s per px/s of velocity
    const MASS             = 1;     // spring: conceptual mass (kg)
    const SETTLE_POS       = 0.8;   // px — position threshold to declare spring done
    const SETTLE_VEL       = 4;     // px/s — velocity threshold to declare spring done
    const COMMIT_RATIO     = 0.35;  // fraction of viewport width → commit
    const COMMIT_VEL       = 0.4;   // px/ms minimum flick velocity → commit
    const VELOCITY_WINDOW  = 80;    // ms — rolling window for velocity sampling
    const LOCK_ANGLE       = 30;    // degrees — beyond this, intent is vertical
    const LOCK_DIST        = 8;     // px — minimum movement before intent is locked

    // ── Closure-local state (mutated imperatively, no re-renders) ─
    let phase        = 'IDLE';  // IDLE | LOCKING | DRAGGING | SETTLING
    let startX       = 0;
    let startY       = 0;
    let samples      = [];      // [{ x, t }] rolling velocity window
    let rafId        = null;
    let ghostEl      = null;
    let dragDx       = 0;
    let swipeDir     = 0;       // -1 = swipe-left (next tab), +1 = swipe-right (prev tab)
    let targetRoute  = '';
    let simpleMode   = false;   // true → prefers-reduced-motion: skip animation

    // ── Spring integrator (Euler–Cromer) ────────────────────────
    // Runs entirely in requestAnimationFrame — never on main thread between frames.
    function runSpring(from, to, initVelPxS, onStep, onDone) {
      let pos  = from;
      let vel  = initVelPxS;
      let last = performance.now();

      function tick(now) {
        // dt capped at 32 ms so a tabbed-away/backgrounded page doesn't spike
        const dt  = Math.min((now - last) / 1000, 0.032);
        last      = now;
        const f   = -STIFFNESS * (pos - to) - DAMPING * vel;
        vel      += (f / MASS) * dt;
        pos      += vel * dt;

        onStep(pos);

        if (Math.abs(pos - to) < SETTLE_POS && Math.abs(vel) < SETTLE_VEL) {
          onStep(to); // snap exactly to target
          onDone();
        } else {
          rafId = requestAnimationFrame(tick);
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    // ── Ghost: absolutely-positioned incoming-page placeholder ──
    function createGhost(dir) {
      const stage = stageRef.current;
      if (!stage) return null;

      const g = document.createElement('div');
      g.className = 'swipe-ghost';

      // Position ghost off-screen on the side it will enter from:
      //   swipe-left  (dir=-1) → ghost enters from RIGHT → start at +vw
      //   swipe-right (dir=+1) → ghost enters from LEFT  → start at -vw
      const vw = window.innerWidth;
      g.style.transform = `translateX(${dir > 0 ? -vw : vw}px)`;
      stage.appendChild(g);
      return g;
    }

    function destroyGhost() {
      if (ghostEl && ghostEl.parentNode) {
        ghostEl.parentNode.removeChild(ghostEl);
      }
      ghostEl = null;
    }

    // ── Apply a single drag offset to the DOM (called inside rAF) ─
    // Both the current page and the ghost move simultaneously —
    // creating the native dual-page transition feel.
    function applyFrame(dx) {
      const main = mainRef.current;
      if (!main) return;

      const vw = window.innerWidth;

      // Rubber-band: pulling past the edge (no adjacent page) gets 15 % resistance
      const wrongDir = (swipeDir < 0 && dx > 0) || (swipeDir > 0 && dx < 0);
      const eff      = wrongDir ? dx * 0.15 : dx;

      // Current page slides out
      main.style.transform = `translateX(${eff}px)`;

      // Ghost (incoming page) slides in from the opposite side
      if (ghostEl) {
        // ghostStart: the initial off-screen offset of the ghost
        //   dir=-1 (swipe-left): ghostStart = +vw  →  vw + eff approaches 0 as eff → -vw
        //   dir=+1 (swipe-right): ghostStart = -vw →  -vw + eff approaches 0 as eff → +vw
        const ghostStart = swipeDir > 0 ? -vw : vw;
        ghostEl.style.transform = `translateX(${ghostStart + eff}px)`;
      }
    }

    // ── Cancel: spring both pages back to rest ───────────────────
    function cancelGesture(initVelPxS) {
      phase = 'SETTLING';
      const startDx = dragDx;

      runSpring(startDx, 0, initVelPxS, applyFrame, () => {
        const main = mainRef.current;
        if (main) {
          main.style.transform = '';
          main.classList.remove('swipe-dragging');
        }
        destroyGhost();
        phase  = 'IDLE';
        dragDx = 0;
      });
    }

    // ── Commit: spring to edge, then trigger navigation ──────────
    // The ghost covers the screen during React's re-render, then fades out
    // revealing the newly rendered page — creating a seamless handoff.
    function commitGesture(initVelPxS) {
      phase = 'SETTLING';

      const vw      = window.innerWidth;
      // Commit target: main exits to -vw (swipe-left) or +vw (swipe-right)
      const target  = swipeDir * vw;
      const route   = targetRoute;
      const ghost   = ghostEl;   // capture ref — ghostEl will be cleared in onDone
      const startDx = dragDx;

      runSpring(startDx, target, initVelPxS, applyFrame, () => {
        // ── Spring complete — transition is visually done ──────
        const main = mainRef.current;
        if (main) {
          main.classList.remove('swipe-dragging');
          // Reset transform now; ghost covers it during React's re-render
          main.style.transform = '';
        }

        // Ghost covers the full viewport so the old page content
        // (briefly at natural position) is hidden while React paints
        if (ghost) {
          ghost.style.transform = 'translateX(0px)';
          ghost.style.zIndex    = '9998'; // above page content, below bottom-nav
        }

        // Detach from applyFrame — future calls won't touch this ghost
        ghostEl = null;
        phase   = 'IDLE';
        dragDx  = 0;

        // Tell Layout to skip the CSS slide-in keyframe for this navigation
        if (committedRef) committedRef.current = true;

        haptic.light();
        navigateRef.current(route);

        // ── Fade ghost out after React has painted new page content ──
        // Two rAFs: first lets React commit, second lets browser paint.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (ghost) {
            ghost.style.transition = 'opacity 0.12s ease-out';
            ghost.style.opacity    = '0';
            setTimeout(() => {
              if (ghost && ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
              }
            }, 130);
          }
        }));
      });
    }

    // ── touchstart ───────────────────────────────────────────────
    function onTouchStart(e) {
      if (isDesktop.current)    return;
      if (phase !== 'IDLE')     return;
      if (e.touches.length > 1) return; // ignore multi-touch

      // Portfolio builder has its own complex drag interactions — exempt it
      if (pathnameRef.current.includes('/portfolio/builder')) return;

      simpleMode = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const t = e.touches[0];
      startX  = t.clientX;
      startY  = t.clientY;
      samples = [{ x: t.clientX, t: performance.now() }];
      phase   = 'LOCKING';
    }

    // ── touchmove ────────────────────────────────────────────────
    function onTouchMove(e) {
      if (isDesktop.current) return;
      if (phase === 'IDLE' || phase === 'SETTLING') return;

      const t   = e.touches[0];
      const dx  = t.clientX - startX;
      const dy  = t.clientY - startY;
      const now = performance.now();

      // Accumulate velocity samples for rolling-window computation
      samples.push({ x: t.clientX, t: now });
      if (samples.length > 12) samples.shift();

      // ── LOCKING: determine gesture intent ─────────────────────
      if (phase === 'LOCKING') {
        if (Math.hypot(dx, dy) < LOCK_DIST) return; // need more movement

        const angle = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI);
        if (angle > LOCK_ANGLE) {
          // Vertical intent — hand off to native scroll entirely
          phase = 'IDLE';
          return;
        }

        // Horizontal confirmed — resolve adjacent route
        const path       = pathnameRef.current;
        const r          = routesRef.current;
        const idx        = r.findIndex(p => path.startsWith(p));
        if (idx === -1) { phase = 'IDLE'; return; }

        // dir: -1 = swipe-left (finger moves left)  → next tab (idx + 1)
        //      +1 = swipe-right (finger moves right) → prev tab (idx - 1)
        // targetIdx formula: idx - dir
        //   dir=-1 → idx - (-1) = idx + 1  (next) ✓
        //   dir=+1 → idx - (+1) = idx - 1  (prev) ✓
        const dir       = dx < 0 ? -1 : 1;
        const targetIdx = idx - dir;

        if (targetIdx < 0 || targetIdx >= r.length) {
          // At the edge — no adjacent page to transition to
          phase = 'IDLE';
          return;
        }

        swipeDir    = dir;
        targetRoute = r[targetIdx];
        // In simpleMode, skip ghost creation (no visual animation)
        ghostEl     = simpleMode ? null : createGhost(dir);
        phase       = 'DRAGGING';

        el.classList.add('swipe-dragging');
      }

      // ── DRAGGING: apply real-time transform via rAF ───────────
      if (phase === 'DRAGGING') {
        e.preventDefault(); // suppress native vertical scroll

        dragDx = dx;

        if (!simpleMode) {
          // Coalesce multiple touchmove events per frame into a single paint call
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            applyFrame(dragDx);
            rafId = null;
          });
        }
      }
    }

    // ── touchend ─────────────────────────────────────────────────
    function onTouchEnd() {
      if (phase !== 'DRAGGING') {
        phase = 'IDLE';
        return;
      }

      // Cancel any pending rAF before computing commit decision
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

      // ── Velocity from rolling window ───────────────────────────
      // Using performance.now() for sub-millisecond accuracy at 120 Hz
      const now    = performance.now();
      const recent = samples.filter(s => now - s.t < VELOCITY_WINDOW);
      let velPxMs  = 0;
      if (recent.length >= 2) {
        const oldest = recent[0];
        const newest = recent[recent.length - 1];
        const dt     = newest.t - oldest.t;
        if (dt > 0) velPxMs = (newest.x - oldest.x) / dt;
      }
      const velPxS = velPxMs * 1000; // convert to px/s for spring integrator

      const dx  = dragDx;
      const vw  = window.innerWidth;

      // Commit if: distance exceeds threshold OR fast flick in swipe direction
      const distOk = Math.abs(dx) >= vw * COMMIT_RATIO;
      const velOk  = Math.abs(velPxMs) >= COMMIT_VEL && Math.sign(velPxMs) === Math.sign(dx);

      // ── prefers-reduced-motion: immediate navigate, no animation ─
      if (simpleMode) {
        const main = mainRef.current;
        if (main) { main.style.transform = ''; main.classList.remove('swipe-dragging'); }
        destroyGhost();
        phase  = 'IDLE';
        dragDx = 0;
        if (distOk || velOk) {
          navigateRef.current(targetRoute);
        }
        return;
      }

      if (distOk || velOk) {
        commitGesture(velPxS);
      } else {
        cancelGesture(velPxS);
      }
    }

    // ── touchcancel: system interrupted (notification, call, etc.) ─
    // Always cancel — never commit an interrupted gesture
    function onTouchCancel() {
      if (phase === 'DRAGGING' || phase === 'LOCKING') {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        const main = mainRef.current;
        if (main) { main.style.transform = ''; main.classList.remove('swipe-dragging'); }
        destroyGhost();
        phase  = 'IDLE';
        dragDx = 0;
      }
    }

    // ── Attach event listeners ────────────────────────────────────
    // touchmove must be non-passive so we can call e.preventDefault()
    // during the DRAGGING phase to suppress competing vertical scroll
    el.addEventListener('touchstart',  onTouchStart,  { passive: true  });
    el.addEventListener('touchmove',   onTouchMove,   { passive: false });
    el.addEventListener('touchend',    onTouchEnd,    { passive: true  });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true  });

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
      if (rafId) cancelAnimationFrame(rafId);
      destroyGhost();
      const main = mainRef.current;
      if (main) { main.style.transform = ''; main.classList.remove('swipe-dragging'); }
    };
  }, []); // intentionally empty — all mutable values accessed through stable refs
}
