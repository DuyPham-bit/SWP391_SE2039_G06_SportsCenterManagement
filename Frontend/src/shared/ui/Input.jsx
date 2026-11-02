import React from 'react';

export function Input({
  label,
  error,
  helperText,
  icon = null,
  className = '',
  wrapperClassName = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full px-3.5 py-2.5 ${icon ? 'pl-10' : ''} text-xs sm:text-sm bg-white dark:bg-slate-900 border ${
            error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-300 dark:border-slate-700 focus:border-[#81B29A] focus:ring-[#81B29A]/20'
          } rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-[11px] font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export default Input;

