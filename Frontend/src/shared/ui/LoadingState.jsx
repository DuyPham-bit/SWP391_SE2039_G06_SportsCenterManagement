import React from 'react';

export function LoadingState({
  message = 'Đang tải dữ liệu...',
  className = ''
}) {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center min-h-[160px] ${className}`}>
      <div className="w-8 h-8 border-3 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}

export default LoadingState;

