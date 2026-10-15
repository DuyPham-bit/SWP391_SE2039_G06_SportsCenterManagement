import React, { useState } from 'react';

// Format currency
const formatVnd = (num) => `${Number(num || 0).toLocaleString('vi-VN')}đ`;
const formatShortVnd = (num) => {
  const n = Number(num || 0);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} Tr`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)} K`;
  return `${n}đ`;
};

// Colors for sports
const sportColors = {
  'Bơi lội': { stroke: '#0284c7', fill: '#e0f2fe', text: 'text-sky-700', bg: 'bg-sky-500' },
  'Gym & Fitness': { stroke: '#dc2626', fill: '#fee2e2', text: 'text-red-700', bg: 'bg-red-500' },
  'Yoga & Pilates': { stroke: '#059669', fill: '#d1fae5', text: 'text-emerald-700', bg: 'bg-emerald-500' },
  'Cầu lông': { stroke: '#d97706', fill: '#fef3c7', text: 'text-amber-700', bg: 'bg-amber-500' },
  'Boxing & Võ thuật': { stroke: '#7c3aed', fill: '#ede9fe', text: 'text-purple-700', bg: 'bg-purple-500' }
};

const getSportColor = (name) => sportColors[name] || { stroke: '#475569', fill: '#f1f5f9', text: 'text-slate-700', bg: 'bg-slate-500' };

/**
 * 1. BIỂU ĐỒ DOANH THU THUẦN (REVENUE TREND BAR CHART)
 */
export function RevenueTrendChart({ data = [], groupBy = 'day' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || !data.length) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        Chưa có dữ liệu doanh thu trong kỳ đã chọn.
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
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
        <div>
          <span className="text-slate-500 block text-[11px]">Tổng doanh thu kỳ:</span>
          <strong className="text-base font-black text-red-600 font-chivo">{formatVnd(totalRevenue)}</strong>
        </div>
        {peakIdx >= 0 && values[peakIdx] > 0 && (
          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Ngày doanh thu cao nhất:</span>
            <span className="font-bold text-slate-900 bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] border border-amber-300">
              🌟 {data[peakIdx].periodStart}: {formatVnd(values[peakIdx])}
            </span>
          </div>
        )}
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px] select-none">
          <defs>
            <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="revenuePeakGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
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
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
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
            const dateLabel = item.periodStart.slice(5); // e.g. '10-01'

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
                    fill="#fee2e2"
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
                    className={`text-[10px] ${isHovered ? 'fill-red-600 font-bold' : 'fill-slate-500'}`}
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
            <strong className="text-amber-300 font-black">{formatVnd(data[hoveredIdx].net)}</strong>
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
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || !data.length) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        Chưa có dữ liệu thành viên mới trong kỳ đã chọn.
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
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
        <div>
          <span className="text-slate-500 block text-[11px]">Tổng thành viên mới:</span>
          <strong className="text-base font-black text-blue-600 font-chivo">+{totalNew} người</strong>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Đỉnh tăng trưởng:</span>
          <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[11px] border border-blue-200">
            +{maxVal} người / ngày
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px] select-none">
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
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
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
                    className={`text-[10px] ${isHovered ? 'fill-blue-600 font-bold' : 'fill-slate-500'}`}
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
            <strong className="text-cyan-300 font-black">+{data[hoveredIdx].newMembers} thành viên</strong>
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
  const [activeIdx, setActiveIdx] = useState(null);

  if (!sports || !sports.length) {
    return <div className="text-xs text-slate-400 py-8 text-center">Chưa có dữ liệu bộ môn.</div>;
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
      {/* SVG Donut */}
      <div className="relative w-48 h-48 flex-shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
          {/* Base empty ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth="24"
          />

          {/* Slices */}
          {slices.map((slice) => {
            const isHovered = activeIdx === slice.idx;
            return (
              <circle
                key={slice.name}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={slice.color.stroke}
                strokeWidth={isHovered ? 28 : 22}
                strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
                strokeDashoffset={-slice.offset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:opacity-90"
                onMouseEnter={() => setActiveIdx(slice.idx)}
                onMouseLeave={() => setActiveIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
            {currentHovered?.name || 'Tổng Đặt Chỗ'}
          </span>
          <span className="text-xl font-black text-slate-900 font-chivo leading-tight">
            {currentHovered?.booked || totalBooked}
            <span className="text-xs font-normal text-slate-500 ml-0.5">lượt</span>
          </span>
          <span className="text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200 mt-0.5">
            {currentHovered?.share || Math.round(((currentHovered?.booked || 0) / totalBooked) * 100)}% thị phần
          </span>
        </div>
      </div>

      {/* Interactive Legend List */}
      <div className="w-full space-y-2">
        {slices.map((slice) => {
          const isHovered = activeIdx === slice.idx;
          return (
            <div
              key={slice.name}
              onMouseEnter={() => setActiveIdx(slice.idx)}
              onMouseLeave={() => setActiveIdx(null)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                isHovered
                  ? 'bg-slate-50 border-slate-400 shadow-sm'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color.stroke }} />
                <span className="font-bold text-slate-900">{slice.name}</span>
                <span className="text-slate-400 text-[11px]">({slice.sessionsCount || 0} ca)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-slate-800">{slice.booked} lượt</span>
                <span className="w-12 text-right font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {slice.share}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 4. BIỂU ĐỒ THANH SO SÁNH LỚP HỌC (CLASSES COMPARISON BARS)
 */
export function ClassCapacityBarChart({ classes = [] }) {
  if (!classes || !classes.length) return null;
  const maxCapacity = Math.max(1, ...classes.map(c => c.capacity || 0));

  return (
    <div className="space-y-3">
      {classes.slice(0, 5).map((cls, idx) => {
        const bookedWidth = ((cls.booked || 0) / maxCapacity) * 100;
        const capacityWidth = ((cls.capacity || 0) / maxCapacity) * 100;
        const isLeader = idx === 0;

        return (
          <div key={cls.id} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  isLeader ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-700'
                }`}>
                  {idx + 1}
                </span>
                <strong className="text-slate-900 font-bold">{cls.name}</strong>
                <span className="text-[11px] text-slate-400">({cls.sportName})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900">{cls.booked} / {cls.capacity} chỗ</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                  cls.occupancyRate >= 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {cls.occupancyRate}%
                </span>
              </div>
            </div>

            {/* Comparison progress track */}
            <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              {/* Capacity outline fill */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-slate-200 rounded-full"
                style={{ width: `${Math.min(100, capacityWidth)}%` }}
              />
              {/* Actual Booked bar */}
              <div
                className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${
                  isLeader ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-red-600'
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
  const [metricMode, setMetricMode] = useState('revenue'); // 'revenue' | 'booked'

  if (!sports || !sports.length) {
    return <div className="text-xs text-slate-400 py-8 text-center">Chưa có dữ liệu bộ môn.</div>;
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
        <span className="text-slate-500 font-medium">
          {metricMode === 'revenue' ? 'Xếp hạng theo doanh thu thực nhận:' : 'Xếp hạng theo tổng lượt đặt chỗ:'}
        </span>
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setMetricMode('revenue')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'revenue'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">payments</span>
            <span>Doanh Thu</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('booked')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'booked'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
            <span>Lượt Đặt Chỗ</span>
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
          let rankColor = 'bg-slate-100 text-slate-700';
          if (idx === 0) { rankBadge = '🥇 #1'; rankColor = 'bg-amber-100 text-amber-900 border border-amber-300 font-black'; }
          else if (idx === 1) { rankBadge = '🥈 #2'; rankColor = 'bg-slate-200 text-slate-800 font-bold'; }
          else if (idx === 2) { rankBadge = '🥉 #3'; rankColor = 'bg-amber-50 text-amber-800 font-bold'; }

          return (
            <div
              key={s.name}
              className={`p-3 rounded-xl border transition-all ${
                isTop1 ? 'bg-amber-50/30 border-amber-200/80 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rankColor}`}>
                    {rankBadge}
                  </span>
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="text-[11px] text-slate-400">({s.sessionsCount || 0} ca · {s.classesCount || 0} lớp)</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className={`font-chivo font-black text-sm ${metricMode === 'revenue' ? 'text-red-600' : 'text-slate-900'}`}>
                    {metricMode === 'revenue' ? (s.revenue === null ? 'Chưa có phân bổ' : formatVnd(s.revenue)) : `${s.booked} lượt`}
                  </strong>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {s.share}% thị phần
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    metricMode === 'revenue'
                      ? isTop1 ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-red-600'
                      : isTop1 ? 'bg-gradient-to-r from-sky-600 to-emerald-500' : 'bg-sky-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Lấp đầy: <strong className="text-slate-700">{s.percentage}%</strong> ({s.booked}/{s.capacity} chỗ)</span>
                <span>{metricMode === 'revenue' ? `${s.booked} lượt đặt chỗ` : s.revenue === null ? 'Chưa có phân bổ' : formatVnd(s.revenue)}</span>
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
  const [metricMode, setMetricMode] = useState('sessions'); // 'sessions' | 'booked'

  if (!rooms || !rooms.length) {
    return <div className="text-xs text-slate-400 py-8 text-center">Chưa có dữ liệu sân bãi.</div>;
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
        <span className="text-slate-500 font-medium">
          {metricMode === 'sessions' ? 'Xếp hạng theo số ca học:' : 'Xếp hạng theo lượt khách tiếp nhận:'}
        </span>
        <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setMetricMode('sessions')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'sessions'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            <span>Số Ca Học</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('booked')}
            className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
              metricMode === 'booked'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">stadium</span>
            <span>Lượt Khách</span>
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
          let rankColor = 'bg-slate-100 text-slate-700';
          if (idx === 0) { rankBadge = '🥇 #1'; rankColor = 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black'; }
          else if (idx === 1) { rankBadge = '🥈 #2'; rankColor = 'bg-slate-200 text-slate-800 font-bold'; }
          else if (idx === 2) { rankBadge = '🥉 #3'; rankColor = 'bg-amber-50 text-amber-800 font-bold'; }

          return (
            <div
              key={r.id}
              className={`p-3 rounded-xl border transition-all ${
                isTop1 ? 'bg-emerald-50/30 border-emerald-200/80 shadow-xs' : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${rankColor}`}>
                    {rankBadge}
                  </span>
                  <span className="font-bold text-slate-900">{r.name}</span>
                  <span className="text-[11px] text-slate-400">({r.type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <strong className={`font-chivo font-black text-sm ${metricMode === 'sessions' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {metricMode === 'sessions' ? `${r.sessionsCount || 0} ca` : `${r.booked} khách`}
                  </strong>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                    r.occupancyRate >= 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {r.occupancyRate}% tải
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    metricMode === 'sessions'
                      ? isTop1 ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-emerald-600'
                      : isTop1 ? 'bg-gradient-to-r from-blue-600 to-indigo-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>{r.location || 'Khu chính'} · Đã chạy <strong className="text-slate-700">{r.sessionsCount} ca</strong></span>
                <span>{metricMode === 'sessions' ? `${r.booked} lượt khách` : `${r.sessionsCount || 0} ca`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SportRevenueBarChart({ sports = [] }) {
  const rows = sports.filter(item => Number(item.net || 0) !== 0);
  if (!rows.length) return <div className="text-xs text-slate-400 py-8 text-center">Chưa có doanh thu bộ môn trong kỳ.</div>;
  const max = Math.max(1, ...rows.map(item => Math.abs(Number(item.net || 0))));
  return (
    <div className="space-y-3">
      {rows.map((item, index) => (
        <div key={item.sportId ?? 'unallocated'} className="rounded-xl border border-slate-200 p-3 bg-white">
          <div className="flex justify-between gap-3 text-xs mb-2">
            <span className="font-bold text-slate-900">{index === 0 && item.sportId ? '🥇 ' : ''}{item.sportName}</span>
            <span className="font-black text-red-700">{formatVnd(item.net)} · {Number(item.share || 0).toLocaleString('vi-VN')}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${item.sportId ? 'bg-gradient-to-r from-red-600 to-amber-500' : 'bg-slate-400'}`}
              style={{ width: `${Math.max(item.net ? 2 : 0, Math.abs(Number(item.net || 0)) / max * 100)}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
            <span>Thu: {formatVnd(item.gross)}</span><span>Hoàn: {formatVnd(item.refunds)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
