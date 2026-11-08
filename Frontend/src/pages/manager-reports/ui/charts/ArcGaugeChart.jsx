import React from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';

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
        <span className="font-bold text-brand-navy-900 dark:text-white uppercase tracking-wider text-[11px]">
          {title}
        </span>
        <span className="material-symbols-outlined text-brand-navy-400 text-[18px]">more_horiz</span>
      </div>
      <p className="w-full text-left text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mb-2">
        {subtitle}
      </p>

      {/* SVG Semi-Circle Arc */}
      <div className="relative w-full max-w-[220px] aspect-[220/130] select-none">
        <svg viewBox="0 0 220 130" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="arcGaugeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(var(--color-chart-5))" />
              <stop offset="50%" stopColor="rgb(var(--color-chart-1))" />
              <stop offset="100%" stopColor="rgb(var(--color-chart-6))" />
            </linearGradient>
            <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgb(var(--color-chart-5))" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
            fill="none"
            stroke="rgb(var(--color-border))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="dark:stroke-brand-navy-800"
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
          <circle cx={cx} cy={cy - 20} r="20" fill="#F9FAFB" className="dark:fill-brand-navy-800 shadow-sm" />
          <circle cx={cx} cy={cy - 20} r="18" fill="url(#arcGaugeGrad)" opacity="0.15" />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            className="text-[17px] select-none font-bold fill-brand-sage-700 dark:fill-brand-sage-500"
            style={{ fontFamily: 'Material Symbols Outlined' }}
          >
            speed
          </text>

          {/* Scale min / max text */}
          <text x={cx - r - 2} y={cy + 16} textAnchor="start" className="text-[10px] font-bold fill-brand-navy-400 dark:fill-brand-navy-500">
            {min}%
          </text>
          <text x={cx + r + 2} y={cy + 16} textAnchor="end" className="text-[10px] font-bold fill-brand-navy-400 dark:fill-brand-navy-500">
            {max}%
          </text>

          {/* Big value inside arc */}
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            className="text-2xl font-black font-chivo fill-brand-navy-900 dark:fill-white"
          >
            {val}%
          </text>
          {/* Subtitle note */}
          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            className="text-[10px] font-semibold fill-brand-sage-700 dark:fill-brand-sage-500"
          >
            {note}
          </text>
        </svg>
      </div>
    </div>
  );
}
