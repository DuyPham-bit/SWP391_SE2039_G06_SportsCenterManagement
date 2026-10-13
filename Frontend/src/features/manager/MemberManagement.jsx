import React, { useEffect, useState } from 'react';
import { memberApi, receptionApi } from '../../services/api.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { useToast } from '../../context/ToastContext.js';

const field = 'w-full border border-slate-300 rounded-lg p-2 text-sm';
const button = 'px-3 py-2 bg-slate-900 text-white rounded-lg text-sm disabled:opacity-50';
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
  const [subscriptions, setSubscriptions] = useState([]);
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
      if (modal.row) await memberApi.updateAtCenter(modal.row.memberId, {
        fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone?.trim() || '',
        dateOfBirth: form.dateOfBirth || null, gender: form.gender || null, address: form.address || ''
      });
      else await receptionApi.createMember(form);
      showSuccess(modal.row ? 'Đã cập nhật thành viên.' : 'Đã tạo thành viên.');
      setModal(null); setRevision(x => x + 1);
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  };
  const toggleStatus = async () => {
    setBusy(true);
    try {
      await memberApi.setAccountStatus(modal.row.memberId, modal.row.accountStatus === 'Active' ? 'Disabled' : 'Active');
      showSuccess('Đã cập nhật trạng thái tài khoản.'); setModal(null); setRevision(x => x + 1);
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  };
  const viewSubscriptions = async row => {
    setBusy(true);
    try { setSubscriptions(await receptionApi.getMemberSubscriptions(row.memberId)); setModal({ type: 'subscriptions', row }); }
    catch (e) { showError(e.message); } finally { setBusy(false); }
  };
  const columns = [
    { header: 'Thành viên', render: r => <div><strong>{r.fullName}</strong><p className="text-xs text-slate-500">{r.memberCode} · {r.username}</p></div> },
    { header: 'Liên hệ', render: r => <div>{r.email}<p className="text-xs">{r.phone || 'Chưa có điện thoại'}</p></div> },
    { header: 'Tài khoản', render: r => <span>{r.accountStatus === 'Active' ? 'Hoạt động' : 'Đã khóa'}</span> },
    { header: 'Gói tập', render: r => <div>{r.packageName}<p className="text-xs">{r.packageStatus} {r.packageExpiry && `· Hết hạn ${r.packageExpiry}`}</p></div> },
    { header: 'Thao tác', render: r => <div className="flex flex-wrap gap-2">
      <button className={button} disabled={busy} onClick={() => open(r)}>Sửa hồ sơ</button>
      <button className={button} disabled={busy} onClick={() => viewSubscriptions(r)}>Lịch sử gói</button>
      <button className={button} disabled={busy} onClick={() => setModal({ type: 'status', row: r })}>{r.accountStatus === 'Active' ? 'Khóa' : 'Mở khóa'}</button>
    </div> }
  ];
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold">Quản lý thành viên</h1><p className="text-sm text-slate-500">Hồ sơ, trạng thái tài khoản và gói tập của thành viên trong trung tâm.</p></div><button className={button} disabled={busy} onClick={() => open(null)}>Thêm thành viên</button></div>
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); if (query.trim().length === 1) { showError('Nhập ít nhất 2 ký tự hoặc để trống để xem tất cả.'); return; } setFilter({ query: query.trim(), page: 1 }); }}>
      <input className={`${field} sm:max-w-md`} aria-label="Tìm thành viên" placeholder="Tên, mã thẻ, email hoặc số điện thoại" maxLength={100} value={query} onChange={e => setQuery(e.target.value)} />
      <button className={button} disabled={loading}>Tìm kiếm</button><button type="button" className={button} disabled={loading} onClick={() => { setQuery(''); setFilter({ query: '', page: 1 }); }}>Xem tất cả</button>
    </form>
    {loading ? <LoadingSpinner text="Đang tải thành viên..." /> : error ? <div role="alert" className="p-4 bg-red-50 rounded"><p>{error}</p><button className={button} onClick={() => setRevision(x => x + 1)}>Thử lại</button></div> : <>
      <p className="text-sm">Tổng số: {data.totalCount} thành viên</p>
      <Table key={`${filter.query}:${filter.page}:${revision}`} columns={columns} data={data.items} pageSize={20} emptyMessage="Chưa có thành viên phù hợp" />
      <div className="flex flex-wrap items-center gap-3 text-sm"><button className={button} disabled={filter.page <= 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>Trang trước</button><span>Trang {filter.page} / {totalPages}</span><button className={button} disabled={filter.page >= totalPages} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Trang sau</button></div>
    </>}
    <Modal isOpen={Boolean(modal)} onClose={() => !busy && setModal(null)} title={modal?.type === 'status' ? 'Trạng thái tài khoản' : modal?.type === 'subscriptions' ? `Lịch sử gói · ${modal.row.fullName}` : modal?.row ? 'Cập nhật thành viên' : 'Thêm thành viên'}>
      {modal?.type === 'edit' && <form className="space-y-3" onSubmit={save}>
        {!modal.row && <><label className="block">Tên đăng nhập<input className={field} name="username" required minLength={3} maxLength={100} pattern="[a-zA-Z0-9._-]+" value={form.username} onChange={change} /></label><label className="block">Mật khẩu ban đầu<input className={field} type="password" autoComplete="new-password" name="password" required minLength={6} maxLength={128} value={form.password} onChange={change} /><span className="text-xs text-slate-500">6–128 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt; không chứa khoảng trắng.</span></label></>}
        <label className="block">Họ tên<input className={field} name="fullName" required maxLength={150} value={form.fullName || ''} onChange={change} /></label>
        <label className="block">Email<input className={field} name="email" type="email" required maxLength={150} value={form.email || ''} onChange={change} /></label>
        <label className="block">Điện thoại<input className={field} name="phone" type="tel" maxLength={20} value={form.phone || ''} onChange={change} /></label>
        <label className="block">Ngày sinh<input className={field} name="dateOfBirth" type="date" required={Boolean(modal.row?.dateOfBirth)} max={today()} value={form.dateOfBirth || ''} onChange={change} /></label>
        {modal.row && <><label className="block">Giới tính<select className={field} name="gender" value={form.gender || ''} onChange={change}><option value="" disabled={Boolean(modal.row.gender)}>Chưa cung cấp</option><option value="Male">Nam</option><option value="Female">Nữ</option><option value="Other">Khác</option></select></label><label className="block">Địa chỉ<input className={field} name="address" maxLength={255} value={form.address || ''} onChange={change} /></label></>}
        <button className={button} type="submit" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu thành viên'}</button>
      </form>}
      {modal?.type === 'status' && <div className="space-y-4"><p>{modal.row.accountStatus === 'Active' ? 'Khóa' : 'Mở khóa'} tài khoản của {modal.row.fullName}?</p><button className={button} disabled={busy} onClick={toggleStatus}>Xác nhận</button></div>}
      {modal?.type === 'subscriptions' && <div className="space-y-3">{subscriptions.length ? subscriptions.map(s => <article className="border rounded-lg p-3" key={s.subscriptionId}><strong>{s.packageName}</strong><p>{Number(s.price).toLocaleString('vi-VN')}đ · {s.durationDays} ngày · {s.status}</p><p>{s.startDate || 'Chưa kích hoạt'} – {s.endDate || 'Chưa có ngày hết hạn'}</p></article>) : <p>Chưa có lịch sử đăng ký gói.</p>}</div>}
    </Modal>
  </div>;
}
