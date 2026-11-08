import React from 'react';
import { getSportTheme } from '../lib/sportTheme.js';

export function ClassesCardsView({
  busy, filteredItems, handlePublishClass, isEn, openClassModal, openRoomModal, openScheduleModal,
  openSportModal, setModal, tab
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {tab === 'classes' &&
        filteredItems.map((cls) => {
          const theme = getSportTheme(cls.sportName);
          const isPublished = cls.status === 'Published';
          const isDraft = cls.status === 'Draft';
          const isCancelled = cls.status === 'Cancelled';
          const enrollmentPercent =
            cls.capacity > 0 ? Math.min(100, Math.round(((cls.enrolledCount || 0) / cls.capacity) * 100)) : 0;

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

                  {isPublished ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500 animate-pulse" />
                      {isEn ? 'Published' : 'Đang mở'}
                    </span>
                  ) : isDraft ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-sand-500" />
                      {isEn ? 'Draft' : 'Bản nháp'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-500 border border-brand-navy-200 dark:border-brand-navy-700">
                      {isEn ? 'Cancelled' : 'Đã hủy'}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-base group-hover:text-brand-sage-700 dark:group-hover:text-brand-sage-500 transition line-clamp-1">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 line-clamp-2 min-h-[32px]">
                    {cls.description || (isEn ? 'Curriculum details not updated yet.' : 'Chưa cập nhật giáo trình và mô tả chi tiết cho lớp học này.')}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800 text-xs text-brand-navy-600 dark:text-brand-navy-300">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-navy-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-brand-navy-400">person</span>
                      {isEn ? 'Coach:' : 'HLV phụ trách:'}
                    </span>
                    <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">
                      {cls.coachName || <span className="text-brand-sand-700 dark:text-brand-sand-400 italic">{isEn ? 'Unassigned' : 'Chưa phân công'}</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-brand-navy-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-brand-navy-400">meeting_room</span>
                      {isEn ? 'Court / Room:' : 'Phòng tập:'}
                    </span>
                    <span className="font-medium text-brand-navy-700 dark:text-brand-navy-300">
                      {cls.roomName || <span className="text-brand-navy-400">{isEn ? 'Not assigned' : 'Chưa chỉ định'}</span>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-brand-navy-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-brand-navy-400">schedule</span>
                      {isEn ? 'Duration:' : 'Thời lượng:'}
                    </span>
                    <span className="font-medium text-brand-navy-700 dark:text-brand-navy-300">
                      {cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px] text-brand-navy-400">people</span>
                      {isEn ? 'Enrolled capacity:' : 'Sĩ số ghi danh:'}
                    </span>
                    <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">
                      {cls.enrolledCount || 0} / {cls.capacity} {isEn ? 'students' : 'học viên'}
                    </span>
                  </div>
                  <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2 overflow-hidden">
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
                  {cls.allowWaitlist && (
                    <p className="text-[11px] text-brand-sage-700 dark:text-brand-sage-400 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      {isEn ? 'Waitlist supported when full' : 'Hỗ trợ danh sách chờ khi kín chỗ'}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-brand-navy-50/80 dark:bg-brand-navy-800/50 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => openScheduleModal(cls)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-navy-900 hover:bg-brand-navy-800 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>{isEn ? 'Schedule' : 'Lịch học'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {isDraft && (
                    <button
                      onClick={() => handlePublishClass(cls)}
                      disabled={busy}
                      title={isEn ? 'Publish class for member enrollment' : 'Công bố lớp học ra ngoài để hội viên đăng ký'}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                      <span className="hidden sm:inline">{isEn ? 'Publish' : 'Công bố'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => openClassModal(cls)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-brand-navy-800 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 rounded-xl text-xs font-medium transition active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>{isEn ? 'Edit' : 'Sửa'}</span>
                  </button>

                  {!isCancelled && (
                    <button
                      onClick={() => setModal({ type: 'cancel', row: cls })}
                      disabled={busy}
                      title={isEn ? 'Cancel class' : 'Hủy lớp học'}
                      className="p-1.5 text-brand-navy-400 hover:text-brand-danger-600 hover:bg-brand-danger-50 dark:hover:bg-brand-danger-950/40 rounded-xl transition"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      {tab === 'rooms' &&
        filteredItems.map((room) => (
          <div
            key={room.id}
            className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700 transition-all shadow-sm hover-lift flex flex-col justify-between overflow-hidden"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-teal-500 to-brand-teal-600" />
            <div className="p-5 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
                  <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                  {room.type || (isEn ? 'Sports Court' : 'Phòng tập thể thao')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-500" />
                  {room.status === 'Active' ? (isEn ? 'Active & Ready' : 'Sẵn sàng sử dụng') : room.status}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-lg">{room.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-brand-navy-500 dark:text-brand-navy-400">
                  <span className="material-symbols-outlined text-[16px] text-brand-navy-400">location_on</span>
                  <span>{room.location || (isEn ? 'Location details not updated' : 'Chưa cập nhật thông tin vị trí')}</span>
                </div>
              </div>

              <div className="p-4 bg-brand-navy-50 dark:bg-brand-navy-800/60 rounded-xl border border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between">
                <span className="text-xs text-brand-navy-600 dark:text-brand-navy-300 font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-brand-teal-700 dark:text-brand-teal-400">group</span>
                  {isEn ? 'Maximum Capacity:' : 'Sức chứa tối đa:'}
                </span>
                <span className="text-sm font-extrabold text-brand-navy-900 dark:text-brand-navy-100">
                  {room.capacity} {isEn ? 'people / session' : 'người / ca'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-brand-navy-50/80 dark:bg-brand-navy-800/50 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-end gap-2">
              <button
                onClick={() => openRoomModal(room)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-brand-navy-800 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>{isEn ? 'Edit Court Info' : 'Chỉnh sửa thông tin phòng'}</span>
              </button>
            </div>
          </div>
        ))}

      {tab === 'sports' &&
        filteredItems.map((sport) => {
          const theme = getSportTheme(sport.name);
          return (
            <div
              key={sport.id}
              className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700 transition-all shadow-sm hover-lift flex flex-col justify-between overflow-hidden"
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${theme.barGrad}`} />
              <div className="p-5 space-y-4 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${theme.badgeClass}`}>
                    <span className="material-symbols-outlined text-[16px]">{theme.icon}</span>
                    {sport.isShared ? (isEn ? 'Global Standard' : 'Bộ môn hệ thống') : isEn ? 'Center-Specific' : 'Bộ môn riêng cơ sở'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          sport.status === 'Active'
                            ? 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border-brand-sage-200 dark:border-brand-sage-800'
                            : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-500 border-brand-navy-200 dark:border-brand-navy-700'
                        }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                            sport.status === 'Active' ? 'bg-brand-sage-500' : 'bg-brand-navy-400'
                          }`}
                    />
                    {sport.status === 'Active' ? (isEn ? 'Active' : 'Đang sử dụng') : isEn ? 'Inactive' : 'Ngừng sử dụng'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-lg flex items-center gap-2">
                    {sport.name}
                    {sport.isShared && (
                      <span
                        title={isEn ? 'Global system discipline' : 'Bộ môn dùng chung toàn hệ thống'}
                        className="material-symbols-outlined text-brand-navy-400 text-[18px]"
                      >
                        lock
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 line-clamp-3">
                    {sport.description || (isEn ? 'No standard description registered.' : 'Chưa có mô tả quy chuẩn cho bộ môn này.')}
                  </p>
                </div>

                <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 bg-brand-navy-50 dark:bg-brand-navy-800/60 p-2.5 rounded-xl border border-brand-navy-100 dark:border-brand-navy-800">
                  {sport.isShared ? (
                    <span className="flex items-center gap-1.5 text-brand-navy-600 dark:text-brand-navy-300">
                      <span className="material-symbols-outlined text-[14px] text-brand-teal-700 dark:text-brand-teal-400">public</span>
                      {isEn ? 'Synchronized across all SCMS sports centers.' : 'Đồng bộ toàn bộ các trung tâm thể thao SCMS.'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-brand-sand-700 dark:text-brand-sand-300 font-medium">
                      <span className="material-symbols-outlined text-[14px] text-brand-sand-700 dark:text-brand-sand-400">storefront</span>
                      {isEn ? 'Exclusive sport established at this facility.' : 'Bộ môn độc quyền thiết lập tại trung tâm này.'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-brand-navy-50/80 dark:bg-brand-navy-800/50 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-end gap-2">
                {!sport.isShared ? (
                  <button
                    onClick={() => openSportModal(sport)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-brand-navy-800 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>{isEn ? 'Edit Discipline' : 'Sửa bộ môn'}</span>
                  </button>
                ) : (
                  <span className="text-xs text-brand-navy-400 italic flex items-center gap-1 py-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    {isEn ? 'System Standard (Read-only)' : 'Quy chuẩn hệ thống (Chỉ xem)'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
