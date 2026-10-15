const ACCOUNT_STATES = {
  ACTIVE: {
    label: 'Hoạt động',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    actionLabel: 'Khóa',
    actionIcon: 'lock',
    actionClass: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500'
  },
  DISABLED: {
    label: 'Đã khóa',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    actionLabel: 'Mở khóa',
    actionIcon: 'lock_open',
    actionClass: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
  }
};

const SUBSCRIPTION_STATES = {
  ACTIVE: { label: 'Đang hiệu lực', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'check_circle' },
  PENDINGPAYMENT: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'schedule' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'schedule' },
  SCHEDULED: { label: 'Sắp hiệu lực', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'event_upcoming' },
  INACTIVE: { label: 'Chưa kích hoạt', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'pause_circle' },
  EXPIRED: { label: 'Đã hết hạn', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'event_busy' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-rose-50 text-rose-700 border-rose-200', icon: 'cancel' }
};

export function buildMemberUpdatePayload(form = {}) {
  return {
    fullName: String(form.fullName ?? '').trim(),
    phone: String(form.phone ?? '').trim(),
    dateOfBirth: form.dateOfBirth || null,
    gender: form.gender || null,
    address: String(form.address ?? '').trim()
  };
}

export function getAccountPresentation(status) {
  const normalized = String(status || '').trim().toUpperCase();
  if (normalized === 'ACTIVE') return { ...ACCOUNT_STATES.ACTIVE, isActive: true };
  if (normalized === 'DISABLED') return { ...ACCOUNT_STATES.DISABLED, isActive: false };
  return {
    ...ACCOUNT_STATES.DISABLED,
    label: 'Không hoạt động',
    isActive: false
  };
}

export function getSubscriptionPresentation(status) {
  const normalized = String(status || '').replace(/[^a-z]/gi, '').toUpperCase();
  return SUBSCRIPTION_STATES[normalized] || {
    label: status ? String(status) : 'Chưa xác định',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: 'help'
  };
}

export function formatMembershipPrice(value) {
  if (value === null || value === undefined || value === '') return 'Chưa có thông tin';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 'Chưa có thông tin';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function formatMembershipDuration(value) {
  const days = Number(value);
  return Number.isInteger(days) && days > 0 ? `${days} ngày` : 'Chưa xác định';
}

export function formatMembershipDate(value, fallback = 'Chưa xác định') {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return fallback;
  return date.toLocaleDateString('vi-VN', { timeZone: 'UTC' });
}

export function formatMembershipDateTime(value, fallback = 'Chưa xác định') {
  if (!value) return fallback;
  const raw = String(value);
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw) ? raw : `${raw}Z`;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export function normalizeSubscriptionHistory(value) {
  if (!Array.isArray(value)) return [];
  const timestamp = item => {
    const parsed = Date.parse(item?.createdAt || '');
    return Number.isNaN(parsed) ? 0 : parsed;
  };
  return [...value].sort((left, right) =>
    timestamp(right) - timestamp(left)
      || Number(right?.subscriptionId || 0) - Number(left?.subscriptionId || 0));
}
