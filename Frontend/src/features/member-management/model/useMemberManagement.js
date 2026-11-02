import { useState, useEffect, useCallback } from 'react';
import { memberManagementApi } from '../api/memberManagementApi.js';

export function useMemberManagement({ autoFetch = true, search = '' } = {}) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberManagementApi.getAll({ search });
      setMembers(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách hội viên.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (autoFetch) {
      fetchMembers();
    }
  }, [autoFetch, fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers
  };
}

export default useMemberManagement;

