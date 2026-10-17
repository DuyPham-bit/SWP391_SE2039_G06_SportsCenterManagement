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
        return 'bg-[#81B29A]/15 text-[#2D6A4F] border-[#81B29A]/40 font-bold';
      case 'MEMBER':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'primary':
      default:
        return 'bg-[#F2CC8F]/25 text-[#92400E] border-[#F2CC8F]/50';
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
  const isGoldOrRed = color === 'red' || color === 'gold';
  const isSage = color === 'green' || color === 'sage';

  let cardStyle = 'bg-gradient-to-br from-[#32354D] via-[#2B2D42] to-[#1E2235] text-white border border-white/10 shadow-md';
  let iconBoxStyle = 'bg-white/10 text-[#F2CC8F]';
  let titleStyle = 'text-slate-300';
  let valueStyle = 'text-white';
  let subStyle = 'text-slate-300';

  if (isGoldOrRed) {
    cardStyle = 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF6ED] to-[#F5ECE0] text-[#1E2235] border border-[#F2CC8F]/60 shadow-sm';
    iconBoxStyle = 'bg-[#F2CC8F]/30 text-[#92400E]';
    titleStyle = 'text-[#78350F]';
    valueStyle = 'text-[#1E2235]';
    subStyle = 'text-[#92400E]';
  } else if (isSage) {
    cardStyle = 'bg-gradient-to-br from-[#FCFDFD] via-[#F2F7F4] to-[#E8F2EC] text-[#1E2235] border border-[#81B29A]/50 shadow-sm';
    iconBoxStyle = 'bg-[#81B29A]/20 text-[#2D6A4F]';
    titleStyle = 'text-[#2D6A4F]';
    valueStyle = 'text-[#1E2235]';
    subStyle = 'text-[#2D6A4F]';
  }

  return (
    <div className={`p-6 rounded-[20px] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 group ${cardStyle}`}>
      {/* Background Icon Silhouette */}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <span className="material-symbols-outlined text-[90px]">{icon}</span>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className={`font-sans text-xs uppercase tracking-widest font-bold ${titleStyle}`}>
            {title}
          </span>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${iconBoxStyle}`}>
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        </div>

        <div className={`font-sans text-3xl sm:text-4xl font-extrabold mt-3 tracking-tight ${valueStyle}`}>
          {value}
        </div>

        {(subtitle || trend) && (
          <div className={`flex items-center gap-2 mt-2 text-xs font-medium ${subStyle}`}>
            {trend && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 font-bold">
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
