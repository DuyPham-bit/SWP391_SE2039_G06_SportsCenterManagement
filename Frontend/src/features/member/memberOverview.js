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

export function bookingStart(booking) {
  const time = booking.startTime || booking.timeSlot?.split(' - ')[0];
  if (!booking.bookingDate || !time) return NaN;
  return new Date(`${booking.bookingDate}T${time.slice(0, 5)}:00+07:00`).getTime();
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
  for (const booking of getUpcomingBookings(bookings, now).filter(b => bookingStart(b) - now.getTime() <= DAY_MS)) {
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
