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
    setToasts(prev => [...prev, { id, message, code, proposedHandling, type }]);

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
        return 'bg-[#047857] text-white border border-emerald-400/30 shadow-2xl shadow-emerald-950/25';
      case 'error':
        return 'bg-[#BE123C] text-white border border-rose-400/30 shadow-2xl shadow-rose-950/25';
      case 'warning':
        return 'bg-[#B45309] text-white border border-amber-400/30 shadow-2xl shadow-amber-950/25';
      default:
        return 'bg-[#0F172A] text-white border border-slate-700/50 shadow-2xl shadow-slate-950/25';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Thông báo hệ thống"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-3 sm:px-0"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3.5 px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl shadow-2xl border text-sm font-semibold transition-all duration-300 transform translate-y-0 ${getToastStyles(t.type)} animate-fade-slide-up backdrop-blur-xs`}
          >
            <span className="material-symbols-outlined text-[22px] shrink-0 mt-0.5 select-none">
              {getToastIcon(t.type)}
            </span>
            <div className="flex-1 min-w-0 text-sm font-chivo font-bold text-white leading-snug">
              {t.code && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-black/25 text-white mr-1.5 uppercase tracking-wider border border-white/20 select-none">
                  {t.code}
                </span>
              )}
              <span className="break-words font-chivo font-bold tracking-wide">{t.message}</span>
              {t.proposedHandling && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-black/25 border border-white/20 text-xs text-white/95 font-normal leading-relaxed">
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-200 mb-0.5">
                    💡 Hướng dẫn xử lý:
                  </span>
                  <span>{t.proposedHandling}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Đóng thông báo"
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/15 transition-colors shrink-0 -mr-1 -mt-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        ))}
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
