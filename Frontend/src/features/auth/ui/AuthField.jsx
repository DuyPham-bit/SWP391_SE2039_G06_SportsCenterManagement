import React, { useState } from 'react';
import { usePasswordInput } from '../model/usePasswordInput.js';

export function AuthField({ id, label, type = 'text', error, hint, hintId, required, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const { inputError, handlers } = usePasswordInput({ value: inputProps.value, onChange: inputProps.onChange, enabled: isPassword });
  const displayedError = inputError || error;
  // hintId: the hint is rendered by the parent (e.g. full width under a two-column row)
  const descriptionId = displayedError ? `${id}-error` : hint ? `${id}-hint` : hintId;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-[13px] font-semibold text-brand-navy-700 dark:text-slate-200">
          {label}{required && <span className="text-red-500 dark:text-red-400 ml-1 font-bold" aria-hidden="true">*</span>}
        </label>
      </div>
      <div className="relative">
        <input
          {...inputProps}
          {...handlers}
          id={id}
          name={id}
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          aria-invalid={Boolean(displayedError)}
          aria-describedby={descriptionId}
          className={`w-full h-10 sm:h-10.5 px-3.5 ${isPassword ? 'pr-11' : ''} text-sm font-medium rounded-xl border bg-brand-navy-50/60 dark:bg-black/40 text-brand-navy-900 dark:text-white placeholder:text-brand-navy-500 dark:placeholder:text-slate-400 placeholder:font-normal outline-none transition-all duration-150 disabled:bg-brand-navy-100 disabled:text-brand-navy-500 ${
            displayedError
              ? 'border-brand-danger-300 dark:border-red-500/60 bg-brand-danger-50/30 dark:bg-red-950/20 focus:bg-white dark:focus:bg-black/60 focus:border-brand-danger-500 focus:ring-4 focus:ring-brand-danger-500/10'
              : 'border-brand-navy-200 dark:border-white/15 hover:border-brand-navy-300 dark:hover:border-white/30 focus:bg-white dark:focus:bg-black/60 focus:border-red-500 focus:ring-4 focus:ring-red-500/20'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(value => !value)}
            aria-label={`${showPassword ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            aria-controls={id}
            disabled={inputProps.disabled}
            className="absolute inset-y-0 right-0 w-11 inline-flex items-center justify-center text-brand-navy-500 dark:text-slate-400 hover:text-brand-navy-800 dark:hover:text-white transition-colors rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {(displayedError || hint) && (
        <p id={descriptionId} role={inputError ? 'status' : undefined} className={`text-[11px] font-medium leading-4 mt-1 ${displayedError ? 'text-brand-danger-600 dark:text-red-400' : 'text-brand-navy-500 dark:text-slate-400'}`}>
          {displayedError || hint}
        </p>
      )}
    </div>
  );
}
