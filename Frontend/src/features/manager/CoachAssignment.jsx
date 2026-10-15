import { classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import {
  coachWorkload, filterAndSortAssignmentClasses, isCoachCompatible, summarizeCoachAssignments
} from './coachAssignmentView.js';

const { useMemo, useState, useEffect } = React;
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300';
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50';

const statusMeta = {
  Draft: ['Bản nháp', 'bg-amber-50 text-amber-700 border-amber-200'],
  Published: ['Đang mở', 'bg-emerald-50 text-emerald-700 border-emerald-200']
};

function Icon({ children, className = '' }) {
  return <span aria-hidden="true" className={`material-symbols-outlined text-[19px] ${className}`}>{children}</span>;
}

function Initials({ name, size = 'h-11 w-11' }) {
  const letters = String(name || '?').trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
  return <span aria-hidden="true" className={`${size} shrink-0 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-black text-sm shadow-sm`}>{letters}</span>;
}

function StatusBadge({ status }) {
  const [label, css] = statusMeta[status] || [status || 'Chưa rõ', 'bg-slate-100 text-slate-600 border-slate-200'];
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${css}`}>{label}</span>;
}

export function CoachAssignment() {
  const { showSuccess, showError } = useToast();
  const [classes, setClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);

  const summary = useMemo(() => summarizeCoachAssignments(classes), [classes]);
  const visibleClasses = useMemo(
    () => filterAndSortAssignmentClasses(classes, query, assignmentFilter),
    [classes, query, assignmentFilter]
  );
  const workloads = useMemo(() => coachWorkload(coaches, classes), [coaches, classes]);

  const loadData = async () => {
    setError('');
    try {
      const [classList, staffList] = await Promise.all([
        classApi.getManagementClasses(), classApi.getCoaches()
      ]);
      setClasses(classList);
      setCoaches(staffList);
    } catch (e) { setError(e.message || 'Lỗi tải dữ liệu phân công HLV'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const openAssignModal = cls => {
    const compatible = coaches.filter(coach => isCoachCompatible(coach, cls));
    const currentIsCompatible = compatible.some(coach => String(coach.id) === String(cls.coachId));
    setSelectedClass(cls);
    setSelectedCoachId(currentIsCompatible ? String(cls.coachId) : String(compatible[0]?.id || ''));
    setAssignError(null);
    setModalOpen(true);
  };

  const handleConfirmAssign = async event => {
    event.preventDefault();
    if (!selectedCoachId) { showError('Không có HLV phù hợp để phân công.'); return; }
    if (String(selectedCoachId) === String(selectedClass.coachId)) {
      setAssignError({ message: 'HLV này đang phụ trách lớp. Hãy chọn một HLV khác để thay đổi.' });
      return;
    }
    setAssigning(true); setAssignError(null);
    try {
      await classApi.assignCoach(selectedClass.id, selectedCoachId);
      showSuccess(`${selectedClass.coachId ? 'Đã thay đổi' : 'Đã phân công'} HLV cho lớp "${selectedClass.name}".`);
      setModalOpen(false);
      await loadData();
    } catch (err) { setAssignError(err); showError(err); }
    finally { setAssigning(false); }
  };

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu phân công HLV..." />;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><p>{error}</p><button className={`${secondaryButton} mt-3`} onClick={() => { setLoading(true); loadData(); }}>Thử lại</button></div>;

  return <div className="space-y-6">
    <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Điều phối chuyên môn</p><h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900">Phân công huấn luyện viên</h1><p className="mt-1 text-sm text-slate-500">Ưu tiên các lớp chưa có HLV và kiểm tra xung đột trước khi lưu.</p></div>
      <a href="#/manager/classes-rooms" className={secondaryButton}><Icon>calendar_month</Icon>Quản lý lịch lớp</a>
    </header>

    <section aria-label="Tổng quan phân công" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <SummaryCard icon="school" label="Lớp cần quản lý" value={summary.total} tone="slate" />
      <SummaryCard icon="person_check" label="Đã có HLV" value={summary.assigned} tone="emerald" />
      <SummaryCard icon="person_alert" label="Chưa có HLV" value={summary.unassigned} tone={summary.unassigned ? 'red' : 'emerald'} />
      <SummaryCard icon="edit_note" label="Lớp bản nháp" value={summary.draft} tone="amber" />
    </section>

    <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-5 items-start">
      <main className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col md:flex-row gap-3">
          <label className="relative flex-1"><span className="sr-only">Tìm lớp học</span><Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</Icon><input className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên lớp, bộ môn, phòng hoặc HLV..." /></label>
          <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Lọc trạng thái phân công">
            {[['all', 'Tất cả'], ['unassigned', `Chưa có HLV (${summary.unassigned})`], ['assigned', 'Đã phân công']].map(([value, label]) => <button key={value} onClick={() => setAssignmentFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${assignmentFilter === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}
          </div>
        </div>

        {summary.unassigned > 0 && assignmentFilter !== 'assigned' && !query && <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><Icon className="shrink-0">priority_high</Icon><p><strong>{summary.unassigned} lớp chưa có HLV phụ trách.</strong> Các lớp này được đưa lên đầu danh sách để xử lý trước.</p></div>}

        <div className="grid lg:grid-cols-2 gap-4">
          {visibleClasses.map(cls => <ClassAssignmentCard key={cls.id} cls={cls} coaches={coaches} busy={assigning} onAssign={() => openAssignModal(cls)} />)}
        </div>
        {!visibleClasses.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center"><Icon className="text-4xl text-slate-300">search_off</Icon><p className="mt-2 font-bold text-slate-700">Không có lớp phù hợp</p><p className="text-sm text-slate-500">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>}
      </main>

      <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden xl:sticky xl:top-5">
        <div className="border-b border-slate-100 p-4"><h2 className="font-black text-slate-900 flex items-center gap-2"><Icon className="text-red-600">groups</Icon>Tải lớp theo HLV</h2><p className="mt-1 text-xs text-slate-500">Số lớp chính đang phụ trách, không tính lớp đã đóng.</p></div>
        <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">{workloads.map(coach => <div key={coach.id} className="flex items-center gap-3 p-4"><Initials name={coach.fullName} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{coach.fullName}</p><p className="truncate text-xs text-slate-500">{coach.specialization || 'Chưa cập nhật chuyên môn'}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${coach.primaryClassCount >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{coach.primaryClassCount} lớp</span></div>)}</div>
        {!workloads.length && <p className="p-5 text-sm text-slate-500">Chưa có HLV đang hoạt động.</p>}
      </aside>
    </div>

    <Modal isOpen={modalOpen} onClose={() => !assigning && setModalOpen(false)} title={selectedClass?.coachId ? 'Thay đổi HLV phụ trách' : 'Phân công HLV phụ trách'} maxWidth="max-w-3xl">
      {selectedClass && <AssignmentForm selectedClass={selectedClass} coaches={workloads} selectedCoachId={selectedCoachId} setSelectedCoachId={value => { setSelectedCoachId(value); setAssignError(null); }} assigning={assigning} error={assignError} onSubmit={handleConfirmAssign} onClose={() => setModalOpen(false)} />}
    </Modal>
  </div>;
}

function SummaryCard({ icon, label, value, tone }) {
  const tones = { slate: 'bg-slate-100 text-slate-700', emerald: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-700', amber: 'bg-amber-100 text-amber-700' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-3"><span className={`h-11 w-11 rounded-xl flex items-center justify-center ${tones[tone]}`}><Icon className="text-[24px]">{icon}</Icon></span><div><p className="text-2xl font-black text-slate-900">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div></div>;
}

function ClassAssignmentCard({ cls, coaches, busy, onAssign }) {
  const currentCoach = coaches.find(coach => String(coach.id) === String(cls.coachId));
  const missingCoach = !cls.coachId;
  return <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${missingCoach ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}`}>
    <div className={`h-1.5 ${missingCoach ? 'bg-red-500' : 'bg-emerald-500'}`} />
    <div className="p-5">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-red-600">{cls.sportName}</p><h2 className="mt-1 font-black text-slate-900 break-words">{cls.name}</h2></div><StatusBadge status={cls.status} /></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center"><MiniMetric icon="calendar_month" value={`${cls.activeScheduleCount || 0}`} label="Lịch tuần" warning={!cls.activeScheduleCount} /><MiniMetric icon="meeting_room" value={cls.roomName || '—'} label="Phòng" /><MiniMetric icon="groups" value={`${cls.enrolledCount || 0}/${cls.capacity}`} label="Học viên" /></div>
      <div className={`mt-4 rounded-xl border p-3.5 flex items-center gap-3 ${missingCoach ? 'border-dashed border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
        {missingCoach ? <span className="h-11 w-11 shrink-0 rounded-xl bg-white text-red-500 border border-red-100 flex items-center justify-center"><Icon className="text-[25px]">person_alert</Icon></span> : <Initials name={cls.coachName} />}
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HLV chính</p><p className={`truncate text-sm font-black ${missingCoach ? 'text-red-700' : 'text-slate-900'}`}>{cls.coachName || 'Chưa phân công'}</p>{currentCoach?.specialization && <p className="truncate text-xs text-slate-500">{currentCoach.specialization}</p>}</div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-slate-500">{cls.durationMinutes} phút/buổi{cls.level ? ` · ${cls.level}` : ''}</p><button className={missingCoach ? primaryButton : secondaryButton} disabled={busy || !coaches.length} onClick={onAssign}><Icon>{missingCoach ? 'person_add' : 'swap_horiz'}</Icon>{missingCoach ? 'Phân công' : 'Thay đổi'}</button></div>
    </div>
  </article>;
}

function MiniMetric({ icon, value, label, warning = false }) {
  return <div className={`min-w-0 rounded-xl p-2.5 ${warning ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700'}`}><Icon className="text-[17px]">{icon}</Icon><p className="mt-0.5 truncate text-xs font-black" title={String(value)}>{value}</p><p className="text-[9px] uppercase tracking-wider opacity-70">{label}</p></div>;
}

function AssignmentForm({ selectedClass, coaches, selectedCoachId, setSelectedCoachId, assigning, error, onSubmit, onClose }) {
  const compatibleCount = coaches.filter(coach => isCoachCompatible(coach, selectedClass)).length;
  return <form onSubmit={onSubmit} className="space-y-5">
    <div className="rounded-xl bg-slate-900 p-4 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-red-400">{selectedClass.sportName}</p><h3 className="mt-1 font-black">{selectedClass.name}</h3></div><StatusBadge status={selectedClass.status} /></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-300"><span>Phòng: <strong className="text-white">{selectedClass.roomName || 'Chưa chọn'}</strong></span><span>Lịch tuần: <strong className="text-white">{selectedClass.activeScheduleCount || 0}</strong></span><span>HLV hiện tại: <strong className="text-white">{selectedClass.coachName || 'Chưa có'}</strong></span></div></div>
    {error && <BusinessAlert type="error" title="Không thể phân công" code={error.code || 'COACH-ASSIGN-ERR'} message={error.message || String(error)} proposedHandling={error.proposedHandling || 'Kiểm tra chuyên môn, lịch dạy, ngày nghỉ hoặc chọn HLV khác.'} />}
    <div><div className="flex items-center justify-between"><div><h3 className="font-black text-slate-900">Chọn HLV phù hợp</h3><p className="text-xs text-slate-500">{compatibleCount}/{coaches.length} HLV có chuyên môn khớp với bộ môn.</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Đã lọc chuyên môn</span></div>
      <div className="mt-3 grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">{coaches.map(coach => {
        const compatible = isCoachCompatible(coach, selectedClass);
        const current = String(coach.id) === String(selectedClass.coachId);
        const selected = String(coach.id) === String(selectedCoachId);
        return <label key={coach.id} className={`relative flex gap-3 rounded-xl border p-3 transition ${!compatible ? 'cursor-not-allowed bg-slate-50 opacity-55' : selected ? 'cursor-pointer border-red-500 bg-red-50 ring-2 ring-red-100' : 'cursor-pointer border-slate-200 hover:border-slate-300'}`}>
          <input className="sr-only" type="radio" name="coachId" disabled={!compatible || current} checked={selected} onChange={() => setSelectedCoachId(String(coach.id))} />
          <Initials name={coach.fullName} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-black text-slate-900">{coach.fullName}</p>{selected && <Icon className="text-red-600">check_circle</Icon>}</div><p className="truncate text-xs text-slate-500">{coach.specialization || 'Chưa có chuyên môn'}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">{coach.primaryClassCount} lớp</span>{current && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Hiện tại</span>}{!compatible && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Sai chuyên môn</span>}</div></div>
        </label>;
      })}</div>
      {!compatibleCount && <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><Icon className="shrink-0">warning</Icon><span>Chưa có HLV nào có chuyên môn “{selectedClass.sportName}”. Hãy cập nhật hồ sơ chuyên môn hoặc bổ sung HLV trước.</span></div>}
    </div>
    <div className="grid sm:grid-cols-3 gap-2 text-xs"><PolicyItem icon="verified_user" text="Kiểm tra chuyên môn" /><PolicyItem icon="event_busy" text="Chặn trùng lịch/ngày nghỉ" /><PolicyItem icon="schedule" text="Tối đa 8 giờ/ngày" /></div>
    {!selectedClass.coachId && selectedClass.status === 'Draft' && <div className="flex gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800"><Icon className="shrink-0">info</Icon><span>Có thể phân công HLV trước khi tạo lịch. Các kiểm tra lịch sẽ chạy lại khi lịch được thêm hoặc sửa.</span></div>}
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" className={secondaryButton} disabled={assigning} onClick={onClose}>Đóng</button><button type="submit" className={primaryButton} disabled={assigning || !selectedCoachId || String(selectedCoachId) === String(selectedClass.coachId)}>{assigning ? 'Đang kiểm tra...' : selectedClass.coachId ? 'Xác nhận thay đổi' : 'Xác nhận phân công'}</button></div>
  </form>;
}

function PolicyItem({ icon, text }) {
  return <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2.5 text-slate-600"><Icon className="text-emerald-600">{icon}</Icon><span className="font-semibold">{text}</span></div>;
}
