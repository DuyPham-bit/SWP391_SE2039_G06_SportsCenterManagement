import React, { useEffect, useMemo, useState } from 'react';
import { coachApi, coachProfessionalApi } from '../../services/api.js';
import { uploadMediaFileToCloud } from '../../services/cloudMediaStorage.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { CoachError } from './CoachShared.jsx';
import { PerformanceDashboard } from './PerformanceDashboard.jsx';
import { calendarWindow, currency, localDateKey, mergeCoachCalendar, tdeeEstimate } from './coachProfessionalView.js';

// Unified input and button styles in SCMS Olympic Arena design system
const inputClass = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-750 px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-[#81B29A] dark:focus:border-[#81B29A] focus:ring-2 focus:ring-[#81B29A]/20 dark:focus:ring-[#81B29A]/30 outline-none transition-all shadow-2xs';
const selectClass = `${inputClass} cursor-pointer`;
const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const buttonSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-2xs transition-all cursor-pointer disabled:opacity-50';

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

function FormField({ title, required = false, hint, children }) {
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
      <span className="flex items-center justify-between mb-1.5">
        <span>
          {title} {required && <span className="text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function formatDate(value, isEn = false) {
  return value ? new Date(value).toLocaleString(isEn ? 'en-US' : 'vi-VN') : '—';
}

function dateInput(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return localDateKey(d);
}

export function CoachProfessionalHub() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const getInitialTab = () => {
    const hash = window.location.hash || '';
    if (hash.includes('tab=facilities') || hash.includes('tab=equipment') || hash.includes('tab=resources')) return 'facilities';
    return 'performance';
  };

  const [tab, setTab] = useState(getInitialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const tabsConfig = [
    { id: 'performance', icon: 'monitoring', label: isEn ? 'Teaching Performance' : 'Thống kê hiệu suất' },
    { id: 'facilities', icon: 'inventory_2', label: isEn ? 'Resources & Facilities' : 'Tài nguyên & Thiết bị' }
  ];

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await coachProfessionalApi.getWorkspace();
      setData(result);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleHash = () => {
      const hash = window.location.hash || '';
      if (hash.includes('tab=facilities') || hash.includes('tab=equipment') || hash.includes('tab=resources')) {
        setTab('facilities');
      } else if (hash.includes('tab=performance') || hash.includes('tab=kpi')) {
        setTab('performance');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const act = async (fn, successMsg) => {
    setWorking(true);
    try {
      await fn();
      showSuccess(successMsg);
      await load();
      return true;
    } catch (e) {
      showError(e);
      return false;
    } finally {
      setWorking(false);
    }
  };

  if (loading && !data) {
    return <LoadingSpinner text={isEn ? 'Opening professional coach workspace...' : 'Đang mở không gian làm việc chuyên môn HLV...'} />;
  }

  const coachName = data?.profile?.fullName || (isEn ? 'Coach' : 'Huấn luyện viên');
  const kpiData = data?.kpi || {};

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Banner in SCMS Olympic Arena Theme */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E2235] via-[#2B2D42] to-[#3D405B] text-white p-5 sm:p-7 shadow-md border border-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-[#F2CC8F]/15 blur-3xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#F2CC8F] text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-white/20 shadow-2xs">
              <span className="material-symbols-outlined text-[15px]">workspace_premium</span>
              {isEn ? 'Coach Professional Workspace' : 'Phân hệ chuyên môn HLV cao cấp'}
            </span>

            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-2xs"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh Data' : 'Làm mới dữ liệu'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            {isEn ? `Command Hub · Coach ${coachName}` : `Trung tâm điều hành chuyên môn HLV ${coachName}`}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            {isEn
              ? 'Consolidated operational workspace: schedule management, student profiles, workout syllabus, nutrition plans, secure messaging, transparent KPI income, and facility assets.'
              : 'Quản lý toàn diện trên một luồng dữ liệu chuẩn hóa: Lịch dạy, hồ sơ học viên, giáo án & dinh dưỡng, tương tác bảo mật, thu nhập KPI minh bạch và tài nguyên sân bãi.'}
          </p>

          {/* Quick Stats Grid inside Hero Header */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#F2CC8F]/90 block">
                {isEn ? 'Active Students' : 'Học viên phụ trách'}
              </span>
              <span className="text-lg font-black text-white">
                {data?.clients?.length || 0}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#F2CC8F]/90 block">
                {isEn ? 'Monthly Sessions' : 'Buổi dạy tháng'}
              </span>
              <span className="text-lg font-black text-white">
                {kpiData.completedSessions || 0}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#F2CC8F]/90 block">
                {isEn ? 'Average Rating' : 'Đánh giá TB'}
              </span>
              <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                ★ {kpiData.averageRating || '5.0'}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-[#81B29A] block">
                {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-300 truncate block">
                {kpiData.attendanceRate ?? 95}%
              </span>
            </div>
          </div>
        </div>
      </header>

      <CoachError message={error} retry={load} />

      {/* 2. Modern Clean Tab Navigation */}
      <nav
        aria-label="Phân hệ chuyên môn"
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-1.5 shadow-2xs"
      >
        {tabsConfig.map(({ id, icon, label }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E2235] text-[#F2CC8F] shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[19px]">{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* 3. Tab Contents */}
      {data && tab === 'schedule' && <ScheduleTab data={data} act={act} working={working} isEn={isEn} />}
      {data && tab === 'clients' && <ClientsTab data={data} act={act} working={working} isEn={isEn} />}
      {data && tab === 'programs' && <ProgramsTab data={data} act={act} working={working} isEn={isEn} />}
      {data && tab === 'communication' && <CommunicationTab data={data} act={act} working={working} isEn={isEn} />}
      {data && tab === 'performance' && <PerformanceTab data={data} isEn={isEn} />}
      {data && tab === 'facilities' && <FacilitiesTab data={data} act={act} working={working} isEn={isEn} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 1: SCHEDULE & LEAVES (LỊCH & NGHỈ PHÉP)
// ─────────────────────────────────────────────────────────────
function ScheduleTab({ data, act, working, isEn }) {
  const [mode, setMode] = useState('week');
  const [anchor, setAnchor] = useState(dateInput());
  const [leaveType, setLeaveType] = useState('AnnualLeave');

  const all = useMemo(() => mergeCoachCalendar(data.events, data.classSessions), [data]);
  const range = calendarWindow(anchor, mode);
  const visible = all.filter(x => x.date >= range.from && x.date <= range.to);
  const grouped = Object.groupBy ? Object.groupBy(visible, x => x.date) : visible.reduce((a, x) => ((a[x.date] ||= []).push(x), a), {});

  const submitEvent = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.createEvent({
          memberId: f.get('memberId') ? Number(f.get('memberId')) : null,
          roomId: f.get('roomId') ? Number(f.get('roomId')) : null,
          title: f.get('title'),
          eventType: f.get('eventType'),
          startAt: f.get('startAt'),
          endAt: f.get('endAt'),
          notes: f.get('notes') || null
        }),
      isEn ? 'Event scheduled successfully.' : 'Đã tạo lịch và gửi xác nhận thành công.'
    ).then((ok) => ok && e.target.reset());
  };

  const submitLeave = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.requestLeave({
          startAt: f.get('startAt'),
          endAt: f.get('endAt'),
          leaveType: f.get('leaveType'),
          reason: f.get('reason'),
          swapCoachId: f.get('swapCoachId') ? Number(f.get('swapCoachId')) : null
        }),
      isEn ? 'Leave request submitted to management.' : 'Đã gửi đơn nghỉ đến bộ phận quản lý.'
    ).then((ok) => ok && e.target.reset());
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_.9fr]">
      {/* Left: Interactive Calendar Timeline & Leaves */}
      <div className="space-y-5">
        <SectionCard
          title={isEn ? 'Teaching & Training Schedule' : 'Lịch ca giảng dạy & tập luyện'}
          icon="event"
          action={
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
              {['day', 'week', 'month'].map(x => (
                <button
                  key={x}
                  onClick={() => setMode(x)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    mode === x
                      ? 'bg-white dark:bg-slate-800 text-[#2D6A4F] dark:text-[#81B29A] shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {x === 'day' ? (isEn ? 'Day' : 'Ngày') : x === 'week' ? (isEn ? 'Week' : 'Tuần') : (isEn ? 'Month' : 'Tháng')}
                </button>
              ))}
            </div>
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Select Date:' : 'Chọn mốc thời gian:'}
            </span>
            <input
              type="date"
              value={anchor}
              onChange={e => setAnchor(e.target.value)}
              className={`${inputClass} max-w-48`}
            />
          </div>

          {!visible.length ? (
            <EmptyState icon="event_busy">
              {isEn ? 'No scheduled sessions in this time window.' : 'Không có ca làm việc hoặc buổi dạy nào trong khoảng này.'}
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(grouped).map(([date, items]) => (
                <article key={date} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-750/40 p-3.5 space-y-2.5">
                  <h3 className="text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] uppercase tracking-wider pb-1 border-b border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                    <span>
                      {new Date(`${date}T00:00:00`).toLocaleDateString(isEn ? 'en-US' : 'vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] font-bold">
                      {items.length} {isEn ? 'events' : 'ca'}
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div
                        key={`${item.eventType}-${item.id}-${i}`}
                        className="rounded-xl bg-white dark:bg-slate-800 p-3 text-xs border border-slate-200 dark:border-slate-700 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] text-[11px] font-bold mr-1.5">
                              {item.startLabel}
                            </span>
                            {item.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {item.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-2">
                          <span>{item.eventType}</span>
                          <span>•</span>
                          <span>{item.roomName || (isEn ? 'Court/Room not set' : 'Chưa gán sân')}</span>
                          {item.memberName && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {item.memberName}
                              </span>
                            </>
                          )}
                        </p>

                        {item.eventType !== 'ClassSession' && item.status === 'Confirmed' && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                            <button
                              disabled={working}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                              onClick={() => act(() => coachProfessionalApi.changeEvent(item.id, 'Completed'), isEn ? 'Session marked as completed.' : 'Đã hoàn thành ca dạy.')}
                            >
                              {isEn ? '✓ Complete' : '✓ Hoàn thành'}
                            </button>
                            <button
                              disabled={working}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                              onClick={() => act(() => coachProfessionalApi.changeEvent(item.id, 'Cancelled'), isEn ? 'Session cancelled.' : 'Đã hủy ca dạy.')}
                            >
                              {isEn ? '✕ Cancel' : '✕ Hủy ca'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Đơn nghỉ & đổi ca */}
        <SectionCard title={isEn ? 'Leave & Shift Swap Applications' : 'Đơn nghỉ phép & đổi ca trực'} icon="swap_horiz">
          {!data.leaves.length ? (
            <EmptyState icon="assignment_turned_in" isEn={isEn}>
              {isEn ? 'No leave or shift swap requests.' : 'Chưa có đơn xin nghỉ hoặc đổi ca nào.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {data.leaves.slice(0, 6).map(x => (
                <div key={x.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/50 p-3 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {x.leaveType === 'AnnualLeave' ? (isEn ? 'Annual Leave' : 'Nghỉ phép thường') : x.leaveType === 'SickLeave' ? (isEn ? 'Sick Leave' : 'Nghỉ ốm') : (isEn ? 'Shift Swap' : 'Đổi ca trực')}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        x.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : x.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {x.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatDate(x.startAt, isEn)} → {formatDate(x.endAt, isEn)}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">{x.reason}</p>
                    {x.managerNote && (
                      <p className="mt-1 text-[11px] text-[#2D6A4F] dark:text-[#81B29A] font-medium">
                        {isEn ? 'Manager Note: ' : 'Phản hồi quản lý: '}{x.managerNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Right Column: Actions (Book PT Session & Submit Leave Form) */}
      <div className="space-y-5">
        <SectionCard title={isEn ? 'Schedule Student PT Session' : 'Chủ động lên lịch buổi tập PT'} icon="add_circle">
          <form onSubmit={submitEvent} className="space-y-3">
            <FormField title={isEn ? 'Event Type' : 'Phân loại lịch'} required>
              <select name="eventType" className={selectClass}>
                <option value="PersonalTraining">{isEn ? '1-on-1 Personal Training (PT)' : 'PT cá nhân (1-on-1)'}</option>
                <option value="FloorDuty">{isEn ? 'Floor Duty / Guidance' : 'Trực sàn / Hướng dẫn chung'}</option>
                <option value="Other">{isEn ? 'Other Professional Duty' : 'Công việc chuyên môn khác'}</option>
              </select>
            </FormField>

            <FormField title={isEn ? 'Title' : 'Tiêu đề buổi tập'} required>
              <input name="title" required maxLength="200" placeholder={isEn ? 'E.g., Cardio & Strength Session' : 'VD: Buổi tập Cardio & Thể lực'} className={inputClass} />
            </FormField>

            <FormField title={isEn ? 'Client / Student' : 'Học viên (bắt buộc với PT)'}>
              <select name="memberId" className={selectClass}>
                <option value="">{isEn ? '-- Select Student --' : '-- Chọn học viên --'}</option>
                {data.clients.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName} ({x.memberCode})</option>
                ))}
              </select>
            </FormField>

            <FormField title={isEn ? 'Room / Court' : 'Sân / Phòng tập'}>
              <select name="roomId" className={selectClass}>
                <option value="">{isEn ? '-- Auto-assign / Flexible --' : '-- Tự chọn / Theo phân bổ --'}</option>
                {data.rooms?.map(x => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField title={isEn ? 'Start' : 'Bắt đầu'} required>
                <input name="startAt" type="datetime-local" required className={inputClass} />
              </FormField>
              <FormField title={isEn ? 'End' : 'Kết thúc'} required>
                <input name="endAt" type="datetime-local" required className={inputClass} />
              </FormField>
            </div>

            <FormField title={isEn ? 'Notes' : 'Ghi chú giáo án'}>
              <textarea name="notes" rows="2" placeholder={isEn ? 'Important notes for student...' : 'Nội dung cần lưu ý cho học viên...'} className={inputClass} />
            </FormField>

            <button disabled={working} className={`${buttonPrimary} w-full`}>
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{isEn ? 'Schedule & Send Confirmation' : 'Tạo lịch & Gửi xác nhận'}</span>
            </button>
          </form>
        </SectionCard>

        <SectionCard title={isEn ? 'Submit Leave / Shift Swap' : 'Nộp đơn xin nghỉ / Đổi ca trực'} icon="edit_calendar">
          <form onSubmit={submitLeave} className="space-y-3">
            <FormField title={isEn ? 'Application Type' : 'Loại đơn'} required>
              <select name="leaveType" value={leaveType} onChange={e => setLeaveType(e.target.value)} className={selectClass}>
                <option value="AnnualLeave">{isEn ? 'Annual Leave' : 'Nghỉ phép thường (Annual Leave)'}</option>
                <option value="SickLeave">{isEn ? 'Sick Leave' : 'Nghỉ ốm (Sick Leave)'}</option>
                <option value="ShiftSwap">{isEn ? 'Shift Swap with Peer Coach' : 'Đổi ca trực với HLV khác (Shift Swap)'}</option>
              </select>
            </FormField>

            <FormField
              title={leaveType === 'ShiftSwap' ? (isEn ? 'Replacement Coach' : 'HLV nhận đổi ca') : (isEn ? 'Replacement Coach (N/A)' : 'HLV nhận đổi ca (Không áp dụng)')}
              required={leaveType === 'ShiftSwap'}
            >
              <select name="swapCoachId" required={leaveType === 'ShiftSwap'} disabled={leaveType !== 'ShiftSwap'} className={selectClass}>
                <option value="">{isEn ? '-- Select Peer Coach --' : '-- Chọn HLV tiếp nhận --'}</option>
                {data.peerCoaches?.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName} · {x.specialization || (isEn ? 'Coach' : 'HLV')}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField title={isEn ? 'From' : 'Từ thời điểm'} required>
                <input name="startAt" type="datetime-local" required className={inputClass} />
              </FormField>
              <FormField title={isEn ? 'To' : 'Đến thời điểm'} required>
                <input name="endAt" type="datetime-local" required className={inputClass} />
              </FormField>
            </div>

            <FormField title={isEn ? 'Reason' : 'Lý do chi tiết'} required>
              <textarea name="reason" required rows="2" placeholder={isEn ? 'Specify reason for leave or shift swap...' : 'Ghi rõ lý do xin nghỉ hoặc đổi ca...'} className={inputClass} />
            </FormField>

            <button disabled={working} className={`${buttonPrimary} w-full`}>
              <span className="material-symbols-outlined text-[18px]">rule</span>
              <span>{isEn ? 'Submit to Manager' : 'Gửi quản lý duyệt đơn'}</span>
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 2: CLIENTS & HEALTH (HỌC VIÊN PHỤ TRÁCH)
// ─────────────────────────────────────────────────────────────
function ClientsTab({ data, act, working, isEn }) {
  const [selectedId, setSelectedId] = useState(data.clients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = data.clients.filter(x =>
    (x.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (x.memberCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const client = data.clients.find(x => Number(x.id) === Number(selectedId));

  const submitHealth = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveHealthRecord({
          memberId: Number(selectedId),
          recordType: f.get('recordType'),
          title: f.get('title'),
          details: f.get('details'),
          occurredOn: f.get('occurredOn')
        }),
      isEn ? 'Health note saved.' : 'Đã lưu ghi chú sức khỏe học viên.'
    ).then((ok) => ok && e.target.reset());
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.75fr_1.4fr]">
      {/* Client List */}
      <SectionCard
        title={`${isEn ? 'Enrolled Students' : 'Danh sách học viên'} (${data.clients.length})`}
        icon="groups"
      >
        <div className="mb-3">
          <input
            type="text"
            placeholder={isEn ? 'Search student name or code...' : 'Tìm kiếm theo tên hoặc mã HV...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredClients.map(x => {
            const isSelected = Number(selectedId) === Number(x.id);
            return (
              <button
                key={x.id}
                onClick={() => setSelectedId(x.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#81B29A] dark:border-[#81B29A] bg-[#81B29A]/10 dark:bg-[#81B29A]/20 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {x.fullName}
                  </span>
                  {x.renewal?.alert && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                      {isEn ? 'NEEDS RENEWAL' : 'CẦN GIA HẠN'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {isEn ? 'Code:' : 'Mã:'} <span className="font-mono font-semibold">{x.memberCode}</span> · {x.fitnessGoal || (isEn ? 'Goal not set' : 'Chưa đặt mục tiêu')}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Selected Client Detailed Profile */}
      {!client ? (
        <EmptyState icon="person_off" isEn={isEn}>
          {isEn ? 'Select a student to view physical metrics and health profile.' : 'Vui lòng chọn học viên để xem hồ sơ thể lực.'}
        </EmptyState>
      ) : (
        <div className="space-y-5">
          <SectionCard title={`${isEn ? 'Student Profile' : 'Hồ sơ học viên'} · ${client.fullName}`} icon="badge">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                [isEn ? 'Fitness Goal' : 'Mục tiêu', client.fitnessGoal],
                [isEn ? 'Level' : 'Trình độ', client.fitnessLevel],
                [isEn ? 'Height' : 'Chiều cao', client.heightCm ? `${client.heightCm} cm` : null],
                [isEn ? 'Weight' : 'Cân nặng', client.weightKg ? `${client.weightKg} kg` : null]
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{k}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                    {v || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Medical alert box */}
            <div className="mt-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">warning</span>
              <div>
                <strong className="block font-bold">{isEn ? 'Medical History / Notes:' : 'Tiền sử / Lưu ý y khoa:'}</strong>
                <p className="mt-0.5 leading-relaxed">{client.medicalNote || (isEn ? 'No known medical conditions recorded.' : 'Chưa ghi nhận tiền sử bệnh lý đặc biệt.')}</p>
              </div>
            </div>

            {/* Renewal status */}
            {client.renewal && (
              <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
                client.renewal.alert
                  ? 'border-rose-200 bg-rose-50/70 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-800'
                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800'
              }`}>
                <div>
                  <strong>{client.renewal.packageName}</strong> · {isEn ? 'Expires: ' : 'Hết hạn: '}{client.renewal.endDate || '—'}
                </div>
                <span className="font-bold">
                  {isEn
                    ? `${client.renewal.remainingSessions ?? '∞'} sessions / ${client.renewal.daysRemaining ?? '—'} days left`
                    : `Còn ${client.renewal.remainingSessions ?? '∞'} buổi / ${client.renewal.daysRemaining ?? '—'} ngày`}
                </span>
              </div>
            )}
          </SectionCard>

          {/* InBody Body Metrics Chart */}
          <SectionCard title={isEn ? 'InBody & Physical Measurements' : 'Chỉ số đo lường cơ thể (InBody)'} icon="bar_chart">
            {!client.bodyMetrics?.length ? (
              <EmptyState icon="query_stats" isEn={isEn}>
                {isEn ? 'No InBody test history recorded yet.' : 'Chưa có dữ liệu đo chỉ số cơ thể định kỳ.'}
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex min-w-[500px] items-end gap-3 border-b border-l border-slate-200 dark:border-slate-700 p-4" style={{ height: 210 }}>
                  {[...client.bodyMetrics].reverse().map(x => (
                    <div key={x.id} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {x.weight}kg
                      </span>
                      <div
                        title={isEn ? `Fat: ${x.bodyFatPercentage || '—'}% · Muscle: ${x.muscleMass || '—'}kg` : `Mỡ: ${x.bodyFatPercentage || '—'}% · Cơ: ${x.muscleMass || '—'}kg`}
                        className="w-full max-w-9 rounded-t bg-gradient-to-t from-[#1E2235] to-[#81B29A] dark:from-[#2B2D42] dark:to-[#81B29A] shadow-2xs transition-all hover:opacity-90"
                        style={{ height: `${Math.max(16, Math.min(140, Number(x.weight || 0) * 1.6))}px` }}
                      />
                      <span className="text-[9px] text-slate-400 mt-1">{x.resultDate?.slice(5)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  {isEn
                    ? 'Bars show body weight (kg). Hover to view body fat % and muscle mass.'
                    : 'Cột thể hiện cân nặng (kg). Rê chuột để xem tỷ lệ mỡ và khối lượng cơ bắp.'}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Health Records and Add Record */}
          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title={isEn ? 'Injury & Condition History' : 'Hồ sơ bệnh lý / Chấn thương'} icon="history">
              {!client.healthRecords?.length ? (
                <EmptyState icon="health_and_safety" isEn={isEn}>
                  {isEn ? 'No injury records recorded.' : 'Chưa có ghi chép chấn thương.'}
                </EmptyState>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {client.healthRecords.map(x => (
                    <div key={x.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700 text-xs">
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                        <span>{x.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A]">
                          {x.recordType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{x.occurredOn}</span>
                      <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{x.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title={isEn ? 'Add Health Note' : 'Ghi nhận lưu ý sức khỏe'} icon="post_add">
              <form onSubmit={submitHealth} className="space-y-3">
                <FormField title={isEn ? 'Record Type' : 'Phân loại'} required>
                  <select name="recordType" className={selectClass}>
                    <option value="MedicalCondition">{isEn ? 'Medical Condition' : 'Bệnh lý nền (Medical Condition)'}</option>
                    <option value="Injury">{isEn ? 'Sports Injury' : 'Chấn thương thể thao (Injury)'}</option>
                    <option value="CoachObservation">{isEn ? 'Coach Observation' : 'Quan sát thể lực của HLV'}</option>
                  </select>
                </FormField>

                <FormField title={isEn ? 'Summary Title' : 'Tiêu đề tóm tắt'} required>
                  <input name="title" required placeholder={isEn ? 'E.g., Mild calf strain' : 'VD: Căng cơ bắp chuối nhẹ'} className={inputClass} />
                </FormField>

                <FormField title={isEn ? 'Recorded Date' : 'Ngày ghi nhận'} required>
                  <input name="occurredOn" type="date" max={dateInput()} defaultValue={dateInput()} required className={inputClass} />
                </FormField>

                <FormField title={isEn ? 'Detailed Description' : 'Mô tả chi tiết'} required>
                  <textarea name="details" required rows="3" placeholder={isEn ? 'Specify symptoms, condition, exercises to avoid...' : 'Ghi rõ tình trạng, biểu hiện, bài tập cần tránh...'} className={inputClass} />
                </FormField>

                <button disabled={working} className={`${buttonPrimary} w-full`}>
                  <span>{isEn ? 'Save Health Record' : 'Lưu ghi chú sức khỏe'}</span>
                </button>
              </form>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 3: PROGRAMS & NUTRITION (GIÁO ÁN & DINH DƯỠNG)
// ─────────────────────────────────────────────────────────────
function ProgramsTab({ data, act, working, isEn }) {
  const [media, setMedia] = useState({ imageUrl: '', videoUrl: '' });
  const [uploading, setUploading] = useState(false);
  const [nutritionMember, setNutritionMember] = useState(data.clients[0]?.id || '');
  const [planMember, setPlanMember] = useState(data.clients[0]?.id || '');
  const [planClass, setPlanClass] = useState('');
  const [coachClasses, setCoachClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [planExercises, setPlanExercises] = useState([]);

  const selectedClient = data.clients.find(x => Number(x.id) === Number(nutritionMember));
  const age = selectedClient?.dateOfBirth ? Math.floor((Date.now() - new Date(selectedClient.dateOfBirth).getTime()) / 31557600000) : 28;
  const tdee = tdeeEstimate({ gender: selectedClient?.gender, weightKg: selectedClient?.weightKg, heightCm: selectedClient?.heightCm, age, activity: 1.55 });

  const availableClasses = coachClasses.filter(cls =>
    cls.members?.some(member => Number(member.memberId ?? member.id) === Number(planMember))
  );
  const memberPlans = plans.filter(plan => Number(plan.memberId) === Number(planMember));
  const weekdays = [
    ['Monday', isEn ? 'Monday' : 'Thứ 2'],
    ['Tuesday', isEn ? 'Tuesday' : 'Thứ 3'],
    ['Wednesday', isEn ? 'Wednesday' : 'Thứ 4'],
    ['Thursday', isEn ? 'Thursday' : 'Thứ 5'],
    ['Friday', isEn ? 'Friday' : 'Thứ 6'],
    ['Saturday', isEn ? 'Saturday' : 'Thứ 7'],
    ['Sunday', isEn ? 'Sunday' : 'Chủ nhật']
  ];

  useEffect(() => {
    Promise.all([coachApi.getCoachClassesAndMembers(), coachApi.getTrainingPlans()])
      .then(([classes, currentPlans]) => {
        setCoachClasses(classes);
        setPlans(currentPlans);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!availableClasses.some(x => Number(x.id) === Number(planClass))) {
      setPlanClass(availableClasses[0]?.id || '');
    }
  }, [planMember, coachClasses]);

  const upload = async (file, field) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadMediaFileToCloud(file);
      setMedia(x => ({ ...x, [field]: result.url }));
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const submitExercise = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveExercise({
          sportId: null,
          name: f.get('name'),
          description: f.get('description') || null,
          muscleGroup: f.get('muscleGroup') || null,
          difficultyLevel: f.get('difficultyLevel'),
          instructions: f.get('instructions') || null,
          imageUrl: media.imageUrl || null,
          videoUrl: media.videoUrl || null
        }),
      isEn ? 'Exercise added to library.' : 'Đã thêm bài tập vào thư viện chuẩn.'
    ).then((ok) => {
      if (ok) {
        e.target.reset();
        setMedia({ imageUrl: '', videoUrl: '' });
      }
    });
  };

  const submitHomework = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveHomework({
          classId: null,
          memberId: Number(f.get('memberId')),
          title: f.get('title'),
          description: f.get('description'),
          dueDate: f.get('dueDate') || null
        }),
      isEn ? 'Homework assigned and push notification sent.' : 'Đã giao bài tập về nhà và kích hoạt thông báo Push.'
    ).then((ok) => ok && e.target.reset());
  };

  const submitNutrition = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveNutrition({
          memberId: Number(f.get('memberId')),
          title: f.get('title'),
          startDate: f.get('startDate'),
          endDate: f.get('endDate') || null,
          dailyCalories: Number(f.get('dailyCalories')),
          proteinGrams: Number(f.get('proteinGrams')),
          carbGrams: Number(f.get('carbGrams')),
          fatGrams: Number(f.get('fatGrams')),
          mealPlanJson: JSON.stringify({ menu: f.get('menu') }),
          notes: f.get('notes') || null
        }),
      isEn ? 'Nutrition plan assigned to student.' : 'Đã thiết lập và giao kế hoạch dinh dưỡng cho học viên.'
    ).then((ok) => ok && e.target.reset());
  };

  const addExerciseToPlan = (item) => {
    setPlanExercises(current => [
      ...current,
      {
        key: `${item.id}-${Date.now()}-${current.length}`,
        name: item.name,
        sets: '3',
        reps: '10',
        note: '',
        weekNumber: 1,
        dayOfWeek: 'Monday'
      }
    ]);
  };

  const savePlan = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!planClass || !planExercises.length) return;

    const ok = await act(
      () =>
        coachApi.savePersonalTrainingPlan({
          classId: Number(planClass),
          memberId: Number(planMember),
          title: form.get('title'),
          goal: form.get('goal'),
          startDate: form.get('startDate'),
          endDate: form.get('endDate') || null,
          fitnessCondition: form.get('fitnessCondition') || null,
          exercises: planExercises
        }),
      isEn ? 'Personalized workout plan saved.' : 'Đã lưu giáo án tập luyện cá nhân hóa theo tuần/tháng.'
    );

    if (ok) {
      setPlans(await coachApi.getTrainingPlans());
      setPlanExercises([]);
      formElement.reset();
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Add Exercise and Homework */}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title={isEn ? 'Exercise Library Management' : 'Đóng góp bài tập vào thư viện'} icon="fitness_center">
          <form onSubmit={submitExercise} className="grid gap-3 sm:grid-cols-2">
            <FormField title={isEn ? 'Exercise Name' : 'Tên bài tập'} required>
              <input name="name" required placeholder={isEn ? 'E.g., Barbell Squat' : 'VD: Barbell Squat'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Target Muscle Group' : 'Nhóm cơ mục tiêu'}>
              <input name="muscleGroup" placeholder={isEn ? 'E.g., Quads & Glutes' : 'VD: Cơ đùi trước & Mông'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Difficulty Level' : 'Độ khó'}>
              <select name="difficultyLevel" className={selectClass}>
                <option value="Beginner">{isEn ? 'Beginner' : 'Beginner (Cơ bản)'}</option>
                <option value="Intermediate">{isEn ? 'Intermediate' : 'Intermediate (Trung cấp)'}</option>
                <option value="Advanced">{isEn ? 'Advanced' : 'Advanced (Nâng cao)'}</option>
              </select>
            </FormField>
            <FormField title={isEn ? 'Technique Description' : 'Mô tả kỹ thuật'}>
              <input name="description" placeholder={isEn ? 'E.g., Keep spine neutral, lower hips parallel' : 'VD: Giữ lưng thẳng, hạ hông song song'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Demonstration Image' : 'Hình ảnh minh họa'}>
              <input
                type="file"
                accept="image/*"
                onChange={e => upload(e.target.files?.[0], 'imageUrl')}
                className={inputClass}
              />
            </FormField>
            <FormField title={isEn ? 'Instructional Video' : 'Video hướng dẫn'}>
              <input
                type="file"
                accept="video/*"
                onChange={e => upload(e.target.files?.[0], 'videoUrl')}
                className={inputClass}
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField title={isEn ? 'Step-by-step Instructions' : 'Hướng dẫn từng bước (Step-by-step)'}>
                <textarea name="instructions" rows="2" placeholder={isEn ? 'Step 1: Stance setup... Step 2: Hinge at hips...' : 'Bước 1: Chuẩn bị... Bước 2: Hạ trọng tâm...'} className={inputClass} />
              </FormField>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button disabled={working || uploading} className={buttonPrimary}>
                <span>{uploading ? (isEn ? 'Uploading media...' : 'Đang tải media...') : (isEn ? 'Save Exercise to Library' : 'Lưu bài tập vào thư viện')}</span>
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title={isEn ? 'Assign Homework' : 'Giao bài tập tự rèn luyện về nhà'} icon="task_alt">
          <form onSubmit={submitHomework} className="space-y-3">
            <FormField title={isEn ? 'Student' : 'Học viên nhận bài'} required>
              <select name="memberId" required className={selectClass}>
                {data.clients.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Assignment Title' : 'Tiêu đề bài tập'} required>
              <input name="title" required placeholder={isEn ? 'E.g., 30-min Home Cardio & Mobility' : 'VD: 30 phút Cardio & Giãn cơ tại nhà'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Detailed Workout Instructions' : 'Nội dung bài tập chi tiết'} required>
              <textarea name="description" required rows="3" placeholder={isEn ? 'E.g., 3km light jog, hamstring and hip flexor stretches...' : 'Chạy bộ 3km tốc độ nhẹ, kéo giãn cơ hông và đùi sau...'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Check-in Deadline' : 'Hạn chót check-in'}>
              <input name="dueDate" type="datetime-local" className={inputClass} />
            </FormField>
            <button disabled={working} className={`${buttonPrimary} w-full`}>
              <span>{isEn ? 'Assign Homework & Send Push' : 'Giao bài tập & Gửi thông báo Push'}</span>
            </button>
          </form>
        </SectionCard>
      </div>

      {/* 2. Structured Workout Builder */}
      <SectionCard title={isEn ? 'Personalized Workout Builder' : 'Xây dựng giáo án cá nhân hóa theo tuần / tháng'} icon="tune">
        <form onSubmit={savePlan} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField title={isEn ? 'Target Student' : 'Học viên áp dụng'}>
              <select value={planMember} onChange={e => setPlanMember(e.target.value)} className={selectClass}>
                {data.clients.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Class / Package' : 'Lớp / Gói áp dụng'} required>
              <select value={planClass} onChange={e => setPlanClass(e.target.value)} required className={selectClass}>
                <option value="">{isEn ? '-- Select Class --' : '-- Chọn lớp --'}</option>
                {availableClasses.map(x => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Plan Title' : 'Tên giáo án'} required>
              <input name="title" required placeholder={isEn ? 'E.g., 4-Week Hypertrophy & Fat Loss' : 'VD: Tăng cơ giảm mỡ chu kỳ 4 tuần'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Plan Goal' : 'Mục tiêu giáo án'} required>
              <input name="goal" required placeholder={isEn ? 'E.g., Drop 2kg fat, build endurance' : 'VD: Giảm 2kg mỡ, tăng sức bền'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Start Date' : 'Ngày bắt đầu'} required>
              <input name="startDate" type="date" defaultValue={dateInput()} required className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'End Date' : 'Ngày kết thúc'}>
              <input name="endDate" type="date" defaultValue={dateInput(28)} className={inputClass} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField title={isEn ? 'Current Physical Condition' : 'Tình trạng thể lực hiện tại'}>
                <input name="fitnessCondition" placeholder={isEn ? 'E.g., Knee joint precaution, avoid high impacts' : 'VD: Khớp gối cần hạn chế bật nhảy cao'} className={inputClass} />
              </FormField>
            </div>
          </div>

          {/* Exercise Selection Grid */}
          <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr] pt-2 border-t border-slate-100 dark:border-slate-700">
            {/* Library list */}
            <div>
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">
                {isEn ? `Select from Library (${data.exercises.length})` : `Chọn bài tập từ thư viện (${data.exercises.length})`}
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {data.exercises.map(x => (
                  <div key={x.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 flex items-center justify-between text-xs">
                    <div>
                      <strong className="block text-slate-900 dark:text-white">{x.name}</strong>
                      <span className="text-[11px] text-slate-500">{x.muscleGroup || (isEn ? 'Full Body' : 'Toàn thân')} · {x.difficultyLevel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => addExerciseToPlan(x)}
                      className="px-2.5 py-1 rounded-lg bg-[#1E2235] text-[#F2CC8F] hover:bg-[#2B2D42] font-bold text-xs cursor-pointer"
                    >
                      {isEn ? '+ Add' : '+ Thêm'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Added exercises list */}
            <div className="p-3.5 rounded-2xl border-2 border-dashed border-[#81B29A]/30 dark:border-[#81B29A]/30 bg-[#81B29A]/5 dark:bg-[#81B29A]/10 min-h-64">
              <p className="text-xs font-bold uppercase text-[#2D6A4F] dark:text-[#81B29A] mb-3">
                {isEn ? `Curated Exercise Schedule (${planExercises.length} items)` : `Lộ trình bài tập đã thêm (${planExercises.length} bài)`}
              </p>
              {!planExercises.length ? (
                <EmptyState icon="add_task" isEn={isEn}>{isEn ? "Click '+ Add' from the library on the left to build the syllabus." : "Nhấp '+ Thêm' từ thư viện bên trái để xây dựng bài tập vào lộ trình."}</EmptyState>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {planExercises.map((item, index) => (
                    <div key={item.key} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          #{index + 1}. {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPlanExercises(c => c.filter((_, i) => i !== index))}
                          className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                        >
                          {isEn ? '✕ Remove' : '✕ Xóa'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <select
                          value={item.weekNumber}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, weekNumber: Number(e.target.value) } : it))}
                          className={selectClass}
                        >
                          {Array.from({ length: 8 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{isEn ? `Week ${i + 1}` : `Tuần ${i + 1}`}</option>
                          ))}
                        </select>
                        <select
                          value={item.dayOfWeek}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, dayOfWeek: e.target.value } : it))}
                          className={selectClass}
                        >
                          {weekdays.map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                        <input
                          value={item.sets}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, sets: e.target.value } : it))}
                          placeholder={isEn ? 'Sets' : 'Số hiệp'}
                          className={inputClass}
                        />
                        <input
                          value={item.reps}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, reps: e.target.value } : it))}
                          placeholder={isEn ? 'Reps' : 'Số lần / Reps'}
                          className={inputClass}
                        />
                        <input
                          value={item.note}
                          onChange={e => setPlanExercises(c => c.map((it, i) => i === index ? { ...it, note: e.target.value } : it))}
                          placeholder={isEn ? 'RPE / Rest' : 'RPE / Nghỉ'}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 flex justify-end">
                <button
                  disabled={working || !planClass || !planExercises.length}
                  className={buttonPrimary}
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isEn ? 'Save & Issue Workout Plan' : 'Lưu & Ban hành giáo án'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </SectionCard>

      {/* 3. Nutrition Planning with TDEE Calculator */}
      <SectionCard
        title={isEn ? `Nutrition Planning · Suggested TDEE: ${tdee ? `${tdee} kcal/day` : 'insufficient metrics'}` : `Thiết kế dinh dưỡng · TDEE gợi ý: ${tdee ? `${tdee} kcal/ngày` : 'chưa đủ chỉ số'}`}
        icon="nutrition"
      >
        <form onSubmit={submitNutrition} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField title={isEn ? 'Target Student' : 'Học viên áp dụng'}>
            <select name="memberId" value={nutritionMember} onChange={e => setNutritionMember(e.target.value)} className={selectClass}>
              {data.clients.map(x => (
                <option key={x.id} value={x.id}>{x.fullName}</option>
              ))}
            </select>
          </FormField>
          <FormField title={isEn ? 'Meal Plan Title' : 'Tên thực đơn'} required>
            <input name="title" required placeholder={isEn ? 'E.g., Eat Clean 1800kcal Protocol' : 'VD: Thực đơn Eat Clean 1800kcal'} className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Start Date' : 'Từ ngày'} required>
            <input name="startDate" type="date" defaultValue={dateInput()} required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'End Date' : 'Đến ngày'}>
            <input name="endDate" type="date" className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Target Calories (kcal)' : 'Calories mục tiêu (kcal)'} required>
            <input name="dailyCalories" type="number" min="800" defaultValue={tdee || 2000} required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Protein (g)' : 'Protein (g)'} required>
            <input name="proteinGrams" type="number" min="0" defaultValue="140" required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Carbs (g)' : 'Carbs (g)'} required>
            <input name="carbGrams" type="number" min="0" defaultValue="220" required className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Fat (g)' : 'Fat (g)'} required>
            <input name="fatGrams" type="number" min="0" defaultValue="60" required className={inputClass} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField title={isEn ? 'Daily Menu Details (Breakfast - Lunch - Dinner)' : 'Thực đơn chi tiết (Sáng - Trưa - Tối)'}>
              <textarea name="menu" rows="3" placeholder={isEn ? 'Breakfast: Oatmeal + Eggs... Lunch: Chicken breast + Sweet potato... Dinner: Salmon + Salad...' : 'Sáng: Yến mạch + Trứng... Trưa: Ức gà + Khoai lang... Tối: Cá hồi + Salad...'} className={inputClass} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField title={isEn ? 'Nutritional Notes / Food Allergies' : 'Lưu ý dinh dưỡng / Dị ứng thực phẩm'}>
              <textarea name="notes" rows="3" placeholder={isEn ? 'Avoid seafood, drink at least 2.5L water daily...' : 'Tránh hải sản, uống tối thiểu 2.5L nước mỗi ngày...'} className={inputClass} />
            </FormField>
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <button disabled={working} className={buttonPrimary}>
              <span>{isEn ? 'Assign Nutrition Plan' : 'Giao kế hoạch dinh dưỡng'}</span>
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 4: COMMUNICATION (TƯƠNG TÁC & CHAT)
// ─────────────────────────────────────────────────────────────
function CommunicationTab({ data, act, working, isEn }) {
  const [memberId, setMemberId] = useState(data.clients[0]?.id || '');
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const loadMessages = async (id) => {
    if (!id) return;
    setLoadingMessages(true);
    try {
      const res = await coachProfessionalApi.getMessages(data.profile.id, id);
      setMessages(res);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadMessages(memberId);
  }, [memberId]);

  const send = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    return act(
      () =>
        coachProfessionalApi.sendMessage({
          coachId: data.profile.id,
          memberId: Number(memberId),
          content: inputMessage.trim()
        }),
      isEn ? 'Message sent.' : 'Đã gửi tin nhắn.'
    ).then((ok) => {
      if (ok) {
        setInputMessage('');
        loadMessages(memberId);
      }
    });
  };

  const broadcast = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const channels = ['InApp', 'Email', 'SMS', 'Push'].filter(x => f.get(x));
    return act(
      () =>
        coachProfessionalApi.broadcast({
          classId: null,
          memberIds: null,
          title: f.get('title'),
          content: f.get('content'),
          channels
        }),
      isEn ? 'Broadcast notice sent successfully.' : 'Đã phát thông báo đa kênh thành công.'
    ).then((ok) => ok && e.target.reset());
  };

  const selectedClient = data.clients.find(x => Number(x.id) === Number(memberId));

  const quickPills = isEn ? [
    '💧 Drink at least 2L of water today!',
    '🏃 Warm up thoroughly before today\'s session.',
    '🥗 Have a light healthy snack 60 mins before class.',
    '😴 Ensure 8 hours of quality sleep for recovery!'
  ] : [
    '💧 Nhớ uống đủ 2L nước mỗi ngày nhé!',
    '🏃 Đừng quên khởi động kỹ trước buổi tập.',
    '🥗 Hãy ăn bữa phụ nhẹ trước giờ tập 60 phút.',
    '😴 Ngủ đủ 8 tiếng để cơ bắp phục hồi tối ưu nhé!'
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
      {/* 1-on-1 Secure Chat */}
      <SectionCard
        title={isEn ? 'Direct Student Messaging' : 'Trò chuyện bảo mật với học viên'}
        icon="chat"
        action={
          <select
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            className={`${selectClass} max-w-56`}
          >
            {data.clients.map(x => (
              <option key={x.id} value={x.id}>{x.fullName}</option>
            ))}
          </select>
        }
      >
        <div className="h-[400px] space-y-2.5 overflow-y-auto rounded-2xl bg-slate-50 dark:bg-slate-750/50 p-4 border border-slate-100 dark:border-slate-700">
          {loadingMessages ? (
            <p className="text-xs text-slate-400 text-center py-8">{isEn ? 'Loading conversation...' : 'Đang tải đoạn hội thoại...'}</p>
          ) : !messages.length ? (
            <EmptyState icon="forum" isEn={isEn}>
              {isEn ? `Start conversation with student ${selectedClient?.fullName || ''}.` : `Bắt đầu cuộc trò chuyện với học viên ${selectedClient?.fullName || ''}.`}
            </EmptyState>
          ) : (
            messages.map(x => {
              const isCoach = Number(x.senderUserId) === Number(data.profile.userId);
              return (
                <div
                  key={x.id}
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isCoach
                      ? 'ml-auto bg-[#1E2235] text-white rounded-br-xs shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <p>{x.content}</p>
                  <span className={`text-[10px] block mt-1 ${isCoach ? 'text-[#F2CC8F]' : 'text-slate-400'}`}>
                    {formatDate(x.createdAt, isEn)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
          {quickPills.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setInputMessage(pill)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#81B29A]/15 dark:hover:bg-[#81B29A]/20 hover:text-[#2D6A4F] dark:hover:text-[#81B29A] shrink-0 transition-colors cursor-pointer"
            >
              {pill}
            </button>
          ))}
        </div>

        <form onSubmit={send} className="mt-2 flex gap-2">
          <input
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            required
            maxLength="4000"
            placeholder={isEn ? 'Type a supportive message to student...' : 'Nhập tin nhắn hướng dẫn, nhắc nhở học viên...'}
            className={inputClass}
          />
          <button disabled={working || !memberId || !inputMessage.trim()} className={buttonPrimary}>
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>{isEn ? 'Send' : 'Gửi'}</span>
          </button>
        </form>
      </SectionCard>

      {/* Broadcast Announcement */}
      <SectionCard title={isEn ? 'Broadcast Notice' : 'Phát thông báo tới toàn bộ học viên'} icon="campaign">
        <form onSubmit={broadcast} className="space-y-3">
          <FormField title={isEn ? 'Announcement Title' : 'Tiêu đề thông báo'} required>
            <input name="title" required placeholder={isEn ? 'E.g., Holiday Schedule / Makeup Class Notice' : 'VD: Thông báo nghỉ lễ / Lịch tập bù'} className={inputClass} />
          </FormField>
          <FormField title={isEn ? 'Announcement Content' : 'Nội dung thông báo'} required>
            <textarea name="content" required rows="6" placeholder={isEn ? 'Dear athletes and students under my supervision...' : 'Kính gửi các học viên phụ trách...'} className={inputClass} />
          </FormField>
          <fieldset>
            <legend className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">{isEn ? 'Delivery Channels' : 'Kênh gửi tin'}</legend>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['InApp', 'Email', 'SMS', 'Push'].map((ch, idx) => (
                <label key={ch} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 cursor-pointer">
                  <input name={ch} type="checkbox" defaultChecked={idx === 0} className="rounded text-[#81B29A] focus:ring-[#81B29A]" />
                  <span>{ch}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-[11px] text-slate-400">
            {isEn ? 'In-App messages are delivered instantly; Email/SMS/Push queued and supervised by the center.' : 'Tin nhắn In-App gửi tức thì; Email/SMS/Push vào hàng đợi được giám sát bởi trung tâm.'}
          </p>
          <button disabled={working} className={`${buttonPrimary} w-full`}>
            <span>{isEn ? 'Broadcast Notice' : 'Phát thông báo'}</span>
          </button>
        </form>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 5: TEACHING PERFORMANCE (THỐNG KÊ HIỆU SUẤT GIẢNG DẠY)
// ─────────────────────────────────────────────────────────────
function PerformanceTab() {
  return <PerformanceDashboard />;
}

// ─────────────────────────────────────────────────────────────
// TAB 6: FACILITIES & ASSETS (TÀI NGUYÊN & THIẾT BỊ)
// ─────────────────────────────────────────────────────────────
function FacilitiesTab({ data, act, working, isEn }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const booking = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.bookResource({
          resourceId: Number(f.get('resourceId')),
          workEventId: null,
          startAt: f.get('startAt'),
          endAt: f.get('endAt'),
          purpose: f.get('purpose')
        }),
      isEn ? 'Resource booked; schedule conflict checks passed.' : 'Đã đặt tài nguyên; hệ thống đã kiểm tra xung đột lịch.'
    ).then((ok) => ok && e.target.reset());
  };

  const issue = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.reportIssue({
          resourceId: f.get('resourceId') ? Number(f.get('resourceId')) : null,
          title: f.get('title'),
          description: f.get('description'),
          severity: f.get('severity'),
          photoUrl: photoUrl || null
        }),
      isEn ? 'Maintenance report submitted to technical team.' : 'Đã gửi báo cáo sự cố đến bộ phận kỹ thuật & quản lý.'
    ).then((ok) => {
      if (ok) {
        e.target.reset();
        setPhotoUrl('');
      }
    });
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadMediaFileToCloud(file);
      setPhotoUrl(res.url);
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title={isEn ? 'Book Court / Equipment' : 'Đăng ký khu vực / Thiết bị tập luyện'} icon="stadium">
          <form onSubmit={booking} className="space-y-3">
            <FormField title={isEn ? 'Resource / Court / Equipment' : 'Tài nguyên / Sân tập'} required>
              <select name="resourceId" required className={selectClass}>
                <option value="">{isEn ? '-- Select Court or Facility Equipment --' : '-- Chọn sân hoặc trang thiết bị --'}</option>
                {data.resources.map(x => (
                  <option key={x.id} value={x.id}>{x.name} · ({x.resourceType})</option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField title={isEn ? 'Start' : 'Bắt đầu'} required>
                <input name="startAt" type="datetime-local" required className={inputClass} />
              </FormField>
              <FormField title={isEn ? 'End' : 'Kết thúc'} required>
                <input name="endAt" type="datetime-local" required className={inputClass} />
              </FormField>
            </div>
            <FormField title={isEn ? 'Purpose of Use' : 'Mục đích sử dụng'} required>
              <input name="purpose" required placeholder={isEn ? 'E.g., Advanced swimming class / 1-on-1 PT' : 'VD: Dạy lớp bơi nâng cao / Huấn luyện PT'} className={inputClass} />
            </FormField>
            <button disabled={working || !data.resources.length} className={`${buttonPrimary} w-full`}>
              <span>{isEn ? 'Check Availability & Book' : 'Kiểm tra & Đặt lịch'}</span>
            </button>
          </form>
        </SectionCard>

        <SectionCard title={isEn ? 'Report Maintenance Issue' : 'Báo cáo sự cố thiết bị & An toàn'} icon="report_problem">
          <form onSubmit={issue} className="space-y-3">
            <FormField title={isEn ? 'Affected Facility / Equipment' : 'Thiết bị / Khu vực gặp sự cố'}>
              <select name="resourceId" className={selectClass}>
                <option value="">{isEn ? '-- General Facility / Other --' : '-- Thiết bị chung / Khác --'}</option>
                {data.resources.map(x => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </FormField>
            <FormField title={isEn ? 'Severity Level' : 'Mức độ nghiêm trọng'}>
              <select name="severity" className={selectClass}>
                <option value="Low">{isEn ? 'Low (Low priority - No immediate impact)' : 'Low (Thấp - Không ảnh hưởng ngay)'}</option>
                <option value="Medium">{isEn ? 'Medium (Moderate - Resolve within 24h)' : 'Medium (Trung bình - Cần sửa trong 24h)'}</option>
                <option value="High">{isEn ? 'High (High - Impedes training sessions)' : 'High (Cao - Ảnh hưởng buổi tập)'}</option>
                <option value="Critical">{isEn ? 'Critical (Severe - Safety hazard)' : 'Critical (Nghiêm trọng - Nguy cơ mất an toàn)'}</option>
              </select>
            </FormField>
            <FormField title={isEn ? 'Issue Title' : 'Tiêu đề sự cố'} required>
              <input name="title" required placeholder={isEn ? 'E.g., Pulley cable frayed on multi-gym' : 'VD: Dây cáp tạ đa năng bị xơ'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Scene Description & Safety Hazard' : 'Mô tả hiện trường & Cảnh báo an toàn'} required>
              <textarea name="description" required rows="2" placeholder={isEn ? 'Specify damage details, exact room/zone...' : 'Chi tiết hư hỏng, vị trí chính xác...'} className={inputClass} />
            </FormField>
            <FormField title={isEn ? 'Photo of Issue' : 'Ảnh hiện trường'}>
              <input
                type="file"
                accept="image/*"
                onChange={e => uploadPhoto(e.target.files?.[0])}
                className={inputClass}
              />
            </FormField>
            <button disabled={working || uploading} className={`${buttonPrimary} w-full`}>
              <span>{uploading ? (isEn ? 'Uploading photo...' : 'Đang tải ảnh hiện trường...') : (isEn ? 'Submit Incident Report' : 'Gửi báo cáo sự cố')}</span>
            </button>
          </form>
        </SectionCard>
      </div>

      {/* History Grids */}
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title={isEn ? 'My Resource Bookings' : 'Lượt đặt tài nguyên của tôi'} icon="history">
          {!data.resourceBookings.length ? (
            <EmptyState icon="event_available" isEn={isEn}>
              {isEn ? 'No equipment bookings found.' : 'Chưa có lượt đặt thiết bị nào.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {data.resourceBookings.map(x => (
                <div key={x.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 flex items-center justify-between text-xs">
                  <div>
                    <strong className="block text-slate-900 dark:text-white">{x.resourceName}</strong>
                    <span className="text-[11px] text-slate-500">
                      {formatDate(x.startAt, isEn)} → {formatDate(x.endAt, isEn)} · {x.purpose}
                    </span>
                  </div>
                  {x.status === 'Confirmed' && (
                    <button
                      disabled={working}
                      onClick={() => act(() => coachProfessionalApi.cancelResource(x.id), isEn ? 'Booking cancelled.' : 'Đã hủy lượt đặt.')}
                      className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold cursor-pointer"
                    >
                      {isEn ? 'Cancel' : 'Hủy'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={isEn ? 'Reported Issues Status' : 'Tiến độ xử lý sự cố đã báo'} icon="assignment_late">
          {!data.equipmentIssues.length ? (
            <EmptyState icon="check_circle" isEn={isEn}>
              {isEn ? 'All reported issues have been resolved.' : 'Hiện không có sự cố nào chưa được xử lý.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {data.equipmentIssues.map(x => (
                <div key={x.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white">{x.title}</strong>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {x.severity} · {x.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    {x.resourceName || (isEn ? 'Other Equipment' : 'Thiết bị khác')} · {formatDate(x.reportedAt, isEn)}
                  </span>
                  {x.resolutionNote && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                      {isEn ? 'Technician Response: ' : 'Kỹ thuật phản hồi: '}{x.resolutionNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
