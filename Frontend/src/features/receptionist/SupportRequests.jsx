import React, { useEffect, useState, useMemo } from 'react';
import { receptionApi } from '../../services/api.js';
import { Modal } from '../../components/common/Modal.jsx';
import { formatMemberDateTime } from '../member/memberOverview.js';
import { counterButton, counterInput, CounterError, CounterMemberPicker } from './ReceptionistShared.jsx';

const STATUS_CONFIG = {
  Open: {
    label: 'Mới tiếp nhận',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    dotClass: 'bg-sky-500',
    icon: 'mark_email_unread',
    borderClass: 'border-l-sky-500'
  },
  InProgress: {
    label: 'Đang xử lý',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    icon: 'pending_actions',
    borderClass: 'border-l-amber-500'
  },
  Resolved: {
    label: 'Đã giải quyết',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    icon: 'check_circle',
    borderClass: 'border-l-emerald-500'
  }
};

const PRIORITY_CONFIG = {
  Low: {
    label: 'Thấp',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: 'low_priority',
    stripeClass: 'border-l-slate-300'
  },
  Normal: {
    label: 'Bình thường',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'schedule',
    stripeClass: 'border-l-blue-400'
  },
  High: {
    label: 'Ưu tiên Cao',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 font-bold',
    icon: 'emergency',
    stripeClass: 'border-l-red-500'
  }
};

const TOPIC_PRESETS = [
  { prefix: '[Gói tập & Thẻ] ', label: '🎫 Gói tập & Thẻ', hint: 'Gia hạn, đổi gói, thắc mắc quyền lợi thẻ' },
  { prefix: '[Lịch học & Đặt chỗ] ', label: '📅 Lịch học & Đặt chỗ', hint: 'Đổi ca, chuyển lớp, bảo lưu buổi tập' },
  { prefix: '[Cơ sở vật chất] ', label: '🏟️ Thiết bị & Sân bãi', hint: 'Báo lỗi tủ locker, máy tập, điều hòa' },
  { prefix: '[HLV & Chuyên môn] ', label: '🥊 Huấn luyện viên', hint: 'Phản ánh buổi dạy hoặc giáo án PT' },
  { prefix: '[Dịch vụ tại quầy] ', label: '💬 Dịch vụ & Thu ngân', hint: 'Hóa đơn, thanh toán, thủ tục tại quầy' }
];

const QUICK_NOTES = [
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

export function SupportRequests() {
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

    receptionApi.getSupportRequests(filter)
      .then(result => {
        if (!active) return;
        setData(result);
        // If we don't have a detail selected yet, or detail is no longer in results, auto-select first on wide screen
        if (result?.items?.length > 0 && !detail && window.innerWidth >= 1024) {
          open(result.items[0].id);
        }
      })
      .catch(e => {
        if (active) setError(e.message || 'Không thể tải danh sách yêu cầu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
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
      setDetailError(e.message || 'Không thể tải chi tiết yêu cầu.');
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
      setCreateError('Vui lòng chọn thành viên cần hỗ trợ.');
      return;
    }
    if (!createSubject.trim()) {
      setCreateError('Vui lòng nhập tiêu đề yêu cầu.');
      return;
    }
    if (!createDescription.trim()) {
      setCreateError('Vui lòng nhập nội dung chi tiết yêu cầu.');
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
      setSuccess(`Đã ghi nhận yêu cầu #${result.request.id} thành công!`);
      setFilter(f => ({ query: '', status: '', page: 1, version: f.version + 1 }));
    } catch (e) {
      setCreateError(e.message || 'Không thể tạo yêu cầu.');
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
        note: note.trim() || (overrideStatus === 'Resolved' ? 'Đã xử lý và đóng yêu cầu.' : null)
      });
      selectDetail(result);
      setSuccess('Đã lưu cập nhật xử lý thành công.');
      reload();
    } catch (e) {
      setDetailError(e.message || 'Không thể lưu xử lý.');
    } finally {
      setBusy(false);
    }
  };

  // Filter items in memory by priority if specified
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    if (!priorityFilter) return data.items;
    return data.items.filter(item => item.priority === priorityFilter);
  }, [data, priorityFilter]);

  // Statistics calculation
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
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-chivo text-xs uppercase tracking-widest text-red-500 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              QUẦY LỄ TÂN & CHĂM SÓC KHÁCH HÀNG
            </span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[28px] text-red-500">support_agent</span>
            Yêu Cầu Hỗ Trợ & Khiếu Nại
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Tiếp nhận, phân loại và theo dõi tiến độ xử lý các thắc mắc, sự cố của hội viên và huấn luyện viên tại trung tâm.
          </p>
        </div>

        <button
          className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold font-chivo uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
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
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          <span>Tiếp Nhận Yêu Cầu Mới</span>
        </button>
      </div>

      {/* Quick KPI Stat Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* All requests card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            status === ''
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-red-500/50'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-80">
            <span>Tất cả yêu cầu</span>
            <span className="material-symbols-outlined text-[18px]">all_inbox</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">
            {stats.total}
          </div>
        </button>

        {/* Open requests card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('Open')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            status === 'Open'
              ? 'bg-sky-700 text-white border-sky-700 shadow-md ring-2 ring-sky-400'
              : 'bg-sky-50/70 text-sky-900 border-sky-200 hover:border-sky-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              Mới tiếp nhận
            </span>
            <span className="material-symbols-outlined text-[18px]">mark_email_unread</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">
            {stats.open}
          </div>
        </button>

        {/* In progress card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('InProgress')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            status === 'InProgress'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
              : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span>Đang xử lý</span>
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">
            {stats.inProgress}
          </div>
        </button>

        {/* Resolved card */}
        <button
          type="button"
          onClick={() => handleStatusFilterChange('Resolved')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            status === 'Resolved'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-90">
            <span>Đã giải quyết</span>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div className="font-chivo text-2xl font-black mt-2">
            {stats.resolved}
          </div>
        </button>
      </div>

      {/* Global Alerts */}
      <CounterError message={error} retry={reload} />
      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
            <span className="font-semibold">{success}</span>
          </div>
          <button type="button" onClick={() => setSuccess('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Main Workspace: Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets Master List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search & Filter Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  className={`${counterInput} pl-10 pr-9`}
                  aria-label="Tìm yêu cầu hỗ trợ"
                  maxLength={200}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Tiêu đề, mã hoặc tên thành viên..."
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setFilter(f => ({ ...f, query: '', page: 1, version: f.version + 1 })); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Status Pills and Priority Filter */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleStatusFilterChange('')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      status === '' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                    <button
                      type="button"
                      key={k}
                      onClick={() => handleStatusFilterChange(k)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        status === k ? `${cfg.badgeClass} ring-1 ring-slate-400/40 shadow-xs font-black` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                      <span>{cfg.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-500"
                    aria-label="Lọc mức ưu tiên"
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                  >
                    <option value="">Tất cả ưu tiên</option>
                    {Object.entries(PRIORITY_CONFIG).map(([v, cfg]) => (
                      <option key={v} value={v}>Ưu tiên {cfg.label}</option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
                    disabled={loading || busy}
                  >
                    Lọc
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div role="status" className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <span className="material-symbols-outlined text-red-600 text-[28px] animate-spin">
                progress_activity
              </span>
              <p className="text-xs font-semibold text-slate-600">Đang tải danh sách yêu cầu...</p>
            </div>
          )}

          {/* Tickets List */}
          {data && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold">
                  Danh sách yêu cầu ({filteredItems.length}/{data.totalCount})
                </span>
                {(query || status || priorityFilter) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
                {filteredItems.map(r => {
                  const isSelected = detail?.request?.id === r.id;
                  const statusInfo = STATUS_CONFIG[r.status] || STATUS_CONFIG.Open;
                  const priorityInfo = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG.Normal;
                  const { topic, cleanSubject } = extractTopic(r.subject);

                  return (
                    <article
                      key={r.id}
                      onClick={() => open(r.id)}
                      className={`p-4 transition-all cursor-pointer relative border-l-4 ${priorityInfo.stripeClass} ${
                        isSelected
                          ? 'bg-red-50/40 ring-1 ring-inset ring-red-500/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Top Row: ID, Topic Tag, Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            #{r.id}
                          </span>
                          {topic && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100 truncate max-w-[150px]">
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
                      <h2 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                        {cleanSubject}
                      </h2>

                      {/* Requester Info */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(r.requesterName || r.memberName || 'M').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 truncate">
                          {r.requesterName || r.memberName}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-500 shrink-0">
                          {r.requesterRole === 'COACH' ? 'HLV' : r.memberCode}
                        </span>
                      </div>

                      {/* Footer Row: Priority & Timestamp */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100/80 text-[11px]">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] border ${priorityInfo.badgeClass}`}>
                          <span className="material-symbols-outlined text-[12px]">{priorityInfo.icon}</span>
                          Ưu tiên {priorityInfo.label}
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
                    <span className="material-symbols-outlined text-slate-300 text-[40px]">
                      inbox
                    </span>
                    <p className="text-sm font-semibold text-slate-600">Không tìm thấy yêu cầu phù hợp.</p>
                    <p className="text-xs text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc trạng thái phía trên.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">
                  Tổng số: <strong className="text-slate-800">{data.totalCount}</strong> · Trang {filter.page} / {Math.max(1, Math.ceil(data.totalCount / 20))}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                    disabled={busy || filter.page === 1}
                    onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
                  >
                    <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                    Trang trước
                  </button>
                  <button
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                    disabled={busy || filter.page * 20 >= data.totalCount}
                    onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
                  >
                    Trang sau
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
              aria-label="Chi tiết yêu cầu hỗ trợ"
              className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-20 space-y-0"
            >
              {/* Detail Header Strip */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 text-white">
                      #{detail.request.id}
                    </span>
                    {extractTopic(detail.request.subject).topic && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                        {extractTopic(detail.request.subject).topic}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[detail.request.status]?.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[detail.request.status]?.dotClass}`} />
                      {STATUS_CONFIG[detail.request.status]?.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${PRIORITY_CONFIG[detail.request.priority]?.badgeClass}`}>
                      <span className="material-symbols-outlined text-[13px]">{PRIORITY_CONFIG[detail.request.priority]?.icon}</span>
                      Ưu tiên {PRIORITY_CONFIG[detail.request.priority]?.label}
                    </span>
                  </div>

                  <h2 className="font-chivo font-black text-lg md:text-xl text-slate-900 break-words leading-tight">
                    {extractTopic(detail.request.subject).cleanSubject}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => open(detail.request.id)}
                    title="Tải lại chi tiết"
                    disabled={busy}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[20px] ${busy ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    title="Đóng chi tiết"
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>

              {/* Requester Mini-Profile & Time Bar */}
              <div className="px-5 py-3.5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {(detail.request.requesterName || detail.request.memberName || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 text-sm">
                        {detail.request.requesterName || detail.request.memberName}
                      </strong>
                      <span className="font-mono px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-semibold text-[11px]">
                        {detail.request.requesterRole === 'COACH' ? 'Huấn luyện viên' : detail.request.memberCode}
                      </span>
                    </div>
                    {detail.request.memberCode && (
                      <a
                        href={`#/receptionist/members?query=${encodeURIComponent(detail.request.memberCode)}`}
                        className="text-red-600 hover:underline inline-flex items-center gap-0.5 mt-0.5 font-semibold"
                      >
                        <span>Hồ sơ & Gói tập</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_outward</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-right text-slate-500 space-y-0.5">
                  <p>Gửi lúc: <strong className="text-slate-700">{formatMemberDateTime(detail.request.createdAt)}</strong></p>
                  {detail.request.resolvedAt && (
                    <p className="text-emerald-700 font-medium flex items-center justify-end gap-1">
                      <span className="material-symbols-outlined text-[14px]">task_alt</span>
                      Giải quyết: {formatMemberDateTime(detail.request.resolvedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 space-y-6">
                {/* Description Card */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">description</span>
                    <span>Nội dung yêu cầu từ thành viên</span>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 text-slate-800 text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {detail.description || 'Không có mô tả chi tiết.'}
                  </div>
                </div>

                {/* Timeline / Resolution History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <span className="material-symbols-outlined text-[16px] text-slate-400">history</span>
                      <span>Lịch sử xử lý & Ghi chú ({detail.messages?.length || 0})</span>
                    </div>
                    {detail.messages?.length > 0 && (
                      <span className="text-[11px] text-slate-400">Ghi chú gần nhất ở dưới cùng</span>
                    )}
                  </div>

                  {(!detail.messages || detail.messages.length === 0) ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      Chưa có ghi chú xử lý nào. Hãy cập nhật tiến độ bên dưới khi liên hệ hoặc hỗ trợ thành viên.
                    </div>
                  ) : (
                    <div className="space-y-3 pl-2">
                      {detail.messages.map((m, idx) => (
                        <div key={m.id || idx} className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-transparent">
                          <span className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-slate-900 border-2 border-white shadow-xs" />
                          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-slate-500">account_circle</span>
                                {m.senderName || 'Lễ tân trực'}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                {formatMemberDateTime(m.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-normal">
                              {m.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Processing Form */}
                <form onSubmit={e => update(e)} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-red-600">edit_note</span>
                      Cập nhật xử lý yêu cầu
                    </span>
                    {busy && (
                      <span className="text-xs text-slate-500 flex items-center gap-1" role="status">
                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        Đang lưu...
                      </span>
                    )}
                  </div>

                  <fieldset disabled={busy} className="space-y-4">
                    {/* Status Segmented Buttons */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Trạng thái xử lý
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(STATUS_CONFIG).map(([v, cfg]) => {
                          const isActive = nextStatus === v;
                          return (
                            <button
                              type="button"
                              key={v}
                              onClick={() => setNextStatus(v)}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                                isActive
                                  ? `${cfg.badgeClass} ring-2 ring-red-500/40 shadow-xs font-black`
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">{cfg.icon}</span>
                              <span className="text-xs font-bold">{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Accessible Select fallback for screen readers & form submission */}
                      <select
                        aria-label="Trạng thái xử lý"
                        className="sr-only"
                        value={nextStatus}
                        onChange={e => setNextStatus(e.target.value)}
                      >
                        {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                          <option key={v} value={v}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Response Templates */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span className="font-semibold">Mẫu phản hồi nhanh</span>
                        <span className="text-[11px] text-slate-400">Bấm để điền vào ghi chú</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_NOTES.map((qn, i) => (
                          <button
                            type="button"
                            key={i}
                            onClick={() => setNote(prev => prev ? `${prev}\n${qn}` : qn)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer text-left truncate max-w-full"
                          >
                            + {qn}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Note Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Ghi chú xử lý</span>
                        <span className="text-slate-400 font-normal text-[11px]">{note.length}/5000 ký tự</span>
                      </label>
                      <textarea
                        aria-label="Ghi chú xử lý"
                        rows={3}
                        maxLength={5000}
                        className={`${counterInput} font-normal resize-y min-h-[80px]`}
                        placeholder="Nhập chi tiết xử lý, kết quả hỗ trợ hoặc thông tin trao đổi với thành viên..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                      />
                    </div>
                  </fieldset>

                  {/* Submit Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                    {detail.request.status !== 'Resolved' && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={e => update(e, 'Resolved')}
                        className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">task_alt</span>
                        <span>Hoàn tất & Đã giải quyết</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={busy}
                      className="ml-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {busy ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          <span>Đang lưu xử lý...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">save</span>
                          <span>Lưu Xử Lý</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center space-y-3 sticky top-20">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[32px]">touch_app</span>
              </div>
              <h3 className="font-chivo font-black text-lg text-slate-800">
                Chọn một yêu cầu để xem chi tiết
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Nhấp vào bất kỳ yêu cầu nào ở danh sách bên trái để đọc nội dung đầy đủ, xem lịch sử trao đổi và cập nhật tiến độ xử lý cho hội viên.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreateError('');
                  setMember(null);
                  setCreateSubject('');
                  setCreateDescription('');
                  setCreatePriority('Normal');
                  setCreating(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Tạo yêu cầu mới
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tiếp nhận yêu cầu hỗ trợ mới */}
      <Modal
        isOpen={creating}
        onClose={() => { if (!busy) setCreating(false); }}
        title="Tiếp nhận yêu cầu hỗ trợ mới"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={create} className="space-y-5">
          {/* Step 1: Chọn thành viên */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-red-600">person</span>
              <span>1. Thành viên yêu cầu hỗ trợ *</span>
            </label>
            <CounterMemberPicker selected={member} onChange={setMember} disabled={busy} />
          </div>

          <CounterError message={createError} />

          <fieldset className="space-y-4 border-t border-slate-200 pt-4" disabled={busy}>
            {/* Step 2: Chọn chủ đề nhanh */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-red-600">category</span>
                  2. Chủ đề yêu cầu nhanh
                </span>
                <span className="text-[11px] text-slate-400">Bấm để tự động điền tiền tố tiêu đề</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TOPIC_PRESETS.map((t, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setCreateSubject(prev => {
                        const stripped = prev.replace(/^\[.*?\]\s*/, '');
                        return `${t.prefix}${stripped}`;
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-red-400 hover:bg-red-50 hover:text-red-700 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Tiêu đề */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Tiêu đề yêu cầu *
              </label>
              <input
                name="subject"
                required
                maxLength={200}
                className={counterInput}
                placeholder="Ví dụ: [Gói tập & Thẻ] Đề nghị gia hạn gói Basic thêm 1 tháng..."
                value={createSubject}
                onChange={e => setCreateSubject(e.target.value)}
              />
            </div>

            {/* Step 4: Nội dung */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Nội dung chi tiết yêu cầu *</span>
                <span className="text-[11px] text-slate-400 font-normal">{createDescription.length}/5000 ký tự</span>
              </label>
              <textarea
                name="description"
                required
                maxLength={5000}
                rows={4}
                className={`${counterInput} resize-y min-h-[90px]`}
                placeholder="Mô tả cụ thể sự cố, phản ánh hoặc nguyện vọng của thành viên..."
                value={createDescription}
                onChange={e => setCreateDescription(e.target.value)}
              />
            </div>

            {/* Step 5: Mức ưu tiên */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-red-600">flag</span>
                <span>Mức độ ưu tiên</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {Object.entries(PRIORITY_CONFIG).map(([v, cfg]) => {
                  const isActive = createPriority === v;
                  return (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setCreatePriority(v)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isActive
                          ? `${cfg.badgeClass} ring-2 ring-red-500/30 shadow-xs font-black`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={busy}
              onClick={() => setCreating(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={busy || !member}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-md shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              {busy ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Lưu & Tiếp Nhận Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
