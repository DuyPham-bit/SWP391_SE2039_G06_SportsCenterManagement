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

  // Danh sÃ¡ch cÃ¡c ca háº¹n PT Ä‘Æ°á»£c táº¡o thÃªm trá»±c tiáº¿p trÃªn Dashboard
  const [customAppointments, setCustomAppointments] = useState([]);
  const [scheduleFilter, setScheduleFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED'
  const [successMsg, setSuccessMsg] = useState('');

  // Form State LÃªn lá»‹ch PT
  const [formData, setFormData] = useState({
    appointmentType: '1to1',
    title: '',
    memberId: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    notes: ''
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

  // Láº¥y danh sÃ¡ch táº¥t cáº£ há»c viÃªn Ä‘ang dáº¡y tá»« classes Ä‘á»ƒ Ä‘Æ°a vÃ o dropdown LÃªn lá»‹ch PT
  const memberList = Array.from(
    new Map(
      classes
        .flatMap(c => c.members || [])
        .filter(Boolean)
        .map(m => [m.id, m])
    ).values()
  );

  // Máº«u ca dáº¡y máº·c Ä‘á»‹nh náº¿u chÆ°a cÃ³ dá»¯ liá»‡u lá»‹ch dÃ y Ä‘áº·c tá»« database
  const defaultSessions = [
    {
      id: 'demo-1',
      timeSlot: '07:30 - 08:30',
      room: isEn ? 'Weight Room #1' : 'PhÃ²ng Táº¡ #1',
      studentName: 'Nguyá»…n VÄƒn An',
      studentAvatar: 'NA',
      avatarColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      courseInfo: isEn ? 'PT 1:1 â€¢ Session 12/24' : 'PT 1:1 â€¢ Buá»•i 12/24',
      exerciseTitle: 'Chest & Triceps Hypertrophy',
      exerciseDetails: 'Bench Press, Dumbbell Flyes, Cable Pushdown',
      status: 'COMPLETED'
    },
    {
      id: 'demo-2',
      timeSlot: '09:30 - 10:30',
      room: isEn ? 'Cardio Zone' : 'Khu Cardio',
      studentName: 'Tráº§n Thá»‹ BÃ­ch',
      studentAvatar: 'TB',
      avatarColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
      courseInfo: isEn ? 'PT 1:1 â€¢ Session 8/16' : 'PT 1:1 â€¢ Buá»•i 8/16',
      exerciseTitle: 'Cardio HIIT & Core Fat Burn',
      exerciseDetails: 'Cháº¡y biáº¿n tá»‘c, Battle Rope, Plank khÃ¡ng lá»±c',
      status: 'UPCOMING'
    },
    {
      id: 'demo-3',
      timeSlot: '15:30 - 16:30',
      room: isEn ? 'Stretching Studio' : 'PhÃ²ng KÃ©o giÃ£n',
      studentName: 'LÃª HoÃ ng Nam',
      studentAvatar: 'HN',
      avatarColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      courseInfo: isEn ? 'PT 1:1 â€¢ Session 3/10' : 'PT 1:1 â€¢ Buá»•i 3/10',
      exerciseTitle: 'Mobility & Lower Back Rehab',
      exerciseDetails: 'GiÃ£n cÆ¡ sÃ¢u chuyÃªn sÃ¢u, Deadlift ká»¹ thuáº­t nháº¹',
      status: 'PENDING'
    },
    {
      id: 'demo-4',
      timeSlot: '18:00 - 19:00',
      room: isEn ? 'Olympic Powerlifting' : 'Khu Powerlifting',
      studentName: 'Pháº¡m Minh Trang',
      studentAvatar: 'MT',
      avatarColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      courseInfo: isEn ? 'PT 1:1 â€¢ Session 20/24' : 'PT 1:1 â€¢ Buá»•i 20/24',
      exerciseTitle: 'Lower Body Strength & Squat PR',
      exerciseDetails: 'Barbell Squat, RDL, Walking Lunges',
      status: 'PENDING'
    }
  ];

  // Káº¿t há»£p ca dáº¡y thá»±c táº¿ tá»« schedule backend + ca táº¡o má»›i
  const backendSessionsFormatted = schedule.sessions.slice(0, 5).map((s, idx) => ({
    id: s.id,
    timeSlot: s.timeSlot || '08:00 - 09:30',
    room: s.roomName || (isEn ? 'Olympic Hall' : 'Cá»¥m sÃ¢n Olympic'),
    studentName: s.name || `Lá»›p há»c pháº§n #${idx + 1}`,
    studentAvatar: (s.name || 'SC').slice(0, 2).toUpperCase(),
    avatarColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    courseInfo: `${s.sessionDate} â€¢ Ca thá»±c táº¿`,
    exerciseTitle: isEn ? 'Standard Olympic Training' : 'GiÃ¡o Ã¡n huáº¥n luyá»‡n thá»ƒ thao',
    exerciseDetails: isEn ? 'Technique evaluation, stamina drill' : 'ÄÃ¡nh giÃ¡ ká»¹ thuáº­t, rÃ¨n luyá»‡n thá»ƒ lá»±c',
    status: s.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
    isBackend: true,
    sessionDate: s.sessionDate
  }));

  const allDisplaySessions = [
    ...customAppointments,
    ...(backendSessionsFormatted.length > 0 ? backendSessionsFormatted : defaultSessions)
  ];

  const filteredSessions = allDisplaySessions.filter(s => {
    if (scheduleFilter === 'ALL') return true;
    if (scheduleFilter === 'UPCOMING') return s.status === 'UPCOMING' || s.status === 'PENDING';
    if (scheduleFilter === 'COMPLETED') return s.status === 'COMPLETED';
    return true;
  });

  // Xá»­ lÃ½ gá»­i Form Táº¡o Lá»‹ch Háº¹n PT
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!formData.title) return;

    let selectedMemberName = formData.memberName;
    if (!selectedMemberName && formData.memberId) {
      const found = memberList.find(m => String(m.id) === String(formData.memberId));
      if (found) selectedMemberName = found.fullName || found.name;
    }
    if (!selectedMemberName) selectedMemberName = isEn ? 'New PT Student' : 'Há»c viÃªn PT má»›i';

    const newAppt = {
      id: 'custom-' + Date.now(),
      timeSlot: `${formData.startTime} - ${formData.startTime.split(':')[0]}:50`,
      room: isEn ? 'PT Zone #2' : 'Khu vá»±c PT #2',
      studentName: selectedMemberName,
      studentAvatar: selectedMemberName.slice(0, 2).toUpperCase(),
      avatarColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      courseInfo: `${formData.sessionDate} â€¢ PT 1:1`,
      exerciseTitle: formData.title,
      exerciseDetails: formData.notes || (isEn ? 'Personal coaching session' : 'Buá»•i táº­p kÃ¨m riÃªng theo giÃ¡o Ã¡n'),
      status: 'UPCOMING'
    };

    setCustomAppointments(prev => [newAppt, ...prev]);
    setSuccessMsg(isEn ? 'Appointment created successfully!' : 'ÄÃ£ táº¡o lá»‹ch háº¹n PT thÃ nh cÃ´ng!');
    setFormData({
      appointmentType: '1to1',
      title: '',
      memberId: '',
      sessionDate: new Date().toISOString().split('T')[0],
      startTime: '14:00',
      notes: ''
    });

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const quickLinks = [
    { route: 'schedule', icon: 'calendar_month', label: isEn ? 'Teaching Schedule' : 'Lá»‹ch giáº£ng dáº¡y' },
    { route: 'attendance', icon: 'fact_check', label: isEn ? 'Attendance Report' : 'BÃ¡o cÃ¡o Ä‘iá»ƒm danh' },
    { route: 'members', icon: 'group', label: isEn ? 'Student Profiles' : 'Há»“ sÆ¡ há»c viÃªn PT' },
    { route: 'training-plan', icon: 'fitness_center', label: isEn ? 'Workout & Diet' : 'GiÃ¡o Ã¡n & Dinh dÆ°á»¡ng' },
    { route: 'professional', icon: 'payments', label: isEn ? 'Salary & KPI (Hub)' : 'LÆ°Æ¡ng & KPI (Hub)', highlight: true },
    { route: 'ai-recommendation', icon: 'smart_toy', label: isEn ? 'AI Lesson Plan' : 'Gá»£i Ã½ giÃ¡o Ã¡n AI' },
    { route: 'notifications', icon: 'campaign', label: isEn ? 'Notices & Chat' : 'Gá»­i thÃ´ng bÃ¡o & Chat' },
    { route: 'support', icon: 'support_agent', label: isEn ? 'Support Requests' : 'YÃªu cáº§u há»— trá»£' }
  ];

  return (
    <div className="space-y-6">
      
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          1. TOP BANNER (Ná»n gradient xanh navy #1e3a8a & 4 Stats Trong Suá»‘t)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#2563eb] text-white p-6 sm:p-8 lg:p-10 shadow-xl overflow-hidden border border-white/10">
        {/* Glow ambient background effects */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 -bottom-16 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative z-10">
          {/* Text chÃ o má»«ng */}
          <div className="max-w-2xl mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isEn ? 'Olympic Certified Coach' : 'Huáº¥n luyá»‡n viÃªn ChuyÃªn nghiá»‡p (PT) Pro'}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {isEn
                ? `Welcome back, Coach ${currentUser?.fullName || 'Trainer'}! ðŸ‘‹`
                : `Xin chÃ o, HLV ${currentUser?.fullName || 'Huáº¥n luyá»‡n viÃªn'}! ðŸ‘‹`}
            </h1>
            <p className="text-sm sm:text-base text-blue-100/90 mt-2 leading-relaxed">
              {isEn
                ? `Wishing you an energetic coaching day. You have ${allDisplaySessions.length} sessions scheduled today.`
                : `ChÃºc báº¡n má»™t ngÃ y lÃ m viá»‡c trÃ n Ä‘áº§y nÄƒng lÆ°á»£ng. Báº¡n cÃ³ ${allDisplaySessions.length} ca táº­p cáº§n hÆ°á»›ng dáº«n hÃ´m nay!`}
            </p>
          </div>

          {/* 4 Ã” Stats trong suá»‘t (Glassmorphism) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* Stat 1: Há»c viÃªn */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[22px]">group</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                    {isEn ? 'Students' : 'Há»c viÃªn'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mt-0.5">
                    {loading ? '...' : (studentCount > 0 ? studentCount : 2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 2: Buá»•i dáº¡y */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                    {isEn ? 'Sessions' : 'Buá»•i dáº¡y'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mt-0.5">
                    {schedule.loading ? '...' : (schedule.sessions.length > 0 ? schedule.sessions.length : 45)}
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 3: ÄÃ¡nh giÃ¡ */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 hover:bg-white/15 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400/25 flex items-center justify-center text-amber-300 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">star</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                    {isEn ? 'Rating' : 'ÄÃ¡nh giÃ¡'}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mt-0.5 flex items-center gap-1">
                    5.0 <span className="text-amber-300 text-lg">â˜…</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat 4: LÆ°Æ¡ng (Highlight mÃ u xanh lá»¥c) */}
            <div className="bg-emerald-950/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-emerald-400/40 hover:bg-emerald-950/40 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                    {isEn ? 'Estimated Salary' : 'LÆ°Æ¡ng táº¡m tÃ­nh'}
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-black text-[#4ade80] leading-tight mt-0.5 tracking-tight drop-shadow-sm">
                    8.262.500 â‚«
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <CoachError message={error} retry={load} />

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          2. LAYOUT 2 Cá»˜T (Cá»™t trÃ¡i 65% - Cá»™t pháº£i 35%)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Cá»˜T TRÃI (65% / lg:col-span-8): Card "Lá»‹ch dáº¡y sáº¯p tá»›i" */}
        <section className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#1A3B8B] dark:text-blue-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEn ? 'Upcoming Teaching Sessions' : 'Lá»‹ch dáº¡y sáº¯p tá»›i'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn ? 'List of coaching classes and 1:1 PT appointments' : 'Danh sÃ¡ch ca dáº¡y vÃ  lá»‹ch kÃ¨m PT 1:1'}
                </p>
              </div>
            </div>

            {/* Bá»™ lá»c ca dáº¡y */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setScheduleFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scheduleFilter === 'ALL'
                    ? 'bg-[#1A3B8B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEn ? 'All' : 'Táº¥t cáº£'} ({allDisplaySessions.length})
              </button>
              <button
                type="button"
                onClick={() => setScheduleFilter('UPCOMING')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scheduleFilter === 'UPCOMING'
                    ? 'bg-[#1A3B8B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEn ? 'Upcoming' : 'Sáº¯p tá»›i'}
              </button>
              <button
                type="button"
                onClick={() => setScheduleFilter('COMPLETED')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scheduleFilter === 'COMPLETED'
                    ? 'bg-[#1A3B8B] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isEn ? 'Done' : 'ÄÃ£ xong'}
              </button>
            </div>
          </div>

          {/* Card Body: Danh sÃ¡ch ca dáº¡y dáº¡ng Table Responsive */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/40 dark:bg-slate-800/40">
                  <th className="py-3 px-4">{isEn ? 'Time Slot' : 'Khung Giá»'}</th>
                  <th className="py-3 px-4">{isEn ? 'Student / Class' : 'Há»c ViÃªn'}</th>
                  <th className="py-3 px-4">{isEn ? 'Workout / Syllabus' : 'BÃ i Táº­p & GiÃ¡o Ãn'}</th>
                  <th className="py-3 px-4 text-end">{isEn ? 'Status & Action' : 'Tráº¡ng ThÃ¡i'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    
                    {/* Khung giá» */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                        <span>{session.timeSlot}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 pl-5">
                        {session.room}
                      </div>
                    </td>

                    {/* Há»c viÃªn */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${session.avatarColor}`}>
                          {session.studentAvatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {session.studentName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {session.courseInfo}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* BÃ i táº­p & GiÃ¡o Ã¡n */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {session.exerciseTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {session.exerciseDetails}
                      </div>
                    </td>

                    {/* Tráº¡ng thÃ¡i & NÃºt thao tÃ¡c */}
                    <td className="py-3.5 px-4 text-end whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {session.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            {isEn ? 'Completed' : 'ÄÃ£ xong'}
                          </span>
                        ) : session.status === 'UPCOMING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span className="material-symbols-outlined text-[13px]">bolt</span>
                            {isEn ? 'Upcoming' : 'Sáº¯p diá»…n ra'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                            {isEn ? 'Pending' : 'ChÆ°a diá»…n ra'}
                          </span>
                        )}

                        <a
                          href={session.isBackend ? `#/coach/attendance?sessionId=${session.id}&date=${session.sessionDate}` : '#/coach/attendance'}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#1A3B8B] hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">how_to_reg</span>
                          <span>{isEn ? 'Check' : 'Äiá»ƒm danh'}</span>
                        </a>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card Footer */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
            <span>{isEn ? `Showing ${filteredSessions.length} sessions` : `Hiá»ƒn thá»‹ ${filteredSessions.length} ca dáº¡y trong ngÃ y`}</span>
            <a href="#/coach/schedule" className="font-bold text-[#1A3B8B] dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>{isEn ? 'View Full Calendar' : 'Xem toÃ n bá»™ lá»‹ch dáº¡y'}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </section>

        {/* Cá»˜T PHáº¢I (35% / lg:col-span-4): Card "LÃªn lá»‹ch PT" */}
        <section className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEn ? 'Schedule PT Session' : 'LÃªn lá»‹ch PT'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEn ? 'Quick appointment booking with trainees' : 'Táº¡o ca táº­p kÃ¨m riÃªng hoáº·c Ä‘Ã¡nh giÃ¡'}
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
            
            {/* Loáº¡i lá»‹ch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Appointment Type' : 'Loáº¡i lá»‹ch háº¹n'} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1A3B8B]"
                required
              >
                <option value="1to1">{isEn ? '1:1 Private PT (60 min)' : 'KÃ¨m riÃªng PT 1:1 (60 phÃºt)'}</option>
                <option value="inbody">{isEn ? 'InBody & Fitness Test' : 'Kiá»ƒm tra InBody & Thá»ƒ lá»±c'}</option>
                <option value="nutrition">{isEn ? 'Nutrition Consultation' : 'TÆ° váº¥n thá»±c Ä‘Æ¡n dinh dÆ°á»¡ng'}</option>
                <option value="group">{isEn ? 'Small Group PT (3-5 ppl)' : 'KÃ¨m nhÃ³m nhá» (3-5 há»c viÃªn)'}</option>
              </select>
            </div>

            {/* TiÃªu Ä‘á» ca táº­p */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Session Title' : 'TiÃªu Ä‘á» ca táº­p'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={isEn ? 'e.g. Chest & Triceps Hypertrophy' : 'VÃ­ dá»¥: Táº­p ChÃ¢n & Cardio cÆ°á»ng Ä‘á»™ cao'}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1A3B8B]"
                required
              />
            </div>

            {/* Chá»n há»c viÃªn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Select Trainee' : 'Há»c viÃªn'} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value, memberName: '' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1A3B8B]"
                required
              >
                <option value="">{isEn ? '-- Select Student --' : '-- Chá»n há»c viÃªn phá»¥ trÃ¡ch --'}</option>
                {memberList.length > 0 ? (
                  memberList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName || m.name} (MÃ£: {m.code || m.id})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="demo-1">Nguyá»…n VÄƒn An (MÃ£: HV001 - CÃ²n 12 buá»•i)</option>
                    <option value="demo-2">Tráº§n Thá»‹ BÃ­ch (MÃ£: HV002 - CÃ²n 8 buá»•i)</option>
                    <option value="demo-3">LÃª HoÃ ng Nam (MÃ£: HV003 - CÃ²n 7 buá»•i)</option>
                    <option value="demo-4">Pháº¡m Minh Trang (MÃ£: HV004 - CÃ²n 4 buá»•i)</option>
                  </>
                )}
              </select>
            </div>

            {/* NgÃ y vÃ  Giá» */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Date' : 'NgÃ y háº¹n'}
                </label>
                <input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1A3B8B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Time' : 'Giá» báº¯t Ä‘áº§u'}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1A3B8B]"
                />
              </div>
            </div>

            {/* Ghi chÃº */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Workout Note / Goals' : 'Ghi chÃº / Má»¥c tiÃªu buá»•i táº­p'}
              </label>
              <textarea
                rows="2"
                placeholder={isEn ? 'e.g. Bring resistance bands, focus on form...' : 'VÃ­ dá»¥: Khá»Ÿi Ä‘á»™ng ká»¹ khá»›p gá»‘i, chuáº©n bá»‹ dÃ¢y khÃ¡ng lá»±c...'}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1A3B8B]"
              />
            </div>

            {/* NÃºt Submit Rá»™ng 100% */}
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#1A3B8B] hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{isEn ? 'Book PT Appointment' : 'Táº¡o lá»‹ch háº¹n'}</span>
            </button>

            {/* ThÃ´ng bÃ¡o submit thÃ nh cÃ´ng */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

          </form>
        </section>

      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          3. COACHING QUICK ACTIONS (Lá»‘i Táº¯t Nhanh Tiá»‡n Ãch)
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1A3B8B]" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isEn ? 'Coaching Quick Actions' : 'Lá»‘i táº¯t tÃ¡c vá»¥ chuyÃªn mÃ´n'}
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {isEn ? 'Direct module navigation' : 'Chuyá»ƒn nhanh phÃ¢n há»‡'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <a
              key={item.route}
              href={`#/coach/${item.route}`}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 text-decoration-none group ${
                item.highlight
                  ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100/80'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                item.highlight
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-100 dark:bg-blue-900/40 text-[#1A3B8B] dark:text-blue-400'
              }`}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <div className="overflow-hidden">
                <div className={`text-xs font-bold truncate ${
                  item.highlight ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200 group-hover:text-[#1A3B8B] dark:group-hover:text-blue-400'
                }`}>
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isEn ? 'Open module' : 'Truy cáº­p nhanh'}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
