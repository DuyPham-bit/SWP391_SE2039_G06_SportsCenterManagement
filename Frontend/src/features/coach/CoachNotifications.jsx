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

// Bảng mẫu thông báo & bài tập chuẩn bị sẵn (1-click template)
const QUICK_TEMPLATES = [
  {
    label: '🎯 Góp ý & Kỹ thuật 1-1',
    target: 'MEMBER',
    title: '[Góp ý cá nhân] Đánh giá & chỉnh sửa kỹ thuật sau buổi tập',
    content: 'Chào bạn,\n\nHLV gửi bạn nhận xét cá nhân sau buổi tập vừa qua:\n1. Điểm làm tốt: Thực hiện đúng tư thế cơ bản, nhịp thở đều và tập trung cao.\n2. Điểm cần khắc phục: Cần chú ý giữ thẳng lưng khi phát lực, tránh hạ vai quá nhanh.\n3. Bài tập bổ trợ khuyến nghị: Tập thêm giãn cơ vai và tập trước gương 10 phút mỗi ngày.\n\nCố gắng duy trì phong độ nhé! Nếu có thắc mắc cứ nhắn cho HLV.'
  },
  {
    label: '⭐ Khen ngợi & Động viên 1-1',
    target: 'MEMBER',
    title: '[Khích lệ] Chúc mừng bạn đã hoàn thành xuất sắc mục tiêu buổi tập',
    content: 'Chào bạn,\n\nHLV rất ấn tượng với sự nỗ lực và tiến bộ rõ rệt của bạn trong buổi tập hôm nay. Kỹ thuật và sức bền của bạn đã nâng lên một bậc mới!\n\nHãy tiếp tục duy trì tinh thần tập luyện tuyệt vời này nhé. Hẹn gặp bạn ở buổi tập tiếp theo!'
  },
  {
    label: '🏋️ Bài tập thể lực tại nhà',
    target: 'CLASS',
    title: '[Bài tập] Tự rèn luyện thể lực bổ trợ trước ca học',
    content: 'Chào các bạn học viên,\n\nĐể chuẩn bị tốt nhất cho buổi tập tiếp theo, các bạn vui lòng thực hiện bài tập bổ trợ tại nhà:\n1. Khởi động khớp cổ tay, cổ chân, vai: 5 phút\n2. Hít đất / Plank: 3 hiệp x 30-45 giây\n3. Squat bật nhảy nhẹ: 3 hiệp x 15 lần\n\nNghỉ giữa hiệp 60 giây và uống đủ 500ml nước nhé!'
  },
  {
    label: '⏰ Nhắc lịch ca tập tới',
    target: 'CLASS',
    title: '[Nhắc lịch] Nhắc nhở ca học ngày mai & chuẩn bị đồ tập',
    content: 'Chào các bạn,\n\nNhắc nhở lớp học có ca tập vào ngày mai. Các bạn lưu ý:\n- Có mặt sớm 10 phút trước giờ học để khởi động.\n- Mang theo bình nước cá nhân, khăn lau mồ hôi và trang phục thể thao phù hợp.\n- Nếu có việc bận đột xuất, vui lòng báo trước cho HLV.'
  },
  {
    label: '📢 Thay đổi lịch / Bù ca',
    target: 'CLASS',
    title: '[Thông báo] Cập nhật điều chỉnh thời gian ca dạy',
    content: 'Chào toàn thể lớp học,\n\nDo trung tâm có lịch bảo trì sân bãi / sự kiện thể thao, ca học sắp tới sẽ được dời sang khung giờ mới.\nChi tiết ca học đã được cập nhật trên hệ thống SCMS. Các bạn kiểm tra lại lịch trên ứng dụng nhé!'
  },
  {
    label: '🥗 Hướng dẫn dinh dưỡng',
    target: 'CLASS',
    title: '[Dinh dưỡng] Hướng dẫn bổ sung năng lượng phục hồi sau buổi tập',
    content: 'Chào các bạn,\n\nSau buổi tập cường độ cao hôm nay, các bạn nhớ bổ sung dinh dưỡng hợp lý:\n- Uống đủ nước bù điện giải trong vòng 30 phút sau tập.\n- Nạp bữa ăn giàu protein (ức gà, trứng, sữa) và tinh bột chậm.\n- Ngủ đủ giấc 7-8 tiếng để cơ bắp phục hồi tối đa.'
  }
];

// Tự động phân loại thẻ dựa trên nội dung
function detectType(title = '', content = '', isEn = false) {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('góp ý') || text.includes('khích lệ') || text.includes('khen ngợi') || text.includes('cá nhân') || text.includes('chỉnh sửa kỹ thuật') || text.includes('feedback') || text.includes('review') || text.includes('1-1')) {
    return {
      type: 'PERSONAL_FEEDBACK',
      label: isEn ? '1-on-1 Feedback' : 'Góp ý 1-1 cá nhân',
      icon: 'person_pin',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700',
      stripe: 'border-l-purple-600'
    };
  }
  if (text.includes('bài tập') || text.includes('rèn luyện') || text.includes('hiệp') || text.includes('reps') || text.includes('tập tại nhà') || text.includes('plank') || text.includes('squat') || text.includes('homework') || text.includes('workout')) {
    return {
      type: 'HOMEWORK',
      label: isEn ? 'Homework & Workout' : 'Bài tập về nhà',
      icon: 'fitness_center',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      stripe: 'border-l-amber-500'
    };
  }
  if (text.includes('nhắc') || text.includes('lịch') || text.includes('chuẩn bị') || text.includes('đúng giờ') || text.includes('mang') || text.includes('reminder')) {
    return {
      type: 'REMINDER',
      label: isEn ? 'Class Reminder' : 'Nhắc lịch học',
      icon: 'schedule',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      iconBg: 'bg-sky-100 text-sky-700',
      stripe: 'border-l-sky-500'
    };
  }
  if (text.includes('nghỉ') || text.includes('thay đổi') || text.includes('hoãn') || text.includes('bù') || text.includes('hủy') || text.includes('dời') || text.includes('reschedule') || text.includes('change')) {
    return {
      type: 'SCHEDULE_CHANGE',
      label: isEn ? 'Schedule Update' : 'Thay đổi ca dạy',
      icon: 'campaign',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      stripe: 'border-l-rose-500'
    };
  }
  if (text.includes('dinh dưỡng') || text.includes('ăn') || text.includes('uống') || text.includes('protein') || text.includes('nước') || text.includes('phục hồi') || text.includes('nutrition')) {
    return {
      type: 'NUTRITION',
      label: isEn ? 'Nutrition & Recovery' : 'Dinh dưỡng & Phục hồi',
      icon: 'restaurant',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      stripe: 'border-l-emerald-500'
    };
  }
  return {
    type: 'GENERAL',
    label: isEn ? 'Class Announcement' : 'Thông báo lớp học',
    icon: 'chat_bubble',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    iconBg: 'bg-slate-100 text-slate-700',
    stripe: 'border-l-slate-600'
  };
}

export function CoachNotifications() {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const inbox = useNotifications();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('SENT'); // 'SENT' (Đã gửi) | 'INBOX' (Hộp thư đến)
  const [notifications, setNotifications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [fallbackMembers, setFallbackMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bộ lọc danh sách đã gửi
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Chế độ xem & Thẻ đang chọn (Master-Detail)
  const [viewMode, setViewMode] = useState('split'); // 'split' (chia đôi) | 'grid' (lưới thẻ)
  const [selectedNotifId, setSelectedNotifId] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState('CLASS'); // 'CLASS' | 'MEMBER' | 'ALL'
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [memberFilterClassId, setMemberFilterClassId] = useState('ALL');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
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
      if (classList && classList.length > 0 && !selectedClassId) {
        setSelectedClassId(classList[0].id);
      }
      setNotifications(notifs || []);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu thông báo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tổng hợp danh sách tất cả học viên thuộc các lớp mà HLV quản lý
  const allMembers = useMemo(() => {
    const map = new Map();
    classes.forEach(c => {
      const list = c.members || c.Members || [];
      list.forEach(m => {
        const mid = m.id || m.memberId || m.Id || m.MemberId;
        if (mid && !map.has(mid)) {
          map.set(mid, {
            id: mid,
            memberId: mid,
            fullName: m.fullName || m.memberName || m.FullName || m.MemberName || 'Học viên',
            memberCode: m.memberCode || m.MemberCode || `MEM-${mid}`,
            email: m.email || m.Email || '',
            phone: m.phone || m.Phone || '',
            fitnessGoal: m.fitnessGoal || m.FitnessGoal || '',
            fitnessLevel: m.fitnessLevel || m.FitnessLevel || '',
            classId: c.id,
            className: c.name,
            sportName: c.sportName
          });
        }
      });
    });

    fallbackMembers.forEach(m => {
      const mid = m.id || m.memberId;
      if (mid && !map.has(mid)) {
        map.set(mid, m);
      }
    });

    return Array.from(map.values());
  }, [classes, fallbackMembers]);

  // Dự phòng: nạp danh sách học viên theo lớp nếu API classes chưa nhúng members
  useEffect(() => {
    if (classes.length > 0) {
      const hasMembersInClasses = classes.some(c => (c.members || c.Members || []).length > 0);
      if (!hasMembersInClasses) {
        Promise.all(classes.map(c => coachApi.getMembersForClass(c.id).catch(() => [])))
          .then(results => {
            const list = [];
            results.forEach((mList, idx) => {
              const c = classes[idx];
              (mList || []).forEach(m => {
                const mid = m.id || m.memberId;
                list.push({
                  ...m,
                  id: mid,
                  memberId: mid,
                  fullName: m.fullName || m.memberName || 'Học viên',
                  memberCode: m.memberCode || `MEM-${mid}`,
                  classId: c.id,
                  className: c.name,
                  sportName: c.sportName
                });
              });
            });
            setFallbackMembers(list);
          });
      }
    }
  }, [classes]);

  // Thông tin học viên đang được chọn (nếu có)
  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return allMembers.find(m => String(m.id) === String(selectedMemberId) || String(m.memberId) === String(selectedMemberId));
  }, [allMembers, selectedMemberId]);

  // Lọc học viên trong modal chọn người nhận
  const filteredMembersToPick = useMemo(() => {
    return allMembers.filter(m => {
      if (memberFilterClassId !== 'ALL' && String(m.classId) !== String(memberFilterClassId)) {
        return false;
      }
      if (memberSearchQuery.trim()) {
        const q = memberSearchQuery.toLowerCase().trim();
        const matchName = m.fullName?.toLowerCase().includes(q);
        const matchCode = m.memberCode?.toLowerCase().includes(q);
        const matchPhone = m.phone?.toLowerCase().includes(q);
        const matchEmail = m.email?.toLowerCase().includes(q);
        const matchClass = m.className?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPhone && !matchEmail && !matchClass) {
          return false;
        }
      }
      return true;
    });
  }, [allMembers, memberFilterClassId, memberSearchQuery]);

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
    if (targetType === 'MEMBER' && !selectedMemberId) {
      showError('Vui lòng chọn một học viên cụ thể để gửi thông báo riêng 1-1.');
      return;
    }

    const cls = classes.find(c => c.id === selectedClassId);
    let targetLabel = '';
    if (targetType === 'MEMBER') {
      targetLabel = `Học viên: ${selectedMember?.fullName || 'Học viên'} (${selectedMember?.memberCode || 'Cá nhân'})`;
    } else if (targetType === 'CLASS') {
      targetLabel = `Lớp: ${cls?.name || 'Lớp'}`;
    } else {
      targetLabel = 'Toàn bộ học viên của HLV';
    }

    setSending(true);
    try {
      await coachApi.sendNotification({
        classId: targetType === 'MEMBER' ? (selectedMember?.classId || null) : (targetType === 'CLASS' ? selectedClassId : null),
        memberId: targetType === 'MEMBER' ? Number(selectedMemberId) : null,
        coachId: currentUser?.id,
        coachName: currentUser?.fullName || 'HLV',
        target: targetLabel,
        title: title.trim(),
        content: content.trim()
      });
      showSuccess(
        targetType === 'MEMBER'
          ? `Đã gửi thông báo riêng 1-1 tới học viên ${selectedMember?.fullName || ''} thành công!`
          : 'Đã gửi thông báo/bài tập về nhà thành công!'
      );
      setModalOpen(false);
      setTitle('');
      setContent('');
      setSelectedMemberId(null);
      setMemberSearchQuery('');
      setActiveTab('SENT');
      loadData();
    } catch (err) {
      showError(err.message || 'Lỗi gửi thông báo');
    } finally {
      setSending(false);
    }
  };

  const handleApplyTemplate = (tpl) => {
    setTitle(tpl.title);
    setContent(tpl.content);
    if (tpl.target === 'MEMBER' && targetType !== 'MEMBER') {
      setTargetType('MEMBER');
    }
  };

  const handleCopyContent = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showSuccess('Đã sao chép nội dung thông báo vào bộ nhớ tạm!');
    }
  };

  const handleDuplicate = (notif) => {
    setTitle(notif.title);
    setContent(notif.content);
    const isOneOnOne = notif.recipientCount === 1 || notif.target?.includes('Học viên:');
    if (isOneOnOne) {
      setTargetType('MEMBER');
      const match = allMembers.find(m => notif.target?.includes(m.fullName) || (m.memberCode && notif.target?.includes(m.memberCode)));
      if (match) {
        setSelectedMemberId(match.id);
      }
    } else if (notif.classId) {
      setTargetType('CLASS');
      setSelectedClassId(notif.classId);
    } else {
      setTargetType('ALL');
    }
    setModalOpen(true);
  };

  // Lọc danh sách thông báo đã gửi
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // 1. Tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title?.toLowerCase().includes(q);
        const matchContent = n.content?.toLowerCase().includes(q);
        const matchTarget = n.target?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchTarget) return false;
      }

      // 2. Lọc đối tượng gửi
      if (selectedClassFilter !== 'ALL') {
        const isOneOnOne = n.recipientCount === 1 || n.target?.includes('Học viên:');
        if (selectedClassFilter === 'MEMBER') {
          if (!isOneOnOne) return false;
        } else if (selectedClassFilter === 'ENTIRE') {
          if (n.classId !== null && !n.target?.includes('Toàn bộ')) return false;
        } else {
          const cid = Number(selectedClassFilter);
          if (n.classId !== cid && !n.target?.includes(String(selectedClassFilter))) return false;
        }
      }

      // 3. Lọc theo thể loại
      if (selectedTypeFilter !== 'ALL') {
        const t = detectType(n.title, n.content);
        if (t.type !== selectedTypeFilter) return false;
      }

      return true;
    });
  }, [notifications, searchQuery, selectedClassFilter, selectedTypeFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const totalSent = notifications.length;
    const totalRecipients = notifications.reduce((acc, n) => acc + (n.recipientCount || 0), 0);
    const oneOnOneCount = notifications.filter(n => n.recipientCount === 1 || n.target?.includes('Học viên:')).length;
    const classesCount = classes.length;
    const inboxUnread = (inbox?.items || []).filter(i => !i.isRead).length;
    return { totalSent, totalRecipients, oneOnOneCount, classesCount, inboxUnread };
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

  if (loading) return <LoadingSpinner text="Đang tải danh sách thông báo..." />;

  return (
    <div className="space-y-5">
      {/* 1. TOP HEADER BANNER */}
      <div className="rounded-[24px] bg-gradient-to-br from-[#32354D] via-[#2B2D42] to-[#1E2235] text-white p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#81B29A]/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-[#F2CC8F]/15 blur-3xl" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[rgba(242,204,143,0.15)] text-[#F2CC8F] text-[11px] font-bold uppercase tracking-widest border border-[rgba(242,204,143,0.3)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[#F2CC8F] animate-pulse" />
            {isEn ? 'Coaching & Student Engagement' : 'Chuyên môn & Kết nối học viên'}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[28px] text-[#F2CC8F]">campaign</span>
            {isEn ? 'Send Workouts & Student Announcements' : 'Gửi Bài Tập & Thông Báo Cho Học Viên'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isEn
              ? 'Assign class homework or send 1-on-1 technical feedback and reviews directly to individual students.'
              : 'Giao bài tập về nhà theo lớp hoặc gửi nhận xét & góp ý kỹ thuật riêng 1-1 tới từng học viên.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => {
              setTitle('');
              setContent('');
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

      {/* 2. KPI METRICS TILES - GỌN GÀNG, ĐỒNG BỘ NỀN TRẮNG */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Tile 1: Tổng đã gửi */}
        <div
          onClick={() => {
            setActiveTab('SENT');
            setSelectedClassFilter('ALL');
          }}
          className={`p-3 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between shadow-2xs ${
            activeTab === 'SENT' && selectedClassFilter === 'ALL'
              ? 'border-slate-800 ring-2 ring-slate-800/15'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Sent to Students' : 'Đã gửi học viên'}
            </div>
            <div className="font-chivo text-xl font-black text-slate-900 mt-0.5">
              {stats.totalSent} <span className="text-xs font-normal text-slate-400">{isEn ? 'notices' : 'bản tin'}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">outbox</span>
          </div>
        </div>

        {/* Tile 2: Lượt học viên nhận */}
        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isEn ? 'Total Receivers' : 'Lượt học viên nhận'}
            </div>
            <div className="font-chivo text-xl font-black text-slate-900 mt-0.5">
              {stats.totalRecipients} <span className="text-xs font-normal text-slate-400">{isEn ? 'reach' : 'lượt tiếp cận'}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#81B29A]/15 text-[#2D6A4F] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">groups</span>
          </div>
        </div>

        {/* Tile 3: Gửi riêng 1-1 */}
        <div
          onClick={() => {
            setActiveTab('SENT');
            setSelectedClassFilter(selectedClassFilter === 'MEMBER' ? 'ALL' : 'MEMBER');
          }}
          className={`p-3 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between shadow-2xs ${
            activeTab === 'SENT' && selectedClassFilter === 'MEMBER'
              ? 'border-purple-600 ring-2 ring-purple-600/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span>{isEn ? '1-on-1 Direct' : 'Gửi riêng 1-1'}</span>
              {selectedClassFilter === 'MEMBER' && <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />}
            </div>
            <div className="font-chivo text-xl font-black text-slate-900 mt-0.5">
              {stats.oneOnOneCount} <span className="text-xs font-normal text-slate-400">{isEn ? 'messages' : 'tin nhắn'}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>

        {/* Tile 4: Hộp thư đến */}
        <div
          onClick={() => setActiveTab('INBOX')}
          className={`p-3 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between shadow-2xs ${
            activeTab === 'INBOX'
              ? 'border-sky-600 ring-2 ring-sky-600/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span className="flex items-center gap-1">
                {stats.inboxUnread > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                {isEn ? 'Inbox' : 'Hộp thư đến'}
              </span>
            </div>
            <div className="font-chivo text-xl font-black text-slate-900 mt-0.5">
              {stats.inboxUnread} <span className="text-xs font-normal text-slate-400">{isEn ? 'unread' : 'chưa đọc'}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">notifications</span>
          </div>
        </div>
      </div>

      <CoachError message={error} retry={loadData} />

      {/* 3. TOOLBAR ĐIỀU HƯỚNG & BỘ LỌC ĐA NĂNG */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Segmented Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveTab('SENT')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SENT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{isEn ? `Sent (${notifications.length})` : `Đã gửi (${notifications.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INBOX')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'INBOX' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title={isEn ? "Split screen view" : "Chế độ chia đôi màn hình: Danh sách bên trái, đọc nội dung bên phải (dễ quan sát nhất)"}
              >
                <span className="material-symbols-outlined text-[16px]">vertical_split</span>
                <span>{isEn ? 'Split (Easy Read)' : 'Chia đôi (Dễ đọc)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-100 text-xs">
            {/* Ô tìm kiếm */}
            <div className="sm:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search title, content, student..." : "Tìm tiêu đề, nội dung, học viên..."}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium placeholder-slate-400"
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

            {/* Lọc đối tượng gửi */}
            <div className="sm:col-span-4">
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium cursor-pointer"
              >
                <option value="ALL">{isEn ? '🎯 All Recipients' : '🎯 Tất cả đối tượng gửi'}</option>
                <option value="MEMBER">{isEn ? '👤 1-on-1 Direct (Individual Student)' : '👤 Gửi riêng 1-1 (Từng học viên)'}</option>
                <option value="ENTIRE">{isEn ? '👥 All Students of Coach' : '👥 Toàn bộ học viên của HLV'}</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {isEn ? `Class: ${c.name} (${c.sportName})` : `Lớp: ${c.name} (${c.sportName})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc thể loại */}
            <div className="sm:col-span-3">
              <select
                value={selectedTypeFilter}
                onChange={e => setSelectedTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium cursor-pointer"
              >
                <option value="ALL">{isEn ? '🏷️ All Topics' : '🏷️ Tất cả chủ đề'}</option>
                <option value="PERSONAL_FEEDBACK">{isEn ? '🎯 1-on-1 Feedback' : '🎯 Góp ý 1-1 cá nhân'}</option>
                <option value="HOMEWORK">{isEn ? '🏋️ Homework & Workout' : '🏋️ Bài tập về nhà'}</option>
                <option value="REMINDER">{isEn ? '⏰ Schedule Reminder' : '⏰ Nhắc lịch học'}</option>
                <option value="SCHEDULE_CHANGE">{isEn ? '📢 Schedule Update' : '📢 Thay đổi ca dạy'}</option>
                <option value="NUTRITION">{isEn ? '🥗 Nutrition & Recovery' : '🥗 Dinh dưỡng & Phục hồi'}</option>
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
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 max-w-md mx-auto space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#81B29A]/15 text-[#2D6A4F] flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[28px]">campaign</span>
              </div>
              <h3 className="font-chivo text-sm font-bold text-slate-900">
                {notifications.length === 0 ? 'Chưa Có Thông Báo Hoặc Bài Tập Nào' : 'Không Tìm Thấy Thông Báo Phù Hợp'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {notifications.length === 0
                  ? 'Hãy soạn bài tập về nhà đầu tiên hoặc gửi nhận xét riêng cho từng học viên.'
                  : 'Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc đối tượng khác.'}
              </p>
              {notifications.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setContent('');
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
              {/* CỘT TRÁI (5/12): Danh sách các bản tin thu nhỏ, cuộn mượt */}
              <div className="lg:col-span-5 space-y-2 max-h-[620px] overflow-y-auto pr-1">
                <div className="text-[11px] font-bold text-slate-400 px-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Danh sách ({filteredNotifications.length})</span>
                  <span>Bấm để xem chi tiết bên phải</span>
                </div>

                {filteredNotifications.map(notif => {
                  const detected = detectType(notif.title, notif.content);
                  const isOneOnOne = notif.recipientCount === 1 || notif.target?.includes('Học viên:');
                  const isSelected = selectedNotif?.id === notif.id;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => setSelectedNotifId(notif.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#81B29A]/10 border-[#81B29A]/40 shadow-xs ring-1 ring-[#81B29A]/20 border-l-4 border-l-[#81B29A]'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                      }`}
                    >
                      {/* Dòng 1: Badges + Ngày giờ */}
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isOneOnOne ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                              <span className="material-symbols-outlined text-[11px]">person</span>
                              <span>1-1</span>
                            </span>
                          ) : null}
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded border ${detected.badgeClass}`}>
                            {detected.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatMemberDateTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Tiêu đề */}
                      <h4 className="font-chivo font-black text-slate-900 text-xs sm:text-sm line-clamp-1 leading-snug">
                        {notif.title}
                      </h4>

                      {/* Đoạn trích nội dung */}
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {notif.content}
                      </p>

                      {/* Dòng đáy: Đối tượng nhận + số lượng */}
                      <div className="flex items-center justify-between pt-1.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 truncate max-w-[210px] font-medium text-slate-700">
                          <span className="material-symbols-outlined text-[13px] text-slate-400">
                            {isOneOnOne ? 'account_circle' : 'school'}
                          </span>
                          <span className="truncate">{notif.target}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-400">
                          {notif.recipientCount} người
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CỘT PHẢI (7/12): Chi tiết thông báo đang chọn (Sticky, đọc sướng mắt) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 sticky top-4">
                {selectedNotif ? (
                  <>
                    {/* Header thông báo */}
                    <div className="space-y-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedNotif.recipientCount === 1 || selectedNotif.target?.includes('Học viên:') ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                              <span className="material-symbols-outlined text-[13px]">person</span>
                              <span>GỬI RIÊNG 1-1</span>
                            </span>
                          ) : null}

                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${detectType(selectedNotif.title, selectedNotif.content).badgeClass}`}>
                            {detectType(selectedNotif.title, selectedNotif.content).label}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="material-symbols-outlined text-[13px]">groups</span>
                            <span>{selectedNotif.recipientCount} người nhận</span>
                          </span>
                        </div>

                        <div className="text-right text-xs text-slate-400 font-mono flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{formatMemberDateTime(selectedNotif.createdAt)}</span>
                        </div>
                      </div>

                      <h2 className="font-chivo font-black text-slate-900 text-base sm:text-lg break-words leading-snug">
                        {selectedNotif.title}
                      </h2>
                    </div>

                    {/* Thẻ đối tượng nhận chi tiết */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                          selectedNotif.recipientCount === 1 || selectedNotif.target?.includes('Học viên:')
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-white'
                        }`}>
                          <span className="material-symbols-outlined text-[18px]">
                            {selectedNotif.recipientCount === 1 || selectedNotif.target?.includes('Học viên:') ? 'person' : 'school'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Người nhận
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {selectedNotif.target}
                          </div>
                        </div>
                      </div>

                      {/* Phím tắt tương tác */}
                      <div className="flex items-center gap-1.5">
                        {(selectedNotif.recipientCount === 1 || selectedNotif.target?.includes('Học viên:')) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTitle('[Phản hồi bổ sung] ');
                              setContent('');
                              setTargetType('MEMBER');
                              const match = allMembers.find(m => selectedNotif.target?.includes(m.fullName) || (m.memberCode && selectedNotif.target?.includes(m.memberCode)));
                              if (match) setSelectedMemberId(match.id);
                              setModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">send</span>
                            <span>Gửi tiếp cho bạn này</span>
                          </button>
                        ) : selectedNotif.classId ? (
                          <a
                            href={`#/coach/members?classId=${selectedNotif.classId}`}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">group</span>
                            <span>Xem danh sách lớp</span>
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {/* Hộp nội dung đầy đủ */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Nội dung chi tiết:
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[140px]">
                        {selectedNotif.content}
                      </div>
                    </div>

                    {/* Dải công cụ dưới cùng */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">
                        ID: #{selectedNotif.id}
                      </span>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyContent(selectedNotif.content)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                          <span>Sao chép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(selectedNotif)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
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
            /* --- CHẾ ĐỘ 2: LƯỚI THẺ 2 CỘT (BENTO GRID - GỌN GÀNG) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredNotifications.map(notif => {
                const detected = detectType(notif.title, notif.content);
                const isOneOnOne = notif.recipientCount === 1 || notif.target?.includes('Học viên:');

                return (
                  <article
                    key={notif.id}
                    className={`bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3 border-l-4 ${
                      isOneOnOne ? 'border-l-purple-600' : detected.stripe
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Dòng 1: Icon, Badges, Time */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isOneOnOne && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                              <span className="material-symbols-outlined text-[11px]">person</span>
                              <span>1-1</span>
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded border ${detected.badgeClass}`}>
                            {detected.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatMemberDateTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Tiêu đề */}
                      <h3 className="font-chivo font-black text-slate-900 text-sm line-clamp-1">
                        {notif.title}
                      </h3>

                      {/* Đối tượng nhận */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 truncate">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">
                          {isOneOnOne ? 'account_circle' : 'school'}
                        </span>
                        <span className="truncate font-medium">{notif.target}</span>
                        <span className="text-slate-400">• {notif.recipientCount} người</span>
                      </div>

                      {/* Nội dung thu gọn 3 dòng */}
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs line-clamp-3 leading-relaxed">
                        {notif.content}
                      </div>
                    </div>

                    {/* Dải nút hành động */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="font-mono text-[10px] text-slate-400">#{notif.id}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyContent(notif.content)}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                        >
                          Sao chép
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(notif)}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
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

      {/* 5. MODAL: SOẠN THÔNG BÁO & GIAO BÀI TẬP MỚI */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Soạn Thông Báo & Giao Bài Tập Cho Học Viên"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSendNotification} className="space-y-5">
          {/* Section: Mẫu thông báo nhanh */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-red-600">bolt</span>
                <span>Chọn mẫu bài tập / thông báo nhanh</span>
              </span>
              <span className="text-[11px] text-slate-400">Bấm để tự động điền dàn bài</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_TEMPLATES.map((tpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    tpl.target === 'MEMBER'
                      ? 'border-purple-200 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-100/60 text-purple-900'
                      : 'border-slate-200 bg-white hover:border-red-400 hover:bg-red-50/50 hover:text-red-700 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="block text-slate-900 text-[11px]">{tpl.label}</strong>
                    {tpl.target === 'MEMBER' && (
                      <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-800">
                        1-1
                      </span>
                    )}
                  </div>
                  <span className="block text-slate-500 truncate text-[10px] mt-0.5">{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Đối tượng nhận */}
          <div className="space-y-2 border-t border-slate-200/80 pt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Chọn đối tượng nhận thông báo *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetType('CLASS')}
                className={`p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  targetType === 'CLASS'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-red-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                <span>Theo từng lớp học</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('MEMBER')}
                className={`p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  targetType === 'MEMBER'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-xs ring-2 ring-purple-500/40'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50/60 hover:border-purple-300 hover:text-purple-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                <span>Gửi riêng từng học viên</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('ALL')}
                className={`p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  targetType === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-red-500/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">groups</span>
                <span>Toàn bộ học viên của tôi</span>
              </button>
            </div>

            {/* Khi chọn gửi theo LỚP */}
            {targetType === 'CLASS' && (
              <div className="space-y-1 pt-1.5">
                <label className="block text-xs font-semibold text-slate-600">
                  Chọn lớp học phụ trách:
                </label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium cursor-pointer"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.sportName}) • Sĩ số: {cls.enrolledCount || (cls.members || cls.Members || []).length || 0} học viên
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Khi chọn gửi RIÊNG TỪNG HỌC VIÊN */}
            {targetType === 'MEMBER' && (
              <div className="space-y-2 pt-1.5">
                {selectedMember ? (
                  /* Đã chọn một học viên -> Hiển thị Card tóm tắt */
                  <div className="p-3.5 rounded-xl bg-purple-50 border-2 border-purple-300 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white shadow-2xs">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        <span>Đã chọn người nhận 1-1</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(null)}
                        className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                        <span>Đổi học viên khác</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {selectedMember.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-chivo font-black text-slate-900 text-sm">
                            {selectedMember.fullName}
                          </h4>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900">
                            {selectedMember.memberCode || `MEM-${selectedMember.id}`}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="font-medium text-slate-700">Lớp: {selectedMember.className}</span>
                          {selectedMember.phone && <span className="font-mono text-slate-500">• SĐT: {selectedMember.phone}</span>}
                          {selectedMember.fitnessGoal && (
                            <span className="text-purple-800 font-medium">• MT: {selectedMember.fitnessGoal}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-purple-800/90 bg-purple-100/70 p-2 rounded-lg flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-purple-700 shrink-0">lock</span>
                      <span>Thông báo và góp ý này sẽ chỉ gửi riêng tới tài khoản cá nhân của học viên này.</span>
                    </div>
                  </div>
                ) : (
                  /* Chưa chọn học viên -> Hiển thị Picker với Search và Filter */
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-purple-50/50 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-purple-600">person_search</span>
                        <span>Chọn học viên nhận thông báo riêng:</span>
                      </span>
                      <span className="text-[11px] text-purple-700 font-medium">
                        {filteredMembersToPick.length} học viên phù hợp
                      </span>
                    </div>

                    {/* Lọc theo lớp & Ô tìm kiếm */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <select
                          value={memberFilterClassId}
                          onChange={e => setMemberFilterClassId(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium cursor-pointer"
                        >
                          <option value="ALL">🏫 Tất cả các lớp ({allMembers.length} HV)</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>
                              Lớp: {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-7 relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-purple-400 text-[16px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={memberSearchQuery}
                          onChange={e => setMemberSearchQuery(e.target.value)}
                          placeholder="Tìm tên, mã MEM-, SĐT học viên..."
                          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium placeholder-slate-400"
                        />
                        {memberSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setMemberSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Danh sách ứng viên học viên */}
                    {allMembers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-purple-100">
                        Chưa có dữ liệu học viên trong các lớp của bạn.
                      </div>
                    ) : filteredMembersToPick.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-purple-100">
                        Không tìm thấy học viên nào khớp với &quot;{memberSearchQuery}&quot;
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto divide-y divide-purple-100 rounded-lg border border-purple-200 bg-white shadow-inner">
                        {filteredMembersToPick.map(m => (
                          <div
                            key={`${m.classId}-${m.id}`}
                            onClick={() => setSelectedMemberId(m.id)}
                            className="p-2.5 hover:bg-purple-50/70 transition-colors cursor-pointer flex items-center justify-between gap-2.5 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {m.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 group-hover:text-purple-900">
                                    {m.fullName}
                                  </span>
                                  {m.memberCode && (
                                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-bold">
                                      {m.memberCode}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                                  <span>{m.className || 'Lớp học'}</span>
                                  {m.phone && <span className="font-mono text-slate-400">• {m.phone}</span>}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMemberId(m.id);
                              }}
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white group-hover:bg-purple-600 group-hover:text-white text-purple-700 border border-purple-200 group-hover:border-purple-600 transition-all shrink-0 cursor-pointer shadow-2xs"
                            >
                              Chọn
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Tiêu đề */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Tiêu đề thông báo / bài tập *
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder={
                targetType === 'MEMBER'
                  ? 'VD: [Góp ý] Nhận xét kỹ thuật buổi tập & bài tập bổ trợ tại nhà...'
                  : 'VD: [Bài tập] Rèn luyện thể lực bổ trợ trước buổi tập Thứ 4...'
              }
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium placeholder-slate-400"
            />
          </div>

          {/* Section: Nội dung */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>3. Nội dung chi tiết bài tập / thông báo *</span>
              <span className="text-[11px] font-normal text-slate-400">{content.length}/5000 ký tự</span>
            </label>
            <textarea
              rows="5"
              required
              maxLength={5000}
              placeholder={
                targetType === 'MEMBER'
                  ? 'Nhập nội dung nhận xét riêng, điểm cần khắc phục, bài tập bổ trợ cá nhân...'
                  : 'Nhập chi tiết các động tác bài tập về nhà, số hiệp, thời gian nghỉ hoặc nội dung dặn dò lớp học...'
              }
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white placeholder-slate-400 resize-y min-h-[110px]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={sending}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={sending}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                targetType === 'MEMBER'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                  : 'bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white shadow-sm hover:shadow-md'
              }`}
            >
              {sending ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang gửi thông báo...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{targetType === 'MEMBER' ? 'Gửi Riêng Cho Học Viên' : 'Gửi Thông Báo Ngay'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
