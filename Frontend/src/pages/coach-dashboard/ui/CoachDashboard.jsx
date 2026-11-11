import React, { useState, useEffect } from 'react';
import { coachApi, coachMemberOptions, dashboardAttendanceRecords, dashboardProgressRequest, filterDashboardSessions, mapDashboardRoster, mapDashboardSessions } from '../../../entities/coach/index.js';
import { useAuth } from '../../../entities/session/index.js';
import { CoachError, useTeachingSessions } from '../../../features/coach-workspace/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';
import { OLYMPIC_GRADIENT } from '../../../shared/ui/gradients.js';

export function CoachDashboard() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { showWarning, showSuccess, showError } = useToast();
  const isEn = language === 'en';

  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const schedule = useTeachingSessions();

  // Bộ lọc Ngày/Tuần/Tháng liền kề
  const [filterPeriod, setFilterPeriod] = useState('day'); // 'day' | 'week' | 'month'

  // State Form "Đánh giá & Ghi nhận tiến độ" (Cột phải 35%)
  const [progressForm, setProgressForm] = useState({
    studentId: '',
    studentName: '',
    target: '',
    weight: '',
    heavyLift: '',
    repsSets: '',
    feedbackNote: '',
    sendToMember: true,
  });

  const [progressSaved, setProgressSaved] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  // State Modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [isClassListModalOpen, setIsClassListModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coachApi.getCoachClassesAndMembers();
      const nextClasses = data || [];
      setClasses(nextClasses);
      const firstMember = coachMemberOptions(nextClasses)[0];
      if (firstMember) {
        setProgressForm(previous => previous.studentId ? previous : {
          ...previous,
          studentId: String(firstMember.id),
          studentName: firstMember.name,
          target: firstMember.target
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const studentCount = new Set(classes.flatMap((c) => (c.members || []).map((m) => m.id))).size;

  // Lấy danh sách học viên từ các lớp đang phụ trách
  const memberList = coachMemberOptions(classes);
  const periodSessions = filterDashboardSessions(schedule.sessions, filterPeriod);
  const allSessions = mapDashboardSessions(periodSessions, classes).slice(0, 4);
  const completedSessionCount = allSessions.filter(session => session.status === 'COMPLETED').length;
  const completionPercentage = allSessions.length > 0
    ? Math.round((completedSessionCount / allSessions.length) * 100)
    : 100;

  const loadRoster = async (session) => {
    setLoadingRoster(true);
    setError('');
    try {
      const rows = await coachApi.getClassMembers(session.id);
      const members = mapDashboardRoster(rows);
      return {
        ...session,
        members,
        attendanceDone: members.filter(member => member.status === 'PRESENT' || member.status === 'LATE').length,
        attendanceTotal: members.length
      };
    } catch (e) {
      setError(e.message || String(e));
      return null;
    } finally {
      setLoadingRoster(false);
    }
  };

  // Xử lý mở Modal Danh Sách Lớp
  const handleOpenClassList = async (session) => {
    const withRoster = await loadRoster(session);
    if (!withRoster) return;
    setActiveSession(withRoster);
    setIsClassListModalOpen(true);
  };

  // Xử lý mở Modal Điểm Danh Nhanh
  const handleOpenAttendance = async (session) => {
    const withRoster = await loadRoster(session);
    if (!withRoster) return;
    setActiveSession(withRoster);
    setIsAttendanceModalOpen(true);
  };

  // Xử lý lưu Form Tiến Độ
  const handleSaveProgress = async (e) => {
    e.preventDefault();
    if (savingProgress) return;
    const w = parseFloat(progressForm.weight);
    const hl = parseFloat(progressForm.heavyLift);
    if (isNaN(w) || w < 25 || w > 300) {
      showWarning(isEn ? 'Please enter a valid weight (25 - 300 kg).' : 'Vui lòng nhập cân nặng hợp lệ (từ 25 đến 300 kg).');
      return;
    }
    if (isNaN(hl) || hl < 0 || hl > 500) {
      showWarning(isEn ? 'Please enter a valid max lift (0 - 500 kg).' : 'Vui lòng nhập mức tạ hợp lệ (từ 0 đến 500 kg).');
      return;
    }
    if (progressForm.feedbackNote && progressForm.feedbackNote.length > 1000) {
      showWarning(isEn ? 'Feedback note cannot exceed 1000 characters.' : 'Nhận xét không được vượt quá 1000 ký tự.');
      return;
    }
    const selectedMember = memberList.find(member => member.id === Number(progressForm.studentId));
    setSavingProgress(true);
    setError('');
    try {
      await coachApi.recordWorkoutProgress(dashboardProgressRequest(progressForm, selectedMember));
      setProgressSaved(true);
      showSuccess(isEn ? 'Student progress recorded and synced successfully!' : 'Đã ghi nhận kết quả và cập nhật tiến độ học viên thành công!');
      setTimeout(() => setProgressSaved(false), 3500);
    } catch (e) {
      setProgressSaved(false);
      setError(e.message || String(e));
      showError(e.message || 'Lỗi lưu tiến độ học viên.');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!activeSession || !activeSession.canTakeAttendance || savingAttendance) return;
    setSavingAttendance(true);
    setError('');
    try {
      const records = dashboardAttendanceRecords(activeSession.members);
      await coachApi.takeAttendance(activeSession.id, null, null, null, records);
      showSuccess(isEn ? 'Attendance recorded successfully!' : 'Đã lưu kết quả điểm danh thành công!');
      setIsAttendanceModalOpen(false);
      schedule.reload();
    } catch (e) {
      setError(e.message || String(e));
      showError(e.message || 'Lỗi lưu điểm danh.');
    } finally {
      setSavingAttendance(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 transition-colors">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BANNER GRADIENT (Olympic Athletic Header & 3 KPIs)
      ───────────────────────────────────────────────────────────── */}
      <section
        className="scms-hero relative overflow-hidden rounded-3xl text-white p-6 sm:p-7 lg:p-8 shadow-xl shadow-brand-sage-950/15 border border-white/20 dark:border-brand-navy-800"
        style={{ background: OLYMPIC_GRADIENT }}
      >
        {/* Dynamic ambient glow & sports wave overlays */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-br from-brand-sand-300/30 via-brand-teal-300/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-brand-sage-500/35 via-brand-teal-500/20 to-transparent blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
        </svg>

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/30 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-400 animate-pulse shrink-0" />
              <span>{isEn ? 'Olympic Certified Coach Portal' : 'Cổng Huấn Luyện Viên Chuyên Nghiệp'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
              {isEn
                ? `Welcome back, Coach ${currentUser?.fullName || 'Trainer'}!`
                : `Chào ngày mới, HLV ${currentUser?.fullName || 'Huấn Luyện Viên'}!`}
            </h1>

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              {isEn
                ? `You have ${allSessions.length} sessions scheduled today. Track your student attendance and log training progress seamlessly.`
                : `Hôm nay bạn có ${allSessions.length} ca dạy được phân công. Hãy kiểm tra danh sách lớp, thực hiện điểm danh và đánh giá kết quả rèn luyện của học viên.`}
            </p>
          </div>

          {/* 3 Khối Thống Số Trọng Tâm: Số ca dạy, Tổng học viên, Tỉ lệ chuyên cần */}
          <div className="w-full xl:w-auto grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            
            {/* Thẻ 1: Số ca dạy hôm nay */}
            <div className="bg-white/15 dark:bg-brand-navy-900/40 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/25 min-w-[105px] sm:min-w-[130px] flex flex-col justify-between shadow-xs hover:bg-white/20 transition-all">
              <span className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-wider block">
                {isEn ? 'Sessions Today' : 'Ca dạy hôm nay'}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-white">{allSessions.length}</span>
                <span className="text-[11px] text-brand-sand-200 font-bold">{isEn ? 'slots' : 'ca'}</span>
              </div>
              <span className="mt-1 text-[10px] text-white/90 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-300" />
                <span>{completedSessionCount} {isEn ? 'completed' : 'ca xong'}</span>
              </span>
            </div>

            {/* Thẻ 2: Tổng học viên */}
            <div className="bg-white/15 dark:bg-brand-navy-900/40 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/25 min-w-[105px] sm:min-w-[130px] flex flex-col justify-between shadow-xs hover:bg-white/20 transition-all">
              <span className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-wider block">
                {isEn ? 'Total Students' : 'Tổng học viên'}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-white">{studentCount}</span>
                <span className="text-[11px] text-white/80 font-bold">{isEn ? 'members' : 'người'}</span>
              </div>
              <span className="mt-1 text-[10px] text-white/90 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal-300" />
                <span>{classes.length} {isEn ? 'classes' : 'lớp trực'}</span>
              </span>
            </div>

            {/* Thẻ 3: Tiến độ ca dạy trong ngày */}
            <div className="bg-white/15 dark:bg-brand-navy-900/40 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/25 min-w-[105px] sm:min-w-[130px] flex flex-col justify-between shadow-xs hover:bg-white/20 transition-all">
              <span className="text-[10px] sm:text-[11px] font-bold text-white/80 uppercase tracking-wider block">
                {isEn ? 'Progress' : 'Tiến độ ngày'}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl sm:text-3xl font-black text-white">{completionPercentage}%</span>
              </div>
              {/* Mini progress bar */}
              <div className="mt-1.5 w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-sage-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, completionPercentage)}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      <CoachError message={error} retry={load} />

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT (Bố cục 2 Cột: Cột trái 65% - Cột phải 35%)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* ═══════════════════════════════════════════════════════════
            CỘT TRÁI (lg:col-span-8): LỊCH DẠY & ĐIỂM DANH HÔM NAY
        ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Header Card & Bộ lọc Thời gian */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-brand-navy-900 p-4 sm:p-5 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 flex items-center justify-center font-bold shrink-0 shadow-2xs border border-brand-sage-200/80 dark:border-brand-sage-800/80">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <h2 className="text-base font-black text-brand-navy-900 dark:text-white leading-tight">
                  {isEn ? "Today's Schedule & Attendance" : 'Lịch Dạy & Điểm Danh Hôm Nay'}
                </h2>
                <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                  {isEn
                    ? 'Assigned classes and 1:1 training appointments in real-time'
                    : 'Danh sách các ca dạy trong ngày · Mở danh sách hoặc điểm danh trực tiếp'}
                </p>
              </div>
            </div>

            {/* Button Group Bộ lọc Ngày / Tuần / Tháng */}
            <div className="inline-flex bg-brand-navy-100 dark:bg-brand-navy-800 p-1 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
              {[
                { id: 'day', label: isEn ? 'Day' : 'Hôm nay' },
                { id: 'week', label: isEn ? 'Week' : 'Tuần này' },
                { id: 'month', label: isEn ? 'Month' : 'Tháng này' },
              ].map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setFilterPeriod(period.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filterPeriod === period.id
                      ? 'bg-brand-sage-700 text-white shadow-xs'
                      : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white hover:bg-brand-navy-200/60 dark:hover:bg-brand-navy-700'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các ca dạy trong ngày */}
          <div className="space-y-3.5">
            {(!allSessions || allSessions.length === 0) ? (
              <div className="p-8 bg-white dark:bg-brand-navy-900 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 text-center space-y-2 shadow-xs">
                <span className="material-symbols-outlined text-4xl text-brand-navy-300 dark:text-brand-navy-600">event_busy</span>
                <p className="text-sm font-bold text-brand-navy-700 dark:text-brand-navy-300">
                  {isEn ? 'No teaching sessions scheduled for today.' : 'Không có ca dạy nào hôm nay.'}
                </p>
                <p className="text-xs text-brand-navy-400 dark:text-brand-navy-500">
                  {isEn ? 'Check your weekly schedule to see upcoming classes.' : 'Kiểm tra lịch tuần để xem các ca dạy tiếp theo.'}
                </p>
              </div>
            ) : (
              allSessions.map((session) => {
                const isFinished = session.status === 'COMPLETED';
                const isCurrent = session.status === 'IN_PROGRESS';

                return (
                  <div
                    key={session.id}
                    className={`bg-white dark:bg-brand-navy-900 rounded-2xl border p-4 sm:p-5 transition-all shadow-xs hover:shadow-md ${
                      isCurrent
                        ? 'border-brand-sage-500 ring-2 ring-brand-sage-500/20 bg-brand-sage-50/20 dark:bg-brand-sage-950/20'
                        : 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Khối Thông tin ca */}
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Khung giờ */}
                        <div className="flex flex-col items-center justify-center bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 rounded-2xl px-3.5 py-2.5 text-center shrink-0 min-w-[85px] border border-brand-navy-200/70 dark:border-brand-navy-700">
                          <span className="text-[10px] font-bold uppercase text-brand-navy-400 dark:text-brand-navy-500 tracking-wider">
                            {isEn ? 'Time' : 'Giờ dạy'}
                          </span>
                          <span className="text-xs font-black text-brand-navy-900 dark:text-white mt-0.5">
                            {session.timeSlot}
                          </span>
                        </div>

                        {/* Nội dung ca */}
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                session.type.includes('PT')
                                  ? 'bg-brand-navy-50 dark:bg-brand-navy-950/60 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800'
                                  : 'bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800'
                              }`}
                            >
                              {session.type}
                            </span>

                            {isCurrent && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-sand-50 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-sand-500 animate-pulse" />
                                <span>{isEn ? 'Live Now' : 'Đang diễn ra'}</span>
                              </span>
                            )}

                            {isFinished && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 border border-brand-navy-200 dark:border-brand-navy-700">
                                ✓ {isEn ? 'Completed' : 'Đã hoàn tất'}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-extrabold text-brand-navy-900 dark:text-white leading-snug truncate">
                            {session.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-navy-600 dark:text-brand-navy-400">
                            <span className="flex items-center gap-1 font-medium">
                              <span className="material-symbols-outlined text-[15px] text-brand-navy-400">group</span>
                              <span>{session.studentOrClass}</span>
                            </span>
                            <span className="flex items-center gap-1 text-brand-navy-500 dark:text-brand-navy-400">
                              <span className="material-symbols-outlined text-[15px] text-brand-navy-400">location_on</span>
                              <span>{session.room}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Điểm danh & Nút Hành Động Nhanh */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-brand-navy-100 dark:border-brand-navy-800 shrink-0">
                        <div className="text-right">
                          <span className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 font-medium">
                            {isEn ? 'Attendance: ' : 'Điểm danh: '}
                          </span>
                          <span className="text-xs font-black text-brand-navy-900 dark:text-white">
                            {session.attendanceDone ?? '—'}/{session.attendanceTotal}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* NÚT BẤM NHANH 1: Mở danh sách lớp */}
                          <MotionButton
                            type="button"
                            onClick={() => handleOpenClassList(session)}
                            disabled={loadingRoster}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="px-3 py-1.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-200 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px] text-brand-navy-500 dark:text-brand-navy-400">list_alt</span>
                            <span>{isEn ? 'Class List' : 'Mở danh sách lớp'}</span>
                          </MotionButton>

                          {/* NÚT BẤM NHANH 2: Điểm danh nhanh */}
                          <MotionButton
                            type="button"
                            onClick={() => handleOpenAttendance(session)}
                            disabled={loadingRoster}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                              isFinished
                                ? 'bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 border border-brand-navy-200 dark:border-brand-navy-700'
                                : 'bg-brand-sage-700 hover:bg-brand-sage-800 text-white shadow-brand-sage-600/25'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isFinished ? 'visibility' : 'how_to_reg'}
                            </span>
                            <span>{isFinished ? (isEn ? 'View Check-in' : 'Xem điểm danh') : (isEn ? 'Attendance' : 'Điểm danh')}</span>
                          </MotionButton>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Lối tắt xem toàn bộ lịch tuần */}
          <div className="pt-2 text-right">
            <a
              href="#/coach/schedule"
              className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isEn ? 'View full weekly teaching schedule' : 'Xem toàn bộ lịch giảng dạy trong tuần'}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CỘT PHẢI (lg:col-span-4): ĐÁNH GIÁ & GHI NHẬN TIẾN ĐỘ
        ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-brand-navy-900 rounded-3xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-5 sm:p-6 shadow-xs space-y-4">
            
            {/* Header Form + NÚT GỢI Ý AI */}
            <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-black text-brand-navy-900 dark:text-white leading-tight">
                  {isEn ? 'Session Evaluation & Progress' : 'Đánh Giá & Ghi Nhận Tiến Độ'}
                </h3>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                  {isEn ? 'Log workout metrics & feedback' : 'Nhập kết quả & nhận xét học viên'}
                </p>
              </div>

            </div>

            {/* Form Nhập Liệu */}
            <form onSubmit={handleSaveProgress} className="space-y-3.5 text-xs">
              
              {/* Chọn học viên */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                  {isEn ? 'Select Student' : 'Học viên theo dõi'} <span className="text-brand-danger-500">*</span>
                </label>
                <select
                  value={progressForm.studentId}
                  onChange={(e) => {
                    const found = memberList.find((member) => member.id === Number(e.target.value));
                    setProgressForm({
                      ...progressForm,
                      studentId: e.target.value,
                      studentName: found?.name || '',
                      target: found?.target || '',
                    });
                  }}
                  disabled={memberList.length === 0 || savingProgress}
                  className="w-full h-10 px-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all cursor-pointer"
                >
                  {memberList.length === 0 && (
                    <option value="">{isEn ? 'No assigned students' : 'Chưa có học viên được phân công'}</option>
                  )}
                  {memberList.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} (Mã: {member.memberCode || member.code || member.id})
                    </option>
                  ))}
                </select>

                {/* Tag mục tiêu học viên hiển thị trực quan */}
                <div className="mt-1.5 p-2 rounded-xl bg-brand-teal-50/80 dark:bg-brand-teal-950/40 border border-brand-teal-100 dark:border-brand-teal-900/60 text-[11px] text-brand-teal-900 dark:text-brand-teal-300 flex items-center gap-1.5">
                  <span className="font-bold text-brand-teal-700 dark:text-brand-teal-400 shrink-0">{isEn ? 'Goal:' : 'Mục tiêu:'}</span>
                  <span className="truncate">{progressForm.target || (isEn ? 'Not updated' : 'Chưa cập nhật')}</span>
                </div>
              </div>

              {/* Nhập Cân nặng & Mức tạ chính */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                    {isEn ? 'Weight (kg)' : 'Cân nặng (kg)'} <span className="text-brand-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="25"
                    max="300"
                    value={progressForm.weight}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || Number(val) >= 0) {
                        setProgressForm({ ...progressForm, weight: val });
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
                    placeholder="68.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                    {isEn ? 'Max Lift (kg)' : 'Mức tạ Max (kg)'} <span className="text-brand-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="500"
                    value={progressForm.heavyLift}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || Number(val) >= 0) {
                        setProgressForm({ ...progressForm, heavyLift: val });
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
                    placeholder="95"
                    required
                  />
                </div>
              </div>

              {/* Khối lượng bài tập / Sets x Reps */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                  {isEn ? 'Volume (Sets x Reps)' : 'Khối lượng hoàn thành'} <span className="text-brand-danger-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={progressForm.repsSets}
                  onChange={(e) => setProgressForm({ ...progressForm, repsSets: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
                  placeholder={isEn ? 'e.g. 4 sets x 8 reps Squat' : 'Ví dụ: 4 sets x 8 reps Squat'}
                  required
                />
              </div>

              {/* Ghi chú nhận xét buổi tập */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300">
                    {isEn ? 'Coach Feedback & Notes' : 'Nhận xét & Đánh giá buổi tập'}
                  </label>
                  <span className="text-[10px] text-brand-navy-400 font-mono">
                    {progressForm.feedbackNote?.length || 0}/1000
                  </span>
                </div>
                <textarea
                  rows="3"
                  maxLength={1000}
                  value={progressForm.feedbackNote}
                  onChange={(e) => setProgressForm({ ...progressForm, feedbackNote: e.target.value })}
                  className="w-full p-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all resize-none text-xs placeholder:text-brand-navy-400"
                  placeholder={isEn ? 'Technique evaluation, fatigue levels, corrections...' : 'Ghi nhận tư thế, thể lực, biểu hiện mỏi mệt hoặc điểm cần cải thiện...'}
                />
              </div>

              {/* Checkbox gửi cho học viên */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={progressForm.sendToMember}
                  onChange={(e) => setProgressForm({ ...progressForm, sendToMember: e.target.checked })}
                  className="w-4 h-4 text-brand-sage-700 dark:text-brand-sage-400 rounded border-brand-navy-300 dark:border-brand-navy-600 focus:ring-brand-sage-500 cursor-pointer"
                />
                <span className="text-[11px] text-brand-navy-600 dark:text-brand-navy-400 font-medium">
                  {isEn ? 'Sync & send evaluation report to student app' : 'Đồng bộ & gửi báo cáo đánh giá cho học viên'}
                </span>
              </label>

              {/* Nút Submit Form */}
              <MotionButton
                type="submit"
                disabled={savingProgress || memberList.length === 0}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-brand-sage-600 to-brand-teal-700 hover:from-brand-sage-700 hover:to-brand-teal-800 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-sage-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined text-[17px] ${savingProgress ? 'animate-spin' : ''}`}>
                  {savingProgress ? 'progress_activity' : 'save'}
                </span>
                <span>{savingProgress ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Progress & Evaluation' : 'Lưu Kết Quả & Đánh Giá')}</span>
              </MotionButton>

              {/* Alert Lưu Thành Công */}
              {progressSaved && (
                <div className="p-3 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/60 border border-brand-sage-200 dark:border-brand-sage-800 text-brand-sage-800 dark:text-brand-sage-300 text-[11px] font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
                  <span className="material-symbols-outlined text-[17px] text-brand-sage-700 dark:text-brand-sage-400 shrink-0">check_circle</span>
                  <span>{isEn ? 'Progress updated and synced successfully!' : 'Đã ghi nhận kết quả và cập nhật tiến độ học viên thành công!'}</span>
                </div>
              )}
            </form>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MODAL MỞ DANH SÁCH LỚP (Class List Modal)
      ───────────────────────────────────────────────────────────── */}
      {isClassListModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-navy-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-brand-navy-900 dark:text-white">
                  {isEn ? 'Class Roster & Students' : 'Danh Sách Học Viên Ca Dạy'}
                </h3>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                  {activeSession.title} ({activeSession.timeSlot}) · {activeSession.room}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClassListModalOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-500 dark:text-brand-navy-400 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeSession.members && activeSession.members.length > 0 ? (
                activeSession.members.map((member, i) => (
                  <div
                    key={member.id || i}
                    className="p-3 bg-brand-navy-50 dark:bg-brand-navy-800/80 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950 text-brand-teal-700 dark:text-brand-teal-300 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-brand-navy-900 dark:text-white text-xs">{member.name}</p>
                        <p className="text-[10px] text-brand-navy-500 dark:text-brand-navy-400">{member.phone} {member.note ? `• ${member.note}` : ''}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        member.status === 'PRESENT' || member.status === 'LATE'
                          ? 'bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800'
                        : member.status === 'ABSENT'
                          ? 'bg-brand-danger-50 dark:bg-brand-danger-950/60 text-brand-danger-700 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800'
                          : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-700'
                      }`}
                    >
                      {member.status === 'PRESENT' || member.status === 'LATE' ? 'Có mặt' : member.status === 'ABSENT' ? 'Vắng' : 'Chờ điểm danh'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-brand-navy-400 dark:text-brand-navy-500">
                  {isEn ? 'No student records found.' : 'Chưa có thông tin học viên trong ca này.'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
              <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400 font-medium">
                {isEn ? 'Total: ' : 'Tổng số: '}<strong>{activeSession.attendanceTotal} học viên</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsClassListModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-brand-navy-900 dark:bg-brand-navy-100 hover:bg-brand-navy-800 dark:hover:bg-white text-white dark:text-brand-navy-900 text-xs font-bold cursor-pointer transition-colors"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL ĐIỂM DANH NHANH THEO CA (Quick Attendance Modal)
      ───────────────────────────────────────────────────────────── */}
      {isAttendanceModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-navy-900 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-brand-navy-900 dark:text-white">
                  {isEn ? 'Quick Check-in Attendance' : 'Điểm Danh Nhanh Theo Ca'}
                </h3>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">
                  {activeSession.title} · {activeSession.timeSlot}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-500 dark:text-brand-navy-400 flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {activeSession.members && activeSession.members.length > 0 ? (
                activeSession.members.map((member, i) => {
                  const isPresent = member.status === 'PRESENT' || member.status === 'LATE';
                  const isAbsent = member.status === 'ABSENT';
                  const hasLateNote = (member.note || '').includes('Đến muộn');

                  return (
                    <div
                      key={member.id || i}
                      className="p-3 bg-brand-navy-50 dark:bg-brand-navy-800/80 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-700 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-brand-navy-900 dark:text-white text-xs">{member.name}</p>
                          <p className="text-[10px] text-brand-navy-500 dark:text-brand-navy-400">{activeSession.room}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              member.status = 'PRESENT';
                              setActiveSession({ ...activeSession });
                            }}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                              isPresent
                                ? 'bg-brand-sage-700 text-white shadow-2xs'
                                : 'bg-white dark:bg-brand-navy-700 border border-brand-navy-200 dark:border-brand-navy-600 text-brand-navy-700 dark:text-brand-navy-200 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-600'
                            }`}
                          >
                            {isEn ? 'Present' : 'Có mặt'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              member.status = 'ABSENT';
                              setActiveSession({ ...activeSession });
                            }}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                              isAbsent
                                ? 'bg-brand-danger-600 text-white shadow-2xs'
                                : 'bg-white dark:bg-brand-navy-700 border border-brand-navy-200 dark:border-brand-navy-600 text-brand-navy-700 dark:text-brand-navy-200 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-600'
                            }`}
                          >
                            {isEn ? 'Absent' : 'Vắng'}
                          </button>
                        </div>
                      </div>

                      {/* Ghi chú điểm danh & tích hợp Đến muộn */}
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-brand-navy-200/60 dark:border-brand-navy-700">
                        <input
                          type="text"
                          value={member.note || ''}
                          onChange={(e) => {
                            member.note = e.target.value;
                            setActiveSession({ ...activeSession });
                          }}
                          placeholder={isEn ? "Attendance note (e.g. Late 10m)..." : "Ghi chú điểm danh (VD: Đến muộn 10p)..."}
                          className="flex-1 text-[11px] px-2.5 py-1 bg-white dark:bg-brand-navy-700 rounded-lg border border-brand-navy-200 dark:border-brand-navy-600 focus:outline-none focus:border-brand-sage-500 text-brand-navy-900 dark:text-white placeholder-brand-navy-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            member.status = 'LATE';
                            const current = member.note || '';
                            if (current.includes('Đến muộn')) {
                              member.note = current.replace(/Đến muộn(\s*\d+\s*(phút|p))?\.?,?\s*/gi, '').trim();
                            } else {
                              member.note = current ? `Đến muộn 15p. ${current}` : 'Đến muộn 15p';
                            }
                            setActiveSession({ ...activeSession });
                          }}
                          title={isEn ? "Mark present and note Late" : "Đánh dấu có mặt và ghi chú Đến muộn"}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-0.5 shrink-0 cursor-pointer ${
                            hasLateNote
                              ? 'bg-brand-sand-100 dark:bg-brand-sand-950 text-brand-sand-800 dark:text-brand-sand-300 border-brand-sand-300 dark:border-brand-sand-700 font-extrabold shadow-2xs'
                              : 'bg-white dark:bg-brand-navy-700 hover:bg-brand-sand-50 dark:hover:bg-brand-sand-950/60 text-brand-navy-600 dark:text-brand-navy-300 hover:text-brand-sand-800 dark:hover:text-brand-sand-300 border-brand-navy-200 dark:border-brand-navy-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>+ Muộn</span>
                        </button>
                      </div>

                      {/* Phím chọn nhanh số phút nếu đã ghi nhận Đến muộn */}
                      {hasLateNote && (
                        <div className="flex items-center gap-1 text-[10px] pl-1">
                          <span className="text-brand-navy-400 font-semibold">{isEn ? 'Late duration:' : 'Số phút:'}</span>
                          {[5, 10, 15, 30].map(mins => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                const cleaned = (member.note || '').replace(/Đến muộn(\s*\d+\s*(phút|p))?\.?,?\s*/gi, '').trim();
                                member.note = cleaned ? `Đến muộn ${mins}p. ${cleaned}` : `Đến muộn ${mins}p`;
                                member.status = 'LATE';
                                setActiveSession({ ...activeSession });
                              }}
                              className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                (member.note || '').includes(`${mins}p`)
                                  ? 'bg-brand-sand-200 dark:bg-brand-sand-900 text-brand-sand-900 dark:text-brand-sand-200 border-brand-sand-400 font-bold'
                                  : 'bg-white dark:bg-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-600 text-brand-navy-600 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-600'
                              }`}
                            >
                              {mins}p
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-brand-navy-50 dark:bg-brand-navy-800 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-navy-900 dark:text-white text-xs">{activeSession.studentOrClass}</p>
                    <p className="text-[10px] text-brand-navy-500 dark:text-brand-navy-400">{activeSession.room}</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-brand-sage-700 text-white text-xs font-bold"
                  >
                    Xác nhận có mặt
                  </button>
                </div>
              )}
            </div>

            {/* Cảnh báo khóa thời gian nếu ca học ở tương lai */}
            {!activeSession.canTakeAttendance && (
              <div className="p-3 bg-brand-sand-50 dark:bg-brand-sand-950/60 rounded-xl border border-brand-sand-200 dark:border-brand-sand-800 text-brand-sand-800 dark:text-brand-sand-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-brand-sand-700 dark:text-brand-sand-400 shrink-0">schedule</span>
                <span>{isEn ? 'Attendance is only editable on the session date after the class has started.' : 'Chỉ có thể lưu điểm danh đúng ngày diễn ra và sau khi ca học đã bắt đầu.'}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
              <button
                type="button"
                disabled={savingAttendance}
                onClick={() => setIsAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-xs font-semibold text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 cursor-pointer disabled:opacity-50"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <MotionButton
                type="button"
                disabled={savingAttendance || !activeSession.canTakeAttendance}
                onClick={handleSaveAttendance}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-sage-600 to-brand-teal-700 hover:from-brand-sage-700 hover:to-brand-teal-800 text-white text-xs font-bold shadow-md shadow-brand-sage-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {savingAttendance ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                    <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                  </>
                ) : (
                  <span>{isEn ? 'Confirm & Save' : 'Xác Nhận & Lưu'}</span>
                )}
              </MotionButton>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CoachDashboard;
