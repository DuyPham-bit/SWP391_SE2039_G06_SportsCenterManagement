import React from 'react';
import { isMembershipActive } from '../index.js';

export function MemberStatusBadge({ member, className = '' }) {
  if (!member) return null;
  const active = isMembershipActive(member);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
        active
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      } ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'} mr-1.5`} />
      {active ? 'Đang hoạt động' : (member.status || 'Hết hạn')}
    </span>
  );
}

export default MemberStatusBadge;

