import React, { useEffect, useState } from 'react';
import { coachProfessionalApi } from '../../../entities/coach/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { CoachError } from '../../../features/coach-workspace/index.js';
import { ScheduleTab } from './ScheduleTab.jsx';
import { ClientsTab } from './ClientsTab.jsx';
import { ProgramsTab } from './ProgramsTab.jsx';
import { CommunicationTab } from './CommunicationTab.jsx';
import { PerformanceTab } from './PerformanceTab.jsx';

export function CoachProfessionalHub() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const getInitialTab = () => {
    const hash = window.location.hash || '';
    if (hash.includes('tab=schedule') || hash.includes('tab=leave')) return 'schedule';
    if (hash.startsWith('#/coach/messages') || hash.includes('tab=communication')) return 'communication';
    return 'performance';
  };

  const [tab, setTab] = useState(getInitialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const tabsConfig = [
    { id: 'schedule', icon: 'edit_calendar', label: isEn ? 'Schedule & Leave' : 'Lịch & Xin nghỉ' },
    { id: 'communication', icon: 'chat', label: isEn ? 'Student Messages' : 'Tin nhắn học viên' },
    { id: 'performance', icon: 'monitoring', label: isEn ? 'Teaching Performance' : 'Hiệu suất giảng dạy' }
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
      if (hash.startsWith('#/coach/messages') || hash.includes('tab=communication')) {
        setTab('communication');
      } else if (hash.includes('tab=schedule') || hash.includes('tab=leave')) {
        setTab('schedule');
      } else if (hash.includes('tab=performance') || hash.includes('tab=kpi')) {
        setTab('performance');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const act = async (fn, successMsg, onError) => {
    setWorking(true);
    try {
      await fn();
      showSuccess(successMsg);
      await load();
      return true;
    } catch (e) {
      onError?.(e);
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 text-brand-sage-900 dark:text-brand-sage-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 dark:border-white/20 shadow-xs">
              <span className="material-symbols-outlined text-[15px] text-brand-sand-700 dark:text-brand-sand-400">workspace_premium</span>
              {isEn ? 'Coach Professional Workspace' : 'Phân hệ chuyên môn HLV cao cấp'}
            </span>

            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-md border border-white/30 cursor-pointer shadow-xs hover-lift"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isEn ? 'Refresh Data' : 'Làm mới dữ liệu'}</span>
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-chivo font-black tracking-tight text-white mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? `Command Hub · Coach ${coachName}` : `Trung tâm điều hành chuyên môn HLV ${coachName}`}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/95 max-w-3xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Consolidated workspace for schedules, leave requests, student communication, teaching performance and transparent income.'
              : 'Không gian thống nhất cho lịch dạy, đơn xin nghỉ, tương tác học viên, hiệu suất giảng dạy và thu nhập minh bạch.'}
          </p>

          {/* Quick Stats Grid inside Hero Header */}
          <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sand-300/90 block">
                {isEn ? 'Active Students' : 'Học viên phụ trách'}
              </span>
              <span className="text-lg font-black text-white">
                {data?.clients?.length || 0}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sand-300/90 block">
                {isEn ? 'Monthly Sessions' : 'Buổi dạy tháng'}
              </span>
              <span className="text-lg font-black text-white">
                {kpiData.completedSessions || 0}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sand-300/90 block">
                {isEn ? 'Average Rating' : 'Đánh giá TB'}
              </span>
              <span className="text-lg font-black text-brand-sand-300 flex items-center gap-1">
                ★ {kpiData.averageRating || '5.0'}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase text-brand-sage-500 block">
                {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần'}
              </span>
              <span className="text-base sm:text-lg font-black text-brand-sage-300 truncate block">
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
        className="flex gap-1.5 overflow-x-auto rounded-2xl border border-brand-navy-200/90 dark:border-brand-navy-700/80 bg-white dark:bg-brand-navy-800 p-1.5 shadow-2xs"
      >
        {tabsConfig.map(({ id, icon, label }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-navy-900 text-brand-sand-300 shadow-xs'
                  : 'text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-100/80 dark:hover:bg-brand-navy-700/60 hover:text-brand-navy-900 dark:hover:text-white'
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
    </div>
  );
}

