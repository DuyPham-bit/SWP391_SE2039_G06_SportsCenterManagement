import React from 'react';
import { getLatestProgress, getMembershipSummary, getUpcomingBookings, getMemberReminders } from '../../../entities/member/index.js';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { ProfileModal } from '../../../features/auth/index.js';
import { MemberReminders } from '../../../widgets/member-reminders/index.js';
import { getTimeGreeting } from '../../../shared/lib/greeting.js';
import { useMemberDashboard } from '../model/useMemberDashboard.js';
import { MemberOverviewHero } from './MemberOverviewHero.jsx';
import { DataErrorsNotice } from './DataErrorsNotice.jsx';
import { MemberKeyMetrics } from './MemberKeyMetrics.jsx';
import { UpcomingWorkoutsCard } from './UpcomingWorkoutsCard.jsx';
import { DigitalPassPanel } from './DigitalPassPanel.jsx';
import { CheckInQrModal } from './CheckInQrModal.jsx';
import { CancelBookingModal } from './CancelBookingModal.jsx';

export function MemberDashboard() {
  const {
    bookingToCancel, canBook, canCancel, canProgress, cancelModalOpen, cancelling, copiedCode,
    currentUser, data, errors, handleConfirmCancelBooking, handleCopyMemberCode, handleSyncData,
    isEn, isRefreshing, loading, memberCode, notificationError, notifications, profileOpen,
    qrDataUrl, qrModalOpen, setBookingToCancel, setCancelModalOpen, setProfileOpen, setQrModalOpen
  } = useMemberDashboard();

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner text={isEn ? 'Syncing Olympic Member account...' : 'Đang tải dữ liệu tài khoản hội viên Olympic...'} />
      </div>
    );
  }

  const upcoming = getUpcomingBookings(data.bookings);
  const membership = getMembershipSummary(currentUser, new Date(), isEn);
  const latest = getLatestProgress(data.progress);
  const unread = notifications.filter(item => !item.isRead).length;
  const displayErrors = { ...errors, ...(notificationError ? { notifications: notificationError } : {}) };
  const reminders = getMemberReminders(currentUser, data.bookings, new Date(), isEn);
  const greeting = getTimeGreeting(isEn);

  // Validity percentage calculation for visual progress meter
  const daysLeftNum = membership.daysLeft || 0;
  const validityPercent = Math.min(100, Math.max(5, Math.round((daysLeftNum / 365) * 100)));

  return (
    <div className="w-full space-y-6 pb-16 font-lexend max-w-[1600px] mx-auto animate-fade-slide-up transition-colors">
      {/* ─────────────────────────────────────────────────────────────
          1. OLYMPIC PRO ATHLETE HERO COMMAND BANNER
      ───────────────────────────────────────────────────────────── */}
      <MemberOverviewHero
        canBook={canBook}
        copiedCode={copiedCode}
        currentUser={currentUser}
        greeting={greeting}
        handleCopyMemberCode={handleCopyMemberCode}
        handleSyncData={handleSyncData}
        isEn={isEn}
        isRefreshing={isRefreshing}
        membership={membership}
        setProfileOpen={setProfileOpen}
        setQrModalOpen={setQrModalOpen}
      />

      {/* Error alert banner if any endpoint failed */}
      {Object.keys(displayErrors).length > 0 && (
        <DataErrorsNotice displayErrors={displayErrors} isEn={isEn} />
      )}

      {/* Contextual Member Reminders (Only renders when needed) */}
      <MemberReminders items={reminders} />

      {/* ─────────────────────────────────────────────────────────────
          2. CORE BENTO METRICS BAR (4 High-Signal, Non-Redundant Cards)
      ───────────────────────────────────────────────────────────── */}
      <MemberKeyMetrics
        currentUser={currentUser}
        errors={errors}
        isEn={isEn}
        latest={latest}
        membership={membership}
        unread={unread}
        upcoming={upcoming}
        validityPercent={validityPercent}
      />

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN ASYMMETRICAL BENTO WORKSPACE (7 Cols / 5 Cols)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ═════════════════════════════════════════════════════════════
            LEFT STREAM (7 COLS): WORKOUT SCHEDULE & TRAINING SYLLABUS
        ═════════════════════════════════════════════════════════════ */}
        <UpcomingWorkoutsCard
          canBook={canBook}
          canCancel={canCancel}
          canProgress={canProgress}
          data={data}
          errors={errors}
          isEn={isEn}
          latest={latest}
          setBookingToCancel={setBookingToCancel}
          setCancelModalOpen={setCancelModalOpen}
          upcoming={upcoming}
        />

        {/* ═════════════════════════════════════════════════════════════
            RIGHT STREAM (5 COLS): SMART DIGITAL PASS & UTILITIES
        ═════════════════════════════════════════════════════════════ */}
        <DigitalPassPanel
          currentUser={currentUser}
          handleCopyMemberCode={handleCopyMemberCode}
          isEn={isEn}
          notificationError={notificationError}
          notifications={notifications}
          qrDataUrl={qrDataUrl}
          setQrModalOpen={setQrModalOpen}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. QR CHECK-IN MODAL (Ultra-Clean Olympic Scannable QR)
      ───────────────────────────────────────────────────────────── */}
      <CheckInQrModal
        copiedCode={copiedCode}
        currentUser={currentUser}
        handleCopyMemberCode={handleCopyMemberCode}
        isEn={isEn}
        memberCode={memberCode}
        qrDataUrl={qrDataUrl}
        qrModalOpen={qrModalOpen}
        setQrModalOpen={setQrModalOpen}
      />

      {/* ─────────────────────────────────────────────────────────────
          5. CANCEL BOOKING MODAL (Clear 2-Hour Refund Policy)
      ───────────────────────────────────────────────────────────── */}
      <CancelBookingModal
        bookingToCancel={bookingToCancel}
        cancelModalOpen={cancelModalOpen}
        cancelling={cancelling}
        handleConfirmCancelBooking={handleConfirmCancelBooking}
        isEn={isEn}
        setCancelModalOpen={setCancelModalOpen}
      />

      {/* Profile Update Modal */}
      {profileOpen && (
        <ProfileModal isOpen onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
