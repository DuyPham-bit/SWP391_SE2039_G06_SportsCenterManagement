import React from 'react';

export function ClassesMetrics({ isEn, metrics, setTab, tab }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Classes */}
      <div
        onClick={() => setTab('classes')}
        className={`cursor-pointer bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            tab === 'classes'
              ? 'border-brand-sage-700 ring-2 ring-brand-sage-700/20 dark:border-brand-sage-500'
              : 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Total Training Classes' : 'Tổng lớp đào tạo'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-700 dark:text-brand-navy-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-navy-900 dark:text-brand-navy-100">{metrics.totalClasses}</span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'active classes' : 'lớp hoạt động'}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-brand-navy-600 dark:text-brand-navy-400">
          <span className="inline-flex items-center gap-1 font-semibold text-brand-sage-700 dark:text-brand-sage-400">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500" />
            {metrics.publishedClasses} {isEn ? 'published' : 'đang mở'}
          </span>
          <span>·</span>
          <span className="text-brand-sand-700 dark:text-brand-sand-400 font-medium">
            {metrics.draftClasses} {isEn ? 'drafts' : 'bản nháp'}
          </span>
        </div>
      </div>

      {/* Card 2: Rooms */}
      <div
        onClick={() => setTab('rooms')}
        className={`cursor-pointer bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            tab === 'rooms'
              ? 'border-brand-teal-500 ring-2 ring-brand-teal-500/20 dark:border-brand-teal-400'
              : 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Courts & Facilities' : 'Phòng tập & Sân bãi'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">meeting_room</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-navy-900 dark:text-brand-navy-100">{metrics.totalRooms}</span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'zones' : 'khu vực'}</span>
        </div>
        <div className="mt-2 text-xs text-brand-navy-600 dark:text-brand-navy-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-brand-teal-700 dark:text-brand-teal-400">group</span>
          <span>
            {isEn ? 'Capacity:' : 'Tổng sức chứa:'} <strong>{metrics.totalRoomCapacity}</strong> {isEn ? 'slots/session' : 'chỗ / ca'}
          </span>
        </div>
      </div>

      {/* Card 3: Sports */}
      <div
        onClick={() => setTab('sports')}
        className={`cursor-pointer bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            tab === 'sports'
              ? 'border-brand-sand-500 ring-2 ring-brand-sand-500/20 dark:border-brand-sand-400'
              : 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Sport Disciplines' : 'Bộ môn thể thao'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">fitness_center</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-navy-900 dark:text-brand-navy-100">{metrics.totalSports}</span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'sports' : 'bộ môn'}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-navy-600 dark:text-brand-navy-400">
          <span className="font-semibold text-brand-navy-700 dark:text-brand-navy-300">{metrics.sharedSportsCount}</span> {isEn ? 'shared' : 'dùng chung'}
          <span>·</span>
          <span className="font-semibold text-brand-sand-700 dark:text-brand-sand-400">{metrics.customSportsCount}</span> {isEn ? 'center-specific' : 'riêng trung tâm'}
        </div>
      </div>

      {/* Card 4: Enrollment Rate */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Publish Ratio & Students' : 'Tỷ lệ công bố & Học viên'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-sage-700 dark:text-brand-sage-400">{metrics.publishedRatio}%</span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'active ratio' : 'đạt chuẩn'}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-navy-600 dark:text-brand-navy-400">
          <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">how_to_reg</span>
          <span>
            {isEn ? 'Total' : 'Tổng'} <strong>{metrics.totalEnrolled}</strong> {isEn ? 'students enrolled' : 'học viên đã ghi danh'}
          </span>
        </div>
      </div>
    </div>
  );
}
