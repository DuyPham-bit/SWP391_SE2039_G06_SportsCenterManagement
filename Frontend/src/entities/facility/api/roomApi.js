import { asArray, centerId } from '../../../shared/api/index.js';
import { apiRequest } from '../../../shared/api/index.js';

export const roomApi = {
 async getAll() { return asArray(await apiRequest('centers/'+centerId()+'/rooms')); },
 async create(body) { return apiRequest('centers/'+centerId()+'/rooms', { method: 'POST', body }); },
 async update(id, body) { return apiRequest('centers/'+centerId()+'/rooms/'+id, { method: 'PUT', body }); }
};
