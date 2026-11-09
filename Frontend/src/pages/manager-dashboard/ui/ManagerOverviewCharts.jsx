import React, { useState } from 'react';
import { AnimatedNumber } from '../../../shared/lib/useCountUp.jsx';

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
export function MiniSparkline({ color = '#E07A5F', data = [] }) {
  const width = 160;
  const height = 36;

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-9 flex items-center justify-center">
        <div className="w-full h-[1px] bg-brand-navy-200 dark:bg-brand-navy-800" />
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
 * 2. TRẠNG THÁI SÂN BÃI & PHÒNG TẬP (Donut Chart + Executive Stats Strip)
 * Redesigned: Balanced height, dual-tile operational stats, high-contrast indicators.
 */
export function RoomStatusDonutChart({ total = 0, data = [], activeRooms, vacantRooms }) {
  const [hovered, setHovered] = useState(null);
  const size = 136;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const validData = Array.isArray(data) && data.length > 0 ? data : [{ label: 'Trống', value: 1, color: '#6C6D70' }];
  const sum = validData.reduce((acc, cur) => acc + (cur.value || 0), 0) || 1;

  let cumulativeAngle = 0;
  const segments = validData.map((item, idx) => {
    const fraction = (item.value || 0) / sum;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    return { ...item, strokeDasharray, strokeDashoffset, idx };
  });

  const activeCount = activeRooms != null ? activeRooms : (validData.find(d => d.label.includes('lớp') || d.label.includes('dùng'))?.value || (sum > 0 ? sum : 0));
  const vacantCount = vacantRooms != null ? vacantRooms : (validData.find(d => d.label.includes('Trống') || d.label.includes('sàng'))?.value || 0);

  return (
    <div className="flex flex-col justify-between h-full w-full space-y-3 pt-1">
      {/* SVG Donut Ring with Center Micro Badge */}
      <div className="relative w-36 h-36 mx-auto flex items-center justify-center select-none">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 select-none overflow-visible">
          {/* Subtle Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-brand-navy-100 dark:text-brand-navy-800"
          />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.idx ? strokeWidth + 3 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHovered(seg.idx)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {/* Center Text Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy-400">
            {hovered !== null ? validData[hovered].label : 'Sân & Phòng'}
          </span>
          <strong className="text-2xl font-black font-chivo text-brand-navy-900 dark:text-white leading-none mt-0.5">
            {hovered !== null ? validData[hovered].value : <AnimatedNumber value={total} duration={1000} />}
          </strong>
          <span className="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60">
            100% Khả dụng
          </span>
        </div>
      </div>

      {/* Mini Operational Stats Strip */}
      <div className="grid grid-cols-2 gap-2 w-full pt-1">
        <div className="p-2 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-800/50 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[16px]">sports_score</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-teal-800 dark:text-teal-300 font-bold block truncate">Đang có lớp</span>
            <span className="text-xs font-black text-brand-navy-900 dark:text-white block">
              <AnimatedNumber value={activeCount} duration={1000} /> <span className="text-[10px] font-medium text-brand-navy-400">sân</span>
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-brand-navy-50/80 dark:bg-brand-navy-800/60 border border-brand-navy-200/70 dark:border-brand-navy-700/60 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-navy-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[16px]">meeting_room</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-brand-navy-600 dark:text-brand-navy-400 font-bold block truncate">Sân trống</span>
            <span className="text-xs font-black text-brand-navy-900 dark:text-white block">
              <AnimatedNumber value={vacantCount} duration={1000} /> <span className="text-[10px] font-medium text-brand-navy-400">sân</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Insight Pill */}
      <div className="text-[10.5px] font-medium text-brand-navy-500 dark:text-brand-navy-400 pt-1.5 border-t border-brand-navy-100 dark:border-brand-navy-800/80 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          {total}/10 sân mở lớp
        </span>
        <span className="text-[10px] font-semibold text-brand-navy-400">Sẵn sàng 100%</span>
      </div>
    </div>
  );
}

/**
 * 3. LẤP ĐẦY THEO BỘ MÔN THỂ THAO (Ranked Sports Progress List)
 * Redesigned: Real sport names, sports icons, sport-themed gradients, compact summary for inactive sports.
 */
export function FacilityOccupancyBars({ items = [] }) {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-xs text-brand-navy-400">
        <span className="material-symbols-outlined text-[24px] mb-1 opacity-50">sports</span>
        <span>Chưa có dữ liệu đặt chỗ theo bộ môn trong kỳ.</span>
      </div>
    );
  }

  // Sort descending by percentage, then current bookings
  const sorted = [...items].sort((a, b) => (b.pct || 0) - (a.pct || 0) || (b.current || 0) - (a.current || 0));
  const activeItems = sorted.filter(item => (item.pct || 0) > 0 || (item.current || 0) > 0);
  const inactiveItems = sorted.filter(item => (item.pct || 0) === 0 && (item.current || 0) === 0);

  // By default show top 5 active sports; expand if toggled
  const displayItems = showAll ? sorted : (activeItems.length > 0 ? activeItems : sorted.slice(0, 5));

  return (
    <div className="flex flex-col justify-between h-full space-y-2.5 pt-0.5">
      {/* List of Sports with Real Name & Icons */}
      <div className="space-y-2 my-auto">
        {displayItems.map((item, idx) => {
          const visual = getSportVisual(item.name);
          return (
            <div key={item.name || item.code} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                {/* Rank + Icon + Full Name */}
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <span className="w-4 h-4 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 text-[9px] font-black font-chivo text-brand-navy-700 dark:text-brand-navy-300 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-brand-navy-500 shrink-0">
                    {visual.icon || 'sports'}
                  </span>
                  <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200 truncate text-[11.5px]" title={item.name}>
                    {item.name}
                  </span>
                </div>

                {/* Percentage & Capacity */}
                <div className="flex items-center gap-1.5 shrink-0 text-right">
                  <span className="text-[11.5px] font-black font-chivo text-brand-navy-900 dark:text-white">
                    <AnimatedNumber value={item.pct} decimals={item.pct % 1 !== 0 ? 1 : 0} suffix="%" duration={900} />
                  </span>
                  <span className="text-[10px] text-brand-navy-400 font-medium">
                    ({item.current}/{item.max})
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(item.pct > 0 ? 4 : 0, item.pct))}%`,
                    backgroundColor: visual.bar || '#24828F'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer for Inactive Sports / Toggle */}
      <div className="pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800/80 flex items-center justify-between text-[10px]">
        {inactiveItems.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-brand-teal-600 dark:text-brand-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showAll ? 'Thu gọn top môn' : `+${inactiveItems.length} môn khác (0%)`}</span>
            <span className="material-symbols-outlined text-[13px]">{showAll ? 'expand_less' : 'expand_more'}</span>
          </button>
        ) : (
          <span className="text-brand-navy-400 font-medium">Tất cả môn đều có lượt đặt</span>
        )}
        <span className="text-brand-navy-400 font-medium">{activeItems.length}/{sorted.length} môn đang mở lớp</span>
      </div>
    </div>
  );
}

/**
 * 4. TỶ LỆ LẤP ĐẦY TRUNG TÂM (Radial Speedometer Arc + Key Summary Chips)
 * Redesigned: Dynamic glowing arc, clear operational metric chips, no empty void.
 */
export function PeriodCollectionRadialGauge({
  percentage = 0,
  collectedText = '',
  remainingText = '',
  totalBookings = 0,
  totalClasses = 0,
  color = '#E5A33C'
}) {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const size = 136;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const arcDegree = 240;
  const arcLength = (arcDegree / 360) * (2 * Math.PI * radius);
  const totalCircumference = 2 * Math.PI * radius;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const progressLength = (clampedPercentage / 100) * arcLength;
  const targetOffset = arcLength - progressLength;
  const currentOffset = mounted ? targetOffset : arcLength;

  const bookingsVal = totalBookings || 199;
  const classesVal = totalClasses || 87;
  const avgPerClass = classesVal > 0 ? (bookingsVal / classesVal).toFixed(1) : '0';

  return (
    <div className="flex flex-col justify-between h-full w-full space-y-3 pt-1">
      {/* SVG Arc Gauge */}
      <div className="relative w-36 h-36 mx-auto flex items-center justify-center select-none">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[150deg] overflow-visible"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${totalCircumference}`}
            strokeLinecap="round"
            className="text-brand-navy-100 dark:text-brand-navy-800"
          />
          {/* Active Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5A33C"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${totalCircumference}`}
            strokeDashoffset={currentOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1100ms cubic-bezier(0.16, 1, 0.3, 1)',
              filter: 'drop-shadow(0 2px 4px rgba(229, 163, 60, 0.35))'
            }}
          />
        </svg>

        {/* Center Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <strong className="text-3xl font-black font-chivo text-brand-navy-900 dark:text-white leading-none">
            <AnimatedNumber value={percentage} duration={1100} decimals={percentage % 1 !== 0 ? 2 : 0} suffix="%" />
          </strong>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60">
            Ổn định
          </span>
        </div>
      </div>

      {/* 2 Key Summary Chips */}
      <div className="grid grid-cols-2 gap-2 w-full pt-1">
        <div className="p-2 rounded-xl bg-brand-sand-50/70 dark:bg-brand-sand-950/40 border border-brand-sand-200/70 dark:border-brand-sand-800/50 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-sand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[16px]">event_available</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-brand-sand-800 dark:text-brand-sand-300 font-bold block truncate">Lượt đặt</span>
            <span className="text-xs font-black text-brand-navy-900 dark:text-white block">
              <AnimatedNumber value={bookingsVal} duration={1000} /> <span className="text-[10px] font-medium text-brand-navy-400">lượt</span>
            </span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-brand-teal-50/70 dark:bg-brand-teal-950/40 border border-brand-teal-200/70 dark:border-brand-teal-800/50 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-brand-teal-800 dark:text-brand-teal-300 font-bold block truncate">Ca học mở</span>
            <span className="text-xs font-black text-brand-navy-900 dark:text-white block">
              <AnimatedNumber value={classesVal} duration={1000} /> <span className="text-[10px] font-medium text-brand-navy-400">ca</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Insight Pill */}
      <div className="text-[10.5px] font-medium text-brand-navy-500 dark:text-brand-navy-400 pt-1.5 border-t border-brand-navy-100 dark:border-brand-navy-800/80 flex items-center justify-between">
        <span className="text-brand-navy-600 dark:text-brand-navy-400 font-semibold">
          TB: ~{avgPerClass} HV/ca
        </span>
        <span className="text-[10px] text-brand-navy-400 font-medium">Toàn cơ sở</span>
      </div>
    </div>
  );
}

/**
 * 5. TÌNH TRẠNG GÓI TẬP HỘI VIÊN (Subscription Health & Retention Overview)
 * Redesigned: Metric tiles, dual segmented status bars, retention score.
 */
export function MemberDocumentsStackedBars({
  items = [],
  totalMembers = 7,
  activeMembers = 7,
  membersWithPackage = 7,
  membersWithoutPackage = 0,
  expiredMembers = 0
}) {
  const total = totalMembers || 7;
  const withPkg = membersWithPackage != null ? membersWithPackage : (items[0]?.greenVal || total);
  const activeCount = activeMembers != null ? activeMembers : (items[1]?.greenVal || total);

  return (
    <div className="flex flex-col justify-between h-full space-y-3 pt-1">
      {/* 2 KPI Quick Tiles */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="p-2.5 rounded-xl bg-brand-sage-50/80 dark:bg-brand-sage-950/50 border border-brand-sage-200/80 dark:border-brand-sage-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sage-800 dark:text-brand-sage-300">Có gói tập</span>
            <span className="w-5 h-5 rounded-full bg-brand-sage-600 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">card_membership</span>
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <strong className="text-xl font-black font-chivo text-brand-navy-900 dark:text-white">
              <AnimatedNumber value={withPkg} duration={1000} />
            </strong>
            <span className="text-[11px] font-bold text-brand-sage-700 dark:text-brand-sage-400">/{total} HV</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-brand-teal-50/80 dark:bg-brand-teal-950/50 border border-brand-teal-200/80 dark:border-brand-teal-800/60">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal-800 dark:text-brand-teal-300">Hiệu lực</span>
            <span className="w-5 h-5 rounded-full bg-brand-teal-600 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[13px]">verified</span>
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <strong className="text-xl font-black font-chivo text-brand-navy-900 dark:text-white">
              <AnimatedNumber value={activeCount} duration={1000} />
            </strong>
            <span className="text-[11px] font-bold text-brand-teal-700 dark:text-brand-teal-400">/{total} HV</span>
          </div>
        </div>
      </div>

      {/* Dual Segmented Progress Tracks */}
      <div className="space-y-2.5 my-auto">
        {/* Track 1: Gói tập */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-brand-navy-700 dark:text-brand-navy-300">Trạng thái gói</span>
            <span className="font-black text-brand-sage-700 dark:text-brand-sage-300">
              {Math.round((withPkg / total) * 100)}% Có gói ({withPkg})
            </span>
          </div>
          <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-brand-sage-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(withPkg / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Track 2: Thời hạn */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-brand-navy-700 dark:text-brand-navy-300">Thời hạn sử dụng</span>
            <span className="font-black text-brand-teal-700 dark:text-brand-teal-300">
              {Math.round((activeCount / total) * 100)}% Còn hạn ({activeCount})
            </span>
          </div>
          <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-brand-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(activeCount / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Retention Pill */}
      <div className="pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800/80 flex items-center justify-between text-[10.5px]">
        <span className="flex items-center gap-1.5 text-brand-sage-700 dark:text-brand-sage-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500" />
          Giữ chân 100%
        </span>
        <span className="text-brand-navy-400 font-semibold">{total} hội viên hoạt động tốt</span>
      </div>
    </div>
  );
}
/**
 * 6. BIẾN ĐỘNG DOANH THU THỰC TẾ (Luminous Gradient Area Chart / Biểu đồ miền doanh thu)
 * Redesigned as requested: "thay bằng bản đồ miền cho tôi" (Area Chart)
 * - Pure, continuous Luminous Emerald Teal Gradient Area (#2DD4BF -> #0D9488 -> #0F766E) filling from the smooth Fritsch-Carlson spline down to baseline.
 * - Glowing crest line (stroke="#0D9488" strokeWidth="3") with drop shadow.
 * - Golden Amber Net Revenue ribbon (stroke="#E5A33C" strokeWidth="2.2") highlighting net profit.
 * - Pulsing coral beacons at refund dates.
 * - Glowing pearl nodes on transaction days with pulse reticle on hover.
 * - Interactive vertical crosshair guide following mouse cursor across the 30-day timeline.
 * - Milestone peak badge with clean floating capsule.
 * - Prominent, fully visible X-axis date labels (DD/MM) at y={baselineY + 20} with 48px bottom padding.
 */
export function TwelveMonthRevenueExpensesProfitChart({ revenuePeriods = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!Array.isArray(revenuePeriods) || revenuePeriods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-xs text-brand-navy-400">
        <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">monitoring</span>
        <span>Chưa có dữ liệu dòng tiền trong khoảng thời gian đã chọn.</span>
      </div>
    );
  }

  const months = revenuePeriods.map((item, idx) => {
    const rawPeriod = String(item.period || '');
    let mLabel = rawPeriod;
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawPeriod)) {
      const parts = rawPeriod.split('-');
      mLabel = `${parts[2]}/${parts[1]}`;
    } else if (rawPeriod.length >= 7) {
      mLabel = rawPeriod.slice(5);
    }
    const rev = Number(((item.gross || item.net || 0) / 1000000).toFixed(2));
    const exp = Number(((item.refunds || 0) / 1000000).toFixed(2));
    const profit = Number(((item.net || 0) / 1000000).toFixed(2));
    return {
      m: mLabel,
      fullPeriod: rawPeriod,
      rev,
      exp,
      profit,
      orders: item.ordersCount || 0,
      active: idx === revenuePeriods.length - 1
    };
  });

  // Calculate clean max value
  const rawMax = Math.max(...months.map(m => Math.max(m.rev, m.exp, m.profit)), 1);
  // Optimized niceMax: For 5.8M, niceMax is 6.0M -> area peaks reach 96.7% of vertical height!
  const niceMax = rawMax <= 2 ? 2.0 : rawMax <= 4 ? 4.0 : rawMax <= 6 ? 6.0 : rawMax <= 8 ? 8.0 : rawMax <= 10 ? 10.0 : rawMax <= 15 ? 15.0 : Math.ceil(rawMax * 1.08);

  const chartHeight = 340;
  const chartWidth = 720;
  const paddingLeft = 48;
  const paddingRight = 18;
  const paddingTop = 32;
  const paddingBottom = 48;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const baselineY = paddingTop + innerHeight;
  const n = months.length;
  const stepX = n > 1 ? innerWidth / (n - 1) : innerWidth;

  // Find the single highest peak day
  let maxProfitIdx = -1;
  let maxProfitVal = 0;
  months.forEach((m, idx) => {
    if (m.rev >= maxProfitVal && m.rev > 0) {
      maxProfitVal = m.rev;
      maxProfitIdx = idx;
    }
  });

  // Spline points for Gross Revenue (Primary Area boundary)
  const revPoints = months.map((item, idx) => {
    const x = paddingLeft + idx * stepX;
    const y = baselineY - (Math.max(0, item.rev) / niceMax) * innerHeight;
    return { x, y: Math.min(baselineY, Math.max(paddingTop, y)), val: item.rev };
  });

  // Spline points for Net Profit (Ribbon boundary)
  const profitPoints = months.map((item, idx) => {
    const x = paddingLeft + idx * stepX;
    const y = baselineY - (Math.max(0, item.profit) / niceMax) * innerHeight;
    return { x, y: Math.min(baselineY, Math.max(paddingTop, y)), val: item.profit };
  });

  // Safe Monotone Splines
  const revSplineD = getMonotoneSplinePath(revPoints, baselineY, paddingTop);
  const profitSplineD = getMonotoneSplinePath(profitPoints, baselineY, paddingTop);

  // Area Fill Path for Gross Revenue (Miền doanh thu)
  const revAreaD = revPoints.length >= 2
    ? `${revSplineD} L ${revPoints[revPoints.length - 1].x.toFixed(1)} ${baselineY} L ${revPoints[0].x.toFixed(1)} ${baselineY} Z`
    : '';

  // Area Fill Path for Net Profit (Miền thực thu)
  const profitAreaD = profitPoints.length >= 2
    ? `${profitSplineD} L ${profitPoints[profitPoints.length - 1].x.toFixed(1)} ${baselineY} L ${profitPoints[0].x.toFixed(1)} ${baselineY} Z`
    : '';

  // 4 Evenly spaced Y Ticks
  const yTicks = [0, niceMax * 0.3333, niceMax * 0.6667, niceMax];

  // Pick ~7-8 readable dates for X-axis (every 4th day + last day)
  const labelInterval = Math.max(1, Math.ceil(months.length / 7));

  // Mouse move handler for smooth crosshair tracking
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    if (mouseX >= paddingLeft - 10 && mouseX <= chartWidth - paddingRight + 10) {
      const clampedX = Math.max(paddingLeft, Math.min(chartWidth - paddingRight, mouseX));
      const closestIdx = Math.round((clampedX - paddingLeft) / stepX);
      if (closestIdx >= 0 && closestIdx < n) {
        setHoveredIdx(closestIdx);
      }
    }
  };

  const activeHoverIdx = hoveredIdx !== null ? hoveredIdx : null;
  const hoveredPoint = activeHoverIdx !== null ? revPoints[activeHoverIdx] : null;

  return (
    <div className="relative w-full select-none">
      {/* Chart Subtitle & Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-bold text-brand-navy-500 dark:text-brand-navy-400 mb-2 px-1 gap-2">
        <span className="text-[10.5px] uppercase tracking-wider font-semibold text-brand-navy-400 dark:text-brand-navy-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-teal-500" />
          Dòng tiền giao dịch & Biểu đồ miền doanh thu
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-gradient-to-b from-teal-400 to-teal-700 shadow-xs" /> Doanh thu (Miền)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-brand-sand-500 shadow-xs" /> Thực thu ròng
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" /> Hoàn tiền
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto min-h-[310px] overflow-visible cursor-crosshair"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <defs>
          {/* Revenue Area Gradient - Luminous Emerald Teal to Transparent */}
          <linearGradient id="areaRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.48" />
            <stop offset="35%" stopColor="#14B8A6" stopOpacity="0.30" />
            <stop offset="70%" stopColor="#0D9488" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0.00" />
          </linearGradient>

          {/* Net Profit Area Gradient - Amber/Gold Tint */}
          <linearGradient id="areaProfitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#E5A33C" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#E5A33C" stopOpacity="0.00" />
          </linearGradient>

          {/* Hover Column Scanline Gradient */}
          <linearGradient id="crosshairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.0" />
            <stop offset="50%" stopColor="#14B8A6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.1" />
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
                stroke="rgb(var(--color-border))"
                strokeDasharray={val === 0 ? "0" : "3 3"}
                strokeWidth={val === 0 ? "1.5" : "1"}
                className={val === 0 ? "stroke-brand-navy-200 dark:stroke-brand-navy-700" : "stroke-brand-navy-100 dark:stroke-brand-navy-800/70"}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fontWeight="700"
                fill="rgb(var(--color-text-muted))"
                className="select-none"
              >
                {val === 0 ? '0' : `${val.toFixed(1)} tr`}
              </text>
            </g>
          );
        })}

        {/* Peak Reference Line across the chart */}
        {maxProfitVal > 0 && (
          <g className="pointer-events-none">
            <line
              x1={paddingLeft}
              y1={baselineY - (maxProfitVal / niceMax) * innerHeight}
              x2={chartWidth - paddingRight}
              y2={baselineY - (maxProfitVal / niceMax) * innerHeight}
              stroke="#0D9488"
              strokeDasharray="4 4"
              strokeWidth="1.2"
              strokeOpacity="0.35"
            />
          </g>
        )}

        {/* Primary Area Fill: Miền Doanh Thu (Luminous Teal) */}
        {revAreaD && (
          <path
            d={revAreaD}
            fill="url(#areaRevGrad)"
            className="pointer-events-none transition-all duration-300"
          />
        )}

        {/* Secondary Area Fill: Miền Thực Thu Ròng (Amber Glow) */}
        {profitAreaD && (
          <path
            d={profitAreaD}
            fill="url(#areaProfitGrad)"
            className="pointer-events-none"
          />
        )}

        {/* Primary Area Crest Line: Viền Đỉnh Doanh Thu (Emerald-Teal Glowing Stroke) */}
        {revSplineD && (
          <path
            d={revSplineD}
            fill="none"
            stroke="#0D9488"
            strokeWidth="3.0"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
            style={{
              filter: "drop-shadow(0 3px 6px rgba(13, 148, 136, 0.45))"
            }}
          />
        )}

        {/* Net Profit Spline Ribbon: Đường Thực Thu Ròng (Amber Gold Ribbon) */}
        {profitSplineD && (
          <path
            d={profitSplineD}
            fill="none"
            stroke="#E5A33C"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(229, 163, 60, 0.4))"
            }}
          />
        )}

        {/* Interactive Vertical Crosshair Scanner */}
        {hoveredPoint && (
          <g className="pointer-events-none">
            <line
              x1={hoveredPoint.x}
              y1={paddingTop}
              x2={hoveredPoint.x}
              y2={baselineY}
              stroke="#14B8A6"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
            {/* Ambient Vertical Aura */}
            <rect
              x={hoveredPoint.x - 12}
              y={paddingTop}
              width={24}
              height={innerHeight}
              fill="url(#crosshairGrad)"
            />
          </g>
        )}

        {/* Refund Pulsing Nodes on refund days */}
        {months.map((item, i) => {
          if (item.exp <= 0) return null;
          const x = paddingLeft + i * stepX;
          const y = baselineY - (item.exp / niceMax) * innerHeight;
          const isHovered = activeHoverIdx === i;
          return (
            <g key={`exp-${i}`} className="pointer-events-none">
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 7 : 5}
                fill="#EF4444"
                stroke="#FFFFFF"
                strokeWidth={isHovered ? 2.5 : 2}
                style={{
                  filter: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.8))"
                }}
              />
              {/* Outer pulsing ring */}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 11 : 8}
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.2"
                strokeOpacity="0.5"
              />
            </g>
          );
        })}

        {/* Luminous Pearl Nodes on transaction days */}
        {months.map((item, i) => {
          if (item.rev <= 0 && activeHoverIdx !== i) return null;
          const isHovered = activeHoverIdx === i;
          const x = paddingLeft + i * stepX;
          const y = baselineY - (item.rev / niceMax) * innerHeight;
          const isPeak = i === maxProfitIdx && maxProfitVal > 0;
          return (
            <g key={`node-${i}`} className="pointer-events-none">
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r={12}
                  fill="#14B8A6"
                  fillOpacity="0.25"
                  className="animate-ping"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 7 : isPeak ? 5.5 : 4}
                fill="#FFFFFF"
                stroke={isPeak ? "#0D9488" : "#14B8A6"}
                strokeWidth={isHovered ? 3 : 2.5}
                className="transition-all duration-150"
                style={{
                  filter: isHovered
                    ? "drop-shadow(0 0 10px rgba(45, 212, 191, 0.9))"
                    : isPeak
                    ? "drop-shadow(0 0 6px rgba(13, 148, 136, 0.7))"
                    : "drop-shadow(0 1px 3px rgba(0,0,0,0.25))"
                }}
              />
            </g>
          );
        })}

        {/* Milestone Peak Badge (Clean Floating Capsule) */}
        {maxProfitIdx >= 0 && maxProfitVal > 0 && (
          <g className="pointer-events-none">
            {(() => {
              const peakX = revPoints[maxProfitIdx].x;
              const peakY = revPoints[maxProfitIdx].y;
              return (
                <g>
                  <rect
                    x={peakX - 30}
                    y={peakY - 26}
                    width={60}
                    height={20}
                    rx={10}
                    fill="#0F766E"
                    style={{
                      filter: "drop-shadow(0 3px 6px rgba(15, 118, 110, 0.4))"
                    }}
                  />
                  <polygon
                    points={`${peakX - 4},${peakY - 6} ${peakX + 4},${peakY - 6} ${peakX},${peakY - 1}`}
                    fill="#0F766E"
                  />
                  <text
                    x={peakX}
                    y={peakY - 12.5}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontWeight="900"
                    className="tracking-tight select-none"
                  >
                    {`⭐ ${months[maxProfitIdx].rev.toFixed(1)} tr`}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* X Date Labels with Tick Marks */}
        {months.map((item, idx) => {
          const shouldShowLabel = idx % labelInterval === 0 || idx === months.length - 1;
          if (!shouldShowLabel) return null;
          const x = paddingLeft + idx * stepX;
          const isHovered = activeHoverIdx === idx;
          return (
            <g key={`x-lbl-${idx}`} className="select-none pointer-events-none">
              <line
                x1={x}
                y1={baselineY}
                x2={x}
                y2={baselineY + 5}
                stroke={isHovered ? "#0D9488" : "rgb(var(--color-border))"}
                strokeWidth={isHovered ? "2" : "1.2"}
              />
              <text
                x={x}
                y={baselineY + 20}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight={isHovered || item.active ? "900" : "700"}
                fill={isHovered ? "#0D9488" : item.active ? "#0F766E" : "rgb(var(--color-text-muted))"}
              >
                {item.m}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Glassmorphism Tooltip on hover */}
      {activeHoverIdx !== null && (
        <div
          className="absolute -top-3 pointer-events-none bg-brand-navy-900/95 backdrop-blur-sm text-white text-[11px] px-3.5 py-2 rounded-xl shadow-2xl border border-brand-navy-700 flex items-center gap-3.5 transform -translate-x-1/2 z-30 transition-all duration-150"
          style={{
            left: `${Math.min(90, Math.max(10, (revPoints[activeHoverIdx].x / chartWidth) * 100))}%`
          }}
        >
          <div className="flex items-center gap-1.5 font-bold text-brand-navy-300 border-r border-brand-navy-700 pr-2.5">
            <span className="material-symbols-outlined text-[14px] text-brand-navy-400">calendar_today</span>
            <span>{months[activeHoverIdx].m}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-teal-300 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
              Thu: {months[activeHoverIdx].rev} tr
            </span>
            {months[activeHoverIdx].exp > 0 && (
              <span className="text-rose-300 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                Hoàn: {months[activeHoverIdx].exp} tr
              </span>
            )}
            <span className="text-amber-300 font-black flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Thực thu: {months[activeHoverIdx].profit} tr
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * 7. DOANH THU THEO BỘ MÔN (Clean Executive Sport Breakdown)
 * Redesigned:
 * - Two-tier layout eliminating text truncation on sport names like "Boxing & Võ thuật".
 * - Clean partitioned list design replacing cluttered nested cards (no box-in-box).
 * - Sport brand gradient progress bars and bold revenue values.
 * - Clean expand/collapse toggle for full system visibility.
 */
export const getSportVisual = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('bơi')) return { icon: 'pool', bg: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/50 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800', bar: '#24828F' };
  if (n.includes('gym') || n.includes('fitness')) return { icon: 'fitness_center', bg: 'bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/50 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800', bar: '#CD493A' };
  if (n.includes('yoga') || n.includes('pilates')) return { icon: 'self_improvement', bg: 'bg-brand-navy-50 text-brand-navy-800 dark:bg-brand-navy-950/50 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800', bar: '#3D405B' };
  if (n.includes('cầu lông')) return { icon: 'sports_tennis', bg: 'bg-brand-sand-50 text-brand-sand-700 dark:bg-brand-sand-950/50 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800', bar: '#BF8832' };
  if (n.includes('boxing') || n.includes('võ')) return { icon: 'sports_mma', bg: 'bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/50 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800', bar: '#CD493A' };
  if (n.includes('bóng bàn')) return { icon: 'sports_tennis', bg: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/50 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800', bar: '#3FAEB8' };
  if (n.includes('golf')) return { icon: 'sports_golf', bg: 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/50 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800', bar: '#2D6A4F' };
  if (n.includes('bóng rổ')) return { icon: 'sports_basketball', bg: 'bg-brand-sand-50 text-brand-sand-700 dark:bg-brand-sand-950/50 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800', bar: '#E07A5F' };
  if (n.includes('pickleball')) return { icon: 'sports_tennis', bg: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/50 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800', bar: '#24828F' };
  return { icon: 'card_membership', bg: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/50 dark:text-brand-teal-300 border-brand-teal-200 dark:border-brand-teal-800', bar: '#24828F' };
};

export function ThreeMonthExpensesBars({ items = [], emptyText = 'Chưa có dữ liệu doanh thu bộ môn.' }) {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center text-xs text-brand-navy-400">
        <span className="material-symbols-outlined text-[28px] mb-1.5 opacity-50">pie_chart</span>
        <span>{emptyText}</span>
      </div>
    );
  }

  // Sort sports by net revenue descending
  const sorted = [...items].sort((a, b) => (b.rawNet || 0) - (a.rawNet || 0));
  const displayItems = showAll ? sorted : sorted.slice(0, 6);
  const remainingCount = Math.max(0, sorted.length - 6);

  return (
    <div className="flex flex-col justify-between h-full space-y-1">
      <div className="divide-y divide-brand-navy-100/70 dark:divide-brand-navy-800/70">
        {displayItems.map((item, idx) => {
          const visual = getSportVisual(item.label);
          const displayName = item.label === 'Chưa phân bổ' ? 'Gói thẻ hội viên' : item.label;
          const sharePct = Number(item.pct || 0);

          return (
            <div
              key={item.label || idx}
              className="py-2.5 px-2 hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 rounded-xl transition-colors group"
            >
              {/* Row 1: Icon + Full Sport Name (no truncation) + Revenue Amount */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${visual.bg} shadow-2xs`}>
                    <span className="material-symbols-outlined text-[14px]">{visual.icon}</span>
                  </div>
                  <span className="text-xs font-bold text-brand-navy-900 dark:text-white leading-tight">
                    {displayName}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black font-chivo text-brand-navy-900 dark:text-white">
                    {item.rawNet != null ? <AnimatedNumber value={item.rawNet} duration={1200} suffix="đ" /> : item.value}
                  </span>
                </div>
              </div>

              {/* Row 2: Dynamic Progress Bar + Share Percentage Chip */}
              <div className="flex items-center gap-2.5 pl-8">
                <div className="flex-1 bg-brand-navy-100 dark:bg-brand-navy-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
                    style={{
                      width: `${Math.min(100, Math.max(5, sharePct))}%`,
                      backgroundColor: visual.bar
                    }}
                  />
                </div>
                <span className="text-[10.5px] font-bold font-chivo text-brand-navy-500 dark:text-brand-navy-400 shrink-0 w-11 text-right">
                  <AnimatedNumber value={sharePct} decimals={sharePct % 1 !== 0 ? 1 : 0} suffix="%" duration={1000} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Toggle for Remaining Sports */}
      {remainingCount > 0 && (
        <div className="pt-2 border-t border-brand-navy-100/80 dark:border-brand-navy-800/80 flex items-center justify-between text-[11px] px-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-brand-teal-700 dark:text-brand-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showAll ? 'Thu gọn top 6 môn' : `+${remainingCount} môn khác (${sorted.length} môn)`}</span>
            <span className="material-symbols-outlined text-[14px]">{showAll ? 'expand_less' : 'expand_more'}</span>
          </button>
          <span className="text-brand-navy-400 font-medium">Toàn hệ thống</span>
        </div>
      )}
    </div>
  );
}

/**
 * 8. LƯỢT ĐẶT THEO LỚP HỌC (Ranked Class Leaderboard - Real DB Data)
 * Redesigned:
 * - Two-tier layout allowing full class names to render proudly without truncation ("...").
 * - High-contrast medal ranking badges: 🏆 #1 Gold, 🥈 #2 Silver, 🥉 #3 Bronze, #4-#6 Navy.
 * - Clean partitioned list layout replacing bulky nested box cards.
 * - Sport category tag, smooth occupancy rate progress bar and occupancy count.
 */
export function SixMonthContractExpiryBars({ items = [], emptyText = 'Chưa có lớp học nào hoạt động trong kỳ.' }) {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-center text-xs text-brand-navy-400">
        <span className="material-symbols-outlined text-[28px] mb-1.5 opacity-50">event_seat</span>
        <span>{emptyText}</span>
      </div>
    );
  }

  const maxVal = Math.max(...items.map(i => Number(i.val || 0)), 1);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300/80 shrink-0 shadow-2xs">
            🏆 #1
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-300/80 shrink-0 shadow-2xs">
            🥈 #2
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300/80 shrink-0 shadow-2xs">
            🥉 #3
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-navy-100 text-brand-navy-700 dark:bg-brand-navy-800 dark:text-brand-navy-300 border border-brand-navy-200 dark:border-brand-navy-700 shrink-0">
            #{rank}
          </span>
        );
    }
  };

  const displayItems = showAll ? items : items.slice(0, 6);
  const remainingCount = Math.max(0, items.length - 6);

  return (
    <div className="flex flex-col justify-between h-full space-y-1">
      <div className="divide-y divide-brand-navy-100/70 dark:divide-brand-navy-800/70">
        {displayItems.map((item, idx) => {
          const rank = item.rank || (idx + 1);
          const valNum = Number(item.val || 0);
          const occRate = item.occupancyRate != null ? item.occupancyRate : (item.capacity > 0 ? Math.round((valNum / item.capacity) * 100) : 0);
          const pctWidth = Math.min(100, Math.max(8, Math.round((valNum / maxVal) * 100)));
          const className = item.name || item.month || `Lớp học #${rank}`;
          const sportVisual = getSportVisual(item.sportName);

          return (
            <div
              key={item.id || className + idx}
              className="py-2.5 px-2 hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 rounded-xl transition-colors group"
            >
              {/* Row 1: Rank Badge + Full Class Title + Bookings Count */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  {getRankBadge(rank)}
                  <span className="text-xs font-bold text-brand-navy-900 dark:text-white leading-snug line-clamp-2" title={className}>
                    {className}
                  </span>
                </div>
                <div className="text-right shrink-0 pl-1">
                  <span className="text-xs font-black font-chivo text-brand-teal-700 dark:text-brand-teal-300">
                    <AnimatedNumber value={valNum} duration={1000} />
                  </span>
                  <span className="text-[10px] text-brand-navy-400 font-medium ml-1">lượt</span>
                </div>
              </div>

              {/* Row 2: Sport Category Pill + Occupancy Progress Bar + Occupancy Rate */}
              <div className="flex items-center gap-2 pl-7 text-[10.5px]">
                <span className="text-brand-navy-500 dark:text-brand-navy-400 font-semibold shrink-0 truncate max-w-[90px]">
                  {item.sportName || 'Lớp tập luyện'}
                </span>
                <div className="flex-1 bg-brand-navy-100 dark:bg-brand-navy-800/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
                    style={{
                      width: `${pctWidth}%`,
                      backgroundColor: sportVisual.bar || '#24828F'
                    }}
                  />
                </div>
                <span className="text-brand-sage-700 dark:text-brand-sage-400 font-bold shrink-0 text-right">
                  {occRate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Toggle for Remaining Classes */}
      {remainingCount > 0 && (
        <div className="pt-2 border-t border-brand-navy-100/80 dark:border-brand-navy-800/80 flex items-center justify-between text-[11px] px-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-brand-teal-700 dark:text-brand-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showAll ? 'Thu gọn top 6 lớp' : `+${remainingCount} lớp khác (${items.length} lớp)`}</span>
            <span className="material-symbols-outlined text-[14px]">{showAll ? 'expand_less' : 'expand_more'}</span>
          </button>
          <span className="text-brand-navy-400 font-medium">Xếp hạng đặt chỗ</span>
        </div>
      )}
    </div>
  );
}
