import React from 'react';

export function AssignmentEmptyState({ isEn, setSearchQuery, setSelectedSportFilter, setSelectedStatusFilter }) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-12 text-center space-y-4 shadow-sm">
      <div className="w-16 h-16 bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-400 rounded-2xl flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[36px]">search_off</span>
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-brand-navy-800 dark:text-brand-navy-200">{isEn ? 'No classes found' : 'Không tìm thấy lớp học phù hợp'}</h3>
        <p className="text-xs md:text-sm text-brand-navy-500 dark:text-brand-navy-400 max-w-md mx-auto">
          {isEn ? 'No classes match your current search criteria or assignment status filters.' : 'Không có lớp nào khớp với tiêu chí tìm kiếm hoặc bộ lọc trạng thái phân công hiện tại.'}
        </p>
      </div>
      <button
        onClick={() => {
          setSearchQuery('');
          setSelectedSportFilter('');
          setSelectedStatusFilter('ALL');
        }}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy-900 hover:bg-brand-navy-800 text-white text-xs md:text-sm font-semibold rounded-xl transition shadow"
      >
        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        <span>{isEn ? 'Reset all filters' : 'Đặt lại toàn bộ bộ lọc'}</span>
      </button>
    </div>
  );
}
