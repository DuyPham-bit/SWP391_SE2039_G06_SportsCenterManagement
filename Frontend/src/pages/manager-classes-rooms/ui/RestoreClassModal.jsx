import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { ConfirmRestore } from './ConfirmRestore.jsx';
import { classApi } from '../../../entities/class/index.js';

export function RestoreClassModal({ busy, executeAction, isEn, modal, setModal }) {
  return (
    <Modal
      isOpen={modal?.type === 'restore'}
      onClose={() => !busy && setModal(null)}
      title={isEn ? 'Restore Cancelled Class' : 'Mở lại lớp đã hủy'}
    >
      {modal?.type === 'restore' && (
        <ConfirmRestore
          row={modal.row}
          busy={busy}
          isEn={isEn}
          onClose={() => setModal(null)}
          onConfirm={() =>
            executeAction(async () => {
              await classApi.restore(modal.row.id);
              setModal(null);
            }, isEn ? 'Class reopened in draft status.' : 'Đã mở lại lớp dưới dạng bản nháp.')
          }
        />
      )}
    </Modal>
  );
}
