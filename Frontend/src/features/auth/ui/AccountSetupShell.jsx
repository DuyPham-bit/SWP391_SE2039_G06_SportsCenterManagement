import React from 'react';
import { Logo } from '../../../shared/ui/Logo.jsx';

/** Centered card on the warm surface used by account activation / first-password screens. */
export function AccountSetupShell({ eyebrow = 'Membership Portal', title, description, children, footer }) {
  return (
    <main className="min-h-screen bg-surface-muted dark:bg-brand-navy-950 flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6">
        <Logo size="md" />
      </div>
      <section
        aria-labelledby="account-setup-title"
        className="animate-fade-slide-up w-full max-w-md bg-white dark:bg-brand-navy-900 border border-brand-sand-200 dark:border-brand-navy-800 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="h-1.5 bg-brand-sand-600" aria-hidden="true" />
        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-sand-700 dark:text-brand-sand-300">{eyebrow}</p>
          <h1 id="account-setup-title" className="font-chivo text-2xl font-black text-brand-navy-900 dark:text-white mt-2 tracking-tight">
            {title}
          </h1>
          {description && <div className="text-sm text-brand-navy-600 dark:text-brand-navy-300 mt-2 leading-relaxed">{description}</div>}
          <div className="mt-6">{children}</div>
        </div>
      </section>
      {footer && <div className="mt-5 text-xs text-brand-navy-500 dark:text-brand-navy-400 text-center">{footer}</div>}
    </main>
  );
}

/** Highlighted account summary (left accent bar), mirroring the info box of the activation email. */
export function AccountInfoBox({ rows }) {
  return (
    <dl className="rounded-lg bg-surface-muted dark:bg-brand-navy-800/60 border-l-4 border-brand-sand-600 px-4 py-3 space-y-1.5 mb-5">
      {rows.filter(([, value]) => value).map(([label, value]) => (
        <div key={label} className="flex gap-3 text-[13px] leading-5">
          <dt className="w-28 shrink-0 text-brand-navy-500 dark:text-brand-navy-400">{label}</dt>
          <dd className="font-semibold text-brand-navy-900 dark:text-white break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
