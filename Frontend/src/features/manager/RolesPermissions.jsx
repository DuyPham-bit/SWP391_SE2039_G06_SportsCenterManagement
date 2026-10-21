import React, { useEffect, useState, useMemo } from 'react';
import { systemApi, staffApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
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

  // Data states
  const [matrix, setMatrix] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  // Role editor state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleCodes, setRoleCodes] = useState([]);
  const [roleCaps, setRoleCaps] = useState([]);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleCategoryFilter, setRoleCategoryFilter] = useState('ALL');

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
        if (isMounted) setLoadError(e.message || (isEn ? 'Failed to load permissions matrix' : 'Lỗi khi tải dữ liệu phân quyền'));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [isEn]);

  // When a role is chosen
  const selectRole = (row) => {
    if (!row) return;
    setSelectedRoleId(row.roleId);
    setRoleCodes((row.permissions || []).map(p => p.code));
    setRoleCaps(row.capabilityIds || []);
  };

  const selectedRole = useMemo(() => {
    return matrix.find(r => String(r.roleId) === String(selectedRoleId)) || null;
  }, [matrix, selectedRoleId]);

  // Toggle role capability
  const toggleRoleCap = (capId) => {
    setRoleCaps(prev => prev.includes(capId) ? prev.filter(c => c !== capId) : [...prev, capId]);
  };

  // Toggle role data permission
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

  // Save Role Permissions to Backend
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

  // Filtered capabilities
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
          cap.id.toLowerCase().includes(q) ||
          (cap.desc || '').toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      });
  }, [selectedRole, roleCategoryFilter, roleSearchQuery, isEn]);

  // Filtered data permissions
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-10 h-10 border-4 border-[#81B29A]/30 border-t-[#2D6A4F] rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {isEn ? 'Loading SCMS permission matrix...' : 'Đang tải ma trận phân quyền hệ thống SCMS...'}
        </p>
      </div>
    );
  }

  if (loadError) return <div role="alert" className="p-4 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">{loadError}</div>;

  return (
    <div className="space-y-6 pb-16 animate-fade-slide-up">
      {/* Top Banner / Header - Olympic Midnight Navy */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E2235] via-[#242A42] to-[#1E2235] p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#81B29A]/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 h-48 w-48 rounded-full bg-[#F2CC8F]/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-[#2D6A4F] text-white uppercase shadow-sm">
                {isManager ? (isEn ? 'Center Access Control' : 'Phân Quyền Trung Tâm') : (isEn ? 'System Admin' : 'Quản Trị Toàn Hệ Thống')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-[#F2CC8F] border border-white/10">
                {centerId ? `${isEn ? 'Facility' : 'Cơ sở'} #${centerId}` : (isEn ? 'Enterprise-wide' : 'Toàn hệ thống')}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-chivo text-white">
              {isEn ? 'Role-Based Access Control (RBAC)' : 'Phân Quyền Theo Vai Trò'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {isEn
                ? 'Configure role capabilities, manage data permissions, and govern delegation across center staff.'
                : 'Thiết lập quyền truy cập theo vai trò và lưu cấu hình tại trung tâm an toàn theo chính sách Safe Delegation.'}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="text-center px-3">
              <div className="text-xl font-black text-[#81B29A]">{matrix.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isEn ? 'Roles' : 'Vai trò'}
              </div>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <div className="text-xl font-black text-[#F2CC8F]">{staffList.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isEn ? 'Staff' : 'Nhân sự'}
              </div>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <div className="text-xl font-black text-white">{SYSTEM_CAPABILITIES.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {isEn ? 'Features' : 'Chức năng'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
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
                <button
                  onClick={handleSelectAllRoleCaps}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">select_all</span>
                  {isEn ? 'Select All' : 'Chọn tất cả'}
                </button>
                <button
                  onClick={handleDeselectAllRoleCaps}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">deselect</span>
                  {isEn ? 'Deselect All' : 'Bỏ chọn tất cả'}
                </button>
                <button
                  onClick={handleResetRoleDefaults}
                  className="px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">restore</span>
                  {isEn ? 'Reset Default' : 'Chuẩn mặc định'}
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
                  placeholder={isEn ? 'Search permissions by name, code or description...' : 'Tìm kiếm quyền theo tên, mã code hoặc mô tả...'}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                {roleSearchQuery && (
                  <button
                    onClick={() => setRoleSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
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
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                              {cap.id}
                            </span>
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
                      ? `2. Data Permissions & API Operations (${roleCodes.length}/${(selectedRole.availablePermissions || []).length})`
                      : `2. Quyền Dữ Liệu & Thao Tác API (${roleCodes.length}/${(selectedRole.availablePermissions || []).length})`}
                  </h4>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {isEn ? 'Database query & operation scope for role' : 'Phạm vi truy xuất dữ liệu database của vai trò'}
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
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              {p.code}
                            </span>
                          </div>
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

              <button
                disabled={busy}
                onClick={handleSaveRole}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold rounded-xl shadow-md shadow-[#2D6A4F]/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 hover-lift"
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
              </button>
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
    </div>
  );
}
