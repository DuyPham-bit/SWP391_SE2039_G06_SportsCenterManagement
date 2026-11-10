import React from 'react';
import { getSportTheme, getInitials } from '../lib/display.js';
import { isCoachCompatible } from '../model/coachAssignmentView.js';
import { getAvatarGradient } from '../../../shared/lib/avatarGradient.js';

export function AssignmentCardsView({ coaches, filteredClasses, isEn, openAssignModal }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredClasses.map((cls) => {
        const currentCoach = coaches.find((c) => String(c.id) === String(cls.coachId));
        const theme = getSportTheme(cls.sportName);
        const isAssigned = Boolean(cls.coachId);
        const isMatch = currentCoach ? isCoachCompatible(currentCoach, cls) : null;
        const isMismatch = isMatch === false;
        const enrollmentPercent =
          cls.capacity > 0 ? Math.min(100, Math.round(((cls.enrolledCount || 0) / cls.capacity) * 100)) : 0;
        const coachAvatarGrad = getAvatarGradient(cls.coachName || 'HLV');

        return (
          <div
            key={cls.id}
            className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700 transition-all shadow-sm hover-lift flex flex-col justify-between overflow-hidden group"
          >
            <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGrad}`} />

            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${theme.badgeClass}`}>
                    <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
                    {cls.sportName || (isEn ? 'Sport' : 'Thể thao')}
                  </span>
                  {cls.level && (
                    <span className="px-2 py-0.5 bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 rounded-md text-[11px] font-medium border border-brand-navy-200 dark:border-brand-navy-700">
                      {cls.level}
                    </span>
                  )}
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        cls.status === 'Published'
                          ? 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800'
                          : cls.status === 'Draft'
                          ? 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border-brand-sand-200 dark:border-brand-sand-800'
                          : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-500 border-brand-navy-200 dark:border-brand-navy-700'
                      }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                          cls.status === 'Published'
                            ? 'bg-brand-sage-500 animate-pulse'
                            : cls.status === 'Draft'
                            ? 'bg-brand-sand-500'
                            : 'bg-brand-navy-400'
                        }`}
                  />
                  {cls.status === 'Published' ? (isEn ? 'Published' : 'Đang mở') : cls.status === 'Draft' ? (isEn ? 'Draft' : 'Bản nháp') : isEn ? 'Cancelled' : 'Đã hủy'}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-base group-hover:text-brand-sage-700 dark:group-hover:text-brand-sage-500 transition line-clamp-1">
                  {cls.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-brand-navy-500 dark:text-brand-navy-400">
                  <span className="material-symbols-outlined text-[15px] text-brand-navy-400">schedule</span>
                  <span>{cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}</span>
                  <span>·</span>
                  <span className="material-symbols-outlined text-[15px] text-brand-navy-400">meeting_room</span>
                  <span className="truncate">{cls.roomName || (isEn ? 'No court assigned' : 'Chưa xếp phòng')}</span>
                </div>
              </div>

              {/* Coach Card */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                      !isAssigned
                        ? 'bg-brand-sand-50/70 dark:bg-brand-sand-950/30 border-brand-sand-200 dark:border-brand-sand-800 text-brand-sand-900 dark:text-brand-sand-200'
                        : isMismatch
                        ? 'bg-brand-danger-50/60 dark:bg-brand-danger-950/30 border-brand-danger-200 dark:border-brand-danger-800 text-brand-navy-900 dark:text-brand-navy-100'
                        : 'bg-brand-navy-50 dark:bg-brand-navy-800/60 border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100'
                    }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">person</span>
                    {isEn ? 'Assigned Coach' : 'Huấn luyện viên phụ trách'}
                  </span>

                  {isAssigned ? (
                    isMismatch ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-danger-100 dark:bg-brand-danger-950 text-brand-danger-700 dark:text-brand-danger-300">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        {isEn ? 'Mismatch' : 'Lệch môn'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-sage-100 dark:bg-brand-sage-950 text-brand-sage-800 dark:text-brand-sage-300">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        {isEn ? 'Matched' : 'Đúng môn'}
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-sand-100 dark:bg-brand-sand-950 text-brand-sand-800 dark:text-brand-sand-300">
                      {isEn ? 'Unassigned' : 'Chưa có HLV'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-tr ${coachAvatarGrad} text-white font-extrabold flex items-center justify-center text-xs shadow-sm shrink-0 border-2 border-white dark:border-brand-navy-800`}
                  >
                    {getInitials(cls.coachName || 'HLV')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-brand-navy-900 dark:text-brand-navy-100 truncate">
                      {cls.coachName || (
                        <span className="text-brand-sand-700 dark:text-brand-sand-300 italic font-semibold">
                          {isEn ? 'No coach assigned yet' : 'Chưa phân công huấn luyện viên'}
                        </span>
                      )}
                    </h4>
                    {currentCoach?.specialization && (
                      <p className="text-[11px] text-brand-navy-600 dark:text-brand-navy-400 truncate mt-0.5">
                        {isEn ? 'Specialty:' : 'Chuyên môn:'}{' '}
                        <strong className="text-brand-navy-800 dark:text-brand-navy-200">{currentCoach.specialization}</strong>
                      </p>
                    )}
                    {currentCoach?.certification && (
                      <p className="text-[10px] text-brand-sage-700 dark:text-brand-sage-500 font-semibold truncate">
                        {currentCoach.certification}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Enrollment Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[15px] text-brand-navy-400">group</span>
                    {isEn ? 'Enrollment:' : 'Sĩ số ghi danh:'}
                  </span>
                  <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">
                    {cls.enrolledCount || 0} / {cls.capacity} {isEn ? 'students' : 'học viên'}
                  </span>
                </div>
                <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                          enrollmentPercent >= 90
                            ? 'bg-brand-danger-500'
                            : enrollmentPercent >= 75
                            ? 'bg-brand-sand-500'
                            : 'bg-brand-sage-700'
                        }`}
                    style={{ width: `${enrollmentPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Action Button */}
            <div className="p-4 bg-brand-navy-50/80 dark:bg-brand-navy-800/50 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between gap-3">
              <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                {isEn ? 'Class ID:' : 'Mã lớp:'} <strong>#{cls.id}</strong>
              </span>

              <button
                onClick={() => openAssignModal(cls)}
                disabled={['Cancelled', 'Completed'].includes(cls.status) || !coaches.length}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-95 disabled:opacity-50 hover-lift"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                <span>{isAssigned ? (isEn ? 'Change Coach' : 'Đổi HLV') : isEn ? 'Assign Now' : 'Phân công ngay'}</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
