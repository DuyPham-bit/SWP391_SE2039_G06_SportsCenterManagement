import React, { useEffect, useMemo, useState } from 'react';
import { classApi } from '../../../entities/class/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';

const DAY_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hhmm = value => String(value || '').slice(0, 5);
const day = value => (value ? String(value).split('-').reverse().join('/') : '—');

/**
 * Member self-enrollment into long-term classes: sport → coach → class, with the backend deciding
 * eligibility per class (eligibleSubscriptionId / blockedReason) so the UI never offers what the API rejects.
 */
export function MemberClassEnrollment() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showSuccess, showError, confirm } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyClassId, setBusyClassId] = useState(null);
  const [sportFilter, setSportFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await classApi.getEnrollmentOptions());
    } catch (e) {
      setError(e?.message || (isEn ? 'Unable to load classes.' : 'Không tải được danh sách lớp.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sports = useMemo(() => data?.sports || [], [data]);
  const visibleSports = sportFilter === 'ALL' ? sports : sports.filter(s => String(s.sportId) === sportFilter);
  const packageName = id => data?.subscriptions?.find(s => s.subscriptionId === id)?.packageName || '';

  const enroll = async (cls) => {
    setBusyClassId(cls.classId);
    try {
      await classApi.enroll(cls.classId, cls.eligibleSubscriptionId);
      showSuccess(isEn ? `Enrolled in ${cls.name}.` : `Đã ghi danh lớp ${cls.name}.`);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setBusyClassId(null);
    }
  };

  const cancel = async (cls) => {
    const ok = await confirm({
      title: isEn ? 'Leave this class?' : 'Hủy ghi danh lớp?',
      message: isEn ? `Leave ${cls.name}? Your seat will be released.` : `Hủy ghi danh lớp ${cls.name}? Chỗ của bạn sẽ được nhường cho người khác.`,
      detail: isEn
        ? 'Cancellation is refused within 2 hours of a session starting.'
        : 'Không thể hủy trong vòng 2 tiếng trước giờ bắt đầu buổi học.',
      confirmText: isEn ? 'Leave class' : 'Hủy ghi danh'
    });
    if (!ok) return;
    setBusyClassId(cls.classId);
    try {
      await classApi.cancelEnrollment(cls.classId, cls.enrollmentId, null);
      showSuccess(isEn ? `Left ${cls.name}.` : `Đã hủy ghi danh lớp ${cls.name}.`);
      await load();
    } catch (e) {
      showError(e);
    } finally {
      setBusyClassId(null);
    }
  };

  if (loading && !data) return <LoadingSpinner text={isEn ? 'Loading classes...' : 'Đang tải danh sách lớp...'} />;

  return (
    <div className="space-y-6 pb-12">
      <header className="rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 to-brand-sand-500 text-white p-6 shadow-xl">
        <h1 className="font-chivo text-2xl font-black">{isEn ? 'Join a Class' : 'Ghi danh lớp học'}</h1>
        <p className="text-sm text-white/90 mt-1 max-w-2xl">
          {isEn
            ? 'Long-term classes you can join with your current package. Each class shows why it is available or not.'
            : 'Các lớp dài hạn bạn có thể tham gia bằng gói hiện tại. Mỗi lớp đều ghi rõ lý do được hoặc chưa được ghi danh.'}
        </p>
      </header>

      {error && (
        <div role="alert" className="p-3 rounded-xl border border-brand-danger-200 bg-brand-danger-50 text-brand-danger-700 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={load} className="px-3 py-1.5 rounded-lg bg-brand-danger-600 text-white text-xs font-bold cursor-pointer">
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      )}

      {data && (
        <>
          <section aria-label={isEn ? 'My packages' : 'Gói tập của tôi'} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!data.subscriptions?.length ? (
              <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-2xl border border-brand-sand-300 bg-brand-sand-50 text-sm text-brand-navy-700">
                {isEn ? 'You need an active package to join a class. ' : 'Bạn cần có gói tập còn hiệu lực để ghi danh lớp. '}
                <a href="#/member/packages" className="font-bold underline">{isEn ? 'View packages' : 'Xem gói tập'}</a>
              </div>
            ) : data.subscriptions.map(s => (
              <div key={s.subscriptionId} className="p-4 rounded-2xl border border-brand-navy-200 bg-white dark:bg-brand-navy-900 dark:border-brand-navy-800">
                <div className="font-bold text-brand-navy-900 dark:text-white">{s.packageName}</div>
                <div className="text-xs text-brand-navy-500 mt-1">{day(s.startDate)} – {day(s.endDate)}</div>
                <div className="text-xs text-brand-navy-600 dark:text-brand-navy-300 mt-2">
                  {isEn ? 'Classes used' : 'Lớp đã dùng'}: <strong>{s.usedClasses}{s.maxClasses != null ? `/${s.maxClasses}` : ''}</strong>
                  {' · '}
                  {isEn ? 'Sports' : 'Môn'}: <strong>{s.usedSportIds?.length || 0}{s.allowedSports > 0 ? `/${s.allowedSports}` : ''}</strong>
                </div>
              </div>
            ))}
          </section>

          {sports.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label={isEn ? 'Filter by sport' : 'Lọc theo môn'}>
              {[{ sportId: 'ALL', name: isEn ? 'All sports' : 'Tất cả môn' }, ...sports].map(s => (
                <button
                  key={s.sportId}
                  type="button"
                  onClick={() => setSportFilter(String(s.sportId))}
                  aria-pressed={sportFilter === String(s.sportId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${sportFilter === String(s.sportId)
                    ? 'bg-brand-navy-900 text-white border-brand-navy-900'
                    : 'bg-white dark:bg-brand-navy-900 text-brand-navy-700 dark:text-brand-navy-200 border-brand-navy-200 dark:border-brand-navy-700'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {!visibleSports.length ? (
            <p className="text-sm text-brand-navy-500">{isEn ? 'No open classes at your center right now.' : 'Hiện trung tâm chưa có lớp nào đang mở.'}</p>
          ) : visibleSports.map(sport => (
            <section key={sport.sportId} className="space-y-3">
              <h2 className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">
                {sport.name}
                {sport.isEnrolled && <span className="ml-2 text-xs font-bold text-brand-sage-700">{isEn ? '· enrolled' : '· đang học'}</span>}
              </h2>
              {(sport.coaches || []).map(coach => (
                <div key={coach.coachId} className="rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 p-4 space-y-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-bold text-brand-navy-900 dark:text-white">{isEn ? 'Coach' : 'HLV'} {coach.fullName}</span>
                    {coach.specialization && <span className="text-xs text-brand-navy-500">{coach.specialization}</span>}
                    {coach.averageRating != null && (
                      <span className="text-xs text-brand-sand-700">★ {coach.averageRating} ({coach.reviewCount})</span>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {(coach.classes || []).map(cls => (
                      <article key={cls.classId} className="rounded-xl border border-brand-navy-100 dark:border-brand-navy-800 p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm text-brand-navy-900 dark:text-white">{cls.name}</h3>
                            <p className="text-[11px] text-brand-navy-500">
                              {[cls.level, cls.roomName].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-brand-navy-600 dark:text-brand-navy-300 whitespace-nowrap">
                            {cls.enrolledCount}/{cls.capacity} {isEn ? 'seats' : 'chỗ'}
                          </span>
                        </div>
                        {cls.schedules?.length > 0 && (
                          <ul className="flex flex-wrap gap-1.5">
                            {cls.schedules.map((s, i) => (
                              <li key={i} className="px-2 py-0.5 rounded-lg bg-brand-navy-50 dark:bg-brand-navy-800 text-[11px] text-brand-navy-700 dark:text-brand-navy-200">
                                {(isEn ? DAY_EN : DAY_VI)[s.dayOfWeek % 7]} {hhmm(s.startTime)}–{hhmm(s.endTime)}
                              </li>
                            ))}
                          </ul>
                        )}
                        {cls.enrollmentId ? (
                          <button
                            type="button"
                            onClick={() => cancel(cls)}
                            disabled={busyClassId === cls.classId}
                            className="mt-auto px-3 py-2 rounded-xl border border-brand-danger-300 text-brand-danger-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {isEn ? 'Enrolled · Leave class' : 'Đang học · Hủy ghi danh'}
                          </button>
                        ) : cls.eligibleSubscriptionId ? (
                          <button
                            type="button"
                            onClick={() => enroll(cls)}
                            disabled={busyClassId === cls.classId}
                            className="mt-auto px-3 py-2 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            {busyClassId === cls.classId
                              ? (isEn ? 'Enrolling...' : 'Đang ghi danh...')
                              : `${isEn ? 'Join with' : 'Ghi danh bằng'} ${packageName(cls.eligibleSubscriptionId)}`}
                          </button>
                        ) : (
                          <p className="mt-auto text-[11px] font-semibold text-brand-sand-800 dark:text-brand-sand-300">
                            {cls.blockedReason || (isEn ? 'Not available with your package.' : 'Chưa thể ghi danh với gói hiện tại.')}
                          </p>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
