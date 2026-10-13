import React, { useState } from 'react';
import { usePasswordInput } from './usePasswordInput.js';

export function AuthField({ id, label, type = 'text', error, hint, required, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const { inputError, handlers } = usePasswordInput({ value: inputProps.value, onChange: inputProps.onChange, enabled: isPassword });
  const displayedError = inputError || error;
  const descriptionId = displayedError ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}{required && <span className="text-red-500 ml-1 font-bold" aria-hidden="true">*</span>}
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
          className={`w-full h-10 sm:h-10.5 px-3.5 ${isPassword ? 'pr-11' : ''} text-sm font-medium rounded-xl border bg-slate-50/60 text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all duration-150 disabled:bg-slate-100 disabled:text-slate-500 ${
            displayedError
              ? 'border-red-300 bg-red-50/30 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-slate-200 hover:border-slate-300 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
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
            className="absolute inset-y-0 right-0 w-11 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
      {(displayedError || hint) && (
        <p id={descriptionId} role={inputError ? 'status' : undefined} className={`text-[11px] font-medium leading-4 mt-1 ${displayedError ? 'text-red-600' : 'text-slate-400'}`}>
          {displayedError || hint}
        </p>
      )}
    </div>
  );
}
