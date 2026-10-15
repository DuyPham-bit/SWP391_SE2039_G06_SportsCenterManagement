import { bookingApi, classApi, receptionApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
const { useState } = React;
const button = 'px-3 py-2 bg-slate-900 text-white rounded text-sm disabled:opacity-50';
export function CounterBooking() {
  const { showError, showSuccess } = useToast();
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [busy, setBusy] = useState(false);
  const run = async fn => { setBusy(true); try { await fn(); } catch(e) { showError(e.message); } finally { setBusy(false); } };
  const refresh = async member => { const [s,b] = await Promise.all([classApi.getAll(),bookingApi.getForMember(member.id)]); setSessions(s); setBookings(b); };
  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">Đặt / hủy lớp cho hội viên tại quầy</h1>
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); run(async () => { setMembers(await receptionApi.lookupMember(query)); setSelected(null); }); }}>
      <input required minLength={2} className="border rounded p-2 flex-1" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tên, email, điện thoại hoặc mã hội viên" />
      <button className={button} disabled={busy}>Tìm kiếm</button>
    </form>
    <div className="flex flex-wrap gap-2">{members.map(m => <button className={button} key={m.id} disabled={busy} onClick={() => run(async () => { setSelected(m); await refresh(m); })}>{m.memberCode} · {m.fullName}</button>)}</div>
    {selected && <>
      <h2 className="font-bold">{selected.fullName} · {selected.memberCode}</h2>
      <p className="text-sm">Đặt trước 30 phút đến 7 ngày. Hủy dưới 2 giờ vẫn tính sử dụng buổi tập.</p>
      <h3 className="font-bold">Lượt đặt hiện tại</h3>
      {bookings.map(b => <div className="border rounded p-3 flex justify-between gap-2" key={b.id}><span>{b.className} · {b.bookingDate} · {b.timeSlot} · {b.status}</span>{b.status === 'CONFIRMED' && <button className={button} disabled={busy} onClick={() => run(async () => { const r = await bookingApi.cancelForMember(selected.id,b.id); showSuccess(r.message); await refresh(selected); })}>Hủy chỗ</button>}</div>)}
      <h3 className="font-bold">Lịch lớp</h3>
      {sessions.map(s => <div className="border rounded p-3 flex justify-between gap-2" key={s.id}><span>{s.name} · {s.sessionDate} · {s.timeSlot} · {s.enrolledCount}/{s.capacity}</span><button className={button} disabled={busy || !s.isBookable} onClick={() => run(async () => { const r = await bookingApi.bookForMember(selected.id,s.id); showSuccess(r.message); await refresh(selected); })}>{s.enrolledCount >= s.capacity ? 'Danh sách chờ' : 'Đặt chỗ'}</button></div>)}
    </>}
  </div>;
}
