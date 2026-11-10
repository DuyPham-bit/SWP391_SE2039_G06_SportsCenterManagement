import React from 'react';
import { coachInput } from '../../../features/coach-workspace/index.js';

export function PeriodConfigForm({ isEn, schedule }) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        schedule.reload();
      }}
      className="p-4 rounded-2xl border border-brand-navy-200 bg-white shadow-sm flex flex-wrap items-end gap-3 text-xs animate-fadeIn"
    >
      <label className="font-semibold text-brand-navy-700 space-y-1">
        <span>{isEn ? 'From Date:' : 'Từ ngày:'}</span>
        <input
          type="date"
          required
          className={coachInput}
          value={schedule.from}
          onChange={e => schedule.setFrom(e.target.value)}
        />
      </label>
      <label className="font-semibold text-brand-navy-700 space-y-1">
        <span>{isEn ? 'To Date:' : 'Đến ngày:'}</span>
        <input
          type="date"
          required
          className={coachInput}
          value={schedule.to}
          onChange={e => schedule.setTo(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={schedule.loading}
        className="px-4 py-2 rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
      >
        {schedule.loading ? (isEn ? 'Loading...' : 'Đang tải...') : (isEn ? 'Apply Date Range' : 'Áp dụng khoảng ngày')}
      </button>
      <span className="text-brand-navy-500 self-center">
        {isEn ? 'Maximum 92 days per request.' : 'Tối đa 92 ngày cho mỗi lần tải dữ liệu.'}
      </span>
    </form>
  );
}
