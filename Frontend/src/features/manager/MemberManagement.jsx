import React, { useEffect, useRef, useState } from 'react';
import { memberApi, receptionApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { useToast } from '../../context/ToastContext.js';
import {
  buildMemberUpdatePayload,
  formatMembershipDate,
  formatMembershipDateTime,
  formatMembershipDuration,
  formatMembershipPrice,
  getAccountPresentation,
  getSubscriptionPresentation,
  normalizeSubscriptionHistory
} from './memberManagementView.js';

const field = 'w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';
const button = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-semibold transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
const actionButton = 'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);

export function MemberManagement() {
  const { showSuccess, showError } = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState({ query: '', page: 1 });
  const [data, setData] = useState({ items: [], totalCount: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [subscriptionState, setSubscriptionState] = useState({ items: [], loading: false, error: '' });
  const subscriptionRequest = useRef(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    memberApi.getCenterMembers(filter.query, filter.page).then(value => { if (active) setData(value); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, revision]);
  const open = row => {
    setForm(row ? { ...row } : { username: '', fullName: '', email: '', password: '', phone: '', dateOfBirth: '' });
    setModal({ type: 'edit', row });
  };
  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try {
      if (modal.row) await memberApi.updateAtCenter(modal.row.memberId, buildMemberUpdatePayload(form));
      else await receptionApi.createMember(form);
      showSuccess(modal.row ? 'Đã cập nhật thành viên.' : 'Đã tạo thành viên.');
      setModal(null); setRevision(x => x + 1);
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  };
  const toggleStatus = async () => {
    const account = getAccountPresentation(modal.row.accountStatus);
    setBusy(true);
    try {
      await memberApi.setAccountStatus(modal.row.memberId, account.isActive ? 'Disabled' : 'Active');
      showSuccess('Đã cập nhật trạng thái tài khoản.'); setModal(null); setRevision(x => x + 1);
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  };
  const viewSubscriptions = async row => {
    const requestId = ++subscriptionRequest.current;
    setModal({ type: 'subscriptions', row });
    setSubscriptionState({ items: [], loading: true, error: '' });
    try {
      const result = await receptionApi.getMemberSubscriptions(row.memberId);
      if (subscriptionRequest.current === requestId) {
        setSubscriptionState({ items: normalizeSubscriptionHistory(result), loading: false, error: '' });
      }
    } catch (e) {
      if (subscriptionRequest.current === requestId) {
        setSubscriptionState({ items: [], loading: false, error: e.message || 'Không thể tải lịch sử gói.' });
      }
    }
  };
  const closeModal = () => {
    if (busy) return;
    if (modal?.type === 'subscriptions') subscriptionRequest.current += 1;
    setModal(null);
  };
  const columns = [
    { header: 'Thành viên', render: r => <div><strong>{r.fullName}</strong><p className="text-xs text-slate-500">{r.memberCode} · {r.username}</p></div> },
    { header: 'Liên hệ', render: r => <div>{r.email}<p className="text-xs">{r.phone || 'Chưa có điện thoại'}</p></div> },
    { header: 'Tài khoản', render: r => {
      const account = getAccountPresentation(r.accountStatus);
      return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${account.badgeClass}`}>
        <span className="material-symbols-outlined text-[15px]">{account.isActive ? 'check_circle' : 'lock'}</span>
        {account.label}
      </span>;
    } },
    { header: 'Gói tập', render: r => {
      const subscription = getSubscriptionPresentation(r.packageStatus);
      return <div className="min-w-40"><p className="font-semibold text-slate-800">{r.packageName || 'Chưa đăng ký gói'}</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className={`rounded-full border px-2 py-0.5 font-semibold ${subscription.className}`}>{subscription.label}</span>
          {r.packageExpiry && <span>Hết hạn {formatMembershipDate(r.packageExpiry)}</span>}
        </p>
      </div>;
    } },
    { header: 'Thao tác', render: r => {
      const account = getAccountPresentation(r.accountStatus);
      return <div className="flex min-w-max flex-wrap gap-2">
        <button className={`${actionButton} bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400`} disabled={busy} onClick={() => open(r)}>
          <span className="material-symbols-outlined text-[16px]">edit</span>Sửa hồ sơ
        </button>
        <button className={`${actionButton} bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-400`} disabled={busy} onClick={() => viewSubscriptions(r)}>
          <span className="material-symbols-outlined text-[16px]">history</span>Lịch sử gói
        </button>
        <button className={`${actionButton} ${account.actionClass}`} disabled={busy} onClick={() => setModal({ type: 'status', row: r })}>
          <span className="material-symbols-outlined text-[16px]">{account.actionIcon}</span>{account.actionLabel}
        </button>
      </div>;
    } }
  ];
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Quản lý thành viên</h1><p className="text-sm text-slate-500">Hồ sơ, trạng thái tài khoản và gói tập của thành viên trong trung tâm.</p></div><button className={button} disabled={busy} onClick={() => open(null)}><span className="material-symbols-outlined text-[18px]">person_add</span>Thêm thành viên</button></div>
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); if (query.trim().length === 1) { showError('Nhập ít nhất 2 ký tự hoặc để trống để xem tất cả.'); return; } setFilter({ query: query.trim(), page: 1 }); }}>
      <input className={`${field} sm:max-w-md`} aria-label="Tìm thành viên" placeholder="Tên, mã thẻ, email hoặc số điện thoại" maxLength={100} value={query} onChange={e => setQuery(e.target.value)} />
      <button className={button} disabled={loading}>Tìm kiếm</button><button type="button" className={secondaryButton} disabled={loading} onClick={() => { setQuery(''); setFilter({ query: '', page: 1 }); }}>Xem tất cả</button>
    </form>
    {loading ? <LoadingSpinner text="Đang tải thành viên..." /> : error ? <div role="alert" className="p-4 bg-red-50 rounded"><p>{error}</p><button className={button} onClick={() => setRevision(x => x + 1)}>Thử lại</button></div> : <>
      <p className="text-sm">Tổng số: {data.totalCount} thành viên</p>
      <Table key={`${filter.query}:${filter.page}:${revision}`} columns={columns} data={data.items} pageSize={20} emptyMessage="Chưa có thành viên phù hợp" />
      <div className="flex flex-wrap items-center gap-3 text-sm"><button className={secondaryButton} disabled={filter.page <= 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>Trang trước</button><span>Trang {filter.page} / {totalPages}</span><button className={secondaryButton} disabled={filter.page >= totalPages} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Trang sau</button></div>
    </>}
    <Modal
      isOpen={Boolean(modal)}
      onClose={closeModal}
      maxWidth={modal?.type === 'subscriptions' ? 'max-w-4xl' : 'max-w-lg'}
      title={modal?.type === 'status' ? 'Trạng thái tài khoản' : modal?.type === 'subscriptions' ? `Lịch sử gói · ${modal.row.fullName}` : modal?.row ? 'Cập nhật thành viên' : 'Thêm thành viên'}
    >
      {modal?.type === 'edit' && <form className="space-y-3" onSubmit={save}>
        {!modal.row && <><label className="block">Tên đăng nhập<input className={field} name="username" required minLength={3} maxLength={100} pattern="[a-zA-Z0-9._-]+" value={form.username} onChange={change} /></label><label className="block">Mật khẩu ban đầu<input className={field} type="password" autoComplete="new-password" name="password" required minLength={6} maxLength={128} value={form.password} onChange={change} /><span className="text-xs text-slate-500">6–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt; không chứa khoảng trắng.</span></label></>}
        <label className="block">Họ tên<input className={field} name="fullName" required maxLength={150} value={form.fullName || ''} onChange={change} /></label>
        <label className="block">Email
          <input
            className={`${field} ${modal.row ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500' : ''}`}
            name="email"
            type="email"
            required
            readOnly={Boolean(modal.row)}
            aria-describedby={modal.row ? 'member-email-readonly-note' : undefined}
            maxLength={150}
            value={form.email || ''}
            onChange={modal.row ? undefined : change}
          />
          {modal.row && <span id="member-email-readonly-note" className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[14px]">lock</span>Email định danh không thể thay đổi tại màn hình quản lý thành viên.
          </span>}
        </label>
        <label className="block">Điện thoại<input className={field} name="phone" type="tel" maxLength={20} value={form.phone || ''} onChange={change} /></label>
        <label className="block">Ngày sinh<input className={field} name="dateOfBirth" type="date" required={Boolean(modal.row?.dateOfBirth)} max={today()} value={form.dateOfBirth || ''} onChange={change} /></label>
        {modal.row && <><label className="block">Giới tính<select className={field} name="gender" value={form.gender || ''} onChange={change}><option value="" disabled={Boolean(modal.row.gender)}>Chưa cung cấp</option><option value="Male">Nam</option><option value="Female">Nữ</option><option value="Other">Khác</option></select></label><label className="block">Địa chỉ<input className={field} name="address" maxLength={255} value={form.address || ''} onChange={change} /></label></>}
        <button className={button} type="submit" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu thành viên'}</button>
      </form>}
      {modal?.type === 'status' && (() => {
        const account = getAccountPresentation(modal.row.accountStatus);
        return <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${account.isActive ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <p className="font-semibold text-slate-900">{account.actionLabel} tài khoản của {modal.row.fullName}?</p>
            <p className="mt-1 text-sm text-slate-600">{account.isActive ? 'Thành viên sẽ không thể đăng nhập cho đến khi tài khoản được mở lại.' : 'Thành viên có thể đăng nhập và sử dụng lại các chức năng được cấp quyền.'}</p>
          </div>
          <button className={`${actionButton} px-4 py-2 ${account.actionClass}`} disabled={busy} onClick={toggleStatus}>
            <span className="material-symbols-outlined text-[17px]">{account.actionIcon}</span>{busy ? 'Đang cập nhật...' : `Xác nhận ${account.actionLabel.toLowerCase()}`}
          </button>
        </div>;
      })()}
      {modal?.type === 'subscriptions' && <div className="space-y-4">
        {subscriptionState.loading ? <LoadingSpinner text="Đang tải lịch sử gói..." /> : subscriptionState.error ? <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined">error</span>
            <div className="space-y-3"><div><p className="font-bold">Không thể tải lịch sử gói</p><p className="mt-1 text-sm">{subscriptionState.error}</p></div>
              <button className={`${actionButton} bg-rose-600 px-3 py-2 text-white hover:bg-rose-700 focus:ring-rose-500`} onClick={() => viewSubscriptions(modal.row)}>
                <span className="material-symbols-outlined text-[16px]">refresh</span>Thử lại
              </button>
            </div>
          </div>
        </div> : subscriptionState.items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">card_membership</span>
          <p className="mt-3 font-semibold text-slate-700">Chưa có lịch sử đăng ký gói</p>
          <p className="mt-1 text-sm text-slate-500">Các gói thành viên đã đăng ký sẽ xuất hiện tại đây.</p>
        </div> : <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-300">Tổng lịch sử</p><p className="text-lg font-bold">{subscriptionState.items.length} gói đăng ký</p></div>
            <p className="text-xs text-slate-300">Sắp xếp mới nhất trước</p>
          </div>
          <div className="space-y-3">{subscriptionState.items.map((subscription, index) => {
            const status = getSubscriptionPresentation(subscription.status);
            return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" key={subscription.subscriptionId}>
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">card_membership</span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-slate-900">{subscription.packageName || 'Gói không xác định'}</h4>{index === 0 && <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">Gần nhất</span>}</div><p className="text-xs text-slate-500">Mã đăng ký #{subscription.subscriptionId}</p></div>
                </div>
                <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${status.className}`}><span className="material-symbols-outlined text-[15px]">{status.icon}</span>{status.label}</span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Học phí</p><p className="mt-1 font-bold text-slate-900">{formatMembershipPrice(subscription.price)}</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Thời hạn</p><p className="mt-1 font-bold text-slate-900">{formatMembershipDuration(subscription.durationDays)}</p></div>
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ngày đăng ký</p><p className="mt-1 font-bold text-slate-900">{formatMembershipDateTime(subscription.createdAt)}</p></div>
              </div>
              <div className="mx-4 mb-4 flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs text-slate-500">Bắt đầu</p><p className="font-semibold text-slate-800">{formatMembershipDate(subscription.startDate, 'Chưa kích hoạt')}</p></div>
                <span className="material-symbols-outlined hidden text-blue-400 sm:block">arrow_forward</span>
                <div className="sm:text-right"><p className="text-xs text-slate-500">Kết thúc</p><p className="font-semibold text-slate-800">{formatMembershipDate(subscription.endDate, 'Chưa xác định')}</p></div>
              </div>
            </article>;
          })}</div>
        </>}
      </div>}
    </Modal>
  </div>;
}
