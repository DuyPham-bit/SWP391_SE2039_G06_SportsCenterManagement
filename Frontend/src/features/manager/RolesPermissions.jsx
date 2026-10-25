import React, { useEffect, useState, useMemo } from 'react';
import { systemApi, staffApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { SYSTEM_CAPABILITIES } from '../../services/permissions.js';
import { Badge } from '../../components/common/StatCard.js';
import { MotionButton } from '../../components/common/MotionButton.jsx';

// Predefined module categories for organization
const CAPABILITY_CATEGORIES = [
  'VẬN HÀNH & NHÂN SỰ',
  'NGHIỆP VỤ LỄ TÂN',
  'HUẤN LUYỆN VIÊN',
  'GIÁO ÁN & CHUYÊN MÔN',
  'HỘI VIÊN & ĐẶT CHỖ',
  'BÁO CÁO & BẢO MẬT'
];

// Manager permissions are fixed by the server and are deliberately not part of
// the center-level delegation matrix. Only these staff/member roles can vary.
const DELEGABLE_CAPABILITY_IDS = new Set(
  SYSTEM_CAPABILITIES
    .filter(capability => capability.defaultRole !== 'MANAGER')
    .map(capability => capability.id)
);

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
  const { showError, showSuccess } = useToast();

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

  const centerId = currentUser?.centerId || Number(import.meta.env.VITE_SPORTS_CENTER_ID) || 15;
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
    const confirmed = window.confirm(isEn
      ? `Remove every individual exception for ${selectedRole.roleName} and apply the role defaults to all users?`
      : `Xóa toàn bộ quyền riêng của người dùng thuộc vai trò ${selectedRole.roleName} và đồng bộ tất cả theo quyền chung?`);
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
    return available
      .map(id => SYSTEM_CAPABILITIES.find(c => c.id === id) || { id, label: id, desc: isEn ? 'System feature' : 'Chức năng hệ thống', category: 'KHÁC', icon: 'settings' })
      .filter(cap => {
        const matchesCategory = roleCategoryFilter === 'ALL' || cap.category === roleCategoryFilter;
        const q = roleSearchQuery.trim().toLowerCase();
        const matchesQuery = !q ||
          cap.label.toLowerCase().includes(q) ||
          (cap.desc || '').toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      });
  }, [selectedRole, roleCategoryFilter, roleSearchQuery, isEn]);

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
        <div className="w-10 h-10 border-4 border-[#81B29A]/30 border-t-[#2D6A4F] rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {isEn ? 'Loading SCMS permissions...' : 'Đang tải phân quyền hệ thống SCMS...'}
        </p>
      </div>
    );
  }

  if (loadError) return <div role="alert" className="p-4 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">{loadError}</div>;

  return (
    <div className="space-y-6 pb-16 animate-fade-slide-up">
      {/* Top Banner / Header - Olympic Multi-stop Gradient */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 lg:p-8 shadow-xl shadow-[#24828F]/20 border border-white/30"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />

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
                ? 'bg-white text-[#1B4332] shadow-lg shadow-black/15 font-black scale-102'
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
                ? 'bg-white text-[#1B4332] shadow-lg shadow-black/15 font-black scale-102'
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
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm h-fit">
            <h2 className="font-bold text-slate-900 dark:text-white">{isEn ? 'Select an account' : 'Chọn tài khoản'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
              {isEn ? 'Managers are excluded and cannot edit themselves.' : 'Không liệt kê Manager; người quản lý không thể tự sửa quyền.'}
            </p>
            <input value={userSearchQuery} onChange={event => setUserSearchQuery(event.target.value)}
              placeholder={isEn ? 'Search name or role...' : 'Tìm theo tên hoặc vai trò...'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs mb-3" />
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredUsers.map(row => (
                <MotionButton key={row.userId} onClick={() => selectUser(row)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full text-left p-3 rounded-xl border transition ${String(row.userId) === String(selectedUserId)
                    ? 'border-[#2F7B5D] bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-[#2F7B5D]/30 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{row.fullName}</span>
                    {row.hasCustomOverride && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{isEn ? 'CUSTOM' : 'RIÊNG'}</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{row.roleName} · {row.status}</div>
                </MotionButton>
              ))}
              {!filteredUsers.length && <div className="p-6 text-center text-xs text-slate-400">{isEn ? 'No account found.' : 'Không tìm thấy tài khoản.'}</div>}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            {!selectedUser ? <div className="py-16 text-center text-slate-400">{isEn ? 'Select an account to configure.' : 'Chọn một tài khoản để cấu hình quyền.'}</div> : <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedUser.fullName}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.roleName} · {isEn ? 'individual access configuration' : 'cấu hình quyền riêng theo tài khoản'}</p>
                </div>
                <MotionButton disabled={busy || !selectedUser.hasCustomOverride} onClick={resetUserPermissions}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold disabled:opacity-40">
                  {isEn ? 'Use role defaults' : 'Dùng quyền mặc định vai trò'}
                </MotionButton>
              </div>

              <div className="mt-5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">{isEn ? 'Business features' : 'Chức năng nghiệp vụ'}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {(selectedUser.availableCapabilities || []).map(id => {
                    const cap = SYSTEM_CAPABILITIES.find(item => item.id === id);
                    if (!cap) return null;
                    const checked = userCaps.includes(id);
                    return <label key={id} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${checked ? 'border-[#2F7B5D]/50 bg-emerald-50/60 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
                      <input type="checkbox" checked={checked} onChange={() => setUserCaps(values => checked ? values.filter(value => value !== id) : [...values, id])} className="mt-1 accent-[#2F7B5D]" />
                      <span><strong className="block text-xs text-slate-900 dark:text-white">{cap.label}</strong><span className="text-[11px] text-slate-500 dark:text-slate-400">{cap.desc}</span></span>
                    </label>;
                  })}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">{isEn ? 'Data access' : 'Phạm vi dữ liệu'}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {(selectedUser.availablePermissions || []).map(permission => {
                    const checked = userCodes.includes(permission.code);
                    return <label key={permission.code} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${checked ? 'border-slate-400 bg-slate-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-800'}`}>
                      <input type="checkbox" checked={checked} onChange={() => setUserCodes(values => checked ? values.filter(value => value !== permission.code) : [...values, permission.code])} className="mt-1" />
                      <span><strong className="block text-xs text-slate-900 dark:text-white">{permission.name}</strong><span className="text-[11px] text-slate-500 dark:text-slate-400">{permission.description}</span></span>
                    </label>;
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <MotionButton disabled={busy} onClick={saveUserPermissions} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2F7B5D] to-[#24828F] hover:from-[#246A4F] hover:to-[#1B6F7A] text-white text-xs font-bold shadow-md shadow-[#2F7B5D]/20 disabled:opacity-50 transition-all">
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
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/20 p-4 flex gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-300">groups</span>
            <div>
              <h2 className="font-bold text-sm text-blue-950 dark:text-blue-100">{isEn ? 'Change once, apply to the whole role' : 'Sửa một lần, áp dụng chung cho cả vai trò'}</h2>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">{isEn
                ? 'Role defaults affect every account. Existing individual exceptions remain restricted; use Sync all users when everyone must be identical.'
                : 'Quyền nền áp dụng cho mọi tài khoản. Các ngoại lệ cá nhân đang có vẫn được giữ; dùng “Đồng bộ tất cả” khi muốn mọi người giống hoàn toàn quyền chung.'}</p>
            </div>
          </div>
          {/* Role Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isEn ? 'Step 1: Select role to configure permissions' : 'Bước 1: Chọn vai trò muốn cấu hình phân quyền'}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isEn ? 'Currently configuring:' : 'Đang cấu hình:'}{' '}
                <strong className="text-slate-800 dark:text-white font-bold">{selectedRole?.roleName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {matrix.map(role => {
                const isSelected = String(role.roleId) === String(selectedRoleId);
                const roleUpper = String(role.roleName).toUpperCase();

                // Assign theme details based on role
                let roleColor = 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900';
                let icon = 'badge';
                let roleDesc = isEn ? 'Base system permissions' : 'Quyền hạn cơ sở';
                let badgeVariant = 'info';

                if (roleUpper === 'COACH') {
                  icon = 'sports';
                  roleDesc = isEn
                    ? 'Coach in charge of training sessions, attendance & sport syllabus.'
                    : 'Huấn luyện viên phụ trách ca dạy, điểm danh & soạn giáo án thể thao.';
                  badgeVariant = 'COACH';
                  if (isSelected) roleColor = 'border-[#F2CC8F] ring-2 ring-[#F2CC8F]/30 bg-[#F2CC8F]/10 dark:bg-[#F2CC8F]/5';
                } else if (roleUpper === 'RECEPTIONIST') {
                  icon = 'countertops';
                  roleDesc = isEn
                    ? 'Receptionist welcoming guests, looking up members, cashiering & check-in.'
                    : 'Nhân viên lễ tân đón tiếp, tra cứu hội viên, thu ngân & quét thẻ check-in.';
                  badgeVariant = 'RECEPTIONIST';
                  if (isSelected) roleColor = 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/60 dark:bg-purple-950/20';
                } else if (roleUpper === 'MEMBER') {
                  icon = 'card_membership';
                  roleDesc = isEn
                    ? 'Center member: booking classes, tracking workout progress.'
                    : 'Hội viên trung tâm: tự đặt chỗ lớp học, theo dõi tiến độ tập luyện.';
                  badgeVariant = 'MEMBER';
                  if (isSelected) roleColor = 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/30 bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/5';
                } else {
                  icon = 'admin_panel_settings';
                  roleDesc = isEn
                    ? 'Administrator & management overseeing all sports center operations.'
                    : 'Quản trị viên & ban quản lý trung tâm điều hành mọi hoạt động.';
                  badgeVariant = 'MANAGER';
                  if (isSelected) roleColor = 'border-[#1E2235] dark:border-[#81B29A] ring-2 ring-[#1E2235]/30 dark:ring-[#81B29A]/30 bg-slate-50 dark:bg-slate-800/50';
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
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D6A4F] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2D6A4F]"></span>
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{role.roleName}</h3>
                        <Badge variant={badgeVariant} size="sm">{role.roleName}</Badge>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 my-2 min-h-[32px]">
                      {roleDesc}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>{isEn ? 'Assigned Staff:' : 'Nhân sự áp dụng:'}</span>
                      <span className="font-bold text-slate-800 dark:text-white">{staffCount} {isEn ? 'staff' : 'người'}</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                      <span>{isEn ? 'Enabled Features:' : 'Chức năng mở:'}</span>
                      <span className="font-bold text-[#2D6A4F] dark:text-[#81B29A]">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
              {/* Header of Inspector */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isEn ? 'Configure Permissions for Role:' : 'Cấu hình quyền cho vai trò:'}{' '}
                      <span className="text-[#2D6A4F] dark:text-[#81B29A]">{selectedRole.roleName}</span>
                    </h3>
                    <Badge variant={selectedRole.roleName.toUpperCase()} size="sm">{selectedRole.roleName}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isEn
                      ? 'Enable/disable business features and data operations granted by default to all users with this role.'
                      : 'Bật/tắt các quyền chức năng và quyền dữ liệu mà mọi người mang vai trò này sẽ được cấp mặc định.'}
                  </p>
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <MotionButton
                    onClick={handleSelectAllRoleCaps}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">select_all</span>
                    {isEn ? 'Select All' : 'Chọn tất cả'}
                  </MotionButton>
                  <MotionButton
                    onClick={handleDeselectAllRoleCaps}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">deselect</span>
                    {isEn ? 'Deselect All' : 'Bỏ chọn tất cả'}
                  </MotionButton>
                  <MotionButton
                    onClick={handleResetRoleDefaults}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">restore</span>
                    {isEn ? 'Reset Default' : 'Chuẩn mặc định'}
                  </MotionButton>
                </div>
              </div>

              {/* Search & Filter within Role Permissions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={roleSearchQuery}
                    onChange={e => setRoleSearchQuery(e.target.value)}
                    placeholder={isEn ? 'Search features by name or description...' : 'Tìm chức năng theo tên hoặc mô tả...'}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                  {roleSearchQuery && (
                    <MotionButton
                      onClick={() => setRoleSearchQuery('')}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    >
                      ✕
                    </MotionButton>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={roleCategoryFilter}
                    onChange={e => setRoleCategoryFilter(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] font-medium"
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
                    <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[20px]">layers</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      {isEn
                        ? `1. Business Features & Screens (${roleCaps.length}/${(selectedRole.availableCapabilities || []).length})`
                        : `1. Chức năng nghiệp vụ & Màn hình truy cập (${roleCaps.length}/${(selectedRole.availableCapabilities || []).length})`}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isEn
                      ? `Within safe scope of role ${selectedRole.roleName}`
                      : `Chỉ cấp trong phạm vi an toàn của vai trò ${selectedRole.roleName}`}
                  </span>
                </div>

                {filteredRoleCaps.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
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
                              ? 'bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 border-[#2D6A4F]/40 dark:border-[#2D6A4F]/50 ring-1 ring-[#2D6A4F]/30'
                              : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="mt-1 h-4 w-4 rounded text-[#2D6A4F] focus:ring-[#2D6A4F] border-slate-300 dark:border-slate-700 cursor-pointer accent-[#2D6A4F]"
                          />

                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[18px]">{cap.icon || 'star'}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                                {cap.label}
                              </h5>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                              {cap.desc}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                                {cap.category}
                              </span>
                              {isChecked ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#2D6A4F] dark:text-[#81B29A]">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  {isEn ? 'Enabled' : 'Đang bật'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
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
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1E2235] dark:text-[#81B29A] text-[20px]">database</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                      {isEn
                        ? `2. Data Access Scope (${roleCodes.length}/${(selectedRole.availablePermissions || []).length})`
                        : `2. Phạm Vi Truy Cập Dữ Liệu (${roleCodes.length}/${(selectedRole.availablePermissions || []).length})`}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isEn ? 'Data access available to this role' : 'Dữ liệu mà vai trò này được phép truy cập'}
                  </span>
                </div>

                {filteredRoleCodes.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
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
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-1 ring-slate-400/20'
                              : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 h-4 w-4 rounded text-[#1E2235] dark:text-[#81B29A] focus:ring-[#1E2235] border-slate-300 dark:border-slate-700 cursor-pointer accent-[#1E2235]"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
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
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">info</span>
                  <span>
                    {isEn
                      ? 'Permissions apply immediately from the next request; UI refreshes on next reload.'
                      : 'Quyền áp dụng từ request tiếp theo; giao diện người dùng cập nhật khi đăng nhập lại hoặc reload.'}
                  </span>
                </div>

                <div className="w-full sm:w-auto flex flex-wrap gap-2">
                  <MotionButton disabled={busy} onClick={syncAllUsersToRole}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold rounded-xl text-xs disabled:opacity-50">
                    {isEn ? 'Sync all users to role' : 'Đồng bộ tất cả theo vai trò'}
                  </MotionButton>
                <MotionButton
                  disabled={busy}
                  onClick={handleSaveRole}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-[#2F7B5D] to-[#24828F] hover:from-[#246A4F] hover:to-[#1B6F7A] text-white font-bold rounded-xl shadow-md shadow-[#2F7B5D]/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
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
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="material-symbols-outlined text-slate-400 text-[48px] mb-2">lock_open</span>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {isEn ? 'Please select a role above to begin configuration.' : 'Vui lòng chọn một vai trò ở trên để bắt đầu cấu hình.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
