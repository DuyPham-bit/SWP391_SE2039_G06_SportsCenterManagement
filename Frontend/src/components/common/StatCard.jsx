export function Badge({ children, variant = 'primary', size = 'md' }) {
  const getStyles = () => {
    switch (variant) {
      case 'success':
      case 'ACTIVE':
      case 'OPEN':
      case 'CONFIRMED':
      case 'AVAILABLE':
        return 'bg-[#E8F8EE] text-[#15803D] border-[#BBF7D0]';
      case 'danger':
      case 'error':
      case 'INACTIVE':
      case 'FULL':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]';
      case 'warning':
      case 'PENDING':
        return 'bg-[#FEF6E6] text-[#D97706] border-[#FDE68A]';
      case 'info':
      case 'MANAGER':
      case 'SYSTEMADMIN':
      case 'ADMIN':
        return 'bg-[#EEF4FE] text-[#1A3B8B] border-[#BFDBFE]';
      case 'RECEPTIONIST':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'COACH':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold';
      case 'MEMBER':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'primary':
      default:
        return 'bg-[#EBF2FC] text-[#1A3B8B] border-[#BFDBFE]';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border uppercase tracking-wider ${sizeClasses} ${getStyles()}`}>
      {children}
    </span>
  );
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
          {title}
        </span>
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A3B8B] flex items-center justify-center shadow-2xs">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2.5 tracking-tight font-sans">
        {value}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
          {trend && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
              {trend}
            </span>
          )}
          <span className="truncate">{subtitle}</span>
        </div>
      )}
    </div>
  );
}
