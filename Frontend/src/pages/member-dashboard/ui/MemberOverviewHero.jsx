import React from 'react';
import { translatePackageName } from '../../../shared/i18n/i18nHelper.js';

export function MemberOverviewHero({
  canBook, copiedCode, currentUser, greeting, handleCopyMemberCode, handleSyncData, isEn,
  isRefreshing, membership, setProfileOpen, setQrModalOpen
}) {
  return (
    <section
      aria-label={isEn ? 'Athlete Overview' : 'Tổng quan hội viên'}
      className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-8 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden scms-hero-static"
    >
      {/* Ambient glow (same palette as the counter banners); the dashboard motion layer makes it float */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Dynamic decorative athletic curves */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 240">
        <path d="M-50,180 C250,50 500,220 800,90 C950,30 1050,140 1100,110" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,210 C280,80 520,250 820,120 C970,60 1060,160 1120,130" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="860" cy="60" r="100" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
      </svg>

      <div className="relative z-10 flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-6">
        {/* Athlete Profile & Status */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
          {/* VIP Avatar with dynamic glow */}
          <div className="relative shrink-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser?.fullName || 'Avatar'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white/80 dark:border-white/20 select-none transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 dark:bg-brand-navy-900/90 text-brand-teal-900 dark:text-brand-sage-400 flex items-center justify-center font-black text-2xl sm:text-3xl uppercase tracking-wider shadow-xl border-2 border-white/80 dark:border-white/20 select-none transition-transform duration-300 hover:scale-105">
                <span className="text-brand-sage-700 dark:text-brand-sage-300 font-black">
                  {currentUser?.fullName?.charAt(0) || 'M'}
                </span>
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-sage-400 border-2 border-white dark:border-brand-navy-900 flex items-center justify-center shadow-md"
              title={isEn ? 'Account Online' : 'Tài khoản đang hoạt động'}
            >
              <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>
            </span>
          </div>

          {/* Member Details */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[14px] text-brand-sand-700 dark:text-brand-sand-400">workspace_premium</span>
                {isEn ? 'OLYMPIC ATHLETE • SCMS PRO' : 'HỘI VIÊN CHÍNH THỨC • SCMS PRO'}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 shadow-xs ${
                    membership.active
                      ? 'bg-white/90 text-brand-sage-800 border-white/80 dark:bg-brand-navy-900/90 dark:text-brand-sage-300 dark:border-white/20'
                      : 'bg-white/90 text-brand-danger-700 border-white/80 dark:bg-brand-navy-900/90 dark:text-brand-danger-300 dark:border-white/20'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${membership.active ? 'bg-brand-sage-400 animate-pulse' : 'bg-brand-danger-400'}`} />
                {membership.label} {membership.active && (isEn ? `(${membership.daysLeft} days left)` : `(Còn ${membership.daysLeft} ngày)`)}
              </span>
            </div>

            <h1 className="font-chivo text-2xl md:text-3xl font-black text-white mt-2 tracking-tight leading-tight break-words text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {greeting}, {currentUser?.fullName}!
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mt-2.5">
              {/* 1-click Copy Member Card Code */}
              <button
                type="button"
                onClick={handleCopyMemberCode}
                className="flex items-center gap-1.5 bg-white/90 hover:bg-white dark:bg-brand-navy-900/90 dark:hover:bg-brand-navy-900 px-3 py-1 rounded-xl border border-white/80 dark:border-white/20 text-brand-navy-800 dark:text-brand-navy-100 transition font-mono group cursor-pointer active:scale-95 shadow-xs backdrop-blur-md"
                title={isEn ? 'Click to copy card code' : 'Bấm để sao chép mã thẻ'}
              >
                <span className="material-symbols-outlined text-[15px] text-brand-sage-700 dark:text-brand-sage-400 group-hover:scale-110 transition">badge</span>
                <span>{isEn ? 'ID' : 'Mã'}: <strong className="text-brand-navy-950 dark:text-white font-black">{currentUser?.memberCode || (isEn ? 'Unassigned' : 'Chưa cấp')}</strong></span>
                <span className="material-symbols-outlined text-[14px] text-brand-navy-500 group-hover:text-brand-navy-800 dark:group-hover:text-white transition">
                  {copiedCode ? 'done' : 'content_copy'}
                </span>
              </button>

              {/* Package Name Pill */}
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-teal-900 dark:text-brand-sage-300 font-bold border border-white/80 dark:border-white/20 shadow-xs">
                <span className="material-symbols-outlined text-[15px] text-brand-sand-700 dark:text-brand-sand-400">card_membership</span>
                <span>{translatePackageName(currentUser?.packageName, isEn)}</span>
              </span>

              {/* Phone Pill */}
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/80 dark:bg-brand-navy-900/80 backdrop-blur-md text-brand-navy-800 dark:text-brand-navy-200 shadow-xs font-medium border border-white/70 dark:border-white/20">
                <span className="material-symbols-outlined text-[15px] text-brand-navy-500">call</span>
                <span>{currentUser?.phone || (isEn ? 'No phone' : 'Chưa có SĐT')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Hero Action Toolbar (Streamlined & Non-Redundant) */}
        {/* Mobile: [QR ........][sync] / [Book][Profile]; sm+: one wrapping row */}
        <div className="grid grid-cols-[1fr_1fr_auto] sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
          {/* Primary Action: QR Code Gate Access */}
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="col-span-2 order-1 sm:order-none justify-center scms-shine px-5 py-3 rounded-xl bg-brand-navy-950 hover:bg-brand-navy-900 text-white font-chivo font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sand-300 group-hover:rotate-12 transition-transform">qr_code_scanner</span>
            <span>{isEn ? 'Gate Check-in QR' : 'Mã Check-in QR'}</span>
          </button>

          {/* Book Session CTA */}
          {canBook && (
            <a
              href="#/member/schedule"
              className="col-span-2 order-3 sm:order-none justify-center whitespace-nowrap scms-shine px-3 sm:px-5 py-3 rounded-xl bg-white/90 hover:bg-white text-brand-navy-950 font-chivo font-bold text-xs uppercase tracking-normal sm:tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sage-700 group-hover:scale-110 transition-transform">event_available</span>
              <span>{isEn ? 'Book Class' : 'Đặt ca tập mới'}</span>
            </a>
          )}

          {/* Profile Edit */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className={`order-3 sm:order-none justify-center ${canBook ? '' : 'col-span-3'} scms-shine px-4 py-3 rounded-xl bg-white/90 hover:bg-white text-brand-navy-950 font-chivo font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95 cursor-pointer`}
            title={isEn ? 'Edit Profile' : 'Chỉnh sửa hồ sơ cá nhân'}
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700">badge</span>
            <span>{isEn ? 'Profile' : 'Hồ sơ'}</span>
          </button>

          {/* Sync & Refresh Button */}
          <button
            type="button"
            onClick={handleSyncData}
            disabled={isRefreshing}
            className={`order-2 sm:order-none flex justify-center p-3 rounded-xl bg-brand-navy-950/70 hover:bg-brand-navy-950 text-white transition shadow-md cursor-pointer ${
                isRefreshing ? 'animate-spin' : 'hover:rotate-90 active:scale-95'
              }`}
            title={isEn ? 'Sync Data' : 'Đồng bộ dữ liệu'}
            aria-label={isEn ? 'Sync Data' : 'Đồng bộ dữ liệu'}
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
        </div>
      </div>
    </section>
  );
}
