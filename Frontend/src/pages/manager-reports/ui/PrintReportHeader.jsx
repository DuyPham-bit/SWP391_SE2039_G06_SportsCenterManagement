import React from 'react';

export function PrintReportHeader({ adminMode = false, isEn, metrics, periodLabel, range, reportScopeLabel }) {
  return (
    <div className="hidden print:block mb-4 border-b-2 border-brand-navy-900 pb-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-brand-sage-700 dark:text-brand-sage-400">SCMS · Olympic Sports Arena</div>
          <h1 className="text-xl font-black text-brand-navy-900 font-chivo">
            {adminMode
              ? (isEn ? 'SYSTEM REVENUE & OPERATIONAL ANALYTICS' : 'BÁO CÁO DOANH THU & VẬN HÀNH HỆ THỐNG')
              : (isEn ? 'REVENUE & OPERATIONAL ANALYTICS REPORT' : 'BÁO CÁO DOANH THU & THỐNG KÊ HOẠT ĐỘNG')}
          </h1>
          <p className="text-xs text-brand-navy-600 mt-1">
            {isEn ? 'Period:' : 'Kỳ báo cáo:'} <strong>{metrics?.from || range.from}</strong> → <strong>{metrics?.to || range.to}</strong> ({periodLabel})
          </p>
        </div>
        <div className="text-right text-xs text-brand-navy-600">
          <p><strong>{isEn ? 'Printed at:' : 'Thời điểm in:'}</strong> {new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
          <p className="text-[11px] text-brand-navy-500">{reportScopeLabel || (isEn ? 'Issued by Management' : 'Đơn vị phát hành: Ban Quản Lý')}</p>
        </div>
      </div>
    </div>
  );
}
