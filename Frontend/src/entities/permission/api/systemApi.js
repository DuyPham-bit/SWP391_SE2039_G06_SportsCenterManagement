import { asArray, centerId } from '../../../shared/api/apiUtils.js';
import { getAuthUser } from '../../../shared/api/authState.js';
import { apiRequest } from '../../../shared/api/http.js';

export const systemApi = {
  async getAuditLogs() {
    return (await this.getAuditPage()).items;
  },

  async getAuditPage(page = 1) {
    const user = getAuthUser();
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    const roleName = String(user?.role || '').toUpperCase();
    const isAdmin = roleName === 'ADMIN' || roleName === 'SYSTEMADMIN';
    const path = isAdmin
      ? `admin/audit-logs?${params}`
      : `centers/${centerId()}/audit-logs?${params}`;
    const result = await apiRequest(path);
    const items = asArray(result).map(item => {
      const isCurrentUser = user && Number(item.actorUserId) === Number(user.id);
      const role = item.actorRole || (isCurrentUser ? user.role : (item.actorUserId ? null : 'SYSTEM'));
      let userName = item.actorUserName
        || (isCurrentUser ? (user.fullName || user.username || 'Quản lý trung tâm') : '')
        || (item.actorUserId ? `User #${item.actorUserId}` : 'Hệ thống');

      const searchContent = [
        item.action,
        userName,
        item.entityType,
        item.entityName,
        item.entityId
      ].filter(Boolean).join(' ').toLowerCase();

      return {
        ...item,
        userId: item.actorUserId,
        userName,
        role,
        entityName: item.entityName,
        status: 'SUCCESS',
        timestamp: item.createdAt,
        searchIndex: searchContent
      };
    });
    return { items, page: result.page || page, pageSize: result.pageSize || 50, totalCount: result.totalCount ?? items.length };
  },

  async getPermissions() {
    return asArray(await apiRequest(`centers/${centerId()}/roles`));
  },

  // Cập nhật quyền theo vai trò trong phạm vi trung tâm hiện tại.
  async updatePermissions(roleId, permissionCodes, capabilityIds = []) {
    return apiRequest(`centers/${centerId()}/roles/${Number(roleId)}/permissions`, {
      method: 'PUT',
      body: { permissionCodes, capabilityIds }
    });
  },

  async getUserPermissions() {
    return asArray(await apiRequest(`centers/${centerId()}/user-permissions`));
  },

  async updateUserPermissions(userId, permissionCodes, capabilityIds) {
    return apiRequest(`centers/${centerId()}/users/${Number(userId)}/permissions`, {
      method: 'PUT', body: { permissionCodes, capabilityIds }
    });
  },

  async resetUserPermissions(userId) {
    return apiRequest(`centers/${centerId()}/users/${Number(userId)}/permissions`, { method: 'DELETE' });
  },

  async resetRoleUserOverrides(roleId) {
    return apiRequest(`centers/${centerId()}/roles/${Number(roleId)}/user-permissions`, { method: 'DELETE' });
  },

  async sendCenterNotification({ title, message, sendToAll, targetRoles }) {
    return apiRequest(`centers/${centerId()}/notifications`, {
      method: 'POST',
      body: {
        title: title.trim(),
        message: message.trim(),
        sendToAll: Boolean(sendToAll),
        targetRoles: sendToAll ? [] : targetRoles
      }
    });
  },

  resetAllData() {
    throw new Error('Hệ thống không cho phép thực hiện thao tác xóa dữ liệu này.');
  }
};
