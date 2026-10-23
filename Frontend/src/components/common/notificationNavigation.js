export function notificationTarget(item, role) {
  if (item.notificationType !== 'CoachChat') return null;
  const sender = item.senderId ? `&senderUserId=${encodeURIComponent(item.senderId)}` : '';
  if (role === 'COACH') return `#/coach/messages?tab=communication${sender}`;
  if (role === 'MEMBER') return `#/member/coach-portal?tab=chat${sender}`;
  return null;
}
