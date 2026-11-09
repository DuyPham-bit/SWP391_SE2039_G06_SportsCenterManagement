import React from 'react';

/**
 * Olympic Sports Arena Logo
 * Unified brand logo matching the official Olympic Sports Arena brand:
 * - Left emblem: stylized wave swirls with athlete silhouettes
 * - Right typography: OLYMPIC SPORTS ARENA
 */
const LOGO_VERSION = '20261109v4';

export function Logo({
  variant = 'auto', // 'auto' | 'dark' | 'light' | 'brand'
  size = 'md',      // 'sm' | 'md' | 'lg' | 'xl'
  href = '#/',
  onClick,
  className = '',
  showSubtitle = true,
  compact = false
}) {
  const isDark = variant === 'dark';
  const isLight = variant === 'light';
  const isBrand = variant === 'brand';

  // Height and scale based on size with responsive mobile breathing room
  const heightClass = {
    sm: 'h-9 sm:h-10',
    md: 'h-10 sm:h-12',
    lg: 'h-11 sm:h-14 lg:h-16',
    xl: 'h-14 sm:h-18 lg:h-22'
  }[size] || 'h-10 sm:h-12';

  const compactSizeClass = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14'
  }[size] || 'w-10 h-10 sm:w-11 sm:h-11';

  let logoContent;

  if (compact) {
    if (isDark) {
      logoContent = (
        <img
          src={`/logo-olympic-mark-dark.png?v=${LOGO_VERSION}`}
          alt="Olympic Sports Arena"
          className={`${compactSizeClass} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        />
      );
    } else if (isLight) {
      logoContent = (
        <img
          src={`/logo-olympic-mark.png?v=${LOGO_VERSION}`}
          alt="Olympic Sports Arena"
          className={`${compactSizeClass} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        />
      );
    } else {
      logoContent = (
        <>
          <img
            src={`/logo-olympic-mark.png?v=${LOGO_VERSION}`}
            alt="Olympic Sports Arena"
            className={`${compactSizeClass} object-contain shrink-0 dark:hidden transition-transform duration-200 group-hover:scale-105`}
          />
          <img
            src={`/logo-olympic-mark-dark.png?v=${LOGO_VERSION}`}
            alt="Olympic Sports Arena"
            className={`${compactSizeClass} object-contain shrink-0 hidden dark:block transition-transform duration-200 group-hover:scale-105`}
          />
        </>
      );
    }
  } else {
    if (isBrand) {
      logoContent = (
        <img
          src={`/logo-olympic-brand.png?v=${LOGO_VERSION}`}
          alt="Olympic Sports Arena"
          className={`${heightClass} w-auto object-contain shrink-0 rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-[1.02]`}
        />
      );
    } else if (isDark) {
      logoContent = (
        <img
          src={`/logo-olympic-dark.png?v=${LOGO_VERSION}`}
          alt="Olympic Sports Arena"
          className={`${heightClass} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]`}
        />
      );
    } else if (isLight) {
      logoContent = (
        <img
          src={`/logo-olympic.png?v=${LOGO_VERSION}`}
          alt="Olympic Sports Arena"
          className={`${heightClass} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]`}
        />
      );
    } else {
      logoContent = (
        <>
          <img
            src={`/logo-olympic.png?v=${LOGO_VERSION}`}
            alt="Olympic Sports Arena"
            className={`${heightClass} w-auto object-contain shrink-0 dark:hidden transition-transform duration-200 group-hover:scale-[1.02]`}
          />
          <img
            src={`/logo-olympic-dark.png?v=${LOGO_VERSION}`}
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
