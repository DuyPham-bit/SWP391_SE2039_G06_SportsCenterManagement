import { AVATAR_GRADIENTS } from '../../../shared/lib/avatarGradient.js';

export const getRoleConfig = (isEn) => ({
  COACH: {
    label: isEn ? 'Coach / Instructor' : 'Huấn luyện viên',
    shortLabel: isEn ? 'Coach' : 'HLV',
    icon: 'sports',
    badgeClass: 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800',
    avatarGrad: 'from-brand-sand-600 to-brand-sand-700',
    desc: isEn
      ? 'Responsible for teaching sports classes, tracking session attendance, and designing workout regimens.'
      : 'Phụ trách giảng dạy các lớp thể thao, điểm danh ca học và xây dựng giáo án huấn luyện.'
  },
  RECEPTIONIST: {
    label: isEn ? 'Front Desk Receptionist' : 'Lễ tân quầy',
    shortLabel: isEn ? 'Receptionist' : 'Lễ tân',
    icon: 'support_agent',
    badgeClass: 'bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-200 dark:border-brand-navy-800',
    avatarGrad: 'from-brand-navy-700 to-brand-navy-800',
    desc: isEn
      ? 'Handles gate check-in, counter package sales, invoices, and customer support inquiries.'
      : 'Quét thẻ check-in vào cổng, thu ngân bán gói tập tại quầy và tiếp nhận yêu cầu hỗ trợ.'
  },
  MANAGER: {
    label: isEn ? 'Center Manager' : 'Quản lý trung tâm',
    shortLabel: isEn ? 'Manager' : 'Quản lý',
    icon: 'admin_panel_settings',
    badgeClass: 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800',
    avatarGrad: 'from-brand-sage-700 to-brand-sage-900',
    desc: isEn
      ? 'Operates center facilities, staff assignments, class timetables, and Olympic SCMS operations.'
      : 'Vận hành toàn bộ cơ sở vật chất, nhân sự, lịch học và phân quyền hệ thống SCMS.'
  },
  ADMIN: {
    label: isEn ? 'System Administrator' : 'Quản trị viên',
    shortLabel: 'Admin',
    icon: 'shield_person',
    badgeClass: 'bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 border-brand-danger-200 dark:border-brand-danger-800',
    avatarGrad: 'from-brand-navy-900 to-brand-navy-800',
    desc: isEn
      ? 'Highest security administrator for system audit logs, user permissions, and center operations.'
      : 'Quản trị viên điều hành toàn bộ cụm trung tâm và quản lý quyền hệ thống SCMS.'
  }
});

export function getAvatarGradient(name = '', role = '', roleConfig = {}) {
  if (role && roleConfig[role]?.avatarGrad) {
    return roleConfig[role].avatarGrad;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function getInitials(name = '') {
  if (!name) return 'NV';
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'NV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
