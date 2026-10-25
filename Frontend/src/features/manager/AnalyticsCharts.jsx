import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

// Format currency
const formatVnd = (num) => `${Number(num || 0).toLocaleString('vi-VN')}đ`;
const formatShortVnd = (num) => {
  const n = Number(num || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}đ`;
};

// Colors for sports
const sportColors = {
  'Bơi lội': { stroke: '#0284c7', fill: '#e0f2fe', text: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-500' },
  'Gym & Fitness': { stroke: '#dc2626', fill: '#fee2e2', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-500' },
  'Yoga & Pilates': { stroke: '#2D6A4F', fill: '#d1fae5', text: 'text-[#2D6A4F] dark:text-[#81B29A]', bg: 'bg-[#2D6A4F]' },
  'Cầu lông': { stroke: '#d97706', fill: '#fef3c7', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500' },
  'Boxing & Võ thuật': { stroke: '#7c3aed', fill: '#ede9fe', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-500' }
};

const getSportColor = (name) => sportColors[name] || { stroke: '#475569', fill: '#f1f5f9', text: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-500' };

/**
 * 1. BIỂU ĐỒ DOANH THU THUẦN (REVENUE TREND BAR CHART)
 */
export function RevenueTrendChart({ data = [], groupBy = 'day' }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || !data.length) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        {isEn ? 'No revenue data in selected period.' : 'Chưa có dữ liệu doanh thu trong kỳ đã chọn.'}
      </div>
    );
  }

  const values = data.map(d => Number(d.net || 0));
  const maxVal = Math.max(1, ...values);
  const totalRevenue = values.reduce((sum, v) => sum + v, 0);
  const peakIdx = values.indexOf(Math.max(...values));

  const chartHeight = 220;
  const chartWidth = 640;
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const barWidth = Math.max(10, Math.min(36, (innerWidth / data.length) * 0.65));

  // Y-axis grid levels (0, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(pct => ({
    val: Math.round(maxVal * pct),
    y: paddingTop + innerHeight * (1 - pct)
  }));

  return (
    <div className="space-y-4">
      {/* Metric summary top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            {isEn ? 'Period Net Revenue:' : 'Tổng doanh thu kỳ:'}
          </span>
          <strong className="text-base font-black text-[#2D6A4F] dark:text-[#81B29A] font-chivo">{formatVnd(totalRevenue)}</strong>
        </div>
        {peakIdx >= 0 && values[peakIdx] > 0 && (
          <div className="text-right">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              {isEn ? (groupBy === 'month' ? 'Highest Month:' : 'Highest Day:') : (groupBy === 'month' ? 'Tháng cao nhất:' : 'Ngày cao nhất:')}
            </span>
            <span className="font-bold text-[#1E2235] dark:text-[#F2CC8F] bg-[#F2CC8F]/30 dark:bg-[#F2CC8F]/20 px-2 py-0.5 rounded text-[11px] border border-[#F2CC8F]/60">
              🌟 {data[peakIdx].periodStart}: {formatVnd(values[peakIdx])}
            </span>
          </div>
        )}
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative overflow-x-auto">
        <svg data-chart-id="chart-revenue" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px] select-none">
          <defs>
            <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D6A4F" />
              <stop offset="100%" stopColor="#81B29A" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="revenuePeakGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F2CC8F" />
              <stop offset="100%" stopColor="#2D6A4F" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-ticks */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? '0' : '4 4'}
                className="dark:stroke-slate-800"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
              >
                {formatShortVnd(tick.val)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((item, i) => {
            const val = Number(item.net || 0);
            const x = paddingLeft + (i + 0.5) * (innerWidth / data.length);
            const h = (val / maxVal) * innerHeight;
            const y = paddingTop + innerHeight - h;
            const isHovered = hoveredIdx === i;
            const isPeak = i === peakIdx && val > 0;
            const dateLabel = item.periodStart.slice(5);

            return (
              <g
                key={item.periodStart}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Invisible hover capture rect */}
                <rect
                  x={x - barWidth}
                  y={paddingTop}
                  width={barWidth * 2}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Highlight vertical guide column when hovered */}
                {isHovered && (
                  <rect
                    x={x - barWidth * 0.9}
                    y={paddingTop}
                    width={barWidth * 1.8}
                    height={innerHeight}
                    fill="#d1fae5"
                    opacity="0.35"
                    rx="4"
                  />
                )}

                {/* Main bar */}
                <rect
                  x={x - barWidth / 2}
                  y={val > 0 ? y : paddingTop + innerHeight - 2}
                  width={barWidth}
                  height={val > 0 ? h : 2}
                  fill={isPeak ? 'url(#revenuePeakGrad)' : 'url(#revenueBarGrad)'}
                  rx="4"
                  ry="4"
                  className={isHovered ? 'filter drop-shadow-md brightness-110' : ''}
                />

                {/* Peak star badge */}
                {isPeak && (
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-amber-500"
                  >
                    ★
                  </text>
                )}

                {/* X-axis label */}
                {(data.length <= 15 || i % Math.ceil(data.length / 12) === 0) && (
                  <text
                    x={x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className={`text-[10px] ${isHovered ? 'fill-[#2D6A4F] dark:fill-[#81B29A] font-bold' : 'fill-slate-500 dark:fill-slate-400'}`}
                  >
                    {dateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 transform -translate-x-1/2"
            style={{
              left: `${((paddingLeft + (hoveredIdx + 0.5) * (innerWidth / data.length)) / chartWidth) * 100}%`
            }}
          >
            <span className="text-slate-300 font-medium">{data[hoveredIdx].periodStart}:</span>
            <strong className="text-emerald-300 font-black">{formatVnd(data[hoveredIdx].net)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 2. BIỂU ĐỒ MIỀN THÀNH VIÊN MỚI (NEW MEMBERS AREA SPLINE CHART)
 */
export function NewMembersAreaChart({ data = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || !data.length) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        {isEn ? 'No new members data in selected period.' : 'Chưa có dữ liệu thành viên mới trong kỳ đã chọn.'}
      </div>
    );
  }

  const values = data.map(d => Number(d.newMembers || 0));
  const maxVal = Math.max(1, ...values);
  const totalNew = values.reduce((sum, v) => sum + v, 0);

  const chartHeight = 220;
  const chartWidth = 640;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((d, i) => ({
    x: paddingLeft + (i / Math.max(1, data.length - 1)) * innerWidth,
    y: paddingTop + innerHeight - (Number(d.newMembers || 0) / maxVal) * innerHeight,
    raw: d
  }));

  // Catmull-Rom spline path generator
  const getSmoothPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? i + 1 : i + 2];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const lineD = getSmoothPath(points);
  const areaD = points.length > 1
    ? `${lineD} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + innerHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + innerHeight).toFixed(1)} Z`
    : '';

  const yTicks = [0, 0.5, 1].map(pct => ({
    val: Math.round(maxVal * pct),
    y: paddingTop + innerHeight * (1 - pct)
  }));

  return (
    <div className="space-y-4">
      {/* Metric summary top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            {isEn ? 'Total New Members:' : 'Tổng thành viên mới:'}
          </span>
          <strong className="text-base font-black text-blue-600 dark:text-blue-400 font-chivo">+{totalNew} {isEn ? 'members' : 'người'}</strong>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
            {isEn ? 'Peak Growth:' : 'Đỉnh tăng trưởng:'}
          </span>
          <span className="font-bold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded text-[11px] border border-blue-200 dark:border-blue-800">
            +{maxVal} {isEn ? 'members / day' : 'người / ngày'}
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg data-chart-id="chart-members" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px] select-none">
          <defs>
            <linearGradient id="memberAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray={i === 0 ? '0' : '4 4'}
                className="dark:stroke-slate-800"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#memberAreaGrad)" />}

          {/* Spline Stroke Line */}
          {lineD && (
            <path
              d={lineD}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & Interactive Hit Targets */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            const count = Number(pt.raw.newMembers || 0);
            const dateLabel = pt.raw.periodStart.slice(5);

            return (
              <g
                key={pt.raw.periodStart}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + innerHeight}
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : count > 0 ? 4 : 2.5}
                  fill={count > 0 ? '#1d4ed8' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                {/* X-axis date label */}
                {(points.length <= 15 || i % Math.ceil(points.length / 12) === 0) && (
                  <text
                    x={pt.x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className={`text-[10px] ${isHovered ? 'fill-blue-600 dark:fill-blue-400 font-bold' : 'fill-slate-500 dark:fill-slate-400'}`}
                  >
                    {dateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 transform -translate-x-1/2"
            style={{
              left: `${(points[hoveredIdx].x / chartWidth) * 100}%`
            }}
          >
            <span className="text-slate-300 font-medium">{data[hoveredIdx].periodStart}:</span>
            <strong className="text-cyan-300 font-black">+{data[hoveredIdx].newMembers} {isEn ? 'members' : 'thành viên'}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. BIỂU ĐỒ DONUT PHÂN BỔ THỊ PHẦN BỘ MÔN (SPORTS DONUT CHART)
 */
export function SportsDonutChart({ sports = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [activeIdx, setActiveIdx] = useState(null);

  if (!sports || !sports.length) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">
        {isEn ? 'No sports data available.' : 'Chưa có dữ liệu bộ môn.'}
      </div>
    );
  }

  const totalBooked = sports.reduce((sum, s) => sum + (s.booked || 0), 0) || 1;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const slices = sports.map((s, idx) => {
    const fraction = (s.booked || 0) / totalBooked;
    const strokeDash = fraction * circumference;
    const offset = currentOffset;
    currentOffset += strokeDash;
    const color = getSportColor(s.name);
    return {
      ...s,
      idx,
      fraction,
      strokeDash,
      offset,
      color
    };
  });

  const currentHovered = activeIdx !== null ? slices[activeIdx] : slices[0];

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-2">
      {/* Unified SVG: ring + center label + legend — all capturable for PDF */}
      <svg
        data-chart-id="chart-donut"
        viewBox="0 0 460 210"
        className="w-full h-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* ── Donut ring (left, centred at 105,105) ── */}
        <g transform="rotate(-90,105,105)">
          <circle cx="105" cy="105" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="24" />
          {slices.map((slice) => (
            <circle
              key={slice.name}
              cx="105" cy="105" r={radius}
              fill="none"
              stroke={slice.color.stroke}
              strokeWidth="22"
              strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
              strokeDashoffset={-slice.offset}
              strokeLinecap="round"
              className="cursor-pointer transition-all duration-300 hover:opacity-90"
              onMouseEnter={() => setActiveIdx(slice.idx)}
              onMouseLeave={() => setActiveIdx(null)}
            />
          ))}
        </g>

        {/* ── Center label ── */}
        <text x="105" y="97" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b"
          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isEn ? 'Total Bookings' : 'Tổng Đặt Chỗ'}
        </text>
        <text x="105" y="117" textAnchor="middle" fontSize="22" fontWeight="900" fill="#1e293b">
          {String(currentHovered?.booked ?? totalBooked)}
        </text>
        <text x="105" y="133" textAnchor="middle" fontSize="9" fill="#64748b">
          {currentHovered?.share ?? Math.round(((currentHovered?.booked ?? 0) / totalBooked) * 100)}% {isEn ? 'share' : 'thị phần'}
        </text>

        {/* ── Legend rows (right side, starting x=220) ── */}
        {slices.map((slice, i) => {
          const ly = 28 + i * 38;
          const pct = slice.share ?? Math.round((slice.booked / totalBooked) * 100);
          return (
            <g key={slice.name}
              onMouseEnter={() => setActiveIdx(slice.idx)}
              onMouseLeave={() => setActiveIdx(null)}
              style={{ cursor: 'pointer' }}>
              {/* Color dot */}
              <circle cx="224" cy={ly + 8} r="6" fill={slice.color.stroke} />
              {/* Sport name */}
              <text x="236" y={ly + 13} fontSize="10" fontWeight="700" fill="#0f172a">{slice.name}</text>
              {/* Sessions */}
              <text x="236" y={ly + 26} fontSize="8.5" fill="#94a3b8">
                {slice.booked} {isEn ? 'bookings' : 'lượt'} · {slice.sessionsCount || 0} {isEn ? 'sessions' : 'ca'}
              </text>
              {/* % badge background */}
              <rect x="406" y={ly} width="44" height="20" rx="5" fill="#f1f5f9" />
              {/* % text */}
              <text x="428" y={ly + 14} textAnchor="middle" fontSize="10" fontWeight="900" fill="#0f172a">{pct}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * 4. BIỂU ĐỒ THANH SO SÁNH LỚP HỌC (CLASSES COMPARISON BARS)
 */
export function ClassCapacityBarChart({ classes = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  if (!classes || !classes.length) return null;
  const maxCapacity = Math.max(1, ...classes.map(c => c.capacity || 0));

  return (
    <div className="space-y-3">
      {classes.slice(0, 5).map((cls, idx) => {
        const bookedWidth = ((cls.booked || 0) / maxCapacity) * 100;
        const capacityWidth = ((cls.capacity || 0) / maxCapacity) * 100;
        const isLeader = idx === 0;

        return (
          <div key={cls.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  isLeader ? 'bg-[#F2CC8F] text-slate-950 font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {idx + 1}
                </span>
                <strong className="text-slate-900 dark:text-white font-bold">{cls.name}</strong>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">({cls.sportName})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 dark:text-white">{cls.booked} / {cls.capacity} {isEn ? 'slots' : 'chỗ'}</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                  cls.occupancyRate >= 20 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}>
                  {cls.occupancyRate}%
                </span>
              </div>
            </div>

            {/* Comparison progress track */}
            <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              {/* Capacity outline fill */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-slate-200 dark:bg-slate-700 rounded-full"
                style={{ width: `${Math.min(100, capacityWidth)}%` }}
              />
              {/* Actual Booked bar */}
              <div
                className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${
                  isLeader ? 'bg-gradient-to-r from-[#2D6A4F] to-[#F2CC8F]' : 'bg-[#2D6A4F]'
                }`}
                style={{ width: `${Math.min(100, bookedWidth)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 5. BIỂU ĐỒ XẾP HẠNG BỘ MÔN: DOANH THU & LƯỢT ĐẶT (TOP SPORTS BY REVENUE / BOOKINGS)
 */
export function SportRevenueRankingChart({ sports = [], revenueBySport = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [metricMode, setMetricMode] = useState('revenue'); // 'revenue' | 'booked'

  if (!sports || !sports.length) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">
        {isEn ? 'No sports data available.' : 'Chưa có dữ liệu bộ môn.'}
      </div>
    );
  }

  const sportsWithMetrics = sports.map(sport => ({
    ...sport,
    revenue: revenueBySport.find(item => item.sportName === sport.name)?.net ?? null,
    color: getSportColor(sport.name)
  }));

  // Sort based on current mode
  const sorted = [...sportsWithMetrics].sort((a, b) => {
    if (metricMode === 'revenue') return b.revenue - a.revenue || b.booked - a.booked;
    return b.booked - a.booked || b.revenue - a.revenue;
  });

  const maxVal = Math.max(1, ...sorted.map(s => Math.abs(Number(metricMode === 'revenue' ? s.revenue : s.booked))));

  return (
    <div className="space-y-4">
      {/* Toggle mode controller */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {metricMode === 'revenue'
            ? (isEn ? 'Ranked by net revenue received:' : 'Xếp hạng theo doanh thu thực nhận:')
            : (isEn ? 'Ranked by total bookings:' : 'Xếp hạng theo tổng lượt đặt chỗ:')}
        </span>
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMetricMode('revenue')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'revenue'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">payments</span>
            <span>{isEn ? 'Revenue' : 'Doanh Thu'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('booked')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'booked'
                ? 'bg-[#1E2235] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
            <span>{isEn ? 'Bookings' : 'Lượt Đặt Chỗ'}</span>
          </button>
        </div>
      </div>

      {/* Bars List */}
      <div className="space-y-2.5">
        {sorted.map((s, idx) => {
          const isTop1 = idx === 0;
          const val = metricMode === 'revenue' ? s.revenue : s.booked;
          const barWidth = Math.min(100, Math.round((Math.abs(Number(val || 0)) / maxVal) * 100));

          let rankBadge = `#${idx + 1}`;
          let rankColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
          if (idx === 0) { rankBadge = '🥇 #1'; rankColor = 'bg-[#F2CC8F]/30 text-amber-900 dark:text-[#F2CC8F] border border-[#F2CC8F]/60 font-black'; }
          else if (idx === 1) { rankBadge = '🥈 #2'; rankColor = 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold'; }
          else if (idx === 2) { rankBadge = '🥉 #3'; rankColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold'; }

          return (
            <div
              key={s.name}
              className={`p-3 rounded-xl border transition-all ${
                isTop1 ? 'bg-amber-50/30 dark:bg-slate-800/80 border-[#F2CC8F]/60 shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rankColor}`}>
                    {rankBadge}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    ({s.sessionsCount || 0} {isEn ? 'sessions' : 'ca'} · {s.classesCount || 0} {isEn ? 'classes' : 'lớp'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className={`font-chivo font-black text-sm ${metricMode === 'revenue' ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-900 dark:text-white'}`}>
                    {metricMode === 'revenue' ? (s.revenue === null ? (isEn ? 'Unallocated' : 'Chưa có phân bổ') : formatVnd(s.revenue)) : `${s.booked} ${isEn ? 'bookings' : 'lượt'}`}
                  </strong>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {s.share}% {isEn ? 'share' : 'thị phần'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    metricMode === 'revenue'
                      ? isTop1 ? 'bg-gradient-to-r from-[#2D6A4F] to-[#F2CC8F]' : 'bg-[#2D6A4F]'
                      : isTop1 ? 'bg-gradient-to-r from-sky-600 to-emerald-500' : 'bg-sky-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                <span>{isEn ? 'Occupancy:' : 'Lấp đầy:'} <strong className="text-slate-700 dark:text-slate-300">{s.percentage}%</strong> ({s.booked}/{s.capacity} {isEn ? 'slots' : 'chỗ'})</span>
                <span>{metricMode === 'revenue' ? `${s.booked} ${isEn ? 'bookings' : 'lượt đặt chỗ'}` : s.revenue === null ? (isEn ? 'Unallocated' : 'Chưa có phân bổ') : formatVnd(s.revenue)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 6. BIỂU ĐỒ XẾP HẠNG SÂN BÃI / PHÒNG TẬP: SỐ CA HỌC & LƯỢT KHÁCH
 */
export function RoomUsageRankingChart({ rooms = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [metricMode, setMetricMode] = useState('sessions'); // 'sessions' | 'booked'

  if (!rooms || !rooms.length) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">
        {isEn ? 'No court/room data available.' : 'Chưa có dữ liệu sân bãi.'}
      </div>
    );
  }

  const roomsWithMetrics = rooms;

  // Sort based on current mode
  const sorted = [...roomsWithMetrics].sort((a, b) => {
    if (metricMode === 'sessions') return b.sessionsCount - a.sessionsCount || b.booked - a.booked;
    return b.booked - a.booked || b.sessionsCount - a.sessionsCount;
  });

  const maxVal = Math.max(1, ...sorted.map(r => metricMode === 'sessions' ? r.sessionsCount : r.booked));

  return (
    <div className="space-y-4">
      {/* Toggle mode controller */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {metricMode === 'sessions'
            ? (isEn ? 'Ranked by sessions hosted:' : 'Xếp hạng theo số ca học:')
            : (isEn ? 'Ranked by visitors received:' : 'Xếp hạng theo lượt khách tiếp nhận:')}
        </span>
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMetricMode('sessions')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'sessions'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            <span>{isEn ? 'Sessions' : 'Số Ca Học'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('booked')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'booked'
                ? 'bg-[#1E2235] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">stadium</span>
            <span>{isEn ? 'Visitors' : 'Lượt Khách'}</span>
          </button>
        </div>
      </div>

      {/* Bars List */}
      <div className="space-y-2.5">
        {sorted.map((r, idx) => {
          const isTop1 = idx === 0;
          const val = metricMode === 'sessions' ? r.sessionsCount : r.booked;
          const barWidth = Math.min(100, Math.round((Number(val || 0) / maxVal) * 100));

          let rankBadge = `#${idx + 1}`;
          let rankColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
          if (idx === 0) { rankBadge = '🥇 #1'; rankColor = 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-black'; }
          else if (idx === 1) { rankBadge = '🥈 #2'; rankColor = 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold'; }
          else if (idx === 2) { rankBadge = '🥉 #3'; rankColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-bold'; }

          return (
            <div
              key={r.id}
              className={`p-3 rounded-xl border transition-all ${
                isTop1 ? 'bg-emerald-50/30 dark:bg-slate-800/80 border-emerald-300/80 dark:border-emerald-700 shadow-xs' : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rankColor}`}>
                    {rankBadge}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{r.name}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">({r.type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className={`font-chivo font-black text-sm ${metricMode === 'sessions' ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-900 dark:text-white'}`}>
                    {metricMode === 'sessions' ? `${r.sessionsCount || 0} ${isEn ? 'sessions' : 'ca'}` : `${r.booked} ${isEn ? 'visitors' : 'khách'}`}
                  </strong>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                    r.occupancyRate >= 20 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {r.occupancyRate}% {isEn ? 'load' : 'tải'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    metricMode === 'sessions'
                      ? isTop1 ? 'bg-gradient-to-r from-[#2D6A4F] to-[#81B29A]' : 'bg-[#2D6A4F]'
                      : isTop1 ? 'bg-gradient-to-r from-blue-600 to-indigo-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                <span>{r.location || (isEn ? 'Main Zone' : 'Khu chính')} · {isEn ? 'Hosted' : 'Đã chạy'} <strong className="text-slate-700 dark:text-slate-300">{r.sessionsCount} {isEn ? 'sessions' : 'ca'}</strong></span>
                <span>{metricMode === 'sessions' ? `${r.booked} ${isEn ? 'visitors' : 'lượt khách'}` : `${r.sessionsCount || 0} ${isEn ? 'sessions' : 'ca'}`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SportRevenueBarChart({ sports = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const rows = sports.filter(item => Number(item.net || 0) !== 0);
  if (!rows.length) return (
    <div className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">
      {isEn ? 'No sport revenue in selected period.' : 'Chưa có doanh thu bộ môn trong kỳ.'}
    </div>
  );
  const max = Math.max(1, ...rows.map(item => Math.abs(Number(item.net || 0))));
  return (
    <div className="space-y-3">
      {rows.map((item, index) => (
        <div key={item.sportId ?? 'unallocated'} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
          <div className="flex justify-between gap-3 text-xs mb-2">
            <span className="font-bold text-slate-900 dark:text-white">{index === 0 && item.sportId ? '🥇 ' : ''}{item.sportName}</span>
            <span className="font-black text-[#2D6A4F] dark:text-[#81B29A]">{formatVnd(item.net)} · {Number(item.share || 0).toLocaleString('vi-VN')}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full ${item.sportId ? 'bg-gradient-to-r from-[#2D6A4F] to-[#F2CC8F]' : 'bg-slate-400'}`}
              style={{ width: `${Math.max(item.net ? 2 : 0, Math.abs(Number(item.net || 0)) / max * 100)}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span>{isEn ? 'Gross:' : 'Thu:'} {formatVnd(item.gross)}</span>
            <span>{isEn ? 'Refunds:' : 'Hoàn:'} {formatVnd(item.refunds)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 7. VISION UI ARC GAUGE CHART (Satisfaction Rate / Center Occupancy)
 * Semi-circular 180° SVG gauge matching Image 1
 */
export function ArcGaugeChart({
  value = 0,
  min = 0,
  max = 100,
  title = 'Tỷ lệ lấp đầy trung tâm',
  subtitle = 'Dựa trên sức chứa toàn cơ sở',
  note = 'Chỉ số vận hành tối ưu'
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const val = Math.min(max, Math.max(min, Number(value || 0)));
  const fraction = (val - min) / (max - min || 1);

  const cx = 110;
  const cy = 85;
  const r = 68;
  const strokeWidth = 14;
  const arcLength = Math.PI * r; // ~213.6
  const dashOffset = arcLength * (1 - fraction);

  return (
    <div className="flex flex-col items-center justify-between h-full p-1 text-center">
      <div className="w-full flex items-center justify-between text-xs mb-1">
        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          {title}
        </span>
        <span className="material-symbols-outlined text-slate-400 text-[18px]">more_horiz</span>
      </div>
      <p className="w-full text-left text-[11px] text-slate-500 dark:text-slate-400 mb-2">
        {subtitle}
      </p>

      {/* SVG Semi-Circle Arc */}
      <div className="relative w-full max-w-[220px] aspect-[220/130] select-none">
        <svg viewBox="0 0 220 130" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="arcGaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#24828F" />
              <stop offset="50%" stopColor="#81B29A" />
              <stop offset="100%" stopColor="#2D6A4F" />
            </linearGradient>
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#24828F" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />

          {/* Progress Arc */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="url(#arcGaugeGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={arcLength}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            filter="url(#arcGlow)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Center Circular Icon Badge */}
          <circle cx={cx} cy={cy - 20} r="20" fill="#f8fafc" className="dark:fill-slate-800 shadow-sm" />
          <circle cx={cx} cy={cy - 20} r="18" fill="url(#arcGaugeGrad)" opacity="0.15" />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            className="text-[17px] select-none font-bold fill-[#2D6A4F] dark:fill-[#81B29A]"
            style={{ fontFamily: 'Material Symbols Outlined' }}
          >
            speed
          </text>

          {/* Scale min / max text */}
          <text x={cx - r - 2} y={cy + 16} textAnchor="start" className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500">
            {min}%
          </text>
          <text x={cx + r + 2} y={cy + 16} textAnchor="end" className="text-[10px] font-bold fill-slate-400 dark:fill-slate-500">
            {max}%
          </text>

          {/* Big value inside arc */}
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            className="text-2xl font-black font-chivo fill-slate-900 dark:fill-white"
          >
            {val}%
          </text>
          {/* Subtitle note */}
          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            className="text-[10px] font-semibold fill-[#2D6A4F] dark:fill-[#81B29A]"
          >
            {note}
          </text>
        </svg>
      </div>
    </div>
  );
}

/**
 * 8. VISION UI RADIAL PROGRESS SCORE (Referral Tracking / Facility Load Score)
 * Circular radial gauge + 2 mini pill metrics matching Image 1
 */
export function RadialScoreChart({
  score = 9.3,
  maxScore = 10,
  title = 'Khai thác cơ sở vật chất',
  subtitle = 'Facility Load Index',
  stat1Label = 'Khách tiếp nhận',
  stat1Val = '19 lượt',
  stat2Label = 'Ca tổ chức',
  stat2Val = '8 ca',
  scoreLabel = 'Điểm tải',
  scoreSub = 'Tối ưu'
}) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const numScore = Math.min(maxScore, Math.max(0, Number(score || 0)));
  const fraction = numScore / (maxScore || 1);

  const size = 110;
  const cx = size / 2;
  const cy = size / 2;
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className="flex flex-col justify-between h-full p-1">
      <div className="w-full flex items-center justify-between text-xs mb-1">
        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          {title}
        </span>
        <span className="material-symbols-outlined text-slate-400 text-[18px]">more_horiz</span>
      </div>

      <div className="grid grid-cols-2 items-center gap-2 my-auto">
        {/* Left Side: 2 metric pill cards */}
        <div className="space-y-2">
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
              {stat1Label}
            </span>
            <strong className="text-sm font-chivo font-black text-slate-900 dark:text-white">
              {stat1Val}
            </strong>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
              {stat2Label}
            </span>
            <strong className="text-sm font-chivo font-black text-[#2D6A4F] dark:text-[#81B29A]">
              {stat2Val}
            </strong>
          </div>
        </div>

        {/* Right Side: Circular radial ring */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none transform -rotate-90">
            <defs>
              <linearGradient id="radialScoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#24828F" />
                <stop offset="50%" stopColor="#81B29A" />
                <stop offset="100%" stopColor="#F2CC8F" />
              </linearGradient>
            </defs>

            {/* Background ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
              className="dark:stroke-slate-800"
            />

            {/* Progress ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="url(#radialScoreGrad)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
              {scoreLabel}
            </span>
            <span className="font-chivo font-black text-xl text-slate-900 dark:text-white leading-none my-0.5">
              {numScore}
            </span>
            <span className="text-[9px] font-bold text-[#2D6A4F] dark:text-[#81B29A]">
              {scoreSub}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 9. VISION UI SALES OVERVIEW (Dual Spline Wave Chart)
 * Smooth glowing spline area chart matching Image 1
 */
export function VisionSalesOverviewChart({ data = [], groupBy = 'day' }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || !data.length) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
        {isEn ? 'No sales data in selected period.' : 'Chưa có dữ liệu doanh thu trong kỳ.'}
      </div>
    );
  }

  const values = data.map(d => Number(d.net || 0));
  const maxVal = Math.max(1, ...values);
  const totalRevenue = values.reduce((sum, v) => sum + v, 0);

  const chartHeight = 230;
  const chartWidth = 640;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((d, i) => ({
    x: paddingLeft + (i / Math.max(1, data.length - 1)) * innerWidth,
    y: paddingTop + innerHeight - (Number(d.net || 0) / maxVal) * innerHeight,
    raw: d
  }));

  // Catmull-Rom spline path generator
  const getSmoothPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? i + 1 : i + 2];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const lineD = getSmoothPath(points);
  const areaD = points.length > 1
    ? `${lineD} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + innerHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + innerHeight).toFixed(1)} Z`
    : '';

  // Dual secondary decorative wave curve (similar to Image 1's dual neon lines)
  const secondaryPoints = points.map(pt => ({
    x: pt.x,
    y: Math.min(paddingTop + innerHeight, pt.y + 16 + Math.sin(pt.x / 40) * 10)
  }));
  const secondaryLineD = getSmoothPath(secondaryPoints);

  const yTicks = [0, 0.33, 0.66, 1].map(pct => ({
    val: Math.round(maxVal * pct),
    y: paddingTop + innerHeight * (1 - pct)
  }));

  return (
    <div className="space-y-3">
      {/* Chart Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">trending_up</span>
            {isEn ? '(+12%) net revenue increase' : '(+12%) tăng trưởng doanh thu'}
          </span>
          <span className="text-slate-400 text-[10px] block">
            {isEn ? `Aggregated by ${groupBy}` : `Tổng hợp theo ${groupBy === 'month' ? 'tháng' : 'ngày'}`}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2">
            {isEn ? 'Total:' : 'Tổng:'}
          </span>
          <strong className="text-base font-black font-chivo text-[#2D6A4F] dark:text-[#81B29A]">
            {formatVnd(totalRevenue)}
          </strong>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative overflow-x-auto">
        <svg data-chart-id="chart-revenue" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px] select-none">
          <defs>
            <linearGradient id="visionSalesAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#24828F" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#24828F" stopOpacity="0.0" />
            </linearGradient>
            <filter id="visionGlowLine" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#24828F" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                className="dark:stroke-slate-800"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-medium"
              >
                {formatShortVnd(tick.val)}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaD && <path d={areaD} fill="url(#visionSalesAreaGrad)" />}

          {/* Secondary subtle wave line */}
          {secondaryLineD && (
            <path
              d={secondaryLineD}
              fill="none"
              stroke="#81B29A"
              strokeWidth="1.8"
              strokeOpacity="0.65"
              strokeDasharray="2 2"
              strokeLinecap="round"
            />
          )}

          {/* Primary wave line */}
          {lineD && (
            <path
              d={lineD}
              fill="none"
              stroke="#24828F"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#visionGlowLine)"
            />
          )}

          {/* Data Points */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            const val = Number(pt.raw.net || 0);
            const dateLabel = pt.raw.periodStart.slice(5);

            return (
              <g
                key={pt.raw.periodStart}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Guide line on hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + innerHeight}
                    stroke="#24828F"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : val > 0 ? 3.5 : 2}
                  fill={val > 0 ? '#2D6A4F' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* X-axis date label */}
                {(points.length <= 15 || i % Math.ceil(points.length / 12) === 0) && (
                  <text
                    x={pt.x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className={`text-[10px] ${isHovered ? 'fill-[#24828F] font-bold' : 'fill-slate-500 dark:fill-slate-400'}`}
                  >
                    {dateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 transform -translate-x-1/2"
            style={{
              left: `${(points[hoveredIdx].x / chartWidth) * 100}%`
            }}
          >
            <span className="text-slate-300 font-medium">{data[hoveredIdx].periodStart}:</span>
            <strong className="text-emerald-300 font-black">{formatVnd(data[hoveredIdx].net)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

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
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]">group</span>
          {isEn ? '(+23%) active member traffic' : '(+23%) lượt tương tác học viên'}
        </span>
        <span className="text-slate-400 text-[10px] block">
          {isEn ? 'Daily activity & attendance volume' : 'Lưu lượng tham gia & hội viên tích cực'}
        </span>
      </div>

      {/* SVG Bar Chart with rounded capsule bars */}
      <div className="relative overflow-x-auto bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
        <svg data-chart-id="chart-members" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[380px] select-none">
          <defs>
            <linearGradient id="activeUserBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D6A4F" />
              <stop offset="100%" stopColor="#81B29A" />
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
                  fill="#e2e8f0"
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
                    className="text-[9px] fill-slate-400 dark:fill-slate-500 font-medium"
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
            className="absolute top-2 pointer-events-none bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 transform -translate-x-1/2"
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
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">group</span>
            </span>
            <span>{isEn ? 'Users' : 'Hội viên'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-slate-900 dark:text-white">
            {totalUsers}
          </p>
        </div>

        {/* Pill 2: Bookings */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">confirmation_number</span>
            </span>
            <span>{isEn ? 'Bookings' : 'Lượt đặt'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-slate-900 dark:text-white">
            {totalBookings}
          </p>
        </div>

        {/* Pill 3: Sales */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">payments</span>
            </span>
            <span>{isEn ? 'Revenue' : 'Doanh thu'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-[#2D6A4F] dark:text-[#81B29A]">
            {formatShortVnd(netSales)}
          </p>
        </div>

        {/* Pill 4: Sessions */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
            <span className="w-5 h-5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">stadium</span>
            </span>
            <span>{isEn ? 'Sessions' : 'Ca học'}</span>
          </div>
          <p className="text-sm font-chivo font-black text-slate-900 dark:text-white">
            {totalSessions}
          </p>
        </div>
      </div>
    </div>
  );
}

