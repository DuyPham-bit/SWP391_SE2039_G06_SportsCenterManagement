import { vietnamDate } from '../../../shared/lib/dateTime.js';

// Format currency
export const money = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0 ₫';
  return Number(val).toLocaleString('vi-VN') + ' ₫';
};

// Current Month/Year helper
export const currentPeriod = () => {
  const [year, month] = vietnamDate().split('-').map(Number);
  return { year, month };
};
