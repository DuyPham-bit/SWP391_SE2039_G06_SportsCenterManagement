// SCMS motion layer: one place for pointer-driven 3D tilt, page-enter choreography and scroll reveal.
// Every effect is skipped when the user asks the OS for reduced motion, and tilt only runs for a
// real mouse (no touch), so phones keep a still, readable interface.
import { useLayoutEffect } from 'react';
import Lenis from 'lenis';

const TILT_SELECTOR = '.hover-lift, .scms-tilt, .tiya-course-card, .about-stat-card, .about-feature-item, .tiya-zone-card';
const MAX_TILT_DEG = 6;
// Large panels lift but do not tilt: rotating a wide table or form reads as a glitch, not depth.
const MAX_TILT_WIDTH = 640;
const MAX_TILT_HEIGHT = 460;
const PAGE_ENTER_MS = 2200;

const media = (query) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
const REDUCE_MOTION_KEY = 'SCMS_REDUCE_MOTION';
export const prefersReducedMotion = () =>
  media('(prefers-reduced-motion: reduce)') ||
  (typeof document !== 'undefined' && document.documentElement.classList.contains('scms-reduce-motion'));

/** In-app switch for people who want a still interface even when the OS setting is off. */
export function isReduceMotionOn() {
  try { return localStorage.getItem(REDUCE_MOTION_KEY) === 'true'; } catch { return false; }
}
export function setReduceMotion(on) {
  document.documentElement.classList.toggle('scms-reduce-motion', Boolean(on));
  try { localStorage.setItem(REDUCE_MOTION_KEY, String(Boolean(on))); } catch { /* storage blocked */ }
  if (!on) window.__scmsRestartLenis?.();
}

/**
 * Applies a theme change with a circular reveal from (x, y) using the View Transitions API.
 * Falls back to an instant switch where the API or motion is unavailable.
 */
export function switchThemeWithReveal(apply, x, y) {
  if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion()) {
    apply();
    return;
  }
  const cx = x ?? window.innerWidth - 40;
  const cy = y ?? 32;
  const radius = Math.hypot(Math.max(cx, window.innerWidth - cx), Math.max(cy, window.innerHeight - cy));
  const transition = document.startViewTransition(() => apply());
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${radius}px at ${cx}px ${cy}px)`] },
      { duration: 560, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
    );
  }).catch(() => {});
}
const hasFinePointer = () => media('(hover: hover) and (pointer: fine)');

function clearTilt(el) {
  if (!el) return;
  el.classList.remove('is-tilting');
  ['--tilt-x', '--tilt-y', '--tilt-shadow-x', '--tilt-shadow-y'].forEach((name) => el.style.removeProperty(name));
}

/** Installs the delegated 3D tilt listener once for the whole document. */
export function installMotion() {
  if (typeof document === 'undefined' || window.__scmsMotionInstalled) return;
  window.__scmsMotionInstalled = true;

  let active = null;
  let lastEvent = null;
  let frame = 0;

  const paint = () => {
    frame = 0;
    if (!active || !lastEvent) return;
    const rect = active.getBoundingClientRect();
    if (rect.width > MAX_TILT_WIDTH || rect.height > MAX_TILT_HEIGHT || rect.width === 0) {
      clearTilt(active);
      return;
    }
    const px = (lastEvent.clientX - rect.left) / rect.width - 0.5;
    const py = (lastEvent.clientY - rect.top) / rect.height - 0.5;
    active.style.setProperty('--tilt-x', `${(-py * MAX_TILT_DEG).toFixed(2)}deg`);
    active.style.setProperty('--tilt-y', `${(px * MAX_TILT_DEG).toFixed(2)}deg`);
    active.style.setProperty('--tilt-shadow-x', `${(-px * 14).toFixed(1)}px`);
    active.style.setProperty('--tilt-shadow-y', `${(14 - py * 8).toFixed(1)}px`);
    active.classList.add('is-tilting');
  };

  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || prefersReducedMotion() || !hasFinePointer()) return;
      const target = event.target instanceof Element ? event.target.closest(TILT_SELECTOR) : null;
      if (active && active !== target) clearTilt(active);
      active = target;
      if (!active) return;
      lastEvent = event;
      if (!frame) frame = requestAnimationFrame(paint);
    },
    { passive: true }
  );

  const release = () => {
    clearTilt(active);
    active = null;
  };
  document.addEventListener('mouseleave', release);
  window.addEventListener('blur', release);
  window.addEventListener('scroll', release, { passive: true });

  // Content swap mutation observer is intentionally disabled:
  // It was intercepting post-load React renders (data arrival at ~900ms) and forcing opacity: 0,
  // causing cards/widgets to flicker/blink shortly after page load.
  // installContentSwap();
  installDashboardMotion();
  if (isReduceMotionOn()) document.documentElement.classList.add('scms-reduce-motion');
  installScrollFlag();
  installRouteBar();
  installRipple();
  installScrollReveal();
  installSmoothScroll();
}

let lenisInstance = null;

/** Lenis smooth scroll: active for non-reduced-motion browsing, respects nested scroll & modals. */
function installSmoothScroll() {
  if (typeof window === 'undefined' || prefersReducedMotion() || lenisInstance) return;
  try {
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.4,
      prevent: (node) => Boolean(node?.closest?.('[role="dialog"], .scms-modal-stage, .sidebar-scroll-container, [data-lenis-prevent], .cm-viewport')),
    });
    lenisInstance = lenis;
    let rafId = 0;
    const raf = (time) => {
      if (prefersReducedMotion() || document.documentElement.classList.contains('scms-reduce-motion')) {
        lenis.stop();
        rafId = 0;
        return;
      }
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    window.addEventListener('hashchange', () => {
      lenis.resize();
    }, { passive: true });
    window.__scmsLenis = lenis;
    window.__scmsRestartLenis = () => {
      if (!rafId && !prefersReducedMotion()) {
        lenis.start();
        rafId = requestAnimationFrame(raf);
      }
    };
  } catch {
    // Graceful fallback to native scroll
  }
}

/** Flags html[data-scrolled] so the sticky header can turn to glass. */
function installScrollFlag() {
  let frame = 0;
  const update = () => {
    frame = 0;
    if (window.scrollY > 8) document.documentElement.dataset.scrolled = '';
    else delete document.documentElement.dataset.scrolled;
  };
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('hashchange', update);
  update();
}

/** A thin brand-gradient bar runs across the top on every route change. */
function installRouteBar() {
  const bar = document.createElement('div');
  bar.className = 'scms-route-bar';
  bar.setAttribute('aria-hidden', 'true');
  const mount = () => document.body.appendChild(bar);
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount, { once: true });
  window.addEventListener('hashchange', () => {
    if (prefersReducedMotion()) return;
    bar.classList.remove('is-running');
    void bar.offsetWidth;
    bar.classList.add('is-running');
  });
}

const RIPPLE_SELECTOR = 'button:not([data-no-ripple]):not(:disabled), a[class*="rounded"][class*="bg-"], [role="button"]:not([aria-disabled="true"])';

/** Material-style ripple from the press point on buttons and button-like links. */
function installRipple() {
  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || prefersReducedMotion()) return;
    const host = event.target instanceof Element ? event.target.closest(RIPPLE_SELECTOR) : null;
    if (!host || !host.animate) return;
    const rect = host.getBoundingClientRect();
    // Tiny controls do not need it; very large areas would read as a flash.
    if (rect.width < 24 || rect.height < 20 || rect.width * rect.height > 220000) return;
    if (getComputedStyle(host).position === 'static') host.classList.add('scms-ripple-host');
    const wrap = document.createElement('span');
    wrap.className = 'scms-ripple-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    const dot = document.createElement('span');
    dot.className = 'scms-ripple';
    const size = Math.hypot(rect.width, rect.height) * 2;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.left = `${event.clientX - rect.left - size / 2}px`;
    dot.style.top = `${event.clientY - rect.top - size / 2}px`;
    wrap.appendChild(dot);
    host.appendChild(wrap);
    const anim = dot.animate(
      [{ transform: 'scale(0)', opacity: 0.28 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: 560, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
    anim.onfinish = () => { if (wrap.parentNode === host) host.removeChild(wrap); };
  }, { passive: true });
}

const REVEAL_SELECTOR = '.scms-page .grid > *, .scms-page section, .scms-page table, .scms-page > div > div > [class*="rounded-2xl"], .scms-page > div > div > [class*="rounded-3xl"]';

/**
 * Scroll reveal: blocks that start below the fold rise in the first time they enter the viewport.
 * Content is never hidden up front (the animation starts only at intersection), so nothing stays
 * invisible if scripts or observers fail.
 */
function installScrollReveal() {
  if (typeof IntersectionObserver === 'undefined' || !Element.prototype.animate) return;
  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    // Blocks that enter together (a row of cards) rise one after another.
    let order = 0;
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      if (prefersReducedMotion()) return;
      entry.target.animate(
        [{ opacity: 0, transform: 'translate3d(0, 24px, 0)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
        { duration: 600, delay: Math.min(order, 6) * 70, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' }
      );
      order += 1;
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });

  let timer = 0;
  const scan = () => {
    timer = 0;
    const fold = window.innerHeight;
    let count = 0;
    document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
      if (seen.has(el) || count > 80) return;
      seen.add(el);
      // Only blocks that start below the fold; what is on screen already is covered by page-enter.
      if (el.getBoundingClientRect().top > fold) { io.observe(el); count += 1; }
    });
  };
  const schedule = () => { if (!timer) timer = window.setTimeout(scan, 250); };
  window.addEventListener('hashchange', schedule);
  if (typeof MutationObserver !== 'undefined') {
    const attach = () => new MutationObserver(schedule).observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true }); else attach();
  }
  schedule();
}

const SWAP_MIN_HEIGHT = 120;
const SWAP_QUIET_AFTER_ROUTE_MS = 900;
// Bound layout reads per mutation batch so re-rendering long lists stays cheap.
const SWAP_MAX_CHECKS = 40;

/**
 * Tab switches and "loading → data" swaps insert a new block into the page without a route
 * change, so the page-enter choreography never runs and the content pops in. This watches the
 * page container and fades/raises any freshly inserted block taller than SWAP_MIN_HEIGHT.
 * It uses the Web Animations API, so React-owned classes and styles are never touched, and it
 * stays quiet right after navigation (page-enter already covers that) and for small updates.
 */
function installContentSwap() {
  if (typeof MutationObserver === 'undefined' || typeof Element === 'undefined' || !Element.prototype.animate) return;
  let quietUntil = 0;
  window.addEventListener('hashchange', () => { quietUntil = performance.now() + SWAP_QUIET_AFTER_ROUTE_MS; });

  const observer = new MutationObserver((records) => {
    if (prefersReducedMotion() || performance.now() < quietUntil) return;
    const animated = new Set();
    let measured = 0;
    for (const record of records) {
      if (measured > SWAP_MAX_CHECKS) break;
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement) || animated.has(node)) continue;
        if (!node.closest('.scms-page') || node.closest('[role="dialog"], .scms-page-enter')) continue;
        // Skip nodes nested in something we are already animating in this batch.
        if ([...animated].some((parent) => parent.contains(node))) continue;
        measured += 1;
        if (node.getBoundingClientRect().height < SWAP_MIN_HEIGHT) continue;
        animated.add(node);
        node.animate(
          [
            { opacity: 0, transform: 'translate3d(0, 10px, 0)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 360, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        );
      }
    }
  });

  const attach = () => {
    const root = document.getElementById('root') || document.body;
    observer.observe(root, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
  else attach();
}

/**
 * Replays the page-enter choreography whenever `routeKey` changes: the page rises in and the
 * cards of its grids flip up one after another. The class is removed afterwards so lists that
 * re-render later (filters, paging) do not animate again.
 */
export function usePageEnter(ref, routeKey) {
  useLayoutEffect(() => {
    const timer = restartPageEnter(ref.current);
    return () => window.clearTimeout(timer);
  }, [ref, routeKey]);
}

function restartPageEnter(root) {
  if (!root || prefersReducedMotion()) return undefined;
  root.classList.remove('scms-page-enter');
  // Force a reflow so the animation restarts on every navigation.
  void root.offsetWidth;
  root.classList.add('scms-page-enter');
  return window.setTimeout(() => root.classList.remove('scms-page-enter'), PAGE_ENTER_MS);
}

/** Plays the page entrance again, e.g. when the launch splash lifts off a page that loaded under it. */
export function replayPageEnter() {
  if (typeof document !== 'undefined') restartPageEnter(document.querySelector('.scms-page'));
}

/* ───────────────────────── Dashboard motion ─────────────────────────
 * Dashboards are overview screens, so they get the richer choreography defined under
 * html[data-scms-view="dashboard"] in theme.css; work screens (tables, forms) stay calm.
 * JS only (1) flags the current view and (2) feeds the cursor position to the card spotlight.
 */
const DASHBOARD_ROUTE = /^#\/(admin|manager|receptionist|coach|member)\/(dashboard|performance|kpi|salary-kpi)(?:[?/]|$)|^#\/(admin|manager|receptionist|coach|member)\/?$/;
// Spotlight follows the cursor on cards of every page (dashboards style it more strongly).
const SPOT_CARD = '.scms-page .grid > *';

function installDashboardMotion() {
  const root = document.documentElement;
  const flagView = () => {
    if (DASHBOARD_ROUTE.test(window.location.hash || '')) root.dataset.scmsView = 'dashboard';
    else delete root.dataset.scmsView;
  };
  flagView();
  window.addEventListener('hashchange', flagView);

  let card = null;
  let pending = null;
  let frame = 0;
  const paint = () => {
    frame = 0;
    if (!pending) return;
    const target = pending.target instanceof Element ? pending.target.closest(SPOT_CARD) : null;
    if (card && card !== target) card.classList.remove('is-spotlit');
    card = target;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${pending.clientX - rect.left}px`);
    card.style.setProperty('--my', `${pending.clientY - rect.top}px`);
    card.classList.add('is-spotlit');
  };
  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || prefersReducedMotion()) return;
      pending = event;
      if (!frame) frame = requestAnimationFrame(paint);
    },
    { passive: true }
  );
  document.addEventListener('mouseleave', () => {
    if (card) card.classList.remove('is-spotlit');
    card = null;
  });
}
