const MEMBER_ROUTES = {
  packages: '#/member/packages',
  schedule: '#/member/schedule'
};

export function getMembershipIntent(hash = '') {
  const next = new URLSearchParams(hash.split('?')[1] || '').get('next');
  return Object.hasOwn(MEMBER_ROUTES, next) ? next : null;
}

export function getPostLoginRoute(role, intent = null) {
  const normalized = String(role || '').toUpperCase();
  // Only known member destinations may override the role dashboard after login.
  if (normalized === 'MEMBER' && Object.hasOwn(MEMBER_ROUTES, intent)) return MEMBER_ROUTES[intent];
  return ({
    SYSTEMADMIN: '#/admin/dashboard', ADMIN: '#/admin/dashboard', MANAGER: '#/manager/dashboard',
    RECEPTIONIST: '#/receptionist/dashboard', COACH: '#/coach/dashboard', MEMBER: '#/member/dashboard'
  })[normalized] || '#/';
}

/** `t` is the i18n translator (useLanguage().t); labels live in the locale files. */
export function getMembershipAction(isAuthenticated, role, t) {
  const isMember = String(role || '').toUpperCase() === 'MEMBER';
  return {
    href: !isAuthenticated ? '#/login?next=packages' : (isMember ? MEMBER_ROUTES.packages : getPostLoginRoute(role)),
    label: t(isAuthenticated && !isMember ? 'landing.membership.workspace' : 'landing.membership.viewPackages')
  };
}

// The public page sells memberships only: court-rental / tournament copy is never promoted.
const RENTAL_COPY = /thuê|rental|rent\b|tournament|giải đấu|sự kiện|event/i;
const BANNER_KEYS = { ctaBadge: 'landing.membership.bannerBadge', ctaTitle: 'landing.membership.bannerTitle', ctaDescription: 'landing.membership.bannerDescription' };

/** Published CTA copy (already in the page language) unless empty or about rentals; then the localized default. */
export function getMembershipBanner(footer = {}, t) {
  const result = {};
  for (const [key, labelKey] of Object.entries(BANNER_KEYS)) {
    const saved = footer?.[key];
    result[key] = typeof saved === 'string' && saved.trim() && !RENTAL_COPY.test(saved) ? saved : t(labelKey);
  }
  return result;
}
