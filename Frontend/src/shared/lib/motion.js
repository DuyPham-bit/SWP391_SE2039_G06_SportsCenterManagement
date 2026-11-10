// SCMS motion layer: one place for pointer-driven 3D tilt, page-enter choreography and scroll reveal.
// Every effect is skipped when the user asks the OS for reduced motion, and tilt only runs for a
// real mouse (no touch), so phones keep a still, readable interface.
import { useEffect, useLayoutEffect } from 'react';

const TILT_SELECTOR = '.hover-lift, .scms-tilt, .tiya-course-card, .about-stat-card, .about-feature-item, .tiya-zone-card';
const MAX_TILT_DEG = 6;
// Large panels lift but do not tilt: rotating a wide table or form reads as a glitch, not depth.
const MAX_TILT_WIDTH = 640;
const MAX_TILT_HEIGHT = 460;
const PAGE_ENTER_MS = 2200;

const media = (query) => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
export const prefersReducedMotion = () => media('(prefers-reduced-motion: reduce)');
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

  installContentSwap();
  installDashboardMotion();
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
    const root = ref.current;
    if (!root || prefersReducedMotion()) return undefined;
    root.classList.remove('scms-page-enter');
    // Force a reflow so the animation restarts on every navigation.
    void root.offsetWidth;
    root.classList.add('scms-page-enter');
    const timer = window.setTimeout(() => root.classList.remove('scms-page-enter'), PAGE_ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [ref, routeKey]);
}

/**
 * Reveals elements matching `selector` inside `rootSelector` as they scroll into view.
 * Content stays visible without script or with reduced motion: only elements below the fold
 * are hidden, and only after the observer exists to show them again.
 */
export function useScrollReveal(rootSelector, selector) {
  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return undefined;
    const root = document.querySelector(rootSelector);
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    const track = () => {
      root.querySelectorAll(selector).forEach((el) => {
        if (el.dataset.scmsReveal) return;
        el.dataset.scmsReveal = '1';
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
        el.classList.add('scms-scroll-reveal');
        observer.observe(el);
      });
    };

    track();
    // Sections fill in after the public catalog loads; pick those up too.
    const mutations = new MutationObserver(track);
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, [rootSelector, selector]);
}

/* ───────────────────────── Dashboard motion ─────────────────────────
 * Dashboards are overview screens, so they get the richer choreography defined under
 * html[data-scms-view="dashboard"] in theme.css; work screens (tables, forms) stay calm.
 * JS only (1) flags the current view and (2) feeds the cursor position to the card spotlight.
 */
const DASHBOARD_ROUTE = /^#\/(admin|manager|receptionist|coach|member)\/(dashboard|performance|kpi|salary-kpi)(?:[?/]|$)|^#\/(admin|manager|receptionist|coach|member)\/?$/;
const SPOT_CARD = '[data-scms-view="dashboard"] .scms-page .grid > *';

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
      if (event.pointerType !== 'mouse' || !root.dataset.scmsView || prefersReducedMotion()) return;
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
