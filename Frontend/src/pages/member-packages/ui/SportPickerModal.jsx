import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { translatePackageName, translateSportName } from '../../../shared/i18n/i18nHelper.js';

/** Member must tick exactly `pkg.allowedSports` sports before continuing to checkout. */
export function SportPickerModal({ isEn, isOpen, onClose, onConfirm, pkg, selected, setSelected, sports }) {
  if (!pkg) return null;
  const required = Number(pkg.allowedSports || 0);
  const toggle = (id) => setSelected(prev => {
    if (prev.includes(id)) return prev.filter(x => x !== id);
    return prev.length >= required ? prev : [...prev, id];
  });
  const ready = selected.length === required;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEn ? `Choose ${required} sports` : `Chọn ${required} bộ môn`}
    >
      <div className="space-y-4">
        <p className="text-sm text-brand-navy-600 dark:text-brand-navy-300">
          {isEn
            ? `${translatePackageName(pkg.name, isEn)} includes exactly ${required} sports. Selected: ${selected.length}/${required}.`
            : `Gói ${pkg.name} bao gồm đúng ${required} bộ môn. Đã chọn: ${selected.length}/${required}.`}
        </p>
        {sports.length === 0 ? (
          <p className="text-sm text-brand-danger-700">{isEn ? 'No active sports available.' : 'Chưa có bộ môn nào đang mở.'}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sports.map(sport => {
              const checked = selected.includes(sport.id);
              const disabled = !checked && selected.length >= required;
              return (
                <label
                  key={sport.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                    checked
                      ? 'bg-brand-sage-50 border-brand-sage-500 text-brand-sage-900'
                      : disabled
                      ? 'border-brand-navy-200 text-brand-navy-400 cursor-not-allowed'
                      : 'border-brand-navy-200 text-brand-navy-800 hover:bg-brand-navy-50 cursor-pointer'
                  }`}
                >
                  <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(sport.id)} />
                  <span>{translateSportName(sport.name, isEn)}</span>
                </label>
              );
            })}
          </div>
        )}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-navy-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase rounded-lg border border-brand-navy-300 text-brand-navy-700 hover:bg-brand-navy-50"
          >
            {isEn ? 'Cancel' : 'Hủy'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ready}
            className="px-6 py-2 text-xs font-bold uppercase rounded-lg bg-brand-sage-700 hover:bg-brand-sage-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEn ? 'Confirm sports' : 'Xác nhận môn'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
