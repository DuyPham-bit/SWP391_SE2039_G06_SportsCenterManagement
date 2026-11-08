import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { getSubscriptionPresentation, formatMembershipPrice, formatMembershipDuration } from '../model/memberManagementView.js';
import { formatMemberDate, formatMemberDateTime } from '../../../entities/member/index.js';

export function SubscriptionHistoryModal({ busy, isEn, loadingSubs, modal, openSubscriptions, setModal, subscriptionError, subscriptions }) {
  return (
    <Modal
      isOpen={modal?.type === 'subscriptions'}
      onClose={() => !busy && setModal(null)}
      title={modal?.row ? (isEn ? `Subscription History · ${modal.row.fullName}` : `Lịch sử gói tập · ${modal.row.fullName}`) : isEn ? 'Subscription History' : 'Lịch sử gói tập'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
          <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Total subscriptions purchased:' : 'Tổng số gói từng đăng ký:'}{' '}
            <strong className="text-brand-navy-800 dark:text-brand-navy-200">{subscriptions.length}</strong>
          </div>
          {modal?.row && (
            <span className="font-mono text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 bg-brand-navy-100 dark:bg-brand-navy-800 px-2 py-0.5 rounded">
              {modal.row.memberCode}
            </span>
          )}
        </div>

        {loadingSubs ? (
          <LoadingSpinner text={isEn ? 'Loading subscription history...' : 'Đang tải lịch sử đăng ký...'} />
        ) : subscriptionError ? (
          <div role="alert" className="rounded-xl border border-brand-danger-200 dark:border-brand-danger-900/60 bg-brand-danger-50 dark:bg-brand-danger-950/40 p-4 text-sm text-brand-danger-800 dark:text-brand-danger-300">
            <p>{subscriptionError}</p>
            <button type="button" className="mt-2 font-bold underline" onClick={() => openSubscriptions(modal.row)}>
              {isEn ? 'Retry' : 'Thử lại'}
            </button>
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {subscriptions.map((s) => {
              const status = getSubscriptionPresentation(s.status);
              return (
                <article
                  key={s.subscriptionId}
                  className="p-4 rounded-xl border border-brand-navy-200 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700 transition-colors bg-white dark:bg-brand-navy-900 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[18px]">workspace_premium</span>
                      <h4 className="font-bold text-sm text-brand-navy-900 dark:text-brand-navy-100">{s.packageName || (isEn ? 'Unnamed Package' : 'Gói chưa có tên')}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-brand-navy-600 dark:text-brand-navy-300">
                    <span className="font-bold text-brand-navy-900 dark:text-brand-navy-100">{formatMembershipPrice(s.price)}</span>
                    <span>·</span>
                    <span>
                      {isEn ? 'Duration:' : 'Thời hạn:'} <strong>{formatMembershipDuration(s.durationDays)}</strong>
                    </span>
                    <span>·</span>
                    <span className="text-brand-navy-500 dark:text-brand-navy-400">
                      {isEn ? 'Valid:' : 'Hiệu lực:'} {s.startDate ? formatMemberDate(s.startDate) : isEn ? 'Not activated' : 'Chưa kích hoạt'} –{' '}
                      {s.endDate ? formatMemberDate(s.endDate) : isEn ? 'None' : 'Chưa có'}
                    </span>
                  </div>

                  {s.createdAt && (
                    <div className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500">
                      {isEn ? 'Created at:' : 'Ngày tạo giao dịch:'} {formatMemberDateTime(s.createdAt)}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-brand-navy-400 space-y-2">
            <span className="material-symbols-outlined text-4xl text-brand-navy-300">receipt_long</span>
            <p className="text-sm font-semibold text-brand-navy-600 dark:text-brand-navy-300">{isEn ? 'No subscription records found' : 'Chưa có lịch sử đăng ký gói nào'}</p>
            <p className="text-xs text-brand-navy-400">{isEn ? 'This member has not purchased any packages yet.' : 'Hội viên chưa mua gói tập tại trung tâm hoặc trực tuyến.'}</p>
          </div>
        )}

        <div className="pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800 flex justify-end">
          <button
            type="button"
            onClick={() => setModal(null)}
            className="px-5 py-2 rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-white text-xs font-bold transition-colors shadow-sm"
          >
            {isEn ? 'Close' : 'Đóng'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
