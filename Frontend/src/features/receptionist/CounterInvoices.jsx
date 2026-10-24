import React, { useEffect, useRef, useState } from 'react';
import { receptionApi } from '../../services/api.js';
import { createIdempotencyKey } from '../../services/http.js';
import { downloadInvoice, invoiceStatus, printInvoice } from '../../services/invoiceExport.js';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { counterButton, counterInput, counterQuery, CounterError } from './ReceptionistShared.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.js';
import { RefundManagement } from '../manager/RefundManagement.jsx';

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
  const [warning, setWarning] = useState('');
  const attempt = useRef({});
  const sequence = useRef(0);

  const { currentUser, role: authRole } = useAuth();
  const currentRole = String(authRole || currentUser?.role || localStorage.getItem('role') || '').toUpperCase();
  const isManagerOrAdmin = currentRole === 'MANAGER' || currentRole === 'ADMIN';
  const [workspaceTab, setWorkspaceTab] = useState(() =>
    window.location.hash.includes('tab=refunds') ? 'refunds' : 'invoices');

  const changeWorkspaceTab = tab => {
    setWorkspaceTab(tab);
    if (isManagerOrAdmin) window.location.hash = `#/manager/invoices?tab=${tab}`;
  };

  useEffect(() => {
    if (!isManagerOrAdmin) return undefined;
    const syncTabFromHash = () => setWorkspaceTab(
      window.location.hash.includes('tab=refunds') ? 'refunds' : 'invoices');
    window.addEventListener('hashchange', syncTabFromHash);
    syncTabFromHash();
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, [isManagerOrAdmin]);

  // Reconcile Modal State
  const [reconcileTarget, setReconcileTarget] = useState(null);
  const [reconcileForm, setReconcileForm] = useState({
    status: 'Succeeded',
    providerTransactionId: '',
    confirmedAmount: '',
    evidenceNote: ''
  });
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const [reconcileError, setReconcileError] = useState('');

  // Void Modal State
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [voidBusy, setVoidBusy] = useState(false);
  const [voidError, setVoidError] = useState('');

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
    setWarning('');
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
    setWarning('');
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

  const openReconcileModal = payment => {
    setReconcileTarget(payment);
    setReconcileForm({
      status: 'Succeeded',
      providerTransactionId: payment.providerTransactionId || payment.transactionCode || '',
      confirmedAmount: String(payment.amount || ''),
      evidenceNote: ''
    });
    setReconcileError('');
  };

  const handleReconcileSubmit = async e => {
    e.preventDefault();
    if (!reconcileTarget) return;
    setReconcileError('');
    if (reconcileForm.status === 'Succeeded' && !reconcileForm.providerTransactionId.trim()) {
      setReconcileError(isEn ? 'Provider transaction ID is required when marking as Succeeded.' : 'Cần nhập mã giao dịch ngân hàng / cổng thanh toán khi chọn Thành công.');
      return;
    }
    if (reconcileForm.evidenceNote.trim().length < 10) {
      setReconcileError(isEn ? 'Evidence note must be at least 10 characters.' : 'Ghi chú bằng chứng đối soát phải có ít nhất 10 ký tự.');
      return;
    }
    setReconcileBusy(true);
    try {
      const ref = reconcileTarget.gatewayReference || String(reconcileTarget.id);
      const res = await receptionApi.reconcilePayment(ref, {
        status: reconcileForm.status,
        providerTransactionId: reconcileForm.providerTransactionId.trim() || null,
        confirmedAmount: reconcileForm.confirmedAmount ? Number(reconcileForm.confirmedAmount) : null,
        evidenceNote: reconcileForm.evidenceNote.trim()
      });
      setSuccess(res.message || (isEn ? 'Payment reconciled successfully.' : 'Đã đối soát giao dịch thành công.'));
      setReconcileTarget(null);
      const updated = await receptionApi.getInvoice(detail.invoiceNumber);
      setDetail(updated);
      reload();
    } catch (err) {
      setReconcileError(err.message || (isEn ? 'Failed to reconcile payment.' : 'Lỗi khi đối soát giao dịch.'));
    } finally {
      setReconcileBusy(false);
    }
  };

  const openVoidModal = invoiceNumber => {
    setVoidTarget(invoiceNumber);
    setVoidReason('');
    setVoidError('');
  };

  const handleVoidSubmit = async e => {
    e.preventDefault();
    if (!voidTarget) return;
    setVoidError('');
    if (voidReason.trim().length < 5) {
      setVoidError(isEn ? 'Void reason must be at least 5 characters.' : 'Lý do hủy hóa đơn phải từ 5 ký tự trở lên.');
      return;
    }
    setVoidBusy(true);
    try {
      const res = await receptionApi.voidCounterInvoice(voidTarget, voidReason.trim());
      setSuccess(res.message || (isEn ? 'Invoice voided successfully.' : 'Đã hủy hóa đơn chưa thu tiền.'));
      setVoidTarget(null);
      const updated = await receptionApi.getInvoice(detail.invoiceNumber);
      setDetail(updated);
      reload();
    } catch (err) {
      setVoidError(err.message || (isEn ? 'Failed to void invoice.' : 'Lỗi khi hủy hóa đơn.'));
    } finally {
      setVoidBusy(false);
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
            {isManagerOrAdmin
              ? (isEn ? 'FINANCIAL RESOLUTION & INVOICE MANAGEMENT' : 'QUẢN LÝ TÀI CHÍNH & XỬ LÝ HÓA ĐƠN')
              : (isEn ? 'BILLING & CASHIER OPERATIONS' : 'HÓA ĐƠN & NGHIỆP VỤ THU NGÂN')}
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1 text-white tracking-tight">
            {isManagerOrAdmin
              ? (isEn ? 'Invoices & Refund Requests' : 'Quản lý hóa đơn & Yêu cầu hoàn tiền')
              : (isEn ? 'Invoices & Counter Cashiering' : 'Hóa Đơn & Thu Tiền Tại Quầy')}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {isManagerOrAdmin
              ? (isEn
                  ? 'Review invoice details and process member refund requests in one financial workspace.'
                  : 'Xem chi tiết hóa đơn và xử lý yêu cầu hoàn tiền của hội viên trong cùng một màn hình.')
              : (isEn
                  ? 'Look up receipts, collect outstanding balance, and print or export customer invoices.'
                  : 'Tra cứu chứng từ, thu số dư và in hoặc xuất hóa đơn đã lưu.')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          {isManagerOrAdmin ? (
            <>
              <a
                href="#/manager/dashboard"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/15 hover-lift flex items-center gap-2 backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">dashboard</span>
                <span>{isEn ? 'Dashboard' : 'Bảng Quản Trị'}</span>
              </a>
              <a
                href="#/manager/reports"
                className="px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover-lift flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">analytics</span>
                <span>{isEn ? 'Financial Reports' : 'Báo Cáo Doanh Thu'}</span>
              </a>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {isManagerOrAdmin && (
        <nav className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {[
            ['invoices', 'receipt_long', isEn ? 'Invoices' : 'Hóa đơn'],
            ['refunds', 'currency_exchange', isEn ? 'Refund requests' : 'Yêu cầu hoàn tiền']
          ].map(([id, icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => changeWorkspaceTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                workspaceTab === id ? 'bg-[#1E2235] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      )}

      {isManagerOrAdmin && workspaceTab === 'refunds' ? <RefundManagement embedded /> : <>
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
                        className="px-3.5 py-2 bg-[#1E2235] hover:bg-[#2B2D42] text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                        disabled={busy || opening}
                        onClick={() => open(row.invoiceNumber)}
                      >
                        <span className="material-symbols-outlined text-[15px]">manage_search</span>
                <span>{isEn ? 'View details' : 'Xem chi tiết'}</span>
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
      {warning && (
        <p role="status" className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
          {warning}
        </p>
      )}

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
              {!isManagerOrAdmin && ['Issued', 'PartiallyPaid'].includes(detail.status) && !(detail.payments || []).some(p => p.status === 'Succeeded') && (
                <button
                  className="px-4 py-2 border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  disabled={busy}
                  onClick={() => openVoidModal(detail.invoiceNumber)}
                  title={isEn ? 'Void unpaid invoice' : 'Hủy hóa đơn chưa thanh toán (Cơ chế 3)'}
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  <span>{isEn ? 'Void Unpaid' : 'Hủy hóa đơn (Cơ chế 3)'}</span>
                </button>
              )}
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
              detail.payments.map(p => {
                const canReconcile = !isManagerOrAdmin && ['Pending', 'ReviewRequired', 'Failed'].includes(p.status);
                const reservedRefundAmount = (p.refunds || [])
                  .filter(r => ['Pending', 'Approved', 'Succeeded'].includes(r.status))
                  .reduce((acc, cur) => acc + cur.amount, 0);
                const refundable = Math.max(0, p.amount - reservedRefundAmount);

                return (
                  <div key={p.id} className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-2">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.paymentMethod} · <span className="font-mono">{money(p.amount)}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'Succeeded' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
                          p.status === 'ReviewRequired' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 animate-pulse' :
                          p.status === 'Failed' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}>
                          {p.status}
                        </span>
                        {canReconcile && (
                          <button
                            type="button"
                            onClick={() => openReconcileModal(p)}
                            className="px-3 py-1.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover-lift"
                            title={isEn ? 'Reconcile this transaction' : 'Đối soát giao dịch thủ công (Cơ chế 1)'}
                          >
                            <span className="material-symbols-outlined text-[15px]">fact_check</span>
                            {isEn ? 'Reconcile (Cơ chế 1)' : 'Đối soát (Cơ chế 1)'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex flex-wrap gap-x-3">
                      <span>Ref: {p.transactionCode || p.gatewayReference || `#${p.id}`}</span>
                      <span>•</span>
                      <span>{formatMemberDateTime(p.paidAtUtc || p.createdAtUtc)}</span>
                      {p.providerTransactionId && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 dark:text-indigo-400">Gateway TID: {p.providerTransactionId}</span>
                        </>
                      )}
                    </div>
                    {(p.refunds || []).map(r => (
                      <div key={r.id} className="mt-1 text-[11px] bg-rose-50/50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[#B85C45] dark:text-rose-300 space-y-0.5">
                          <p>
                            {isEn ? 'Refund' : 'Hoàn tiền'}: <strong>{money(r.amount)}</strong> · {isEn ? 'Status' : 'Trạng thái'}: <strong>{r.status}</strong> · {isEn ? 'Reason' : 'Lý do'}: {r.reason}
                          </p>
                          {(r.providerRefundId || r.externalRefundReference) && (
                            <p className="font-mono text-slate-500 dark:text-slate-400">
                              Ref: {r.providerRefundId || r.externalRefundReference}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {/* Collect Subsequent Payment Form */}
          {!isManagerOrAdmin && ['Issued', 'PartiallyPaid'].includes(detail.status) && detail.outstandingBalance > 0 && (
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

      {/* RECONCILE MODAL */}
      {reconcileTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] uppercase font-bold text-[#2D6A4F] dark:text-[#81B29A] tracking-wider">
                  {isEn ? 'FINANCIAL RECONCILIATION' : 'ĐỐI SOÁT GIAO DỊCH NGÂN HÀNG'}
                </span>
                <h3 className="text-lg font-black font-chivo text-slate-900 dark:text-white mt-0.5">
                  {isEn ? 'Reconcile Pending Payment' : 'Xác Nhận Đối Soát Khoản Thu'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReconcileTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Payment Method:' : 'Phương thức:'}</span>
                <strong className="text-slate-900 dark:text-white">{reconcileTarget.paymentMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Expected Amount:' : 'Số tiền ghi nhận:'}</span>
                <strong className="text-slate-900 dark:text-white font-mono">{money(reconcileTarget.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Reference:' : 'Mã tham chiếu:'}</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{reconcileTarget.gatewayReference || `#${reconcileTarget.id}`}</span>
              </div>
            </div>

            {reconcileError && (
              <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                {reconcileError}
              </div>
            )}

            <form onSubmit={handleReconcileSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Reconciliation Result *' : 'Kết quả đối soát *'}
                </label>
                <select
                  value={reconcileForm.status}
                  onChange={e => setReconcileForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#81B29A]"
                >
                  <option value="Succeeded">{isEn ? 'Succeeded (Money received in bank account)' : 'Thành công (Tiền đã vào tài khoản ngân hàng)'}</option>
                  <option value="Failed">{isEn ? 'Failed (Money not received / cancelled)' : 'Thất bại (Không nhận được tiền)'}</option>
                </select>
              </div>

              {reconcileForm.status === 'Succeeded' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isEn ? 'Bank / Gateway Transaction ID *' : 'Mã giao dịch ngân hàng / Cổng thanh toán *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isEn ? 'e.g. VCB123456789 or VNP14567890' : 'VD: FT24295123456 hoặc VNP14567890'}
                      value={reconcileForm.providerTransactionId}
                      onChange={e => setReconcileForm(f => ({ ...f, providerTransactionId: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-xs focus:ring-2 focus:ring-[#81B29A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isEn ? 'Confirmed Amount (VNĐ)' : 'Số tiền thực tế nhận (VNĐ)'}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder={String(reconcileTarget.amount)}
                      value={reconcileForm.confirmedAmount}
                      onChange={e => setReconcileForm(f => ({ ...f, confirmedAmount: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-xs font-mono focus:ring-2 focus:ring-[#81B29A]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Evidence / Verification Note (min 10 chars) *' : 'Ghi chú bằng chứng đối soát (tối thiểu 10 ký tự) *'}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={isEn ? 'e.g. Checked bank statement at 15:30, amount and sender matched.' : 'VD: Đã kiểm tra sao kê ngân hàng lúc 15:30, khớp số tiền và người gửi.'}
                  value={reconcileForm.evidenceNote}
                  onChange={e => setReconcileForm(f => ({ ...f, evidenceNote: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-xs focus:ring-2 focus:ring-[#81B29A]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={reconcileBusy}
                  onClick={() => setReconcileTarget(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                >
                  {isEn ? 'Cancel' : 'Hủy bỏ'}
                </button>
                <button
                  type="submit"
                  disabled={reconcileBusy}
                  className="px-5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-bold uppercase tracking-wider shadow-md hover-lift flex items-center gap-1.5"
                >
                  {reconcileBusy && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                  <span>{reconcileBusy ? (isEn ? 'Processing...' : 'Đang xử lý...') : (isEn ? 'Confirm Reconcile' : 'Xác Nhận Đối Soát')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID MODAL */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                  {isEn ? 'VOID UNPAID INVOICE' : 'HỦY HÓA ĐƠN CHƯA THU TIỀN'}
                </span>
                <h3 className="text-lg font-black font-chivo text-slate-900 dark:text-white mt-0.5">
                  {isEn ? 'Void Invoice Confirmation' : 'Xác Nhận Hủy Hóa Đơn'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVoidTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isEn
                ? `You are about to void invoice ${voidTarget}. All pending payment attempts will be voided and associated subscriptions will be cancelled.`
                : `Bạn sắp hủy hóa đơn ${voidTarget}. Toàn bộ lần thử thanh toán chờ sẽ bị hủy và đăng ký gói liên quan sẽ được chuyển sang trạng thái Đã hủy.`}
            </p>

            {voidError && (
              <div role="alert" className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900">
                {voidError}
              </div>
            )}

            <form onSubmit={handleVoidSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isEn ? 'Void Reason (min 5 chars) *' : 'Lý do hủy hóa đơn (tối thiểu 5 ký tự) *'}
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  placeholder={isEn ? 'e.g. Customer cancelled order' : 'VD: Khách hàng đổi ý không đăng ký gói này'}
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={voidBusy}
                  onClick={() => setVoidTarget(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold"
                >
                  {isEn ? 'Back' : 'Quay lại'}
                </button>
                <button
                  type="submit"
                  disabled={voidBusy}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-md hover-lift flex items-center gap-1.5"
                >
                  {voidBusy && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                  <span>{voidBusy ? (isEn ? 'Voiding...' : 'Đang hủy...') : (isEn ? 'Confirm Void' : 'Xác Nhận Hủy')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
