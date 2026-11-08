export const todayDate = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
export const futureDate = (days = 90) => {
  const d = new Date(Date.now() + (7 * 3600 + days * 86400) * 1000);
  return d.toISOString().slice(0, 10);
};

export const addMinutesToTime = (timeStr, minutes = 60) => {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const totalM = h * 60 + m + parseInt(minutes, 10);
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

export const formatDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  const parts = String(isoStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

export const getTimePeriodInfo = (startTime) => {
  const hour = parseInt(String(startTime || '0').slice(0, 2), 10);
  if (hour < 12) {
    return { label: 'Sáng', icon: 'wb_sunny', badge: 'bg-brand-sand-500/10 text-brand-sand-700 dark:text-brand-sand-300 border-brand-sand-500/20' };
  } else if (hour < 18) {
    return { label: 'Chiều', icon: 'light_mode', badge: 'bg-brand-terra-500/10 text-brand-terra-700 dark:text-brand-terra-300 border-brand-terra-500/20' };
  } else {
    return { label: 'Tối', icon: 'dark_mode', badge: 'bg-brand-navy-700/10 text-brand-navy-800 dark:text-brand-navy-300 border-brand-navy-700/20' };
  }
};

export const timeValue = (value) => String(value || '').slice(0, 5);
