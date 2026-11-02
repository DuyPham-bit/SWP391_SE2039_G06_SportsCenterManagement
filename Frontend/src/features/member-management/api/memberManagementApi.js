import { memberApi, receptionApi } from '../../../services/backendApi.js';

export const memberManagementApi = {
  ...memberApi,
  lookup: (query) => receptionApi.lookupMember(query),
  checkIn: (data) => receptionApi.checkIn(data)
};

export { memberApi };
export default memberManagementApi;

