import { classApi, roomApi, packageApi } from '../../../services/backendApi.js';

export const classManagementApi = {
  ...classApi,
  rooms: roomApi,
  packages: packageApi
};

export { classApi, roomApi, packageApi };
export default classManagementApi;

