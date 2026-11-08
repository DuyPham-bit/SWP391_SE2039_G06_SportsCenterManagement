import React, { useEffect, useState } from 'react';
import { refundApi } from '../../../entities/payment/index.js';
import { safeHref } from '../../../shared/lib/safeUrl.js';
import { uploadMediaFileToCloud } from '../../../shared/api/mediaApi.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

export function RefundManagement({ embedded = false }) {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const isEn = language === 'en';
  const [status, setStatus] = useState('Pending');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState('Approved');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await refundApi.getForManager(status)); } catch (error) { showError(error); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [status]);

  const review = async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      let transferProofUrl = null;
      if (decision === 'Approved') {
        const file = form.get('proof');
        if (!(file instanceof File) || !file.size) throw new Error(isEn ? 'Transfer proof image is required.' : 'Bắt buộc chọn ảnh xác nhận chuyển khoản.');
        transferProofUrl = (await uploadMediaFileToCloud(file)).url;
      }
      await refundApi.review(selected.id, {
        status: decision,
        transferProofUrl,
        transferReference: form.get('transferReference')?.trim() || null,
        reviewNote: form.get('reviewNote')?.trim() || null
      });
      showSuccess(decision === 'Approved' ? (isEn ? 'Refund approved and recorded.' : 'Đã duyệt và ghi nhận hoàn tiền.') : (isEn ? 'Refund request rejected.' : 'Đã từ chối yêu cầu hoàn tiền.'));
      setSelected(null);
      await load();
    } catch (error) { showError(error); } finally { setBusy(false); }
  };

  return <div className="space-y-6 animate-fade-slide-up">
    {!embedded && <header className="rounded-3xl bg-gradient-to-r from-brand-navy-900 via-brand-teal-600 to-brand-sand-500 p-6 text-white shadow-xl"><p className="text-xs font-black uppercase tracking-widest text-brand-sand-100">{isEn ? 'Financial operations' : 'Nghiệp vụ tài chính'}</p><h1 className="mt-1 font-chivo text-2xl font-black">{isEn ? 'Refund Request Management' : 'Quản lý yêu cầu hoàn tiền'}</h1><p className="mt-2 text-sm text-white/90">{isEn ? 'Verify member bank details, transfer manually, then upload proof before approval.' : 'Kiểm tra tài khoản hội viên, chuyển khoản thủ công, sau đó tải ảnh xác nhận trước khi duyệt.'}</p></header>}
    <nav className="flex gap-2 rounded-2xl border border-brand-navy-200 bg-white p-2">{['Pending','Approved','Rejected'].map(value => <button key={value} onClick={() => setStatus(value)} className={`rounded-xl px-4 py-2 text-xs font-bold ${status === value ? 'bg-brand-navy-900 text-white' : 'text-brand-navy-600 hover:bg-brand-navy-100'}`}>{value}</button>)}</nav>
    {loading ? <LoadingSpinner text={isEn ? 'Loading refund requests...' : 'Đang tải yêu cầu hoàn tiền...'} /> : <div className="grid gap-4 lg:grid-cols-2">
      {!items.length && <div className="col-span-full rounded-2xl border border-dashed border-brand-navy-300 bg-white p-10 text-center text-sm text-brand-navy-500">{isEn ? 'No request in this status.' : 'Không có yêu cầu ở trạng thái này.'}</div>}
      {items.map(item => <article key={item.id} className="rounded-2xl border border-brand-navy-200 bg-white p-5 shadow-sm dark:border-brand-navy-800 dark:bg-brand-navy-900"><div className="flex items-start justify-between gap-3"><div><h2 className="font-chivo font-black">{item.memberName} <span className="text-xs text-brand-navy-400">{item.memberCode}</span></h2><p className="text-xs text-brand-navy-500">{item.invoiceNumber} · {item.paymentMethod}</p></div><strong className="text-lg text-brand-sage-700 dark:text-brand-sage-400">{money(item.amount)}</strong></div><div className="mt-4 rounded-xl bg-brand-navy-50 p-3 text-sm"><p><strong>{isEn ? 'Receive at:' : 'Nhận tại:'}</strong> {item.bankName} · {item.bankAccountNumber}</p><p className="mt-1 font-bold uppercase">{item.bankAccountName}</p></div><p className="mt-3 text-sm text-brand-navy-700"><strong>{isEn ? 'Reason:' : 'Lý do:'}</strong> {item.reason}</p>{item.status === 'Pending' && <button onClick={() => { setSelected(item); setDecision('Approved'); }} className="mt-4 w-full rounded-xl bg-brand-navy-900 px-4 py-2.5 text-sm font-bold text-brand-sand-300">{isEn ? 'Review request' : 'Xử lý yêu cầu'}</button>}{safeHref(item.transferProofUrl) && <a className="mt-3 inline-block text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 underline" href={safeHref(item.transferProofUrl)} target="_blank" rel="noreferrer">{isEn ? 'Transfer proof' : 'Ảnh chuyển khoản'}</a>}</article>)}
    </div>}
    <Modal isOpen={Boolean(selected)} onClose={() => !busy && setSelected(null)} title={isEn ? 'Review refund request' : 'Xử lý yêu cầu hoàn tiền'}>
      {selected && <form onSubmit={review} className="space-y-4"><div className="rounded-xl bg-brand-navy-50 p-3 text-sm"><strong>{selected.memberName}</strong><p>{money(selected.amount)} → {selected.bankName} · {selected.bankAccountNumber} · {selected.bankAccountName}</p></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setDecision('Approved')} className={`rounded-xl border p-3 text-sm font-bold ${decision === 'Approved' ? 'border-brand-sage-500 bg-brand-sage-50 text-brand-sage-700' : 'border-brand-navy-200'}`}>{isEn ? 'Approve' : 'Chấp nhận'}</button><button type="button" onClick={() => setDecision('Rejected')} className={`rounded-xl border p-3 text-sm font-bold ${decision === 'Rejected' ? 'border-brand-danger-500 bg-brand-danger-50 text-brand-danger-700' : 'border-brand-navy-200'}`}>{isEn ? 'Reject' : 'Từ chối'}</button></div>{decision === 'Approved' && <><label className="block text-xs font-bold">{isEn ? 'Transfer proof image *' : 'Ảnh xác nhận chuyển khoản *'}<input name="proof" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" required className="mt-1 block w-full rounded-xl border border-brand-navy-300 p-2 text-sm" /></label><label className="block text-xs font-bold">{isEn ? 'Bank transfer reference' : 'Mã giao dịch ngân hàng'}<input name="transferReference" maxLength="150" className="mt-1 w-full rounded-xl border border-brand-navy-300 p-3 text-sm" /></label></>}<label className="block text-xs font-bold">{decision === 'Rejected' ? (isEn ? 'Rejection reason *' : 'Lý do từ chối *') : (isEn ? 'Manager note' : 'Ghi chú quản lý')}<textarea name="reviewNote" required={decision === 'Rejected'} maxLength="1000" rows="3" className="mt-1 w-full rounded-xl border border-brand-navy-300 p-3 text-sm" /></label><button disabled={busy} className={`w-full rounded-xl px-4 py-3 text-sm font-black text-white disabled:opacity-50 ${decision === 'Approved' ? 'bg-brand-sage-600' : 'bg-brand-danger-600'}`}>{busy ? (isEn ? 'Processing...' : 'Đang xử lý...') : (decision === 'Approved' ? (isEn ? 'Confirm transferred & approve' : 'Xác nhận đã chuyển và duyệt') : (isEn ? 'Confirm rejection' : 'Xác nhận từ chối'))}</button></form>}
    </Modal>
  </div>;
}

export default RefundManagement;
