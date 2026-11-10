// The authenticated API supplies this tab's profile and permissions.
let authenticatedUser = null;
let authVersion = 0;
let authenticatedUserVersion = 0;

// Invalidates work started before a login attempt, token replacement or logout.
export function beginAuthOperation() {
  authVersion += 1;
  return authVersion;
}

export function getAuthVersion() {
  return authVersion;
}

function supersededError() {
  const error = new Error('Thông tin đăng nhập đã thay đổi. Vui lòng thử lại thao tác với tài khoản hiện tại.');
  error.code = 'AUTH_SUPERSEDED';
  return error;
}

export function assertAuthVersion(version) {
  if (version !== authVersion) throw supersededError();
}

export function assertAuthUser(user) {
  if (!user || user !== authenticatedUser || authenticatedUserVersion !== authVersion) throw supersededError();
}

export function getAuthUser() {
  return authenticatedUser;
}

export function setAuthUser(user) {
  authenticatedUser = user;
  authenticatedUserVersion = authVersion;
}
