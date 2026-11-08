import React from 'react';

export function OperationalInsights({ isEn, processedRooms, topClass, topRoom, topSport }) {
  return (
    <div className="bg-brand-sand-50/70 dark:bg-brand-sand-950/20 border border-brand-sand-200 dark:border-brand-sand-900/50 rounded-3xl p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-brand-sand-900 dark:text-brand-sand-200 font-chivo font-black text-base">
        <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[22px]">lightbulb</span>
        {isEn ? 'Operational Recommendations & Revenue Optimization' : 'Khuyến Nghị Vận Hành & Tối Ưu Doanh Thu'}
      </div>
      <div className="grid md:grid-cols-3 gap-4 text-xs text-brand-sand-950 dark:text-brand-sand-100">
        <div className="bg-white/80 dark:bg-brand-navy-900/80 p-3.5 rounded-2xl border border-brand-sand-200/60 dark:border-brand-sand-900/40 shadow-xs">
          <span className="font-bold text-brand-sand-900 dark:text-brand-sand-300 block mb-1">
            {isEn ? '1. Expand Top Class & Court Schedule:' : '1. Mở rộng khung giờ Lớp & Sân Quán quân:'}
          </span>
          {isEn
            ? <>Class <strong className="text-brand-navy-900 dark:text-white">{topClass?.name || 'Top 1'}</strong> in <strong className="text-brand-navy-900 dark:text-white">{topRoom?.name || 'Top 1 Court'}</strong> has peak booking rate ({topClass?.booked || 0} bookings). Consider adding weekend or evening rush-hour sessions.</>
            : <>Lớp <strong className="text-brand-navy-900 dark:text-white">{topClass?.name || 'Top 1'}</strong> tại <strong className="text-brand-navy-900 dark:text-white">{topRoom?.name || 'Sân Top 1'}</strong> đang có tần suất đặt cao nhất ({topClass?.booked || 0} lượt). Khuyến nghị bổ sung thêm ca tập cuối tuần hoặc giờ cao điểm buổi tối.</>}
        </div>
        <div className="bg-white/80 dark:bg-brand-navy-900/80 p-3.5 rounded-2xl border border-brand-sand-200/60 dark:border-brand-sand-900/40 shadow-xs">
          <span className="font-bold text-brand-sand-900 dark:text-brand-sand-300 block mb-1">
            {isEn ? '2. Balance Sport Market Share:' : '2. Cân bằng thị phần bộ môn:'}
          </span>
          {topSport
            ? (isEn
                ? <>Sport <strong className="text-brand-navy-900 dark:text-white">{topSport.name}</strong> commands <strong className="text-brand-sage-700 dark:text-brand-sage-500">{topSport.share || 0}%</strong> of total bookings. Benchmark with other disciplines before adjusting schedules or marketing spend.</>
                : <>Bộ môn <strong className="text-brand-navy-900 dark:text-white">{topSport.name}</strong> chiếm <strong className="text-brand-sage-700 dark:text-brand-sage-500">{topSport.share || 0}%</strong> tổng lượt đặt chỗ. So sánh với các bộ môn còn lại trước khi điều chỉnh lịch hoặc chương trình quảng bá.</>)
            : (isEn ? 'Insufficient booking data to generate discipline recommendations.' : 'Chưa đủ dữ liệu đặt chỗ để đưa ra khuyến nghị theo bộ môn.')}
        </div>
        <div className="bg-white/80 dark:bg-brand-navy-900/80 p-3.5 rounded-2xl border border-brand-sand-200/60 dark:border-brand-sand-900/40 shadow-xs">
          <span className="font-bold text-brand-sand-900 dark:text-brand-sand-300 block mb-1">
            {isEn ? '3. Optimize Low Utilization Courts:' : '3. Tối ưu sân có nhiều khung giờ trống:'}
          </span>
          {processedRooms.length
            ? (isEn
                ? <>Area <strong className="text-brand-navy-900 dark:text-white">{processedRooms[processedRooms.length - 1]?.name}</strong> has the lowest utilization in this period. Review its time slot allocation before launching promotions.</>
                : <>Khu vực <strong className="text-brand-navy-900 dark:text-white">{processedRooms[processedRooms.length - 1]?.name}</strong> có lượng sử dụng thấp nhất trong dữ liệu kỳ này. Cần đối chiếu khung giờ trước khi mở thêm ưu đãi.</>)
            : (isEn ? 'Insufficient court/room data to generate recommendations.' : 'Chưa đủ dữ liệu sân/phòng để đưa ra khuyến nghị.')}
        </div>
      </div>
    </div>
  );
}
