import React from 'react';

export function ScannedIdentifierBar({
  autoSubmit, handleExecuteCheckIn, identifier, isEn, processing, setAutoSubmit, setSoundEnabled,
  soundEnabled
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800 text-xs">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none text-brand-navy-700 dark:text-brand-navy-300 font-medium">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={e => setSoundEnabled(e.target.checked)}
            className="rounded text-brand-sage-700 dark:text-brand-sage-400 focus:ring-brand-sage-500 w-4 h-4 cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span>{isEn ? 'Beep Sound' : 'Âm thanh bíp'}</span>
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none text-brand-navy-700 dark:text-brand-navy-300 font-medium">
          <input
            type="checkbox"
            checked={autoSubmit}
            onChange={e => setAutoSubmit(e.target.checked)}
            className="rounded text-brand-sage-700 dark:text-brand-sage-400 focus:ring-brand-sage-500 w-4 h-4 cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-brand-sand-700 dark:text-brand-sand-400">bolt</span>
            <span>{isEn ? 'Auto Check-in' : 'Tự động xác thực'}</span>
          </span>
        </label>
      </div>

      {identifier && (
        <div className="flex items-center gap-2">
          <span className="text-brand-navy-500 dark:text-brand-navy-400 text-[11px] font-mono">
            {isEn ? 'Current ID:' : 'Mã hiện tại:'} <strong className="text-brand-sage-700 dark:text-brand-sage-300">{identifier}</strong>
          </span>
          <button
            type="button"
            onClick={() => handleExecuteCheckIn()}
            disabled={processing}
            className="px-3 py-1 rounded-lg bg-brand-sage-700 hover:bg-brand-sage-800 text-white font-chivo font-black text-[11px] uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50"
          >
            {processing ? '...' : (isEn ? 'Verify' : 'Xác Thực')}
          </button>
        </div>
      )}
    </div>
  );
}
