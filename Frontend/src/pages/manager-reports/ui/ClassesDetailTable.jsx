import React from 'react';
import { getSportStyle } from '../lib/reportLabels.js';

export function ClassesDetailTable({
  classSearch, classSortBy, classSportFilter, isEn, metrics, processedClasses, setClassSearch,
  setClassSortBy, setClassSportFilter
}) {
  return (
    <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-brand-navy-900 dark:text-white text-sm">
            {isEn ? 'Class Performance & Utilization Rankings' : 'Chi tiết thứ hạng từng lớp học'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          {/* Search box */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-brand-navy-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={isEn ? 'Search class or coach...' : 'Tìm lớp hoặc HLV...'}
              value={classSearch}
              onChange={e => setClassSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
          </div>

          {/* Sport Filter */}
          <select
            className="text-xs font-medium border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 focus:outline-none"
            value={classSportFilter}
            onChange={e => setClassSportFilter(e.target.value)}
          >
            <option value="ALL">{isEn ? 'All Sports' : 'Tất cả bộ môn'}</option>
            {metrics.topSports?.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>

          {/* Sắp xếp */}
          <select
            className="text-xs font-medium border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 focus:outline-none"
            value={classSortBy}
            onChange={e => setClassSortBy(e.target.value)}
          >
            <option value="booked">{isEn ? 'Sort: Most Booked' : 'Sắp xếp: Đặt nhiều nhất'}</option>
            <option value="occupancy">{isEn ? 'Sort: Highest Occupancy' : 'Sắp xếp: % Lấp đầy cao nhất'}</option>
            <option value="sessions">{isEn ? 'Sort: Most Sessions' : 'Sắp xếp: Số buổi nhiều nhất'}</option>
          </select>
        </div>
      </div>

      {/* Classes Table */}
      <div className="overflow-x-auto border border-brand-navy-100 dark:border-brand-navy-800 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 font-chivo text-xs uppercase tracking-wider border-b border-brand-navy-200 dark:border-brand-navy-700">
              <th className="py-3 px-3 w-14 text-center whitespace-nowrap">{isEn ? 'Rank' : 'Hạng'}</th>
              <th className="py-3 px-4 min-w-[180px]">{isEn ? 'Class Name' : 'Lớp học'}</th>
              <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">{isEn ? 'Discipline & Coach' : 'Bộ môn & HLV'}</th>
              <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">{isEn ? 'Court / Studio' : 'Sân / Phòng diễn ra'}</th>
              <th className="py-3 px-3 text-center whitespace-nowrap min-w-[80px]">{isEn ? 'Sessions' : 'Số buổi'}</th>
              <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Booked / Cap' : 'Lượt đặt / Sức chứa'}</th>
              <th className="py-3 px-4 w-44 min-w-[140px] whitespace-nowrap">{isEn ? 'Occupancy Rate' : 'Tỷ lệ lấp đầy'}</th>
              <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Load Status' : 'Đánh giá tải'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
            {processedClasses.length ? processedClasses.map((cls, idx) => {
              const sportStyle = getSportStyle(cls.sportName);
              const isTop1 = idx === 0 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';
              const isTop2 = idx === 1 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';
              const isTop3 = idx === 2 && classSortBy === 'booked' && !classSearch && classSportFilter === 'ALL';

              let badgeRank = `#${idx + 1}`;
              let badgeRankColor = 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 border-brand-navy-200 dark:border-brand-navy-700';
              if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-brand-sand-300/30 text-brand-sand-900 dark:text-brand-sand-300 border-brand-sand-300/60 font-bold'; }
              else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-800 dark:text-brand-navy-200 border-brand-navy-300 dark:border-brand-navy-600 font-bold'; }
              else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-800 dark:text-brand-sand-400 border-brand-sand-200 dark:border-brand-sand-800 font-bold'; }

              return (
                <tr key={cls.id} className="hover:bg-brand-navy-50/80 dark:hover:bg-brand-navy-800/50 transition-colors">
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs border ${badgeRankColor}`}>
                      {badgeRank}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-navy-900 dark:text-white">
                    {cls.name}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border w-fit ${sportStyle.bg}`}>
                        <span className="material-symbols-outlined text-[13px]">{sportStyle.icon}</span>
                        {cls.sportName}
                      </span>
                      <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Coach' : 'HLV'}: {cls.coachName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-brand-navy-700 dark:text-brand-navy-300">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-brand-navy-400">meeting_room</span>
                      {cls.roomName}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-brand-navy-700 dark:text-brand-navy-300">
                    {cls.sessionsCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-brand-navy-900 dark:text-white">{cls.booked}</span>
                    <span className="text-xs text-brand-navy-400"> / {cls.capacity}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className={cls.occupancyRate >= 20 ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-600 dark:text-brand-navy-400'}>
                          {cls.occupancyRate}%
                        </span>
                        <span className="text-[11px] text-brand-navy-400 font-normal">
                          {cls.capacity ? `${cls.booked}/${cls.capacity}` : '0/0'}
                        </span>
                      </div>
                      <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                                      cls.occupancyRate >= 20
                                        ? 'bg-brand-sage-700'
                                        : cls.occupancyRate >= 10
                                        ? 'bg-brand-teal-500'
                                        : 'bg-brand-navy-400'
                                    }`}
                          style={{ width: `${Math.min(100, cls.occupancyRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {cls.booked >= 15 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border border-brand-danger-200 dark:border-brand-danger-800">
                        <span>🔥</span>
                        <span>{isEn ? 'Very Hot' : 'Rất Hot'}</span>
                      </span>
                    ) : cls.booked >= 5 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                        <span>✅</span>
                        <span>{isEn ? 'Optimal' : 'Ổn định'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 border border-brand-navy-200 dark:border-brand-navy-700">
                        <span>⚠️</span>
                        <span>{isEn ? 'Off-peak' : 'Thấp điểm'}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-brand-navy-400 text-xs">
                  {isEn ? 'No classes matched the filter criteria.' : 'Không có lớp học nào thỏa mãn điều kiện lọc.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
