import React, { useState } from 'react';
import { Button } from '../../../shared/ui/Button.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';

export function CancelBookingButton({
  booking,
  onCancel,
  loading = false,
  className = ''
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    if (!booking) return;
    try {
      await onCancel(booking.id);
      setConfirmOpen(false);
    } catch {
      // Handled by caller
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => setConfirmOpen(true)}
        className={`text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 ${className}`}
      >
        Hủy đặt chỗ
      </Button>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận hủy đặt chỗ"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Bạn có chắc chắn muốn hủy đặt chỗ cho buổi học{' '}
            <strong className="text-slate-900 dark:text-slate-100">{booking?.className || 'này'}</strong> vào lúc{' '}
            <strong className="text-slate-900 dark:text-slate-100">{booking?.startTime || ''}</strong> không?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Đóng
            </Button>
            <Button variant="danger" size="sm" loading={loading} onClick={handleConfirm}>
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default CancelBookingButton;

