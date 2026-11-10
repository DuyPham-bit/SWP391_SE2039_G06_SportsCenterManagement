import React from 'react';
import { useLanguage } from '../../../../shared/i18n/LanguageContext.jsx';

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
        <span className="font-bold text-brand-navy-900 dark:text-white uppercase tracking-wider text-[11px]">
          {title}
        </span>
        <span className="material-symbols-outlined text-brand-navy-400 text-[18px]">more_horiz</span>
      </div>

      <div className="grid grid-cols-2 items-center gap-2 my-auto">
        {/* Left Side: 2 metric pill cards */}
        <div className="space-y-2">
          <div className="bg-brand-navy-50 dark:bg-brand-navy-800/80 p-2.5 rounded-xl border border-brand-navy-200/70 dark:border-brand-navy-700/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-navy-400 dark:text-brand-navy-500 block">
              {stat1Label}
            </span>
            <strong className="text-sm font-chivo font-black text-brand-navy-900 dark:text-white">
              {stat1Val}
            </strong>
          </div>
          <div className="bg-brand-navy-50 dark:bg-brand-navy-800/80 p-2.5 rounded-xl border border-brand-navy-200/70 dark:border-brand-navy-700/70">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-navy-400 dark:text-brand-navy-500 block">
              {stat2Label}
            </span>
            <strong className="text-sm font-chivo font-black text-brand-sage-700 dark:text-brand-sage-500">
              {stat2Val}
            </strong>
          </div>
        </div>

        {/* Right Side: Circular radial ring */}
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none transform -rotate-90">
            <defs>
              <linearGradient id="radialScoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(var(--color-chart-5))" />
                <stop offset="50%" stopColor="rgb(var(--color-chart-1))" />
                <stop offset="100%" stopColor="#F2CC8F" />
              </linearGradient>
            </defs>

            {/* Background ring */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgb(var(--color-border))"
              strokeWidth="10"
              className="dark:stroke-brand-navy-800"
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
            <span className="text-[9px] uppercase font-bold tracking-wider text-brand-navy-400">
              {scoreLabel}
            </span>
            <span className="font-chivo font-black text-xl text-brand-navy-900 dark:text-white leading-none my-0.5">
              {numScore}
            </span>
            <span className="text-[9px] font-bold text-brand-sage-700 dark:text-brand-sage-500">
              {scoreSub}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
