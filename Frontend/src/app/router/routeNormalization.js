/**
 * Smart route normalization, alias handling and typo auto-correction
 * Keeps navigation predictable and resilient against mistyped URLs.
 */

export const ROUTE_TYPO_MAP = {
  // Member aliases & typos
  '#/membe': '#/member/dashboard',
  '#/mem': '#/member/dashboard',
  '#/members': '#/member/dashboard',
  '#/member/': '#/member/dashboard',
  '#/member': '#/member/dashboard',
  '#/member/dash': '#/member/dashboard',
  // Self-enrollment page was removed; old links land on the timetable.
  '#/member/enroll': '#/member/schedule',
  '#/member/enrol': '#/member/schedule',
  '#/member/enrollment': '#/member/schedule',
  '#/member/pack': '#/member/packages',
  '#/member/package': '#/member/packages',
  '#/member/sched': '#/member/schedule',
  '#/member/schedules': '#/member/schedule',
  '#/member/book': '#/member/bookings',
  '#/member/booking': '#/member/bookings',
  '#/member/attend': '#/member/attendance',
  '#/member/attendances': '#/member/attendance',
  '#/member/prog': '#/member/progress',
  '#/member/notif': '#/member/notifications',
  '#/member/notifs': '#/member/notifications',
  '#/member/refund': '#/member/refunds',
  '#/member/refunds/': '#/member/refunds',
  '#/member/assistant': '#/member/ai-assistant',
  '#/member/ai': '#/member/ai-assistant',

  // Manager aliases & typos
  '#/manage': '#/manager/dashboard',
  '#/manag': '#/manager/dashboard',
  '#/managers': '#/manager/dashboard',
  '#/manager/': '#/manager/dashboard',
  '#/manager': '#/manager/dashboard',
  '#/manager/dash': '#/manager/dashboard',
  '#/manager/pack': '#/manager/packages',
  '#/manager/packages/': '#/manager/packages',
  '#/manager/mem': '#/manager/members',
  '#/manager/members/': '#/manager/members',
  '#/manager/staffs': '#/manager/staff',

  // Coach aliases & typos
  '#/coac': '#/coach/dashboard',
  '#/coaches': '#/coach/dashboard',
  '#/coach/': '#/coach/dashboard',
  '#/coach': '#/coach/dashboard',
  '#/coach/dash': '#/coach/dashboard',
  '#/coach/sched': '#/coach/schedule',
  '#/coach/schedules': '#/coach/schedule',

  // Receptionist aliases & typos
  '#/recept': '#/receptionist/dashboard',
  '#/reception': '#/receptionist/dashboard',
  '#/receptions': '#/receptionist/dashboard',
  '#/receptionist/': '#/receptionist/dashboard',
  '#/receptionist': '#/receptionist/dashboard',
  '#/receptionist/dash': '#/receptionist/dashboard',

  // Admin aliases & typos
  '#/adm': '#/admin/dashboard',
  '#/admins': '#/admin/dashboard',
  '#/admin/': '#/admin/dashboard',
  '#/admin': '#/admin/dashboard',
  '#/admin/dash': '#/admin/dashboard',

  // Auth & General aliases
  '#/logi': '#/login',
  '#/signin': '#/login',
  '#/sign-in': '#/login',
  '#/regis': '#/register',
  '#/signup': '#/register',
  '#/sign-up': '#/register',
};

/**
 * Normalizes any route hash string:
 * - Trims trailing slashes
 * - Translates common typos/shorthands
 * - Syncs canonical URL to browser address bar via replaceState (if in browser)
 */
export function normalizeRouteHash(rawHash) {
  if (!rawHash || rawHash === '#' || rawHash === '#/') return '#/';
  if (rawHash === '#/payment-result' || (typeof window !== 'undefined' && window.location?.pathname === '/payment-result')) {
    return '#/payment-result';
  }

  const [basePart, search = ''] = rawHash.split('?');
  const trimmed = basePart.length > 2 && basePart.endsWith('/')
    ? basePart.replace(/\/+$/, '')
    : basePart;

  const lower = trimmed.toLowerCase();
  let mapped = ROUTE_TYPO_MAP[lower] || lower;
  if (mapped.length > 2 && mapped.endsWith('/')) {
    mapped = mapped.replace(/\/+$/, '');
  }

  const result = search ? `${mapped}?${search}` : mapped;

  if (rawHash !== result && typeof window !== 'undefined' && window.history?.replaceState) {
    try {
      window.history.replaceState(null, '', result);
    } catch {
      // Ignore errors when updating history
    }
  }

  return result;
}

/**
 * Distinguishes public landing anchors/sections from functional dashboards or subroutes
 */
export function isLandingRoute(p) {
  if (!p || p === '#/' || p === '#' || p === '') return true;
  const landingKeywords = [
    'trang-chu', 've-chung-toi', 'khoa-hoc', 'co-so-vat-chat', 'lien-he',
    'about', 'facilities', 'courses', 'intro'
  ];
  const stripped = p.replace(/^#\/?/, '').toLowerCase();
  return landingKeywords.some(keyword => stripped === keyword || stripped.startsWith(keyword + '/'));
}

