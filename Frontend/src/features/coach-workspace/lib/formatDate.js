import { formatVietnamDateTime } from '../../../shared/lib/dateTime.js';

export function formatDate(value, isEn = false) {
  return formatVietnamDateTime(value, isEn);
}
