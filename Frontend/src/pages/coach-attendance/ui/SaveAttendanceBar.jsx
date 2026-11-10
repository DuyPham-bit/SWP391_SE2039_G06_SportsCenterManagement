import React from 'react';

export function SaveAttendanceBar({ canAttend, handleSaveAttendance, isEn, saving, stats }) {
  return (
    <div className="pt-4 border-t border-brand-navy-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="text-xs text-brand-navy-600 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold">{isEn ? 'Attendance progress:' : 'Tiến độ điểm danh:'}</span>
          <span className="font-extrabold text-brand-navy-900">
            {stats.total - stats.unmarked}/{stats.total} {isEn ? 'students' : 'học viên'}
          </span>
          {stats.unmarked === 0 ? (
            <span className="text-brand-sage-700 dark:text-brand-sage-400 font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {isEn ? 'Complete' : 'Hoàn tất'}
            </span>
          ) : (
            <span className="text-brand-sand-700 dark:text-brand-sand-400 font-bold">
              {isEn ? `(${stats.unmarked} unmarked)` : `(Còn ${stats.unmarked} chưa chọn)`}
            </span>
          )}
        </div>
        <div className="w-48 h-1.5 bg-brand-navy-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-sage-500 rounded-full transition-all"
            style={{ width: `${stats.total > 0 ? Math.round(((stats.total - stats.unmarked) / stats.total) * 100) : 0}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveAttendance}
          disabled={!canAttend || saving || stats.unmarked > 0}
          className="px-6 py-2.5 rounded-xl bg-brand-danger-600 hover:bg-brand-danger-700 text-white font-chivo font-black text-sm uppercase tracking-wider transition-all shadow-md shadow-brand-danger-600/20 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">save</span>
              <span>{isEn ? 'Save Attendance Records' : 'Lưu Kết Quả Điểm Danh'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
