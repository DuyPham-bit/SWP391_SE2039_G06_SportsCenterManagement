import React, { useEffect, useRef, useState } from 'react';
import { receptionApi } from '../../services/api.js';

export const counterInput = 'w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-xs';
export const counterButton = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] px-4 py-2.5 text-sm font-bold text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
export const counterQuery = () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('query') || '';

export function CounterError({ message, retry }) {
  return message ? (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 break-words flex items-start gap-3 shadow-xs animate-fadeIn">
      <span className="material-symbols-outlined text-red-500 text-[20px] shrink-0 mt-0.5">error</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-red-900">{message}</p>
        {retry && (
          <button type="button" className="mt-2 text-xs font-bold text-red-700 hover:text-red-900 underline flex items-center gap-1 cursor-pointer" onClick={retry}>
            <span className="material-symbols-outlined text-[14px]">refresh</span> Thử lại
          </button>
        )}
      </div>
    </div>
  ) : null;
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

  return (
    <div className="space-y-3">
      {selected ? (
        <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-50/60 p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {selected.fullName?.charAt(0)?.toUpperCase() || 'M'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">{selected.fullName}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selected.memberCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                {selected.phone || 'Chưa có SĐT'} • {selected.email || 'Chưa có email'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => onChange(null)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
          >
            Đổi thành viên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                aria-label="Tìm thành viên tại quầy"
                className={`${counterInput} pl-9`}
                placeholder="Tên, mã thành viên, email hoặc SĐT..."
                value={query}
                disabled={disabled || busy}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
              />
            </div>
            <button
              type="button"
              className={counterButton}
              disabled={disabled || busy}
              onClick={search}
            >
              {busy ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">person_search</span>
                  <span>Tìm</span>
                </>
              )}
            </button>
          </div>

          <CounterError message={error} retry={search} />

          {searched && members.length === 0 && !error && (
            <p className="text-xs text-slate-500 py-2 text-center bg-slate-50 rounded-lg border border-slate-200">
              Không tìm thấy thành viên phù hợp với từ khóa "{query}".
            </p>
          )}

          {members.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-xl bg-slate-50/50">
              {members.map(m => {
                const isCurrent = selected?.id === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    aria-pressed={isCurrent}
                    disabled={disabled || busy}
                    onClick={() => onChange(m)}
                    className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isCurrent
                        ? 'border-red-500 bg-red-50/80 shadow-xs ring-1 ring-red-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      {m.fullName?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs text-slate-900 truncate">{m.fullName}</strong>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                          {m.memberCode}
                        </span>
                      </div>
                      <span className="block text-[11px] text-slate-500 truncate mt-0.5">
                        {m.phone || m.email}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
