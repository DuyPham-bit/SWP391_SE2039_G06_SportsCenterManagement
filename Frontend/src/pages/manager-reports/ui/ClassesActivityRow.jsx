import React from 'react';
import { getSportStyle } from '../lib/reportLabels.js';

export function ClassesActivityRow({
  classSearch, classSportFilter, isEn, metrics, processedClasses, setActiveTableTab, setClassSearch,
  setClassSportFilter, topClass, topRoom
}) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      {/* Left Card (8 cols): Projects Style Class Utilization Table */}
      <section className="min-w-0 lg:col-span-8 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
          <div>
            <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400 text-[20px]">check_circle</span>
              {isEn ? 'Classes Performance & Utilization' : 'Chi Tiết Lớp Học & Tỷ Lệ Lấp Đầy'}
            </h3>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
              <strong className="text-brand-sage-700 dark:text-brand-sage-400 font-bold">{processedClasses.length} {isEn ? 'classes active' : 'lớp đang hoạt động'}</strong> {isEn ? 'in this reporting period' : 'trong kỳ tra cứu hiện tại'}
            </p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-brand-navy-400 text-[16px]">search</span>
              <input
                type="text"
                placeholder={isEn ? 'Filter class...' : 'Tìm lớp...'}
                value={classSearch}
                onChange={e => setClassSearch(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
              />
            </div>
            <select
              className="text-xs font-medium border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl px-2.5 py-1 bg-white dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 focus:outline-none"
              value={classSportFilter}
              onChange={e => setClassSportFilter(e.target.value)}
            >
              <option value="ALL">{isEn ? 'All Sports' : 'Tất cả'}</option>
              {metrics.topSports?.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Projects Style Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-brand-navy-400 dark:text-brand-navy-500 font-bold uppercase tracking-wider border-b border-brand-navy-100 dark:border-brand-navy-800">
                <th className="py-2.5 px-3">{isEn ? 'CLASS' : 'LỚP HỌC'}</th>
                <th className="py-2.5 px-3">{isEn ? 'DISCIPLINE / COACH' : 'BỘ MÔN & HLV'}</th>
                <th className="py-2.5 px-3 text-center">{isEn ? 'SLOTS' : 'ĐÃ ĐẶT'}</th>
                <th className="py-2.5 px-4 w-44">{isEn ? 'COMPLETION' : 'TIẾN ĐỘ LẤP ĐẦY'}</th>
                <th className="py-2.5 px-3 text-center">{isEn ? 'STATUS' : 'ĐÁNH GIÁ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
              {processedClasses.slice(0, 6).map((cls, idx) => {
                const sportStyle = getSportStyle(cls.sportName);
                const isTop1 = idx === 0;

                return (
                  <tr key={cls.id} className="hover:bg-brand-navy-50/70 dark:hover:bg-brand-navy-800/40 transition-colors">
                    {/* Class Name + Icon */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${sportStyle.bg}`}>
                          <span className="material-symbols-outlined text-[16px]">{sportStyle.icon}</span>
                        </div>
                        <div>
                          <strong className="text-brand-navy-900 dark:text-white font-bold block truncate max-w-[180px]">
                            {cls.name}
                          </strong>
                          <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500">
                            {cls.roomName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Sport & Coach */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200 block">
                        {cls.sportName}
                      </span>
                      <span className="text-[10px] text-brand-navy-400">
                        {cls.coachName || (isEn ? 'Staff coach' : 'HLV phụ trách')}
                      </span>
                    </td>

                    {/* Booked / Capacity */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-brand-navy-900 dark:text-white">
                        {cls.booked}
                      </span>
                      <span className="text-brand-navy-400"> / {cls.capacity}</span>
                    </td>

                    {/* Progress Completion Bar (Vision UI Signature Style) */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="font-black text-xs text-brand-sage-700 dark:text-brand-sage-500 block">
                          {cls.occupancyRate}%
                        </span>
                        <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                    isTop1
                                      ? 'bg-gradient-to-r from-brand-sage-700 to-brand-sand-300'
                                      : cls.occupancyRate >= 20
                                      ? 'bg-brand-sage-700'
                                      : 'bg-brand-teal-500'
                                  }`}
                            style={{ width: `${Math.min(100, cls.occupancyRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      {cls.booked >= 15 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border border-brand-danger-200 dark:border-brand-danger-800">
                          🔥 Hot
                        </span>
                      ) : cls.booked >= 5 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-400 border border-brand-sage-200 dark:border-brand-sage-800">
                          ✅ Ổn định
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 border border-brand-navy-200 dark:border-brand-navy-700">
                          ⚠️ Thấp điểm
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Right Card (4 cols): Orders Overview / Activity Event Timeline */}
      <section className="min-w-0 lg:col-span-4 bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
            <div>
              <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[20px]">notifications_active</span>
                {isEn ? 'Orders Overview' : 'Nhật Ký Vận Hành & Sự Kiện'}
              </h3>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                <strong className="text-brand-sage-700 dark:text-brand-sage-400 font-bold">+30% {isEn ? 'this month' : 'tháng này'}</strong> · {isEn ? 'Live activity' : 'Sự kiện đăng ký'}
              </p>
            </div>
          </div>

          {/* Vertical Timeline Nodes */}
          <div className="space-y-4 pt-3 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-brand-navy-200 dark:before:bg-brand-navy-800">
            {/* Node 1: Doanh thu đỉnh */}
            <div className="flex items-start gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-brand-sage-100 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-400 border border-brand-sage-300 dark:border-brand-sage-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-[15px]">payments</span>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy-900 dark:text-white">
                  {`${Number(metrics.netRevenue || 0).toLocaleString('vi-VN')}đ`} · {isEn ? 'Net Revenue Realized' : 'Doanh thu thuần đã nhận'}
                </p>
                <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500">
                  {metrics.to} · {isEn ? 'Period balance closed' : 'Đối soát kỳ hiện tại'}
                </span>
              </div>
            </div>

            {/* Node 2: Lớp học K01 */}
            <div className="flex items-start gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-brand-teal-100 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-400 border border-brand-teal-300 dark:border-brand-teal-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-[15px]">pool</span>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy-900 dark:text-white">
                  {topClass ? `${topClass.name} (+${topClass.booked} chỗ)` : 'Lớp bơi K01 hoạt động'}
                </p>
                <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500">
                  {topClass?.roomName || 'Bể bơi Olympic'} · {isEn ? 'High attendance' : 'Tỷ lệ tham gia cao'}
                </span>
              </div>
            </div>

            {/* Node 3: Thành viên mới */}
            <div className="flex items-start gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-brand-sand-100 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-400 border border-brand-sand-300 dark:border-brand-sand-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-[15px]">person_add</span>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy-900 dark:text-white">
                  +{metrics.newMembers} {isEn ? 'new members enrolled' : 'hội viên mới đăng ký tài khoản'}
                </p>
                <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500">
                  {isEn ? 'Active accounts growing' : 'Tăng trưởng tài khoản tích cực'}
                </span>
              </div>
            </div>

            {/* Node 4: Sân bãi bận rộn */}
            <div className="flex items-start gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-brand-navy-100 dark:bg-brand-navy-950/60 text-brand-navy-800 dark:text-brand-navy-400 border border-brand-navy-300 dark:border-brand-navy-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-[15px]">stadium</span>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy-900 dark:text-white">
                  {topRoom ? `${topRoom.name}: ${topRoom.sessionsCount} ca` : 'Khai thác sân bãi'}
                </p>
                <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500">
                  {topRoom ? `${topRoom.booked} lượt khách` : 'Hoạt động liên tục'}
                </span>
              </div>
            </div>

            {/* Node 5: Check-in hôm nay */}
            <div className="flex items-start gap-3 relative">
              <div className="w-7 h-7 rounded-full bg-brand-danger-100 dark:bg-brand-danger-950/60 text-brand-danger-700 dark:text-brand-danger-400 border border-brand-danger-300 dark:border-brand-danger-800 flex items-center justify-center shrink-0 z-10 shadow-xs">
                <span className="material-symbols-outlined text-[15px]">fact_check</span>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-navy-900 dark:text-white">
                  {metrics.todayCheckins} {isEn ? 'check-in passes validated' : 'lượt check-in hợp lệ hôm nay'}
                </p>
                <span className="text-[10px] text-brand-navy-400 dark:text-brand-navy-500">
                  {isEn ? 'Realtime gate control' : 'Cổng kiểm soát thẻ hội viên'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
          <button
            type="button"
            onClick={() => setActiveTableTab('logs')}
            className="w-full py-2 text-center text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 rounded-xl transition"
          >
            {isEn ? 'View all reconciliation logs →' : 'Xem toàn bộ nhật ký đối soát →'}
          </button>
        </div>
      </section>
    </div>
  );
}
