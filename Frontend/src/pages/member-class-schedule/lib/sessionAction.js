// Maps the backend-computed ButtonState to what the schedule UI shows.
// The backend decides eligibility; the UI only renders. A fallback keeps older payloads working.

export const PACKAGES_ROUTE = '#/member/packages';

export function resolveSessionState(cls, bookedSessionIds) {
  if (cls.buttonState) return cls.buttonState;
  if (bookedSessionIds?.has(cls.sessionId) || bookedSessionIds?.has(cls.id)) return 'ALREADY_BOOKED';
  if (cls.enrolledCount >= cls.capacity) return 'FULL';
  return cls.isBookable ? 'CAN_BOOK' : 'NOT_OPEN';
}

/**
 * @returns {{ state: string, label: string, action: 'detail'|'packages'|null, tone: string, dimmed: boolean }}
 */
export function getSessionAction(cls, bookedSessionIds, isEn) {
  const state = resolveSessionState(cls, bookedSessionIds);
  switch (state) {
    case 'ALREADY_BOOKED':
      return { state, label: isEn ? 'Cancel spot' : 'Hủy chỗ', action: 'detail', tone: 'booked', dimmed: false };
    case 'WAITLISTED': {
      const pos = cls.waitlistPosition ? ` #${cls.waitlistPosition}` : '';
      return { state, label: isEn ? `Waitlisted${pos}` : `Đang chờ${pos}`, action: 'detail', tone: 'warn', dimmed: false };
    }
    case 'EXPIRED':
      return { state, label: isEn ? 'Ended' : 'Đã qua', action: null, tone: 'muted', dimmed: true };
    case 'NO_VALID_PACKAGE':
      return { state, label: isEn ? 'Renew to book' : 'Gia hạn gói để đặt', action: 'packages', tone: 'warn', dimmed: false };
    case 'SPORT_NOT_INCLUDED':
      return { state, label: isEn ? 'Upgrade package' : 'Nâng cấp gói', action: 'packages', tone: 'warn', dimmed: false };
    case 'FULL':
      return cls.allowWaitlist
        ? { state, label: isEn ? 'Join waitlist' : 'Vào danh sách chờ', action: 'detail', tone: 'muted', dimmed: false }
        : { state, label: isEn ? 'Full' : 'Hết chỗ', action: null, tone: 'muted', dimmed: false };
    case 'NOT_OPEN':
      return { state, label: isEn ? 'Not open' : 'Chưa mở đặt', action: null, tone: 'muted', dimmed: false };
    default:
      return { state: 'CAN_BOOK', label: isEn ? 'Book now' : 'Đặt chỗ', action: 'detail', tone: 'primary', dimmed: false };
  }
}

/**
 * Keeps only sessions the member can use under their selected/locked package sports
 * (plus any session they already booked), unless they explicitly toggle all sports on.
 */
export function filterSessionsByEntitlements(sessions, entitlements, bookedSessionIds, includeOutOfPackage = false) {
  const list = Array.isArray(sessions) ? sessions : [];
  if (includeOutOfPackage || entitlements?.isAllAccess) return list;

  const rawIds = entitlements?.allowedSportIds ?? entitlements?.lockedToSportIds;
  const lockedIds = Array.isArray(rawIds) && rawIds.length > 0
    ? new Set(rawIds.map(Number))
    : null;

  return list.filter(cls => {
    const isBooked = cls.buttonState === 'ALREADY_BOOKED'
      || cls.buttonState === 'WAITLISTED'
      || bookedSessionIds?.has(cls.sessionId)
      || bookedSessionIds?.has(cls.id);
    if (isBooked) return true;
    if (lockedIds) return lockedIds.has(Number(cls.sportId));
    return cls.buttonState !== 'SPORT_NOT_INCLUDED';
  });
}

export const SESSION_ACTION_TONES = {
  primary: 'bg-brand-danger-600 hover:bg-brand-danger-700 text-white',
  booked: 'bg-brand-sage-100 text-brand-sage-800 border border-brand-sage-300 hover:bg-brand-sage-200',
  warn: 'bg-brand-sand-100 text-brand-sand-800 border border-brand-sand-300 hover:bg-brand-sand-200',
  muted: 'bg-brand-navy-200 text-brand-navy-500 cursor-not-allowed'
};
