import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/index.js';
import { isReduceMotionOn, prefersReducedMotion, replayPageEnter } from '../../../shared/lib/motion.js';
import { useSplashRouteReady } from '../../../shared/lib/splashSignal.js';
import { DISMISS_LABEL, RETRY_LABEL, SPLASH_COPY } from '../model/splashCopy.js';
import { AuroraBackground } from './AuroraBackground.jsx';
import { LaneRing, PortalBurst, ProgressRings } from './ProgressRings.jsx';
import { BrandTitle } from './BrandTitle.jsx';
import { StatusTicker } from './StatusTicker.jsx';
import { LangToggle } from './LangToggle.jsx';

const LOGO_SRC = '/logo-olympic-mark.png?v=20261109v4';
const SEEN_KEY = 'SCMS_APP_SPLASH_SEEN';
const MIN_FIRST_MS = 1200; // first launch of the browser session: long enough not to flash
const MIN_REPEAT_MS = 500; // reloads later in the same session stay quick
const HOLD_MS = 340; // ring charges and ignites before the portal bursts open
const EXIT_MS = 900;
const CALM_EXIT_MS = 320;
const STEP_MS = 1200;
const STALL_MS = 20000;
// Pointer tilt of the logo (desktop only): max angle and camera distance.
const TILT_DEG = 8;
const TILT_PERSPECTIVE = 1000;

// Real milestones: JS booted → session resolved → first screen committed.
const FLOOR_BOOTED = 0.34;
const FLOOR_SESSION = 0.72;
const FLOOR_SCREEN = 0.9;

let minMs;
function getMinMs() {
  if (minMs === undefined) {
    try {
      minMs = sessionStorage.getItem(SEEN_KEY) ? MIN_REPEAT_MS : MIN_FIRST_MS;
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      minMs = MIN_FIRST_MS;
    }
  }
  return minMs;
}

/** performance.now() at which index.html painted the boot copy (0 when it is missing). */
const bootTime = () => (typeof window.__osaBootT === 'number' ? window.__osaBootT : 0);

export function removeBootSplash() {
  document.getElementById('osa-boot')?.remove();
}

/**
 * Launch splash for app routes. It continues the boot copy painted by index.html, tracks the real
 * load (session + first lazy screen), then flies the logo to the header and opens onto the page.
 */
export function SplashScreen({ enabled }) {
  const [active, setActive] = useState(enabled);
  const finish = useCallback(() => setActive(false), []);
  useEffect(() => {
    if (!enabled) removeBootSplash();
  }, [enabled]);
  return active ? <SplashOverlay onFinish={finish} /> : null;
}

function SplashOverlay({ onFinish }) {
  const { initializing, initializationError } = useAuth();
  const routeReady = useSplashRouteReady();
  const { language, setLanguage } = useLanguage();
  const lang = language === 'en' ? 'en' : 'vi';
  const copy = SPLASH_COPY[lang];

  const [calm] = useState(() => prefersReducedMotion() || isReduceMotionOn());
  // Negative delay = time since the boot copy started, so loops continue instead of restarting.
  const [sync] = useState(() => -Math.round(performance.now() - bootTime()));
  const [phase, setPhase] = useState('loading'); // loading → done → exit
  const [step, setStep] = useState(0);
  const [stalled, setStalled] = useState(false);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const flipRef = useRef(null);
  const tiltRef = useRef(null);
  const tileRef = useRef(null);
  const imgRef = useRef(null);
  const progressRef = useRef(null);
  const pctRef = useRef(null);

  const ready = !initializing && routeReady;
  const failed = phase === 'loading' && !ready && (Boolean(initializationError) || stalled);
  const shownPhase = failed ? 'error' : phase;

  const loadRef = useRef(null);
  loadRef.current = {
    ready,
    failed,
    floor: initializing ? FLOOR_BOOTED : routeReady ? FLOOR_SCREEN : FLOOR_SESSION,
  };

  // Drop the boot copy once our own logo can paint, so the hand-off never shows a blank tile.
  useEffect(() => {
    let dropped = false;
    const drop = () => {
      if (dropped) return;
      dropped = true;
      requestAnimationFrame(removeBootSplash);
    };
    const img = imgRef.current;
    if (img?.decode) img.decode().then(drop, drop);
    else drop();
    const fallback = window.setTimeout(drop, 1500);
    return () => window.clearTimeout(fallback);
  }, []);

  // Progress: eases toward the current milestone, creeps while waiting, closes only when truly ready.
  useEffect(() => {
    const minUntil = bootTime() + getMinMs();
    let raf = 0;
    let shown = 0;
    let last = performance.now();
    let floor = -1;
    let floorAt = last;
    const paint = (p) => {
      progressRef.current?.style.setProperty('stroke-dashoffset', String(1 - p));
      if (pctRef.current) pctRef.current.textContent = `${Math.floor(p * 100)}%`;
    };
    const tick = (now) => {
      const dt = Math.min(0.064, (now - last) / 1000);
      last = now;
      const load = loadRef.current;
      if (load.floor !== floor) {
        floor = load.floor;
        floorAt = now;
      }
      if (!load.failed) {
        const complete = load.ready && now >= minUntil;
        const ceiling = (floor === FLOOR_BOOTED ? FLOOR_SESSION : floor === FLOOR_SESSION ? FLOOR_SCREEN : 1) - 0.05;
        const target = complete ? 1 : floor + (ceiling - floor) * (1 - Math.exp(-(now - floorAt) / 1800));
        shown += (target - shown) * (1 - Math.exp(-dt * (complete ? 8 : 3.5)));
        if (complete && shown > 0.996) shown = 1;
        paint(shown);
        if (shown === 1) {
          setPhase((p) => (p === 'loading' ? 'done' : p));
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Status messages advance every ~1.2s and wait on the last one; "Ready!" comes from the real state.
  useEffect(() => {
    if (phase !== 'loading') return undefined;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, 3)), STEP_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (ready) return undefined;
    const id = window.setTimeout(() => setStalled(true), STALL_MS);
    return () => window.clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    if (phase !== 'done') return undefined;
    const id = window.setTimeout(() => setPhase('exit'), calm ? 160 : HOLD_MS);
    return () => window.clearTimeout(id);
  }, [phase, calm]);

  // Exit: center emblem ignites and expands into the portal flash while shockwaves open the page.
  useLayoutEffect(() => {
    if (phase !== 'exit') return undefined;
    removeBootSplash();
    const root = rootRef.current;
    const stage = stageRef.current.getBoundingClientRect();
    root.style.setProperty('--osa-hx', `${stage.left + stage.width / 2}px`);
    root.style.setProperty('--osa-hy', `${stage.top + stage.height / 2}px`);
    const flip = flipRef.current;
    if (!calm) {
      flip.style.transform = 'scale(1.24)';
    }
    flip.style.opacity = '0';
    replayPageEnter();
    const id = window.setTimeout(onFinish, calm ? CALM_EXIT_MS : EXIT_MS);
    return () => window.clearTimeout(id);
  }, [phase, calm, onFinish]);

  // Desktop only: the logo tilts toward the cursor (±TILT_DEG) and the glow drifts with it, both lerped.
  const interactive = phase === 'loading' || phase === 'done';
  useEffect(() => {
    if (calm || !interactive || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return undefined;
    const tilt = tiltRef.current;
    const glow = rootRef.current.querySelector('.osa-splash__glow');
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const nx = x + (tx - x) * 0.08;
      const ny = y + (ty - y) * 0.08;
      if (Math.abs(nx - x) < 0.0005 && Math.abs(ny - y) < 0.0005) return;
      x = nx;
      y = ny;
      tilt.style.transform = `perspective(${TILT_PERSPECTIVE}px) rotateX(${(-y * TILT_DEG).toFixed(2)}deg) rotateY(${(x * TILT_DEG).toFixed(2)}deg)`;
      if (glow) glow.style.translate = `${(x * 16).toFixed(1)}px ${(y * 16).toFixed(1)}px`;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      tilt.style.transform = '';
    };
  }, [calm, interactive]);

  const otherCopy = SPLASH_COPY[lang === 'vi' ? 'en' : 'vi'];
  const errorKey = initializationError ? 'errorTitle' : 'stallTitle';

  return (
    <div
      ref={rootRef}
      className="osa-splash"
      data-phase={shownPhase}
      data-calm={calm ? '' : undefined}
      style={{ '--osa-sync': `${sync}ms` }}
      role="status"
      aria-live="polite"
      aria-busy={shownPhase === 'loading'}
      lang={lang}
    >
      <span className="osa-sr">{phase === 'loading' ? copy.loading : copy.ready}</span>
      <AuroraBackground calm={calm} phase={shownPhase} />
      <div className="osa-splash__fg">
        <div ref={stageRef} className="osa-splash__stage" aria-hidden="true">
          <ProgressRings progressRef={progressRef} />
          <PortalBurst />
          <div ref={flipRef} className="osa-splash__flip">
            <div ref={tiltRef} className="osa-splash__tilt">
              <div className="osa-splash__float">
                <div ref={tileRef} className="osa-splash__tile">
                  <img ref={imgRef} src={LOGO_SRC} alt="" width="160" height="160" draggable="false" />
                  <span className="osa-splash__sheen" />
                  <span className="osa-splash__flame" />
                </div>
              </div>
            </div>
          </div>
          <LaneRing front />
        </div>
        <div className="osa-splash__copy">
          <BrandTitle />
          {shownPhase === 'error' ? (
            <div className="osa-splash__error" role="alert">
              <p>{copy[errorKey]}</p>
              <small lang={lang === 'vi' ? 'en' : 'vi'}>{otherCopy[errorKey]}</small>
              <div className="osa-splash__actions">
                <button type="button" className="osa-splash__btn" onClick={() => window.location.reload()}>
                  {RETRY_LABEL}
                </button>
                <button type="button" className="osa-splash__btn osa-splash__btn--ghost" onClick={() => setPhase('exit')}>
                  {DISMISS_LABEL}
                </button>
              </div>
            </div>
          ) : (
            <StatusTicker message={copy.status[phase === 'loading' ? step : 4]} pctRef={pctRef} />
          )}
        </div>
      </div>
      <LangToggle language={lang} onChange={setLanguage} label={copy.language} />
    </div>
  );
}

export default SplashScreen;
