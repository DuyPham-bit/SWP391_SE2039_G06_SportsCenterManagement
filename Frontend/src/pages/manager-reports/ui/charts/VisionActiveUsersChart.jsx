import { AnimatedNumber } from '../../../../shared/lib/useCountUp.jsx';
import React, { useState } from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';

/**
 * 10. VISION UI ACTIVE USERS (Bar Chart with 4 Mini Stat Pills)
 * Matches the right chart in Image 1 with bar visualization & 4 stat cards
 */
export function VisionActiveUsersChart({
  data = [],
  totalUsers = 0,
  totalBookings = 0,
  netSales = 0,
  totalSessions = 0
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const values = data.map(d => Number(d.newMembers || d.booked || 0));
  const maxVal = Math.max(1, ...values);

  const chartHeight = 150;
  const chartWidth = 500;
  const paddingLeft = 30;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const barWidth = Math.max(8, Math.min(24, (innerWidth / Math.max(1, data.length)) * 0.6));

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div>
        <span className="text-[11px] text-brand-sage-700 dark:text-brand-sage-400 font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">group</span>
          {isEn ? '(+23%) active member traffic' : '(+23%) lượt tương tác học viên'}
        </span>
        <span className="text-brand-navy-400 text-[10px] block">
          {isEn ? 'Daily activity & attendance volume' : 'Lưu lượng tham gia & hội viên tích cực'}
        </span>
      </div>

      {/* SVG Bar Chart with rounded capsule bars */}
      <div className="relative overflow-x-auto bg-brand-navy-50 dark:bg-brand-navy-800/60 p-2 rounded-2xl border border-brand-navy-200/70 dark:border-brand-navy-700/70">
        <svg data-chart-id="chart-members" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[380px] select-none">
          <defs>
            <linearGradient id="activeUserBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--color-chart-6))" />
              <stop offset="100%" stopColor="rgb(var(--color-chart-1))" />
            </linearGradient>
          </defs>

          {/* Bars */}
          {data.map((item, i) => {
            const val = Number(item.newMembers || item.booked || 0);
            const x = paddingLeft + (i + 0.5) * (innerWidth / data.length);
            const h = (val / maxVal) * innerHeight;
            const y = paddingTop + innerHeight - h;
            const isHovered = hoveredIdx === i;
            const dateLabel = item.periodStart ? item.periodStart.slice(5) : '';

            return (
              <g
                key={item.periodStart || i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Background column track */}
                <rect
                  x={x - barWidth / 2}
                  y={paddingTop}
                  width={barWidth}
                  height={innerHeight}
                  fill="rgb(var(--color-border))"
                  opacity="0.3"
                  rx={barWidth / 2}
                />

                {/* Progress bar */}
                <rect
                  x={x - barWidth / 2}
                  y={val > 0 ? y : paddingTop + innerHeight - 2}
                  width={barWidth}
                  height={val > 0 ? h : 2}
                  fill="url(#activeUserBarGrad)"
                  rx={barWidth / 2}
                  className={isHovered ? 'brightness-125' : ''}
                />

                {/* X-axis label */}
                {(data.length <= 12 || i % Math.ceil(data.length / 8) === 0) && (
                  <text
                    x={x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="text-[9px] fill-brand-navy-400 dark:fill-brand-navy-500 font-medium"
                  >
                    {dateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute top-2 pointer-events-none bg-brand-navy-900 text-white text-xs px-2.5 py-1 rounded-lg shadow-xl border border-brand-navy-700 transform -translate-x-1/2"
            style={{
              left: `${((paddingLeft + (hoveredIdx + 0.5) * (innerWidth / data.length)) / chartWidth) * 100}%`
            }}
          >
            <span>{data[hoveredIdx].periodStart}: <strong>+{data[hoveredIdx].newMembers || data[hoveredIdx].booked}</strong></span>
          </div>
        )}
      </div>

      {/* Lower Row: 4 Mini Stat Pills (Vision UI signature component) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {/* Pill 1: Users */}
        <div className="p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/80 border border-brand-navy-200/70 dark:border-brand-navy-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-brand-navy-500 dark:text-brand-navy-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-brand-sage-500/15 text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">group</span>
            </span>
            <span>{isEn ? 'Users' : 'Hội viên'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-brand-navy-900 dark:text-white">
            <AnimatedNumber value={totalUsers} duration={1000} />
          </p>
        </div>

        {/* Pill 2: Bookings */}
        <div className="p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/80 border border-brand-navy-200/70 dark:border-brand-navy-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-brand-navy-500 dark:text-brand-navy-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-brand-teal-500/15 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">confirmation_number</span>
            </span>
            <span>{isEn ? 'Bookings' : 'Lượt đặt'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-brand-navy-900 dark:text-white">
            <AnimatedNumber value={totalBookings} duration={1000} />
          </p>
        </div>

        {/* Pill 3: Sales */}
        <div className="p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/80 border border-brand-navy-200/70 dark:border-brand-navy-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-brand-navy-500 dark:text-brand-navy-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-brand-sand-500/15 text-brand-sand-700 dark:text-brand-sand-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">payments</span>
            </span>
            <span>{isEn ? 'Revenue' : 'Doanh thu'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-brand-sage-700 dark:text-brand-sage-500">
            <AnimatedNumber value={netSales} suffix="đ" duration={1200} />
          </p>
        </div>

        {/* Pill 4: Sessions */}
        <div className="p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/80 border border-brand-navy-200/70 dark:border-brand-navy-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-brand-navy-500 dark:text-brand-navy-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-brand-navy-700/15 text-brand-navy-800 dark:text-brand-navy-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">stadium</span>
            </span>
            <span>{isEn ? 'Sessions' : 'Ca học'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-brand-navy-900 dark:text-white">
            <AnimatedNumber value={totalSessions} duration={1000} />
          </p>
        </div>
      </div>
    </div>
  );
}
