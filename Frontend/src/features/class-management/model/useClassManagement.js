import { useState, useEffect, useCallback } from 'react';
import { classManagementApi } from '../api/classManagementApi.js';

export function useClassManagement({ autoFetch = true } = {}) {
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClassesAndRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classesData, roomsData, packagesData] = await Promise.all([
        classManagementApi.getAll().catch(() => []),
        classManagementApi.rooms.getAll().catch(() => []),
        classManagementApi.packages.getAll().catch(() => [])
      ]);
      setClasses(Array.isArray(classesData) ? classesData : (classesData?.items || []));
      setRooms(Array.isArray(roomsData) ? roomsData : (roomsData?.items || []));
      setPackages(Array.isArray(packagesData) ? packagesData : (packagesData?.items || []));
    } catch (err) {
      setError(err?.message || 'Không thể tải dữ liệu lớp học và phòng tập.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchClassesAndRooms();
    }
  }, [autoFetch, fetchClassesAndRooms]);

  return {
    classes,
    rooms,
    packages,
    loading,
    error,
    refetch: fetchClassesAndRooms
  };
}

export default useClassManagement;

