import React, { useEffect, useRef, useState } from 'react';
import { receptionApi } from '../../services/api.js';
import { createIdempotencyKey } from '../../services/http.js';
import { downloadInvoice, invoiceStatus, printInvoice } from '../../services/invoiceExport.js';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { counterButton, counterInput, counterQuery, CounterError } from './ReceptionistShared.jsx';
const money = value => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;

export function CounterInvoices() {
  const [query, setQuery] = useState(counterQuery);
  const [filter, setFilter] = useState({ query, page: 1, version: 0 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [posCode, setPosCode] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');
  const attempt = useRef({});
  const sequence = useRef(0);
  const reload = () => setFilter(f => ({ ...f, version: f.version + 1 }));
  useEffect(() => {
    let active = true; setLoading(true); setError(''); setData(null);
    receptionApi.getInvoices(filter).then(result => { if (active) setData(result); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter]);
  useEffect(() => () => { sequence.current += 1; }, []);
  const open = async number => {
    const id = ++sequence.current;
    setOpening(true); setDetail(null); setDetailError(''); setSuccess(''); setNote(''); setPosCode(''); setMethod('CASH');
    try {
      const invoice = await receptionApi.getInvoice(number);
      if (id === sequence.current) { setDetail(invoice); setAmount(String(invoice.outstandingBalance)); }
    } catch (e) { if (id === sequence.current) setDetailError(e.message); }
    finally { if (id === sequence.current) setOpening(false); }
  };
  const record = async event => {
    event.preventDefault(); setDetailError(''); setSuccess('');
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > detail.outstandingBalance || (method === 'POS' && (value !== detail.outstandingBalance || !posCode.trim()))) {
      setDetailError('Nhập số tiền trong phạm vi còn phải thu. POS cần mã chuẩn chi và thu toàn bộ số dư.'); return;
    }
    const fingerprint = JSON.stringify([detail.invoiceNumber, value, method, posCode.trim(), note.trim()]);
    if (attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, key: createIdempotencyKey() };
    setBusy(true);
    try {
      const updated = await receptionApi.recordInvoicePayment(detail.invoiceNumber, { amount: value, paymentMethod: method, posApprovalCode: posCode, note, idempotencyKey: attempt.current.key });
      setDetail(updated); setAmount(String(updated.outstandingBalance)); setPosCode(''); setNote(''); attempt.current = {};
      setSuccess('Đã lưu khoản thanh toán.'); reload();
    } catch (e) { setDetailError(e.message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-black">Hóa đơn & Thu tiền</h1><p className="text-sm text-slate-500 mt-1">Tra cứu chứng từ, thu số dư và in hoặc xuất hóa đơn đã lưu.</p></div>
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); setFilter({ query, page: 1, version: filter.version + 1 }); }}>
      <input aria-label="Tìm hóa đơn" className={counterInput} maxLength={200} value={query} onChange={e => setQuery(e.target.value)} placeholder="Mã hóa đơn, mã hoặc tên thành viên" />
      <button className={counterButton} disabled={busy || loading}>Tìm kiếm</button>
    </form>
    <CounterError message={error} retry={reload} />
    {loading && <p role="status">Đang tải hóa đơn...</p>}
    {data && <div className="rounded-xl border bg-white overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50"><tr>{['Hóa đơn / Ngày lập', 'Thành viên', 'Tổng tiền', 'Trạng thái', ''].map((h, i) => <th key={i} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{data.items.map(row => <tr key={row.id} className="border-t"><td className="p-3"><strong>{row.invoiceNumber}</strong><span className="block text-xs text-slate-500">{formatMemberDateTime(row.issuedAt)}</span></td>
          <td className="p-3">{row.memberName}<span className="block text-xs text-slate-500">{row.memberCode}</span></td><td className="p-3 whitespace-nowrap">{money(row.totalAmount)}</td><td className="p-3">{invoiceStatus(row.status)}</td>
          <td className="p-3"><button className={counterButton} disabled={busy || opening} onClick={() => open(row.invoiceNumber)}>Xem hóa đơn</button></td></tr>)}</tbody></table></div>
      {!data.items.length && <p className="p-5 text-sm text-slate-500">Chưa có hóa đơn phù hợp.</p>}
      <div className="flex flex-wrap justify-between items-center gap-2 p-3 border-t text-xs"><span>Tổng số: {data.totalCount} · Trang {filter.page} / {Math.max(1, Math.ceil(data.totalCount / 20))}</span>
        <div className="flex gap-2"><button className={counterButton} disabled={busy || filter.page === 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>Trang trước</button><button className={counterButton} disabled={busy || filter.page * 20 >= data.totalCount} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Trang sau</button></div></div>
    </div>}
    {opening && <p role="status">Đang tải chi tiết hóa đơn...</p>}
    <CounterError message={detailError} />
    {success && <p role="status" className="text-emerald-700">{success}</p>}
    {detail && <section aria-label="Chi tiết hóa đơn" className="rounded-xl border bg-white p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-bold break-all">{detail.invoiceNumber}</h2><p>{detail.memberName} · {detail.memberCode}</p><p className="text-sm text-slate-500">{detail.centerName} · {formatMemberDateTime(detail.issuedAtUtc)}</p></div>
        <div className="flex flex-wrap gap-2 items-start"><button className={counterButton} disabled={busy} onClick={() => printInvoice(detail)}>In / Lưu PDF</button><button className={counterButton} disabled={busy} onClick={() => downloadInvoice(detail)}>Xuất CSV</button></div></div>
      <p className="font-bold">{invoiceStatus(detail.status)}</p>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Dịch vụ', 'Số lượng', 'Đơn giá', 'Thành tiền'].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{detail.items.map((item, index) => <tr key={index} className="border-t"><td className="p-2">{item.description}</td><td className="p-2">{item.quantity}</td><td className="p-2 whitespace-nowrap">{money(item.unitPrice)}</td><td className="p-2 whitespace-nowrap">{money(item.amount)}</td></tr>)}</tbody></table></div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">{[['Tạm tính', detail.subtotal], ['Giảm giá', detail.discount], ['Thuế', detail.tax], ['Tổng tiền', detail.totalAmount], ['Đã thanh toán', detail.amountPaid], ['Còn phải thu', detail.outstandingBalance]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">{label}</p><strong>{money(value)}</strong></div>)}</div>
      <h3 className="font-bold">Lịch sử thanh toán</h3>
      {!detail.payments.length && <p className="text-sm text-slate-500">Chưa ghi nhận thanh toán.</p>}
      {detail.payments.map(p => <div key={p.id} className="text-sm rounded-lg border p-3 break-words"><p>{p.paymentMethod} · {money(p.amount)} · {p.status}</p><p className="text-xs text-slate-500">{p.transactionCode} · {formatMemberDateTime(p.paidAtUtc || p.createdAtUtc)}</p>{(p.refunds || []).map(r => <p key={r.id} className="mt-2">Hoàn tiền: {money(r.amount)} · {r.status} · {r.reason}</p>)}</div>)}
      {['Issued', 'PartiallyPaid'].includes(detail.status) && detail.outstandingBalance > 0 && <form onSubmit={record} className="space-y-3 border-t pt-4">
        <h3 className="font-bold">Ghi nhận khoản thu tiếp</h3><fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Số tiền thu (VNĐ)<input aria-label="Số tiền thu tiếp" type="number" min="0.01" step="0.01" max={detail.outstandingBalance} required className={counterInput} value={amount} onChange={e => setAmount(e.target.value)} /></label>
          <label className="text-sm">Phương thức<select className={counterInput} aria-label="Phương thức thu tiếp" value={method} onChange={e => { setMethod(e.target.value); if (e.target.value === 'POS') setAmount(String(detail.outstandingBalance)); }}><option value="CASH">Tiền mặt</option><option value="POS">Thẻ POS</option></select></label>
          {method === 'POS' && <label className="text-sm">Mã chuẩn chi POS<input className={counterInput} required maxLength={100} value={posCode} onChange={e => setPosCode(e.target.value)} /></label>}
          <label className="text-sm">Ghi chú<input className={counterInput} maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label>
        </fieldset><button className={counterButton} disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu khoản thu'}</button>
      </form>}
    </section>}
  </div>;
}
