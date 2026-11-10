import React from 'react';

export function TrainingPlanStats({ isEn, stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div className="bg-white rounded-2xl p-4 border border-brand-navy-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-brand-teal-50 text-brand-teal-700 border border-brand-teal-100 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">assignment</span>
        </div>
        <div>
          <div className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wider">
            {isEn ? 'Total Plans' : 'Tổng giáo án'}
          </div>
          <div className="text-xl font-black text-brand-navy-900 font-chivo">
            {stats.total} <span className="text-xs font-normal text-brand-navy-500">{isEn ? 'curriculums' : 'bản'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-brand-navy-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-brand-sand-50 text-brand-sand-700 border border-brand-sand-100 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">star</span>
        </div>
        <div>
          <div className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wider">
            {isEn ? 'Personal Plans' : 'Phác đồ cá nhân'}
          </div>
          <div className="text-xl font-black text-brand-sand-700 dark:text-brand-sand-400 font-chivo">
            {stats.custom} <span className="text-xs font-normal text-brand-navy-500">{isEn ? 'members' : 'học viên'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-brand-navy-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-brand-sage-50 text-brand-sage-700 border border-brand-sage-100 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">groups</span>
        </div>
        <div>
          <div className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wider">
            {isEn ? 'Class Syllabi' : 'Giáo án toàn lớp'}
          </div>
          <div className="text-xl font-black text-brand-sage-700 dark:text-brand-sage-400 font-chivo">
            {stats.classCount} <span className="text-xs font-normal text-brand-navy-500">{isEn ? 'classes' : 'lớp'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-brand-navy-200/80 shadow-xs flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-brand-navy-50 text-brand-navy-700 border border-brand-navy-100 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]">sports</span>
        </div>
        <div>
          <div className="text-[11px] font-bold text-brand-navy-500 uppercase tracking-wider">
            {isEn ? 'Sports Covered' : 'Bộ môn áp dụng'}
          </div>
          <div className="text-xl font-black text-brand-navy-800 font-chivo">
            {stats.sports} <span className="text-xs font-normal text-brand-navy-500">{isEn ? 'sports' : 'môn'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
