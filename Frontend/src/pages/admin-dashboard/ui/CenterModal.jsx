import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminApi } from '../../../entities/center/index.js';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';

// ─────────────────────────────────────────────────────────────
// Modal 1: Create Sports Center Modal
// ─────────────────────────────────────────────────────────────
export function CenterModal({ onClose, onSaved }) {
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
      await adminApi.createCenter(form);
      onSaved();
    } catch (e) {
      setErr(e.message || 'Đã xảy ra lỗi khi tạo cơ sở.');
    } finally {
      setSaving(false);
    }
  };

  const node = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-brand-navy-950/65 backdrop-blur-md transition-all duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-brand-navy-900 rounded-3xl shadow-[0_25px_60px_-15px_rgba(30,34,53,0.35)] border border-brand-navy-100 dark:border-brand-navy-800 p-6 sm:p-8 text-left transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient lighting tint */}
        <div className="absolute top-0 inset-x-0 h-28 pointer-events-none bg-gradient-to-b from-brand-sage-500/15 via-brand-teal-500/5 to-transparent" />

        {/* Close Button */}
        <MotionButton
          type="button"
          disabled={saving}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-500 dark:text-brand-navy-400 flex items-center justify-center transition-colors border border-brand-navy-200 dark:border-brand-navy-700 cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </MotionButton>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-sage-500 to-brand-teal-700 text-white flex items-center justify-center shadow-md shadow-brand-sage-500/20 shrink-0">
            <span className="material-symbols-outlined text-[26px]">apartment</span>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-sage-700 dark:text-brand-sage-400">
              Mạng lưới cơ sở SCMS
            </span>
            <h3 className="text-xl font-black text-brand-navy-900 dark:text-white tracking-tight">
              Thêm Cơ Sở Thể Thao Mới
            </h3>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={save} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
              Tên cơ sở thể thao <span className="text-brand-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">fitness_center</span>
              <input
                type="text"
                required
                autoFocus
                placeholder="VD: Sports Center Quận 1 - Hồ Bơi & Gym"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
              Địa chỉ cơ sở <span className="text-brand-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">location_on</span>
              <input
                type="text"
                required
                placeholder="VD: 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">call</span>
                <input
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
                Email liên hệ
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">mail</span>
                <input
                  type="email"
                  placeholder="VD: center.q1@sportscenter.vn"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all placeholder:text-brand-navy-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1.5">
              Trạng thái hoạt động ban đầu
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[18px] text-brand-navy-400">toggle_on</span>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 transition-all cursor-pointer"
              >
                <option value="Active">Hoạt động (Active) - Mở cửa phục vụ hội viên</option>
                <option value="Inactive">Tạm ngưng (Inactive) - Tạm dừng hoạt động hoặc sửa chữa</option>
                <option value="Disabled">Vô hiệu hóa (Disabled) - Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          {err && (
            <div className="p-3 rounded-xl bg-brand-danger-50 dark:bg-brand-danger-950/60 border border-brand-danger-200 dark:border-brand-danger-800 text-xs font-medium text-brand-danger-700 dark:text-brand-danger-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{err}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <MotionButton
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </MotionButton>
            <MotionButton
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-sage-600 to-brand-teal-700 hover:from-brand-sage-700 hover:to-brand-teal-800 text-white text-xs font-bold shadow-md shadow-brand-sage-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
