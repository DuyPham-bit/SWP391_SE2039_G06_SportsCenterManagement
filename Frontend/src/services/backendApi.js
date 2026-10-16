import { apiRequest, clearApiToken, createIdempotencyKey, getApiToken, setApiToken } from './http.js';
import { assertAuthVersion, beginAuthOperation, getAuthUser, getAuthVersion, setAuthUser } from './authState.js';

function centerId() {
  const id = getAuthUser()?.centerId || import.meta.env.VITE_SPORTS_CENTER_ID;
  if (!id || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    throw new Error('Chưa xác định trung tâm. Hãy đăng nhập tài khoản được gán centerId hoặc cấu hình VITE_SPORTS_CENTER_ID.');
  }
  return Number(id);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.items) ? value.items : [];
}

async function loadSessionsBetween(from, to) {
  const sessions = [];
  let rangeStart = from;
  while (rangeStart <= to) {
    const startDate = new Date(`${rangeStart}T00:00:00Z`);
    startDate.setUTCDate(startDate.getUTCDate() + 90);
    const rangeEnd = startDate.toISOString().slice(0, 10) < to
      ? startDate.toISOString().slice(0, 10)
      : to;
    const firstPage = await apiRequest(`class-sessions?${new URLSearchParams({ from: rangeStart, to: rangeEnd, page: '1', pageSize: '100' })}`);
    sessions.push(...asArray(firstPage));
    const totalPages = Math.ceil((firstPage.totalCount || 0) / (firstPage.pageSize || 100));
    for (let page = 2; page <= totalPages; page += 1) {
      const result = await apiRequest(`class-sessions?${new URLSearchParams({ from: rangeStart, to: rangeEnd, page: String(page), pageSize: '100' })}`);
      sessions.push(...asArray(result));
    }
    const nextDate = new Date(`${rangeEnd}T00:00:00Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    rangeStart = nextDate.toISOString().slice(0, 10);
  }
  return sessions;
}

function mapMember(member) {
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  let expiryStr = null;
  if (member.packageExpiry) {
    expiryStr = typeof member.packageExpiry === 'string'
      ? member.packageExpiry.split('T')[0]
      : String(member.packageExpiry);
  }

  let pkgStatus = (member.packageStatus || 'INACTIVE').toUpperCase();
  if (pkgStatus === 'ACTIVE' && expiryStr && expiryStr < today) {
    pkgStatus = 'EXPIRED';
  }

  return {
    id: member.memberId,
    userId: member.userId,
    memberCode: member.memberCode,
    username: member.username,
    email: member.email,
    phone: member.phone || '',
    fullName: member.fullName,
    dateOfBirth: member.dateOfBirth,
    gender: member.gender,
    address: member.address,
    role: 'MEMBER',
    status: String(member.accountStatus || 'Active').toUpperCase(),
    packageStatus: pkgStatus,
    packageName: member.packageName || 'Chưa đăng ký gói tập',
    packageExpiry: expiryStr || 'Không khả dụng',
    packageStartDate: member.packageStartDate || null,
    packageId: member.packageId || null,
    subscriptionId: member.subscriptionId || null,
    avatar: null
  };
}

async function loadCurrentUser(token = getApiToken(), version = getAuthVersion()) {
  if (!token) return null;
  const profile = await apiRequest('profile/me', { token });
  assertAuthVersion(version);
  let memberId = null;
  let activeSubscription = null;
  let scheduledSubscriptions = [];

  if (String(profile.role).toUpperCase() === 'MEMBER') {
    const member = await apiRequest('members/me', { token });
    assertAuthVersion(version);
    memberId = member.memberId;
    const subscriptions = await apiRequest(`members/${memberId}/subscriptions`, { token });
    assertAuthVersion(version);
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
    const activeSubs = asArray(subscriptions).filter(item => String(item.status).toUpperCase() === 'ACTIVE' && item.startDate && item.endDate && item.startDate <= today && item.endDate >= today);
    activeSubs.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
    activeSubscription = activeSubs[0] || null;
    scheduledSubscriptions = asArray(subscriptions)
      .filter(item => String(item.status).toUpperCase() === 'ACTIVE' && item.startDate > today && item.endDate >= item.startDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || Number(a.subscriptionId) - Number(b.subscriptionId));
  }

  const capabilities = await apiRequest('access/me/capabilities', { token });
  assertAuthVersion(version);
  const user = {
    capabilities,
    id: profile.userId,
    memberId,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone || '',
    role: String(profile.role).toUpperCase(),
    status: String(profile.status || 'Active').toUpperCase(),
    memberCode: profile.memberCode,
    centerId: profile.centerId,
    createdAt: profile.createdAt,
    packageId: activeSubscription?.packageId || null,
    packageName: activeSubscription?.packageName || 'Chưa đăng ký gói tập',
    packageExpiry: activeSubscription?.endDate || null,
    packageStatus: activeSubscription ? 'ACTIVE' : 'INACTIVE',
    scheduledSubscriptions,
    avatar: null
  };
  setAuthUser(user);
  return user;
}

async function loginAndLoad(path, body) {
  let version = beginAuthOperation();
  const result = await apiRequest(path, { method: 'POST', token: null, body });
  assertAuthVersion(version);
  setApiToken(result.accessToken);
  version = getAuthVersion();
  try {
    return { token: result.accessToken, user: await loadCurrentUser(result.accessToken, version) };
  } catch (error) {
    if (version === getAuthVersion()) clearApiToken();
    throw error;
  }
}

function mapPackage(item) {
  return { ...item, status: String(item.status || '').toUpperCase(), allowedSports: item.allowedSports ?? 1, features: item.features || [] };
}

function mapSession(item) {
  const date = String(item.sessionDate || '');
  const parsedDate = date ? new Date(`${date}T12:00:00`) : null;
  const dayLabels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayOfWeek = parsedDate && !Number.isNaN(parsedDate.valueOf()) ? dayLabels[parsedDate.getDay()] : '';
  return {
    id: item.sessionId,
    sessionId: item.sessionId,
    classId: item.classId,
    sportId: item.sportId,
    name: item.className,
    sportName: item.sportName,
    sessionDate: date,
    startTime: item.startTime,
    endTime: item.endTime,
    dayOfWeek,
    timeSlot: `${String(item.startTime || '').slice(0, 5)} - ${String(item.endTime || '').slice(0, 5)}`,
    coachId: item.coachId,
    coachName: item.coachName || 'Chưa phân công',
    roomId: item.roomId,
    roomName: item.roomName || (item.roomId ? `Phòng #${item.roomId}` : 'Chưa phân công'),
    enrolledCount: item.bookedCount || 0,
    capacity: item.capacity || 0,
    status: String(item.sessionStatus || '').toUpperCase(),
    isBookable: Boolean(item.isBookable), allowWaitlist: Boolean(item.allowWaitlist)
  };
}

function mapBooking(item) {
  return {
    id: item.id,
    sessionId: item.sessionId,
    classId: item.classId,
    sourceClassId: item.classId,
    className: item.className,
    bookingDate: item.sessionDate,
    startTime: String(item.startTime || '').slice(0, 5),
    endTime: String(item.endTime || '').slice(0, 5),
    timeSlot: `${String(item.startTime || '').slice(0, 5)} - ${String(item.endTime || '').slice(0, 5)}`,
    sessionStatus: item.sessionStatus ? String(item.sessionStatus).toUpperCase() : null,
    roomName: item.roomName || 'Chưa phân công phòng',
    coachName: item.coachName || 'Chưa phân công HLV',
    coachSpecialization: item.coachSpecialization || null,
    attendanceStatus: item.attendanceStatus ? String(item.attendanceStatus).toUpperCase() : null,
    attendanceNote: item.attendanceNote || null,
    checkInTime: item.checkInTime || null,
    status: String(item.status).toUpperCase() === 'BOOKED' ? 'CONFIRMED' : String(item.status).toUpperCase(),
    createdAt: item.bookedAt
  };
}

export const authApi = {
  async login(email, password) {
    return loginAndLoad('auth/login', { email: email.trim(), password });
  },

  async register({ fullName, email, phone, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const registeredCenterId = Number(import.meta.env.VITE_SPORTS_CENTER_ID);
    if (!Number.isSafeInteger(registeredCenterId) || registeredCenterId <= 0) {
      throw new Error('Cấu hình VITE_SPORTS_CENTER_ID thành ID trung tâm hợp lệ trước khi đăng ký hội viên.');
    }
    const localPart = cleanEmail.split('@')[0];
    const username = localPart.length >= 3 ? localPart : `user-${localPart}`;
    const version = beginAuthOperation();
    await apiRequest('auth/register', {
      method: 'POST', token: null,
      body: {
        username,
        email: cleanEmail,
        password,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        centerId: registeredCenterId
      }
    });
    assertAuthVersion(version);
    return (await this.login(cleanEmail, password)).user;
  },

  async loginWithGoogle({ credential }) {
    return loginAndLoad('auth/google', {
      idToken: credential, centerId: Number(import.meta.env.VITE_SPORTS_CENTER_ID) || null
    });
  },

  async linkGoogle(credential, currentPassword) {
    return apiRequest('auth/google/link', { method: 'POST', body: { idToken: credential, currentPassword } });
  },

  async requestPasswordReset(email) {
    return apiRequest('auth/request-password-reset', { method: 'POST', body: { email: email.trim() } });
  },

  async resetPassword(email, otp, newPassword) {
    await apiRequest('auth/reset-password', { method: 'POST', body: { email: email.trim(), otp: otp.trim(), newPassword } });
    return true;
  },

  async changePassword(_userId, currentPassword, newPassword) {
    const version = beginAuthOperation();
    const result = await apiRequest('auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword }
    });
    assertAuthVersion(version);
    setApiToken(result.accessToken);
    return loadCurrentUser(result.accessToken);
  },

  async updateProfile(_userId, profileData) {
    const version = getAuthVersion();
    const token = getApiToken();
    await apiRequest('profile/me', {
      method: 'PATCH', token,
      body: { fullName: profileData.fullName, phone: profileData.phone || null }
    });
    assertAuthVersion(version);
    return loadCurrentUser(token, version);
  },

  getCurrentUser: loadCurrentUser,
  logout: clearApiToken
};

export const packageApi = {
  async getAll() {
    const id = centerId();
    const role = String(getAuthUser()?.role || '').toUpperCase();
    const suffix = role === 'MANAGER' || role === 'ADMIN' ? '/all' : '';
    const packages = await apiRequest(`centers/${id}/membership-packages${suffix}`);
    return asArray(packages).map(mapPackage);
  },

  async create(pkg) {
    const created = await apiRequest(`centers/${centerId()}/membership-packages`, {
      method: 'POST',
      body: {
        name: pkg.name,
        description: pkg.description || null,
        durationDays: Number(pkg.durationDays),
        price: Number(pkg.price),
        maxClasses: pkg.maxClasses ? Number(pkg.maxClasses) : null,
        accessType: pkg.accessType || null,
        allowedSports: Number(pkg.allowedSports || 1),
        badge: pkg.badge || null,
        features: pkg.features || []
      }
    });
    return mapPackage(created);
  },

  async update(id, pkg) {
    const updated = await apiRequest(`centers/${centerId()}/membership-packages/${id}`, {
      method: 'PUT',
      body: {
        name: pkg.name,
        description: pkg.description || null,
        durationDays: Number(pkg.durationDays),
        price: Number(pkg.price),
        maxClasses: pkg.maxClasses ? Number(pkg.maxClasses) : null,
        accessType: pkg.accessType || null,
        allowedSports: Number(pkg.allowedSports || 1),
        badge: pkg.badge || null,
        features: pkg.features || []
      }
    });
    return mapPackage(updated);
  },

  async toggleStatus(id) {
    const target = (await this.getAll()).find(item => Number(item.id) === Number(id));
    if (!target) throw new Error('Không tìm thấy gói tập.');
    const status = target.status === 'ACTIVE' ? 'Inactive' : 'Active';
    return mapPackage(await apiRequest(`centers/${centerId()}/membership-packages/${id}/status`, {
      method: 'PATCH', body: { status }
    }));
  }
};

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
    avatar: null
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

  async getAvailableMembers(query = '') {
    return receptionApi.lookupMember(query);
  },

  previewRoleId() {
    return 'Backend cấp mã nhân viên';
  },

  async create(staffData) {
    if (staffData.memberId) {
      return mapStaff(await apiRequest(`centers/${centerId()}/staff/appointments`, {
        method: 'POST', body: {
          memberId: Number(staffData.memberId),
          roleName: String(staffData.role).toUpperCase() === 'COACH' ? 'Coach' : 'Receptionist',
          hireDate: staffData.hireDate || new Date().toISOString().slice(0, 10),
          specialization: staffData.specialty?.trim() || null,
          certification: staffData.certification?.trim() || null,
          experienceYears: staffData.experienceYears ?? null, bio: staffData.bio?.trim() || null
          , sportIds: staffData.sportIds || []
        }
      }));
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
        password: staffData.password || 'Staff@123456',
        fullName: staffData.fullName.trim(),
        roleName: roleCapitalized,
        phone: staffData.phone?.trim() || null,
        hireDate: staffData.hireDate || new Date().toISOString().slice(0, 10),
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

export const roomApi = {
 async getAll() { return asArray(await apiRequest('centers/'+centerId()+'/rooms')); },
 async create(body) { return apiRequest('centers/'+centerId()+'/rooms', { method: 'POST', body }); },
 async update(id, body) { return apiRequest('centers/'+centerId()+'/rooms/'+id, { method: 'PUT', body }); }
};
export const classApi = {
 async getTeachingSchedule(from, to) {
   const query = new URLSearchParams({ from, to, includeHistory: 'true' });
   return asArray(await apiRequest('coaches/me/teaching-schedule?'+query)).map(mapSession);
 },
 async getManagementClasses() { return asArray(await apiRequest('centers/'+centerId()+'/classes/all')); },
 async getSports() { return asArray(await apiRequest('centers/'+centerId()+'/sports')); },
 async getManagementSports() { return asArray(await apiRequest('centers/'+centerId()+'/sports/all')); },
 async createSport(body) { return apiRequest('centers/'+centerId()+'/sports', { method: 'POST', body }); },
 async updateSport(id, body) { return apiRequest('centers/'+centerId()+'/sports/'+id, { method: 'PUT', body }); },
 async getCoaches() { return asArray(await apiRequest('centers/'+centerId()+'/coaches')); },
 async getSchedules(id) { return asArray(await apiRequest('classes/'+id+'/schedules')); },
 async createSchedule(id, body) { return apiRequest('classes/'+id+'/schedules', { method: 'POST', body }); },
 async updateSchedule(id, sid, body) { return apiRequest('classes/'+id+'/schedules/'+sid, { method: 'PUT', body }); },
 async cancelSchedule(id, sid) { return apiRequest('classes/'+id+'/schedules/'+sid, { method: 'DELETE' }); },
 async publish(id) { return apiRequest('classes/'+id+'/publish', { method: 'POST' }); },
 async cancel(id) { return apiRequest('classes/'+id, { method: 'DELETE' }); },
 async restore(id) { return apiRequest('classes/'+id+'/restore', { method: 'POST' }); },
  async getAll() {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date();
    end.setDate(end.getDate() + 90);
    const query = new URLSearchParams({ from: today, to: end.toISOString().slice(0, 10), page: '1', pageSize: '100' });
    const isCoach = String(getAuthUser()?.role || '').toUpperCase() === 'COACH';
    const path = isCoach ? `coaches/me/teaching-schedule?from=${today}&to=${end.toISOString().slice(0, 10)}` : `class-sessions?${query}`;
    const result = isCoach ? await apiRequest(path) : await loadSessionsBetween(today, end.toISOString().slice(0, 10));
    return asArray(result).map(mapSession);
  },

  async create(classData) {
    if (!Number.isSafeInteger(Number(classData.sportId)) || Number(classData.sportId) <= 0) {
      throw new Error('Không thể tạo lớp: form hiện chưa cung cấp sportId của backend.');
    }
    const result = await apiRequest('classes', {
      method: 'POST',
      body: {
        centerId: centerId(),
        sportId: Number(classData.sportId),
        roomId: classData.roomId ? Number(classData.roomId) : null,
        name: classData.name,
        description: classData.description || null,
        level: classData.level || null,
        capacity: Number(classData.capacity),
        durationMinutes: Number(classData.durationMinutes || 60),
        allowWaitlist: classData.allowWaitlist !== false
      }
    });
    return result;
  },

  async update(id, classData) {
    const classId = Number(classData.classId || id);
    if (!Number.isSafeInteger(classId) || classId <= 0) throw new Error('Mã lớp không hợp lệ.');
    if (!Number.isSafeInteger(Number(classData.sportId)) || Number(classData.sportId) <= 0) {
      throw new Error('Không thể sửa lớp: form hiện chưa cung cấp sportId của backend.');
    }
    return apiRequest(`classes/${classId}`, {
      method: 'PUT',
      body: {
        sportId: Number(classData.sportId),
        roomId: classData.roomId ? Number(classData.roomId) : null,
        name: classData.name,
        description: classData.description || null,
        level: classData.level || null,
        capacity: Number(classData.capacity),
        durationMinutes: Number(classData.durationMinutes || 60),
        allowWaitlist: classData.allowWaitlist !== false
      }
    });
  },

  async assignCoach(classId, coachId) {
    return apiRequest(`classes/${Number(classId)}/coaches`, {
      method: 'POST', body: { coachId: Number(coachId), isPrimary: true, replacePrimary: true }
    });
  }
};

export const bookingApi = {
 async getWaitlist() { return asArray(await apiRequest('members/me/session-waitlist')); },
 async leaveWaitlist(id) { return apiRequest('members/me/session-waitlist/'+id, { method: 'DELETE' }); },
 async getForMember(id) { return asArray(await apiRequest('members/'+id+'/session-bookings')).map(mapBooking); },
 async bookForMember(id, sid) { return apiRequest('members/'+id+'/class-sessions/'+sid+'/bookings', { method: 'POST' }); },
 async cancelForMember(id, bid) { return apiRequest('members/'+id+'/session-bookings/'+bid, { method: 'DELETE' }); },
  async getMemberBookings() {
    return asArray(await apiRequest('members/me/session-bookings')).map(mapBooking);
  },

  async bookClass(_memberId, sessionId) {
    const result = await apiRequest(`class-sessions/${sessionId}/bookings`, { method: 'POST' });
    return { ...result, booking: result.booking ? mapBooking(result.booking) : null };
  },

  async cancelBooking(bookingId) {
    return apiRequest(`session-bookings/${bookingId}`, { method: 'DELETE' });
  }
};

export const receptionApi = {
  async lookupMember(query = '') {
    if (query.trim().length < 2) throw new Error('Nhập ít nhất 2 ký tự để tìm hội viên.');
    const params = new URLSearchParams({ query: query.trim(), page: '1', pageSize: '50' });
    const result = await apiRequest(`centers/${centerId()}/members?${params}`);
    const items = [...asArray(result)];
    const totalPages = Math.ceil((result.totalCount || items.length) / (result.pageSize || 50));
    for (let page = 2; page <= totalPages; page += 1) {
      params.set('page', String(page));
      items.push(...asArray(await apiRequest(`centers/${centerId()}/members?${params}`)));
    }
    return items.map(mapMember);
  },

  async createMember({ username, email, password, fullName, phone, dateOfBirth }) {
    const cid = centerId();
    const emailPrefix = (email || '').split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const finalUsername = (username || `${emailPrefix}${Math.floor(100 + Math.random() * 900)}`).toLowerCase();
    const result = await apiRequest(`centers/${cid}/members`, {
      method: 'POST',
      body: {
        username: finalUsername,
        email: email.trim(),
        password: password || 'Member@123456',
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        dateOfBirth: dateOfBirth || null,
        centerId: cid
      }
    });
    return mapMember(result);
  },

  async registerCounterPackage({ memberId, packageId, paymentMethod = 'TIỀN MẶT', amountReceived, posApprovalCode, idempotencyKey, cancelPendingIfAny = false }) {
    const normalizedMethod = paymentMethod === 'TIỀN MẶT' ? 'CASH' : paymentMethod === 'THẺ POS' ? 'POS' : null;
    if (!normalizedMethod) throw new Error('Backend checkout tại quầy chỉ hỗ trợ tiền mặt (CASH) hoặc thẻ POS.');
    if (normalizedMethod === 'POS' && !posApprovalCode?.trim()) {
      throw new Error('Nhập mã chuẩn chi POS trước khi thanh toán.');
    }
    const key = idempotencyKey || createIdempotencyKey();
    const result = await apiRequest('payments/counter-checkout', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: {
        memberId: Number(memberId),
        packageId: Number(packageId),
        paymentMethod: normalizedMethod,
        amountReceived: Number(amountReceived),
        posApprovalCode: posApprovalCode?.trim() || null,
        note: null,
        cancelPendingIfAny: cancelPendingIfAny === true
      }
    });
    return {
      ...result,
      transactionRef: result.transactionRef || result.invoiceNumber,
      registeredAt: result.paidAt,
      paymentMethod: result.paymentMethod,
      member: result.member,
      package: result.package
    };
  },

  async cancelPendingInvoice({ invoiceNumber, packageId, memberId }) {
    return apiRequest('payments/cancel-pending', {
      method: 'POST',
      body: {
        invoiceNumber: invoiceNumber || null,
        packageId: packageId ? Number(packageId) : null,
        memberId: memberId ? Number(memberId) : null
      }
    });
  },

  async getMemberSubscriptions(memberId) {
    if (!memberId) return [];
    return apiRequest(`members/${memberId}/subscriptions`);
  },

  async checkInMember(identifierOrMemberId) {
    const isNum = typeof identifierOrMemberId === 'number';
    const body = isNum
      ? { memberId: identifierOrMemberId }
      : { identifier: String(identifierOrMemberId) };
    return apiRequest(`centers/${centerId()}/checkins`, {
      method: 'POST',
      body
    });
  },

  async getCheckInHistory() {
    return asArray(await apiRequest(`centers/${centerId()}/checkins/today`));
  },

  async requestCheckInReview(identifier, reason, requestedApprover) {
    const term = String(identifier || '').trim();
    if (!term || !reason?.trim()) throw new Error('Nhập mã hội viên và lý do cần xử lý ngoại lệ.');
    const members = await this.lookupMember(term);
    const normalized = term.toLowerCase();
    const exact = members.filter(member => [member.id, member.memberCode, member.email, member.phone, member.username]
      .some(value => String(value || '').toLowerCase() === normalized));
    const candidates = exact.length ? exact : members;
    if (candidates.length !== 1) throw new Error('Nhập chính xác mã, email hoặc số điện thoại của một hội viên để lưu yêu cầu.');
    return this.createSupportRequest({
      memberId: candidates[0].id,
      subject: `Yêu cầu xử lý ngoại lệ check-in · ${candidates[0].memberCode}`,
      description: `Lý do: ${reason.trim()}\nNgười được đề nghị xử lý: ${requestedApprover?.trim() || 'Quản lý trung tâm'}\nĐây là yêu cầu chờ xử lý; chưa phê duyệt check-in hoặc mở cổng.`,
      priority: 'High'
    });
  },

  async getCheckInSummary() {
    return apiRequest(`centers/${centerId()}/checkins/summary`);
  },

  async getInvoices({ query = '', page = 1 } = {}) {
    return apiRequest(`centers/${centerId()}/invoices?${new URLSearchParams({ query: query.trim(), page: String(page), pageSize: '20' })}`);
  },

  async getInvoice(invoiceNumber) {
    return apiRequest(`invoices/${encodeURIComponent(invoiceNumber)}`);
  },

  async recordInvoicePayment(invoiceNumber, { amount, paymentMethod, posApprovalCode, note, idempotencyKey }) {
    if (!idempotencyKey) throw new Error('Thiếu mã chống ghi nhận thanh toán trùng.');
    return apiRequest(`invoices/${encodeURIComponent(invoiceNumber)}/payments`, {
      method: 'POST', headers: { 'Idempotency-Key': idempotencyKey },
      body: { amount: Number(amount), paymentMethod, posApprovalCode: posApprovalCode?.trim() || null, note: note?.trim() || null }
    });
  },

  async getSupportRequests({ query = '', status = '', page = 1 } = {}) {
    return apiRequest(`centers/${centerId()}/support-requests?${new URLSearchParams({ query: query.trim(), status, page: String(page), pageSize: '20' })}`);
  },

  async getSupportRequest(id) {
    return apiRequest(`centers/${centerId()}/support-requests/${Number(id)}`);
  },

  async createSupportRequest({ memberId, subject, description, priority }) {
    return apiRequest(`centers/${centerId()}/support-requests`, {
      method: 'POST', body: { memberId: Number(memberId), subject: subject.trim(), description: description.trim(), priority }
    });
  },

  async updateSupportRequest(id, { status, note }) {
    return apiRequest(`centers/${centerId()}/support-requests/${Number(id)}`, {
      method: 'PATCH', body: { status, note: note?.trim() || null }
    });
  }
};

export const memberApi = {
  async getCenterMembers(query = '', page = 1) {
    const params = new URLSearchParams({ query: query.trim(), page: String(page), pageSize: '20' });
    return apiRequest(`centers/${centerId()}/members?${params}`);
  },

  async updateAtCenter(id, body) {
    return apiRequest(`centers/${centerId()}/members/${id}`, { method: 'PATCH', body });
  },

  async setAccountStatus(id, status) {
    return apiRequest(`centers/${centerId()}/members/${id}/status`, { method: 'PATCH', body: { status } });
  },

  async subscribeOnline({ packageId, paymentMethod = 'VNPAY', invoiceNumber, cancelPendingIfAny }) {
    const provider = {
      VNPAY: 'create-vnpay-url',
      MOMO: 'create-momo-url'
    }[paymentMethod];
    if (!provider) throw new Error('Cổng thanh toán không được hỗ trợ.');
    return apiRequest(`payments/${provider}`, {
      method: 'POST',
      headers: { 'Idempotency-Key': createIdempotencyKey() },
      body: {
        packageId: Number(packageId),
        invoiceNumber: invoiceNumber || null,
        cancelPendingIfAny: !!cancelPendingIfAny
      }
    });
  },

  async getMyPendingInvoices() {
    return apiRequest('payments/my-pending-invoices');
  },

  async cancelPendingInvoice(invoiceNumber) {
    return apiRequest(`payments/pending-invoice/${encodeURIComponent(invoiceNumber)}`, {
      method: 'DELETE'
    });
  },

  async cancelPendingPackage(packageId) {
    return apiRequest(`payments/pending-package/${packageId}`, {
      method: 'DELETE'
    });
  },

  async getMyProgress() {
    return asArray(await apiRequest('members/me/progress'));
  },

  async getMyPlans() {
    return asArray(await apiRequest('members/me/training-plans'));
  }
};

export const reportApi = {
  async getOverview(period = 'MONTH') {
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
    const year = Number(today.slice(0, 4));
    const month = Number(today.slice(5, 7));
    let from = `${today.slice(0, 7)}-01`;
    if (period === 'DAY') from = today;
    if (period === 'WEEK') {
      const current = new Date(`${today}T00:00:00Z`);
      const mondayOffset = (current.getUTCDay() + 6) % 7;
      current.setUTCDate(current.getUTCDate() - mondayOffset);
      from = current.toISOString().slice(0, 10);
    }
    if (period === 'YEAR') from = `${year}-01-01`;
    if (period === 'QUARTER') {
      const firstQuarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
      from = `${year}-${String(firstQuarterMonth).padStart(2, '0')}-01`;
    }
    const to = typeof period === 'object' ? period.to : today;
    if (typeof period === 'object') from = period.from;
    const groupBy = typeof period === 'object' ? period.groupBy || 'day' : 'day';
    const startDate = new Date(`${from}T00:00:00Z`), endDate = new Date(`${to}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '')
        || !Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())
        || startDate.toISOString().slice(0, 10) !== from || endDate.toISOString().slice(0, 10) !== to
        || from > to || (endDate - startDate) / 86400000 > 365 || !['day', 'month'].includes(groupBy)) {
      throw new Error('Chọn khoảng ngày hợp lệ, tối đa 366 ngày, nhóm theo ngày hoặc tháng.');
    }
    const query = new URLSearchParams({ from, to, groupBy, centerId: String(centerId()) });
    const checkinQuery = new URLSearchParams({ from: today, to: today });
    const [revenue, sportRevenue, membership, classes, sessionItems, checkins, rawRooms, rawClasses] = await Promise.all([
      apiRequest(`reports/revenue?${query}`),
      apiRequest(`reports/revenue-by-sport?${new URLSearchParams({ from, to, centerId: String(centerId()) })}`),
      apiRequest(`reports/membership?${query}`),
      apiRequest(`reports/classes?${query}`),
      loadSessionsBetween(from, to),
      apiRequest(`reports/checkins?${checkinQuery}`),
      apiRequest(`centers/${centerId()}/rooms`).catch(() => []),
      apiRequest(`centers/${centerId()}/classes/all`).catch(() => [])
    ]);
    const capacity = sessionItems.reduce((sum, item) => sum + (item.capacity || 0), 0);
    const booked = sessionItems.reduce((sum, item) => sum + (item.bookedCount || 0), 0);
    const activeBookingCount = Object.entries(classes.currentStatusCounts || {})
      .filter(([status]) => /book|confirm|wait/i.test(status))
      .reduce((sum, [, count]) => sum + Number(count || 0), 0);

    const roomsList = asArray(rawRooms);
    const classesList = asArray(rawClasses);
    const roomMap = new Map(roomsList.map(r => [r.id, r]));
    const classDefMap = new Map(classesList.map(c => [c.id, c]));

    // 1. Seed classes stats
    const classStatsMap = new Map();
    for (const c of classesList) {
      classStatsMap.set(c.id, {
        id: c.id,
        name: c.name,
        sportName: c.sportName,
        coachName: c.coachName || 'Chưa gán HLV',
        roomName: c.roomName || roomMap.get(c.roomId)?.name || 'Chưa gán sân',
        sessionsCount: 0,
        booked: 0,
        capacity: 0,
        occupancyRate: 0
      });
    }

    // 2. Seed room stats
    const roomStatsMap = new Map();
    for (const r of roomsList) {
      roomStatsMap.set(r.id, {
        id: r.id,
        name: r.name,
        type: r.type || 'Sân/Phòng',
        location: r.location || '',
        unitCapacity: r.capacity || 0,
        sessionsCount: 0,
        booked: 0,
        capacity: 0,
        occupancyRate: 0,
        classes: new Set()
      });
    }

    // 3. Seed sport stats
    const sportStatsMap = new Map();

    for (const s of sessionItems) {
      // Class
      let cStat = classStatsMap.get(s.classId);
      if (!cStat) {
        cStat = {
          id: s.classId,
          name: s.className,
          sportName: s.sportName,
          coachName: s.coachName || 'Chưa gán HLV',
          roomName: (roomMap.get(s.roomId)?.name) || 'Chưa gán sân',
          sessionsCount: 0,
          booked: 0,
          capacity: 0,
          occupancyRate: 0
        };
        classStatsMap.set(s.classId, cStat);
      }
      cStat.sessionsCount += 1;
      cStat.booked += (s.bookedCount || 0);
      cStat.capacity += (s.capacity || 0);

      // Room
      const targetRoomId = s.roomId || classDefMap.get(s.classId)?.roomId;
      if (targetRoomId) {
        let rStat = roomStatsMap.get(targetRoomId);
        if (!rStat) {
          rStat = {
            id: targetRoomId,
            name: `Phòng ${targetRoomId}`,
            type: 'Sân/Phòng',
            location: '',
            unitCapacity: s.capacity || 0,
            sessionsCount: 0,
            booked: 0,
            capacity: 0,
            occupancyRate: 0,
            classes: new Set()
          };
          roomStatsMap.set(targetRoomId, rStat);
        }
        rStat.sessionsCount += 1;
        rStat.booked += (s.bookedCount || 0);
        rStat.capacity += (s.capacity || 0);
        if (s.className) rStat.classes.add(s.className);
      }

      // Sport
      const sportName = s.sportName || 'Khác';
      let spStat = sportStatsMap.get(sportName);
      if (!spStat) {
        spStat = {
          name: sportName,
          booked: 0,
          capacity: 0,
          sessionsCount: 0,
          classes: new Set()
        };
        sportStatsMap.set(sportName, spStat);
      }
      spStat.booked += (s.bookedCount || 0);
      spStat.capacity += (s.capacity || 0);
      spStat.sessionsCount += 1;
      if (s.className) spStat.classes.add(s.className);
    }

    const totalBookedAll = [...sportStatsMap.values()].reduce((sum, sp) => sum + sp.booked, 0);

    const topClasses = [...classStatsMap.values()]
      .map(c => ({
        ...c,
        occupancyRate: c.capacity > 0 ? Math.round((c.booked / c.capacity) * 100) : 0
      }))
      .sort((a, b) => b.booked - a.booked || b.occupancyRate - a.occupancyRate || b.sessionsCount - a.sessionsCount);

    const topRooms = [...roomStatsMap.values()]
      .map(r => ({
        ...r,
        classesCount: r.classes.size,
        classesList: [...r.classes],
        occupancyRate: r.capacity > 0 ? Math.round((r.booked / r.capacity) * 100) : 0
      }))
      .sort((a, b) => b.booked - a.booked || b.sessionsCount - a.sessionsCount || b.occupancyRate - a.occupancyRate);

    const topSports = [...sportStatsMap.values()]
      .map(sp => ({
        name: sp.name,
        booked: sp.booked,
        capacity: sp.capacity,
        sessionsCount: sp.sessionsCount,
        classesCount: sp.classes.size,
        percentage: sp.capacity > 0 ? Math.round((sp.booked / sp.capacity) * 100) : 0,
        share: totalBookedAll > 0 ? Math.round((sp.booked / totalBookedAll) * 100) : 0
      }))
      .sort((a, b) => b.booked - a.booked || b.percentage - a.percentage);

    return {
      from, to, groupBy,
      totalMembers: membership.totalMembers,
      activeMembers: membership.activeMembers,
      newMembers: membership.newMembers,
      membershipPeriods: membership.periods || [],
      classStatusCounts: classes.currentStatusCounts || {},
      classPeriods: classes.periods || [],
      totalClasses: sessionItems.length,
      totalBookings: activeBookingCount,
      todayCheckins: checkins.count,
      occupancyRate: capacity ? Math.round((booked / capacity) * 100) : 0,
      netRevenue: revenue.net,
      monthlyRevenue: revenue.net,
      grossRevenue: revenue.gross,
      refundedRevenue: revenue.refunds,
      revenueGrowth: null,
      revenuePeriods: revenue.periods || [],
      revenueBySport: sportRevenue.sports || [],
      allocatedSportRevenue: sportRevenue.allocatedNet || 0,
      unallocatedSportRevenue: sportRevenue.unallocatedNet || 0,
      utilizationBySport: topSports.map(item => ({
        name: item.name,
        capacity: item.capacity,
        booked: item.booked,
        percentage: item.percentage
      })),
      topSports,
      topClasses,
      topRooms,
      highlights: {
        mostPopularClass: topClasses[0] || null,
        mostPopularSport: topSports[0] || null,
        highestRevenueSport: (sportRevenue.sports || []).find(item => item.sportId != null) || null,
        mostBookedRoom: topRooms[0] || null
      }
    };
  }
};

export const systemApi = {
  async getAuditLogs() {
    return (await this.getAuditPage()).items;
  },

  async getAuditPage(page = 1) {
    const user = getAuthUser();
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    const isAdmin = String(user?.role || '').toUpperCase() === 'ADMIN';
    const path = isAdmin
      ? `admin/audit-logs?${params}`
      : `centers/${centerId()}/audit-logs?${params}`;
    const result = await apiRequest(path);
    const items = asArray(result).map(item => {
      const role = item.actorUserId ? null : 'SYSTEM';
      let userName = item.actorUserId ? `User #${item.actorUserId}` : 'Hệ thống';

      const searchContent = [
        item.action,
        item.actorUserId ? `User #${item.actorUserId}` : 'Hệ thống',
        item.entityType,
        item.newValues,
        item.oldValues
      ].filter(Boolean).join(' ').toLowerCase();

      return {
        ...item,
        userId: item.actorUserId,
        userName,
        role,
        details: item.newValues || item.oldValues || item.entityType,
        newValues: item.newValues,
        oldValues: item.oldValues,
        status: 'SUCCESS',
        timestamp: item.createdAt,
        searchIndex: searchContent
      };
    });
    return { items, page: result.page || page, pageSize: result.pageSize || 50, totalCount: result.totalCount ?? items.length };
  },

  async getPermissions() {
    const isManager = String(getAuthUser()?.role || '').toUpperCase() === 'MANAGER';
    if (isManager) return asArray(await apiRequest(`centers/${centerId()}/roles`));
    const [matrix, catalog] = await Promise.all([apiRequest('admin/roles'), apiRequest('admin/permissions')]);
    return asArray(matrix).map(row => ({ ...row, availablePermissions: asArray(catalog) }));
  },

  // Cập nhật quyền theo roleId (PUT /api/admin/roles/{roleId}/permissions)
  async updatePermissions(roleId, permissionCodes, capabilityIds = []) {
    const isManager = String(getAuthUser()?.role || '').toUpperCase() === 'MANAGER';
    return apiRequest(isManager ? `centers/${centerId()}/roles/${roleId}/permissions` : `admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: isManager ? { permissionCodes, capabilityIds } : { permissionCodes }
    });
  },

  resetAllData() {
    throw new Error('Không có API xóa toàn bộ dữ liệu.');
  }
};
