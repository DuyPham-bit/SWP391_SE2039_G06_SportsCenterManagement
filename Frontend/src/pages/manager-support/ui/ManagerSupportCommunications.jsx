import React, { useState } from 'react';
import { SupportRequests } from '../../../widgets/support-inbox/index.js';
import { systemApi } from '../../../entities/permission/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';

const TARGET_ROLES = [
  { id: 'Member', label: 'Hội viên', en: 'Members', icon: 'fitness_center' },
  { id: 'Coach', label: 'Huấn luyện viên', en: 'Coaches', icon: 'sports' },
  { id: 'Receptionist', label: 'Lễ tân', en: 'Receptionists', icon: 'support_agent' },
  { id: 'Manager', label: 'Quản lý', en: 'Managers', icon: 'admin_panel_settings' }
];

export function ManagerSupportCommunications() {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const isEn = language === 'en';
  const [activeTab, setActiveTab] = useState('SUPPORT');
  const [sendToAll, setSendToAll] = useState(true);
  const [targetRoles, setTargetRoles] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState(['InApp', 'Email']);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const toggleRole = role => {
    setTargetRoles(values => values.includes(role) ? values.filter(value => value !== role) : [...values, role]);
  };

  const submit = async event => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();
    if (!trimmedTitle || !trimmedMessage) {
      setFormError(isEn ? 'Enter both a title and message.' : 'Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }
    if (!sendToAll && targetRoles.length === 0) {
      setFormError(isEn ? 'Select at least one recipient role.' : 'Chọn ít nhất một vai trò nhận thông báo.');
      return;
    }
    if (selectedChannels.length === 0) {
      setFormError(isEn ? 'Select at least one delivery channel.' : 'Chọn ít nhất một kênh gửi tin.');
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const result = await systemApi.sendCenterNotification({
        title: trimmedTitle, message: trimmedMessage, sendToAll, targetRoles, channels: selectedChannels
      });
      setLastResult(result);
      setTitle('');
      setMessage('');
      showSuccess(isEn
        ? `Notification sent to ${result.recipientCount} active accounts.`
        : `Đã gửi thông báo tới ${result.recipientCount} tài khoản đang hoạt động.`);
    } catch (error) {
      setFormError(error.message || (isEn ? 'Unable to send notification.' : 'Không thể gửi thông báo.'));
      showError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-slide-up">
      <section className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-brand-navy-900 via-brand-navy-900 to-brand-navy-900 text-white shadow-xl">
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-brand-sand-300 text-[30px]">campaign</span>
            <div>
              <h1 className="font-chivo text-2xl md:text-3xl font-black">
                {isEn ? 'Support & Center Communications' : 'Tiếp Nhận Hỗ Trợ & Gửi Thông Báo'}
              </h1>
              <p className="mt-1 text-sm text-brand-navy-300 max-w-3xl">
                {isEn
                  ? 'Resolve requests and publish announcements only to active accounts in your assigned center.'
                  : 'Xử lý yêu cầu và gửi thông báo đúng các tài khoản đang hoạt động trong trung tâm được phân công.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
            {[
              ['SUPPORT', 'support_agent', isEn ? 'Support requests' : 'Yêu cầu hỗ trợ'],
              ['NOTIFICATIONS', 'notifications_active', isEn ? 'Send notification' : 'Gửi thông báo']
            ].map(([id, icon, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${activeTab === id ? 'bg-brand-sage-700 text-white shadow-lg' : 'bg-white/10 text-brand-navy-200 hover:bg-white/20'}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>{label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeTab === 'SUPPORT' && <SupportRequests allowCreate={false} showHeader={false} />}

      {activeTab === 'NOTIFICATIONS' && (
        <div className={`grid gap-5 ${lastResult ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : 'grid-cols-1'}`}>
          <form onSubmit={submit} className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200 dark:border-brand-navy-800 rounded-2xl shadow-sm p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white">
                {isEn ? 'Compose center announcement' : 'Soạn thông báo trung tâm'}
              </h2>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
                {isEn ? 'Locked, inactive, and out-of-center accounts are excluded by the server.' : 'Backend tự loại tài khoản bị khóa, ngừng hoạt động hoặc không thuộc trung tâm.'}
              </p>
            </div>

            <fieldset disabled={busy} className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-2">
                {isEn ? 'Recipients' : 'Người nhận'}
              </legend>
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${sendToAll ? 'border-brand-sage-700 bg-brand-sage-50/70 dark:bg-brand-sage-950/20' : 'border-brand-navy-200 dark:border-brand-navy-700'}`}>
                <input type="radio" name="audience" checked={sendToAll} onChange={() => setSendToAll(true)} className="accent-brand-sage-700" />
                <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400">groups</span>
                <span><strong className="block text-sm text-brand-navy-900 dark:text-white">{isEn ? 'Everyone in this center' : 'Toàn bộ trung tâm'}</strong><span className="text-xs text-brand-navy-500">{isEn ? 'All active roles, excluding your own account' : 'Mọi vai trò đang hoạt động, không gửi cho chính bạn'}</span></span>
              </label>
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${!sendToAll ? 'border-brand-sage-700 bg-brand-sage-50/70 dark:bg-brand-sage-950/20' : 'border-brand-navy-200 dark:border-brand-navy-700'}`}>
                <input type="radio" name="audience" checked={!sendToAll} onChange={() => setSendToAll(false)} className="accent-brand-sage-700" />
                <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400">group_work</span>
                <span><strong className="block text-sm text-brand-navy-900 dark:text-white">{isEn ? 'Selected roles' : 'Theo vai trò được chọn'}</strong><span className="text-xs text-brand-navy-500">{isEn ? 'Send only to one or more role groups' : 'Chỉ gửi tới một hoặc nhiều nhóm vai trò'}</span></span>
              </label>
              {!sendToAll && <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {TARGET_ROLES.map(role => {
                  const checked = targetRoles.includes(role.id);
                  return <label key={role.id} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer ${checked ? 'border-brand-sage-500 bg-brand-sage-500/10' : 'border-brand-navy-200 dark:border-brand-navy-700'}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleRole(role.id)} className="accent-brand-sage-700" />
                    <span className="material-symbols-outlined text-[18px] text-brand-navy-500">{role.icon}</span>
                    <span className="text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200">{isEn ? role.en : role.label}</span>
                  </label>;
                })}
              </div>}
            </fieldset>

            <fieldset disabled={busy} className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-2">
                {isEn ? 'Delivery Channels' : 'Kênh gửi tin'}
              </legend>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['InApp', 'Email'].map((ch) => {
                  const checked = selectedChannels.includes(ch);
                  return (
                    <label
                      key={ch}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked ? 'border-brand-sage-500 bg-brand-sage-500/10' : 'border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedChannels(values =>
                            values.includes(ch) ? (values.length > 1 ? values.filter(v => v !== ch) : values) : [...values, ch]
                          );
                        }}
                        className="accent-brand-sage-700"
                      />
                      <span className="material-symbols-outlined text-[18px] text-brand-navy-500">
                        {ch === 'InApp' ? 'notifications_active' : 'mail'}
                      </span>
                      <span className="text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200">{ch}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-brand-navy-400">
                {isEn ? 'In-App messages are delivered instantly; Email queued and supervised by the center.' : 'Tin nhắn In-App gửi tức thì; Email vào hàng đợi được giám sát bởi trung tâm.'}
              </p>
            </fieldset>

            <div className="space-y-2">
              <div className="flex justify-between"><label className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">{isEn ? 'Title' : 'Tiêu đề'} *</label><span className="text-[11px] text-brand-navy-400">{title.length}/200</span></div>
              <input value={title} onChange={event => setTitle(event.target.value)} maxLength={200} disabled={busy}
                className="w-full px-4 py-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-700" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between"><label className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">{isEn ? 'Message' : 'Nội dung'} *</label><span className="text-[11px] text-brand-navy-400">{message.length}/5000</span></div>
              <textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={5000} rows={8} disabled={busy}
                className="w-full px-4 py-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-sage-700" />
            </div>
            {formError && <div role="alert" className="p-3 rounded-xl border border-brand-danger-200 bg-brand-danger-50 text-brand-danger-700 text-xs">{formError}</div>}
            <div className="flex justify-end">
              <button disabled={busy} className="px-6 py-3 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px]">send</span>{busy ? (isEn ? 'Sending...' : 'Đang gửi...') : (isEn ? 'Send notification' : 'Gửi thông báo')}
              </button>
            </div>
          </form>

          {lastResult && <aside>
            <div role="status" className="p-5 rounded-2xl border border-brand-sage-200 dark:border-brand-sage-900 bg-brand-sage-50/80 dark:bg-brand-sage-950/20">
              <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400">mark_email_read</span>
              <h3 className="font-bold text-sm text-brand-sage-950 dark:text-brand-sage-100 mt-2">{isEn ? 'Most recent send' : 'Lần gửi gần nhất'}</h3>
              <p className="text-2xl font-black text-brand-sage-700 dark:text-brand-sage-300 mt-2">{lastResult.recipientCount}</p>
              <p className="text-xs text-brand-sage-800 dark:text-brand-sage-200">{isEn ? 'active recipients' : 'người nhận đang hoạt động'}</p>
            </div>
          </aside>}
        </div>
      )}
    </div>
  );
}
