import React from 'react';
import { translatePackageName, translateNotificationTitle, translateNotificationContent } from '../../../shared/i18n/i18nHelper.js';
import { formatMemberDate, formatMemberDateTime } from '../../../entities/member/index.js';

export function DigitalPassPanel({
  currentUser, handleCopyMemberCode, isEn, notificationError, notifications, qrDataUrl,
  setQrModalOpen
}) {
  return (
    <div className="lg:col-span-5 space-y-6">
      {/* Panel 1: Luxury Olympic Smart Digital Pass */}
      <section
        aria-label={isEn ? 'Smart Digital Pass' : 'Thẻ hội viên thông minh'}
        className="bg-gradient-to-br from-brand-sage-900 via-brand-sage-800 to-brand-teal-950 dark:from-brand-sage-950 dark:via-brand-sage-950 dark:to-brand-sage-950 text-white p-6 sm:p-7 rounded-3xl border border-brand-sage-400/30 dark:border-brand-sage-500/20 shadow-xl relative overflow-hidden group hover-lift transition-all"
      >
        {/* Holographic accent shine */}
        <div className="absolute inset-0 pointer-events-none animate-gold-shimmer opacity-20" />
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-brand-sand-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* Pass Header: Brand & NFC */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-sand-400/20 border border-brand-sand-300/40 text-brand-sand-300 flex items-center justify-center font-black text-sm shadow-md">
              <span className="material-symbols-outlined text-[18px]">stadium</span>
            </div>
            <div>
              <h3 className="text-xs font-black tracking-widest text-brand-sand-300 uppercase">SCMS APEX ARENA</h3>
              <p className="text-[10px] text-brand-sage-200 uppercase tracking-wider">Olympic Member Pass</p>
            </div>
          </div>

          {/* Contactless Wave & Smart Chip */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-sage-200 text-[20px]" title="NFC Contactless">
              contactless
            </span>
            <div className="w-8 h-6 rounded bg-gradient-to-br from-brand-sand-200 via-brand-sand-300 to-brand-sand-500 border border-brand-sand-200/60 shadow flex items-center justify-center">
              <div className="w-6 h-4 border border-brand-sand-900/30 rounded grid grid-cols-2 gap-0.5 p-0.5">
                <div className="bg-brand-sand-600/30 rounded-xs" />
                <div className="bg-brand-sand-600/30 rounded-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Pass Athlete Identity */}
        <div className="mt-6 relative z-10">
          <span className="text-[10px] uppercase tracking-widest text-brand-sage-200/80 font-bold block">
            {isEn ? 'Athlete / Member' : 'Chủ thẻ / Athlete'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mt-0.5 truncate uppercase">
            {currentUser?.fullName || (isEn ? 'SCMS ATHLETE' : 'HỘI VIÊN SCMS')}
          </h2>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 border border-white/25 text-brand-sage-100 text-xs font-bold backdrop-blur-sm">
            <span className="material-symbols-outlined text-[14px] text-brand-sand-300">military_tech</span>
            <span>{translatePackageName(currentUser?.packageName, isEn)}</span>
          </div>
        </div>

        {/* Pass Meta: Number & Expiry */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-end justify-between relative z-10 text-xs">
          <div>
            <span className="text-[10px] uppercase text-brand-sage-200/80 block font-bold">
              {isEn ? 'Card Number' : 'Mã số thẻ'}
            </span>
            <button
              type="button"
              onClick={handleCopyMemberCode}
              className="font-mono text-base font-black tracking-wider text-brand-sand-300 hover:text-brand-sand-200 flex items-center gap-1 mt-0.5 group/btn cursor-pointer transition"
              title={isEn ? 'Click to copy' : 'Bấm để chép mã'}
            >
              <span>{currentUser?.memberCode || 'MEM-00000'}</span>
              <span className="material-symbols-outlined text-[14px] opacity-70 group-hover/btn:opacity-100">
                content_copy
              </span>
            </button>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase text-brand-sage-200/80 block font-bold">
              {isEn ? 'Valid Until' : 'Hạn sử dụng'}
            </span>
            <span className="font-mono font-bold text-white mt-0.5 block">
              {formatMemberDate(currentUser?.packageExpiry, isEn)}
            </span>
          </div>
        </div>

        {/* Authentic Embedded Scannable QR Pod - unified with emerald theme */}
        <div
          onClick={() => setQrModalOpen(true)}
          className="mt-5 bg-white dark:bg-brand-navy-900 p-3.5 rounded-2xl cursor-pointer hover:ring-2 hover:ring-brand-sand-300 transition flex items-center justify-between gap-4 shadow-xl group/cardqr border border-brand-sage-100 dark:border-brand-navy-800"
          title={isEn ? 'Tap to expand QR code' : 'Chạm để phóng to mã QR'}
        >
          <div className="flex items-center gap-3">
            {qrDataUrl ? (
              <div className="w-14 h-14 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 p-1 bg-white shrink-0 shadow-xs group-hover/cardqr:scale-105 transition flex items-center justify-center">
                <img src={qrDataUrl} alt="Gate Check-in QR" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center text-brand-navy-400">
                <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
              </div>
            )}
            <div>
              <h4 className="text-xs font-black text-brand-navy-900 dark:text-white flex items-center gap-1">
                <span>{isEn ? 'Gate Check-in QR Code' : 'Mã QR Check-in qua cổng'}</span>
                <span className="material-symbols-outlined text-[14px] text-brand-sage-700 dark:text-brand-sage-400">check_circle</span>
              </h4>
              <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                {isEn ? 'Tap to view full screen scanner' : 'Chạm để phóng to khi qua cửa kiểm soát'}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-brand-navy-400 group-hover/cardqr:text-brand-navy-900 dark:group-hover/cardqr:text-white group-hover/cardqr:translate-x-0.5 transition-transform">
            fullscreen
          </span>
        </div>

        {/* Pass CTAs - Cohesive Olympic Gold/Amber CTA */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2">
          <a
            href="#/member/packages"
            className="flex-1 py-2.5 text-center bg-gradient-to-r from-brand-sand-400 via-brand-sand-500 to-brand-sand-600 hover:from-brand-sand-500 hover:to-brand-sand-700 text-brand-navy-950 font-black rounded-xl text-xs shadow-lg transition-all duration-200 active:scale-98"
          >
            {isEn ? 'Renew / Upgrade Package' : 'Gia hạn / Nâng cấp gói'}
          </a>
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition active:scale-95 cursor-pointer border border-white/20"
            title={isEn ? 'Open Fullscreen QR' : 'Mở toàn màn hình mã QR'}
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          </button>
        </div>
      </section>

      {/* Panel 2: Streamlined Utility Hub (4 High-Value Cards) */}
      <section aria-label={isEn ? 'Member Shortcuts' : 'Tiện ích nhanh'} className="bg-white dark:bg-brand-navy-900 p-5 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5 px-1">
          <span className="material-symbols-outlined text-[16px] text-brand-sage-900 dark:text-brand-sage-400">widgets</span>
          {isEn ? 'Member Utility Center' : 'Trung tâm tiện ích hội viên'}
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href="#/member/schedule"
            className="p-3.5 rounded-2xl bg-brand-navy-50 hover:bg-brand-sage-50/60 dark:bg-brand-navy-800/60 dark:hover:bg-brand-navy-800 border border-brand-navy-200/60 dark:border-brand-navy-700/60 hover:border-brand-sage-500/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-900 dark:text-brand-sage-400 border border-brand-sage-200/60 dark:border-brand-sage-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </div>
            <h4 className="font-extrabold text-xs text-brand-navy-900 dark:text-white mt-2 group-hover:text-brand-sage-900 dark:group-hover:text-brand-sage-400 transition">
              {isEn ? 'Classes Timetable' : 'Thời khóa biểu'}
            </h4>
            <p className="text-[10.5px] text-brand-navy-500 dark:text-brand-navy-400 truncate">
              {isEn ? 'Book sports sessions' : 'Đăng ký các bộ môn'}
            </p>
          </a>

          <a
            href="#/member/attendance"
            className="p-3.5 rounded-2xl bg-brand-navy-50 hover:bg-brand-sage-50/60 dark:bg-brand-navy-800/60 dark:hover:bg-brand-navy-800 border border-brand-navy-200/60 dark:border-brand-navy-700/60 hover:border-brand-sage-500/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-400 border border-brand-teal-200/60 dark:border-brand-teal-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
            </div>
            <h4 className="font-extrabold text-xs text-brand-navy-900 dark:text-white mt-2 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 transition">
              {isEn ? 'Attendance Log' : 'Lịch sử check-in'}
            </h4>
            <p className="text-[10.5px] text-brand-navy-500 dark:text-brand-navy-400 truncate">
              {isEn ? 'Automated turnstile logs' : 'Nhật ký qua cổng tự động'}
            </p>
          </a>

          <a
            href="#/member/progress"
            className="p-3.5 rounded-2xl bg-brand-navy-50 hover:bg-brand-sage-50/60 dark:bg-brand-navy-800/60 dark:hover:bg-brand-navy-800 border border-brand-navy-200/60 dark:border-brand-navy-700/60 hover:border-brand-sage-500/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-400 border border-brand-teal-200/60 dark:border-brand-teal-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
            </div>
            <h4 className="font-extrabold text-xs text-brand-navy-900 dark:text-white mt-2 group-hover:text-brand-teal-700 dark:group-hover:text-brand-teal-400 transition">
              {isEn ? 'InBody & Syllabus' : 'Chỉ số & Giáo án'}
            </h4>
            <p className="text-[10.5px] text-brand-navy-500 dark:text-brand-navy-400 truncate">
              {isEn ? 'Track body transformation' : 'Theo dõi chỉ số hình thể'}
            </p>
          </a>

          <a
            href="#/member/support"
            className="p-3.5 rounded-2xl bg-brand-navy-50 hover:bg-brand-sage-50/60 dark:bg-brand-navy-800/60 dark:hover:bg-brand-navy-800 border border-brand-navy-200/60 dark:border-brand-navy-700/60 hover:border-brand-sage-500/40 transition group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-400 border border-brand-sand-200/60 dark:border-brand-sand-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
            </div>
            <h4 className="font-extrabold text-xs text-brand-navy-900 dark:text-white mt-2 group-hover:text-brand-sand-700 dark:group-hover:text-brand-sand-400 transition">
              {isEn ? 'Support & Inquiries' : 'Hỗ trợ & Khiếu nại'}
            </h4>
            <p className="text-[10.5px] text-brand-navy-500 dark:text-brand-navy-400 truncate">
              {isEn ? '24/7 Front desk assistance' : 'Quầy lễ tân & Ban quản lý'}
            </p>
          </a>
        </div>
      </section>

      {/* Panel 3: Center Bulletins & Notifications */}
      <section aria-label={isEn ? 'Center Announcements' : 'Thông báo trung tâm'} className="bg-white dark:bg-brand-navy-900 p-5 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-brand-navy-100 dark:border-brand-navy-800">
          <h3 className="text-xs font-extrabold text-brand-navy-800 dark:text-brand-navy-200 uppercase tracking-wide flex items-center gap-1.5">
            <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[18px]">campaign</span>
            {isEn ? 'Center Notifications' : 'Thông báo trung tâm'}
          </h3>
          <a href="#/member/notifications" className="text-[11px] font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:underline">
            {isEn ? 'View All' : 'Xem tất cả'}
          </a>
        </div>

        {notificationError ? (
          <p className="text-xs text-brand-danger-600 dark:text-brand-danger-400">
            {isEn ? 'Unable to load notifications.' : 'Chưa tải được thông báo.'}
          </p>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-brand-navy-500 dark:text-brand-navy-400">
            <span className="material-symbols-outlined text-2xl text-brand-navy-300 dark:text-brand-navy-600 block mb-1">notifications_off</span>
            {isEn ? 'No announcements.' : 'Không có thông báo mới.'}
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 3).map(item => (
              <a
                key={item.id}
                href="#/member/notifications"
                className={`block p-3 rounded-2xl border text-xs space-y-1 transition hover-lift ${
                      item.isRead
                        ? 'bg-brand-navy-50/70 dark:bg-brand-navy-800/40 border-brand-navy-100 dark:border-brand-navy-700/50'
                        : 'bg-brand-sand-50/60 dark:bg-brand-sand-950/20 border-brand-sand-200/60 dark:border-brand-sand-900/40'
                    }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-brand-navy-900 dark:text-white truncate pr-2">
                    {translateNotificationTitle(item.title, isEn)}
                  </h4>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-brand-sand-500 shrink-0" title={isEn ? 'Unread' : 'Chưa đọc'} />
                  )}
                </div>
                <p className="text-brand-navy-600 dark:text-brand-navy-300 line-clamp-1 text-[11px]">
                  {translateNotificationContent(item.content, isEn)}
                </p>
                <span className="text-[10px] text-brand-navy-400 block pt-0.5 font-mono">
                  {formatMemberDateTime(item.createdAt, isEn)}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
