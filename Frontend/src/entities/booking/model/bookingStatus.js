export const BOOKING_STATUS = {
  CONFIRMED: 'Confirmed',
  ATTENDED: 'Attended',
  CANCELLED: 'Cancelled',
  WAITLISTED: 'Waitlisted',
  NO_SHOW: 'NoShow'
};

export function getBookingStatusMeta(status) {
  const norm = String(status || '').toLowerCase();
  if (['confirmed', 'đã đặt', 'active'].includes(norm)) {
    return {
      label: 'Đã xác nhận',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800'
    };
  }
  if (['attended', 'đã tham gia', 'có mặt'].includes(norm)) {
    return {
      label: 'Đã tham gia',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    };
  }
  if (['waitlisted', 'chờ xếp lớp'].includes(norm)) {
    return {
      label: 'Danh sách chờ',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800'
    };
  }
  return {
    label: status || 'Đã hủy',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  };
}

