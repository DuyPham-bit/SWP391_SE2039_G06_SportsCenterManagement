import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { notificationApi } from '../../services/api.js';

export function useNotifications() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readingId, setReadingId] = useState(null);
  const [readingAll, setReadingAll] = useState(false);
  const activeUserId = useRef(currentUser?.id);
  activeUserId.current = currentUser?.id;
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    setItems([]); setError(''); setReadingId(null); setReadingAll(false);
  }, [currentUser?.id]);

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
    const onRead = event => {
      if (event.detail.userId === currentUser.id) setItems(previous => previous.map(item => item.id === event.detail.id ? { ...item, isRead: true } : item));
    };
    const onReadAll = event => { if (event.detail.userId === currentUser.id) refresh(); };
    const timer = window.setInterval(refreshVisible, 15000);
    document.addEventListener('visibilitychange', refreshVisible);
    window.addEventListener('focus', refreshVisible);
    window.addEventListener('scms:notification-read', onRead);
    window.addEventListener('scms:notifications-read-all', onReadAll);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshVisible);
      window.removeEventListener('focus', refreshVisible);
      window.removeEventListener('scms:notification-read', onRead);
      window.removeEventListener('scms:notifications-read-all', onReadAll);
    };
  }, [currentUser?.id, refresh]);

  const markRead = async item => {
    if (item.isRead || readingId !== null || readingAll || !currentUser) return;
    const userId = currentUser.id;
    setReadingId(item.id);
    try {
      await notificationApi.markRead(item.id);
      if (activeUserId.current !== userId) return;
      window.dispatchEvent(new CustomEvent('scms:notification-read', { detail: { id: item.id, userId } }));
      setError('');
    } catch (err) { if (activeUserId.current === userId) setError(err.message || 'Không thể đánh dấu đã đọc.'); }
    finally { if (activeUserId.current === userId) setReadingId(null); }
  };

  const markAllRead = async () => {
    if (readingAll || readingId !== null || !currentUser) return;
    const userId = currentUser.id;
    setReadingAll(true);
    try {
      await notificationApi.markAllRead();
      if (activeUserId.current !== userId) return;
      setError('');
      // Reload authoritative state so notifications arriving during this request stay unread.
      window.dispatchEvent(new CustomEvent('scms:notifications-read-all', { detail: { userId } }));
    } catch (err) { if (activeUserId.current === userId) setError(err.message || 'Không thể đọc tất cả thông báo.'); }
    finally { if (activeUserId.current === userId) setReadingAll(false); }
  };

  return { items, loading, error, readingId, readingAll, refresh, markRead, markAllRead };
}
