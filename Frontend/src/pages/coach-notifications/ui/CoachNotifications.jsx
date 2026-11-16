import React, { useState, useEffect, useMemo } from 'react';
import { coachApi } from '../../../entities/coach/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { CoachError } from '../../../features/coach-workspace/index.js';
import { formatMemberDateTime } from '../../../entities/member/index.js';
import { useNotifications, NotificationList } from '../../../features/notifications/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { QUICK_TEMPLATES, detectType } from '../lib/templates.js';

export function CoachNotifications() {
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
            target: isEn ? 'All assigned classes' : 'Toàn bộ các lớp học phụ trách',
            title: title.trim(),
            content: content.trim()
          });
        } else {
          // Một request duy nhất giúp backend giao dịch nguyên tử và khử trùng học viên học nhiều lớp.
          await coachApi.sendNotification({
            classId: null,
            classIds: selectedClassIds.map(Number),
            memberId: null,
            target: isEn ? 'Selected assigned classes' : 'Các lớp phụ trách đã chọn',
            title: title.trim(),
            content: content.trim()
          });
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
        const classIds = Array.isArray(n.classIds) ? n.classIds.map(Number) : [];
        if (Number(n.classId) !== cid && !classIds.includes(cid)) return false;
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
      <div className="rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-8 relative overflow-hidden border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 text-brand-sage-900 dark:text-brand-sage-300 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 dark:border-white/20 mb-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
            <span>{isEn ? 'Class Broadcast & Homework Distribution' : 'Thông báo một chiều & Giao bài tập theo lớp'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-chivo font-black tracking-tight text-white flex items-center gap-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            <span className="material-symbols-outlined text-[28px] text-brand-sand-300">campaign</span>
            <span>{isEn ? 'Send Workouts & Class Announcements' : 'Gửi Bài Tập & Thông Báo Lớp Học'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
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
            className="px-5 py-3 bg-brand-navy-950 hover:bg-brand-navy-900 text-white border border-white/20 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
          >
            <span className="material-symbols-outlined text-[20px] text-brand-sand-300">add_circle</span>
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
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-brand-navy-800 flex items-center justify-between shadow-xs ${
            activeTab === 'SENT' && selectedClassFilter === 'ALL'
              ? 'border-brand-navy-800 dark:border-brand-navy-600 ring-2 ring-brand-navy-800/10 dark:ring-brand-navy-600/30'
              : 'border-brand-navy-200 dark:border-brand-navy-700 hover:border-brand-navy-300 dark:hover:border-brand-navy-600'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider">
              {isEn ? 'Total Broadcasts Sent' : 'Tổng thông báo đã gửi'}
            </div>
            <div className="font-chivo text-2xl sm:text-3xl font-black text-brand-navy-900 dark:text-white mt-1">
              {stats.totalSent} <span className="text-xs font-normal text-brand-navy-400">{isEn ? 'notices' : 'bản tin'}</span>
            </div>
            <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1">
              {isEn ? 'Classwide announcements & homework drills' : 'Số lượng bản tin thông báo & bài tập đã gửi theo lớp'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">outbox</span>
          </div>
        </div>

        {/* Thẻ 2: Tổng lượt học viên tiếp cận (Dựa trên sỉ số các lớp đã nhận thông báo) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider">
              {isEn ? 'Total Student Reach' : 'Tổng lượt học viên tiếp cận'}
            </div>
            <div className="font-chivo text-2xl sm:text-3xl font-black text-brand-sage-700 dark:text-brand-sage-500 mt-1">
              {stats.totalRecipients} <span className="text-xs font-normal text-brand-navy-400">{isEn ? 'students' : 'lượt học viên'}</span>
            </div>
            <p className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-1">
              {isEn ? 'Calculated from class enrollment capacities' : 'Tính toán dựa trên sỉ số các lớp đã nhận thông báo'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-sage-500/15 dark:bg-brand-sage-500/20 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
        </div>
      </div>

      <CoachError message={error} retry={loadData} />

      {/* 3. TOOLBAR ĐIỀU HƯỚNG & BỘ LỌC ĐA NĂNG */}
      <div className="p-3 bg-white dark:bg-brand-navy-800 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Segmented Tab Switcher */}
          <div className="flex items-center gap-1 bg-brand-navy-100 dark:bg-brand-navy-800 p-1 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setActiveTab('SENT')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SENT' ? 'bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-white shadow-xs' : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{isEn ? `Sent (${notifications.length})` : `Đã gửi (${notifications.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INBOX')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'INBOX' ? 'bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-white shadow-xs' : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">inbox</span>
              <span>{isEn ? 'Inbox' : 'Hộp thư đến'}</span>
              {stats.inboxUnread > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-brand-terra-700 text-white">
                  {stats.inboxUnread}
                </span>
              )}
            </button>
          </div>

          {/* Chế độ xem: Chia đôi (Master-Detail) vs Lưới thẻ (Grid) */}
          {activeTab === 'SENT' && (
            <div className="flex items-center gap-1 bg-brand-navy-100 dark:bg-brand-navy-800 p-1 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'split' ? 'bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-white shadow-xs' : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
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
                  viewMode === 'grid' ? 'bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-white shadow-xs' : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
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
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-brand-navy-100 dark:border-brand-navy-700 text-xs">
            {/* Ô tìm kiếm */}
            <div className="sm:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-navy-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search title, content, class name..." : "Tìm tiêu đề, nội dung, tên lớp..."}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-brand-navy-300 dark:border-brand-navy-600 dark:bg-brand-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 bg-white font-medium placeholder-brand-navy-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-navy-400 hover:text-brand-navy-600 p-0.5 cursor-pointer"
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
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-brand-navy-300 dark:border-brand-navy-600 dark:bg-brand-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 bg-white font-medium cursor-pointer"
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
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-brand-navy-300 dark:border-brand-navy-600 dark:bg-brand-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 bg-white font-medium cursor-pointer"
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
            <div className="p-10 text-center bg-white dark:bg-brand-navy-800 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-700 max-w-md mx-auto space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-brand-sage-500/15 text-brand-sage-700 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[28px]">campaign</span>
              </div>
              <h3 className="font-chivo text-sm font-bold text-brand-navy-900 dark:text-white">
                {notifications.length === 0 ? 'Chưa Có Thông Báo Hoặc Bài Tập Nào' : 'Không Tìm Thấy Thông Báo Phù Hợp'}
              </h3>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 leading-relaxed">
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
                  className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-navy-900 hover:bg-brand-navy-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                <div className="text-[11px] font-bold text-brand-navy-400 px-1 uppercase tracking-wider flex items-center justify-between">
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
                          ? 'bg-brand-sage-500/10 border-brand-sage-500/40 shadow-xs ring-1 ring-brand-sage-500/20 border-l-4 border-l-brand-sage-500'
                          : 'bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 hover:border-brand-navy-300 dark:hover:border-brand-navy-600 hover:bg-brand-navy-50/50 shadow-2xs'
                      }`}
                    >
                      {/* Dòng 1: Badges + Ngày giờ */}
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded border ${detected.badgeClass}`}>
                          {detected.label}
                        </span>
                        <span className="text-[10px] text-brand-navy-400 font-mono">
                          {formatMemberDateTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Tiêu đề */}
                      <h4 className="font-chivo font-black text-brand-navy-900 dark:text-white text-xs sm:text-sm line-clamp-1 leading-snug">
                        {notif.title}
                      </h4>

                      {/* Đoạn trích nội dung */}
                      <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 line-clamp-2 mt-1 leading-relaxed">
                        {notif.content}
                      </p>

                      {/* Dòng đáy: Đối tượng nhận + số lượng */}
                      <div className="flex items-center justify-between pt-1.5 mt-2 border-t border-brand-navy-100 dark:border-brand-navy-700 text-[11px] text-brand-navy-500">
                        <span className="flex items-center gap-1 truncate max-w-[210px] font-medium text-brand-navy-700 dark:text-brand-navy-300">
                          <span className="material-symbols-outlined text-[13px] text-brand-navy-400">
                            school
                          </span>
                          <span className="truncate">{notif.target || 'Toàn bộ các lớp'}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-brand-navy-400">
                          {notif.recipientCount} học viên
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CỘT PHẢI (7/12): Chi tiết thông báo đang chọn */}
              <div className="lg:col-span-7 bg-white dark:bg-brand-navy-800 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-700 p-5 shadow-xs space-y-4 sticky top-4">
                {selectedNotif ? (
                  <>
                    {/* Header thông báo */}
                    <div className="space-y-2 pb-3 border-b border-brand-navy-100 dark:border-brand-navy-700">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${detectType(selectedNotif.title, selectedNotif.content).badgeClass}`}>
                            {detectType(selectedNotif.title, selectedNotif.content).label}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 border border-brand-navy-200 dark:border-brand-navy-600">
                            <span className="material-symbols-outlined text-[13px]">groups</span>
                            <span>{selectedNotif.recipientCount} học viên nhận</span>
                          </span>
                        </div>

                        <div className="text-right text-xs text-brand-navy-400 font-mono flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{formatMemberDateTime(selectedNotif.createdAt)}</span>
                        </div>
                      </div>

                      <h2 className="font-chivo font-black text-brand-navy-900 dark:text-white text-base sm:text-lg break-words leading-snug">
                        {selectedNotif.title}
                      </h2>
                    </div>

                    {/* Thẻ đối tượng nhận chi tiết */}
                    <div className="p-3 rounded-xl bg-brand-navy-50/80 dark:bg-brand-navy-800 border border-brand-navy-200/80 dark:border-brand-navy-700 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand-navy-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          <span className="material-symbols-outlined text-[18px]">school</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400">
                            Đối tượng nhận thông báo
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-brand-navy-800 dark:text-brand-navy-200 truncate">
                            {selectedNotif.target || 'Toàn bộ các lớp học'}
                          </div>
                        </div>
                      </div>

                      {/* Phím tắt liên kết đến danh sách học viên của lớp */}
                      {selectedNotif.classId && (
                        <a
                          href={`#/coach/members?classId=${selectedNotif.classId}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-navy-200 dark:bg-brand-navy-700 hover:bg-brand-navy-300 dark:hover:bg-brand-navy-600 text-brand-navy-800 dark:text-brand-navy-200 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">group</span>
                          <span>Xem danh sách lớp</span>
                        </a>
                      )}
                    </div>

                    {/* Hộp nội dung đầy đủ */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-brand-navy-400">
                        Nội dung chi tiết:
                      </div>
                      <div className="p-4 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200/80 dark:border-brand-navy-700 text-brand-navy-800 dark:text-brand-navy-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[140px]">
                        {selectedNotif.content}
                      </div>
                    </div>

                    {/* Dải công cụ dưới cùng */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-700 text-xs">
                      <span className="text-brand-navy-400 font-mono text-[11px]">
                        ID: #{selectedNotif.id}
                      </span>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyContent(selectedNotif.content)}
                          className="px-3 py-1.5 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">content_copy</span>
                          <span>Sao chép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(selectedNotif)}
                          className="px-3 py-1.5 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit_note</span>
                          <span>Soạn tương tự</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-brand-navy-400 text-xs">
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
                    className={`bg-white dark:bg-brand-navy-800 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3 border-l-4 ${detected.stripe}`}
                  >
                    <div className="space-y-2">
                      {/* Dòng 1: Badges, Time */}
                      <div className="flex items-start justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${detected.badgeClass}`}>
                          {detected.label}
                        </span>
                        <span className="text-[11px] text-brand-navy-400 font-mono">
                          {formatMemberDateTime(notif.createdAt)}
                        </span>
                      </div>

                      {/* Tiêu đề */}
                      <h3 className="font-chivo font-black text-brand-navy-900 dark:text-white text-sm sm:text-base line-clamp-1 leading-snug">
                        {notif.title}
                      </h3>

                      {/* Đối tượng */}
                      <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px]">school</span>
                        <span>{notif.target || 'Toàn bộ các lớp'}</span>
                        <span>•</span>
                        <span>{notif.recipientCount} học viên</span>
                      </div>

                      {/* Nội dung thu gọn 3 dòng */}
                      <div className="p-2.5 rounded-lg bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-100 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs line-clamp-3 leading-relaxed">
                        {notif.content}
                      </div>
                    </div>

                    {/* Dải nút hành động */}
                    <div className="flex items-center justify-between pt-2 border-t border-brand-navy-100 dark:border-brand-navy-700 text-xs">
                      <span className="font-mono text-[10px] text-brand-navy-400">#{notif.id}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyContent(notif.content)}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 transition-colors cursor-pointer"
                        >
                          Sao chép
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(notif)}
                          className="px-2 py-1 rounded text-[11px] font-bold border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
              <span className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-brand-sand-700 dark:text-brand-sand-400">bolt</span>
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
                  className="px-2.5 py-1 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:border-brand-teal-400 hover:bg-brand-teal-50/50 dark:hover:bg-brand-teal-950/30 text-left text-xs font-medium transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-brand-navy-800 dark:text-brand-navy-200 text-[11px]">{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Dropdown Chọn Lớp nhận thông báo (Bắt buộc chọn 1 hoặc nhiều lớp, không có option user lẻ) */}
          <div className="space-y-1.5 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-700">
            <div className="flex items-center justify-between">
              <label htmlFor="classSelect" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300">
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
                className="text-[11px] text-brand-teal-700 dark:text-brand-teal-400 hover:underline font-semibold cursor-pointer"
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-navy-300 dark:border-brand-navy-600 dark:bg-brand-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 bg-white font-medium cursor-pointer shadow-2xs"
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
              <div className="p-3 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/60 dark:bg-brand-navy-800 space-y-2">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-brand-navy-200 dark:border-brand-navy-600">
                  <span className="font-bold text-brand-navy-700 dark:text-brand-navy-300">
                    Đã chọn: {selectedClassIds.length}/{classes.length} lớp
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-[11px] text-brand-teal-700 dark:text-brand-teal-400 hover:underline font-bold cursor-pointer"
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
                            ? 'bg-brand-teal-50/80 border-brand-teal-300 dark:bg-brand-teal-950/40 dark:border-brand-teal-800 text-brand-teal-950 dark:text-brand-teal-200 font-bold'
                            : 'bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleClass(cls.id)}
                            className="rounded border-brand-navy-300 text-brand-teal-700 dark:text-brand-teal-400 focus:ring-brand-teal-500 cursor-pointer"
                          />
                          <span>{cls.name} {cls.sportName ? `(${cls.sportName})` : ''}</span>
                        </div>
                        <span className="text-[11px] font-mono text-brand-navy-400">
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
            <label htmlFor="notificationTitle" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300">
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
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-navy-300 dark:border-brand-navy-600 dark:bg-brand-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 bg-white font-medium placeholder-brand-navy-400 shadow-2xs"
            />
          </div>

          {/* 3. Textarea Nội dung / Bài tập về nhà */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="notificationContent" className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300">
                3. Nội dung / Bài tập về nhà *
              </label>
              <span className="text-[11px] font-mono text-brand-navy-400">{content.length}/4000</span>
            </div>
            <textarea
              id="notificationContent"
              rows="6"
              required
              maxLength={4000}
              placeholder={isEn ? "Enter homework details, drills, reps, rest time or class announcements..." : "Nhập chi tiết các động tác bài tập về nhà, số hiệp, thời gian nghỉ hoặc nội dung dặn dò lớp học..."}
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-navy-300 dark:border-brand-navy-600 dark:bg-brand-navy-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 bg-white placeholder-brand-navy-400 resize-y min-h-[130px] shadow-2xs font-normal"
            />
          </div>

          {/* 4. Nút submit Gửi thông báo */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-700">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={sending}
              className="px-4 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 text-xs font-bold transition-all cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 text-brand-sand-300 hover:text-white border border-brand-sand-300/30 text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
