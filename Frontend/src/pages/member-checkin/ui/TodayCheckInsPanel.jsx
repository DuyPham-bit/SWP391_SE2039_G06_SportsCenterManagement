import React from 'react';

export function TodayCheckInsPanel({ checkIns, historyError, isEn }) {
  return (
    <div id="recent-checkins-log" className="lg:col-span-5 bg-white dark:bg-brand-navy-900 p-6 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-4 hover-lift transition-all">
      <div className="flex items-center justify-between pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
        <h2 className="font-chivo text-sm font-bold text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? `Today's Entry Scans (${checkIns.length})` : `Nhật Ký Quét Thẻ Hôm Nay (${checkIns.length})`}
        </h2>
        <span className="text-xs font-semibold text-brand-sage-700 dark:text-brand-sage-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
          {isEn ? 'Live' : 'Trực tiếp'}
        </span>
      </div>

      {historyError && <p role="alert" className="text-sm text-brand-danger-600 dark:text-brand-danger-400">{historyError}</p>}
      <div className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 max-h-[520px] overflow-y-auto pr-1 space-y-2">
        {checkIns.length === 0 ? (
          <div className="py-12 text-center text-xs text-brand-navy-400 dark:text-brand-navy-500 space-y-2">
            <span className="material-symbols-outlined text-3xl text-brand-navy-300 dark:text-brand-navy-600">badge</span>
            <p>{isEn ? 'No scans recorded today yet.' : 'Chưa có lượt quét thẻ nào hôm nay.'}</p>
            <p className="text-[11px] text-brand-navy-400">
              {isEn ? 'Scanned passes will appear here in real-time.' : 'Các lượt vào sân thành công sẽ tự động xuất hiện tại đây.'}
            </p>
          </div>
        ) : (
          checkIns.map(item => (
            <div key={item.id} className="pt-2.5 pb-1 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-brand-sage-100 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center shrink-0 mt-0.5 border border-brand-sage-300 dark:border-brand-sage-800">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <div>
                  <div className="font-bold text-brand-navy-900 dark:text-white">{item.memberName}</div>
                  <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                    <span className="font-mono">{item.memberCode}</span> • {item.packageName}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-semibold text-brand-navy-700 dark:text-brand-navy-300 block">
                  {item.checkInTime.split(' ')[1] || item.checkInTime}
                </span>
                <span className="text-[10px] text-brand-navy-400">
                  {isEn ? 'Desk' : 'Lễ tân'}: {item.receptionistName?.split(' ')[0]}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
