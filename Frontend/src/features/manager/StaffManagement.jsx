import React, { useState, useEffect, useRef, useMemo } from 'react';
import { staffApi, classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { formatMemberDate } from '../member/memberOverview.js';

const getRoleConfig = (isEn) => ({
  COACH: {
    label: isEn ? 'Coach / Instructor' : 'Huấn luyện viên',
    shortLabel: isEn ? 'Coach' : 'HLV',
    icon: 'sports',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    avatarGrad: 'from-amber-600 to-amber-700',
    desc: isEn
      ? 'Responsible for teaching sports classes, tracking session attendance, and designing workout regimens.'
      : 'Phụ trách giảng dạy các lớp thể thao, điểm danh ca học và xây dựng giáo án huấn luyện.'
  },
  RECEPTIONIST: {
    label: isEn ? 'Front Desk Receptionist' : 'Lễ tân quầy',
    shortLabel: isEn ? 'Receptionist' : 'Lễ tân',
    icon: 'support_agent',
    badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    avatarGrad: 'from-indigo-600 to-indigo-800',
    desc: isEn
      ? 'Handles gate check-in, counter package sales, invoices, and customer support inquiries.'
      : 'Quét thẻ check-in vào cổng, thu ngân bán gói tập tại quầy và tiếp nhận yêu cầu hỗ trợ.'
  },
  MANAGER: {
    label: isEn ? 'Center Manager' : 'Quản lý trung tâm',
    shortLabel: isEn ? 'Manager' : 'Quản lý',
    icon: 'admin_panel_settings',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    avatarGrad: 'from-[#2D6A4F] to-[#1B4332]',
    desc: isEn
      ? 'Operates center facilities, staff assignments, class timetables, and Olympic SCMS operations.'
      : 'Vận hành toàn bộ cơ sở vật chất, nhân sự, lịch học và phân quyền hệ thống SCMS.'
  },
  ADMIN: {
    label: isEn ? 'System Administrator' : 'Quản trị viên',
    shortLabel: 'Admin',
    icon: 'shield_person',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    avatarGrad: 'from-[#1E2235] to-[#2B2D42]',
    desc: isEn
      ? 'Highest security administrator for system audit logs, user permissions, and cloud servers.'
      : 'Quản trị tối cao toàn bộ cụm trung tâm và cấu hình máy chủ SCMS.'
  }
});

const AVATAR_GRADIENTS = [
  'from-[#2D6A4F] to-[#1B4332]',
  'from-[#1E2235] to-[#2B2D42]',
  'from-teal-600 to-emerald-800',
  'from-amber-600 to-amber-700',
  'from-indigo-600 to-slate-800',
  'from-cyan-600 to-blue-700',
  'from-rose-600 to-rose-800'
];

function getAvatarGradient(name = '', role = '', roleConfig = {}) {
  if (role && roleConfig[role]?.avatarGrad) {
    return roleConfig[role].avatarGrad;
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

const inputClass =
  'w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition-all';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5';
const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);

export function StaffManagement() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const roleConfig = useMemo(() => getRoleConfig(isEn), [isEn]);

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
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

  // Load staff list
  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await staffApi.getAll();
      setStaffList(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      showError(err.message || (isEn ? 'Cannot load staff directory' : 'Không thể tải danh sách nhân viên'));
    } finally {
      setLoading(false);
    }
  };

  // Load active sports
  const loadSports = async () => {
    setSportsError('');
    try {
      const data = await classApi.getSports();
      setSports(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setSportsError(err.message || (isEn ? 'Cannot load sports' : 'Không thể tải danh sách chuyên môn'));
    }
  };

  useEffect(() => {
    loadStaff();
    loadSports();
  }, []);

  // Filter members for Appointment dropdown
  useEffect(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (q.length < 2) {
      setFilteredMembers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await staffApi.searchMembers(q);
        setFilteredMembers(Array.isArray(res) ? res : res?.items || []);
      } catch {
        setFilteredMembers([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  // Click outside to close appointment dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = staffList.length;
    const coaches = staffList.filter((s) => s.role === 'COACH').length;
    const receptionists = staffList.filter((s) => s.role === 'RECEPTIONIST').length;
    const managers = staffList.filter((s) => s.role === 'MANAGER' || s.role === 'ADMIN').length;
    const activeCount = staffList.filter((s) => s.status === 'ACTIVE').length;
    const disabledCount = total - activeCount;
    return { total, coaches, receptionists, managers, activeCount, disabledCount };
  }, [staffList]);

  // Filtered & Sorted Staff
  const displayedStaff = useMemo(() => {
    let list = [...staffList];

    // Filter by role
    if (roleFilter !== 'ALL') {
      list = list.filter((s) => s.role === roleFilter);
    }

    // Filter by status
    if (statusFilter === 'ACTIVE') {
      list = list.filter((s) => s.status === 'ACTIVE');
    } else if (statusFilter === 'DISABLED') {
      list = list.filter((s) => s.status !== 'ACTIVE');
    }

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
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
    showSuccess(isEn ? `Copied Staff ID: ${id}` : `Đã sao chép mã định danh: ${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Save (Create or Edit)
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (form.role === 'COACH' && !form.sportIds?.length) {
      showError(isEn ? 'Please select at least one sport specialty for the Coach.' : 'Vui lòng chọn ít nhất một chuyên môn cho Huấn luyện viên.');
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
        showSuccess(isEn ? 'Staff member profile updated successfully!' : 'Cập nhật thông tin nhân viên thành công!');
        setEditingStaff(null);
      } else {
        if (createMode === 'APPOINT') {
          if (!selectedMember) {
            showError(isEn ? 'Please search and select a member account to appoint!' : 'Vui lòng tìm và chọn một tài khoản hội viên từ danh sách để bổ nhiệm!');
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
          showSuccess(
            isEn
              ? `Successfully appointed role [${roleConfig[form.role]?.label || form.role}] to ${selectedMember.fullName}!`
              : `Đã bổ nhiệm thành công vai trò [${roleConfig[form.role]?.label || form.role}] cho ${selectedMember.fullName}!`
          );
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
          showSuccess(
            isEn
              ? `Created new staff [${form.fullName}] with role [${roleConfig[form.role]?.label || form.role}] successfully!`
              : `Đã tạo mới nhân viên [${form.fullName}] với vai trò [${roleConfig[form.role]?.label || form.role}] thành công!`
          );
        }
        setCreateModalOpen(false);
      }
      await loadStaff();
    } catch (err) {
      showError(err.message || (isEn ? 'Error saving staff member' : 'Lỗi lưu thông tin nhân viên'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialty = async () => {
    const name = newSpecialtyName.trim();
    if (!name || addingSpecialty) return;
    setAddingSpecialty(true);
    try {
      const created = await classApi.createSport({ name, description: isEn ? 'Coach Specialty' : 'Chuyên môn HLV', status: 'Active' });
      setSports((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
      setForm((current) => ({ ...current, sportIds: [...new Set([...(current.sportIds || []), Number(created.id)])] }));
      setNewSpecialtyName('');
      showSuccess(isEn ? `Added specialty ${created.name}.` : `Đã thêm chuyên môn ${created.name}.`);
    } catch (error) {
      showError(error.message || (isEn ? 'Cannot add specialty.' : 'Không thể thêm chuyên môn.'));
    } finally {
      setAddingSpecialty(false);
    }
  };

  const specialtyPicker = (
    <div className="space-y-3 sm:col-span-2">
      <label className={labelClass}>{isEn ? 'Sport Disciplines / Specialties *' : 'Chuyên môn thể thao *'}</label>
      {sportsError ? (
        <div role="alert" className="text-sm text-rose-700 dark:text-rose-400">
          <p>{sportsError}</p>
          <button type="button" className="underline font-bold" onClick={loadSports}>
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sports.map((sport) => {
            const selected = (form.sportIds || []).includes(Number(sport.id));
            return (
              <button
                key={sport.id}
                type="button"
                disabled={saving || addingSpecialty}
                aria-pressed={selected}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    sportIds: selected
                      ? current.sportIds.filter((id) => id !== Number(sport.id))
                      : [...(current.sportIds || []), Number(sport.id)]
                  }))
                }
                className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all ${
                  selected
                    ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#81B29A] dark:border-[#81B29A]'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {sport.name}
              </button>
            );
          })}
          {!sports.length && (
            <p className="col-span-full text-xs text-slate-500 dark:text-slate-400">
              {isEn ? 'No active sport disciplines.' : 'Chưa có chuyên môn hoạt động.'}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          aria-label={isEn ? 'New specialty name' : 'Tên chuyên môn mới'}
          maxLength={100}
          className={inputClass}
          value={newSpecialtyName}
          onChange={(event) => setNewSpecialtyName(event.target.value)}
          placeholder={isEn ? 'Add new sport discipline...' : 'Thêm chuyên môn mới...'}
        />
        <button
          type="button"
          disabled={addingSpecialty || saving || !newSpecialtyName.trim()}
          onClick={handleAddSpecialty}
          className="shrink-0 rounded-xl bg-[#1E2235] hover:bg-[#2B2D42] px-4 text-xs font-bold text-white disabled:opacity-50 transition-colors"
        >
          {addingSpecialty ? (isEn ? 'Adding...' : 'Đang thêm...') : isEn ? 'Add' : 'Thêm'}
        </button>
      </div>
    </div>
  );

  // Handle Toggle Status
  const handleToggleStatus = async () => {
    if (!statusConfirmStaff) return;
    setSaving(true);
    try {
      await staffApi.toggleStatus(statusConfirmStaff.id);
      showSuccess(
        isEn
          ? `Changed status for ${statusConfirmStaff.fullName} successfully!`
          : `Đã thay đổi trạng thái của ${statusConfirmStaff.fullName} thành công!`
      );
      setStatusConfirmStaff(null);
      await loadStaff();
    } catch (err) {
      showError(err.message || (isEn ? 'Cannot toggle staff status' : 'Không thể đổi trạng thái nhân viên'));
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
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 -mb-16 h-48 w-48 rounded-full bg-[#F2CC8F]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2CC8F]/20 backdrop-blur-md text-[#F2CC8F] text-xs font-black uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[14px]">badge</span>
              {isEn ? 'Human Resources · SCMS' : 'Quản trị nhân sự · Olympic SCMS'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white">
              {isEn ? 'Staff & Team Management' : 'Quản lý tài khoản nhân viên'}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              {isEn
                ? 'Manage coaches, front desk receptionists, and system managers with granular role assignments.'
                : 'Quản lý đội ngũ Huấn luyện viên, Lễ tân và Quản trị viên đạt chuẩn Olympic SCMS với phân quyền chuyên nghiệp.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadStaff}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 transition-all hover-lift disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#2D6A4F]/30 transition-all hover-lift"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>{isEn ? 'Add Staff' : 'Thêm nhân viên mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bento KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Total Staff' : 'Tổng nhân sự'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-slate-900 dark:text-slate-100">{stats.total}</span>
            <span className="text-xs text-slate-400 font-medium">{isEn ? 'members' : 'thành viên'}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'All staff across center' : 'Toàn bộ nhân sự trong cơ sở'}
          </p>
        </div>

        {/* Coaches */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Coaches' : 'Huấn luyện viên'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">sports</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-amber-600 dark:text-amber-400">{stats.coaches}</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
              {stats.total > 0 ? `${Math.round((stats.coaches / stats.total) * 100)}%` : '0%'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Athletic training specialists' : 'HLV giảng dạy lớp thể thao'}
          </p>
        </div>

        {/* Receptionists */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover-lift transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Receptionists' : 'Lễ tân quầy'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-chivo text-indigo-600 dark:text-indigo-400">{stats.receptionists}</span>
            <span className="text-xs text-slate-400 font-medium">{isEn ? 'front-desk staff' : 'nhân viên trực quầy'}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Gate check-in & counter cashier' : 'Check-in và bán gói tập'}
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
            <span className="text-3xl font-black font-chivo text-emerald-600 dark:text-emerald-400">{stats.activeCount}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              {stats.total > 0 ? `${Math.round((stats.activeCount / stats.total) * 100)}%` : '100%'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isEn ? 'Authorized & shift ready' : 'Tài khoản hợp lệ và sẵn sàng'}
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              aria-label={isEn ? 'Search staff' : 'Tìm nhân viên'}
              placeholder={isEn ? 'Search by name, email, phone, specialty or staff ID...' : 'Tìm theo họ tên, email, SĐT, chuyên môn hoặc mã nhân viên...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

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
                <option value="ROLE" className="dark:bg-slate-800">{isEn ? 'By Role' : 'Theo vai trò'}</option>
              </select>
            </div>

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'DEFAULT') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span className="hidden sm:inline">{isEn ? 'Reset' : 'Đặt lại'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs by Role and Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden lg:inline">
              {isEn ? 'Role:' : 'Vai trò:'}
            </span>
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-[#1E2235] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isEn ? 'All' : 'Tất cả'} ({staffList.length})
            </button>
            <button
              onClick={() => setRoleFilter('COACH')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'COACH'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
            >
              {isEn ? 'Coaches' : 'HLV'} ({stats.coaches})
            </button>
            <button
              onClick={() => setRoleFilter('RECEPTIONIST')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'RECEPTIONIST'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
              }`}
            >
              {isEn ? 'Receptionists' : 'Lễ tân'} ({stats.receptionists})
            </button>
            <button
              onClick={() => setRoleFilter('MANAGER')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'MANAGER'
                  ? 'bg-[#2D6A4F] text-white shadow-sm shadow-[#2D6A4F]/20'
                  : 'bg-[#2D6A4F]/10 text-[#2D6A4F] dark:text-[#81B29A] hover:bg-[#2D6A4F]/20'
              }`}
            >
              {isEn ? 'Managers' : 'Quản lý'} ({stats.managers})
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isEn ? 'All' : 'Tất cả'}
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isEn ? 'Active' : 'Hoạt động'}
              </button>
              <button
                onClick={() => setStatusFilter('DISABLED')}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'DISABLED'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isEn ? 'Locked' : 'Đã khóa'}
              </button>
            </div>
            <span className="text-slate-400">·</span>
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {isEn ? 'Showing' : 'Hiển thị'} <strong className="text-slate-800 dark:text-slate-200">{displayedStaff.length}</strong> / {staffList.length}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Table & Loading/Empty states */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12">
          <LoadingSpinner text={isEn ? 'Loading staff directory...' : 'Đang tải danh sách nhân sự...'} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-chivo text-xs uppercase tracking-wider">
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-20">{isEn ? 'Staff ID' : 'Mã ID'}</th>
                  <th className="py-3 px-3.5 font-bold whitespace-nowrap">{isEn ? 'Staff' : 'Nhân sự'}</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-32">{isEn ? 'Role' : 'Vai trò'}</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap">{isEn ? 'Specialty & Credentials' : 'Chuyên môn & Chứng chỉ'}</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-32">{isEn ? 'Contact' : 'Liên hệ'}</th>
                  <th className="py-3 px-3 font-bold whitespace-nowrap w-28">{isEn ? 'Status' : 'Trạng thái'}</th>
                  <th className="py-3 px-3.5 font-bold text-center whitespace-nowrap w-32">{isEn ? 'Actions' : 'Thao tác'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                {displayedStaff.length > 0 ? (
                  displayedStaff.map((staff) => {
                    const roleInfo = roleConfig[staff.role] || {
                      label: staff.role,
                      icon: 'person',
                      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                      avatarGrad: 'from-slate-500 to-slate-700'
                    };
                    const isActive = staff.status === 'ACTIVE';

                    return (
                      <tr
                        key={staff.id}
                        onClick={() => openDetailModal(staff)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* ID Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => copyId(staff.id, e)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 rounded-lg transition-colors shadow-2xs"
                            title={isEn ? 'Click to copy ID' : 'Nhấn để sao chép ID'}
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
                            <div
                              className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                staff.fullName,
                                staff.role,
                                roleConfig
                              )} flex items-center justify-center text-white font-black text-xs shadow-sm flex-shrink-0`}
                            >
                              {getInitials(staff.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#2D6A4F] dark:group-hover:text-[#81B29A] transition-colors whitespace-nowrap text-xs">
                                {staff.fullName}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
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
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleInfo.badgeClass}`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{roleInfo.icon}</span>
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>

                        {/* Specialty & Certification Column */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">fitness_center</span>
                              <span className="truncate max-w-[160px]">
                                {staff.specialty || (isEn ? 'Center Operations' : 'Vận hành trung tâm')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {staff.certification && (
                                <span className="text-[9px] font-bold text-[#2D6A4F] dark:text-[#81B29A] bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 px-1.5 py-0.2 rounded">
                                  {staff.certification}
                                </span>
                              )}
                              {staff.experienceYears && (
                                <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                  {staff.experienceYears} {isEn ? 'yrs exp' : 'năm KN'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">call</span>
                              {staff.phone ? (
                                <a
                                  href={`tel:${staff.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold hover:text-[#2D6A4F] dark:hover:text-[#81B29A] transition-colors text-xs"
                                >
                                  {staff.phone}
                                </a>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">{isEn ? 'No phone' : 'Chưa có SĐT'}</span>
                              )}
                            </div>
                            {staff.hireDate && (
                              <div className="text-[10px] text-slate-400">
                                {isEn ? 'Hired:' : 'Vào làm:'} {formatMemberDate(staff.hireDate)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {isEn ? 'Active' : 'Hoạt động'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <span className="material-symbols-outlined text-[12px]">lock</span>
                              {isEn ? 'Locked' : 'Đã khóa'}
                            </span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openDetailModal(staff)}
                              className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={isEn ? 'View staff details' : 'Xem chi tiết hồ sơ'}
                            >
                              <span className="material-symbols-outlined text-[17px]">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openEditModal(staff, e)}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                              title={isEn ? 'Edit information' : 'Chỉnh sửa thông tin'}
                            >
                              <span className="material-symbols-outlined text-[13px]">edit</span>
                              <span>{isEn ? 'Edit' : 'Sửa'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => openStatusConfirmModal(staff, e)}
                              className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                                isActive
                                  ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                                  : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                              }`}
                              title={isActive ? (isEn ? 'Lock staff' : 'Khóa nhân viên') : isEn ? 'Activate staff' : 'Kích hoạt lại'}
                            >
                              <span className="material-symbols-outlined text-[13px]">{isActive ? 'lock' : 'lock_open'}</span>
                              <span>{isActive ? (isEn ? 'Lock' : 'Khóa') : isEn ? 'Unlock' : 'Mở'}</span>
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
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-3xl">badge</span>
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                            {isEn ? 'No staff members found' : 'Không tìm thấy nhân viên nào'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {searchQuery
                              ? isEn
                                ? `No results match "${searchQuery}"`
                                : `Không có kết quả nào khớp với "${searchQuery}"`
                              : isEn
                              ? 'Staff directory is currently empty.'
                              : 'Danh sách nhân sự hiện đang trống.'}
                          </p>
                        </div>
                        {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                          <button
                            onClick={handleResetFilters}
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

          {/* Table Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              {isEn ? 'Showing' : 'Hiển thị'} <span className="font-bold text-slate-800 dark:text-slate-200">{displayedStaff.length}</span>{' '}
              {isEn ? 'of' : 'trên tổng số'} <span className="font-bold text-slate-800 dark:text-slate-200">{staffList.length}</span>{' '}
              {isEn ? 'staff members' : 'nhân sự trung tâm'}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {isEn ? 'Olympic SCMS Standard' : 'Chuẩn Olympic SCMS'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Add New Staff (Direct or Appoint) */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => !saving && setCreateModalOpen(false)}
        title={isEn ? 'Add New Staff to Sports Center' : 'Thêm nhân sự mới vào trung tâm'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Tabs: DIRECT vs APPOINT */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setCreateMode('DIRECT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                createMode === 'DIRECT'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>{isEn ? 'Create Direct Account' : 'Tạo tài khoản trực tiếp'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('APPOINT')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                createMode === 'APPOINT'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">upgrade</span>
              <span>{isEn ? 'Appoint Existing Member' : 'Bổ nhiệm từ hội viên có sẵn'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveStaff} className="space-y-4">
            {createMode === 'DIRECT' ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#2D6A4F] dark:text-[#81B29A] text-[18px] flex-shrink-0 mt-0.5">info</span>
                  <span>
                    {isEn
                      ? 'Creates a complete new staff account. Access rights will be granted according to the selected role and they can log in right away.'
                      : 'Tạo tài khoản nhân sự mới hoàn chỉnh. Tài khoản sẽ được cấp quyền truy cập theo vai trò đã chọn và có thể đăng nhập ngay.'}
                  </span>
                </div>

                {/* Role selection */}
                <div>
                  <label className={labelClass}>{isEn ? 'Staff Role *' : 'Vai trò bổ nhiệm *'}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['COACH', 'RECEPTIONIST'].map((r) => {
                      const cfg = roleConfig[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, role: r }))}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            form.role === r
                              ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-[22px] ${form.role === r ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-400'}`}>
                              {cfg.icon}
                            </span>
                            <div>
                              <div className={`text-xs font-bold ${form.role === r ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-800 dark:text-slate-200'}`}>
                                {cfg.label}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{r}</div>
                            </div>
                          </div>
                          {form.role === r && (
                            <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A]">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>{isEn ? 'Username *' : 'Tên đăng nhập *'}</label>
                    <input
                      className={inputClass}
                      name="username"
                      required
                      minLength={3}
                      maxLength={100}
                      placeholder={isEn ? 'e.g. coach.nam' : 'ví dụ: coach.nam'}
                      pattern="[a-zA-Z0-9._-]+"
                      value={form.username}
                      onChange={handleFormChange}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {isEn ? 'Letters, numbers, dots/dashes only.' : 'Chỉ gồm chữ cái, số, dấu chấm/gạch.'}
                    </span>
                  </div>

                  <div>
                    <label className={labelClass}>{isEn ? 'Initial Password *' : 'Mật khẩu khởi tạo *'}</label>
                    <input
                      className={inputClass}
                      type="password"
                      autoComplete="new-password"
                      name="password"
                      required
                      minLength={6}
                      maxLength={128}
                      placeholder={isEn ? 'Minimum 6 characters' : 'Tối thiểu 6 ký tự'}
                      value={form.password}
                      onChange={handleFormChange}
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {isEn ? 'Default: Staff@123456 if left empty' : 'Mặc định: Staff@123456 nếu để trống'}
                    </span>
                  </div>

                  <div>
                    <label className={labelClass}>{isEn ? 'Full Name *' : 'Họ và tên đầy đủ *'}</label>
                    <input
                      className={inputClass}
                      name="fullName"
                      required
                      maxLength={150}
                      placeholder={isEn ? 'e.g. Tran Van Nam' : 'ví dụ: Trần Văn Nam'}
                      value={form.fullName}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{isEn ? 'Contact & Login Email *' : 'Email đăng nhập & liên hệ *'}</label>
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
                    <label className={labelClass}>{isEn ? 'Phone Number' : 'Số điện thoại'}</label>
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
                    <label className={labelClass}>{isEn ? 'Hire Date' : 'Ngày nhận việc'}</label>
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
                        <label className={labelClass}>{isEn ? 'Certifications' : 'Chứng chỉ quốc tế'}</label>
                        <input
                          className={inputClass}
                          name="certification"
                          placeholder={isEn ? 'e.g. NASM-CPT, AFC Level A...' : 'VD: NASM-CPT, AFC Level A...'}
                          value={form.certification}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>{isEn ? 'Years of Experience' : 'Số năm kinh nghiệm'}</label>
                        <input
                          className={inputClass}
                          type="number"
                          name="experienceYears"
                          min="0"
                          max="50"
                          placeholder={isEn ? 'e.g. 3' : 'Số năm kinh nghiệm (VD: 3)'}
                          value={form.experienceYears}
                          onChange={handleFormChange}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className={labelClass}>{isEn ? 'Biography / Notes' : 'Tiểu sử / Ghi chú'}</label>
                  <textarea
                    rows={2}
                    className={inputClass}
                    name="bio"
                    placeholder={isEn ? 'Brief description about coaching background, achievements...' : 'Mô tả ngắn gọn về kinh nghiệm, thành tích hoặc phân công chuyên môn...'}
                    value={form.bio}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            ) : (
              /* APPOINT MODE */
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[18px] flex-shrink-0 mt-0.5">upgrade</span>
                  <span>
                    {isEn
                      ? 'Promotes an existing member account to Coach or Receptionist. Their login history and credentials will remain intact.'
                      : 'Chuyển đổi hoặc nâng cấp tài khoản hội viên có sẵn trong hệ thống thành Huấn luyện viên hoặc Lễ tân quầy. Lịch sử và thông tin đăng nhập được giữ nguyên.'}
                  </span>
                </div>

                {/* Step 1: Member search */}
                <div className="space-y-2">
                  <label className={labelClass}>{isEn ? '1. Find member account to appoint *' : '1. Tìm tài khoản hội viên cần bổ nhiệm *'}</label>
                  <div className="relative" ref={dropdownRef}>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
                      <input
                        type="text"
                        placeholder={isEn ? 'Type at least 2 chars: Name, Email, Phone or Member ID...' : 'Nhập ít nhất 2 ký tự: Tên, Email, SĐT hoặc mã hội viên...'}
                        value={memberSearchQuery}
                        onChange={(e) => {
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
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>

                    {isDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredMembers.length === 0 ? (
                          <div className="p-3 text-xs text-slate-500 dark:text-slate-400 text-center flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-slate-400 text-[20px]">search_off</span>
                            <span>
                              {memberSearchQuery.trim().length < 2
                                ? isEn
                                  ? 'Enter at least 2 characters to search accounts.'
                                  : 'Nhập ít nhất 2 ký tự để tìm tài khoản.'
                                : isEn
                                ? `No accounts match "${memberSearchQuery}"`
                                : `Không tìm thấy tài khoản nào khớp với "${memberSearchQuery}"`}
                            </span>
                          </div>
                        ) : (
                          filteredMembers.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setSelectedMember(m);
                                setMemberSearchQuery(`${m.fullName} (${m.email})`);
                                setIsDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-emerald-50/80 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                    m.fullName
                                  )} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                                >
                                  {getInitials(m.fullName)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">{m.fullName}</span>
                                    {m.memberCode && (
                                      <span className="font-mono text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                        {m.memberCode}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    {m.email} {m.phone ? `• ${m.phone}` : ''}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#2D6A4F] dark:text-[#81B29A] flex-shrink-0 bg-[#2D6A4F]/10 px-2 py-1 rounded">
                                {isEn ? 'Select' : 'Chọn'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedMember && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                            selectedMember.fullName
                          )} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                        >
                          {getInitials(selectedMember.fullName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{selectedMember.fullName}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                              {isEn ? 'Selected' : 'Đã chọn'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {selectedMember.email} {selectedMember.phone ? `• ${isEn ? 'Tel' : 'SĐT'}: ${selectedMember.phone}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null);
                          setMemberSearchQuery('');
                        }}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold hover:underline flex-shrink-0"
                      >
                        {isEn ? 'Change' : 'Đổi tài khoản'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 2: Role selection */}
                <div>
                  <label className={labelClass}>{isEn ? '2. Select Role to Assign *' : '2. Chọn vai trò trao cho tài khoản này *'}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['COACH', 'RECEPTIONIST'].map((r) => {
                      const cfg = roleConfig[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, role: r }))}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            form.role === r
                              ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`material-symbols-outlined text-[22px] ${form.role === r ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-400'}`}>
                              {cfg.icon}
                            </span>
                            <div>
                              <div className={`text-xs font-bold ${form.role === r ? 'text-[#2D6A4F] dark:text-[#81B29A]' : 'text-slate-800 dark:text-slate-200'}`}>
                                {cfg.label}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{r}</div>
                            </div>
                          </div>
                          {form.role === r && (
                            <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A]">check_circle</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{isEn ? 'Hire Date' : 'Ngày nhận việc'}</label>
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
                    <label className={labelClass}>{isEn ? 'Certifications' : 'Chứng chỉ quốc tế'}</label>
                    <input
                      className={inputClass}
                      name="certification"
                      placeholder={isEn ? 'e.g. NASM-CPT, AFC...' : 'VD: NASM-CPT, AFC...'}
                      value={form.certification}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{isEn ? 'Years of Experience' : 'Số năm kinh nghiệm'}</label>
                    <input
                      className={inputClass}
                      type="number"
                      name="experienceYears"
                      min="0"
                      max="50"
                      placeholder={isEn ? 'e.g. 3' : 'VD: 3'}
                      value={form.experienceYears}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isEn ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#2D6A4F]/30 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    <span>{createMode === 'DIRECT' ? (isEn ? 'Create Staff' : 'Tạo nhân viên') : isEn ? 'Confirm Appointment' : 'Xác nhận bổ nhiệm'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* 6. Modal: Edit Staff */}
      <Modal
        isOpen={Boolean(editingStaff)}
        onClose={() => !saving && setEditingStaff(null)}
        title={
          editingStaff
            ? isEn
              ? `Edit Staff Member · ${editingStaff.fullName} (ID: ${editingStaff.id})`
              : `Chỉnh sửa nhân viên · ${editingStaff.fullName} (ID: ${editingStaff.id})`
            : isEn
            ? 'Edit Staff'
            : 'Chỉnh sửa'
        }
        maxWidth="max-w-xl"
      >
        {editingStaff && (
          <form onSubmit={handleSaveStaff} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className={labelClass}>{isEn ? 'Full Name *' : 'Họ và tên nhân viên *'}</label>
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
                <label className={labelClass}>{isEn ? 'Email (Permanent Account ID)' : 'Email (Cố định tài khoản)'}</label>
                <input
                  className={`${inputClass} bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed text-slate-500`}
                  disabled
                  value={form.email}
                />
              </div>

              <div>
                <label className={labelClass}>{isEn ? 'Phone Number' : 'Số điện thoại'}</label>
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
                <label className={labelClass}>{isEn ? 'Role *' : 'Vai trò nhân sự *'}</label>
                <select name="role" value={form.role} onChange={handleFormChange} className={`${inputClass} font-semibold`}>
                  <option value="COACH">{isEn ? 'Coach / Instructor (COACH)' : 'Huấn luyện viên (COACH)'}</option>
                  <option value="RECEPTIONIST">{isEn ? 'Front Desk Receptionist (RECEPTIONIST)' : 'Lễ tân quầy (RECEPTIONIST)'}</option>
                  <option value="MANAGER">{isEn ? 'Center Manager (MANAGER)' : 'Quản lý trung tâm (MANAGER)'}</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>{isEn ? 'Hire Date' : 'Ngày nhận việc'}</label>
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
                <label className={labelClass}>{isEn ? 'Certifications' : 'Chứng chỉ đào tạo quốc tế'}</label>
                <input
                  className={inputClass}
                  name="certification"
                  placeholder={isEn ? 'e.g. AFC Level A, NASM-CPT' : 'VD: AFC Level A, NASM-CPT'}
                  value={form.certification}
                  onChange={handleFormChange}
                />
              </div>

              <div>
                <label className={labelClass}>{isEn ? 'Years of Experience' : 'Số năm kinh nghiệm'}</label>
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
                <label className={labelClass}>{isEn ? 'Biography / Introduction' : 'Tiểu sử / Giới thiệu'}</label>
                <textarea
                  rows={2}
                  className={inputClass}
                  name="bio"
                  placeholder={isEn ? 'Notes on expertise, career history...' : 'Ghi chú về chuyên môn, lịch sử công tác...'}
                  value={form.bio}
                  onChange={handleFormChange}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {isEn ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#2D6A4F]/30 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>{isEn ? 'Save Changes' : 'Lưu thay đổi'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* 7. Modal: View Staff Details */}
      <Modal
        isOpen={Boolean(detailModalStaff)}
        onClose={() => setDetailModalStaff(null)}
        title={isEn ? 'Staff Profile Details' : 'Hồ sơ chi tiết nhân viên'}
        maxWidth="max-w-2xl"
      >
        {detailModalStaff && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                  detailModalStaff.fullName,
                  detailModalStaff.role,
                  roleConfig
                )} flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0`}
              >
                {getInitials(detailModalStaff.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{detailModalStaff.fullName}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      detailModalStaff.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {detailModalStaff.status === 'ACTIVE' ? (isEn ? 'Active' : 'Hoạt động') : isEn ? 'Locked' : 'Đã khóa'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    ID: {detailModalStaff.id}
                  </span>
                  {roleConfig[detailModalStaff.role] && (
                    <span className={`font-bold px-2 py-0.5 rounded ${roleConfig[detailModalStaff.role].badgeClass}`}>
                      {roleConfig[detailModalStaff.role].label}
                    </span>
                  )}
                  {detailModalStaff.username && <span>Username: @{detailModalStaff.username}</span>}
                </div>
              </div>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">contact_phone</span>
                  {isEn ? 'Contact Information' : 'Thông tin liên hệ'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Email:</span>
                    <a href={`mailto:${detailModalStaff.email}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                      {detailModalStaff.email}
                    </a>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Phone:' : 'Số điện thoại:'}</span>
                    {detailModalStaff.phone ? (
                      <a href={`tel:${detailModalStaff.phone}`} className="font-semibold text-slate-800 dark:text-slate-200 hover:text-[#2D6A4F]">
                        {detailModalStaff.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">{isEn ? 'None' : 'Chưa có'}</span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Hire Date:' : 'Ngày nhận việc:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatMemberDate(detailModalStaff.hireDate)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#2D6A4F] dark:text-[#81B29A]">workspace_premium</span>
                  {isEn ? 'Specialty & Credentials' : 'Chuyên môn & Chứng chỉ'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Specialty:' : 'Chuyên môn:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                      {detailModalStaff.specialty || (isEn ? 'Center Operations' : 'Vận hành trung tâm')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Certifications:' : 'Chứng chỉ:'}</span>
                    <span className="font-semibold text-[#2D6A4F] dark:text-[#81B29A] text-right">
                      {detailModalStaff.certification || (isEn ? 'Not provided' : 'Chưa cung cấp')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <span className="text-slate-500 dark:text-slate-400">{isEn ? 'Experience:' : 'Kinh nghiệm:'}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {detailModalStaff.experienceYears
                        ? isEn
                          ? `${detailModalStaff.experienceYears} years`
                          : `${detailModalStaff.experienceYears} năm`
                        : isEn
                        ? 'Not updated'
                        : 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role details box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#1E2235] to-[#242A42] text-white space-y-2 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F2CC8F]">
                <span className="material-symbols-outlined text-[18px]">security</span>
                <span>{isEn ? 'SCMS Operational Permissions' : 'Phân quyền chức năng SCMS'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {roleConfig[detailModalStaff.role]?.desc ||
                  (isEn ? 'Staff member has access and operational rights according to assigned role.' : 'Nhân sự có quyền truy cập và thao tác theo đúng vai trò được giao.')}
              </p>
            </div>

            {/* Modal actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDetailModalStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = detailModalStaff;
                  setDetailModalStaff(null);
                  openEditModal(s);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>{isEn ? 'Edit Info' : 'Sửa thông tin'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 8. Modal: Lock / Unlock Staff */}
      <Modal
        isOpen={Boolean(statusConfirmStaff)}
        onClose={() => !saving && setStatusConfirmStaff(null)}
        title={isEn ? 'Confirm Staff Status Change' : 'Xác nhận trạng thái nhân sự'}
        maxWidth="max-w-md"
      >
        {statusConfirmStaff && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                statusConfirmStaff.status === 'ACTIVE'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <span className="material-symbols-outlined text-[24px] flex-shrink-0">
                {statusConfirmStaff.status === 'ACTIVE' ? 'warning' : 'lock_open'}
              </span>
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">
                  {statusConfirmStaff.status === 'ACTIVE'
                    ? isEn
                      ? `Lock account of "${statusConfirmStaff.fullName}"?`
                      : `Khóa tài khoản của "${statusConfirmStaff.fullName}"?`
                    : isEn
                    ? `Unlock account of "${statusConfirmStaff.fullName}"?`
                    : `Mở khóa tài khoản của "${statusConfirmStaff.fullName}"?`}
                </p>
                <p className="leading-relaxed">
                  {statusConfirmStaff.status === 'ACTIVE'
                    ? isEn
                      ? 'When locked, the staff member cannot log in to the management system, take class attendance, or perform any operational functions.'
                      : 'Khi bị khóa, nhân viên sẽ không thể đăng nhập vào ứng dụng quản lý, không thể điểm danh ca dạy hoặc thực hiện bất kỳ nghiệp vụ nào.'
                    : isEn
                    ? 'When unlocked, the staff member will regain full system access and resume assignments normally.'
                    : 'Khi mở khóa, nhân viên sẽ khôi phục toàn bộ quyền truy cập và thực hiện nhiệm vụ bình thường.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={saving}
                onClick={() => setStatusConfirmStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isEn ? 'Cancel' : 'Hủy bỏ'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleToggleStatus}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  statusConfirmStaff.status === 'ACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-[#2D6A4F] hover:bg-[#1B4332] shadow-[#2D6A4F]/30'
                }`}
              >
                {saving
                  ? isEn
                    ? 'Updating...'
                    : 'Đang cập nhật...'
                  : statusConfirmStaff.status === 'ACTIVE'
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
