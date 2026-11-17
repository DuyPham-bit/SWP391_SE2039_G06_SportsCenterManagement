import React from 'react';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_SECTION_CLASS,
  SCMS_HERO_SUBBADGE_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function AdminHeroBanner({ TABS, loadA, loadAFn, loadC, loadCFn, loadM, loadMFn, loadOv, loadOvFn, ov, switchTab, tab }) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} lg:p-8`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className={SCMS_HERO_BADGE_CLASS}>
              <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
              HỆ THỐNG QUẢN TRỊ TRUNG TÂM
            </span>
            <span className={SCMS_HERO_SUBBADGE_CLASS}>
              Toàn Hệ Thống SCMS
            </span>
          </div>
          <h1 className="font-chivo text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            Bảng Quản Trị Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
            Mạng lưới cơ sở thể thao tiêu chuẩn Olympic, phân quyền quản lý chuyên nghiệp và giám sát an toàn tài khoản toàn hệ thống.
          </p>
        </div>

        {/* Quick Metrics & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:shrink-0">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-white/15 dark:bg-brand-navy-900/40 p-2.5 sm:p-3 rounded-2xl border border-white/25 backdrop-blur-md shadow-xs">
            <div className="text-center px-1 sm:px-2 min-w-0">
              <div className="text-lg sm:text-2xl font-black font-chivo text-white">{ov?.activeCenterCount ?? '—'}</div>
              <div className="text-[9px] sm:text-[10px] text-white/85 uppercase tracking-normal sm:tracking-wide font-bold leading-tight whitespace-nowrap">Cơ Sở</div>
            </div>
            <div className="text-center px-1 sm:px-2 min-w-0 border-l border-white/20">
              <div className="text-lg sm:text-2xl font-black font-chivo text-white">{ov?.activeManagerCount ?? '—'}</div>
              <div className="text-[9px] sm:text-[10px] text-white/85 uppercase tracking-normal sm:tracking-wide font-bold leading-tight whitespace-nowrap">Quản Lý</div>
            </div>
            <div className="text-center px-1 sm:px-2 min-w-0 border-l border-white/20">
              <div className={`text-lg sm:text-2xl font-black font-chivo ${(ov?.lockedAccountCount || 0) > 0 ? 'text-brand-sand-200' : 'text-white'}`}>
                {ov?.lockedAccountCount ?? '0'}
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/85 uppercase tracking-normal sm:tracking-wide font-bold leading-tight whitespace-nowrap">Bị Khóa</div>
            </div>
            <div className="text-center px-1 sm:px-2 min-w-0 border-l border-white/20">
              <div className="text-lg sm:text-2xl font-black font-chivo text-white">{ov?.totalAccountCount ?? '—'}</div>
              <div className="text-[9px] sm:text-[10px] text-white/85 uppercase tracking-normal sm:tracking-wide font-bold leading-tight whitespace-nowrap">Tài Khoản</div>
            </div>
          </div>

          <MotionButton
            onClick={() => {
              loadOvFn();
              loadCFn();
              loadMFn();
              if (tab === 'accounts') loadAFn();
            }}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${SCMS_HERO_BTN_GLASS} justify-center shrink-0 whitespace-nowrap !rounded-2xl`}
            title="Làm mới dữ liệu từ máy chủ"
          >
            <span className={`material-symbols-outlined text-[18px] text-brand-sand-200 ${loadOv || loadC || loadM || loadA ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Làm Mới</span>
          </MotionButton>
        </div>
      </div>

      {/* Master Tabs Embedded Inside Banner */}
      <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/20">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <MotionButton
              key={t.id}
              onClick={() => switchTab(t.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`scms-shine flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold font-chivo text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-brand-navy-950 shadow-lg shadow-black/15 font-black'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/25 backdrop-blur-md'
                }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-brand-sage-700' : 'text-brand-sand-200'}`}>{t.i}</span>
              <span>{t.l}</span>
              {t.count !== undefined && t.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-brand-sage-100 text-brand-sage-800' : 'bg-white/25 text-white'
                    }`}
                >
                  {t.count}
                </span>
              )}
            </MotionButton>
          );
        })}
      </div>
    </section>
  );
}
