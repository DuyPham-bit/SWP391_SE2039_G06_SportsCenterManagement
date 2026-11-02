import React from 'react';

/**
 * Olympic Sports Arena Logo
 * Unified brand logo matching the official Olympic Sports Arena brand:
 * - Left emblem: stylized wave swirls with athlete silhouettes
 * - Right typography: OLYMPIC SPORTS ARENA
 */
export function Logo({
  variant = 'auto', // 'auto' | 'dark' | 'light'
  size = 'md',      // 'sm' | 'md' | 'lg'
  href = '#/',
  onClick,
  className = '',
  showSubtitle = true,
  compact = false
}) {
  const isDark = variant === 'dark';
  const isLight = variant === 'light';

  // Height and scale based on size
  const heightClass = {
    sm: 'h-10 sm:h-11',
    md: 'h-12 sm:h-14',
    lg: 'h-16 sm:h-20 lg:h-22',
    xl: 'h-20 sm:h-24 lg:h-28'
  }[size] || 'h-12 sm:h-14';

  const compactSizeClass = {
    sm: 'w-9 h-9 sm:w-10 sm:h-10',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16'
  }[size] || 'w-11 h-11 sm:w-12 sm:h-12';

  let logoContent;

  if (compact) {
    if (isDark) {
      logoContent = (
        <img
          src="/logo-olympic-mark-dark.png"
          alt="Olympic Sports Arena"
          className={`${compactSizeClass} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        />
      );
    } else if (isLight) {
      logoContent = (
        <img
          src="/logo-olympic-mark.png"
          alt="Olympic Sports Arena"
          className={`${compactSizeClass} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        />
      );
    } else {
      logoContent = (
        <>
          <img
            src="/logo-olympic-mark.png"
            alt="Olympic Sports Arena"
            className={`${compactSizeClass} object-contain shrink-0 dark:hidden transition-transform duration-200 group-hover:scale-105`}
          />
          <img
            src="/logo-olympic-mark-dark.png"
            alt="Olympic Sports Arena"
            className={`${compactSizeClass} object-contain shrink-0 hidden dark:block transition-transform duration-200 group-hover:scale-105`}
          />
        </>
      );
    }
  } else {
    if (isDark) {
      logoContent = (
        <img
          src="/logo-olympic-dark.png"
          alt="Olympic Sports Arena"
          className={`${heightClass} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]`}
        />
      );
    } else if (isLight) {
      logoContent = (
        <img
          src="/logo-olympic.png"
          alt="Olympic Sports Arena"
          className={`${heightClass} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]`}
        />
      );
    } else {
      logoContent = (
        <>
          <img
            src="/logo-olympic.png"
            alt="Olympic Sports Arena"
            className={`${heightClass} w-auto object-contain shrink-0 dark:hidden transition-transform duration-200 group-hover:scale-[1.02]`}
          />
          <img
            src="/logo-olympic-dark.png"
            alt="Olympic Sports Arena"
            className={`${heightClass} w-auto object-contain shrink-0 hidden dark:block transition-transform duration-200 group-hover:scale-[1.02]`}
          />
        </>
      );
    }
  }

  const containerClasses = `inline-flex items-center gap-2 group select-none text-decoration-none ${className}`;

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-label="Olympic Sports Arena"
        className={containerClasses}
      >
        {logoContent}
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={containerClasses}
    >
      {logoContent}
    </div>
  );
}

export default Logo;
