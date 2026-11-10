import React from 'react';

export function RoomsDetailTable({ isEn, processedRooms, roomSortBy, setRoomSortBy }) {
  return (
    <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-brand-navy-900 dark:text-white text-sm">
            {isEn ? 'Court & Studio Facility Performance' : 'Chi tiết hiệu suất từng sân & phòng tập'}
          </h3>
        </div>

        <div className="flex items-center gap-2 no-print">
          <select
            className="text-xs font-medium border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl px-2.5 py-1.5 bg-white dark:bg-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-200 focus:outline-none"
            value={roomSortBy}
            onChange={e => setRoomSortBy(e.target.value)}
          >
            <option value="booked">{isEn ? 'Sort: Most Booked' : 'Sắp xếp: Đặt nhiều nhất'}</option>
            <option value="sessions">{isEn ? 'Sort: Most Sessions' : 'Sắp xếp: Số ca học nhiều nhất'}</option>
            <option value="occupancy">{isEn ? 'Sort: Highest Occupancy' : 'Sắp xếp: % Khai thác công suất'}</option>
          </select>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="overflow-x-auto border border-brand-navy-100 dark:border-brand-navy-800 rounded-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 font-chivo text-xs uppercase tracking-wider border-b border-brand-navy-200 dark:border-brand-navy-700">
              <th className="py-3 px-3 w-14 text-center whitespace-nowrap">{isEn ? 'Rank' : 'Hạng'}</th>
              <th className="py-3 px-4 min-w-[180px]">{isEn ? 'Court / Studio Name' : 'Tên Sân / Phòng'}</th>
              <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">{isEn ? 'Type & Location' : 'Loại hình & Vị trí'}</th>
              <th className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">{isEn ? 'Cap / Session' : 'Sức chứa / ca'}</th>
              <th className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">{isEn ? 'Sessions Hosted' : 'Số ca đã tổ chức'}</th>
              <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Guests Received' : 'Lượt khách tiếp nhận'}</th>
              <th className="py-3 px-4 w-44 min-w-[140px] whitespace-nowrap">{isEn ? 'Utilization Rate' : 'Tỷ lệ khai thác'}</th>
              <th className="py-3 px-4 text-center whitespace-nowrap min-w-[120px]">{isEn ? 'Load Status' : 'Tình trạng tải'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
            {processedRooms.length ? processedRooms.map((room, idx) => {
              const isTop1 = idx === 0 && roomSortBy === 'booked';
              const isTop2 = idx === 1 && roomSortBy === 'booked';
              const isTop3 = idx === 2 && roomSortBy === 'booked';

              let badgeRank = `#${idx + 1}`;
              let badgeRankColor = 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 border-brand-navy-200 dark:border-brand-navy-700';
              if (isTop1) { badgeRank = '🥇 #1'; badgeRankColor = 'bg-brand-sand-300/30 text-brand-sand-900 dark:text-brand-sand-300 border-brand-sand-300/60 font-bold'; }
              else if (isTop2) { badgeRank = '🥈 #2'; badgeRankColor = 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-800 dark:text-brand-navy-200 border-brand-navy-300 dark:border-brand-navy-600 font-bold'; }
              else if (isTop3) { badgeRank = '🥉 #3'; badgeRankColor = 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-800 dark:text-brand-sand-400 border-brand-sand-200 dark:border-brand-sand-800 font-bold'; }

              return (
                <tr key={room.id} className="hover:bg-brand-navy-50/80 dark:hover:bg-brand-navy-800/50 transition-colors">
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs border ${badgeRankColor}`}>
                      {badgeRank}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-navy-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[18px]">stadium</span>
                      <span>{room.name}</span>
                    </div>
                    {room.classesList?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {room.classesList.map(cName => (
                          <span key={cName} className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400">
                            {cName}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <span className="font-semibold text-brand-navy-800 dark:text-brand-navy-200 block">{room.type}</span>
                      <span className="text-brand-navy-400">{room.location || (isEn ? 'Not updated' : 'Chưa cập nhật')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-brand-navy-700 dark:text-brand-navy-300">
                    {room.unitCapacity} {isEn ? 'slots' : 'chỗ'}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-brand-navy-900 dark:text-white">
                    {room.sessionsCount} {isEn ? 'sessions' : 'ca'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-black text-brand-navy-900 dark:text-white text-base">{room.booked}</span>
                    <span className="text-xs text-brand-navy-400"> / {room.capacity}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className={room.occupancyRate >= 20 ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-600 dark:text-brand-navy-400'}>
                          {room.occupancyRate}%
                        </span>
                        <span className="text-[11px] text-brand-navy-400 font-normal">
                          {room.capacity ? `${room.booked}/${room.capacity}` : '0/0'}
                        </span>
                      </div>
                      <div className="w-full bg-brand-navy-100 dark:bg-brand-navy-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                                      room.occupancyRate >= 20
                                        ? 'bg-brand-sage-700'
                                        : room.occupancyRate >= 10
                                        ? 'bg-brand-teal-500'
                                        : 'bg-brand-navy-400'
                                    }`}
                          style={{ width: `${Math.min(100, room.occupancyRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {room.booked >= 15 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-200 dark:border-brand-sage-800">
                        <span>🔥</span>
                        <span>{isEn ? 'High Load' : 'Tải cao'}</span>
                      </span>
                    ) : room.booked >= 5 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-brand-teal-50 dark:bg-brand-teal-950/40 text-brand-teal-700 dark:text-brand-teal-300 border border-brand-teal-200 dark:border-brand-teal-800">
                        <span>✅</span>
                        <span>{isEn ? 'Balanced' : 'Đang tối ưu'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 border border-brand-sand-200 dark:border-brand-sand-800">
                        <span>⚠️</span>
                        <span>{isEn ? 'Slots Available' : 'Còn nhiều ca trống'}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-brand-navy-400 text-xs">
                  {isEn ? 'No court/room data available.' : 'Không có dữ liệu sân/phòng nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
