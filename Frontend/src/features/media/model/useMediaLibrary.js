import { useState, useEffect, useCallback } from 'react';
import { fetchMediaFiles, fetchMediaStorageStatus, uploadMediaFileToCloud } from '../api/mediaApi.js';

/**
 * Custom hook quản lý media library theo chuẩn feature-first (Option A).
 * Đóng gói trọn vẹn state loading, error, danh sách file, storage status và mutation upload.
 */
export function useMediaLibrary(autoFetch = true) {
  const [files, setFiles] = useState([]);
  const [storageStatus, setStorageStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [filesData, statusData] = await Promise.all([
        fetchMediaFiles().catch(() => []),
        fetchMediaStorageStatus().catch(() => null)
      ]);
      setFiles(filesData);
      setStorageStatus(statusData);
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách tệp đa phương tiện.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      loadData();
    }
  }, [autoFetch, loadData]);

  const uploadFile = useCallback(async (file) => {
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadMediaFileToCloud(file);
      setFiles(prev => [uploaded, ...prev]);
      return uploaded;
    } catch (err) {
      setError(err?.message || 'Tải tệp lên thất bại.');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    files,
    storageStatus,
    loading,
    uploading,
    error,
    refetch: loadData,
    uploadFile
  };
}

export default useMediaLibrary;

