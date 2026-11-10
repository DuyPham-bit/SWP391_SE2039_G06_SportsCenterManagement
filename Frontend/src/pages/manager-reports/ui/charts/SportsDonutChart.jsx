import React, { useState } from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';
import { getSportColor } from '../../lib/chartFormat.js';

/**
 * 3. BIỂU ĐỒ DONUT PHÂN BỔ THỊ PHẦN BỘ MÔN (SPORTS DONUT CHART)
 */
export function SportsDonutChart({ sports = [] }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [activeIdx, setActiveIdx] = useState(null);

  if (!sports || !sports.length) {
    return (
      <div className="text-xs text-brand-navy-400 dark:text-brand-navy-500 py-8 text-center">
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
          <circle cx="105" cy="105" r={radius} fill="none" stroke="rgb(var(--color-border))" strokeWidth="24" />
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
        <text x="105" y="97" textAnchor="middle" fontSize="9" fontWeight="700" fill="rgb(var(--color-text-muted))"
          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isEn ? 'Total Bookings' : 'Tổng Đặt Chỗ'}
        </text>
        <text x="105" y="117" textAnchor="middle" fontSize="22" fontWeight="900" fill="rgb(var(--color-text-strong))">
          {String(currentHovered?.booked ?? totalBooked)}
        </text>
        <text x="105" y="133" textAnchor="middle" fontSize="9" fill="rgb(var(--color-text-muted))">
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
              <text x="236" y={ly + 13} fontSize="10" fontWeight="700" fill="rgb(var(--color-text-strong))">{slice.name}</text>
              {/* Sessions */}
              <text x="236" y={ly + 26} fontSize="8.5" fill="rgb(var(--color-text-muted))">
                {slice.booked} {isEn ? 'bookings' : 'lượt'} · {slice.sessionsCount || 0} {isEn ? 'sessions' : 'ca'}
              </text>
              {/* % badge background */}
              <rect x="406" y={ly} width="44" height="20" rx="5" fill="rgb(var(--color-border))" />
              {/* % text */}
              <text x="428" y={ly + 14} textAnchor="middle" fontSize="10" fontWeight="900" fill="rgb(var(--color-text-strong))">{pct}%</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
