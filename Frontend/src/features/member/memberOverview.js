const DAY_MS = 24 * 60 * 60 * 1000;

export function vietnamDate(now = new Date()) {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function formatMemberDate(value) {
  if (!value) return 'Chưa có thông tin';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? 'Chưa có thông tin' : date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function formatMemberDateTime(value) {
  if (!value) return 'Chưa có thông tin';
  // SQL Server DateTime values serialized without an offset are stored as UTC.
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Chưa có thông tin' : date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export const DAY_LABELS = ['CHỦ NHẬT', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'];

export function parseIsoDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatIsoDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0);
}

export function getWeekDays(startDate) {
  const monday = getMonday(startDate);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    days.push(nextDay);
  }
  return days;
}

export function bookingStart(booking) {
  const time = booking.startTime || booking.timeSlot?.split(' - ')[0];
  const dateStr = String(booking.bookingDate || booking.sessionDate || '').slice(0, 10);
  if (!dateStr || !time) return NaN;
  return new Date(`${dateStr}T${time.slice(0, 5)}:00+07:00`).getTime();
}

export function isUpcomingBooking(booking, now = new Date()) {
  return booking.status === 'CONFIRMED'
    && (!booking.sessionStatus || booking.sessionStatus === 'SCHEDULED')
    && bookingStart(booking) > now.getTime();
}

export function getUpcomingBookings(bookings, now = new Date()) {
  return bookings.filter(booking => isUpcomingBooking(booking, now))
    .sort((a, b) => bookingStart(a) - bookingStart(b));
}

export function getMembershipSummary(user, now = new Date()) {
  const expiry = String(user?.packageExpiry || '').slice(0, 10);
  const expiryTime = /^\d{4}-\d{2}-\d{2}$/.test(expiry) ? Date.parse(`${expiry}T00:00:00Z`) : NaN;
  const daysLeft = Number.isNaN(expiryTime) ? null : Math.round((expiryTime - Date.parse(`${vietnamDate(now)}T00:00:00Z`)) / DAY_MS);
  const active = user?.packageStatus === 'ACTIVE' && daysLeft !== null && daysLeft >= 0;
  return { active, daysLeft, label: active ? 'CÒN HẠN' : 'CẦN GIA HẠN' };
}

export function getMemberReminders(user, bookings, now = new Date()) {
  const reminders = [];
  const membership = getMembershipSummary(user, now);
  if (!membership.active || membership.daysLeft <= 7) {
    reminders.push({ id: 'membership', title: membership.active ? 'Gói tập sắp hết hạn' : 'Đăng ký hoặc gia hạn gói tập',
      content: membership.active ? `Gói tập hết hạn ngày ${formatMemberDate(user.packageExpiry)} (${membership.daysLeft === 0 ? 'hôm nay' : `còn ${membership.daysLeft} ngày`}).`
        : 'Bạn chưa có gói tập còn hiệu lực. Hãy chọn gói phù hợp để đăng ký lớp.',
      href: '#/member/packages', action: 'Xem gói tập', icon: 'card_membership' });
  }
  for (const booking of getUpcomingBookings(bookings, now).filter(b => bookingStart(b) - now.getTime() <= 60 * 60 * 1000)) {
    reminders.push({ id: `session-${booking.id}`, title: `Sắp đến giờ: ${booking.className}`,
      content: `${formatMemberDate(booking.bookingDate)} · ${booking.timeSlot} · ${booking.roomName}`,
      href: '#/member/bookings', action: 'Xem lịch cá nhân', icon: 'event' });
  }
  for (const booking of bookings.filter(b => b.sessionStatus === 'CANCELLED' && b.bookingDate >= vietnamDate(now))) {
    reminders.push({ id: `cancelled-${booking.id}`, title: `Buổi học đã bị hủy: ${booking.className}`,
      content: `${formatMemberDate(booking.bookingDate)} · ${booking.timeSlot}. Vui lòng chọn buổi học khác.`,
      href: '#/member/schedule', action: 'Xem lịch lớp', icon: 'event_busy' });
  }
  return reminders;
}

export function getLatestProgress(records) {
  return [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id))[0] || null;
}

export function formatMeasurement(value, unit) {
  return value === null || value === undefined || value === '' ? 'Chưa đo' : `${value} ${unit}`;
}

export const ATTENDANCE_LABELS = { PRESENT: 'Có mặt', LATE: 'Đi muộn', ABSENT: 'Vắng mặt', EXCUSED: 'Vắng có phép', PENDING: 'Chưa điểm danh' };
export const BOOKING_LABELS = { CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy', CANCELLEDLATE: 'Hủy muộn', COMPLETED: 'Đã hoàn thành', NOSHOW: 'Vắng mặt' };

export function getSportTheme(sportName = '', className = '') {
  const s = `${String(sportName || '')} ${String(className || '')}`.toLowerCase();
  if (s.includes('bơi') || s.includes('swim') || s.includes('aqua')) {
    return {
      bg: 'bg-cyan-50/90 hover:bg-cyan-100/90',
      border: 'border-cyan-300',
      text: 'text-cyan-900',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      dot: 'bg-cyan-500',
      tag: 'BƠI LỘI',
      icon: 'pool'
    };
  }
  if (s.includes('yoga') || s.includes('pilates') || s.includes('thiền')) {
    return {
      bg: 'bg-purple-50/90 hover:bg-purple-100/90',
      border: 'border-purple-300',
      text: 'text-purple-900',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      dot: 'bg-purple-500',
      tag: 'YOGA & PILATES',
      icon: 'self_improvement'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
      border: 'border-emerald-300',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      tag: 'CẦU LÔNG',
      icon: 'sports_tennis'
    };
  }
  if (s.includes('gym') || s.includes('fitness') || s.includes('cardio') || s.includes('tạ')) {
    return {
      bg: 'bg-amber-50/90 hover:bg-amber-100/90',
      border: 'border-amber-300',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      tag: 'GYM & FITNESS',
      icon: 'fitness_center'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('muay') || s.includes('karate') || s.includes('judo')) {
    return {
      bg: 'bg-rose-50/90 hover:bg-rose-100/90',
      border: 'border-rose-300',
      text: 'text-rose-900',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      dot: 'bg-rose-500',
      tag: 'BOXING & VÕ THUẬT',
      icon: 'sports_mma'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('bóng chuyền') || s.includes('futsal')) {
    return {
      bg: 'bg-blue-50/90 hover:bg-blue-100/90',
      border: 'border-blue-300',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      dot: 'bg-blue-500',
      tag: 'BÓNG & ĐỒNG ĐỘI',
      icon: 'sports_basketball'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn') || s.includes('pickleball')) {
    return {
      bg: 'bg-lime-50/90 hover:bg-lime-100/90',
      border: 'border-lime-300',
      text: 'text-lime-900',
      badge: 'bg-lime-100 text-lime-800 border-lime-200',
      dot: 'bg-lime-500',
      tag: 'VỢT & BÓNG NHỎ',
      icon: 'sports_baseball'
    };
  }
  return {
    bg: 'bg-indigo-50/90 hover:bg-indigo-100/90',
    border: 'border-indigo-300',
    text: 'text-indigo-900',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    tag: 'THỂ THAO OLYMPIC',
    icon: 'military_tech'
  };
}
