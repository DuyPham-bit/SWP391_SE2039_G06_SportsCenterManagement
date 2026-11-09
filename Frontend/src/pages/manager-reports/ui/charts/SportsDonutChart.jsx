import React, { useState } from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';
import { getSportVisual } from '../../lib/chartFormat.js';

/**
 * 3. BIỂU ĐỒ DONUT PHÂN BỔ THỊ PHẦN BỘ MÔN (SPORTS DONUT CHART & OPERATIONAL HUB)
 * Redesigned:
 * - High-contrast interactive Donut ring with hover state and dynamic center metric.
 * - Unified SVG (460x210 viewBox) preserving data-chart-id="chart-donut" for PDF export.
 * - 3 Executive operational KPI cards eliminating dead space.
 * - All-sports booking distribution mini-leaderboard filling the card to match left card height.
 */
export function SportsDonutChart({ sports = [], metrics = null }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [activeIdx, setActiveIdx] = useState(null);
  const [showAllList, setShowAllList] = useState(false);

  if (!sports || !sports.length) {
    return (
      <div className="text-xs text-brand-navy-400 dark:text-brand-navy-500 py-12 text-center flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">pie_chart</span>
        <span>{isEn ? 'No sports data available.' : 'Chưa có dữ liệu bộ môn trong kỳ.'}</span>
      </div>
    );
  }

  // Calculate totals across all sports
  const totalBooked = sports.reduce((sum, s) => sum + (s.booked || 0), 0) || 1;
  const totalSessions = sports.reduce((sum, s) => sum + (s.sessionsCount || 0), 0) || (metrics?.totalClasses || 0);
  const avgBookingsPerSession = totalSessions > 0 ? (totalBooked / totalSessions).toFixed(1) : '0';

  // Sort sports by bookings descending
  const sortedSports = [...sports].sort((a, b) => (b.booked || 0) - (a.booked || 0));
  const topSport = sortedSports[0] || { name: 'Chưa có', booked: 0, share: 0 };

  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  // Donut slices for top 5 active sports
  const topSlicesData = sortedSports.slice(0, 5);
  let currentOffset = 0;
  const slices = topSlicesData.map((s, idx) => {
    const fraction = (s.booked || 0) / totalBooked;
    const strokeDash = fraction * circumference;
    const offset = currentOffset;
    currentOffset += strokeDash;
    const visual = getSportVisual(s.name);
    return {
      ...s,
      idx,
      fraction,
      strokeDash,
      offset,
      visual
    };
  });

  const currentHovered = activeIdx !== null ? slices[activeIdx] : null;

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* ── 1. Top Section: Unified SVG Donut Ring + Legend (Capturable for PDF) ── */}
      <div className="w-full flex items-center justify-center p-1 select-none">
        <svg
          data-chart-id="chart-donut"
          viewBox="0 0 460 210"
          className="w-full h-auto max-h-[220px]"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Donut ring (centred at 105, 105) */}
          <g transform="rotate(-90, 105, 105)">
            <circle
              cx="105"
              cy="105"
              r={radius}
              fill="none"
              stroke="rgb(var(--color-border))"
              strokeWidth="24"
              className="text-brand-navy-100 dark:text-brand-navy-800"
            />
            {slices.map((slice) => {
              const isSelected = activeIdx === slice.idx;
              return (
                <circle
                  key={slice.name}
                  cx="105"
                  cy="105"
                  r={radius}
                  fill="none"
                  stroke={slice.visual.stroke}
                  strokeWidth={isSelected ? "26" : "22"}
                  strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
                  strokeDashoffset={-slice.offset}
                  strokeLinecap="round"
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : undefined,
                    opacity: activeIdx === null || isSelected ? 1 : 0.6
                  }}
                  onMouseEnter={() => setActiveIdx(slice.idx)}
                  onMouseLeave={() => setActiveIdx(null)}
                />
              );
            })}
          </g>

          {/* Center Dynamic Label */}
          <text
            x="105"
            y="94"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="rgb(var(--color-text-muted))"
            style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            {currentHovered ? (isEn ? 'Sport Selected' : 'Đang Chọn') : (isEn ? 'Total Bookings' : 'Tổng Đặt Chỗ')}
          </text>
          <text
            x="105"
            y="118"
            textAnchor="middle"
            fontSize="22"
            fontWeight="900"
            fill="rgb(var(--color-text-strong))"
          >
            {String(currentHovered ? currentHovered.booked : totalBooked)}
          </text>
          <text
            x="105"
            y="134"
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="700"
            fill={currentHovered ? currentHovered.visual.stroke : 'rgb(var(--color-text-muted))'}
          >
            {currentHovered
              ? `${currentHovered.name}: ${currentHovered.share ?? Math.round((currentHovered.booked / totalBooked) * 100)}%`
              : `${topSport.name}: ${topSport.share ?? Math.round((topSport.booked / totalBooked) * 100)}% thị phần`}
          </text>

          {/* Legend rows (right side, starting x=215) */}
          {slices.map((slice, i) => {
            const ly = 24 + i * 36;
            const pct = slice.share ?? Math.round((slice.booked / totalBooked) * 100);
            const isHovered = activeIdx === slice.idx;

            return (
              <g
                key={slice.name}
                onMouseEnter={() => setActiveIdx(slice.idx)}
                onMouseLeave={() => setActiveIdx(null)}
                style={{ cursor: 'pointer' }}
                className="transition-all duration-150"
              >
                {/* Background highlight pill on hover */}
                {isHovered && (
                  <rect
                    x="212"
                    y={ly - 4}
                    width="244"
                    height="32"
                    rx="6"
                    fill={slice.visual.stroke}
                    fillOpacity="0.08"
                  />
                )}

                {/* Color squircle badge */}
                <rect
                  x="218"
                  y={ly + 1}
                  width="14"
                  height="14"
                  rx="4"
                  fill={slice.visual.stroke}
                />

                {/* Sport name */}
                <text
                  x="238"
                  y={ly + 12}
                  fontSize="11"
                  fontWeight="700"
                  fill="rgb(var(--color-text-strong))"
                >
                  {slice.name}
                </text>

                {/* Bookings & sessions */}
                <text
                  x="238"
                  y={ly + 24}
                  fontSize="8.5"
                  fontWeight="500"
                  fill="rgb(var(--color-text-muted))"
                >
                  {slice.booked} {isEn ? 'bookings' : 'lượt'} · {slice.sessionsCount || 0} {isEn ? 'sessions' : 'ca'}
                </text>

                {/* Percentage chip */}
                <rect
                  x="406"
                  y={ly}
                  width="44"
                  height="19"
                  rx="5"
                  fill={slice.visual.stroke}
                  fillOpacity={isHovered ? "0.2" : "0.12"}
                />
                <text
                  x="428"
                  y={ly + 13.5}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="900"
                  fill={slice.visual.stroke}
                >
                  {pct}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── 2. Middle Section: 3 Executive Operational Metric Tiles ── */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
        {/* Tile 1: Top Discipline */}
        <div className="p-2.5 rounded-xl bg-brand-sand-50/70 dark:bg-brand-sand-950/40 border border-brand-sand-200/70 dark:border-brand-sand-800/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-brand-sand-800 dark:text-brand-sand-400 font-bold uppercase tracking-wider">
            <span>{isEn ? 'Top Sport' : 'Môn Dẫn Đầu'}</span>
            <span className="material-symbols-outlined text-[15px] text-brand-sand-600">emoji_events</span>
          </div>
          <div className="mt-1">
            <span className="text-xs font-black text-brand-navy-900 dark:text-white block truncate" title={topSport.name}>
              {topSport.name}
            </span>
            <span className="text-[10px] text-brand-sand-700 dark:text-brand-sand-300 font-semibold block mt-0.5">
              {topSport.booked} lượt ({topSport.share || 0}%)
            </span>
          </div>
        </div>

        {/* Tile 2: Average Utilization */}
        <div className="p-2.5 rounded-xl bg-brand-teal-50/70 dark:bg-brand-teal-950/40 border border-brand-teal-200/70 dark:border-brand-teal-800/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-brand-teal-800 dark:text-brand-teal-400 font-bold uppercase tracking-wider">
            <span>{isEn ? 'Avg Attendees' : 'Lấp Đầy TB'}</span>
            <span className="material-symbols-outlined text-[15px] text-brand-teal-600">groups</span>
          </div>
          <div className="mt-1">
            <span className="text-xs font-black text-brand-navy-900 dark:text-white block">
              ~{avgBookingsPerSession} <span className="text-[10px] font-medium text-brand-navy-400">HV/ca</span>
            </span>
            <span className="text-[10px] text-brand-teal-700 dark:text-brand-teal-300 font-semibold block mt-0.5">
              Toàn hệ thống
            </span>
          </div>
        </div>

        {/* Tile 3: Total Sessions */}
        <div className="p-2.5 rounded-xl bg-brand-sage-50/70 dark:bg-brand-sage-950/40 border border-brand-sage-200/70 dark:border-brand-sage-800/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-brand-sage-800 dark:text-brand-sage-400 font-bold uppercase tracking-wider">
            <span>{isEn ? 'Sessions' : 'Ca Vận Hành'}</span>
            <span className="material-symbols-outlined text-[15px] text-brand-sage-600">calendar_month</span>
          </div>
          <div className="mt-1">
            <span className="text-xs font-black text-brand-navy-900 dark:text-white block">
              {totalSessions} <span className="text-[10px] font-medium text-brand-navy-400">ca học</span>
            </span>
            <span className="text-[10px] text-brand-sage-700 dark:text-brand-sage-300 font-semibold block mt-0.5">
              Đang mở lớp
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Section: All-Sports Booking Utilization Breakdown (Fills dead space) ── */}
      <div className="pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-brand-navy-900 dark:text-white">
            {isEn ? 'All Sports Bookings & Sessions' : 'Xếp hạng lượt đặt theo bộ môn'}
          </span>
          <span className="text-[10px] text-brand-navy-400 font-medium">
            {sortedSports.length} {isEn ? 'sports' : 'môn thể thao'}
          </span>
        </div>

        <div className="space-y-2">
          {(showAllList ? sortedSports : sortedSports.slice(0, 4)).map((sp, idx) => {
            const visual = getSportVisual(sp.name);
            const maxBookings = Math.max(1, sortedSports[0]?.booked || 1);
            const pctBar = Math.min(100, Math.max(6, ((sp.booked || 0) / maxBookings) * 100));

            return (
              <div
                key={sp.name || idx}
                className="py-1 px-1.5 rounded-lg hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-brand-navy-400 w-3.5">
                      #{idx + 1}
                    </span>
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${visual.bg}`}>
                      <span className="material-symbols-outlined text-[11px]">{visual.icon}</span>
                    </div>
                    <span className="text-[11.5px] font-semibold text-brand-navy-800 dark:text-brand-navy-200 truncate">
                      {sp.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <span className="text-[11px] font-bold font-chivo text-brand-navy-900 dark:text-white">
                      {sp.booked || 0} <span className="text-[9.5px] font-normal text-brand-navy-400">lượt</span>
                    </span>
                    <span className="text-[9.5px] font-semibold text-brand-teal-700 dark:text-brand-teal-300 w-10 text-right">
                      {sp.share ?? Math.round(((sp.booked || 0) / totalBooked) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Mini Progress Track */}
                <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pctBar}%`,
                      backgroundColor: visual.stroke
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle between top 4 and all sports */}
        {sortedSports.length > 4 && (
          <div className="pt-2 mt-1 text-center">
            <button
              type="button"
              onClick={() => setShowAllList(!showAllList)}
              className="text-[10.5px] text-brand-teal-700 dark:text-brand-teal-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{showAllList ? (isEn ? 'Collapse list' : 'Thu gọn danh sách') : (isEn ? `+${sortedSports.length - 4} more sports` : `+${sortedSports.length - 4} môn khác trong hệ thống`)}</span>
              <span className="material-symbols-outlined text-[13px]">{showAllList ? 'expand_less' : 'expand_more'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
