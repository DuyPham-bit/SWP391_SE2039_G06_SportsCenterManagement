import React from 'react';
import { SportRevenueRankingChart } from './charts/SportRevenueRankingChart.jsx';
import { RoomUsageRankingChart } from './charts/RoomUsageRankingChart.jsx';

export function LeaderboardsRow({ isEn, metrics, processedRooms }) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Sport Leaderboard */}
      <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
        <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
          <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-700" />
            {isEn ? 'Sport Leaderboard: Revenue & Bookings' : 'Xếp Hạng Bộ Môn: Doanh Thu & Lượt Đặt'}
          </h3>
        </div>
        <SportRevenueRankingChart
          sports={metrics.topSports}
          revenueBySport={metrics.revenueBySport}
        />
      </section>

      {/* Room Leaderboard */}
      <section className="bg-white dark:bg-brand-navy-900 border border-brand-navy-200/90 dark:border-brand-navy-800 rounded-3xl p-5 space-y-4 shadow-xs hover-lift transition-all">
        <div className="flex items-center justify-between border-b border-brand-navy-100 dark:border-brand-navy-800 pb-3">
          <h3 className="font-black text-brand-navy-900 dark:text-white text-base font-chivo flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-600" />
            {isEn ? 'Facility Utilization: Sessions & Visitors' : 'Khai Thác Sân Bãi: Số Ca & Khách'}
          </h3>
        </div>
        <RoomUsageRankingChart
          rooms={processedRooms}
        />
      </section>
    </div>
  );
}
