import React from 'react';
import { formatMemberName } from '../index.js';

export function MemberAvatar({
  member,
  size = 'md',
  className = ''
}) {
  const name = formatMemberName(member);
  const avatarUrl = member?.avatar || member?.avatarUrl || null;
  const initial = name ? name.charAt(0).toUpperCase() : 'M';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base'
  }[size] || 'w-10 h-10 text-sm';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover border border-slate-200 dark:border-slate-800 ${className}`}
        onError={e => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-tr from-[#81B29A] to-[#F2CC8F] text-white font-bold flex items-center justify-center shadow-xs select-none ${className}`}
    >
      {initial}
    </div>
  );
}

export default MemberAvatar;

