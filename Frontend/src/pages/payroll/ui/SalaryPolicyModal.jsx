import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { getAvatarGradient, getInitials } from '../lib/avatar.js';
import { money } from '../lib/format.js';

export function SalaryPolicyModal({ busy, editForm, editing, handleSavePolicy, isEn, setEditForm, setEditing }) {
  return (
    <Modal
      isOpen={Boolean(editing)}
      onClose={() => !busy && setEditing(null)}
      title={
        editing
          ? isEn
            ? `Salary & Session KPI Policy · ${editing.fullName}`
            : `Cấu hình chính sách lương & ca dạy · ${editing.fullName}`
          : ''
      }
      maxWidth="max-w-xl"
    >
      {editing && (
        <form onSubmit={handleSavePolicy} className="space-y-4">
          {/* Employee Preview Header */}
          <div className="p-3.5 bg-brand-navy-50 dark:bg-brand-navy-800/80 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-700 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                  editing.fullName
                )} flex items-center justify-center text-white font-black text-xs shrink-0`}
            >
              {getInitials(editing.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-sm truncate">{editing.fullName}</div>
              <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-2 mt-0.5">
                <span className="font-mono">{editing.employeeCode}</span>
                <span>•</span>
                <span className="font-bold text-brand-sage-700 dark:text-brand-sage-500">{editing.role}</span>
                {editing.centerName && <span>• {editing.centerName}</span>}
              </div>
            </div>
          </div>

          {/* Effective Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Effective From *' : 'Hiệu lực từ ngày *'}
              </label>
              <input
                type="date"
                required
                value={editForm.effectiveFrom}
                onChange={(e) => setEditForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-brand-navy-900 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Effective To' : 'Hiệu lực đến (Tùy chọn)'}
              </label>
              <input
                type="date"
                value={editForm.effectiveTo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-brand-navy-900 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-700"
              />
            </div>
          </div>

          {/* Base Salary */}
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Monthly Base Salary (VND) *' : 'Lương cơ bản tháng (VNĐ) *'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100000"
                required
                value={editForm.baseSalary}
                onChange={(e) => setEditForm((prev) => ({ ...prev, baseSalary: Number(e.target.value) }))}
                className="w-full pl-3 pr-12 py-2 bg-white dark:bg-brand-navy-900 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm font-bold text-brand-navy-900 dark:text-brand-navy-100 focus:outline-none focus:ring-2 focus:ring-brand-sage-700"
              />
              <span className="absolute right-3 top-2 text-xs font-bold text-brand-navy-400">₫</span>
            </div>
            <p className="text-[11px] text-brand-navy-400 mt-1 font-medium">{money(editForm.baseSalary)}</p>
          </div>

          {/* Conditional Fields: Coach vs Staff */}
          {String(editing.role).toUpperCase() === 'COACH' ? (
            <div className="p-4 bg-brand-teal-50/60 dark:bg-brand-teal-950/30 rounded-2xl border border-brand-teal-200/70 dark:border-brand-teal-800/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-teal-800 dark:text-brand-teal-300">
                <span className="material-symbols-outlined text-[16px]">sports</span>
                <span>{isEn ? 'Coach Session Compensation Policy' : 'Chính sách thù lao ca dạy & Chỉ tiêu KPI'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                    {isEn ? 'Pay per Session (VND)' : 'Thù lao mỗi ca dạy (VNĐ)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={editForm.commissionPerSession}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, commissionPerSession: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white dark:bg-brand-navy-900 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs sm:text-sm font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-brand-navy-400">{money(editForm.commissionPerSession)} / ca</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                    {isEn ? 'Target Sessions / Month' : 'Chỉ tiêu ca dạy / tháng (KPI)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.targetSessions}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, targetSessions: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white dark:bg-brand-navy-900 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                  <span className="text-[10px] text-brand-navy-400">VD: 40 hoặc 60 buổi/tháng</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Monthly Allowance (VND)' : 'Phụ cấp hàng tháng (VNĐ)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={editForm.allowance}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, allowance: Number(e.target.value) }))}
                  className="w-full pl-3 pr-12 py-2 bg-white dark:bg-brand-navy-900 border border-brand-navy-300 dark:border-brand-navy-700 rounded-xl text-sm font-bold text-brand-navy-900 dark:text-brand-navy-100 focus:outline-none focus:ring-2 focus:ring-brand-sage-700"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-brand-navy-400">₫</span>
              </div>
              <p className="text-[11px] text-brand-navy-400 mt-1 font-medium">{money(editForm.allowance)}</p>
            </div>
          )}

          {/* Estimated Pay Preview */}
          <div className="p-3.5 bg-brand-sage-50/60 dark:bg-brand-sage-950/30 rounded-2xl border border-brand-sage-200 dark:border-brand-sage-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-sage-800 dark:text-brand-sage-300 block">
                {isEn ? 'Guaranteed Minimum Pay' : 'Mức thu nhập cơ bản cam kết'}
              </span>
              <span className="text-xs text-brand-sage-700 dark:text-brand-sage-400">
                {String(editing.role).toUpperCase() === 'COACH' ? 'Lương cứng + thù lao ca dạy thực nhận' : 'Lương cơ bản + Phụ cấp'}
              </span>
            </div>
            <span className="text-base font-black font-chivo text-brand-sage-700 dark:text-brand-sage-300">
              {money(editForm.baseSalary + (String(editing.role).toUpperCase() === 'COACH' ? 0 : editForm.allowance))}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              type="button"
              onClick={() => setEditing(null)}
              disabled={busy}
              className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 transition-colors"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-black transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{busy ? (isEn ? 'Saving...' : 'Đang lưu...') : isEn ? 'Save Changes' : 'Lưu chính sách'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
