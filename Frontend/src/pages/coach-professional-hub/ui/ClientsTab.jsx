import React, { useState } from 'react';
import { coachProfessionalApi } from '../../../entities/coach/index.js';
import { SectionCard, EmptyState } from '../../../features/coach-workspace/index.js';
import { inputClass, selectClass, buttonPrimary, FormField, dateInput } from './formControls.jsx';

// ─────────────────────────────────────────────────────────────
// TAB 2: CLIENTS & HEALTH (HỌC VIÊN PHỤ TRÁCH)
// ─────────────────────────────────────────────────────────────
export function ClientsTab({ data, act, working, isEn }) {
  const [selectedId, setSelectedId] = useState(data.clients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = data.clients.filter(x =>
    (x.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (x.memberCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const client = data.clients.find(x => Number(x.id) === Number(selectedId));

  const submitHealth = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    return act(
      () =>
        coachProfessionalApi.saveHealthRecord({
          memberId: Number(selectedId),
          recordType: f.get('recordType'),
          title: f.get('title'),
          details: f.get('details'),
          occurredOn: f.get('occurredOn')
        }),
      isEn ? 'Health note saved.' : 'Đã lưu ghi chú sức khỏe học viên.'
    ).then((ok) => ok && e.target.reset());
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.75fr_1.4fr]">
      {/* Client List */}
      <SectionCard
        title={`${isEn ? 'Enrolled Students' : 'Danh sách học viên'} (${data.clients.length})`}
        icon="groups"
      >
        <div className="mb-3">
          <input
            type="text"
            placeholder={isEn ? 'Search student name or code...' : 'Tìm kiếm theo tên hoặc mã HV...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredClients.map(x => {
            const isSelected = Number(selectedId) === Number(x.id);
            return (
              <button
                key={x.id}
                onClick={() => setSelectedId(x.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brand-sage-500 dark:border-brand-sage-500 bg-brand-sage-500/10 dark:bg-brand-sage-500/20 shadow-2xs'
                    : 'border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs sm:text-sm text-brand-navy-900 dark:text-white truncate">
                    {x.fullName}
                  </span>
                  {x.renewal?.alert && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-sand-100 dark:bg-brand-sand-900/50 text-brand-sand-800 dark:text-brand-sand-300 text-[10px] font-bold shrink-0">
                      {isEn ? 'NEEDS RENEWAL' : 'CẦN GIA HẠN'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 mt-1 truncate">
                  {isEn ? 'Code:' : 'Mã:'} <span className="font-mono font-semibold">{x.memberCode}</span> · {x.fitnessGoal || (isEn ? 'Goal not set' : 'Chưa đặt mục tiêu')}
                </p>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Selected Client Detailed Profile */}
      {!client ? (
        <EmptyState icon="person_off" isEn={isEn}>
          {isEn ? 'Select a student to view physical metrics and health profile.' : 'Vui lòng chọn học viên để xem hồ sơ thể lực.'}
        </EmptyState>
      ) : (
        <div className="space-y-5">
          <SectionCard title={`${isEn ? 'Student Profile' : 'Hồ sơ học viên'} · ${client.fullName}`} icon="badge">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                [isEn ? 'Fitness Goal' : 'Mục tiêu', client.fitnessGoal],
                [isEn ? 'Level' : 'Trình độ', client.fitnessLevel],
                [isEn ? 'Height' : 'Chiều cao', client.heightCm ? `${client.heightCm} cm` : null],
                [isEn ? 'Weight' : 'Cân nặng', client.weightKg ? `${client.weightKg} kg` : null]
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-100 dark:border-brand-navy-700">
                  <span className="text-[10px] font-bold uppercase text-brand-navy-400 block">{k}</span>
                  <span className="text-xs sm:text-sm font-bold text-brand-navy-800 dark:text-brand-navy-100 mt-0.5 block truncate">
                    {v || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Medical alert box */}
            <div className="mt-3 p-3 rounded-xl border border-brand-sand-200 dark:border-brand-sand-800/60 bg-brand-sand-50/80 dark:bg-brand-sand-950/30 text-xs text-brand-sand-900 dark:text-brand-sand-200 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-brand-sand-700 dark:text-brand-sand-400 shrink-0">warning</span>
              <div>
                <strong className="block font-bold">{isEn ? 'Medical History / Notes:' : 'Tiền sử / Lưu ý y khoa:'}</strong>
                <p className="mt-0.5 leading-relaxed">{client.medicalNote || (isEn ? 'No known medical conditions recorded.' : 'Chưa ghi nhận tiền sử bệnh lý đặc biệt.')}</p>
              </div>
            </div>

            {/* Renewal status */}
            {client.renewal && (
              <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between ${
                client.renewal.alert
                  ? 'border-brand-danger-200 bg-brand-danger-50/70 text-brand-danger-800 dark:bg-brand-danger-950/30 dark:text-brand-danger-200 dark:border-brand-danger-800'
                  : 'border-brand-sage-200 bg-brand-sage-50/70 text-brand-sage-800 dark:bg-brand-sage-950/30 dark:text-brand-sage-200 dark:border-brand-sage-800'
              }`}>
                <div>
                  <strong>{client.renewal.packageName}</strong> · {isEn ? 'Expires: ' : 'Hết hạn: '}{client.renewal.endDate || '—'}
                </div>
                <span className="font-bold">
                  {isEn
                    ? `${client.renewal.remainingSessions ?? '∞'} sessions / ${client.renewal.daysRemaining ?? '—'} days left`
                    : `Còn ${client.renewal.remainingSessions ?? '∞'} buổi / ${client.renewal.daysRemaining ?? '—'} ngày`}
                </span>
              </div>
            )}
          </SectionCard>

          {/* InBody Body Metrics Chart */}
          <SectionCard title={isEn ? 'InBody & Physical Measurements' : 'Chỉ số đo lường cơ thể (InBody)'} icon="bar_chart">
            {!client.bodyMetrics?.length ? (
              <EmptyState icon="query_stats" isEn={isEn}>
                {isEn ? 'No InBody test history recorded yet.' : 'Chưa có dữ liệu đo chỉ số cơ thể định kỳ.'}
              </EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex min-w-[500px] items-end gap-3 border-b border-l border-brand-navy-200 dark:border-brand-navy-700 p-4" style={{ height: 210 }}>
                  {[...client.bodyMetrics].reverse().map(x => (
                    <div key={x.id} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[10px] font-bold text-brand-navy-700 dark:text-brand-navy-300">
                        {x.weight}kg
                      </span>
                      <div
                        title={isEn ? `Fat: ${x.bodyFatPercentage || '—'}% · Muscle: ${x.muscleMass || '—'}kg` : `Mỡ: ${x.bodyFatPercentage || '—'}% · Cơ: ${x.muscleMass || '—'}kg`}
                        className="w-full max-w-9 rounded-t bg-gradient-to-t from-brand-navy-900 to-brand-sage-500 dark:from-brand-navy-800 dark:to-brand-sage-500 shadow-2xs transition-all hover:opacity-90"
                        style={{ height: `${Math.max(16, Math.min(140, Number(x.weight || 0) * 1.6))}px` }}
                      />
                      <span className="text-[9px] text-brand-navy-400 mt-1">{x.resultDate?.slice(5)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-brand-navy-400">
                  {isEn
                    ? 'Bars show body weight (kg). Hover to view body fat % and muscle mass.'
                    : 'Cột thể hiện cân nặng (kg). Rê chuột để xem tỷ lệ mỡ và khối lượng cơ bắp.'}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Health Records and Add Record */}
          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title={isEn ? 'Injury & Condition History' : 'Hồ sơ bệnh lý / Chấn thương'} icon="history">
              {!client.healthRecords?.length ? (
                <EmptyState icon="health_and_safety" isEn={isEn}>
                  {isEn ? 'No injury records recorded.' : 'Chưa có ghi chép chấn thương.'}
                </EmptyState>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {client.healthRecords.map(x => (
                    <div key={x.id} className="p-3 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-100 dark:border-brand-navy-700 text-xs">
                      <div className="flex justify-between font-bold text-brand-navy-900 dark:text-white">
                        <span>{x.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-brand-sage-500/15 text-brand-sage-700 dark:text-brand-sage-500">
                          {x.recordType}
                        </span>
                      </div>
                      <span className="text-[10px] text-brand-navy-400 block mt-0.5">{x.occurredOn}</span>
                      <p className="mt-1 text-brand-navy-600 dark:text-brand-navy-300 leading-relaxed">{x.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title={isEn ? 'Add Health Note' : 'Ghi nhận lưu ý sức khỏe'} icon="post_add">
              <form onSubmit={submitHealth} className="space-y-3">
                <FormField title={isEn ? 'Record Type' : 'Phân loại'} required>
                  <select name="recordType" className={selectClass}>
                    <option value="MedicalCondition">{isEn ? 'Medical Condition' : 'Bệnh lý nền (Medical Condition)'}</option>
                    <option value="Injury">{isEn ? 'Sports Injury' : 'Chấn thương thể thao (Injury)'}</option>
                    <option value="CoachObservation">{isEn ? 'Coach Observation' : 'Quan sát thể lực của HLV'}</option>
                  </select>
                </FormField>

                <FormField title={isEn ? 'Summary Title' : 'Tiêu đề tóm tắt'} required>
                  <input name="title" required placeholder={isEn ? 'E.g., Mild calf strain' : 'VD: Căng cơ bắp chuối nhẹ'} className={inputClass} />
                </FormField>

                <FormField title={isEn ? 'Recorded Date' : 'Ngày ghi nhận'} required>
                  <input name="occurredOn" type="date" max={dateInput()} defaultValue={dateInput()} required className={inputClass} />
                </FormField>

                <FormField title={isEn ? 'Detailed Description' : 'Mô tả chi tiết'} required>
                  <textarea name="details" required rows="3" placeholder={isEn ? 'Specify symptoms, condition, exercises to avoid...' : 'Ghi rõ tình trạng, biểu hiện, bài tập cần tránh...'} className={inputClass} />
                </FormField>

                <button disabled={working} className={`${buttonPrimary} w-full`}>
                  <span>{isEn ? 'Save Health Record' : 'Lưu ghi chú sức khỏe'}</span>
                </button>
              </form>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
