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

  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const schedule = useTeachingSessions();

  // Bộ lọc Ngày/Tuần/Tháng liền kề
  const [filterPeriod, setFilterPeriod] = useState('day'); // 'day' | 'week' | 'month'

  // Danh sách các ca hẹn PT tự tạo thêm trực tiếp trên Dashboard
  const [customSessions, setCustomSessions] = useState([]);
  const [formSuccess, setFormSuccess] = useState(false);

  // State Form "Chủ động lên lịch PT"
  const [formData, setFormData] = useState({
    appointmentType: '1to1',
    title: '',
    studentName: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '14:00',
  });

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

  // Lấy danh sách học viên từ các lớp đang phụ trách
  const memberList = Array.from(
    new Map(
      classes
        .flatMap(c => c.members || [])
        .filter(Boolean)
        .map(m => [m.id, m])
    ).values()
  );

  // Mẫu ca tập mặc định chuẩn hiển thị
  const defaultSessions = [
    {
      id: 'demo-1',
      timeSlot: '07:30 - 08:30',
      room: isEn ? 'Weight Room #1' : 'Phòng Tạ #1',
      studentName: 'Nguyễn Văn An',
      packageInfo: isEn ? 'PT 1:1 • Session 12/24' : 'PT 1:1 • Buổi 12/24',
      exerciseTitle: 'Chest & Triceps Hypertrophy',
      exerciseDetails: 'Bench Press, Dumbbell Flyes, Cable Pushdown',
      status: 'COMPLETED',
    },
    {
      id: 'demo-2',
      timeSlot: '09:30 - 10:30',
      room: isEn ? 'Cardio Studio' : 'Khu Cardio',
      studentName: 'Trần Thị Bích',
      packageInfo: isEn ? 'PT 1:1 • Session 8/16' : 'PT 1:1 • Buổi 8/16',
      exerciseTitle: 'Cardio HIIT & Core Fat Burn',
      exerciseDetails: 'Chạy biến tốc, Battle Rope, Plank kháng lực',
      status: 'UPCOMING',
    },
    {
      id: 'demo-3',
      timeSlot: '15:30 - 16:30',
      room: isEn ? 'Stretching Studio' : 'Phòng Kéo giãn',
      studentName: 'Lê Hoàng Nam',
      packageInfo: isEn ? 'PT 1:1 • Session 3/10' : 'PT 1:1 • Buổi 3/10',
      exerciseTitle: 'Mobility & Lower Back Rehab',
      exerciseDetails: 'Giãn cơ sâu chuyên sâu, Deadlift kỹ thuật nhẹ',
      status: 'PENDING',
    },
  ];

  // Kết hợp ca dạy thực tế từ schedule backend
  const backendSessionsFormatted = schedule.sessions.slice(0, 4).map((s, idx) => ({
    id: s.id,
    timeSlot: s.timeSlot || '08:00 - 09:30',
    room: s.roomName || (isEn ? 'Olympic Standard Hall' : 'Cụm sân Olympic'),
    studentName: s.name || `Lớp học phần #${idx + 1}`,
    packageInfo: `${s.sessionDate} • Ca thực tế`,
    exerciseTitle: isEn ? 'Standard Olympic Training Drill' : 'Giáo án huấn luyện thể thao',
    exerciseDetails: isEn ? 'Stamina & Technique evaluation' : 'Đánh giá kỹ thuật, rèn luyện thể lực',
    status: s.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
    isBackend: true,
    sessionDate: s.sessionDate,
  }));

  const allSessions = [
    ...customSessions,
    ...(backendSessionsFormatted.length > 0 ? backendSessionsFormatted : defaultSessions),
  ];

  // Xử lý tạo lịch hẹn PT
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.studentName) return;

    const newSession = {
      id: 'custom-' + Date.now(),
      timeSlot: `${formData.startTime} - ${parseInt(formData.startTime.split(':')[0]) + 1}:00`,
      room: isEn ? 'PT Zone #2' : 'Khu vực PT #2',
      studentName: formData.studentName,
      packageInfo: `${formData.sessionDate} • PT 1:1`,
      exerciseTitle: formData.title,
      exerciseDetails: isEn ? 'Personal coaching session' : 'Buổi tập kèm riêng theo giáo án cá nhân',
      status: 'UPCOMING',
    };

    setCustomSessions([newSession, ...customSessions]);
    setFormSuccess(true);
    setFormData({
      appointmentType: '1to1',
      title: '',
      studentName: '',
      sessionDate: new Date().toISOString().split('T')[0],
      startTime: '14:00',
    });

    setTimeout(() => setFormSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BANNER (Nền gradient xanh navy #1e3a8a & 4 Stats Glassmorphism)
      ───────────────────────────────────────────────────────────── */}
      <section
        className="relative rounded-[16px] text-white p-6 sm:p-8 lg:p-9 overflow-hidden shadow-[0_10px_25px_-5px_rgba(30,58,138,0.25)]"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        }}
      >
        {/* Glow ambient background trang trí */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-20 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative z-10">
          
          {/* Lời chào mừng */}
          <div className="mb-6 sm:mb-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              {isEn ? 'Olympic Certified Coach' : 'Huấn luyện viên Chuyên nghiệp (PT) Pro'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
              {isEn
                ? `Welcome back, Coach ${currentUser?.fullName || 'Trainer'}! 👋`
                : `Xin chào, HLV ${currentUser?.fullName || 'Huấn luyện viên'}! 👋`}
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm font-normal leading-relaxed opacity-95">
              {isEn
                ? `Wishing you an energetic day. You have ${allSessions.length} sessions scheduled today.`
                : `Chúc bạn một ngày làm việc tràn đầy năng lượng. Theo dõi lịch tập và đồng hành cùng học viên đạt mục tiêu thể lực tối ưu.`}
            </p>
          </div>

          {/* 4 Thẻ Stats Glassmorphism */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* Stat 1: Học viên */}
            <div
              className="rounded-[12px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white text-base shrink-0">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider truncate">
                    {isEn ? 'Students' : 'Học viên'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 leading-none truncate">
                    {loading ? '...' : (studentCount > 0 ? studentCount : 2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 2: Buổi dạy */}
            <div
              className="rounded-[12px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white text-base shrink-0">
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider truncate">
                    {isEn ? 'Sessions' : 'Buổi dạy'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 leading-none truncate">
                    {schedule.loading ? '...' : (schedule.sessions.length > 0 ? schedule.sessions.length : 45)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 3: Đánh giá */}
            <div
              className="rounded-[12px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-amber-300 text-base shrink-0">
                  <span className="material-symbols-outlined text-[20px]">star</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider truncate">
                    {isEn ? 'Rating' : 'Đánh giá'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight mt-0.5 leading-none truncate">
                    5.0 ★
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 4: Thu nhập (Highlight màu xanh lục sáng #10b981) */}
            <div
              className="rounded-[12px] p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-[#10b981] text-base shrink-0">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider truncate">
                    {isEn ? 'Estimated Income' : 'Thu nhập tạm tính'}
                  </div>
                  <div
                    className="text-lg sm:text-xl lg:text-2xl font-black text-[#10b981] tracking-tight mt-0.5 leading-none truncate"
                    style={{ textShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}
                  >
                    8.262.500 ₫
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
            <div className="inline-flex bg-[#f1f5f9] p-1 rounded-[10px] border border-[#e2e8f0]">
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
                      ? 'bg-white text-[#1e3a8a] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* List các ca dạy */}
          <div className="space-y-3">
            {allSessions.map((item) => (
              <div
                key={item.id}
                className="rounded-[12px] border border-[#e5e7eb] p-4 bg-white hover:border-[#bfdbfe] hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  {/* Tag giờ: nền xanh lơ nhạt, chữ xanh đậm bo góc */}
                  <div className="px-2.5 py-1.5 rounded-[8px] bg-[#eff6ff] text-[#1e3a8a] font-bold text-xs shrink-0 flex items-center gap-1.5 border border-[#dbeafe]">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{item.timeSlot}</span>
                  </div>

                  <div>
                    {/* Tên bài tập in đậm */}
                    <div className="font-bold text-sm text-[#0f172a] leading-snug">
                      {item.exerciseTitle}
                    </div>
                    <div className="text-xs text-[#6b7280] mt-0.5">
                      <span className="font-semibold text-[#334155]">{item.studentName}</span>
                      <span className="mx-1.5">•</span>
                      <span>{item.packageInfo}</span>
                      <span className="mx-1.5">•</span>
                      <span className="text-[#94a3b8]">{item.room}</span>
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mt-1 italic">
                      {item.exerciseDetails}
                    </div>
                  </div>
                </div>

                {/* Trạng thái ca học & nút Điểm danh */}
                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {item.status === 'COMPLETED' ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                      {isEn ? 'Completed' : 'Đã xong'}
                    </span>
                  ) : item.status === 'UPCOMING' ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                      {isEn ? 'Upcoming' : 'Sắp diễn ra'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
                      {isEn ? 'Pending' : 'Chờ điểm danh'}
                    </span>
                  )}

                  <a
                    href={item.isBackend ? `#/coach/attendance?sessionId=${item.id}&date=${item.sessionDate}` : '#/coach/attendance'}
                    className="px-3 py-1 rounded-[8px] bg-[#f8fafc] hover:bg-[#1e3a8a] hover:text-white text-[#334155] border border-[#e2e8f0] text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">how_to_reg</span>
                    <span>{isEn ? 'Check' : 'Điểm danh'}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <a
              href="#/coach/schedule"
              className="text-xs font-bold text-[#1e3a8a] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{isEn ? 'View full calendar' : 'Xem toàn bộ lịch tuần'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </a>
          </div>
        </section>

        {/* CỘT PHẢI (35% / lg:col-span-4): Card "Chủ động lên lịch PT" */}
        <section
          className="lg:col-span-4 bg-white rounded-[16px] border border-[#e5e7eb] p-6 space-y-5"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}
        >
          <div className="pb-3 border-b border-[#f1f5f9]">
            <h2 className="text-base font-bold text-[#0f172a]">
              {isEn ? 'Schedule PT Session' : 'Chủ động lên lịch PT'}
            </h2>
            <p className="text-xs text-[#6b7280] mt-0.5">
              {isEn ? 'Create 1:1 training or fitness test appointments' : 'Tạo ca tập 1:1 hoặc lịch kiểm tra thể lực'}
            </p>
          </div>

          <form onSubmit={handleCreateAppointment} className="space-y-4">
            
            {/* Loại lịch */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                {isEn ? 'Appointment Type' : 'Loại lịch hẹn'}
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[8px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#0f172a] focus:outline-hidden focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="1to1">{isEn ? '1:1 Private PT (60 min)' : 'Kèm riêng PT 1:1 (60 phút)'}</option>
                <option value="inbody">{isEn ? 'InBody & Fitness Test' : 'Kiểm tra InBody & Thể lực'}</option>
                <option value="nutrition">{isEn ? 'Nutrition Consultation' : 'Tư vấn thực đơn dinh dưỡng'}</option>
              </select>
            </div>

            {/* Tiêu đề ca tập */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                {isEn ? 'Session Title' : 'Tiêu đề ca tập'}
              </label>
              <input
                type="text"
                placeholder={isEn ? 'e.g. Chest & Triceps Hypertrophy' : 'Ví dụ: Rèn luyện Squat & Thân dưới'}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[8px] border border-[#e5e7eb] bg-white text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-hidden focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>

            {/* Học viên */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">
                {isEn ? 'Student' : 'Học viên'}
              </label>
              <select
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                className="w-full h-11 px-3.5 rounded-[8px] border border-[#e5e7eb] bg-white text-xs font-medium text-[#0f172a] focus:outline-hidden focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                required
              >
                <option value="">{isEn ? '-- Select Student --' : '-- Chọn học viên --'}</option>
                {memberList.length > 0 ? (
                  memberList.map((m) => (
                    <option key={m.id} value={m.fullName || m.name}>
                      {m.fullName || m.name} (Mã: {m.code || m.id})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Nguyễn Văn An">Nguyễn Văn An (Còn 12 buổi)</option>
                    <option value="Trần Thị Bích">Trần Thị Bích (Còn 8 buổi)</option>
                    <option value="Lê Hoàng Nam">Lê Hoàng Nam (Còn 7 buổi)</option>
                    <option value="Phạm Minh Trang">Phạm Minh Trang (Còn 4 buổi)</option>
                  </>
                )}
              </select>
            </div>

            {/* Ngày & Giờ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  {isEn ? 'Date' : 'Ngày hẹn'}
                </label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  className="w-full h-11 px-3 rounded-[8px] border border-[#e5e7eb] bg-white text-xs text-[#0f172a] focus:outline-hidden focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  {isEn ? 'Start Time' : 'Giờ bắt đầu'}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full h-11 px-3 rounded-[8px] border border-[#e5e7eb] bg-white text-xs text-[#0f172a] focus:outline-hidden focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Nút Submit Rộng 100% */}
            <button
              type="submit"
              className="w-full h-11 rounded-[8px] bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-xs uppercase tracking-wider transition-colors duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{isEn ? 'Book Session' : 'Tạo lịch hẹn'}</span>
            </button>

            {formSuccess && (
              <div className="p-3 rounded-[8px] bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-bold flex items-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-[18px] text-[#059669]">check_circle</span>
                <span>{isEn ? 'PT Appointment created successfully!' : 'Đã tạo ca hẹn PT thành công!'}</span>
              </div>
            )}

          </form>
        </section>

      </div>

    </div>
  );
}

export default CoachDashboard;
