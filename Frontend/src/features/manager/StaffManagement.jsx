import { staffApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Table, LoadingSpinner } from '../../components/common/Table.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';

const { useState, useEffect, useRef } = React;

export function StaffManagement() {
  const { showSuccess, showError } = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  // Add staff from existing member
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [previewId, setPreviewId] = useState('');
  const dropdownRef = useRef(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('COACH');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formCertification, setFormCertification] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStaff = async () => {
    try {
      const data = await staffApi.getAll();
      setStaffList(data);
    } catch (e) {
      showError('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

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

  const openCreateModal = () => {
    setEditingStaff(null);
    setSelectedMember(null);
    setMemberSearchQuery('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('COACH');
    setFormSpecialty('');
    setFormCertification('');
    setIsDropdownOpen(false);

    setFilteredMembers([]);

    const nextId = staffApi.previewRoleId('COACH', '');
    setPreviewId(nextId);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen || editingStaff || !isDropdownOpen || selectedMember) return;
    let active = true;
    const query = memberSearchQuery.trim();
    if (query.length < 2) { setFilteredMembers([]); return; }
    const timer = setTimeout(async () => {
      try {
        const members = await staffApi.getAvailableMembers(query);
        if (active) setFilteredMembers(members);
      } catch (error) {
        if (active) { setFilteredMembers([]); showError(error.message); }
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [modalOpen, editingStaff, isDropdownOpen, selectedMember, memberSearchQuery]);

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setSelectedMember(null);
    setFormName(staff.fullName);
    setFormEmail(staff.email);
    setFormPhone(staff.phone || '');
    setFormRole(staff.role);
    setFormSpecialty(staff.specialty || '');
    setFormCertification(staff.certification || '');
    setPreviewId(staff.id);
    setModalOpen(true);
  };

  const handleMemberSearchChange = (val) => {
    setMemberSearchQuery(val);
    setIsDropdownOpen(true);
    setSelectedMember(null);
    setFilteredMembers([]);
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setMemberSearchQuery(`${member.fullName} (${member.id})`);
    setFormName(member.fullName);
    setFormEmail(member.email);
    setFormPhone(member.phone || '');
    setIsDropdownOpen(false);

    const nextId = staffApi.previewRoleId(formRole, member.id);
    setPreviewId(nextId);
  };

  const handleRoleChange = (newRole) => {
    setFormRole(newRole);
    const targetOldId = selectedMember ? selectedMember.id : (editingStaff ? editingStaff.id : '');
    const nextId = staffApi.previewRoleId(newRole, targetOldId);
    setPreviewId(nextId);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff && !selectedMember) {
      showError('Vui lòng tìm và chọn một tài khoản từ danh sách!');
      return;
    }

    if (editingStaff && !formName.trim()) {
      showError('Vui lòng điền họ và tên nhân viên!');
      return;
    }

    setSaving(true);
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff.id, {
          fullName: formName.trim(),
          phone: formPhone.trim(),
          role: formRole,
          specialty: formSpecialty.trim(),
          certification: formCertification.trim()
        });
        showSuccess('Cập nhật nhân viên thành công!');
      } else {
        const payload = {
          fullName: selectedMember.fullName,
          email: selectedMember.email,
          phone: selectedMember.phone || '',
          role: formRole,
          specialty: formRole === 'COACH' ? formSpecialty.trim() : '',
          certification: formRole === 'COACH' ? formCertification.trim() : '',
          avatar: selectedMember?.avatar,
          memberId: selectedMember.id,
          selectedAccountId: selectedMember.id
        };

        const res = await staffApi.create(payload);
        if (res.oldId && res.newId) {
          showSuccess(`Đã cấp vai trò [${res.role}] cho ${res.fullName}! ID chuyển từ [${res.oldId}] sang [${res.newId}]`);
        } else {
          showSuccess(`Cấp vai trò [${res.role}] thành công với ID [${res.id}]!`);
        }
      }
      setModalOpen(false);
      loadStaff();
    } catch (err) {
      showError(err.message || 'Lỗi lưu nhân viên');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      await staffApi.toggleStatus(staff.id);
      showSuccess(`Đã thay đổi trạng thái của ${staff.fullName}`);
      loadStaff();
    } catch (err) {
      showError(err.message || 'Không thể đổi trạng thái');
    }
  };

  const filteredStaff = roleFilter === 'ALL'
    ? staffList
    : staffList.filter(s => s.role === roleFilter);

  const columns = [
    {
      header: 'Mã ID',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md shadow-xs inline-flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-slate-400">badge</span>
          {row.id}
        </span>
      )
    },
    {
      header: 'Nhân Viên',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="font-bold text-slate-900">{row.fullName}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Vai Trò',
      render: (row) => <Badge variant={row.role}>{row.role}</Badge>
    },
    {
      header: 'Chuyên Môn & Chứng Chỉ',
      render: (row) => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{row.specialty || 'Vận hành trung tâm'}</div>
          {row.certification && (
            <div className="text-[11px] text-red-600 font-semibold">{row.certification}</div>
          )}
        </div>
      )
    },
    {
      header: 'Số Điện Thoại',
      accessor: 'phone'
    },
    {
      header: 'Trạng Thái',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
    },
    {
      header: 'Hành Động',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            title="Chỉnh sửa thông tin"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${row.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
              }`}
            title={row.status === 'ACTIVE' ? 'Khóa nhân viên' : 'Kích hoạt lại'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {row.status === 'ACTIVE' ? 'block' : 'check_circle'}
            </span>
          </button>
        </div>
      )
    }
  ];

  if (loading) return <LoadingSpinner text="Đang tải danh sách nhân sự..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-chivo text-xs font-bold uppercase tracking-wider text-red-600">
            MANAGE STAFF ACCOUNTS
          </span>
          <h1 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Tài Khoản Nhân Viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý đội ngũ Huấn luyện viên, Lễ tân và Quản lý đạt chuẩn Olympic SCMS.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Thêm Nhân Viên Mới</span>
        </button>
      </div>

      {/* Role Filter Chips */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Lọc vai trò:</span>
        {['ALL', 'COACH', 'RECEPTIONIST', 'MANAGER'].map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo uppercase tracking-wider transition-all ${roleFilter === r
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
          >
            {r === 'ALL' ? 'Tất cả' : r}
          </button>
        ))}
      </div>

      {/* Staff Table */}
      <Table
        columns={columns}
        data={filteredStaff}
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên hoặc ID nhân viên..."
        emptyMessage="Không tìm thấy nhân viên nào phù hợp"
      />

      {/* Create / Edit Staff Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStaff ? `Chỉnh sửa: ${editingStaff.fullName} (${editingStaff.id})` : 'Cấp Vai Trò Nhân Viên (Bổ Nhiệm)'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          {!editingStaff ? (
            /* =================== CHẾ ĐỘ CẤP VAI TRÒ MỚI (TỪ TÀI KHOẢN CÓ SẴN) =================== */
            <>
              {/* Bước 1: Chọn tài khoản */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Chọn tài khoản cần bổ nhiệm làm nhân viên *
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Nhập ít nhất 2 ký tự: Tên, Email, SĐT hoặc mã hội viên..."
                      value={memberSearchQuery}
                      onChange={e => handleMemberSearchChange(e.target.value)}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                    />
                    {memberSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setMemberSearchQuery('');
                          setFilteredMembers([]);
                          setIsDropdownOpen(true);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
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
                        filteredMembers.map(member => (
                          <div
                            key={member.id}
                            onClick={() => handleSelectMember(member)}
                            className="p-2.5 hover:bg-red-50/80 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs truncate">{member.fullName}</span>
                                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                                    {member.id}
                                  </span>
                                  {member.memberCode && (
                                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                                      {member.memberCode}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {member.email} {member.phone ? `• ${member.phone}` : ''}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-red-600 flex-shrink-0 flex items-center gap-0.5 bg-red-50 px-2 py-1 rounded">
                              <span>Chọn</span>
                              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Member Card (Read-only Info) */}
                {selectedMember ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover border-2 border-emerald-300 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm truncate">{selectedMember.fullName}</span>
                          <span className="font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                            {selectedMember.id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 truncate">
                          {selectedMember.email} {selectedMember.phone ? `• SĐT: ${selectedMember.phone}` : '• Chưa cập nhật SĐT'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberSearchQuery('');
                        setIsDropdownOpen(true);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline flex items-center gap-0.5 flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[14px]">sync</span>
                      <span>Đổi</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-center text-xs text-slate-500">
                    Chưa chọn tài khoản. Vui lòng tìm kiếm và chọn một tài khoản ở trên để bổ nhiệm.
                  </div>
                )}
              </div>

              {/* Bước 2: Chọn vai trò muốn trao */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Chọn vai trò muốn trao cho tài khoản này *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { role: 'COACH', label: 'Huấn luyện viên', icon: 'sports', desc: 'Dạy lớp thể thao, điểm danh ca học, tạo giáo án' },
                    { role: 'RECEPTIONIST', label: 'Lễ tân quầy', icon: 'badge', desc: 'Quét thẻ check-in, thu ngân gói tập, tra cứu hội viên' }
                  ].map(item => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleChange(item.role)}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        formRole === item.role
                          ? 'border-red-600 bg-red-50/60 shadow-xs ring-1 ring-red-600'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${formRole === item.role ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                        </div>
                        {formRole === item.role && (
                          <span className="material-symbols-outlined text-[20px] text-red-600">check_circle</span>
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-bold font-chivo uppercase ${formRole === item.role ? 'text-red-700' : 'text-slate-900'}`}>
                          {item.label} ({item.role})
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-1">{item.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic ID change banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-3 shadow-xs border border-slate-700 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                  <span>Bổ nhiệm vai trò {formRole}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs flex-wrap font-medium">
                  <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    <span className="text-slate-400">Mã hội viên:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {selectedMember ? selectedMember.id : 'Chưa chọn tài khoản'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-amber-400">arrow_right_alt</span>
                  <div className="flex items-center gap-1.5 bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/40">
                    <span className="text-amber-300 font-semibold">Mã nhân viên:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {selectedMember ? previewId : 'Chờ chọn tài khoản'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tài khoản giữ nguyên ID, mật khẩu và lịch sử. Khi xác nhận, hệ thống bổ nhiệm vai trò <span className="text-white font-semibold">{formRole}</span> và cấp mã nhân viên mới.
                </p>
              </div>

              {/* Thông tin bổ sung cho Huấn luyện viên (Chỉ hiển thị nếu role là COACH) */}
              {formRole === 'COACH' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-slate-500">fitness_center</span>
                    <span>Thông tin bổ sung HLV (Tùy chọn)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Chuyên môn môn học
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Bơi lội & Gym, Cầu lông..."
                        value={formSpecialty}
                        onChange={e => setFormSpecialty(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Chứng chỉ quốc tế
                      </label>
                      <input
                        type="text"
                        placeholder="VD: AFC Level A, NASM-CPT..."
                        value={formCertification}
                        onChange={e => setFormCertification(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* =================== CHẾ ĐỘ CHỈNH SỬA NHÂN VIÊN ĐÃ CÓ =================== */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Họ và tên nhân viên *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email tài khoản (Cố định)
                </label>
                <input
                  type="email"
                  disabled
                  value={formEmail}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-slate-100 cursor-not-allowed text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Vai trò nhân viên *
                  </label>
                  <select
                    value={formRole}
                    onChange={e => handleRoleChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white font-medium"
                  >
                    <option value="COACH">Huấn luyện viên (COACH)</option>
                    <option value="RECEPTIONIST">Lễ tân (RECEPTIONIST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0987 654 321"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Chuyên môn môn học
                </label>
                <input
                  type="text"
                  placeholder="VD: Bơi lội & Gym, Cầu lông, Yoga..."
                  value={formSpecialty}
                  onChange={e => setFormSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Chứng chỉ đào tạo quốc tế
                </label>
                <input
                  type="text"
                  placeholder="VD: AFC Level A, BWF Certified, NASM-CPT"
                  value={formCertification}
                  onChange={e => setFormCertification(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>{editingStaff ? 'Lưu Thay Đổi' : 'Xác Nhận Cấp Vai Trò'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

