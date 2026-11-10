import React, { useState } from 'react';
import { usePasswordInput } from '../model/usePasswordInput.js';

export function AuthField({ id, label, type = 'text', error, hint, required, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const { inputError, handlers } = usePasswordInput({ value: inputProps.value, onChange: inputProps.onChange, enabled: isPassword });
  const displayedError = inputError || error;
  const descriptionId = displayedError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-[13px] font-semibold text-brand-navy-700">
          {label}{required && <span className="text-brand-terra-700 dark:text-brand-terra-400 ml-1 font-bold" aria-hidden="true">*</span>}
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
          className={`w-full h-10 sm:h-10.5 px-3.5 ${isPassword ? 'pr-11' : ''} text-sm font-medium rounded-xl border bg-brand-navy-50/60 text-brand-navy-900 placeholder:text-brand-navy-500 dark:placeholder:text-brand-navy-400 placeholder:font-normal outline-none transition-all duration-150 disabled:bg-brand-navy-100 disabled:text-brand-navy-500 ${
            displayedError
              ? 'border-brand-danger-300 bg-brand-danger-50/30 focus:bg-white focus:border-brand-danger-500 focus:ring-4 focus:ring-brand-danger-500/10'
              : 'border-brand-navy-200 hover:border-brand-navy-300 focus:bg-white focus:border-brand-sage-500 focus:ring-4 focus:ring-brand-sage-500/20'
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
            className="absolute inset-y-0 right-0 w-11 inline-flex items-center justify-center text-brand-navy-500 hover:text-brand-navy-800 transition-colors rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-500 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {(displayedError || hint) && (
        <p id={descriptionId} role={inputError ? 'status' : undefined} className={`text-[11px] font-medium leading-4 mt-1 ${displayedError ? 'text-brand-danger-600' : 'text-brand-navy-500'}`}>
          {displayedError || hint}
        </p>
      )}
    </div>
  );
}
