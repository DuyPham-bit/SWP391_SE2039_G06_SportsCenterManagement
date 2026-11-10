import React from 'react';

const formatMoney = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const formatCount = value => Number(value || 0).toLocaleString('vi-VN');

/** Admin-only selector: whole system or one center (read-only analytics). */
export function AdminScopeSelector({ centers, centersError, centersLoading, isEn, selectedCenterId, setSelectedCenterId }) {
  return (
    <section className="no-print rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-brand-navy-900 dark:text-white">
            <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400">domain</span>
            {isEn ? 'System report scope' : 'Phạm vi báo cáo hệ thống'}
          </div>
          <p className="mt-1 text-xs text-brand-navy-500 dark:text-brand-navy-400">
            {isEn
              ? 'Read-only analytics. Select the whole system or drill down into one center.'
              : 'Báo cáo chỉ đọc. Chọn toàn hệ thống hoặc xem chi tiết từng cơ sở.'}
          </p>
        </div>
        <label className="flex w-full md:w-auto md:min-w-72 items-center gap-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 px-3 py-2">
          <span className="material-symbols-outlined text-brand-navy-400">filter_alt</span>
          <select
            aria-label={isEn ? 'Report center' : 'Cơ sở báo cáo'}
            className="w-full bg-transparent text-sm font-bold text-brand-navy-800 dark:text-brand-navy-100 outline-none"
            value={selectedCenterId}
            disabled={centersLoading || Boolean(centersError)}
            onChange={event => setSelectedCenterId(event.target.value)}
          >
            <option value="ALL">{isEn ? `All centers (${centers.length})` : `Toàn hệ thống (${centers.length} cơ sở)`}</option>
            {centers.map(center => (
              <option key={center.id} value={String(center.id)}>
                {center.name}{center.status && center.status !== 'Active' ? ` · ${center.status}` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      {centersError && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400">
          {centersError.message || (isEn ? 'Could not load centers.' : 'Không thể tải danh sách cơ sở.')}
        </p>
      )}
    </section>
  );
}

/** System-wide totals plus a per-center ranking table. */
export function AdminCenterComparison({ centers, isEn, metrics, setSelectedCenterId }) {
  const summaries = metrics.centerSummaries || [];
  const cards = [
    { icon: 'domain', label: isEn ? 'Centers' : 'Cơ sở', value: metrics.centerCount || centers.length },
    { icon: 'payments', label: isEn ? 'System net revenue' : 'Doanh thu thuần', value: formatMoney(metrics.netRevenue) },
    { icon: 'groups', label: isEn ? 'Members' : 'Hội viên', value: formatCount(metrics.totalMembers) },
    { icon: 'badge', label: isEn ? 'Active staff' : 'Nhân sự hoạt động', value: formatCount(metrics.activeStaff) }
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-brand-navy-200/90 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 shadow-lg shadow-brand-navy-200/40 dark:shadow-none">
      <div className="bg-gradient-to-r from-brand-navy-900 via-brand-sage-700 to-brand-teal-600 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-100">
              {isEn ? 'Administrator executive overview' : 'Tổng quan điều hành dành cho Admin'}
            </p>
            <h2 className="mt-1 font-chivo text-xl font-black sm:text-2xl">
              {isEn ? 'Cross-center performance comparison' : 'So sánh hiệu quả giữa các cơ sở'}
            </h2>
            <p className="mt-1 text-xs text-white/80">
              {isEn ? 'System totals and center-level drill-down for governance.' : 'Tổng hợp toàn hệ thống và truy cập chi tiết từng cơ sở để giám sát.'}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            {isEn ? 'Read only' : 'Chỉ đọc'}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map(card => (
            <div key={card.label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <span className="material-symbols-outlined text-[20px] text-amber-200">{card.icon}</span>
              <div className="mt-1 text-lg font-black sm:text-xl">{card.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-chivo text-base font-black text-brand-navy-900 dark:text-white">
              {isEn ? 'Center ranking' : 'Bảng so sánh cơ sở'}
            </h3>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'Sorted by net revenue; select a center to inspect it.' : 'Sắp xếp theo doanh thu thuần; chọn một cơ sở để xem chi tiết.'}
            </p>
          </div>
          <span className="rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 px-3 py-1 text-xs font-black text-brand-navy-600 dark:text-brand-navy-300">
            {summaries.length} {isEn ? 'centers' : 'cơ sở'}
          </span>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="bg-brand-navy-50 dark:bg-brand-navy-800/80 text-[10px] uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
              <tr>
                <th className="px-4 py-3">{isEn ? 'Center' : 'Cơ sở'}</th>
                <th className="px-4 py-3 text-right">{isEn ? 'Net revenue' : 'Doanh thu thuần'}</th>
                <th className="px-4 py-3 text-right">{isEn ? 'Members' : 'Hội viên'}</th>
                <th className="px-4 py-3 text-right">{isEn ? 'Occupancy' : 'Lấp đầy'}</th>
                <th className="px-4 py-3 text-right">{isEn ? 'Sessions' : 'Ca học'}</th>
                <th className="px-4 py-3 text-right">{isEn ? 'Check-ins in period' : 'Check-in trong kỳ'}</th>
                <th className="px-4 py-3 text-center">{isEn ? 'Detail' : 'Chi tiết'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
              {summaries.map((center, index) => (
                <tr key={center.centerId} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-sage-700/10 font-black text-brand-sage-700 dark:text-brand-sage-400">{index + 1}</span>
                      <div>
                        <div className="font-bold text-brand-navy-900 dark:text-white">{center.centerName}</div>
                        <div className="text-[10px] text-brand-navy-400">ID #{center.centerId} · {center.activeStaff} {isEn ? 'active staff' : 'nhân sự'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-700 dark:text-emerald-400">{formatMoney(center.netRevenue)}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-navy-700 dark:text-brand-navy-300">{formatCount(center.totalMembers)}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-navy-700 dark:text-brand-navy-300">{center.occupancyRate}%</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-navy-700 dark:text-brand-navy-300">{center.totalSessions}</td>
                  <td className="px-4 py-3 text-right font-bold text-brand-navy-700 dark:text-brand-navy-300">{center.periodCheckins}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedCenterId(String(center.centerId))}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand-navy-900 px-3 py-1.5 font-bold text-white transition hover:bg-brand-sage-700"
                    >
                      {isEn ? 'Open' : 'Xem'}
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Banner shown while an admin inspects a single center. */
export function AdminCenterDrilldownBar({ isEn, reportScopeLabel, setSelectedCenterId }) {
  return (
    <section className="no-print flex flex-col gap-3 rounded-2xl border border-brand-sage-700/20 bg-emerald-50/70 p-4 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-sage-700 text-white material-symbols-outlined">location_city</span>
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-brand-sage-700 dark:text-emerald-400">{isEn ? 'Center drill-down' : 'Chi tiết cơ sở'}</div>
          <div className="font-chivo font-black text-brand-navy-900 dark:text-white">{reportScopeLabel}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setSelectedCenterId('ALL')}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-sage-700/30 bg-white px-4 py-2 text-xs font-black text-brand-sage-700 hover:bg-brand-sage-700 hover:text-white dark:bg-brand-navy-900"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        {isEn ? 'Back to system overview' : 'Về tổng quan hệ thống'}
      </button>
    </section>
  );
}
