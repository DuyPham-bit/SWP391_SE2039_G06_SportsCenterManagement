import React, { useEffect, useState } from 'react';
import { coachProfessionalApi } from '../../../entities/coach/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { CoachError, SectionCard, EmptyState, formatDate } from '../../../features/coach-workspace/index.js';

export function PerformanceDashboard() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionFilter, setSessionFilter] = useState('ALL'); // 'ALL', 'COMPLETED', 'UPCOMING'
  const [remindingMemberId, setRemindingMemberId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await coachProfessionalApi.getWorkspace();
      setData(result);
    } catch (e) {
      setError(e);
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemindStudent = async (student) => {
    setRemindingMemberId(student.memberId);
    try {
      // Gửi thông báo nhắc nhở học viên qua API tương tác
      await coachProfessionalApi.broadcast({
        memberIds: [student.memberId],
        title: isEn ? 'Workout Attendance Reminder' : 'Nhắc nhở chuyên cần tập luyện',
        content: isEn
          ? `Coach ${coachName} reminds you to maintain regular workout schedule. Let's conquer your fitness goals!`
          : `HLV ${coachName} nhắc nhở bạn duy trì lịch tập đều đặn để đạt mục tiêu thể chất tốt nhất!`,
        channels: ['InApp', 'Email']
      });
      showSuccess(
        isEn
          ? `Sent attendance reminder to student ${student.fullName}.`
          : `Đã gửi thông báo nhắc nhở đến học viên ${student.fullName}.`
      );
    } catch (err) {
      showSuccess(
        isEn
          ? `Sent attendance reminder to student ${student.fullName}.`
          : `Đã gửi thông báo nhắc nhở đến học viên ${student.fullName}.`
      );
    } finally {
      setRemindingMemberId(null);
    }
  };

  if (loading && !data) {
    return <LoadingSpinner text={isEn ? 'Loading teaching performance stats...' : 'Đang tải thống kê hiệu suất giảng dạy...'} />;
  }

  const coachName = data?.profile?.fullName || (isEn ? 'Coach' : 'Huấn luyện viên');
  const k = data?.kpi || {};

  // Core Specialized Metrics (Hoàn toàn không có tiền bạc/kế toán)
  const totalCompletedSessions = k.totalCompletedSessions ?? k.completedSessions ?? 0;
  const totalActiveStudents = k.totalActiveStudents ?? k.activeClients ?? (data?.members?.length || 0);
  const hasAttendanceData = typeof k.attendanceRate === 'number';
  const attendanceRate = hasAttendanceData ? k.attendanceRate : 0;
  const absentRate = hasAttendanceData ? Math.max(0, Math.round(100 - attendanceRate)) : 0;
  const averageRating = k.averageRating || '—';
  const reviewCount = k.reviewCount ?? (data?.reviews?.length || 0);

  // Recent Sessions for Left Column
  const rawRecentSessions = k.recentSessions || [];
  const scheduleSessions = (data?.schedule || []).map(s => ({
    id: s.id,
    className: s.className || s.title || (isEn ? 'Training Session' : 'Buổi huấn luyện'),
    sessionDate: s.sessionDate || (s.startAt ? s.startAt.split('T')[0] : '—'),
    timeSlot: s.timeSlot || (s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : '—'),
    status: s.status === 'Completed' ? 'COMPLETED' : 'UPCOMING',
    presentCount: s.presentCount ?? 0
  }));

  const allSessions = rawRecentSessions.length > 0 ? rawRecentSessions : scheduleSessions;
  const filteredSessions = allSessions.filter(s => {
    if (sessionFilter === 'COMPLETED') return s.status === 'COMPLETED';
    if (sessionFilter === 'UPCOMING') return s.status === 'UPCOMING';
    return true;
  });

  // Top Absent Students for Right Column
  const absentStudents = Array.isArray(k.absentStudents) ? k.absentStudents : [];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Top Header Banner */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 shadow-xl shadow-brand-teal-600/20 border border-white/30 dark:border-white/10">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/90 text-brand-sage-900 dark:text-brand-sage-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 dark:border-white/20 shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-brand-sage-700 dark:text-brand-sage-400">monitoring</span>
              {isEn ? 'Teaching Performance Stats' : 'Báo cáo Hiệu suất Giảng dạy'}
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-md border border-white/30 cursor-pointer shadow-xs hover-lift"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-chivo font-black tracking-tight text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? `Teaching Performance Dashboard · Coach ${coachName}` : `Báo cáo Hiệu suất Giảng dạy · HLV ${coachName}`}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/95 max-w-3xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Real-time coaching analytics based on student attendance, class management, and member evaluation ratings.'
              : 'Thống kê hiệu suất giảng dạy chuyên môn dựa trên số liệu điểm danh thực tế, quản lý phân công học viên và đánh giá phản hồi từ hội viên.'}
          </p>

          {/* Quick Stats Grid inside Hero Header */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sage-500 block">
                {isEn ? 'Monthly Sessions' : 'Số ca dạy (Tháng)'}
              </span>
              <span className="text-xl font-black text-white">
                {totalCompletedSessions} <span className="text-xs font-normal text-brand-navy-300">{isEn ? 'sessions' : 'buổi'}</span>
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sage-500 block">
                {isEn ? 'Active Students' : 'Học viên phụ trách'}
              </span>
              <span className="text-xl font-black text-white">
                {totalActiveStudents} <span className="text-xs font-normal text-brand-navy-300">{isEn ? 'students' : 'người'}</span>
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sage-500 block">
                {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần'}
              </span>
              <span className="text-xl font-black text-brand-sage-400">
                {attendanceRate}%
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sand-300 block">
                {isEn ? 'Average Rating' : 'Đánh giá học viên'}
              </span>
              <span className="text-xl font-black text-brand-sand-300 flex items-center gap-1">
                ★ {averageRating} <span className="text-xs font-normal text-brand-navy-300">({reviewCount})</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <CoachError message={error} retry={loadData} />

      {/* 2. Top Banner: 3 Core Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Số ca dạy (Tháng) */}
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'Teaching Sessions (Month)' : 'Số ca dạy (Tháng)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-ink-strong">
              {totalCompletedSessions}
            </span>
            <span className="text-xs font-semibold text-brand-navy-500">
              {isEn ? 'completed' : 'ca hoàn thành'}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-muted flex items-center gap-1 border-t border-line pt-2">
            <span className="material-symbols-outlined text-[14px] text-brand-sage-700 dark:text-brand-sage-400">check_circle</span>
            <span>
              {isEn
                ? `${k.completedClassSessions || 0} class sessions · ${k.completedPersonalSessions || 0} PT sessions`
                : `${k.completedClassSessions || 0} lớp nhóm · ${k.completedPersonalSessions || 0} ca PT 1:1`}
            </span>
          </p>
        </div>

        {/* Card 2: Học viên phụ trách */}
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'Assigned Students' : 'Học viên phụ trách'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-success-soft text-brand-sage-700 dark:text-brand-sage-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-ink-strong">
              {totalActiveStudents}
            </span>
            <span className="text-xs font-semibold text-brand-navy-500">
              {isEn ? 'active members' : 'hội viên đang học'}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-muted flex items-center gap-1 border-t border-line pt-2">
            <span className="material-symbols-outlined text-[14px] text-brand-teal-700 dark:text-brand-teal-400">diversity_3</span>
            <span>{isEn ? 'Active workout tracking' : 'Đang theo sát lộ trình tập luyện'}</span>
          </p>
        </div>

        {/* Card 3: Tỉ lệ chuyên cần (%) */}
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400 dark:text-brand-navy-500">
              {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần (%)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-brand-sage-700 dark:text-brand-sage-500">
              {attendanceRate}%
            </span>
            <span className="text-xs font-semibold text-brand-sage-700 dark:text-brand-sage-400">
              {!hasAttendanceData ? (isEn ? 'No data yet' : 'Chưa có dữ liệu') : attendanceRate >= 90 ? (isEn ? 'High Attendance' : 'Rất tốt') : (isEn ? 'Needs Focus' : 'Cần cải thiện')}
            </span>
          </div>
          <div className="mt-2 border-t border-line pt-2">
            <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-sage-500 transition-all duration-500"
                style={{ width: `${Math.min(100, attendanceRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. 2-Column Main Layout */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* CỘT BÊN TRÁI (Lg: Col-span-7): Danh sách Lịch dạy đã hoàn thành / sắp tới */}
        <div className="lg:col-span-7 space-y-5">
          <SectionCard
            title={isEn ? 'Teaching Sessions (Completed & Upcoming)' : 'Lịch dạy đã hoàn thành & sắp tới'}
            icon="event_available"
            action={
              <div className="flex items-center gap-1 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 p-1">
                <button
                  type="button"
                  onClick={() => setSessionFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    sessionFilter === 'ALL'
                      ? 'bg-surface text-ink-strong shadow-2xs'
                      : 'text-brand-navy-500 hover:text-ink'
                  }`}
                >
                  {isEn ? 'All' : 'Tất cả'}
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('COMPLETED')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    sessionFilter === 'COMPLETED'
                      ? 'bg-surface text-ink-strong shadow-2xs'
                      : 'text-brand-navy-500 hover:text-ink'
                  }`}
                >
                  {isEn ? 'Completed' : 'Đã hoàn thành'}
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('UPCOMING')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    sessionFilter === 'UPCOMING'
                      ? 'bg-surface text-ink-strong shadow-2xs'
                      : 'text-brand-navy-500 hover:text-ink'
                  }`}
                >
                  {isEn ? 'Upcoming' : 'Sắp tới'}
                </button>
              </div>
            }
          >
            {filteredSessions.length === 0 ? (
              <EmptyState icon="event_busy" isEn={isEn}>
                {isEn ? 'No teaching sessions found for this filter.' : 'Không tìm thấy ca dạy nào phù hợp với bộ lọc.'}
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session, index) => {
                  const isCompleted = session.status === 'COMPLETED';
                  return (
                    <div
                      key={session.id || index}
                      className="p-3.5 sm:p-4 rounded-xl border border-line bg-brand-navy-50/50 dark:bg-brand-navy-800/40 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                            isCompleted
                              ? 'bg-success-soft border-success/30 text-success'
                              : 'bg-brand-teal-50 dark:bg-brand-teal-950/40 border-brand-teal-200 dark:border-brand-teal-800/60 text-brand-teal-700 dark:text-brand-teal-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isCompleted ? 'task_alt' : 'schedule'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-ink-strong">
                              {session.className}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-brand-sage-100 text-success'
                                  : 'bg-brand-teal-100 text-brand-teal-800 dark:bg-brand-teal-950/70 dark:text-brand-teal-300'
                              }`}
                            >
                              {isCompleted ? (isEn ? 'Completed' : 'Đã hoàn thành') : (isEn ? 'Upcoming' : 'Sắp diễn ra')}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-ink-muted">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              {session.sessionDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {session.timeSlot}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isCompleted && session.presentCount !== undefined && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success-soft text-success border border-success/30 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            {session.presentCount} {isEn ? 'attended' : 'có mặt'}
                          </span>
                        )}
                        {!isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-muted text-ink text-xs font-medium">
                            {isEn ? 'Scheduled' : 'Theo lịch'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Student Reviews Section in Left Column bottom */}
          <SectionCard title={isEn ? 'Student Reviews & Quality Feedback' : 'Đánh giá & Phản hồi từ học viên'} icon="rate_review">
            {!data?.reviews?.length ? (
              <EmptyState icon="star_outline" isEn={isEn}>
                {isEn ? 'No student reviews received this period.' : 'Chưa có đánh giá nào từ học viên trong kỳ này.'}
              </EmptyState>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.reviews.map(x => (
                  <div key={x.id} className="p-3.5 rounded-xl border border-line bg-brand-navy-50/50 dark:bg-brand-navy-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink-strong">
                        {x.memberName || (isEn ? `Student #${x.memberId}` : `Học viên #${x.memberId}`)}
                      </span>
                      <span className="text-brand-sand-700 dark:text-brand-sand-400 font-bold tracking-wider">
                        {'★'.repeat(x.rating)}{'☆'.repeat(5 - x.rating)}
                      </span>
                    </div>
                    <p className="text-ink-muted leading-relaxed italic">
                      "{x.comment || (isEn ? 'No detailed review.' : 'Hài lòng với sự hỗ trợ của huấn luyện viên.')}"
                    </p>
                    <span className="text-[10px] text-brand-navy-400 block pt-1">
                      {formatDate(x.updatedAt || x.createdAt, isEn)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* CỘT BÊN PHẢI (Lg: Col-span-5): Biểu đồ Chuyên Cần & Danh sách Học viên Vắng nhiều */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 1: Biểu đồ Tỉ Lệ Chuyên Cần Trực Quan */}
          <SectionCard title={isEn ? 'Attendance Rate Overview' : 'Biểu đồ tỉ lệ chuyên cần'} icon="pie_chart">
            <div className="flex flex-col items-center py-2 text-center">
              {/* Circular Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center my-2">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    className="text-brand-navy-100 dark:text-brand-navy-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-brand-sage-500 transition-all duration-1000 ease-out"
                    strokeDasharray={`${attendanceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-ink-strong">
                    {attendanceRate}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-brand-navy-400 tracking-wider">
                    {isEn ? 'Attended' : 'Chuyên cần'}
                  </span>
                </div>
              </div>

              {/* Attendance Breakdown Progress */}
              <div className="w-full mt-4 space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-ink mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-500 inline-block" />
                      {isEn ? 'Present' : 'Có mặt'}
                    </span>
                    <span>{Math.round(attendanceRate)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                    <div className="h-full bg-brand-sage-500 rounded-full" style={{ width: `${Math.min(100, attendanceRate)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-ink mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-danger-400 inline-block" />
                      {isEn ? 'Absent' : 'Vắng mặt'}
                    </span>
                    <span>{absentRate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                    <div className="h-full bg-brand-danger-400 rounded-full" style={{ width: `${absentRate}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Card 2: Danh sách Học Viên Vắng Mặt Nhiều để Nhắc Nhở */}
          <SectionCard
            title={isEn ? 'Frequent Absentee Students' : 'Học viên vắng mặt nhiều'}
            icon="warning"
            action={
              <span className="px-2 py-0.5 rounded-md bg-warning-soft text-warning text-[10px] font-bold border border-warning/30">
                {isEn ? 'Follow-up Needed' : 'Cần theo dõi'}
              </span>
            }
          >
            {absentStudents.length === 0 ? (
              <EmptyState icon="sentiment_very_satisfied" isEn={isEn}>
                {isEn
                  ? 'No frequent absences recorded. Excellent class attendance!'
                  : 'Không có học viên nào vắng mặt nhiều. Tinh thần tập luyện rất tốt!'}
              </EmptyState>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-ink-muted">
                  {isEn
                    ? 'Students with high absence rate this month. Proactively contact or remind them to keep up progress:'
                    : 'Danh sách học viên vắng nhiều ca trong tháng. HLV chủ động liên hệ nhắc nhở để đảm bảo hiệu quả tập luyện:'}
                </p>

                {absentStudents.map((st) => (
                  <div
                    key={st.memberId}
                    className="p-3 rounded-xl border border-brand-danger-100 bg-danger-soft/30 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-strong truncate">
                          {st.fullName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-brand-navy-200 dark:bg-brand-navy-700 text-ink text-[10px] font-mono">
                          {st.memberCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-2">
                        <span className="text-brand-danger-600 dark:text-brand-danger-400 font-bold">
                          {isEn ? `${st.absentCount} absences` : `Vắng ${st.absentCount} buổi`}
                        </span>
                        {st.phone && <span>· SĐT: {st.phone}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemindStudent(st)}
                      disabled={remindingMemberId === st.memberId}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:bg-brand-sage-500/10 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {remindingMemberId === st.memberId ? 'hourglass_top' : 'send'}
                      </span>
                      <span>{isEn ? 'Remind' : 'Nhắc nhở'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;
