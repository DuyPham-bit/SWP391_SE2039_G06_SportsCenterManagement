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
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

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
    { id: 'performance', icon: 'monitoring', label: isEn ? 'Performance & Salary' : 'Hiệu suất & Lương' }
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
    <div className="space-y-5 animate-fade-slide-up">
      {/* 1. Header Banner in SCMS Olympic Arena Theme */}
      <header className={SCMS_HERO_SECTION_CLASS}>
        <ScmsHeroDecor />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span className={SCMS_HERO_BADGE_CLASS}>
              <span className="material-symbols-outlined text-[15px] text-brand-sand-700 dark:text-brand-sand-400">workspace_premium</span>
              {isEn ? 'Coach Professional Workspace' : 'Phân hệ chuyên môn HLV cao cấp'}
            </span>

            <button
              onClick={load}
              disabled={loading}
              className={SCMS_HERO_BTN_GLASS}
            >
              <span className={`material-symbols-outlined text-[16px] text-brand-sand-200 ${loading ? 'animate-spin' : ''}`}>
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
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20">
              <span className="text-[10px] font-bold uppercase text-white/85 block">
                {isEn ? 'Active Students' : 'Học viên phụ trách'}
              </span>
              <span className="text-lg font-black font-chivo text-white">
                {data?.clients?.length || 0}
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20">
              <span className="text-[10px] font-bold uppercase text-white/85 block">
                {isEn ? 'Monthly Sessions' : 'Buổi dạy tháng'}
              </span>
              <span className="text-lg font-black font-chivo text-white">
                {kpiData.completedSessions || 0}
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20">
              <span className="text-[10px] font-bold uppercase text-white/85 block">
                {isEn ? 'Average Rating' : 'Đánh giá TB'}
              </span>
              <span className="text-lg font-black font-chivo text-brand-sand-200 flex items-center gap-1">
                ★ {kpiData.averageRating ?? '—'}
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs rounded-xl p-2.5 border border-white/20">
              <span className="text-[10px] font-bold uppercase text-white/85 block">
                {isEn ? 'Attendance Rate' : 'Tỉ lệ chuyên cần'}
              </span>
              <span className="text-base sm:text-lg font-black font-chivo text-white truncate block">
                {typeof kpiData.attendanceRate === 'number' ? `${kpiData.attendanceRate}%` : '—'}
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
              className={`scms-shine flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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

