import { AnimatedNumber } from '../../../../shared/lib/useCountUp.jsx';
import React, { useState } from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';
import { formatVnd, formatShortVnd } from '../../lib/chartFormat.js';

/**
 * 9. VISION UI SALES OVERVIEW (Dual Spline Wave Chart)
 * Smooth glowing spline area chart matching Image 1
 */
export function VisionSalesOverviewChart({ data = [], groupBy = 'day', growth = null }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || !data.length) {
    return (
      <div className="py-12 text-center text-xs text-brand-navy-400 dark:text-brand-navy-500 bg-brand-navy-50/50 dark:bg-brand-navy-900/40 rounded-xl border border-dashed border-brand-navy-200 dark:border-brand-navy-800">
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
          <span className="text-[11px] text-brand-sage-700 dark:text-brand-sage-400 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">trending_up</span>
            {growth == null
              ? (isEn ? 'No comparable previous-period baseline' : 'Chưa có dữ liệu kỳ trước để so sánh')
              : (isEn
                  ? `${growth > 0 ? '+' : ''}${growth}% net revenue vs previous period`
                  : `${growth > 0 ? '+' : ''}${growth}% doanh thu thuần so với kỳ trước`)}
          </span>
          <span className="text-brand-navy-400 text-[10px] block">
            {isEn ? `Aggregated by ${groupBy}` : `Tổng hợp theo ${groupBy === 'month' ? 'tháng' : 'ngày'}`}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-brand-navy-500 dark:text-brand-navy-400 mr-2">
            {isEn ? 'Total:' : 'Tổng:'}
          </span>
          <strong className="text-base font-black font-chivo text-brand-sage-700 dark:text-brand-sage-500">
            <AnimatedNumber value={totalRevenue} suffix="đ" duration={1200} />
          </strong>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative overflow-x-auto">
        <svg data-chart-id="chart-revenue" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px] select-none">
          <defs>
            <linearGradient id="visionSalesAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--color-chart-5))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="rgb(var(--color-chart-5))" stopOpacity="0.0" />
            </linearGradient>
            <filter id="visionGlowLine" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgb(var(--color-chart-5))" floodOpacity="0.4" />
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
                stroke="rgb(var(--color-border))"
                strokeDasharray="4 4"
                className="dark:stroke-brand-navy-800"
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-brand-navy-400 dark:fill-brand-navy-500 font-medium"
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
              stroke="rgb(var(--color-chart-1))"
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
              stroke="rgb(var(--color-chart-5))"
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
                    stroke="rgb(var(--color-chart-5))"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : val > 0 ? 3.5 : 2}
                  fill={val > 0 ? 'rgb(var(--color-chart-6))' : 'rgb(var(--color-text-muted))'}
                  stroke="rgb(var(--color-surface))"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* X-axis date label */}
                {(points.length <= 15 || i % Math.ceil(points.length / 12) === 0) && (
                  <text
                    x={pt.x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    className={`text-[10px] ${isHovered ? 'fill-brand-teal-600 font-bold' : 'fill-brand-navy-500 dark:fill-brand-navy-400'}`}
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
            className="absolute top-2 pointer-events-none bg-brand-navy-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl border border-brand-navy-700 flex items-center gap-2 transform -translate-x-1/2"
            style={{
              left: `${(points[hoveredIdx].x / chartWidth) * 100}%`
            }}
          >
            <span className="text-brand-navy-300 font-medium">{data[hoveredIdx].periodStart}:</span>
            <strong className="text-brand-sage-300 font-black">{formatVnd(data[hoveredIdx].net)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
