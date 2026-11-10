export function getInitials(name = '') {
  if (!name) return 'HV';
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'HV';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function calculateDaysLeft(expiryStr) {
  if (!expiryStr) return null;
  const expiry = new Date(`${String(expiryStr).slice(0, 10)}T23:59:59+07:00`);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
