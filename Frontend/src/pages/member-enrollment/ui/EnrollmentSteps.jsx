import React from 'react';
import { getSportTheme } from '../../../entities/member/index.js';
import { blockedMessage, classState, formatSchedules, seatsLeft, summarizeCoach, summarizeSport } from '../model/enrollmentView.js';

const cardBase = 'group w-full text-left rounded-2xl border bg-white dark:bg-brand-navy-900 p-5 transition-all duration-200 '
  + 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-navy-950';
const interactive = 'border-brand-navy-100 dark:border-brand-navy-700 hover:border-brand-teal-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer';

function Icon({ name, className = '' }) {
  return <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function Badge({ tone = 'neutral', icon, children }) {
  const tones = {
    neutral: 'bg-brand-navy-50 text-brand-navy-700 border-brand-navy-200 dark:bg-brand-navy-800 dark:text-brand-navy-200 dark:border-brand-navy-700',
    success: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200 dark:bg-brand-sage-950/40 dark:text-brand-sage-300 dark:border-brand-sage-800',
    warning: 'bg-brand-sand-50 text-brand-sand-800 border-brand-sand-200 dark:bg-brand-sand-950/40 dark:text-brand-sand-300 dark:border-brand-sand-800',
    info: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200 dark:bg-brand-teal-950/40 dark:text-brand-teal-300 dark:border-brand-teal-800'
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
      {icon && <Icon name={icon} className="text-[14px]" />}
      {children}
    </span>
  );
}

function Initials({ name }) {
  const initials = String(name || '?').trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
  return (
    <div aria-hidden="true" className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-brand-teal-500 to-brand-sage-600 text-white font-chivo font-black text-lg flex items-center justify-center shadow-md">
      {initials}
    </div>
  );
}

function EmptyState({ icon, title, hint }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-navy-200 dark:border-brand-navy-700 p-10 text-center">
      <Icon name={icon} className="text-4xl text-brand-navy-300 dark:text-brand-navy-600" />
      <p className="mt-2 font-bold text-brand-navy-800 dark:text-brand-navy-100">{title}</p>
      {hint && <p className="mt-1 text-sm text-brand-navy-500 dark:text-brand-navy-400">{hint}</p>}
    </div>
  );
}

export function SportStep({ sports, onChoose, isEn }) {
  if (sports.length === 0) {
    return <EmptyState icon="sports" title={isEn ? 'No classes open yet' : 'Chưa có lớp nào mở đăng ký'}
      hint={isEn ? 'Please check back later or contact the front desk.' : 'Vui lòng quay lại sau hoặc liên hệ quầy lễ tân.'} />;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={isEn ? 'Sports' : 'Danh sách môn'}>
      {sports.map(sport => {
        const theme = getSportTheme(sport.name, '', isEn);
        const summary = summarizeSport(sport);
        return (
          <li key={sport.sportId}>
            <button type="button" onClick={() => onChoose(sport.sportId)} className={`${cardBase} ${interactive} h-full`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-white ${theme.dot}`}>
                  <Icon name={theme.icon || 'sports'} className="text-[26px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">{sport.name}</h3>
                  {sport.description && <p className="mt-0.5 text-sm text-brand-navy-500 dark:text-brand-navy-400 line-clamp-2">{sport.description}</p>}
                </div>
                <Icon name="chevron_right" className="text-brand-navy-300 group-hover:text-brand-teal-600 transition-colors" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge icon="sports_handball">{summary.coachCount} {isEn ? 'coaches' : 'HLV'}</Badge>
                {summary.isEnrolled && <Badge tone="success" icon="check_circle">{isEn ? 'Enrolled' : 'Đang học'}</Badge>}
                {!summary.isEnrolled && summary.availableCount > 0 && <Badge tone="info" icon="event_available">{summary.availableCount} {isEn ? 'open classes' : 'lớp có thể đăng ký'}</Badge>}
                {!summary.isEnrolled && summary.availableCount === 0 && summary.blockedCode === 'SPORT_LIMIT' && <Badge tone="warning" icon="lock">{isEn ? 'Upgrade to add' : 'Cần nâng cấp gói'}</Badge>}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function CoachStep({ sport, onChoose, isEn }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2" aria-label={isEn ? 'Coaches' : 'Danh sách HLV'}>
      {sport.coaches.map(coach => {
        const summary = summarizeCoach(coach);
        return (
          <li key={coach.coachId}>
            <button type="button" onClick={() => onChoose(coach.coachId)} className={`${cardBase} ${interactive} h-full`}>
              <div className="flex items-start gap-4">
                <Initials name={coach.fullName} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">{coach.fullName}</h3>
                  <p className="text-sm font-medium text-brand-teal-700 dark:text-brand-teal-300">{coach.specialization || sport.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-navy-600 dark:text-brand-navy-300">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="star" className="text-[18px] text-brand-sand-500" />
                      {summary.ratingLabel
                        ? <><strong className="text-brand-navy-900 dark:text-white">{summary.ratingLabel}</strong><span>({coach.reviewCount} {isEn ? 'reviews' : 'đánh giá'})</span></>
                        : <span>{isEn ? 'No reviews yet' : 'Chưa có đánh giá'}</span>}
                    </span>
                    {coach.experienceYears != null && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="military_tech" className="text-[18px] text-brand-teal-600" />
                        {coach.experienceYears} {isEn ? 'yrs experience' : 'năm kinh nghiệm'}
                      </span>
                    )}
                  </div>
                </div>
                <Icon name="chevron_right" className="text-brand-navy-300 group-hover:text-brand-teal-600 transition-colors" />
              </div>
              {coach.certification && (
                <p className="mt-3 text-xs text-brand-navy-500 dark:text-brand-navy-400 inline-flex items-center gap-1">
                  <Icon name="workspace_premium" className="text-[16px]" />{coach.certification}
                </p>
              )}
              {coach.bio && <p className="mt-2 text-sm text-brand-navy-600 dark:text-brand-navy-300 line-clamp-2">{coach.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge icon="groups">{coach.classes.length} {isEn ? 'classes' : 'lớp'}</Badge>
                {summary.isEnrolled && <Badge tone="success" icon="check_circle">{isEn ? 'Your coach' : 'HLV của bạn'}</Badge>}
                {summary.availableCount > 0 && <Badge tone="info" icon="event_available">{summary.availableCount} {isEn ? 'open' : 'lớp còn nhận'}</Badge>}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ClassStep({ coach, onEnroll, onCancel, isEn }) {
  return (
    <ul className="grid gap-4 lg:grid-cols-2" aria-label={isEn ? 'Classes' : 'Danh sách lớp'}>
      {coach.classes.map(cls => {
        const state = classState(cls);
        const seats = seatsLeft(cls);
        const schedules = formatSchedules(cls.schedules, isEn);
        const fillPct = cls.capacity > 0 ? Math.min(100, Math.round((cls.enrolledCount / cls.capacity) * 100)) : 0;
        return (
          <li key={cls.classId} className={`${cardBase} ${state === 'enrolled' ? 'border-brand-sage-300 dark:border-brand-sage-700' : 'border-brand-navy-100 dark:border-brand-navy-700'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">{cls.name}</h3>
                <p className="mt-0.5 text-sm text-brand-navy-500 dark:text-brand-navy-400">
                  {[cls.level, cls.roomName].filter(Boolean).join(' · ') || (isEn ? 'Room to be announced' : 'Phòng sẽ được thông báo')}
                </p>
              </div>
              {state === 'enrolled' && <Badge tone="success" icon="check_circle">{isEn ? 'Enrolled' : 'Đã đăng ký'}</Badge>}
              {state === 'blocked' && cls.blockedCode === 'CLASS_FULL' && <Badge tone="warning" icon="block">{isEn ? 'Full' : 'Hết chỗ'}</Badge>}
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Weekly schedule' : 'Lịch học hàng tuần'}</p>
              {schedules.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {schedules.map(label => (
                    <li key={label} className="px-2.5 py-1 rounded-lg bg-brand-navy-50 dark:bg-brand-navy-800 text-sm font-semibold text-brand-navy-800 dark:text-brand-navy-100 tabular-nums">{label}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Schedule being updated' : 'Lịch đang được cập nhật'}</p>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-navy-600 dark:text-brand-navy-300">{isEn ? 'Seats' : 'Chỗ'}</span>
                <span className="font-semibold text-brand-navy-900 dark:text-white tabular-nums">
                  {isEn ? `${seats} left of ${cls.capacity}` : `Còn ${seats}/${cls.capacity}`}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 overflow-hidden" role="progressbar"
                aria-valuemin={0} aria-valuemax={cls.capacity} aria-valuenow={cls.enrolledCount}
                aria-label={isEn ? 'Class occupancy' : 'Mức lấp đầy lớp'}>
                <div className={`h-full rounded-full ${fillPct >= 90 ? 'bg-brand-sand-500' : 'bg-brand-teal-500'}`} style={{ width: `${fillPct}%` }} />
              </div>
            </div>

            <div className="mt-5">
              {state === 'available' && (
                <button type="button" onClick={() => onEnroll(cls)}
                  className="w-full min-h-[44px] rounded-xl bg-brand-teal-600 hover:bg-brand-teal-700 text-white font-bold transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-500 focus-visible:ring-offset-2 active:scale-[0.98]">
                  <Icon name="how_to_reg" className="text-[20px]" />
                  {isEn ? 'Enroll in this class' : 'Đăng ký lớp này'}
                </button>
              )}
              {state === 'enrolled' && (
                <button type="button" onClick={() => onCancel(cls)}
                  className="w-full min-h-[44px] rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-500">
                  {isEn ? 'Cancel enrollment' : 'Hủy đăng ký'}
                </button>
              )}
              {state === 'blocked' && (
                <p className="flex items-start gap-2 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/30 border border-brand-sand-200 dark:border-brand-sand-800 p-3 text-sm text-brand-sand-900 dark:text-brand-sand-200">
                  <Icon name="info" className="text-[18px] mt-px" />
                  <span>
                    {blockedMessage(cls, isEn)}
                    {(cls.blockedCode === 'NO_PACKAGE' || cls.blockedCode === 'SPORT_LIMIT' || cls.blockedCode === 'CLASS_LIMIT') && (
                      <> <a href="#/member/packages" className="font-bold underline underline-offset-2 hover:no-underline">{isEn ? 'View packages' : 'Xem gói tập'}</a></>
                    )}
                  </span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
