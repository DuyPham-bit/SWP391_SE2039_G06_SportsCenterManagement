import React from 'react';

export function PayrollTabs({ activeTab, isEn, rows, setActiveTab }) {
  return (
    <div className="flex items-center gap-2 border-b border-brand-navy-200 dark:border-brand-navy-800 pb-1">
      <button
        onClick={() => setActiveTab('sheet')}
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-brand-navy-900 text-white shadow-md'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-100 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800'
            }`}
      >
        <span className="material-symbols-outlined text-[18px]">table_chart</span>
        <span>{isEn ? 'Detailed Payroll & KPI Sheet' : 'Tab 1: Bảng lương & KPI chi tiết'}</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTab === 'sheet' ? 'bg-white/20 text-white' : 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300'
              }`}
        >
          {rows.length}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('reports')}
        className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-brand-sage-700 text-white shadow-md'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-100 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800'
            }`}
      >
        <span className="material-symbols-outlined text-[18px]">query_stats</span>
        <span>{isEn ? 'Reports & Performance Analytics' : 'Tab 2: Báo cáo & Phân tích ca dạy'}</span>
        <span className="w-2 h-2 rounded-full bg-brand-teal-400" />
      </button>
    </div>
  );
}
