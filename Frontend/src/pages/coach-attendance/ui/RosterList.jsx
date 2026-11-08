import React from 'react';
import { coachInput } from '../../../features/coach-workspace/index.js';

export function RosterList({
  ATTENDANCE_STATUSES, canAttend, filteredMembers, handleNoteChange, handleStatusChange,
  handleToggleLateNote, isEn, records, saving
}) {
  return (
    <div className="space-y-3">
      {filteredMembers.map((m, index) => {
        const currentRecord = records[m.memberId] || { memberId: m.memberId, status: '', note: '' };
        const isUnmarked = !currentRecord.status;

        return (
          <article
            key={m.memberId}
            className={`p-4 rounded-2xl border transition-all ${
                    isUnmarked
                      ? 'bg-brand-terra-50/20 border-brand-terra-200'
                      : 'bg-white border-brand-navy-200 hover:border-brand-navy-300 shadow-sm'
                  }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Member Profile Info */}
              <div className="flex items-center gap-3 min-w-0 lg:min-w-[240px]">
                <div className="w-10 h-10 rounded-full bg-brand-navy-900 text-white font-black flex items-center justify-center text-sm flex-shrink-0">
                  {String(m.memberName || 'HV').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="font-bold text-brand-navy-900 text-sm break-words min-w-0">{m.memberName}</h3>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-brand-navy-100 text-brand-navy-600">
                      {m.memberCode || `HV#${m.memberId}`}
                    </span>
                  </div>
                  <p className="text-xs text-brand-navy-500 mt-0.5 [overflow-wrap:anywhere]">
                    {m.phone || (isEn ? 'No phone' : 'Chưa có SĐT')} {m.email ? `· ${m.email}` : ''}
                  </p>
                  {(m.fitnessGoal || m.fitnessLevel) && (
                    <p className="text-[11px] text-brand-danger-600 font-semibold mt-0.5">
                      {isEn ? 'Goal: ' : 'Mục tiêu: '}{m.fitnessGoal || m.fitnessLevel}
                    </p>
                  )}
                </div>
              </div>

              {/* Interactive Status Selector (Segmented Button Group) */}
              <div className="flex items-center flex-wrap gap-1.5">
                {Object.entries(ATTENDANCE_STATUSES).map(([key, cfg]) => {
                  const isSelected = currentRecord.status === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!canAttend || saving}
                      onClick={() => handleStatusChange(m.memberId, key)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all border flex items-center gap-1.5 disabled:opacity-50 ${
                              isSelected ? cfg.activeClass : cfg.inactiveClass
                            }`}
                    >
                      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Note Field & Quick Late Tag */}
              <div className="lg:w-80 space-y-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={500}
                    placeholder={isEn ? "Notes (e.g. 5m late, good effort...)" : "Ghi chú (VD: Đến muộn 5 phút, tập tốt...)"}
                    disabled={!canAttend || saving}
                    value={currentRecord.note || ''}
                    onChange={e => handleNoteChange(m.memberId, e.target.value)}
                    className={`${coachInput} text-xs py-1.5 flex-1`}
                  />
                  <button
                    type="button"
                    disabled={!canAttend || saving}
                    onClick={() => handleToggleLateNote(m.memberId, 15)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 shrink-0 cursor-pointer ${
                            currentRecord.note?.includes('Đến muộn')
                              ? 'bg-brand-sand-100 text-brand-sand-800 border-brand-sand-300 font-extrabold shadow-2xs'
                              : 'bg-brand-navy-50 hover:bg-brand-sand-50 text-brand-navy-600 hover:text-brand-sand-800 border-brand-navy-200'
                          }`}
                    title={isEn ? "Mark Present and add Late note" : "Đánh dấu Có mặt và ghi chú Đến muộn"}
                  >
                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                    <span>{isEn ? '+ Late' : '+ Muộn'}</span>
                  </button>
                </div>

                {/* Quick late minute chips if note has Đến muộn */}
                {currentRecord.note?.includes('Đến muộn') && (
                  <div className="flex items-center gap-1 text-[10px] pl-1 animate-fadeIn">
                    <span className="text-brand-navy-400 font-semibold">{isEn ? 'Time:' : 'Thời gian:'}</span>
                    {[5, 10, 15, 30].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        disabled={!canAttend || saving}
                        onClick={() => {
                          const cleaned = (currentRecord.note || '').replace(/Đến muộn(\s*\d+\s*(phút|p))?\.?,?\s*/gi, '').trim();
                          const note = cleaned ? `Đến muộn ${mins} phút. ${cleaned}` : `Đến muộn ${mins} phút.`;
                          handleNoteChange(m.memberId, note);
                        }}
                        className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                                currentRecord.note?.includes(`${mins} phút`)
                                  ? 'bg-brand-sand-200 text-brand-sand-900 border-brand-sand-400 font-bold'
                                  : 'bg-white hover:bg-brand-navy-100 text-brand-navy-600 border-brand-navy-200'
                              }`}
                      >
                        {mins}p
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
