import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

// Utility formatters
export const formatShortVnd = (num) => {
  const n = Number(num || 0);
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)} tỷ`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} tr`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n.toLocaleString('vi-VN')}đ`;
};

/**
 * Monotone Cubic Spline (Fritsch-Carlson) algorithm.
 * Guarantees zero overshoot/undershoot, eliminates loops and negative values,
 * and keeps zero-revenue days perfectly flat on the baseline.
 */
function getMonotoneSplinePath(points, baselineY, minY) {
  if (!points || points.length < 2) return '';
  const n = points.length;

  // 1. Calculate secants (slopes between consecutive points)
  const d = [];
  const dx = [];
  for (let i = 0; i < n - 1; i++) {
    const deltaX = points[i + 1].x - points[i].x;
    dx.push(deltaX);
    d.push(deltaX === 0 ? 0 : (points[i + 1].y - points[i].y) / deltaX);
  }

  // 2. Initialize tangents
  const m = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (d[i - 1] + d[i]) / 2;
    }
  }

  // 3. Fritsch-Carlson bounds to prevent overshoot
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const hyp = Math.sqrt(a * a + b * b);
      if (hyp > 3) {
        const tau = 3 / hyp;
        m[i] = tau * a * d[i];
        m[i + 1] = tau * b * d[i];
      }
    }
  }

  // 4. Construct Bezier curve path
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentDx = dx[i];

    let cp1x = p1.x + segmentDx / 3;
    let cp1y = p1.y + (m[i] * segmentDx) / 3;
    let cp2x = p2.x - segmentDx / 3;
    let cp2y = p2.y - (m[i + 1] * segmentDx) / 3;

    // Strict clamping to baseline (never dip below baseline or above top padding)
    if (baselineY != null) {
      cp1y = Math.min(baselineY, cp1y);
      cp2y = Math.min(baselineY, cp2y);
    }
    if (minY != null) {
      cp1y = Math.max(minY, cp1y);
      cp2y = Math.max(minY, cp2y);
    }

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return path;
}

/**
 * 1. MINI SPARKLINE WAVE (Used in KPI Cards 5 & 6)
 */
export function MiniSparkline({ color = '#F97316', data = [] }) {
  const width = 160;
  const height = 36;

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-9 flex items-center justify-center">
        <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const values = data.map(Number);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  if (values.length === 1) {
    return (
      <div className="w-full h-9 flex items-center">
        <div className="w-full h-[2px] rounded-full" style={{ backgroundColor: color }} />
      </div>
    );
  }

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  const pathD = getMonotoneSplinePath(points, height - 4, 4);
  const fillD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="w-full h-9 overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/**
 * 2. TRẠNG THÁI SÂN BÃI & PHÒNG TẬP (Donut Chart - Real DB Data)
 */
export function RoomStatusDonutChart({ total = 0, data = [] }) {
  const [hovered, setHovered] = useState(null);
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const validData = Array.isArray(data) && data.length > 0 ? data : [{ label: 'Trống', value: 1, color: '#64748B' }];
  const sum = validData.reduce((acc, cur) => acc + (cur.value || 0), 0) || 1;

  let cumulativeAngle = 0;
  const segments = validData.map((item, idx) => {
    const fraction = (item.value || 0) / sum;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    return { ...item, strokeDasharray, strokeDashoffset, idx };
  });

  return (
    <div className="flex flex-col items-center justify-between h-full space-y-3">
      {/* SVG Donut */}
      <div className="relative w-40 h-40 flex items-center justify-center my-auto">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 select-none">
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHovered(seg.idx)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[11px] font-medium text-slate-400">
            {hovered !== null ? validData[hovered].label : 'Sân & Phòng'}
          </span>
          <strong className="text-2xl font-black font-chivo text-slate-900 dark:text-white leading-none mt-0.5">
            {hovered !== null ? validData[hovered].value : total}
          </strong>
        </div>
      </div>

      {/* Legend below */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full">
        {validData.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${hovered !== null && hovered !== i ? 'opacity-40' : 'opacity-100'}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-medium">{item.label} ({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. LẤP ĐẦY THEO BỘ MÔN THỂ THAO (Horizontal Progress Bars - Real DB Data)
 */
export function FacilityOccupancyBars({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[24px] mb-1 opacity-50">sports</span>
        <span>Chưa có dữ liệu đặt chỗ theo bộ môn trong kỳ.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      <div className="space-y-2.5 my-auto">
        {items.map((item) => (
          <div key={item.name || item.code} className="flex items-center gap-2.5">
            {/* Acronym Badge */}
            <span className="w-7 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono" title={item.name}>
              {item.code}
            </span>

            {/* Progress track */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg h-6 p-0.5 overflow-hidden relative">
              <div
                className="h-full rounded-md bg-[#0D9488] transition-all duration-700 flex items-center justify-end pr-2"
                style={{ width: `${Math.min(100, Math.max(12, item.pct))}%` }}
              >
                <span className="text-[10px] font-bold text-white whitespace-nowrap">
                  {item.pct}% {item.current != null ? `(${item.current}/${item.max})` : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 0% - 100% Axis */}
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-7 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

/**
 * 4. TIẾN ĐỘ CHỈ TIÊU / CÔNG SUẤT VẬN HÀNH (Radial Open Arc Gauge - Real DB Data)
 */
export function PeriodCollectionRadialGauge({
  percentage = 0,
  collectedText = 'Đang đồng bộ dữ liệu...',
  remainingText = '',
  color = '#F59E0B'
}) {
  const size = 170;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const arcDegree = 280;
  const arcLength = (arcDegree / 360) * (2 * Math.PI * radius);
  const totalCircumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const progressLength = (clampedPercentage / 100) * arcLength;
  const dashOffset = arcLength - progressLength;

  return (
    <div className="flex flex-col items-center justify-center h-full my-auto py-2">
      <div className="relative w-40 h-40 flex items-center justify-center select-none">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[130deg] overflow-visible"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${totalCircumference}`}
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />
          {/* Active Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${totalCircumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <strong className="text-3xl font-black font-chivo text-slate-900 dark:text-white leading-none">
            {clampedPercentage}%
          </strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium px-2 truncate">
            {collectedText}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. HỒ SƠ & THẺ HỘI VIÊN THỂ THAO (Stacked Bars - Real DB Data)
 */
export function MemberDocumentsStackedBars({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[24px] mb-1 opacity-50">group</span>
        <span>Chưa có dữ liệu hội viên trong hệ thống.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full space-y-3.5">
      <div className="space-y-4 my-auto">
        {items.map((row) => {
          const total = (row.greenVal || 0) + (row.redVal || 0) || 1;
          const greenPct = ((row.greenVal || 0) / total) * 100;
          const redPct = ((row.redVal || 0) / total) * 100;

          return (
            <div key={row.label} className="flex items-center gap-2.5">
              <span className="w-24 text-xs font-semibold text-slate-600 dark:text-slate-400 truncate text-right">
                {row.label}
              </span>

              <div className="flex-1 flex rounded-lg h-7 overflow-hidden gap-1">
                {row.greenVal > 0 && (
                  <div
                    className="h-full bg-[#10B981] rounded-md flex items-center justify-center text-white text-[11px] font-black min-w-[32px] transition-all duration-500"
                    style={{ width: `${greenPct}%` }}
                    title={`${row.greenLabel || 'Có gói'}: ${row.greenVal}`}
                  >
                    {row.greenVal}
                  </div>
                )}
                {row.redVal > 0 && (
                  <div
                    className="h-full bg-[#EF4444] rounded-md flex items-center justify-center text-white text-[11px] font-black min-w-[28px] transition-all duration-500"
                    style={{ width: `${redPct}%` }}
                    title={`${row.redLabel || 'Chưa có'}: ${row.redVal}`}
                  >
                    {row.redVal}
                  </div>
                )}
                {row.greenVal === 0 && row.redVal === 0 && (
                  <div className="h-full w-full bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-400 text-[10px]">
                    0
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis & Legend */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-6">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" /> Có gói / Hiệu lực
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]" /> Chưa có / Hết hạn
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. BIẾN ĐỘNG DOANH THU THỰC TẾ (Dual Grouped Bars + Monotone Spline Curve)
 * Fixed: Monotone cubic spline to eliminate dips below zero, responsive 600x220 aspect ratio,
 * clean non-overlapping date ticks.
 */
export function TwelveMonthRevenueExpensesProfitChart({ revenuePeriods = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!Array.isArray(revenuePeriods) || revenuePeriods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[28px] mb-1.5 opacity-50">monitoring</span>
        <span>Chưa có dữ liệu dòng tiền trong khoảng thời gian đã chọn.</span>
      </div>
    );
  }

  const months = revenuePeriods.map((item, idx) => {
    const rawPeriod = String(item.period || '');
    const mLabel = rawPeriod.length >= 7 ? rawPeriod.slice(5) : rawPeriod;
    const rev = Number(((item.gross || item.net || 0) / 1000000).toFixed(2));
    const exp = Number(((item.refunds || 0) / 1000000).toFixed(2));
    const profit = Number(((item.net || 0) / 1000000).toFixed(2));
    return {
      m: mLabel,
      rev,
      exp,
      profit,
      orders: item.ordersCount || 0,
      active: idx === revenuePeriods.length - 1
    };
  });

  // Calculate clean max value
  const rawMax = Math.max(...months.map(m => Math.max(m.rev, m.exp, m.profit)), 1);
  // Round up to nice number: 5, 10, 15, 20, 25, 30...
  const niceMax = rawMax <= 5 ? 5 : rawMax <= 10 ? 10 : rawMax <= 20 ? 20 : rawMax <= 25 ? 25 : Math.ceil(rawMax / 10) * 10;

  const chartHeight = 220;
  const chartWidth = 600;
  const paddingLeft = 52;
  const paddingRight = 18;
  const paddingTop = 24;
  const paddingBottom = 32;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const baselineY = paddingTop + innerHeight;
  const stepX = innerWidth / months.length;
  const effectiveBarWidth = Math.min(10, Math.max(4, stepX * 0.42));

  // Points for spline curve
  const splinePoints = months.map((item, idx) => {
    const x = paddingLeft + idx * stepX + stepX / 2;
    const y = baselineY - (Math.max(0, item.profit) / niceMax) * innerHeight;
    return { x, y: Math.min(baselineY, Math.max(paddingTop, y)) };
  });

  // Safe Monotone Spline (no overshoot, zero stays at baseline)
  const splineD = getMonotoneSplinePath(splinePoints, baselineY, paddingTop);
  const fillD = splinePoints.length >= 2
    ? `${splineD} L ${splinePoints[splinePoints.length - 1].x.toFixed(1)} ${baselineY} L ${splinePoints[0].x.toFixed(1)} ${baselineY} Z`
    : '';

  // 4 Evenly spaced Y Ticks
  const yTicks = [0, niceMax * 0.33, niceMax * 0.67, niceMax];

  // Pick ~6 readable dates for X-axis
  const labelInterval = Math.max(1, Math.ceil(months.length / 6));

  return (
    <div className="relative w-full select-none">
      {/* Subtle Legend */}
      <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#0D9488]" /> Doanh thu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#F43F5E]" /> Hoàn tiền
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full bg-[#EAB308]" /> Thực thu
        </span>
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto max-h-[220px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="splineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EAB308" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Grid lines & Labels */}
        {yTicks.map((val, idx) => {
          const y = baselineY - (val / niceMax) * innerHeight;
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                className="dark:stroke-slate-800"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9.5px] font-bold fill-slate-400 dark:fill-slate-500"
              >
                {val === 0 ? '0' : `${val.toFixed(1)} tr`}
              </text>
            </g>
          );
        })}

        {/* Dual Bars for Each Period */}
        {months.map((item, idx) => {
          const groupCenterX = paddingLeft + idx * stepX + stepX / 2;
          const revHeight = (Math.max(0, item.rev) / niceMax) * innerHeight;
          const expHeight = (Math.max(0, item.exp) / niceMax) * innerHeight;

          const hasExp = expHeight > 0;
          const revX = hasExp ? groupCenterX - effectiveBarWidth - 1 : groupCenterX - effectiveBarWidth / 2;
          const expX = groupCenterX + 1;
          const revY = baselineY - revHeight;
          const expY = baselineY - expHeight;

          const shouldShowLabel = idx % labelInterval === 0 || idx === months.length - 1;

          return (
            <g
              key={item.m + idx}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Highlight Column on Hover */}
              {hoveredIdx === idx && (
                <rect
                  x={paddingLeft + idx * stepX}
                  y={paddingTop}
                  width={stepX}
                  height={innerHeight}
                  fill="#0D9488"
                  fillOpacity="0.08"
                  rx="4"
                />
              )}

              {/* Revenue Bar (Dark Teal) */}
              {revHeight > 0 && (
                <rect
                  x={revX}
                  y={revY}
                  width={effectiveBarWidth}
                  height={revHeight}
                  fill="#0D9488"
                  rx="2.5"
                  className="transition-all duration-300"
                />
              )}

              {/* Refund Bar (Rose) */}
              {hasExp && (
                <rect
                  x={expX}
                  y={expY}
                  width={effectiveBarWidth}
                  height={expHeight}
                  fill="#F43F5E"
                  rx="2.5"
                  className="transition-all duration-300"
                />
              )}

              {/* X Date Label (Spread evenly) */}
              {shouldShowLabel && (
                <text
                  x={groupCenterX}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  className={`text-[9px] font-bold ${
                    item.active ? 'fill-[#EA580C] font-black' : 'fill-slate-400 dark:fill-slate-500'
                  }`}
                >
                  {item.m}
                </text>
              )}
            </g>
          );
        })}

        {/* Spline Area Fill */}
        {fillD && (
          <path d={fillD} fill="url(#splineAreaGrad)" />
        )}

        {/* Spline Profit Line (Gold) */}
        {splineD && (
          <path
            d={splineD}
            fill="none"
            stroke="#EAB308"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots on points with transactions */}
        {splinePoints.map((pt, i) => {
          if (months[i].profit <= 0 && hoveredIdx !== i) return null;
          return (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === i ? 5 : 3}
              fill="#EAB308"
              stroke="#ffffff"
              strokeWidth="1.5"
              className="transition-all duration-150"
            />
          );
        })}
      </svg>

      {/* Tooltip on hover */}
      {hoveredIdx !== null && (
        <div
          className="absolute -top-3 pointer-events-none bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 transform -translate-x-1/2 z-20"
          style={{
            left: `${((paddingLeft + hoveredIdx * stepX + stepX / 2) / chartWidth) * 100}%`
          }}
        >
          <span className="font-bold text-slate-300">{months[hoveredIdx].m}:</span>
          <span className="text-teal-300 font-bold">Thu: {months[hoveredIdx].rev} tr</span>
          {months[hoveredIdx].exp > 0 && (
            <span className="text-rose-300 font-bold">Hoàn: {months[hoveredIdx].exp} tr</span>
          )}
          <span className="text-amber-300 font-black">Thực thu: {months[hoveredIdx].profit} tr</span>
        </div>
      )}
    </div>
  );
}

/**
 * 7. DOANH THU THEO BỘ MÔN (Horizontal Bars - Real DB Data)
 * Fixed: Centered vertical layout, sport-specific icon badges, percentage pills, no bottom-pushing.
 */
export function ThreeMonthExpensesBars({ items = [], emptyText = 'Chưa có doanh thu theo bộ môn trong kỳ.' }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[28px] mb-1.5 opacity-50">pie_chart</span>
        <span>{emptyText}</span>
      </div>
    );
  }

  const getSportVisual = (name) => {
    const n = String(name || '').toLowerCase();
    if (n.includes('bơi')) return { icon: 'pool', bg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-200 dark:border-sky-800', bar: '#0284C7' };
    if (n.includes('gym') || n.includes('fitness')) return { icon: 'fitness_center', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800', bar: '#E11D48' };
    if (n.includes('yoga') || n.includes('pilates')) return { icon: 'self_improvement', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800', bar: '#9333EA' };
    if (n.includes('cầu lông')) return { icon: 'sports_tennis', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800', bar: '#D97706' };
    if (n.includes('boxing') || n.includes('võ')) return { icon: 'sports_mma', bg: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800', bar: '#DC2626' };
    return { icon: 'card_membership', bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800', bar: '#0D9488' };
  };

  return (
    <div className="flex flex-col justify-center h-full space-y-4 py-2">
      {items.map((item) => {
        const visual = getSportVisual(item.label);
        const displayName = item.label === 'Chưa phân bổ' ? 'Gói thẻ hội viên chung' : item.label;

        return (
          <div key={item.label} className="space-y-1.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${visual.bg}`}>
                  <span className="material-symbols-outlined text-[14px]">{visual.icon}</span>
                </div>
                <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[140px]" title={item.label}>
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-900 dark:text-white font-black font-chivo text-xs">
                  {item.value}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  {item.pct ? `${item.pct}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Progress Bar with theme color */}
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(8, item.pct || 0))}%`,
                  backgroundColor: visual.bar
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 8. LƯỢT ĐẶT THEO LỚP HỌC (Vertical Bar Chart - Real DB Data)
 */
export function SixMonthContractExpiryBars({ items = [], emptyText = 'Chưa có lớp học nào hoạt động trong kỳ.' }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[28px] mb-1.5 opacity-50">event_seat</span>
        <span>{emptyText}</span>
      </div>
    );
  }

  const chartHeight = 170;
  const maxVal = Math.max(...items.map(i => Number(i.val || 0)), 1);

  return (
    <div className="relative w-full h-[170px] select-none my-auto">
      <div className="absolute inset-x-0 bottom-6 flex items-end justify-between px-2 h-[120px]">
        {items.map((item, idx) => {
          const valNum = Number(item.val || 0);
          const barHeight = valNum > 0 ? Math.max(20, (valNum / maxVal) * 88) : 4;
          const barColor = valNum > 0
            ? (item.isCurrent ? 'bg-[#EA580C]' : 'bg-[#0D9488]')
            : 'bg-slate-200 dark:bg-slate-700';

          return (
            <div key={item.month + idx} className="flex flex-col items-center gap-1.5 flex-1 group">
              {/* Value on top */}
              <span className={`text-xs font-black ${valNum > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {valNum}
              </span>

              {/* Vertical Bar */}
              <div
                className={`w-6 sm:w-7 rounded-t-md ${barColor} transition-all duration-500 group-hover:brightness-110 flex items-center justify-center shadow-xs`}
                style={{ height: `${barHeight}px` }}
              >
                {valNum > 0 && barHeight >= 22 && (
                  <span className="text-[10px] font-bold text-white/90">
                    {valNum}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] font-semibold text-slate-400 mt-1 truncate max-w-[56px] text-center" title={item.month}>
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
