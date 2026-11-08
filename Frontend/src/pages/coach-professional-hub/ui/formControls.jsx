import { addCalendarDays, vietnamDate, vietnamDateTimeInput } from '../../../shared/lib/dateTime.js';
import React from 'react';

// Unified input and button styles in SCMS Olympic Arena design system
export const inputClass = 'w-full rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/60 dark:bg-brand-navy-800 px-3.5 py-2.5 text-xs sm:text-sm text-brand-navy-800 dark:text-brand-navy-100 placeholder-brand-navy-400 focus:bg-white dark:focus:bg-brand-navy-800 focus:border-brand-sage-500 dark:focus:border-brand-sage-500 focus:ring-2 focus:ring-brand-sage-500/20 dark:focus:ring-brand-sage-500/30 outline-none transition-all shadow-2xs';
export const selectClass = `${inputClass} cursor-pointer`;
export const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-brand-sand-300 hover:text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const buttonSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-brand-navy-700 dark:text-brand-navy-200 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50';

export function FormField({ title, required = false, hint, children }) {
  return (
    <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">
      <span className="flex items-center justify-between mb-1.5">
        <span>
          {title} {required && <span className="text-brand-danger-500">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-brand-navy-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function dateInput(offset = 0) {
  return addCalendarDays(vietnamDate(), offset);
}

export function dateTimeInput(value = new Date()) {
  return vietnamDateTimeInput(value);
}
