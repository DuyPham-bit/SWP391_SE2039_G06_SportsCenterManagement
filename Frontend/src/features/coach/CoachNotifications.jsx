import React, { useState, useEffect, useMemo } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.jsx';
import { CoachError } from './CoachShared.js';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { useNotifications } from '../../components/common/useNotifications.js';
import { NotificationList } from '../../components/common/NotificationList.jsx';

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
function detectType(title = '', content = '') {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('góp ý') || text.includes('khích lệ') || text.includes('khen ngợi') || text.includes('cá nhân') || text.includes('chỉnh sửa kỹ thuật')) {
    return {
      type: 'PERSONAL_FEEDBACK',
      label: 'Góp ý 1-1 cá nhân',
      icon: 'person_pin',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700',
      stripe: 'border-l-purple-600'
    };
  }
  if (text.includes('bài tập') || text.includes('rèn luyện') || text.includes('hiệp') || text.includes('reps') || text.includes('tập tại nhà') || text.includes('plank') || text.includes('squat')) {
    return {
      type: 'HOMEWORK',
      label: 'Bài tập về nhà',
      icon: 'fitness_center',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      stripe: 'border-l-amber-500'
    };
  }
  if (text.includes('nhắc') || text.includes('lịch') || text.includes('chuẩn bị') || text.includes('đúng giờ') || text.includes('mang')) {
    return {
      type: 'REMINDER',
      label: 'Nhắc lịch học',
      icon: 'schedule',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      iconBg: 'bg-sky-100 text-sky-700',
      stripe: 'border-l-sky-500'
    };
  }
  if (text.includes('nghỉ') || text.includes('thay đổi') || text.includes('hoãn') || text.includes('bù') || text.includes('hủy') || text.includes('dời')) {
    return {
      type: 'SCHEDULE_CHANGE',
      label: 'Thay đổi ca dạy',
      icon: 'campaign',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      stripe: 'border-l-rose-500'
    };
  }
  if (text.includes('dinh dưỡng') || text.includes('ăn') || text.includes('uống') || text.includes('protein') || text.includes('nước') || text.includes('phục hồi')) {
    return {
      type: 'NUTRITION',
      label: 'Dinh dưỡng & Phục hồi',
      icon: 'restaurant',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      stripe: 'border-l-emerald-500'
    };
  }
  return {
    type: 'GENERAL',
    label: 'Thông báo lớp học',
    icon: 'chat_bubble',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    iconBg: 'bg-slate-100 text-slate-700',
    stripe: 'border-l-slate-600'
  };
}

export function CoachNotifications() {
  const { currentUser } = useAuth();
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

  if (loading) return <LoadingSpinner text="Đang tải danh sách thông báo..." />;

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-chivo text-xs uppercase tracking-widest text-red-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              CHUYÊN MÔN & KẾT NỐI HỌC VIÊN
            </span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[28px] text-red-500">campaign</span>
            Gửi Bài Tập & Thông Báo Cho Học Viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Giao bài tập về nhà, nhắc lịch tập theo lớp hoặc gửi nhận xét & góp ý kỹ thuật riêng 1-1 tới từng học viên.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => {
              setTitle('');
              setContent('');
              setTargetType('MEMBER');
              setSelectedMemberId(null);
              setModalOpen(true);
            }}
            disabled={!classes.length || Boolean(error)}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-chivo text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[19px]">person</span>
            <span>Gửi Riêng 1-1</span>
          </button>

          <button
            onClick={() => {
              setTitle('');
              setContent('');
              setTargetType('CLASS');
              setModalOpen(true);
            }}
            disabled={!classes.length || Boolean(error)}
            className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] text-white font-chivo text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">post_add</span>
            <span>Soạn Thông Báo Mới</span>
          </button>
        </div>
      </div>

      {/* 2. KPI STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Sent announcements */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('SENT');
            setSelectedClassFilter('ALL');
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'SENT' && selectedClassFilter === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-red-500/50'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80">
            <span>Đã gửi học viên</span>
            <span className="material-symbols-outlined text-[18px]">outbox</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">
            {stats.totalSent}
          </div>
        </button>

        {/* Card 2: Total recipients */}
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-800">
            <span>Lượt học viên nhận</span>
            <span className="material-symbols-outlined text-[18px] text-red-600">groups</span>
          </div>
          <div className="font-chivo text-2xl font-black text-red-900 mt-2">
            {stats.totalRecipients}
          </div>
        </div>

        {/* Card 3: 1-on-1 sent */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('SENT');
            setSelectedClassFilter(selectedClassFilter === 'MEMBER' ? 'ALL' : 'MEMBER');
          }}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'SENT' && selectedClassFilter === 'MEMBER'
              ? 'bg-purple-900 text-white border-purple-900 shadow-md ring-2 ring-purple-400'
              : 'bg-purple-50/70 text-purple-900 border-purple-200 hover:border-purple-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span>Gửi riêng 1-1</span>
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">
            {stats.oneOnOneCount} <span className="text-xs font-normal opacity-80">tin nhắn</span>
          </div>
        </button>

        {/* Card 4: Inbox */}
        <button
          type="button"
          onClick={() => setActiveTab('INBOX')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeTab === 'INBOX'
              ? 'bg-sky-700 text-white border-sky-700 shadow-md ring-2 ring-sky-400'
              : 'bg-sky-50/60 text-sky-900 border-sky-200 hover:border-sky-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span className="flex items-center gap-1.5">
              {stats.inboxUnread > 0 && <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />}
              Hộp thư đến
            </span>
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">
            {stats.inboxUnread} <span className="text-xs font-normal opacity-80">chưa đọc</span>
          </div>
        </button>
      </div>

      <CoachError message={error} retry={loadData} />

      {/* 3. SEGMENTED TAB SWITCHER */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('SENT')}
          className={`px-4 py-2.5 rounded-xl font-chivo text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SENT'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
          <span>Bài tập & Thông báo đã gửi ({notifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('INBOX')}
          className={`px-4 py-2.5 rounded-xl font-chivo text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'INBOX'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inbox</span>
          <span>Hộp thư đến của tôi</span>
          {stats.inboxUnread > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
              {stats.inboxUnread}
            </span>
          )}
        </button>
      </div>

      {/* 4. MAIN CONTENT ACCORDING TO ACTIVE TAB */}

      {/* --- TAB 1: BÀI TẬP & THÔNG BÁO ĐÃ GỬI --- */}
      {activeTab === 'SENT' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Search Input */}
              <div className="relative sm:col-span-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm tiêu đề, nội dung bài tập, học viên..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Class & Member Target Filter Dropdown */}
              <div>
                <select
                  value={selectedClassFilter}
                  onChange={e => setSelectedClassFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium cursor-pointer"
                >
                  <option value="ALL">🎯 Tất cả đối tượng gửi</option>
                  <option value="MEMBER">👤 Gửi riêng 1-1 (Từng học viên)</option>
                  <option value="ENTIRE">👥 Toàn bộ học viên của HLV</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      Lớp: {c.name} ({c.sportName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter Dropdown */}
              <div>
                <select
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white font-medium cursor-pointer"
                >
                  <option value="ALL">🏷️ Tất cả chủ đề</option>
                  <option value="PERSONAL_FEEDBACK">🎯 Góp ý 1-1 cá nhân</option>
                  <option value="HOMEWORK">🏋️ Bài tập về nhà</option>
                  <option value="REMINDER">⏰ Nhắc lịch học</option>
                  <option value="SCHEDULE_CHANGE">📢 Thay đổi ca dạy</option>
                  <option value="NUTRITION">🥗 Dinh dưỡng & Phục hồi</option>
                </select>
              </div>
            </div>

            {/* Quick Status / Reset */}
            {(searchQuery || selectedClassFilter !== 'ALL' || selectedTypeFilter !== 'ALL') && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Đang lọc hiển thị <strong>{filteredNotifications.length}</strong> / {notifications.length} thông báo
                  {selectedClassFilter === 'MEMBER' && (
                    <span className="ml-1 text-purple-700 font-bold">(Đang lọc tin gửi riêng 1-1)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedClassFilter('ALL');
                    setSelectedTypeFilter('ALL');
                  }}
                  className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Cards Feed */}
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-xl mx-auto space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[32px]">campaign</span>
              </div>
              <h3 className="font-chivo text-base font-bold text-slate-900">
                {notifications.length === 0 ? 'Chưa Có Thông Báo Hoặc Bài Tập Nào' : 'Không Tìm Thấy Thông Báo Phù Hợp'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
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
                    setTargetType('CLASS');
                    setModalOpen(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Soạn thông báo ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notif => {
                const detected = detectType(notif.title, notif.content);
                const isOneOnOne = notif.recipientCount === 1 || notif.target?.includes('Học viên:');

                return (
                  <article
                    key={notif.id}
                    className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-3.5 border-l-4 ${
                      isOneOnOne ? 'border-l-purple-600 ring-1 ring-purple-100' : detected.stripe
                    }`}
                  >
                    {/* Top Row: Icon, Title, Badges, Time */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${isOneOnOne ? 'bg-purple-100 text-purple-700' : detected.iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {isOneOnOne ? 'person' : detected.icon}
                          </span>
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isOneOnOne ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                                <span className="material-symbols-outlined text-[13px]">person</span>
                                <span>GỬI RIÊNG 1-1</span>
                              </span>
                            ) : null}

                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${detected.badgeClass}`}>
                              {detected.label}
                            </span>

                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="material-symbols-outlined text-[13px]">
                                {isOneOnOne ? 'account_circle' : 'school'}
                              </span>
                              <span>{notif.target}</span>
                            </span>

                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isOneOnOne ? 'bg-purple-50 text-purple-800 border-purple-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              <span className="material-symbols-outlined text-[13px]">
                                {isOneOnOne ? 'person' : 'groups'}
                              </span>
                              <span>{notif.recipientCount} người nhận</span>
                            </span>
                          </div>

                          <h3 className="font-chivo font-black text-slate-900 text-base sm:text-lg break-words leading-snug">
                            {notif.title}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right text-xs text-slate-400 font-mono flex items-center gap-1 shrink-0 self-start">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{formatMemberDateTime(notif.createdAt)}</span>
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {notif.content}
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="text-slate-400 text-[11px]">
                        ID Thông báo: <span className="font-mono">#{notif.id}</span>
                      </div>

                      <div className="flex items-center gap-2 ml-auto flex-wrap">
                        {isOneOnOne && (
                          <button
                            type="button"
                            onClick={() => {
                              setTitle('[Phản hồi bổ sung] ');
                              setContent('');
                              setTargetType('MEMBER');
                              const match = allMembers.find(m => notif.target?.includes(m.fullName) || (m.memberCode && notif.target?.includes(m.memberCode)));
                              if (match) setSelectedMemberId(match.id);
                              setModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Gửi tiếp tin nhắn riêng tới học viên này"
                          >
                            <span className="material-symbols-outlined text-[15px]">send</span>
                            <span>Gửi tiếp cho bạn này</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyContent(notif.content)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Sao chép nội dung bài tập"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                          <span>Sao chép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(notif)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Soạn tiếp thông báo tương tự"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit_note</span>
                          <span>Soạn tương tự</span>
                        </button>

                        {notif.classId && (
                          <a
                            href={`#/coach/members?classId=${notif.classId}`}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">group</span>
                            <span>Danh sách lớp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
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
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                targetType === 'MEMBER'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-600/20'
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
