import React from 'react';

/**
 * SCMS Olympic Sports Arena Logo
 * Unified brand logo matching the Olympic Arena visual design:
 * - Squircle "S" icon with soft mint-to-cream pastel gradient
 * - "SCMS" title
 * - "[OLYMPIC]" outline pill badge with light cyan text
 * - "OLYMPIC SPORTS ARENA" uppercase subtitle with wide letter spacing
 */
export function Logo({
  variant = 'auto', // 'auto' | 'dark' | 'light'
  size = 'md',      // 'sm' | 'md' | 'lg'
  href = '#/',
  onClick,
  className = '',
  showSubtitle = true
}) {
  const isDark = variant === 'dark';
  const isLight = variant === 'light';

  // S icon dimensions based on size
  const iconSizeClass = {
    sm: 'w-8 h-8 rounded-xl text-sm',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] text-base sm:text-lg',
    lg: 'w-11 h-11 rounded-2xl text-xl'
  }[size] || 'w-10 h-10 rounded-2xl text-lg';

  // SCMS text size
  const titleSizeClass = {
    sm: 'text-sm font-black',
    md: 'text-base sm:text-lg font-black',
    lg: 'text-lg sm:text-xl font-black'
  }[size] || 'text-base sm:text-lg font-black';

  // Text color classes
  const titleColor = isDark
    ? 'text-white'
    : isLight
    ? 'text-[#1E2235]'
    : 'text-[#1E2235] dark:text-white';

  const pillClasses = isDark
    ? 'border border-white/80 text-[#7ED6DF]'
    : isLight
    ? 'border border-[#1E2235]/40 text-[#2D6A4F]'
    : 'border border-[#1E2235]/30 dark:border-white/80 text-[#2D6A4F] dark:text-[#7ED6DF]';

  const subtitleColor = isDark
    ? 'text-white'
    : isLight
    ? 'text-[#3D405B]'
    : 'text-[#3D405B] dark:text-white';

  const content = (
    <>
      {/* S Squircle Icon with pastel mint-to-cream gradient */}
      <div
        className={`${iconSizeClass} bg-gradient-to-tr from-[#81B29A] via-[#A8DADC] to-[#F2CC8F] text-white flex items-center justify-center font-black shadow-xs shrink-0 tracking-tight transition-transform duration-300 group-hover:scale-105`}
        style={{
          boxShadow: '0 3px 12px rgba(129, 178, 154, 0.28)'
        }}
      >
        S
      </div>

      {/* Brand Text Block */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`${titleSizeClass} tracking-tight ${titleColor}`}>
            SCMS
          </span>
          <span
            className={`text-[9px] sm:text-[10px] font-bold uppercase rounded-md px-1.5 py-0.5 tracking-wider leading-none ${pillClasses}`}
          >
            OLYMPIC
          </span>
        </div>

        {showSubtitle && (
          <span
            className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.18em] mt-1 leading-none ${subtitleColor}`}
          >
            OLYMPIC SPORTS ARENA
          </span>
        )}
      </div>
    </>
  );

  const containerClasses = `inline-flex items-center gap-2.5 sm:gap-3 group select-none text-decoration-none ${className}`;

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-label="SCMS Olympic Sports Arena - Trang chủ"
        className={containerClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <div onClick={onClick} className={containerClasses}>
      {content}
    </div>
  );
}

export default Logo;
