import { useMemo, useState, useRef, useEffect } from 'react';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { getRoleConfig, today } from '../lib/staffDisplay.js';
import { COACH_CLASS_FILTER, matchesCoachClassFilter } from './staffManagementView.js';
import { staffApi } from '../../../entities/staff/index.js';
import { getPasswordPolicyError } from '../../../shared/lib/passwordPolicy.js';
import { classApi } from '../../../entities/class/index.js';

export function useStaffManagement() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const roleConfig = useMemo(() => getRoleConfig(isEn), [isEn]);

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [coachClassFilter, setCoachClassFilter] = useState(COACH_CLASS_FILTER.ALL);
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
  const [searchingMembers, setSearchingMembers] = useState(false);
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
    if (selectedMember) return;
    const q = memberSearchQuery.trim();
    if (q.length === 1) {
      setFilteredMembers([]);
      setSearchingMembers(false);
      return;
    }
    let active = true;
    setSearchingMembers(true);
    const timer = setTimeout(async () => {
      try {
        const res = await staffApi.searchMembers(q);
        if (active) {
          setFilteredMembers(Array.isArray(res) ? res : res?.items || []);
        }
      } catch (err) {
        if (active) {
          console.error('Failed to search members for appointment:', err);
          setFilteredMembers([]);
        }
      } finally {
        if (active) {
          setSearchingMembers(false);
        }
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [memberSearchQuery, selectedMember]);

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
    const coachesWithoutClasses = staffList.filter((s) => s.role === 'COACH' && s.activeClassCount === 0).length;
    const coachesWithClasses = staffList.filter((s) => s.role === 'COACH' && Number(s.activeClassCount) > 0).length;
    return { total, coaches, receptionists, managers, activeCount, disabledCount, coachesWithoutClasses, coachesWithClasses };
  }, [staffList]);

  // Set of userIds who already have a staff or coach profile at this center
  const existingStaffUserIds = useMemo(() => {
    return new Set(staffList.map((s) => Number(s.userId || s.id)).filter(Boolean));
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

    if (roleFilter === 'COACH' && coachClassFilter !== COACH_CLASS_FILTER.ALL) {
      list = list.filter((s) => matchesCoachClassFilter(s, coachClassFilter));
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
  }, [staffList, roleFilter, statusFilter, coachClassFilter, searchQuery, sortBy]);

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
    setSearchingMembers(false);
    setSelectedMember(null);
    setIsDropdownOpen(false);
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
          // Same rule as the backend PasswordPolicy, checked before the request is sent.
          const passwordError = getPasswordPolicyError(form.password, { email: form.email.trim(), phone: form.phone.trim() });
          if (passwordError) {
            showError(passwordError);
            setSaving(false);
            return;
          }
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
    setCoachClassFilter(COACH_CLASS_FILTER.ALL);
    setSortBy('DEFAULT');
  };

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    if (role !== 'COACH') setCoachClassFilter(COACH_CLASS_FILTER.ALL);
  };

  return {
    addingSpecialty, coachClassFilter, copiedId, copyId, createModalOpen, createMode,
    detailModalStaff, displayedStaff, dropdownRef, editingStaff, existingStaffUserIds,
    filteredMembers, form, handleAddSpecialty, handleFormChange, handleResetFilters,
    handleRoleFilterChange, handleSaveStaff, handleToggleStatus, isDropdownOpen, isEn, loadSports,
    loadStaff, loading, memberSearchQuery, newSpecialtyName, openCreateModal, openDetailModal,
    openEditModal, openStatusConfirmModal, roleConfig, roleFilter, saving, searchQuery,
    searchingMembers, selectedMember, setCoachClassFilter, setCreateModalOpen, setCreateMode,
    setDetailModalStaff, setEditingStaff, setForm, setIsDropdownOpen, setMemberSearchQuery,
    setNewSpecialtyName, setSearchQuery, setSelectedMember, setSortBy, setStatusConfirmStaff,
    setStatusFilter, sortBy, sports, sportsError, staffList, stats, statusConfirmStaff, statusFilter
  };
}
