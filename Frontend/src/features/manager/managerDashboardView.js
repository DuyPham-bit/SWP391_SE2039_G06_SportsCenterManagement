const AUDIT_ACTIONS = {
  'MEMBER.CREATED': { label: 'Đăng ký hội viên', icon: 'person_add', tone: 'emerald' },
  'MEMBER.ACCOUNT_STATUS.UPDATED': { label: 'Cập nhật trạng thái hội viên', icon: 'manage_accounts', tone: 'amber' },
  'STAFF.CREATED': { label: 'Bổ nhiệm nhân sự', icon: 'badge', tone: 'blue' },
  'STAFF.UPDATED': { label: 'Cập nhật nhân sự', icon: 'edit', tone: 'blue' },
  'CLASS.CREATED': { label: 'Tạo lớp học', icon: 'fitness_center', tone: 'orange' },
  'CLASS.UPDATED': { label: 'Cập nhật lớp học', icon: 'edit_calendar', tone: 'orange' },
  'CLASS.COACH.ASSIGNED': { label: 'Phân công huấn luyện viên', icon: 'assignment_ind', tone: 'blue' },
  'CLASS_COACH.ASSIGNED': { label: 'Phân công huấn luyện viên', icon: 'assignment_ind', tone: 'blue' },
  'PAYMENT.CASH.RECORDED': { label: 'Ghi nhận thanh toán', icon: 'payments', tone: 'emerald' },
  'MEMBERSHIP_PACKAGE.CREATED': { label: 'Tạo gói tập', icon: 'card_membership', tone: 'purple' },
  'ROLE.PERMISSIONS.REPLACED': { label: 'Cập nhật phân quyền', icon: 'security', tone: 'purple' }
};

export function toNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function toPercent(value) {
  return Math.min(100, Math.round(toNonNegativeNumber(value)));
}

export function getManagerDashboardSummary(metrics = {}) {
  const totalMembers = toNonNegativeNumber(metrics.totalMembers);
  const activeMembers = Math.min(totalMembers, toNonNegativeNumber(metrics.activeMembers));
  return {
    totalMembers,
    activeMembers,
    activeMemberRate: totalMembers ? Math.round((activeMembers / totalMembers) * 100) : 0,
    monthlyRevenue: toNonNegativeNumber(metrics.monthlyRevenue),
    totalBookings: toNonNegativeNumber(metrics.totalBookings),
    todayCheckins: toNonNegativeNumber(metrics.todayCheckins),
    occupancyRate: toPercent(metrics.occupancyRate),
    newMembers: toNonNegativeNumber(metrics.newMembers),
    popularClass: metrics.highlights?.mostPopularClass?.name || 'Chưa có dữ liệu'
  };
}

export function getAuditPresentation(action = '') {
  const normalized = String(action).trim().toUpperCase();
  if (AUDIT_ACTIONS[normalized]) return AUDIT_ACTIONS[normalized];
  const fallback = String(action).trim().replace(/[._]+/g, ' ');
  return { label: fallback || 'Hoạt động hệ thống', icon: 'history', tone: 'slate' };
}

export function formatDashboardTimestamp(value) {
  if (!value) return 'Chưa rõ thời gian';
  const source = String(value);
  const normalized = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(source) ? source : `${source}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return 'Chưa rõ thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}
