import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

// Helper to format messages concisely without raw developer boilerplates or specs
function formatToastMessage(payload) {
  if (!payload) return '';
  let msg = typeof payload === 'string' ? payload : (payload?.message || String(payload));
  msg = msg.replace(/^Error:\s*/i, '');
  // Remove technical spec sentences that belong in specs, not toast alerts
  msg = msg.replace(/\.?\s*Không tạo bản ghi trùng cho cùng lượt vào\.?/gi, '');
  msg = msg.replace(/\.?\s*Mọi ngoại lệ cần đúng quyền và có ghi nhận\.?/gi, '');
  msg = msg.replace(/\.?\s*hiển thị lý do không đủ điều kiện\.?/gi, '');
  msg = msg.trim();
  if (msg && !/[.!?]$/.test(msg)) {
    msg += '.';
  }
  return msg;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((payload, type = 'info', customDuration) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const message = formatToastMessage(payload);
    // Concise auto-dismiss timing: 4s for errors, 3s for others
    const duration = customDuration ?? (type === 'error' ? 4000 : 3000);

    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const showError = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const showWarning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
  const showInfo = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);

  // Global 3D Spatial Confirmation Dialog
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      let config = options;
      if (typeof options === 'string') {
        config = { message: options };
      }
      setConfirmDialog({
        ...config,
        resolve: (val) => {
          setConfirmDialog(null);
          resolve(val);
        }
      });
    });
  }, []);

  // Keyboard navigation (Esc to cancel, Enter to confirm) & body scroll locking
  useEffect(() => {
    if (!confirmDialog) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        confirmDialog.resolve(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmDialog.resolve(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [confirmDialog]);

  // Safety net: intercept window.alert so no browser alert popup ever appears again
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showWarning(String(msg || ''));
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showWarning]);

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          label: 'Thành công',
          icon: 'check',
          titleColor: 'text-emerald-700 dark:text-emerald-400',
          orbBg: 'bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#a7f3d0_25%,#10b981_60%,#047857_90%,#022c22_100%)]',
          orbShadow: 'shadow-[0_2px_8px_rgba(16,185,129,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.7),inset_0_-1.5px_2px_rgba(0,0,0,0.35)]',
          cardBorder: 'border-emerald-300 dark:border-emerald-500/30',
          cardShadow: 'shadow-[0_8px_20px_-4px_rgba(16,185,129,0.16),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_24px_-4px_rgba(16,185,129,0.22),0_4px_12px_-2px_rgba(0,0,0,0.5)]'
        };
      case 'error':
        return {
          label: 'Lỗi xử lý',
          icon: 'priority_high',
          titleColor: 'text-rose-700 dark:text-rose-400',
          orbBg: 'bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#fecdd3_25%,#f43f5e_60%,#be123c_90%,#4c0519_100%)]',
          orbShadow: 'shadow-[0_2px_8px_rgba(244,63,94,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.7),inset_0_-1.5px_2px_rgba(0,0,0,0.35)]',
          cardBorder: 'border-rose-300 dark:border-rose-500/30',
          cardShadow: 'shadow-[0_8px_20px_-4px_rgba(244,63,94,0.16),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_24px_-4px_rgba(244,63,94,0.22),0_4px_12px_-2px_rgba(0,0,0,0.5)]'
        };
      case 'warning':
        return {
          label: 'Cảnh báo',
          icon: 'warning',
          titleColor: 'text-amber-700 dark:text-amber-400',
          orbBg: 'bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#fef3c7_25%,#f59e0b_60%,#d97706_90%,#451a03_100%)]',
          orbShadow: 'shadow-[0_2px_8px_rgba(245,158,11,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.7),inset_0_-1.5px_2px_rgba(0,0,0,0.35)]',
          cardBorder: 'border-amber-300 dark:border-amber-500/30',
          cardShadow: 'shadow-[0_8px_20px_-4px_rgba(245,158,11,0.16),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_24px_-4px_rgba(245,158,11,0.22),0_4px_12px_-2px_rgba(0,0,0,0.5)]'
        };
      default:
        return {
          label: 'Thông báo',
          icon: 'info',
          titleColor: 'text-blue-700 dark:text-blue-400',
          orbBg: 'bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#dbeafe_25%,#3b82f6_60%,#1d4ed8_90%,#172554_100%)]',
          orbShadow: 'shadow-[0_2px_8px_rgba(59,130,246,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.7),inset_0_-1.5px_2px_rgba(0,0,0,0.35)]',
          cardBorder: 'border-blue-300 dark:border-blue-500/30',
          cardShadow: 'shadow-[0_8px_20px_-4px_rgba(59,130,246,0.16),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_24px_-4px_rgba(59,130,246,0.22),0_4px_12px_-2px_rgba(0,0,0,0.5)]'
        };
    }
  };

  const getConfirmConfig = (type = 'warning') => {
    switch (type) {
      case 'danger':
        return {
          tagLabel: 'Hành động nguy hiểm',
          tagColor: 'text-rose-800 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/30',
          dotColor: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#fda4af_0%,#f43f5e_40%,#be123c_80%,#4c0519_100%)]',
          orbShadow: 'shadow-[0_10px_25px_-3px_rgba(244,63,94,0.6),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.5)]',
          icon: 'delete_forever',
          detailBox: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200',
          confirmBtn: 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] shadow-rose-600/30',
          confirmIcon: 'delete'
        };
      case 'info':
      case 'success':
        return {
          tagLabel: 'Xác nhận thông tin',
          tagColor: 'text-teal-800 dark:text-teal-300 bg-teal-100/90 dark:bg-teal-500/20 border-teal-300 dark:border-teal-500/30',
          dotColor: 'bg-teal-500 shadow-[0_0_8px_#14b8a6]',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#5eead4_0%,#14b8a6_40%,#0f766e_80%,#042f2e_100%)]',
          orbShadow: 'shadow-[0_10px_25px_-3px_rgba(20,184,166,0.6),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.5)]',
          icon: 'help',
          detailBox: 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60 text-teal-900 dark:text-teal-200',
          confirmBtn: 'bg-gradient-to-r from-[#207279] via-[#2D9B8E] to-[#E59E38] hover:from-[#1A5E63] hover:to-[#D97706] shadow-teal-600/30',
          confirmIcon: 'check'
        };
      case 'warning':
      default:
        return {
          tagLabel: 'Cảnh báo hệ thống',
          tagColor: 'text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/30',
          dotColor: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#fde68a_0%,#f59e0b_40%,#d97706_80%,#451a03_100%)]',
          orbShadow: 'shadow-[0_10px_25px_-3px_rgba(245,158,11,0.6),inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-3px_5px_rgba(0,0,0,0.5)]',
          icon: 'warning',
          detailBox: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
          confirmBtn: 'bg-gradient-to-r from-[#D97706] to-[#92400E] hover:from-[#B45309] hover:to-[#78350F] shadow-amber-600/30',
          confirmIcon: 'check'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, confirm, removeToast }}>
      {children}

      {/* Sleek Floating Spatial Pill Toast (Top-Center compact pill) */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Thông báo hệ thống"
        className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none w-fit max-w-[92vw] sm:max-w-lg px-3"
      >
        {toasts.map(t => {
          const cfg = getToastConfig(t.type);
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto relative flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-white/95 dark:bg-[#0c1322]/95 backdrop-blur-xl border ${cfg.cardBorder} ${cfg.cardShadow} shadow-lg overflow-hidden animate-toast-3d ring-1 ring-slate-900/5 dark:ring-white/10 group transition-all duration-300 hover:scale-[1.01]`}
            >
              {/* 3D Top Specular Light Beam (Refraction Line) */}
              <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none" />

              {/* 3D Gemstone Orb Sphere (Compact & centered) */}
              <div className={`relative w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${cfg.orbBg} ${cfg.orbShadow}`}>
                <span className="material-symbols-outlined text-[15px] text-white font-bold drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.5)] select-none">
                  {cfg.icon}
                </span>
              </div>

              {/* Concise Message Text */}
              <p className="text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-snug break-words">
                {t.message}
              </p>

              {/* Minimal Circular Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Đóng thông báo"
                className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* 3D Spatial Confirmation Dialog Modal */}
      {confirmDialog && (() => {
        const type = confirmDialog.type || 'warning';
        const cfg = getConfirmConfig(type);

        let title = confirmDialog.title;
        let message = confirmDialog.message || '';
        let detail = confirmDialog.detail || null;

        // Smart multiline parsing if newline is present in string (like the browser confirm prompt)
        if (!detail && message.includes('\n')) {
          const parts = message.split('\n');
          message = parts[0];
          detail = parts.slice(1).join('\n');
        }

        // Smart prefix parsing if message starts with 'Cảnh báo:' or 'Warning:'
        if (!title) {
          if (message.toLowerCase().startsWith('cảnh báo:') || message.toLowerCase().startsWith('warning:')) {
            title = message.toLowerCase().startsWith('warning:') ? 'System Warning' : 'Cảnh báo hệ thống';
            message = message.replace(/^(cảnh báo:|warning:)\s*/i, '');
          } else {
            title = type === 'danger' ? 'Xác nhận xóa' : 'Xác nhận hành động';
          }
        }

        const confirmText = confirmDialog.confirmText || 'Xác nhận';
        const cancelText = confirmDialog.cancelText || 'Hủy bỏ';

        return (
          <div
            role="presentation"
            onClick={() => confirmDialog.resolve(false)}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-desc"
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-white dark:bg-[#0c1322] border border-white/60 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] p-5 sm:p-6 overflow-hidden animate-modal-3d text-slate-900 dark:text-white"
            >
              {/* 3D Top Specular Light Refraction Beam */}
              <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-3.5">
                {/* Header Row: 3D Gemstone Orb Sphere + Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.orbBg} ${cfg.orbShadow}`}>
                      <span className="material-symbols-outlined text-[20px] text-white font-bold drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] select-none">
                        {cfg.icon}
                      </span>
                    </div>
                    <div>
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${cfg.tagColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                        <span>{cfg.tagLabel}</span>
                      </div>
                      <h3 id="confirm-dialog-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                        {title}
                      </h3>
                    </div>
                  </div>

                  {/* Circular Glass Close Button */}
                  <button
                    type="button"
                    onClick={() => confirmDialog.resolve(false)}
                    aria-label="Đóng hộp thoại"
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 -mr-0.5 -mt-0.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Primary Message */}
                <p id="confirm-dialog-desc" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed pt-0.5">
                  {message}
                </p>

                {detail && (
                  <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs leading-relaxed ${cfg.detailBox}`}>
                    <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5 opacity-90">info</span>
                    <span className="font-semibold">{detail}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => confirmDialog.resolve(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {cancelText}
                  </button>

                  <button
                    type="button"
                    autoFocus
                    onClick={() => confirmDialog.resolve(true)}
                    className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer ${cfg.confirmBtn}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cfg.confirmIcon}</span>
                    <span>{confirmText}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
      confirm: async () => false,
      removeToast: () => {}
    };
  }
  return context;
}

export function useConfirm() {
  const { confirm } = useToast();
  return confirm;
}
