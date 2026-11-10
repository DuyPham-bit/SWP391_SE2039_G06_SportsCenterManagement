import React from 'react';

export function PublishBar({ handleDiscardChanges, handleSaveAll, isEn, isSaving }) {
  return (
    <aside
      role="status"
      aria-label={isEn ? 'Unsaved changes alert bar' : 'Thanh cảnh báo thay đổi số liệu chưa lưu'}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl bg-brand-navy-900/95 text-white backdrop-blur-xl border-2 border-brand-sage-500/80 rounded-2xl px-5 py-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-slide-up"
    >
      <div className="flex items-center gap-3 text-left">
        <span className="w-3.5 h-3.5 rounded-full bg-brand-sage-400 animate-ping shrink-0" />
        <div>
          <div className="text-xs font-black uppercase tracking-wide text-brand-sage-300 flex items-center gap-1.5">
            <span>{isEn ? 'Unsaved Changes Detected' : 'Phát hiện thay đổi số liệu mới'}</span>
            <span className="text-[10px] bg-brand-sage-500/20 text-brand-sage-300 px-1.5 py-0.5 rounded border border-brand-sage-500/30">
              {isEn ? 'Auto-draft active' : 'Đã giữ trong nháp F5'}
            </span>
          </div>
          <div className="text-[11px] text-brand-navy-300 mt-0.5">
            {isEn
              ? 'Your edits survive F5 reload. Click Save to apply to server & live pages.'
              : 'Dữ liệu được tự động lưu tạm trên trình duyệt. Hãy bấm nút xanh để áp dụng chính thức lên hệ thống.'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        <button
          type="button"
          onClick={handleDiscardChanges}
          disabled={isSaving}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-brand-navy-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          {isEn ? 'Discard' : 'Hủy thay đổi'}
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-800 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-sage-600/40 transition-all flex items-center gap-2 cursor-pointer hover-lift"
        >
          <span className="material-symbols-outlined text-[17px]">save</span>
          <span>{isSaving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save All Changes' : 'Lưu Thay Đổi Ngay')}</span>
        </button>
      </div>
    </aside>
  );
}
