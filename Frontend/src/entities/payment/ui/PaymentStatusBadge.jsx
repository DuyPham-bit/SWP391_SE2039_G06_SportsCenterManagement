import React from 'react';
import { getPaymentStatusMeta } from '../model/paymentStatus.js';

export function PaymentStatusBadge({ status, className = '' }) {
  const meta = getPaymentStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.bg} ${meta.text} ${meta.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {meta.label}
    </span>
  );
}

export default PaymentStatusBadge;

