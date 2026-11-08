import React from 'react';

export function ReportPeriodSelector({ isEn, period, range, setPeriod, setRange, setSelection, showError }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-brand-navy-900 p-4 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm no-print">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 mr-1">
          {isEn ? 'Quick Period:' : 'Kỳ nhanh:'}
        </span>
        {[
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
              setPeriod(id);
              setSelection(id);
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
          if (range.from && range.to && range.from > range.to) {
            showError({
              message: isEn
                ? 'Invalid date range: Start date must be earlier than or equal to End date.'
                : 'Khoảng ngày không hợp lệ: Từ ngày phải nhỏ hơn hoặc bằng Đến ngày.',
              code: 'VAL-REPORT-DATE',
              proposedHandling: isEn ? 'Please adjust the date range.' : 'Vui lòng chọn lại khoảng thời gian tra cứu.'
            });
            return;
          }
          setPeriod('CUSTOM');
          setSelection({ ...range });
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
    </div>
  );
}
