import { attendanceRestriction, sessionTime } from '../../../entities/coach/index.js';

export const getAttendanceStatuses = (isEn) => ({
  PRESENT: {
    label: isEn ? 'Present' : 'Có mặt',
    icon: 'check_circle',
    activeClass: 'bg-brand-sage-700 text-white shadow-sm ring-2 ring-brand-sage-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-brand-sage-50 hover:text-brand-sage-700 text-brand-navy-700 border-brand-navy-200',
    statClass: 'bg-brand-sage-50 text-brand-sage-800 border-brand-sage-200',
    dotClass: 'bg-brand-sage-500'
  },
  ABSENT: {
    label: isEn ? 'Absent' : 'Vắng mặt',
    icon: 'cancel',
    activeClass: 'bg-brand-danger-600 text-white shadow-sm ring-2 ring-brand-danger-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-brand-danger-50 hover:text-brand-danger-700 text-brand-navy-700 border-brand-navy-200',
    statClass: 'bg-brand-danger-50 text-brand-danger-800 border-brand-danger-200',
    dotClass: 'bg-brand-danger-500'
  },
  EXCUSED: {
    label: isEn ? 'Excused' : 'Vắng có phép',
    icon: 'event_available',
    activeClass: 'bg-brand-teal-700 text-white shadow-sm ring-2 ring-brand-teal-500/30 font-bold',
    inactiveClass: 'bg-white hover:bg-brand-teal-50 hover:text-brand-teal-700 text-brand-navy-700 border-brand-navy-200',
    statClass: 'bg-brand-teal-50 text-brand-teal-800 border-brand-teal-200',
    dotClass: 'bg-brand-teal-500'
  }
});

export function getSessionStatusInfo(session, isEn = false) {
  if (!session) return { label: isEn ? 'Unknown' : 'Không xác định', color: 'slate' };
  if (session.status === 'CANCELLED') {
    return { label: isEn ? 'Cancelled' : 'Đã hủy', badge: 'bg-brand-danger-100 text-brand-danger-800 border-brand-danger-300', dot: 'bg-brand-danger-500', isCancelled: true };
  }
  const now = Date.now();
  const start = sessionTime(session, false);
  const end = sessionTime(session, true);

  if (now < start) {
    return { label: isEn ? 'Upcoming' : 'Chưa tới giờ', badge: 'bg-brand-sand-100 text-brand-sand-800 border-brand-sand-300', dot: 'bg-brand-sand-500', isUpcoming: true };
  }
  if (now >= start && now <= end) {
    return { label: isEn ? 'Happening' : 'Đang diễn ra', badge: 'bg-brand-sage-100 text-brand-sage-800 border-brand-sage-300', dot: 'bg-brand-sage-500 animate-pulse', isHappening: true };
  }
  return { label: isEn ? 'Ended' : 'Đã kết thúc', badge: 'bg-brand-navy-100 text-brand-navy-800 border-brand-navy-300', dot: 'bg-brand-navy-400', isEnded: true };
}

export function getAttendanceRestrictionInfo(session, isEn = false) {
  const restriction = attendanceRestriction(session);
  if (restriction === 'PAST_DATE') {
    return {
      title: isEn ? 'This session has already passed and attendance cannot be edited.' : 'Buổi học đã qua ngày nên không thể sửa điểm danh.',
      description: isEn ? 'Attendance results can only be recorded on the day of the session.' : 'Kết quả điểm danh chỉ được cập nhật trong đúng ngày diễn ra buổi học.'
    };
  }
  if (restriction === 'CANCELLED') {
    return {
      title: isEn ? 'This session has been cancelled. Attendance cannot be taken.' : 'Buổi học này đã bị hủy. Hệ thống không cho phép thực hiện điểm danh.',
      description: isEn ? 'Please contact management if you need to restore this session.' : 'Vui lòng liên hệ bộ phận quản lý nếu cần khôi phục buổi học.'
    };
  }
  return {
    title: isEn ? 'Session has not started yet.' : 'Buổi học chưa đến giờ bắt đầu.',
    description: isEn
      ? `Session scheduled at ${session?.timeSlot || ''} on ${session?.sessionDate || ''}. Coaches can preview the student roster; attendance saving will unlock when the session starts.`
      : `Buổi học diễn ra lúc ${session?.timeSlot || ''} ngày ${session?.sessionDate || ''}. Huấn luyện viên có thể xem trước danh sách học viên; chức năng lưu điểm danh sẽ mở khi ca học bắt đầu.`
  };
}
