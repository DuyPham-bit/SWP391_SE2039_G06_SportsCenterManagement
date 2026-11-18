import { prefersReducedMotion } from '../../../shared/lib/motion.js';

const COVER_MS = 620;
const HOLD_MS = 260;
const REVEAL_MS = 560;

/**
 * Full-screen hand-off after a successful sign-in: a forest-green sheet sweeps across with the logo,
 * `navigate` runs once the screen is covered, then the sheet lifts off the new route.
 * Lives outside React so it survives the login page unmounting. Reduced motion: navigate at once.
 */
export function playAuthTransition(navigate) {
  if (typeof document === 'undefined' || prefersReducedMotion() || !Element.prototype.animate) {
    navigate();
    return Promise.resolve();
  }
  document.querySelector('.auth-transition')?.remove();
  const sheet = document.createElement('div');
  sheet.className = 'auth-transition';
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = `
    <span class="auth-transition__band auth-transition__band--gold"></span>
    <span class="auth-transition__band auth-transition__band--teal"></span>
    <span class="auth-transition__panel"></span>
    <span class="auth-transition__logo">
      <svg viewBox="0 0 120 120" class="auth-transition__ring"><circle cx="60" cy="60" r="52" pathLength="1"/></svg>
      <img src="/logo-olympic-mark-dark.png?v=20261109v4" alt="" width="72" height="72" />
    </span>`;
  document.body.appendChild(sheet);

  const ease = 'cubic-bezier(0.76, 0, 0.24, 1)';
  const bands = [...sheet.querySelectorAll('.auth-transition__band, .auth-transition__panel')];
  bands.forEach((band, i) => band.animate(
    [{ transform: 'translate3d(-101%,0,0) skewX(-12deg)' }, { transform: 'translate3d(0,0,0) skewX(0deg)' }],
    { duration: COVER_MS, delay: i * 70, easing: ease, fill: 'forwards' }
  ));
  const logo = sheet.querySelector('.auth-transition__logo');
  logo.animate(
    [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }],
    { duration: 420, delay: COVER_MS - 160, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' }
  );

  return new Promise(resolve => {
    window.setTimeout(() => {
      navigate();
      window.setTimeout(() => {
        const out = sheet.animate(
          [{ transform: 'translate3d(0,0,0)', opacity: 1 }, { transform: 'translate3d(0,-100%,0)', opacity: 1 }],
          { duration: REVEAL_MS, easing: ease, fill: 'forwards' }
        );
        out.onfinish = () => { sheet.remove(); resolve(); };
      }, HOLD_MS);
    }, COVER_MS + 140);
    // Safety: never leave the sheet on screen.
    window.setTimeout(() => { sheet.remove(); resolve(); }, COVER_MS + HOLD_MS + REVEAL_MS + 1200);
  });
}
