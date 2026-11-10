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
  if (!message && !title) return null;

  const styles = {
    error: {
      container: 'bg-brand-danger-50/95 border-brand-danger-300 text-brand-danger-950 shadow-sm shadow-brand-danger-500/10',
      badge: 'bg-brand-danger-200 text-brand-danger-900 border-brand-danger-300',
      icon: 'error',
      iconColor: 'text-brand-danger-600',
      handlingBox: 'bg-white/80 border-brand-danger-200 text-brand-danger-900',
      btn: 'bg-brand-danger-600 hover:bg-brand-danger-700 text-white shadow-sm'
    },
    warning: {
      container: 'bg-brand-sand-50/95 border-brand-sand-300 text-brand-sand-950 shadow-sm shadow-brand-sand-500/10',
      badge: 'bg-brand-sand-200 text-brand-sand-900 border-brand-sand-300',
      icon: 'warning',
      iconColor: 'text-brand-sand-700 dark:text-brand-sand-400',
      handlingBox: 'bg-white/80 border-brand-sand-200 text-brand-sand-900',
      btn: 'bg-brand-sand-600 hover:bg-brand-sand-700 text-white shadow-sm'
    },
    info: {
      container: 'bg-brand-teal-50/95 border-brand-teal-300 text-brand-teal-950 shadow-sm shadow-brand-teal-500/10',
      badge: 'bg-brand-teal-200 text-brand-teal-900 border-brand-teal-300',
      icon: 'info',
      iconColor: 'text-brand-teal-700 dark:text-brand-teal-400',
      handlingBox: 'bg-white/80 border-brand-teal-200 text-brand-teal-900',
      btn: 'bg-brand-teal-700 hover:bg-brand-teal-800 text-white shadow-sm'
    },
    success: {
      container: 'bg-brand-sage-50/95 border-brand-sage-300 text-brand-sage-950 shadow-sm shadow-brand-sage-500/10',
      badge: 'bg-brand-sage-200 text-brand-sage-900 border-brand-sage-300',
      icon: 'check_circle',
      iconColor: 'text-brand-sage-700 dark:text-brand-sage-400',
      handlingBox: 'bg-white/80 border-brand-sage-200 text-brand-sage-900',
      btn: 'bg-brand-sage-700 hover:bg-brand-sage-800 text-white shadow-sm'
    }
  };

  const current = styles[type] || styles.warning;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`p-4 rounded-2xl border flex items-start gap-3.5 transition-all text-sm ${current.container} ${className}`}
    >
      <div className={`p-1 rounded-lg shrink-0 ${current.iconColor}`}>
        <span className="material-symbols-outlined text-[24px]">
          {current.icon}
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        {title && (
          <h4 className="font-chivo font-bold text-sm tracking-tight text-brand-navy-900">
            {title}
          </h4>
        )}

        {message && (
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            {typeof message === 'string'
              ? message.replace(/\.?\s*Không tạo bản ghi trùng cho cùng lượt vào\.?/gi, '').trim()
              : message}
          </p>
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
          className="text-brand-navy-400 hover:text-brand-navy-700 p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}

export default BusinessAlert;
