export function notificationTarget(item, role) {
  if (!item) return null;
  const type = String(item.notificationType || '');
  const title = String(item.title || item.titleVi || item.titleEn || '').toLowerCase();
  const content = String(item.content || item.contentVi || item.contentEn || item.message || '').toLowerCase();
  const normalizedRole = String(role || '').toUpperCase();

  // 1. Refund Requested & Reviewed
  if (type === 'RefundRequested' && ['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/invoices?tab=refunds';
  if (type === 'RefundReviewed' && normalizedRole === 'MEMBER') return '#/member/refunds';
  if ((type === 'RefundRequested' || type === 'RefundReviewed') && ['MANAGER', 'ADMIN'].includes(normalizedRole)) {
    return '#/manager/invoices?tab=refunds';
  }

  // 2. Coach Leave & Leave Reviewed
  if (type === 'CoachLeave' && ['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/coach-operations';
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
    if (normalizedRole === 'COACH') return '#/coach/schedule';
    if (normalizedRole === 'MEMBER') {
      if (title.includes('hủy') || type === 'BookingCancelled') return '#/member/bookings';
      return '#/member/schedule';
    }
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/classes-rooms';
    if (normalizedRole === 'RECEPTIONIST') return '#/receptionist/bookings';
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

  // 7. Equipment Issue
  if (type === 'EquipmentIssue' || title.includes('thiết bị') || title.includes('sự cố')) {
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/coach-operations';
    if (normalizedRole === 'COACH') return '#/coach/professional';
  }

  // 8. General Refund text fallback
  if (title.includes('hoàn tiền') || content.includes('hoàn tiền')) {
    if (normalizedRole === 'MEMBER') return '#/member/refunds';
    if (['MANAGER', 'ADMIN'].includes(normalizedRole)) return '#/manager/invoices?tab=refunds';
  }

  // 9. General Chat / Message text fallback
  if (title.includes('tin nhắn') || content.includes('tin nhắn')) {
    const sender = item.senderId ? `&senderUserId=${encodeURIComponent(item.senderId)}` : '';
    if (normalizedRole === 'COACH') return `#/coach/messages?tab=communication${sender}`;
    if (normalizedRole === 'MEMBER') return `#/member/coach-portal?tab=chat${sender}`;
  }

  // 10. Role-based fallback so user can always navigate somewhere meaningful
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
