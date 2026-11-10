import { vietnamDate } from '../../../entities/member/index.js';

export function formatGroupHeaderDate(dateStr, isEn) {
  if (!dateStr) return { fullDate: isEn ? 'Unscheduled' : 'Chưa xếp ngày', relativeLabel: '', isToday: false };

  const todayStr = vietnamDate();
  const isToday = dateStr === todayStr;

  const dObj = new Date(`${dateStr}T12:00:00+07:00`);
  const todayObj = new Date(`${todayStr}T12:00:00+07:00`);
  const diffDays = Math.round((dObj.getTime() - todayObj.getTime()) / (24 * 60 * 60 * 1000));

  let relativeLabel = '';
  if (diffDays === 0) relativeLabel = isEn ? 'Today' : 'Hôm nay';
  else if (diffDays === 1) relativeLabel = isEn ? 'Tomorrow' : 'Ngày mai';
  else if (diffDays === -1) relativeLabel = isEn ? 'Yesterday' : 'Hôm qua';

  const fullDate = !Number.isNaN(dObj.getTime())
    ? dObj.toLocaleDateString(isEn ? 'en-US' : 'vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh'
      })
    : dateStr;

  return { fullDate, relativeLabel, isToday };
}
