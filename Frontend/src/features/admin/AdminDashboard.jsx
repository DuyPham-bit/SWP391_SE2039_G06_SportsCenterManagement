import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '../../services/http.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MotionButton } from '../../components/common/MotionButton.jsx';

// Shared Olympic athletic gradient and date formatters
const OLYMPIC_GRADIENT = 'linear-gradient(115deg, #1B4332 0%, #2D6A4F 28%, #1D70B8 65%, #0081C8 85%, #E5A33C 100%)';

const fmtDate = (v) => {
  try {
    return v ? new Date(v).toLocaleString('vi-VN', { hour12: false }) : '—';
  } catch {
    return '—';
  }
};

const fmtDateOnly = (v) => {
  try {
    return v ? new Date(v).toLocaleDateString('vi-VN') : '—';
  } catch {
    return '—';
  }
};

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  const isAct = s === 'active';
  const isDis = s === 'disabled' || s === 'locked' || s === 'deleted';
  const isInact = s === 'inactive';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-colors ${
        isAct
          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs'
          : isDis
          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 shadow-2xs'
          : isInact
          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isAct
            ? 'bg-emerald-500 animate-pulse'
            : isDis
            ? 'bg-rose-500'
            : isInact
            ? 'bg-amber-500'
            : 'bg-slate-400'
        }`}
      />
      {status || '—'}
    </span>
  );
}

function RoleBadge({ role }) {
  const r = String(role || '').toUpperCase();
  const styles = {
    ADMIN: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    SYSTEMADMIN: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    MANAGER: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    COACH: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    RECEPTIONIST: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    MEMBER: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  };

  const icons = {
    ADMIN: 'admin_panel_settings',
    SYSTEMADMIN: 'security',
    MANAGER: 'manage_accounts',
    COACH: 'sports',
    RECEPTIONIST: 'desk',
    MEMBER: 'person'
  };

  const currentStyle = styles[r] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  const icon = icons[r] || 'account_circle';

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${currentStyle}`}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      <span>{role || 'User'}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal 1: Create Sports Center Modal
// ─────────────────────────────────────────────────────────────
function CenterModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', status: 'Active' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [saving, onClose]);

  const save = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) {
      setErr('Vui lòng nhập tên cơ sở.');
      return;
    }
    if (!form.address.trim()) {
      setErr('Vui lòng nhập địa chỉ cơ sở.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await apiRequest('admin/centers', { method: 'POST', body: form });
      onSaved();
    } catch (e) {
      setErr(e.message || 'Đã xảy ra lỗi khi tạo cơ sở.');
    } finally {
      setSaving(false);
    }
  };

  const node = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-left transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient lighting tint */}
        <div className="absolute top-0 inset-x-0 h-28 pointer-events-none bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent" />

        {/* Close Button */}
        <MotionButton
          type="button"
          disabled={saving}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </MotionButton>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <span className="material-symbols-outlined text-[26px]">apartment</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Mạng lưới cơ sở SCMS
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Thêm Cơ Sở Thể Thao Mới
            </h3>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={save} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Tên cơ sở thể thao <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">fitness_center</span>
              <input
                type="text"
                required
                autoFocus
                placeholder="VD: Sports Center Quận 1 - Hồ Bơi & Gym"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Địa chỉ cơ sở <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">location_on</span>
              <input
                type="text"
                required
                placeholder="VD: 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">call</span>
                <input
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email liên hệ
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">mail</span>
                <input
                  type="email"
                  placeholder="VD: center.q1@sportscenter.vn"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Trạng thái hoạt động ban đầu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">toggle_on</span>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                <option value="Active">Hoạt động (Active) - Mở cửa phục vụ hội viên</option>
                <option value="Inactive">Tạm ngưng (Inactive) - Tạm dừng hoạt động hoặc sửa chữa</option>
                <option value="Disabled">Vô hiệu hóa (Disabled) - Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          {err && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{err}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <MotionButton
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </MotionButton>
            <MotionButton
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span>{saving ? 'Đang lưu...' : 'Xác Nhận Tạo Cơ Sở'}</span>
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

// ─────────────────────────────────────────────────────────────
// Modal 2: Create Manager Modal
// ─────────────────────────────────────────────────────────────
function ManagerModal({ centers, onClose, onSaved }) {
  const activeCenters = (centers || []).filter((c) => c.status === 'Active');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    centerId: activeCenters[0]?.id || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [saving, onClose]);

  const save = async (e) => {
    e?.preventDefault();
    if (!form.fullName.trim()) return setErr('Vui lòng nhập họ và tên Manager.');
    if (!form.username.trim()) return setErr('Vui lòng nhập tên đăng nhập.');
    if (!form.email.trim()) return setErr('Vui lòng nhập email.');
    if (!form.password || form.password.length < 6) return setErr('Mật khẩu tối thiểu 6 ký tự.');
    if (!form.centerId) return setErr('Vui lòng chọn cơ sở trực thuộc.');

    setSaving(true);
    setErr('');
    try {
      await apiRequest('admin/managers', {
        method: 'POST',
        body: { ...form, centerId: Number(form.centerId) }
      });
      onSaved();
    } catch (e) {
      setErr(e.message || 'Đã xảy ra lỗi khi tạo tài khoản Manager.');
    } finally {
      setSaving(false);
    }
  };

  const node = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] border border-slate-100 dark:border-slate-800 p-6 sm:p-8 text-left transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient lighting tint */}
        <div className="absolute top-0 inset-x-0 h-28 pointer-events-none bg-gradient-to-b from-blue-500/15 via-indigo-500/5 to-transparent" />

        {/* Close Button */}
        <MotionButton
          type="button"
          disabled={saving}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </MotionButton>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Nhân sự lãnh đạo cơ sở
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Cấp Tài Khoản Manager
            </h3>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={save} className="relative z-10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">badge</span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="VD: Trần Đình Trọng"
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">person</span>
                <input
                  type="text"
                  required
                  placeholder="VD: manager_q1"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email công vụ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">mail</span>
                <input
                  type="email"
                  required
                  placeholder="VD: manager.q1@sportscenter.vn"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">call</span>
                <input
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Mật khẩu khởi tạo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">key</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Cơ sở chỉ định quản lý <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-slate-400">domain</span>
              <select
                required
                value={form.centerId}
                onChange={(e) => set('centerId', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {activeCenters.length === 0 && (
                  <option value="">(Chưa có cơ sở nào đang hoạt động)</option>
                )}
                {activeCenters.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} - {c.name} ({c.address})
                  </option>
                ))}
              </select>
            </div>
            {activeCenters.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Lưu ý: Bạn cần tạo hoặc kích hoạt ít nhất một cơ sở thể thao trước khi bổ nhiệm Manager.
              </p>
            )}
          </div>

          {err && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{err}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <MotionButton
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </MotionButton>
            <MotionButton
              type="submit"
              disabled={saving || activeCenters.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span>{saving ? 'Đang tạo...' : 'Xác Nhận Cấp Tài Khoản'}</span>
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

// ─────────────────────────────────────────────────────────────
// Modal 3: Account Action Modal (Lock, Unlock, Revoke, Delete)
// ─────────────────────────────────────────────────────────────
function AccountActionModal({ actionData, onClose, onConfirm, isSaving }) {
  if (!actionData) return null;
  const { type, account } = actionData;
  const isDelete = type === 'delete';
  const isLock = type === 'lock';
  const isUnlock = type === 'unlock';

  const defaultReasons = {
    delete: 'Admin xóa tài khoản Member',
    lock: 'Admin tạm khóa tài khoản để kiểm tra an ninh',
    unlock: 'Admin mở khóa tài khoản sau khi xác minh',
    'revoke-sessions': 'Admin thu hồi phiên đăng nhập khẩn cấp'
  };

  const [reason, setReason] = useState(defaultReasons[type] || '');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSaving]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = reason.trim();
    if (!finalReason) {
      setLocalError('Vui lòng nhập lý do thực hiện thao tác.');
      return;
    }
    setLocalError('');
    onConfirm(finalReason);
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[480px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] border border-slate-100 dark:border-slate-800 p-6 sm:p-7 text-left transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient lighting tint */}
        <div
          className={`absolute top-0 inset-x-0 h-32 pointer-events-none ${
            isDelete
              ? 'bg-gradient-to-b from-rose-500/20 via-rose-500/5 to-transparent'
              : isLock
              ? 'bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent'
              : isUnlock
              ? 'bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent'
              : 'bg-gradient-to-b from-slate-500/20 via-slate-500/5 to-transparent'
          }`}
        />

        {/* Close button */}
        <MotionButton
          type="button"
          disabled={isSaving}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700 z-10 disabled:opacity-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </MotionButton>

        {/* Top Icon Badge & Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
              isDelete
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shadow-rose-500/20 border border-rose-200 dark:border-rose-800'
                : isLock
                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shadow-amber-500/20 border border-amber-200 dark:border-amber-800'
                : isUnlock
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-slate-500/20 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[26px]">
              {isDelete ? 'delete_forever' : isLock ? 'lock' : isUnlock ? 'lock_open' : 'logout'}
            </span>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                isDelete
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  : isLock
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  : isUnlock
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
              }`}
            >
              {isDelete ? 'Hành động nguy hiểm' : isLock ? 'Bảo mật tài khoản' : isUnlock ? 'Khôi phục truy cập' : 'Quản trị phiên'}
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {isDelete
                ? 'Xóa tài khoản Member'
                : isLock
                ? 'Khóa tài khoản người dùng'
                : isUnlock
                ? 'Mở khóa tài khoản'
                : 'Thu hồi toàn bộ phiên đăng nhập'}
            </h3>
          </div>
        </div>

        {/* Target Account Summary Card */}
        <div className="relative z-10 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black flex items-center justify-center text-xs shrink-0 uppercase">
              {account.username?.slice(0, 2) || 'SC'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                <span>{account.username}</span>
                <span className="text-[11px] font-semibold text-slate-400">#{account.id}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{account.email || 'Chưa cập nhật email'}</div>
            </div>
          </div>
          <RoleBadge role={account.role} />
        </div>

        {/* Consequence Note */}
        <div
          className={`relative z-10 p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 mb-4 border ${
            isDelete
              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
              : isLock
              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
              : isUnlock
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
            {isDelete ? 'warning' : isLock ? 'shield' : isUnlock ? 'check_circle' : 'info'}
          </span>
          <div>
            {isDelete ? (
              <>
                <strong>Lưu ý:</strong> Thao tác này sẽ <strong>thu hồi quyền đăng nhập vĩnh viễn</strong> và ẩn danh thông tin cá nhân. <strong>Lịch sử giao dịch và hóa đơn vẫn được lưu giữ an toàn</strong> cho công tác kiểm toán tài chính.
              </>
            ) : isLock ? (
              <>
                Tài khoản sẽ bị tạm khóa ngay lập tức và không thể đăng nhập hoặc thực hiện bất kỳ giao dịch nào cho đến khi được mở khóa.
              </>
            ) : isUnlock ? (
              <>
                Tài khoản sẽ được kích hoạt lại ngay lập tức và người dùng có thể đăng nhập bình thường.
              </>
            ) : (
              <>
                Tất cả phiên đăng nhập hiện tại trên mọi thiết bị sẽ bị hủy ngay lập tức. Người dùng cần nhập lại mật khẩu để tiếp tục.
              </>
            )}
          </div>
        </div>

        {/* Reason Form */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-3.5">
          <div>
            <label htmlFor="action-reason" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Lý do thực hiện <span className="text-rose-500">*</span>
            </label>
            <input
              id="action-reason"
              autoFocus
              type="text"
              required
              maxLength={500}
              disabled={isSaving}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thực hiện thao tác..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
            />
            {localError && <p className="text-xs text-rose-600 font-medium mt-1">{localError}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <MotionButton
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-10 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </MotionButton>
            <MotionButton
              type="submit"
              disabled={isSaving}
              className={`min-h-10 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                isDelete
                  ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 shadow-rose-600/25'
                  : isLock
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/25'
                  : isUnlock
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black shadow-slate-700/25'
              }`}
            >
              {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span>
                {isSaving
                  ? 'Đang xử lý...'
                  : isDelete
                  ? 'Xác nhận xóa tài khoản'
                  : isLock
                  ? 'Xác nhận khóa'
                  : isUnlock
                  ? 'Xác nhận mở khóa'
                  : 'Xác nhận thu hồi phiên'}
              </span>
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

// ─────────────────────────────────────────────────────────────
// Main Component: AdminDashboard
// ─────────────────────────────────────────────────────────────
export function AdminDashboard({ initialSection }) {
  const [tab, setTab] = useState(initialSection || 'overview');
  const [ov, setOv] = useState(null);
  const [centers, setCenters] = useState([]);
  const [managers, setManagers] = useState([]);
  const [accs, setAccs] = useState([]);

  const [loadOv, setLoadOv] = useState(true);
  const [loadC, setLoadC] = useState(false);
  const [loadM, setLoadM] = useState(false);
  const [loadA, setLoadA] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(null);

  // Accounts filter & pagination state
  const [aPage, setAPage] = useState(1);
  const [aTotal, setATotal] = useState(0);
  const [aQ, setAQ] = useState('');
  const [aRole, setARole] = useState('');
  const [aSt, setASt] = useState('');

  // Centers & Managers local search state
  const [centerSearch, setCenterSearch] = useState('');
  const [centerStatusFilter, setCenterStatusFilter] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [managerCenterFilter, setManagerCenterFilter] = useState('');

  // Modals state
  const [showCC, setShowCC] = useState(false);
  const [showCM, setShowCM] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const toast = useToast?.() || {};
  const showSuccess = toast.showSuccess || console.log;
  const showError = toast.showError || console.error;
  const PS = 20;

  // Sync tab with URL hash
  const switchTab = (newTab) => {
    setTab(newTab);
    const hashMap = {
      overview: '#/admin/dashboard',
      centers: '#/admin/centers',
      managers: '#/admin/managers',
      accounts: '#/admin/accounts'
    };
    if (hashMap[newTab] && window.location.hash !== hashMap[newTab]) {
      window.location.hash = hashMap[newTab];
    }
  };

  // Sync when initialSection changes
  useEffect(() => {
    if (initialSection) setTab(initialSection);
  }, [initialSection]);

  const loadOvFn = useCallback(async () => {
    setLoadOv(true);
    try {
      setOv(await apiRequest('admin/overview'));
    } catch (e) {
      // ignore
    } finally {
      setLoadOv(false);
    }
  }, []);

  const loadCFn = useCallback(async () => {
    setLoadC(true);
    try {
      const d = await apiRequest('admin/centers');
      setCenters(Array.isArray(d) ? d : []);
    } catch {
      // ignore
    } finally {
      setLoadC(false);
    }
  }, []);

  const loadMFn = useCallback(async () => {
    setLoadM(true);
    try {
      const d = await apiRequest('admin/managers');
      setManagers(Array.isArray(d) ? d : []);
    } catch {
      // ignore
    } finally {
      setLoadM(false);
    }
  }, []);

  const loadAFn = useCallback(async () => {
    setLoadA(true);
    try {
      const p = new URLSearchParams({ page: aPage, pageSize: PS });
      if (aQ.trim()) p.set('query', aQ.trim());
      if (aRole) p.set('role', aRole);
      if (aSt) p.set('status', aSt);
      const r = await apiRequest('admin/accounts?' + p);
      setAccs(Array.isArray(r?.items) ? r.items : []);
      setATotal(r?.totalCount || 0);
    } catch {
      // ignore
    } finally {
      setLoadA(false);
    }
  }, [aPage, aQ, aRole, aSt]);

  useEffect(() => {
    loadOvFn();
    loadCFn();
    loadMFn();
  }, [loadOvFn, loadCFn, loadMFn]);

  useEffect(() => {
    if (tab === 'accounts') loadAFn();
  }, [tab, loadAFn]);

  // Patch Center Status
  const patchC = async (id, currentStatus) => {
    setSaving('c' + id);
    setErr('');
    try {
      const c = centers.find((x) => x.id === id);
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await apiRequest('admin/centers/' + id, {
        method: 'PATCH',
        body: { ...c, status: newStatus }
      });
      showSuccess(`Đã chuyển cơ sở "${c.name}" sang trạng thái "${newStatus}".`);
      loadCFn();
      loadOvFn();
    } catch (e) {
      setErr(e.message || 'Cập nhật trạng thái cơ sở thất bại.');
      showError(e.message || 'Cập nhật trạng thái cơ sở thất bại.');
    } finally {
      setSaving(null);
    }
  };

  // Patch Manager Status
  const patchM = async (m) => {
    setSaving('m' + m.id);
    setErr('');
    try {
      const newStatus = m.status === 'Active' ? 'Disabled' : 'Active';
      await apiRequest('admin/managers/' + m.id, {
        method: 'PATCH',
        body: { fullName: m.fullName, centerId: m.centerId, status: newStatus }
      });
      showSuccess(`Đã chuyển tài khoản Manager "${m.fullName}" sang "${newStatus}".`);
      loadMFn();
      loadOvFn();
    } catch (e) {
      setErr(e.message || 'Cập nhật trạng thái Manager thất bại.');
      showError(e.message || 'Cập nhật trạng thái Manager thất bại.');
    } finally {
      setSaving(null);
    }
  };

  // Execute Account Actions
  const handleExecuteAction = async (finalReason) => {
    if (!confirmAction) return;
    const { type, account } = confirmAction;
    setSaving('a' + account.id);
    setErr('');
    try {
      if (type === 'delete') {
        await apiRequest('admin/accounts/' + account.id, {
          method: 'DELETE',
          body: { reason: finalReason }
        });
        showSuccess(`Đã xóa và ẩn danh thông tin tài khoản Member "${account.username}".`);
      } else {
        await apiRequest('admin/accounts/' + account.id + '/' + type, {
          method: 'POST',
          body: { reason: finalReason }
        });
        const labels = {
          lock: 'Đã khóa tài khoản',
          unlock: 'Đã mở khóa tài khoản',
          'revoke-sessions': 'Đã thu hồi các phiên đăng nhập của'
        };
        showSuccess(`${labels[type] || 'Thao tác thành công'} "${account.username}".`);
      }
      setConfirmAction(null);
      loadAFn();
      loadOvFn();
    } catch (e) {
      setErr(e.message || 'Thao tác thất bại.');
      showError(e.message || 'Thao tác thất bại.');
    } finally {
      setSaving(null);
    }
  };

  const deleteMember = (acc) => {
    setConfirmAction({ type: 'delete', account: acc });
  };

  const actA = (id, action) => {
    const acc = accs.find((x) => x.id === id);
    if (!acc) return;
    setConfirmAction({ type: action, account: acc });
  };

  const activeCenters = useMemo(() => centers.filter((c) => c.status === 'Active'), [centers]);
  const aPgs = Math.ceil(aTotal / PS) || 1;

  // Filtered Centers
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchQ = !centerSearch.trim() ||
        c.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
        (c.address || '').toLowerCase().includes(centerSearch.toLowerCase()) ||
        (c.phone || '').includes(centerSearch);
      const matchSt = !centerStatusFilter || c.status === centerStatusFilter;
      return matchQ && matchSt;
    });
  }, [centers, centerSearch, centerStatusFilter]);

  // Filtered Managers
  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      const matchQ = !managerSearch.trim() ||
        (m.fullName || '').toLowerCase().includes(managerSearch.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(managerSearch.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(managerSearch.toLowerCase());
      const matchC = !managerCenterFilter || String(m.centerId) === String(managerCenterFilter);
      return matchQ && matchC;
    });
  }, [managers, managerSearch, managerCenterFilter]);

  const TABS = [
    { id: 'overview', l: 'Tổng Quan', i: 'dashboard' },
    { id: 'centers', l: 'Cơ Sở', i: 'account_tree', count: centers.length },
    { id: 'managers', l: 'Managers', i: 'manage_accounts', count: managers.length },
    { id: 'accounts', l: 'Tài Khoản', i: 'group', count: aTotal || null }
  ];

  return (
    <div className="w-full space-y-6 pb-12 transition-colors">
      {/* Modals */}
      {showCC && (
        <CenterModal
          onClose={() => setShowCC(false)}
          onSaved={() => {
            setShowCC(false);
            showSuccess('Tạo cơ sở thể thao thành công!');
            loadCFn();
            loadOvFn();
          }}
        />
      )}

      {showCM && (
        <ManagerModal
          centers={centers}
          onClose={() => setShowCM(false)}
          onSaved={() => {
            setShowCM(false);
            showSuccess('Cấp tài khoản Manager thành công!');
            loadMFn();
            loadOvFn();
          }}
        />
      )}

      {confirmAction && (
        <AccountActionModal
          actionData={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleExecuteAction}
          isSaving={saving === 'a' + confirmAction.account.id}
        />
      )}

      {/* Global Error Banner if any */}
      {err && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span className="font-semibold">{err}</span>
          </div>
          <button
            onClick={() => setErr('')}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. Sleek Command Header (Olympic Athletics Mesh + Telemetry)
      ───────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-7 lg:p-8 shadow-xl shadow-emerald-950/15 border border-white/20 dark:border-slate-800"
        style={{ background: OLYMPIC_GRADIENT }}
      >
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-300/30 via-teal-300/20 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/35 via-blue-500/20 to-transparent blur-3xl" />

        {/* Olympic curved athletic lines SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden"
          preserveAspectRatio="none"
          viewBox="0 0 1000 300"
        >
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-white/20 text-white uppercase backdrop-blur-md border border-white/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                HỆ THỐNG QUẢN TRỊ TRUNG TÂM
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white/95 border border-white/20">
                Toàn Hệ Thống SCMS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
              Bảng Quản Trị Hệ Thống
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
              Mạng lưới cơ sở thể thao tiêu chuẩn Olympic, phân quyền quản lý chuyên nghiệp và giám sát an toàn tài khoản toàn hệ thống.
            </p>
          </div>

          {/* Quick Metrics & Refresh */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-white/15 dark:bg-slate-900/40 p-2.5 sm:p-3 rounded-2xl border border-white/25 backdrop-blur-md shadow-xs">
              <div className="text-center px-2 sm:px-3">
                <div className="text-lg sm:text-2xl font-black text-white">{ov?.activeCenterCount ?? '—'}</div>
                <div className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Cơ Sở</div>
              </div>
              <div className="text-center px-2 sm:px-3 border-l border-white/20">
                <div className="text-lg sm:text-2xl font-black text-white">{ov?.activeManagerCount ?? '—'}</div>
                <div className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Managers</div>
              </div>
              <div className="text-center px-2 sm:px-3 border-l border-white/20">
                <div className={`text-lg sm:text-2xl font-black ${(ov?.lockedAccountCount || 0) > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {ov?.lockedAccountCount ?? '0'}
                </div>
                <div className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Bị Khóa</div>
              </div>
              <div className="text-center px-2 sm:px-3 border-l border-white/20">
                <div className="text-lg sm:text-2xl font-black text-white">{ov?.totalAccountCount ?? '—'}</div>
                <div className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Tài Khoản</div>
              </div>
            </div>

            <MotionButton
              onClick={() => {
                loadOvFn();
                loadCFn();
                loadMFn();
                if (tab === 'accounts') loadAFn();
              }}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border border-white/30 backdrop-blur-md shadow-xs cursor-pointer"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <span className={`material-symbols-outlined text-[18px] ${loadOv || loadC || loadM || loadA ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span className="hidden sm:inline">Làm Mới</span>
            </MotionButton>
          </div>
        </div>

        {/* Master Tabs Embedded Inside Banner */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/20">
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <MotionButton
                key={t.id}
                onClick={() => switchTab(t.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1B4332] shadow-lg shadow-black/15 font-black scale-102'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/20 backdrop-blur-md'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{t.i}</span>
                <span>{t.l}</span>
                {t.count !== undefined && t.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-white/25 text-white'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </MotionButton>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. Tab 1: OVERVIEW
      ───────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">bolt</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Thao tác nhanh quản trị
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <MotionButton
                onClick={() => setShowCC(true)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Thêm Cơ Sở</span>
              </MotionButton>
              <MotionButton
                onClick={() => setShowCM(true)}
                disabled={activeCenters.length === 0}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>+ Tạo Manager</span>
              </MotionButton>
              <a
                href="#/admin/roles-permissions"
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">security</span>
                <span>Phân Quyền RBAC</span>
              </a>
              <a
                href="#/admin/audit-logs"
                className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-bold text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>Nhật Ký Kiểm Toán</span>
              </a>
            </div>
          </div>

          {/* Visual KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: 'account_tree',
                label: 'Cơ Sở Thể Thao',
                value: ov?.activeCenterCount ?? 0,
                sub: `${centers.length} tổng cơ sở toàn hệ thống`,
                badge: `${centers.length ? Math.round(((ov?.activeCenterCount || 0) / centers.length) * 100) : 100}% hoạt động`,
                color: '#10B981',
                bgLight: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
                tabId: 'centers'
              },
              {
                icon: 'manage_accounts',
                label: 'Managers Đang Trực',
                value: ov?.activeManagerCount ?? 0,
                sub: `${managers.length} quản lý được bổ nhiệm`,
                badge: `${managers.length ? Math.round(((ov?.activeManagerCount || 0) / managers.length) * 100) : 100}% trực tuyến`,
                color: '#3B82F6',
                bgLight: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
                tabId: 'managers'
              },
              {
                icon: 'shield',
                label: 'An Ninh & Khóa Tài Khoản',
                value: ov?.lockedAccountCount ?? 0,
                sub: (ov?.lockedAccountCount || 0) > 0 ? 'Cần kiểm tra lý do khóa' : 'Hệ thống an toàn 100%',
                badge: (ov?.lockedAccountCount || 0) > 0 ? 'Cần xử lý' : 'An toàn',
                color: (ov?.lockedAccountCount || 0) > 0 ? '#EF4444' : '#10B981',
                bgLight: (ov?.lockedAccountCount || 0) > 0
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
                tabId: 'accounts'
              },
              {
                icon: 'group',
                label: 'Tài Khoản Toàn Hệ Thống',
                value: ov?.totalAccountCount ?? 0,
                sub: 'Hội viên, HLV, Lễ tân & Quản lý',
                badge: 'Tất cả vai trò',
                color: '#F59E0B',
                bgLight: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
                tabId: 'accounts'
              }
            ].map((card) => (
              <div
                key={card.label}
                onClick={() => switchTab(card.tabId)}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${card.bgLight}`}>
                    <span className="material-symbols-outlined text-[26px]">{card.icon}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors text-[20px]">
                    arrow_forward
                  </span>
                </div>

                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                    {card.value}
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">{card.label}</div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{card.sub}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Trạng thái</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                    style={{ backgroundColor: card.color + '15', color: card.color }}
                  >
                    {card.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-side lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Centers preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px]">apartment</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Cơ Sở Thể Thao</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{centers.length} cơ sở trong hệ thống</p>
                  </div>
                </div>
                <MotionButton
                  onClick={() => switchTab('centers')}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </MotionButton>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {centers.slice(0, 5).map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span className="text-slate-400 font-semibold text-xs">#{c.id}</span>
                        <span>{c.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                        <span>{c.address || 'Chưa cập nhật địa chỉ'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
                {centers.length === 0 && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Chưa có cơ sở nào được tạo.
                  </div>
                )}
              </div>
            </div>

            {/* Managers preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[22px]">manage_accounts</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Đội Ngũ Manager</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{managers.length} quản lý được phân công</p>
                  </div>
                </div>
                <MotionButton
                  onClick={() => switchTab('managers')}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </MotionButton>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {managers.slice(0, 5).map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                        {m.fullName?.slice(0, 2) || 'MN'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {m.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">domain</span>
                          <span>{m.centerName || 'Chưa gán cơ sở'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                ))}
                {managers.length === 0 && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    Chưa có Manager nào được tạo.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. Tab 2: CENTERS MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {tab === 'centers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
          {/* Top Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Quản Lý Mạng Lưới Cơ Sở Thể Thao</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {centers.length} cơ sở
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý thông tin địa điểm, số điện thoại hotline và trạng thái hoạt động của từng cơ sở.
              </p>
            </div>

            <MotionButton
              onClick={() => setShowCC(true)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>+ Tạo Cơ Sở Mới</span>
            </MotionButton>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">search</span>
              <input
                type="text"
                placeholder="Tìm tên cơ sở, địa chỉ, số điện thoại..."
                value={centerSearch}
                onChange={(e) => setCenterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <select
              value={centerStatusFilter}
              onChange={(e) => setCenterStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động (Active)</option>
              <option value="Inactive">Tạm ngưng (Inactive)</option>
              <option value="Disabled">Vô hiệu hóa (Disabled)</option>
            </select>

            {(centerSearch || centerStatusFilter) && (
              <button
                onClick={() => { setCenterSearch(''); setCenterStatusFilter(''); }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Đặt lại lọc
              </button>
            )}
          </div>

          {/* Table */}
          {loadC ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Đang tải danh sách cơ sở...</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Mã</th>
                    <th className="py-3 px-4">Tên Cơ Sở</th>
                    <th className="py-3 px-4">Địa Chỉ</th>
                    <th className="py-3 px-4">Hotline</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Ngày Tạo</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredCenters.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-400">#{c.id}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">apartment</span>
                          <span>{c.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {c.address || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-medium">{c.phone || '—'}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-500">{c.email || '—'}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{fmtDateOnly(c.createdAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <MotionButton
                          onClick={() => patchC(c.id, c.status)}
                          disabled={saving === 'c' + c.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            c.status === 'Active'
                              ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                              : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {saving === 'c' + c.id
                            ? '...'
                            : c.status === 'Active'
                            ? 'Tạm Ngưng'
                            : 'Kích Hoạt'}
                        </MotionButton>
                      </td>
                    </tr>
                  ))}
                  {filteredCenters.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        Không tìm thấy cơ sở nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. Tab 3: MANAGERS MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {tab === 'managers' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
          {/* Top Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Quản Lý Tài Khoản Manager</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {managers.length} quản lý
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cấp tài khoản, phân bổ cơ sở quản lý và điều phối nhân sự lãnh đạo chi nhánh.
              </p>
            </div>

            <MotionButton
              onClick={() => setShowCM(true)}
              disabled={activeCenters.length === 0}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-40 self-start sm:self-auto"
              title={activeCenters.length === 0 ? 'Cần ít nhất một cơ sở hoạt động để tạo Manager' : ''}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Cấp Tài Khoản Manager</span>
            </MotionButton>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">search</span>
              <input
                type="text"
                placeholder="Tìm họ tên, username, email manager..."
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <select
              value={managerCenterFilter}
              onChange={(e) => setManagerCenterFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              <option value="">Tất cả cơ sở</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {(managerSearch || managerCenterFilter) && (
              <button
                onClick={() => { setManagerSearch(''); setManagerCenterFilter(''); }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Đặt lại lọc
              </button>
            )}
          </div>

          {/* Table */}
          {loadM ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Đang tải danh sách Manager...</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Mã</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Cơ Sở Phụ Trách</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Đăng Nhập Cuối</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredManagers.map((m) => (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-400">#{m.id}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center uppercase">
                            {m.fullName?.slice(0, 2) || 'MN'}
                          </div>
                          <span>{m.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">{m.username}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-500">{m.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700">
                          <span className="material-symbols-outlined text-[15px] text-blue-600">domain</span>
                          <span>{m.centerName || 'Chưa gán cơ sở'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">{fmtDate(m.lastLoginAt)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <MotionButton
                          onClick={() => patchM(m)}
                          disabled={saving === 'm' + m.id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            m.status === 'Active'
                              ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                              : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {saving === 'm' + m.id
                            ? '...'
                            : m.status === 'Active'
                            ? 'Vô Hiệu Hóa'
                            : 'Kích Hoạt'}
                        </MotionButton>
                      </td>
                    </tr>
                  ))}
                  {filteredManagers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        Không tìm thấy Manager nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. Tab 4: ACCOUNTS & SESSIONS MANAGEMENT
      ───────────────────────────────────────────────────────────── */}
      {tab === 'accounts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-5">
          {/* Top Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Quản Lý Tài Khoản Toàn Hệ Thống</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {aTotal} tài khoản
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kiểm soát bảo mật, khóa tài khoản vi phạm, thu hồi phiên đăng nhập và xóa thông tin hội viên.
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">search</span>
              <input
                type="text"
                placeholder="Tìm username, email tài khoản..."
                value={aQ}
                onChange={(e) => { setAQ(e.target.value); setAPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <select
              value={aRole}
              onChange={(e) => { setARole(e.target.value); setAPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Tất cả vai trò</option>
              {['Admin', 'Manager', 'Receptionist', 'Coach', 'Member'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={aSt}
              onChange={(e) => { setASt(e.target.value); setAPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Active">Hoạt động (Active)</option>
              <option value="Disabled">Bị khóa (Disabled)</option>
            </select>

            <MotionButton
              onClick={loadAFn}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
            >
              Tìm kiếm
            </MotionButton>

            {(aQ || aRole || aSt) && (
              <button
                onClick={() => { setAQ(''); setARole(''); setASt(''); setAPage(1); }}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}

            <div className="ml-auto text-xs font-semibold text-slate-400">
              Trang {aPage} / {aPgs}
            </div>
          </div>

          {/* Accounts Table */}
          {loadA ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Đang tải danh sách tài khoản...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Mã</th>
                      <th className="py-3 px-4">Tài Khoản</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Vai Trò</th>
                      <th className="py-3 px-4">Cơ Sở</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                      <th className="py-3 px-4">Bị Khóa Đến</th>
                      <th className="py-3 px-4">Đăng Nhập Cuối</th>
                      <th className="py-3 px-4 text-right">Thao Tác Bảo Mật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {accs.map((a) => {
                      const isLocked = a.lockedUntil && new Date(a.lockedUntil) > new Date();
                      return (
                        <tr
                          key={a.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-400">#{a.id}</td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[11px] flex items-center justify-center uppercase">
                                {a.username?.slice(0, 2) || 'SC'}
                              </div>
                              <span>{a.username}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-500 dark:text-slate-400">{a.email}</td>
                          <td className="py-3.5 px-4">
                            <RoleBadge role={a.role} />
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{a.centerName || '—'}</td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={isLocked ? 'Disabled' : a.status} />
                          </td>
                          <td className="py-3.5 px-4 text-[11px]">
                            {isLocked ? (
                              <span className="text-rose-600 font-bold">{fmtDate(a.lockedUntil)}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">{fmtDate(a.lastLoginAt)}</td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Lock / Unlock */}
                              {!isLocked && a.role !== 'Admin' && (
                                <MotionButton
                                  onClick={() => actA(a.id, 'lock')}
                                  disabled={!!saving}
                                  title="Khóa tài khoản"
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  className="w-8 h-8 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">lock</span>
                                </MotionButton>
                              )}
                              {isLocked && (
                                <MotionButton
                                  onClick={() => actA(a.id, 'unlock')}
                                  disabled={!!saving}
                                  title="Mở khóa tài khoản"
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  className="w-8 h-8 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">lock_open</span>
                                </MotionButton>
                              )}

                              {/* Revoke Sessions */}
                              {a.role !== 'Admin' && (
                                <MotionButton
                                  onClick={() => actA(a.id, 'revoke-sessions')}
                                  disabled={!!saving}
                                  title="Thu hồi phiên đăng nhập"
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">logout</span>
                                </MotionButton>
                              )}

                              {/* Delete Member Account */}
                              {a.role === 'Member' && (
                                <MotionButton
                                  onClick={() => deleteMember(a)}
                                  disabled={!!saving}
                                  title="Xóa tài khoản Member"
                                  whileHover={{ scale: 1.08 }}
                                  whileTap={{ scale: 0.94 }}
                                  className="w-8 h-8 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                                </MotionButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {accs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                          Không có tài khoản nào phù hợp với điều kiện tìm kiếm.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {aPgs > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Hiển thị {(aPage - 1) * PS + 1} - {Math.min(aPage * PS, aTotal)} trên tổng số {aTotal} tài khoản
                  </div>

                  <div className="flex items-center gap-1.5">
                    <MotionButton
                      onClick={() => setAPage((p) => Math.max(1, p - 1))}
                      disabled={aPage <= 1}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Trước
                    </MotionButton>

                    {Array.from({ length: aPgs }, (_, i) => i + 1).map((p) => (
                      <MotionButton
                        key={p}
                        onClick={() => setAPage(p)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
                          p === aPage
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </MotionButton>
                    ))}

                    <MotionButton
                      onClick={() => setAPage((p) => Math.min(aPgs, p + 1))}
                      disabled={aPage >= aPgs}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Sau
                    </MotionButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
