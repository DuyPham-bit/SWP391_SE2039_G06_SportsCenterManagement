export function Badge({ children, variant = 'primary', size = 'md' }) {
  const getStyles = () => {
    switch (variant) {
      case 'success':
      case 'ACTIVE':
      case 'OPEN':
      case 'CONFIRMED':
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'danger':
      case 'error':
      case 'INACTIVE':
      case 'FULL':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'warning':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'info':
      case 'MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RECEPTIONIST':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'COACH':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEMBER':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'primary':
      default:
        return 'bg-red-50 text-red-600 border-red-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1 rounded font-medium border uppercase tracking-wider ${sizeClasses} ${getStyles()}`}>
      {children}
    </span>
  );
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'red' }) {
  const isRed = color === 'red';
  return (
    <div className={`p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-md ${
      isRed
        ? 'bg-red-600 text-white shadow-red-600/20'
        : 'bg-slate-900 text-white shadow-slate-900/20 border border-slate-800'
    }`}>
      {/* Background Icon Silhouette */}
      <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none">
        <span className="material-symbols-outlined text-[90px]">{icon}</span>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="font-chivo text-xs uppercase tracking-widest font-bold text-white/80">
            {title}
          </span>
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        </div>

        <div className="font-chivo text-3xl font-black mt-3 tracking-tight">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2 text-xs text-white/80 font-medium">
            {trend && (
              <span className="px-1.5 py-0.5 rounded bg-white/20 font-bold text-white">
                {trend}
              </span>
            )}
            <span>{subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}
