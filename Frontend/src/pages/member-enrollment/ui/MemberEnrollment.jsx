import React, { useState } from 'react';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { useMemberEnrollment } from '../model/useMemberEnrollment.js';
import { formatSchedules, packageUsage } from '../model/enrollmentView.js';
import { ClassStep, CoachStep, SportStep } from './EnrollmentSteps.jsx';

function Icon({ name, className = '' }) {
  return <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const STEPS = [
  { id: 'sport', vi: 'Chọn môn', en: 'Choose sport', icon: 'sports' },
  { id: 'coach', vi: 'Chọn HLV', en: 'Choose coach', icon: 'sports_handball' },
  { id: 'class', vi: 'Chọn lớp & lịch', en: 'Class & schedule', icon: 'event_available' }
];

function Stepper({ step, onGoTo, isEn, singleCoach }) {
  const current = STEPS.findIndex(s => s.id === step);
  return (
    <nav aria-label={isEn ? 'Enrollment steps' : 'Các bước đăng ký'}>
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((s, index) => {
          const done = index < current;
          const active = index === current;
          const label = isEn ? s.en : s.vi;
          const content = (
            <>
              <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black transition-colors
                ${active ? 'bg-brand-teal-600 text-white' : done ? 'bg-brand-sage-500 text-white' : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-500 dark:text-brand-navy-400'}`}>
                {done ? <Icon name="check" className="text-[18px]" /> : index + 1}
              </span>
              <span className={`hidden sm:inline text-sm font-bold ${active ? 'text-brand-navy-900 dark:text-white' : 'text-brand-navy-500 dark:text-brand-navy-400'}`}>{label}</span>
            </>
          );
          const handleGoTo = () => {
            if (s.id === 'coach' && singleCoach) {
              onGoTo('sport');
            } else {
              onGoTo(s.id);
            }
          };
          return (
            <li key={s.id} className="flex items-center gap-2 sm:gap-3 min-w-0" aria-current={active ? 'step' : undefined}>
              {done ? (
                <button type="button" onClick={handleGoTo}
                  className="flex items-center gap-2 min-h-[44px] rounded-xl px-1 hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-500"
                  aria-label={`${isEn ? 'Back to' : 'Quay lại'}: ${label}`}>
                  {content}
                </button>
              ) : <div className="flex items-center gap-2 min-h-[44px] px-1">{content}</div>}
              {index < STEPS.length - 1 && <span aria-hidden="true" className={`h-0.5 w-6 sm:w-12 rounded-full ${index < current ? 'bg-brand-sage-400' : 'bg-brand-navy-200 dark:bg-brand-navy-700'}`} />}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {isEn ? `Step ${current + 1} of ${STEPS.length}` : `Bước ${current + 1}/${STEPS.length}`}
      </p>
    </nav>
  );
}

function PackageStrip({ subscriptions, isEn }) {
  const usage = packageUsage(subscriptions);
  if (usage.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-sand-200 dark:border-brand-sand-800 bg-brand-sand-50 dark:bg-brand-sand-950/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="flex items-start gap-2 text-sm text-brand-sand-900 dark:text-brand-sand-200">
          <Icon name="info" className="text-[20px]" />
          {isEn ? 'You can browse sports and coaches, but you need an active package to enroll.'
            : 'Bạn có thể xem môn và HLV, nhưng cần có gói tập còn hiệu lực để đăng ký lớp.'}
        </p>
        <a href="#/member/packages" className="shrink-0 min-h-[44px] inline-flex items-center justify-center px-4 rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-white text-sm font-bold">
          {isEn ? 'Buy a package' : 'Mua gói tập'}
        </a>
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {usage.map(u => (
        <div key={u.subscriptionId} className="rounded-2xl border border-brand-navy-100 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-900 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Active package' : 'Gói đang dùng'}</p>
          <p className="mt-0.5 font-chivo font-black text-brand-navy-900 dark:text-white">{u.packageName}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-brand-navy-600 dark:text-brand-navy-300 tabular-nums">
            <span><strong className="text-brand-navy-900 dark:text-white">{u.sportsUsed}/{u.sportsAllowed}</strong> {isEn ? 'sports' : 'môn'}</span>
            {u.classesAllowed != null && <span><strong className="text-brand-navy-900 dark:text-white">{u.classesUsed}/{u.classesAllowed}</strong> {isEn ? 'classes' : 'lớp'}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MemberEnrollment() {
  const {
    isEn, loading, loadError, reload, options, sports, sport, coach, step,
    chooseSport, chooseCoach, goToStep,
    pendingClass, setPendingClass, confirmEnroll,
    pendingCancel, setPendingCancel, confirmCancel, submitting
  } = useMemberEnrollment();
  const [cancelReason, setCancelReason] = useState('');

  if (loading && !options) return <LoadingSpinner text={isEn ? 'Loading sports and coaches...' : 'Đang tải môn học và HLV...'} />;

  const heading = step === 'sport'
    ? (isEn ? 'Which sport do you want to join?' : 'Bạn muốn tham gia môn nào?')
    : step === 'coach'
      ? (isEn ? `Pick your ${sport.name} coach` : `Chọn HLV môn ${sport.name}`)
      : (isEn ? `Classes with ${coach.fullName}` : `Lớp của HLV ${coach.fullName}`);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <header className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:to-brand-sand-900 text-white p-6 sm:p-7 shadow-xl shadow-brand-teal-600/20 overflow-hidden">
        <div aria-hidden="true" className="absolute -top-16 -right-16 w-72 h-72 bg-brand-sand-300/30 rounded-full blur-3xl pointer-events-none" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300" aria-hidden="true">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-chivo text-2xl lg:text-3xl font-black tracking-tight">{isEn ? 'Sport Enrollment' : 'Đăng Ký Môn Học'}</h1>
            <p className="mt-1 text-sm text-white/90 max-w-2xl">
              {isEn ? 'Choose the sport you love, the coach you prefer and a weekly schedule that fits you.'
                : 'Chọn môn bạn yêu thích, HLV bạn muốn theo học và khung giờ phù hợp với bạn.'}
            </p>
          </div>
          <a href="#/member/schedule" className="shrink-0 min-h-[44px] inline-flex items-center gap-2 px-4 rounded-xl bg-brand-navy-950/80 hover:bg-brand-navy-950 border border-white/20 text-sm font-bold">
            <Icon name="calendar_month" className="text-[18px] text-brand-sand-300" />
            {isEn ? 'Class schedule' : 'Xem lịch lớp'}
          </a>
        </div>
      </header>

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-brand-danger-200 bg-brand-danger-50 dark:bg-brand-danger-950/30 dark:border-brand-danger-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-brand-danger-800 dark:text-brand-danger-200">{loadError}</p>
          <button type="button" onClick={reload} className="min-h-[44px] px-4 rounded-xl bg-brand-navy-900 text-white text-sm font-bold">{isEn ? 'Try again' : 'Thử lại'}</button>
        </div>
      ) : (
        <>
          <PackageStrip subscriptions={options?.subscriptions || []} isEn={isEn} />

          <section className="rounded-3xl border border-brand-navy-100 dark:border-brand-navy-800 bg-brand-navy-50/40 dark:bg-brand-navy-950/40 p-4 sm:p-6 space-y-5" aria-labelledby="enroll-heading">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Stepper step={step} onGoTo={goToStep} isEn={isEn} singleCoach={!sport?.coaches || sport.coaches.length <= 1} />
              {step !== 'sport' && (
                <button type="button" onClick={() => {
                  if (step === 'class' && (!sport?.coaches || sport.coaches.length <= 1)) {
                    goToStep('sport');
                  } else {
                    goToStep(step === 'class' ? 'coach' : 'sport');
                  }
                }}
                  className="self-start min-h-[44px] inline-flex items-center gap-1 px-3 rounded-xl text-sm font-bold text-brand-navy-700 dark:text-brand-navy-200 hover:bg-white dark:hover:bg-brand-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-500">
                  <Icon name="arrow_back" className="text-[18px]" />{isEn ? 'Back' : 'Quay lại'}
                </button>
              )}
            </div>
            <h2 id="enroll-heading" className="font-chivo text-xl font-black text-brand-navy-900 dark:text-white">{heading}</h2>

            {step === 'sport' && <SportStep sports={sports} onChoose={chooseSport} isEn={isEn} />}
            {step === 'coach' && <CoachStep sport={sport} onChoose={chooseCoach} isEn={isEn} />}
            {step === 'class' && <ClassStep coach={coach} onEnroll={setPendingClass} onCancel={cls => { setCancelReason(''); setPendingCancel(cls); }} isEn={isEn} />}
          </section>
        </>
      )}

      <Modal isOpen={Boolean(pendingClass)} onClose={() => !submitting && setPendingClass(null)} title={isEn ? 'Confirm enrollment' : 'Xác nhận đăng ký'}>
        {pendingClass && (
          <div className="space-y-4">
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Sport' : 'Môn'}</dt><dd className="font-semibold text-brand-navy-900 dark:text-white">{sport?.name}</dd>
              <dt className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Coach' : 'HLV'}</dt><dd className="font-semibold text-brand-navy-900 dark:text-white">{coach?.fullName}</dd>
              <dt className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Class' : 'Lớp'}</dt><dd className="font-semibold text-brand-navy-900 dark:text-white">{pendingClass.name}</dd>
              <dt className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Schedule' : 'Lịch'}</dt>
              <dd className="font-semibold text-brand-navy-900 dark:text-white">{formatSchedules(pendingClass.schedules, isEn).join(', ') || '—'}</dd>
              <dt className="text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Package' : 'Gói dùng'}</dt>
              <dd className="font-semibold text-brand-navy-900 dark:text-white">
                {(options?.subscriptions || []).find(s => s.subscriptionId === pendingClass.eligibleSubscriptionId)?.packageName || '—'}
              </dd>
            </dl>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'After enrolling, book each session from the class schedule.' : 'Sau khi đăng ký, bạn đặt chỗ từng buổi trong mục Lịch lớp.'}
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" disabled={submitting} onClick={() => setPendingClass(null)}
                className="min-h-[44px] px-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 font-semibold text-brand-navy-700 dark:text-brand-navy-200 disabled:opacity-50">
                {isEn ? 'Back' : 'Quay lại'}
              </button>
              <button type="button" disabled={submitting} onClick={confirmEnroll} aria-busy={submitting}
                className="min-h-[44px] px-5 rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <span aria-hidden="true" className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                {isEn ? 'Confirm enrollment' : 'Xác nhận đăng ký'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(pendingCancel)} onClose={() => !submitting && setPendingCancel(null)} title={isEn ? 'Cancel enrollment' : 'Hủy đăng ký lớp'}>
        {pendingCancel && (
          <div className="space-y-4">
            <p className="text-sm text-brand-navy-700 dark:text-brand-navy-200">
              {isEn ? `Cancel your enrollment in ${pendingCancel.name}?` : `Bạn muốn hủy đăng ký lớp ${pendingCancel.name}?`}
            </p>
            <div>
              <label htmlFor="cancel-reason" className="block text-sm font-semibold text-brand-navy-800 dark:text-brand-navy-100">{isEn ? 'Reason (optional)' : 'Lý do (không bắt buộc)'}</label>
              <textarea id="cancel-reason" rows={3} maxLength={500} value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-900 p-3 text-sm text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-500" />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" disabled={submitting} onClick={() => setPendingCancel(null)}
                className="min-h-[44px] px-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 font-semibold text-brand-navy-700 dark:text-brand-navy-200 disabled:opacity-50">
                {isEn ? 'Keep class' : 'Giữ lớp'}
              </button>
              <button type="button" disabled={submitting} onClick={() => confirmCancel(cancelReason.trim())} aria-busy={submitting}
                className="min-h-[44px] px-5 rounded-xl bg-brand-danger-600 hover:bg-brand-danger-700 text-white font-bold disabled:opacity-60">
                {isEn ? 'Cancel enrollment' : 'Hủy đăng ký'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
