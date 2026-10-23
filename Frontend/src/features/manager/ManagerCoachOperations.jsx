import React, { useEffect, useState } from 'react';
import { managerCoachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { LoadingSpinner } from '../../components/common/Table.jsx';
import { currency } from '../coach/coachProfessionalView.js';

const inputStyle = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 focus:border-[#81B29A] transition-all';
const primaryBtnStyle = 'rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] px-4 py-2 text-sm font-bold text-white transition-all shadow-sm hover-lift disabled:opacity-50';
const secondaryBtnStyle = 'rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50';

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
  const [issueTab, setIssueTab] = useState('open');

  const dt = (x) => {
    if (!x) return '—';
    return new Date(x).toLocaleString(isEn ? 'en-US' : 'vi-VN', {
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
      setData(await managerCoachApi.getWorkspace());
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

  const compensation = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        managerCoachApi.saveCompensation({
          coachId: Number(f.get('coachId')),
          monthlyBaseSalary: Number(f.get('monthlyBaseSalary')),
          commissionPerSession: Number(f.get('commissionPerSession')),
          salesCommissionPercent: Number(f.get('salesCommissionPercent')),
          targetSessions: Number(f.get('targetSessions')),
          targetSales: Number(f.get('targetSales')),
          effectiveFrom: f.get('effectiveFrom'),
          effectiveTo: f.get('effectiveTo') || null
        }),
      isEn ? 'KPI and compensation policy updated successfully.' : 'Đã cập nhật chính sách KPI và thu nhập.'
    ).then((ok) => ok && e.target.reset());
  };

  const sales = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        managerCoachApi.saveSalesCredit({
          coachId: Number(f.get('coachId')),
          memberId: null,
          subscriptionId: null,
          amount: Number(f.get('amount')),
          creditedAt: null,
          note: f.get('note') || null
        }),
      isEn ? 'Sales credit recorded for coach.' : 'Đã ghi nhận doanh số cho HLV.'
    ).then((ok) => ok && e.target.reset());
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
    { id: 'leaves', label: isEn ? 'Leave Requests' : 'Đơn nghỉ phép', icon: 'event_busy' },
    { id: 'compensation', label: isEn ? 'KPI & Compensation' : 'KPI & Lương thưởng', icon: 'payments' },
    { id: 'resources', label: isEn ? 'Equipment & Zones' : 'Tài nguyên & Thiết bị', icon: 'inventory_2' },
    { id: 'issues', label: isEn ? 'Maintenance Issues' : 'Sự cố bảo trì', icon: 'build' },
    { id: 'delivery', label: isEn ? 'Message Delivery' : 'Giám sát tin nhắn', icon: 'mark_email_read' }
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
              {isEn ? 'Coach Team Operations' : 'Vận hành đội ngũ Huấn luyện viên'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-white/95 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
              {isEn
                ? 'Approve leave requests, manage commission policies, track facilities & equipment, and monitor notification deliveries.'
                : 'Duyệt nghỉ phép, chính sách hoa hồng, tài nguyên phòng tập, bảo trì thiết bị và kiểm tra giao thông báo.'}
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
          badge={`${data?.leaves?.length || 0} ${isEn ? 'requests' : 'đơn'}`}
        >
          {!data?.leaves?.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined mx-auto mb-2 text-3xl text-slate-400">task_alt</span>
              <p>{isEn ? 'No leave or shift swap requests pending.' : 'Chưa có đơn xin nghỉ hoặc đổi ca nào.'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.leaves.map((x) => {
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
                          {dt(x.startAt)} → {dt(x.endAt)}
                        </p>
                        {x.swapCoachName && (
                          <p className="mt-1 text-xs font-semibold text-[#2D6A4F] dark:text-[#81B29A] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                            {isEn ? 'Proposed shift swap with:' : 'Đề xuất đổi ca với:'} {x.swapCoachName}
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
                      <div className="mt-3 flex gap-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                        <button
                          disabled={working}
                          className={primaryBtnStyle}
                          onClick={() =>
                            act(
                              () =>
                                managerCoachApi.reviewLeave(x.id, {
                                  status: 'Approved',
                                  managerNote: isEn ? 'Schedule checked and approved.' : 'Đã kiểm tra lịch và phê duyệt.'
                                }),
                              isEn ? 'Leave request approved.' : 'Đã duyệt đơn nghỉ.'
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
          <Card title={isEn ? 'Configure KPI & Commission Policy' : 'Thiết lập KPI & Hoa hồng'}>
            <form onSubmit={compensation} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label title={isEn ? 'Coach' : 'Huấn luyện viên'}>
                  <select name="coachId" required className={inputStyle}>
                    {coachOptions.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.fullName} ({x.email || `#${x.id}`})
                      </option>
                    ))}
                  </select>
                </Label>
              </div>

              <Label title={isEn ? 'Effective From' : 'Hiệu lực từ'}>
                <input name="effectiveFrom" type="date" required className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Effective To (Optional)' : 'Hiệu lực đến (Tùy chọn)'}>
                <input name="effectiveTo" type="date" className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Base Salary (VND)' : 'Lương cơ bản (VND)'}>
                <input name="monthlyBaseSalary" type="number" min="0" defaultValue="8000000" required className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Session Bonus (VND)' : 'Hoa hồng / buổi (VND)'}>
                <input name="commissionPerSession" type="number" min="0" defaultValue="100000" required className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Sales Commission %' : 'Hoa hồng doanh số %'}>
                <input name="salesCommissionPercent" type="number" min="0" max="100" defaultValue="5" required className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Target Sessions' : 'Mục tiêu buổi'}>
                <input name="targetSessions" type="number" min="0" defaultValue="60" required className={inputStyle} />
              </Label>

              <div className="sm:col-span-2">
                <Label title={isEn ? 'Target Sales (VND)' : 'Mục tiêu doanh số (VND)'}>
                  <input name="targetSales" type="number" min="0" defaultValue="30000000" required className={inputStyle} />
                </Label>
              </div>

              <div className="sm:col-span-2 pt-2">
                <button disabled={working} className={`${primaryBtnStyle} w-full`}>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    {isEn ? 'Save Compensation Policy' : 'Lưu chính sách thu nhập'}
                  </span>
                </button>
              </div>
            </form>
          </Card>

          <Card title={isEn ? 'Record Package Sales Credit' : 'Ghi nhận doanh số gói tập'}>
            <form onSubmit={sales} className="space-y-4">
              <Label title={isEn ? 'Coach' : 'Huấn luyện viên'}>
                <select name="coachId" className={inputStyle}>
                  {coachOptions.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.fullName}
                    </option>
                  ))}
                </select>
              </Label>

              <Label title={isEn ? 'Revenue Amount (VND)' : 'Số tiền doanh số (VND)'}>
                <input name="amount" type="number" min="1" placeholder="e.g. 5000000" required className={inputStyle} />
              </Label>

              <Label title={isEn ? 'Notes' : 'Ghi chú'}>
                <textarea name="note" rows="2" placeholder={isEn ? 'Package sale notes...' : 'Ghi chú gói tập...'} className={inputStyle} />
              </Label>

              <button disabled={working} className={`${primaryBtnStyle} w-full`}>
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  {isEn ? 'Record Sales Credit' : 'Ghi nhận doanh số'}
                </span>
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
              <h3 className="mb-3 font-chivo text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isEn ? 'Recent Sales Credits' : 'Ghi nhận gần đây'}
              </h3>
              {!data?.salesCredits?.length ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{isEn ? 'No sales credited yet.' : 'Chưa có ghi nhận doanh số.'}</p>
              ) : (
                <div className="space-y-2">
                  {data.salesCredits.slice(0, 6).map((x) => (
                    <div
                      key={x.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {isEn ? 'Coach' : 'HLV'} #{x.coachId}
                        </span>
                        <span className="ml-2 text-slate-400 dark:text-slate-500">{dt(x.creditedAt)}</span>
                        {x.note && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{x.note}</p>}
                      </div>
                      <strong className="text-sm font-black text-[#2D6A4F] dark:text-[#81B29A]">{currency(x.amount)}</strong>
                    </div>
                  ))}
                </div>
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
      {tab === 'issues' && (() => {
        const allIssues = data?.equipmentIssues || [];
        const openIssues = allIssues.filter((x) => !x.status || x.status === 'Open' || x.status === 'Pending');
        const inProgressIssues = allIssues.filter((x) => x.status === 'InProgress' || x.status === 'OnHold');
        const closedIssues = allIssues.filter(
          (x) => x.status === 'Resolved' || x.status === 'Closed' || x.status === 'Rejected' || x.status === 'Cancelled'
        );
        const displayedIssues =
          issueTab === 'open'
            ? openIssues
            : issueTab === 'in_progress'
            ? inProgressIssues
            : closedIssues;

        const handleUpdate = (id, status, defaultNote, successMsg) => {
          const promptLabel = isEn
            ? 'Enter feedback / resolution notes for Coach / Technician:'
            : 'Nhập ghi chú phản hồi cho HLV / Kỹ thuật viên:';
          const note = window.prompt(promptLabel, defaultNote);
          if (note === null) return;
          return act(
            () =>
              managerCoachApi.resolveIssue(id, {
                status,
                resolutionNote: note.trim() || defaultNote
              }),
            successMsg
          );
        };

        const issueStatusMeta = (st) => {
          switch (st) {
            case 'Resolved':
            case 'Closed':
              return {
                label: isEn ? 'Resolved' : 'Đã giải quyết',
                cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              };
            case 'OnHold':
              return {
                label: isEn ? 'Waiting for Parts' : 'Chờ linh kiện',
                cls: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              };
            case 'InProgress':
              return {
                label: isEn ? 'In Progress' : 'Đang xử lý',
                cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
              };
            case 'Rejected':
            case 'Cancelled':
              return {
                label: isEn ? 'Rejected / Void' : 'Đã từ chối',
                cls: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              };
            default:
              return {
                label: isEn ? 'Pending Review' : 'Chờ tiếp nhận',
                cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
              };
          }
        };

        return (
          <Card
            title={isEn ? 'Equipment Maintenance & Incident Reports' : 'Sự cố thiết bị & Báo cáo kỹ thuật'}
            badge={`${allIssues.length} ${isEn ? 'issues' : 'sự cố'}`}
          >
            {/* Sub-tabs */}
            <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setIssueTab('open')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  issueTab === 'open'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{isEn ? '1. Pending Review' : '1. Chờ tiếp nhận'}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                    issueTab === 'open' ? 'bg-white text-rose-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {openIssues.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIssueTab('in_progress')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  issueTab === 'in_progress'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{isEn ? '2. In Progress & Waiting Parts' : '2. Đang xử lý & Chờ linh kiện'}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                    issueTab === 'in_progress' ? 'bg-white text-blue-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {inProgressIssues.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIssueTab('resolved')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  issueTab === 'resolved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{isEn ? '3. Closed (Fixed / Rejected)' : '3. Đã đóng (Đã sửa / Từ chối)'}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                    issueTab === 'resolved' ? 'bg-white text-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {closedIssues.length}
                </span>
              </button>
            </div>

            {displayedIssues.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {issueTab === 'open' && (isEn ? 'No incidents awaiting review.' : 'Không có sự cố nào đang chờ tiếp nhận.')}
                {issueTab === 'in_progress' &&
                  (isEn
                    ? 'No incidents currently under repair or waiting for parts.'
                    : 'Hiện không có sự cố nào đang sửa chữa hoặc chờ linh kiện.')}
                {issueTab === 'resolved' && (isEn ? 'No closed incident reports yet.' : 'Chưa có sự cố nào đã đóng trong danh sách.')}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {displayedIssues.map((x) => {
                  const severityBadge =
                    x.severity === 'High' || x.severity === 'Critical'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                  const stMeta = issueStatusMeta(x.status);

                  return (
                    <article
                      key={x.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="font-chivo text-sm text-slate-900 dark:text-slate-100">{x.title}</strong>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {x.resourceName || (isEn ? 'Other Equipment' : 'Thiết bị khác')} · {dt(x.reportedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${severityBadge}`}>
                            {x.severity}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${stMeta.cls}`}>
                            {stMeta.label}
                          </span>
                        </div>
                      </div>

                      <p className="my-2.5 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 whitespace-pre-line">
                        {x.description}
                      </p>

                      {x.photoUrl && (
                        <div className="mb-2">
                          <a
                            href={x.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
                          >
                            <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                            <span>{isEn ? 'View incident photo' : 'Xem ảnh hiện trường'}</span>
                          </a>
                        </div>
                      )}

                      {x.resolutionNote && (
                        <div className="rounded-lg bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 p-2.5 text-xs text-slate-800 dark:text-slate-200">
                          <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">
                            {isEn ? 'Technician Response / Resolution:' : 'Phản hồi kỹ thuật / Giải pháp:'}
                          </strong>
                          <span>{x.resolutionNote}</span>
                          {x.resolvedAt && (
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {isEn ? 'Updated at:' : 'Cập nhật lúc:'} {dt(x.resolvedAt)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Smart status navigation buttons */}
                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-2">
                        {issueTab === 'open' && (
                          <>
                            <button
                              disabled={working}
                              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
                              onClick={() =>
                                handleUpdate(
                                  x.id,
                                  'InProgress',
                                  isEn
                                    ? 'Technician has acknowledged and is checking on site.'
                                    : 'Kỹ thuật viên đã tiếp nhận và đang tiến hành kiểm tra tại chỗ.',
                                  isEn ? 'Moved to in-progress.' : 'Đã chuyển sang trạng thái đang xử lý.'
                                )
                              }
                            >
                              {isEn ? 'Acknowledge (Fixing)' : 'Tiếp nhận (Đang sửa)'}
                            </button>
                            <button
                              disabled={working}
                              className="rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 transition-all cursor-pointer"
                              onClick={() =>
                                handleUpdate(
                                  x.id,
                                  'OnHold',
                                  isEn
                                    ? 'Inspected on site, holding while ordering replacement parts.'
                                    : 'Đã khảo sát hiện trường, tạm hoãn để chờ đặt mua linh kiện thay thế.',
                                  isEn ? 'Moved to waiting for parts.' : 'Đã chuyển sang trạng thái chờ linh kiện.'
                                )
                              }
                            >
                              {isEn ? 'Wait for Parts' : 'Chờ linh kiện'}
                            </button>
                            <button
                              disabled={working}
                              className="rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                              onClick={() =>
                                handleUpdate(
                                  x.id,
                                  'Rejected',
                                  isEn
                                    ? 'Inspected: equipment is normal or duplicate report.'
                                    : 'Kiểm tra thấy thiết bị vẫn hoạt động bình thường hoặc báo cáo trùng lặp.',
                                  isEn ? 'Report rejected.' : 'Đã từ chối báo cáo sự cố.'
                                )
                              }
                            >
                              {isEn ? 'Reject / Void' : 'Từ chối / Báo sai'}
                            </button>
                            <button
                              disabled={working}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer ml-auto"
                              onClick={() =>
                                handleUpdate(
                                  x.id,
                                  'Resolved',
                                  isEn ? 'Checked and resolved immediately.' : 'Đã kiểm tra và xử lý xong ngay lập tức.',
                                  isEn ? 'Incident marked as resolved.' : 'Đã hoàn tất xử lý sự cố.'
                                )
                              }
                            >
                              {isEn ? 'Resolve' : 'Hoàn tất'}
                            </button>
                          </>
                        )}

                        {issueTab === 'in_progress' && (
                          <>
                            {x.status === 'InProgress' ? (
                              <button
                                disabled={working}
                                className="rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 transition-all cursor-pointer"
                                onClick={() =>
                                  handleUpdate(
                                    x.id,
                                    'OnHold',
                                    isEn
                                    ? 'Holding while ordering spare parts.'
                                    : 'Cần tạm hoãn để chờ đặt mua phụ tùng / linh kiện thay thế.',
                                    isEn ? 'Moved to waiting for parts.' : 'Đã chuyển sang trạng thái chờ linh kiện.'
                                  )
                                }
                              >
                                {isEn ? 'Hold for Parts' : 'Chờ linh kiện / Tạm hoãn'}
                              </button>
                            ) : (
                              <button
                                disabled={working}
                                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
                                onClick={() =>
                                  handleUpdate(
                                    x.id,
                                    'InProgress',
                                    isEn
                                    ? 'Parts received, technician continuing repair.'
                                    : 'Đã có linh kiện phụ tùng, kỹ thuật viên tiếp tục thay thế & sửa chữa.',
                                    isEn ? 'Resumed repair process.' : 'Đã tiếp tục tiến trình sửa chữa.'
                                  )
                                }
                              >
                                {isEn ? 'Resume Repair' : 'Tiếp tục sửa chữa'}
                              </button>
                            )}
                            <button
                              disabled={working}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
                              onClick={() =>
                                handleUpdate(
                                  x.id,
                                  'Resolved',
                                  isEn
                                    ? 'Repaired and safety verified, equipment functioning normally.'
                                    : 'Đã sửa chữa và kiểm định an toàn, thiết bị hoạt động bình thường.',
                                  isEn ? 'Repair completed.' : 'Đã hoàn tất sửa chữa sự cố.'
                                )
                              }
                            >
                              {isEn ? 'Finish Repair' : 'Hoàn tất sửa chữa'}
                            </button>
                          </>
                        )}

                        {issueTab === 'resolved' && (
                          <button
                            disabled={working}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                            onClick={() =>
                              handleUpdate(
                                x.id,
                                'InProgress',
                                isEn ? 'Reopening incident for further maintenance.' : 'Mở lại sự cố để kỹ thuật viên tiếp tục bảo dưỡng.',
                                isEn ? 'Reopened for investigation.' : 'Đã mở lại sự cố để tiếp tục xử lý.'
                              )
                            }
                          >
                            {isEn ? 'Reopen Check' : 'Mở lại kiểm tra'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })()}
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
              ? 'InApp notifications are delivered in real time. External channels remain queued until third-party providers (Email/SMS/Push) are configured.'
              : 'InApp được giao trực tiếp; các kênh bên ngoài ở trạng thái Queued cho đến khi trung tâm cấu hình nhà cung cấp Email/SMS/Push.'}
          </p>
        </Card>
      )}
    </div>
  );
}
