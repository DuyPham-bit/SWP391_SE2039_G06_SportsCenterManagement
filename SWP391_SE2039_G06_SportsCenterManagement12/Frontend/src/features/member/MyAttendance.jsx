import React, { useEffect, useState } from 'react';
import { bookingApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { ATTENDANCE_LABELS, bookingStart, formatMemberDate, formatMemberDateTime } from './memberOverview.js';

export function MyAttendance() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    bookingApi.getMemberBookings().then(data => { if (active) setBookings(data); })
      .catch(err => { if (active) setError(err.message || 'Không thể tải lịch sử điểm danh.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentUser?.id, reload]);

  const history = bookings.filter(b => b.attendanceStatus || (b.status === 'CONFIRMED' && b.sessionStatus !== 'CANCELLED' && bookingStart(b) <= Date.now()))
    .sort((a, b) => bookingStart(b) - bookingStart(a));
  const invalidRange = from && to && from > to;
  const filtered = invalidRange ? [] : history.filter(b => (status === 'ALL' || (b.attendanceStatus || 'PENDING') === status)
    && (!from || b.bookingDate >= from) && (!to || b.bookingDate <= to));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div><h1 className="font-chivo text-2xl font-black text-slate-900">Lịch Sử Điểm Danh</h1><p className="text-xs text-slate-500 mt-1">Theo dõi có mặt, đi muộn, vắng mặt và ghi chú của HLV theo từng buổi học.</p></div>
        <button type="button" onClick={() => setReload(value => value + 1)} disabled={loading} className="px-4 py-2 rounded-lg border text-xs font-bold disabled:opacity-50">Tải lại</button>
      </div>
      {loading ? <LoadingSpinner text="Đang tải lịch sử điểm danh..." /> : error ? <div role="alert" className="p-4 bg-red-50 rounded-xl text-red-700">{error}</div> : <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'].map(value => <div key={value} className="p-4 rounded-xl bg-white border border-slate-200"><p className="text-xs font-bold text-slate-500">{ATTENDANCE_LABELS[value]}</p><p className="text-2xl font-black mt-1">{history.filter(b => b.attendanceStatus === value).length}</p></div>)}
        </div>
        <div className="flex flex-wrap items-end gap-3 p-4 bg-white border rounded-xl">
          <label className="text-xs font-bold space-y-1"><span className="block">Trạng thái điểm danh</span><select value={status} onChange={event => setStatus(event.target.value)} className="p-2 border rounded-lg"><option value="ALL">Tất cả</option>{Object.entries(ATTENDANCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-bold space-y-1"><span className="block">Từ ngày</span><input type="date" value={from} onChange={event => setFrom(event.target.value)} className="p-2 border rounded-lg" /></label>
          <label className="text-xs font-bold space-y-1"><span className="block">Đến ngày</span><input type="date" value={to} onChange={event => setTo(event.target.value)} className="p-2 border rounded-lg" /></label>
          <button type="button" onClick={() => { setStatus('ALL'); setFrom(''); setTo(''); }} className="p-2 text-xs font-bold text-red-700">Xóa bộ lọc</button>
        </div>
        {invalidRange && <p role="alert" className="text-sm text-red-700">Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</p>}
        {filtered.length === 0 ? <div className="p-8 text-center bg-white rounded-xl border text-sm text-slate-500">{history.length === 0 ? 'Chưa có buổi học đã diễn ra hoặc bản ghi điểm danh.' : 'Không có buổi học phù hợp bộ lọc.'}</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(booking => <article key={booking.id} className="p-5 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold text-base">{booking.className}</h2><span className="font-bold text-red-700">{ATTENDANCE_LABELS[booking.attendanceStatus || 'PENDING'] || booking.attendanceStatus}</span></div>
            <p className="font-bold">{formatMemberDate(booking.bookingDate)} · {booking.timeSlot}</p>
            <p>Địa điểm: {booking.roomName}</p><p>HLV: {booking.coachName}</p>
            {booking.checkInTime && <p>Giờ điểm danh: {formatMemberDateTime(booking.checkInTime)}</p>}
            <p className="whitespace-pre-wrap break-words">Ghi chú: {booking.attendanceNote || 'Chưa có ghi chú'}</p>
          </article>)}
        </div>}
        <a href="#/member/progress" className="inline-block text-xs font-bold text-red-700 hover:underline">Xem kết quả tập luyện & Nhận xét HLV</a>
      </>}
    </div>
  );
}
