import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
 *   • window.location.pathname used directly — no React lifecycle timing issues
 *
 * @param {React.RefObject} mainRef      Scrollable <main> element
 * @param {React.RefObject} stageRef     Clipping wrapper — ghost is appended here
 * @param {React.RefObject} committedRef Set true before navigate() to suppress CSS anim
 * @param {string[]}        routes       Ordered route paths matching BottomNav order
 */
export function useSwipeNav(mainRef, stageRef, committedRef, routes) {
  const navigate = useNavigate();

  // Stable ref so the imperative gesture engine always sees the latest navigate()
  // without ever being recreated (empty deps effect).
  const navigateRef = useRef(navigate);
  const isDesktop   = useRef(false);

  // Keep navigateRef current on every render
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Desktop detection — swipe nav disabled on ≥ 1024 px
  useEffect(() => {
    const check = () => { isDesktop.current = window.innerWidth >= 1024; };
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Main gesture engine ─────────────────────────────────────────────────────
  // Single effect with closure-local state.
  // Empty deps: intentional. All mutable values come from stable refs or
  // window.location.pathname (always current, no React lifecycle lag).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    // ── Tuning constants ──────────────────────────────────────────────────────
    const STIFFNESS       = 300;   // spring: N/m equivalent
    const DAMPING         = 30;    // spring: Ns/m equivalent
    const MASS            = 1;     // spring: kg equivalent
    const SETTLE_POS      = 0.8;   // px — spring "done" position threshold
    const SETTLE_VEL      = 4;     // px/s — spring "done" velocity threshold
    const COMMIT_RATIO    = 0.35;  // fraction of viewport width to commit
    const COMMIT_VEL      = 0.4;   // px/ms — minimum flick velocity to commit
    const VELOCITY_WINDOW = 80;    // ms — rolling window for velocity sampling
    const LOCK_ANGLE      = 30;    // degrees — beyond this → vertical intent
    const LOCK_DIST       = 8;     // px — minimum move before intent is locked

    // ── Closure-local state — mutated imperatively, never triggers re-renders ─
    let phase       = 'IDLE';     // IDLE | LOCKING | DRAGGING | SETTLING
    let startX      = 0;
    let startY      = 0;
    let samples     = [];         // [{ x, t }] velocity rolling window
    let rafId       = null;
    let ghostEl     = null;       // the DOM ghost element, or null
    let dragDx      = 0;          // cumulative horizontal drag offset in px
    let swipeDir    = 0;          // -1 = swipe-left (→ next tab), +1 = swipe-right (→ prev tab)
    let targetRoute = '';         // route to navigate to on commit
    let simpleMode  = false;      // true → prefers-reduced-motion, skip animations

    // ── forceReset: hard-resets ALL state ────────────────────────────────────
    // Call whenever an unexpected path is taken (touchcancel, component cleanup,
    // or a stuck SETTLING state when a new gesture needs to start).
    function forceReset() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      // Remove any ghost(s) — including lingering fade-out ghosts from prior swipes
      if (stageRef.current) {
        stageRef.current.querySelectorAll('.swipe-ghost').forEach(g => {
          if (g.parentNode) g.parentNode.removeChild(g);
        });
      }
      ghostEl = null;
      el.style.transform = '';
      el.classList.remove('swipe-dragging');
      phase   = 'IDLE';
      dragDx  = 0;
      samples = [];
    }

    // ── Spring integrator (Euler–Cromer) ─────────────────────────────────────
    function runSpring(from, to, initVelPxS, onStep, onDone) {
      let pos  = from;
      let vel  = initVelPxS;
      let last = performance.now();

      function tick(now) {
        // Cap dt so a backgrounded tab doesn't spike
        const dt = Math.min((now - last) / 1000, 0.032);
        last     = now;

        const f = -STIFFNESS * (pos - to) - DAMPING * vel;
        vel += (f / MASS) * dt;
        pos += vel * dt;

        onStep(pos);

        if (Math.abs(pos - to) < SETTLE_POS && Math.abs(vel) < SETTLE_VEL) {
          onStep(to);
          rafId = null;
          onDone();
        } else {
          rafId = requestAnimationFrame(tick);
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    // ── Ghost: absolute-positioned incoming-page placeholder ─────────────────
    // Purges any previous ghost first to prevent double-ghost from rapid swipes.
    function createGhost(dir) {
      const stage = stageRef.current;
      if (!stage) return null;

      // Remove any lingering ghost from a previous transition that hasn't
      // finished fading yet (rapid-swipe scenario)
      stage.querySelectorAll('.swipe-ghost').forEach(g => {
        g.style.transition = 'none';  // kill in-progress fade
        if (g.parentNode) g.parentNode.removeChild(g);
      });

      const g = document.createElement('div');
      g.className = 'swipe-ghost';
      // Position off-screen on the side the ghost will enter FROM:
      //   swipe-left  (dir=-1): ghost enters from RIGHT  → start at +vw
      //   swipe-right (dir=+1): ghost enters from LEFT   → start at -vw
      const vw = window.innerWidth;
      g.style.transform = `translateX(${dir > 0 ? -vw : vw}px)`;
      stage.appendChild(g);
      return g;
    }

    // ── applyFrame: applies a drag offset to both pages ──────────────────────
    // Runs inside requestAnimationFrame — compositor-thread safe.
    function applyFrame(dx) {
      const vw = window.innerWidth;
      // Rubber-band: 15 % resistance when pulling toward an edge with no page
      const wrongDir = (swipeDir < 0 && dx > 0) || (swipeDir > 0 && dx < 0);
      const eff      = wrongDir ? dx * 0.15 : dx;

      // Current page exits
      el.style.transform = `translateX(${eff}px)`;

      // Ghost (next page) enters from the opposite side
      if (ghostEl) {
        const ghostStart = swipeDir > 0 ? -vw : vw;
        ghostEl.style.transform = `translateX(${ghostStart + eff}px)`;
      }
    }

    // ── cancelGesture: spring pages back to rest ──────────────────────────────
    function cancelGesture(initVelPxS) {
      phase         = 'SETTLING';
      const startDx = dragDx;
      const g       = ghostEl;

      runSpring(startDx, 0, initVelPxS, applyFrame, () => {
        el.style.transform = '';
        el.classList.remove('swipe-dragging');
        if (g && g.parentNode) g.parentNode.removeChild(g);
        if (ghostEl === g) ghostEl = null;
        phase  = 'IDLE';
        dragDx = 0;
      });
    }

    // ── commitGesture: spring to edge → navigate → fade ghost ────────────────
    // The ghost covers the screen while React re-renders the new page, then
    // fades out, revealing the new content — creating a seamless handoff.
    function commitGesture(initVelPxS) {
      phase         = 'SETTLING';
      const vw      = window.innerWidth;
      const target  = swipeDir * vw;   // -vw (swipe-left) or +vw (swipe-right)
      const route   = targetRoute;
      const g       = ghostEl;         // capture — ghostEl cleared in onDone
      const startDx = dragDx;

      runSpring(startDx, target, initVelPxS, applyFrame, () => {
        // Spring complete — transition is visually done
        el.classList.remove('swipe-dragging');
        el.style.transform = '';

        // Snap ghost to center so it covers the viewport during React paint
        if (g) {
          g.style.transform = 'translateX(0px)';
          g.style.zIndex    = '9998';  // above page, below pill nav
        }

        // Clear ghostEl now so rapid re-swipe creates a fresh ghost
        if (ghostEl === g) ghostEl = null;
        phase  = 'IDLE';
        dragDx = 0;

        // Tell Layout's pathname useEffect to skip its CSS slide-in keyframe
        if (committedRef) committedRef.current = true;

        haptic.light();
        navigateRef.current(route);

        // Fade the ghost out after React has painted the new page.
        // Two rAFs: first lets React commit the render, second lets the
        // browser paint — then we start the CSS fade.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (g && g.parentNode) {
            g.style.transition = 'opacity 0.15s ease-out';
            g.style.opacity    = '0';
            setTimeout(() => {
              if (g && g.parentNode) g.parentNode.removeChild(g);
            }, 160);
          }
        }));
      });
    }

    // ── touchstart ───────────────────────────────────────────────────────────
    function onTouchStart(e) {
      if (isDesktop.current)    return;
      if (e.touches.length > 1) return; // ignore multi-touch

      // Always use window.location.pathname — no React lifecycle timing issues
      if (window.location.pathname.includes('/portfolio/builder')) return;

      // If stuck in a mid-gesture state (e.g., from a system-interrupted settle),
      // hard-reset before beginning a new gesture
      if (phase === 'LOCKING' || phase === 'DRAGGING') {
        forceReset();
      }
      // Don't interrupt a SETTLING spring — it resets phase to IDLE on its own
      if (phase !== 'IDLE') return;

      simpleMode = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const t = e.touches[0];
      startX  = t.clientX;
      startY  = t.clientY;
      samples = [{ x: t.clientX, t: performance.now() }];
      phase   = 'LOCKING';
    }

    // ── touchmove ────────────────────────────────────────────────────────────
    function onTouchMove(e) {
      if (isDesktop.current)                       return;
      if (phase === 'IDLE' || phase === 'SETTLING') return;

      const t   = e.touches[0];
      const dx  = t.clientX - startX;
      const dy  = t.clientY - startY;
      const now = performance.now();

      // Keep velocity sample window
      samples.push({ x: t.clientX, t: now });
      if (samples.length > 12) samples.shift();

      // ── LOCKING: decide gesture intent ────────────────────────────────────
      if (phase === 'LOCKING') {
        if (Math.hypot(dx, dy) < LOCK_DIST) return; // need more movement

        const angle = Math.abs(Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI);
        if (angle > LOCK_ANGLE) {
          // Vertical scroll intent — hand off entirely to native scroll
          phase = 'IDLE';
          return;
        }

        // Horizontal confirmed — find current and adjacent route
        // Use window.location.pathname directly (always fresh)
        const currentPath = window.location.pathname;
        const idx = routes.findIndex(p => currentPath.startsWith(p));
        if (idx === -1) { phase = 'IDLE'; return; }

        // Resolve swipe direction and target index:
        //   dir=-1 (finger moves left)  → target = idx + 1 (next tab)
        //   dir=+1 (finger moves right) → target = idx - 1 (prev tab)
        const dir       = dx < 0 ? -1 : 1;
        const targetIdx = idx - dir; // idx+1 or idx-1

        if (targetIdx < 0 || targetIdx >= routes.length) {
          // Edge: no adjacent page — allow rubber-band but never commit
          phase = 'IDLE';
          return;
        }

        swipeDir    = dir;
        targetRoute = routes[targetIdx];
        ghostEl     = simpleMode ? null : createGhost(dir);
        phase       = 'DRAGGING';

        // Mark the element as actively dragging.
        // NOTE: only overflow-y and will-change — NOT touch-action:none
        // (that would prevent future touchstart from firing on some browsers)
        el.classList.add('swipe-dragging');
      }

      // ── DRAGGING: apply real-time frame via rAF ───────────────────────────
      if (phase === 'DRAGGING') {
        e.preventDefault(); // suppress competing native vertical scroll

        dragDx = dx;

        if (!simpleMode) {
          // Coalesce: cancel previous pending rAF and schedule a fresh one.
          // This ensures we draw exactly once per frame regardless of how
          // many touchmove events the browser fires between frames.
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            applyFrame(dragDx);
            rafId = null;
          });
        }
      }
    }

    // ── touchend ─────────────────────────────────────────────────────────────
    function onTouchEnd() {
      // If we were only locking (finger lifted before LOCK_DIST), reset cleanly
      if (phase === 'LOCKING') { phase = 'IDLE'; return; }
      if (phase !== 'DRAGGING') return;

      // Cancel any pending rAF before commit/cancel decision
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

      // ── Velocity from rolling window ──────────────────────────────────────
      const now    = performance.now();
      const recent = samples.filter(s => now - s.t < VELOCITY_WINDOW);
      let velPxMs  = 0;
      if (recent.length >= 2) {
        const oldest = recent[0];
        const newest = recent[recent.length - 1];
        const dt     = newest.t - oldest.t;
        if (dt > 0) velPxMs = (newest.x - oldest.x) / dt;
      }
      const velPxS = velPxMs * 1000;

      const dx  = dragDx;
      const vw  = window.innerWidth;

      // Commit if: distance threshold exceeded OR fast flick in swipe direction
      const distOk = Math.abs(dx) >= vw * COMMIT_RATIO;
      const velOk  = Math.abs(velPxMs) >= COMMIT_VEL && Math.sign(velPxMs) === Math.sign(dx);

      // prefers-reduced-motion: skip animation, navigate immediately
      if (simpleMode) {
        el.style.transform = '';
        el.classList.remove('swipe-dragging');
        if (ghostEl && ghostEl.parentNode) ghostEl.parentNode.removeChild(ghostEl);
        ghostEl = null;
        phase   = 'IDLE';
        dragDx  = 0;
        if (distOk || velOk) navigateRef.current(targetRoute);
        return;
      }

      if (distOk || velOk) {
        commitGesture(velPxS);
      } else {
        cancelGesture(velPxS);
      }
    }

    // ── touchcancel: system interrupted gesture ───────────────────────────────
    // E.g. incoming call, notification shade, app switch.
    // Always hard-reset — never commit an interrupted gesture.
    function onTouchCancel() {
      forceReset();
    }

    // ── Attach listeners ──────────────────────────────────────────────────────
    // touchmove MUST be non-passive so e.preventDefault() can suppress scroll
    // during the DRAGGING phase.
    el.addEventListener('touchstart',  onTouchStart,  { passive: true  });
    el.addEventListener('touchmove',   onTouchMove,   { passive: false });
    el.addEventListener('touchend',    onTouchEnd,    { passive: true  });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true  });

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
      forceReset();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
