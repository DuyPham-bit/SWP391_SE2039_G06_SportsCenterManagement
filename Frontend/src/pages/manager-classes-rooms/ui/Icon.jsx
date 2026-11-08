import React from 'react';

export function Icon({ children, className = '' }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${className}`}>
      {children}
    </span>
  );
}
