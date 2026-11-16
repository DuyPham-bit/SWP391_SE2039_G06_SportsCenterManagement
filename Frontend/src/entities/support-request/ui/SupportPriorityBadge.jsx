import React from 'react';

/** Values stored in support_requests.priority (validated by the backend). */
export const SUPPORT_PRIORITIES = Object.freeze([
  { value: 'Low', vi: 'Thấp', en: 'Low', icon: 'south', className: 'bg-brand-navy-50 text-brand-navy-600 border-brand-navy-200 dark:bg-brand-navy-800 dark:text-brand-navy-300 dark:border-brand-navy-700' },
  { value: 'Normal', vi: 'Bình thường', en: 'Normal', icon: 'remove', className: 'bg-brand-teal-50 text-brand-teal-700 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800' },
  { value: 'High', vi: 'Cao', en: 'High', icon: 'north', className: 'bg-brand-sand-50 text-brand-sand-800 border-brand-sand-200 dark:bg-brand-sand-950/40 dark:text-brand-sand-300 dark:border-brand-sand-800' },
  { value: 'Urgent', vi: 'Khẩn cấp', en: 'Urgent', icon: 'priority_high', className: 'bg-brand-danger-50 text-brand-danger-700 border-brand-danger-200 dark:bg-brand-danger-950/40 dark:text-brand-danger-300 dark:border-brand-danger-800' }
]);

export function getSupportPriority(value) {
  return SUPPORT_PRIORITIES.find(item => item.value === value) || SUPPORT_PRIORITIES[1];
}

export function SupportPriorityBadge({ priority, isEn = false }) {
  const meta = getSupportPriority(priority);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.className}`}>
      <span className="material-symbols-outlined text-[13px]" aria-hidden="true">{meta.icon}</span>
      <span>{isEn ? meta.en : meta.vi}</span>
    </span>
  );
}

/** Accessible select bound to the same values. */
export function SupportPrioritySelect({ id, value, onChange, disabled, isEn = false, className = '' }) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={event => onChange(event.target.value)}
      className={`min-h-[40px] w-full px-3 py-2 text-sm rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500 ${className}`}
    >
      {SUPPORT_PRIORITIES.map(item => (
        <option key={item.value} value={item.value}>{isEn ? item.en : item.vi}</option>
      ))}
    </select>
  );
}
