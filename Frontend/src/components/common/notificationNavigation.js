export function notificationTarget(item, role) {
  const type = String(item.notificationType || '');
  if (type === 'RefundRequested' && ['MANAGER', 'ADMIN'].includes(role)) return '#/manager/invoices?tab=refunds';
  if (type === 'RefundReviewed' && role === 'MEMBER') return '#/member/refunds';
  if (type === 'CoachLeave' && role === 'MANAGER') return '#/manager/coach-operations';
  if (type === 'CoachLeaveReviewed' && role === 'COACH') return '#/coach/professional?tab=schedule';
  if (type !== 'CoachChat') return null;
  const sender = item.senderId ? `&senderUserId=${encodeURIComponent(item.senderId)}` : '';
  if (role === 'COACH') return `#/coach/messages?tab=communication${sender}`;
  if (role === 'MEMBER') return `#/member/coach-portal?tab=chat${sender}`;
  return null;
}
