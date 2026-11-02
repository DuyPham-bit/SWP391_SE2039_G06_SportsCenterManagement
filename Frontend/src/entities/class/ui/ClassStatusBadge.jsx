import React from 'react';
import { isClassFull } from '../index.js';

export function ClassStatusBadge({ cls, className = '' }) {
  if (!cls) return null;
  const isCancelled = cls.status === 'Cancelled' || cls.isCancelled;
  const isFull = isClassFull(cls);

  if (isCancelled) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 ${className}`}>
        Đã hủy
      </span>
    );
  }

  if (isFull) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ${className}`}>
        Đã đầy
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ${className}`}>
      Còn chỗ
    </span>
  );
}

export default ClassStatusBadge;

