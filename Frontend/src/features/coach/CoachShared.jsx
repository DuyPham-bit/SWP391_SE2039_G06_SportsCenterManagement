import React, { useState, useEffect } from 'react';
import { classApi } from '../../services/api.js';
import { coachDate } from './coachOverview.js';

export const coachInput = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-600';

export function CoachError({ message, retry }) {
  if (!message) return null;
  return <div role="alert" className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
    <p>{message}</p>{retry && <button type="button" onClick={retry} className="font-bold underline mt-2">Thử lại</button>}
  </div>;
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
  return <form onSubmit={e => { e.preventDefault(); schedule.reload(); }} className="flex flex-wrap items-end gap-3 p-4 rounded-xl border border-slate-200 bg-white">
    <label className="text-xs font-semibold">Từ ngày<input aria-label="Từ ngày" type="date" required className={coachInput} value={schedule.from} onChange={e => schedule.setFrom(e.target.value)} /></label>
    <label className="text-xs font-semibold">Đến ngày<input aria-label="Đến ngày" type="date" required className={coachInput} value={schedule.to} onChange={e => schedule.setTo(e.target.value)} /></label>
    <button disabled={schedule.loading} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50">Xem lịch</button>
    <span className="text-xs text-slate-500">Tối đa 92 ngày mỗi lần xem.</span>
  </form>;
}
