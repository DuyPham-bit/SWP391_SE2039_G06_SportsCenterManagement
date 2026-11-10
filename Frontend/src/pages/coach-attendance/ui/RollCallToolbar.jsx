import React from 'react';

export function RollCallToolbar({
  ATTENDANCE_STATUSES, canAttend, filterRosterStatus, handleMarkAllPresent, handleResetRecords, isEn,
  members, saving, searchMember, setFilterRosterStatus, setSearchMember, stats
}) {
  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-brand-navy-50 border border-brand-navy-200">
          <span className="text-[11px] font-bold text-brand-navy-500 block">{isEn ? 'Total Students' : 'Tổng học viên'}</span>
          <span className="font-chivo text-2xl font-black text-brand-navy-900 mt-1 block">
            {stats.total}
          </span>
        </div>

        {Object.entries(ATTENDANCE_STATUSES).map(([key, cfg]) => {
          const count = stats[key.toLowerCase()] || 0;
          return (
            <div key={key} className={`p-3.5 rounded-xl border ${cfg.statClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold block">{cfg.label}</span>
                <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`}></span>
              </div>
              <span className="font-chivo text-2xl font-black mt-1 block">
                {count}
              </span>
            </div>
          );
        })}

        <div className={`p-3.5 rounded-xl border ${
                stats.unmarked > 0 ? 'bg-brand-terra-50 border-brand-terra-200 text-brand-terra-900' : 'bg-brand-navy-50 border-brand-navy-200 text-brand-navy-600'
              }`}>
          <span className="text-[11px] font-bold block">{isEn ? 'Unmarked' : 'Chưa đánh dấu'}</span>
          <span className="font-chivo text-2xl font-black mt-1 block">
            {stats.unmarked}
          </span>
        </div>
      </div>

      {/* Quick Actions & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl bg-brand-navy-50 border border-brand-navy-200">
        {/* Search Member */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy-400 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder={isEn ? "Search students by name, code, phone..." : "Tìm học viên theo tên, mã HV, SĐT..."}
            value={searchMember}
            onChange={e => setSearchMember(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-brand-navy-200 bg-white text-xs font-semibold text-brand-navy-900 placeholder-brand-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-danger-600"
          />
        </div>

        {/* Batch Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            disabled={!canAttend || saving || members.length === 0}
            onClick={handleMarkAllPresent}
            className="px-3 py-2 rounded-lg bg-brand-sage-700 hover:bg-brand-sage-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            title={isEn ? "Mark all students as Present" : "Đánh dấu tất cả học viên thành Có mặt"}
          >
            <span className="material-symbols-outlined text-base">done_all</span>
            <span>{isEn ? 'All Present' : 'Tất cả Có mặt'}</span>
          </button>

          <button
            type="button"
            disabled={!canAttend || saving || members.length === 0}
            onClick={handleResetRecords}
            className="px-3 py-2 rounded-lg border border-brand-navy-300 bg-white hover:bg-brand-navy-100 text-brand-navy-700 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">restart_alt</span>
            <span>{isEn ? 'Reset' : 'Đặt lại'}</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs for Roster */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
        <span className="text-brand-navy-400 text-[11px] uppercase tracking-wider mr-1">{isEn ? 'Filter:' : 'Lọc:'}</span>
        <button
          type="button"
          onClick={() => setFilterRosterStatus('ALL')}
          className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'ALL'
                    ? 'bg-brand-navy-900 text-white'
                    : 'bg-brand-navy-100 text-brand-navy-600 hover:bg-brand-navy-200'
                }`}
        >
          {isEn ? 'All' : 'Tất cả'} ({members.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterRosterStatus('PRESENT')}
          className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'PRESENT'
                    ? 'bg-brand-sage-700 text-white'
                    : 'bg-brand-sage-50 text-brand-sage-800 hover:bg-brand-sage-100'
                }`}
        >
          {isEn ? 'Present' : 'Có mặt'} ({stats.present})
        </button>
        <button
          type="button"
          onClick={() => setFilterRosterStatus('ABSENT')}
          className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'ABSENT'
                    ? 'bg-brand-danger-600 text-white'
                    : 'bg-brand-danger-50 text-brand-danger-800 hover:bg-brand-danger-100'
                }`}
        >
          {isEn ? 'Absent' : 'Vắng'} ({stats.absent})
        </button>
        <button
          type="button"
          onClick={() => setFilterRosterStatus('EXCUSED')}
          className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'EXCUSED'
                    ? 'bg-brand-teal-700 text-white'
                    : 'bg-brand-teal-50 text-brand-teal-800 hover:bg-brand-teal-100'
                }`}
        >
          {isEn ? 'Excused' : 'Có phép'} ({stats.excused})
        </button>
        <button
          type="button"
          onClick={() => setFilterRosterStatus('UNMARKED')}
          className={`px-3 py-1 rounded-lg transition-all ${
                  filterRosterStatus === 'UNMARKED'
                    ? 'bg-brand-terra-700 text-white'
                    : 'bg-brand-terra-50 text-brand-terra-800 hover:bg-brand-terra-100'
                }`}
        >
          {isEn ? 'Unmarked' : 'Chưa đánh dấu'} ({stats.unmarked})
        </button>
      </div>
    </div>
  );
}
