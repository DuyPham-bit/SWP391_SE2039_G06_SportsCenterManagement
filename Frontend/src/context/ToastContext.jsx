import React from 'react';
const { createContext, useContext, useState, useCallback, useEffect } = React;

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((payload, type = 'info', customDuration) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    let message = payload;
    let code = null;
    let proposedHandling = null;

    if (payload && typeof payload === 'object') {
      message = payload.message || String(payload);
      code = payload.code || null;
      proposedHandling = payload.proposedHandling || null;
    }

    const duration = customDuration ?? (type === 'error' && (code || proposedHandling) ? 7000 : (type === 'error' ? 5000 : 3500));
    setToasts(prev => [...prev, { id, message, code, proposedHandling, type, duration }]);

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
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#6ee7b7_0%,#10b981_40%,#047857_80%,#022c22_100%)]',
          orbShadow: 'shadow-[0_8px_18px_-2px_rgba(16,185,129,0.7),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2.5px_4px_rgba(0,0,0,0.5)]',
          cardBorder: 'border-emerald-300 dark:border-emerald-500/30',
          cardShadow: 'shadow-[0_20px_40px_-10px_rgba(16,185,129,0.22),0_8px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_50px_-12px_rgba(16,185,129,0.35),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30',
          dotColor: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
          beam: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
        };
      case 'error':
        return {
          label: 'Lỗi xử lý',
          icon: 'priority_high',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#fda4af_0%,#f43f5e_40%,#be123c_80%,#4c0519_100%)]',
          orbShadow: 'shadow-[0_8px_18px_-2px_rgba(244,63,94,0.7),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2.5px_4px_rgba(0,0,0,0.5)]',
          cardBorder: 'border-rose-300 dark:border-rose-500/30',
          cardShadow: 'shadow-[0_20px_40px_-10px_rgba(244,63,94,0.22),0_8px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_50px_-12px_rgba(244,63,94,0.35),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-rose-800 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/30',
          dotColor: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
          beam: 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
        };
      case 'warning':
        return {
          label: 'Cảnh báo',
          icon: 'warning',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#fde68a_0%,#f59e0b_40%,#d97706_80%,#451a03_100%)]',
          orbShadow: 'shadow-[0_8px_18px_-2px_rgba(245,158,11,0.7),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2.5px_4px_rgba(0,0,0,0.5)]',
          cardBorder: 'border-amber-300 dark:border-amber-500/30',
          cardShadow: 'shadow-[0_20px_40px_-10px_rgba(245,158,11,0.22),0_8px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_50px_-12px_rgba(245,158,11,0.35),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/30',
          dotColor: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
          beam: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
        };
      default:
        return {
          label: 'Thông báo',
          icon: 'info',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#93c5fd_0%,#3b82f6_40%,#1d4ed8_80%,#172554_100%)]',
          orbShadow: 'shadow-[0_8px_18px_-2px_rgba(59,130,246,0.7),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2.5px_4px_rgba(0,0,0,0.5)]',
          cardBorder: 'border-blue-300 dark:border-blue-500/30',
          cardShadow: 'shadow-[0_20px_40px_-10px_rgba(59,130,246,0.22),0_8px_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_50px_-12px_rgba(59,130,246,0.35),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-blue-800 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/30',
          dotColor: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]',
          beam: 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
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

      {/* 3D Floating Spatial Capsule Container (Top-Center VisionOS style) */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Thông báo hệ thống"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3.5 pointer-events-none w-full max-w-md sm:max-w-lg px-4"
      >
        {toasts.map(t => {
          const cfg = getToastConfig(t.type);
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto relative w-full flex items-center gap-3.5 px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl bg-white dark:bg-[#0c1322] toast-capsule-bg backdrop-blur-2xl border ${cfg.cardBorder} ${cfg.cardShadow} overflow-hidden animate-toast-3d ring-1 ring-slate-900/5 dark:ring-white/10 group transition-all duration-300 hover:scale-[1.01]`}
            >
              {/* 3D Top Specular Light Beam (Refraction Line) */}
              <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none" />

              {/* 3D Gemstone Orb Sphere (Perfect centering & breathing room) */}
              <div className={`relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cfg.orbBg} ${cfg.orbShadow}`}>
                {/* Specular Highlight Glint */}
                <div className="absolute top-1 left-2.5 w-3.5 h-1.5 rounded-full bg-white/80 blur-[0.3px] -rotate-35 pointer-events-none" />
                <span className="material-symbols-outlined text-[22px] text-white font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] select-none">
                  {cfg.icon}
                </span>
              </div>

              {/* Message & Context */}
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${cfg.tagColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                    <span>{cfg.label}</span>
                  </div>
                  {t.code && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/15">
                      {t.code}
                    </span>
                  )}
                </div>

                {/* Primary Message: High-Contrast Bold Text (WCAG AAA) */}
                <p className="text-[14px] font-extrabold text-slate-900 dark:text-white leading-snug break-words tracking-[-0.01em]">
                  {t.message}
                </p>

                {t.proposedHandling && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-inner">
                    <span className="font-bold flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 mb-1">
                      <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                      Hướng dẫn khắc phục:
                    </span>
                    <span>{t.proposedHandling}</span>
                  </div>
                )}
              </div>

              {/* Minimal Circular Glass Close Button (Centered vertically) */}
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Đóng thông báo"
                className="w-8 h-8 rounded-full bg-slate-100/80 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200/80 dark:border-white/10 active:scale-90 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>

              {/* Full-width Hairline Bottom Progress Bar with Track */}
              <div className="absolute bottom-0 inset-x-0 h-[2.5px] bg-slate-100 dark:bg-white/10 overflow-hidden pointer-events-none">
                <div
                  className={`h-full origin-left ${cfg.beam}`}
                  style={{
                    animation: `toast-progress-beam ${t.duration || 3500}ms linear forwards`
                  }}
                />
              </div>
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
              className="relative w-full max-w-md sm:max-w-lg rounded-3xl bg-white dark:bg-[#0c1322] border border-white/60 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] p-6 sm:p-7 overflow-hidden animate-modal-3d text-slate-900 dark:text-white"
            >
              {/* 3D Top Specular Light Refraction Beam */}
              <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/30 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Header Row: 3D Gemstone Orb Sphere + Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${cfg.orbBg} ${cfg.orbShadow}`}>
                      {/* Specular Highlight Glint */}
                      <div className="absolute top-1.5 left-3 w-4 h-2 rounded-full bg-white/80 blur-[0.4px] -rotate-35 pointer-events-none" />
                      <span className="material-symbols-outlined text-[24px] text-white font-bold drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] select-none">
                        {cfg.icon}
                      </span>
                    </div>
                    <div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${cfg.tagColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                        <span>{cfg.tagLabel}</span>
                      </div>
                      <h3 id="confirm-dialog-title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        {title}
                      </h3>
                    </div>
                  </div>

                  {/* Circular Glass Close Button */}
                  <button
                    type="button"
                    onClick={() => confirmDialog.resolve(false)}
                    aria-label="Đóng hộp thoại"
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 -mr-1 -mt-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                {/* Primary Message */}
                <p id="confirm-dialog-desc" className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed pt-1">
                  {message}
                </p>

                {/* Consequence / Detail Callout Box */}
                {detail && (
                  <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed ${cfg.detailBox}`}>
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 opacity-90">info</span>
                    <span className="font-semibold">{detail}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => confirmDialog.resolve(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {cancelText}
                  </button>

                  <button
                    type="button"
                    autoFocus
                    onClick={() => confirmDialog.resolve(true)}
                    className={`inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer ${cfg.confirmBtn}`}
                  >
                    <span className="material-symbols-outlined text-[17px]">{cfg.confirmIcon}</span>
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
