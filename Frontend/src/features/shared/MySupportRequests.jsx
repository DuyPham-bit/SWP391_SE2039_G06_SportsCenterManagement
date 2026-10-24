import React, { useEffect, useRef, useState, useMemo } from 'react';
import { supportApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { formatMemberDateTime } from '../member/memberOverview.js';

const getStatusConfig = (isEn) => ({
  Open: {
    label: isEn ? 'Open' : 'Mới gửi',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
    icon: 'mail'
  },
  InProgress: {
    label: isEn ? 'In Progress' : 'Đang xử lý',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    icon: 'autorenew'
  },
  Resolved: {
    label: isEn ? 'Resolved' : 'Đã giải quyết',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    icon: 'check_circle'
  }
});

const getMemberTopicPresets = (isEn) => [
  { prefix: isEn ? '[Package & Pass] ' : '[Gói tập & Thẻ] ', label: isEn ? '🎫 Packages & Renewals' : '🎫 Gói tập & Gia hạn', example: isEn ? 'Validity or membership privilege questions' : 'Thắc mắc thời hạn hoặc quyền lợi thẻ' },
  { prefix: isEn ? '[Class Schedule] ' : '[Lịch học] ', label: isEn ? '📅 Schedule & Bookings' : '📅 Lịch học & Đặt chỗ', example: isEn ? 'Reschedule request or session freeze' : 'Yêu cầu đổi ca hoặc bảo lưu buổi tập' },
  { prefix: isEn ? '[Facilities] ' : '[Cơ sở vật chất] ', label: isEn ? '🏟️ Equipment & Studios' : '🏟️ Thiết bị & Phòng tập', example: isEn ? 'Report equipment, locker or shower issues' : 'Báo sự cố thiết bị, phòng thay đồ, tủ khóa' },
  { prefix: isEn ? '[Coach & Training] ' : '[HLV & Chuyên môn] ', label: isEn ? '🥊 Coaches & Drills' : '🥊 Huấn luyện viên', example: isEn ? 'Feedback on coaching or training plans' : 'Ý kiến về ca dạy hoặc giáo án tập luyện' },
  { prefix: isEn ? '[Front Desk Service] ' : '[Dịch vụ tại quầy] ', label: isEn ? '💬 Front Desk Service' : '💬 Phản ánh dịch vụ', example: isEn ? 'Staff attitude or procedure inquiries' : 'Góp ý thái độ phục vụ hoặc thủ tục' }
];

const getCoachTopicPresets = (isEn) => [
  { prefix: isEn ? '[Equipment] ' : '[Thiết bị] ', label: isEn ? '🏋️ Weights & Equipment' : '🏋️ Dụng cụ & Thiết bị tập', example: isEn ? 'Request extra weights, balls, mats or machines' : 'Đề xuất bổ sung tạ, bóng, thảm hoặc máy tập' },
  { prefix: isEn ? '[Studio & Courts] ' : '[Phòng & Sân bãi] ', label: isEn ? '🏟️ Studio & Court Issues' : '🏟️ Sự cố phòng tập/sân', example: isEn ? 'Broken lighting, AC, floor surfaces' : 'Hỏng đèn, điều hòa, mặt sân tập' },
  { prefix: isEn ? '[Teaching Schedule] ' : '[Lịch dạy] ', label: isEn ? '📋 Teaching & Shift Hours' : '📋 Lịch giảng dạy & Ca trực', example: isEn ? 'Leave request, shift swap or makeup classes' : 'Báo bận, đề xuất đổi ca hoặc bù giờ dạy' },
  { prefix: isEn ? '[Student Support] ' : '[Học viên] ', label: isEn ? '👥 Class Member Support' : '👥 Hỗ trợ học viên trong lớp', example: isEn ? 'Injured student or special attention needed' : 'Trường hợp học viên chấn thương hoặc cần theo dõi riêng' },
  { prefix: isEn ? '[Curriculum & Ops] ' : '[Chuyên môn & BQL] ', label: isEn ? '💬 Curriculum & Management' : '💬 Đề xuất chuyên môn', example: isEn ? 'Suggestions to improve coaching quality' : 'Ý kiến nâng cao chất lượng khóa đào tạo' }
];

export function MySupportRequests() {
  const { currentUser, role } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const statusConfig = useMemo(() => getStatusConfig(isEn), [isEn]);

  const isCoach = String(role || '').toUpperCase() === 'COACH';
  const topicPresets = useMemo(
    () => (isCoach ? getCoachTopicPresets(isEn) : getMemberTopicPresets(isEn)),
    [isCoach, isEn]
  );

  // Filter & Data States
  const [activeStatusTab, setActiveStatusTab] = useState(''); // '' | 'Open' | 'InProgress' | 'Resolved'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [revision, setRevision] = useState(0);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Modal / Detail states
  const [creating, setCreating] = useState(false);
  const [createSubject, setCreateSubject] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createError, setCreateError] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const activeUserIdRef = useRef(currentUser?.id);
  activeUserIdRef.current = currentUser?.id;

  const reload = () => setRevision(prev => prev + 1);

  // Fetch paginated tickets from server
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    supportApi
      .getMine({ status: activeStatusTab, page: currentPage })
      .then(result => {
        if (active) {
          setData(result);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || (isEn ? 'Unable to load support requests.' : 'Không thể tải danh sách yêu cầu hỗ trợ.'));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id, activeStatusTab, currentPage, revision]);

  // Reset detail when user changes
  useEffect(() => {
    setDetail(null);
    setCreating(false);
    setDetailError('');
  }, [currentUser?.id]);

  // Filter items in the loaded page by search term.
  const displayedItems = useMemo(() => {
    if (!data?.items) return [];
    let list = data.items;

    if (searchKeyword.trim()) {
      const term = searchKeyword.trim().toLowerCase();
      list = list.filter(
        item =>
          item.subject?.toLowerCase().includes(term) ||
          String(item.id).includes(term)
      );
    }

    return list;
  }, [data?.items, searchKeyword]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = data?.totalCount ?? 0;
    const items = data?.items ?? [];
    const openCount = items.filter(i => i.status === 'Open').length;
    const inProgressCount = items.filter(i => i.status === 'InProgress').length;
    const resolvedCount = items.filter(i => i.status === 'Resolved').length;

    return { total, openCount, inProgressCount, resolvedCount };
  }, [data]);

  // Open ticket details
  const openDetail = async id => {
    const currentId = currentUser?.id;
    setDetailLoading(true);
    setDetailError('');
    try {
      const res = await supportApi.get(id);
      if (activeUserIdRef.current === currentId) {
        setDetail(res);
        setReplyMessage('');
        // Smooth scroll to detail
        setTimeout(() => {
          document.getElementById('support-detail-view')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      if (activeUserIdRef.current === currentId) {
        setDetailError(err.message || (isEn ? 'Unable to view request details.' : 'Không thể xem nội dung yêu cầu.'));
        showError(err.message || (isEn ? 'Error loading request details.' : 'Lỗi khi tải chi tiết yêu cầu.'));
      }
    } finally {
      if (activeUserIdRef.current === currentId) {
        setDetailLoading(false);
      }
    }
  };

  // Submit new ticket
  const handleCreateSubmit = async e => {
    e.preventDefault();
    const subject = createSubject.trim();
    const description = createDescription.trim();

    if (!subject) {
      setCreateError(isEn ? 'Please enter a request subject.' : 'Vui lòng nhập tiêu đề yêu cầu hỗ trợ.');
      return;
    }
    if (subject.length > 200) {
      setCreateError(isEn ? 'Subject cannot exceed 200 characters.' : 'Tiêu đề không được vượt quá 200 ký tự.');
      return;
    }
    if (!description) {
      setCreateError(isEn ? 'Please describe your issue in detail.' : 'Vui lòng mô tả chi tiết nội dung cần hỗ trợ.');
      return;
    }
    if (description.length > 5000) {
      setCreateError(isEn ? 'Description cannot exceed 5000 characters.' : 'Nội dung không được vượt quá 5000 ký tự.');
      return;
    }

    const currentId = currentUser?.id;
    setSubmittingCreate(true);
    setCreateError('');

    try {
      const res = await supportApi.submit({ subject, description });

      if (activeUserIdRef.current === currentId) {
        showSuccess(isEn ? `Request #${res.request.id} submitted successfully!` : `Đã gửi yêu cầu #${res.request.id} thành công!`);
        setCreating(false);
        setCreateSubject('');
        setCreateDescription('');
        setDetail(res);
        setActiveStatusTab('');
        setCurrentPage(1);
        reload();
      }
    } catch (err) {
      if (activeUserIdRef.current === currentId) {
        setCreateError(err.message || (isEn ? 'Cannot submit support request. Please try again.' : 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.'));
      }
    } finally {
      if (activeUserIdRef.current === currentId) {
        setSubmittingCreate(false);
      }
    }
  };

  // Reply to ticket
  const handleReplySubmit = async e => {
    e.preventDefault();
    if (!detail) return;
    const msg = replyMessage.trim();
    if (!msg) {
      showError(isEn ? 'Please enter a reply message.' : 'Vui lòng nhập nội dung phản hồi.');
      return;
    }
    if (msg.length > 5000) {
      showError(isEn ? 'Reply message cannot exceed 5000 characters.' : 'Nội dung phản hồi không được quá 5000 ký tự.');
      return;
    }

    const currentId = currentUser?.id;
    setSubmittingReply(true);
    try {
      const updated = await supportApi.reply(detail.request.id, msg);
      if (activeUserIdRef.current === currentId) {
        setDetail(updated);
        setReplyMessage('');
        showSuccess(isEn ? 'Additional reply sent to the center.' : 'Đã gửi phản hồi bổ sung tới trung tâm.');
        reload();
      }
    } catch (err) {
      if (activeUserIdRef.current === currentId) {
        showError(err.message || (isEn ? 'Unable to send reply.' : 'Không thể gửi phản hồi.'));
      }
    } finally {
      if (activeUserIdRef.current === currentId) {
        setSubmittingReply(false);
      }
    }
  };

  // Handle Preset Chip Click
  const handlePresetClick = preset => {
    if (createSubject.startsWith(preset.prefix)) {
      setCreateSubject(createSubject.replace(preset.prefix, ''));
    } else {
      // Remove any other prefix if exists
      let clean = createSubject;
      topicPresets.forEach(p => {
        if (clean.startsWith(p.prefix)) clean = clean.slice(p.prefix.length);
      });
      setCreateSubject(preset.prefix + clean.trim());
    }
  };

  return (
    <div className="space-y-6 pb-12 font-lexend">
      {/* 1. Olympic Hero Masterpiece Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-8 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden">
        {/* Glow ambient background accents matching Olympic logo palette */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {isCoach
                  ? (isEn ? 'SCMS COACH SUPPORT CHANNEL' : 'KÊNH HỖ TRỢ HUẤN LUYỆN VIÊN SCMS')
                  : (isEn ? 'SCMS MEMBER SUPPORT CENTER' : 'TRUNG TÂM HỖ TRỢ HỘI VIÊN SCMS')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-chivo font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Support Requests & Inquiries' : 'Yêu Cầu Hỗ Trợ & Khiếu Nại'}
            </h1>
            <p className="text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isCoach
                ? (isEn
                    ? 'Submit equipment proposals, report room/facility issues, adjust class schedules, or consult directly with Management.'
                    : 'Gửi đề xuất thiết bị, báo hỏng phòng/sàn tập, điều chỉnh ca dạy hoặc trao đổi chuyên môn trực tiếp với Ban Quản Lý.')
                : (isEn
                    ? 'Inquiries regarding membership, bookings, cancellations, facilities, or service feedback. Front Desk & Management will resolve promptly.'
                    : 'Tiếp nhận mọi thắc mắc về thẻ tập, đặt lớp, hoàn hủy, phòng tập hoặc phản ánh chất lượng phục vụ. Đội ngũ Lễ tân & Quản lý sẽ giải quyết nhanh chóng.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCreateError('');
                setCreateSubject('');
                setCreateDescription('');
                setCreating(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-amber-400">add_circle</span>
              <span>{isEn ? 'Submit Support Request' : 'Gửi Yêu Cầu Hỗ Trợ'}</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={reload}
              className="p-3 rounded-xl border border-white/20 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-colors"
              title={isEn ? "Reload data" : "Tải lại dữ liệu"}
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {/* Quick Hotline Bar */}
        <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs text-white/90">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-300 text-[18px]">verified</span>
            <span className="font-medium drop-shadow-xs">{isEn ? 'Committed to response & resolution within 24 business hours.' : 'Cam kết tiếp nhận & xử lý phản hồi trong vòng 24 giờ làm việc.'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-300 text-[18px]">call</span>
            <span className="font-medium drop-shadow-xs">{isEn ? 'Front Desk Emergency Hotline: ' : 'Hotline khẩn cấp quầy Lễ tân: '}<strong className="text-white font-mono font-bold">0901 234 567</strong></span>
          </div>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{isEn ? 'Total Requests' : 'Tổng yêu cầu'}</p>
            <p className="text-2xl font-chivo font-black text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">{isEn ? 'Open' : 'Mới gửi'}</p>
            <p className="text-2xl font-chivo font-black text-sky-700 mt-1">{stats.openCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">mark_email_unread</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">{isEn ? 'In Progress' : 'Đang xử lý'}</p>
            <p className="text-2xl font-chivo font-black text-amber-700 mt-1">{stats.inProgressCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">autorenew</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{isEn ? 'Resolved' : 'Đã giải quyết'}</p>
            <p className="text-2xl font-chivo font-black text-emerald-700 mt-1">{stats.resolvedCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: '', label: isEn ? 'All Statuses' : 'Tất cả trạng thái', icon: 'list' },
              { id: 'Open', label: isEn ? 'Open' : 'Mới gửi', icon: 'mail' },
              { id: 'InProgress', label: isEn ? 'In Progress' : 'Đang xử lý', icon: 'autorenew' },
              { id: 'Resolved', label: isEn ? 'Resolved' : 'Đã giải quyết', icon: 'check_circle' }
            ].map(tab => {
              const active = activeStatusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveStatusTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Search input */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder={isEn ? "Quick search by subject or request code (#1024)..." : "Tìm nhanh theo tiêu đề hoặc mã yêu cầu (#1024)..."}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-slate-50/50 hover:bg-white"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              title={isEn ? "Clear search" : "Xóa tìm kiếm"}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600">error</span>
            <span>{error}</span>
          </div>
          <button onClick={reload} className="px-3 py-1 text-xs font-bold rounded-lg border border-red-300 hover:bg-red-100">
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      )}

      {/* 4. Ticket List View */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12">
          <LoadingSpinner text={isEn ? "Syncing support requests from server..." : "Đang đồng bộ phiếu yêu cầu từ hệ thống..."} />
        </div>
      ) : !data || displayedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">support_agent</span>
          </div>
          <div>
            <h3 className="font-chivo text-base font-bold text-slate-800">
              {searchKeyword || activeStatusTab
                ? (isEn ? 'No requests match your filter' : 'Không tìm thấy yêu cầu phù hợp với bộ lọc')
                : (isEn ? 'You have no support requests yet' : 'Bạn chưa có yêu cầu hỗ trợ nào')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {searchKeyword || activeStatusTab
                ? (isEn ? 'Try changing your search keyword or selecting a different status.' : 'Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại trạng thái.')
                : (isCoach
                    ? (isEn ? 'For any questions or issues during coaching and teaching, submit a request for Management assistance.' : 'Bất kỳ thắc mắc hoặc khó khăn nào trong quá trình tập luyện và giảng dạy, hãy gửi yêu cầu để Ban Quản Lý hỗ trợ bạn.')
                    : (isEn ? 'For any questions or difficulties during your training, submit a request for Front Desk & Management assistance.' : 'Bất kỳ thắc mắc hoặc khó khăn nào trong quá trình tập luyện và giảng dạy, hãy gửi yêu cầu để Ban Quản Lý hỗ trợ bạn.'))}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setCreating(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{isEn ? 'Create First Request' : 'Tạo yêu cầu đầu tiên'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 px-1 flex items-center justify-between">
            <span>{isEn ? `Showing ${displayedItems.length} requests` : `Hiển thị ${displayedItems.length} yêu cầu`}</span>
            <span>{isEn ? `Page ${currentPage} / ${Math.max(1, Math.ceil((data.totalCount || 1) / 20))}` : `Trang ${currentPage} / ${Math.max(1, Math.ceil((data.totalCount || 1) / 20))}`}</span>
          </div>

          <div className="grid gap-3">
            {displayedItems.map(req => {
              const statusCfg = statusConfig[req.status] || statusConfig.Open;
              const isSelected = detail?.request?.id === req.id;

              return (
                <article
                  key={req.id}
                  onClick={() => openDetail(req.id)}
                  className={`group bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-red-500 ring-2 ring-red-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{req.id}
                        </span>
                        <h2 className="font-bold text-slate-900 group-hover:text-red-600 transition-colors break-words text-sm sm:text-base">
                          {req.subject}
                        </h2>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          <span>{formatMemberDateTime(req.createdAt, isEn)}</span>
                        </span>
                        {req.resolvedAt && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>{isEn ? `Resolved at ${formatMemberDateTime(req.resolvedAt, isEn)}` : `Đã xử lý lúc ${formatMemberDateTime(req.resolvedAt)}`}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass} ${req.status === 'Open' ? 'animate-pulse' : ''}`} />
                        <span>{statusCfg.label}</span>
                      </span>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          openDetail(req.id);
                        }}
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-red-50 group-hover:text-red-600 group-hover:border-red-200 transition-colors"
                        title={isEn ? "View details" : "Xem chi tiết"}
                      >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {data.totalCount > 20 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>{isEn ? `Total: ${data.totalCount} requests` : `Tổng số: ${data.totalCount} yêu cầu`}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  {isEn ? 'Previous' : 'Trang trước'}
                </button>
                <span className="font-semibold text-slate-900">
                  {currentPage} / {Math.ceil(data.totalCount / 20)}
                </span>
                <button
                  type="button"
                  disabled={currentPage * 20 >= data.totalCount || loading}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  {isEn ? 'Next' : 'Trang sau'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Ticket Detail & Thread Section */}
      {detailLoading && (
        <div id="support-detail-view" className="bg-white rounded-2xl border border-slate-200 p-8">
          <LoadingSpinner text={isEn ? "Loading request discussion details..." : "Đang tải chi tiết trao đổi yêu cầu..."} />
        </div>
      )}

      {detailError && !detailLoading && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {detailError}
        </div>
      )}

      {detail && !detailLoading && (
        <section
          id="support-detail-view"
          aria-label={isEn ? "Support request details" : "Chi tiết yêu cầu hỗ trợ"}
          className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden space-y-6"
        >
          {/* Detail Header */}
          <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded">
                  #{detail.request.id}
                </span>
                <h2 className="font-chivo text-lg sm:text-xl font-black text-white break-words">
                  {detail.request.subject}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span>{isEn ? 'Created at: ' : 'Tạo lúc: '}{formatMemberDateTime(detail.request.createdAt, isEn)}</span>
                {detail.request.resolvedAt && (
                  <span className="text-emerald-400 font-semibold">
                    {isEn ? ' · Resolved at: ' : ' · Giải quyết lúc: '}{formatMemberDateTime(detail.request.resolvedAt, isEn)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Status Badge */}
              {(() => {
                const s = statusConfig[detail.request.status] || statusConfig.Open;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${s.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                    <span>{s.label}</span>
                  </span>
                );
              })()}

              {/* Close View Button */}
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                {isEn ? 'Close details' : 'Đóng chi tiết'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Original Request Content Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {currentUser?.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      {isEn ? `Original request from you (${currentUser?.fullName})` : `Nội dung ban đầu từ bạn (${currentUser?.fullName})`}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500">{formatMemberDateTime(detail.request.createdAt, isEn)}</span>
              </div>
              <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed pt-1">
                {detail.description}
              </p>
            </div>

            {/* Conversation Timeline */}
            <div className="space-y-4">
              <h3 className="font-chivo font-black text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px]">forum</span>
                <span>{isEn ? 'Resolution Timeline & Discussion' : 'Tiến trình xử lý & Trao đổi'} ({detail.messages?.length || 0})</span>
              </h3>

              {(!detail.messages || detail.messages.length === 0) ? (
                <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-center space-y-2">
                  <span className="material-symbols-outlined text-amber-600 text-[32px]">support_agent</span>
                  <p className="text-xs font-semibold text-amber-900">
                    {isEn ? 'Request has been logged in the system.' : 'Yêu cầu đã được ghi nhận trên hệ thống.'}
                  </p>
                  <p className="text-xs text-amber-700 max-w-md mx-auto">
                    {isEn
                      ? 'Front Desk & Management are reviewing your request and will reply shortly.'
                      : 'Đội ngũ Lễ tân & Quản lý đang tiếp nhận xem xét và sẽ gửi tin nhắn phản hồi sớm nhất.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detail.messages.map(m => {
                    const isStaff = !m.senderName || m.senderName.toLowerCase().includes('admin') || m.senderName.toLowerCase().includes('manager') || m.senderName.toLowerCase().includes('reception');

                    return (
                      <div
                        key={m.id}
                        className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                          isStaff
                            ? 'bg-red-50/50 border-red-200/80 shadow-sm'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              isStaff ? 'bg-[#3D405B] text-[#F2CC8F]' : 'bg-slate-700 text-white'
                            }`}>
                              <span className="material-symbols-outlined text-[16px]">
                                {isStaff ? 'support_agent' : 'person'}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900">
                                {isStaff
                                  ? (isEn ? `${m.senderName} (Management / Front Desk Representative)` : `${m.senderName} (Đại diện Ban Quản Lý / Lễ tân)`)
                                  : (isEn ? `${m.senderName} (You)` : `${m.senderName} (Bạn)`)}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {formatMemberDateTime(m.createdAt, isEn)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                          {m.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply or Resolution Card */}
            {detail.request.status !== 'Resolved' ? (
              <form onSubmit={handleReplySubmit} className="space-y-3 border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between">
                  <label htmlFor="reply-textarea" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isEn ? 'Send response or provide additional details' : 'Gửi phản hồi hoặc bổ sung thông tin'}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {replyMessage.length} / {isEn ? '5000 characters' : '5000 ký tự'}
                  </span>
                </div>
                <textarea
                  id="reply-textarea"
                  rows={3}
                  maxLength={5000}
                  required
                  disabled={submittingReply}
                  placeholder={isEn ? "Enter response to staff questions or provide additional details..." : "Nhập nội dung giải đáp câu hỏi của nhân viên hoặc cung cấp thêm thông tin..."}
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:opacity-50"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {isEn ? '💡 Front Desk will be notified immediately upon submission.' : '💡 Đội ngũ Lễ tân sẽ nhận được thông báo ngay khi bạn gửi tin.'}
                  </span>
                  <button
                    type="submit"
                    disabled={submittingReply || !replyMessage.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {submittingReply ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{isEn ? 'Sending...' : 'Đang gửi...'}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        <span>{isEn ? 'Send response' : 'Gửi phản hồi'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">{isEn ? 'Request resolved successfully' : 'Yêu cầu đã được giải quyết thành công'}</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      {isEn ? 'If you need help with another issue, please create a new support ticket.' : 'Nếu bạn cần trợ giúp vấn đề khác, vui lòng tạo phiếu hỗ trợ mới.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreateError('');
                    setCreating(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                >
                  {isEn ? 'Create new request' : 'Tạo yêu cầu mới'}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. Modal Create Support Request */}
      <Modal
        isOpen={creating}
        onClose={() => {
          if (!submittingCreate) setCreating(false);
        }}
        title={isEn ? "Submit New Support Request" : "Gửi Yêu Cầu Hỗ Trợ Mới"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {createError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{createError}</span>
            </div>
          )}

          {/* Quick Category Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isEn ? 'Quick topic suggestions (click to select):' : 'Chủ đề gợi ý nhanh (bấm chọn):'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {topicPresets.map((preset, idx) => {
                const isSelected = createSubject.startsWith(preset.prefix);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3D405B] text-[#F2CC8F] border-[#3D405B] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <fieldset disabled={submittingCreate} className="space-y-4">
            {/* Subject Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isEn ? 'Request Subject' : 'Tiêu đề yêu cầu'} <span className="text-red-600">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {createSubject.length} / {isEn ? '200 characters' : '200 ký tự'}
                </span>
              </div>
              <input
                name="subject"
                required
                maxLength={200}
                placeholder={isEn ? "e.g. Reschedule Wednesday evening Yoga class or Report broken shower" : "Ví dụ: Đổi lịch tập lớp Yoga ca tối thứ 4 hoặc Báo hỏng vòi sen"}
                value={createSubject}
                onChange={e => setCreateSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isEn ? 'Detailed Description' : 'Nội dung chi tiết'} <span className="text-red-600">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {createDescription.length} / {isEn ? '5000 characters' : '5000 ký tự'}
                </span>
              </div>
              <textarea
                name="description"
                required
                maxLength={5000}
                rows={5}
                placeholder={isEn ? "Describe your issue in detail: when it occurred, facility/room location, contact phone number if needed..." : "Mô tả cụ thể vấn đề của bạn: thời gian xảy ra, vị trí phòng/sân tập, số điện thoại liên lạc nếu cần..."}
                value={createDescription}
                onChange={e => setCreateDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 leading-relaxed"
              />
            </div>

            {/* Pro Tip */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5">
                lightbulb
              </span>
              <span>
                <strong>{isEn ? 'Tip:' : 'Mẹo:'}</strong>{' '}
                {isEn
                  ? 'Providing your member/coach ID, room number, or coach name helps Management resolve your issue faster and more accurately.'
                  : 'Cung cấp rõ mã hội viên, số phòng tập hoặc tên huấn luyện viên sẽ giúp Ban Quản Lý xử lý chính xác và nhanh chóng hơn.'}
              </span>
            </div>
          </fieldset>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={submittingCreate}
              onClick={() => setCreating(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={submittingCreate || !createSubject.trim() || !createDescription.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F2CC8F] hover:bg-[#E07A5F] text-[#1E2235] hover:text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 shadow-md transition-all cursor-pointer"
            >
              {submittingCreate ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEn ? 'Submitting...' : 'Đang gửi...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>{isEn ? 'Submit request' : 'Gửi yêu cầu'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
