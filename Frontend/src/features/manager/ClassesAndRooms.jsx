import { classApi, roomApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';

const { useState, useEffect } = React;
const field = 'border border-slate-300 rounded-lg p-2 w-full text-sm';
const button = 'rounded-lg px-3 py-2 bg-slate-900 text-white text-xs disabled:opacity-50';
const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);

export function ClassesAndRooms() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState('classes');
  const [data, setData] = useState({ classes: [], rooms: [], sports: [], coaches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const load = async () => {
    setError('');
    try {
      const [classes, rooms, sports, coaches] = await Promise.all([
        classApi.getManagementClasses(), roomApi.getAll(), classApi.getManagementSports(), classApi.getCoaches()
      ]);
      setData({ classes, rooms, sports, coaches });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const openClass = row => {
    setForm(row ? { ...row } : { name: '', sportId: data.sports.find(s => s.status === 'Active')?.id || '', roomId: '', capacity: 20, durationMinutes: 60, level: '', description: '', allowWaitlist: true });
    setModal({ type: 'class', row });
  };
  const openRoom = row => {
    setForm(row ? { ...row } : { name: '', type: '', capacity: 30, location: '' });
    setModal({ type: 'room', row });
  };
  const openSport = row => {
    setForm(row ? { ...row } : { name: '', description: '', status: 'Active' });
    setModal({ type: 'sport', row });
  };
  const openSchedules = async row => {
    try {
      setEditingScheduleId(null);
      setSchedules(await classApi.getSchedules(row.id));
      setForm({ roomId: row.roomId || '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', startDate: today(), endDate: today() });
      setModal({ type: 'schedule', row });
    } catch (e) { showError(e.message); }
  };
  const action = async fn => {
    setBusy(true);
    try { await fn(); showSuccess('Đã lưu thay đổi.'); await load(); }
    catch (e) { showError(e.message); }
    finally { setBusy(false); }
  };
  const save = async e => {
    e.preventDefault();
    await action(async () => {
      if (modal.type === 'class') {
        const body = { ...form, sportId: Number(form.sportId), capacity: Number(form.capacity), durationMinutes: Number(form.durationMinutes) };
        if (modal.row) await classApi.update(modal.row.id, body); else await classApi.create(body);
      } else if (modal.type === 'sport') {
        const body = { name: form.name.trim(), description: form.description || null, status: form.status };
        if (modal.row) await classApi.updateSport(modal.row.id, body); else await classApi.createSport(body);
      } else if (modal.type === 'room') {
        const body = { ...form, capacity: Number(form.capacity) };
        if (modal.row) await roomApi.update(modal.row.id, body); else await roomApi.create(body);
      } else {
        const body = { ...form, roomId: form.roomId ? Number(form.roomId) : null, dayOfWeek: Number(form.dayOfWeek), startTime: form.startTime + ':00', endTime: form.endTime + ':00' };
        if (editingScheduleId) await classApi.updateSchedule(modal.row.id, editingScheduleId, body);
        else await classApi.createSchedule(modal.row.id, body);
      }
      setModal(null);
    });
  };
  if (loading) return <LoadingSpinner text="Đang tải lớp và phòng tập..." />;
  if (error) return <div role="alert" className="p-5 bg-red-50 rounded-xl space-y-3"><p>{error}</p><button className={button} onClick={() => { setLoading(true); load(); }}>Thử lại</button></div>;
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">Quản lý lớp học, bộ môn, phòng tập và lịch hoạt động</h1>
    <div className="flex flex-wrap gap-3">
      <button className={button} onClick={() => setTab('classes')}>Lớp học ({data.classes.length})</button>
      <button className={button} onClick={() => setTab('rooms')}>Phòng tập ({data.rooms.length})</button>
      <button className={button} onClick={() => setTab('sports')}>Bộ môn ({data.sports.length})</button>
      <button className={button} disabled={busy} onClick={() => tab === 'classes' ? openClass(null) : tab === 'rooms' ? openRoom(null) : openSport(null)}>Thêm mới</button>
    </div>
    {tab === 'sports' && <p className="text-sm text-slate-500">Bộ môn dùng chung chỉ xem. Bộ môn riêng của trung tâm có thể sửa hoặc ngừng sử dụng khi không còn lớp hoạt động.</p>}
    <div className="grid md:grid-cols-2 gap-4">
      {(data[tab]).map(row => <article key={row.id} className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-bold">{row.name}</h2>
        {tab === 'sports' ? <><p className="text-sm">{row.description || 'Chưa có mô tả'}</p><p className="text-sm">{row.isShared ? 'Dùng chung' : 'Riêng trung tâm'} · {row.status === 'Active' ? 'Đang sử dụng' : 'Ngừng sử dụng'}</p></> : <p className="text-sm">{row.sportName || row.type} · Sức chứa: {row.capacity} · {row.status}</p>}
        {tab === 'classes' && <p className="text-sm">{row.coachName || 'Chưa phân công HLV'} · {row.roomName || 'Chưa chọn phòng'}</p>}
        <div className="flex flex-wrap gap-2">
          {!row.isShared && <button className={button} disabled={busy} onClick={() => tab === 'classes' ? openClass(row) : tab === 'rooms' ? openRoom(row) : openSport(row)}>Sửa</button>}
          {tab === 'classes' && <>
            <button className={button} disabled={busy} onClick={() => openSchedules(row)}>Lịch học</button>
            {row.status === 'Draft' && <button className={button} disabled={busy} onClick={() => action(() => classApi.publish(row.id))}>Công bố</button>}
            {!['Cancelled','Completed'].includes(row.status) && <button className={button} disabled={busy} onClick={() => { setModal({ type: 'cancel', row }); }}>Hủy lớp</button>}
          </>}
        </div>
      </article>)}
    </div>
    {!data[tab].length && <p className="p-5 bg-white rounded-xl border">Chưa có dữ liệu. Chọn Thêm mới để bắt đầu.</p>}
    <Modal isOpen={Boolean(modal)} onClose={() => !busy && setModal(null)} title={modal?.type === 'schedule' ? 'Quản lý lịch học' : modal?.type === 'cancel' ? 'Xác nhận hủy lớp' : modal?.type === 'sport' ? 'Thông tin bộ môn' : 'Thông tin lớp / phòng'}>
      {modal?.type === 'cancel' ? <div className="space-y-4"><p>Hủy lớp {modal.row.name} sẽ hủy các buổi học và đăng ký liên quan.</p><button className={button} disabled={busy} onClick={() => action(async () => { await classApi.cancel(modal.row.id); setModal(null); })}>Xác nhận hủy</button></div> :
      <form onSubmit={save} className="space-y-3">
        {modal?.type !== 'schedule' && <label className="block">Tên<input className={field} name="name" required maxLength={100} value={form.name || ''} onChange={change} /></label>}
        {modal?.type === 'class' && <>
          <label className="block"><input type="checkbox" checked={form.allowWaitlist !== false} onChange={e => setForm(f => ({ ...f, allowWaitlist: e.target.checked }))} /> Cho phép danh sách chờ</label>
          <label className="block">Bộ môn<select className={field} name="sportId" required value={form.sportId || ''} onChange={change}><option value="">Chọn bộ môn</option>{data.sports.filter(s => s.status === 'Active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label className="block">Cấp độ<input className={field} name="level" value={form.level || ''} onChange={change} /></label>
          <label className="block">Mô tả<textarea className={field} name="description" value={form.description || ''} onChange={change} /></label>
          <label className="block">Thời lượng (phút)<input className={field} name="durationMinutes" type="number" min="1" required value={form.durationMinutes || ''} onChange={change} /></label>
        </>}
        {['class','schedule'].includes(modal?.type) && <label className="block">Phòng<select className={field} name="roomId" value={form.roomId || ''} onChange={change}><option value="">Theo phòng mặc định / chưa chọn</option>{data.rooms.filter(r => r.status === 'Active').map(r => <option key={r.id} value={r.id}>{r.name} ({r.capacity})</option>)}</select></label>}
        {['class','room'].includes(modal?.type) && <label className="block">Sức chứa<input className={field} name="capacity" type="number" min="1" required value={form.capacity || ''} onChange={change} /></label>}
        {modal?.type === 'sport' && <><label className="block">Mô tả<textarea className={field} name="description" maxLength={500} value={form.description || ''} onChange={change} /></label><label className="block">Trạng thái<select className={field} name="status" value={form.status} onChange={change}><option value="Active">Đang sử dụng</option><option value="Inactive">Ngừng sử dụng</option></select></label></>}
        {modal?.type === 'room' && <><label className="block">Loại phòng<input className={field} maxLength={100} name="type" value={form.type || ''} onChange={change} /></label><label className="block">Vị trí<input className={field} maxLength={255} name="location" value={form.location || ''} onChange={change} /></label></>}
        {modal?.type === 'schedule' && <>
          {schedules.map(s => <div key={s.id} className="border rounded p-2 text-sm space-y-2"><p>{s.startDate} – {s.endDate} · {['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][s.dayOfWeek]} · {s.startTime}–{s.endTime} · {s.status}</p>{s.status === 'Active' && <div className="flex gap-2"><button type="button" className={button} disabled={busy} onClick={() => { setEditingScheduleId(s.id); setForm({ ...s, roomId: s.roomId || '', startTime: s.startTime.slice(0,5), endTime: s.endTime.slice(0,5) }); }}>Sửa lịch</button><button type="button" className={button} disabled={busy} onClick={() => action(async () => { await classApi.cancelSchedule(modal.row.id, s.id); setEditingScheduleId(null); setSchedules(await classApi.getSchedules(modal.row.id)); })}>Hủy lịch</button></div>}</div>)}
          <p className="font-semibold">{editingScheduleId ? 'Đang sửa lịch đã chọn' : 'Thêm lịch mới'}</p>
          <label className="block">Ngày trong tuần<select className={field} name="dayOfWeek" value={form.dayOfWeek ?? 1} onChange={change}>{['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'].map((d,i) => <option key={i} value={i}>{d}</option>)}</select></label>
          {['startDate','endDate','startTime','endTime'].map(name => <label className="block" key={name}>{({ startDate: 'Từ ngày', endDate: 'Đến ngày', startTime: 'Giờ bắt đầu', endTime: 'Giờ kết thúc' })[name]}<input className={field} required type={name.endsWith('Date') ? 'date' : 'time'} name={name} value={form[name] || ''} onChange={change} /></label>)}
        </>}
        <button className={button} type="submit" disabled={busy}>{busy ? 'Đang lưu...' : modal?.type === 'schedule' ? editingScheduleId ? 'Lưu lịch học' : 'Thêm lịch và tạo buổi học' : 'Lưu'}</button>
      </form>}
    </Modal>
  </div>;
}
