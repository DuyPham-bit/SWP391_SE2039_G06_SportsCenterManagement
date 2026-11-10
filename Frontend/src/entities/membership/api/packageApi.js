import { asArray, centerId } from '../../../shared/api/apiUtils.js';
import { getAuthUser } from '../../../shared/api/authState.js';
import { apiRequest } from '../../../shared/api/http.js';

function mapPackage(item) {
  const subscriberCount = Number(item.subscriberCount || 0);
  const hasOrders = Boolean(item.hasOrders || subscriberCount > 0);
  const isEditable = item.isEditable !== undefined ? Boolean(item.isEditable) : !hasOrders;

  return {
    ...item,
    status: String(item.status || '').toUpperCase(),
    allowedSports: item.allowedSports ?? 1,
    features: item.features || [],
    subscriberCount,
    hasOrders,
    isEditable
  };
}

export const packageApi = {
  async getAll() {
    const id = centerId();
    const role = String(getAuthUser()?.role || '').toUpperCase();
    const suffix = role === 'MANAGER' || role === 'ADMIN' ? '/all' : '';
    const packages = await apiRequest(`centers/${id}/membership-packages${suffix}`);
    return asArray(packages).map(mapPackage);
  },

  async create(pkg) {
    const created = await apiRequest(`centers/${centerId()}/membership-packages`, {
      method: 'POST',
      body: {
        name: pkg.name,
        description: pkg.description || null,
        durationDays: Number(pkg.durationDays),
        price: Number(pkg.price),
        maxClasses: pkg.maxClasses ? Number(pkg.maxClasses) : null,
        accessType: pkg.accessType || null,
        allowedSports: Number(pkg.allowedSports || 1),
        badge: pkg.badge || null,
        features: pkg.features || []
      }
    });
    return mapPackage(created);
  },

  async update(id, pkg) {
    const updated = await apiRequest(`centers/${centerId()}/membership-packages/${id}`, {
      method: 'PUT',
      body: {
        name: pkg.name,
        description: pkg.description || null,
        durationDays: Number(pkg.durationDays),
        price: Number(pkg.price),
        maxClasses: pkg.maxClasses ? Number(pkg.maxClasses) : null,
        accessType: pkg.accessType || null,
        allowedSports: Number(pkg.allowedSports || 1),
        badge: pkg.badge || null,
        features: pkg.features || []
      }
    });
    return mapPackage(updated);
  },

  async toggleStatus(id) {
    const target = (await this.getAll()).find(item => Number(item.id) === Number(id));
    if (!target) throw new Error('Không tìm thấy gói tập.');
    const status = target.status === 'ACTIVE' ? 'Inactive' : 'Active';
    return mapPackage(await apiRequest(`centers/${centerId()}/membership-packages/${id}/status`, {
      method: 'PATCH', body: { status }
    }));
  }
};
