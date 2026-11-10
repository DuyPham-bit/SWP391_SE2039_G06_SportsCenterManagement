import React from 'react';
import { getStatusName } from '../lib/reportLabels.js';

export function RevenueLogTable({ events, isEn, revenue }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <h3 className="font-bold text-brand-navy-900 dark:text-white text-sm">
          {isEn ? 'Revenue Reconciliation by Period' : 'Bảng đối soát doanh thu theo kỳ'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 font-semibold border-b border-brand-navy-200 dark:border-brand-navy-700">
                <th className="p-2.5">{isEn ? 'Period' : 'Thời gian'}</th>
                <th className="p-2.5 text-right">{isEn ? 'Net Revenue' : 'Doanh thu thuần'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
              {revenue.length ? revenue.map(r => (
                <tr key={r.periodStart} className="hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800/50">
                  <td className="p-2.5 text-brand-navy-700 dark:text-brand-navy-300 font-medium">{r.periodStart}</td>
                  <td className="p-2.5 text-right font-bold text-brand-sage-700 dark:text-brand-sage-500">{Number(r.net || 0).toLocaleString('vi-VN')}đ</td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="p-4 text-center text-brand-navy-400">{isEn ? 'No revenue records available.' : 'Chưa có dữ liệu doanh thu.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 rounded-2xl p-5 space-y-3 shadow-sm">
        <h3 className="font-bold text-brand-navy-900 dark:text-white text-sm">
          {isEn ? 'Class Booking Activity in Period' : 'Sự kiện đăng ký lớp trong kỳ'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 font-semibold border-b border-brand-navy-200 dark:border-brand-navy-700">
                <th className="p-2.5">{isEn ? 'Period' : 'Kỳ'}</th>
                <th className="p-2.5">{isEn ? 'Status / Count' : 'Trạng thái / Số lượng'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
              {events.length ? events.map(r => (
                <tr key={r.periodStart} className="hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800/50">
                  <td className="p-2.5 text-brand-navy-700 dark:text-brand-navy-300 font-medium">{r.periodStart}</td>
                  <td className="p-2.5 text-brand-navy-800 dark:text-brand-navy-200 font-bold">
                    {Object.entries(r.statusCounts || {}).map(([status, count]) => `${getStatusName(status, isEn)}: ${count}`).join(' · ') || '0'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="p-4 text-center text-brand-navy-400">{isEn ? 'No events recorded in this period.' : 'Chưa có sự kiện trong kỳ.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
