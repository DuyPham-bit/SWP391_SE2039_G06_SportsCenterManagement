import { parseCalendarDate } from '../../../shared/lib/dateTime.js';
import { translateClassName, translateRoomName } from '../../../shared/i18n/i18nHelper.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function vietnamDate(now = new Date()) {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function formatMemberDate(value, isEn = false) {
  if (!value) return isEn ? 'N/A' : 'Chưa có thông tin';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? (isEn ? 'N/A' : 'Chưa có thông tin') : date.toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function formatMemberDateTime(value, isEn = false) {
  if (!value) return isEn ? 'N/A' : 'Chưa có thông tin';
  // SQL Server DateTime values serialized without an offset are stored as UTC.
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? (isEn ? 'N/A' : 'Chưa có thông tin') : date.toLocaleString(isEn ? 'en-US' : 'vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export const DAY_LABELS = ['CHỦ NHẬT', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'];
export const DAY_LABELS_EN = ['SUNDAY', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function parseIsoDate(dateStr) {
  if (!dateStr) return parseCalendarDate();
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatIsoDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getMonday(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 12));
}

export function getWeekDays(startDate) {
  const monday = getMonday(startDate);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setUTCDate(monday.getUTCDate() + i);
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

export function getMembershipSummary(user, now = new Date(), isEn = false) {
  const expiry = String(user?.packageExpiry || '').slice(0, 10);
  const expiryTime = /^\d{4}-\d{2}-\d{2}$/.test(expiry) ? Date.parse(`${expiry}T00:00:00Z`) : NaN;
  const daysLeft = Number.isNaN(expiryTime) ? null : Math.round((expiryTime - Date.parse(`${vietnamDate(now)}T00:00:00Z`)) / DAY_MS);
  const active = user?.packageStatus === 'ACTIVE' && daysLeft !== null && daysLeft >= 0;
  return {
    active,
    daysLeft,
    label: active
      ? (isEn ? 'ACTIVE' : 'CÒN HẠN')
      : (isEn ? 'NEEDS RENEWAL' : 'CẦN GIA HẠN')
  };
}

export function getMemberReminders(user, bookings, now = new Date(), isEn = false) {
  const reminders = [];
  const membership = getMembershipSummary(user, now, isEn);
  if (!membership.active || membership.daysLeft <= 7) {
    reminders.push({
      id: 'membership',
      title: membership.active
        ? (isEn ? 'Package Expiring Soon' : 'Gói tập sắp hết hạn')
        : (isEn ? 'Sign up or Renew Package' : 'Đăng ký hoặc gia hạn gói tập'),
      content: membership.active
        ? (isEn
            ? `Membership expires on ${formatMemberDate(user.packageExpiry, isEn)} (${membership.daysLeft === 0 ? 'today' : `${membership.daysLeft} days left`}).`
            : `Gói tập hết hạn ngày ${formatMemberDate(user.packageExpiry)} (${membership.daysLeft === 0 ? 'hôm nay' : `còn ${membership.daysLeft} ngày`}).`)
        : (isEn
            ? 'You do not have an active package. Choose a suitable package to book classes.'
            : 'Bạn chưa có gói tập còn hiệu lực. Hãy chọn gói phù hợp để đăng ký lớp.'),
      href: '#/member/packages',
      action: isEn ? 'View Packages' : 'Xem gói tập',
      icon: 'card_membership'
    });
  }
  for (const booking of getUpcomingBookings(bookings, now).filter(b => bookingStart(b) - now.getTime() <= 60 * 60 * 1000)) {
    reminders.push({
      id: `session-${booking.id}`,
      title: isEn ? `Upcoming Class: ${translateClassName(booking.className, isEn)}` : `Sắp đến giờ: ${booking.className}`,
      content: `${formatMemberDate(booking.bookingDate, isEn)} · ${booking.timeSlot} · ${translateRoomName(booking.roomName, isEn)}`,
      href: '#/member/bookings',
      action: isEn ? 'My Bookings' : 'Xem lịch cá nhân',
      icon: 'event'
    });
  }
  for (const booking of bookings.filter(b => b.sessionStatus === 'CANCELLED' && b.bookingDate >= vietnamDate(now))) {
    reminders.push({
      id: `cancelled-${booking.id}`,
      title: isEn ? `Class Cancelled: ${translateClassName(booking.className, isEn)}` : `Buổi học đã bị hủy: ${booking.className}`,
      content: `${formatMemberDate(booking.bookingDate, isEn)} · ${booking.timeSlot}. ${isEn ? 'Please choose another class session.' : 'Vui lòng chọn buổi học khác.'}`,
      href: '#/member/schedule',
      action: isEn ? 'Class Timetable' : 'Xem lịch lớp',
      icon: 'event_busy'
    });
  }
  return reminders;
}

export function getLatestProgress(records) {
  return [...records].sort((a, b) => String(b.date).localeCompare(String(a.date)) || Number(b.id) - Number(a.id))[0] || null;
}

export function formatMeasurement(value, unit, isEn = false) {
  return value === null || value === undefined || value === '' ? (isEn ? 'Not measured' : 'Chưa đo') : `${value} ${unit}`;
}

export const ATTENDANCE_LABELS = { PRESENT: 'Có mặt', LATE: 'Đi muộn', ABSENT: 'Vắng mặt', EXCUSED: 'Vắng có phép', PENDING: 'Chưa điểm danh' };
export const ATTENDANCE_LABELS_EN = { PRESENT: 'Present', LATE: 'Late', ABSENT: 'Absent', EXCUSED: 'Excused', PENDING: 'Pending' };

export const BOOKING_LABELS = {
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  CANCELLEDLATE: 'Hủy muộn',
  COMPLETED: 'Đã hoàn thành',
  NOSHOW: 'Vắng mặt',
  PENDING: 'Chờ duyệt',
  BOOKED: 'Đã đặt chỗ'
};
export const BOOKING_LABELS_EN = {
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  CANCELLEDLATE: 'Late Cancel',
  COMPLETED: 'Completed',
  NOSHOW: 'No Show',
  PENDING: 'Pending',
  BOOKED: 'Booked'
};

export function getBookingStatusLabel(status, isEn = false) {
  const norm = String(status || '').toUpperCase();
  return (isEn ? BOOKING_LABELS_EN[norm] : BOOKING_LABELS[norm]) || status;
}

export function getSportTheme(sportName = '', className = '', isEn = false) {
  const s = `${String(sportName || '')} ${String(className || '')}`.toLowerCase();
  if (s.includes('bơi') || s.includes('swim') || s.includes('aqua')) {
    return {
      bg: 'bg-brand-teal-50/90 hover:bg-brand-teal-100/90',
      border: 'border-brand-teal-300',
      text: 'text-brand-teal-900 dark:text-brand-teal-400',
      badge: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200',
      dot: 'bg-brand-teal-500',
      tag: isEn ? 'SWIMMING' : 'BƠI LỘI',
      icon: 'pool'
    };
  }
  if (s.includes('yoga') || s.includes('pilates') || s.includes('thiền')) {
    return {
      bg: 'bg-brand-navy-50/90 hover:bg-brand-navy-100/90',
      border: 'border-brand-navy-300',
      text: 'text-brand-navy-900',
      badge: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-200',
      dot: 'bg-brand-navy-700',
      tag: isEn ? 'YOGA & PILATES' : 'YOGA & PILATES',
      icon: 'self_improvement'
    };
  }
  if (s.includes('cầu lông') || s.includes('badminton')) {
    return {
      bg: 'bg-brand-sage-50/90 hover:bg-brand-sage-100/90',
      border: 'border-brand-sage-300',
      text: 'text-brand-sage-900 dark:text-brand-sage-400',
      badge: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-200',
      dot: 'bg-brand-sage-500',
      tag: isEn ? 'BADMINTON' : 'CẦU LÔNG',
      icon: 'sports_tennis'
    };
  }
  if (s.includes('gym') || s.includes('fitness') || s.includes('cardio') || s.includes('tạ')) {
    return {
      bg: 'bg-brand-sand-50/90 hover:bg-brand-sand-100/90',
      border: 'border-brand-sand-300',
      text: 'text-brand-sand-900 dark:text-brand-sand-400',
      badge: 'bg-brand-sand-100 text-brand-sand-800 border-brand-sand-200',
      dot: 'bg-brand-sand-500',
      tag: isEn ? 'GYM & FITNESS' : 'GYM & FITNESS',
      icon: 'fitness_center'
    };
  }
  if (s.includes('boxing') || s.includes('võ') || s.includes('kickfit') || s.includes('muay') || s.includes('karate') || s.includes('judo')) {
    return {
      bg: 'bg-brand-danger-50/90 hover:bg-brand-danger-100/90',
      border: 'border-brand-danger-300',
      text: 'text-brand-danger-900 dark:text-brand-danger-400',
      badge: 'bg-brand-danger-100 text-brand-danger-800 border-brand-danger-200',
      dot: 'bg-brand-danger-500',
      tag: isEn ? 'BOXING & MARTIAL ARTS' : 'BOXING & VÕ THUẬT',
      icon: 'sports_mma'
    };
  }
  if (s.includes('bóng rổ') || s.includes('bóng đá') || s.includes('bóng chuyền') || s.includes('futsal')) {
    return {
      bg: 'bg-brand-teal-50/90 hover:bg-brand-teal-100/90',
      border: 'border-brand-teal-300',
      text: 'text-brand-teal-900 dark:text-brand-teal-400',
      badge: 'bg-brand-teal-100 text-brand-teal-800 border-brand-teal-200',
      dot: 'bg-brand-teal-500',
      tag: isEn ? 'TEAM SPORTS & BALL' : 'BÓNG & ĐỒNG ĐỘI',
      icon: 'sports_basketball'
    };
  }
  if (s.includes('tennis') || s.includes('bóng bàn') || s.includes('pickleball')) {
    return {
      bg: 'bg-brand-sage-50/90 hover:bg-brand-sage-100/90',
      border: 'border-brand-sage-300',
      text: 'text-brand-sage-900 dark:text-brand-sage-400',
      badge: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-200',
      dot: 'bg-brand-sage-500',
      tag: isEn ? 'RACKET SPORTS' : 'VỢT & BÓNG NHỎ',
      icon: 'sports_baseball'
    };
  }
  return {
    bg: 'bg-brand-navy-50/90 hover:bg-brand-navy-100/90',
    border: 'border-brand-navy-300',
    text: 'text-brand-navy-900',
    badge: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-200',
    dot: 'bg-brand-navy-700',
    tag: isEn ? 'OLYMPIC SPORTS' : 'THỂ THAO OLYMPIC',
    icon: 'military_tech'
  };
}
