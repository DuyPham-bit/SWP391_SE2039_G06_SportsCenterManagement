import React from 'react';
import { BookingCard } from './BookingCard.jsx';
import { EmptyState } from '../../../shared/ui/EmptyState.jsx';
import { LoadingState } from '../../../shared/ui/LoadingState.jsx';

export function BookingList({
  bookings = [],
  loading = false,
  onCancel,
  emptyMessage = 'Bạn chưa có lịch đặt chỗ nào.',
  className = ''
}) {
  if (loading) {
    return <LoadingState message="Đang tải danh sách đặt chỗ..." className={className} />;
  }

  if (!bookings || bookings.length === 0) {
    return (
      <EmptyState
        icon="event_busy"
        title="Chưa có lịch đặt chỗ"
        description={emptyMessage}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {bookings.map(booking => (
        <BookingCard
          key={booking.id || `${booking.sessionId}-${booking.date}`}
          booking={booking}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}

export default BookingList;

