import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { CoachError, useTeachingSessions } from './CoachShared.jsx';
import { sessionTime } from './coachOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function CoachDashboard() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const links = [
    ['schedule', 'calendar_month', isEn ? 'Teaching Schedule' : 'Lịch dạy'],
    ['members', 'group', isEn ? 'Student Profiles' : 'Hồ sơ học viên'],
    ['training-plan', 'assignment', isEn ? 'Lesson Plans' : 'Giáo án'],
    ['progress', 'monitoring', isEn ? 'Progress & Feedback' : 'Kết quả & nhận xét'],
    ['attendance', 'fact_check', isEn ? 'Attendance' : 'Điểm danh'],
    ['notifications', 'campaign', isEn ? 'Notices & Workouts' : 'Thông báo & bài tập'],
    ['ai-recommendation', 'psychology', isEn ? 'AI Suggestions' : 'Gợi ý AI'],
    ['support', 'support_agent', isEn ? 'Support Requests' : 'Yêu cầu hỗ trợ']
  ];

  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const schedule = useTeachingSessions();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setClasses(await coachApi.getCoachClassesAndMembers());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const studentCount = new Set(classes.flatMap(c => (c.members || []).map(m => m.id))).size;
  const upcoming = schedule.sessions.filter(s => s.status === 'SCHEDULED' && sessionTime(s) > Date.now());

  return (
    <div className="space-y-7">
      {/* ─────────────────────────────────────────────────────────────
          1. TIYA WELCOME BANNER (Rich Slate Navy & Warm Gold Accent)
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#32354D] via-[#2B2D42] to-[#1E2235] text-white p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-xl">
        {/* Decorative ambient glows matching Tiya */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-[#F2CC8F]/15 blur-3xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(242,204,143,0.15)] text-[#F2CC8F] text-[11px] font-bold uppercase tracking-widest border border-[rgba(242,204,143,0.3)] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#F2CC8F] animate-pulse" />
            {isEn ? 'Coach Professional Portal' : 'Bảng chuyên môn huấn luyện viên'}
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {isEn
              ? `Welcome, Coach ${currentUser?.fullName || 'Coach'}`
              : `Chào HLV ${currentUser?.fullName || 'Huấn luyện viên'}`}
          </h1>
          <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
            {isEn
              ? 'Track assigned classes, teaching schedules, and Olympic-standard student fitness & technique evaluations.'
              : 'Theo dõi lớp phụ trách, lịch giảng dạy và đánh giá thể lực, kỹ thuật của học viên chuẩn Olympic.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-white/10 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 font-semibold">
              <span className="material-symbols-outlined text-[15px] text-[#81B29A]">sports_score</span>
              {loading ? '...' : (isEn ? `${classes.length} Assigned Classes` : `${classes.length} lớp được phân công`)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 font-semibold">
              <span className="material-symbols-outlined text-[15px] text-[#81B29A]">group</span>
              {loading ? '...' : (isEn ? `${studentCount} Active Students` : `${studentCount} học viên tích cực`)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 font-semibold">
              <span className="material-symbols-outlined text-[15px] text-[#F2CC8F]">event_upcoming</span>
              {schedule.loading ? '...' : (isEn ? `${upcoming.length} Upcoming Sessions` : `${upcoming.length} buổi dạy sắp diễn ra`)}
            </span>
          </div>
        </div>
      </div>

      <CoachError message={error} retry={load} />

      {/* ─────────────────────────────────────────────────────────────
          2. TIYA METRIC CARDS (Warm Gold, Sage Green, Dark Slate Navy)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-5">
        {/* Card 1: Lớp được phân công (Warm Gold) */}
        <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF6ED] to-[#F5ECE0] p-6 rounded-[20px] border border-[#F2CC8F]/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-[#78350F]">
              {isEn ? 'Assigned Classes' : 'Lớp được phân công'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#F2CC8F]/40 text-[#92400E] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <span className="material-symbols-outlined text-[22px]">sports_score</span>
            </div>
          </div>
          <div className="font-sans text-3xl sm:text-4xl font-extrabold text-[#1E2235] tracking-tight mt-3">
            {loading || error ? '—' : classes.length}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-[#92400E] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span>{isEn ? 'Currently teaching directly' : 'Đang phụ trách giảng dạy trực tiếp'}</span>
          </div>
        </div>

        {/* Card 2: Học viên trong các lớp (Sage Green) */}
        <div className="bg-gradient-to-br from-[#FCFDFD] via-[#F2F7F4] to-[#E8F2EC] p-6 rounded-[20px] border border-[#81B29A]/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-[#2D6A4F]">
              {isEn ? 'Enrolled Students' : 'Học viên trong các lớp'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#81B29A]/25 text-[#2D6A4F] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <span className="material-symbols-outlined text-[22px]">group</span>
            </div>
          </div>
          <div className="font-sans text-3xl sm:text-4xl font-extrabold text-[#1E2235] tracking-tight mt-3">
            {loading || error ? '—' : studentCount}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-[#2D6A4F] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#81B29A]" />
            <span>{isEn ? 'Counted uniquely per active member' : 'Mỗi học viên được tính độc lập một lần'}</span>
          </div>
        </div>

        {/* Card 3: Buổi dạy sắp tới (Slate Navy) */}
        <div className="bg-white p-6 rounded-[20px] border border-slate-200/90 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs uppercase tracking-widest font-bold text-slate-500">
              {isEn ? 'Upcoming Sessions' : 'Buổi dạy sắp tới'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#3D405B]/10 text-[#3D405B] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <span className="material-symbols-outlined text-[22px]">event</span>
            </div>
          </div>
          <div className="font-sans text-3xl sm:text-4xl font-extrabold text-[#3D405B] tracking-tight mt-3">
            {schedule.loading || schedule.error ? '—' : upcoming.length}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D405B]" />
            <span>{isEn ? `Date range: Up to ${schedule.to}` : `Khoảng thời gian: Đến ${schedule.to}`}</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. COACHING ACTION TILES (Tiya Squircle Cards)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white p-6 sm:p-7 rounded-[22px] border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#81B29A]" />
              <h2 className="font-sans text-lg font-bold text-slate-900 tracking-tight">
                {isEn ? 'Coaching Operations' : 'Công việc huấn luyện'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isEn
                ? 'Quick access to class management, attendance tracking, and syllabus tasks'
                : 'Truy cập nhanh danh mục tác vụ quản lý lớp, điểm danh và giáo án'}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {links.map(([route, icon, label]) => (
            <a
              key={route}
              href={'#/coach/' + route}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-[#FAF8F5]/60 hover:bg-white hover:border-[#81B29A]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group text-decoration-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-[#81B29A] text-[#81B29A] group-hover:text-white border border-slate-200/60 group-hover:border-[#81B29A] flex items-center justify-center shadow-xs transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#3D405B] transition-colors">
                  {label}
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-[#81B29A] group-hover:translate-x-1 transition-all">
                chevron_right
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. UPCOMING SESSIONS (Tiya Session Cards with Gold/Sage CTA)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F2CC8F]" />
            <h2 className="font-sans text-lg font-bold text-slate-900 tracking-tight">
              {isEn ? 'Upcoming Sessions' : 'Buổi dạy gần nhất'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#81B29A]/15 text-[#2D6A4F] border border-[#81B29A]/30">
              {isEn ? `${upcoming.length} upcoming` : `${upcoming.length} buổi sắp tới`}
            </span>
          </div>

          <a
            href="#/coach/schedule"
            className="text-xs font-bold text-[#3D405B] hover:text-[#E07A5F] inline-flex items-center gap-1 transition-colors"
          >
            <span>{isEn ? 'View full schedule' : 'Xem toàn bộ lịch dạy'}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </a>
        </div>

        <CoachError message={schedule.error} retry={schedule.reload} />

        {schedule.loading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-sm text-slate-500">
            <span className="inline-block w-4 h-4 border-2 border-[#81B29A] border-t-transparent rounded-full animate-spin mr-2" />
            {isEn ? 'Loading teaching schedule...' : 'Đang tải lịch dạy...'}
          </div>
        ) : !schedule.error && !upcoming.length ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/90 text-sm text-slate-500">
            {isEn ? 'No upcoming sessions in this period.' : 'Chưa có buổi dạy sắp tới trong khoảng thời gian này.'}
          </div>
        ) : null}

        <div className="space-y-3">
          {upcoming.slice(0, 3).map(s => (
            <article
              key={s.id}
              className="bg-white p-5 rounded-[20px] border border-slate-200/90 hover:border-[#81B29A]/60 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {/* Date squircle badge */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F2CC8F]/30 to-[#F2CC8F]/10 border border-[#F2CC8F]/40 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold uppercase text-[#92400E]">
                    {new Date(s.sessionDate).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { weekday: 'short' })}
                  </span>
                  <span className="text-base font-black text-[#1E2235] leading-none">
                    {s.sessionDate?.split('-')[2] || ''}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#81B29A]/15 text-[#2D6A4F] border border-[#81B29A]/30">
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      {s.roomName || (isEn ? 'Olympic Standard Facility' : 'Cụm sân chuẩn Olympic')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {s.timeSlot} · {s.sessionDate}
                    </span>
                  </div>
                  <h3 className="font-sans text-base font-bold text-slate-900">{s.name}</h3>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <a
                  href={'#/coach/attendance?sessionId=' + s.id + '&date=' + s.sessionDate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">fact_check</span>
                  <span>{isEn ? 'Take Attendance' : 'Điểm danh lớp'}</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
