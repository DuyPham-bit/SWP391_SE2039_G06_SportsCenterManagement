import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '../api/paymentApi.js';

/**
 * Feature Hook: usePayments
 * Quản lý danh sách hóa đơn, hoàn tiền và trạng thái thanh toán.
 */
export function usePayments({ autoFetch = true, invoiceParams = {} } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentApi.getInvoices(invoiceParams);
      setInvoices(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(invoiceParams)]);

  useEffect(() => {
    if (autoFetch) {
      fetchInvoices();
    }
  }, [autoFetch, fetchInvoices]);

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices
  };
}

export default usePayments;

