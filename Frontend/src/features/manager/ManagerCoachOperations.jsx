import { vietnamDate, formatVietnamDateTime } from '../../utils/dateTime.js';
import React, { useEffect, useState } from 'react';
import { managerCoachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { currency } from '../coach/coachProfessionalView.js';

const inputStyle = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition-all';
const primaryBtnStyle = 'rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] px-4 py-2 text-sm font-bold text-white transition-all shadow-sm hover-lift disabled:opacity-50';
const secondaryBtnStyle = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50';
const currentMonthStart = () => {
  return `${vietnamDate().slice(0, 7)}-01`;
};

function Card({ title, badge, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover-lift transition-all">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-chivo text-base font-black text-slate-900 dark:text-slate-100">{title}</h2>
        {badge && <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function Label({ title, children }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
      {title}
      <span className="mt-1.5 block normal-case font-normal text-slate-800 dark:text-slate-200">{children}</span>
    </label>
  );
}

export function ManagerCoachOperations() {
  const { showSuccess, showError } = useToast();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [tab, setTab] = useState('leaves');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('Pending');
  const [replacementByLeave, setReplacementByLeave] = useState({});

  const dt = (x) => {
    if (!x) return '—';
    return formatVietnamDateTime(x, isEn, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const load = async () => {
    setLoading(true);
    try {
      const result = await managerCoachApi.getWorkspace();
      setData(result);
      setReplacementByLeave(Object.fromEntries(
        (result?.leaves || []).filter(x => x.status === 'Pending').map(x => {
          const proposedId = x.swapCoachId ? String(x.swapCoachId) : '';
          const proposedIsAvailable = (x.replacementCandidates || []).some(coach => String(coach.id) === proposedId);
          return [x.id, proposedIsAvailable ? proposedId : ''];
        })
      ));
    } catch (e) {
      showError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (fn, msg) => {
    setWorking(true);
    try {
      await fn();
      showSuccess(msg);
      await load();
      return true;
    } catch (e) {
      showError(e);
      return false;
    } finally {
      setWorking(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner text={isEn ? 'Loading coach operations data...' : 'Đang tải vận hành HLV...'} />
      </div>
    );
  }

  const coachOptions = data?.coaches || [];
  const pendingLeaveCount = (data?.leaves || []).filter(x => x.status === 'Pending').length;
  const visibleLeaves = (data?.leaves || []).filter(x => leaveStatusFilter === 'All' || x.status === leaveStatusFilter);

  const compensation = (e) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const f = new FormData(formElement);
    return act(
      () =>
        managerCoachApi.saveCompensation({
          coachId: Number(f.get('coachId')),
          monthlyBaseSalary: Number(f.get('monthlyBaseSalary')),
          commissionPerSession: Number(f.get('commissionPerSession')),
          targetSessions: Number(f.get('targetSessions')),
          effectiveFrom: f.get('effectiveFrom'),
          effectiveTo: f.get('effectiveTo') || null
        }),
      isEn ? 'Compensation policy updated successfully.' : 'Đã cập nhật chính sách thù lao và ca dạy.'
    ).then((ok) => ok && formElement.reset());
  };

  const resource = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        managerCoachApi.createResource({
          name: f.get('name'),
          resourceType: f.get('resourceType'),
          location: f.get('location') || null,
          capacity: f.get('capacity') ? Number(f.get('capacity')) : null
        }),
      isEn ? 'Center resource/equipment added successfully.' : 'Đã thêm tài nguyên trung tâm.'
    ).then((ok) => ok && e.target.reset());
  };

  const tabs = [
    { id: 'leaves', label: isEn ? `Leave Approvals (${pendingLeaveCount})` : `Duyệt đơn nghỉ (${pendingLeaveCount})`, icon: 'event_busy' },
    { id: 'compensation', label: isEn ? 'Salary & KPI Report' : 'Lương & Báo cáo KPI', icon: 'payments' }
  ];

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner (Olympic Multi-stop Gradient matching Image 1) */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-[#24828F]/25 border border-white/30"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/35 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{isEn ? 'Coach Workspace' : 'Khu vực điều hành'}</span>
              </span>
              <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/30">
                {coachOptions.length} {isEn ? 'coaches' : 'HLV'}
              </span>
            </div>
            <h1 className="font-chivo text-2xl font-black tracking-tight text-white sm:text-3xl leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Coach Leave Approvals & Operations' : 'Duyệt đơn nghỉ & vận hành HLV'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/95 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
              {isEn
                ? 'Approve coach leave requests and manage transparent salary and KPI policies.'
                : 'Duyệt đơn nghỉ của HLV và quản lý chính sách lương, KPI minh bạch.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/40 transition-all hover-lift cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-200">refresh</span>
              <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modern Tab Bar */}
      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm">
        {tabs.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all hover-lift ${
                isActive
                  ? 'bg-[#1E2235] text-white shadow-sm dark:bg-[#2D6A4F]'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Tab: LEAVES */}
      {tab === 'leaves' && (
        <Card
          title={isEn ? 'Leave, Sick & Shift Swap Requests' : 'Đơn nghỉ phép / Nghỉ ốm / Đổi ca'}
          badge={`${pendingLeaveCount} ${isEn ? 'pending' : 'chờ duyệt'}`}
        >
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                <span className="material-symbols-outlined text-[20px]">pending_actions</span>
                {pendingLeaveCount
                  ? (isEn ? `${pendingLeaveCount} requests require your decision.` : `${pendingLeaveCount} đơn đang chờ manager duyệt.`)
                  : (isEn ? 'There are no requests awaiting approval.' : 'Hiện không có đơn nào đang chờ duyệt.')}
              </p>
              <div className="flex flex-wrap gap-1 rounded-lg bg-white/80 p-1 dark:bg-slate-900/70">
                {[
                  ['Pending', isEn ? 'Pending' : 'Chờ duyệt'],
                  ['Approved', isEn ? 'Approved' : 'Đã duyệt'],
                  ['Rejected', isEn ? 'Rejected' : 'Từ chối'],
                  ['All', isEn ? 'All' : 'Tất cả']
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setLeaveStatusFilter(value)}
                    className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold transition-colors ${leaveStatusFilter === value ? 'bg-[#1E2235] text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {!visibleLeaves.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined mx-auto mb-2 text-3xl text-slate-400">task_alt</span>
              <p>{isEn ? 'No requests match this status.' : 'Không có đơn nào ở trạng thái này.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLeaves.map((x) => {
                const isPending = x.status === 'Pending';
                const statusColor =
                  x.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                    : x.status === 'Rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';

                return (
                  <article
                    key={x.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="font-chivo text-sm text-slate-900 dark:text-slate-100">{x.coachName}</strong>
                          <span className="rounded-md bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {x.leaveType}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {formatVietnamDateTime(x.startAt, isEn)} → {formatVietnamDateTime(x.endAt, isEn)}
                        </p>
                        {x.swapCoachName && (
                          <p className="mt-1 text-xs font-semibold text-[#2D6A4F] dark:text-[#81B29A] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                            {x.status === 'Approved'
                              ? (isEn ? 'Replacement coach:' : 'HLV dạy bù:')
                              : (isEn ? 'Proposed replacement:' : 'HLV thay thế đề xuất:')} {x.swapCoachName}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                          {x.reason || (isEn ? 'No reason specified' : 'Không có lý do cụ thể')}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                        {x.status}
                      </span>
                    </div>

                    {isPending && (
                      <div className="mt-3 space-y-3 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-xs text-slate-800 dark:text-slate-100">
                              {x.affectedSessions?.length || 0} {isEn ? 'sessions need coverage' : 'ca dạy cần bố trí người thay'}
                            </strong>
                            {!!x.requiredSports?.length && <span className="rounded-full bg-[#81B29A]/15 px-2 py-1 text-[11px] font-bold text-[#2D6A4F] dark:text-[#81B29A]">{x.requiredSports.join(', ')}</span>}
                          </div>
                          {!!x.affectedSessions?.length && (
                            <div className="mt-2 grid gap-1 sm:grid-cols-2">
                              {x.affectedSessions.map(session => (
                                <p key={session.id} className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  <strong>{session.className}</strong><br />
                                  {session.sessionDate} · {String(session.startTime).slice(0, 5)}–{String(session.endTime).slice(0, 5)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {!x.affectedSessions?.length ? (
                          <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                            {isEn ? 'No teaching session is affected. This request can be approved without assigning a replacement.' : 'Không có ca dạy bị ảnh hưởng. Có thể duyệt đơn mà không cần phân công HLV thay thế.'}
                          </p>
                        ) : !x.replacementCandidates?.length ? (
                          <p className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                            {isEn ? 'No coach currently has every required specialization and a free schedule.' : 'Hiện chưa có HLV nào vừa đủ toàn bộ chuyên môn vừa trống các ca này. Chưa thể duyệt đơn.'}
                          </p>
                        ) : (
                          <fieldset>
                            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              {isEn ? 'Qualified and available replacements' : 'HLV đủ chuyên môn và đang trống lịch'}
                            </legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {x.replacementCandidates.map(coach => (
                                <label key={coach.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${replacementByLeave[x.id] === String(coach.id) ? 'border-[#2D6A4F] bg-emerald-50 ring-2 ring-[#81B29A]/30 dark:bg-emerald-950/30' : 'border-slate-200 bg-white hover:border-[#81B29A] dark:border-slate-700 dark:bg-slate-900'}`}>
                                  <input type="radio" name={`replacement-${x.id}`} value={coach.id}
                                    checked={replacementByLeave[x.id] === String(coach.id)}
                                    onChange={e => setReplacementByLeave(current => ({ ...current, [x.id]: e.target.value }))} />
                                  <span className="min-w-0">
                                    <strong className="block truncate text-xs text-slate-900 dark:text-white">{coach.fullName}</strong>
                                    <span className="text-[11px] text-slate-500">{coach.specializations?.join(', ') || coach.specialization}</span>
                                  </span>
                                  <span className="material-symbols-outlined ml-auto text-[18px] text-emerald-600">verified</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        )}
                        <div className="flex gap-2">
                          <button
                            disabled={working || (x.affectedSessions?.length > 0 && !replacementByLeave[x.id])}
                            className={primaryBtnStyle}
                            onClick={() =>
                              act(
                                () =>
                                  managerCoachApi.reviewLeave(x.id, {
                                    status: 'Approved',
                                    managerNote: isEn ? 'Schedule checked and replacement assigned.' : 'Đã kiểm tra lịch và phân công HLV dạy bù.',
                                    replacementCoachId: replacementByLeave[x.id] ? Number(replacementByLeave[x.id]) : null
                                  }),
                                isEn ? 'Leave request approved.' : 'Đã duyệt đơn nghỉ và phân công HLV dạy bù.'
                              )
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">check</span>
                              {isEn ? 'Approve' : 'Duyệt'}
                            </span>
                          </button>
                          <button
                            disabled={working}
                            className="rounded-xl border border-rose-300 dark:border-rose-800 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all disabled:opacity-50"
                            onClick={() =>
                              act(
                                () =>
                                  managerCoachApi.reviewLeave(x.id, {
                                    status: 'Rejected',
                                    managerNote: isEn ? 'Cannot arrange substitute coach at this time.' : 'Chưa thể bố trí nhân sự thay thế.'
                                  }),
                                isEn ? 'Leave request rejected.' : 'Đã từ chối đơn nghỉ.'
                              )
                            }
                          >
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">close</span>
                              {isEn ? 'Reject' : 'Từ chối'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab: COMPENSATION */}
      {tab === 'compensation' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title={isEn ? 'Configure Compensation & Target Sessions' : 'Thiết lập Thù lao & Chỉ tiêu ca dạy'}>
            <form onSubmit={compensation} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label title={isEn ? 'Coach' : 'Huấn luyện viên'}>
                  <select name="coachId" required className={inputStyle}>
                    {coachOptions.filter(x => x.isPayrollActive).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.fullName} ({x.email || `#${x.id}`})
                      </option>
                    ))}
                  </select>
                </Label>
              </div>

              <Label title={isEn ? 'Effective From' : 'Hiệu lực từ'}>
                <input name="effectiveFrom" type="date" required defaultValue={currentMonthStart()} className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Effective To (Optional)' : 'Hiệu lực đến (Tùy chọn)'}>
                <input name="effectiveTo" type="date" className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Base Salary (VND)' : 'Lương cơ bản (VND)'}>
                <input name="monthlyBaseSalary" type="number" min="0" defaultValue="8000000" required className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Session Pay (VND)' : 'Thù lao mỗi ca dạy (VND)'}>
                <input name="commissionPerSession" type="number" min="0" defaultValue="100000" required className={inputStyle} />
              </Label>

              <div className="sm:col-span-2">
                <Label title={isEn ? 'Target Sessions / Month' : 'Chỉ tiêu ca dạy / tháng (KPI)'}>
                  <input name="targetSessions" type="number" min="0" defaultValue="60" required className={inputStyle} />
                </Label>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button disabled={working} className={`${primaryBtnStyle} w-full`}>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    {isEn ? 'Save Compensation Policy' : 'Lưu chính sách thù lao'}
                  </span>
                </button>
              </div>
            </form>
          </Card>

          <Card title={isEn ? 'Active Policies Overview' : 'Danh sách chính sách đang áp dụng'}>
            <a href="#/manager/payroll" className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#2D6A4F]/30 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-[#2D6A4F] hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-[#81B29A]">
              <span className="material-symbols-outlined text-[17px]">summarize</span>
              {isEn ? 'Open salary & payroll report' : 'Mở Lương & Báo cáo tiền lương'}
            </a>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {!data?.policies?.length ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                  {isEn ? 'No compensation policies configured yet.' : 'Chưa có chính sách nào được cấu hình.'}
                </p>
              ) : (
                data.policies.map((p) => {
                  const coach = coachOptions.find((c) => c.id === p.coachId);
                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {coach?.fullName || `HLV #${p.coachId}`}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isEn ? 'Base' : 'Lương cứng'}: <strong>{currency(p.monthlyBaseSalary)}</strong> • {isEn ? 'Per Session' : 'Ca dạy'}:{' '}
                          <strong className="text-teal-600">{currency(p.commissionPerSession)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isEn ? 'Target' : 'Chỉ tiêu'}: {p.targetSessions} ca/tháng • Từ: {dt(p.effectiveFrom)}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                        {p.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: RESOURCES */}
      {tab === 'resources' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title={isEn ? 'Add Sports Zone / Equipment' : 'Thêm khu vực / Thiết bị'}>
            <form onSubmit={resource} className="space-y-4">
              <Label title={isEn ? 'Resource / Zone Name' : 'Tên tài nguyên / Khu vực'}>
                <input
                  name="name"
                  placeholder={isEn ? 'e.g. Badminton Court 1, Boxing Ring A' : 'VD: Sân Cầu Lông 1, Ring Đấu A'}
                  required
                  className={inputStyle}
                />
              </Label>

              <Label title={isEn ? 'Resource Type' : 'Phân loại tài nguyên'}>
                <select name="resourceType" className={inputStyle}>
                  <option value="TrainingZone">{isEn ? 'Training Zone' : 'Khu vực tập luyện'}</option>
                  <option value="Equipment">{isEn ? 'Gym Equipment' : 'Thiết bị tập thể hình'}</option>
                  <option value="BoxingRing">{isEn ? 'Boxing Ring' : 'Sàn đấu Boxing'}</option>
                  <option value="PilatesMachine">{isEn ? 'Pilates Reformer' : 'Máy tập Pilates'}</option>
                  <option value="AerialYogaRig">{isEn ? 'Aerial Yoga Rig' : 'Khung Yoga bay'}</option>
                </select>
              </Label>

              <Label title={isEn ? 'Location / Zone' : 'Vị trí / Tầng'}>
                <input name="location" placeholder={isEn ? 'e.g. Floor 2 - Hall B' : 'VD: Tầng 2 - Sảnh B'} className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Capacity (Persons)' : 'Sức chứa tối đa (Người)'}>
                <input name="capacity" type="number" min="1" defaultValue="1" className={inputStyle} />
              </Label>

              <button disabled={working} className={`${primaryBtnStyle} w-full`}>
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">add_box</span>
                  {isEn ? 'Create Center Resource' : 'Thêm tài nguyên trung tâm'}
                </span>
              </button>
            </form>
          </Card>

          <Card title={isEn ? 'Catalog & Recent Bookings' : 'Danh mục & Lịch đặt gần đây'}>
            <h3 className="mb-3 font-chivo text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEn ? 'Active Resources' : 'Danh sách tài nguyên'}
            </h3>
            <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
              {data?.resources?.map((x) => (
                <div
                  key={x.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-sm flex items-center justify-between"
                >
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">{x.name}</strong>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {x.resourceType} · {x.location || (isEn ? 'Unassigned location' : 'Chưa gán vị trí')}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-200/80 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {x.status || 'Active'}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
              <h3 className="mb-3 font-chivo text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isEn ? 'Recent Resource Reservations' : 'Lịch đặt gần đây'}
              </h3>
              {!data?.resourceBookings?.length ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'No reservations found.' : 'Chưa có lịch đặt nào.'}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {data.resourceBookings.slice(0, 10).map((x) => (
                    <div
                      key={x.id}
                      className="border-b border-slate-100 dark:border-slate-800/60 py-2 text-xs flex justify-between items-start"
                    >
                      <div>
                        <strong className="text-slate-800 dark:text-slate-200">{x.resourceName}</strong>
                        <span className="text-slate-500 dark:text-slate-400"> · {x.coachName}</span>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {dt(x.startAt)} → {dt(x.endAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: ISSUES */}
      {tab === 'issues' && (
        <Card
          title={isEn ? 'Equipment Maintenance & Incident Reports' : 'Sự cố thiết bị & Báo cáo kỹ thuật'}
          badge={`${data?.equipmentIssues?.length || 0} ${isEn ? 'issues' : 'sự cố'}`}
        >
          {!data?.equipmentIssues?.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined mx-auto mb-2 text-3xl text-emerald-500">check_circle</span>
              <p>{isEn ? 'All facilities and equipment operating normally.' : 'Tất cả thiết bị và cơ sở vật chất hoạt động ổn định.'}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.equipmentIssues.map((x) => {
                const isResolved = x.status === 'Resolved';
                const severityBadge =
                  x.severity === 'High' || x.severity === 'Critical'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';

                return (
                  <article
                    key={x.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <strong className="font-chivo text-sm text-slate-900 dark:text-slate-100">{x.title}</strong>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${severityBadge}`}>
                        {x.severity}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {x.resourceName || (isEn ? 'Other Equipment' : 'Thiết bị khác')} · {dt(x.reportedAt)}
                    </p>

                    <p className="my-2.5 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      {x.description}
                    </p>

                    {x.photoUrl && (
                      <a
                        href={x.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] hover:underline"
                      >
                        <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                        {isEn ? 'View incident photo' : 'Xem ảnh hiện trường'}
                      </a>
                    )}

                    {!isResolved && (
                      <div className="mt-3 flex gap-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                        <button
                          disabled={working}
                          className={secondaryBtnStyle}
                          onClick={() =>
                            act(
                              () =>
                                managerCoachApi.resolveIssue(x.id, {
                                  status: 'InProgress',
                                  resolutionNote: isEn ? 'Technician is investigating.' : 'Kỹ thuật viên đang kiểm tra.'
                                }),
                              isEn ? 'Moved to in-progress.' : 'Đã chuyển sang xử lý.'
                            )
                          }
                        >
                          <span className="inline-flex items-center gap-1 text-xs">
                            <span className="material-symbols-outlined text-[14px]">handyman</span>
                            {isEn ? 'In Progress' : 'Đang xử lý'}
                          </span>
                        </button>
                        <button
                          disabled={working}
                          className={primaryBtnStyle}
                          onClick={() =>
                            act(
                              () =>
                                managerCoachApi.resolveIssue(x.id, {
                                  status: 'Resolved',
                                  resolutionNote: isEn ? 'Fixed and safety checked.' : 'Đã khắc phục và kiểm tra an toàn.'
                                }),
                              isEn ? 'Issue marked as resolved.' : 'Đã đóng sự cố.'
                            )
                          }
                        >
                          <span className="inline-flex items-center gap-1 text-xs">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            {isEn ? 'Resolve' : 'Hoàn tất'}
                          </span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Tab: DELIVERY */}
      {tab === 'delivery' && (
        <Card title={isEn ? 'Multi-Channel Notification Delivery Monitoring' : 'Giám sát giao thông báo đa kênh'}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data?.deliverySummary?.map((x) => (
              <div
                key={`${x.channel}-${x.status}`}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 transition-all hover-lift"
              >
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {x.channel} · {x.status}
                </p>
                <p className="mt-2 font-chivo text-3xl font-black text-slate-900 dark:text-slate-100">{x.count}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            {isEn
              ? 'InApp notifications are delivered in real time. External channels remain queued until third-party providers (Email) are configured.'
              : 'InApp được giao trực tiếp; các kênh bên ngoài ở trạng thái Queued cho đến khi trung tâm cấu hình nhà cung cấp Email.'}
          </p>
        </Card>
      )}
    </div>
  );
}
