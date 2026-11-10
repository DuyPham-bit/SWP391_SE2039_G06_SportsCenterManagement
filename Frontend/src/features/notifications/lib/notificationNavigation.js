// Trích xuất ngày (ISO YYYY-MM-DD), tên lớp, tên học viên từ nội dung thông báo
export function parseNotificationDetails(item) {
  if (!item) return {};
  const text = (String(item.title || '') + ' ' + String(item.content || item.message || '')).trim();

  // 1. Tìm ngày tháng dạng "ngày 27/10/2026" hoặc "27/10/2026" hoặc "2026-10-27"
  let isoDate = null;
  const viDateMatch = text.match(/ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i) || text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (viDateMatch) {
    const d = viDateMatch[1].padStart(2, '0');
    const m = viDateMatch[2].padStart(2, '0');
    const y = viDateMatch[3];
    isoDate = `${y}-${m}-${d}`;
  } else {
    const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) isoDate = isoMatch[1];
  }

  // 2. Tìm tên lớp học sau dấu ":" ví dụ "đã đặt buổi học: Cầu lông Nâng cao Tấn công & Di chuyển, ngày..."
  let className = null;
  const classMatch = text.match(/(?:buổi học|lớp|khóa học|chỗ học):\s*([^,]+)/i);
  if (classMatch) {
    className = classMatch[1].trim();
  }

  // 3. Tìm tên học viên ở đầu câu (ví dụ "Hoàng Hải Yến đã đặt...")
  let memberName = null;
  const memberMatch = text.match(/^([A-ZÀ-Ỹa-zà-ỹ\s]+?)\s+(?:đã đặt|đã hủy|đã tham gia|đã đăng ký)/i);
  if (memberMatch) {
    memberName = memberMatch[1].trim();
  }

  return { isoDate, className, memberName };
}

export function notificationTarget(item, role) {
  if (!item) return null;
  const type = String(item.notificationType || '');
  const title = String(item.title || item.titleVi || item.titleEn || '').toLowerCase();
  const content = String(item.content || item.contentVi || item.contentEn || item.message || '').toLowerCase();
  const normalizedRole = String(role || '').toUpperCase();
  const { isoDate, className } = parseNotificationDetails(item);

  // Tham số URL hỗ trợ định vị chính xác chức năng & đối tượng
  const buildScheduleParams = (base) => {
    const params = new URLSearchParams();
    if (isoDate) params.set('date', isoDate);
    if (className) params.set('search', className);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  // 1. Refund Requested & Reviewed
  if (type === 'RefundRequested' && ['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/invoices?tab=refunds';
  if (type === 'RefundReviewed' && normalizedRole === 'MEMBER') return '#/member/refunds';
  if ((type === 'RefundRequested' || type === 'RefundReviewed') && ['MANAGER', 'ADMIN'].includes(normalizedRole)) {
    return '#/manager/invoices?tab=refunds';
  }

  // 2. Coach Leave & Leave Reviewed
  if (type === 'CoachLeave' && ['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/coach-operations?tab=leaves';
  if (type === 'CoachLeaveReviewed' && normalizedRole === 'COACH') return '#/coach/professional?tab=schedule';

  // 3. Coach Chat & Direct Messages
  if (type === 'CoachChat' || type === 'CoachMessage') {
    const sender = item.senderId ? `&senderUserId=${encodeURIComponent(item.senderId)}` : '';
    if (normalizedRole === 'COACH') return `#/coach/messages?tab=communication${sender}`;
    if (normalizedRole === 'MEMBER') return `#/member/coach-portal?tab=chat${sender}`;
  }

  // 4. Booking created / cancelled (CoachBookingCreated, CoachBookingCancelled, BookingConfirmed, BookingCancelled, WaitlistJoined, WaitlistPromoted)
  if (
    type === 'CoachBookingCreated' ||
    type === 'CoachBookingCancelled' ||
    type === 'BookingConfirmed' ||
    type === 'BookingCancelled' ||
    type === 'WaitlistJoined' ||
    type === 'WaitlistPromoted' ||
    type === 'ClassReminder' ||
    title.includes('đặt lịch') ||
    title.includes('hủy lịch') ||
    title.includes('đặt lớp') ||
    title.includes('hủy đặt lớp') ||
    title.includes('nhắc lịch') ||
    title.includes('nhắc nhở buổi học') ||
    title.includes('danh sách chờ') ||
    content.includes('đã đặt buổi học') ||
    content.includes('đã hủy buổi học')
  ) {
    if (normalizedRole === 'COACH') return buildScheduleParams('#/coach/schedule');
    if (normalizedRole === 'MEMBER') {
      if (title.includes('hủy') || type === 'BookingCancelled') {
        const params = new URLSearchParams();
        if (className) params.set('search', className);
        const qs = params.toString();
        return qs ? `#/member/bookings?${qs}` : '#/member/bookings';
      }
      return buildScheduleParams('#/member/schedule');
    }
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) {
      const params = new URLSearchParams();
      if (className) params.set('search', className);
      const qs = params.toString();
      return qs ? `#/manager/classes-rooms?${qs}` : '#/manager/classes-rooms';
    }
    if (normalizedRole === 'RECEPTIONIST') return buildScheduleParams('#/receptionist/bookings');
  }

  // 5. Membership activated / payment successful
  if (
    type === 'MembershipActivated' ||
    title.includes('gói tập') ||
    title.includes('thanh toán thành công') ||
    content.includes('gói tập') ||
    content.includes('thanh toán')
  ) {
    if (normalizedRole === 'MEMBER') return '#/member/packages';
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/invoices';
    if (normalizedRole === 'RECEPTIONIST') return '#/receptionist/invoices';
  }

  // 6. Support requests
  if (
    type === 'SupportRequest' ||
    type === 'SupportRequestCreated' ||
    type === 'SupportRequestUpdated' ||
    title.includes('hỗ trợ') ||
    content.includes('yêu cầu hỗ trợ')
  ) {
    if (normalizedRole === 'MEMBER') return '#/member/support';
    if (normalizedRole === 'COACH') return '#/coach/support';
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/support-communications';
    if (normalizedRole === 'RECEPTIONIST') return '#/receptionist/support';
  }

  // 7. Attendance
  if (title.includes('điểm danh') || content.includes('điểm danh') || title.includes('chuyên cần')) {
    if (normalizedRole === 'COACH') return buildScheduleParams('#/coach/attendance');
    if (normalizedRole === 'MEMBER') return '#/member/attendance';
  }

  // 8. Homework & Workout plans
  if (title.includes('bài tập') || content.includes('bài tập') || title.includes('kế hoạch tập') || title.includes('giáo án')) {
    if (normalizedRole === 'COACH') return '#/coach/training-plan';
    if (normalizedRole === 'MEMBER') return '#/member/progress';
  }

  // 9. Equipment Issue
  if (type === 'EquipmentIssue' || title.includes('thiết bị') || title.includes('sự cố')) {
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/coach-operations?tab=equipment';
    if (normalizedRole === 'COACH') return '#/coach/professional?tab=equipment';
  }

  // 10. General Refund text fallback
  if (title.includes('hoàn tiền') || content.includes('hoàn tiền')) {
    if (normalizedRole === 'MEMBER') return '#/member/refunds';
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/invoices?tab=refunds';
  }

  // 11. General Chat / Message text fallback
  if (title.includes('tin nhắn') || content.includes('tin nhắn')) {
    const sender = item.senderId ? `&senderUserId=${encodeURIComponent(item.senderId)}` : '';
    if (normalizedRole === 'COACH') return `#/coach/messages?tab=communication${sender}`;
    if (normalizedRole === 'MEMBER') return `#/member/coach-portal?tab=chat${sender}`;
  }

  // 12. Role-based fallback so user can always navigate somewhere meaningful
  if (normalizedRole === 'COACH') return '#/coach/schedule';
  if (normalizedRole === 'MEMBER') return '#/member/schedule';
  if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/dashboard';
  if (normalizedRole === 'RECEPTIONIST') return '#/receptionist/dashboard';

  return null;
}

export function getNotificationActionLabel(item, role, isEn = false) {
  const target = notificationTarget(item, role);
  if (!target) return isEn ? 'View details →' : 'Xem chi tiết →';

  if (target.includes('messages') || target.includes('coach-portal')) {
    return isEn ? 'Open conversation & reply →' : 'Mở cuộc trò chuyện & trả lời →';
  }
  if (target.includes('attendance')) {
    return isEn ? 'Check attendance →' : 'Điểm danh học viên →';
  }
  if (target.includes('training-plan') || target.includes('progress')) {
    return isEn ? 'View training plan →' : 'Xem giáo án & tiến độ →';
  }
  if (target.includes('schedule') || target.includes('bookings') || target.includes('classes')) {
    const norm = String(role || '').toUpperCase();
    if (norm === 'COACH') return isEn ? 'View teaching schedule →' : 'Xem lịch dạy buổi học →';
    if (norm === 'MEMBER') return isEn ? 'View schedule & bookings →' : 'Xem lịch học của tôi →';
    return isEn ? 'View class schedule →' : 'Xem lịch lớp học →';
  }
  if (target.includes('refunds') || target.includes('invoices')) {
    return isEn ? 'View invoices & refunds →' : 'Xem hóa đơn & hoàn tiền →';
  }
  if (target.includes('support')) {
    return isEn ? 'View support request →' : 'Xem yêu cầu hỗ trợ →';
  }
  if (target.includes('coach-operations')) {
    return isEn ? 'View coach operations →' : 'Quản lý HLV & Duyệt đơn →';
  }
  if (target.includes('packages')) {
    return isEn ? 'View membership packages →' : 'Xem gói tập hội viên →';
  }
  return isEn ? 'View details →' : 'Xem chi tiết →';
}
