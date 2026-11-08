import React from 'react';

export function DetailTableTabs({ activeTableTab, isEn, setActiveTableTab }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-black tracking-tight font-chivo text-brand-navy-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[22px]">table_chart</span>
          {isEn ? 'OPERATIONAL DATA TABLES & DETAILS' : 'BẢNG TRA CỨU CHI TIẾT VẬN HÀNH'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn
            ? 'Drill down into individual classes, sports disciplines, court facilities, and revenue audit logs.'
            : 'Tra cứu chi tiết từng lớp học, bộ môn, sân bãi và nhật ký sự kiện.'}
        </p>
      </div>

      {/* Table Tab Switcher */}
      <div className="flex flex-wrap gap-2 no-print">
        {[
          ['classes', isEn ? '🏅 Classes Table' : '🏅 Bảng Lớp học'],
          ['sports', isEn ? '🥋 Sports Directory' : '🥋 Danh sách Bộ môn'],
          ['rooms', isEn ? '🏟️ Courts & Rooms' : '🏟️ Bảng Sân & Phòng'],
          ['coaches', isEn ? '🧑‍🏫 Coach Performance' : '🧑‍🏫 Hiệu suất HLV'],
          ['logs', isEn ? '📋 Revenue & Logs' : '📋 Lịch sử & Đăng ký']
        ].map(([tabKey, tabLabel]) => (
          <button
            key={tabKey}
            onClick={() => setActiveTableTab(tabKey)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTableTab === tabKey
                        ? 'bg-brand-navy-900 dark:bg-brand-sage-500 text-white dark:text-brand-navy-950 shadow-sm'
                        : 'bg-white dark:bg-brand-navy-900 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-800'
                    }`}
          >
            {tabLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
