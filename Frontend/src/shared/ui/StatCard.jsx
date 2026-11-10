export function Badge({ children, variant = 'primary', size = 'md' }) {
  const getStyles = () => {
    switch (variant) {
      case 'success':
      case 'ACTIVE':
      case 'OPEN':
      case 'CONFIRMED':
      case 'AVAILABLE':
        return 'bg-brand-sage-100 text-brand-sage-700 border-brand-sage-200';
      case 'danger':
      case 'error':
      case 'INACTIVE':
      case 'FULL':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'bg-brand-danger-100 text-brand-danger-700 border-brand-danger-200';
      case 'warning':
      case 'PENDING':
        return 'bg-brand-sand-100 text-brand-sand-800 border-brand-sand-200';
      case 'info':
      case 'MANAGER':
      case 'SYSTEMADMIN':
      case 'ADMIN':
        return 'bg-brand-sage-500/15 text-brand-sage-700 border-brand-sage-500/30 font-semibold';
      case 'RECEPTIONIST':
        return 'bg-brand-navy-50 text-brand-navy-800 border-brand-navy-200';
      case 'COACH':
        return 'bg-brand-sand-300/25 text-brand-sand-800 border-brand-sand-300/50 font-bold';
      case 'MEMBER':
        return 'bg-brand-navy-100 text-brand-navy-700 border-brand-navy-200';
      case 'primary':
      default:
        return 'bg-brand-sage-500/15 text-brand-sage-700 border-brand-sage-500/30';
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
    <div className="p-5 rounded-2xl bg-white border border-brand-navy-200 shadow-xs relative overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-bold text-brand-navy-500">
          {title}
        </span>
        <div className="w-9 h-9 rounded-xl bg-brand-sage-500/15 text-brand-sage-700 flex items-center justify-center shadow-2xs">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>

      <div className="text-2xl sm:text-3xl font-extrabold text-brand-navy-900 mt-2.5 tracking-tight font-sans">
        {value}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-2 text-xs font-medium text-brand-navy-500">
          {trend && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-sage-50 text-brand-sage-700 font-bold border border-brand-sage-200 text-[10px]">
              {trend}
            </span>
          )}
          <span className="truncate">{subtitle}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
