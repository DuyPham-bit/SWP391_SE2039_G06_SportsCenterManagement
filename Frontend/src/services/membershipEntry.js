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
    SYSTEMADMIN: '#/manager/dashboard', ADMIN: '#/manager/dashboard', MANAGER: '#/manager/dashboard',
    RECEPTIONIST: '#/receptionist/dashboard', COACH: '#/coach/dashboard', MEMBER: '#/member/dashboard'
  })[normalized] || '#/';
}

export function getMembershipAction(isAuthenticated, role, isEn = false) {
  const isMember = String(role || '').toUpperCase() === 'MEMBER';
  return {
    href: !isAuthenticated ? '#/login?next=packages' : (isMember ? MEMBER_ROUTES.packages : getPostLoginRoute(role)),
    label: isAuthenticated && !isMember
      ? (isEn ? 'Go to Workspace' : 'Về trang làm việc')
      : (isEn ? 'View Packages' : 'Xem gói tập')
  };
}

export function getMembershipBanner(footer = {}, isEn = false) {
  const defaults = isEn ? {
    ctaBadge: 'MEMBERSHIP & CLASS BOOKINGS', ctaTitle: 'Choose Your Training Package',
    ctaDescription: 'Choose a package, complete payment, then book available classes covered by your membership.'
  } : {
    ctaBadge: 'GÓI TẬP & LỊCH LỚP', ctaTitle: 'Chọn gói tập cho hành trình của bạn',
    ctaDescription: 'Chọn gói tập, hoàn tất thanh toán, sau đó đặt ca học còn chỗ theo quyền lợi của gói.'
  };
  const result = {};
  for (const key of Object.keys(defaults)) {
    const saved = footer[key];
    result[key] = !isEn && saved && !/thuê|rental|rent\b|tournament|giải đấu|sự kiện/i.test(saved) ? saved : defaults[key];
  }
  return result;
}
