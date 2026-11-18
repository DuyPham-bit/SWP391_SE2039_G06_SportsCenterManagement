import React from 'react';

const timeFormat = date => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** Real save state: unsaved / saving / saved at HH:mm / API error. */
export function saveStatusView(saveStatus, isDirty, t) {
  if (saveStatus.state === 'saving') return { tone: 'busy', text: t('homeContent.status.saving') };
  if (saveStatus.state === 'error') return { tone: 'error', text: saveStatus.message };
  if (isDirty) return { tone: 'dirty', text: t('homeContent.status.unsaved') };
  if (saveStatus.state === 'saved') return { tone: 'ok', text: t('homeContent.status.savedAt', { time: timeFormat(saveStatus.at) }) };
  return { tone: 'ok', text: t('homeContent.status.upToDate') };
}

const DOT = {
  busy: 'bg-brand-teal-500 animate-pulse',
  error: 'bg-brand-danger-600',
  dirty: 'bg-brand-sand-400 animate-pulse',
  ok: 'bg-brand-sage-500'
};

export function SaveStatusText({ saveStatus, isDirty, t, className = '' }) {
  const view = saveStatusView(saveStatus, isDirty, t);
  return (
    <span role={view.tone === 'error' ? 'alert' : 'status'} className={`flex items-center gap-2 ${className}`}>
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT[view.tone]}`} />
      <span className={view.tone === 'error' ? 'font-semibold text-brand-danger-700 dark:text-brand-danger-300' : 'font-semibold'}>{view.text}</span>
    </span>
  );
}

// Save / discard footer shown at the bottom of every editor tab; saves only that tab's section.
export function TabSaveFooter({ handleDiscardChanges, handleSaveSection, isDirty, isSectionDirty, isSaving, saveStatus, t }) {
  return (
    <div className="border-t border-brand-navy-100 dark:border-brand-navy-800 pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-brand-navy-50/70 dark:bg-brand-navy-800/40 p-4 rounded-xl">
      <SaveStatusText saveStatus={saveStatus} isDirty={isDirty} t={t} className="text-xs text-brand-navy-600 dark:text-brand-navy-300" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDiscardChanges}
          disabled={!isDirty || isSaving}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-600 border border-brand-navy-200 dark:border-brand-navy-600 text-brand-navy-700 dark:text-brand-navy-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('homeContent.action.discard')}
        </button>
        <button
          type="button"
          onClick={handleSaveSection}
          disabled={!isSectionDirty || isSaving}
          className="px-5 py-2 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-brand-sage-700/25 transition-all flex items-center gap-1.5 cursor-pointer hover-lift disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-[16px] ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'sync' : 'save'}</span>
          <span>{isSaving ? t('homeContent.status.saving') : t('homeContent.action.saveSection')}</span>
        </button>
      </div>
    </div>
  );
}
