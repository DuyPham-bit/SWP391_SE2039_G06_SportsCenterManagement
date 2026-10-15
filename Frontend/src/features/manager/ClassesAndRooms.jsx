import { classApi, roomApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import {
  CLASS_STATUS, WEEK_DAYS, effectiveScheduleRoom, filterClasses, groupSchedulesByDay,
  splitAndSortClasses, validateClassForm, validateScheduleForm
} from './classManagementView.js';

const { useMemo, useState, useEffect } = React;
const field = 'mt-1.5 border border-slate-300 rounded-xl px-3 py-2.5 w-full text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButton = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed';
const dangerButton = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed';
const today = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const timeValue = value => String(value || '').slice(0, 5);

const statusInfo = {
  Draft: ['Bản nháp', 'bg-amber-50 text-amber-700 border-amber-200'],
  Published: ['Đang mở', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  Cancelled: ['Đã hủy', 'bg-red-50 text-red-700 border-red-200'],
  Completed: ['Đã kết thúc', 'bg-slate-100 text-slate-600 border-slate-200'],
  Active: ['Đang sử dụng', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
  Inactive: ['Ngừng sử dụng', 'bg-slate-100 text-slate-600 border-slate-200']
};

function StatusBadge({ value }) {
  const [label, css] = statusInfo[value] || [value || 'Chưa rõ', 'bg-slate-100 text-slate-600 border-slate-200'];
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${css}`}>{label}</span>;
}

function Icon({ children, className = '' }) {
  return <span aria-hidden="true" className={`material-symbols-outlined text-[18px] ${className}`}>{children}</span>;
}

export function ClassesAndRooms() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState('classes');
  const [data, setData] = useState({ classes: [], rooms: [], sports: [], coaches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [formError, setFormError] = useState('');
  const [query, setQuery] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  const classGroups = useMemo(() => splitAndSortClasses(data.classes), [data.classes]);
  const visibleClasses = useMemo(() => filterClasses(
    tab === 'cancelled' ? classGroups.cancelled : classGroups.active, query
  ), [classGroups, query, tab]);

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

  const change = event => {
    setFormError('');
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  };
  const openClass = row => {
    setFormError('');
    setForm(row ? { ...row } : {
      name: '', sportId: data.sports.find(sport => sport.status === 'Active')?.id || '', roomId: '',
      capacity: 20, durationMinutes: 60, level: '', description: '', allowWaitlist: true
    });
    setModal({ type: 'class', row });
  };
  const openRoom = row => {
    setFormError('');
    setForm(row ? { ...row } : { name: '', type: '', capacity: 30, location: '' });
    setModal({ type: 'room', row });
  };
  const openSport = row => {
    setFormError('');
    setForm(row ? { ...row } : { name: '', description: '', status: 'Active' });
    setModal({ type: 'sport', row });
  };
  const resetScheduleForm = row => {
    setEditingScheduleId(null);
    setForm({ roomId: row.roomId || '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', startDate: today(), endDate: today() });
    setFormError('');
  };
  const openSchedules = async row => {
    setBusy(true);
    try {
      setSchedules(await classApi.getSchedules(row.id));
      resetScheduleForm(row);
      setModal({ type: 'schedule', row });
    } catch (e) { showError(e.message); }
    finally { setBusy(false); }
  };
  const action = async (fn, successMessage = 'Đã lưu thay đổi.') => {
    setBusy(true);
    try {
      await fn(); showSuccess(successMessage); await load(); return true;
    } catch (e) { showError(e.message); return false; }
    finally { setBusy(false); }
  };

  const save = async event => {
    event.preventDefault();
    const validationMessage = modal.type === 'class' ? validateClassForm(form)
      : modal.type === 'schedule' ? validateScheduleForm(form) : '';
    if (validationMessage) { setFormError(validationMessage); return; }
    setBusy(true); setFormError('');
    try {
      if (modal.type === 'class') {
        const body = { ...form, name: form.name.trim(), sportId: Number(form.sportId),
          roomId: form.roomId ? Number(form.roomId) : null, capacity: Number(form.capacity),
          durationMinutes: Number(form.durationMinutes) };
        if (modal.row) await classApi.update(modal.row.id, body); else await classApi.create(body);
        setModal(null);
        showSuccess(modal.row ? 'Đã cập nhật lớp học.' : 'Đã tạo lớp nháp. Hãy thêm lịch và phân công HLV trước khi công bố.');
      } else if (modal.type === 'sport') {
        const body = { name: form.name.trim(), description: form.description?.trim() || null, status: form.status };
        if (modal.row) await classApi.updateSport(modal.row.id, body); else await classApi.createSport(body);
        setModal(null); showSuccess('Đã lưu bộ môn.');
      } else if (modal.type === 'room') {
        const body = { ...form, name: form.name.trim(), capacity: Number(form.capacity) };
        if (modal.row) await roomApi.update(modal.row.id, body); else await roomApi.create(body);
        setModal(null); showSuccess('Đã lưu phòng tập.');
      } else {
        const body = { ...form, roomId: form.roomId ? Number(form.roomId) : null,
          dayOfWeek: Number(form.dayOfWeek), startTime: `${timeValue(form.startTime)}:00`,
          endTime: `${timeValue(form.endTime)}:00` };
        const wasEditing = Boolean(editingScheduleId);
        if (editingScheduleId) await classApi.updateSchedule(modal.row.id, editingScheduleId, body);
        else await classApi.createSchedule(modal.row.id, body);
        setSchedules(await classApi.getSchedules(modal.row.id));
        resetScheduleForm(modal.row);
        showSuccess(wasEditing ? 'Đã cập nhật lịch học.' : 'Đã thêm lịch và tạo các buổi học.');
      }
      await load();
    } catch (e) { setFormError(e.message); }
    finally { setBusy(false); }
  };

  const cancelSchedule = async scheduleId => {
    const succeeded = await action(async () => {
      await classApi.cancelSchedule(modal.row.id, scheduleId);
      setSchedules(await classApi.getSchedules(modal.row.id)); resetScheduleForm(modal.row);
    }, 'Đã hủy lịch học và các buổi sắp tới.');
    if (!succeeded) setFormError('Không thể hủy lịch. Vui lòng kiểm tra lại trạng thái hoặc thử lại.');
  };

  if (loading) return <LoadingSpinner text="Đang tải lớp, bộ môn và phòng tập..." />;
  if (error) return <div role="alert" className="p-5 bg-red-50 border border-red-200 rounded-xl space-y-3 text-red-800"><p>{error}</p><button className={secondaryButton} onClick={() => { setLoading(true); load(); }}>Thử lại</button></div>;

  const tabs = [
    ['classes', 'school', 'Lớp đang quản lý', classGroups.active.length],
    ['cancelled', 'event_busy', 'Lớp đã hủy', classGroups.cancelled.length],
    ['rooms', 'meeting_room', 'Phòng tập', data.rooms.length],
    ['sports', 'sports', 'Bộ môn', data.sports.length]
  ];
  const displayRows = ['classes', 'cancelled'].includes(tab) ? visibleClasses : data[tab];
  const addLabel = tab === 'classes' ? 'Tạo lớp mới' : tab === 'rooms' ? 'Thêm phòng' : 'Thêm bộ môn';

  return <div className="space-y-6">
    <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Vận hành trung tâm</p><h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">Lớp, bộ môn &amp; phòng</h1><p className="mt-1 text-sm text-slate-500">Theo dõi lớp học, lịch tuần, phòng và bộ môn trong cùng một nơi.</p></div>
      {tab !== 'cancelled' && <button className={`${primaryButton} self-start lg:self-auto`} disabled={busy} onClick={() => tab === 'classes' ? openClass(null) : tab === 'rooms' ? openRoom(null) : openSport(null)}><Icon>add</Icon>{addLabel}</button>}
    </header>
    <nav aria-label="Danh mục quản lý" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map(([value, icon, label, count]) => <button key={value} onClick={() => { setTab(value); setQuery(''); }} className={`shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${tab === value ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}><Icon>{icon}</Icon><span>{label}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${tab === value ? 'bg-white/15' : 'bg-slate-100'}`}>{count}</span></button>)}
    </nav>
    {['classes', 'cancelled'].includes(tab) && <div className="relative max-w-xl"><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</Icon><input aria-label="Tìm lớp học" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Tìm theo tên lớp, bộ môn, HLV hoặc phòng..." value={query} onChange={event => setQuery(event.target.value)} /></div>}
    {tab === 'cancelled' && <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><Icon className="shrink-0">info</Icon><p>Lớp đã hủy được lưu riêng để tra cứu. Khi mở lại, lớp trở về <strong>bản nháp</strong>; lịch, đăng ký và lượt đặt chỗ cũ vẫn giữ trạng thái đã hủy để không làm sai lịch sử.</p></div>}
    {tab === 'sports' && <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">Bộ môn dùng chung chỉ xem. Bộ môn riêng có thể sửa hoặc ngừng sử dụng khi không còn lớp hoạt động.</p>}
    <div className={`grid gap-4 ${['classes', 'cancelled'].includes(tab) ? 'xl:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
      {displayRows.map(row => ['classes', 'cancelled'].includes(tab)
        ? <ClassCard key={row.id} row={row} busy={busy} onEdit={openClass} onSchedules={openSchedules} onPublish={() => action(() => classApi.publish(row.id), 'Đã công bố lớp học.')} onCancel={() => setModal({ type: 'cancel', row })} onRestore={() => setModal({ type: 'restore', row })} />
        : <ResourceCard key={row.id} row={row} type={tab} busy={busy} onEdit={() => tab === 'rooms' ? openRoom(row) : openSport(row)} />)}
    </div>
    {!displayRows.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Icon className="text-4xl text-slate-300">{query ? 'search_off' : tab === 'cancelled' ? 'event_available' : 'folder_off'}</Icon><p className="mt-2 font-bold text-slate-700">{query ? 'Không tìm thấy lớp phù hợp' : tab === 'cancelled' ? 'Chưa có lớp nào bị hủy' : 'Chưa có dữ liệu'}</p><p className="mt-1 text-sm text-slate-500">{query ? 'Thử từ khóa khác.' : tab === 'cancelled' ? 'Các lớp đã hủy sẽ xuất hiện tại đây.' : `Chọn “${addLabel}” để bắt đầu.`}</p></div>}

    <Modal isOpen={Boolean(modal)} onClose={() => !busy && setModal(null)} maxWidth={modal?.type === 'schedule' ? 'max-w-6xl' : 'max-w-2xl'} title={modalTitle(modal)}>
      {modal?.type === 'cancel' && <ConfirmCancel row={modal.row} busy={busy} onClose={() => setModal(null)} onConfirm={async () => { if (await action(() => classApi.cancel(modal.row.id), 'Đã hủy lớp và chuyển vào tab Lớp đã hủy.')) setModal(null); }} />}
      {modal?.type === 'restore' && <ConfirmRestore row={modal.row} busy={busy} onClose={() => setModal(null)} onConfirm={async () => { if (await action(() => classApi.restore(modal.row.id), 'Đã mở lại lớp ở trạng thái bản nháp.')) { setModal(null); setTab('classes'); } }} />}
      {modal && !['cancel', 'restore'].includes(modal.type) && <form onSubmit={save} className="space-y-5">
        {formError && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><Icon>error</Icon><span>{formError}</span></div>}
        {modal.type === 'class' && <ClassForm form={form} setForm={setForm} change={change} sports={data.sports} rooms={data.rooms} />}
        {modal.type === 'room' && <RoomForm form={form} change={change} />}
        {modal.type === 'sport' && <SportForm form={form} change={change} />}
        {modal.type === 'schedule' && <ScheduleManager row={modal.row} schedules={schedules} rooms={data.rooms} form={form} change={change} busy={busy} editingScheduleId={editingScheduleId} setEditingScheduleId={setEditingScheduleId} setForm={setForm} onCancelSchedule={cancelSchedule} onReset={() => resetScheduleForm(modal.row)} />}
        {modal.type !== 'schedule' || modal.row.status !== CLASS_STATUS.CANCELLED ? <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className={secondaryButton} disabled={busy} onClick={() => setModal(null)}>Đóng</button><button className={primaryButton} type="submit" disabled={busy}>{busy ? 'Đang lưu...' : modal.type === 'schedule' ? editingScheduleId ? 'Lưu lịch học' : 'Thêm lịch học' : modal.row ? 'Lưu thay đổi' : 'Tạo mới'}</button></div> : <div className="flex justify-end border-t border-slate-100 pt-4"><button type="button" className={secondaryButton} onClick={() => setModal(null)}>Đóng</button></div>}
      </form>}
    </Modal>
  </div>;
}

function ClassCard({ row, busy, onEdit, onSchedules, onPublish, onCancel, onRestore }) {
  const cancelled = row.status === CLASS_STATUS.CANCELLED;
  return <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${cancelled ? 'border-red-100' : 'border-slate-200'}`}><div className={`h-1.5 ${cancelled ? 'bg-red-400' : row.status === CLASS_STATUS.PUBLISHED ? 'bg-emerald-500' : 'bg-amber-400'}`} /><div className="p-5">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-red-600">{row.sportName || 'Chưa chọn bộ môn'}</p><h2 className="mt-1 text-lg font-black text-slate-900 break-words">{row.name}</h2></div><StatusBadge value={row.status} /></div>
    {row.description && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{row.description}</p>}
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><Info icon="person" label="HLV" value={row.coachName || 'Chưa phân công'} /><Info icon="meeting_room" label="Phòng" value={row.roomName || 'Chưa chọn phòng'} /><Info icon="groups" label="Học viên" value={`${row.enrolledCount || 0}/${row.capacity}`} /><Info icon="timer" label="Thời lượng" value={`${row.durationMinutes} phút${row.level ? ` · ${row.level}` : ''}`} /></dl>
    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{cancelled ? <><button className={secondaryButton} disabled={busy} onClick={() => onSchedules(row)}><Icon>history</Icon>Xem lịch sử lịch</button><button className={primaryButton} disabled={busy} onClick={onRestore}><Icon>restart_alt</Icon>Mở lại lớp</button></> : <><button className={secondaryButton} disabled={busy} onClick={() => onEdit(row)}><Icon>edit</Icon>Sửa thông tin</button><button className={secondaryButton} disabled={busy} onClick={() => onSchedules(row)}><Icon>calendar_month</Icon>Lịch học</button>{row.status === CLASS_STATUS.DRAFT && <button className={secondaryButton} disabled={busy} onClick={onPublish}><Icon>campaign</Icon>Công bố</button>}{row.status !== CLASS_STATUS.COMPLETED && <button className={dangerButton} disabled={busy} onClick={onCancel}><Icon>event_busy</Icon>Hủy lớp</button>}</>}</div>
  </div></article>;
}

function Info({ icon, label, value }) {
  return <div className="flex gap-2 rounded-xl bg-slate-50 p-3 min-w-0"><Icon className="text-slate-400 shrink-0">{icon}</Icon><div className="min-w-0"><dt className="text-[10px] uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-0.5 truncate font-semibold text-slate-700" title={value}>{value}</dd></div></div>;
}

function ResourceCard({ row, type, busy, onEdit }) {
  const isSport = type === 'sports';
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="text-[24px]">{isSport ? 'sports' : 'meeting_room'}</Icon></div><StatusBadge value={row.status || 'Active'} /></div><h2 className="mt-4 font-black text-slate-900">{row.name}</h2><p className="mt-1 min-h-10 text-sm text-slate-500">{isSport ? row.description || 'Chưa có mô tả' : `${row.type || 'Chưa phân loại'} · ${row.location || 'Chưa cập nhật vị trí'}`}</p><p className="mt-3 text-xs font-semibold text-slate-600">{isSport ? row.isShared ? 'Bộ môn dùng chung' : 'Bộ môn riêng của trung tâm' : `Sức chứa: ${row.capacity} người`}</p>{!row.isShared && <button className={`${secondaryButton} mt-4`} disabled={busy} onClick={onEdit}><Icon>edit</Icon>Chỉnh sửa</button>}</article>;
}

function ClassForm({ form, setForm, change, sports, rooms }) {
  return <><div className="rounded-xl bg-slate-50 p-4"><p className="font-bold text-slate-800">Thông tin cơ bản</p><p className="text-xs text-slate-500">Các trường có dấu * là bắt buộc.</p></div><label className="block text-sm font-semibold text-slate-700">Tên lớp *<input autoFocus className={field} name="name" required maxLength={150} value={form.name || ''} onChange={change} placeholder="Ví dụ: Yoga phục hồi buổi sáng" /></label><div className="grid sm:grid-cols-2 gap-4">
    <label className="block text-sm font-semibold text-slate-700">Bộ môn *<select className={field} name="sportId" required value={form.sportId || ''} onChange={change}><option value="">Chọn bộ môn</option>{sports.filter(sport => sport.status === 'Active').map(sport => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
    <label className="block text-sm font-semibold text-slate-700">Phòng mặc định<select className={field} name="roomId" value={form.roomId || ''} onChange={change}><option value="">Chưa chọn phòng</option>{rooms.filter(room => room.status === 'Active').map(room => <option key={room.id} value={room.id}>{room.name} · {room.capacity} người</option>)}</select></label>
    <label className="block text-sm font-semibold text-slate-700">Sức chứa *<input className={field} name="capacity" type="number" min="1" step="1" required value={form.capacity || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Thời lượng (phút) *<input className={field} name="durationMinutes" type="number" min="1" step="1" required value={form.durationMinutes || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Cấp độ<input className={field} name="level" maxLength={50} value={form.level || ''} onChange={change} placeholder="Cơ bản, nâng cao..." /></label><label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700"><input className="h-4 w-4 accent-red-600" type="checkbox" checked={form.allowWaitlist !== false} onChange={event => setForm(current => ({ ...current, allowWaitlist: event.target.checked }))} />Cho phép danh sách chờ</label></div><label className="block text-sm font-semibold text-slate-700">Mô tả<textarea className={field} name="description" rows="4" maxLength={1000} value={form.description || ''} onChange={change} placeholder="Mục tiêu, đối tượng và lưu ý của lớp..." /></label></>;
}

function RoomForm({ form, change }) {
  return <div className="grid sm:grid-cols-2 gap-4"><label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Tên phòng *<input autoFocus className={field} name="name" required maxLength={100} value={form.name || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Loại phòng<input className={field} maxLength={100} name="type" value={form.type || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Sức chứa *<input className={field} name="capacity" type="number" min="1" step="1" required value={form.capacity || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Vị trí<input className={field} maxLength={255} name="location" value={form.location || ''} onChange={change} /></label></div>;
}

function SportForm({ form, change }) {
  return <><label className="block text-sm font-semibold text-slate-700">Tên bộ môn *<input autoFocus className={field} name="name" required maxLength={100} value={form.name || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Mô tả<textarea className={field} name="description" rows="4" maxLength={500} value={form.description || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Trạng thái<select className={field} name="status" value={form.status} onChange={change}><option value="Active">Đang sử dụng</option><option value="Inactive">Ngừng sử dụng</option></select></label></>;
}

function ScheduleManager({ row, schedules, rooms, form, change, busy, editingScheduleId, setEditingScheduleId, setForm, onCancelSchedule, onReset }) {
  const groups = groupSchedulesByDay(schedules);
  const readOnly = row.status === CLASS_STATUS.CANCELLED;
  return <><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-900 p-4 text-white"><div><p className="font-black">{row.name}</p><p className="text-xs text-slate-300">{row.sportName} · Phòng mặc định: {row.roomName || 'Chưa chọn'}</p></div><StatusBadge value={row.status} /></div><section aria-label="Lịch học theo tuần"><div className="mb-3"><h3 className="font-black text-slate-900">Lịch học hàng tuần</h3><p className="text-xs text-slate-500">Mỗi ca hiển thị đầy đủ giờ, phòng và khoảng hiệu lực.</p></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
    {groups.map(group => <div key={group.dayOfWeek} className="min-h-32 rounded-xl border border-slate-200 bg-slate-50 p-2"><h4 className="mb-2 rounded-lg bg-white px-2 py-1.5 text-center text-xs font-black text-slate-700 shadow-sm">{group.label}</h4><div className="space-y-2">{group.items.map(schedule => <div key={schedule.id} className={`rounded-lg border p-2.5 text-xs ${schedule.status === 'Active' ? 'border-red-100 bg-white' : 'border-slate-200 bg-slate-100 opacity-70'}`}><div className="flex items-center justify-between gap-1"><strong className="text-sm text-slate-900">{timeValue(schedule.startTime)}–{timeValue(schedule.endTime)}</strong><span className={`h-2 w-2 rounded-full ${schedule.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} title={schedule.status === 'Active' ? 'Đang hoạt động' : 'Đã hủy'} /></div><p className="mt-1 flex items-start gap-1 text-slate-600"><Icon className="text-[14px]">meeting_room</Icon>{effectiveScheduleRoom(schedule, row, rooms)}</p><p className="mt-1 text-[10px] text-slate-400">{schedule.startDate || 'Không giới hạn'} → {schedule.endDate || 'Không giới hạn'}</p>{!readOnly && schedule.status === 'Active' && <div className="mt-2 flex gap-1 border-t border-slate-100 pt-2"><button type="button" aria-label={`Sửa lịch ${group.label} ${timeValue(schedule.startTime)}`} className="text-blue-700 hover:underline" disabled={busy} onClick={() => { setEditingScheduleId(schedule.id); setForm({ ...schedule, roomId: schedule.roomId || '', startTime: timeValue(schedule.startTime), endTime: timeValue(schedule.endTime) }); }}>Sửa</button><span className="text-slate-300">·</span><button type="button" className="text-red-700 hover:underline" disabled={busy} onClick={() => onCancelSchedule(schedule.id)}>Hủy</button></div>}</div>)}{!group.items.length && <p className="py-5 text-center text-[11px] text-slate-400">Trống</p>}</div></div>)}
  </div></section>{!readOnly && <section className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-slate-900">{editingScheduleId ? 'Chỉnh sửa ca học' : 'Thêm ca học'}</h3><p className="text-xs text-slate-500">Hệ thống sẽ kiểm tra trùng phòng và lịch HLV.</p></div>{editingScheduleId && <button type="button" className={secondaryButton} onClick={onReset}>Bỏ chỉnh sửa</button>}</div><div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <label className="block text-sm font-semibold text-slate-700">Ngày trong tuần<select className={field} name="dayOfWeek" value={form.dayOfWeek ?? 1} onChange={change}>{WEEK_DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Phòng<select className={field} name="roomId" value={form.roomId || ''} onChange={change}><option value="">Dùng phòng mặc định</option>{rooms.filter(room => room.status === 'Active').map(room => <option key={room.id} value={room.id}>{room.name} · {room.capacity} người</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Từ ngày *<input className={field} required type="date" name="startDate" value={form.startDate || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Đến ngày *<input className={field} required type="date" name="endDate" min={form.startDate || undefined} value={form.endDate || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Giờ bắt đầu *<input className={field} required type="time" name="startTime" value={form.startTime || ''} onChange={change} /></label><label className="block text-sm font-semibold text-slate-700">Giờ kết thúc *<input className={field} required type="time" name="endTime" value={form.endTime || ''} onChange={change} /></label>
  </div></section>}</>;
}

function ConfirmCancel({ row, busy, onClose, onConfirm }) {
  return <div className="space-y-5"><div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><Icon className="shrink-0">warning</Icon><div><p className="font-black">Hủy lớp “{row.name}”?</p><p className="mt-1 text-sm">Các lịch và buổi sắp tới sẽ bị hủy; đăng ký, lượt đặt chỗ và danh sách chờ liên quan cũng được chuyển sang đã hủy.</p></div></div><p className="text-sm text-slate-600">Lớp sẽ chuyển sang tab <strong>Lớp đã hủy</strong>. Bạn có thể mở lại lớp sau này dưới dạng bản nháp, nhưng dữ liệu đã hủy không tự khôi phục.</p><div className="flex justify-end gap-2"><button className={secondaryButton} disabled={busy} onClick={onClose}>Giữ lớp</button><button className={dangerButton} disabled={busy} onClick={onConfirm}>{busy ? 'Đang hủy...' : 'Xác nhận hủy lớp'}</button></div></div>;
}
function ConfirmRestore({ row, busy, onClose, onConfirm }) {
  return <div className="space-y-5"><div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><Icon className="shrink-0">restart_alt</Icon><div><p className="font-black">Mở lại lớp “{row.name}”?</p><p className="mt-1 text-sm">Lớp sẽ trở về trạng thái bản nháp để bạn kiểm tra và cấu hình lại.</p></div></div><p className="text-sm text-slate-600">Vì an toàn dữ liệu, lịch, buổi học, đăng ký và lượt đặt chỗ cũ vẫn giữ trạng thái đã hủy. Hãy tạo lịch mới, kiểm tra HLV rồi công bố lại lớp.</p><div className="flex justify-end gap-2"><button className={secondaryButton} disabled={busy} onClick={onClose}>Để sau</button><button className={primaryButton} disabled={busy} onClick={onConfirm}>{busy ? 'Đang mở lại...' : 'Mở lại thành bản nháp'}</button></div></div>;
}
function modalTitle(modal) {
  if (!modal) return '';
  if (modal.type === 'schedule') return modal.row.status === CLASS_STATUS.CANCELLED ? 'Lịch sử lịch học' : 'Quản lý lịch học';
  if (modal.type === 'cancel') return 'Xác nhận hủy lớp';
  if (modal.type === 'restore') return 'Mở lại lớp đã hủy';
  if (modal.type === 'sport') return modal.row ? 'Chỉnh sửa bộ môn' : 'Thêm bộ môn';
  if (modal.type === 'room') return modal.row ? 'Chỉnh sửa phòng tập' : 'Thêm phòng tập';
  return modal.row ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới';
}
