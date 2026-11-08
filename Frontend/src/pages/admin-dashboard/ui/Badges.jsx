import React from 'react';

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  const isAct = s === 'active';
  const isDis = s === 'disabled' || s === 'locked' || s === 'deleted';
  const isInact = s === 'inactive';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-colors ${
        isAct
          ? 'bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200/80 dark:border-brand-sage-800/80 shadow-2xs'
          : isDis
          ? 'bg-brand-danger-50 dark:bg-brand-danger-950/60 text-brand-danger-700 dark:text-brand-danger-300 border border-brand-danger-200/80 dark:border-brand-danger-800/80 shadow-2xs'
          : isInact
          ? 'bg-brand-sand-50 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200/80 dark:border-brand-sand-800/80 shadow-2xs'
          : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 border border-brand-navy-200 dark:border-brand-navy-700'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isAct
            ? 'bg-brand-sage-500 animate-pulse'
            : isDis
            ? 'bg-brand-danger-500'
            : isInact
            ? 'bg-brand-sand-500'
            : 'bg-brand-navy-400'
        }`}
      />
      {status || '—'}
    </span>
  );
}

export function RoleBadge({ role }) {
  const r = String(role || '').toUpperCase();
  const styles = {
    ADMIN: 'bg-brand-navy-50 dark:bg-brand-navy-950/60 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800',
    SYSTEMADMIN: 'bg-brand-navy-50 dark:bg-brand-navy-950/60 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800',
    MANAGER: 'bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800',
    COACH: 'bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800',
    RECEPTIONIST: 'bg-brand-sand-50 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800',
    MEMBER: 'bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800'
  };

  const icons = {
    ADMIN: 'admin_panel_settings',
    SYSTEMADMIN: 'security',
    MANAGER: 'manage_accounts',
    COACH: 'sports',
    RECEPTIONIST: 'desk',
    MEMBER: 'person'
  };

  const currentStyle = styles[r] || 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700';
  const icon = icons[r] || 'account_circle';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${currentStyle}`}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      <span>{role || 'User'}</span>
    </span>
  );
}
