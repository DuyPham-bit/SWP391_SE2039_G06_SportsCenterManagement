import React, { useState, useEffect } from 'react';
import { coachProfessionalApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { CoachError } from './CoachShared.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { translateClassName, translateRoomName, translateStatus } from '../../services/i18nHelper.js';
import { getDashboardSessions, appointmentRequest } from './coachDashboardData.js';

export function CoachDashboard() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('day');
  const [saving, setSaving] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formData, setFormData] = useState({ appointmentType: '1to1', title: '', memberId: '', sessionDate: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }), startTime: '14:00' });
  const load = async () => {
    setLoading(true); setError('');
    try { setWorkspace(await coachProfessionalApi.getWorkspace()); }
    catch (error) { setWorkspace(null); setError(error.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const memberList = workspace?.clients || [];
  const studentCount = memberList.length;
  const allSessions = getDashboardSessions(workspace, filterPeriod);
  const handleCreateAppointment = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setFormSuccess(false); setError('');
    try {
      await coachProfessionalApi.createEvent(appointmentRequest(formData));
      setFormSuccess(true);
      setFormData(previous => ({ ...previous, title: '', memberId: '' }));
      await load();
    } catch (error) { setError(error.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BANNER (Nền gradient Tiya Dark Slate Navy & 4 Stats Glassmorphism)
      ───────────────────────────────────────────────────────────── */}
      <section
        className="relative rounded-[20px] text-white p-6 sm:p-8 lg:p-9 overflow-hidden shadow-xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, #1E2235 0%, #2B2D42 50%, #3D405B 100%)',
        }}
      >
        {/* Glow ambient background trang trí chuẩn Tiya */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 w-64 h-64 rounded-full bg-[#F2CC8F]/15 blur-3xl" />

        <div className="relative z-10">
          
          {/* Lời chào mừng */}
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#81B29A]/40 text-[#F2CC8F] text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#81B29A] animate-pulse" />
              {isEn ? 'Olympic Certified Coach' : 'Huấn luyện viên Chuyên nghiệp (PT) Pro'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
              {isEn
                ? `Welcome back, Coach ${currentUser?.fullName || 'Trainer'}! 👋`
                : `Xin chào, HLV ${currentUser?.fullName || 'Huấn luyện viên'}! 👋`}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-normal leading-relaxed opacity-95">
              {isEn
                ? `You have ${allSessions.length} sessions in the selected period.`
                : `Chúc bạn một ngày làm việc tràn đầy năng lượng. Theo dõi lịch tập và đồng hành cùng học viên đạt mục tiêu thể lực tối ưu.`}
            </p>
          </div>

          {/* 4 Thẻ Stats Glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* Stat 1: Học viên */}
            <div
              className="rounded-[14px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F2CC8F] text-base shrink-0 border border-white/10">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider truncate">
                    {isEn ? 'Students' : 'Học viên'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 leading-none truncate">
                    {loading ? '...' : workspace ? studentCount : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 2: Buổi dạy */}
            <div
              className="rounded-[14px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#81B29A] text-base shrink-0 border border-white/10">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider truncate">
                    {isEn ? 'Sessions' : 'Buổi dạy'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 leading-none truncate">
                    {loading ? '...' : workspace ? allSessions.length : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 3: Đánh giá */}
            <div
              className="rounded-[14px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F2CC8F] text-base shrink-0 border border-white/10">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider truncate">
                    {isEn ? 'Rating' : 'Đánh giá'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#F2CC8F] tracking-tight mt-0.5 leading-none truncate">
                    {loading ? '...' : !workspace ? '—' : workspace.kpi?.reviewCount ? `${workspace.kpi.averageRating} ★` : (isEn ? 'No reviews' : 'Chưa có đánh giá')}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 4: Thu nhập (Tiya Gold Highlight) */}
            <div
              className="rounded-[14px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(129, 178, 154, 0.15)',
                border: '1px solid rgba(129, 178, 154, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#81B29A]/20 flex items-center justify-center text-[#81B29A] text-base shrink-0 border border-[#81B29A]/30">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-[#81B29A] uppercase tracking-wider truncate">
                    {isEn ? 'Estimated Income' : 'Thu nhập tạm tính'}
                  </div>
                  <div
                    className="text-lg sm:text-xl lg:text-2xl font-black text-[#F2CC8F] tracking-tight mt-0.5 leading-none truncate"
                  >
                    {loading ? '...' : workspace?.kpi ? new Intl.NumberFormat(isEn ? 'en-US' : 'vi-VN', { style: 'currency', currency: 'VND' }).format(workspace.kpi.estimatedIncome) : '—'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <CoachError message={error} retry={load} />

      {/* ─────────────────────────────────────────────────────────────
          2. BỐ CỤC 2 CỘT (Cột trái 65% - Cột phải 35%)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* CỘT TRÁI (65% / lg:col-span-8): Card "Lịch ca giảng" */}
        <section
          className="lg:col-span-8 bg-white rounded-[16px] border border-[#e5e7eb] p-6 space-y-5"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}
        >
          {/* Header Card & Button Group Filter bo góc */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                {isEn ? 'Teaching Schedule' : 'Lịch ca giảng'}
              </h2>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {isEn ? 'Assigned classes and 1:1 training appointments' : 'Danh sách các ca tập kèm riêng phân công trong ngày'}
              </p>
            </div>

            {/* Button Group Bộ lọc Ngày / Tuần / Tháng liền kề */}
            <div className="inline-flex bg-[#FAF8F5] dark:bg-slate-800 p-1 rounded-[10px] border border-slate-200 dark:border-slate-700">
              {[
                { id: 'day', label: isEn ? 'Day' : 'Ngày' },
                { id: 'week', label: isEn ? 'Week' : 'Tuần' },
                { id: 'month', label: isEn ? 'Month' : 'Tháng' },
              ].map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setFilterPeriod(period.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-[7px] transition-all duration-150 cursor-pointer ${
                    filterPeriod === period.id
                      ? 'bg-[#1E2235] text-[#F2CC8F] shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
                      : 'text-slate-600 dark:text-slate-300 hover:text-[#1E2235] dark:hover:text-white'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* List các ca dạy */}
          <div className="space-y-3">
            {!loading && !error && allSessions.length === 0 && <p role="status" className="text-sm text-slate-500">{isEn ? 'No sessions in this period.' : 'Chưa có lịch trong khoảng thời gian này.'}</p>}
            {allSessions.map((item) => (
              <div
                key={item.id}
                className="rounded-[12px] border border-slate-200/90 dark:border-slate-700 p-4 bg-white dark:bg-slate-800/90 hover:border-[#81B29A]/50 hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  {/* Tag giờ: nền Tiya Sage Green nhạt */}
                  <div className="px-2.5 py-1.5 rounded-[8px] bg-[#81B29A]/15 text-[#2D6A4F] dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-xs shrink-0 flex items-center gap-1.5 border border-[#81B29A]/30">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{item.timeSlot}</span>
                  </div>

                  <div>
                    {/* Tên bài tập in đậm */}
                    <div className="font-bold text-sm text-[#1E2235] dark:text-white leading-snug">
                      {item.exerciseTitle}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.studentName}</span>
                      <span className="mx-1.5">•</span>
                      <span>{item.packageInfo}</span>
                      <span className="mx-1.5">•</span>
                      <span className="text-slate-400">{item.room}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 italic">
                      {item.exerciseDetails}
                    </div>
                  </div>
                </div>

                {/* Trạng thái ca học & nút Điểm danh */}
                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {String(item.status).toUpperCase() === 'COMPLETED' ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                      {translateStatus(item.status, isEn)}
                    </span>
                  ) : ['SCHEDULED', 'CONFIRMED'].includes(String(item.status).toUpperCase()) ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#81B29A]/15 text-[#2D6A4F] dark:text-emerald-300 border border-[#81B29A]/30">
                      {translateStatus(item.status, isEn)}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {translateStatus(item.status, isEn)}
                    </span>
                  )}

                  <a
                    href={item.isBackend ? `#/coach/attendance?sessionId=${item.sessionId}&date=${item.sessionDate}` : '#/coach/professional'}
                    className="px-3 py-1.5 rounded-[8px] bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                    <span>{isEn ? 'Take Attendance' : 'Điểm danh'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <a
              href="#/coach/schedule"
              className="text-xs font-bold text-[#E07A5F] hover:text-[#C55D44] inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isEn ? 'View full calendar' : 'Xem toàn bộ lịch tuần'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
        </section>

        {/* CỘT PHẢI (35% / lg:col-span-4): Card "Chủ động lên lịch PT" */}
        <section
          className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-[16px] border border-slate-200/90 dark:border-slate-700 p-6 space-y-5"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}
        >
          <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-bold text-[#1E2235] dark:text-white">
              {isEn ? 'Schedule PT Session' : 'Chủ động lên lịch PT'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEn ? 'Create 1:1 training or fitness test appointments' : 'Tạo ca tập 1:1 hoặc lịch kiểm tra thể lực'}
            </p>
          </div>

          <form onSubmit={handleCreateAppointment} className="space-y-4">
            
            {/* Loại lịch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Appointment Type' : 'Loại lịch hẹn'}
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#81B29A] focus:ring-2 focus:ring-[#81B29A]/20 transition-all cursor-pointer"
              >
                <option value="1to1">{isEn ? '1:1 Private PT (60 min)' : 'Kèm riêng PT 1:1 (60 phút)'}</option>
                <option value="inbody">{isEn ? 'InBody & Fitness Test' : 'Kiểm tra InBody & Thể lực'}</option>
                <option value="nutrition">{isEn ? 'Nutrition Consultation' : 'Tư vấn thực đơn dinh dưỡng'}</option>
              </select>
            </div>

            {/* Tiêu đề ca tập */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Session Title' : 'Tiêu đề ca tập'}
              </label>
              <input
                type="text"
                placeholder={isEn ? 'e.g. Squat & Lower Body Power' : 'Ví dụ: Rèn luyện Squat & Thân dưới'}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#81B29A] focus:ring-2 focus:ring-[#81B29A]/20 transition-all"
                required
              />
            </div>

            {/* Học viên */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Student' : 'Học viên'}
              </label>
              <select
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#81B29A] focus:ring-2 focus:ring-[#81B29A]/20 transition-all cursor-pointer"
                required
              >
                <option value="">{isEn ? '-- Select Student --' : '-- Chọn học viên --'}</option>
                {memberList.map(m => <option key={m.id} value={m.id}>{m.fullName} ({m.memberCode || m.id})</option>)}
              </select>
            </div>

            {/* Ngày & Giờ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Date' : 'Ngày hẹn'}
                </label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  className="w-full h-11 px-3 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#81B29A] focus:ring-2 focus:ring-[#81B29A]/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Start Time' : 'Giờ bắt đầu'}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full h-11 px-3 rounded-[8px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#81B29A] focus:ring-2 focus:ring-[#81B29A]/20 transition-all"
                />
              </div>
            </div>

            {/* Nút Submit Rộng 100% trong Tiya Dark Slate Navy + Gold */}
            <button
              type="submit" disabled={saving || loading || memberList.length === 0}
              className="w-full h-11 rounded-[8px] bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{isEn ? 'Book Session' : 'Tạo lịch hẹn'}</span>
            </button>

            {formSuccess && (
              <div className="p-3 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span>{isEn ? 'Appointment saved. Awaiting member confirmation.' : 'Đã lưu lịch hẹn, đang chờ học viên xác nhận.'}</span>
              </div>
            )}

          </form>
        </section>

      </div>

    </div>
  );
}

export default CoachDashboard;
