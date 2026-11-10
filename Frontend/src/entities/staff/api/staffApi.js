import { mapMember } from '../../member/@x/staff.js';
import { asArray, centerId } from '../../../shared/api/apiUtils.js';
import { apiRequest } from '../../../shared/api/http.js';
import { getStoredAvatar } from '../../../shared/lib/avatarHelper.js';

function mapStaff(item) {
  return {
    id: item.userId,
    userId: item.userId,
    centerId: item.centerId,
    staffCode: item.staffCode,
    coachCode: item.coachCode,
    username: item.username,
    email: item.email,
    phone: item.phone || '',
    role: String(item.roleName || '').toUpperCase(),
    fullName: item.fullName,
    status: String(item.status || '').toUpperCase(),
    hireDate: item.hireDate,
    specialty: item.specialization || '',
    sportIds: Array.isArray(item.sportIds) ? item.sportIds.map(Number) : [],
    certification: item.certification || '',
    experienceYears: item.experienceYears,
    bio: item.bio,
    activeClassCount: item.activeClassCount == null ? null : Number(item.activeClassCount),
    avatar: getStoredAvatar(item.userId)
  };
}

export const staffApi = {
  async getAll() {
    const first = await apiRequest(`centers/${centerId()}/staff?page=1&pageSize=100`);
    const items = [...asArray(first)];
    let previous = first;
    for (let page = 2; Array.isArray(first) ? asArray(previous).length === 100 : page <= Math.ceil((first.totalCount || 0) / (first.pageSize || 100)); page++) {
      previous = await apiRequest(`centers/${centerId()}/staff?page=${page}&pageSize=100`);
      items.push(...asArray(previous));
    }
    return items.map(mapStaff);
  },

  async searchMembers(query = '') {
    const q = (query || '').trim();
    if (q && q.length < 2) return [];
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (q) params.set('query', q);
    const result = await apiRequest(`centers/${centerId()}/members?${params}`);
    const items = [...asArray(result)];
    return items.map(mapMember);
  },

  async getAvailableMembers(query = '') {
    return this.searchMembers(query);
  },

  previewRoleId() {
    return 'Hệ thống tự động cấp mã';
  },

  async create(staffData) {
    if (staffData.memberId) {
      return mapStaff(await apiRequest(`centers/${centerId()}/staff/appointments`, {
        method: 'POST', body: {
          memberId: Number(staffData.memberId),
          roleName: String(staffData.role).toUpperCase() === 'COACH' ? 'Coach' : 'Receptionist',
          hireDate: staffData.hireDate || new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10),
          specialization: staffData.specialty?.trim() || null,
          certification: staffData.certification?.trim() || null,
          experienceYears: staffData.experienceYears != null && staffData.experienceYears !== '' ? Number(staffData.experienceYears) : null,
          bio: staffData.bio?.trim() || null,
          sportIds: staffData.sportIds || []
        }
      }));
    }
    if (typeof staffData.password !== 'string' || !staffData.password.trim()) {
      throw new Error('Vui lòng nhập mật khẩu khởi tạo cho nhân viên.');
    }
    const roleCapitalized = String(staffData.role || '').toUpperCase() === 'COACH'
      ? 'Coach'
      : String(staffData.role || '').toUpperCase() === 'RECEPTIONIST'
        ? 'Receptionist'
        : 'Manager';
    const emailPrefix = (staffData.email || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const username = (staffData.username || `${emailPrefix}${Math.floor(100 + Math.random() * 900)}`).toLowerCase();
    const result = await apiRequest(`centers/${centerId()}/staff`, {
      method: 'POST',
      body: {
        username,
        email: staffData.email.trim(),
        password: staffData.password,
        fullName: staffData.fullName.trim(),
        roleName: roleCapitalized,
        phone: staffData.phone?.trim() || null,
        hireDate: staffData.hireDate || new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10),
        specialization: staffData.specialty?.trim() || null,
        certification: staffData.certification?.trim() || null,
        experienceYears: staffData.experienceYears ? Number(staffData.experienceYears) : (roleCapitalized === 'Coach' ? 1 : null),
        bio: staffData.bio?.trim() || null,
        sportIds: staffData.sportIds || []
      }
    });
    return mapStaff(result);
  },

  async update(id, staffData) {
    const current = (await this.getAll()).find(item => Number(item.id) === Number(id));
    if (!current) throw new Error('Không tìm thấy nhân viên.');
    const result = await apiRequest(`centers/${centerId()}/staff/${id}`, {
      method: 'PATCH',
      body: {
        fullName: staffData.fullName ?? current.fullName,
        email: staffData.email ?? current.email,
        phone: staffData.phone ?? current.phone,
        status: String(staffData.status || current.status).toUpperCase() === 'ACTIVE' ? 'Active' : 'Disabled',
        roleName: String(staffData.role || current.role).toUpperCase() === 'COACH' ? 'Coach'
          : String(staffData.role || current.role).toUpperCase() === 'RECEPTIONIST' ? 'Receptionist' : 'Manager',
        hireDate: staffData.hireDate || current.hireDate || null,
        specialization: staffData.specialty ?? current.specialty ?? null,
        certification: staffData.certification ?? current.certification ?? null,
        experienceYears: staffData.experienceYears ?? current.experienceYears ?? null,
        bio: staffData.bio ?? current.bio ?? null,
        sportIds: staffData.sportIds ?? current.sportIds ?? []
      }
    });
    return mapStaff(result);
  },

  async toggleStatus(id) {
    const current = (await this.getAll()).find(item => Number(item.id) === Number(id));
    if (!current) throw new Error('Không tìm thấy nhân viên.');
    return this.update(id, { status: current.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' });
  }
};
