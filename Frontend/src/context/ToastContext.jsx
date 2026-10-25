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

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'cancel';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          card: 'bg-gradient-to-b from-[#10B981] via-[#059669] to-[#047857] text-white border-t border-emerald-300/50 border-b-2 border-b-emerald-950/50 border-x border-emerald-400/30 shadow-[0_20px_35px_-8px_rgba(4,120,87,0.55),0_8px_16px_-4px_rgba(0,0,0,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2.5px_4px_rgba(0,0,0,0.3)]',
          badge: 'bg-white/20 text-white shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),0_3px_6px_rgba(0,0,0,0.25)] border border-white/30',
          progress: 'bg-emerald-200/50 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
        };
      case 'error':
        return {
          card: 'bg-gradient-to-b from-[#F43F5E] via-[#E11D48] to-[#BE123C] text-white border-t border-rose-300/50 border-b-2 border-b-rose-950/60 border-x border-rose-400/30 shadow-[0_20px_35px_-8px_rgba(190,18,60,0.55),0_8px_16px_-4px_rgba(0,0,0,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2.5px_4px_rgba(0,0,0,0.3)]',
          badge: 'bg-white/20 text-white shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),0_3px_6px_rgba(0,0,0,0.25)] border border-white/30',
          progress: 'bg-rose-200/50 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
        };
      case 'warning':
        return {
          card: 'bg-gradient-to-b from-[#F59E0B] via-[#D97706] to-[#B45309] text-white border-t border-amber-300/50 border-b-2 border-b-amber-950/60 border-x border-amber-400/30 shadow-[0_20px_35px_-8px_rgba(180,83,9,0.55),0_8px_16px_-4px_rgba(0,0,0,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.45),inset_0_-2.5px_4px_rgba(0,0,0,0.3)]',
          badge: 'bg-white/20 text-white shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.6),0_3px_6px_rgba(0,0,0,0.25)] border border-white/30',
          progress: 'bg-amber-200/50 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
        };
      default:
        return {
          card: 'bg-gradient-to-b from-[#334155] via-[#1E293B] to-[#0F172A] text-white border-t border-slate-400/40 border-b-2 border-b-black/60 border-x border-slate-600/30 shadow-[0_20px_35px_-8px_rgba(15,23,42,0.65),0_8px_16px_-4px_rgba(0,0,0,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-2.5px_4px_rgba(0,0,0,0.4)]',
          badge: 'bg-white/15 text-white shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.5),0_3px_6px_rgba(0,0,0,0.25)] border border-white/25',
          progress: 'bg-slate-300/50 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      {/* 3D Floating Toast Overlay Container (Top-Center Apple / Linear style) */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Thông báo hệ thống"
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3.5 pointer-events-none w-full max-w-md sm:max-w-lg px-4"
      >
        {toasts.map(t => {
          const style = getToastStyles(t.type);
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto w-full flex items-start gap-3.5 px-4.5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 ${style.card} animate-toast-3d relative overflow-hidden backdrop-blur-md`}
            >
              {/* 3D Raised Icon Badge */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.badge}`}>
                <span className="material-symbols-outlined text-[24px] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                  {getToastIcon(t.type)}
                </span>
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                {t.code && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-black/30 text-white mr-1.5 uppercase tracking-wider border border-white/25 shadow-inner select-none">
                    {t.code}
                  </span>
                )}
                <span className="break-words font-chivo font-extrabold tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] leading-snug">
                  {t.message}
                </span>

                {t.proposedHandling && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-black/30 border border-white/20 text-xs text-white/95 font-medium leading-relaxed shadow-inner">
                    <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-200 mb-0.5">
                      💡 Hướng dẫn xử lý:
                    </span>
                    <span>{t.proposedHandling}</span>
                  </div>
                )}
              </div>

              {/* 3D Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Đóng thông báo"
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] cursor-pointer shrink-0 -mr-1 -mt-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              {/* Glowing animated auto-dismiss progress bar */}
              <div
                className={`absolute bottom-0 left-0 h-1 ${style.progress}`}
                style={{
                  animation: `toast-progress ${t.duration || 3500}ms linear forwards`
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
