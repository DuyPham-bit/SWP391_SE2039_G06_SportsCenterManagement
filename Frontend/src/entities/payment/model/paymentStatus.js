/**
 * Payment Status constants and utilities
 */
export const PAYMENT_STATUS = {
  PENDING: 'Pending',
  SUCCESS: 'Success',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
};

export function formatVND(amount) {
  if (typeof amount !== 'number') return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function isPaymentSuccess(status) {
  return ['Success', 'Completed', 'Paid', 'Thành công'].includes(status);
}

export function getPaymentStatusMeta(status) {
  const norm = String(status || '').toLowerCase();
  if (['success', 'completed', 'paid', 'thành công'].includes(norm)) {
    return {
      label: 'Thành công',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800'
    };
  }
  if (['pending', 'processing', 'chờ xử lý'].includes(norm)) {
    return {
      label: 'Đang xử lý',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800'
    };
  }
  if (['refunded', 'hoàn tiền'].includes(norm)) {
    return {
      label: 'Đã hoàn tiền',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800'
    };
  }
  return {
    label: status || 'Thất bại',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800'
  };
}

