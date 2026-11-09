// Giữ nguyên mật khẩu ASCII; từ chối cả lần nhập nếu có ký tự ngoài phạm vi.
export const PASSWORD_ASCII_PATTERN = '[\\x20-\\x7E]*';
export const PASSWORD_CHARACTER_ERROR = 'Mật khẩu chỉ nhận chữ không dấu, số và ký hiệu ASCII. Không dùng tiếng Việt có dấu hoặc emoji.';

export function isAsciiPassword(value) {
  return typeof value === 'string' && !/[^\x20-\x7E]/.test(value);
}

export function assertAsciiPassword(value) {
  if (!isAsciiPassword(value)) throw new Error(PASSWORD_CHARACTER_ERROR);
}

// Mirrors Backend PasswordPolicy so users see the same rules before submitting.
export const PASSWORD_RULES = [
  { id: 'length', label: 'Từ 6 đến 128 ký tự, không có khoảng trắng', test: value => value.length >= 6 && value.length <= 128 && !/\s/.test(value) },
  { id: 'case', label: 'Có chữ hoa và chữ thường', test: value => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { id: 'digit', label: 'Có ít nhất một chữ số', test: value => /[0-9]/.test(value) },
  { id: 'symbol', label: 'Có ít nhất một ký tự đặc biệt', test: value => /[^A-Za-z0-9]/.test(value) }
];

export function getPasswordPolicyError(password, { email, phone } = {}) {
  const value = typeof password === 'string' ? password : '';
  if (!isAsciiPassword(value)) return PASSWORD_CHARACTER_ERROR;
  const failed = PASSWORD_RULES.find(rule => !rule.test(value));
  if (failed) return `Mật khẩu chưa đạt yêu cầu: ${failed.label.toLowerCase()}.`;
  if (email && value.toLowerCase().includes(String(email).toLowerCase())) return 'Mật khẩu không được chứa email đăng nhập.';
  if (phone && value.includes(String(phone))) return 'Mật khẩu không được chứa số điện thoại.';
  return '';
}
