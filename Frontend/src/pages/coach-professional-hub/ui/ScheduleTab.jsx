import { parseVietnamDateTime, formatVietnamDate } from '../../../shared/lib/dateTime.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { coachProfessionalApi, calendarWindow, classSessionWindow, mergeCoachCalendar } from '../../../entities/coach/index.js';
import { SectionCard, EmptyState, formatDate } from '../../../features/coach-workspace/index.js';
import { inputClass, selectClass, buttonPrimary, FormField, dateInput, dateTimeInput } from './formControls.jsx';

// ─────────────────────────────────────────────────────────────
// TAB 1: SCHEDULE & LEAVES (LỊCH & NGHỈ PHÉP)
// ─────────────────────────────────────────────────────────────
export function ScheduleTab({ data, act, working, isEn }) {
  const [mode, setMode] = useState('week');
  const [anchor, setAnchor] = useState(dateInput());
  const [leaveType, setLeaveType] = useState('AnnualLeave');
  const [leaveWindow, setLeaveWindow] = useState({ startAt: '', endAt: '' });
  const [coverage, setCoverage] = useState(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [coverageError, setCoverageError] = useState('');
  const [swapCoachId, setSwapCoachId] = useState('');
  const leaveFormRef = useRef(null);
  const minimumLeaveStart = useMemo(() => dateTimeInput(), []);

  const all = useMemo(() => mergeCoachCalendar(data.events, data.classSessions), [data]);
  const range = calendarWindow(anchor, mode);
  const visible = all.filter(x => x.date >= range.from && x.date <= range.to);
  const grouped = Object.groupBy ? Object.groupBy(visible, x => x.date) : visible.reduce((a, x) => ((a[x.date] ||= []).push(x), a), {});

  useEffect(() => {
    setSwapCoachId('');
    setCoverage(null);
    setCoverageError('');
    setCoverageLoading(false);
    if (leaveType !== 'ShiftSwap' || !leaveWindow.startAt || !leaveWindow.endAt) return undefined;
    if (parseVietnamDateTime(leaveWindow.endAt) <= parseVietnamDateTime(leaveWindow.startAt)) {
      setCoverageError(isEn ? 'End time must be after start time.' : 'Thời gian kết thúc phải sau thời gian bắt đầu.');
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCoverageLoading(true);
      try {
        const result = await coachProfessionalApi.getLeaveReplacementOptions(
          leaveWindow.startAt, leaveWindow.endAt, { signal: controller.signal });
        setCoverage(result);
      } catch (error) {
        if (error?.name !== 'AbortError') setCoverageError(error?.message || (isEn ? 'Unable to check replacement coaches.' : 'Không thể kiểm tra HLV thay thế.'));
      } finally {
        if (!controller.signal.aborted) setCoverageLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isEn, leaveType, leaveWindow.endAt, leaveWindow.startAt]);

  const submitEvent = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.createEvent({
          memberId: f.get('memberId') ? Number(f.get('memberId')) : null,
          roomId: f.get('roomId') ? Number(f.get('roomId')) : null,
          title: f.get('title'),
          eventType: f.get('eventType'),
          startAt: f.get('startAt'),
          endAt: f.get('endAt'),
          notes: f.get('notes') || null
        }),
      isEn ? 'Event scheduled successfully.' : 'Đã tạo lịch và gửi xác nhận thành công.'
    ).then((ok) => ok && e.target.reset());
  };

  const submitLeave = (e) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    const f = new FormData(formElement);
    return act(
      () =>
        coachProfessionalApi.requestLeave({
          startAt: f.get('startAt'),
          endAt: f.get('endAt'),
          leaveType: f.get('leaveType'),
          reason: f.get('reason'),
          swapCoachId: leaveType === 'ShiftSwap' && swapCoachId ? Number(swapCoachId) : null
        }),
      isEn ? 'Leave request submitted to management.' : 'Đã gửi đơn nghỉ đến bộ phận quản lý.'
    ).then((ok) => {
      if (!ok) return;
      formElement.reset();
      setLeaveType('AnnualLeave');
      setLeaveWindow({ startAt: '', endAt: '' });
      setCoverage(null);
      setSwapCoachId('');
    });
  };

  const startShiftSwap = (session) => {
    setLeaveType('ShiftSwap');
    setLeaveWindow(classSessionWindow(session));
    requestAnimationFrame(() => leaveFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.5fr_.9fr]">
      {/* Left: Interactive Calendar Timeline & Leaves */}
      <div className="space-y-5">
        <SectionCard
          title={isEn ? 'Teaching & Training Schedule' : 'Lịch ca giảng dạy & tập luyện'}
          icon="event"
          action={
            <div className="flex items-center gap-1 bg-brand-navy-100 dark:bg-brand-navy-700/60 p-1 rounded-xl">
              {['day', 'week', 'month'].map(x => (
                <button
                  key={x}
                  onClick={() => setMode(x)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    mode === x
                      ? 'bg-white dark:bg-brand-navy-800 text-brand-sage-700 dark:text-brand-sage-500 shadow-2xs'
                      : 'text-brand-navy-600 dark:text-brand-navy-300 hover:text-brand-navy-900'
                  }`}
                >
                  {x === 'day' ? (isEn ? 'Day' : 'Ngày') : x === 'week' ? (isEn ? 'Week' : 'Tuần') : (isEn ? 'Month' : 'Tháng')}
                </button>
              ))}
            </div>
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'Select Date:' : 'Chọn mốc thời gian:'}
            </span>
            <input
              type="date"
              value={anchor}
              onChange={e => setAnchor(e.target.value)}
              className={`${inputClass} max-w-48`}
            />
          </div>

          {!visible.length ? (
            <EmptyState icon="event_busy">
              {isEn ? 'No scheduled sessions in this time window.' : 'Không có ca làm việc hoặc buổi dạy nào trong khoảng này.'}
            </EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(grouped).map(([date, items]) => (
                <article key={date} className="rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/40 dark:bg-brand-navy-800/40 p-3.5 space-y-2.5">
                  <h3 className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 uppercase tracking-wider pb-1 border-b border-brand-navy-200/60 dark:border-brand-navy-700 flex items-center justify-between">
                    <span>
                      {formatVietnamDate(date, isEn, { weekday: 'long', day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-sage-500/15 text-brand-sage-700 dark:text-brand-sage-500 font-bold">
                      {items.length} {isEn ? 'events' : 'ca'}
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div
                        key={`${item.eventType}-${item.id}-${i}`}
                        className={`rounded-xl p-3 text-xs border shadow-2xs transition-opacity ${
                          item.isOnLeave
                            ? 'bg-brand-navy-100/80 dark:bg-brand-navy-900/60 border-dashed border-brand-navy-300 dark:border-brand-navy-700 opacity-55 grayscale'
                            : 'bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-brand-navy-900 dark:text-white">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-brand-sage-500/15 text-brand-sage-700 dark:text-brand-sage-500 text-[11px] font-bold mr-1.5">
                              {item.startLabel}
                            </span>
                            {item.title}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.isOnLeave
                            ? 'bg-brand-sand-100 text-brand-sand-800 dark:bg-brand-sand-950/60 dark:text-brand-sand-300'
                            : 'bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300'}`}>
                            {item.isOnLeave ? (isEn ? 'On leave' : 'Xin nghỉ') : item.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-1.5 flex items-center gap-2">
                          <span>{item.eventType}</span>
                          <span>•</span>
                          <span>{item.roomName || (isEn ? 'Court/Room not set' : 'Chưa gán sân')}</span>
                          {item.memberName && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-brand-navy-700 dark:text-brand-navy-300">
                                {item.memberName}
                              </span>
                            </>
                          )}
                        </p>

                        {item.isOnLeave && (
                          <p className="mt-2 text-[11px] font-semibold text-brand-sand-700 dark:text-brand-sand-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">person_off</span>
                            {item.replacementCoachName
                              ? (isEn ? `Covered by ${item.replacementCoachName}` : `HLV dạy bù: ${item.replacementCoachName}`)
                              : (isEn ? 'Approved leave' : 'Đơn nghỉ đã được duyệt')}
                          </p>
                        )}

                        {!item.isOnLeave && item.eventType === 'ClassSession' && item.status !== 'Cancelled' && item.status !== 'Completed' && (
                          <button type="button" onClick={() => startShiftSwap(item)}
                            className="mt-2.5 inline-flex items-center gap-1 rounded-lg border border-brand-sage-500/50 bg-brand-sage-500/10 px-2.5 py-1.5 text-[11px] font-bold text-brand-sage-700 hover:bg-brand-sage-500/20 dark:text-brand-sage-500">
                            <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
                            {isEn ? 'Request cover for this shift' : 'Xin đổi đúng ca này'}
                          </button>
                        )}

                        {!item.isOnLeave && item.eventType !== 'ClassSession' && item.status === 'Confirmed' && (
                          <div className="mt-2.5 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-700 flex gap-2">
                            <button
                              disabled={working}
                              className="text-xs font-bold text-brand-sage-700 hover:text-brand-sage-700 dark:text-brand-sage-400 cursor-pointer"
                              onClick={() => act(() => coachProfessionalApi.changeEvent(item.id, 'Completed'), isEn ? 'Session marked as completed.' : 'Đã hoàn thành ca dạy.')}
                            >
                              {isEn ? '✓ Complete' : '✓ Hoàn thành'}
                            </button>
                            <button
                              disabled={working}
                              className="text-xs font-bold text-brand-danger-600 hover:text-brand-danger-700 dark:text-brand-danger-400 cursor-pointer"
                              onClick={() => act(() => coachProfessionalApi.changeEvent(item.id, 'Cancelled'), isEn ? 'Session cancelled.' : 'Đã hủy ca dạy.')}
                            >
                              {isEn ? '✕ Cancel' : '✕ Hủy ca'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Đơn nghỉ & đổi ca */}
        <SectionCard title={isEn ? 'Leave & Shift Swap Applications' : 'Đơn nghỉ phép & đổi ca trực'} icon="swap_horiz">
          {!data.leaves.length ? (
            <EmptyState icon="assignment_turned_in" isEn={isEn}>
              {isEn ? 'No leave or shift swap requests.' : 'Chưa có đơn xin nghỉ hoặc đổi ca nào.'}
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {data.leaves.slice(0, 6).map(x => (
                <div key={x.id} className="rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/50 dark:bg-brand-navy-800/50 p-3 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-navy-900 dark:text-white">
                        {x.leaveType === 'AnnualLeave' ? (isEn ? 'Annual Leave' : 'Nghỉ phép thường') : x.leaveType === 'SickLeave' ? (isEn ? 'Sick Leave' : 'Nghỉ ốm') : (isEn ? 'Shift Swap' : 'Đổi ca trực')}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        x.status === 'Approved'
                          ? 'bg-brand-sage-50 text-brand-sage-700 border border-brand-sage-200'
                          : x.status === 'Rejected'
                          ? 'bg-brand-danger-50 text-brand-danger-700 border border-brand-danger-200'
                          : 'bg-brand-sand-50 text-brand-sand-700 border border-brand-sand-200'
                      }`}>
                        {x.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-navy-400 mt-1">
                      {formatDate(x.startAt, isEn)} → {formatDate(x.endAt, isEn)}
                    </p>
                    <p className="text-brand-navy-600 dark:text-brand-navy-300 mt-1">{x.reason}</p>
                    {x.managerNote && (
                      <p className="mt-1 text-[11px] text-brand-sage-700 dark:text-brand-sage-500 font-medium">
                        {isEn ? 'Manager Note: ' : 'Phản hồi quản lý: '}{x.managerNote}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Right Column: Actions (Book PT Session & Submit Leave Form) */}
      <div className="space-y-5">
        <SectionCard title={isEn ? 'Schedule Student PT Session' : 'Chủ động lên lịch buổi tập PT'} icon="add_circle">
          <form onSubmit={submitEvent} className="space-y-3">
            <FormField title={isEn ? 'Event Type' : 'Phân loại lịch'} required>
              <select name="eventType" className={selectClass}>
                <option value="PersonalTraining">{isEn ? '1-on-1 Personal Training (PT)' : 'PT cá nhân (1-on-1)'}</option>
                <option value="FloorDuty">{isEn ? 'Floor Duty / Guidance' : 'Trực sàn / Hướng dẫn chung'}</option>
                <option value="Other">{isEn ? 'Other Professional Duty' : 'Công việc chuyên môn khác'}</option>
              </select>
            </FormField>

            <FormField title={isEn ? 'Title' : 'Tiêu đề buổi tập'} required>
              <input name="title" required maxLength="200" placeholder={isEn ? 'E.g., Cardio & Strength Session' : 'VD: Buổi tập Cardio & Thể lực'} className={inputClass} />
            </FormField>

            <FormField title={isEn ? 'Client / Student' : 'Học viên (bắt buộc với PT)'}>
              <select name="memberId" className={selectClass}>
                <option value="">{isEn ? '-- Select Student --' : '-- Chọn học viên --'}</option>
                {data.clients.map(x => (
                  <option key={x.id} value={x.id}>{x.fullName} ({x.memberCode})</option>
                ))}
              </select>
            </FormField>

            <FormField title={isEn ? 'Room / Court' : 'Sân / Phòng tập'}>
              <select name="roomId" className={selectClass}>
                <option value="">{isEn ? '-- Auto-assign / Flexible --' : '-- Tự chọn / Theo phân bổ --'}</option>
                {data.rooms?.map(x => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField title={isEn ? 'Start' : 'Bắt đầu'} required>
                <input name="startAt" type="datetime-local" required className={inputClass} />
              </FormField>
              <FormField title={isEn ? 'End' : 'Kết thúc'} required>
                <input name="endAt" type="datetime-local" required className={inputClass} />
              </FormField>
            </div>

            <FormField title={isEn ? 'Notes' : 'Ghi chú giáo án'}>
              <textarea name="notes" rows="2" placeholder={isEn ? 'Important notes for student...' : 'Nội dung cần lưu ý cho học viên...'} className={inputClass} />
            </FormField>

            <button disabled={working} className={`${buttonPrimary} w-full`}>
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{isEn ? 'Schedule & Send Confirmation' : 'Tạo lịch & Gửi xác nhận'}</span>
            </button>
          </form>
        </SectionCard>

        <SectionCard title={isEn ? 'Submit Leave / Shift Swap' : 'Nộp đơn xin nghỉ / Đổi ca trực'} icon="edit_calendar">
          <form ref={leaveFormRef} onSubmit={submitLeave} className="space-y-3">
            <FormField title={isEn ? 'Application Type' : 'Loại đơn'} required>
              <select name="leaveType" value={leaveType} onChange={e => setLeaveType(e.target.value)} className={selectClass}>
                <option value="AnnualLeave">{isEn ? 'Annual Leave' : 'Nghỉ phép thường (Annual Leave)'}</option>
                <option value="SickLeave">{isEn ? 'Sick Leave' : 'Nghỉ ốm (Sick Leave)'}</option>
                <option value="ShiftSwap">{isEn ? 'Shift Swap with Peer Coach' : 'Đổi ca trực với HLV khác (Shift Swap)'}</option>
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <FormField title={isEn ? '1. From' : '1. Bắt đầu nghỉ'} required>
                <input name="startAt" type="datetime-local" required min={minimumLeaveStart} value={leaveWindow.startAt}
                  onChange={e => setLeaveWindow(current => ({ ...current, startAt: e.target.value }))} className={inputClass} />
              </FormField>
              <FormField title={isEn ? '2. To' : '2. Kết thúc nghỉ'} required>
                <input name="endAt" type="datetime-local" required min={leaveWindow.startAt || minimumLeaveStart} value={leaveWindow.endAt}
                  onChange={e => setLeaveWindow(current => ({ ...current, endAt: e.target.value }))} className={inputClass} />
              </FormField>
            </div>

            {leaveType === 'ShiftSwap' && (
              <div className="space-y-3 rounded-xl border border-brand-sage-500/40 bg-brand-sage-500/5 p-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[20px] text-brand-sage-700 dark:text-brand-sage-400">manage_search</span>
                  <div>
                    <p className="text-xs font-black text-brand-navy-800 dark:text-brand-navy-100">
                      {isEn ? '3. Automatic shift coverage' : '3. Tự động tìm người nhận ca'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                      {isEn ? 'Only qualified, available coaches are shown.' : 'Chỉ hiển thị HLV đủ chuyên môn và không trùng lịch.'}
                    </p>
                  </div>
                </div>

                {coverageLoading && <p className="text-xs font-semibold text-brand-sage-700 dark:text-brand-sage-400">{isEn ? 'Checking schedule and specializations…' : 'Đang đối chiếu lịch và chuyên môn…'}</p>}
                {coverageError && <p className="rounded-lg bg-brand-danger-50 p-2 text-xs font-semibold text-brand-danger-700">{coverageError}</p>}
                {!coverageLoading && coverage && (
                  <>
                    <div className="rounded-lg bg-white/80 p-2 text-xs dark:bg-brand-navy-800">
                      <strong>{coverage.affectedSessions?.length || 0} {isEn ? 'affected sessions' : 'ca dạy bị ảnh hưởng'}</strong>
                      {!!coverage.requiredSports?.length && (
                        <p className="mt-1 text-brand-navy-500">{isEn ? 'Required:' : 'Chuyên môn cần:'} {coverage.requiredSports.map(x => x.name).join(', ')}</p>
                      )}
                      <div className="mt-2 space-y-1">
                        {coverage.affectedSessions?.map(session => (
                          <p key={session.id} className="flex justify-between gap-2 text-[11px] text-brand-navy-600 dark:text-brand-navy-300">
                            <span className="truncate">{session.className} · {session.sportName}</span>
                            <span className="shrink-0 font-semibold">{session.sessionDate} {String(session.startTime).slice(0, 5)}–{String(session.endTime).slice(0, 5)}</span>
                          </p>
                        ))}
                      </div>
                    </div>

                    {!coverage.affectedSessions?.length ? (
                      <p className="rounded-lg bg-brand-sand-50 p-2 text-xs font-semibold text-brand-sand-800">
                        {isEn ? 'No teaching session falls in this period. Select the shift directly from your schedule.' : 'Khoảng này không có ca dạy. Hãy chọn lại đúng thời gian của ca trên lịch.'}
                      </p>
                    ) : !coverage.candidates?.length ? (
                      <p className="rounded-lg bg-brand-sand-50 p-2 text-xs font-semibold text-brand-sand-800">
                        {isEn ? 'No qualified coach is available for all affected sessions.' : 'Chưa có HLV vừa đủ chuyên môn vừa trống toàn bộ các ca này.'}
                      </p>
                    ) : (
                      <div className="grid gap-2">
                        {coverage.candidates.map(coach => (
                          <label key={coach.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${swapCoachId === String(coach.id) ? 'border-brand-sage-700 bg-brand-sage-50 ring-2 ring-brand-sage-500/30 dark:bg-brand-sage-950/30' : 'border-brand-navy-200 bg-white hover:border-brand-sage-500 dark:border-brand-navy-700 dark:bg-brand-navy-800'}`}>
                            <input type="radio" name="swapCoachId" value={coach.id} checked={swapCoachId === String(coach.id)}
                              onChange={e => setSwapCoachId(e.target.value)} required />
                            <span className="min-w-0">
                              <strong className="block truncate text-xs text-brand-navy-900 dark:text-white">{coach.fullName}</strong>
                              <span className="text-[11px] text-brand-navy-500">{coach.specializations?.join(', ') || coach.specialization}</span>
                            </span>
                            <span className="material-symbols-outlined ml-auto text-[18px] text-brand-sage-700 dark:text-brand-sage-400">verified</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <FormField title={isEn ? 'Reason' : 'Lý do chi tiết'} required>
              <textarea name="reason" required rows="2" placeholder={isEn ? 'Specify reason for leave or shift swap...' : 'Ghi rõ lý do xin nghỉ hoặc đổi ca...'} className={inputClass} />
            </FormField>

            <button disabled={working || coverageLoading || Boolean(coverageError) ||
              (leaveType === 'ShiftSwap' && (!coverage?.affectedSessions?.length || !swapCoachId))} className={`${buttonPrimary} w-full`}>
              <span className="material-symbols-outlined text-[18px]">rule</span>
              <span>{isEn ? 'Submit to Manager' : 'Gửi quản lý duyệt đơn'}</span>
            </button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}
