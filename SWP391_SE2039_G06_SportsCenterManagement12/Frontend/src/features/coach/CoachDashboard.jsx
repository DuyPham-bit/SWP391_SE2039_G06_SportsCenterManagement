import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { StatCard } from '../../components/common/StatCard.js';
import { CoachError, useTeachingSessions } from './CoachShared.js';
import { sessionTime } from './coachOverview.js';

const links = [
  ['schedule', 'calendar_month', 'Lịch dạy'], ['members', 'group', 'Hồ sơ học viên'],
  ['training-plan', 'assignment', 'Giáo án'], ['progress', 'monitoring', 'Kết quả & nhận xét'],
  ['attendance', 'fact_check', 'Điểm danh'], ['notifications', 'campaign', 'Thông báo & bài tập'],
  ['ai-recommendation', 'psychology', 'Gợi ý AI']
];

export function CoachDashboard() {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const schedule = useTeachingSessions();
  const load = async () => {
    setLoading(true); setError('');
    try { setClasses(await coachApi.getCoachClassesAndMembers()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const studentCount = new Set(classes.flatMap(c => (c.members || []).map(m => m.id))).size;
  const upcoming = schedule.sessions.filter(s => s.status === 'SCHEDULED' && sessionTime(s) > Date.now());
  return <div className="space-y-6">
    <div className="bg-slate-900 text-white p-6 rounded-2xl">
      <p className="text-red-400 text-xs uppercase font-bold">Bảng chuyên môn huấn luyện viên</p>
      <h1 className="text-2xl font-bold mt-2">Chào HLV {currentUser?.fullName}</h1>
      <p className="text-sm text-slate-300 mt-2">Theo dõi lớp phụ trách, lịch dạy và kết quả của học viên.</p>
    </div>
    <CoachError message={error} retry={load} />
    <div className="grid sm:grid-cols-3 gap-4">
      <StatCard title="Lớp được phân công" value={loading || error ? '—' : classes.length} icon="sports_score" color="red" />
      <StatCard title="Học viên trong các lớp" value={loading || error ? '—' : studentCount} subtitle="Mỗi học viên tính một lần" icon="group" color="slate" />
      <StatCard title="Buổi dạy sắp tới" value={schedule.loading || schedule.error ? '—' : upcoming.length} subtitle={'Đến ' + schedule.to} icon="event" color="slate" />
    </div>
    <section className="bg-white p-5 rounded-2xl border border-slate-200">
      <h2 className="font-bold mb-4">Công việc huấn luyện</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{links.map(([route, icon, label]) =>
        <a key={route} href={'#/coach/' + route} className="flex items-center gap-2 p-3 rounded-xl border hover:bg-red-50 text-sm font-semibold">
          <span className="material-symbols-outlined text-red-600">{icon}</span>{label}
        </a>)}</div>
    </section>
    <section className="space-y-3">
      <h2 className="font-bold">Buổi dạy gần nhất</h2>
      <CoachError message={schedule.error} retry={schedule.reload} />
      {schedule.loading ? <p>Đang tải lịch dạy...</p> : !schedule.error && !upcoming.length ? <p className="text-sm text-slate-500">Chưa có buổi dạy sắp tới trong khoảng này.</p> : null}
      {upcoming.slice(0, 3).map(s => <article key={s.id} className="bg-white p-4 rounded-xl border border-slate-200">
        <h3 className="font-bold">{s.name}</h3><p className="text-sm text-slate-600">{s.sessionDate} · {s.timeSlot} · {s.roomName}</p>
        <a href={'#/coach/attendance?sessionId=' + s.id + '&date=' + s.sessionDate} className="text-red-600 text-sm font-semibold">Xem danh sách buổi học</a>
      </article>)}
    </section>
  </div>;
}
