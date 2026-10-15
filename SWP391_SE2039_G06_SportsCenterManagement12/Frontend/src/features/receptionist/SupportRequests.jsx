import React, { useEffect, useState } from 'react';
import { receptionApi } from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { counterButton, counterInput, CounterError, CounterMemberPicker } from './ReceptionistShared.jsx';
const statuses = { Open: 'Mới tiếp nhận', InProgress: 'Đang xử lý', Resolved: 'Đã giải quyết' };
const priorities = { Low: 'Thấp', Normal: 'Bình thường', High: 'Cao' };

export function SupportRequests() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [filter, setFilter] = useState({ query: '', status: '', page: 1, version: 0 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [nextStatus, setNextStatus] = useState('Open');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [member, setMember] = useState(null);
  const [createError, setCreateError] = useState('');
  const [success, setSuccess] = useState('');
  const reload = () => setFilter(f => ({ ...f, version: f.version + 1 }));
  useEffect(() => {
    let active = true; setLoading(true); setData(null); setError('');
    receptionApi.getSupportRequests(filter).then(result => { if (active) setData(result); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter]);
  const selectDetail = result => { setDetail(result); setNextStatus(result.request.status); setNote(''); };
  const open = async id => {
    setBusy(true); setDetail(null); setDetailError(''); setSuccess('');
    try { selectDetail(await receptionApi.getSupportRequest(id)); } catch (e) { setDetailError(e.message); } finally { setBusy(false); }
  };
  const create = async event => {
    event.preventDefault(); if (!member) { setCreateError('Chọn thành viên cần hỗ trợ.'); return; }
    const form = new FormData(event.currentTarget); setBusy(true); setCreateError('');
    try {
      const result = await receptionApi.createSupportRequest({ memberId: member.id, subject: form.get('subject'), description: form.get('description'), priority: form.get('priority') });
      selectDetail(result); setCreating(false); setQuery(''); setStatus(''); setDetailError(''); setSuccess('Đã ghi nhận yêu cầu hỗ trợ.');
      setFilter(f => ({ query: '', status: '', page: 1, version: f.version + 1 }));
    } catch (e) { setCreateError(e.message); } finally { setBusy(false); }
  };
  const update = async event => {
    event.preventDefault(); setBusy(true); setDetailError(''); setSuccess('');
    try { selectDetail(await receptionApi.updateSupportRequest(detail.request.id, { status: nextStatus, note })); setSuccess('Đã lưu xử lý yêu cầu.'); reload(); }
    catch (e) { setDetailError(e.message); } finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-black">Yêu cầu hỗ trợ</h1><p className="text-sm text-slate-500">Tiếp nhận và theo dõi yêu cầu của thành viên tại trung tâm.</p></div>
      <button className={counterButton} disabled={busy} onClick={() => { setCreateError(''); setMember(null); setCreating(true); }}>Tiếp nhận yêu cầu</button></div>
    <form onSubmit={e => { e.preventDefault(); setFilter({ query, status, page: 1, version: filter.version + 1 }); }} className="flex flex-wrap gap-2">
      <input className={`${counterInput} flex-1`} aria-label="Tìm yêu cầu hỗ trợ" maxLength={200} value={query} onChange={e => setQuery(e.target.value)} placeholder="Tiêu đề, mã hoặc tên thành viên" />
      <select className="rounded-lg border p-2 text-sm" aria-label="Lọc trạng thái yêu cầu" value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(statuses).map(([v, label]) => <option value={v} key={v}>{label}</option>)}</select>
      <button className={counterButton} disabled={loading || busy}>Tìm kiếm</button></form>
    <CounterError message={error} retry={reload} />{loading && <p role="status">Đang tải yêu cầu...</p>}
    {data && <div className="rounded-xl border bg-white overflow-hidden"><div className="divide-y">{data.items.map(r => <article className="p-4 flex flex-wrap justify-between gap-3" key={r.id}>
      <div className="min-w-0 flex-1"><h2 className="font-bold break-words">#{r.id} · {r.subject}</h2><p className="text-sm">{r.memberName} · {r.memberCode}</p><p className="text-xs text-slate-500 mt-1">{statuses[r.status]} · Ưu tiên {priorities[r.priority]} · {formatMemberDateTime(r.createdAt)}</p></div><button className={counterButton} disabled={busy} onClick={() => open(r.id)}>Xem yêu cầu</button></article>)}</div>
      {!data.items.length && <p className="p-5 text-sm text-slate-500">Chưa có yêu cầu phù hợp.</p>}
      <div className="p-3 border-t flex flex-wrap justify-between items-center gap-2 text-xs"><span>Tổng số: {data.totalCount} · Trang {filter.page} / {Math.max(1, Math.ceil(data.totalCount / 20))}</span><div className="flex gap-2"><button className={counterButton} disabled={busy || filter.page === 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>Trang trước</button><button className={counterButton} disabled={busy || filter.page * 20 >= data.totalCount} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Trang sau</button></div></div>
    </div>}
    <CounterError message={detailError} />{success && <p role="status" className="text-emerald-700">{success}</p>}
    {busy && !creating && <p role="status">Đang xử lý yêu cầu...</p>}
    {detail && <section aria-label="Chi tiết yêu cầu hỗ trợ" className="p-4 sm:p-6 rounded-xl border bg-white space-y-4">
      <div><h2 className="font-bold text-lg break-words">#{detail.request.id} · {detail.request.subject}</h2><p className="text-sm">{detail.request.memberName} · {detail.request.memberCode} · Ưu tiên {priorities[detail.request.priority]}</p><p className="text-sm text-slate-500">{statuses[detail.request.status]}{detail.request.resolvedAt && ` · ${formatMemberDateTime(detail.request.resolvedAt)}`}</p></div>
      <p className="whitespace-pre-wrap break-words text-sm">{detail.description}</p>
      <h3 className="font-bold">Lịch sử xử lý</h3>{!detail.messages.length && <p className="text-sm text-slate-500">Chưa có ghi chú xử lý.</p>}
      {detail.messages.map(m => <div className="border rounded-lg p-3" key={m.id}><p className="text-sm whitespace-pre-wrap break-words">{m.message}</p><p className="text-xs text-slate-500 mt-1">{m.senderName} · {formatMemberDateTime(m.createdAt)}</p></div>)}
      <form onSubmit={update} className="space-y-3 border-t pt-4"><fieldset disabled={busy} className="space-y-3">
        <label className="block text-sm">Trạng thái xử lý<select aria-label="Trạng thái xử lý" className={counterInput} value={nextStatus} onChange={e => setNextStatus(e.target.value)}>{Object.entries(statuses).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
        <label className="block text-sm">Ghi chú xử lý<textarea aria-label="Ghi chú xử lý" rows={3} maxLength={5000} className={counterInput} value={note} onChange={e => setNote(e.target.value)} /></label>
      </fieldset><button className={counterButton} disabled={busy}>Lưu xử lý</button></form>
    </section>}
    <Modal isOpen={creating} onClose={() => { if (!busy) setCreating(false); }} title="Tiếp nhận yêu cầu hỗ trợ" maxWidth="max-w-2xl">
      <form onSubmit={create} className="space-y-4"><CounterMemberPicker selected={member} onChange={setMember} disabled={busy} />
        <CounterError message={createError} /><fieldset className="space-y-3" disabled={busy}>
          <label className="block text-sm">Tiêu đề<input name="subject" required maxLength={200} className={counterInput} /></label>
          <label className="block text-sm">Nội dung yêu cầu<textarea name="description" required maxLength={5000} rows={4} className={counterInput} /></label>
          <label className="block text-sm">Mức ưu tiên<select name="priority" className={counterInput} defaultValue="Normal">{Object.entries(priorities).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
        </fieldset><button className={counterButton} disabled={busy || !member}>{busy ? 'Đang lưu...' : 'Lưu yêu cầu'}</button>
      </form></Modal>
  </div>;
}
