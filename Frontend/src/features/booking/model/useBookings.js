import { useState, useEffect, useCallback } from 'react';
import { bookingApi } from '../api/bookingApi.js';

/**
 * Feature Hook: useBookings
 * Quản lý danh sách đặt chỗ và tương tác API đặt chỗ.
 */
export function useBookings({ autoFetch = true, memberId = null } = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = memberId 
        ? await bookingApi.getMemberBookings(memberId)
        : await bookingApi.getMyBookings();
      setBookings(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch đặt chỗ.');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (autoFetch) {
      fetchBookings();
    }
  }, [autoFetch, fetchBookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      await bookingApi.cancel(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      setError(err?.message || 'Không thể hủy đặt chỗ.');
      throw err;
    }
  }, []);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings,
    cancelBooking
  };
}

export default useBookings;

