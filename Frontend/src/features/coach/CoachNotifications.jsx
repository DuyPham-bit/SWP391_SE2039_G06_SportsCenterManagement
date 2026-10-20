import React, { useState, useEffect, useMemo } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.jsx';
import { CoachError } from './CoachShared.jsx';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { useNotifications } from '../../components/common/useNotifications.js';
import { NotificationList } from '../../components/common/NotificationList.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

// Bảng gợi ý mẫu thông báo & bài tập theo lớp (1-click template pills)
const QUICK_TEMPLATES = [
  {
    label: '🏋️ Bài tập tại nhà',
    title: '[Bài tập] Tự rèn luyện thể lực bổ trợ trước ca học',
    content: 'Chào các bạn học viên,\n\nĐể chuẩn bị tốt nhất cho buổi tập tiếp theo, các bạn vui lòng thực hiện bài tập bổ trợ tại nhà:\n1. Khởi động khớp cổ tay, cổ chân, vai: 5 phút\n2. Hít đất / Plank: 3 hiệp x 30-45 giây\n3. Squat bật nhảy nhẹ: 3 hiệp x 15 lần\n\nNghỉ giữa hiệp 60 giây và uống đủ 500ml nước nhé!'
  },
  {
    label: '⏰ Nhắc lịch tập',
    title: '[Nhắc lịch] Nhắc nhở ca học ngày mai & chuẩn bị đồ tập',
    content: 'Chào các bạn,\n\nNhắc nhở lớp học có ca tập vào ngày mai. Các bạn lưu ý:\n- Có mặt sớm 10 phút trước giờ học để khởi động.\n- Mang theo bình nước cá nhân, khăn lau mồ hôi và trang phục thể thao phù hợp.\n- Nếu có việc bận đột xuất, vui lòng báo trước cho HLV.'
  },
  {
    label: '📢 Thay đổi lịch',
    title: '[Thông báo] Cập nhật điều chỉnh thời gian ca dạy',
    content: 'Chào toàn thể lớp học,\n\nDo trung tâm có lịch bảo trì sân bãi / sự kiện thể thao, ca học sắp tới sẽ được dời sang khung giờ mới.\nChi tiết ca học đã được cập nhật trên hệ thống SCMS. Các bạn kiểm tra lại lịch trên ứng dụng nhé!'
  },
  {
    label: '🥗 Dinh dưỡng',
    title: '[Dinh dưỡng] Hướng dẫn bổ sung năng lượng phục hồi sau buổi tập',
    content: 'Chào các bạn,\n\nSau buổi tập cường độ cao hôm nay, các bạn nhớ bổ sung dinh dưỡng hợp lý:\n- Uống đủ nước bù điện giải trong vòng 30 phút sau tập.\n- Nạp bữa ăn giàu protein (ức gà, trứng, sữa) và tinh bột chậm.\n- Ngủ đủ giấc 7-8 tiếng để cơ bắp phục hồi tối đa.'
  }
];

// Tự động phân loại thẻ dựa trên nội dung bài tập / thông báo lớp học
function detectType(title = '', content = '', isEn = false) {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('bài tập') || text.includes('rèn luyện') || text.includes('hiệp') || text.includes('reps') || text.includes('tập tại nhà') || text.includes('plank') || text.includes('squat') || text.includes('homework') || text.includes('workout')) {
    return {
      type: 'HOMEWORK',
      label: isEn ? 'Homework & Workout' : 'Bài tập về nhà',
      icon: 'fitness_center',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
      stripe: 'border-l-amber-500'
    };
  }
  if (text.includes('nhắc') || text.includes('lịch') || text.includes('chuẩn bị') || text.includes('đúng giờ') || text.includes('mang') || text.includes('reminder')) {
    return {
      type: 'REMINDER',
      label: isEn ? 'Class Reminder' : 'Nhắc lịch học',
      icon: 'schedule',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
      iconBg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
      stripe: 'border-l-sky-500'
    };
  }
  if (text.includes('nghỉ') || text.includes('thay đổi') || text.includes('hoãn') || text.includes('bù') || text.includes('hủy') || text.includes('dời') || text.includes('reschedule') || text.includes('change')) {
    return {
      type: 'SCHEDULE_CHANGE',
      label: isEn ? 'Schedule Update' : 'Thay đổi ca dạy',
      icon: 'campaign',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      iconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
      stripe: 'border-l-rose-500'
    };
  }
  if (text.includes('dinh dưỡng') || text.includes('ăn') || text.includes('uống') || text.includes('protein') || text.includes('nước') || text.includes('phục hồi') || text.includes('nutrition')) {
    return {
      type: 'NUTRITION',
      label: isEn ? 'Nutrition & Recovery' : 'Dinh dưỡng & Phục hồi',
      icon: 'restaurant',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
      stripe: 'border-l-emerald-500'
    };
  }
  return {
    type: 'ANNOUNCEMENT',
    label: isEn ? 'Class Announcement' : 'Thông báo lớp học',
    icon: 'volume_up',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    stripe: 'border-l-blue-500'
  };
}

export function CoachNotifications() {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const inbox = useNotifications();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('SENT'); // 'SENT' (Đã gửi) | 'INBOX' (Hộp thư đến)
  const [notifications, setNotifications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc danh sách đã gửi
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Chế độ xem & Thẻ đang chọn (Master-Detail)
  const [viewMode, setViewMode] = useState('split'); // 'split' (chia đôi) | 'grid' (lưới thẻ)
  const [selectedNotifId, setSelectedNotifId] = useState(null);

  // Modal State: Soạn thông báo mới (Broadcast cho Lớp học)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('ALL'); // 'ALL' hoặc ID lớp
  const [isMultiClass, setIsMultiClass] = useState(false); // Chế độ chọn nhiều lớp cụ thể
  const [selectedClassIds, setSelectedClassIds] = useState([]); // Mảng ID các lớp đã chọn khi ở multi-mode
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [classList, notifs] = await Promise.all([
        coachApi.getCoachClassesAndMembers(),
        coachApi.getNotifications()
      ]);
      setClasses(classList || []);
      setNotifications(notifs || []);
    } catch (err) {
      setError(err.message || (isEn ? 'Could not load notifications.' : 'Không thể tải dữ liệu thông báo.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý gửi thông báo broadcast
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showError(isEn ? 'Please fill in title and notification content!' : 'Vui lòng điền tiêu đề và nội dung thông báo!');
      return;
    }

    setSending(true);
    try {
      if (isMultiClass) {
        if (selectedClassIds.length === 0) {
          showError(isEn ? 'Please select at least one class!' : 'Vui lòng chọn ít nhất 1 lớp nhận thông báo!');
          setSending(false);
          return;
        }

        // Nếu chọn tất cả các lớp trong multi-mode
        if (selectedClassIds.length === classes.length) {
          await coachApi.sendNotification({
            classId: null,
            memberId: null,
            coachId: currentUser?.id,
            coachName: currentUser?.fullName || 'HLV',
            target: isEn ? 'All assigned classes' : 'Toàn bộ các lớp học phụ trách',
            title: title.trim(),
            content: content.trim()
          });
        } else {
          // Gửi lần lượt tới từng lớp đã chọn
          await Promise.all(
            selectedClassIds.map(async cid => {
              const cls = classes.find(c => String(c.id) === String(cid));
              return coachApi.sendNotification({
                classId: Number(cid),
                memberId: null,
                coachId: currentUser?.id,
                coachName: currentUser?.fullName || 'HLV',
                target: `Lớp: ${cls?.name || cid}`,
                title: title.trim(),
                content: content.trim()
              });
            })
          );
        }

        showSuccess(
          isEn
            ? `Broadcasted notice to ${selectedClassIds.length} classes successfully!`
            : `Đã gửi thông báo/bài tập tới ${selectedClassIds.length} lớp học thành công!`
        );
      } else {
        const isAllClasses = selectedClassId === 'ALL' || !selectedClassId;
        const cls = !isAllClasses ? classes.find(c => String(c.id) === String(selectedClassId)) : null;
        const targetLabel = isAllClasses
          ? (isEn ? 'All assigned classes' : 'Toàn bộ các lớp học phụ trách')
          : `Lớp: ${cls?.name || selectedClassId}`;

        await coachApi.sendNotification({
          classId: isAllClasses ? null : Number(selectedClassId),
          memberId: null,
          coachId: currentUser?.id,
          coachName: currentUser?.fullName || 'HLV',
          target: targetLabel,
          title: title.trim(),
          content: content.trim()
        });

        showSuccess(
          isAllClasses
            ? (isEn ? 'Broadcasted notice to all enrolled students across your classes!' : 'Đã phát thông báo/bài tập đến toàn bộ học viên các lớp!')
            : (isEn ? `Sent notice to ${cls?.name || 'class'} successfully!` : `Đã gửi thông báo/bài tập tới ${cls?.name || 'lớp học'} thành công!`)
        );
      }

      setModalOpen(false);
      setTitle('');
      setContent('');
      setSelectedClassIds([]);
      setIsMultiClass(false);
      setSelectedClassId('ALL');
      setActiveTab('SENT');
      loadData();
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to send notification' : 'Lỗi gửi thông báo'));
    } finally {
      setSending(false);
    }
  };

  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setContent(tpl.content);
  };

  const handleCopyContent = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showSuccess(isEn ? 'Copied notification content to clipboard!' : 'Đã sao chép nội dung thông báo vào bộ nhớ tạm!');
    }
  };

  const handleDuplicate = (notif) => {
    setTitle(notif.title || '');
    setContent(notif.content || '');
    setIsMultiClass(false);
    if (notif.classId) {
      setSelectedClassId(String(notif.classId));
    } else {
      setSelectedClassId('ALL');
    }
    setModalOpen(true);
  };

  // Toggle chọn lớp trong multi-mode
  const handleToggleClass = (classId) => {
    const cidStr = String(classId);
    setSelectedClassIds(prev =>
      prev.includes(cidStr) ? prev.filter(id => id !== cidStr) : [...prev, cidStr]
    );
  };

  const handleSelectAllClasses = () => {
    if (selectedClassIds.length === classes.length) {
      setSelectedClassIds([]);
    } else {
      setSelectedClassIds(classes.map(c => String(c.id)));
    }
  };

  // Lọc danh sách thông báo đã gửi
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Tìm kiếm theo tiêu đề, nội dung, tên lớp
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchContent = n.content?.toLowerCase().includes(q);
        const matchTarget = n.target?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchTarget) return false;
      }

      // 2. Lọc đối tượng gửi (Tất cả các lớp hoặc lớp cụ thể)
      if (selectedClassFilter !== 'ALL') {
        const cid = Number(selectedClassFilter);
        if (n.classId !== cid && !n.target?.includes(String(selectedClassFilter))) return false;
      }

      // 3. Lọc theo thể loại bài tập / thông báo
      if (selectedTypeFilter !== 'ALL') {
        const t = detectType(n.title, n.content);
        if (t.type !== selectedTypeFilter) return false;
      }

      return true;
    });
  }, [notifications, searchQuery, selectedClassFilter, selectedTypeFilter]);

  // Thống kê nhanh: CHỈ GIỮ ĐÚNG 2 CHỈ SỐ THEO YÊU CẦU
  const stats = useMemo(() => {
    const totalSent = notifications.length;
    // Tổng lượt học viên tiếp cận dựa trên sỉ số các lớp đã nhận thông báo
    const totalRecipients = notifications.reduce((acc, n) => {
      if (typeof n.recipientCount === 'number' && n.recipientCount > 0) {
        return acc + n.recipientCount;
      }
      if (n.classId) {
        const cls = classes.find(c => String(c.id) === String(n.classId));
        const count = cls?.enrolledCount || (cls?.members || cls?.Members || []).length || 0;
        return acc + count;
      }
      const allCount = classes.reduce((sum, c) => sum + (c.enrolledCount || (c.members || c.Members || []).length || 0), 0);
      return acc + (allCount || 0);
    }, 0);
    const inboxUnread = (inbox?.items || []).filter(i => !i.isRead).length;
    return { totalSent, totalRecipients, inboxUnread };
  }, [notifications, classes, inbox]);

  // Tự động chọn tin nhắn đầu tiên khi danh sách thay đổi
  useEffect(() => {
    if (filteredNotifications.length > 0) {
      if (!selectedNotifId || !filteredNotifications.some(n => n.id === selectedNotifId)) {
        setSelectedNotifId(filteredNotifications[0].id);
      }
    } else {
      setSelectedNotifId(null);
    }
  }, [filteredNotifications, selectedNotifId]);

  const selectedNotif = useMemo(() => {
    return filteredNotifications.find(n => n.id === selectedNotifId) || filteredNotifications[0] || null;
  }, [filteredNotifications, selectedNotifId]);

  if (loading) return <LoadingSpinner text={isEn ? "Loading notifications..." : "Đang tải danh sách thông báo..."} />;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. TOP HEADER BANNER */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#32354D] via-[#2B2D42] to-[#1E2235] text-white p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-[#F2CC8F]/15 blur-3xl" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(242,204,143,0.15)] text-[#F2CC8F] text-[11px] font-bold uppercase tracking-widest border border-[rgba(242,204,143,0.3)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#F2CC8F] animate-pulse" />
            {isEn ? 'Class Broadcast & Homework Distribution' : 'Thông báo một chiều & Giao bài tập theo lớp'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[28px] text-[#F2CC8F]">campaign</span>
            {isEn ? 'Send Workouts & Class Announcements' : 'Gửi Bài Tập & Thông Báo Lớp Học'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Broadcast homework drills and announcements to all enrolled students across your classes.'
              : 'Giao bài tập về nhà và phát thông báo một chiều tới toàn thể học viên trong các lớp học phụ trách.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setContent('');
              setIsMultiClass(false);
              setSelectedClassId('ALL');
              setSelectedClassIds([]);
              setModalOpen(true);
            }}
            disabled={!classes.length || Boolean(error)}
            className="px-5 py-3 bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white border border-[#F2CC8F]/30 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px] text-[#F2CC8F]">add_circle</span>
            <span>{isEn ? 'Compose New Notice' : 'Soạn Thông Báo Mới'}</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS: CHỈ GIỮ LẠI ĐÚNG 2 THẺ THEO YÊU CẦU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Thẻ 1: Tổng thông báo đã gửi (Số lượng bản tin) */}
        <div
          onClick={() => {
            setActiveTab('SENT');
            setSelectedClassFilter('ALL');
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-slate-800 flex items-center justify-between shadow-xs ${
            activeTab === 'SENT' && selectedClassFilter === 'ALL'
              ? 'border-slate-800 dark:border-slate-600 ring-2 ring-slate-800/10 dark:ring-slate-600/30'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isEn ? 'Total Broadcasts Sent' : 'Tổng thông báo đã gửi'}
            </div>
            <div className="font-chivo text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalSent} <span className="text-xs font-normal text-slate-400">{isEn ? 'notices' : 'bản tin'}</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {isEn ? 'Classwide announcements & homework drills' : 'Số lượng bản tin thông báo & bài tập đã gửi theo lớp'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">outbox</span>
          </div>
        </div>

        {/* Thẻ 2: Tổng lượt học viên tiếp cận (Dựa trên sỉ số các lớp đã nhận thông báo) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isEn ? 'Total Student Reach' : 'Tổng lượt học viên tiếp cận'}
            </div>
            <div className="font-chivo text-2xl sm:text-3xl font-black text-[#2D6A4F] dark:text-[#81B29A] mt-1">
              {stats.totalRecipients} <span className="text-xs font-normal text-slate-400">{isEn ? 'students' : 'lượt học viên'}</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {isEn ? 'Calculated from class enrollment capacities' : 'Tính toán dựa trên sỉ số các lớp đã nhận thông báo'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#81B29A]/15 dark:bg-[#81B29A]/20 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
        </div>
      </div>

      <CoachError message={error} retry={loadData} />

      {/* 3. TOOLBAR ĐIỀU HƯỚNG & BỘ LỌC ĐA NĂNG */}
      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Segmented Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-750 p-1 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveTab('SENT')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SENT' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{isEn ? `Sent (${notifications.length})` : `Đã gửi (${notifications.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INBOX')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'INBOX' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">inbox</span>
              <span>{isEn ? 'Inbox' : 'Hộp thư đến'}</span>
              {stats.inboxUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-[#E07A5F] text-white">
                  {stats.inboxUnread}
                </span>
              )}
            </button>
          </div>

          {/* Chế độ xem: Chia đôi (Master-Detail) vs Lưới thẻ (Grid) */}
          {activeTab === 'SENT' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-750 p-1 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'split' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isEn ? "Split screen view" : "Chế độ chia đôi màn hình: Danh sách bên trái, đọc nội dung bên phải"}
              >
                <span className="material-symbols-outlined text-[16px]">vertical_split</span>
                <span>{isEn ? 'Split (Easy Read)' : 'Chia đôi (Dễ đọc)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isEn ? "Grid card view" : "Chế độ lưới thẻ 2 cột"}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span>{isEn ? 'Grid Cards' : 'Lưới thẻ'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Hàng tìm kiếm & lọc khi ở tab Đã gửi */}
        {activeTab === 'SENT' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700 text-xs">
            {/* Ô tìm kiếm */}
            <div className="sm:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search title, content, class name..." : "Tìm tiêu đề, nội dung, tên lớp..."}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>

            {/* BỘ LỌC ĐỐI TƯỢNG (CHỈ GỒM: TẤT CẢ CÁC LỚP HOẶC TÊN TỪNG LỚP CỤ THỂ) */}
            <div className="sm:col-span-4">
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium cursor-pointer"
              >
                <option value="ALL">{isEn ? '🏫 All Classes' : '🏫 Tất cả các lớp'}</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.sportName ? `(${c.sportName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo chủ đề */}
            <div className="sm:col-span-3">
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium cursor-pointer"
              >
                <option value="ALL">{isEn ? '🏷️ All Topics' : '🏷️ Tất cả chủ đề'}</option>
                <option value="HOMEWORK">{isEn ? '🏋️ Homework & Workout' : '🏋️ Bài tập về nhà'}</option>
                <option value="REMINDER">{isEn ? '⏰ Schedule Reminder' : '⏰ Nhắc lịch học'}</option>
                <option value="SCHEDULE_CHANGE">{isEn ? '📢 Schedule Update' : '📢 Thay đổi ca dạy'}</option>
                <option value="NUTRITION">{isEn ? '🥗 Nutrition & Recovery' : '🥗 Dinh dưỡng & Phục hồi'}</option>
                <option value="ANNOUNCEMENT">{isEn ? '📢 General Announcement' : '📢 Thông báo chung'}</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT AREA */}

      {/* --- TAB 1: BÀI TẬP & THÔNG BÁO ĐÃ GỬI --- */}
      {activeTab === 'SENT' && (
        <>
          {filteredNotifications.length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#81B29A]/15 text-[#2D6A4F] flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[28px]">campaign</span>
              </div>
              <h3 className="font-chivo text-sm font-bold text-slate-900 dark:text-white">
                {notifications.length === 0 ? 'Chưa Có Thông Báo Hoặc Bài Tập Nào' : 'Không Tìm Thấy Thông Báo Phù Hợp'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {notifications.length === 0
                  ? 'Hãy soạn thông báo hoặc bài tập về nhà đầu tiên cho lớp học của bạn.'
                  : 'Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc lớp học khác.'}
              </p>
              {notifications.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setContent('');
                    setIsMultiClass(false);
                    setSelectedClassId('ALL');
                    setSelectedClassIds([]);
                    setModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  <span>Soạn thông báo ngay</span>
                </button>
              )}
            </div>
          ) : viewMode === 'split' ? (
            /* --- CHẾ ĐỘ 1: MASTER-DETAIL SPLIT VIEW (DỄ QUAN SÁT NHẤT) --- */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              {/* CỘT TRÁI (5/12): Danh sách các bản tin thu nhỏ */}
              <div className="lg:col-span-5 space-y-2 max-h-[620px] overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Danh sách ({filteredNotifications.length})</span>
                  <span>Bấm để xem chi tiết bên phải</span>
                </div>

                {filteredNotifications.map(notif => {
                  const detected = detectType(notif.title, notif.content);
                  const isSelected = selectedNotif?.id === notif.id;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => setSelectedNotifId(notif.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#81B29A]/10 border-[#81B29A]/40 shadow-xs ring-1 ring-[#81B29A]/20 border-l-4 border-l-[#81B29A]'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 shadow-2xs'
                      }`}
                    >
                      {/* Dòng 1: Badges + Ngày giờ */}
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded border ${detected.badgeClass}`}>
                          {detected.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatMemberDateTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Tiêu đề */}
                      <h4 className="font-chivo font-black text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-snug">
                        {notif.title}
                      </h4>

                      {/* Đoạn trích nội dung */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {notif.content}
                      </p>

                      {/* Dòng đáy: Đối tượng nhận + số lượng */}
                      <div className="flex items-center justify-between pt-1.5 mt-2 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 truncate max-w-[210px] font-medium text-slate-700 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">
                            school
                          </span>
                          <span className="truncate">{notif.target || 'Toàn bộ các lớp'}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-400">
                          {notif.recipientCount} học viên
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CỘT PHẢI (7/12): Chi tiết thông báo đang chọn */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4 sticky top-4">
                {selectedNotif ? (
                  <>
                    {/* Header thông báo */}
                    <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${detectType(selectedNotif.title, selectedNotif.content).badgeClass}`}>
                            {detectType(selectedNotif.title, selectedNotif.content).label}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            <span className="material-symbols-outlined text-[13px]">groups</span>
                            <span>{selectedNotif.recipientCount} học viên nhận</span>
                          </span>
                        </div>

                        <div className="text-right text-xs text-slate-400 font-mono flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{formatMemberDateTime(selectedNotif.createdAt)}</span>
                        </div>
                      </div>

                      <h2 className="font-chivo font-black text-slate-900 dark:text-white text-base sm:text-lg break-words leading-snug">
                        {selectedNotif.title}
                      </h2>
                    </div>

                    {/* Thẻ đối tượng nhận chi tiết */}
                    <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          <span className="material-symbols-outlined text-[18px]">school</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Đối tượng nhận thông báo
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {selectedNotif.target || 'Toàn bộ các lớp học'}
                          </div>
                        </div>
                      </div>

                      {/* Phím tắt liên kết đến danh sách học viên của lớp */}
                      {selectedNotif.classId && (
                        <a
                          href={`#/coach/members?classId=${selectedNotif.classId}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">group</span>
                          <span>Xem danh sách lớp</span>
                        </a>
                      )}
                    </div>

                    {/* Hộp nội dung đầy đủ */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Nội dung chi tiết:
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[140px]">
                        {selectedNotif.content}
                      </div>
                    </div>

                    {/* Dải công cụ dưới cùng */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        ID: #{selectedNotif.id}
                      </span>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyContent(selectedNotif.content)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                          <span>Sao chép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(selectedNotif)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit_note</span>
                          <span>Soạn tương tự</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Chọn một thông báo ở cột bên trái để xem nội dung
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- CHẾ ĐỘ 2: LƯỚI THẺ 2 CỘT (BENTO GRID) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredNotifications.map(notif => {
                const detected = detectType(notif.title, notif.content);

                return (
                  <article
                    key={notif.id}
                    className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3 border-l-4 ${detected.stripe}`}
                  >
                    <div className="space-y-2">
                      {/* Dòng 1: Badges, Time */}
                      <div className="flex items-start justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${detected.badgeClass}`}>
                          {detected.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatMemberDateTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Tiêu đề */}
                      <h3 className="font-chivo font-black text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1 leading-snug">
                        {notif.title}
                      </h3>

                      {/* Đối tượng */}
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">school</span>
                        <span>{notif.target || 'Toàn bộ các lớp'}</span>
                        <span>•</span>
                        <span>{notif.recipientCount} học viên</span>
                      </div>

                      {/* Nội dung thu gọn 3 dòng */}
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs line-clamp-3 leading-relaxed">
                        {notif.content}
                      </div>
                    </div>

                    {/* Dải nút hành động */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <span className="font-mono text-[10px] text-slate-400">#{notif.id}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyContent(notif.content)}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Sao chép
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(notif)}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          Soạn tương tự
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* --- TAB 2: HỘP THƯ ĐẾN CỦA TÔI --- */}
      {activeTab === 'INBOX' && (
        <NotificationList
          notifications={inbox}
          title="Thông báo nhận được từ Trung tâm & Ban quản lý"
        />
      )}

      {/* 5. MODAL: SOẠN THÔNG BÁO MỚI (CHỈ GỒM CÁC TRƯỜNG THEO QUY CHUẨN) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEn ? "Compose Class Announcement & Homework" : "Soạn Thông Báo & Giao Bài Tập Cho Lớp Học"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSendNotification} className="space-y-4">
          {/* Mẫu nhanh hỗ trợ điền nhanh (Gọn gàng dạng Pills) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-amber-500">bolt</span>
                <span>{isEn ? 'Quick templates' : 'Gợi ý mẫu nhanh theo lớp'}</span>
              </span>
              <span>{isEn ? 'Click to fill draft' : 'Bấm để điền mẫu'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 text-left text-xs font-medium transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-slate-800 dark:text-slate-200 text-[11px]">{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Dropdown Chọn Lớp nhận thông báo (Bắt buộc chọn 1 hoặc nhiều lớp, không có option user lẻ) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <label htmlFor="classSelect" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                1. Chọn Lớp nhận thông báo *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsMultiClass(!isMultiClass);
                  if (!isMultiClass && classes.length > 0) {
                    setSelectedClassIds(classes.map(c => String(c.id)));
                  }
                }}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                {isMultiClass ? 'Chuyển sang chọn đơn / Tất cả' : 'Chọn nhiều lớp cụ thể'}
              </button>
            </div>

            {!isMultiClass ? (
              <select
                id="classSelect"
                name="classId"
                required
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium cursor-pointer shadow-2xs"
              >
                <option value="ALL">
                  {isEn ? '📢 All Assigned Classes (Broadcast to all my classes)' : '📢 Tất cả các lớp phụ trách (Phát thông báo toàn bộ)'}
                </option>
                {classes.map(cls => {
                  const count = cls.enrolledCount || (cls.members || cls.Members || []).length || 0;
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.sportName ? `(${cls.sportName})` : ''} • Sĩ số: {count} học viên
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-750 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200 dark:border-slate-600">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Đã chọn: {selectedClassIds.length}/{classes.length} lớp
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                  >
                    {selectedClassIds.length === classes.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả các lớp'}
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {classes.map(cls => {
                    const cid = String(cls.id);
                    const isChecked = selectedClassIds.includes(cid);
                    const count = cls.enrolledCount || (cls.members || cls.Members || []).length || 0;
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 text-blue-950 dark:text-blue-200 font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleClass(cls.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>{cls.name} {cls.sportName ? `(${cls.sportName})` : ''}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {count} học viên
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Input Tiêu đề thông báo */}
          <div className="space-y-1">
            <label htmlFor="notificationTitle" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              2. Tiêu đề thông báo / bài tập *
            </label>
            <input
              id="notificationTitle"
              type="text"
              required
              maxLength={200}
              placeholder={isEn ? "e.g., [Homework] Home workout routines before Wednesday session..." : "VD: [Bài tập] Rèn luyện thể lực bổ trợ trước buổi tập Thứ 4..."}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium placeholder-slate-400 shadow-2xs"
            />
          </div>

          {/* 3. Textarea Nội dung / Bài tập về nhà */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="notificationContent" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                3. Nội dung / Bài tập về nhà *
              </label>
              <span className="text-[11px] font-mono text-slate-400">{content.length}/4000</span>
            </div>
            <textarea
              id="notificationContent"
              rows="6"
              required
              maxLength={4000}
              placeholder={isEn ? "Enter homework details, drills, reps, rest time or class announcements..." : "Nhập chi tiết các động tác bài tập về nhà, số hiệp, thời gian nghỉ hoặc nội dung dặn dò lớp học..."}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white placeholder-slate-400 resize-y min-h-[130px] shadow-2xs font-normal"
            />
          </div>

          {/* 4. Nút submit Gửi thông báo */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={sending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold transition-all cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-[#F2CC8F] hover:text-white border border-[#F2CC8F]/30 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">
                {sending ? 'hourglass_top' : 'send'}
              </span>
              <span>{sending ? (isEn ? 'Broadcasting...' : 'Đang gửi...') : (isEn ? 'Broadcast Notice' : 'Gửi thông báo')}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CoachNotifications;
