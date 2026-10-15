import React, { useState, useEffect, useRef, useMemo } from 'react';
import { staffApi, classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { formatMemberDate } from '../member/memberOverview.js';

// Configuration for roles, colors, and badges
const ROLE_CONFIG = {
  COACH: {
    label: 'Huấn luyện viên',
    shortLabel: 'HLV',
    icon: 'sports',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    avatarGrad: 'from-orange-500 to-amber-600',
    desc: 'Phụ trách giảng dạy các lớp thể thao, điểm danh ca học và xây dựng giáo án huấn luyện.'
  },
  RECEPTIONIST: {
    label: 'Lễ tân quầy',
    shortLabel: 'Lễ tân',
    icon: 'support_agent',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarGrad: 'from-purple-600 to-indigo-600',
    desc: 'Quét thẻ check-in vào cổng, thu ngân bán gói tập tại quầy và tiếp nhận yêu cầu hỗ trợ.'
  },
  MANAGER: {
    label: 'Quản lý trung tâm',
    shortLabel: 'Quản lý',
    icon: 'admin_panel_settings',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarGrad: 'from-blue-600 to-cyan-600',
    desc: 'Vận hành toàn bộ cơ sở vật chất, nhân sự, lịch học và phân quyền hệ thống SCMS.'
  },
  ADMIN: {
    label: 'Quản trị viên',
    shortLabel: 'Admin',
    icon: 'shield_person',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    avatarGrad: 'from-rose-600 to-red-700',
    desc: 'Quản trị tối cao toàn bộ cụm trung tâm và cấu hình máy chủ SCMS.'
  }
};

const AVATAR_GRADIENTS = [
  'from-rose-500 to-red-600',
  'from-blue-600 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-600',
  'from-purple-600 to-violet-700',
  'from-cyan-600 to-blue-600',
  'from-pink-500 to-rose-600'
];

function getAvatarGradient(name = '', role = '') {
  if (role && ROLE_CONFIG[role]?.avatarGrad) {
    return ROLE_CONFIG[role].avatarGrad;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name = '') {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'NV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const inputClass = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5';
const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);

export function StaffManagement() {
  const { showSuccess, showError } = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // 'ALL' | 'COACH' | 'RECEPTIONIST' | 'MANAGER'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'DISABLED'
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'NAME_ASC' | 'NAME_DESC' | 'ROLE'
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState('DIRECT'); // 'DIRECT' | 'APPOINT'
  const [detailModalStaff, setDetailModalStaff] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [statusConfirmStaff, setStatusConfirmStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  // Appointment from existing member state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [sports, setSports] = useState([]);
  const [sportsError, setSportsError] = useState('');
  const [newSpecialtyName, setNewSpecialtyName] = useState('');
  const [addingSpecialty, setAddingSpecialty] = useState(false);

  // Form states
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'COACH',
    hireDate: today(),
    specialty: '',
    sportIds: [],
    certification: '',
    experienceYears: '',
    bio: ''
  });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAll();
      setStaffList(data);
    } catch (e) {
      showError('Không thể tải danh sách nhân viên: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    loadSports();
  }, []);

  const loadSports = async () => {
    setSportsError('');
    try { setSports(await classApi.getSports()); }
    catch (error) { setSportsError(error.message || 'Không thể tải danh sách chuyên môn.'); }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for existing members in APPOINT mode
  useEffect(() => {
    if (!createModalOpen || createMode !== 'APPOINT' || selectedMember) return;
    let active = true;
    const query = memberSearchQuery.trim();
    if (query.length < 2) {
      setFilteredMembers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const members = await staffApi.getAvailableMembers(query);
        if (active) setFilteredMembers(members);
      } catch (error) {
        if (active) {
          setFilteredMembers([]);
          showError(error.message);
        }
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [createModalOpen, createMode, memberSearchQuery, selectedMember]);

  // Derived KPI statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const coaches = staffList.filter(s => s.role === 'COACH').length;
    const receptionists = staffList.filter(s => s.role === 'RECEPTIONIST').length;
    const managers = staffList.filter(s => s.role === 'MANAGER' || s.role === 'ADMIN').length;
    const activeCount = staffList.filter(s => s.status === 'ACTIVE').length;
    const disabledCount = staffList.filter(s => s.status !== 'ACTIVE').length;
    return { total, coaches, receptionists, managers, activeCount, disabledCount };
  }, [staffList]);

  // Client-side filtering & sorting
  const displayedStaff = useMemo(() => {
    let list = [...staffList];

    // Filter by role
    if (roleFilter !== 'ALL') {
      list = list.filter(s => s.role === roleFilter);
    }

    // Filter by status
    if (statusFilter === 'ACTIVE') {
      list = list.filter(s => s.status === 'ACTIVE');
    } else if (statusFilter === 'DISABLED') {
      list = list.filter(s => s.status !== 'ACTIVE');
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(s =>
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.specialty || '').toLowerCase().includes(q) ||
        (s.certification || '').toLowerCase().includes(q) ||
        String(s.id || '').includes(q) ||
        (s.staffCode || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'NAME_ASC') {
      list.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'vi'));
    } else if (sortBy === 'NAME_DESC') {
      list.sort((a, b) => (b.fullName || '').localeCompare(a.fullName || '', 'vi'));
    } else if (sortBy === 'ROLE') {
      list.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
    }

    return list;
  }, [staffList, roleFilter, statusFilter, searchQuery, sortBy]);

  // Open Create Modal
  const openCreateModal = () => {
    setForm({
      username: '',
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'COACH',
      hireDate: today(),
      specialty: '',
      sportIds: [],
      certification: '',
      experienceYears: '1',
      bio: ''
    });
    setMemberSearchQuery('');
    setFilteredMembers([]);
    setSelectedMember(null);
    setNewSpecialtyName('');
    setCreateMode('DIRECT');
    setCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (staff, e) => {
    e?.stopPropagation();
    setEditingStaff(staff);
    setForm({
      fullName: staff.fullName || '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || 'COACH',
      hireDate: staff.hireDate ? String(staff.hireDate).slice(0, 10) : today(),
      specialty: staff.specialty || '',
      sportIds: (staff.sportIds || []).map(Number),
      certification: staff.certification || '',
      experienceYears: staff.experienceYears ? String(staff.experienceYears) : '',
      bio: staff.bio || ''
    });
  };

  // Open Status Confirm Modal
  const openStatusConfirmModal = (staff, e) => {
    e?.stopPropagation();
    setStatusConfirmStaff(staff);
  };

  // Open Detail Modal
  const openDetailModal = (staff) => {
    setDetailModalStaff(staff);
  };

  const copyId = (id, e) => {
    e?.stopPropagation();
    if (!id) return;
    navigator.clipboard?.writeText(String(id));
    setCopiedId(id);
    showSuccess(`Đã sao chép mã định danh: ${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle Save (Create or Edit)
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (form.role === 'COACH' && !form.sportIds?.length) {
      showError('Vui lòng chọn ít nhất một chuyên môn cho Huấn luyện viên.');
      return;
    }
    setSaving(true);
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff.id, {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          role: form.role,
          hireDate: form.hireDate || null,
          specialty: form.specialty.trim(),
          sportIds: form.role === 'COACH' ? form.sportIds : [],
          certification: form.certification.trim(),
          experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
          bio: form.bio.trim()
        });
        showSuccess('Cập nhật thông tin nhân viên thành công!');
        setEditingStaff(null);
      } else {
        if (createMode === 'APPOINT') {
          if (!selectedMember) {
            showError('Vui lòng tìm và chọn một tài khoản hội viên từ danh sách để bổ nhiệm!');
            setSaving(false);
            return;
          }
          await staffApi.create({
            memberId: selectedMember.id,
            role: form.role,
            hireDate: form.hireDate || today(),
            specialty: form.specialty.trim(),
            sportIds: form.role === 'COACH' ? form.sportIds : [],
            certification: form.certification.trim(),
            experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
            bio: form.bio.trim()
          });
          showSuccess(`Đã bổ nhiệm thành công vai trò [${ROLE_CONFIG[form.role]?.label || form.role}] cho ${selectedMember.fullName}!`);
        } else {
          await staffApi.create({
            username: form.username.trim(),
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            phone: form.phone.trim() || null,
            role: form.role,
            hireDate: form.hireDate || today(),
            specialty: form.specialty.trim(),
            sportIds: form.role === 'COACH' ? form.sportIds : [],
            certification: form.certification.trim(),
            experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
            bio: form.bio.trim()
          });
          showSuccess(`Đã tạo mới nhân viên [${form.fullName}] với vai trò [${ROLE_CONFIG[form.role]?.label || form.role}] thành công!`);
        }
        setCreateModalOpen(false);
      }
      await loadStaff();
    } catch (err) {
      showError(err.message || 'Lỗi lưu thông tin nhân viên');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialty = async () => {
    const name = newSpecialtyName.trim();
    if (!name || addingSpecialty) return;
    setAddingSpecialty(true);
    try {
      const created = await classApi.createSport({ name, description: 'Chuyên môn HLV', status: 'Active' });
      setSports(current => [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
      setForm(current => ({ ...current, sportIds: [...new Set([...(current.sportIds || []), Number(created.id)])] }));
      setNewSpecialtyName('');
      showSuccess(`Đã thêm chuyên môn ${created.name}.`);
    } catch (error) { showError(error.message || 'Không thể thêm chuyên môn.'); }
    finally { setAddingSpecialty(false); }
  };

  const specialtyPicker = (
    <div className="space-y-3">
      <label className={labelClass}>Chuyên môn thể thao *</label>
      {sportsError ? <div role="alert" className="text-sm text-red-700"><p>{sportsError}</p><button type="button" className="underline" onClick={loadSports}>Thử lại</button></div>
        : <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{sports.map(sport => {
          const selected = (form.sportIds || []).includes(Number(sport.id));
          return <button key={sport.id} type="button" disabled={saving || addingSpecialty} aria-pressed={selected}
            onClick={() => setForm(current => ({ ...current, sportIds: selected ? current.sportIds.filter(id => id !== Number(sport.id)) : [...(current.sportIds || []), Number(sport.id)] }))}
            className={`rounded-xl border p-3 text-left text-xs font-bold ${selected ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'}`}>{sport.name}</button>;
        })}{!sports.length && <p className="col-span-full text-sm text-slate-500">Chưa có chuyên môn hoạt động.</p>}</div>}
      <div className="flex gap-2">
        <input aria-label="Tên chuyên môn mới" maxLength={100} className={inputClass} value={newSpecialtyName} onChange={event => setNewSpecialtyName(event.target.value)} placeholder="Thêm chuyên môn mới" />
        <button type="button" disabled={addingSpecialty || saving || !newSpecialtyName.trim()} onClick={handleAddSpecialty} className="shrink-0 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white disabled:opacity-50">{addingSpecialty ? 'Đang thêm...' : 'Thêm'}</button>
      </div>
    </div>
  );

  // Handle Toggle Status
  const handleToggleStatus = async () => {
    if (!statusConfirmStaff) return;
    setSaving(true);
    try {
      await staffApi.toggleStatus(statusConfirmStaff.id);
      showSuccess(`Đã thay đổi trạng thái của ${statusConfirmStaff.fullName} thành công!`);
      setStatusConfirmStaff(null);
      await loadStaff();
    } catch (err) {
      showError(err.message || 'Không thể đổi trạng thái nhân viên');
    } finally {
      setSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('DEFAULT');
  };

  return (
    <div className="space-y-6">
      {/* 1. Luxurious Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 rounded-2xl text-white shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-red-400 text-xs font-bold uppercase tracking-wider mb-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              QUẢN TRỊ NHÂN SỰ · OLYMPIC SCMS
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white">
              Quản lý tài khoản nhân viên
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Quản lý đội ngũ Huấn luyện viên, Lễ tân và Quản trị viên đạt chuẩn Olympic SCMS với phân quyền chuyên nghiệp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadStaff}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>Làm mới</span>
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Thêm nhân viên mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bento KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng nhân sự</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">thành viên</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Toàn bộ nhân sự trong cơ sở</p>
        </div>

        {/* Coaches */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Huấn luyện viên</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">sports</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-orange-600">{stats.coaches}</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
              {stats.total > 0 ? `${Math.round((stats.coaches / stats.total) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">HLV giảng dạy lớp thể thao</p>
        </div>

        {/* Receptionists */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lễ tân quầy</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-purple-600">{stats.receptionists}</span>
            <span className="text-xs text-slate-400 font-medium">nhân viên trực quầy</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Check-in và bán gói tập</p>
        </div>

        {/* Active Accounts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đang hoạt động</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-emerald-600">{stats.activeCount}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              {stats.total > 0 ? `${Math.round((stats.activeCount / stats.total) * 100)}%` : '100%'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Tài khoản hợp lệ và sẵn sàng</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              aria-label="Tìm nhân viên"
              placeholder="Tìm theo họ tên, email, SĐT, chuyên môn hoặc mã nhân viên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                title="Xóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Quick Actions & Sorting */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
              <span className="material-symbols-outlined text-[16px] text-slate-400">sort</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none font-semibold text-slate-800 cursor-pointer"
              >
                <option value="DEFAULT">Sắp xếp: Mặc định</option>
                <option value="NAME_ASC">Họ tên: A → Z</option>
                <option value="NAME_DESC">Họ tên: Z → A</option>
                <option value="ROLE">Theo vai trò</option>
              </select>
            </div>

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'DEFAULT') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs by Role and Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden lg:inline">
              Vai trò:
            </span>
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({staffList.length})
            </button>
            <button
              onClick={() => setRoleFilter('COACH')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'COACH'
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              HLV ({stats.coaches})
            </button>
            <button
              onClick={() => setRoleFilter('RECEPTIONIST')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'RECEPTIONIST'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Lễ tân ({stats.receptionists})
            </button>
            <button
              onClick={() => setRoleFilter('MANAGER')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'MANAGER'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Quản lý ({stats.managers})
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hoạt động
              </button>
              <button
                onClick={() => setStatusFilter('DISABLED')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'DISABLED' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã khóa
              </button>
            </div>
            <span className="text-slate-400">·</span>
            <span className="font-medium text-slate-500">
              Hiển thị <strong className="text-slate-800">{displayedStaff.length}</strong> / {staffList.length}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Table & Loading/Empty states */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12">
          <LoadingSpinner text="Đang tải danh sách nhân sự..." />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-chivo text-xs uppercase tracking-wider">
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-20">Mã ID</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap">Nhân sự</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-32">Vai trò</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">Chuyên môn & Chứng chỉ</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-32">Liên hệ</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-28">Trạng thái</th>
                  <th className="py-3 px-3.5 font-bold text-center whitespace-nowrap w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {displayedStaff.length > 0 ? (
                  displayedStaff.map((staff) => {
                    const roleInfo = ROLE_CONFIG[staff.role] || {
                      label: staff.role,
                      icon: 'person',
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      avatarGrad: 'from-slate-500 to-slate-700'
                    };
                    const isActive = staff.status === 'ACTIVE';

                    return (
                      <tr
                        key={staff.id}
                        onClick={() => openDetailModal(staff)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* ID Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => copyId(staff.id, e)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-2 py-0.5 rounded-lg transition-colors shadow-2xs"
                            title="Nhấn để sao chép ID"
                          >
                            <span className="material-symbols-outlined text-[13px] text-slate-400">badge</span>
                            <span>{staff.id}</span>
                            <span className="material-symbols-outlined text-[11px] text-slate-400">
                              {copiedId === staff.id ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </td>

                        {/* Staff Column */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(staff.fullName, staff.role)} flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0`}>
                              {getInitials(staff.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-red-600 transition-colors whitespace-nowrap text-xs">
                                {staff.fullName}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 whitespace-nowrap">
                                <span className="truncate max-w-[150px]">{staff.email}</span>
                                {staff.username && (
                                  <>
                                    <span>·</span>
                                    <span className="text-slate-400">@{staff.username}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleInfo.badgeClass}`}>
                            <span className="material-symbols-outlined text-[13px]">{roleInfo.icon}</span>
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>

                        {/* Specialty & Certification Column */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">fitness_center</span>
                              <span className="truncate max-w-[160px]">{staff.specialty || 'Vận hành trung tâm'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {staff.certification && (
                                <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                                  {staff.certification}
                                </span>
                              )}
                              {staff.experienceYears && (
                                <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                                  {staff.experienceYears} năm KN
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1 text-slate-700">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">call</span>
                              {staff.phone ? (
                                <a
                                  href={`tel:${staff.phone}`}
                                  onClick={e => e.stopPropagation()}
                                  className="font-semibold hover:text-red-600 transition-colors text-xs"
                                >
                                  {staff.phone}
                                </a>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Chưa có SĐT</span>
                              )}
                            </div>
                            {staff.hireDate && (
                              <div className="text-[10px] text-slate-400">
                                Vào làm: {formatMemberDate(staff.hireDate)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="material-symbols-outlined text-[12px]">lock</span>
                              Đã khóa
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openDetailModal(staff)}
                              className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Xem chi tiết hồ sơ"
                            >
                              <span className="material-symbols-outlined text-[17px]">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openEditModal(staff, e)}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap"
                              title="Chỉnh sửa thông tin"
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openStatusConfirmModal(staff, e)}
                              className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                                isActive
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                              title={isActive ? 'Khóa nhân viên' : 'Kích hoạt lại'}
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {isActive ? 'lock' : 'lock_open'}
                              </span>
                              <span>{isActive ? 'Khóa' : 'Mở'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-3xl">badge</span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-700">Không tìm thấy nhân viên nào</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {searchQuery ? `Không có kết quả nào khớp với "${searchQuery}"` : 'Danh sách nhân sự hiện đang trống.'}
                          </p>
                        </div>
                        {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                          >
                            Xóa bộ lọc & Xem tất cả
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị <span className="font-bold text-slate-800">{displayedStaff.length}</span> trên tổng số <span className="font-bold text-slate-800">{staffList.length}</span> nhân sự trung tâm
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Chuẩn Olympic SCMS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Thêm Nhân Viên Mới (Có 2 chế độ: Tạo trực tiếp & Bổ nhiệm từ hội viên) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => !saving && setCreateModalOpen(false)}
        title="Thêm nhân sự mới vào trung tâm"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Tabs: DIRECT vs APPOINT */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setCreateMode('DIRECT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                createMode === 'DIRECT'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Tạo tài khoản trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('APPOINT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                createMode === 'APPOINT'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">upgrade</span>
              <span>Bổ nhiệm từ hội viên có sẵn</span>
            </button>
          </div>

          <form onSubmit={handleSaveStaff} className="space-y-4">
            {createMode === 'DIRECT' ? (
              /* =================== CHẾ ĐỘ 1: TẠO TRỰC TIẾP =================== */
              <div className="space-y-4">
                <div className="p-3 bg-red-50/70 border border-red-200/60 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-red-600 text-[18px] flex-shrink-0 mt-0.5">info</span>
                  <span>
                    Tạo tài khoản nhân sự mới hoàn chỉnh. Tài khoản sẽ được cấp quyền truy cập theo vai trò đã chọn và có thể đăng nhập ngay.
                  </span>
                </div>

                {/* Chọn vai trò */}
                <div>
                  <label className={labelClass}>Vai trò bổ nhiệm *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['COACH', 'RECEPTIONIST'].map(r => {
                      const cfg = ROLE_CONFIG[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, role: r }))}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            form.role === r
                              ? 'border-red-600 bg-red-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-[22px] ${form.role === r ? 'text-red-600' : 'text-slate-400'}`}>
                              {cfg.icon}
                            </span>
                            <div>
                              <div className={`text-xs font-bold ${form.role === r ? 'text-red-700' : 'text-slate-800'}`}>
                                {cfg.label}
                              </div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{r}</div>
                            </div>
                          </div>
                          {form.role === r && (
                            <span className="material-symbols-outlined text-[18px] text-red-600">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Tên đăng nhập *</label>
                    <input
                      className={inputClass}
                      name="username"
                      required
                      minLength={3}
                      maxLength={100}
                      placeholder="ví dụ: coach.nam"
                      pattern="[a-zA-Z0-9._-]+"
                      value={form.username}
                      onChange={handleFormChange}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Chỉ gồm chữ cái, số, dấu chấm/gạch.</span>
                  </div>

                  <div>
                    <label className={labelClass}>Mật khẩu khởi tạo *</label>
                    <input
                      className={inputClass}
                      type="password"
                      autoComplete="new-password"
                      name="password"
                      required
                      minLength={6}
                      maxLength={128}
                      placeholder="Tối thiểu 6 ký tự"
                      value={form.password}
                      onChange={handleFormChange}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">Mặc định: Staff@123456 nếu để trống</span>
                  </div>

                  <div>
                    <label className={labelClass}>Họ và tên đầy đủ *</label>
                    <input
                      className={inputClass}
                      name="fullName"
                      required
                      maxLength={150}
                      placeholder="ví dụ: Trần Văn Nam"
                      value={form.fullName}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Email đăng nhập & liên hệ *</label>
                    <input
                      className={inputClass}
                      type="email"
                      name="email"
                      required
                      maxLength={150}
                      placeholder="email@sportscenter.vn"
                      value={form.email}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Số điện thoại</label>
                    <input
                      className={inputClass}
                      type="tel"
                      name="phone"
                      maxLength={20}
                      placeholder="0912 345 678"
                      value={form.phone}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Ngày nhận việc</label>
                    <input
                      className={inputClass}
                      type="date"
                      name="hireDate"
                      max={today()}
                      value={form.hireDate}
                      onChange={handleFormChange}
                    />
                  </div>

                  {form.role === 'COACH' && (
                    <>
                      {specialtyPicker}

                      <div>
                        <label className={labelClass}>Chứng chỉ quốc tế</label>
                        <input
                          className={inputClass}
                          name="certification"
                          placeholder="VD: NASM-CPT, AFC Level A..."
                          value={form.certification}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Số năm kinh nghiệm</label>
                        <input
                          className={inputClass}
                          type="number"
                          name="experienceYears"
                          min="0"
                          max="50"
                          placeholder="Số năm kinh nghiệm (VD: 3)"
                          value={form.experienceYears}
                          onChange={handleFormChange}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Tiểu sử / Ghi chú</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    name="bio"
                    placeholder="Mô tả ngắn gọn về kinh nghiệm, thành tích hoặc phân công chuyên môn..."
                    value={form.bio}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            ) : (
              /* =================== CHẾ ĐỘ 2: BỔ NHIỆM TỪ HỘI VIÊN SẴN CÓ =================== */
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-blue-600 text-[18px] flex-shrink-0 mt-0.5">upgrade</span>
                  <span>
                    Chuyển đổi hoặc nâng cấp tài khoản hội viên có sẵn trong hệ thống thành Huấn luyện viên hoặc Lễ tân quầy. Lịch sử và thông tin đăng nhập được giữ nguyên.
                  </span>
                </div>

                {/* Bước 1: Chọn tài khoản */}
                <div className="space-y-2">
                  <label className={labelClass}>1. Tìm tài khoản hội viên cần bổ nhiệm *</label>
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                        search
                      </span>
                      <input
                        type="text"
                        placeholder="Nhập ít nhất 2 ký tự: Tên, Email, SĐT hoặc mã hội viên..."
                        value={memberSearchQuery}
                        onChange={e => {
                          setMemberSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                          setSelectedMember(null);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        className={inputClass}
                      />
                      {memberSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setMemberSearchQuery('');
                            setFilteredMembers([]);
                            setIsDropdownOpen(true);
                          }}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>

                    {/* Dropdown list */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                        {filteredMembers.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 text-center flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">search_off</span>
                            <span>{memberSearchQuery.trim().length < 2 ? 'Nhập ít nhất 2 ký tự để tìm tài khoản.' : `Không tìm thấy tài khoản nào khớp với "${memberSearchQuery}"`}</span>
                          </div>
                        ) : (
                          filteredMembers.map(m => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setSelectedMember(m);
                                setMemberSearchQuery(`${m.fullName} (${m.email})`);
                                setIsDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-red-50/80 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(m.fullName)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                                  {getInitials(m.fullName)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 text-xs truncate">{m.fullName}</span>
                                    {m.memberCode && (
                                      <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                        {m.memberCode}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {m.email} {m.phone ? `• ${m.phone}` : ''}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-red-600 flex-shrink-0 bg-red-50 px-2 py-1 rounded">
                                Chọn
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Member Card */}
                  {selectedMember && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(selectedMember.fullName)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {getInitials(selectedMember.fullName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm truncate">{selectedMember.fullName}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Đã chọn
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 truncate">
                            {selectedMember.email} {selectedMember.phone ? `• SĐT: ${selectedMember.phone}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null);
                          setMemberSearchQuery('');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline flex-shrink-0"
                      >
                        Đổi tài khoản
                      </button>
                    </div>
                  )}
                </div>

                {/* Bước 2: Chọn vai trò muốn trao */}
                <div>
                  <label className={labelClass}>2. Chọn vai trò trao cho tài khoản này *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['COACH', 'RECEPTIONIST'].map(r => {
                      const cfg = ROLE_CONFIG[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, role: r }))}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            form.role === r
                              ? 'border-red-600 bg-red-50/50 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-[22px] ${form.role === r ? 'text-red-600' : 'text-slate-400'}`}>
                              {cfg.icon}
                            </span>
                            <div>
                              <div className={`text-xs font-bold ${form.role === r ? 'text-red-700' : 'text-slate-800'}`}>
                                {cfg.label}
                              </div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{r}</div>
                            </div>
                          </div>
                          {form.role === r && (
                            <span className="material-symbols-outlined text-[18px] text-red-600">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Thông tin bổ sung cho vai trò */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Ngày nhận việc</label>
                    <input
                      className={inputClass}
                      type="date"
                      name="hireDate"
                      max={today()}
                      value={form.hireDate}
                      onChange={handleFormChange}
                    />
                  </div>
                  {form.role === 'COACH' && specialtyPicker}
                  <div>
                    <label className={labelClass}>Chứng chỉ quốc tế</label>
                    <input
                      className={inputClass}
                      name="certification"
                      placeholder="VD: NASM-CPT, AFC..."
                      value={form.certification}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Số năm kinh nghiệm</label>
                    <input
                      className={inputClass}
                      type="number"
                      name="experienceYears"
                      min="0"
                      max="50"
                      placeholder="VD: 3"
                      value={form.experienceYears}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    <span>{createMode === 'DIRECT' ? 'Tạo nhân viên' : 'Xác nhận bổ nhiệm'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 6. Modal: Chỉnh Sửa Nhân Viên */}
      <Modal
        isOpen={Boolean(editingStaff)}
        onClose={() => !saving && setEditingStaff(null)}
        title={editingStaff ? `Chỉnh sửa nhân viên · ${editingStaff.fullName} (ID: ${editingStaff.id})` : 'Chỉnh sửa'}
        maxWidth="max-w-xl"
      >
        {editingStaff && (
          <form onSubmit={handleSaveStaff} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className={labelClass}>Họ và tên nhân viên *</label>
                <input
                  className={inputClass}
                  required
                  name="fullName"
                  maxLength={150}
                  value={form.fullName}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className={labelClass}>Email (Cố định tài khoản)</label>
                <input
                  className={`${inputClass} bg-slate-100 cursor-not-allowed text-slate-500`}
                  disabled
                  value={form.email}
                />
              </div>

              <div>
                <label className={labelClass}>Số điện thoại</label>
                <input
                  className={inputClass}
                  name="phone"
                  type="tel"
                  placeholder="0912 345 678"
                  value={form.phone}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className={labelClass}>Vai trò nhân sự *</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className={`${inputClass} font-semibold`}
                >
                  <option value="COACH">Huấn luyện viên (COACH)</option>
                  <option value="RECEPTIONIST">Lễ tân quầy (RECEPTIONIST)</option>
                  <option value="MANAGER">Quản lý trung tâm (MANAGER)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Ngày nhận việc</label>
                <input
                  className={inputClass}
                  type="date"
                  name="hireDate"
                  value={form.hireDate}
                  onChange={handleFormChange}
                />
              </div>

              {form.role === 'COACH' && specialtyPicker}

              <div>
                <label className={labelClass}>Chứng chỉ đào tạo quốc tế</label>
                <input
                  className={inputClass}
                  name="certification"
                  placeholder="VD: AFC Level A, NASM-CPT"
                  value={form.certification}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className={labelClass}>Số năm kinh nghiệm</label>
                <input
                  className={inputClass}
                  type="number"
                  name="experienceYears"
                  min="0"
                  max="50"
                  value={form.experienceYears}
                  onChange={handleFormChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Tiểu sử / Giới thiệu</label>
                <textarea
                  rows={2}
                  className={inputClass}
                  name="bio"
                  placeholder="Ghi chú về chuyên môn, lịch sử công tác..."
                  value={form.bio}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. Modal: Xem Chi Tiết Nhân Sự */}
      <Modal
        isOpen={Boolean(detailModalStaff)}
        onClose={() => setDetailModalStaff(null)}
        title="Hồ sơ chi tiết nhân viên"
        maxWidth="max-w-2xl"
      >
        {detailModalStaff && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(detailModalStaff.fullName, detailModalStaff.role)} flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0`}>
                {getInitials(detailModalStaff.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">{detailModalStaff.fullName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    detailModalStaff.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {detailModalStaff.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    ID: {detailModalStaff.id}
                  </span>
                  {ROLE_CONFIG[detailModalStaff.role] && (
                    <span className={`font-bold px-2 py-0.5 rounded ${ROLE_CONFIG[detailModalStaff.role].badgeClass}`}>
                      {ROLE_CONFIG[detailModalStaff.role].label}
                    </span>
                  )}
                  {detailModalStaff.username && (
                    <span>Username: @{detailModalStaff.username}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-red-600">contact_phone</span>
                  Thông tin liên hệ
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Email:</span>
                    <a href={`mailto:${detailModalStaff.email}`} className="font-semibold text-blue-600 hover:underline">
                      {detailModalStaff.email}
                    </a>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Số điện thoại:</span>
                    {detailModalStaff.phone ? (
                      <a href={`tel:${detailModalStaff.phone}`} className="font-semibold text-slate-800 hover:text-red-600">
                        {detailModalStaff.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Chưa có</span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Ngày nhận việc:</span>
                    <span className="font-semibold text-slate-800">
                      {formatMemberDate(detailModalStaff.hireDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-red-600">workspace_premium</span>
                  Chuyên môn & Chứng chỉ
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Chuyên môn:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {detailModalStaff.specialty || 'Vận hành trung tâm'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Chứng chỉ:</span>
                    <span className="font-semibold text-red-600 text-right">
                      {detailModalStaff.certification || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">Kinh nghiệm:</span>
                    <span className="font-semibold text-slate-800">
                      {detailModalStaff.experienceYears ? `${detailModalStaff.experienceYears} năm` : 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role details box */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <span className="material-symbols-outlined text-[18px]">security</span>
                <span>Phân quyền chức năng SCMS</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {ROLE_CONFIG[detailModalStaff.role]?.desc || 'Nhân sự có quyền truy cập và thao tác theo đúng vai trò được giao.'}
              </p>
            </div>

            {/* Modal actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDetailModalStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = detailModalStaff;
                  setDetailModalStaff(null);
                  openEditModal(s);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Sửa thông tin</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 8. Modal: Khóa / Mở khóa nhân viên */}
      <Modal
        isOpen={Boolean(statusConfirmStaff)}
        onClose={() => !saving && setStatusConfirmStaff(null)}
        title="Xác nhận trạng thái nhân sự"
        maxWidth="max-w-md"
      >
        {statusConfirmStaff && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              statusConfirmStaff.status === 'ACTIVE'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="material-symbols-outlined text-[24px] flex-shrink-0">
                {statusConfirmStaff.status === 'ACTIVE' ? 'warning' : 'lock_open'}
              </span>
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">
                  {statusConfirmStaff.status === 'ACTIVE'
                    ? `Khóa tài khoản của "${statusConfirmStaff.fullName}"?`
                    : `Mở khóa tài khoản của "${statusConfirmStaff.fullName}"?`}
                </p>
                <p className="leading-relaxed">
                  {statusConfirmStaff.status === 'ACTIVE'
                    ? 'Khi bị khóa, nhân viên sẽ không thể đăng nhập vào ứng dụng quản lý, không thể điểm danh ca dạy hoặc thực hiện bất kỳ nghiệp vụ nào.'
                    : 'Khi mở khóa, nhân viên sẽ khôi phục toàn bộ quyền truy cập và thực hiện nhiệm vụ bình thường.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={saving}
                onClick={() => setStatusConfirmStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleToggleStatus}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  statusConfirmStaff.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                {saving ? 'Đang cập nhật...' : (statusConfirmStaff.status === 'ACTIVE' ? 'Xác nhận khóa' : 'Xác nhận mở khóa')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
