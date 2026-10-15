import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { notificationApi } from '../../services/api.js';

export function useNotifications() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readingId, setReadingId] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    let active = true;
    if (!currentUser) { setItems([]); setLoading(false); return; }
    setLoading(true);
    notificationApi.getMine().then(data => {
      if (active) { setItems(data); setError(''); }
    }).catch(err => { if (active) setError(err.message || 'Không thể tải thông báo.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentUser?.id, revision]);

  useEffect(() => {
    if (!currentUser) return;
    const refreshVisible = () => { if (!document.hidden) refresh(); };
    const onRead = event => setItems(previous => previous.map(item => item.id === event.detail.id ? { ...item, isRead: true } : item));
    const timer = window.setInterval(refreshVisible, 15000);
    document.addEventListener('visibilitychange', refreshVisible);
    window.addEventListener('focus', refreshVisible);
    window.addEventListener('scms:notification-read', onRead);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshVisible);
      window.removeEventListener('focus', refreshVisible);
      window.removeEventListener('scms:notification-read', onRead);
    };
  }, [currentUser?.id, refresh]);

  const markRead = async item => {
    if (item.isRead || readingId !== null) return;
    setReadingId(item.id);
    try {
      await notificationApi.markRead(item.id);
      window.dispatchEvent(new CustomEvent('scms:notification-read', { detail: { id: item.id } }));
      setError('');
    } catch (err) { setError(err.message || 'Không thể đánh dấu đã đọc.'); }
    finally { setReadingId(null); }
  };

  return { items, loading, error, readingId, refresh, markRead };
}
