import React, { useEffect, useState, useMemo } from 'react';
import { systemApi, staffApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { SYSTEM_CAPABILITIES } from '../../services/permissions.js';
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
  const [activeTab, setActiveTab] = useState('ROLES'); // 'ROLES' | 'MATRIX'

  // Data states
  const [matrix, setMatrix] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  // Role tab state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleCodes, setRoleCodes] = useState([]);
  const [roleCaps, setRoleCaps] = useState([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleCategoryFilter, setRoleCategoryFilter] = useState('ALL');

  // Matrix tab state
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');

  const centerId = currentUser?.centerId;
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  // Load initial permissions and staff directory
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setLoadError('');
      try {
        const [matrixRows, staffData] = await Promise.all([
          systemApi.getPermissions(),
          staffApi.getAll().catch(err => {
            console.warn('Could not load staff list:', err);
            return [];
          })
        ]);

        if (!isMounted) return;

        setMatrix(matrixRows || []);
        setStaffList(staffData || []);

        // Default select first role (prefer Coach or first available)
        if (matrixRows && matrixRows.length > 0) {
          const coachRole = matrixRows.find(r => r.roleName?.toUpperCase() === 'COACH') || matrixRows[0];
          selectRole(coachRole);
        }

      } catch (e) {
        if (isMounted) setLoadError(e.message || 'Lỗi khi tải dữ liệu phân quyền');
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
    showSuccess('Đã chọn quyền mặc định. Bấm Lưu cấu hình để áp dụng.');
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

  if (loadError) return <div role="alert" className="p-4 text-red-700">{loadError}</div>;

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
                {centerId ? `Cơ sở #${centerId}` : 'Toàn hệ thống'}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Phân Quyền Theo Vai Trò
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Thiết lập quyền truy cập theo vai trò và lưu cấu hình tại trung tâm.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-700/60 backdrop-blur-sm">
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
            onClick={() => setActiveTab('MATRIX')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === 'MATRIX'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            2. Ma Trận Toàn Cảnh (Full RBAC Grid)
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
                        const coachHas = coachRole ? (coachRole.capabilityIds || []).includes(cap.id) : false;

                        // Check receptionist
                        const recepRole = matrix.find(r => r.roleName?.toUpperCase() === 'RECEPTIONIST');
                        const recepHas = recepRole ? (recepRole.capabilityIds || []).includes(cap.id) : false;

                        // Check member
                        const memberRole = matrix.find(r => r.roleName?.toUpperCase() === 'MEMBER');
                        const memberHas = memberRole ? (memberRole.capabilityIds || []).includes(cap.id) : false;

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
