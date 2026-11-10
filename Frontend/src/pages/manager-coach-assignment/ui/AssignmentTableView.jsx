import React from 'react';
import { getSportTheme, getInitials } from '../lib/display.js';
import { isCoachCompatible } from '../model/coachAssignmentView.js';
import { getAvatarGradient } from '../../../shared/lib/avatarGradient.js';

export function AssignmentTableView({ coaches, filteredClasses, isEn, openAssignModal }) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-brand-navy-50/80 dark:bg-brand-navy-800/60 border-b border-brand-navy-200 dark:border-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">{isEn ? 'Training Class' : 'Lớp đào tạo'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Discipline & Court' : 'Bộ môn & Sân'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Current Coach' : 'HLV phụ trách hiện tại'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Specialty & Credentials' : 'Chuyên môn & Chứng chỉ'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Enrollment' : 'Sĩ số'}</th>
              <th className="py-3.5 px-4 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300">
            {filteredClasses.map((cls) => {
              const currentCoach = coaches.find((c) => String(c.id) === String(cls.coachId));
              const theme = getSportTheme(cls.sportName);
              const isAssigned = Boolean(cls.coachId);
              const isMatch = currentCoach ? isCoachCompatible(currentCoach, cls) : null;
              const isMismatch = isMatch === false;
              const coachAvatarGrad = getAvatarGradient(cls.coachName || 'HLV');

              return (
                <tr key={cls.id} className="hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100">{cls.name}</div>
                    <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px] text-brand-navy-400">schedule</span>
                      {cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${theme.badgeClass}`}>
                        <span className="material-symbols-outlined text-[13px]">{theme.icon}</span>
                        {cls.sportName}
                      </span>
                    </div>
                    <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
                      {cls.roomName || (isEn ? 'Unassigned Court' : 'Chưa chọn phòng')}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {isAssigned ? (
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-tr ${coachAvatarGrad} text-white font-extrabold flex items-center justify-center text-[10px] shrink-0`}
                        >
                          {getInitials(cls.coachName || 'HLV')}
                        </div>
                        <div>
                          <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-xs">{cls.coachName}</div>
                          {isMismatch ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-danger-600 dark:text-brand-danger-400">
                              <span className="material-symbols-outlined text-[11px]">warning</span> {isEn ? 'Mismatch' : 'Lệch môn'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-brand-sage-700 dark:text-brand-sage-400">
                              <span className="material-symbols-outlined text-[11px]">check_circle</span> {isEn ? 'Matched' : 'Đúng môn'}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800">
                        {isEn ? 'Unassigned' : 'Chưa phân công'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-medium text-brand-navy-700 dark:text-brand-navy-300">{currentCoach?.specialization || '-'}</div>
                    <div className="text-[11px] text-brand-sage-700 dark:text-brand-sage-500 font-semibold">{currentCoach?.certification || ''}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-bold text-brand-navy-800 dark:text-brand-navy-200">
                      {cls.enrolledCount || 0} / {cls.capacity}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openAssignModal(cls)}
                      disabled={['Cancelled', 'Completed'].includes(cls.status) || !coaches.length}
                      className="px-3 py-1.5 bg-brand-sage-700/10 hover:bg-brand-sage-700/20 text-brand-sage-700 dark:text-brand-sage-500 rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-95"
                    >
                      {isAssigned ? (isEn ? 'Change' : 'Đổi HLV') : isEn ? 'Assign' : 'Phân công'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
