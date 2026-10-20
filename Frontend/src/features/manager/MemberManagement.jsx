import React, { useEffect, useState, useMemo, useRef } from 'react';
import { memberApi, receptionApi } from '../../services/api.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMemberDate, formatMemberDateTime } from '../member/memberOverview.js';
import {
  buildMemberUpdatePayload,
  getSubscriptionPresentation,
  normalizeSubscriptionHistory,
  formatMembershipPrice,
  formatMembershipDuration
} from './memberManagementView.js';

// Color palette gradients for member initials
const AVATAR_GRADIENTS = [
  'from-[#2D6A4F] to-[#1B4332]',
  'from-[#1E2235] to-[#2B2D42]',
  'from-teal-600 to-emerald-800',
  'from-amber-600 to-amber-700',
  'from-indigo-600 to-slate-800',
  'from-cyan-600 to-blue-700',
  'from-rose-600 to-rose-800'
];

function getAvatarGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name = '') {
  if (!name) return 'HV';
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'HV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function calculateDaysLeft(expiryStr) {
  if (!expiryStr) return null;
  const expiry = new Date(`${String(expiryStr).slice(0, 10)}T23:59:59+07:00`);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition-all';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5';
const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);

export function MemberManagement() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState({ query: '', page: 1 });
  const [data, setData] = useState({ items: [], totalCount: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  // Active filter tab & sorting
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Modals & detail drawer
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');
  const subscriptionRequest = useRef(0);
  const [copiedCode, setCopiedCode] = useState(null);

  // Fetch members
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    memberApi
      .getCenterMembers(filter.query, filter.page)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter, revision]);

  // Derived KPI statistics
  const stats = useMemo(() => {
    const items = data.items || [];
    const activeCount = items.filter((m) => m.accountStatus === 'Active').length;
    const packageCount = items.filter((m) => m.packageStatus === 'ACTIVE').length;
    const disabledCount = items.filter((m) => m.accountStatus !== 'Active').length;
    return {
      total: data.totalCount || items.length,
      active: activeCount,
      hasPackage: packageCount,
      disabled: disabledCount
    };
  }, [data]);

  // Client-side filtering & sorting for smooth UX
  const filteredAndSortedItems = useMemo(() => {
    let list = [...(data.items || [])];

    if (statusFilter === 'ACTIVE') {
      list = list.filter((m) => m.accountStatus === 'Active');
    } else if (statusFilter === 'DISABLED') {
      list = list.filter((m) => m.accountStatus !== 'Active');
    } else if (statusFilter === 'HAS_PACKAGE') {
      list = list.filter((m) => m.packageStatus === 'ACTIVE');
    } else if (statusFilter === 'NO_PACKAGE') {
      list = list.filter((m) => !m.packageName || m.packageStatus !== 'ACTIVE');
    }

    if (sortBy === 'NAME_ASC') {
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'vi'));
    } else if (sortBy === 'NAME_DESC') {
      list.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || '', 'vi'));
    } else if (sortBy === 'EXPIRY') {
      list.sort((a, b) => (a.packageExpiry || '9999').localeCompare(b.packageExpiry || '9999'));
    }

    return list;
  }, [data.items, statusFilter, sortBy]);

  // Copy member code to clipboard
  const copyMemberCode = (code, e) => {
    e?.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    showSuccess(isEn ? `Copied member ID: ${code}` : `Đã sao chép mã hội viên: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Modal open handlers
  const openEdit = (row, e) => {
    e?.stopPropagation();
    setForm(
      row
        ? {
            fullName: row.fullName || '',
            email: row.email || '',
            phone: row.phone || '',
            dateOfBirth: row.dateOfBirth || '',
            gender: row.gender || '',
            address: row.address || ''
          }
        : {
            username: '',
            fullName: '',
            email: '',
            password: '',
            phone: '',
            dateOfBirth: '',
            gender: '',
            address: ''
          }
    );
    setModal({ type: 'edit', row });
  };

  const openDetail = (row) => {
    setModal({ type: 'detail', row });
  };

  const openStatusConfirm = (row, e) => {
    e?.stopPropagation();
    setModal({ type: 'status', row });
  };

  const openSubscriptions = async (row, e) => {
    e?.stopPropagation();
    const requestId = ++subscriptionRequest.current;
    setModal({ type: 'subscriptions', row });
    setSubscriptions([]);
    setSubscriptionError('');
    setLoadingSubs(true);
    try {
      const subs = await receptionApi.getMemberSubscriptions(row.memberId);
      if (subscriptionRequest.current === requestId) {
        setSubscriptions(normalizeSubscriptionHistory(Array.isArray(subs) ? subs : subs?.items || []));
      }
    } catch (err) {
      if (subscriptionRequest.current === requestId) {
        setSubscriptionError(err.message || (isEn ? 'Cannot load subscription history' : 'Không thể tải lịch sử gói tập'));
      }
    } finally {
      if (subscriptionRequest.current === requestId) setLoadingSubs(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (modal.row) {
        await memberApi.updateAtCenter(modal.row.memberId, buildMemberUpdatePayload(form));
        showSuccess(isEn ? 'Member profile updated successfully!' : 'Cập nhật hồ sơ thành viên thành công!');
      } else {
        await receptionApi.createMember({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          phone: form.phone?.trim() || null,
          dateOfBirth: form.dateOfBirth || null
        });
        showSuccess(isEn ? 'New member registered successfully!' : 'Đã thêm thành viên mới thành công!');
      }
      setModal(null);
      setRevision((x) => x + 1);
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleAccountStatus = async () => {
    if (!modal?.row) return;
    setBusy(true);
    try {
      const newStatus = modal.row.accountStatus === 'Active' ? 'Disabled' : 'Active';
      await memberApi.setAccountStatus(modal.row.memberId, newStatus);
      showSuccess(
        newStatus === 'Active'
          ? isEn
            ? 'Member account activated successfully.'
            : 'Đã mở khóa tài khoản thành viên.'
          : isEn
          ? 'Member account locked.'
          : 'Đã tạm khóa tài khoản thành viên.'
      );
      setModal(null);
      setRevision((x) => x + 1);
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length === 1) {
      showError(isEn ? 'Please enter at least 2 characters to search.' : 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm.');
      return;
    }
    setFilter({ query: query.trim(), page: 1 });
  };

  const handleResetSearch = () => {
    setQuery('');
    setStatusFilter('ALL');
    setSortBy('DEFAULT');
    setFilter({ query: '', page: 1 });
  };

  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 -mb-16 h-48 w-48 rounded-full bg-[#F2CC8F]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2CC8F]/20 backdrop-blur-md text-[#F2CC8F] text-xs font-black uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[14px]">sports_handball</span>
              {isEn ? 'Member Operations' : 'Quản trị thành viên SCMS'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white">
              {isEn ? 'Member Management' : 'Quản lý thành viên'}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {isEn
                ? 'Track member profiles, account statuses, subscription packages, and center-wide athletic privileges.'
                : 'Theo dõi hồ sơ hội viên, trạng thái tài khoản, lịch sử gói tập và quyền lợi thể thao toàn trung tâm.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRevision((x) => x + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 transition-all hover-lift disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
            <button
              onClick={() => openEdit(null)}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#2D6A4F]/30 transition-all hover-lift"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>{isEn ? 'Add Member' : 'Thêm thành viên mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bento KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Total Members' : 'Tổng thành viên'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-slate-900 dark:text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">{isEn ? 'members' : 'hội viên'}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Registered profiles in center' : 'Toàn bộ hồ sơ trong cơ sở'}
          </p>
        </div>

        {/* Active Accounts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Active Accounts' : 'Đang hoạt động'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-emerald-600 dark:text-emerald-400">{stats.active}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              {stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}%` : '100%'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Verified & ready to train' : 'Tài khoản hợp lệ và sẵn sàng'}
          </p>
        </div>

        {/* Active Packages */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Active Subscriptions' : 'Gói tập hiệu lực'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">card_membership</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-[#2D6A4F] dark:text-[#81B29A]">{stats.hasPackage}</span>
            <span className="text-xs text-slate-400 font-medium">{isEn ? 'active' : 'gói active'}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Eligible for check-in & booking' : 'Đủ điều kiện check-in và đặt lớp'}
          </p>
        </div>

        {/* Locked Accounts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Locked Accounts' : 'Tài khoản bị khóa'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-rose-600 dark:text-rose-400">{stats.disabled}</span>
            <span className="text-xs text-slate-400 font-medium">{isEn ? 'suspended' : 'tạm dừng'}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Requires review to unlock' : 'Cần xác minh mở khóa'}
          </p>
        </div>
      </div>

      {/* 3. Search Bar & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              aria-label={isEn ? 'Search members' : 'Tìm thành viên'}
              placeholder={isEn ? 'Search by name, ID (MEM-...), email, phone...' : 'Tìm kiếm theo họ tên, mã thẻ (MEM-...), email, số điện thoại...'}
              maxLength={100}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-20 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-[#1E2235] hover:bg-[#2B2D42] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isEn ? 'Search' : 'Tìm'}
            </button>
          </form>

          {/* Quick Actions & Sorting */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="material-symbols-outlined text-[16px] text-slate-400">sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="DEFAULT" className="dark:bg-slate-800">{isEn ? 'Sort: Default' : 'Sắp xếp: Mặc định'}</option>
                <option value="NAME_ASC" className="dark:bg-slate-800">{isEn ? 'Name: A → Z' : 'Họ tên: A → Z'}</option>
                <option value="NAME_DESC" className="dark:bg-slate-800">{isEn ? 'Name: Z → A' : 'Họ tên: Z → A'}</option>
                <option value="EXPIRY" className="dark:bg-slate-800">{isEn ? 'Expiring soonest' : 'Hạn gói gần nhất'}</option>
              </select>
            </div>

            {(filter.query || statusFilter !== 'ALL' || sortBy !== 'DEFAULT') && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span className="hidden sm:inline">{isEn ? 'Reset' : 'Đặt lại'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#1E2235] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isEn ? 'All' : 'Tất cả'} ({data.items?.length || 0})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              {isEn ? 'Active' : 'Đang hoạt động'}
            </button>
            <button
              onClick={() => setStatusFilter('HAS_PACKAGE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'HAS_PACKAGE'
                  ? 'bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20'
                  : 'bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#81B29A] hover:bg-[#2D6A4F]/20'
              }`}
            >
              {isEn ? 'Has Package' : 'Có gói tập'}
            </button>
            <button
              onClick={() => setStatusFilter('NO_PACKAGE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'NO_PACKAGE'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
            >
              {isEn ? 'No Package / Expired' : 'Chưa có / Hết hạn'}
            </button>
            <button
              onClick={() => setStatusFilter('DISABLED')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'DISABLED'
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60'
              }`}
            >
              {isEn ? 'Locked' : 'Đã khóa'}
            </button>
          </div>

          <div className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400">
            {isEn ? 'Showing' : 'Hiển thị'} <span className="font-bold text-slate-800 dark:text-slate-200">{filteredAndSortedItems.length}</span> / {data.totalCount} {isEn ? 'members' : 'hội viên'}
          </div>
        </div>
      </div>

      {/* 4. Table & Loading/Error states */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12">
          <LoadingSpinner text={isEn ? 'Loading member directory...' : 'Đang tải danh sách thành viên...'} />
        </div>
      ) : error ? (
        <div role="alert" className="p-6 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/60 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
          <p className="text-sm font-bold text-rose-800 dark:text-rose-300">{error}</p>
          <button
            onClick={() => setRevision((x) => x + 1)}
            className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-chivo text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-5 font-bold whitespace-nowrap">{isEn ? 'Member' : 'Thành viên'}</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">{isEn ? 'Contact' : 'Liên hệ'}</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">{isEn ? 'Account' : 'Tài khoản'}</th>
                  <th className="py-3.5 px-4 font-bold whitespace-nowrap">{isEn ? 'Package & Expiry' : 'Gói tập & Hạn dùng'}</th>
                  <th className="py-3.5 px-4 font-bold text-center whitespace-nowrap">{isEn ? 'Actions' : 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                {filteredAndSortedItems.length > 0 ? (
                  filteredAndSortedItems.map((r) => {
                    const daysRemaining = calculateDaysLeft(r.packageExpiry);
                    const isPackageActive = r.packageStatus === 'ACTIVE';
                    const isAccountActive = r.accountStatus === 'Active';

                    return (
                      <tr
                        key={r.memberId}
                        onClick={() => openDetail(r)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* Member Column */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                r.fullName
                              )} flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0`}
                            >
                              {getInitials(r.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition-colors whitespace-nowrap">
                                  {r.fullName}
                                </span>
                                {r.gender && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 whitespace-nowrap">
                                    {r.gender === 'Male'
                                      ? isEn
                                        ? 'Male'
                                        : 'Nam'
                                      : r.gender === 'Female'
                                      ? isEn
                                        ? 'Female'
                                        : 'Nữ'
                                      : isEn
                                      ? 'Other'
                                      : 'Khác'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={(e) => copyMemberCode(r.memberCode, e)}
                                  className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-1.5 py-0.5 rounded transition-colors"
                                  title={isEn ? 'Click to copy ID' : 'Nhấn để sao chép mã'}
                                >
                                  <span>{r.memberCode}</span>
                                  <span className="material-symbols-outlined text-[12px] text-slate-400">
                                    {copiedCode === r.memberCode ? 'check' : 'content_copy'}
                                  </span>
                                </button>
                                <span>·</span>
                                <span className="text-slate-400">@{r.username}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                              <span className="truncate max-w-[200px]">{r.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                              {r.phone ? (
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{r.phone}</span>
                              ) : (
                                <span className="text-slate-400 italic">{isEn ? 'No phone' : 'Chưa có điện thoại'}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Account Status Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isAccountActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {isEn ? 'Active' : 'Hoạt động'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <span className="material-symbols-outlined text-[13px]">lock</span>
                              {isEn ? 'Locked' : 'Đã khóa'}
                            </span>
                          )}
                        </td>

                        {/* Package Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {r.packageName ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">
                                  fitness_center
                                </span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{r.packageName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isPackageActive
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                      : r.packageStatus === 'CANCELLED'
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  }`}
                                >
                                  {r.packageStatus || 'ACTIVE'}
                                </span>
                                {r.packageExpiry && (
                                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                    {isEn ? 'Exp:' : 'Hạn:'} <strong className="text-slate-700 dark:text-slate-300">{formatMemberDate(r.packageExpiry)}</strong>
                                    {daysRemaining !== null && isPackageActive && (
                                      <span className={`ml-1 font-semibold ${daysRemaining <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
                                        ({daysRemaining > 0 ? (isEn ? `${daysRemaining}d left` : `còn ${daysRemaining} ngày`) : isEn ? 'expires today' : 'hết hạn hôm nay'})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400 italic">
                              <span className="material-symbols-outlined text-[14px]">remove_circle_outline</span>
                              {isEn ? 'No active package' : 'Chưa có gói tập'}
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetail(r)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={isEn ? 'View member details' : 'Xem chi tiết hồ sơ'}
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openEdit(r, e)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                              title={isEn ? 'Edit information' : 'Chỉnh sửa thông tin'}
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              <span>{isEn ? 'Edit' : 'Sửa'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openSubscriptions(r, e)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                              title={isEn ? 'View subscription history' : 'Xem toàn bộ lịch sử gói tập'}
                            >
                              <span className="material-symbols-outlined text-[15px]">history</span>
                              <span>{isEn ? 'History' : 'Lịch sử gói'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openStatusConfirm(r, e)}
                              disabled={busy}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap ${
                                isAccountActive
                                  ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                              }`}
                              title={isAccountActive ? (isEn ? 'Lock account' : 'Tạm khóa tài khoản') : isEn ? 'Unlock account' : 'Mở khóa tài khoản'}
                            >
                              <span className="material-symbols-outlined text-[15px]">{isAccountActive ? 'lock' : 'lock_open'}</span>
                              <span>{isAccountActive ? (isEn ? 'Lock' : 'Khóa') : isEn ? 'Unlock' : 'Mở khóa'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-3xl">person_search</span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                            {isEn ? 'No members found' : 'Không tìm thấy thành viên nào'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {filter.query
                              ? isEn
                                ? `No results match "${filter.query}"`
                                : `Không có kết quả nào khớp với "${filter.query}"`
                              : isEn
                              ? 'Member directory is currently empty.'
                              : 'Danh sách thành viên hiện đang trống.'}
                          </p>
                        </div>
                        {(filter.query || statusFilter !== 'ALL') && (
                          <button
                            onClick={handleResetSearch}
                            className="mt-2 px-4 py-2 bg-[#1E2235] text-white rounded-xl text-xs font-bold hover:bg-[#2B2D42] transition-colors shadow-sm"
                          >
                            {isEn ? 'Clear filters & show all' : 'Xóa bộ lọc & Xem tất cả'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              {isEn ? 'Showing' : 'Hiển thị'}{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{(filter.page - 1) * data.pageSize + 1}</span> -{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(filter.page * data.pageSize, data.totalCount)}</span>{' '}
              {isEn ? 'of' : 'trên tổng số'}{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{data.totalCount}</span> {isEn ? 'members' : 'thành viên'}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={filter.page <= 1 || loading}
                onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>{isEn ? 'Previous' : 'Trước'}</span>
              </button>

              <span className="px-3 py-1.5 font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                {isEn ? `Page ${filter.page} / ${totalPages}` : `Trang ${filter.page} / ${totalPages}`}
              </span>

              <button
                disabled={filter.page >= totalPages || loading}
                onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span>{isEn ? 'Next' : 'Sau'}</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Edit / Add Member */}
      <Modal
        isOpen={modal?.type === 'edit'}
        onClose={() => !busy && setModal(null)}
        title={
          modal?.row
            ? isEn
              ? `Update Profile · ${modal.row.fullName}`
              : `Cập nhật hồ sơ · ${modal.row.fullName}`
            : isEn
            ? 'Add New Member'
            : 'Thêm thành viên mới'
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveMember} className="space-y-4">
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[18px] flex-shrink-0 mt-0.5">info</span>
            <span>
              {modal?.row
                ? isEn
                  ? 'Updated information will be saved directly to the database and synchronized with the user account.'
                  : 'Thông tin cập nhật sẽ được lưu trực tiếp vào cơ sở dữ liệu của trung tâm và đồng bộ đến tài khoản người dùng.'
                : isEn
                ? 'New members will receive an automatic member code (MEM-...) and can log in immediately after creation.'
                : 'Thành viên mới sẽ được cấp mã hội viên tự động (MEM-...) và có thể đăng nhập ngay sau khi tạo.'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!modal?.row && (
              <>
                <div>
                  <label className={labelClass}>{isEn ? 'Username *' : 'Tên đăng nhập *'}</label>
                  <input
                    className={inputClass}
                    name="username"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder={isEn ? 'e.g. johndoe' : 'ví dụ: nguyenvana'}
                    pattern="[a-zA-Z0-9._-]+"
                    value={form.username || ''}
                    onChange={handleFormChange}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isEn ? 'Letters, numbers, dots or underscores only.' : 'Chỉ gồm chữ cái, số, dấu chấm hoặc gạch dưới.'}
                  </span>
                </div>
                <div>
                  <label className={labelClass}>{isEn ? 'Initial Password *' : 'Mật khẩu ban đầu *'}</label>
                  <input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    name="password"
                    required
                    minLength={6}
                    maxLength={128}
                    placeholder={isEn ? 'Minimum 6 characters' : 'Tối thiểu 6 ký tự'}
                    value={form.password || ''}
                    onChange={handleFormChange}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isEn ? 'Recommend letters, numbers and special characters.' : 'Khuyến nghị kết hợp chữ, số và ký tự đặc biệt.'}
                  </span>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>{isEn ? 'Full Name *' : 'Họ và tên đầy đủ *'}</label>
              <input
                className={inputClass}
                name="fullName"
                required
                maxLength={150}
                placeholder={isEn ? 'e.g. John Doe' : 'ví dụ: Nguyễn Văn A'}
                value={form.fullName || ''}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Contact Email *' : 'Email liên hệ *'}</label>
              <input
                className={inputClass}
                name="email"
                type="email"
                readOnly={Boolean(modal?.row)}
                required
                maxLength={150}
                placeholder="email@domain.com"
                value={form.email || ''}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Phone Number' : 'Số điện thoại'}</label>
              <input
                className={inputClass}
                name="phone"
                type="tel"
                maxLength={20}
                placeholder={isEn ? 'e.g. 0912345678' : 'ví dụ: 0912345678'}
                value={form.phone || ''}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Date of Birth' : 'Ngày sinh'}</label>
              <input
                className={inputClass}
                name="dateOfBirth"
                type="date"
                required={Boolean(modal?.row?.dateOfBirth)}
                max={today()}
                value={form.dateOfBirth || ''}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Gender' : 'Giới tính'}</label>
              <select className={inputClass} name="gender" value={form.gender || ''} onChange={handleFormChange}>
                <option value="">{isEn ? '-- Not specified --' : '-- Chưa cung cấp --'}</option>
                <option value="Male">{isEn ? 'Male' : 'Nam'}</option>
                <option value="Female">{isEn ? 'Female' : 'Nữ'}</option>
                <option value="Other">{isEn ? 'Other' : 'Khác'}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>{isEn ? 'Residential Address' : 'Địa chỉ liên lạc'}</label>
              <input
                className={inputClass}
                name="address"
                maxLength={255}
                placeholder={isEn ? 'House number, street, ward, city...' : 'Số nhà, tên đường, phường/xã, quận/huyện...'}
                value={form.address || ''}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setModal(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#2D6A4F]/30 transition-all disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{modal?.row ? (isEn ? 'Save Changes' : 'Lưu thay đổi') : isEn ? 'Create Member' : 'Tạo thành viên'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: View member details */}
      <Modal
        isOpen={modal?.type === 'detail'}
        onClose={() => setModal(null)}
        title={isEn ? 'Member Profile Details' : 'Hồ sơ chi tiết thành viên'}
        maxWidth="max-w-2xl"
      >
        {modal?.row && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                  modal.row.fullName
                )} flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0`}
              >
                {getInitials(modal.row.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{modal.row.fullName}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      modal.row.accountStatus === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {modal.row.accountStatus === 'Active' ? (isEn ? 'Active' : 'Hoạt động') : isEn ? 'Locked' : 'Đã khóa'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {modal.row.memberCode}
                  </span>
                  <span>Username: @{modal.row.username}</span>
                  <span>
                    {isEn ? 'Joined:' : 'Ngày tham gia:'} {formatMemberDate(modal.row.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">badge</span>
                  {isEn ? 'Personal Information' : 'Thông tin cá nhân'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Gender:' : 'Giới tính:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {modal.row.gender === 'Male'
                        ? isEn
                          ? 'Male'
                          : 'Nam'
                        : modal.row.gender === 'Female'
                        ? isEn
                          ? 'Female'
                          : 'Nữ'
                        : modal.row.gender || (isEn ? 'Not specified' : 'Chưa cung cấp')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Date of birth:' : 'Ngày sinh:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatMemberDate(modal.row.dateOfBirth)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Address:' : 'Địa chỉ:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {modal.row.address || (isEn ? 'Not specified' : 'Chưa cung cấp')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">contact_phone</span>
                  {isEn ? 'Contact Info' : 'Thông tin liên hệ'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Email:</span>
                    <a href={`mailto:${modal.row.email}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      {modal.row.email}
                    </a>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Phone:' : 'Số điện thoại:'}</span>
                    {modal.row.phone ? (
                      <a href={`tel:${modal.row.phone}`} className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#2D6A4F]">
                        {modal.row.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">{isEn ? 'None' : 'Chưa có'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Package Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#1E2235] to-[#242A42] text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F2CC8F]">fitness_center</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {isEn ? 'Current Subscription' : 'Gói tập hiện tại'}
                  </span>
                </div>
                {modal.row.packageStatus && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#2D6A4F] text-white">
                    {modal.row.packageStatus}
                  </span>
                )}
              </div>
              <div>
                <p className="text-lg font-black text-white">
                  {modal.row.packageName || (isEn ? 'No active package registered' : 'Chưa đăng ký gói tập nào')}
                </p>
                {modal.row.packageExpiry && (
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                    <span>
                      {isEn ? 'Valid until:' : 'Hiệu lực đến:'} <strong className="text-white">{formatMemberDate(modal.row.packageExpiry)}</strong>
                    </span>
                    {modal.row.packageStartDate && <span>({isEn ? 'Started:' : 'Bắt đầu:'} {formatMemberDate(modal.row.packageStartDate)})</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Modal actions footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                onClick={() => openSubscriptions(modal.row)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>{isEn ? 'Package History' : 'Lịch sử gói tập'}</span>
              </button>
              <button
                type="button"
                onClick={() => openEdit(modal.row)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>{isEn ? 'Edit Profile' : 'Sửa thông tin'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. Modal: Subscription history */}
      <Modal
        isOpen={modal?.type === 'subscriptions'}
        onClose={() => !busy && setModal(null)}
        title={modal?.row ? (isEn ? `Subscription History · ${modal.row.fullName}` : `Lịch sử gói tập · ${modal.row.fullName}`) : isEn ? 'Subscription History' : 'Lịch sử gói tập'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'Total subscriptions purchased:' : 'Tổng số gói từng đăng ký:'}{' '}
              <strong className="text-slate-800 dark:text-slate-200">{subscriptions.length}</strong>
            </div>
            {modal?.row && (
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {modal.row.memberCode}
              </span>
            )}
          </div>

          {loadingSubs ? (
            <LoadingSpinner text={isEn ? 'Loading subscription history...' : 'Đang tải lịch sử đăng ký...'} />
          ) : subscriptionError ? (
            <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm text-rose-800 dark:text-rose-300">
              <p>{subscriptionError}</p>
              <button type="button" className="mt-2 font-bold underline" onClick={() => openSubscriptions(modal.row)}>
                {isEn ? 'Retry' : 'Thử lại'}
              </button>
            </div>
          ) : subscriptions.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {subscriptions.map((s) => {
                const status = getSubscriptionPresentation(s.status);
                return (
                  <article
                    key={s.subscriptionId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[18px]">workspace_premium</span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.packageName || (isEn ? 'Unnamed Package' : 'Gói chưa có tên')}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatMembershipPrice(s.price)}</span>
                      <span>·</span>
                      <span>
                        {isEn ? 'Duration:' : 'Thời hạn:'} <strong>{formatMembershipDuration(s.durationDays)}</strong>
                      </span>
                      <span>·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {isEn ? 'Valid:' : 'Hiệu lực:'} {s.startDate ? formatMemberDate(s.startDate) : isEn ? 'Not activated' : 'Chưa kích hoạt'} –{' '}
                        {s.endDate ? formatMemberDate(s.endDate) : isEn ? 'None' : 'Chưa có'}
                      </span>
                    </div>

                    {s.createdAt && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        {isEn ? 'Created at:' : 'Ngày tạo giao dịch:'} {formatMemberDateTime(s.createdAt)}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{isEn ? 'No subscription records found' : 'Chưa có lịch sử đăng ký gói nào'}</p>
              <p className="text-xs text-slate-400">{isEn ? 'This member has not purchased any packages yet.' : 'Hội viên chưa mua gói tập tại trung tâm hoặc trực tuyến.'}</p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="px-5 py-2 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] text-white text-xs font-bold transition-colors shadow-sm"
            >
              {isEn ? 'Close' : 'Đóng'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 8. Modal: Lock / Unlock account */}
      <Modal
        isOpen={modal?.type === 'status'}
        onClose={() => !busy && setModal(null)}
        title={isEn ? 'Confirm Account Status Change' : 'Xác nhận trạng thái tài khoản'}
        maxWidth="max-w-md"
      >
        {modal?.row && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                modal.row.accountStatus === 'Active'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <span className="material-symbols-outlined text-[24px] flex-shrink-0">
                {modal.row.accountStatus === 'Active' ? 'warning' : 'lock_open'}
              </span>
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">
                  {modal.row.accountStatus === 'Active'
                    ? isEn
                      ? `Lock account of "${modal.row.fullName}"?`
                      : `Khóa tài khoản của "${modal.row.fullName}"?`
                    : isEn
                    ? `Unlock account of "${modal.row.fullName}"?`
                    : `Mở khóa tài khoản của "${modal.row.fullName}"?`}
                </p>
                <p className="leading-relaxed">
                  {modal.row.accountStatus === 'Active'
                    ? isEn
                      ? 'When locked, the member cannot log in, book class sessions, or check-in to sports facilities.'
                      : 'Khi bị khóa, thành viên sẽ không thể đăng nhập hệ thống, không thể đặt lịch lớp học hoặc check-in vào trung tâm.'
                    : isEn
                    ? 'When unlocked, the member will regain login access, class booking, and athletic check-in privileges.'
                    : 'Khi mở khóa, thành viên sẽ khôi phục quyền đăng nhập, đặt lịch và sử dụng dịch vụ trung tâm bình thường.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isEn ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleToggleAccountStatus}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  modal.row.accountStatus === 'Active'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-[#2D6A4F] hover:bg-[#1B4332] shadow-[#2D6A4F]/30'
                }`}
              >
                {busy
                  ? isEn
                    ? 'Updating...'
                    : 'Đang cập nhật...'
                  : modal.row.accountStatus === 'Active'
                  ? isEn
                    ? 'Confirm Lock'
                    : 'Xác nhận khóa'
                  : isEn
                  ? 'Confirm Unlock'
                  : 'Xác nhận mở khóa'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
