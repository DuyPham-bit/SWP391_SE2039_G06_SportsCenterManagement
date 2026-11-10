import React from 'react';
import { ArcGaugeChart } from './charts/ArcGaugeChart.jsx';
import { RadialScoreChart } from './charts/RadialScoreChart.jsx';

export function PerformanceGaugesRow({ isEn, metrics, setActiveTableTab, topClass, topRevenueSport, topRoom }) {
  return (
    <div className="grid lg:grid-cols-12 gap-5">
      {/* Left Card (5 cols): Operation Highlight Hero Banner */}
      <div
        className="min-w-0 lg:col-span-5 relative overflow-hidden rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between"
        style={{
          background: 'linear-gradient(135deg, #1B4332 0%, #24828F 55%, #1E2235 100%)'
        }}
      >
        {/* Background Glow & Curves */}
        <div className="pointer-events-none absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-brand-sand-300/30 to-transparent blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-gradient-to-tr from-brand-sage-500/30 to-transparent blur-2xl" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 400 240" preserveAspectRatio="none">
          <path d="M-20,180 C100,80 220,240 380,110 C440,60 480,120 520,100" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M0,200 C120,110 240,260 400,130" fill="none" stroke="white" strokeWidth="1" />
        </svg>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md border border-white/30">
            <span className="w-2 h-2 rounded-full bg-brand-sage-400 animate-pulse" />
            <span>{isEn ? 'Center Operations Hub' : 'Trung Tâm Vận Hành Olympic'}</span>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-black font-chivo leading-tight text-white drop-shadow-sm">
              {isEn ? 'Olympic Operational Excellence' : 'Báo Cáo Vận Hành & Hiệu Suất'}
            </h2>
            <p className="text-xs text-white/85 mt-1 leading-relaxed">
              {isEn
                ? `Analytics period: ${metrics.from} → ${metrics.to} · Total ${metrics.totalSessions} scheduled sessions`
                : `Tổng hợp từ ${metrics.from} đến ${metrics.to} · Tổng ${metrics.totalSessions} ca học đã phân bổ`}
            </p>
          </div>

          {/* Quick Highlights Trio */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/20 text-[11px]">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
              <span className="text-white/70 block text-[10px] font-bold truncate">
                {isEn ? 'Top Class' : 'Lớp Hot #1'}
              </span>
              <strong className="text-white font-bold block truncate text-xs">
                {topClass ? topClass.name : (isEn ? 'None' : 'Chưa có')}
              </strong>
              <span className="text-brand-sage-300 text-[10px]">
                {topClass ? `${topClass.booked} chỗ` : '0'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
              <span className="text-white/70 block text-[10px] font-bold truncate">
                {isEn ? 'Top Court' : 'Sân Bận #1'}
              </span>
              <strong className="text-white font-bold block truncate text-xs">
                {topRoom ? topRoom.name : (isEn ? 'None' : 'Chưa có')}
              </strong>
              <span className="text-brand-sand-300 text-[10px]">
                {topRoom ? `${topRoom.booked} khách` : '0'}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/15">
              <span className="text-white/70 block text-[10px] font-bold truncate">
                {isEn ? 'Top Sport' : 'Bộ Môn #1'}
              </span>
              <strong className="text-white font-bold block truncate text-xs">
                {topRevenueSport ? topRevenueSport.sportName : (isEn ? 'None' : 'Chưa có')}
              </strong>
              <span className="text-brand-teal-300 text-[10px]">
                {topRevenueSport ? `${topRevenueSport.share}% dt` : '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-3">
          <button
            type="button"
            onClick={() => setActiveTableTab('classes')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white/95 hover:text-white transition group"
          >
            <span>{isEn ? 'Explore detailed data tables' : 'Xem chi tiết các bảng tra cứu'}</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </div>

      {/* Middle Card (3 cols): Arc Gauge (Satisfaction Rate / Center Occupancy) */}
      <div className="min-w-0 lg:col-span-3 bg-white dark:bg-brand-navy-900 rounded-3xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
        <ArcGaugeChart
          value={metrics.occupancyRate}
          min={0}
          max={100}
          title={isEn ? 'Satisfaction / Load' : 'Tỷ lệ lấp đầy'}
          subtitle={isEn ? 'From all scheduled sessions' : 'Toàn bộ ca học đã mở'}
          note={`${metrics.totalBookings} / ${metrics.totalCapacity} ${isEn ? 'seats booked' : 'chỗ đã đặt'}`}
        />
      </div>

      {/* Right Card (4 cols): Radial Score Progress (Referral Tracking / Facility Load Score) */}
      <div className="min-w-0 lg:col-span-4 bg-white dark:bg-brand-navy-900 rounded-3xl p-4 border border-brand-navy-200/90 dark:border-brand-navy-800 shadow-xs hover-lift transition-all flex flex-col justify-between">
        <RadialScoreChart
          score={Number((Math.max(0, Math.min(100, metrics.occupancyRate || 0)) / 10).toFixed(1))}
          maxScore={10}
          title={isEn ? 'Facility Tracking' : 'Hiệu suất sân bãi'}
          subtitle={isEn ? 'Occupancy converted to a 10-point scale' : 'Quy đổi tỷ lệ lấp đầy sang thang 10'}
          stat1Label={isEn ? 'Guests received' : 'Khách tiếp nhận'}
          stat1Val={`${topRoom?.booked || 0} lượt`}
          stat2Label={isEn ? 'Sessions hosted' : 'Ca đã tổ chức'}
          stat2Val={`${topRoom?.sessionsCount || 0} ca`}
          scoreLabel={isEn ? 'Utilization' : 'Khai thác'}
          scoreSub={isEn ? 'From actual occupancy' : 'Từ dữ liệu lấp đầy'}
        />
      </div>
    </div>
  );
}
