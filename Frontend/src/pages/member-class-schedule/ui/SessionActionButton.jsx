import React from 'react';
import { PACKAGES_ROUTE, SESSION_ACTION_TONES } from '../lib/sessionAction.js';

/** Single source for the per-session action button; `action` comes from getSessionAction(). */
export function SessionActionButton({ action, cls, handleOpenSessionDetail, size = 'sm' }) {
  const sizing = size === 'sm'
    ? 'px-2 py-0.5 rounded text-[10px]'
    : 'px-3.5 py-1.5 rounded-lg font-chivo text-xs';
  const onClick = (e) => {
    e.stopPropagation();
    if (action.action === 'packages') window.location.hash = PACKAGES_ROUTE;
    else if (action.action === 'detail') handleOpenSessionDetail(cls);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!action.action}
      className={`${sizing} font-bold uppercase tracking-wide transition-colors ${SESSION_ACTION_TONES[action.tone]}`}
    >
      {action.label}
    </button>
  );
}
