import React, { useEffect, useRef, useState } from 'react';
import { receptionApi } from '../../services/api.js';
import { createIdempotencyKey } from '../../services/http.js';
import { downloadInvoice, invoiceStatus, printInvoice } from '../../services/invoiceExport.js';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { counterButton, counterInput, counterQuery, CounterError } from './ReceptionistShared.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} VNĐ`;

export function CounterInvoices() {
  const { language } = useLanguage();
  const isEn = language === 'en';

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

  const getStatusText = status => {
    if (isEn) {
      const map = {
        Paid: 'Paid in Full',
        PartiallyPaid: 'Partially Paid',
        Issued: 'Unpaid',
        Pending: 'Pending Payment',
        Cancelled: 'Cancelled',
        Refunded: 'Refunded'
      };
      return map[status] || status;
    }
    return invoiceStatus(status);
  };

  const getStatusBadge = status => {
    const s = String(status || '').toLowerCase();
    if (s.includes('paid') && !s.includes('partial')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    }
    if (s.includes('partial') || s.includes('pending')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
    }
    if (s.includes('cancel') || s.includes('refund')) {
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
    return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
  };

  const reload = () => setFilter(f => ({ ...f, version: f.version + 1 }));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setData(null);
    receptionApi
      .getInvoices(filter)
      .then(result => {
        if (active) setData(result);
      })
      .catch(e => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  useEffect(() => () => {
    sequence.current += 1;
  }, []);

  const open = async number => {
    const id = ++sequence.current;
    setOpening(true);
    setDetail(null);
    setDetailError('');
    setSuccess('');
    setNote('');
    setPosCode('');
    setMethod('CASH');
    try {
      const invoice = await receptionApi.getInvoice(number);
      if (id === sequence.current) {
        setDetail(invoice);
        setAmount(String(invoice.outstandingBalance));
      }
    } catch (e) {
      if (id === sequence.current) setDetailError(e.message);
    } finally {
      if (id === sequence.current) setOpening(false);
    }
  };

  const record = async event => {
    event.preventDefault();
    setDetailError('');
    setSuccess('');
    const value = Number(amount);
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      value > detail.outstandingBalance ||
      (method === 'POS' && (value !== detail.outstandingBalance || !posCode.trim()))
    ) {
      setDetailError(
        isEn
          ? 'Enter an amount within remaining balance. POS requires full balance and approval code.'
          : 'Nhập số tiền trong phạm vi còn phải thu. POS cần mã chuẩn chi và thu toàn bộ số dư.'
      );
      return;
    }
    const fingerprint = JSON.stringify([detail.invoiceNumber, value, method, posCode.trim(), note.trim()]);
    if (attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, key: createIdempotencyKey() };
    setBusy(true);
    try {
      const updated = await receptionApi.recordInvoicePayment(detail.invoiceNumber, {
        amount: value,
        paymentMethod: method,
        posApprovalCode: posCode,
        note,
        idempotencyKey: attempt.current.key
      });
      setDetail(updated);
      setAmount(String(updated.outstandingBalance));
      setPosCode('');
      setNote('');
      attempt.current = {};
      setSuccess(isEn ? 'Payment recorded successfully.' : 'Đã lưu khoản thanh toán.');
      reload();
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#1E2235] via-[#242A42] to-[#1E2235] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-white/10 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#81B29A]/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F2CC8F]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="font-chivo text-xs uppercase tracking-widest text-[#F2CC8F] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81B29A] animate-pulse" />
            {isEn ? 'BILLING & CASHIER OPERATIONS' : 'HÓA ĐƠN & NGHIỆP VỤ THU NGÂN'}
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1 text-white tracking-tight">
            {isEn ? 'Invoices & Counter Cashiering' : 'Hóa Đơn & Thu Tiền Tại Quầy'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {isEn
              ? 'Look up receipts, collect outstanding balance, and print or export customer invoices.'
              : 'Tra cứu chứng từ, thu số dư và in hoặc xuất hóa đơn đã lưu.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/counter-register"
            className="px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>{isEn ? 'New Sign-up / Renewal' : 'Đăng Ký / Gia Hạn'}</span>
          </a>
          <a
            href="#/receptionist/lookup"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/15 hover-lift flex items-center gap-2 backdrop-blur-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">person_search</span>
            <span>{isEn ? 'Member Lookup' : 'Tra Cứu'}</span>
          </a>
        </div>
      </div>

      {/* Search Input Bar */}
      <form
        className="max-w-2xl bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 hover-lift transition-all"
        onSubmit={e => {
          e.preventDefault();
          setFilter({ query, page: 1, version: filter.version + 1 });
        }}
      >
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
            search
          </span>
          <input
            aria-label={isEn ? 'Search invoice' : 'Tìm hóa đơn'}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 text-slate-900 dark:text-white bg-transparent font-medium"
            maxLength={200}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={isEn ? 'Invoice number, member code or name...' : 'Mã hóa đơn, mã hoặc tên thành viên'}
          />
        </div>
        <button className={counterButton} disabled={busy || loading}>
          {loading ? (isEn ? 'Searching...' : 'Đang tìm...') : (isEn ? 'Search' : 'Tìm kiếm')}
        </button>
      </form>

      <CounterError message={error} retry={reload} />
      {loading && <p role="status" className="text-xs text-slate-500">{isEn ? 'Loading invoices...' : 'Đang tải hóa đơn...'}</p>}

      {/* Invoices Table Card */}
      {data && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover-lift transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs uppercase font-chivo font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {[
                    isEn ? 'Invoice / Issue Date' : 'Hóa đơn / Ngày lập',
                    isEn ? 'Member' : 'Thành viên',
                    isEn ? 'Total Amount' : 'Tổng tiền',
                    isEn ? 'Status' : 'Trạng thái',
                    ''
                  ].map((h, i) => (
                    <th key={i} className="p-3.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {data.items.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <strong className="font-mono text-slate-900 dark:text-white text-xs">{row.invoiceNumber}</strong>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatMemberDateTime(row.issuedAt)}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-white">{row.memberName}</span>
                      <span className="block text-[11px] text-[#2D6A4F] dark:text-[#81B29A] font-mono mt-0.5">{row.memberCode}</span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white font-mono">
                      {money(row.totalAmount)}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(row.status)}`}>
                        {getStatusText(row.status)}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        className="px-4 py-2 bg-[#1E2235] hover:bg-[#2B2D42] text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer disabled:opacity-50"
                        disabled={busy || opening}
                        onClick={() => open(row.invoiceNumber)}
                      >
                        {isEn ? 'View' : 'Xem hóa đơn'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.items.length && (
            <p className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'No invoices match the search filter.' : 'Chưa có hóa đơn phù hợp.'}
            </p>
          )}

          <div className="flex flex-wrap justify-between items-center gap-2 p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span>
              {isEn ? 'Total:' : 'Tổng số:'} {data.totalCount} · {isEn ? 'Page' : 'Trang'} {filter.page} / {Math.max(1, Math.ceil(data.totalCount / 20))}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                disabled={busy || filter.page === 1}
                onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
              >
                {isEn ? 'Previous' : 'Trang trước'}
              </button>
              <button
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                disabled={busy || filter.page * 20 >= data.totalCount}
                onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
              >
                {isEn ? 'Next' : 'Trang sau'}
              </button>
            </div>
          </div>
        </div>
      )}

      {opening && <p role="status" className="text-xs text-slate-500">{isEn ? 'Loading invoice details...' : 'Đang tải chi tiết hóa đơn...'}</p>}
      <CounterError message={detailError} />
      {success && <p role="status" className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{success}</p>}

      {/* Invoice Detail Section */}
      {detail && (
        <section
          aria-label={isEn ? 'Invoice Details' : 'Chi tiết hóa đơn'}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm hover-lift transition-all"
        >
          <div className="flex flex-wrap justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-mono text-[#2D6A4F] dark:text-[#81B29A] font-bold block uppercase tracking-wider">
                {isEn ? 'INVOICE NUMBER' : 'MÃ HÓA ĐƠN'}
              </span>
              <h2 className="text-xl font-black font-chivo text-slate-900 dark:text-white break-all mt-0.5">
                {detail.invoiceNumber}
              </h2>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                {detail.memberName} · <span className="font-mono">{detail.memberCode}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {detail.centerName} · {formatMemberDateTime(detail.issuedAtUtc)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-start">
              <button
                className="px-4 py-2 bg-[#1E2235] hover:bg-[#2B2D42] text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer flex items-center gap-1.5"
                disabled={busy}
                onClick={() => printInvoice(detail)}
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>{isEn ? 'Print / PDF' : 'In / Lưu PDF'}</span>
              </button>
              <button
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer flex items-center gap-1.5"
                disabled={busy}
                onClick={() => downloadInvoice(detail)}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>{isEn ? 'Export CSV' : 'Xuất CSV'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'Status:' : 'Trạng thái:'}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(detail.status)}`}>
              {getStatusText(detail.status)}
            </span>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                <tr>
                  {[
                    isEn ? 'Service / Item' : 'Dịch vụ',
                    isEn ? 'Quantity' : 'Số lượng',
                    isEn ? 'Unit Price' : 'Đơn giá',
                    isEn ? 'Total' : 'Thành tiền'
                  ].map(h => (
                    <th className="p-3" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detail.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.description}</td>
                    <td className="p-3">{item.quantity}</td>
                    <td className="p-3 whitespace-nowrap font-mono">{money(item.unitPrice)}</td>
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            {[
              [isEn ? 'Subtotal' : 'Tạm tính', detail.subtotal],
              [isEn ? 'Discount' : 'Giảm giá', detail.discount],
              [isEn ? 'Tax' : 'Thuế', detail.tax],
              [isEn ? 'Total Amount' : 'Tổng tiền', detail.totalAmount],
              [isEn ? 'Paid' : 'Đã thanh toán', detail.amountPaid],
              [isEn ? 'Remaining Due' : 'Còn phải thu', detail.outstandingBalance]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 border border-slate-100 dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider">{label}</p>
                <strong className="text-sm font-mono text-slate-900 dark:text-white block mt-1">{money(value)}</strong>
              </div>
            ))}
          </div>

          {/* Payment History */}
          <div className="space-y-3">
            <h3 className="font-chivo text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {isEn ? 'Payment Transactions History' : 'Lịch Sử Thanh Toán'}
            </h3>
            {!detail.payments.length ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">{isEn ? 'No payment transactions recorded yet.' : 'Chưa ghi nhận thanh toán.'}</p>
            ) : (
              detail.payments.map(p => (
                <div key={p.id} className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.paymentMethod} · <span className="font-mono">{money(p.amount)}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {p.transactionCode} · {formatMemberDateTime(p.paidAtUtc || p.createdAtUtc)}
                  </p>
                  {(p.refunds || []).map(r => (
                    <p key={r.id} className="mt-1 text-[#E07A5F] text-[11px]">
                      {isEn ? 'Refund' : 'Hoàn tiền'}: {money(r.amount)} · {r.status} · {r.reason}
                    </p>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Collect Subsequent Payment Form */}
          {['Issued', 'PartiallyPaid'].includes(detail.status) && detail.outstandingBalance > 0 && (
            <form onSubmit={record} className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="font-chivo text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {isEn ? 'Record Subsequent Balance Collection' : 'Ghi Nhận Khoản Thu Tiếp'}
              </h3>
              <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Collection Amount (VNĐ) *' : 'Số tiền thu (VNĐ) *'}
                  <input
                    aria-label={isEn ? 'Amount to collect' : 'Số tiền thu tiếp'}
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={detail.outstandingBalance}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Payment Method *' : 'Phương thức *'}
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                    aria-label={isEn ? 'Payment method' : 'Phương thức thu tiếp'}
                    value={method}
                    onChange={e => {
                      setMethod(e.target.value);
                      if (e.target.value === 'POS') setAmount(String(detail.outstandingBalance));
                    }}
                  >
                    <option value="CASH">{isEn ? 'Cash' : 'Tiền mặt'}</option>
                    <option value="POS">{isEn ? 'POS Card' : 'Thẻ POS'}</option>
                  </select>
                </label>
                {method === 'POS' && (
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isEn ? 'POS Approval Code *' : 'Mã chuẩn chi POS *'}
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                      required
                      maxLength={100}
                      value={posCode}
                      onChange={e => setPosCode(e.target.value)}
                    />
                  </label>
                )}
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isEn ? 'Receptionist Note' : 'Ghi chú'}
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                    maxLength={500}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </label>
              </fieldset>
              <button
                className="px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift cursor-pointer disabled:opacity-50"
                disabled={busy}
              >
                {busy ? (isEn ? 'Recording...' : 'Đang lưu...') : (isEn ? 'Save Payment Record' : 'Lưu khoản thu')}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
