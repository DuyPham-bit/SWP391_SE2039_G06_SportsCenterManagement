import React, { useEffect, useRef, useState } from 'react';
import { receptionApi } from '../../services/api.js';

export const counterInput = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
export const counterButton = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
export const counterQuery = () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('query') || '';
export function CounterError({ message, retry }) {
  return message ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 break-words">
    <p>{message}</p>{retry && <button type="button" className="mt-2 underline font-bold" onClick={retry}>Thử lại</button>}
  </div> : null;
}

export function CounterMemberPicker({ selected, onChange, disabled = false }) {
  const [query, setQuery] = useState(counterQuery);
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const request = useRef(0);
  const search = async () => {
    const id = ++request.current;
    setError(''); setMembers([]); onChange(null);
    if (query.trim().length < 2) { setError('Nhập ít nhất 2 ký tự để tìm thành viên.'); return; }
    setBusy(true);
    try {
      const results = await receptionApi.lookupMember(query);
      if (id !== request.current) return;
      setMembers(results); setSearched(true);
      if (results.length === 1) onChange(results[0]);
    } catch (e) { if (id === request.current) setError(e.message); }
    finally { if (id === request.current) setBusy(false); }
  };
  useEffect(() => { if (query.trim().length >= 2) search(); return () => { request.current += 1; }; }, []);
  return <div className="space-y-3">
    <div className="flex gap-2">
      <input aria-label="Tìm thành viên tại quầy" className={counterInput} placeholder="Tên, mã thành viên, email hoặc điện thoại" value={query} disabled={disabled || busy}
        onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
      <button type="button" className={counterButton} disabled={disabled || busy} onClick={search}>{busy ? 'Đang tìm...' : 'Tìm thành viên'}</button>
    </div>
    <CounterError message={error} retry={search} />
    {searched && members.length === 0 && !error && <p className="text-sm text-slate-500">Không tìm thấy thành viên phù hợp.</p>}
    <div className="flex flex-wrap gap-2">{members.map(m => <button type="button" key={m.id} aria-pressed={selected?.id === m.id} disabled={disabled || busy}
      onClick={() => onChange(m)} className={`rounded-lg border p-3 text-left text-sm ${selected?.id === m.id ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <strong>{m.memberCode} · {m.fullName}</strong><span className="block text-xs text-slate-500 break-all">{m.phone} · {m.email}</span>
    </button>)}</div>
  </div>;
}
