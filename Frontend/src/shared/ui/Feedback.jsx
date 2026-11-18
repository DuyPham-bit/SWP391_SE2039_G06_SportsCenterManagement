import React from 'react';

/** Shimmering placeholder block. Size it with Tailwind classes (h-4 w-32, rounded-full…). */
export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`scms-skeleton block ${className}`} />;
}

/** A list/table placeholder: a few shimmering rows announced once to screen readers. */
export function SkeletonRows({ rows = 5, label = 'Đang tải dữ liệu...' }) {
  return (
    <div role="status" aria-live="polite" className="w-full p-4 sm:p-5 space-y-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3" style={{ opacity: 1 - index * 0.12 }}>
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5 rounded-full" />
            <Skeleton className="h-2.5 w-4/5 rounded-full" />
          </div>
          <Skeleton className="hidden sm:block h-7 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Empty state with a small drawn court-and-ball illustration in the brand colours. */
export function EmptyState({ title = 'Chưa có dữ liệu', message, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 gap-2' : 'py-12 gap-3'}`}>
      <svg viewBox="0 0 120 90" className={`scms-empty-art ${compact ? 'w-20' : 'w-28'} h-auto`} aria-hidden="true">
        <ellipse cx="60" cy="82" rx="38" ry="5" fill="rgb(var(--color-text) / 0.08)" />
        <rect x="14" y="20" width="92" height="52" rx="8" fill="rgb(var(--color-primary-soft))" stroke="rgb(var(--color-primary) / 0.45)" strokeWidth="2" />
        <path d="M60 20v52M14 46h92" stroke="rgb(var(--color-primary) / 0.35)" strokeWidth="2" />
        <circle cx="60" cy="46" r="9" fill="none" stroke="rgb(var(--color-primary) / 0.35)" strokeWidth="2" />
        <circle cx="88" cy="16" r="9" fill="rgb(var(--brand-sand-300))" stroke="rgb(var(--brand-sand-600))" strokeWidth="2" />
        <path d="M80 13c4 2 12 2 16 0M80 19c4-2 12-2 16 0" stroke="rgb(var(--brand-sand-600))" strokeWidth="1.5" fill="none" />
      </svg>
      <p className="text-sm font-bold text-ink-strong">{title}</p>
      {message && <p className="max-w-xs text-xs text-ink-muted leading-relaxed">{message}</p>}
      {action}
    </div>
  );
}
