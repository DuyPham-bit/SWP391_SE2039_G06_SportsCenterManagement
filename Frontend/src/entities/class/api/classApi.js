import { asArray, centerId } from '../../../shared/api/apiUtils.js';
import { getAuthUser } from '../../../shared/api/authState.js';
import { apiRequest } from '../../../shared/api/http.js';

export async function loadSessionsBetween(from, to) {
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

function mapSession(item) {
  const date = String(item.sessionDate || '');
  const parsedDate = date ? new Date(`${date}T12:00:00Z`) : null;
  const dayLabels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayOfWeek = parsedDate && !Number.isNaN(parsedDate.valueOf()) ? dayLabels[parsedDate.getUTCDay()] : '';
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
    isBookable: Boolean(item.isBookable), allowWaitlist: Boolean(item.allowWaitlist),
    // Member-only, computed by the backend (see ClassScheduleQueryService.ResolveButtonState).
    buttonState: item.buttonState || null,
    bookingId: item.bookingId || null
  };
}

export const classApi = {
 async getTeachingSchedule(from, to, includeHistory = true) {
   const query = new URLSearchParams({ from, to, includeHistory: String(Boolean(includeHistory)) });
   return asArray(await apiRequest('coaches/me/teaching-schedule?'+query)).map(mapSession);
 },
 /** Opening hours of the signed-in staff member's center, as configured by the Admin (stored in the DB). */
 async getCenterHours() {
   const catalog = await apiRequest('public/centers/'+centerId()+'/catalog', { session: null });
   return { openingTime: catalog?.center?.openingTime || null, closingTime: catalog?.center?.closingTime || null };
 },
 async getManagementClasses() { return asArray(await apiRequest('centers/'+centerId()+'/classes/all')); },
 // Member self-enrollment: sport → coach → class tree with per-class eligibility from the backend.
 /** Current package entitlements: allowed sports, cancel window, active sport count. */
 async getMyEntitlements() { return apiRequest('members/me/entitlements'); },
 async getEnrollmentOptions() { return apiRequest('members/me/enrollment-options?centerId='+centerId()); },
 async enroll(classId, subscriptionId) {
   return apiRequest('classes/'+Number(classId)+'/enrollments', { method: 'POST', body: { subscriptionId: Number(subscriptionId) } });
 },
 async cancelEnrollment(classId, enrollmentId, reason) {
   return apiRequest('classes/'+Number(classId)+'/enrollments/'+Number(enrollmentId), { method: 'DELETE', body: { reason: reason || null } });
 },
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
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
    const end = new Date(`${today}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 90);
    const query = new URLSearchParams({ from: today, to: end.toISOString().slice(0, 10), page: '1', pageSize: '100' });
    const isCoach = String(getAuthUser()?.role || '').toUpperCase() === 'COACH';
    const path = isCoach ? `coaches/me/teaching-schedule?from=${today}&to=${end.toISOString().slice(0, 10)}` : `class-sessions?${query}`;
    const result = isCoach ? await apiRequest(path) : await loadSessionsBetween(today, end.toISOString().slice(0, 10));
    return asArray(result).map(mapSession);
  },

  async create(classData) {
    if (!Number.isSafeInteger(Number(classData.sportId)) || Number(classData.sportId) <= 0) {
      throw new Error('Vui lòng chọn bộ môn hợp lệ trước khi tạo lớp.');
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
      throw new Error('Vui lòng chọn bộ môn hợp lệ trước khi cập nhật lớp.');
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
