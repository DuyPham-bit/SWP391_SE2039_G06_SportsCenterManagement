import React from 'react';

export function CoachesDetailTable({ isEn, metrics }) {
  return (
    <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-brand-navy-900 dark:text-white text-sm">
            {isEn ? 'Coach workload and class occupancy' : 'Khối lượng giảng dạy và tỷ lệ lấp đầy theo HLV'}
          </h3>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
            {isEn
              ? `${metrics.coachesWithSessions} coaches have sessions · ${metrics.coachesWithoutSessions} have no sessions in this period`
              : `${metrics.coachesWithSessions} HLV có ca dạy · ${metrics.coachesWithoutSessions} HLV chưa có ca dạy trong kỳ`}
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">
          {isEn ? 'Total coaches' : 'Tổng HLV'}: {metrics.coaches.length}
        </span>
      </div>
      <div className="overflow-x-auto border border-brand-navy-100 dark:border-brand-navy-800 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 font-chivo text-xs uppercase tracking-wider border-b border-brand-navy-200 dark:border-brand-navy-700">
              <th className="py-3 px-4 min-w-[200px]">{isEn ? 'Coach' : 'Huấn luyện viên'}</th>
              <th className="py-3 px-4 min-w-[160px]">{isEn ? 'Specialization' : 'Chuyên môn'}</th>
              <th className="py-3 px-3 text-center">{isEn ? 'Classes' : 'Số lớp'}</th>
              <th className="py-3 px-3 text-center">{isEn ? 'Sessions' : 'Số ca'}</th>
              <th className="py-3 px-4 text-center min-w-[120px]">{isEn ? 'Booked / Capacity' : 'Lượt đặt / Sức chứa'}</th>
              <th className="py-3 px-4 min-w-[160px]">{isEn ? 'Occupancy' : 'Tỷ lệ lấp đầy'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
            {metrics.coaches.length ? metrics.coaches.map(coach => (
              <tr key={coach.id} className="hover:bg-brand-navy-50/80 dark:hover:bg-brand-navy-800/50 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-bold text-brand-navy-900 dark:text-white">{coach.fullName}</p>
                  <p className="text-[11px] text-brand-navy-400">{coach.coachCode || (isEn ? 'No coach code' : 'Chưa có mã HLV')} · {coach.status}</p>
                </td>
                <td className="py-3 px-4 text-xs text-brand-navy-700 dark:text-brand-navy-300">{coach.specialization || (isEn ? 'Not updated' : 'Chưa cập nhật')}</td>
                <td className="py-3 px-3 text-center font-bold text-brand-navy-900 dark:text-white">{coach.classesCount}</td>
                <td className="py-3 px-3 text-center font-bold text-brand-navy-900 dark:text-white">{coach.sessionsCount}</td>
                <td className="py-3 px-4 text-center"><strong>{coach.booked}</strong><span className="text-brand-navy-400"> / {coach.capacity}</span></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full bg-brand-sage-700" style={{ width: `${Math.min(100, coach.occupancyRate)}%` }} />
                    </div>
                    <strong className="text-xs text-brand-sage-700 dark:text-brand-sage-500 min-w-[42px] text-right">{coach.occupancyRate}%</strong>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="py-8 text-center text-brand-navy-400 text-xs">{isEn ? 'No coach data available.' : 'Chưa có dữ liệu huấn luyện viên.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
