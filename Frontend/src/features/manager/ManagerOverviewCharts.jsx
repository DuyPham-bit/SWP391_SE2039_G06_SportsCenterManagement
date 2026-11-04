import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

// Utility formatters
const formatShortVnd = (num) => {
  const n = Number(num || 0);
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)} tỷ`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)} tr`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${n.toLocaleString('vi-VN')}đ`;
};

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
        <div className="w-full h-[2px]" style={{ backgroundColor: color }} />
      </div>
    );
  }

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
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
 * 6. BIẾN ĐỘNG DOANH THU THỰC TẾ (Dual Grouped Bars + Spline Curve - Real DB Data)
 */
export function TwelveMonthRevenueExpensesProfitChart({ revenuePeriods = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!Array.isArray(revenuePeriods) || revenuePeriods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[28px] mb-1.5 opacity-50">monitoring</span>
        <span>Chưa có dữ liệu dòng tiền trong khoảng thời gian đã chọn.</span>
      </div>
    );
  }

  const months = revenuePeriods.map((item, idx) => {
    const rawPeriod = String(item.period || '');
    const mLabel = rawPeriod.length >= 7 ? rawPeriod.slice(5) : rawPeriod;
    const rev = Number(((item.gross || item.net || 0) / 1000000).toFixed(1));
    const exp = Number(((item.refunds || 0) / 1000000).toFixed(1));
    const profit = Number(((item.net || 0) / 1000000).toFixed(1));
    return {
      m: mLabel,
      rev,
      exp,
      profit,
      orders: item.ordersCount || 0,
      active: idx === revenuePeriods.length - 1
    };
  });

  const maxVal = Math.max(...months.map(m => Math.max(m.rev, m.exp, m.profit)), 1);
  const chartHeight = 220;
  const chartWidth = Math.max(540, months.length * 48);
  const paddingLeft = 46;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 34;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const stepX = innerWidth / months.length;
  const barWidth = Math.min(10, Math.max(4, stepX * 0.25));

  // Generate Spline Points for Profit Curve
  const splinePoints = months.map((item, idx) => {
    const x = paddingLeft + idx * stepX + stepX / 2;
    const y = paddingTop + innerHeight - (item.profit / maxVal) * innerHeight;
    return { x, y };
  });

  let splineD = `M ${splinePoints[0].x.toFixed(1)} ${splinePoints[0].y.toFixed(1)}`;
  for (let i = 0; i < splinePoints.length - 1; i++) {
    const p0 = splinePoints[i === 0 ? 0 : i - 1];
    const p1 = splinePoints[i];
    const p2 = splinePoints[i + 1];
    const p3 = splinePoints[i + 2 >= splinePoints.length ? i + 1 : i + 2];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    splineD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  return (
    <div className="relative overflow-x-auto select-none">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px]">
        {/* Y Grid lines */}
        {yTicks.map((val, idx) => {
          const y = paddingTop + innerHeight - (val / maxVal) * innerHeight;
          return (
            <g key={idx}>
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
                {val === 0 ? '0' : `${val.toFixed(1)} tr`}
              </text>
            </g>
          );
        })}

        {/* Dual Bars for Each Period */}
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
                rx="3"
                className="transition-all duration-300"
              />

              {/* Refund/Expense Bar (Coral / Pink) */}
              <rect
                x={expX}
                y={expY}
                width={barWidth}
                height={expHeight}
                fill={item.active ? '#f87171' : '#F43F5E'}
                rx="3"
                className="transition-all duration-300"
              />

              {/* X Label */}
              <text
                x={groupCenterX}
                y={chartHeight - 12}
                textAnchor="middle"
                className={`text-[8.5px] font-bold ${
                  item.active ? 'fill-[#EA580C] font-black' : 'fill-slate-400'
                }`}
              >
                {item.m}
              </text>
            </g>
          );
        })}

        {/* Spline Profit Line (Gold) */}
        <path
          d={splineD}
          fill="none"
          stroke="#EAB308"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-xs"
        />

        {/* Spline Dots */}
        {splinePoints.map((pt, i) => (
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
          <span className="text-rose-300 font-bold">Hoàn: {months[hoveredIdx].exp} tr</span>
          <span className="text-amber-300 font-black">Thực thu: {months[hoveredIdx].profit} tr</span>
        </div>
      )}
    </div>
  );
}

/**
 * 7. DOANH THU THEO BỘ MÔN (Horizontal Bars - Real DB Data)
 */
export function ThreeMonthExpensesBars({ items = [], emptyText = 'Chưa có doanh thu theo bộ môn trong kỳ.' }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[24px] mb-1 opacity-50">pie_chart</span>
        <span>{emptyText}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 py-1">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[130px]">
              {item.label}
            </span>
            <span className="text-slate-900 dark:text-white font-black font-chivo text-xs">
              {item.value} {item.pct ? `(${item.pct}%)` : ''}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-md h-3.5 p-0.5 overflow-hidden">
            <div
              className="h-full bg-[#0D9488] rounded-sm transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(5, item.pct || 10))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 8. LƯỢT ĐẶT THEO LỚP HỌC (Vertical Bar Chart - Real DB Data)
 */
export function SixMonthContractExpiryBars({ items = [], emptyText = 'Chưa có lớp học nào hoạt động trong kỳ.' }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[170px] text-center text-xs text-slate-400">
        <span className="material-symbols-outlined text-[24px] mb-1 opacity-50">event_seat</span>
        <span>{emptyText}</span>
      </div>
    );
  }

  const chartHeight = 170;
  const maxVal = Math.max(...items.map(i => Number(i.val || 0)), 1);

  return (
    <div className="relative w-full h-[170px] select-none">
      <div className="absolute inset-x-0 bottom-6 flex items-end justify-between px-2 h-[120px]">
        {items.map((item, idx) => {
          const valNum = Number(item.val || 0);
          const barHeight = (valNum / maxVal) * 95;
          const barColor = item.isCurrent ? 'bg-[#EA580C]' : 'bg-[#3B82F6]';

          return (
            <div key={item.month + idx} className="flex flex-col items-center gap-1.5 flex-1 group">
              {/* Value on top */}
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {valNum}
              </span>

              {/* Vertical Bar */}
              <div
                className={`w-6 sm:w-7 rounded-t-md ${barColor} transition-all duration-500 group-hover:brightness-110 flex items-center justify-center`}
                style={{ height: `${Math.max(16, barHeight)}px` }}
              >
                <span className="text-[10px] font-bold text-white/90">
                  {valNum}
                </span>
              </div>

              {/* Label */}
              <span className="text-[10px] font-semibold text-slate-400 mt-1 truncate max-w-[48px] text-center" title={item.month}>
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
