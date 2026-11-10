import React from 'react';
import { reportApi } from '../../../entities/report/index.js';
import { reportDate } from '../../../shared/lib/reportFileData.js';

export function ReportPeriodSelector({
  hasPendingRange, isEn, metrics, period, range, selection, setPeriod, setRange, setSelection, showError
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-brand-navy-900 p-4 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm no-print">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 mr-1">
          {isEn ? 'Quick Period:' : 'Kỳ nhanh:'}
        </span>
        {[
          ['DAY', isEn ? 'Today' : 'Hôm nay'],
          ['WEEK', isEn ? 'This Week' : 'Tuần này'],
          ['30D', isEn ? '30 Days' : '30 ngày qua'],
          ['MONTH', isEn ? 'This Month' : 'Tháng này'],
          ['LAST_MONTH', isEn ? 'Last Month' : 'Tháng trước'],
          ['QUARTER', isEn ? 'This Quarter' : 'Quý này'],
          ['YEAR', isEn ? 'This Year' : 'Năm nay']
        ].map(([id, label]) => (
          <button
            key={id}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                period === id
                  ? 'bg-brand-sage-700 text-white shadow-sm ring-2 ring-brand-sage-700/30'
                  : 'bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 border border-brand-navy-200 dark:border-brand-navy-700'
              }`}
            onClick={() => {
              const nextRange = reportApi.getPeriodRange(id);
              setPeriod(id);
              setSelection(nextRange);
              setRange({ ...nextRange });
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={e => {
          e.preventDefault();
          let nextRange;
          try {
            nextRange = reportApi.getPeriodRange(range);
          } catch (error) {
            showError({
              message: isEn
                ? 'Choose valid dates, up to 366 days, grouped by day or month.'
                : error.message,
              code: 'VAL-REPORT-DATE',
              proposedHandling: isEn ? 'Please adjust the date range.' : 'Vui lòng chọn lại khoảng thời gian tra cứu.'
            });
            return;
          }
          setPeriod('CUSTOM');
          setSelection(nextRange);
          setRange({ ...nextRange });
        }}
      >
        <div className="flex items-center gap-1.5 bg-brand-navy-50 dark:bg-brand-navy-800 px-2.5 py-1.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-xs">
          <span className="text-brand-navy-400">{isEn ? 'From' : 'Từ'}</span>
          <input
            type="date"
            className="text-xs font-medium text-brand-navy-800 dark:text-brand-navy-200 bg-transparent focus:outline-none"
            value={range.from}
            onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
            required
          />
        </div>
        <div className="flex items-center gap-1.5 bg-brand-navy-50 dark:bg-brand-navy-800 px-2.5 py-1.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-xs">
          <span className="text-brand-navy-400">{isEn ? 'To' : 'Đến'}</span>
          <input
            type="date"
            className="text-xs font-medium text-brand-navy-800 dark:text-brand-navy-200 bg-transparent focus:outline-none"
            min={range.from}
            value={range.to}
            onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
            required
          />
        </div>
        <select
          className="text-xs font-medium text-brand-navy-800 dark:text-brand-navy-200 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl px-2.5 py-1.5 focus:outline-none"
          value={range.groupBy}
          onChange={e => setRange(r => ({ ...r, groupBy: e.target.value }))}
        >
          <option value="day">{isEn ? 'By Day' : 'Theo Ngày'}</option>
          <option value="month">{isEn ? 'By Month' : 'Theo Tháng'}</option>
        </select>
        <button type="submit" className="px-3.5 py-1.5 rounded-xl bg-brand-navy-900 dark:bg-brand-sage-500 text-white dark:text-brand-navy-950 text-xs font-bold hover:opacity-90 transition">
          {isEn ? 'Apply' : 'Áp dụng'}
        </button>
      </form>
      <p className="w-full text-xs text-brand-navy-600 dark:text-brand-navy-300" aria-live="polite">
        {isEn ? 'Report period: ' : 'Kỳ báo cáo: '}
        {reportDate(metrics?.from || selection.from)} → {reportDate(metrics?.to || selection.to)}
        {' · '}{isEn ? 'Collections use payment dates; refunds use processing dates.' : 'Tiền thu tính theo ngày thanh toán; tiền hoàn tính theo ngày xử lý.'}
        {hasPendingRange && <strong className="ml-2">{isEn ? 'Date changes have not been applied.' : 'Thay đổi khoảng ngày chưa được áp dụng.'}</strong>}
      </p>
    </div>
  );
}
