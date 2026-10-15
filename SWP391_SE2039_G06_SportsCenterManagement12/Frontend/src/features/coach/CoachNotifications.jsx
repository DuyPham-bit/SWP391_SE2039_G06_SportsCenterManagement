import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { CoachError } from './CoachShared.js';
import { formatMemberDateTime } from '../member/memberOverview.js';

const { useState, useEffect } = React;

export function CoachNotifications() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState('CLASS'); // 'CLASS' | 'ALL'
  const [selectedClassId, setSelectedClassId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [classList, notifs] = await Promise.all([coachApi.getCoachClassesAndMembers(), coachApi.getNotifications()]);
      setClasses(classList);
      if (classList.length > 0) setSelectedClassId(classList[0].id);
      setNotifications(notifs);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showError('Vui lòng điền tiêu đề và nội dung thông báo!');
      return;
    }
    if (targetType === 'CLASS' && !selectedClassId) {
      showError('Vui lòng chọn lớp nhận thông báo.');
      return;
    }

    const cls = classes.find(c => c.id === selectedClassId);
    const targetLabel = targetType === 'CLASS' ? `Lớp: ${cls?.name}` : 'Toàn bộ học viên của HLV';

    setSending(true);
    try {
      await coachApi.sendNotification({
        classId: targetType === 'CLASS' ? selectedClassId : null,
        coachId: currentUser?.id,
        coachName: currentUser?.fullName || 'HLV',
        target: targetLabel,
        title: title.trim(),
        content: content.trim()
      });
      showSuccess('Đã gửi thông báo/bài tập về nhà thành công!');
      setModalOpen(false);
      setTitle('');
      setContent('');
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi gửi thông báo');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner text="Đang tải danh sách thông báo..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            SEND HOMEWORK / NOTIFICATIONS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Gửi Bài Tập & Thông Báo Cho Học Viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giao bài tập tự rèn luyện tại nhà, nhắc nhở lịch tập hoặc thông báo thay đổi thời gian ca dạy.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={!classes.length || Boolean(error)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          <span>Soạn Thông Báo Mới</span>
        </button>
      </div>

      {/* Notifications Cards Feed */}
      <CoachError message={error} retry={loadData} />
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto">
            <span className="material-symbols-outlined text-5xl text-slate-300">chat_bubble_outline</span>
            <h3 className="font-chivo text-base font-bold text-slate-900 mt-2">
              Chưa Có Thông Báo Nào
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hãy soạn thông báo hoặc bài tập về nhà đầu tiên gửi tới các lớp học của bạn.
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-chivo font-black">
                    <span className="material-symbols-outlined text-[20px]">campaign</span>
                  </div>
                  <div>
                    <h3 className="font-chivo text-base font-bold text-slate-900">{notif.title}</h3>
                    <div className="text-[11px] text-slate-500">
                      Gửi tới: <strong className="text-red-600">{notif.target}</strong> • {notif.recipientCount} người nhận
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{formatMemberDateTime(notif.createdAt)}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {notif.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Create Notification Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Gửi Bài Tập & Thông Báo Lớp Học"
      >
        <form onSubmit={handleSendNotification} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Gửi tới đối tượng *
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => setTargetType('CLASS')}
                className={`py-2 text-xs font-bold font-chivo uppercase rounded-lg border transition-all ${targetType === 'CLASS'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200'
                  }`}
              >
                Theo từng lớp học
              </button>
              <button
                type="button"
                onClick={() => setTargetType('ALL')}
                className={`py-2 text-xs font-bold font-chivo uppercase rounded-lg border transition-all ${targetType === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200'
                  }`}
              >
                Toàn bộ học viên của tôi
              </button>
            </div>

            {targetType === 'CLASS' && (
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
              >
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.sportName})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tiêu đề thông báo / bài tập *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Bài tập giãn cơ xô tại nhà trước buổi tập Thứ 4"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nội dung chi tiết *
            </label>
            <textarea
              rows="4"
              required
              placeholder="Nhập nội dung bài tập, số hiệp cần tự tập hoặc thông báo thay đổi lịch..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors"
            >
              {sending ? 'Đang gửi...' : 'Gửi Thông Báo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
