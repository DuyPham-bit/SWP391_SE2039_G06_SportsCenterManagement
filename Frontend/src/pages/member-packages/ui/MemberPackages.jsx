import React, { useState, useEffect } from 'react';
import { packageApi } from '../../../entities/membership/index.js';
import { memberApi, receptionApi, formatMemberDate } from '../../../entities/member/index.js';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { translatePackageName } from '../../../shared/i18n/i18nHelper.js';
import { safeHref, safePaymentHref } from '../../../shared/lib/safeUrl.js';

const PACKAGE_PERKS = {
  basic: {
    vi: [
      'Tập luyện 1 bộ môn tự chọn (Gym / Bơi lội / Cầu lông / Yoga)',
      'Tủ đồ locker cá nhân & phòng tắm nóng lạnh tiêu chuẩn',
      'Đặt lịch học & điểm danh QR qua ứng dụng di động',
      'Thời hạn rèn luyện tiêu chuẩn 30 ngày'
    ],
    en: [
      'Access to 1 elective sport (Gym / Swimming / Badminton / Yoga)',
      'Personal locker & standard hot-water shower facilities',
      'Class scheduling & QR code check-in via mobile app',
      'Standard 30-day training duration'
    ]
  },
  pro: {
    vi: [
      'Lựa chọn 3 bộ môn kết hợp (Gym + Bơi lội + Cầu lông/Yoga)',
      'Tặng 1 buổi đo và phân tích thể trạng InBody 770 chuyên sâu',
      'Tham gia lớp rèn luyện thể lực nhóm chuyên biệt',
      'Quyền đổi và bảo lưu lịch tập linh hoạt trước 24 giờ'
    ],
    en: [
      'Multi-sport combination of 3 sports (Gym + Swim + Badminton/Yoga)',
      'Complimentary InBody 770 comprehensive body composition test',
      'Access to dedicated group functional fitness classes',
      'Flexible reschedule & freeze rights 24h in advance'
    ]
  },
  elite: {
    vi: [
      'Toàn quyền tập luyện 6 bộ môn thể thao cao cấp đa năng',
      'Sử dụng không giới hạn phòng xông hơi Sauna & Bể sục Jacuzzi',
      'Ưu tiên đặt sân thi đấu và làn bơi riêng vào khung giờ cao điểm',
      '2 buổi tư vấn dinh dưỡng & phác đồ thể lực cùng HLV Pro'
    ],
    en: [
      'All-inclusive training across 6 premium athletic sports',
      'Unlimited access to Himalayan Sauna & Hydrotherapy Jacuzzi',
      'Priority court & private lane booking during peak hours',
      '2 private consultations for nutrition & workout plan with Pro Coach'
    ]
  },
  olympic: {
    vi: [
      'Toàn quyền sử dụng 10 bộ môn và 10 cụm sân thi đấu Olympic quốc tế',
      'Không giới hạn số buổi tập và thời gian trong suốt 365 ngày',
      'Đặc quyền phòng VIP Lounge, khăn tập cao cấp & đồ uống thể thao',
      'Ưu tiên đặt lịch số 1, quyền bảo lưu gói tập lên đến 60 ngày'
    ],
    en: [
      'Unlimited all-access to all 10 Olympic sports & 10 international courts',
      'Unlimited sessions and hours throughout 365 days',
      'VIP Lounge access, complimentary premium towels & sports drinks',
      'Tier-1 booking priority and up to 60 days membership freeze'
    ]
  }
};

function getPackagePerks(pkg, isEn = false) {
  if (Array.isArray(pkg?.features) && pkg.features.length > 0) {
    return pkg.features;
  }
  const name = (pkg?.name || '').toLowerCase();
  const lang = isEn ? 'en' : 'vi';

  if (name.includes('olympic') || name.includes('all-access') || pkg?.durationDays >= 365) {
    return PACKAGE_PERKS.olympic[lang];
  }
  if (name.includes('elite') || pkg?.durationDays >= 180) {
    return PACKAGE_PERKS.elite[lang];
  }
  if (name.includes('pro') || pkg?.durationDays >= 90) {
    return PACKAGE_PERKS.pro[lang];
  }
  return PACKAGE_PERKS.basic[lang];
}

function getMonthlyEquivalent(price, durationDays, isEn = false) {
  if (!price || !durationDays) return null;
  if (durationDays === 30) {
    const perDay = Math.round(price / 30);
    return isEn ? `~${perDay.toLocaleString()}đ / day` : `~${perDay.toLocaleString()}đ / ngày`;
  }
  const months = Math.round(durationDays / 30);
  const perMonth = Math.round(price / months);
  return isEn ? `~${perMonth.toLocaleString()}đ / month` : `~${perMonth.toLocaleString()}đ / tháng`;
}

function resolveAllowedSports(pkg) {
  if (pkg?.allowedSports && pkg.allowedSports > 1) return pkg.allowedSports;
  const name = (pkg?.name || '').toLowerCase();
  const access = (pkg?.accessType || '').toLowerCase();
  if (access.includes('10') || access.includes('15') || access.includes('toàn quyền') || name.includes('all-access') || name.includes('olympic') || pkg?.durationDays >= 365) return 10;
  if (access.includes('6') || name.includes('elite') || pkg?.durationDays >= 180) return 6;
  if (access.includes('3') || name.includes('pro') || pkg?.durationDays >= 90) return 3;
  return pkg?.allowedSports || 1;
}

export function MemberPackages() {
  const { currentUser, refreshUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const [packages, setPackages] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingInvoice, setSyncingInvoice] = useState('');

  // Checkout Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');
  const [processing, setProcessing] = useState(false);
  const [activeInvoiceNumber, setActiveInvoiceNumber] = useState(null);

  // Conflict / Cancel Modal State
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadData = async () => {
    try {
      const [pkgs, pendings] = await Promise.all([
        packageApi.getAll(),
        memberApi.getMyPendingInvoices()
      ]);
      setPackages(pkgs.filter(p => p.status === 'ACTIVE'));
      setPendingInvoices(pendings || []);
    } catch (error) {
      showError(error.message || (isEn ? 'Failed to load membership packages.' : 'Không thể tải danh mục gói tập.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCheckout = (pkg, existingInvoiceNumber = null) => {
    setSelectedPkg(pkg);
    setActiveInvoiceNumber(existingInvoiceNumber);
    setModalOpen(true);
  };

  const handleCancelPending = async (invoiceNumber) => {
    if (!invoiceNumber) return;
    setCancelling(true);
    try {
      await memberApi.cancelPendingInvoice(invoiceNumber);
      showSuccess(isEn ? `Invoice ${invoiceNumber} cancelled successfully. You can now choose a new package.` : `Đã hủy hóa đơn ${invoiceNumber} thành công. Bạn có thể chọn gói mới.`);
      setConflictModalOpen(false);
      setConflictData(null);
      await loadData();
    } catch (err) {
      showError(err.message || (isEn ? 'Cannot cancel invoice.' : 'Không thể hủy hóa đơn.'));
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckOrSyncPending = async (invoiceNumber) => {
    setSyncingInvoice(invoiceNumber);
    try {
      const invDetails = await receptionApi.getInvoice(invoiceNumber);
      if (invDetails && (invDetails.status === 'Paid' || invDetails.amountPaid >= invDetails.totalAmount)) {
        showSuccess(isEn ? 'Payment confirmed! Your package is now active.' : 'Giao dịch đã được ghi nhận thành công! Gói tập của bạn đã kích hoạt.');
        await loadData();
        await refreshUser();
        return;
      }

      await loadData();
      await refreshUser();
      showInfo(
        isEn
          ? 'Invoice is still pending confirmation. If your account was already debited, please contact reception with your invoice code for instant reconciliation.'
          : 'Hóa đơn đang chờ ngân hàng xác nhận. Nếu bạn đã bị trừ tiền, vui lòng liên hệ quầy lễ tân để đối soát kích hoạt ngay lập tức!'
      );
    } catch (err) {
      showError(err.message || (isEn ? 'Failed to check invoice status.' : 'Không thể kiểm tra trạng thái hóa đơn.'));
    } finally {
      setSyncingInvoice('');
    }
  };

  const handleConfirmSubscribe = async () => {
    if (!selectedPkg || !currentUser || processing) return;

    setProcessing(true);
    try {
      const res = await memberApi.subscribeOnline({
        memberId: currentUser.id,
        packageId: selectedPkg.id,
        paymentMethod,
        invoiceNumber: activeInvoiceNumber || undefined
      });
      const paymentUrl = safePaymentHref(res.paymentUrl) || safeHref(res.paymentUrl);
      if (!paymentUrl) {
        throw new Error(isEn ? 'Could not generate payment link.' : 'Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.');
      }
      setModalOpen(false);
      // Chuyển hướng trực tiếp trên trang hiện tại, không mở popup
      window.location.href = paymentUrl;
    } catch (err) {
      setProcessing(false);
      const errMsg = err.message || (isEn ? 'Payment error' : 'Lỗi thanh toán');
      const match = errMsg.match(/\((SC-[^\)]+)\)/);
      if (match || errMsg.includes('hóa đơn chờ thanh toán') || errMsg.includes('pending invoice')) {
        const invNum = match ? match[1] : (pendingInvoices.find(p => p.packageId === selectedPkg.id)?.invoiceNumber || null);
        setConflictData({
          invoiceNumber: invNum,
          package: selectedPkg
        });
        setModalOpen(false);
        setConflictModalOpen(true);
      } else {
        showError(errMsg);
      }
    }
  };

  if (loading) return <LoadingSpinner text={isEn ? "Loading membership packages..." : "Đang tải danh mục gói tập..."} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Olympic Packages Masterpiece Banner */}
      <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-brand-sand-700 dark:text-brand-sand-400">card_membership</span>
                OLYMPIC MEMBERSHIP & PACKAGES
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-brand-navy-900/80 backdrop-blur-md text-brand-navy-800 dark:text-brand-navy-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
                {packages.length} {isEn ? 'tiers available' : 'gói tập tiêu chuẩn'}
              </span>
            </div>

            <h1 className="font-chivo text-2xl lg:text-3xl font-black text-white tracking-tight mt-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {isEn ? 'Subscribe & Renew Membership Online' : 'Đăng Ký & Gia Hạn Gói Tập Trực Tuyến'}
            </h1>
            <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl font-medium leading-relaxed drop-shadow-xs">
              {isEn
                ? 'Select the optimal training curriculum for your personal fitness goals. Instant automated online activation.'
                : 'Lựa chọn gói rèn luyện phù hợp với mục tiêu thể lực của bạn. Thanh toán bảo mật và kích hoạt trực tuyến tức thì.'}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-brand-navy-900 px-3.5 py-2 rounded-xl border border-white text-xs font-bold shadow-md backdrop-blur-md">
              <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">verified_user</span>
              <span>{isEn ? 'VNPay / MoMo Secure' : 'Cổng bảo mật VNPay / MoMo'}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-brand-navy-950 hover:bg-brand-navy-900 text-white px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold shadow-lg">
              <span className="material-symbols-outlined text-[18px] text-brand-sand-400">bolt</span>
              <span>{isEn ? 'Instant Activation' : 'Kích hoạt ngay'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pending Invoices Warning Banner */}
      {pendingInvoices.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/20 border border-brand-sand-300 dark:border-brand-sand-800/60 text-brand-sand-900 dark:text-brand-sand-200 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-sand-700 dark:text-brand-sand-400 text-[24px]">pending_actions</span>
            <span className="font-chivo font-black text-sm uppercase tracking-wide">
              {isEn ? 'You Have Pending Invoices Awaiting Payment' : 'Bạn Có Hóa Đơn Đang Chờ Thanh Toán'}
            </span>
          </div>
          <p className="text-xs text-brand-sand-800 dark:text-brand-sand-300 leading-relaxed">
            {isEn
              ? 'If you initiated a subscription without completing payment, you can resume payment immediately or cancel the pending invoice to pick a new tier.'
              : 'Nếu bạn đã tạo yêu cầu đăng ký trước đó nhưng chưa hoàn tất giao dịch, bạn có thể tiếp tục thanh toán hoặc hủy hóa đơn để chọn gói tập khác.'}
          </p>
          <div className="space-y-2 pt-1">
            {pendingInvoices.map(inv => {
              const matchedPkg = packages.find(p => p.id === inv.packageId);
              return (
                <div key={inv.invoiceNumber} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-brand-navy-900 p-3.5 rounded-xl border border-brand-sand-200 dark:border-brand-sand-800/40 shadow-2xs">
                  <div className="text-xs space-y-0.5">
                    <div className="font-black text-brand-navy-900 dark:text-white text-sm">
                      {isEn ? 'Package: ' : 'Gói: '}{translatePackageName(inv.packageName, isEn)}
                    </div>
                    <div className="text-brand-navy-500 dark:text-brand-navy-400 flex items-center gap-2">
                      <span className="font-bold text-brand-terra-700 dark:text-brand-terra-400 font-chivo text-xs">{inv.amount?.toLocaleString()} VNĐ</span>
                      <span>•</span>
                      <span className="font-mono bg-brand-navy-100 dark:bg-brand-navy-800 px-2 py-0.5 rounded text-[11px] text-brand-navy-700 dark:text-brand-navy-300">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCheckOrSyncPending(inv.invoiceNumber)}
                      disabled={syncingInvoice === inv.invoiceNumber}
                      className="px-3 py-2 text-xs font-bold font-chivo uppercase rounded-xl border border-brand-navy-300 dark:border-brand-navy-800 text-brand-navy-800 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-950/30 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-[15px] ${syncingInvoice === inv.invoiceNumber ? 'animate-spin' : ''}`}>sync</span>
                      <span>{syncingInvoice === inv.invoiceNumber ? (isEn ? 'Checking...' : 'Đang kiểm tra...') : (isEn ? 'Check / Sync' : 'Kiểm Tra / Đồng Bộ')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelPending(inv.invoiceNumber)}
                      disabled={cancelling}
                      className="px-3 py-2 text-xs font-bold font-chivo uppercase rounded-xl border border-brand-danger-300 dark:border-brand-danger-800 text-brand-danger-600 dark:text-brand-danger-400 hover:bg-brand-danger-50 dark:hover:bg-brand-danger-950/30 transition cursor-pointer"
                    >
                      {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel Invoice' : 'Hủy Hóa Đơn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(matchedPkg || { id: inv.packageId, name: inv.packageName, price: inv.amount, durationDays: inv.durationDays }, inv.invoiceNumber)}
                      className="px-4 py-2 text-xs font-bold font-chivo uppercase rounded-xl bg-brand-sand-700 hover:bg-brand-sand-800 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Active Package Card (Olympic Pass Membership Visual) */}
      <div className="scms-hero p-6 rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent blur-3xl" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-brand-navy-950/25 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-brand-sand-300">workspace_premium</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-brand-navy-900/90 text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
                {isEn ? 'Active Membership Tier' : 'GÓI TẬP HIỆN TẠI ĐANG SỬ DỤNG'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-brand-sage-400 text-brand-navy-950 text-[10px] font-black tracking-wider uppercase shadow-xs">
                ACTIVE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-chivo text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
              {translatePackageName(currentUser?.packageName, isEn) || (isEn ? 'No active package' : 'Chưa có gói tập')}
            </h2>
            <p className="text-xs text-white/90 font-medium max-w-2xl drop-shadow-xs">
              {isEn ? 'Full privilege rights apply to all enrolled class schedules & center facilities.' : 'Đặc quyền hội viên áp dụng cho toàn bộ lịch học và dịch vụ thể thao của trung tâm.'}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 self-start md:self-center shrink-0">
          <div className="text-xs text-white bg-white/20 px-4 py-2.5 rounded-2xl border border-white/30 backdrop-blur-md flex items-center gap-2.5 shadow-xs">
            <span className="material-symbols-outlined text-[20px] text-brand-sand-300">event_available</span>
            <div>
              <span className="text-[10px] text-white/80 uppercase font-bold tracking-wider block">{isEn ? 'Valid Until' : 'Thời hạn sử dụng'}</span>
              <strong className="text-white text-sm font-chivo font-black">{formatMemberDate(currentUser?.packageExpiry, isEn) || (isEn ? 'N/A' : 'Chưa kích hoạt')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Queued / Scheduled Package Banner */}
      {currentUser?.scheduledSubscriptions?.length > 0 && (
        <div className="rounded-2xl border border-brand-sage-200 dark:border-brand-sage-800/60 bg-gradient-to-r from-brand-sage-50 via-brand-teal-50 to-brand-sage-50 dark:from-brand-sage-950/20 dark:via-brand-teal-950/20 dark:to-brand-sage-950/20 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-sage-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px]">update</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-brand-sage-950 dark:text-brand-sage-200 font-chivo">
                {isEn ? 'Paid Package Queued For Seamless Continuation' : 'Gói Đã Thanh Toán • Chờ Ngày Kích Hoạt Nối Tiếp'}
              </h2>
              <p className="text-xs text-brand-sage-800 dark:text-brand-sage-300">
                {isEn
                  ? 'Your upcoming cycle is paid and will activate automatically the moment your current tier expires.'
                  : 'Gói tập mới sẽ tự động kích hoạt liền mạch ngay sau khi gói hiện tại kết thúc mà không bị gián đoạn.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {currentUser.scheduledSubscriptions.map(subscription => (
              <div
                key={subscription.subscriptionId}
                className="bg-white dark:bg-brand-navy-900 p-3.5 rounded-xl border border-brand-sage-200 dark:border-brand-sage-800/40 flex items-center justify-between text-xs shadow-2xs"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-sage-700 dark:text-brand-sage-400 block">
                    {isEn ? 'Upcoming Cycle' : 'Chu kỳ kế tiếp'}
                  </span>
                  <strong className="text-brand-navy-900 dark:text-white font-black text-sm">
                    {translatePackageName(subscription.packageName, isEn)}
                  </strong>
                </div>
                <div className="text-right text-[11px] font-mono text-brand-navy-600 dark:text-brand-navy-300 bg-brand-navy-100 dark:bg-brand-navy-800 px-2.5 py-1 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700">
                  {formatMemberDate(subscription.startDate, isEn)} ➜ {formatMemberDate(subscription.endDate, isEn)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Tier Cards Grid */}
      <section className="space-y-5" aria-labelledby="package-tiers-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="package-tiers-heading" className="font-chivo text-lg sm:text-xl font-black text-brand-navy-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-brand-sage-700 dark:text-brand-sage-400" aria-hidden="true">fitness_center</span>
            <span>{isEn ? 'Available Membership Tiers' : 'Bảng Giá Các Gói Rèn Luyện & Đào Tạo'}</span>
          </h2>
          <span className="text-sm font-medium text-brand-navy-600 dark:text-brand-navy-300">
            {packages.length} {isEn ? 'tiers available' : 'gói tập tiêu chuẩn'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch pt-3">
          {packages.map((pkg, index) => {
            const isCurrent = currentUser?.packageId === pkg.id && currentUser?.packageStatus === 'ACTIVE';
            const isQueued = currentUser?.scheduledSubscriptions?.some(
              s => s.packageId === pkg.id || (s.packageName && s.packageName === pkg.name)
            );
            const pendingInv = pendingInvoices.find(p => p.packageId === pkg.id);
            const isVip = pkg.badge === 'VIP OLYMPIC' || (pkg.name && (pkg.name.toLowerCase().includes('olympic') || pkg.name.toLowerCase().includes('vip')));
            const isPro = pkg.name && pkg.name.toLowerCase().includes('pro');
            const perks = getPackagePerks(pkg, isEn);
            const monthlyEquiv = getMonthlyEquivalent(pkg.price, pkg.durationDays, isEn);

            // Three looks: premium (navy + sand), featured (solid sage), standard (white).
            const tone = isVip
              ? {
                  card: 'bg-brand-navy-900 dark:bg-brand-navy-950 border-brand-sand-300/50',
                  title: 'text-white',
                  muted: 'text-brand-navy-200',
                  meta: 'bg-white/10 text-brand-sand-200',
                  pill: 'bg-white/10 text-brand-navy-100',
                  pillStrong: 'text-white',
                  pillIcon: 'text-brand-sand-300',
                  check: 'text-brand-sand-300',
                  divider: 'bg-white/10',
                  cta: 'bg-brand-sand-300 hover:bg-brand-sand-400 text-brand-navy-950'
                }
              : isPro
              ? {
                  card: 'bg-brand-sage-700 dark:bg-brand-sage-900 border-brand-sage-700 dark:border-brand-sage-700',
                  title: 'text-white',
                  muted: 'text-brand-sage-100',
                  meta: 'bg-white/15 text-white',
                  pill: 'bg-white/10 text-white',
                  pillStrong: 'text-white',
                  pillIcon: 'text-brand-sand-300',
                  check: 'text-brand-sand-300',
                  divider: 'bg-white/15',
                  cta: 'bg-brand-sand-50 hover:bg-brand-sand-200 text-brand-sage-900'
                }
              : {
                  card: 'bg-white dark:bg-brand-navy-900 border-brand-navy-200 dark:border-brand-navy-800',
                  title: 'text-brand-navy-900 dark:text-white',
                  muted: 'text-brand-navy-600 dark:text-brand-navy-300',
                  meta: 'bg-brand-sand-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-200',
                  pill: 'bg-brand-sand-50 dark:bg-brand-navy-800/70 text-brand-navy-700 dark:text-brand-navy-300',
                  pillStrong: 'text-brand-navy-900 dark:text-white',
                  pillIcon: 'text-brand-teal-700 dark:text-brand-teal-400',
                  check: 'text-brand-sage-700 dark:text-brand-sage-400',
                  divider: 'bg-brand-navy-100 dark:bg-brand-navy-800',
                  cta: 'bg-brand-navy-900 hover:bg-brand-navy-800 text-white dark:bg-brand-sage-500 dark:text-brand-navy-950 dark:hover:bg-brand-sage-400'
                };
            const stateRing = isQueued
              ? 'ring-4 ring-brand-sage-400/40'
              : isCurrent
              ? 'ring-4 ring-brand-sage-500/40'
              : '';

            return (
              <article
                key={pkg.id}
                style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
                className={`group relative flex flex-col rounded-3xl border p-6 sm:p-7 animate-fade-slide-up transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-24px_rgb(var(--brand-navy-900)/0.45)] ${tone.card} ${stateRing}`}
              >
                {/* Top badge indicators */}
                <div className="absolute -top-3.5 left-6 right-6 flex items-center justify-between gap-2 pointer-events-none">
                  {isQueued ? (
                    <span className="px-3 py-1 rounded-full bg-brand-sage-700 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">check_circle</span>
                      <span>{isEn ? 'QUEUED' : 'ĐÃ ĐẶT NỐI TIẾP'}</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="px-3 py-1 rounded-full bg-brand-sage-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-sage-300 animate-pulse" />
                      <span>{isEn ? 'CURRENT ACTIVE' : 'GÓI ĐANG DÙNG'}</span>
                    </span>
                  ) : isVip ? (
                    <span className="px-3 py-1 rounded-full bg-brand-sand-300 text-brand-navy-950 text-xs font-bold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">hotel_class</span>
                      <span>{isEn ? 'BEST VALUE • OLYMPIC' : '★ TOÀN NĂNG OLYMPIC'}</span>
                    </span>
                  ) : isPro ? (
                    <span className="px-3 py-1 rounded-full bg-brand-navy-900 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-brand-sand-300" aria-hidden="true">local_fire_department</span>
                      <span>{isEn ? 'MOST POPULAR' : 'PHỔ BIẾN NHẤT'}</span>
                    </span>
                  ) : <span />}

                  {pendingInv && (
                    <span className="px-2.5 py-1 rounded-full bg-brand-sand-700 text-white text-xs font-bold shadow-sm">
                      {isEn ? 'PENDING' : 'CHỜ TT'}
                    </span>
                  )}
                </div>

                {/* Name, duration and price */}
                <div className="pt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${tone.meta}`}>
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">calendar_month</span>
                    {pkg.durationDays} {isEn ? 'Days' : 'Ngày rèn luyện'}
                  </span>

                  <h3 className={`mt-3 font-chivo text-xl font-black leading-tight ${tone.title}`}>
                    {translatePackageName(pkg.name, isEn)}
                  </h3>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className={`font-chivo text-4xl font-black tracking-tight tabular-nums ${tone.title}`}>
                      {pkg.price.toLocaleString()}đ
                    </span>
                    <span className={`text-sm font-medium ${tone.muted}`}>{isEn ? '/ package' : '/ gói'}</span>
                  </div>
                  {monthlyEquiv && (
                    <p className={`mt-1 text-sm font-semibold tabular-nums ${tone.muted}`}>{monthlyEquiv}</p>
                  )}

                  {/* Sport allowance */}
                  <div className={`mt-5 px-3.5 py-3 rounded-2xl text-sm flex items-center gap-2.5 ${tone.pill}`}>
                    <span className={`material-symbols-outlined text-[20px] shrink-0 ${tone.pillIcon}`} aria-hidden="true">sports</span>
                    <span>
                      {isEn ? 'Applicable sports: ' : 'Môn áp dụng: '}
                      <strong className={`font-bold ${tone.pillStrong}`}>
                        {resolveAllowedSports(pkg) >= 10 ? (isEn ? 'All 10 Sports (All-Access)' : 'Toàn bộ 10 môn (All-Access)') : (isEn ? `${resolveAllowedSports(pkg)} elective sports` : `${resolveAllowedSports(pkg)} môn tự chọn`)}
                      </strong>
                    </span>
                  </div>

                  <p className={`mt-4 text-sm leading-relaxed ${tone.muted}`}>{pkg.description}</p>
                </div>

                {/* Included privileges */}
                <div className="mt-5 flex-1">
                  <div className={`h-0.5 rounded-full ${tone.divider}`} aria-hidden="true" />
                  <p className={`mt-4 mb-2.5 text-sm font-bold ${tone.title}`}>
                    {isEn ? 'Included privileges:' : 'Đặc quyền bao gồm:'}
                  </p>
                  <ul className="space-y-2.5">
                    {perks.map((feat, idx) => (
                      <li key={idx} className={`flex items-start gap-2.5 text-sm leading-snug ${tone.muted}`}>
                        <span className={`material-symbols-outlined text-[18px] shrink-0 ${tone.check}`} aria-hidden="true">check_circle</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <div className="mt-7">
                  {pendingInv ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleOpenCheckout(pkg, pendingInv.invoiceNumber)}
                        className="scms-shine w-full min-h-12 rounded-2xl font-chivo text-sm font-bold bg-brand-sand-700 hover:bg-brand-sand-800 text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sand-300 focus-visible:ring-offset-2"
                      >
                        {isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}
                      </button>
                      <button
                        onClick={() => handleCancelPending(pendingInv.invoiceNumber)}
                        disabled={cancelling}
                        className={`w-full min-h-10 rounded-2xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 ${isVip || isPro ? 'text-white hover:bg-white/10' : 'text-brand-danger-700 dark:text-brand-danger-300 hover:bg-brand-danger-50 dark:hover:bg-brand-danger-950/40'}`}
                      >
                        {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel Invoice' : 'Hủy Hóa Đơn Này')}
                      </button>
                    </div>
                  ) : isQueued ? (
                    <button
                      disabled
                      className="w-full min-h-12 rounded-2xl font-chivo text-sm font-bold bg-brand-sage-100 dark:bg-brand-sage-950/60 text-brand-sage-800 dark:text-brand-sage-300 cursor-default flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>
                      <span>{isEn ? 'Queued Sequentially' : 'Đã Đặt Nối Tiếp'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCheckout(pkg)}
                      className={`scms-shine w-full min-h-12 rounded-2xl font-chivo text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sand-300 focus-visible:ring-offset-2 active:scale-[0.98] ${
                        isCurrent && !isVip && !isPro ? 'bg-brand-sage-700 hover:bg-brand-sage-800 text-white' : tone.cta
                      }`}
                    >
                      <span>{isCurrent ? (isEn ? 'Renew Another Cycle' : 'Gia Hạn Thêm Chu Kỳ') : (isEn ? 'Subscribe Now' : 'Đăng Ký Gói Này')}</span>
                      <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1" aria-hidden="true">arrow_forward</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Checkout Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeInvoiceNumber ? (isEn ? "Continue Paying Pending Invoice" : "Tiếp Tục Thanh Toán Hóa Đơn Chờ") : (isEn ? "Online Membership Subscription" : "Thanh Toán Trực Tuyến Gói Tập")}
        maxWidth="max-w-lg"
      >
        {selectedPkg && (
          <div className="space-y-4">
            {activeInvoiceNumber && (
              <div className="p-3 rounded-xl bg-brand-sand-50 border border-brand-sand-200 text-xs text-brand-sand-900 flex items-center justify-between">
                <span>{isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong className="font-mono">{activeInvoiceNumber}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCancelPending(activeInvoiceNumber)}
                  disabled={cancelling}
                  className="text-brand-danger-600 font-bold hover:underline cursor-pointer"
                >
                  {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel this invoice' : 'Hủy hóa đơn này')}
                </button>
              </div>
            )}

            {/* Selected Package Details Box */}
            <div className="p-4 rounded-2xl bg-brand-navy-50 border border-brand-navy-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-brand-navy-500">{isEn ? 'Selected package:' : 'Gói đăng ký:'}</span>
                <span className="font-bold text-brand-navy-900 text-sm">{translatePackageName(selectedPkg.name, isEn)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-navy-500">{isEn ? 'Duration:' : 'Thời hạn sử dụng:'}</span>
                <span className="font-bold text-brand-navy-900">{selectedPkg.durationDays} {isEn ? 'days' : 'ngày rèn luyện'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-brand-navy-200 dark:border-brand-navy-700">
                <span className="text-brand-navy-700 font-bold">{isEn ? 'Total payment amount:' : 'Tổng số tiền thanh toán:'}</span>
                <span className="text-xl font-black text-brand-terra-500 font-chivo">{selectedPkg.price?.toLocaleString()} VNĐ</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-2">
                {isEn ? 'Select payment gateway *' : 'Chọn cổng thanh toán trực tuyến *'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['VNPAY', 'MOMO'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`p-3.5 rounded-2xl border text-xs font-chivo font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-brand-navy-900 text-white border-brand-navy-900 shadow-md ring-2 ring-brand-sage-500/60'
                        : 'border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {m === 'MOMO' ? 'account_balance_wallet' : 'credit_card'}
                    </span>
                    <span>{m === 'VNPAY' ? 'Cổng VNPAY (ATM/QR)' : 'Ví Điện Tử MoMo'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Safe Payment Notice */}
            <div className="p-3.5 rounded-2xl bg-brand-teal-50 dark:bg-brand-teal-950/30 text-brand-teal-900 dark:text-brand-teal-200 text-xs flex items-start gap-2.5 border border-brand-teal-100 dark:border-brand-teal-900/50">
              <span className="material-symbols-outlined text-[20px] text-brand-teal-700 dark:text-brand-teal-400 shrink-0 mt-0.5">verified_user</span>
              <p className="leading-relaxed">
                {isEn
                  ? 'Payment window will open in a secure tab. You will be redirected back upon completion, and your membership will activate immediately.'
                  : 'Cửa sổ thanh toán sẽ mở trong tab an toàn. Hệ thống tự động ghi nhận và kích hoạt thời hạn thẻ tập ngay sau khi nhận phản hồi từ cổng thanh toán.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 cursor-pointer"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscribe}
                disabled={processing}
                className="px-6 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {processing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>{isEn ? 'Connecting Gateway...' : 'Đang Kết Nối Cổng...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>{isEn ? 'Confirm Payment' : 'Xác Nhận Thanh Toán'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Conflict Resolution Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title={isEn ? "Pending Invoice Exists For This Package" : "Đã Có Hóa Đơn Chờ Cho Gói Này"}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/20 border border-brand-sand-200 dark:border-brand-sand-800 text-xs text-brand-sand-900 dark:text-brand-sand-200 space-y-2">
            <p className="font-semibold text-brand-navy-800 dark:text-white">
              {isEn ? 'You have a pending invoice for package' : 'Bạn đang có một hóa đơn chờ thanh toán cho gói'}{' '}
              <strong>{translatePackageName(conflictData?.package?.name, isEn)}</strong>.
            </p>
            {conflictData?.invoiceNumber && (
              <p className="text-brand-navy-600 dark:text-brand-navy-400">
                {isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong className="font-mono text-brand-navy-900 dark:text-white">{conflictData.invoiceNumber}</strong>
              </p>
            )}
            <p className="text-brand-navy-500 dark:text-brand-navy-400 mt-1">
              {isEn ? 'You can continue paying this invoice or cancel it to start over.' : 'Bạn có thể tiếp tục thanh toán hóa đơn này hoặc hủy đi để thao tác lại từ đầu.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              type="button"
              onClick={() => setConflictModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 cursor-pointer"
            >
              {isEn ? 'Later' : 'Để Sau'}
            </button>
            {conflictData?.invoiceNumber && (
              <button
                type="button"
                onClick={() => handleCancelPending(conflictData.invoiceNumber)}
                disabled={cancelling}
                className="px-4 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-xl border border-brand-danger-300 dark:border-brand-danger-800 text-brand-danger-600 dark:text-brand-danger-400 hover:bg-brand-danger-50 dark:hover:bg-brand-danger-950/30 transition cursor-pointer"
              >
                {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel This Invoice' : 'Hủy Hóa Đơn Chờ Này')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setConflictModalOpen(false);
                handleOpenCheckout(conflictData?.package, conflictData?.invoiceNumber);
              }}
              className="px-5 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white shadow-sm transition cursor-pointer"
            >
              {isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
