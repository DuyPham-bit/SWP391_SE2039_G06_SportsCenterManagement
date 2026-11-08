import { formatVietnamDateTime, formatVietnamDate } from '../../../shared/lib/dateTime.js';

export const fmtDate = (v) => {
  try {
    return formatVietnamDateTime(v, false, { hour12: false });
  } catch {
    return '—';
  }
};

export const fmtDateOnly = (v) => {
  try {
    return formatVietnamDate(v);
  } catch {
    return '—';
  }
};
