import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

// Utility formatters
const formatShortVnd = (num) => {
  const n = Number(num || 0);
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)} tỷ`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} tr`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n}đ`;
};

/**
 * 1. MINI SPARKLINE WAVE (Used in Cards 5 & 6)
 */
export function MiniSparkline({ color = '#F97316', data = [30, 45, 38, 55, 42, 60, 48, 65, 50, 40] }) {
  const width = 160;
  const height = 36;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return { x, y };
  });

  let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 >= points.length ? i + 1 : i + 2];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

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
 * 2. TRẠNG THÁI PHÒNG / SÂN BÃI (Donut Chart with 5 segments)
 */
export function RoomStatusDonutChart({
  total = 41,
  data = [
    { label: 'Trống', value: 14, color: '#3B82F6' },
    { label: 'Đang thuê', value: 20, color: '#10B981' },
    { label: 'Sắp hết hạn', value: 4, color: '#F59E0B' },
    { label: 'Quá hạn', value: 2, color: '#EF4444' },
    { label: 'Bảo trì', value: 1, color: '#64748B' }
  ]
}) {
  const [hovered, setHovered] = useState(null);
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = data.reduce((acc, cur) => acc + cur.value, 0) || 1;

  let cumulativeAngle = 0;
  const segments = data.map((item, idx) => {
    const fraction = item.value / sum;
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
            {hovered !== null ? data[hovered].label : 'Phòng'}
          </span>
          <strong className="text-2xl font-black font-chivo text-slate-900 dark:text-white leading-none mt-0.5">
            {hovered !== null ? data[hovered].value : total}
          </strong>
        </div>
      </div>

      {/* Legend below */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full">
        {data.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${hovered !== null && hovered !== i ? 'opacity-40' : 'opacity-100'}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. LẤP ĐẦY THEO CƠ SỞ / BỘ MÔN (Horizontal Progress Bars)
 */
export function FacilityOccupancyBars({
  items = [
    { code: 'CG', name: 'Cơ sở Quận 1 (Bơi lội)', pct: 79, current: 11, max: 14 },
    { code: 'TX', name: 'Thanh Xuân (Gym)', pct: 80, current: 4, max: 5 },
    { code: 'HD', name: 'Hà Đông (Yoga & Pilates)', pct: 77, current: 10, max: 13 },
    { code: 'LB', name: 'Long Biên (Cầu lông & Võ)', pct: 13, current: 1, max: 8 }
  ]
}) {
  return (
    <div className="flex flex-col justify-between h-full space-y-3.5">
      <div className="space-y-3 my-auto">
        {items.map((item) => (
          <div key={item.code} className="flex items-center gap-3">
            {/* Acronym Badge */}
            <span className="w-7 text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
              {item.code}
            </span>

            {/* Progress track */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg h-7 p-0.5 overflow-hidden relative">
              <div
                className="h-full rounded-md bg-[#0D9488] transition-all duration-700 flex items-center justify-end pr-2.5"
                style={{ width: `${Math.min(100, Math.max(10, item.pct))}%` }}
              >
                <span className="text-[11px] font-bold text-white whitespace-nowrap">
                  {item.pct}% {item.current ? `${item.current}/${item.max}` : ''}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 0% - 100% Axis */}
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-7 pt-2 border-t border-slate-100 dark:border-slate-800/80">
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
 * 4. THU TIỀN KỲ (Radial Open Arc Gauge 69%)
 */
export function PeriodCollectionRadialGauge({
  percent = 69,
  subtitle = 'Đã thu 18/26 phòng',
  color = '#F59E0B'
}) {
  const size = 170;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  // An open arc of 280 degrees
  const arcDegree = 280;
  const arcLength = (arcDegree / 360) * (2 * Math.PI * radius);
  const totalCircumference = 2 * Math.PI * radius;
  const progressLength = (percent / 100) * arcLength;
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
            {percent}%
          </strong>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 5. HỒ SƠ KHÁCH ĐANG Ở (Comparative Stacked Bars)
 */
export function MemberDocumentsStackedBars({
  items = [
    { label: 'CCCD 2 mặt', greenVal: 2, redVal: 46 },
    { label: 'Tạm trú', greenVal: 38, redVal: 10 }
  ]
}) {
  return (
    <div className="flex flex-col justify-between h-full space-y-3.5">
      <div className="space-y-4 my-auto">
        {items.map((row) => {
          const total = row.greenVal + row.redVal || 1;
          const greenPct = (row.greenVal / total) * 100;
          const redPct = (row.redVal / total) * 100;

          return (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-20 text-xs font-semibold text-slate-600 dark:text-slate-400 truncate text-right">
                {row.label}
              </span>

              <div className="flex-1 flex rounded-lg h-7 overflow-hidden gap-1">
                {row.greenVal > 0 && (
                  <div
                    className="h-full bg-[#10B981] rounded-md flex items-center justify-center text-white text-[11px] font-black min-w-[24px] transition-all duration-500"
                    style={{ width: `${greenPct}%` }}
                  >
                    {row.greenVal}
                  </div>
                )}
                {row.redVal > 0 && (
                  <div
                    className="h-full bg-[#EF4444] rounded-md flex items-center justify-center text-white text-[11px] font-black min-w-[24px] transition-all duration-500"
                    style={{ width: `${redPct}%` }}
                  >
                    {row.redVal}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis & Legend */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 px-24">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[#10B981] rounded-xs" /> Đầy đủ
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[#F59E0B] rounded-xs" /> Thiếu 1 mặt
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-xs" /> Chưa có
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 6. THU – CHI – LỢI NHUẬN 12 THÁNG (Dual Grouped Bar + Spline Curve)
 */
export function TwelveMonthRevenueExpensesProfitChart() {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const months = [
    { m: '12/2025', rev: 40, exp: 12, profit: 28 },
    { m: '01/2026', rev: 48, exp: 14, profit: 34 },
    { m: '02/2026', rev: 52, exp: 16, profit: 36 },
    { m: '03/2026', rev: 60, exp: 18, profit: 42 },
    { m: '04/2026', rev: 68, exp: 19, profit: 49 },
    { m: '05/2026', rev: 78, exp: 21, profit: 57 },
    { m: '06/2026', rev: 85, exp: 23, profit: 62 },
    { m: '07/2026', rev: 95, exp: 25, profit: 70 },
    { m: '08/2026', rev: 110, exp: 28, profit: 82 },
    { m: '09/2026', rev: 108, exp: 27, profit: 81 },
    { m: '10/2026', rev: 105, exp: 26, profit: 79 },
    { m: '11/2026*', rev: 60, exp: 16, profit: 44, active: true }
  ];

  const chartHeight = 220;
  const chartWidth = 620;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 35;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const maxVal = 120; // 120 tr

  const stepX = innerWidth / months.length;
  const barWidth = 10;

  // Calculate coordinates for profit curve
  const profitPoints = months.map((item, idx) => {
    const x = paddingLeft + idx * stepX + stepX / 2;
    const y = paddingTop + innerHeight - (item.profit / maxVal) * innerHeight;
    return { x, y, ...item };
  });

  let lineD = `M ${profitPoints[0].x.toFixed(1)} ${profitPoints[0].y.toFixed(1)}`;
  for (let i = 0; i < profitPoints.length - 1; i++) {
    const p0 = profitPoints[i === 0 ? 0 : i - 1];
    const p1 = profitPoints[i];
    const p2 = profitPoints[i + 1];
    const p3 = profitPoints[i + 2 >= profitPoints.length ? i + 1 : i + 2];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    lineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const yTicks = [0, 20, 40, 60, 80, 100, 120];

  return (
    <div className="relative overflow-x-auto select-none">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[540px]">
        {/* Y Grid lines */}
        {yTicks.map((val) => {
          const y = paddingTop + innerHeight - (val / maxVal) * innerHeight;
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="2 3"
                className="dark:stroke-slate-800"
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] font-bold fill-slate-400"
              >
                {val === 0 ? '0' : `${val} tr`}
              </text>
            </g>
          );
        })}

        {/* Dual Bars for Each Month */}
        {months.map((item, idx) => {
          const groupCenterX = paddingLeft + idx * stepX + stepX / 2;
          const revHeight = (item.rev / maxVal) * innerHeight;
          const expHeight = (item.exp / maxVal) * innerHeight;

          const revX = groupCenterX - barWidth - 1;
          const expX = groupCenterX + 1;
          const revY = paddingTop + innerHeight - revHeight;
          const expY = paddingTop + innerHeight - expHeight;

          return (
            <g
              key={item.m}
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
                  fillOpacity="0.06"
                  rx="6"
                />
              )}

              {/* Revenue Bar (Dark Teal) */}
              <rect
                x={revX}
                y={revY}
                width={barWidth}
                height={revHeight}
                fill={item.active ? '#14b8a6' : '#0D9488'}
                rx="4"
              />

              {/* Expense Bar (Coral / Pink) */}
              <rect
                x={expX}
                y={expY}
                width={barWidth}
                height={expHeight}
                fill="#F87171"
                rx="4"
              />

              {/* Month Label on X Axis */}
              <text
                x={groupCenterX}
                y={chartHeight - 12}
                textAnchor="middle"
                className={`text-[8.5px] font-medium ${hoveredIdx === idx ? 'fill-[#0D9488] font-bold' : 'fill-slate-400'}`}
              >
                {item.m}
              </text>
            </g>
          );
        })}

        {/* Profit Spline Curve (Yellow/Gold) */}
        <path
          d={lineD}
          fill="none"
          stroke="#EAB308"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Profit Curve Dots */}
        {profitPoints.map((pt, i) => (
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
        ))}
      </svg>

      {/* Tooltip on hover */}
      {hoveredIdx !== null && (
        <div
          className="absolute top-1 pointer-events-none bg-slate-900 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-3 transform -translate-x-1/2"
          style={{
            left: `${((paddingLeft + hoveredIdx * stepX + stepX / 2) / chartWidth) * 100}%`
          }}
        >
          <span className="font-bold text-slate-300">{months[hoveredIdx].m}:</span>
          <span className="text-teal-300 font-bold">Thu: {months[hoveredIdx].rev} tr</span>
          <span className="text-rose-300 font-bold">Chi: {months[hoveredIdx].exp} tr</span>
          <span className="text-amber-300 font-black">LN: {months[hoveredIdx].profit} tr</span>
        </div>
      )}
    </div>
  );
}

/**
 * 7. CHI PHÍ 3 THÁNG (Horizontal Coral Bars)
 */
export function ThreeMonthExpensesBars({
  items = [
    { label: 'Tiền điện (EVN)', value: '20.2 tr', pct: 100 },
    { label: 'Lương, thưởng', value: '19.5 tr', pct: 96 },
    { label: 'Tiền nước', value: '5.9 tr', pct: 30 },
    { label: 'Internet / truyền...', value: '5.4 tr', pct: 26 },
    { label: 'Sửa chữa, bảo...', value: '4.2 tr', pct: 21 },
    { label: 'Vệ sinh, rác', value: '3.1 tr', pct: 15 }
  ]
}) {
  return (
    <div className="space-y-2.5 py-1">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[120px]">
              {item.label}
            </span>
            <span className="text-slate-900 dark:text-white font-black font-chivo text-xs">
              {item.value}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-md h-4 p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#EF4444] rounded-sm transition-all duration-700"
              style={{ width: `${item.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 8. HĐ HẾT HẠN 6 THÁNG TỚI (Vertical Bar Chart)
 */
export function SixMonthContractExpiryBars({
  items = [
    { month: '11/2026', val: 4, isCurrent: true },
    { month: '12/2026', val: 2 },
    { month: '01/2027', val: 3 },
    { month: '02/2027', val: 1 },
    { month: '03/2027', val: 2 },
    { month: '04/2027', val: 3 }
  ]
}) {
  const chartHeight = 170;
  const maxVal = 4;
  const paddingTop = 25;
  const paddingBottom = 30;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  return (
    <div className="relative w-full h-[170px] select-none">
      <div className="absolute inset-x-0 bottom-7 flex items-end justify-between px-2 h-[115px]">
        {items.map((item) => {
          const barHeight = (item.val / maxVal) * 105;
          const barColor = item.isCurrent ? 'bg-[#EA580C]' : 'bg-[#3B82F6]';

          return (
            <div key={item.month} className="flex flex-col items-center gap-1.5 flex-1 group">
              {/* Value on top */}
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {item.val}
              </span>

              {/* Vertical Bar */}
              <div
                className={`w-6 sm:w-7 rounded-t-md ${barColor} transition-all duration-500 group-hover:brightness-110 flex items-center justify-center`}
                style={{ height: `${barHeight}px` }}
              >
                <span className="text-[10px] font-bold text-white/90">
                  {item.val}
                </span>
              </div>

              {/* Month label */}
              <span className="text-[10px] font-semibold text-slate-400 mt-1 whitespace-nowrap">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
