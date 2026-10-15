import React from 'react';

/**
 * BusinessAlert - Component chuẩn hóa hiển thị Unhappy Cases & Exceptions
 * Tuân thủ hướng dẫn UI/UX Pro Max (Accessibility, High Contrast, Error Clarity & Actionable Recovery)
 */
export function BusinessAlert({
  type = 'warning', // 'error' | 'warning' | 'info' | 'success'
  title,
  message,
  code,
  proposedHandling,
  actionText,
  onAction,
  onClose,
  className = ''
}) {
  if (!message && !title && !proposedHandling) return null;

  const styles = {
    error: {
      container: 'bg-red-50/95 border-red-300 text-red-950 shadow-sm shadow-red-500/10',
      badge: 'bg-red-200 text-red-900 border-red-300',
      icon: 'error',
      iconColor: 'text-red-600',
      handlingBox: 'bg-white/80 border-red-200 text-red-900',
      btn: 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
    },
    warning: {
      container: 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-sm shadow-amber-500/10',
      badge: 'bg-amber-200 text-amber-900 border-amber-300',
      icon: 'warning',
      iconColor: 'text-amber-600',
      handlingBox: 'bg-white/80 border-amber-200 text-amber-900',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
    },
    info: {
      container: 'bg-sky-50/95 border-sky-300 text-sky-950 shadow-sm shadow-sky-500/10',
      badge: 'bg-sky-200 text-sky-900 border-sky-300',
      icon: 'info',
      iconColor: 'text-sky-600',
      handlingBox: 'bg-white/80 border-sky-200 text-sky-900',
      btn: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
    },
    success: {
      container: 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-sm shadow-emerald-500/10',
      badge: 'bg-emerald-200 text-emerald-900 border-emerald-300',
      icon: 'check_circle',
      iconColor: 'text-emerald-600',
      handlingBox: 'bg-white/80 border-emerald-200 text-emerald-900',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
    }
  };

  const current = styles[type] || styles.warning;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all text-sm ${current.container} ${className}`}
    >
      <div className={`p-1 rounded-lg shrink-0 ${current.iconColor}`}>
        <span className="material-symbols-outlined text-[24px]">
          {current.icon}
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {code && (
            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border uppercase tracking-wider ${current.badge}`}>
              Mã: {code}
            </span>
          )}
          {title && (
            <h4 className="font-chivo font-bold text-sm tracking-tight text-slate-900">
              {title}
            </h4>
          )}
        </div>

        {message && (
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            {message}
          </p>
        )}

        {proposedHandling && (
          <div className={`p-2.5 rounded-lg border text-xs leading-relaxed mt-2 ${current.handlingBox}`}>
            <div className="flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider mb-1 text-slate-700">
              <span className="material-symbols-outlined text-[15px] text-amber-600">lightbulb</span>
              <span>Hướng dẫn xử lý nghiệp vụ:</span>
            </div>
            <p className="font-normal text-slate-800">{proposedHandling}</p>
          </div>
        )}

        {actionText && onAction && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onAction}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-colors min-h-[36px] ${current.btn}`}
            >
              {actionText}
            </button>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thông báo"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}
