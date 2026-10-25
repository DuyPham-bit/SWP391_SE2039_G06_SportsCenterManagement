const { createContext, useContext, useState, useCallback } = React;

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

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

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
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
              className={`pointer-events-auto relative w-full flex items-start gap-3.5 px-4.5 py-4 rounded-2xl bg-white dark:bg-[#0c1322] toast-capsule-bg backdrop-blur-2xl border ${cfg.cardBorder} ${cfg.cardShadow} overflow-hidden animate-toast-3d ring-1 ring-slate-900/5 dark:ring-white/10 group transition-all duration-300 hover:scale-[1.01]`}
            >
              {/* 3D Top Specular Light Beam (Refraction Line) */}
              <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none" />

              {/* 3D Gemstone Orb Sphere */}
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.orbBg} ${cfg.orbShadow}`}>
                {/* Specular Highlight Glint */}
                <div className="absolute top-1 left-2.5 w-3.5 h-1.5 rounded-full bg-white/80 blur-[0.3px] -rotate-35 pointer-events-none" />
                <span className="material-symbols-outlined text-[20px] text-white font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] select-none">
                  {cfg.icon}
                </span>
              </div>

              {/* Message & Context */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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

              {/* Minimal Circular Glass Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Đóng thông báo"
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 active:scale-90 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer shrink-0 -mr-1 -mt-0.5"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>

              {/* Glowing Hairline Progress Beam */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-[3px] origin-left ${cfg.beam}`}
                style={{
                  animation: `toast-progress-beam ${t.duration || 3500}ms linear forwards`
                }}
              />
            </div>
          );
        })}
      </div>
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
      showInfo: () => {}
    };
  }
  return context;
}
