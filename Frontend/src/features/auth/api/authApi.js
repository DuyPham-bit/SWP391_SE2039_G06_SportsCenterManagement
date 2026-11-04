import { authApi as baseAuthApi } from '../../../services/backendApi.js';
import { http } from '../../../shared/api/http.js';

export const authApi = {
  ...baseAuthApi,
  getMe: () => baseAuthApi.getCurrentUser(),
  login: (email, password) => baseAuthApi.login(email, password),
  logout: () => baseAuthApi.logout(),
  register: data => baseAuthApi.register(data),
  loginWithGoogle: cred => baseAuthApi.loginWithGoogle(cred),
  requestPasswordReset: (email, opt) => baseAuthApi.requestPasswordReset(email, opt),
  resetPassword: (email, otp, newPassword, opt) => baseAuthApi.resetPassword(email, otp, newPassword, opt)
};

export default authApi;

