import React, { useState } from 'react';
import { usePasswordInput } from '../model/usePasswordInput.js';
import { EyeIcon } from './EyeIcon.jsx';
import './auth-field.css';

const TONES = {
  light: {
    label: 'text-brand-navy-700 group-focus-within:text-brand-sage-700',
    input: 'bg-brand-navy-50/60 text-brand-navy-900 placeholder:text-brand-navy-500 disabled:bg-brand-navy-100 disabled:text-brand-navy-500',
    normal: 'border-brand-navy-200 hover:border-brand-navy-300 focus:bg-white focus:border-brand-sage-500 focus:ring-4 focus:ring-brand-sage-500/20',
    invalid: 'border-brand-danger-300 bg-brand-danger-50/30 focus:bg-white focus:border-brand-danger-500 focus:ring-4 focus:ring-brand-danger-500/10',
    eye: 'text-brand-navy-500 hover:text-brand-navy-800',
    hint: 'text-brand-navy-500',
    error: 'text-brand-danger-600',
  },
  // For dark glass cards (login): readable label, dark input, autofill kept on-theme
  dark: {
    label: 'text-brand-navy-200 group-focus-within:text-brand-sage-300',
    input: 'bg-white/[0.06] text-white caret-brand-sage-300 placeholder:text-brand-navy-400 disabled:opacity-60 autofill:shadow-[inset_0_0_0_1000px_rgb(var(--brand-navy-900))] autofill:[-webkit-text-fill-color:rgb(255_255_255)]',
    normal: 'border-white/15 hover:border-white/30 focus:bg-white/[0.09] focus:border-brand-sage-400 focus:ring-4 focus:ring-brand-sage-500/20',
    invalid: 'border-brand-danger-400/70 bg-brand-danger-500/10 focus:border-brand-danger-400 focus:ring-4 focus:ring-brand-danger-500/20',
    eye: 'text-brand-navy-400 hover:text-white',
    hint: 'text-brand-navy-400',
    error: 'text-brand-danger-300',
  },
};

/**
 * check: optional live validation `{ ok, hint }`, shown only once the field has a value and no error:
 * a tick inside the field when ok, otherwise one short hint line under it.
 * floating: label inside the field (login/register card); icon: leading Material Symbols name.
 */
export function AuthField({ id, label, type = 'text', error, hint, hintId, required, tone = 'light', check, floating = false, icon, ...inputProps }) {
  const t = TONES[tone] || TONES.light;
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const isPassword = type === 'password';
  const { inputError, handlers } = usePasswordInput({ value: inputProps.value, onChange: inputProps.onChange, enabled: isPassword });
  const displayedError = inputError || error;
  // hintId: the hint is rendered by the parent (e.g. full width under a two-column row)
  const liveCheck = !displayedError && check && String(inputProps.value ?? '').length > 0 ? check : null;
  const checkId = liveCheck && !liveCheck.ok && liveCheck.hint ? `${id}-check` : undefined;
  const descriptionId = [displayedError ? `${id}-error` : hint ? `${id}-hint` : hintId, checkId].filter(Boolean).join(' ') || undefined;
  const errorId = `${id}-error`;

  const capsBadge = isPassword && capsLock && (
    <span role="status" className={`inline-flex items-center gap-1 rounded-full bg-brand-sand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-sand-800 ${floating ? 'lp-msg-in absolute -top-2.5 right-2 z-10 shadow-sm' : ''}`}>
      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">keyboard_capslock</span>
      Caps Lock đang bật
    </span>
  );
  const eyeButton = isPassword && (
    <button
      type="button"
      onClick={() => setShowPassword(value => !value)}
      aria-label={`${showPassword ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
      aria-pressed={showPassword}
      aria-controls={id}
      disabled={inputProps.disabled}
      data-no-ripple
      className={`absolute inset-y-0 right-0 z-[1] w-11 inline-flex items-center justify-center ${t.eye} transition-colors rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-500 disabled:opacity-50`}
    >
      <EyeIcon open={!showPassword} />
    </button>
  );
  const tick = liveCheck?.ok && (
    <span className={`lp-tick pointer-events-none absolute inset-y-0 ${isPassword ? 'right-11' : 'right-3'} inline-flex items-center text-brand-sage-700 dark:text-brand-sage-400`} aria-hidden="true">
      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
    </span>
  );
  const passwordHandlers = isPassword ? {
    onKeyDown: event => { setCapsLock(event.getModifierState?.('CapsLock') === true); inputProps.onKeyDown?.(event); },
    onKeyUp: event => { setCapsLock(event.getModifierState?.('CapsLock') === true); inputProps.onKeyUp?.(event); },
    onBlur: event => { setCapsLock(false); inputProps.onBlur?.(event); }
  } : {};
  const messages = (
    <>
      {checkId && (
        <p id={checkId} className="lp-msg-in mt-1 flex items-center gap-1 text-[11px] font-medium leading-4 text-brand-sand-700 dark:text-brand-sand-300">
          <span className="material-symbols-outlined text-[13px]" aria-hidden="true">info</span>{liveCheck.hint}
        </p>
      )}
      {(displayedError || hint) && (
        <p key={displayedError || 'hint'} id={displayedError ? errorId : `${id}-hint`} role={inputError ? 'status' : undefined} className={`lp-msg-in text-[11px] font-medium leading-4 mt-1 ${displayedError ? t.error : t.hint}`}>
          {displayedError || hint}
        </p>
      )}
    </>
  );

  // Floating label: the label sits inside the field and glides up on focus/value; a gradient
  // rule grows from the centre on focus; the leading icon picks up the brand colour.
  if (floating) {
    const placeholder = inputProps.placeholder || ' ';
    return (
      <div className="group min-w-0">
        <div className="relative">
          {capsBadge}
          {icon && (
            <span className="lp-field-icon material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 z-[1] text-[19px] text-brand-navy-400 group-focus-within:text-brand-sage-700 dark:group-focus-within:text-brand-sage-300" aria-hidden="true">{icon}</span>
          )}
          <input
            {...inputProps}
            {...handlers}
            {...passwordHandlers}
            placeholder={placeholder}
            id={id}
            name={id}
            type={isPassword && showPassword ? 'text' : type}
            required={required}
            aria-invalid={Boolean(displayedError)}
            aria-describedby={descriptionId}
            className={`lp-float-input peer w-full h-[52px] pt-[19px] pb-[5px] ${icon ? 'pl-11' : 'pl-3.5'} ${isPassword ? (liveCheck?.ok ? 'pr-[4.5rem]' : 'pr-11') : liveCheck?.ok ? 'pr-10' : 'pr-3.5'} text-sm font-semibold rounded-xl border placeholder:font-normal outline-none transition-all duration-200 ${t.input} ${displayedError ? t.invalid : t.normal}`}
          />
          <label htmlFor={id} className={`lp-float-label pointer-events-none absolute top-1/2 ${icon ? 'left-11' : 'left-3.5'} ${isPassword ? 'max-w-[calc(100%-6rem)]' : 'max-w-[calc(100%-4rem)]'} truncate text-[14px] font-medium ${t.label}`}>
            {label}{required && <span className="text-brand-terra-700 dark:text-brand-terra-400 ml-0.5 font-bold" aria-hidden="true">*</span>}
          </label>
          <span className="lp-field-bar" aria-hidden="true" />
          {tick}
          {eyeButton}
        </div>
        {messages}
      </div>
    );
  }

  return (
    <div className="group min-w-0">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className={`block text-[13px] font-semibold transition-colors ${t.label}`}>
          {label}{required && <span className="text-brand-terra-700 dark:text-brand-terra-400 ml-1 font-bold" aria-hidden="true">*</span>}
        </label>
        {capsBadge}
      </div>
      <div className="relative">
        <input
          {...inputProps}
          {...handlers}
          {...passwordHandlers}
          id={id}
          name={id}
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          aria-invalid={Boolean(displayedError)}
          aria-describedby={descriptionId}
          className={`w-full h-10 sm:h-10.5 px-3.5 ${isPassword ? (liveCheck?.ok ? 'pr-[4.5rem]' : 'pr-11') : liveCheck?.ok ? 'pr-10' : ''} text-sm font-medium rounded-xl border placeholder:font-normal outline-none transition-all duration-150 ${t.input} ${displayedError ? t.invalid : t.normal}`}
        />
        {tick}
        {eyeButton}
      </div>
      {messages}
    </div>
  );
}
