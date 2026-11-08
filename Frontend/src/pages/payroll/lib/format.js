import { formatVietnamDate, vietnamDate } from '../../../shared/lib/dateTime.js';

// Format currency
export const money = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0 ₫';
  return Number(val).toLocaleString('vi-VN') + ' ₫';
};

// Format short date
export const dt = (d) => {
  if (!d) return '—';
  try {
    return formatVietnamDate(d);
  } catch {
    return String(d);
  }
};

// Current Month/Year helper
export const currentPeriod = () => {
  const [year, month] = vietnamDate().split('-').map(Number);
  return { year, month };
};
