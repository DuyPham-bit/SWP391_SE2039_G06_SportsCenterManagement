import { useState, useRef, useEffect, useMemo } from 'react';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { memberApi, receptionApi } from '../../../entities/member/index.js';
import { normalizeSubscriptionHistory, buildMemberUpdatePayload } from './memberManagementView.js';

export function useMemberManagement() {
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

  return {
    busy, copiedCode, copyMemberCode, data, error, filter, filteredAndSortedItems, form,
    handleFormChange, handleResetSearch, handleSaveMember, handleSearchSubmit,
    handleToggleAccountStatus, isEn, loading, loadingSubs, modal, openDetail, openEdit,
    openStatusConfirm, openSubscriptions, query, setFilter, setModal, setQuery, setRevision,
    setSortBy, setStatusFilter, sortBy, stats, statusFilter, subscriptionError, subscriptions,
    totalPages
  };
}
