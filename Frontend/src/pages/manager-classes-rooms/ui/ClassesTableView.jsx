import React from 'react';
import { getSportTheme } from '../lib/sportTheme.js';

export function ClassesTableView({
  filteredItems, handlePublishClass, isEn, openClassModal, openRoomModal, openScheduleModal,
  openSportModal, tab
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-brand-navy-50/80 dark:bg-brand-navy-800/60 border-b border-brand-navy-200 dark:border-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">{isEn ? 'Name & Details' : 'Tên & Chi tiết'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Discipline / Category' : 'Bộ môn / Phân loại'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Location / Court' : 'Địa điểm / Phòng'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Capacity / Students' : 'Sức chứa / Học viên'}</th>
              <th className="py-3.5 px-4">{isEn ? 'Status' : 'Trạng thái'}</th>
              <th className="py-3.5 px-4 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300">
            {tab === 'classes' &&
              filteredItems.map((cls) => {
                const theme = getSportTheme(cls.sportName);
                return (
                  <tr key={cls.id} className="hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100">{cls.name}</div>
                      <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px] text-brand-navy-400">person</span>
                        {isEn ? 'Coach:' : 'HLV:'} {cls.coachName || (isEn ? 'Unassigned' : 'Chưa phân công')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${theme.badgeClass}`}>
                        <span className="material-symbols-outlined text-[14px]">{theme.icon}</span>
                        {cls.sportName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-brand-navy-700 dark:text-brand-navy-300">
                      {cls.roomName || <span className="text-brand-navy-400">{isEn ? 'Not assigned' : 'Chưa xếp'}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-brand-navy-800 dark:text-brand-navy-200">
                        {cls.enrolledCount || 0} / {cls.capacity} {isEn ? 'students' : 'học viên'}
                      </div>
                      <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                        {cls.durationMinutes || 60} {isEn ? 'mins / session' : 'phút/buổi'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {cls.status === 'Published' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                          ● {isEn ? 'Published' : 'Đang mở'}
                        </span>
                      ) : cls.status === 'Draft' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800">
                          {isEn ? 'Draft' : 'Bản nháp'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400">
                          {isEn ? 'Cancelled' : 'Đã hủy'}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openScheduleModal(cls)}
                          className="px-2.5 py-1 bg-brand-navy-900 hover:bg-brand-navy-800 text-white rounded-lg text-xs font-semibold transition"
                        >
                          {isEn ? 'Schedule' : 'Lịch học'}
                        </button>
                        {cls.status === 'Draft' && (
                          <button
                            onClick={() => handlePublishClass(cls)}
                            className="px-2.5 py-1 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-lg text-xs font-semibold transition"
                          >
                            {isEn ? 'Publish' : 'Công bố'}
                          </button>
                        )}
                        <button
                          onClick={() => openClassModal(cls)}
                          className="px-2.5 py-1 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 rounded-lg text-xs font-medium transition"
                        >
                          {isEn ? 'Edit' : 'Sửa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {tab === 'rooms' &&
              filteredItems.map((room) => (
                <tr key={room.id} className="hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100">{room.name}</div>
                  </td>
                  <td className="py-3.5 px-4 text-brand-navy-700 dark:text-brand-navy-300">
                    {room.type || (isEn ? 'Multi-purpose Court' : 'Phòng đa năng')}
                  </td>
                  <td className="py-3.5 px-4 text-brand-navy-600 dark:text-brand-navy-400">
                    {room.location || (isEn ? 'Sports Complex' : 'Khu liên hợp')}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-brand-navy-800 dark:text-brand-navy-200">
                    {room.capacity} {isEn ? 'people / session' : 'người / ca'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                      ● {room.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openRoomModal(room)}
                      className="px-3 py-1 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 rounded-lg text-xs font-medium transition"
                    >
                      {isEn ? 'Edit' : 'Sửa'}
                    </button>
                  </td>
                </tr>
              ))}

            {tab === 'sports' &&
              filteredItems.map((sport) => (
                <tr key={sport.id} className="hover:bg-brand-navy-50/60 dark:hover:bg-brand-navy-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-brand-navy-900 dark:text-brand-navy-100">{sport.name}</div>
                    <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 line-clamp-1">{sport.description}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {sport.isShared ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
                        {isEn ? 'Global' : 'Dùng chung'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800">
                        {isEn ? 'Center Exclusive' : 'Riêng cơ sở'}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-brand-navy-500">-</td>
                  <td className="py-3.5 px-4 text-brand-navy-500">-</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sport.status === 'Active'
                              ? 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800'
                              : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400'
                          }`}
                    >
                      {sport.status === 'Active' ? (isEn ? '● Active' : '● Đang dùng') : isEn ? 'Inactive' : 'Ngừng dùng'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {!sport.isShared ? (
                      <button
                        onClick={() => openSportModal(sport)}
                        className="px-3 py-1 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-200 rounded-lg text-xs font-medium transition"
                      >
                        {isEn ? 'Edit' : 'Sửa'}
                      </button>
                    ) : (
                      <span className="text-xs text-brand-navy-400 italic">{isEn ? 'Locked' : 'Khóa'}</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
