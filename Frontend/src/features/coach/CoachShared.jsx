import React, { useState, useEffect } from 'react';
import { classApi } from '../../services/api.js';
import { coachDate } from './coachOverview.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export const coachInput = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-[#1A3B8B]/20 focus:border-[#1A3B8B] outline-none transition-all';

export function CoachError({ message, retry }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  if (!message) return null;
  const isObj = message && typeof message === 'object';
  const text = isObj ? (message.message || String(message)) : String(message);
  const code = isObj ? message.code : null;
  const proposedHandling = isObj ? message.proposedHandling : null;

  return (
    <BusinessAlert
      type="error"
      title={isEn ? "Action Error Notice" : "Thông báo lỗi thao tác"}
      code={code}
      message={text}
      proposedHandling={proposedHandling}
      actionText={retry ? (isEn ? "Retry" : "Thử lại") : undefined}
      onAction={retry}
      className="my-3"
    />
  );
}

export function useTeachingSessions(endOffset = 30, anchorDate = null) {
  const [from, setFrom] = useState(anchorDate || coachDate(-30));
  const [to, setTo] = useState(anchorDate || coachDate(endOffset));
  const [range, setRange] = useState({ from, to, version: 0 });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = () => {
    if (!from || !to || to < from || (Date.parse(to) - Date.parse(from)) / 86400000 > 92) {
      setError('Chọn khoảng ngày hợp lệ, tối đa 92 ngày.'); return;
    }
    setRange(previous => ({ from, to, version: previous.version + 1 }));
  };
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setSessions([]);
    classApi.getTeachingSchedule(range.from, range.to).then(data => {
      if (active) setSessions(data);
    }).catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);
  return { from, to, setFrom, setTo, sessions, loading, error, reload };
}

export function CoachPeriod({ schedule }) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <form onSubmit={e => { e.preventDefault(); schedule.reload(); }} className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <label className="text-xs font-semibold text-slate-600">
        {isEn ? "From Date" : "Từ ngày"}
        <input aria-label={isEn ? "From Date" : "Từ ngày"} type="date" required className={coachInput} value={schedule.from} onChange={e => schedule.setFrom(e.target.value)} />
      </label>
      <label className="text-xs font-semibold text-slate-600">
        {isEn ? "To Date" : "Đến ngày"}
        <input aria-label={isEn ? "To Date" : "Đến ngày"} type="date" required className={coachInput} value={schedule.to} onChange={e => schedule.setTo(e.target.value)} />
      </label>
      <button disabled={schedule.loading} className="px-4 py-2 rounded-lg bg-[#1A3B8B] hover:bg-[#142F70] text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer">
        {schedule.loading ? (isEn ? "Loading..." : "Đang tải...") : (isEn ? "View Schedule" : "Xem lịch")}
      </button>
      <span className="text-xs text-slate-400 pb-2">
        {isEn ? "Maximum 92 days per query." : "Tối đa 92 ngày mỗi lần xem."}
      </span>
    </form>
  );
}
