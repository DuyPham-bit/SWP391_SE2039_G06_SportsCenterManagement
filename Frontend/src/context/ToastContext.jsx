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
          cardBorder: 'border-emerald-500/30',
          cardShadow: 'shadow-[0_24px_50px_-12px_rgba(16,185,129,0.3),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25',
          dotColor: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
          beam: 'bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]'
        };
      case 'error':
        return {
          label: 'Lỗi xử lý',
          icon: 'priority_high',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#fda4af_0%,#f43f5e_40%,#be123c_80%,#4c0519_100%)]',
          orbShadow: 'shadow-[0_8px_18px_-2px_rgba(244,63,94,0.7),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2.5px_4px_rgba(0,0,0,0.5)]',
          cardBorder: 'border-rose-500/30',
          cardShadow: 'shadow-[0_24px_50px_-12px_rgba(244,63,94,0.3),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-rose-300 bg-rose-500/15 border-rose-500/25',
          dotColor: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
          beam: 'bg-gradient-to-r from-rose-500 via-pink-400 to-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]'
        };
      case 'warning':
        return {
          label: 'Cảnh báo',
          icon: 'warning',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#fde68a_0%,#f59e0b_40%,#d97706_80%,#451a03_100%)]',
          orbShadow: 'shadow-[0_8px_18px_-2px_rgba(245,158,11,0.7),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2.5px_4px_rgba(0,0,0,0.5)]',
          cardBorder: 'border-amber-500/30',
          cardShadow: 'shadow-[0_24px_50px_-12px_rgba(245,158,11,0.3),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-amber-300 bg-amber-500/15 border-amber-500/25',
          dotColor: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
          beam: 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
        };
      default:
        return {
          label: 'Thông báo',
          icon: 'info',
          orbBg: 'bg-[radial-gradient(circle_at_32%_28%,#93c5fd_0%,#3b82f6_40%,#1d4ed8_80%,#172554_100%)]',
          orbShadow: 'shadow-[0_8px_18px_-2px_rgba(59,130,246,0.7),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2.5px_4px_rgba(0,0,0,0.5)]',
          cardBorder: 'border-blue-500/30',
          cardShadow: 'shadow-[0_24px_50px_-12px_rgba(59,130,246,0.3),0_12px_24px_-4px_rgba(0,0,0,0.7)]',
          tagColor: 'text-blue-300 bg-blue-500/15 border-blue-500/25',
          dotColor: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
          beam: 'bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      {/* 3D Floating Spatial Capsule Container (Top-Center VisionOS / Raycast style) */}
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
              className={`pointer-events-auto relative w-full flex items-start gap-3.5 px-4 py-3.5 rounded-2xl bg-[#090d16]/92 backdrop-blur-2xl border ${cfg.cardBorder} ${cfg.cardShadow} overflow-hidden animate-toast-3d ring-1 ring-white/10 group transition-all duration-300 hover:scale-[1.01]`}
            >
              {/* 3D Top Specular Light Beam (Refraction Line) */}
              <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

              {/* 3D Gemstone Orb Sphere */}
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.orbBg} ${cfg.orbShadow}`}>
                {/* Specular Highlight Glint */}
                <div className="absolute top-1 left-2.5 w-3.5 h-1.5 rounded-full bg-white/75 blur-[0.4px] -rotate-35 pointer-events-none" />
                <span className="material-symbols-outlined text-[20px] text-white font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] select-none">
                  {cfg.icon}
                </span>
              </div>

              {/* Message & Context */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${cfg.tagColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                    <span>{cfg.label}</span>
                  </div>
                  {t.code && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/10 text-slate-300 border border-white/15">
                      {t.code}
                    </span>
                  )}
                </div>

                <p className="text-[13.5px] font-semibold text-slate-100 leading-snug break-words tracking-[-0.01em]">
                  {t.message}
                </p>

                {t.proposedHandling && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 leading-relaxed shadow-inner">
                    <span className="font-bold flex items-center gap-1 text-[11px] text-amber-300 mb-1">
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
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 active:scale-90 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shrink-0 -mr-1 -mt-0.5"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>

              {/* Glowing Hairline Progress Beam */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] origin-left ${cfg.beam}`}
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
