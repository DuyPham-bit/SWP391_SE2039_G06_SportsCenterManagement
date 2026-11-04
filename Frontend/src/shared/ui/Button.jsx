import React from 'react';
import { MotionButton } from './MotionButton.jsx';

/**
 * Standard Accessible Button component with Olympic styling & variants
 */
export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  icon = null,
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-chivo font-bold rounded-xl transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-6 py-2.5 text-sm sm:text-base gap-2.5'
  }[size] || 'px-4 py-2 text-xs gap-2';

  const variantStyles = {
    primary: 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-xs shadow-[#2D6A4F]/20',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white',
    outline: 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-xs shadow-red-600/20',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
  }[variant] || 'bg-[#2D6A4F] text-white';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export default Button;

