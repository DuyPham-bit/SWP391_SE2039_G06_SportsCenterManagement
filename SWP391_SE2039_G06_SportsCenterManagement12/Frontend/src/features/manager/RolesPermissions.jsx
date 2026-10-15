import React, { useEffect, useState, useMemo } from 'react';
import { systemApi, staffApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  SYSTEM_CAPABILITIES,
  getUserCustomOverrides,
  saveUserCustomOverrides,
  getAllUserCustomOverrides
} from '../../services/permissions.js';
import { Badge } from '../../components/common/StatCard.js';

// Predefined module categories for organization
const CAPABILITY_CATEGORIES = [
  'VẬN HÀNH & NHÂN SỰ',
  'NGHIỆP VỤ LỄ TÂN',
  'HUẤN LUYỆN VIÊN',
  'GIÁO ÁN & CHUYÊN MÔN',
  'HỘI VIÊN & ĐẶT CHỖ',
  'BÁO CÁO & BẢO MẬT'
];

export function RolesPermissions() {
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('ROLES'); // 'ROLES' | 'USERS' | 'MATRIX'

  // Data states
  const [matrix, setMatrix] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Role tab state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleCodes, setRoleCodes] = useState([]);
  const [roleCaps, setRoleCaps] = useState([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleCategoryFilter, setRoleCategoryFilter] = useState('ALL');

  // User/Staff tab state
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('ALL');
  const [staffOverridesMap, setStaffOverridesMap] = useState({});

  // Individual staff editing state
  const [userEffectiveCaps, setUserEffectiveCaps] = useState([]);
  const [userRestrictedCaps, setUserRestrictedCaps] = useState([]);
  const [userGrantedCaps, setUserGrantedCaps] = useState([]);
  const [userNotes, setUserNotes] = useState('');
  const [userSaveBusy, setUserSaveBusy] = useState(false);

  // Matrix tab state
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');

  const centerId = currentUser?.centerId || 1;
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  // Load initial permissions and staff directory
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [matrixRows, staffData] = await Promise.all([
          systemApi.getPermissions().catch(err => {
            console.warn('Could not load permissions matrix:', err);
            return [];
          }),
          staffApi.getAll().catch(err => {
            console.warn('Could not load staff list:', err);
            return [];
          })
        ]);

        if (!isMounted) return;

        setMatrix(matrixRows || []);
        setStaffList(staffData || []);

        // Load all local staff overrides
        const storedOverrides = getAllUserCustomOverrides(centerId);
        setStaffOverridesMap(storedOverrides || {});

        // Default select first role (prefer Coach or first available)
        if (matrixRows && matrixRows.length > 0) {
          const coachRole = matrixRows.find(r => r.roleName?.toUpperCase() === 'COACH') || matrixRows[0];
          selectRole(coachRole);
        }

        // Default select first staff
        if (staffData && staffData.length > 0) {
          selectStaffMember(staffData[0], matrixRows, storedOverrides);
        }
      } catch (e) {
        if (isMounted) showError(e.message || 'Lỗi khi tải dữ liệu phân quyền');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

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

  // When an individual staff member is chosen in Tab 2
  const selectStaffMember = (staff, currentMatrix = matrix, overridesMap = staffOverridesMap) => {
    if (!staff) return;
    setSelectedStaffId(staff.id);

    // Find the base role capabilities for this staff
    const staffRoleNormalized = String(staff.role || '').toUpperCase();
    const roleRow = (currentMatrix || []).find(r => String(r.roleName || '').toUpperCase() === staffRoleNormalized);
    const baseRoleCaps = roleRow ? (roleRow.capabilityIds || roleRow.availableCapabilities || []) : [];

    // Check if this user has existing overrides
    const override = overridesMap[staff.id] || getUserCustomOverrides(centerId, staff.id);
    if (override) {
      setUserRestrictedCaps(override.restrictedCapabilities || []);
      setUserGrantedCaps(override.grantedCapabilities || []);
      setUserEffectiveCaps(override.effectiveCapabilities || []);
      setUserNotes(override.notes || '');
    } else {
      // Default to 100% role capabilities
      setUserRestrictedCaps([]);
      setUserGrantedCaps([]);
      setUserEffectiveCaps([...baseRoleCaps]);
      setUserNotes('');
    }
  };

  const selectedStaff = useMemo(() => {
    return staffList.find(s => s.id === selectedStaffId) || null;
  }, [staffList, selectedStaffId]);

  // Base capabilities for selected staff's role
  const staffRoleBaselineCaps = useMemo(() => {
    if (!selectedStaff) return [];
    const staffRoleNormalized = String(selectedStaff.role || '').toUpperCase();
    const roleRow = matrix.find(r => String(r.roleName || '').toUpperCase() === staffRoleNormalized);
    return roleRow ? (roleRow.capabilityIds || roleRow.availableCapabilities || []) : [];
  }, [selectedStaff, matrix]);

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
    showSuccess('Đã khôi phục cài đặt chuẩn mặc định của vai trò!');
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
      showSuccess(`Đã lưu cấu hình phân quyền cho vai trò ${selectedRole?.roleName || ''} thành công!`);
    } catch (e) {
      showError(e.message || 'Không thể lưu phân quyền vai trò.');
    } finally {
      setBusy(false);
    }
  };

  // Toggle inherited capability restriction for individual staff (Tab 2)
  const handleToggleStaffInheritedCap = (capId) => {
    // If it's currently restricted (unchecked), enable it back
    if (userRestrictedCaps.includes(capId)) {
      const nextRestricted = userRestrictedCaps.filter(c => c !== capId);
      setUserRestrictedCaps(nextRestricted);
      setUserEffectiveCaps(prev => [...new Set([...prev, capId])]);
    } else {
      // It was enabled, so restrict it
      const nextRestricted = [...userRestrictedCaps, capId];
      setUserRestrictedCaps(nextRestricted);
      setUserEffectiveCaps(prev => prev.filter(c => c !== capId));
    }
  };

  // Toggle granted additional capability for individual staff (Tab 2)
  const handleToggleStaffGrantedCap = (capId) => {
    if (userGrantedCaps.includes(capId)) {
      // Remove extra grant
      const nextGranted = userGrantedCaps.filter(c => c !== capId);
      setUserGrantedCaps(nextGranted);
      setUserEffectiveCaps(prev => prev.filter(c => c !== capId));
    } else {
      // Add extra grant
      const nextGranted = [...userGrantedCaps, capId];
      setUserGrantedCaps(nextGranted);
      setUserEffectiveCaps(prev => [...new Set([...prev, capId])]);
    }
  };

  // Save individual staff permissions (Tab 2)
  const handleSaveStaffPermissions = () => {
    if (!selectedStaff) return;
    setUserSaveBusy(true);
    try {
      const hasCustomOverrides = userRestrictedCaps.length > 0 || userGrantedCaps.length > 0 || userNotes.trim().length > 0;
      if (!hasCustomOverrides) {
        // Clear override if it matches role 100%
        saveUserCustomOverrides(centerId, selectedStaff.id, null);
        const nextMap = { ...staffOverridesMap };
        delete nextMap[selectedStaff.id];
        setStaffOverridesMap(nextMap);
        showSuccess(`Nhân sự ${selectedStaff.fullName} đã đồng bộ 100% theo chuẩn vai trò ${selectedStaff.role}!`);
      } else {
        const payload = {
          userId: selectedStaff.id,
          centerId,
          role: selectedStaff.role,
          staffName: selectedStaff.fullName,
          restrictedCapabilities: userRestrictedCaps,
          grantedCapabilities: userGrantedCaps,
          effectiveCapabilities: userEffectiveCaps,
          notes: userNotes,
          updatedAt: new Date().toISOString()
        };
        saveUserCustomOverrides(centerId, selectedStaff.id, payload);
        setStaffOverridesMap(prev => ({ ...prev, [selectedStaff.id]: payload }));
        showSuccess(`Đã lưu cấu hình quyền riêng biệt cho ${selectedStaff.fullName} thành công!`);
      }
    } catch (e) {
      showError('Không thể lưu quyền riêng của nhân sự.');
    } finally {
      setUserSaveBusy(false);
    }
  };

  // Reset individual staff to role default (Tab 2)
  const handleResetStaffToRole = () => {
    if (!selectedStaff) return;
    saveUserCustomOverrides(centerId, selectedStaff.id, null);
    const nextMap = { ...staffOverridesMap };
    delete nextMap[selectedStaff.id];
    setStaffOverridesMap(nextMap);
    setUserRestrictedCaps([]);
    setUserGrantedCaps([]);
    setUserEffectiveCaps([...staffRoleBaselineCaps]);
    setUserNotes('');
    showSuccess(`Đã hủy bỏ toàn bộ quyền riêng và khôi phục chuẩn vai trò cho ${selectedStaff.fullName}!`);
  };

  // Filtered staff list for Tab 2
  const filteredStaffList = useMemo(() => {
    return staffList.filter(s => {
      const matchesRole = staffRoleFilter === 'ALL' || String(s.role).toUpperCase() === staffRoleFilter;
      const q = staffSearchQuery.trim().toLowerCase();
      const matchesQuery = !q ||
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.staffCode || s.coachCode || '').toLowerCase().includes(q) ||
        (s.specialty || '').toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [staffList, staffRoleFilter, staffSearchQuery]);

  // Filtered capabilities for Tab 1
  const filteredRoleCaps = useMemo(() => {
    if (!selectedRole) return [];
    const available = selectedRole.availableCapabilities || [];
    return available
      .map(id => SYSTEM_CAPABILITIES.find(c => c.id === id) || { id, label: id, desc: 'Chức năng hệ thống', category: 'KHÁC', icon: 'settings' })
      .filter(cap => {
        const matchesCategory = roleCategoryFilter === 'ALL' || cap.category === roleCategoryFilter;
        const q = roleSearchQuery.trim().toLowerCase();
        const matchesQuery = !q ||
          cap.label.toLowerCase().includes(q) ||
          cap.id.toLowerCase().includes(q) ||
          (cap.desc || '').toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      });
  }, [selectedRole, roleCategoryFilter, roleSearchQuery]);

  // Filtered data permissions for Tab 1
  const filteredRoleCodes = useMemo(() => {
    if (!selectedRole) return [];
    const list = selectedRole.availablePermissions || selectedRole.permissions || [];
    const q = roleSearchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }, [selectedRole, roleSearchQuery]);

  // Matrix Filtered Capabilities
  const filteredMatrixCaps = useMemo(() => {
    const q = matrixSearchQuery.trim().toLowerCase();
    if (!q) return SYSTEM_CAPABILITIES;
    return SYSTEM_CAPABILITIES.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }, [matrixSearchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Đang tải ma trận phân quyền hệ thống SCMS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white p-6 rounded-2xl shadow-sm border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider bg-red-600/90 text-white uppercase">
                {isManager ? 'Phân Quyền Trung Tâm' : 'Quản Trị Toàn Hệ Thống'}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Cơ sở #{centerId}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Phân Quyền Chi Tiết Theo Từng Vai Trò & Từng Người
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Thiết lập ma trận truy cập (RBAC) chuẩn hóa theo từng nhóm vai trò và tinh chỉnh quyền đặc cách cho từng nhân viên, huấn luyện viên tại trung tâm.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-700/60 backdrop-blur-sm">
            <div className="text-center px-2">
              <div className="text-xl font-black text-red-400">{matrix.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Vai trò</div>
            </div>
            <div className="text-center px-2 border-l border-slate-700/60">
              <div className="text-xl font-black text-amber-400">{staffList.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nhân sự</div>
            </div>
            <div className="text-center px-2 border-l border-slate-700/60">
              <div className="text-xl font-black text-emerald-400">{SYSTEM_CAPABILITIES.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chức năng</div>
            </div>
            <div className="text-center px-2 border-l border-slate-700/60">
              <div className="text-xl font-black text-cyan-400">{Object.keys(staffOverridesMap).length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Đặc cách riêng</div>
            </div>
          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-700/60">
          <button
            onClick={() => setActiveTab('ROLES')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'ROLES'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            1. Phân Quyền Theo Vai Trò ({matrix.length})
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'USERS'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_check</span>
            2. Phân Quyền Theo Từng Người ({staffList.length} nhân sự)
            {Object.keys(staffOverridesMap).length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                {Object.keys(staffOverridesMap).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'MATRIX'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            3. Ma Trận Toàn Cảnh (Full RBAC Grid)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PHÂN QUYỀN THEO TỪNG VAI TRÒ (ROLE-BASED PERMISSIONS)              */}
      {/* ========================================================================= */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          {/* Role Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Bước 1: Chọn vai trò muốn cấu hình phân quyền
              </h2>
              <span className="text-xs text-slate-500">
                Đang cấu hình: <strong className="text-slate-800">{selectedRole?.roleName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {matrix.map(role => {
                const isSelected = String(role.roleId) === String(selectedRoleId);
                const roleUpper = String(role.roleName).toUpperCase();

                // Assign theme details based on role
                let roleColor = 'border-slate-200 hover:border-slate-300';
                let icon = 'badge';
                let roleDesc = 'Quyền hạn cơ sở';
                let badgeVariant = 'info';

                if (roleUpper === 'COACH') {
                  icon = 'sports';
                  roleDesc = 'Huấn luyện viên phụ trách ca dạy, điểm danh & soạn giáo án thể thao.';
                  badgeVariant = 'COACH';
                  if (isSelected) roleColor = 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40';
                } else if (roleUpper === 'RECEPTIONIST') {
                  icon = 'countertops';
                  roleDesc = 'Nhân viên lễ tân đón tiếp, tra cứu hội viên, thu ngân & quét thẻ check-in.';
                  badgeVariant = 'RECEPTIONIST';
                  if (isSelected) roleColor = 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40';
                } else if (roleUpper === 'MEMBER') {
                  icon = 'card_membership';
                  roleDesc = 'Hội viên trung tâm: tự đặt chỗ lớp học, theo dõi tiến độ tập luyện.';
                  badgeVariant = 'MEMBER';
                  if (isSelected) roleColor = 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40';
                } else {
                  icon = 'admin_panel_settings';
                  roleDesc = 'Quản trị viên & ban quản lý trung tâm điều hành mọi hoạt động.';
                  badgeVariant = 'MANAGER';
                  if (isSelected) roleColor = 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40';
                }

                // Count staff assigned to this role
                const staffCount = staffList.filter(s => String(s.role).toUpperCase() === roleUpper).length;

                return (
                  <div
                    key={role.roleId}
                    onClick={() => selectRole(role)}
                    className={`cursor-pointer rounded-2xl border p-4 bg-white transition-all shadow-sm relative ${roleColor}`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{role.roleName}</h3>
                        <Badge variant={badgeVariant} size="sm">{role.roleName}</Badge>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-snug line-clamp-2 my-2">
                      {roleDesc}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Nhân sự áp dụng:</span>
                      <span className="font-bold text-slate-800">{staffCount} người</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Chức năng mở:</span>
                      <span className="font-bold text-emerald-600">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Header of Inspector */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      Cấu hình quyền cho vai trò: <span className="text-red-600">{selectedRole.roleName}</span>
                    </h3>
                    <Badge variant={selectedRole.roleName.toUpperCase()} size="sm">{selectedRole.roleName}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Bật/tắt các quyền chức năng và quyền dữ liệu mà mọi người mang vai trò này sẽ được cấp mặc định.
                  </p>
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSelectAllRoleCaps}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">select_all</span>
                    Chọn tất cả
                  </button>
                  <button
                    onClick={handleDeselectAllRoleCaps}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">deselect</span>
                    Bỏ chọn tất cả
                  </button>
                  <button
                    onClick={handleResetRoleDefaults}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">restore</span>
                    Chuẩn mặc định
                  </button>
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
                    placeholder="Tìm kiếm quyền theo tên, mã code hoặc mô tả..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {roleSearchQuery && (
                    <button
                      onClick={() => setRoleSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={roleCategoryFilter}
                    onChange={e => setRoleCategoryFilter(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
                  >
                    <option value="ALL">Tất cả danh mục ({filteredRoleCaps.length})</option>
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
                    <span className="material-symbols-outlined text-red-600 text-[20px]">layers</span>
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                      1. Chức năng nghiệp vụ & Màn hình truy cập ({roleCaps.length}/{(selectedRole.availableCapabilities || []).length})
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Chỉ cấp trong phạm vi an toàn của vai trò {selectedRole.roleName}
                  </span>
                </div>

                {filteredRoleCaps.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    Không tìm thấy chức năng phù hợp với từ khóa "{roleSearchQuery}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredRoleCaps.map(cap => {
                      const isChecked = roleCaps.includes(cap.id);
                      return (
                        <div
                          key={cap.id}
                          onClick={() => toggleRoleCap(cap.id)}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-red-50/40 border-red-300 ring-1 ring-red-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="mt-1 h-4 w-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                          />

                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[18px]">{cap.icon || 'star'}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {cap.label}
                              </h5>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 font-semibold">
                                {cap.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                              {cap.desc}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                {cap.category}
                              </span>
                              {isChecked ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                  Đang bật
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                                  <span className="material-symbols-outlined text-[12px]">block</span>
                                  Đang khóa
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
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">database</span>
                    <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                      2. Quyền Dữ Liệu & Thao Tác API ({roleCodes.length}/{(selectedRole.availablePermissions || []).length})
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Phạm vi truy xuất dữ liệu database của vai trò
                  </span>
                </div>

                {filteredRoleCodes.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                    Không có quyền dữ liệu đặc thù hoặc chưa tìm thấy kết quả.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredRoleCodes.map(p => {
                      const isChecked = roleCodes.includes(p.code);
                      return (
                        <div
                          key={p.code}
                          onClick={() => toggleRoleCode(p.code)}
                          className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900">{p.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800">
                                {p.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                              {p.description || 'Quyền thao tác dữ liệu hệ thống'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">info</span>
                  <span>Quyền áp dụng từ request tiếp theo; giao diện người dùng cập nhật khi đăng nhập lại hoặc reload.</span>
                </div>

                <button
                  disabled={busy}
                  onClick={handleSaveRole}
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {busy ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang lưu ma trận vai trò...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>Lưu Phân Quyền Vai Trò [{selectedRole.roleName}]</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-[48px] mb-2">lock_open</span>
              <p className="text-sm font-semibold text-slate-600">Vui lòng chọn một vai trò ở trên để bắt đầu cấu hình.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PHÂN QUYỀN THEO TỪNG NGƯỜI (INDIVIDUAL PERSONNEL OVERRIDES)       */}
      {/* ========================================================================= */}
      {activeTab === 'USERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Personnel Directory (4 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Danh Sách Nhân Sự</h3>
                <p className="text-[11px] text-slate-500">Chọn 1 người để cấu hình quyền riêng</p>
              </div>
              <Badge variant="primary" size="sm">{filteredStaffList.length} nhân sự</Badge>
            </div>

            {/* Staff Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={staffSearchQuery}
                onChange={e => setStaffSearchQuery(e.target.value)}
                placeholder="Tìm nhân sự theo tên, mã, email..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Role Filter Tabs for Staff */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'COACH', label: 'HLV' },
                { id: 'RECEPTIONIST', label: 'Lễ tân' },
                { id: 'MANAGER', label: 'Quản lý' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStaffRoleFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    staffRoleFilter === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Staff List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredStaffList.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Không tìm thấy nhân sự phù hợp.
                </div>
              ) : (
                filteredStaffList.map(staff => {
                  const isSelected = staff.id === selectedStaffId;
                  const hasOverride = Boolean(staffOverridesMap[staff.id]);
                  const staffRoleUpper = String(staff.role || '').toUpperCase();

                  return (
                    <div
                      key={staff.id}
                      onClick={() => selectStaffMember(staff)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-red-50/60 border-red-400 ring-2 ring-red-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                          staffRoleUpper === 'COACH'
                            ? 'bg-amber-100 text-amber-800'
                            : staffRoleUpper === 'RECEPTIONIST'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {(staff.fullName || 'U').charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-slate-900 truncate">
                              {staff.fullName}
                            </h4>
                            {hasOverride && (
                              <span title="Có quyền đặc cách riêng" className="inline-flex text-amber-500 text-[14px]">
                                ⭐
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {staff.staffCode || staff.coachCode || staff.email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant={staffRoleUpper} size="sm">{staff.role}</Badge>
                            {staff.specialty && (
                              <span className="text-[10px] text-slate-500 truncate">
                                • {staff.specialty}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        {hasOverride ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Quyền riêng
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Chuẩn vai trò
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Individual Permission Inspector & Overrides (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {selectedStaff ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                {/* Staff Header Profile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-red-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {(selectedStaff.fullName || 'U').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {selectedStaff.fullName}
                        </h3>
                        <Badge variant={String(selectedStaff.role).toUpperCase()} size="sm">
                          {selectedStaff.role}
                        </Badge>
                        <Badge variant={selectedStaff.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'} size="sm">
                          {selectedStaff.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Mã: <strong className="text-slate-700">{selectedStaff.staffCode || selectedStaff.coachCode || 'N/A'}</strong></span>
                        <span>• Email: <strong className="text-slate-700">{selectedStaff.email}</strong></span>
                        {selectedStaff.specialty && <span>• Chuyên môn: <strong className="text-slate-700">{selectedStaff.specialty}</strong></span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetStaffToRole}
                      title="Xóa quyền riêng, quay về 100% chuẩn vai trò"
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      Đặt lại theo vai trò
                    </button>
                  </div>
                </div>

                {/* Status Summary Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div>
                    <div className="text-lg font-black text-slate-900">{userEffectiveCaps.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Quyền thực nhận</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-emerald-600">
                      {staffRoleBaselineCaps.length - userRestrictedCaps.length}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Kế thừa vai trò</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-amber-600">{userGrantedCaps.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Cấp đặc cách</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-red-600">{userRestrictedCaps.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Bị hạn chế</div>
                  </div>
                </div>

                {/* SECTION 1: INHERITED CAPABILITIES FROM ROLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        1. Quyền kế thừa từ vai trò [{selectedStaff.role}]
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Gạt công tắc để TẠM KHÓA / HẠN CHẾ riêng cho nhân sự này
                    </span>
                  </div>

                  {staffRoleBaselineCaps.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                      Vai trò này hiện chưa được mở quyền cơ sở nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {staffRoleBaselineCaps.map(capId => {
                        const cap = SYSTEM_CAPABILITIES.find(c => c.id === capId) || { id: capId, label: capId, desc: 'Quyền cơ sở' };
                        const isRestricted = userRestrictedCaps.includes(capId);
                        const isEnabled = !isRestricted;

                        return (
                          <div
                            key={capId}
                            onClick={() => handleToggleStaffInheritedCap(capId)}
                            className={`cursor-pointer rounded-xl p-3 border transition-all flex items-start gap-3 select-none ${
                              isEnabled
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-red-50/30 border-red-200 opacity-70'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => {}}
                              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{cap.label}</span>
                                {isEnabled ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    Kế thừa
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                                    Đã khóa riêng
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cap.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: GRANTED SPECIFIC CAPABILITIES BEYOND ROLE */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">workspace_premium</span>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        2. Cấp quyền đặc cách riêng (Ngoài vai trò gốc)
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Bật để cấp thêm quyền quản trị / hỗ trợ cho nhân sự này
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {SYSTEM_CAPABILITIES
                      .filter(cap => !staffRoleBaselineCaps.includes(cap.id))
                      .map(cap => {
                        const isGranted = userGrantedCaps.includes(cap.id);

                        return (
                          <div
                            key={cap.id}
                            onClick={() => handleToggleStaffGrantedCap(cap.id)}
                            className={`cursor-pointer rounded-xl p-3 border transition-all flex items-start gap-3 select-none ${
                              isGranted
                                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => {}}
                              className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{cap.label}</span>
                                {isGranted && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                    ⭐ Đặc cách
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cap.desc}</p>
                              <span className="text-[9px] font-mono text-slate-400 mt-1 inline-block">({cap.category})</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* SECTION 3: NOTES & JUSTIFICATION */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Ghi chú ủy quyền / Lý do phân quyền riêng:
                  </label>
                  <textarea
                    rows={2}
                    value={userNotes}
                    onChange={e => setUserNotes(e.target.value)}
                    placeholder="VD: Trưởng bộ môn Cầu lông phụ trách xếp lịch dạy; hoặc Nhân viên thử việc tạm khóa quyền thu tiền..."
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50/50"
                  />
                </div>

                {/* Save Staff Permissions Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Cấu hình quyền riêng này được lưu tức thời cho tài khoản <strong>{selectedStaff.fullName}</strong>.
                  </span>

                  <button
                    disabled={userSaveBusy}
                    onClick={handleSaveStaffPermissions}
                    className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {userSaveBusy ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang lưu quyền nhân sự...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">person_save</span>
                        <span>Lưu Quyền Riêng Cho {selectedStaff.fullName}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <span className="material-symbols-outlined text-slate-400 text-[48px] mb-2">person_pin</span>
                <p className="text-sm font-semibold text-slate-600">Vui lòng chọn một nhân sự ở danh sách bên trái.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MA TRẬN TOÀN CẢNH (FULL RBAC MATRIX GRID)                          */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Bảng Ma Trận Phân Quyền Toàn Cảnh (Enterprise RBAC Matrix)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Bảng đối chiếu tổng thể quyền truy cập giữa các vai trò trong hệ thống SCMS.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={matrixSearchQuery}
                onChange={e => setMatrixSearchQuery(e.target.value)}
                placeholder="Tìm tính năng trong ma trận..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Matrix Grid Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-chivo">
                  <th className="py-3 px-4 uppercase tracking-wider text-[11px] font-bold min-w-[260px]">
                    Chức Năng & Quyền Hệ Thống
                  </th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px] font-bold text-center w-36">
                    Quản Lý (Manager)
                  </th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px] font-bold text-center w-36 bg-amber-950/60 text-amber-300">
                    Huấn Luyện Viên
                  </th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px] font-bold text-center w-36 bg-purple-950/60 text-purple-300">
                    Lễ Tân
                  </th>
                  <th className="py-3 px-3 uppercase tracking-wider text-[11px] font-bold text-center w-36 bg-emerald-950/60 text-emerald-300">
                    Hội Viên
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CAPABILITY_CATEGORIES.map(category => {
                  const capsInCategory = filteredMatrixCaps.filter(c => c.category === category);
                  if (capsInCategory.length === 0) return null;

                  return (
                    <React.Fragment key={category}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-100/80 font-bold text-slate-800">
                        <td colSpan={5} className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-slate-700 bg-slate-100">
                          {category} ({capsInCategory.length} chức năng)
                        </td>
                      </tr>

                      {/* Capabilities in this category */}
                      {capsInCategory.map(cap => {
                        // Manager has all caps
                        const managerHas = true;

                        // Check coach
                        const coachRole = matrix.find(r => r.roleName?.toUpperCase() === 'COACH');
                        const coachHas = coachRole ? (coachRole.capabilityIds || []).includes(cap.id) : (cap.defaultRole === 'COACH');

                        // Check receptionist
                        const recepRole = matrix.find(r => r.roleName?.toUpperCase() === 'RECEPTIONIST');
                        const recepHas = recepRole ? (recepRole.capabilityIds || []).includes(cap.id) : (cap.defaultRole === 'RECEPTIONIST');

                        // Check member
                        const memberRole = matrix.find(r => r.roleName?.toUpperCase() === 'MEMBER');
                        const memberHas = memberRole ? (memberRole.capabilityIds || []).includes(cap.id) : (cap.defaultRole === 'MEMBER');

                        return (
                          <tr key={cap.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-slate-500">
                                  {cap.icon || 'circle'}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900">{cap.label}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">ID: {cap.id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Manager cell */}
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="material-symbols-outlined text-[16px]">check</span>
                              </span>
                            </td>

                            {/* Coach cell */}
                            <td className="py-2.5 px-3 text-center bg-amber-50/30">
                              {coachHas ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400">
                                  <span className="material-symbols-outlined text-[16px]">remove</span>
                                </span>
                              )}
                            </td>

                            {/* Receptionist cell */}
                            <td className="py-2.5 px-3 text-center bg-purple-50/30">
                              {recepHas ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400">
                                  <span className="material-symbols-outlined text-[16px]">remove</span>
                                </span>
                              )}
                            </td>

                            {/* Member cell */}
                            <td className="py-2.5 px-3 text-center bg-emerald-50/30">
                              {memberHas ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="material-symbols-outlined text-[16px]">check</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400">
                                  <span className="material-symbols-outlined text-[16px]">remove</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend / Footer Notes */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-700">Chú giải ký hiệu:</span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-[12px] font-bold">✓</span>
                Có quyền truy cập
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="w-5 h-5 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-[12px] font-bold">—</span>
                Không có quyền
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span className="text-amber-500 font-bold">⭐</span>
                Có thể cấp đặc cách riêng cho cá nhân
              </span>
            </div>

            <div className="text-slate-500">
              * Quản lý trung tâm có toàn quyền giám sát và phân quyền an toàn theo chính sách Safe Delegation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
