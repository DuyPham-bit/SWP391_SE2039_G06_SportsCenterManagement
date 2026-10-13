const { createContext, useContext, useState, useCallback } = React;

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const showSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const showError = useCallback((msg) => showToast(msg, 'error', 4500), [showToast]);
  const showWarning = useCallback((msg) => showToast(msg, 'warning'), [showToast]);
  const showInfo = useCallback((msg) => showToast(msg, 'info'), [showToast]);

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
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-0 ${getToastStyles(t.type)}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
              {getToastIcon(t.type)}
            </span>
            <div className="flex-1 text-sm leading-snug">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/80 hover:text-white transition-colors"
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
