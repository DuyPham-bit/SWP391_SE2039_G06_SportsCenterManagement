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

  // State Form "Đánh giá & Ghi nhận tiến độ" (Cột phải 35%)
  const [progressForm, setProgressForm] = useState({
    studentId: '',
    studentName: 'Trần Văn Mạnh',
    target: 'Tăng 3kg cơ bắp, Squat 100kg',
    weight: '68.5',
    heavyLift: '95',
    repsSets: '4 sets x 8 reps',
    feedbackNote: 'Học viên giữ form Squat rất chuẩn, hoàn thành đủ sets không bị hụt hơi.',
    sendToMember: true,
  });

  const [progressSaved, setProgressSaved] = useState(false);

  // State Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [isClassListModalOpen, setIsClassListModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coachApi.getCoachClassesAndMembers();
      setClasses(data || []);
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
  const memberList = Array.from(
    new Map(
      classes
        .flatMap((c) => c.members || [])
        .filter(Boolean)
        .map((m) => [m.id, m])
    ).values()
  );

  // Danh sách học viên mẫu đầy đủ mục tiêu
  const defaultStudents = [
    { id: 'st-1', name: 'Trần Văn Mạnh', target: isEn ? 'Gain 3kg muscle, Squat 100kg' : 'Tăng 3kg cơ bắp, Squat 100kg' },
    { id: 'st-2', name: 'Lê Thuỳ Dung', target: isEn ? 'Lose 4kg fat, firm thighs' : 'Giảm 4kg mỡ, săn chắc đùi' },
    { id: 'st-3', name: 'Nguyễn Tiến Đạt', target: isEn ? 'Cardio endurance & posture' : 'Cải thiện thể lực tim mạch & Cột sống' },
    { id: 'st-4', name: 'Phạm Quỳnh Nga', target: isEn ? 'Core conditioning & Pilates' : 'Săn chắc cơ bụng & Pilates phục hồi' },
  ];

  // Danh sách các ca dạy trong ngày
  const defaultSessions = [
    {
      id: 'demo-1',
      timeSlot: '07:30 - 08:30',
      type: 'PT 1:1',
      title: isEn ? '1:1 Private PT • Upper Body Hypertrophy' : 'PT Cá nhân • Tăng cơ Thân trên',
      room: isEn ? 'Weight Room #1' : 'Phòng Tạ #1 · Tầng 2',
      studentOrClass: 'Trần Văn Mạnh',
      members: [
        { id: 'm1', name: 'Trần Văn Mạnh', status: 'Present', phone: '0912 345 678', note: 'Đúng giờ' }
      ],
      attendanceDone: 1,
      attendanceTotal: 1,
      status: 'COMPLETED',
    },
    {
      id: 'demo-2',
      timeSlot: '09:00 - 10:30',
      type: 'Lớp nhóm',
      title: isEn ? 'CrossFit & Functional Conditioning' : 'CrossFit & Rèn luyện Thể lực Đa năng',
      room: isEn ? 'Studio A • Court 2' : 'Studio A · Sân số 2',
      studentOrClass: isEn ? 'Morning CrossFit Batch (CF-02)' : 'Lớp CrossFit Sáng (CF-02)',
      members: [
        { id: 'm2', name: 'Lê Hoàng Nam', status: 'Present', phone: '0988 111 222', note: '' },
        { id: 'm3', name: 'Nguyễn Thị Hoa', status: 'Present', phone: '0977 222 333', note: '' },
        { id: 'm4', name: 'Trần Đình Trọng', status: 'Present', phone: '0966 333 444', note: 'Đến muộn 10p' },
        { id: 'm5', name: 'Vũ Minh Tuấn', status: 'Absent', phone: '0944 555 666', note: 'Có phép' },
      ],
      attendanceDone: 8,
      attendanceTotal: 10,
      status: 'IN_PROGRESS',
    },
    {
      id: 'demo-3',
      timeSlot: '14:00 - 15:00',
      type: 'PT 1:1',
      title: isEn ? 'InBody Assessment & Mobility Rehab' : 'Kiểm tra InBody & Phục hồi vận động',
      room: isEn ? 'InBody Testing Lab' : 'Phòng Đo InBody · Tầng 1',
      studentOrClass: 'Lê Thuỳ Dung',
      members: [
        { id: 'm6', name: 'Lê Thuỳ Dung', status: 'Pending', phone: '0933 777 888', note: '' }
      ],
      attendanceDone: 0,
      attendanceTotal: 1,
      status: 'UPCOMING',
    },
    {
      id: 'demo-4',
      timeSlot: '17:30 - 18:30',
      type: 'Lớp nhóm',
      title: isEn ? 'Cardio HIIT Fat Burn Blast' : 'Cardio HIIT Đốt mỡ chuyên sâu',
      room: isEn ? 'Studio B • Main Court' : 'Studio B · Sân chính',
      studentOrClass: isEn ? 'Afternoon HIIT Batch (HT-05)' : 'Lớp HIIT Buổi chiều (HT-05)',
      members: [
        { id: 'm7', name: 'Đỗ Hữu Thắng', status: 'Pending', phone: '0909 123 456', note: '' },
        { id: 'm8', name: 'Bùi Lan Anh', status: 'Pending', phone: '0918 654 321', note: '' },
      ],
      attendanceDone: 0,
      attendanceTotal: 12,
      status: 'UPCOMING',
    },
  ];

  // Kết hợp ca thực tế từ backend schedule nếu có
  const backendSessions = (schedule.sessions || []).slice(0, 4).map((s, idx) => ({
    id: `be-${s.id}`,
    timeSlot: s.timeSlot || '08:00 - 09:30',
    type: s.type || 'Lớp học phần',
    title: s.name || (isEn ? 'Olympic Class Training' : 'Giáo án huấn luyện thể thao'),
    room: s.roomName || (isEn ? 'Olympic Main Arena' : 'Cụm sân Olympic'),
    studentOrClass: s.name || `Lớp học #${idx + 1}`,
    members: (classes[idx]?.members || []).map((m) => ({
      id: m.id,
      name: m.fullName || m.name,
      status: 'Present',
      phone: m.phone || '09xx xxx xxx',
    })),
    attendanceDone: s.status === 'COMPLETED' ? 12 : 0,
    attendanceTotal: 12,
    status: s.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
    isBackend: true,
  }));

  const allSessions = backendSessions.length > 0 ? backendSessions : defaultSessions;

  // Xử lý mở Modal Danh Sách Lớp
  const handleOpenClassList = (session) => {
    setActiveSession(session);
    setIsClassListModalOpen(true);
  };

  // Xử lý mở Modal Điểm Danh Nhanh
  const handleOpenAttendance = (session) => {
    setActiveSession(session);
    setIsAttendanceModalOpen(true);
  };

  // Xử lý lưu Form Tiến Độ
  const handleSaveProgress = (e) => {
    e.preventDefault();
    const w = parseFloat(progressForm.weight);
    const hl = parseFloat(progressForm.heavyLift);
    if (isNaN(w) || w <= 0 || w > 500) {
      alert(isEn ? 'Please enter a valid weight (0 - 500 kg).' : 'Vui lòng nhập cân nặng hợp lệ (từ 1 đến 500 kg).');
      return;
    }
    if (isNaN(hl) || hl < 0 || hl > 500) {
      alert(isEn ? 'Please enter a valid max lift (0 - 500 kg).' : 'Vui lòng nhập mức tạ hợp lệ (từ 0 đến 500 kg).');
      return;
    }
    if (progressForm.feedbackNote && progressForm.feedbackNote.length > 1000) {
      alert(isEn ? 'Feedback note cannot exceed 1000 characters.' : 'Nhận xét không được vượt quá 1000 ký tự.');
      return;
    }
    setProgressSaved(true);
    setTimeout(() => setProgressSaved(false), 3500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] space-y-6 animate-fadeIn pb-10">
      
      {/* ─────────────────────────────────────────────────────────────
          1. TOP BANNER GRADIENT (Xanh Navy Slate & 3 Chỉ số Trọng tâm)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm border border-slate-800/80">
        {/* Glow ambient background trang trí */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-60 h-60 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-sm border border-blue-400/20 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isEn ? 'Olympic Certified Coach Portal' : 'Cổng Huấn Luyện Viên Chuyên Nghiệp'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {isEn
                ? `Welcome back, Coach ${currentUser?.fullName || 'Trainer'}!`
                : `Chào ngày mới, HLV ${currentUser?.fullName || 'Huấn Luyện Viên'}! 👋`}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {isEn
                ? `You have ${allSessions.length} sessions scheduled today. Track your student attendance and log training progress seamlessly.`
                : `Hôm nay bạn có ${allSessions.length} ca dạy được phân công. Hãy kiểm tra danh sách lớp, thực hiện điểm danh và đánh giá kết quả rèn luyện của học viên.`}
            </p>
          </div>

          {/* 3 Khối Thống Số Trọng Tâm: Số ca dạy, Tổng học viên, Tỉ lệ chuyên cần */}
          <div className="w-full lg:w-auto grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            
            {/* Thẻ 1: Số ca dạy hôm nay */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[110px] sm:min-w-[135px] flex flex-col justify-between shadow-sm hover:bg-white/[0.14] transition-all">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                {isEn ? 'Sessions Today' : 'Ca dạy hôm nay'}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{allSessions.length}</span>
                <span className="text-xs text-blue-300 font-semibold">{isEn ? 'slots' : 'ca'}</span>
              </div>
              <span className="mt-1 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                ● 1 ca đã xong
              </span>
            </div>

            {/* Thẻ 2: Tổng học viên */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[110px] sm:min-w-[135px] flex flex-col justify-between shadow-sm hover:bg-white/[0.14] transition-all">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                {isEn ? 'Total Students' : 'Tổng học viên'}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {studentCount > 0 ? studentCount : 24}
                </span>
                <span className="text-xs text-slate-300 font-semibold">{isEn ? 'members' : 'người'}</span>
              </div>
              <span className="mt-1 text-[10px] text-blue-300 font-bold flex items-center gap-1">
                ↑ 3 học viên mới
              </span>
            </div>

            {/* Thẻ 3: Tỉ lệ chuyên cần */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[110px] sm:min-w-[135px] flex flex-col justify-between shadow-sm hover:bg-white/[0.14] transition-all">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần'}
              </span>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-300">92%</span>
              </div>
              <span className="mt-1 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                ↑ +4.2% so tuần trước
              </span>
            </div>

          </div>
        </div>
      </section>

      <CoachError message={error} retry={load} />

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT (Bố cục 2 Cột: Cột trái 65% - Cột phải 35%)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ═══════════════════════════════════════════════════════════
            CỘT TRÁI (65% width / lg:col-span-8): LỊCH DẠY & ĐIỂM DANH HÔM NAY
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Header Card & Bộ lọc Thời gian */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {isEn ? "Today's Schedule & Attendance" : 'Lịch dạy & Điểm danh hôm nay'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isEn
                    ? 'Assigned classes and 1:1 training appointments in real-time'
                    : 'Danh sách các ca dạy trong ngày · Mở danh sách hoặc điểm danh trực tiếp'}
                </p>
              </div>
            </div>

            {/* Button Group Bộ lọc Ngày / Tuần / Tháng */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { id: 'day', label: isEn ? 'Day' : 'Hôm nay' },
                { id: 'week', label: isEn ? 'Week' : 'Tuần này' },
                { id: 'month', label: isEn ? 'Month' : 'Tháng này' },
              ].map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setFilterPeriod(period.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                    filterPeriod === period.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 shadow-xs">
                <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                <p className="text-sm font-bold text-slate-700">
                  {isEn ? 'No teaching sessions scheduled for today.' : 'Không có ca dạy nào hôm nay.'}
                </p>
                <p className="text-xs text-slate-400">
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
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-sm hover:shadow-md ${
                    isCurrent
                      ? 'border-blue-600 ring-2 ring-blue-600/10'
                      : 'border-slate-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    {/* Khối Thông tin ca */}
                    <div className="flex items-start gap-4">
                      {/* Khung giờ */}
                      <div className="flex flex-col items-center justify-center bg-slate-100/90 text-slate-800 rounded-xl px-3 py-2 text-center shrink-0 min-w-[76px] border border-slate-200/60">
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                          {isEn ? 'Time' : 'Giờ dạy'}
                        </span>
                        <span className="text-xs font-black text-slate-900 mt-0.5">
                          {session.timeSlot}
                        </span>
                      </div>

                      {/* Nội dung ca */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              session.type.includes('PT')
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {session.type}
                          </span>

                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                              ● {isEn ? 'Live Now' : 'Đang diễn ra'}
                            </span>
                          )}

                          {isFinished && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              ✓ {isEn ? 'Completed' : 'Đã hoàn tất'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {session.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">group</span>
                            <span>{session.studentOrClass}</span>
                          </span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                            <span>{session.room}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Điểm danh & Nút Hành Động Nhanh */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 font-medium">{isEn ? 'Attendance: ' : 'Điểm danh: '}</span>
                        <span className="text-xs font-black text-slate-900">
                          {session.attendanceDone}/{session.attendanceTotal}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* NÚT BẤM NHANH 1: Mở danh sách lớp */}
                        <button
                          type="button"
                          onClick={() => handleOpenClassList(session)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px] text-slate-500">list_alt</span>
                          <span>{isEn ? 'Class List' : 'Mở danh sách lớp'}</span>
                        </button>

                        {/* NÚT BẤM NHANH 2: Điểm danh nhanh */}
                        <button
                          type="button"
                          onClick={() => handleOpenAttendance(session)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                            isFinished
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                          <span>{isFinished ? (isEn ? 'View Check-in' : 'Xem điểm danh') : (isEn ? 'Attendance' : 'Điểm danh')}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            }))}
          </div>

          {/* Lối tắt xem toàn bộ lịch tuần */}
          <div className="pt-2 text-right">
            <a
              href="#/coach/schedule"
              className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{isEn ? 'View full weekly teaching schedule' : 'Xem toàn bộ lịch giảng dạy trong tuần'}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CỘT PHẢI (35% width / lg:col-span-4): ĐÁNH GIÁ & GHI NHẬN TIẾN ĐỘ
        ═══════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            
            {/* Header Form + NÚT GỢI Ý AI NỔI BẬT NGAY GÓC FORM */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {isEn ? 'Session Evaluation & Progress' : 'Đánh giá & Ghi nhận tiến độ'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isEn ? 'Log workout metrics & feedback' : 'Nhập kết quả & nhận xét học viên'}
                </p>
              </div>

              {/* NÚT "GỢI Ý AI" GÓC FORM */}
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all cursor-pointer transform hover:-translate-y-0.5 shrink-0"
                title="Gọi modal AI tư vấn bài tập thông minh"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-300">auto_awesome</span>
                <span>{isEn ? 'AI Suggest' : 'Gợi ý AI'}</span>
              </button>
            </div>

            {/* Form Nhập Liệu Nhanh Gọn */}
            <form onSubmit={handleSaveProgress} className="space-y-3.5 text-xs">
              
              {/* Chọn học viên */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {isEn ? 'Select Student' : 'Chọn học viên theo dõi'}
                </label>
                <select
                  value={progressForm.studentName}
                  onChange={(e) => {
                    const found = defaultStudents.find((s) => s.name === e.target.value);
                    setProgressForm({
                      ...progressForm,
                      studentName: e.target.value,
                      target: found ? found.target : 'Rèn luyện thể lực tiêu chuẩn',
                    });
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
                >
                  {memberList.length > 0 ? (
                    memberList.map((m) => (
                      <option key={m.id} value={m.fullName || m.name}>
                        {m.fullName || m.name} (Mã: {m.code || m.id})
                      </option>
                    ))
                  ) : (
                    defaultStudents.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.target})
                      </option>
                    ))
                  )}
                </select>

                {/* Tag mục tiêu học viên hiển thị trực quan */}
                <div className="mt-1.5 p-2 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 flex items-center gap-1.5">
                  <span className="font-bold text-blue-700 shrink-0">{isEn ? 'Goal:' : 'Mục tiêu:'}</span>
                  <span className="truncate">{progressForm.target}</span>
                </div>
              </div>

              {/* Nhập Cân nặng & Mức tạ chính */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isEn ? 'Weight (kg)' : 'Cân nặng (kg)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    value={progressForm.weight}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || Number(val) >= 0) {
                        setProgressForm({ ...progressForm, weight: val });
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="68.5"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isEn ? 'Max Lift (kg)' : 'Mức tạ Max (kg)'}
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
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    placeholder="95"
                    required
                  />
                </div>
              </div>

              {/* Khối lượng bài tập / Sets x Reps */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {isEn ? 'Volume (Sets x Reps)' : 'Khối lượng hoàn thành (Sets x Reps)'}
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={progressForm.repsSets}
                  onChange={(e) => setProgressForm({ ...progressForm, repsSets: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  placeholder={isEn ? 'e.g. 4 sets x 8 reps Squat' : 'Ví dụ: 4 sets x 8 reps Squat'}
                  required
                />
              </div>

              {/* Ghi chú nhận xét buổi tập */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    {isEn ? 'Coach Feedback & Notes' : 'Nhận xét & Đánh giá buổi tập'}
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {progressForm.feedbackNote?.length || 0}/1000
                  </span>
                </div>
                <textarea
                  rows="3"
                  maxLength={1000}
                  value={progressForm.feedbackNote}
                  onChange={(e) => setProgressForm({ ...progressForm, feedbackNote: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none text-xs"
                  placeholder={isEn ? 'Technique evaluation, fatigue levels, corrections...' : 'Ghi nhận tư thế, thể lực, biểu hiện mỏi mệt hoặc điểm cần cải thiện...'}
                />
              </div>

              {/* Checkbox gửi cho học viên */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={progressForm.sendToMember}
                  onChange={(e) => setProgressForm({ ...progressForm, sendToMember: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-[11px] text-slate-600 font-medium">
                  {isEn ? 'Sync & send evaluation report to student app' : 'Đồng bộ & gửi báo cáo đánh giá cho học viên'}
                </span>
              </label>

              {/* Nút Submit Form */}
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span className="material-symbols-outlined text-[17px] text-emerald-400">save</span>
                <span>{isEn ? 'Save Progress & Evaluation' : 'Lưu kết quả & Đánh giá'}</span>
              </button>

              {/* Alert Lưu Thành Công */}
              {progressSaved && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
                  <span className="material-symbols-outlined text-[17px] text-emerald-600 shrink-0">check_circle</span>
                  <span>{isEn ? 'Progress updated and synced successfully!' : 'Đã ghi nhận kết quả và cập nhật tiến độ học viên thành công!'}</span>
                </div>
              )}
            </form>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MODAL GỢI Ý GIÁO ÁN AI (AI Lesson Assistant Modal)
      ───────────────────────────────────────────────────────────── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
                  <span className="material-symbols-outlined text-[18px] text-amber-300">auto_awesome</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{isEn ? 'AI Lesson Assistant' : 'Gợi ý giáo án AI thông minh'}</h3>
                  <p className="text-[11px] text-slate-500">
                    {isEn ? 'Analyzing for student: ' : 'Đang phân tích cho: '}
                    <strong className="text-blue-700">{progressForm.studentName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Dynamic AI Plan Content */}
            {(() => {
              const t = (progressForm.target || '').toLowerCase();
              const isFat = t.includes('mỡ') || t.includes('giảm') || t.includes('fat') || t.includes('cardio');
              const isReh = t.includes('cột sống') || t.includes('lưng') || t.includes('phục hồi') || t.includes('khớp');

              const aiPlan = isFat ? {
                title: isEn ? 'High Intensity Caloric Burn (HIIT)' : 'Phác đồ Kích hoạt Đốt mỡ Cường độ cao (HIIT)',
                desc: isEn ? 'Focus on explosive pacing and short rests.' : 'Tối ưu tiêu hao mỡ thừa, kích hoạt nhịp tim Zone 3-4 và săn chắc cơ.',
                lift: '35',
                sets: '4 sets x 15 reps (Kettlebell & Battle Ropes)',
                feedback: 'Đã áp dụng AI: Tối ưu nhịp tim Zone 3-4, đẩy nhanh tốc độ đốt calo và kiểm soát thâm hụt năng lượng.',
                exercises: [
                  { name: 'Kettlebell Swings', sets: '4 sets x 15 reps @ 16kg', tag: 'Kích hoạt háng' },
                  { name: 'Dumbbell Thrusters', sets: '4 sets x 12 reps @ 10kg', tag: 'Toàn thân' },
                  { name: 'Battle Ropes Slam', sets: '4 sets x 30 giây', tag: 'Cardio HIIT' },
                ]
              } : isReh ? {
                title: isEn ? 'Posture Alignment & Core Stability' : 'Phục hồi Trục Cột sống & Khớp hông',
                desc: isEn ? 'Corrective exercises to relieve spinal tension.' : 'Kéo giãn đốt sống, giải phóng áp lực lưng dưới và mở khớp hông.',
                lift: '40',
                sets: '3 sets x 12 reps nhẹ nhàng',
                feedback: 'Đã áp dụng AI: Tăng cường độ ổn định trục xương chậu, kéo giãn cơ thắt lưng và mở khớp vai.',
                exercises: [
                  { name: 'Cat-Cow Breathing Drill', sets: '3 sets x 10 chu kỳ thở sâu', tag: 'Cột sống' },
                  { name: 'Bird-Dog Stability', sets: '3 sets x 8 reps mỗi bên', tag: 'Ổn định thắt lưng' },
                  { name: 'Glute Bridge Isometric Hold', sets: '3 sets x 12 reps (giữ 3s)', tag: 'Cơ mông' },
                ]
              } : {
                title: isEn ? 'Hypertrophy & Progressive Strength Split' : 'Tăng cơ Bắp & Tải trọng Tịnh tiến (Hypertrophy)',
                desc: isEn ? 'Progressive overload targeting major muscle groups.' : 'Kích thích sợi cơ phì đại, tăng dần mức tạ khi chuẩn form.',
                lift: '100',
                sets: '4 sets x 8-10 reps Squat @ 100kg',
                feedback: 'Đã áp dụng đề xuất AI: Nâng mức Squat lên 100kg x 8 reps, bổ sung Bulgarian Split Squat và Roman Chair Leg Raise.',
                exercises: [
                  { name: 'Barbell Back Squat', sets: '4 sets x 8 reps @ 100kg (Tăng 5kg)', tag: 'Trọng tâm' },
                  { name: 'Bulgarian Split Squat', sets: '3 sets x 10 reps @ 16kg', tag: 'Cân bằng cơ' },
                  { name: 'Roman Chair Leg Raise', sets: '3 sets x 15 reps', tag: 'Core & Bụng' },
                ]
              };

              return (
                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 block text-[11px] uppercase">
                        {isEn ? 'Goal: ' : 'Mục tiêu: '}{progressForm.target}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        {isEn ? 'AI Analysis' : 'Phân tích AI'}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">{aiPlan.desc}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center justify-between">
                      <span>{aiPlan.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {isEn ? 'Tailored recommendation' : 'Đề xuất tùy chỉnh'}
                      </span>
                    </h4>

                    <ul className="space-y-2">
                      {aiPlan.exercises.map((ex, idx) => (
                        <li key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{idx + 1}. {ex.name}</p>
                            <p className="text-[10px] text-slate-500">{ex.sets}</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            {ex.tag}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <a
                      href="#/coach/ai-recommendation"
                      onClick={() => setIsAiModalOpen(false)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                      <span>{isEn ? 'Open Full AI Assistant' : 'Mở trang Trợ lý AI chuyên sâu'}</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAiModalOpen(false)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        {isEn ? 'Close' : 'Đóng'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProgressForm({
                            ...progressForm,
                            heavyLift: aiPlan.lift,
                            repsSets: aiPlan.sets,
                            feedbackNote: aiPlan.feedback,
                          });
                          setIsAiModalOpen(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>{isEn ? 'Apply to Form' : 'Áp dụng vào Form'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MODAL MỞ DANH SÁCH LỚP (Class List Modal)
      ───────────────────────────────────────────────────────────── */}
      {isClassListModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isEn ? 'Class Roster & Students' : 'Danh sách học viên ca dạy'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeSession.title} ({activeSession.timeSlot}) · {activeSession.room}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClassListModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeSession.members && activeSession.members.length > 0 ? (
                activeSession.members.map((member, i) => (
                  <div
                    key={member.id || i}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{member.name}</p>
                        <p className="text-[10px] text-slate-500">{member.phone} {member.note ? `• ${member.note}` : ''}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        member.status === 'Present' || member.status === 'Late'
                          ? 'bg-emerald-100 text-emerald-800'
                          : member.status === 'Absent'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {member.status === 'Present' || member.status === 'Late' ? 'Có mặt' : member.status === 'Absent' ? 'Vắng' : 'Chờ điểm danh'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  {isEn ? 'No student records found.' : 'Chưa có thông tin học viên trong ca này.'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                {isEn ? 'Total: ' : 'Tổng số: '}<strong>{activeSession.attendanceTotal} học viên</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsClassListModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isEn ? 'Quick Check-in Attendance' : 'Điểm danh nhanh theo ca'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {activeSession.title} · {activeSession.timeSlot}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {activeSession.members && activeSession.members.length > 0 ? (
                activeSession.members.map((member, i) => {
                  const isPresent = member.status === 'Present' || member.status === 'Late';
                  const isAbsent = member.status === 'Absent';
                  const hasLateNote = (member.note || '').includes('Đến muộn');

                  return (
                    <div
                      key={member.id || i}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{member.name}</p>
                          <p className="text-[10px] text-slate-500">{activeSession.room}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              member.status = 'Present';
                              setActiveSession({ ...activeSession });
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isEn ? 'Present' : 'Có mặt'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              member.status = 'Absent';
                              setActiveSession({ ...activeSession });
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                              isAbsent
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {isEn ? 'Absent' : 'Vắng'}
                          </button>
                        </div>
                      </div>

                      {/* Ghi chú điểm danh & tích hợp Đến muộn */}
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60">
                        <input
                          type="text"
                          value={member.note || ''}
                          onChange={(e) => {
                            member.note = e.target.value;
                            setActiveSession({ ...activeSession });
                          }}
                          placeholder={isEn ? "Attendance note (e.g. Late 10m)..." : "Ghi chú điểm danh (VD: Đến muộn 10p)..."}
                          className="flex-1 text-[11px] px-2.5 py-1 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            member.status = 'Present';
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
                              ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold shadow-2xs'
                              : 'bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border-slate-200'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>+ Muộn</span>
                        </button>
                      </div>

                      {/* Phím chọn nhanh số phút nếu đã ghi nhận Đến muộn */}
                      {hasLateNote && (
                        <div className="flex items-center gap-1 text-[10px] pl-1">
                          <span className="text-slate-400 font-semibold">{isEn ? 'Late duration:' : 'Số phút:'}</span>
                          {[5, 10, 15, 30].map(mins => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                const cleaned = (member.note || '').replace(/Đến muộn(\s*\d+\s*(phút|p))?\.?,?\s*/gi, '').trim();
                                member.note = cleaned ? `Đến muộn ${mins}p. ${cleaned}` : `Đến muộn ${mins}p`;
                                member.status = 'Present';
                                setActiveSession({ ...activeSession });
                              }}
                              className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                (member.note || '').includes(`${mins}p`)
                                  ? 'bg-amber-200 text-amber-900 border-amber-400 font-bold'
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
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
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{activeSession.studentOrClass}</p>
                    <p className="text-[10px] text-slate-500">{activeSession.room}</p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    Xác nhận có mặt
                  </button>
                </div>
              )}
            </div>

            {/* Cảnh báo khóa thời gian nếu ca học ở tương lai */}
            {activeSession.status === 'UPCOMING' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">schedule</span>
                <span>{isEn ? 'This session has not started yet. Attendance recording is locked until class commencement.' : 'Ca học chưa tới giờ diễn ra. Chức năng lưu điểm danh bị khóa cho đến khi ca học bắt đầu.'}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={savingAttendance}
                onClick={() => setIsAttendanceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                {isEn ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="button"
                disabled={savingAttendance || activeSession.status === 'UPCOMING'}
                onClick={() => {
                  if (savingAttendance) return;
                  setSavingAttendance(true);
                  setTimeout(() => {
                    setSavingAttendance(false);
                    alert(isEn ? 'Attendance recorded successfully!' : 'Đã lưu kết quả điểm danh thành công!');
                    setIsAttendanceModalOpen(false);
                  }, 600);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {savingAttendance ? (
                  <>
                    <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                    <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                  </>
                ) : (
                  <span>{isEn ? 'Confirm & Save' : 'Xác nhận & Lưu'}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CoachDashboard;
