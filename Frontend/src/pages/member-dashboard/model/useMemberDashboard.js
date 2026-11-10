import { useState, useEffect } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { useNotifications } from '../../../features/notifications/index.js';
import QRCode from 'qrcode';
import { bookingApi } from '../../../entities/booking/index.js';
import { memberApi } from '../../../entities/member/index.js';

export function useMemberDashboard() {
  const { currentUser, refreshUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError, showInfo } = useToast();
  const { items: notifications, error: notificationError, refresh: refreshNotifications } = useNotifications();

  const [data, setData] = useState({ bookings: [], progress: [], plans: [] });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Quick cancel modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const memberCode = currentUser?.memberCode || 'MEM-00001';

  // Generate genuine scannable QR Code
  useEffect(() => {
    if (memberCode) {
      QRCode.toDataURL(memberCode, {
        width: 320,
        margin: 1,
        color: {
          dark: '#1E2235',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then(url => {
          setQrDataUrl(url);
        })
        .catch(err => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [memberCode]);

  const capabilities = currentUser?.capabilities || [];
  const canBook = capabilities.includes('book_class');
  const canProgress = capabilities.includes('view_my_progress');
  const canCancel = capabilities.includes('cancel_booking');

  useEffect(() => {
    let active = true;
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (typeof refreshUser === 'function') {
      refreshUser().catch(() => {});
    }
    const sources = [
      ['bookings', canBook ? bookingApi.getMemberBookings(currentUser.id) : Promise.resolve([])],
      ['progress', canProgress ? memberApi.getMyProgress() : Promise.resolve([])],
      ['plans', canProgress ? memberApi.getMyPlans() : Promise.resolve([])]
    ];

    Promise.allSettled(sources.map(([, request]) => request)).then(results => {
      if (!active) return;
      const nextData = {};
      const nextErrors = {};
      results.forEach((result, index) => {
        const key = sources[index][0];
        nextData[key] = result.status === 'fulfilled' ? result.value : [];
        if (result.status === 'rejected') {
          nextErrors[key] = result.reason?.message || (isEn ? 'Unable to load data.' : 'Không thể tải dữ liệu.');
        }
      });
      setData(nextData);
      setErrors(nextErrors);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [currentUser?.id, canBook, canProgress, reload, isEn]);

  const handleCopyMemberCode = () => {
    if (!currentUser?.memberCode) return;
    navigator.clipboard.writeText(currentUser.memberCode);
    setCopiedCode(true);
    showInfo(isEn ? `Member code copied: ${currentUser.memberCode}` : `Đã sao chép mã hội viên: ${currentUser.memberCode}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSyncData = async () => {
    setIsRefreshing(true);
    setReload(v => v + 1);
    refreshNotifications();
    try {
      if (typeof refreshUser === 'function') await refreshUser();
      showSuccess(isEn ? 'Member data synced successfully!' : 'Đã đồng bộ dữ liệu hội viên thành công!');
    } catch {
      showInfo(isEn ? 'Refreshed member data.' : 'Đã làm mới dữ liệu hội viên.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleConfirmCancelBooking = async () => {
    if (!bookingToCancel || !currentUser) return;
    setCancelling(true);
    try {
      const res = await bookingApi.cancelBooking(bookingToCancel.id, currentUser.id);
      showSuccess(res?.message || (isEn ? 'Booking cancelled successfully.' : 'Hủy lịch đặt chỗ thành công.'));
      setCancelModalOpen(false);
      setBookingToCancel(null);
      setReload(r => r + 1);
    } catch (err) {
      showError(err.message || (isEn ? 'Unable to cancel class.' : 'Không thể hủy buổi học.'));
    } finally {
      setCancelling(false);
    }
  };

  return {
    bookingToCancel, canBook, canCancel, canProgress, cancelModalOpen, cancelling, copiedCode,
    currentUser, data, errors, handleConfirmCancelBooking, handleCopyMemberCode, handleSyncData,
    isEn, isRefreshing, loading, memberCode, notificationError, notifications, profileOpen,
    qrDataUrl, qrModalOpen, setBookingToCancel, setCancelModalOpen, setProfileOpen, setQrModalOpen
  };
}
