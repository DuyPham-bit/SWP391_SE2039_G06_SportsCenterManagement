import React, { useEffect, useState, useMemo } from 'react';
import { receptionApi } from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { counterButton, counterInput, CounterError, CounterMemberPicker } from './ReceptionistShared.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const getStatusConfig = isEn => ({
  Open: {
    label: isEn ? 'New Received' : 'Mới tiếp nhận',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500',
    icon: 'mark_email_unread',
    borderClass: 'border-l-sky-500'
  },
  InProgress: {
    label: isEn ? 'In Progress' : 'Đang xử lý',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
    icon: 'pending_actions',
    borderClass: 'border-l-amber-500'
  },
  Resolved: {
    label: isEn ? 'Resolved' : 'Đã giải quyết',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
    icon: 'check_circle',
    borderClass: 'border-l-emerald-500'
  }
});

const getPriorityConfig = isEn => ({
  Low: {
    label: isEn ? 'Low' : 'Thấp',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: 'low_priority',
    stripeClass: 'border-l-slate-300'
  },
  Normal: {
    label: isEn ? 'Normal' : 'Bình thường',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: 'schedule',
    stripeClass: 'border-l-blue-400'
  },
  High: {
    label: isEn ? 'High' : 'Cao',
    badgeClass: 'bg-[#E07A5F]/15 text-[#E07A5F] border-[#E07A5F]/30 font-bold',
    icon: 'emergency',
    stripeClass: 'border-l-[#E07A5F]'
  }
});

const getTopicPresets = isEn => [
  { prefix: isEn ? '[Package & Pass] ' : '[Gói tập & Thẻ] ', label: isEn ? '🎫 Package & Pass' : '🎫 Gói tập & Thẻ', hint: isEn ? 'Renewal, package change, pass benefits' : 'Gia hạn, đổi gói, thắc mắc quyền lợi thẻ' },
  { prefix: isEn ? '[Schedule & Booking] ' : '[Lịch học & Đặt chỗ] ', label: isEn ? '📅 Schedule & Booking' : '📅 Lịch học & Đặt chỗ', hint: isEn ? 'Rescheduling, class transfer, session reserve' : 'Đổi ca, chuyển lớp, bảo lưu buổi tập' },
  { prefix: isEn ? '[Facility & Court] ' : '[Cơ sở vật chất] ', label: isEn ? '🏟️ Facilities & Courts' : '🏟️ Thiết bị & Sân bãi', hint: isEn ? 'Lockers, gym machines, AC' : 'Báo lỗi tủ locker, máy tập, điều hòa' },
  { prefix: isEn ? '[Coach & PT] ' : '[HLV & Chuyên môn] ', label: isEn ? '🥊 Coach & Trainer' : '🥊 Huấn luyện viên', hint: isEn ? 'Feedback on coaching or training plans' : 'Phản ánh buổi dạy hoặc giáo án PT' },
  { prefix: isEn ? '[Desk & Cashier] ' : '[Dịch vụ tại quầy] ', label: isEn ? '💬 Desk & Cashier' : '💬 Dịch vụ & Thu ngân', hint: isEn ? 'Invoices, payments, counter check-in' : 'Hóa đơn, thanh toán, thủ tục tại quầy' }
];

const getQuickNotes = isEn =>
  isEn
    ? [
        'Resolved directly for the member at the counter.',
        'Explained the renewal and payment procedure.',
        'Forwarded to maintenance team to inspect equipment.',
        'Contacted assigned coach to assist the student.',
        'Spoke on phone and member agreed with resolution plan.'
      ]
    : [
        'Đã hỗ trợ giải quyết xong cho thành viên tại quầy.',
        'Đã hướng dẫn quy trình gia hạn và thanh toán gói tập.',
        'Đã chuyển thông tin tới bộ phận kỹ thuật để kiểm tra thiết bị.',
        'Đã liên hệ huấn luyện viên phụ trách ca để hỗ trợ học viên.',
        'Đã gọi điện trao đổi và thành viên đã đồng ý với phương án xử lý.'
      ];

const extractTopic = (subject = '') => {
  const match = subject.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    return { topic: match[1], cleanSubject: match[2] || match[1] };
  }
  return { topic: null, cleanSubject: subject };
};

export function SupportRequests({ allowCreate = true, showHeader = true }) {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const isEn = language === 'en';
  const canCreate = allowCreate && String(currentUser?.role || '').toUpperCase() === 'RECEPTIONIST';

  const statusConfig = useMemo(() => getStatusConfig(isEn), [isEn]);
  const priorityConfig = useMemo(() => getPriorityConfig(isEn), [isEn]);
  const topicPresets = useMemo(() => getTopicPresets(isEn), [isEn]);
  const quickNotes = useMemo(() => getQuickNotes(isEn), [isEn]);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [filter, setFilter] = useState({ query: '', status: '', page: 1, version: 0 });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [nextStatus, setNextStatus] = useState('Open');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  // Creation modal state
  const [creating, setCreating] = useState(false);
  const [member, setMember] = useState(null);
  const [createSubject, setCreateSubject] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createPriority, setCreatePriority] = useState('Normal');
  const [createError, setCreateError] = useState('');
  const [success, setSuccess] = useState('');

  const reload = () => setFilter(f => ({ ...f, version: f.version + 1 }));

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    receptionApi
      .getSupportRequests(filter)
      .then(result => {
        if (!active) return;
        setData(result);
        if (result?.items?.length > 0 && !detail && window.innerWidth >= 1024) {
          open(result.items[0].id);
        }
      })
      .catch(e => {
        if (active) setError(e.message || (isEn ? 'Failed to load support requests.' : 'Không thể tải danh sách yêu cầu.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filter]);

  const selectDetail = result => {
    setDetail(result);
    setNextStatus(result.request.status);
    setNote('');
  };

  const open = async id => {
    setBusy(true);
    setDetailError('');
    setSuccess('');
    try {
      const res = await receptionApi.getSupportRequest(id);
      selectDetail(res);
    } catch (e) {
      setDetailError(e.message || (isEn ? 'Failed to load request detail.' : 'Không thể tải chi tiết yêu cầu.'));
    } finally {
      setBusy(false);
    }
  };

  const handleSearchSubmit = e => {
    e.preventDefault();
    setFilter({ query, status, page: 1, version: filter.version + 1 });
  };

  const handleStatusFilterChange = newStatus => {
    setStatus(newStatus);
    setFilter(f => ({ ...f, status: newStatus, page: 1, version: f.version + 1 }));
  };

  const handleClearFilters = () => {
    setQuery('');
    setStatus('');
    setPriorityFilter('');
    setFilter({ query: '', status: '', page: 1, version: filter.version + 1 });
  };

  const create = async event => {
    event.preventDefault();
    if (!member) {
      setCreateError(isEn ? 'Please select a member to assist.' : 'Vui lòng chọn thành viên cần hỗ trợ.');
      return;
    }
    if (!createSubject.trim()) {
      setCreateError(isEn ? 'Please enter a request title.' : 'Vui lòng nhập tiêu đề yêu cầu.');
      return;
    }
    if (!createDescription.trim()) {
      setCreateError(isEn ? 'Please describe the support details.' : 'Vui lòng nhập nội dung chi tiết yêu cầu.');
      return;
    }

    setBusy(true);
    setCreateError('');
    try {
      const result = await receptionApi.createSupportRequest({
        memberId: member.id,
        subject: createSubject.trim(),
        description: createDescription.trim(),
        priority: createPriority
      });
      selectDetail(result);
      setCreating(false);
      setQuery('');
      setStatus('');
      setDetailError('');
      setSuccess(isEn ? `Recorded request #${result.request.id} successfully!` : `Đã ghi nhận yêu cầu #${result.request.id} thành công!`);
      setFilter(f => ({ query: '', status: '', page: 1, version: f.version + 1 }));
    } catch (e) {
      setCreateError(e.message || (isEn ? 'Failed to create request.' : 'Không thể tạo yêu cầu.'));
    } finally {
      setBusy(false);
    }
  };

  const update = async (event, overrideStatus = null) => {
    if (event) event.preventDefault();
    if (!detail) return;
    setBusy(true);
    setDetailError('');
    setSuccess('');

    const targetStatus = overrideStatus || nextStatus;
    try {
      const result = await receptionApi.updateSupportRequest(detail.request.id, {
        status: targetStatus,
        note: note.trim() || (overrideStatus === 'Resolved' ? (isEn ? 'Resolved and closed ticket.' : 'Đã xử lý và đóng yêu cầu.') : null)
      });
      selectDetail(result);
      setSuccess(isEn ? 'Updated ticket status successfully.' : 'Đã lưu cập nhật xử lý thành công.');
      reload();
    } catch (e) {
      setDetailError(e.message || (isEn ? 'Failed to save ticket update.' : 'Không thể lưu xử lý.'));
    } finally {
      setBusy(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!priorityFilter) return data.items;
    return data.items.filter(item => item.priority === priorityFilter);
  }, [data, priorityFilter]);

  const stats = useMemo(() => {
    const items = data?.items || [];
    return {
      total: data?.totalCount || 0,
      open: items.filter(i => i.status === 'Open').length,
      inProgress: items.filter(i => i.status === 'InProgress').length,
      resolved: items.filter(i => i.status === 'Resolved').length,
      highPriority: items.filter(i => i.priority === 'High').length
    };
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner Header */}
      {showHeader && (
        <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Subtle decorative Olympic curved motion lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
            <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
            <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          </svg>

          <div className="relative z-10 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isEn ? 'FRONT DESK & MEMBER CARE' : 'QUẦY LỄ TÂN & CHĂM SÓC KHÁCH HÀNG'}</span>
            </div>
            <h1 className="font-chivo text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              <span className="material-symbols-outlined text-[28px] text-amber-300">support_agent</span>
              <span>{isEn ? 'Support Requests & Inquiries' : 'Yêu Cầu Hỗ Trợ & Khiếu Nại'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/95 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Receive, triage, and track the progress of member inquiries, equipment reports, and coaching issues.'
                : 'Tiếp nhận, phân loại và theo dõi tiến độ xử lý các thắc mắc, sự cố của hội viên và huấn luyện viên tại trung tâm.'}
            </p>
          </div>

          {canCreate && (
            <button
              className="px-5 py-3 bg-slate-950 hover:bg-slate-900 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover-lift flex items-center gap-2 shrink-0 cursor-pointer relative z-10"
              disabled={busy}
              onClick={() => {
                setCreateError('');
                setMember(null);
                setCreateSubject('');
                setCreateDescription('');
                setCreatePriority('Normal');
                setCreating(true);
              }}
            >
              <span className="material-symbols-outlined text-[20px] text-amber-300">add_circle</span>
              <span>{isEn ? 'New Support Ticket' : 'Tiếp Nhận Yêu Cầu Mới'}</span>
            </button>
          )}
        </div>
      )}

      {/* Quick KPI Stat Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* All requests card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden hover-lift ${
            status === ''
              ? 'bg-[#1E2235] text-white border-[#1E2235] shadow-md ring-2 ring-[#81B29A]/50'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80">
            <span>{isEn ? 'All Requests' : 'Tất cả yêu cầu'}</span>
            <span className="material-symbols-outlined text-[18px]">all_inbox</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">{stats.total}</div>
        </button>

        {/* Open requests card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('Open')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden hover-lift ${
            status === 'Open'
              ? 'bg-sky-700 text-white border-sky-700 shadow-md ring-2 ring-sky-400'
              : 'bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              {isEn ? 'New' : 'Mới tiếp nhận'}
            </span>
            <span className="material-symbols-outlined text-[18px]">mark_email_unread</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">{stats.open}</div>
        </button>

        {/* In progress card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('InProgress')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden hover-lift ${
            status === 'InProgress'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
              : 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span>{isEn ? 'In Progress' : 'Đang xử lý'}</span>
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">{stats.inProgress}</div>
        </button>

        {/* Resolved card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('Resolved')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden hover-lift ${
            status === 'Resolved'
              ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-md ring-2 ring-[#81B29A]'
              : 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span>{isEn ? 'Resolved' : 'Đã giải quyết'}</span>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">{stats.resolved}</div>
        </button>
      </div>

      {/* Global Alerts */}
      <CounterError message={error} retry={reload} />
      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/90 dark:bg-emerald-950/40 p-4 text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-xs animate-fade-slide-up"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">check_circle</span>
            <span className="font-semibold">{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess('')}
            className="text-emerald-700 dark:text-emerald-300 hover:underline text-xs font-bold cursor-pointer"
          >
            {isEn ? 'Dismiss' : 'Đóng'}
          </button>
        </div>
      )}

      {/* Main Workspace: Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets Master List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 hover-lift transition-all">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  className={`${counterInput} pl-10 pr-9`}
                  aria-label={isEn ? 'Search support request' : 'Tìm yêu cầu hỗ trợ'}
                  maxLength={200}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={isEn ? 'Subject, member code or name...' : 'Tiêu đề, mã hoặc tên thành viên...'}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setFilter(f => ({ ...f, query: '', page: 1, version: f.version + 1 }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Status Pills Row */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleStatusFilterChange('')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    status === ''
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {isEn ? 'All' : 'Tất cả'}
                </button>
                {Object.entries(statusConfig).map(([k, cfg]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => handleStatusFilterChange(k)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      status === k
                        ? `${cfg.badgeClass} ring-1 ring-[#81B29A]/50 shadow-xs font-black`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                    <span>{cfg.label}</span>
                  </button>
                ))}
              </div>

              {/* Priority Dropdown & Action Row */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="relative flex-1">
                  <select
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                    aria-label={isEn ? 'Filter priority' : 'Lọc mức ưu tiên'}
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                  >
                    <option value="">{isEn ? 'All Priority' : 'Tất cả ưu tiên'}</option>
                    {Object.entries(priorityConfig).map(([v, cfg]) => (
                      <option key={v} value={v}>
                        {isEn ? `${cfg.label} Priority` : `Ưu tiên ${cfg.label}`}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-[0.98] text-white px-4 py-1.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                  disabled={loading || busy}
                >
                  <span className="material-symbols-outlined text-[15px]">filter_alt</span>
                  <span>{isEn ? 'Filter' : 'Lọc'}</span>
                </button>

                {(query || status || priorityFilter) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs px-2.5 py-1.5 transition-colors cursor-pointer shrink-0"
                    title={isEn ? 'Clear filters' : 'Xóa bộ lọc'}
                  >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div role="status" className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[28px] animate-spin">
                progress_activity
              </span>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {isEn ? 'Loading support requests...' : 'Đang tải danh sách yêu cầu...'}
              </p>
            </div>
          )}

          {/* Tickets List */}
          {data && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover-lift transition-all">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold">
                  {isEn ? `Requests List (${filteredItems.length}/${data.totalCount})` : `Danh sách yêu cầu (${filteredItems.length}/${data.totalCount})`}
                </span>
                {(query || status || priorityFilter) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[#2D6A4F] dark:text-[#81B29A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                    {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[640px] overflow-y-auto">
                {filteredItems.map(r => {
                  const isSelected = detail?.request?.id === r.id;
                  const statusInfo = statusConfig[r.status] || statusConfig.Open;
                  const priorityInfo = priorityConfig[r.priority] || priorityConfig.Normal;
                  const { topic, cleanSubject } = extractTopic(r.subject);

                  return (
                    <article
                      key={r.id}
                      onClick={() => open(r.id)}
                      className={`p-4 transition-all cursor-pointer relative border-l-4 ${priorityInfo.stripeClass} ${
                        isSelected
                          ? 'bg-[#81B29A]/10 ring-1 ring-inset ring-[#81B29A]/30 shadow-xs'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Top Row: ID, Topic Tag, Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            #{r.id}
                          </span>
                          {topic && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] border border-[#81B29A]/30 truncate max-w-[150px]">
                              {topic}
                            </span>
                          )}
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${statusInfo.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Subject */}
                      <h2 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {cleanSubject}
                      </h2>

                      {/* Requester Info */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <div className="w-5 h-5 rounded-full bg-[#1E2235] text-[#F2CC8F] font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(r.requesterName || r.memberName || 'M').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {r.requesterName || r.memberName}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          {r.requesterRole === 'COACH' ? (isEn ? 'Coach' : 'HLV') : r.memberCode}
                        </span>
                      </div>

                      {/* Footer Row: Priority & Timestamp */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100/80 dark:border-slate-800/80 text-[11px]">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] border ${priorityInfo.badgeClass}`}>
                          <span className="material-symbols-outlined text-[12px]">{priorityInfo.icon}</span>
                          {isEn ? `${priorityInfo.label} Priority` : `Ưu tiên ${priorityInfo.label}`}
                        </span>

                        <span className="text-slate-400 flex items-center gap-1 shrink-0">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {formatMemberDateTime(r.createdAt)}
                        </span>
                      </div>
                    </article>
                  );
                })}

                {!filteredItems.length && !loading && (
                  <div className="p-8 text-center space-y-2">
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[40px]">
                      inbox
                    </span>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {isEn ? 'No support requests found.' : 'Không tìm thấy yêu cầu phù hợp.'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isEn ? 'Try changing keywords or status filter above.' : 'Thử thay đổi từ khóa hoặc bộ lọc trạng thái phía trên.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap justify-between items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {isEn ? 'Total:' : 'Tổng số:'} <strong className="text-slate-800 dark:text-slate-200">{data.totalCount}</strong> · {isEn ? 'Page' : 'Trang'} {filter.page} / {Math.max(1, Math.ceil(data.totalCount / 20))}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                    disabled={busy || filter.page === 1}
                    onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
                  >
                    <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                    {isEn ? 'Previous' : 'Trang trước'}
                  </button>
                  <button
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                    disabled={busy || filter.page * 20 >= data.totalCount}
                    onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
                  >
                    {isEn ? 'Next' : 'Trang sau'}
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Ticket Detail Workspace (7 cols) */}
        <div className="lg:col-span-7">
          <CounterError message={detailError} />

          {detail ? (
            <section
              aria-label={isEn ? 'Support Request Details' : 'Chi tiết yêu cầu hỗ trợ'}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden sticky top-20 space-y-0 hover-lift transition-all"
            >
              {/* Detail Header Strip */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-[#1E2235] text-white">
                      #{detail.request.id}
                    </span>
                    {extractTopic(detail.request.subject).topic && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] border border-[#81B29A]/30">
                        {extractTopic(detail.request.subject).topic}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig[detail.request.status]?.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[detail.request.status]?.dotClass}`} />
                      {statusConfig[detail.request.status]?.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${priorityConfig[detail.request.priority]?.badgeClass}`}>
                      <span className="material-symbols-outlined text-[13px]">{priorityConfig[detail.request.priority]?.icon}</span>
                      {isEn ? `${priorityConfig[detail.request.priority]?.label} Priority` : `Ưu tiên ${priorityConfig[detail.request.priority]?.label}`}
                    </span>
                  </div>

                  <h2 className="font-chivo font-black text-lg md:text-xl text-slate-900 dark:text-white break-words leading-tight">
                    {extractTopic(detail.request.subject).cleanSubject}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => open(detail.request.id)}
                    title={isEn ? 'Reload detail' : 'Tải lại chi tiết'}
                    disabled={busy}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${busy ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    title={isEn ? 'Close detail' : 'Đóng chi tiết'}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>

              {/* Requester Mini-Profile & Time Bar */}
              <div className="px-5 py-3.5 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1E2235] text-[#F2CC8F] font-bold flex items-center justify-center text-sm shadow-xs border border-[#81B29A]">
                    {(detail.request.requesterName || detail.request.memberName || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm">
                        {detail.request.requesterName || detail.request.memberName}
                      </strong>
                      <span className="font-mono px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        {detail.request.requesterRole === 'COACH' ? (isEn ? 'Coach' : 'Huấn luyện viên') : detail.request.memberCode}
                      </span>
                    </div>
                    {detail.request.memberCode && (
                      <a
                        href={`#/receptionist/lookup?query=${encodeURIComponent(detail.request.memberCode)}`}
                        className="text-[#2D6A4F] dark:text-[#81B29A] hover:underline inline-flex items-center gap-0.5 mt-0.5 font-semibold"
                      >
                        <span>{isEn ? 'View Profile & Passes' : 'Hồ sơ & Gói tập'}</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_outward</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-right text-slate-500 dark:text-slate-400 space-y-0.5">
                  <p>
                    {isEn ? 'Created:' : 'Gửi lúc:'}{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{formatMemberDateTime(detail.request.createdAt)}</strong>
                  </p>
                  {detail.request.resolvedAt && (
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-[14px]">task_alt</span>
                      {isEn ? 'Resolved:' : 'Giải quyết:'} {formatMemberDateTime(detail.request.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-6">
                {/* Description Card */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">description</span>
                    <span>{isEn ? 'Request Description from Member' : 'Nội dung yêu cầu từ thành viên'}</span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {detail.description || (isEn ? 'No detailed description.' : 'Không có mô tả chi tiết.')}
                  </div>
                </div>

                {/* Timeline / Resolution History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">history</span>
                      <span>{isEn ? `Resolution Log & Comments (${detail.messages?.length || 0})` : `Lịch sử xử lý & Ghi chú (${detail.messages?.length || 0})`}</span>
                    </div>
                    {detail.messages?.length > 0 && (
                      <span className="text-[11px] text-slate-400">{isEn ? 'Latest note at the bottom' : 'Ghi chú gần nhất ở dưới cùng'}</span>
                    )}
                  </div>

                  {!detail.messages || detail.messages.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
                      {isEn
                        ? 'No handling notes yet. Update progress below when contacting or assisting the member.'
                        : 'Chưa có ghi chú xử lý nào. Hãy cập nhật tiến độ bên dưới khi liên hệ hoặc hỗ trợ thành viên.'}
                    </div>
                  ) : (
                    <div className="space-y-3 pl-2">
                      {detail.messages.map((m, idx) => (
                        <div key={m.id || idx} className="relative pl-6 pb-2 border-l-2 border-slate-200 dark:border-slate-700 last:border-transparent">
                          <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#1E2235] border-2 border-white dark:border-slate-900 shadow-xs" />
                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-slate-500">account_circle</span>
                                {m.senderName || (isEn ? 'Front Desk Staff' : 'Lễ tân trực')}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                {formatMemberDateTime(m.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-normal">
                              {m.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Processing Form */}
                <form onSubmit={e => update(e)} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A]">edit_note</span>
                      {isEn ? 'Update Ticket Handling' : 'Cập nhật xử lý yêu cầu'}
                    </span>
                    {busy && (
                      <span className="text-xs text-slate-500 flex items-center gap-1" role="status">
                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        {isEn ? 'Saving...' : 'Đang lưu...'}
                      </span>
                    )}
                  </div>

                  <fieldset disabled={busy} className="space-y-4">
                    {/* Status Segmented Buttons */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        {isEn ? 'Ticket Status' : 'Trạng thái xử lý'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(statusConfig).map(([v, cfg]) => {
                          const isActive = nextStatus === v;
                          return (
                            <button
                              type="button"
                              key={v}
                              onClick={() => setNextStatus(v)}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                isActive
                                  ? `${cfg.badgeClass} ring-2 ring-[#81B29A]/40 shadow-xs font-black`
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                              <span className="text-xs font-bold">{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <select
                        aria-label={isEn ? 'Ticket status' : 'Trạng thái xử lý'}
                        className="sr-only"
                        value={nextStatus}
                        onChange={e => setNextStatus(e.target.value)}
                      >
                        {Object.entries(statusConfig).map(([v, cfg]) => (
                          <option key={v} value={v}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Response Templates */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                        <span className="font-semibold">{isEn ? 'Quick Notes Template' : 'Mẫu phản hồi nhanh'}</span>
                        <span className="text-[11px] text-slate-400">{isEn ? 'Click to append' : 'Bấm để điền vào ghi chú'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {quickNotes.map((qn, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setNote(prev => prev ? `${prev}\n${qn}` : qn)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#81B29A] text-slate-600 dark:text-slate-400 text-[11px] font-medium transition-colors cursor-pointer text-left truncate max-w-full"
                          >
                            + {qn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Note Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>{isEn ? 'Handling Note / Reply' : 'Ghi chú xử lý'}</span>
                        <span className="text-slate-400 font-normal text-[11px]">{note.length}/5000 {isEn ? 'chars' : 'ký tự'}</span>
                      </label>
                      <textarea
                        aria-label={isEn ? 'Handling note' : 'Ghi chú xử lý'}
                        rows={3}
                        maxLength={5000}
                        className={`${counterInput} font-normal resize-y min-h-[80px]`}
                        placeholder={
                          isEn
                            ? 'Enter resolution notes, outcome, or conversation summary with the member...'
                            : 'Nhập chi tiết xử lý, kết quả hỗ trợ hoặc thông tin trao đổi với thành viên...'
                        }
                        value={note}
                        onChange={e => setNote(e.target.value)}
                      />
                    </div>
                  </fieldset>

                  {/* Submit Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    {detail.request.status !== 'Resolved' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={e => update(e, 'Resolved')}
                        className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover-lift"
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">task_alt</span>
                        <span>{isEn ? 'Resolve & Close Ticket' : 'Hoàn tất & Đã giải quyết'}</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={busy}
                      className="ml-auto px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 hover-lift"
                    >
                      {busy ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          <span>{isEn ? 'Saving...' : 'Đang lưu xử lý...'}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">save</span>
                          <span>{isEn ? 'Save Note' : 'Lưu Xử Lý'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3 sticky top-20">
              <div className="w-14 h-14 rounded-2xl bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[32px]">touch_app</span>
              </div>
              <h3 className="font-chivo font-black text-lg text-slate-800 dark:text-slate-200">
                {isEn ? 'Select a request to inspect details' : 'Chọn một yêu cầu để xem chi tiết'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {isEn
                  ? 'Click any ticket on the left list to read full description, view conversation history, and update resolution.'
                  : 'Nhấp vào bất kỳ yêu cầu nào ở danh sách bên trái để đọc nội dung đầy đủ, xem lịch sử trao đổi và cập nhật tiến độ xử lý cho hội viên.'}
              </p>
              {canCreate && <button
                type="button"
                onClick={() => {
                  setCreateError('');
                  setMember(null);
                  setCreateSubject('');
                  setCreateDescription('');
                  setCreatePriority('Normal');
                  setCreating(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer hover-lift"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                {isEn ? 'Create New Ticket' : 'Tạo yêu cầu mới'}
              </button>}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tiếp nhận yêu cầu hỗ trợ mới */}
      {canCreate && <Modal
        isOpen={creating}
        onClose={() => {
          if (!busy) setCreating(false);
        }}
        title={isEn ? 'Create New Support Request' : 'Tiếp nhận yêu cầu hỗ trợ mới'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={create} className="space-y-5">
          {/* Step 1: Chọn thành viên */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">person</span>
              <span>{isEn ? '1. Requesting Member *' : '1. Thành viên yêu cầu hỗ trợ *'}</span>
            </label>
            <CounterMemberPicker selected={member} onChange={setMember} disabled={busy} />
          </div>

          <CounterError message={createError} />

          <fieldset className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4" disabled={busy}>
            {/* Step 2: Chọn chủ đề nhanh */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">category</span>
                  {isEn ? '2. Quick Topic Category' : '2. Chủ đề yêu cầu nhanh'}
                </span>
                <span className="text-[11px] text-slate-400">{isEn ? 'Click to auto-fill title prefix' : 'Bấm để tự động điền tiền tố tiêu đề'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topicPresets.map((t, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setCreateSubject(prev => {
                        const stripped = prev.replace(/^\[.*?\]\s*/, '');
                        return `${t.prefix}${stripped}`;
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#81B29A] text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs hover-lift"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Tiêu đề */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isEn ? 'Request Title *' : 'Tiêu đề yêu cầu *'}
              </label>
              <input
                name="subject"
                required
                maxLength={200}
                className={counterInput}
                placeholder={isEn ? 'e.g. [Package & Pass] Requesting 1-month extension on Basic pass...' : 'Ví dụ: [Gói tập & Thẻ] Đề nghị gia hạn gói Basic thêm 1 tháng...'}
                value={createSubject}
                onChange={e => setCreateSubject(e.target.value)}
              />
            </div>

            {/* Step 4: Nội dung */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isEn ? 'Detailed Description *' : 'Nội dung chi tiết yêu cầu *'}</span>
                <span className="text-[11px] text-slate-400 font-normal">{createDescription.length}/5000 {isEn ? 'chars' : 'ký tự'}</span>
              </label>
              <textarea
                name="description"
                required
                maxLength={5000}
                rows={4}
                className={`${counterInput} resize-y min-h-[90px]`}
                placeholder={isEn ? 'Describe specific issue, feedback, or member inquiry...' : 'Mô tả cụ thể sự cố, phản ánh hoặc nguyện vọng của thành viên...'}
                value={createDescription}
                onChange={e => setCreateDescription(e.target.value)}
              />
            </div>

            {/* Step 5: Mức ưu tiên */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">flag</span>
                <span>{isEn ? 'Priority Level' : 'Mức độ ưu tiên'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(priorityConfig).map(([v, cfg]) => {
                  const isActive = createPriority === v;
                  return (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setCreatePriority(v)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 hover-lift ${
                        isActive
                          ? `${cfg.badgeClass} ring-2 ring-[#81B29A]/40 shadow-xs font-black`
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{cfg.icon}</span>
                      <span className="text-xs font-bold">{cfg.label}</span>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="priority" value={createPriority} />
            </div>
          </fieldset>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              disabled={busy}
              onClick={() => setCreating(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={busy || !member}
              className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 hover-lift"
            >
              {busy ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>{isEn ? 'Submit & Receive' : 'Lưu & Tiếp Nhận Ngay'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>}
    </div>
  );
}
