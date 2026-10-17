import React, { useState, useEffect } from 'react';
import { classApi } from '../../services/api.js';
import { coachDate } from './coachOverview.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';

export const coachInput = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#81B29A] focus:border-[#81B29A] outline-none';

export function CoachError({ message, retry }) {
  if (!message) return null;
  const isObj = message && typeof message === 'object';
  const text = isObj ? (message.message || String(message)) : String(message);
  const code = isObj ? message.code : null;
  const proposedHandling = isObj ? message.proposedHandling : null;

  return (
    <BusinessAlert
      type="error"
      title="Thông báo lỗi thao tác"
      code={code}
      message={text}
      proposedHandling={proposedHandling}
      actionText={retry ? "Thử lại" : undefined}
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
  return (
    <form onSubmit={e => { e.preventDefault(); schedule.reload(); }} className="flex flex-wrap items-end gap-3 p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <label className="text-xs font-bold text-slate-700">Từ ngày<input aria-label="Từ ngày" type="date" required className={coachInput} value={schedule.from} onChange={e => schedule.setFrom(e.target.value)} /></label>
      <label className="text-xs font-bold text-slate-700">Đến ngày<input aria-label="Đến ngày" type="date" required className={coachInput} value={schedule.to} onChange={e => schedule.setTo(e.target.value)} /></label>
      <button disabled={schedule.loading} className="px-5 py-2 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] font-bold text-sm shadow-xs hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">Xem lịch</button>
      <span className="text-xs text-slate-500 pb-2">Tối đa 92 ngày mỗi lần xem.</span>
    </form>
  );
}
