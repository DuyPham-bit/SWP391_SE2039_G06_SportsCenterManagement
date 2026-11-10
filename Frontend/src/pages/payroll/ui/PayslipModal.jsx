import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { KpiBadge } from './KpiBadge.jsx';
import { money } from '../lib/format.js';

export function PayslipModal({ isEn, month, setViewingPayslip, viewingPayslip, year }) {
  return (
    <Modal
      isOpen={Boolean(viewingPayslip)}
      onClose={() => setViewingPayslip(null)}
      title={isEn ? 'Official Payslip' : 'Phiếu lương nhân sự'}
      maxWidth="max-w-lg"
    >
      {viewingPayslip && (
        <div className="space-y-4 text-brand-navy-800 dark:text-brand-navy-200">
          {/* Header info */}
          <div className="text-center pb-4 border-b border-brand-navy-200 dark:border-brand-navy-800">
            <div className="text-xs font-black uppercase tracking-widest text-brand-sage-700 dark:text-brand-sage-500">
              {viewingPayslip.centerName || 'Olympic Sports Center SCMS'}
            </div>
            <h2 className="text-lg font-black mt-1 font-chivo">
              {isEn ? 'PAYSLIP STATEMENT' : 'PHIẾU THANH TOÁN LƯƠNG & THÙ LAO'}
            </h2>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'Period' : 'Kỳ lương'}: Tháng {month}/{year}
            </p>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-brand-navy-50 dark:bg-brand-navy-800 p-3 rounded-xl">
            <div>
              <span className="text-brand-navy-400">{isEn ? 'Employee' : 'Họ và tên'}:</span>
              <p className="font-bold text-brand-navy-900 dark:text-brand-navy-100">{viewingPayslip.fullName}</p>
            </div>
            <div>
              <span className="text-brand-navy-400">{isEn ? 'Staff Code' : 'Mã nhân sự'}:</span>
              <p className="font-mono font-bold text-brand-navy-900 dark:text-brand-navy-100">{viewingPayslip.employeeCode}</p>
            </div>
            <div>
              <span className="text-brand-navy-400">{isEn ? 'Position' : 'Vị trí công việc'}:</span>
              <p className="font-bold">{viewingPayslip.role}</p>
            </div>
            <div>
              <span className="text-brand-navy-400">{isEn ? 'Status' : 'Chính sách'}:</span>
              <p className="font-bold text-brand-sage-700 dark:text-brand-sage-400">
                {viewingPayslip.policyConfigured ? (isEn ? 'Standard' : 'Đã chuẩn hóa') : isEn ? 'Draft' : 'Chưa thiết lập'}
              </p>
            </div>
          </div>

          {/* Coach KPI Performance Block */}
          {String(viewingPayslip.role).toUpperCase() === 'COACH' && (
            <div className="p-3 rounded-xl bg-brand-teal-50/70 dark:bg-brand-teal-950/40 border border-brand-teal-200/70 dark:border-brand-teal-800/60 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-brand-teal-800 dark:text-brand-teal-300">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  <span>{isEn ? 'Session Target & Performance' : 'Chỉ tiêu ca dạy & Tiến độ hoàn thành'}</span>
                </span>
                <span><KpiBadge row={viewingPayslip} isEn={isEn} /></span>
              </div>
              <div className="pt-1 border-t border-brand-teal-200/60 dark:border-brand-teal-800/60 flex items-center justify-between">
                <div>
                  <span className="text-brand-navy-400 block text-[10px]">Ca dạy thực tế / KPI:</span>
                  <strong className="text-brand-navy-800 dark:text-brand-navy-200 text-sm">
                    {viewingPayslip.completedSessions} / {viewingPayslip.targetSessions > 0 ? `${viewingPayslip.targetSessions} ca` : 'Không áp'}
                  </strong>
                </div>
                {viewingPayslip.sessionKpiPercent !== null && (
                  <span className={`text-xs font-black ${viewingPayslip.sessionKpiPercent >= 100 ? 'text-brand-sage-700 dark:text-brand-sage-400' : 'text-brand-teal-700 dark:text-brand-teal-400'}`}>
                    Đạt {viewingPayslip.sessionKpiPercent}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Earnings Itemized Table */}
          <div className="border border-brand-navy-200 dark:border-brand-navy-800 rounded-xl overflow-hidden text-xs">
            <div className="bg-brand-navy-100 dark:bg-brand-navy-800 px-3 py-2 font-bold uppercase text-brand-navy-600 dark:text-brand-navy-300">
              {isEn ? 'Earnings Breakdown' : 'Chi tiết các khoản thu nhập'}
            </div>
            <div className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 p-1">
              <div className="flex items-center justify-between py-2 px-2.5">
                <span>{isEn ? '1. Fixed Base Salary' : '1. Lương cơ bản tháng'}</span>
                <span className="font-bold">{money(viewingPayslip.baseSalary)}</span>
              </div>
              {viewingPayslip.allowance > 0 && (
                <div className="flex items-center justify-between py-2 px-2.5">
                  <span>{isEn ? '2. Monthly Allowances' : '2. Các khoản phụ cấp'}</span>
                  <span className="font-bold">{money(viewingPayslip.allowance)}</span>
                </div>
              )}
              {viewingPayslip.completedSessions > 0 && (
                <div className="flex items-center justify-between py-2 px-2.5">
                  <div>
                    <span>{isEn ? '3. Teaching Sessions Pay' : '3. Thù lao ca dạy thực tế'}</span>
                    <span className="text-brand-navy-400 block text-[10px]">
                      ({viewingPayslip.completedSessions} {isEn ? 'completed classes' : 'ca học đã dạy'} × {money(viewingPayslip.commissionPerSession)})
                    </span>
                  </div>
                  <span className="font-bold text-brand-teal-700 dark:text-brand-teal-400">{money(viewingPayslip.sessionBonus)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5 px-2.5 bg-brand-sage-50/60 dark:bg-brand-sage-950/40 text-sm font-black text-brand-sage-700 dark:text-brand-sage-500">
                <span>{isEn ? 'TOTAL ESTIMATED NET' : 'TỔNG THU NHẬP DỰ KIẾN'}</span>
                <span>{money(viewingPayslip.estimatedTotal)}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setViewingPayslip(null)}
              className="px-4 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-xs font-bold hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy-900 text-white text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>{isEn ? 'Print Payslip' : 'In phiếu lương'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
