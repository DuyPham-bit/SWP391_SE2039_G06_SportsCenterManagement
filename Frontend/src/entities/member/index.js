/**
 * Entity: Member
 * Đại diện dữ liệu và các helper liên quan đến thực thể Hội viên (Member).
 */
export function formatMemberName(member) {
  if (!member) return '';
  return member.fullName || member.name || member.userName || 'Hội viên';
}

export function isMembershipActive(member) {
  if (!member) return false;
  if (member.status === 'Active' || member.status === 'Đang hoạt động') return true;
  if (member.expiryDate) {
    return new Date(member.expiryDate).getTime() > Date.now();
  }
  return false;
}

export { MemberAvatar } from './ui/MemberAvatar.jsx';
export { MemberStatusBadge } from './ui/MemberStatusBadge.jsx';
