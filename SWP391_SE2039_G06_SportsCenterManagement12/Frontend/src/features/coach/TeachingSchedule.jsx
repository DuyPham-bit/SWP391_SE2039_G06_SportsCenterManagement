import React, { useState } from 'react';
import { CoachError, CoachPeriod, useTeachingSessions } from './CoachShared.js';

const statusNames = { SCHEDULED: 'Đã lên lịch', COMPLETED: 'Đã kết thúc', CANCELLED: 'Đã hủy' };

export function TeachingSchedule() {
  const schedule = useTeachingSessions();
  const [day, setDay] = useState('ALL');
  const sessions = schedule.sessions.filter(s => day === 'ALL' || s.dayOfWeek === day);
  return <div className="space-y-5">
    <h1 className="text-2xl font-black text-slate-900">Lịch Giảng Dạy Của Huấn Luyện Viên</h1>
    <p className="text-sm text-slate-500">Xem ca dạy, học viên và trạng thái buổi học trong các lớp được phân công.</p>
    <CoachPeriod schedule={schedule} /><CoachError message={schedule.error} retry={schedule.reload} />
    <div className="flex flex-wrap gap-2">{['ALL', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map(d =>
      <button key={d} onClick={() => setDay(d)} className={'px-3 py-2 text-xs rounded-lg ' + (d === day ? 'bg-slate-900 text-white' : 'bg-white border')}>{d === 'ALL' ? 'Tất cả' : d}</button>)}</div>
    {schedule.loading ? <p>Đang tải lịch giảng dạy...</p> : !schedule.error && !sessions.length ? <p>Không có buổi dạy phù hợp bộ lọc.</p> : null}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{sessions.map(s => <article key={s.id} className="bg-white p-5 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex justify-between gap-2 text-xs text-slate-600"><span>{s.sportName}</span><span>{statusNames[s.status] || s.status}</span></div>
      <h2 className="font-bold text-slate-900">{s.name}</h2>
      <p className="text-sm">{s.dayOfWeek} · {s.sessionDate} · {s.timeSlot}</p>
      <p className="text-sm text-slate-600">{s.roomName} · Đặt chỗ: {s.enrolledCount}/{s.capacity}</p>
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-red-600">
        <a href={'#/coach/members?classId=' + s.classId}>Học viên trong lớp</a>
        <a href={'#/coach/attendance?sessionId=' + s.id + '&date=' + s.sessionDate}>Danh sách & điểm danh</a>
      </div>
    </article>)}</div>
  </div>;
}
