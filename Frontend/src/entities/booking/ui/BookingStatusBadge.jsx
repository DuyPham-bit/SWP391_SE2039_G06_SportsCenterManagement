import React from 'react';
import { getBookingStatusMeta } from '../model/bookingStatus.js';

export function BookingStatusBadge({ status, className = '' }) {
  const meta = getBookingStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.text} ${meta.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {meta.label}
    </span>
  );
}

export default BookingStatusBadge;

