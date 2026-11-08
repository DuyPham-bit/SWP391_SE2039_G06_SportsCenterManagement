import React from 'react';
import { OLYMPIC_GRADIENT } from '../../../shared/ui/gradients.js';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';

export function AdminHeroBanner({ TABS, loadA, loadAFn, loadC, loadCFn, loadM, loadMFn, loadOv, loadOvFn, ov, switchTab, tab }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-7 lg:p-8 shadow-xl shadow-brand-sage-950/15 border border-white/20 dark:border-brand-navy-800"
      style={{ background: OLYMPIC_GRADIENT }}
    >
      {/* Ambient atmospheric glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-br from-brand-sand-300/30 via-brand-teal-300/20 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-brand-sage-500/35 via-brand-teal-500/20 to-transparent blur-3xl" />

      {/* Olympic curved athletic lines SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden"
        preserveAspectRatio="none"
        viewBox="0 0 1000 300"
      >
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
      </svg>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-white/20 text-white uppercase backdrop-blur-md border border-white/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-brand-sage-300 animate-pulse" />
              HỆ THỐNG QUẢN TRỊ TRUNG TÂM
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white/95 border border-white/20">
              Toàn Hệ Thống SCMS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
            Bảng Quản Trị Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
            Mạng lưới cơ sở thể thao tiêu chuẩn Olympic, phân quyền quản lý chuyên nghiệp và giám sát an toàn tài khoản toàn hệ thống.
          </p>
        </div>

        {/* Quick Metrics & Refresh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-white/15 dark:bg-brand-navy-900/40 p-2.5 sm:p-3 rounded-2xl border border-white/25 backdrop-blur-md shadow-xs">
            <div className="text-center px-1 sm:px-2 min-w-0">
              <div className="text-lg sm:text-2xl font-black text-white">{ov?.activeCenterCount ?? '—'}</div>
              <div className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-normal sm:tracking-wide font-bold leading-tight">Cơ Sở</div>
            </div>
            <div className="text-center px-1 sm:px-2 min-w-0 border-l border-white/20">
              <div className="text-lg sm:text-2xl font-black text-white">{ov?.activeManagerCount ?? '—'}</div>
              <div className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-normal sm:tracking-wide font-bold leading-tight">Quản Lý</div>
            </div>
            <div className="text-center px-1 sm:px-2 min-w-0 border-l border-white/20">
              <div className={`text-lg sm:text-2xl font-black ${(ov?.lockedAccountCount || 0) > 0 ? 'text-brand-sand-300' : 'text-brand-sage-300'}`}>
                {ov?.lockedAccountCount ?? '0'}
              </div>
              <div className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-normal sm:tracking-wide font-bold leading-tight">Bị Khóa</div>
            </div>
            <div className="text-center px-1 sm:px-2 min-w-0 border-l border-white/20">
              <div className="text-lg sm:text-2xl font-black text-white">{ov?.totalAccountCount ?? '—'}</div>
              <div className="text-[9px] sm:text-[10px] text-white/80 uppercase tracking-normal sm:tracking-wide font-bold leading-tight">Tài Khoản</div>
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
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border border-white/30 backdrop-blur-md shadow-xs cursor-pointer"
            title="Làm mới dữ liệu từ máy chủ"
          >
            <span className={`material-symbols-outlined text-[18px] ${loadOv || loadC || loadM || loadA ? 'animate-spin' : ''}`}>
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
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-brand-sage-900 shadow-lg shadow-black/15 font-black scale-102'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur-md'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.i}</span>
              <span>{t.l}</span>
              {t.count !== undefined && t.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
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
