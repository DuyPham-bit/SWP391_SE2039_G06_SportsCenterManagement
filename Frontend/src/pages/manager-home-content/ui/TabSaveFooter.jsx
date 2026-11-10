import React from 'react';

// Save / discard footer shown at the bottom of every editor tab.
export function TabSaveFooter({ handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving }) {
  return (
    <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-navy-50/70 dark:bg-brand-navy-800/40 p-4 rounded-xl">
      <div className="flex items-center gap-2 text-xs">
        <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-brand-sand-400 animate-pulse' : 'bg-brand-sage-500'}`} />
        <span className="font-semibold text-brand-navy-600 dark:text-brand-navy-300">
          {isDirty
            ? (isEn ? 'Unsaved changes. Click "Save All Changes" to apply.' : 'Có thay đổi chưa lưu. Hãy bấm "Lưu Toàn Bộ Thay Đổi" để áp dụng.')
            : (isEn ? 'All changes synchronized with server.' : 'Toàn bộ số liệu đã được lưu và đồng bộ với máy chủ.')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDiscardChanges}
          disabled={!isDirty || isSaving}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-600 border border-brand-navy-200 dark:border-brand-navy-600 text-brand-navy-700 dark:text-brand-navy-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isEn ? 'Discard Changes' : 'Hủy thay đổi'}
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={!isDirty || isSaving}
          className="px-5 py-2 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-brand-sage-700/25 transition-all flex items-center gap-1.5 cursor-pointer hover-lift disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isSaving ? 'sync' : 'save'}
          </span>
          <span>
            {isSaving
              ? (isEn ? 'Saving...' : 'Đang lưu...')
              : (isEn ? 'Save All Changes' : 'Lưu Toàn Bộ Thay Đổi')}
          </span>
        </button>
      </div>
    </div>
  );
}
