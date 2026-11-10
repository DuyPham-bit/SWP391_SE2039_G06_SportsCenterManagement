import { asArray } from '../../../shared/api/apiUtils.js';
import { apiRequest } from '../../../shared/api/http.js';

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
