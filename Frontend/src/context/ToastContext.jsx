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
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/30';
      case 'error': return 'bg-red-600 text-white border-red-700 shadow-red-600/30';
      case 'warning': return 'bg-amber-500 text-white border-amber-600 shadow-amber-500/30';
      default: return 'bg-slate-900 text-white border-slate-800 shadow-slate-900/30';
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
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 transform translate-y-0 ${getToastStyles(t.type)}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
              {getToastIcon(t.type)}
            </span>
            <div className="flex-1 min-w-0 text-sm leading-snug">
              {t.code && (
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/25 text-white/95 mr-1.5 uppercase tracking-wider border border-white/20">
                  {t.code}
                </span>
              )}
              <span className="break-words">{t.message}</span>
              {t.proposedHandling && (
                <div className="mt-2 p-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white/95 font-normal leading-relaxed">
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-300 mb-0.5">
                    💡 Hướng dẫn xử lý:
                  </span>
                  <span>{t.proposedHandling}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              aria-label="Đóng"
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition-colors shrink-0 -mr-1 -mt-1"
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
