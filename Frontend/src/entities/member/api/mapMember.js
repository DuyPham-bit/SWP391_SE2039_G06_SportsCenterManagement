import { getStoredAvatar } from '../../../shared/lib/avatarHelper.js';

export function mapMember(member) {
  let expiryStr = null;
  if (member.packageExpiry) {
    expiryStr = typeof member.packageExpiry === 'string'
      ? member.packageExpiry.split('T')[0]
      : String(member.packageExpiry);
  }

  const pkgStatus = (member.packageStatus || 'INACTIVE').toUpperCase();

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
    avatar: getStoredAvatar(member.userId || member.id)
  };
}
