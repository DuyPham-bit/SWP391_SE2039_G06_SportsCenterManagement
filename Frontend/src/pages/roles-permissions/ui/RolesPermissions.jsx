import React, { useEffect, useState, useMemo } from 'react';
import { systemApi, SYSTEM_CAPABILITIES } from '../../../entities/permission/index.js';
import { staffApi } from '../../../entities/staff/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { Badge } from '../../../shared/ui/StatCard.jsx';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';

// Predefined module categories for organization
const CAPABILITY_CATEGORIES = [
  'VẬN HÀNH & NHÂN SỰ',
  'NGHIỆP VỤ LỄ TÂN',
  'HUẤN LUYỆN VIÊN',
  'GIÁO ÁN & CHUYÊN MÔN',
  'HỘI VIÊN & ĐẶT CHỖ',
  'BÁO CÁO & BẢO MẬT'
];

const getCategoryLabel = (category, isEn) => {
  const map = {
    'VẬN HÀNH & NHÂN SỰ': isEn ? 'OPERATIONS & STAFF' : 'VẬN HÀNH & NHÂN SỰ',
    'NGHIỆP VỤ LỄ TÂN': isEn ? 'RECEPTION & FRONT DESK' : 'NGHIỆP VỤ LỄ TÂN',
    'HUẤN LUYỆN VIÊN': isEn ? 'COACH OPERATIONS' : 'HUẤN LUYỆN VIÊN',
    'GIÁO ÁN & CHUYÊN MÔN': isEn ? 'TRAINING PLANS & EXPERTISE' : 'GIÁO ÁN & CHUYÊN MÔN',
    'HỘI VIÊN & ĐẶT CHỖ': isEn ? 'MEMBERS & BOOKINGS' : 'HỘI VIÊN & ĐẶT CHỖ',
    'BÁO CÁO & BẢO MẬT': isEn ? 'REPORTS & SECURITY' : 'BÁO CÁO & BẢO MẬT'
  };
  return map[category] || category;
};

export function RolesPermissions() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { currentUser } = useAuth();
  const { showError, showSuccess, confirm } = useToast();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' | 'ROLES'

  // Data states
  const [matrix, setMatrix] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [userRows, setUserRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  // Role tab state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleCodes, setRoleCodes] = useState([]);
  const [roleCaps, setRoleCaps] = useState([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleCategoryFilter, setRoleCategoryFilter] = useState('ALL');

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userCaps, setUserCaps] = useState([]);
  const [userCodes, setUserCodes] = useState([]);

  const centerId = currentUser?.centerId || Number(import.meta.env.VITE_SPORTS_CENTER_ID) || null;
  const isAdmin = String(currentUser?.role || '').toUpperCase() === 'ADMIN';
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  // Load initial permissions and staff directory
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setLoadError('');
      try {
        const [matrixRows, staffData, permissionUsers] = await Promise.all([
          systemApi.getPermissions(),
          staffApi.getAll().catch(err => {
            console.warn('Could not load staff list:', err);
            return [];
          }),
          systemApi.getUserPermissions().catch(err => {
            console.warn('Could not load user permissions:', err);
            return [];
          })
        ]);

        if (!isMounted) return;

        setMatrix(matrixRows || []);
        setStaffList(staffData || []);
        setUserRows(permissionUsers || []);
        if (permissionUsers?.length) {
          setSelectedUserId(permissionUsers[0].userId);
          setUserCaps(permissionUsers[0].capabilityIds || []);
          setUserCodes(permissionUsers[0].permissionCodes || []);
        }

        // Default select first role (prefer Coach or first available)
        if (matrixRows && matrixRows.length > 0) {
          const coachRole = matrixRows.find(r => r.roleName?.toUpperCase() === 'COACH') || matrixRows[0];
          selectRole(coachRole);
        }

      } catch (e) {
        if (isMounted) setLoadError(e.message || (isEn ? 'Failed to load permissions matrix' : 'Lỗi khi tải dữ liệu phân quyền'));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [isEn]);

  // When a role is chosen in Tab 1
  const selectRole = (row) => {
    if (!row) return;
    setSelectedRoleId(row.roleId);
    setRoleCodes((row.permissions || []).map(p => p.code));
    setRoleCaps(row.capabilityIds || []);
  };

  const selectedRole = useMemo(() => {
    return matrix.find(r => String(r.roleId) === String(selectedRoleId)) || null;
  }, [matrix, selectedRoleId]);

  const selectedUser = useMemo(() => userRows.find(row => String(row.userId) === String(selectedUserId)) || null,
    [userRows, selectedUserId]);
  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLocaleLowerCase('vi');
    return userRows.filter(row => !query || `${row.fullName} ${row.roleName}`.toLocaleLowerCase('vi').includes(query));
  }, [userRows, userSearchQuery]);

  const selectUser = row => {
    setSelectedUserId(row.userId);
    setUserCaps(row.capabilityIds || []);
    setUserCodes(row.permissionCodes || []);
  };

  const refreshUsers = async preferredUserId => {
    const rows = await systemApi.getUserPermissions();
    setUserRows(rows);
    const selected = rows.find(row => String(row.userId) === String(preferredUserId)) || rows[0];
    if (selected) selectUser(selected);
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    setBusy(true);
    try {
      await systemApi.updateUserPermissions(selectedUser.userId, userCodes, userCaps);
      await refreshUsers(selectedUser.userId);
      showSuccess(isEn ? 'User permissions saved.' : `Đã lưu quyền riêng cho ${selectedUser.fullName}.`);
    } catch (error) { showError(error); } finally { setBusy(false); }
  };

  const resetUserPermissions = async () => {
    if (!selectedUser) return;
    setBusy(true);
    try {
      await systemApi.resetUserPermissions(selectedUser.userId);
      await refreshUsers(selectedUser.userId);
      showSuccess(isEn ? 'Role defaults restored.' : 'Đã khôi phục quyền mặc định theo vai trò.');
    } catch (error) { showError(error); } finally { setBusy(false); }
  };

  // Toggle role capability (Tab 1)
  const toggleRoleCap = (capId) => {
    setRoleCaps(prev => prev.includes(capId) ? prev.filter(c => c !== capId) : [...prev, capId]);
  };

  // Toggle role data permission (Tab 1)
  const toggleRoleCode = (code) => {
    setRoleCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  // Role Bulk Actions
  const handleSelectAllRoleCaps = () => {
    if (!selectedRole) return;
    const all = selectedRole.availableCapabilities || [];
    setRoleCaps([...all]);
  };

  const handleDeselectAllRoleCaps = () => {
    setRoleCaps([]);
  };

  const handleResetRoleDefaults = () => {
    if (!selectedRole) return;
    setRoleCaps([...(selectedRole.availableCapabilities || [])]);
    setRoleCodes((selectedRole.availablePermissions || []).map(p => p.code));
    showSuccess(isEn ? 'Restored default permissions. Click Save to apply.' : 'Đã chọn quyền mặc định. Bấm Lưu cấu hình để áp dụng.');
  };

  // Save Role Permissions to Backend (Tab 1)
  const handleSaveRole = async () => {
    if (!selectedRoleId) return;
    setBusy(true);
    try {
      await systemApi.updatePermissions(selectedRoleId, roleCodes, roleCaps);
      const rows = await systemApi.getPermissions();
      setMatrix(rows);
      const updated = rows.find(r => String(r.roleId) === String(selectedRoleId));
      if (updated) selectRole(updated);
      showSuccess(isEn
        ? `Successfully saved role permissions for ${selectedRole?.roleName || ''}!`
        : `Đã lưu cấu hình phân quyền cho vai trò ${selectedRole?.roleName || ''} thành công!`);
    } catch (e) {
      showError(e.message || (isEn ? 'Could not save role permissions.' : 'Không thể lưu phân quyền vai trò.'));
    } finally {
      setBusy(false);
    }
  };

  const syncAllUsersToRole = async () => {
    if (!selectedRole) return;
    const confirmed = await confirm({
      title: isEn ? 'Reset User Overrides' : 'Khôi phục quyền mặc định',
      message: isEn
        ? `Remove every individual exception for ${selectedRole.roleName} and apply the role defaults to all users?`
        : `Xóa toàn bộ quyền riêng của người dùng thuộc vai trò ${selectedRole.roleName} và đồng bộ tất cả theo quyền chung?`,
      confirmText: isEn ? 'Sync to Default' : 'Đồng bộ mặc định',
      cancelText: isEn ? 'Cancel' : 'Hủy bỏ',
      type: 'warning'
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const result = await systemApi.resetRoleUserOverrides(selectedRole.roleId);
      await refreshUsers(selectedUserId);
      showSuccess(isEn
        ? `Synchronized all users. ${result?.resetCount || 0} individual overrides removed.`
        : `Đã đồng bộ toàn bộ người dùng. Đã xóa ${result?.resetCount || 0} cấu hình riêng.`);
    } catch (error) { showError(error); } finally { setBusy(false); }
  };

  // Filtered capabilities for Tab 1
  const filteredRoleCaps = useMemo(() => {
    if (!selectedRole) return [];
    const available = selectedRole.availableCapabilities || [];
    const delegableIds = new Set(
      SYSTEM_CAPABILITIES
        .filter(c => isAdmin || c.defaultRole !== 'MANAGER')
        .map(c => c.id)
    );
    return available
      .filter(id => delegableIds.has(id))
      .map(id => SYSTEM_CAPABILITIES.find(c => c.id === id) || { id, label: id, desc: isEn ? 'System feature' : 'Chức năng hệ thống', category: 'KHÁC', icon: 'settings' })
      .filter(cap => {
        const matchesCategory = roleCategoryFilter === 'ALL' || cap.category === roleCategoryFilter;
        const q = roleSearchQuery.trim().toLowerCase();
        const matchesQuery = !q ||
          cap.label.toLowerCase().includes(q) ||
          (cap.desc || '').toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      });
  }, [selectedRole, roleCategoryFilter, roleSearchQuery, isAdmin, isEn]);

  // Filtered data permissions for Tab 1
  const filteredRoleCodes = useMemo(() => {
    if (!selectedRole) return [];
    const list = selectedRole.availablePermissions || selectedRole.permissions || [];
    const q = roleSearchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [selectedRole, roleSearchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-brand-sage-500/30 border-t-brand-sage-700 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-brand-navy-600 dark:text-brand-navy-400">
          {isEn ? 'Loading SCMS permissions...' : 'Đang tải phân quyền hệ thống SCMS...'}
        </p>
      </div>
    );
  }

  if (loadError) return <div role="alert" className="p-4 rounded-2xl bg-brand-danger-50 text-brand-danger-700 dark:bg-brand-danger-950/40 dark:text-brand-danger-400 border border-brand-danger-200 dark:border-brand-danger-800">{loadError}</div>;

  return (
    <div className="space-y-6 pb-16 animate-fade-slide-up">
      {/* Top Banner / Header - Olympic Multi-stop Gradient */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 lg:p-8 shadow-xl shadow-brand-teal-600/20 border border-white/30"
        style={{
          background: 'linear-gradient(108deg, #2D6A4F 0%, #24828F 25%, #3FAEB8 48%, #81B29A 70%, #E5A33C 88%, #E5A33C 100%)'
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/50 via-brand-sand-500/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/45 via-brand-sage-700/30 to-transparent blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-white/20 text-white uppercase backdrop-blur-md border border-white/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isManager ? (isEn ? 'Center Access Control' : 'Phân Quyền Trung Tâm') : (isEn ? 'System Admin' : 'Quản Trị Toàn Hệ Thống')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                {centerId ? `${isEn ? 'Facility' : 'Cơ sở'} #${centerId}` : (isEn ? 'Enterprise-wide' : 'Toàn hệ thống')}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-chivo text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              {isEn ? 'Role-Based Access Control (RBAC)' : 'Phân Quyền Theo Vai Trò'}
            </h1>
            <p className="text-sm text-white/95 mt-1 max-w-3xl leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Configure role capabilities, manage data permissions, and govern delegation across center staff.'
                : 'Thiết lập quyền truy cập theo vai trò và lưu cấu hình tại trung tâm an toàn theo chính sách Safe Delegation.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-white/20 p-3 rounded-2xl border border-white/30 backdrop-blur-md shadow-xs">
            <div className="text-center px-3">
              <div className="text-xl font-black text-white">{matrix.length}</div>
              <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">
                {isEn ? 'Roles' : 'Vai trò'}
              </div>
            </div>
            <div className="text-center px-3 border-l border-white/20">
              <div className="text-xl font-black text-white">{staffList.length}</div>
              <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">
                {isEn ? 'Staff' : 'Nhân sự'}
              </div>
            </div>
            <div className="text-center px-3 border-l border-white/20">
              <div className="text-xl font-black text-white">{SYSTEM_CAPABILITIES.length}</div>
              <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">
                {isEn ? 'Features' : 'Chức năng'}
              </div>
            </div>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/20">
          <MotionButton
            onClick={() => setActiveTab('USERS')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'USERS'
                ? 'bg-white text-brand-sage-900 shadow-lg shadow-black/15 font-black scale-102'
                : 'bg-white/20 text-white hover:bg-white/30 border border-white/20 backdrop-blur-md'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_check</span>
            {isEn ? `1. Individual Users (${userRows.length})` : `1. Theo Từng Người (${userRows.length})`}
          </MotionButton>
          <MotionButton
            onClick={() => setActiveTab('ROLES')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'ROLES'
                ? 'bg-white text-brand-sage-900 shadow-lg shadow-black/15 font-black scale-102'
                : 'bg-white/20 text-white hover:bg-white/30 border border-white/20 backdrop-blur-md'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            {isEn ? `2. Role Defaults (${matrix.length})` : `2. Quyền Nền Theo Vai Trò (${matrix.length})`}
          </MotionButton>
        </div>
      </section>

      {activeTab === 'USERS' && (
        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-5">
          <section className="min-w-0 bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 p-4 shadow-sm h-fit">
            <h2 className="font-bold text-brand-navy-900 dark:text-white">{isEn ? 'Select an account' : 'Chọn tài khoản'}</h2>
            <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1 mb-3">
              {isAdmin
                ? (isEn ? 'Admin can configure Managers and center staff; an account cannot edit itself.' : 'Admin có thể phân quyền cho Manager và nhân sự trung tâm; tài khoản không thể tự sửa quyền của chính mình.')
                : (isEn ? 'Managers are excluded and cannot edit themselves.' : 'Không liệt kê Manager; người quản lý không thể tự sửa quyền.')}
            </p>
            <input value={userSearchQuery} onChange={event => setUserSearchQuery(event.target.value)}
              placeholder={isEn ? 'Search name or role...' : 'Tìm theo tên hoặc vai trò...'}
              className="w-full px-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-xs mb-3" />
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredUsers.map(row => (
                <MotionButton key={row.userId} onClick={() => selectUser(row)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full text-left p-3 rounded-xl border transition ${String(row.userId) === String(selectedUserId)
                    ? 'border-brand-sage-700 bg-brand-sage-50/80 dark:bg-brand-sage-950/40 ring-2 ring-brand-sage-700/30 shadow-xs'
                    : 'border-brand-navy-200 dark:border-brand-navy-800 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-brand-navy-900 dark:text-white truncate">{row.fullName}</span>
                    {row.hasCustomOverride && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-sand-100 text-brand-sand-800">{isEn ? 'CUSTOM' : 'RIÊNG'}</span>}
                  </div>
                  <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-1">{row.roleName} · {row.status}</div>
                </MotionButton>
              ))}
              {!filteredUsers.length && <div className="p-6 text-center text-xs text-brand-navy-400">{isEn ? 'No account found.' : 'Không tìm thấy tài khoản.'}</div>}
            </div>
          </section>

          <section className="min-w-0 bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 p-5 shadow-sm">
            {!selectedUser ? <div className="py-16 text-center text-brand-navy-400">{isEn ? 'Select an account to configure.' : 'Chọn một tài khoản để cấu hình quyền.'}</div> : <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-brand-navy-100 dark:border-brand-navy-800">
                <div>
                  <h2 className="text-lg font-black text-brand-navy-900 dark:text-white">{selectedUser.fullName}</h2>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{selectedUser.roleName} · {isEn ? 'individual access configuration' : 'cấu hình quyền riêng theo tài khoản'}</p>
                </div>
                <MotionButton disabled={busy || !selectedUser.hasCustomOverride} onClick={resetUserPermissions}
                  className="px-3 py-2 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-xs font-bold disabled:opacity-40">
                  {isEn ? 'Use role defaults' : 'Dùng quyền mặc định vai trò'}
                </MotionButton>
              </div>

              <div className="mt-5">
                <h3 className="font-bold text-sm text-brand-navy-900 dark:text-white mb-3">{isEn ? 'Business features' : 'Chức năng nghiệp vụ'}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {(selectedUser.availableCapabilities || []).map(id => {
                    const cap = SYSTEM_CAPABILITIES.find(item => item.id === id);
                    if (!cap) return null;
                    const checked = userCaps.includes(id);
                    return <label key={id} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${checked ? 'border-brand-sage-700/50 bg-brand-sage-50/60 dark:bg-brand-sage-950/20' : 'border-brand-navy-200 dark:border-brand-navy-800'}`}>
                      <input type="checkbox" checked={checked} onChange={() => setUserCaps(values => checked ? values.filter(value => value !== id) : [...values, id])} className="mt-1 accent-brand-sage-700" />
                      <span><strong className="block text-xs text-brand-navy-900 dark:text-white">{cap.label}</strong><span className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">{cap.desc}</span></span>
                    </label>;
                  })}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-brand-navy-100 dark:border-brand-navy-800">
                <h3 className="font-bold text-sm text-brand-navy-900 dark:text-white mb-3">{isEn ? 'Data access' : 'Phạm vi dữ liệu'}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {(selectedUser.availablePermissions || []).map(permission => {
                    const checked = userCodes.includes(permission.code);
                    return <label key={permission.code} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${checked ? 'border-brand-navy-400 bg-brand-navy-50 dark:bg-brand-navy-800' : 'border-brand-navy-200 dark:border-brand-navy-800'}`}>
                      <input type="checkbox" checked={checked} onChange={() => setUserCodes(values => checked ? values.filter(value => value !== permission.code) : [...values, permission.code])} className="mt-1" />
                      <span><strong className="block text-xs text-brand-navy-900 dark:text-white">{permission.name}</strong><span className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">{permission.description}</span></span>
                    </label>;
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800 flex justify-end">
                <MotionButton disabled={busy} onClick={saveUserPermissions} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-sage-700 to-brand-teal-600 hover:from-brand-sage-700 hover:to-brand-teal-700 text-white text-xs font-bold shadow-md shadow-brand-sage-700/20 disabled:opacity-50 transition-all">
                  {busy ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save individual permissions' : 'Lưu quyền cho tài khoản này')}
                </MotionButton>
              </div>
            </>}
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PHÂN QUYỀN THEO TỪNG VAI TRÒ (ROLE-BASED PERMISSIONS)              */}
      {/* ========================================================================= */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-teal-200 dark:border-brand-teal-900 bg-brand-teal-50/70 dark:bg-brand-teal-950/20 p-4 flex gap-3">
            <span className="material-symbols-outlined text-brand-teal-700 dark:text-brand-teal-300">groups</span>
            <div>
              <h2 className="font-bold text-sm text-brand-teal-950 dark:text-brand-teal-100">{isEn ? 'Change once, apply to the whole role' : 'Sửa một lần, áp dụng chung cho cả vai trò'}</h2>
              <p className="text-xs text-brand-teal-800 dark:text-brand-teal-200 mt-1">{isEn
                ? 'Role defaults affect every account. Existing individual exceptions remain restricted; use Sync all users when everyone must be identical.'
                : 'Quyền nền áp dụng cho mọi tài khoản. Các ngoại lệ cá nhân đang có vẫn được giữ; dùng “Đồng bộ tất cả” khi muốn mọi người giống hoàn toàn quyền chung.'}</p>
            </div>
          </div>
          {/* Role Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-navy-500 dark:text-brand-navy-400">
                {isEn ? 'Step 1: Select role to configure permissions' : 'Bước 1: Chọn vai trò muốn cấu hình phân quyền'}
              </h2>
              <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                {isEn ? 'Currently configuring:' : 'Đang cấu hình:'}{' '}
                <strong className="text-brand-navy-800 dark:text-white font-bold">{selectedRole?.roleName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {matrix.map(role => {
                const isSelected = String(role.roleId) === String(selectedRoleId);
                const roleUpper = String(role.roleName).toUpperCase();

                // Assign theme details based on role
                let roleColor = 'border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700 bg-white dark:bg-brand-navy-900';
                let icon = 'badge';
                let roleDesc = isEn ? 'Base system permissions' : 'Quyền hạn cơ sở';
                let badgeVariant = 'info';

                if (roleUpper === 'COACH') {
                  icon = 'sports';
                  roleDesc = isEn
                    ? 'Coach in charge of training sessions, attendance & sport syllabus.'
                    : 'Huấn luyện viên phụ trách ca dạy, điểm danh & soạn giáo án thể thao.';
                  badgeVariant = 'COACH';
                  if (isSelected) roleColor = 'border-brand-sand-300 ring-2 ring-brand-sand-300/30 bg-brand-sand-300/10 dark:bg-brand-sand-300/5';
                } else if (roleUpper === 'RECEPTIONIST') {
                  icon = 'countertops';
                  roleDesc = isEn
                    ? 'Receptionist welcoming guests, looking up members, cashiering & check-in.'
                    : 'Nhân viên lễ tân đón tiếp, tra cứu hội viên, thu ngân & quét thẻ check-in.';
                  badgeVariant = 'RECEPTIONIST';
                  if (isSelected) roleColor = 'border-brand-navy-700 ring-2 ring-brand-navy-700/20 bg-brand-navy-50/60 dark:bg-brand-navy-950/20';
                } else if (roleUpper === 'MEMBER') {
                  icon = 'card_membership';
                  roleDesc = isEn
                    ? 'Center member: booking classes, tracking workout progress.'
                    : 'Hội viên trung tâm: tự đặt chỗ lớp học, theo dõi tiến độ tập luyện.';
                  badgeVariant = 'MEMBER';
                  if (isSelected) roleColor = 'border-brand-sage-700 ring-2 ring-brand-sage-700/30 bg-brand-sage-700/10 dark:bg-brand-sage-700/5';
                } else {
                  icon = 'admin_panel_settings';
                  roleDesc = isEn
                    ? 'Administrator & management overseeing all sports center operations.'
                    : 'Quản trị viên & ban quản lý trung tâm điều hành mọi hoạt động.';
                  badgeVariant = 'MANAGER';
                  if (isSelected) roleColor = 'border-brand-navy-900 dark:border-brand-sage-500 ring-2 ring-brand-navy-900/30 dark:ring-brand-sage-500/30 bg-brand-navy-50 dark:bg-brand-navy-800/50';
                }

                // Count staff assigned to this role
                const staffCount = staffList.filter(s => String(s.role).toUpperCase() === roleUpper).length;

                return (
                  <div
                    key={role.roleId}
                    onClick={() => selectRole(role)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-sm relative hover-lift ${roleColor}`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-sage-700 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-sage-700"></span>
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center text-brand-navy-800 dark:text-brand-navy-200">
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-navy-900 dark:text-white text-base">{role.roleName}</h3>
                        <Badge variant={badgeVariant} size="sm">{role.roleName}</Badge>
                      </div>
                    </div>

                    <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 leading-snug line-clamp-2 my-2 min-h-[32px]">
                      {roleDesc}
                    </p>

                    <div className="mt-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-[11px] text-brand-navy-600 dark:text-brand-navy-400">
                      <span>{isEn ? 'Assigned Staff:' : 'Nhân sự áp dụng:'}</span>
                      <span className="font-bold text-brand-navy-800 dark:text-white">{staffCount} {isEn ? 'staff' : 'người'}</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-brand-navy-600 dark:text-brand-navy-400">
                      <span>{isEn ? 'Enabled Features:' : 'Chức năng mở:'}</span>
                      <span className="font-bold text-brand-sage-700 dark:text-brand-sage-500">
                        {(role.capabilityIds || []).length} / {(role.availableCapabilities || []).length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Inspector & Permissions Toggle Area */}
          {selectedRole ? (
            <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 space-y-6">
              {/* Header of Inspector */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-navy-100 dark:border-brand-navy-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-brand-navy-900 dark:text-white">
                      {isEn ? 'Configure Permissions for Role:' : 'Cấu hình quyền cho vai trò:'}{' '}
                      <span className="text-brand-sage-700 dark:text-brand-sage-500">{selectedRole.roleName}</span>
                    </h3>
                    <Badge variant={selectedRole.roleName.toUpperCase()} size="sm">{selectedRole.roleName}</Badge>
                  </div>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
                    {isEn
                      ? 'Enable/disable business features and data operations granted by default to all users with this role.'
                      : 'Bật/tắt các quyền chức năng và quyền dữ liệu mà mọi người mang vai trò này sẽ được cấp mặc định.'}
                  </p>
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <MotionButton
                    onClick={handleSelectAllRoleCaps}
                    className="px-3 py-1.5 text-xs font-semibold bg-brand-sage-50 dark:bg-brand-sage-950/30 text-brand-sage-700 dark:text-brand-sage-400 hover:bg-brand-sage-100 dark:hover:bg-brand-sage-950/50 border border-brand-sage-200 dark:border-brand-sage-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">select_all</span>
                    {isEn ? 'Select All' : 'Chọn tất cả'}
                  </MotionButton>
                  <MotionButton
                    onClick={handleDeselectAllRoleCaps}
                    className="px-3 py-1.5 text-xs font-semibold bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 border border-brand-navy-200 dark:border-brand-navy-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">deselect</span>
                    {isEn ? 'Deselect All' : 'Bỏ chọn tất cả'}
                  </MotionButton>
                  <MotionButton
                    onClick={handleResetRoleDefaults}
                    className="px-3 py-1.5 text-xs font-semibold bg-brand-sand-50 dark:bg-brand-sand-950/30 text-brand-sand-700 dark:text-brand-sand-400 hover:bg-brand-sand-100 dark:hover:bg-brand-sand-950/50 border border-brand-sand-200 dark:border-brand-sand-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">restore</span>
                    {isEn ? 'Reset Default' : 'Chuẩn mặc định'}
                  </MotionButton>
                </div>
              </div>

              {/* Search & Filter within Role Permissions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-brand-navy-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={roleSearchQuery}
                    onChange={e => setRoleSearchQuery(e.target.value)}
                    placeholder={isEn ? 'Search features by name or description...' : 'Tìm chức năng theo tên hoặc mô tả...'}
                    className="w-full pl-9 pr-4 py-2 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white placeholder-brand-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-sage-700"
                  />
                  {roleSearchQuery && (
                    <MotionButton
                      onClick={() => setRoleSearchQuery('')}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-3 top-2.5 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200 text-xs"
                    >
                      ✕
                    </MotionButton>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={roleCategoryFilter}
                    onChange={e => setRoleCategoryFilter(e.target.value)}
                    className="border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-700 font-medium"
                  >
                    <option value="ALL">
                      {isEn ? `All Categories (${filteredRoleCaps.length})` : `Tất cả danh mục (${filteredRoleCaps.length})`}
                    </option>
                    {CAPABILITY_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 1: Business Capabilities (Chức năng nghiệp vụ & Màn hình) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[20px]">layers</span>
                    <h4 className="font-bold text-brand-navy-900 dark:text-white text-sm uppercase tracking-wider">
                      {isEn
                        ? `1. Business Features & Screens (${roleCaps.length}/${(selectedRole.availableCapabilities || []).length})`
                        : `1. Chức năng nghiệp vụ & Màn hình truy cập (${roleCaps.length}/${(selectedRole.availableCapabilities || []).length})`}
                    </h4>
                  </div>
                  <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                    {isEn
                      ? `Within safe scope of role ${selectedRole.roleName}`
                      : `Chỉ cấp trong phạm vi an toàn của vai trò ${selectedRole.roleName}`}
                  </span>
                </div>

                {filteredRoleCaps.length === 0 ? (
                  <div className="p-8 text-center bg-brand-navy-50 dark:bg-brand-navy-800/40 rounded-xl border border-dashed border-brand-navy-200 dark:border-brand-navy-800 text-brand-navy-500 dark:text-brand-navy-400 text-xs">
                    {isEn
                      ? `No features matched "${roleSearchQuery}".`
                      : `Không tìm thấy chức năng phù hợp với từ khóa "${roleSearchQuery}".`}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredRoleCaps.map(cap => {
                      const isChecked = roleCaps.includes(cap.id);
                      return (
                        <div
                          key={cap.id}
                          onClick={() => toggleRoleCap(cap.id)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 select-none hover-lift ${
                            isChecked
                              ? 'bg-brand-sage-700/10 dark:bg-brand-sage-700/20 border-brand-sage-700/40 dark:border-brand-sage-700/50 ring-1 ring-brand-sage-700/30'
                              : 'bg-white dark:bg-brand-navy-800/50 border-brand-navy-200 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="mt-1 h-4 w-4 rounded text-brand-sage-700 dark:text-brand-sage-400 focus:ring-brand-sage-700 border-brand-navy-300 dark:border-brand-navy-700 cursor-pointer accent-brand-sage-700"
                          />

                          <div className="w-8 h-8 rounded-lg bg-brand-navy-100 dark:bg-brand-navy-800 flex items-center justify-center text-brand-navy-700 dark:text-brand-navy-300 flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[18px]">{cap.icon || 'star'}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-bold text-xs text-brand-navy-900 dark:text-white leading-tight">
                                {cap.label}
                              </h5>
                            </div>
                            <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-1 leading-snug">
                              {cap.desc}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-brand-navy-400 dark:text-brand-navy-500">
                                {cap.category}
                              </span>
                              {isChecked ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-sage-700 dark:text-brand-sage-500">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  {isEn ? 'Enabled' : 'Đang bật'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand-navy-400 dark:text-brand-navy-500">
                                  <span className="material-symbols-outlined text-[12px]">block</span>
                                  {isEn ? 'Disabled' : 'Đang khóa'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Data Permissions (Quyền dữ liệu backend) */}
              <div className="space-y-4 pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-navy-900 dark:text-brand-sage-500 text-[20px]">database</span>
                    <h4 className="font-bold text-brand-navy-900 dark:text-white text-sm uppercase tracking-wider">
                      {isEn
                        ? `2. Data Access Scope (${roleCodes.length}/${(selectedRole.availablePermissions || []).length})`
                        : `2. Phạm Vi Truy Cập Dữ Liệu (${roleCodes.length}/${(selectedRole.availablePermissions || []).length})`}
                    </h4>
                  </div>
                  <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                    {isEn ? 'Data access available to this role' : 'Dữ liệu mà vai trò này được phép truy cập'}
                  </span>
                </div>

                {filteredRoleCodes.length === 0 ? (
                  <div className="p-6 text-center bg-brand-navy-50 dark:bg-brand-navy-800/40 rounded-xl border border-dashed border-brand-navy-200 dark:border-brand-navy-800 text-brand-navy-500 dark:text-brand-navy-400 text-xs">
                    {isEn ? 'No specific data permissions found.' : 'Không có quyền dữ liệu đặc thù hoặc chưa tìm thấy kết quả.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRoleCodes.map(p => {
                      const isChecked = roleCodes.includes(p.code);
                      return (
                        <div
                          key={p.code}
                          onClick={() => toggleRoleCode(p.code)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-3 select-none hover-lift ${
                            isChecked
                              ? 'bg-brand-navy-100 dark:bg-brand-navy-800 border-brand-navy-400 dark:border-brand-navy-600 ring-1 ring-brand-navy-400/20'
                              : 'bg-white dark:bg-brand-navy-800/50 border-brand-navy-200 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 h-4 w-4 rounded text-brand-navy-900 dark:text-brand-sage-500 focus:ring-brand-navy-900 border-brand-navy-300 dark:border-brand-navy-700 cursor-pointer accent-brand-navy-900"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-brand-navy-900 dark:text-white">{p.name}</span>
                            <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-1 line-clamp-2">
                              {p.description || (isEn ? 'System data operation capability' : 'Quyền thao tác dữ liệu hệ thống')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Bar */}
              <div className="pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[18px]">info</span>
                  <span>
                    {isEn
                      ? 'Permissions apply immediately from the next request; UI refreshes on next reload.'
                      : 'Quyền áp dụng từ request tiếp theo; giao diện người dùng cập nhật khi đăng nhập lại hoặc reload.'}
                  </span>
                </div>

                <div className="w-full sm:w-auto flex flex-wrap gap-2">
                  <MotionButton disabled={busy} onClick={syncAllUsersToRole}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-brand-sand-300 dark:border-brand-sand-800 text-brand-sand-800 dark:text-brand-sand-300 font-bold rounded-xl text-xs disabled:opacity-50">
                    {isEn ? 'Sync all users to role' : 'Đồng bộ tất cả theo vai trò'}
                  </MotionButton>
                <MotionButton
                  disabled={busy}
                  onClick={handleSaveRole}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-brand-sage-700 to-brand-teal-600 hover:from-brand-sage-700 hover:to-brand-teal-700 text-white font-bold rounded-xl shadow-md shadow-brand-sage-700/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isEn ? 'Saving role matrix...' : 'Đang lưu ma trận vai trò...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>
                        {isEn
                          ? `Save Role Permissions [${selectedRole.roleName}]`
                          : `Lưu Phân Quyền Vai Trò [${selectedRole.roleName}]`}
                      </span>
                    </>
                  )}
                </MotionButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800">
              <span className="material-symbols-outlined text-brand-navy-400 text-[48px] mb-2">lock_open</span>
              <p className="text-sm font-semibold text-brand-navy-600 dark:text-brand-navy-300">
                {isEn ? 'Please select a role above to begin configuration.' : 'Vui lòng chọn một vai trò ở trên để bắt đầu cấu hình.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
