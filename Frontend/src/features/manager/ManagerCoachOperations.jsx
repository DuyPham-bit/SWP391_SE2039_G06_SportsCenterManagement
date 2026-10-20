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
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E2235] via-[#242A42] to-[#1E2235] p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#2D6A4F]/20 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 -mb-16 h-48 w-48 rounded-full bg-[#F2CC8F]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2CC8F]/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#F2CC8F] backdrop-blur-md">
                <span className="material-symbols-outlined text-[14px]">sports_martial_arts</span>
                {isEn ? 'Coach Workspace' : 'Khu vực điều hành'}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {coachOptions.length} {isEn ? 'coaches' : 'HLV'}
              </span>
            </div>
            <h1 className="mt-2.5 font-chivo text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isEn ? 'Coach Team Operations' : 'Vận hành đội ngũ Huấn luyện viên'}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              {isEn
                ? 'Approve leave requests, manage commission policies, track facilities & equipment, and monitor notification deliveries.'
                : 'Duyệt nghỉ phép, chính sách hoa hồng, tài nguyên phòng tập, bảo trì thiết bị và kiểm tra giao thông báo.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              {isEn ? 'Refresh' : 'Làm mới'}
            </button>
          </div>
        </div>
      </div>

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
              ? 'InApp notifications are delivered in real time. External channels remain queued until third-party providers (Email/SMS/Push) are configured.'
              : 'InApp được giao trực tiếp; các kênh bên ngoài ở trạng thái Queued cho đến khi trung tâm cấu hình nhà cung cấp Email/SMS/Push.'}
          </p>
        </Card>
      )}
    </div>
  );
}
