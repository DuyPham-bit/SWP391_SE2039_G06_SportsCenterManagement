import React, { useState, useEffect } from 'react';
import { coachApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CoachError, CoachPeriod, coachInput, useTeachingSessions } from './CoachShared.jsx';
import { canAttendSession } from './coachOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function Attendance() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const statuses = {
    PRESENT: isEn ? 'Present' : 'Có mặt',
    ABSENT: isEn ? 'Absent' : 'Vắng mặt',
    LATE: isEn ? 'Late' : 'Đến muộn',
    EXCUSED: isEn ? 'Excused' : 'Vắng có phép'
  };

  const schedule = useTeachingSessions(30, new URLSearchParams(window.location.hash.split('?')[1]).get('date'));
  const { showSuccess, showError } = useToast();
  const [selectedId, setSelectedId] = useState(Number(new URLSearchParams(window.location.hash.split('?')[1]).get('sessionId')) || '');
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const session = schedule.sessions.find(s => s.id === Number(selectedId)) || schedule.sessions[0];

  useEffect(() => {
    let active = true;
    setMembers([]); setRecords({}); setError('');
    if (!session) { setLoading(false); return; }
    setLoading(true);
    coachApi.getClassMembers(session.id).then(data => {
      if (!active) return;
      setMembers(data);
      setRecords(Object.fromEntries(data.map(m => [m.memberId, { memberId: m.memberId, status: m.attendanceStatus || '', note: m.note || '' }])));
    }).catch(e => { if (active) setError(e); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.id, version]);

  const change = (id, field, value) => setRecords(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const save = async () => {
    if (!canAttendSession(session) || saving) return;
    const payload = Object.values(records);
    if (payload.some(r => !r.status)) {
      showError(isEn ? 'Please select attendance status for each student before saving.' : 'Chọn trạng thái cho từng học viên trước khi lưu.');
      return;
    }
    setSaving(true);
    try {
      await coachApi.takeAttendance(session.id, null, null, null, payload);
      showSuccess(isEn ? 'Attendance results saved successfully.' : 'Đã lưu kết quả điểm danh.');
      setVersion(v => v + 1);
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1A3B8B] border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-[#1A3B8B]" />
          <span>{isEn ? 'Session Attendance' : 'Điểm danh ca dạy'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEn ? 'Session Attendance Tracking' : 'Báo Cáo Điểm Danh Ca Dạy'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          {isEn
            ? 'Record student attendance per teaching session, updating directly to the SCMS management system.'
            : 'Ghi nhận tình trạng hiện diện của từng học viên theo ca dạy, cập nhật trực tiếp vào hệ thống quản lý SCMS.'}
        </p>
      </div>

      {/* 2. Date Filter & Errors */}
      <CoachPeriod schedule={schedule} />
      <CoachError message={schedule.error} retry={schedule.reload} />

      {/* 3. Session Selection Card */}
      <div className="bg-white p-5 rounded-[20px] border border-slate-200/90 shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          {isEn ? 'Select teaching session for attendance' : 'Chọn ca dạy cần điểm danh'}
          <select
            aria-label={isEn ? 'Select session' : 'Chọn ca dạy'}
            disabled={saving || schedule.loading}
            className={`${coachInput} mt-1.5 font-semibold text-slate-800`}
            value={session?.id || ''}
            onChange={e => setSelectedId(Number(e.target.value))}
          >
            {!schedule.sessions.length && (
              <option value="">{isEn ? 'No sessions in date range' : 'Chưa có ca dạy trong khoảng ngày'}</option>
            )}
            {schedule.sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.sessionDate} · {s.timeSlot} · {s.roomName}
                {s.status === 'CANCELLED' ? (isEn ? ' (Cancelled)' : ' (Đã hủy)') : ''}
              </option>
            ))}
          </select>
        </label>

        {session && (
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 font-bold text-[#1E2235]">
              <span className="material-symbols-outlined text-[16px] text-[#81B29A]">sports_score</span>
              {session.name}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#F2CC8F]">schedule</span>
              {session.sessionDate} ({session.timeSlot})
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
              {session.roomName || (isEn ? 'Olympic Facility' : 'Cụm sân Olympic')}
            </span>
          </div>
        )}
      </div>

      {session && !canAttendSession(session) && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5">
          <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0">info</span>
          <span>
            {isEn
              ? 'Attendance can only be recorded once the session has started and is not cancelled.'
              : 'Chỉ điểm danh khi buổi học đã bắt đầu và không bị hủy.'}
          </span>
        </div>
      )}

      <CoachError message={error} retry={() => setVersion(v => v + 1)} />

      {loading || schedule.loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-sm text-slate-500">
          <span className="inline-block w-4 h-4 border-2 border-[#81B29A] border-t-transparent rounded-full animate-spin mr-2" />
          {isEn ? 'Loading student attendance roster...' : 'Đang tải danh sách học viên điểm danh...'}
        </div>
      ) : !error && !schedule.error && session && !members.length ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">
          {isEn ? 'No students have booked for this session yet.' : 'Chưa có học viên nào đặt chỗ cho buổi học này.'}
        </div>
      ) : null}

      {/* 4. Attendance Members List */}
      {!loading && !schedule.loading && !error && !schedule.error && (
        <div className="space-y-4">
          {/* Status summary pills */}
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(statuses).map(([key, name]) => {
              const count = Object.values(records).filter(r => r.status === key).length;
              let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
              if (key === 'PRESENT') badgeColor = 'bg-[#81B29A]/15 text-[#2D6A4F] border-[#81B29A]/30';
              if (key === 'ABSENT') badgeColor = 'bg-[#E07A5F]/15 text-[#9C3E26] border-[#E07A5F]/30';
              if (key === 'LATE') badgeColor = 'bg-[#F2CC8F]/25 text-[#92400E] border-[#F2CC8F]/50';
              if (key === 'EXCUSED') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

              return (
                <div key={key} className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${badgeColor}`}>
                  <span>{name}:</span>
                  <strong className="font-bold">{count}</strong>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            {members.map(m => (
              <article
                key={m.memberId}
                className="bg-white border border-slate-200/90 hover:border-[#81B29A]/50 rounded-[20px] p-4 sm:p-5 shadow-xs transition-all grid md:grid-cols-3 gap-3.5 items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1A3B8B] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {m.memberName?.[0]?.toUpperCase() || 'H'}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">{m.memberName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-bold text-[#1A3B8B]">{m.memberCode}</span> · {m.phone || (isEn ? 'No phone' : 'Chưa có SĐT')}
                    </p>
                  </div>
                </div>

                <div>
                  <select
                    aria-label={(isEn ? 'Attendance for ' : 'Điểm danh ') + m.memberName}
                    className={coachInput}
                    disabled={saving || !canAttendSession(session)}
                    value={records[m.memberId]?.status || ''}
                    onChange={e => change(m.memberId, 'status', e.target.value)}
                  >
                    <option value="">{isEn ? 'Not recorded yet' : 'Chưa điểm danh'}</option>
                    {Object.entries(statuses).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <input
                    aria-label={(isEn ? 'Notes for ' : 'Ghi chú ') + m.memberName}
                    className={coachInput}
                    maxLength={500}
                    placeholder={isEn ? 'Performance / behavioral notes' : 'Ghi chú đánh giá / biểu hiện'}
                    disabled={saving || !canAttendSession(session)}
                    value={records[m.memberId]?.note || ''}
                    onChange={e => change(m.memberId, 'note', e.target.value)}
                  />
                </div>
              </article>
            ))}
          </div>

          {members.length > 0 && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={save}
                disabled={saving || !canAttendSession(session)}
                className="px-5 py-2.5 rounded-lg bg-[#1A3B8B] hover:bg-[#142F70] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>{saving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Attendance Results' : 'Lưu Kết Quả Điểm Danh')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
