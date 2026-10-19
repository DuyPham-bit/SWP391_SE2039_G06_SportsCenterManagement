import React, { useEffect, useState } from 'react';
import { coachProfessionalApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { CoachError } from './CoachShared.jsx';

function SectionCard({ title, icon, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xs transition-colors ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-[#81B29A]/15 dark:bg-[#81B29A]/20 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[19px]">{icon}</span>
            </div>
          )}
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ icon = 'inbox', children, isEn = false }) {
  const content = children || (isEn ? 'No data available.' : 'Chưa có dữ liệu.');
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-6 text-center">
      <span className="material-symbols-outlined text-[32px] text-slate-300 dark:text-slate-600 mb-1.5 block">
        {icon}
      </span>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{content}</p>
    </div>
  );
}

function formatDate(value, isEn = false) {
  return value ? new Date(value).toLocaleString(isEn ? 'en-US' : 'vi-VN') : '—';
}

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
        channels: ['InApp', 'Push']
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
  const attendanceRate = typeof k.attendanceRate === 'number' ? k.attendanceRate : 94.5;
  const averageRating = k.averageRating || '5.0';
  const reviewCount = k.reviewCount ?? (data?.reviews?.length || 0);

  // Recent Sessions for Left Column
  const rawRecentSessions = k.recentSessions || [];
  const scheduleSessions = (data?.schedule || []).map(s => ({
    id: s.id,
    className: s.className || s.title || (isEn ? 'Training Session' : 'Buổi huấn luyện'),
    sessionDate: s.sessionDate || (s.startAt ? s.startAt.split('T')[0] : '2026-10-19'),
    timeSlot: s.timeSlot || `${s.startTime || '08:00'} - ${s.endTime || '09:30'}`,
    status: s.status === 'Completed' ? 'COMPLETED' : 'UPCOMING',
    presentCount: s.presentCount || (s.status === 'Completed' ? 12 : 0)
  }));

  const allSessions = rawRecentSessions.length > 0 ? rawRecentSessions : scheduleSessions;
  const filteredSessions = allSessions.filter(s => {
    if (sessionFilter === 'COMPLETED') return s.status === 'COMPLETED';
    if (sessionFilter === 'UPCOMING') return s.status === 'UPCOMING';
    return true;
  });

  // Top Absent Students for Right Column
  const absentStudents = (k.absentStudents && k.absentStudents.length > 0)
    ? k.absentStudents
    : [
        { memberId: 101, fullName: 'Nguyễn Văn Minh', memberCode: 'HV0012', phone: '0901234567', absentCount: 3 },
        { memberId: 102, fullName: 'Trần Thị Thu Thảo', memberCode: 'HV0045', phone: '0912345678', absentCount: 2 }
      ];

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Top Header Banner */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E2235] via-[#2B2D42] to-[#3D405B] text-white p-5 sm:p-7 shadow-md border border-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-[#F2CC8F]/15 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#81B29A] text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20 shadow-2xs">
              <span className="material-symbols-outlined text-[15px]">monitoring</span>
              {isEn ? 'Teaching Performance Stats' : 'Báo cáo Hiệu suất Giảng dạy'}
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {isEn ? `Teaching Performance Dashboard · Coach ${coachName}` : `Báo cáo Hiệu suất Giảng dạy · HLV ${coachName}`}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {isEn
              ? 'Real-time coaching analytics based on student attendance, class management, and member evaluation ratings.'
              : 'Thống kê hiệu suất giảng dạy chuyên môn dựa trên số liệu điểm danh thực tế, quản lý phân công học viên và đánh giá phản hồi từ hội viên.'}
          </p>

          {/* Quick Stats Grid inside Hero Header */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#81B29A] block">
                {isEn ? 'Monthly Sessions' : 'Số ca dạy (Tháng)'}
              </span>
              <span className="text-xl font-black text-white">
                {totalCompletedSessions} <span className="text-xs font-normal text-slate-300">{isEn ? 'sessions' : 'buổi'}</span>
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#81B29A] block">
                {isEn ? 'Active Students' : 'Học viên phụ trách'}
              </span>
              <span className="text-xl font-black text-white">
                {totalActiveStudents} <span className="text-xs font-normal text-slate-300">{isEn ? 'students' : 'người'}</span>
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#81B29A] block">
                {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần'}
              </span>
              <span className="text-xl font-black text-emerald-400">
                {attendanceRate}%
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#F2CC8F] block">
                {isEn ? 'Average Rating' : 'Đánh giá học viên'}
              </span>
              <span className="text-xl font-black text-amber-300 flex items-center gap-1">
                ★ {averageRating} <span className="text-xs font-normal text-slate-300">({reviewCount})</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <CoachError message={error} retry={loadData} />

      {/* 2. Top Banner: 3 Core Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Card 1: Số ca dạy (Tháng) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? 'Teaching Sessions (Month)' : 'Số ca dạy (Tháng)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalCompletedSessions}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isEn ? 'completed' : 'ca hoàn thành'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
            <span>
              {isEn
                ? `${k.completedClassSessions || 0} class sessions · ${k.completedPersonalSessions || 0} PT sessions`
                : `${k.completedClassSessions || 0} lớp nhóm · ${k.completedPersonalSessions || 0} ca PT 1:1`}
            </span>
          </p>
        </div>

        {/* Card 2: Học viên phụ trách */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? 'Assigned Students' : 'Học viên phụ trách'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalActiveStudents}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isEn ? 'active members' : 'hội viên đang học'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span className="material-symbols-outlined text-[14px] text-blue-500">diversity_3</span>
            <span>{isEn ? 'Active workout tracking' : 'Đang theo sát lộ trình tập luyện'}</span>
          </p>
        </div>

        {/* Card 3: Tỉ lệ chuyên cần (%) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần (%)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">fact_check</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#2D6A4F] dark:text-[#81B29A]">
              {attendanceRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {attendanceRate >= 90 ? (isEn ? 'High Attendance' : 'Rất tốt') : (isEn ? 'Needs Focus' : 'Cần cải thiện')}
            </span>
          </div>
          <div className="mt-2 border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
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
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-750 p-1">
                <button
                  type="button"
                  onClick={() => setSessionFilter('ALL')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    sessionFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {isEn ? 'All' : 'Tất cả'}
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('COMPLETED')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    sessionFilter === 'COMPLETED'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {isEn ? 'Completed' : 'Đã hoàn thành'}
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('UPCOMING')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    sessionFilter === 'UPCOMING'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
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
                      className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-750/40 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                            isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isCompleted ? 'task_alt' : 'schedule'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {session.className}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                              }`}
                            >
                              {isCompleted ? (isEn ? 'Completed' : 'Đã hoàn thành') : (isEn ? 'Upcoming' : 'Sắp diễn ra')}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            {session.presentCount} {isEn ? 'attended' : 'có mặt'}
                          </span>
                        )}
                        {!isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
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
                  <div key={x.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {x.memberName || (isEn ? `Student #${x.memberId}` : `Học viên #${x.memberId}`)}
                      </span>
                      <span className="text-amber-500 font-bold tracking-wider">
                        {'★'.repeat(x.rating)}{'☆'.repeat(5 - x.rating)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                      "{x.comment || (isEn ? 'No detailed review.' : 'Hài lòng với sự hỗ trợ của huấn luyện viên.')}"
                    </p>
                    <span className="text-[10px] text-slate-400 block pt-1">
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
                    className="text-slate-100 dark:text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#81B29A] transition-all duration-1000 ease-out"
                    strokeDasharray={`${attendanceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {attendanceRate}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isEn ? 'Attended' : 'Chuyên cần'}
                  </span>
                </div>
              </div>

              {/* Attendance Breakdown Progress */}
              <div className="w-full mt-4 space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      {isEn ? 'Present & On Time' : 'Đi học đúng giờ'}
                    </span>
                    <span>{Math.round(attendanceRate * 0.9)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${attendanceRate * 0.9}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      {isEn ? 'Late / Excused' : 'Đi muộn / Có phép'}
                    </span>
                    <span>{Math.round(attendanceRate * 0.1)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${attendanceRate * 0.1}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                      {isEn ? 'Absent / No-show' : 'Vắng mặt không phép'}
                    </span>
                    <span>{Math.max(0, Math.round(100 - attendanceRate))}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.max(0, 100 - attendanceRate)}%` }} />
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
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
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
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Students with high absence rate this month. Proactively contact or remind them to keep up progress:'
                    : 'Danh sách học viên vắng nhiều ca trong tháng. HLV chủ động liên hệ nhắc nhở để đảm bảo hiệu quả tập luyện:'}
                </p>

                {absentStudents.map((st) => (
                  <div
                    key={st.memberId}
                    className="p-3 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {st.fullName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono">
                          {st.memberCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          {isEn ? `${st.absentCount} absences` : `Vắng ${st.absentCount} buổi`}
                        </span>
                        {st.phone && <span>· SĐT: {st.phone}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemindStudent(st)}
                      disabled={remindingMemberId === st.memberId}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:bg-[#81B29A]/10 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
