import React, { useEffect, useMemo, useState } from 'react';
import { coachApi, coachProfessionalApi } from '../../services/api.js';
import { uploadMediaFileToCloud } from '../../services/cloudMediaStorage.js';
import { useToast } from '../../context/ToastContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { CoachError } from './CoachShared.jsx';
import { calendarWindow, currency, localDateKey, mergeCoachCalendar, tdeeEstimate } from './coachProfessionalView.js';

const input = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100';
const button = 'rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50';
const secondary = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50';
const tabs = [
  ['schedule', 'calendar_month', 'Lịch & nghỉ phép'], ['clients', 'clinical_notes', 'Học viên'],
  ['programs', 'fitness_center', 'Giáo án & dinh dưỡng'], ['communication', 'forum', 'Tương tác'],
  ['performance', 'monitoring', 'KPI & thu nhập'], ['facilities', 'sports_gymnastics', 'Tài nguyên']
];

function Card({ title, action, children, className = '' }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-chivo text-base font-black text-slate-900">{title}</h2>{action}</div>{children}
  </section>;
}

function Empty({ children = 'Chưa có dữ liệu.' }) { return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{children}</p>; }
function Label({ title, children }) { return <label className="block text-xs font-bold text-slate-600">{title}<span className="mt-1 block">{children}</span></label>; }
function dt(value) { return value ? new Date(value).toLocaleString('vi-VN') : '—'; }
function dateInput(offset = 0) { const d = new Date(); d.setDate(d.getDate() + offset); return localDateKey(d); }

export function CoachProfessionalHub() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState('schedule');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setData(await coachProfessionalApi.getWorkspace()); }
    catch (e) { setError(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const act = async (fn, success) => {
    setWorking(true);
    try { await fn(); showSuccess(success); await load(); return true; }
    catch (e) { showError(e); return false; }
    finally { setWorking(false); }
  };

  if (loading && !data) return <LoadingSpinner text="Đang mở không gian làm việc chuyên nghiệp..." />;
  return <div className="space-y-5">
    <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 text-white">
      <p className="text-xs font-black uppercase tracking-[.22em] text-red-300">Coach Professional Workspace</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-chivo text-2xl font-black">Trung tâm điều hành của HLV {data?.profile?.fullName}</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-300">Lịch làm việc, hồ sơ học viên, giáo án, dinh dưỡng, giao tiếp, thu nhập và tài nguyên trên một luồng dữ liệu thống nhất.</p></div>
        <button className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20" onClick={load}>Làm mới dữ liệu</button>
      </div>
    </header>
    <CoachError message={error} retry={load} />
    <nav aria-label="Phân hệ chuyên nghiệp" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
      {tabs.map(([id, icon, label]) => <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${tab === id ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
        <span className="material-symbols-outlined text-[19px]">{icon}</span>{label}</button>)}
    </nav>
    {data && tab === 'schedule' && <ScheduleTab data={data} act={act} working={working} />}
    {data && tab === 'clients' && <ClientsTab data={data} act={act} working={working} />}
    {data && tab === 'programs' && <ProgramsTab data={data} act={act} working={working} />}
    {data && tab === 'communication' && <CommunicationTab data={data} act={act} working={working} />}
    {data && tab === 'performance' && <PerformanceTab data={data} />}
    {data && tab === 'facilities' && <FacilitiesTab data={data} act={act} working={working} />}
  </div>;
}

function ScheduleTab({ data, act, working }) {
  const [mode, setMode] = useState('week'); const [anchor, setAnchor] = useState(dateInput());
  const [leaveType, setLeaveType] = useState('AnnualLeave');
  const all = useMemo(() => mergeCoachCalendar(data.events, data.classSessions), [data]);
  const range = calendarWindow(anchor, mode); const visible = all.filter(x => x.date >= range.from && x.date <= range.to);
  const grouped = Object.groupBy ? Object.groupBy(visible, x => x.date) : visible.reduce((a, x) => ((a[x.date] ||= []).push(x), a), {});
  const submitEvent = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.createEvent({
    memberId: f.get('memberId') ? Number(f.get('memberId')) : null, roomId: f.get('roomId') ? Number(f.get('roomId')) : null,
    title: f.get('title'), eventType: f.get('eventType'), startAt: f.get('startAt'), endAt: f.get('endAt'), notes: f.get('notes') || null
  }), 'Đã tạo lịch và gửi yêu cầu xác nhận khi cần.').then(ok => ok && e.target.reset()); };
  const submitLeave = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.requestLeave({
    startAt: f.get('startAt'), endAt: f.get('endAt'), leaveType: f.get('leaveType'), reason: f.get('reason'),
    swapCoachId: f.get('swapCoachId') ? Number(f.get('swapCoachId')) : null
  }), 'Đã gửi đơn nghỉ đến quản lý.').then(ok => ok && e.target.reset()); };
  return <div className="grid gap-5 xl:grid-cols-[1.55fr_.8fr]">
    <div className="space-y-5"><Card title="Lịch ngày / tuần / tháng" action={<div className="flex gap-1">{['day','week','month'].map(x => <button key={x} onClick={() => setMode(x)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${mode === x ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>{x === 'day' ? 'Ngày' : x === 'week' ? 'Tuần' : 'Tháng'}</button>)}</div>}>
      <input aria-label="Ngày neo lịch" type="date" value={anchor} onChange={e => setAnchor(e.target.value)} className={`${input} mb-4 max-w-52`} />
      {!visible.length ? <Empty>Không có ca làm việc trong khoảng này.</Empty> : <div className="grid gap-3 md:grid-cols-2">{Object.entries(grouped).map(([date, items]) => <article key={date} className="rounded-xl border border-slate-200 p-3">
        <h3 className="mb-2 text-sm font-black text-red-700">{new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit' })}</h3>
        <div className="space-y-2">{items.map((item, i) => <div key={`${item.eventType}-${item.id}-${i}`} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="flex justify-between gap-2"><strong>{item.startLabel} · {item.title}</strong><span className="text-xs text-slate-500">{item.status}</span></div><p className="text-xs text-slate-500">{item.eventType} · {item.roomName || 'Chưa gán khu vực'} {item.memberName ? `· ${item.memberName}` : ''}</p>
          {item.eventType !== 'ClassSession' && item.status === 'Confirmed' && <div className="mt-2 flex gap-2"><button disabled={working} className="text-xs font-bold text-emerald-700" onClick={() => act(() => coachProfessionalApi.changeEvent(item.id, 'Completed'), 'Đã hoàn thành lịch.')}>Hoàn thành</button><button disabled={working} className="text-xs font-bold text-red-700" onClick={() => act(() => coachProfessionalApi.changeEvent(item.id, 'Cancelled'), 'Đã hủy lịch.')}>Hủy</button></div>}
        </div>)}</div></article>)}</div>}
    </Card>
    <Card title="Đơn nghỉ và đổi ca">{!data.leaves.length ? <Empty>Chưa có đơn nghỉ.</Empty> : <div className="space-y-2">{data.leaves.slice(0,8).map(x => <div key={x.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{x.leaveType} · {x.status}</strong><p className="text-xs text-slate-500">{dt(x.startAt)} → {dt(x.endAt)}</p><p className="text-xs">{x.reason}</p>{x.managerNote && <p className="mt-1 text-xs text-red-700">QL: {x.managerNote}</p>}</div>)}</div>}</Card></div>
    <div className="space-y-5"><Card title="Chủ động đặt lịch với học viên"><form onSubmit={submitEvent} className="space-y-3">
      <Label title="Loại lịch"><select name="eventType" className={input}><option value="PersonalTraining">PT cá nhân</option><option value="FloorDuty">Trực sàn</option><option value="Other">Công việc khác</option></select></Label>
      <Label title="Tiêu đề"><input name="title" required maxLength="200" className={input} /></Label>
      <Label title="Học viên (bắt buộc với PT)"><select name="memberId" className={input}><option value="">Không chọn</option>{data.clients.map(x => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select></Label>
      <Label title="Phòng"><select name="roomId" className={input}><option value="">Không chọn</option>{data.rooms?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Label>
      <div className="grid grid-cols-2 gap-2"><Label title="Bắt đầu"><input name="startAt" type="datetime-local" required className={input} /></Label><Label title="Kết thúc"><input name="endAt" type="datetime-local" required className={input} /></Label></div>
      <Label title="Ghi chú"><textarea name="notes" className={input} rows="2" /></Label><button disabled={working} className={button}>Tạo lịch & gửi xác nhận</button>
    </form></Card>
    <Card title="Nộp đơn nghỉ"><form onSubmit={submitLeave} className="space-y-3"><Label title="Loại đơn"><select name="leaveType" value={leaveType} onChange={e => setLeaveType(e.target.value)} className={input}><option value="AnnualLeave">Nghỉ phép</option><option value="SickLeave">Nghỉ ốm</option><option value="ShiftSwap">Đổi ca</option></select></Label><Label title={leaveType === 'ShiftSwap' ? 'HLV nhận đổi ca' : 'HLV nhận đổi ca (không áp dụng)'}><select name="swapCoachId" required={leaveType === 'ShiftSwap'} disabled={leaveType !== 'ShiftSwap'} className={input}><option value="">Chọn HLV</option>{data.peerCoaches?.map(x => <option key={x.id} value={x.id}>{x.fullName} · {x.specialization || 'HLV'}</option>)}</select></Label><div className="grid grid-cols-2 gap-2"><Label title="Từ"><input name="startAt" type="datetime-local" required className={input}/></Label><Label title="Đến"><input name="endAt" type="datetime-local" required className={input}/></Label></div><Label title="Lý do"><textarea name="reason" required className={input}/></Label><button disabled={working} className={button}>Gửi quản lý duyệt</button></form></Card></div>
  </div>;
}

function ClientsTab({ data, act, working }) {
  const [selectedId, setSelectedId] = useState(data.clients[0]?.id || '');
  const client = data.clients.find(x => Number(x.id) === Number(selectedId));
  const submit = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.saveHealthRecord({
    memberId: Number(selectedId), recordType: f.get('recordType'), title: f.get('title'), details: f.get('details'), occurredOn: f.get('occurredOn')
  }), 'Đã lưu ghi chú sức khỏe.').then(ok => ok && e.target.reset()); };
  return <div className="grid gap-5 xl:grid-cols-[.72fr_1.4fr]">
    <Card title={`Học viên phụ trách (${data.clients.length})`}><div className="space-y-2">{data.clients.map(x => <button key={x.id} onClick={() => setSelectedId(x.id)} className={`w-full rounded-xl border p-3 text-left ${Number(selectedId) === Number(x.id) ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}><div className="flex justify-between"><strong>{x.fullName}</strong>{x.renewal?.alert && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800">CẦN GIA HẠN</span>}</div><p className="text-xs text-slate-500">{x.memberCode} · {x.fitnessGoal || 'Chưa đặt mục tiêu'}</p></button>)}</div></Card>
    {!client ? <Empty>HLV chưa có học viên trong lớp được phân công.</Empty> : <div className="space-y-5">
      <Card title="Hồ sơ học viên"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Mục tiêu',client.fitnessGoal],['Trình độ',client.fitnessLevel],['Chiều cao',client.heightCm && `${client.heightCm} cm`],['Cân nặng',client.weightKg && `${client.weightKg} kg`]].map(([k,v]) => <div key={k} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">{k}</p><p className="mt-1 text-sm font-bold">{v || 'Chưa cập nhật'}</p></div>)}</div>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"><strong>Tiền sử / lưu ý y khoa:</strong> {client.medicalNote || 'Chưa ghi nhận'}</div>
        {client.renewal && <div className={`mt-3 rounded-xl border p-3 text-sm ${client.renewal.alert ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}><strong>{client.renewal.packageName}</strong> · hết hạn {client.renewal.endDate || '—'} · còn {client.renewal.remainingSessions ?? 'không giới hạn'} buổi / {client.renewal.daysRemaining ?? '—'} ngày</div>}
      </Card>
      <Card title="Biểu đồ chỉ số cơ thể (InBody / đo định kỳ)">{!client.bodyMetrics?.length ? <Empty>Chưa có dữ liệu đo cơ thể.</Empty> : <div className="overflow-x-auto"><div className="flex min-w-[520px] items-end gap-3 border-b border-l border-slate-200 p-4" style={{height:220}}>{[...client.bodyMetrics].reverse().map(x => <div key={x.id} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] font-bold">{x.weight || '—'}</span><div title={`Mỡ ${x.bodyFatPercentage || '—'}% · Cơ ${x.muscleMass || '—'}kg`} className="w-full max-w-10 rounded-t bg-gradient-to-t from-red-700 to-red-400" style={{height:`${Math.max(12, Math.min(150, Number(x.weight || 0) * 1.7))}px`}}/><span className="text-[9px] text-slate-500">{x.resultDate?.slice(5)}</span></div>)}</div><p className="mt-2 text-xs text-slate-500">Cột thể hiện cân nặng; rê chuột để xem tỷ lệ mỡ và khối lượng cơ.</p></div>}</Card>
      <div className="grid gap-5 lg:grid-cols-2"><Card title="Hồ sơ bệnh lý / chấn thương">{!client.healthRecords?.length ? <Empty>Chưa có ghi chú bổ sung.</Empty> : <div className="space-y-2">{client.healthRecords.map(x => <div key={x.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{x.title}</strong><p className="text-xs text-slate-500">{x.recordType} · {x.occurredOn}</p><p className="mt-1">{x.details}</p></div>)}</div>}</Card>
      <Card title="Thêm ghi chú sức khỏe"><form onSubmit={submit} className="space-y-3"><Label title="Phân loại"><select name="recordType" className={input}><option value="MedicalCondition">Bệnh lý</option><option value="Injury">Chấn thương</option><option value="CoachObservation">Quan sát của HLV</option></select></Label><Label title="Tiêu đề"><input name="title" required className={input}/></Label><Label title="Ngày ghi nhận"><input name="occurredOn" type="date" max={dateInput()} defaultValue={dateInput()} required className={input}/></Label><Label title="Chi tiết"><textarea name="details" required rows="3" className={input}/></Label><button disabled={working} className={button}>Lưu hồ sơ</button></form></Card></div>
    </div>}
  </div>;
}

function ProgramsTab({ data, act, working }) {
  const [media, setMedia] = useState({ imageUrl:'', videoUrl:'' }); const [uploading, setUploading] = useState(false);
  const [nutritionMember, setNutritionMember] = useState(data.clients[0]?.id || '');
  const [planMember, setPlanMember] = useState(data.clients[0]?.id || '');
  const [planClass, setPlanClass] = useState('');
  const [coachClasses, setCoachClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [planExercises, setPlanExercises] = useState([]);
  const selected = data.clients.find(x => Number(x.id) === Number(nutritionMember));
  const age = selected?.dateOfBirth ? Math.floor((Date.now() - new Date(selected.dateOfBirth).getTime()) / 31557600000) : 30;
  const tdee = tdeeEstimate({ gender:selected?.gender, weightKg:selected?.weightKg, heightCm:selected?.heightCm, age, activity:1.55 });
  const availableClasses = coachClasses.filter(cls => cls.members?.some(member => Number(member.memberId ?? member.id) === Number(planMember)));
  const memberPlans = plans.filter(plan => Number(plan.memberId) === Number(planMember));
  const weekdays = [['Monday','Thứ 2'],['Tuesday','Thứ 3'],['Wednesday','Thứ 4'],['Thursday','Thứ 5'],['Friday','Thứ 6'],['Saturday','Thứ 7'],['Sunday','Chủ nhật']];
  useEffect(() => { Promise.all([coachApi.getCoachClassesAndMembers(), coachApi.getTrainingPlans()])
    .then(([classes, currentPlans]) => { setCoachClasses(classes); setPlans(currentPlans); })
    .catch(() => {}); }, []);
  useEffect(() => { if (!availableClasses.some(x => Number(x.id) === Number(planClass))) setPlanClass(availableClasses[0]?.id || ''); }, [planMember, coachClasses]);
  const upload = async (file, field) => { if (!file) return; setUploading(true); try { const result = await uploadMediaFileToCloud(file); setMedia(x => ({...x,[field]:result.url})); } catch (e) { alert(e.message); } finally { setUploading(false); } };
  const exercise = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.saveExercise({ sportId:null, name:f.get('name'), description:f.get('description') || null, muscleGroup:f.get('muscleGroup') || null, difficultyLevel:f.get('difficultyLevel'), instructions:f.get('instructions') || null, imageUrl:media.imageUrl || null, videoUrl:media.videoUrl || null }), 'Đã thêm bài tập vào thư viện.').then(ok => { if(ok){ e.target.reset(); setMedia({imageUrl:'',videoUrl:''}); } }); };
  const homework = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.saveHomework({ classId:null, memberId:Number(f.get('memberId')), title:f.get('title'), description:f.get('description'), dueDate:f.get('dueDate') || null }), 'Đã giao bài tập và gửi thông báo.').then(ok => ok && e.target.reset()); };
  const nutrition = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.saveNutrition({ memberId:Number(f.get('memberId')), title:f.get('title'), startDate:f.get('startDate'), endDate:f.get('endDate') || null, dailyCalories:Number(f.get('dailyCalories')), proteinGrams:Number(f.get('proteinGrams')), carbGrams:Number(f.get('carbGrams')), fatGrams:Number(f.get('fatGrams')), mealPlanJson:JSON.stringify({ menu:f.get('menu') }), notes:f.get('notes') || null }), 'Đã cập nhật kế hoạch dinh dưỡng.').then(ok => ok && e.target.reset()); };
  const addExerciseToPlan = (item, at = planExercises.length) => setPlanExercises(current => {
    const next = [...current]; next.splice(at, 0, { key:`${item.id}-${Date.now()}-${current.length}`, name:item.name, sets:'3', reps:'10', note:'', weekNumber:1, dayOfWeek:'Monday' }); return next;
  });
  const acceptDrop = (event, at = planExercises.length) => { event.preventDefault(); event.stopPropagation(); const payload = event.dataTransfer.getData('text/plain');
    if (payload.startsWith('library:')) { const item = data.exercises.find(x => String(x.id) === payload.slice(8)); if (item) addExerciseToPlan(item, at); return; }
    if (payload.startsWith('plan:')) { const from = Number(payload.slice(5)); if (!Number.isInteger(from) || from === at) return; setPlanExercises(current => { const next=[...current]; const [item]=next.splice(from,1); next.splice(at > from ? at - 1 : at,0,item); return next; }); }
  };
  const updatePlanExercise = (index, field, value) => setPlanExercises(current => current.map((item, i) => i === index ? {...item,[field]:value} : item));
  const savePlan = async event => { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); if (!planClass || !planExercises.length) return;
    const ok = await act(() => coachApi.savePersonalTrainingPlan({ classId:Number(planClass), memberId:Number(planMember), title:form.get('title'), goal:form.get('goal'), startDate:form.get('startDate'), endDate:form.get('endDate') || null, fitnessCondition:form.get('fitnessCondition') || null, exercises:planExercises }), 'Đã lưu giáo án cá nhân hóa theo tuần/tháng.');
    if (ok) { setPlans(await coachApi.getTrainingPlans()); setPlanExercises([]); formElement.reset(); }
  };
  return <div className="space-y-5"><div className="grid gap-5 xl:grid-cols-2">
    <Card title="Thư viện bài tập chuẩn & cá nhân"><form onSubmit={exercise} className="grid gap-3 sm:grid-cols-2"><Label title="Tên bài tập"><input name="name" required className={input}/></Label><Label title="Nhóm cơ"><input name="muscleGroup" className={input}/></Label><Label title="Độ khó"><select name="difficultyLevel" className={input}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></Label><Label title="Mô tả"><input name="description" className={input}/></Label><Label title="Hình minh họa"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={e => upload(e.target.files?.[0],'imageUrl')} className={input}/></Label><Label title="Video hướng dẫn"><input type="file" accept="video/mp4,video/webm" onChange={e => upload(e.target.files?.[0],'videoUrl')} className={input}/></Label><Label title="Hướng dẫn"><textarea name="instructions" rows="3" className={input}/></Label><div className="flex items-end"><button disabled={working || uploading} className={button}>{uploading ? 'Đang tải media...' : 'Lưu bài tập'}</button></div></form></Card>
    <Card title="Giao bài tập về nhà"><form onSubmit={homework} className="space-y-3"><Label title="Học viên"><select name="memberId" required className={input}>{data.clients.map(x => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select></Label><Label title="Tên bài tập"><input name="title" required className={input}/></Label><Label title="Nội dung / cardio / giãn cơ"><textarea name="description" required rows="3" className={input}/></Label><Label title="Hạn check-in"><input name="dueDate" type="datetime-local" className={input}/></Label><button disabled={working} className={button}>Giao bài & gửi Push</button></form></Card>
  </div><Card title="Giáo án cá nhân hóa kéo thả theo tuần / tháng"><form onSubmit={savePlan} className="space-y-4"><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><Label title="Học viên"><select value={planMember} onChange={e => setPlanMember(e.target.value)} className={input}>{data.clients.map(x => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select></Label><Label title="Lớp phụ trách"><select value={planClass} onChange={e => setPlanClass(e.target.value)} required className={input}><option value="">Chọn lớp</option>{availableClasses.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Label><Label title="Tên giáo án"><input name="title" required className={input}/></Label><Label title="Mục tiêu"><input name="goal" required className={input}/></Label><Label title="Bắt đầu"><input name="startDate" type="date" defaultValue={dateInput()} required className={input}/></Label><Label title="Kết thúc"><input name="endDate" type="date" defaultValue={dateInput(28)} className={input}/></Label><Label title="Tình trạng thể lực"><input name="fitnessCondition" className={input}/></Label><div className="flex items-end"><button disabled={working || !planClass || !planExercises.length} className={button}>Lưu giáo án</button></div></div>
    <div className="grid gap-4 lg:grid-cols-[.75fr_1.25fr]"><div><p className="mb-2 text-xs font-black uppercase text-slate-500">Kéo bài tập từ thư viện</p><div className="max-h-96 space-y-2 overflow-auto">{data.exercises.map(x => <article key={x.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain',`library:${x.id}`)} className="flex cursor-grab items-center justify-between gap-3 rounded-xl border bg-slate-50 p-3 active:cursor-grabbing"><div><strong className="text-sm">{x.name}</strong><p className="text-xs text-slate-500">{x.muscleGroup || 'Toàn thân'} · {x.difficultyLevel || 'Mọi trình độ'}</p></div><button type="button" onClick={() => addExerciseToPlan(x)} className="rounded-lg border px-2 py-1 text-xs font-bold">Thêm</button></article>)}</div></div>
    <div onDragOver={e => e.preventDefault()} onDrop={e => acceptDrop(e)} className="min-h-52 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/40 p-3"><p className="mb-3 text-xs font-black uppercase text-red-700">Lịch tập · thả bài tập vào đây</p>{!planExercises.length ? <Empty>Kéo bài tập vào để bắt đầu xây dựng lộ trình.</Empty> : <div className="space-y-2">{planExercises.map((item,index) => <article key={item.key} draggable onDragStart={e => e.dataTransfer.setData('text/plain',`plan:${index}`)} onDragOver={e => e.preventDefault()} onDrop={e => acceptDrop(e,index)} className="rounded-xl border bg-white p-3 shadow-sm"><div className="mb-2 flex items-center justify-between"><strong className="text-sm"><span className="mr-2 cursor-grab text-slate-400">⠿</span>{item.name}</strong><button type="button" onClick={() => setPlanExercises(current => current.filter((_,i) => i !== index))} className="text-xs font-bold text-red-600">Xóa</button></div><div className="grid grid-cols-2 gap-2 md:grid-cols-5"><select aria-label={`Tuần ${item.name}`} value={item.weekNumber} onChange={e => updatePlanExercise(index,'weekNumber',Number(e.target.value))} className={input}>{Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>Tuần {i+1}</option>)}</select><select aria-label={`Ngày ${item.name}`} value={item.dayOfWeek} onChange={e => updatePlanExercise(index,'dayOfWeek',e.target.value)} className={input}>{weekdays.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><input aria-label={`Hiệp ${item.name}`} value={item.sets} onChange={e => updatePlanExercise(index,'sets',e.target.value)} placeholder="Hiệp" className={input}/><input aria-label={`Lần ${item.name}`} value={item.reps} onChange={e => updatePlanExercise(index,'reps',e.target.value)} placeholder="Số lần" className={input}/><input aria-label={`Ghi chú ${item.name}`} value={item.note} onChange={e => updatePlanExercise(index,'note',e.target.value)} placeholder="RPE / nghỉ" className={input}/></div></article>)}</div>}</div></div>
    {!!memberPlans.length && <div><p className="mb-2 text-xs font-black uppercase text-slate-500">Giáo án đã lưu</p><div className="grid gap-2 md:grid-cols-2">{memberPlans.map(plan => <article key={plan.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{plan.title}</strong><p className="text-xs text-slate-500">{plan.startDate} → {plan.endDate || 'dài hạn'} · {plan.exercises?.length || 0} bài</p><p className="mt-1 text-xs">{plan.exercises?.map(x => `T${x.weekNumber || 1}/${weekdays.find(day => day[0] === x.dayOfWeek)?.[1] || 'linh hoạt'}: ${x.name}`).join(' · ')}</p></article>)}</div></div>}
  </form></Card>
  <Card title={`Thiết kế dinh dưỡng · TDEE gợi ý ${tdee || 'chưa đủ chỉ số'} kcal/ngày`}><form onSubmit={nutrition} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"><Label title="Học viên"><select name="memberId" value={nutritionMember} onChange={e => setNutritionMember(e.target.value)} className={input}>{data.clients.map(x => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select></Label><Label title="Tên kế hoạch"><input name="title" required className={input}/></Label><Label title="Từ ngày"><input name="startDate" type="date" defaultValue={dateInput()} required className={input}/></Label><Label title="Đến ngày"><input name="endDate" type="date" className={input}/></Label><Label title="Calories"><input name="dailyCalories" type="number" min="800" defaultValue={tdee || 2000} required className={input}/></Label><Label title="Protein (g)"><input name="proteinGrams" type="number" min="0" defaultValue="140" required className={input}/></Label><Label title="Carb (g)"><input name="carbGrams" type="number" min="0" defaultValue="220" required className={input}/></Label><Label title="Fat (g)"><input name="fatGrams" type="number" min="0" defaultValue="60" required className={input}/></Label><Label title="Thực đơn"><textarea name="menu" rows="3" className={input}/></Label><Label title="Lưu ý"><textarea name="notes" rows="3" className={input}/></Label><div className="flex items-end"><button disabled={working} className={button}>Giao kế hoạch</button></div></form></Card>
  <div className="grid gap-5 lg:grid-cols-2"><Card title={`Thư viện (${data.exercises.length})`}><div className="max-h-80 space-y-2 overflow-auto">{data.exercises.map(x => <article key={x.id} className="flex gap-3 rounded-xl bg-slate-50 p-3">{x.imageUrl && <img src={x.imageUrl} alt="" className="h-14 w-20 rounded-lg object-cover"/>}<div><strong className="text-sm">{x.name}</strong><p className="text-xs text-slate-500">{x.muscleGroup || 'Toàn thân'} · {x.difficultyLevel || 'Mọi trình độ'} {x.isCustom ? '· Của tôi' : ''}</p>{x.videoUrl && <a href={x.videoUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-red-600">Xem video</a>}</div></article>)}</div></Card><Card title="Bài tập & trạng thái check-in">{!data.homework.length ? <Empty/> : <div className="max-h-80 space-y-2 overflow-auto">{data.homework.map(x => <article key={x.id} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{x.title}</strong><p className="text-xs text-slate-500">Hạn {dt(x.dueDate)} · {x.submissions.length} bài nộp</p>{x.submissions.map(s => <div key={s.id} className="mt-2 rounded-lg bg-white p-2"><span className="text-xs">{s.content}</span>{s.status !== 'Reviewed' && <button disabled={working} className="ml-2 text-xs font-bold text-red-600" onClick={() => act(() => coachProfessionalApi.reviewHomework(s.id,{score:100,coachFeedback:'Hoàn thành tốt'}),'Đã nhận xét bài tập.')}>Duyệt đạt</button>}</div>)}</article>)}</div>}</Card></div>
  </div>;
}

function CommunicationTab({ data, act, working }) {
  const [memberId, setMemberId] = useState(data.clients[0]?.id || ''); const [messages, setMessages] = useState([]); const [loadingMessages, setLoadingMessages] = useState(false);
  const loadMessages = async id => { if (!id) return; setLoadingMessages(true); try { setMessages(await coachProfessionalApi.getMessages(data.profile.id,id)); } finally { setLoadingMessages(false); } };
  useEffect(() => { loadMessages(memberId); }, [memberId]);
  const send = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.sendMessage({ coachId:data.profile.id, memberId:Number(memberId), content:f.get('content') }), 'Đã gửi tin nhắn.').then(ok => { if(ok){ e.target.reset(); loadMessages(memberId); } }); };
  const broadcast = e => { e.preventDefault(); const f = new FormData(e.currentTarget); const channels=['InApp','Email','SMS','Push'].filter(x => f.get(x)); return act(() => coachProfessionalApi.broadcast({ classId:null, memberIds:null, title:f.get('title'), content:f.get('content'), channels }), 'Đã gửi thông báo hàng loạt và tạo hàng đợi đa kênh.').then(ok => ok && e.target.reset()); };
  return <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
    <Card title="Chat bảo mật trong hệ thống" action={<select value={memberId} onChange={e => setMemberId(e.target.value)} className={`${input} max-w-56`}>{data.clients.map(x => <option key={x.id} value={x.id}>{x.fullName}</option>)}</select>}>
      <div className="h-[420px] space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-4">{loadingMessages ? <p className="text-sm">Đang tải...</p> : !messages.length ? <Empty>Bắt đầu cuộc trò chuyện với học viên.</Empty> : messages.map(x => <div key={x.id} className={`max-w-[80%] rounded-2xl p-3 text-sm ${Number(x.senderUserId) === Number(data.profile.userId) ? 'ml-auto bg-red-600 text-white' : 'bg-white shadow-sm'}`}><p>{x.content}</p><p className="mt-1 text-[10px] opacity-70">{dt(x.createdAt)}</p></div>)}</div>
      <form onSubmit={send} className="mt-3 flex gap-2"><input name="content" required maxLength="4000" placeholder="Nhắc uống nước, ngủ sớm, giải đáp chuyên môn..." className={input}/><button disabled={working || !memberId} className={button}>Gửi</button></form>
    </Card>
    <Card title="Thông báo hàng loạt"><form onSubmit={broadcast} className="space-y-3"><Label title="Tiêu đề"><input name="title" required className={input}/></Label><Label title="Nội dung"><textarea name="content" required rows="7" className={input}/></Label><fieldset><legend className="text-xs font-bold text-slate-600">Kênh giao tin</legend><div className="mt-2 grid grid-cols-2 gap-2">{['InApp','Email','SMS','Push'].map((x,i) => <label key={x} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><input name={x} type="checkbox" defaultChecked={i === 0}/>{x}</label>)}</div></fieldset><p className="text-xs text-slate-500">In-app giao ngay; Email/SMS/Push vào hàng đợi có thể giám sát bởi quản lý.</p><button disabled={working} className={button}>Gửi tới toàn bộ học viên</button></form></Card>
  </div>;
}

function Metric({ label, value, note }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p>{note && <p className="mt-1 text-xs text-slate-500">{note}</p>}</div>; }

function PerformanceTab({ data }) {
  const k = data.kpi || {}; const sessionPercent = k.targetSessions ? Math.min(100, Math.round(k.completedSessions * 100 / k.targetSessions)) : 0; const salesPercent = k.targetSales ? Math.min(100, Math.round(k.sales * 100 / k.targetSales)) : 0;
  return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Buổi dạy tháng" value={k.completedSessions || 0} note={`${k.completedClassSessions || 0} lớp · ${k.completedPersonalSessions || 0} PT`}/><Metric label="Tỷ lệ giữ chân" value={`${k.retentionRate || 0}%`} note={`${k.retainedClients || 0}/${k.activeClients || 0} học viên`}/><Metric label="Doanh số ghi nhận" value={currency(k.sales)}/><Metric label="Đánh giá" value={`${k.averageRating || 0}/5`} note={`${k.reviewCount || 0} phản hồi`}/></div>
    <div className="grid gap-5 xl:grid-cols-2"><Card title="Tiến độ KPI"><div className="space-y-5">{[['Buổi dạy',sessionPercent,`${k.completedSessions || 0}/${k.targetSessions || 0}`],['Doanh số',salesPercent,`${currency(k.sales)} / ${currency(k.targetSales)}`]].map(([label,pct,text]) => <div key={label}><div className="mb-1 flex justify-between text-sm font-bold"><span>{label}</span><span>{text}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-600" style={{width:`${pct}%`}}/></div></div>)}</div></Card>
      <Card title="Thu nhập dự kiến minh bạch"><div className="space-y-3">{[['Lương cơ bản',k.baseSalary],['Hoa hồng buổi dạy',k.sessionCommission],['Hoa hồng doanh số',k.salesCommission]].map(([label,value]) => <div key={label} className="flex justify-between border-b border-slate-100 pb-2 text-sm"><span>{label}</span><strong>{currency(value)}</strong></div>)}<div className="flex justify-between rounded-xl bg-emerald-50 p-4"><strong>Tổng dự kiến</strong><strong className="text-emerald-700">{currency(k.estimatedIncome)}</strong></div></div></Card></div>
    <Card title="Đánh giá & phản hồi học viên">{!data.reviews?.length ? <Empty>Chưa có đánh giá.</Empty> : <div className="grid gap-3 md:grid-cols-2">{data.reviews.map(x => <article key={x.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between"><strong>{x.memberName || `Học viên #${x.memberId}`}</strong><span className="font-bold text-amber-500">{'★'.repeat(x.rating)}{'☆'.repeat(5-x.rating)}</span></div><p className="mt-2 text-sm text-slate-600">{x.comment || 'Không có nhận xét.'}</p><p className="mt-2 text-xs text-slate-400">{dt(x.updatedAt || x.createdAt)}</p></article>)}</div>}</Card>
  </div>;
}

function FacilitiesTab({ data, act, working }) {
  const [photoUrl, setPhotoUrl] = useState(''); const [uploading, setUploading] = useState(false);
  const booking = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.bookResource({ resourceId:Number(f.get('resourceId')), workEventId:null, startAt:f.get('startAt'), endAt:f.get('endAt'), purpose:f.get('purpose') }), 'Đã đặt tài nguyên, hệ thống đã kiểm tra trùng lịch.').then(ok => ok && e.target.reset()); };
  const issue = e => { e.preventDefault(); const f = new FormData(e.currentTarget); return act(() => coachProfessionalApi.reportIssue({ resourceId:f.get('resourceId') ? Number(f.get('resourceId')) : null, title:f.get('title'), description:f.get('description'), severity:f.get('severity'), photoUrl:photoUrl || null }), 'Đã báo sự cố đến bộ phận quản lý.').then(ok => { if(ok){ e.target.reset(); setPhotoUrl(''); } }); };
  const upload = async file => { if(!file)return; setUploading(true); try { setPhotoUrl((await uploadMediaFileToCloud(file)).url); } catch(e){ alert(e.message); } finally{ setUploading(false); } };
  return <div className="space-y-5"><div className="grid gap-5 xl:grid-cols-2"><Card title="Đặt khu vực / thiết bị"><form onSubmit={booking} className="space-y-3"><Label title="Tài nguyên"><select name="resourceId" required className={input}><option value="">Chọn...</option>{data.resources.map(x => <option key={x.id} value={x.id}>{x.name} · {x.resourceType}</option>)}</select></Label><div className="grid grid-cols-2 gap-2"><Label title="Bắt đầu"><input name="startAt" type="datetime-local" required className={input}/></Label><Label title="Kết thúc"><input name="endAt" type="datetime-local" required className={input}/></Label></div><Label title="Mục đích"><input name="purpose" required className={input}/></Label><button disabled={working || !data.resources.length} className={button}>Kiểm tra & đặt</button></form></Card>
    <Card title="Báo cáo bảo trì kèm ảnh"><form onSubmit={issue} className="space-y-3"><Label title="Thiết bị"><select name="resourceId" className={input}><option value="">Khác / chưa có danh mục</option>{data.resources.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Label><Label title="Mức độ"><select name="severity" className={input}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Label><Label title="Tiêu đề"><input name="title" required className={input}/></Label><Label title="Mô tả an toàn"><textarea name="description" required rows="3" className={input}/></Label><Label title="Ảnh hiện trường"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={e => upload(e.target.files?.[0])} className={input}/></Label><button disabled={working || uploading} className={button}>{uploading ? 'Đang tải ảnh...' : 'Gửi báo cáo'}</button></form></Card></div>
    <div className="grid gap-5 xl:grid-cols-2"><Card title="Lượt đặt của tôi">{!data.resourceBookings.length ? <Empty/> : <div className="space-y-2">{data.resourceBookings.map(x => <article key={x.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><div><strong>{x.resourceName}</strong><p className="text-xs text-slate-500">{dt(x.startAt)} → {dt(x.endAt)} · {x.purpose}</p></div>{x.status === 'Confirmed' && <button disabled={working} className="text-xs font-bold text-red-600" onClick={() => act(() => coachProfessionalApi.cancelResource(x.id),'Đã hủy lượt đặt.')}>Hủy</button>}</article>)}</div>}</Card><Card title="Theo dõi sự cố đã báo">{!data.equipmentIssues.length ? <Empty/> : <div className="space-y-2">{data.equipmentIssues.map(x => <article key={x.id} className="rounded-xl bg-slate-50 p-3 text-sm"><div className="flex justify-between"><strong>{x.title}</strong><span className="text-xs font-bold text-red-600">{x.severity} · {x.status}</span></div><p className="text-xs text-slate-500">{x.resourceName || 'Thiết bị khác'} · {dt(x.reportedAt)}</p>{x.resolutionNote && <p className="mt-2 text-xs">Xử lý: {x.resolutionNote}</p>}</article>)}</div>}</Card></div>
  </div>;
}
