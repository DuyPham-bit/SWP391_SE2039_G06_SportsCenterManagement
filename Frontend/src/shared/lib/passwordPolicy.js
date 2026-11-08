// Giữ nguyên mật khẩu ASCII; từ chối cả lần nhập nếu có ký tự ngoài phạm vi.
export const PASSWORD_ASCII_PATTERN = '[\\x20-\\x7E]*';
export const PASSWORD_CHARACTER_ERROR = 'Mật khẩu chỉ nhận chữ không dấu, số và ký hiệu ASCII. Không dùng tiếng Việt có dấu hoặc emoji.';

export function isAsciiPassword(value) {
  return typeof value === 'string' && !/[^\x20-\x7E]/.test(value);
}

export function assertAsciiPassword(value) {
  if (!isAsciiPassword(value)) throw new Error(PASSWORD_CHARACTER_ERROR);
}
