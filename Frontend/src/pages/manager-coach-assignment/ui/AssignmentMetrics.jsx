import React from 'react';

export function AssignmentMetrics({ isEn, metrics, selectedStatusFilter, setSelectedStatusFilter }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Classes */}
      <div
        onClick={() => setSelectedStatusFilter('ALL')}
        className={`cursor-pointer bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            selectedStatusFilter === 'ALL'
              ? 'border-brand-sage-700 ring-2 ring-brand-sage-700/20 dark:border-brand-sage-500'
              : 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Total Classes' : 'Tổng lớp đào tạo'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-700 dark:text-brand-navy-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-navy-900 dark:text-brand-navy-100">{metrics.totalClasses}</span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'classes' : 'lớp thể thao'}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-brand-navy-600 dark:text-brand-navy-400">
          <span className="inline-flex items-center gap-1 font-semibold text-brand-sage-700 dark:text-brand-sage-400">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500" />
            {metrics.assignedClasses} {isEn ? 'assigned' : 'đã có HLV'}
          </span>
          <span>·</span>
          <span className="text-brand-sand-700 dark:text-brand-sand-400 font-medium">
            {metrics.unassignedClasses} {isEn ? 'pending' : 'chờ phân công'}
          </span>
        </div>
      </div>

      {/* Card 2: Coaches Available */}
      <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm hover-lift transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Center Coach Roster' : 'Đội ngũ HLV trung tâm'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">sports</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-navy-900 dark:text-brand-navy-100">{metrics.totalCoaches}</span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'active coaches' : 'HLV cơ hữu'}</span>
        </div>
        <div className="mt-2 text-xs text-brand-navy-600 dark:text-brand-navy-400 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-brand-sand-700 dark:text-brand-sand-400">verified_user</span>
          <span>{isEn ? 'Olympic standard credentials certified' : 'Đã kiểm định chứng chỉ chuẩn Olympic'}</span>
        </div>
      </div>

      {/* Card 3: Coverage Rate */}
      <div
        onClick={() => setSelectedStatusFilter('ASSIGNED')}
        className={`cursor-pointer bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            selectedStatusFilter === 'ASSIGNED'
              ? 'border-brand-sage-500 ring-2 ring-brand-sage-500/20 dark:border-brand-sage-400'
              : 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Coach Coverage Rate' : 'Tỷ lệ phủ sóng HLV'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">verified</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-sage-700 dark:text-brand-sage-400">{metrics.coverageRatio}%</span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'covered' : 'hoàn tất'}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-navy-600 dark:text-brand-navy-400">
          <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">check_circle</span>
          <span>
            {metrics.assignedClasses} / {metrics.totalClasses} {isEn ? 'classes staffed' : 'lớp đã có giáo viên'}
          </span>
        </div>
      </div>

      {/* Card 4: Needs Attention / Mismatches */}
      <div
        onClick={() => setSelectedStatusFilter(metrics.mismatchCount > 0 ? 'MISMATCH' : 'UNASSIGNED')}
        className={`cursor-pointer bg-white dark:bg-brand-navy-900 rounded-2xl p-5 border transition-all shadow-sm hover-lift ${
            selectedStatusFilter === 'MISMATCH' || selectedStatusFilter === 'UNASSIGNED'
              ? 'border-brand-sand-500 ring-2 ring-brand-sand-500/20 dark:border-brand-sand-400'
              : 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300'
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Attention Needed' : 'Lưu ý chuyên môn'}
          </span>
          <div className="w-10 h-10 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand-sand-700 dark:text-brand-sand-400">
            {metrics.unassignedClasses + metrics.mismatchCount}
          </span>
          <span className="text-xs font-medium text-brand-navy-400">{isEn ? 'to review' : 'cần rà soát'}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-navy-600 dark:text-brand-navy-400">
          <span className="font-semibold text-brand-sand-700 dark:text-brand-sand-400">{metrics.unassignedClasses}</span> {isEn ? 'unassigned' : 'chưa phân công'}
          <span>·</span>
          <span className="font-semibold text-brand-danger-600 dark:text-brand-danger-400">{metrics.mismatchCount}</span> {isEn ? 'mismatches' : 'lệch môn'}
        </div>
      </div>
    </div>
  );
}
