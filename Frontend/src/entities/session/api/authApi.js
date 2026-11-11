import { asArray } from '../../../shared/api/apiUtils.js';
import { assertAuthVersion, beginAuthOperation, getAuthUser, getAuthVersion, setAuthUser } from '../../../shared/api/authState.js';
import { apiRequest, clearApiSession, createApiSession, getApiSession, setApiSession } from '../../../shared/api/http.js';
import { dataUrlToFile, notifyAvatarChanged } from '../../../shared/lib/avatarHelper.js';

async function loadCurrentUser(session = getApiSession(), version = getAuthVersion()) {
  if (!session) return null;
  const profile = await apiRequest('profile/me', { session });
  assertAuthVersion(version);
  let memberId = null;
  let memberProfile = null;
  let scheduledSubscriptions = [];

  if (String(profile.role).toUpperCase() === 'MEMBER') {
    const member = await apiRequest('members/me', { session });
    assertAuthVersion(version);
    memberId = member.memberId;
    memberProfile = member;
    const subscriptions = await apiRequest(`members/${memberId}/subscriptions`, { session });
    assertAuthVersion(version);
    scheduledSubscriptions = asArray(subscriptions)
      .filter(item => item.effectiveStatus === 'SCHEDULED')
      .sort((a, b) => a.startDate.localeCompare(b.startDate) || Number(a.subscriptionId) - Number(b.subscriptionId));
  }

  const capabilities = await apiRequest('access/me/capabilities', { session });
  assertAuthVersion(version);
  const user = {
    capabilities,
    id: profile.userId,
    memberId,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone || '',
    role: String(profile.role).toUpperCase(),
    status: String(profile.status || 'Active').toUpperCase(),
    memberCode: profile.memberCode,
    centerId: profile.centerId,
    createdAt: profile.createdAt,
    packageId: String(profile.role).toUpperCase() === 'MEMBER' ? (memberProfile?.packageId || null) : null,
    packageName: String(profile.role).toUpperCase() === 'MEMBER' ? (memberProfile?.packageName || 'Chưa đăng ký gói tập') : null,
    packageExpiry: String(profile.role).toUpperCase() === 'MEMBER' ? (memberProfile?.packageExpiry || null) : null,
    packageStartDate: String(profile.role).toUpperCase() === 'MEMBER' ? (memberProfile?.packageStartDate || null) : null,
    packageStatus: String(profile.role).toUpperCase() === 'MEMBER' ? (memberProfile?.packageStatus || 'INACTIVE') : null,
    // Member-owned details used by coach AI context (age, gender, level).
    dateOfBirth: memberProfile?.dateOfBirth || null,
    gender: memberProfile?.gender || null,
    fitnessLevel: memberProfile?.fitnessLevel || null,
    scheduledSubscriptions,
    mustChangePassword: false,
    emailVerified: profile.isEmailVerified !== false,
    avatar: profile.avatar || null,
    avatarKey: profile.avatarKey || null
  };
  setAuthUser(user);
  return user;
}

/**
 * Maps an avatar value from the UI to the profile API field:
 * data URL → upload to storage and return its key; null/"" → "" (remove); existing URL/undefined → undefined (keep).
 */
async function resolveAvatarKey(value) {
  if (value === undefined) return undefined;
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    const formData = new FormData();
    formData.append('file', dataUrlToFile(value));
    const uploaded = await apiRequest('r2-images/avatar', { method: 'POST', body: formData });
    return uploaded.key;
  }
  return undefined;
}

async function loginAndLoad(path, body) {
  // Rotate on every login so even a duplicated tab can sign in independently.
  const session = createApiSession();
  let version = beginAuthOperation();
  await apiRequest(path, { method: 'POST', session, body });
  assertAuthVersion(version);
  setApiSession(session);
  version = getAuthVersion();
  try {
    return { user: await loadCurrentUser(session, version) };
  } catch (error) {
    if (version === getAuthVersion()) clearApiSession();
    throw error;
  }
}

export const authApi = {
  async login(email, password) {
    return loginAndLoad('auth/login', { email: email.trim(), password });
  },

  async requestEmailVerification(email, phoneOrOptions, options = {}) {
    const phone = typeof phoneOrOptions === 'string' ? phoneOrOptions : null;
    const signal = typeof phoneOrOptions === 'object' && phoneOrOptions !== null
      ? phoneOrOptions.signal
      : options.signal;
    return apiRequest('auth/request-email-verification', {
      method: 'POST', session: null, signal,
      body: { email: email.trim().toLowerCase(), phone: phone?.trim() || null }
    });
  },

  async register({ fullName, email, phone, password, emailOtp }) {
    const cleanEmail = email.trim().toLowerCase();
    const registeredCenterId = Number(import.meta.env.VITE_SPORTS_CENTER_ID);
    if (!Number.isSafeInteger(registeredCenterId) || registeredCenterId <= 0) {
      throw new Error('Cấu hình VITE_SPORTS_CENTER_ID thành ID trung tâm hợp lệ trước khi đăng ký hội viên.');
    }
    const version = beginAuthOperation();
    await apiRequest('auth/register', {
      method: 'POST', session: null,
      // No username: the server derives a unique, valid one (the email local part may contain '+'
      // or already exist on another domain).
      body: {
        email: cleanEmail,
        password,
        emailOtp,
        fullName: fullName.trim(),
        phone: phone?.trim() || null,
        centerId: registeredCenterId
      }
    });
    assertAuthVersion(version);
    return (await this.login(cleanEmail, password)).user;
  },

  async loginWithGoogle({ credential }) {
    return loginAndLoad('auth/google', {
      idToken: credential, centerId: Number(import.meta.env.VITE_SPORTS_CENTER_ID) || null
    });
  },

  async linkGoogle(credential, currentPassword) {
    return apiRequest('auth/google/link', { method: 'POST', body: { idToken: credential, currentPassword } });
  },

  async requestPasswordReset(email, { signal } = {}) {
    return apiRequest('auth/request-password-reset', { method: 'POST', session: null, signal, body: { email: email.trim() } });
  },

  async resetPassword(email, otp, newPassword, { signal } = {}) {
    await apiRequest('auth/reset-password', { method: 'POST', session: null, signal, body: { email: email.trim(), otp: otp.trim(), newPassword } });
    return true;
  },

  async requestChangePasswordOtp(currentPassword, newPassword = null, { signal } = {}) {
    return apiRequest('auth/request-change-password-otp', {
      method: 'POST',
      signal,
      body: {
        currentPassword,
        newPassword
      }
    });
  },

  async changePassword(_userId, currentPassword, newPassword, emailOtp = null) {
    const version = beginAuthOperation();
    await apiRequest('auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword, emailOtp: emailOtp ? emailOtp.trim() : null }
    });
    assertAuthVersion(version);
    return loadCurrentUser();
  },

  async updateProfile(_userId, profileData) {
    const version = getAuthVersion();
    const session = getApiSession();
    const avatarKey = await resolveAvatarKey(profileData?.avatar);
    await apiRequest('profile/me', {
      method: 'PATCH', session,
      // avatarKey omitted = keep the stored photo; "" = remove; otherwise the newly uploaded key.
      body: { fullName: profileData.fullName, phone: profileData.phone || null, ...(avatarKey === undefined ? {} : { avatarKey }) }
    });
    assertAuthVersion(version);
    const details = profileData.memberDetails;
    if (details) {
      // Gender, date of birth and fitness level live on the member profile (members/me).
      await apiRequest('members/me', {
        method: 'PATCH', session,
        body: {
          fullName: profileData.fullName,
          email: null,
          phone: null,
          dateOfBirth: details.dateOfBirth || null,
          gender: details.gender || null,
          address: null,
          fitnessLevel: details.fitnessLevel || null
        }
      });
      assertAuthVersion(version);
    }
    const user = await loadCurrentUser(session, version);
    if (avatarKey !== undefined) notifyAvatarChanged(user?.id, user?.avatar);
    return user;
  },

  /** value: new photo as data URL, null/"" to remove, or the current URL to keep. Saved in the DB. */
  async updateAvatar(_userId, value) {
    const current = getAuthUser();
    return this.updateProfile(current?.id, { fullName: current?.fullName || '', phone: current?.phone || null, avatar: value ?? null });
  },

  getCurrentUser: loadCurrentUser,
  logout() {
    const session = getApiSession();
    clearApiSession();
    if (session) void apiRequest('auth/logout', { method: 'POST', session }).catch(() => {});
  }
};
