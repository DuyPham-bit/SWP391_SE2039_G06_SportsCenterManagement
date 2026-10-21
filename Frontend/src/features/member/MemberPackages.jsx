import React, { useState, useEffect, useRef } from 'react';
import { packageApi, memberApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { openPaymentCheckout } from '../../services/paymentCheckout.js';
import { formatMemberDate } from './memberOverview.js';
import { translatePackageName } from '../../services/i18nHelper.js';

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
      'Toàn quyền sử dụng 15 bộ môn và 8 sàn thi đấu Olympic quốc tế',
      'Không giới hạn số buổi tập và thời gian trong suốt 365 ngày',
      'Đặc quyền phòng VIP Lounge, khăn tập cao cấp & đồ uống thể thao',
      'Ưu tiên đặt lịch số 1, quyền bảo lưu gói tập lên đến 60 ngày'
    ],
    en: [
      'Unlimited all-access to 15 Olympic sports & 8 international courts',
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

export function MemberPackages() {
  const { currentUser, refreshUser } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const checkoutRef = useRef(null);

  const [packages, setPackages] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return () => {
      checkoutRef.current?.dispose();
      checkoutRef.current = null;
    };
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

  const handleConfirmSubscribe = async () => {
    if (!selectedPkg || !currentUser || processing || checkoutRef.current) return;

    setProcessing(true);
    let checkout = null;
    try {
      checkout = openPaymentCheckout(({ cancelled, failed, closed }) => {
        checkoutRef.current = null;
        setProcessing(false);
        if (cancelled) showWarning(isEn ? 'Payment cancelled. You can continue selecting a package or pay pending invoice.' : 'Đã hủy thanh toán. Bạn có thể tiếp tục chọn gói tập hoặc thanh toán hóa đơn chờ.');
        else if (failed) showWarning(isEn ? 'Cannot confirm payment yet. Please verify your invoice status before retrying.' : 'Chưa thể xác nhận thanh toán. Vui lòng kiểm tra trạng thái hóa đơn trước khi thử lại.');
        else if (closed) showInfo(isEn ? 'Payment window closed. Updating invoice status...' : 'Đã đóng cửa sổ thanh toán. Đang cập nhật trạng thái hóa đơn.');
        else showInfo(isEn ? 'Returned to packages page. Payment status is updated from the system.' : 'Đã quay lại trang gói tập. Trạng thái thanh toán được cập nhật từ hệ thống.');
        loadData();
        refreshUser().catch(error => showError(error.message || (isEn ? 'Cannot update package information.' : 'Không thể cập nhật thông tin gói tập.')));
      });
      checkoutRef.current = checkout;
      const res = await memberApi.subscribeOnline({
        memberId: currentUser.id,
        packageId: selectedPkg.id,
        paymentMethod,
        invoiceNumber: activeInvoiceNumber || undefined
      });
      if (checkoutRef.current !== checkout) return;
      if (!res.paymentUrl) throw new Error(isEn ? 'Could not generate payment link.' : 'Không thể tạo liên kết thanh toán. Vui lòng thử lại sau.');
      if (checkout.navigate(res.paymentUrl)) setModalOpen(false);
    } catch (err) {
      if (checkout && checkoutRef.current !== checkout) return;
      checkoutRef.current?.dispose();
      checkoutRef.current = null;
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
    } finally {
      if (!checkoutRef.current) setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner text={isEn ? "Loading membership packages..." : "Đang tải danh mục gói tập..."} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* 1. Olympic Packages Masterpiece Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 overflow-hidden">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/30 rounded-full blur-3xl pointer-events-none" />
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
              <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[13px] text-amber-500">card_membership</span>
                OLYMPIC MEMBERSHIP & PACKAGES
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-slate-200 border border-white/80 dark:border-white/20 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            <span className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-900 px-3.5 py-2 rounded-xl border border-white text-xs font-bold shadow-md backdrop-blur-md">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">verified_user</span>
              <span>{isEn ? 'VNPay / MoMo Secure' : 'Cổng bảo mật VNPay / MoMo'}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl border border-white/20 text-xs font-bold shadow-lg">
              <span className="material-symbols-outlined text-[18px] text-amber-400">bolt</span>
              <span>{isEn ? 'Instant Activation' : 'Kích hoạt ngay'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pending Invoices Warning Banner */}
      {pendingInvoices.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[24px]">pending_actions</span>
            <span className="font-chivo font-black text-sm uppercase tracking-wide">
              {isEn ? 'You Have Pending Invoices Awaiting Payment' : 'Bạn Có Hóa Đơn Đang Chờ Thanh Toán'}
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            {isEn
              ? 'If you initiated a subscription without completing payment, you can resume payment immediately or cancel the pending invoice to pick a new tier.'
              : 'Nếu bạn đã tạo yêu cầu đăng ký trước đó nhưng chưa hoàn tất giao dịch, bạn có thể tiếp tục thanh toán hoặc hủy hóa đơn để chọn gói tập khác.'}
          </p>
          <div className="space-y-2 pt-1">
            {pendingInvoices.map(inv => {
              const matchedPkg = packages.find(p => p.id === inv.packageId);
              return (
                <div key={inv.invoiceNumber} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40 shadow-2xs">
                  <div className="text-xs space-y-0.5">
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      {isEn ? 'Package: ' : 'Gói: '}{translatePackageName(inv.packageName, isEn)}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span className="font-bold text-[#E07A5F] font-chivo text-xs">{inv.amount?.toLocaleString()} VNĐ</span>
                      <span>•</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCancelPending(inv.invoiceNumber)}
                      disabled={cancelling}
                      className="px-3 py-2 text-xs font-bold font-chivo uppercase rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                    >
                      {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel Invoice' : 'Hủy Hóa Đơn')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(matchedPkg || { id: inv.packageId, name: inv.packageName, price: inv.amount, durationDays: inv.durationDays }, inv.invoiceNumber)}
                      className="px-4 py-2 text-xs font-bold font-chivo uppercase rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Active Package Card (Olympic Pass Membership Visual) */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#2F7B5D] via-[#24828F] via-[#3FAEB8] to-[#E5A33C] dark:from-[#184534] dark:via-[#144850] dark:via-[#1B5760] dark:to-[#5E4014] text-white border border-white/30 dark:border-white/10 shadow-xl shadow-[#24828F]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-br from-[#F2CC8F]/45 via-[#E5A33C]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-slate-950/25 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px] text-amber-300">workspace_premium</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-[#1B4332] dark:text-emerald-300 border border-white/80 dark:border-white/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isEn ? 'Active Membership Tier' : 'GÓI TẬP HIỆN TẠI ĐANG SỬ DỤNG'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-xs">
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
            <span className="material-symbols-outlined text-[20px] text-amber-300">event_available</span>
            <div>
              <span className="text-[10px] text-white/80 uppercase font-bold tracking-wider block">{isEn ? 'Valid Until' : 'Thời hạn sử dụng'}</span>
              <strong className="text-white text-sm font-chivo font-black">{formatMemberDate(currentUser?.packageExpiry, isEn) || (isEn ? 'N/A' : 'Chưa kích hoạt')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Queued / Scheduled Package Banner */}
      {currentUser?.scheduledSubscriptions?.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-emerald-950/20 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px]">update</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-emerald-950 dark:text-emerald-200 font-chivo">
                {isEn ? 'Paid Package Queued For Seamless Continuation' : 'Gói Đã Thanh Toán • Chờ Ngày Kích Hoạt Nối Tiếp'}
              </h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
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
                className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between text-xs shadow-2xs"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                    {isEn ? 'Upcoming Cycle' : 'Chu kỳ kế tiếp'}
                  </span>
                  <strong className="text-slate-900 dark:text-white font-black text-sm">
                    {translatePackageName(subscription.packageName, isEn)}
                  </strong>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  {formatMemberDate(subscription.startDate, isEn)} ➜ {formatMemberDate(subscription.endDate, isEn)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Tier Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-chivo flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A]">fitness_center</span>
            <span>{isEn ? 'Available Membership Tiers' : 'Bảng Giá Các Gói Rèn Luyện & Đào Tạo'}</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {packages.length} {isEn ? 'tiers available' : 'gói tập tiêu chuẩn'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {packages.map(pkg => {
            const isCurrent = currentUser?.packageId === pkg.id && currentUser?.packageStatus === 'ACTIVE';
            const isQueued = currentUser?.scheduledSubscriptions?.some(
              s => s.packageId === pkg.id || (s.packageName && s.packageName === pkg.name)
            );
            const pendingInv = pendingInvoices.find(p => p.packageId === pkg.id);
            const isVip = pkg.badge === 'VIP OLYMPIC' || (pkg.name && (pkg.name.toLowerCase().includes('olympic') || pkg.name.toLowerCase().includes('vip')));
            const isPro = pkg.name && pkg.name.toLowerCase().includes('pro');
            const perks = getPackagePerks(pkg, isEn);
            const monthlyEquiv = getMonthlyEquivalent(pkg.price, pkg.durationDays, isEn);

            return (
              <div
                key={pkg.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative border ${
                  isQueued
                    ? 'border-emerald-400 ring-2 ring-emerald-400/25 dark:border-emerald-500'
                    : isCurrent
                    ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/20 dark:border-[#81B29A]'
                    : isVip
                    ? 'border-[#F2CC8F] ring-2 ring-[#F2CC8F]/30 dark:border-[#F2CC8F]/50 bg-gradient-to-b from-[#FFFDF9] to-white dark:from-slate-900 dark:to-slate-900'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Top Badge Indicators */}
                <div className="absolute -top-3 left-6 right-6 flex items-center justify-between pointer-events-none">
                  {isQueued ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-chivo text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      <span>{isEn ? 'QUEUED' : 'ĐÃ ĐẶT NỐI TIẾP'}</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="px-3 py-1 rounded-full bg-[#2D6A4F] text-white font-chivo text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{isEn ? 'CURRENT ACTIVE' : 'GÓI ĐANG DÙNG'}</span>
                    </span>
                  ) : isVip ? (
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#D4A373] via-[#F2CC8F] to-[#E07A5F] text-[#1E2235] font-chivo text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">hotel_class</span>
                      <span>{isEn ? 'BEST VALUE • OLYMPIC' : '★ TOÀN NĂNG OLYMPIC'}</span>
                    </span>
                  ) : isPro ? (
                    <span className="px-3 py-1 rounded-full bg-[#81B29A] text-white font-chivo text-[10px] font-black uppercase tracking-wider shadow-sm">
                      {isEn ? 'MOST POPULAR' : 'PHỔ BIẾN NHẤT'}
                    </span>
                  ) : null}

                  {pendingInv && (
                    <span className="ml-auto px-2 py-0.5 rounded bg-amber-500 text-white font-chivo text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {isEn ? 'PENDING' : 'CHỜ TT'}
                    </span>
                  )}
                </div>

                {/* Card Content Top */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    <span>{pkg.durationDays} {isEn ? 'Days' : 'Ngày rèn luyện'}</span>
                    {monthlyEquiv && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 normal-case font-chivo">
                        {monthlyEquiv}
                      </span>
                    )}
                  </div>

                  <h3 className="font-chivo text-xl font-black text-slate-900 dark:text-white leading-tight">
                    {translatePackageName(pkg.name, isEn)}
                  </h3>

                  {/* Price Block */}
                  <div className="mt-3 mb-4 flex items-baseline gap-1">
                    <span className="font-chivo text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {pkg.price.toLocaleString()}đ
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {isEn ? '/ package' : '/ gói'}
                    </span>
                  </div>

                  {/* Sport Allowance Pill */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-300 font-bold mb-3.5 border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400">sports</span>
                    <span>
                      {isEn ? 'Applicable sports: ' : 'Môn áp dụng: '}
                      <strong className="text-slate-900 dark:text-white">
                        {pkg.allowedSports === 15 ? (isEn ? 'Full 15 Olympic Sports' : 'Toàn quyền 15 môn Olympic') : (isEn ? `${pkg.allowedSports} elective sports` : `${pkg.allowedSports} môn tự chọn`)}
                      </strong>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 min-h-[36px]">
                    {pkg.description}
                  </p>

                  {/* Feature Checkmarks List */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mb-6 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {isEn ? 'Included privileges:' : 'Đặc quyền bao gồm:'}
                    </span>
                    {perks.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-snug">
                        <span className="material-symbols-outlined text-[#81B29A] text-[16px] shrink-0 mt-0.5">check_circle</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Button Bottom */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {pendingInv ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleOpenCheckout(pkg, pendingInv.invoiceNumber)}
                        className="w-full py-3 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all cursor-pointer"
                      >
                        {isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}
                      </button>
                      <button
                        onClick={() => handleCancelPending(pendingInv.invoiceNumber)}
                        disabled={cancelling}
                        className="w-full py-2 rounded-xl font-chivo text-[11px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                      >
                        {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel Invoice' : 'Hủy Hóa Đơn Này')}
                      </button>
                    </div>
                  ) : isQueued ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-default flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>{isEn ? 'Queued Sequentially' : 'Đã Đặt Nối Tiếp'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCheckout(pkg)}
                      className={`w-full py-3 rounded-xl font-chivo text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-[#2D6A4F] text-white hover:bg-[#1B4332] hover:shadow-md'
                          : isVip
                          ? 'bg-gradient-to-r from-[#1E2235] via-[#2B2D42] to-[#1E2235] text-[#F2CC8F] hover:text-white border border-[#F2CC8F]/50 hover:border-[#F2CC8F] hover:shadow-lg'
                          : 'bg-[#1E2235] hover:bg-[#2B2D42] text-white hover:shadow-md dark:bg-[#81B29A] dark:text-slate-950 dark:hover:bg-[#6FA088]'
                      }`}
                    >
                      <span>{isCurrent ? (isEn ? 'Renew Another Cycle' : 'Gia Hạn Thêm Chu Kỳ') : (isEn ? 'Subscribe Now' : 'Đăng Ký Gói Này')}</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>{isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong className="font-mono">{activeInvoiceNumber}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCancelPending(activeInvoiceNumber)}
                  disabled={cancelling}
                  className="text-red-600 font-bold hover:underline cursor-pointer"
                >
                  {cancelling ? (isEn ? 'Cancelling...' : 'Đang hủy...') : (isEn ? 'Cancel this invoice' : 'Hủy hóa đơn này')}
                </button>
              </div>
            )}

            {/* Selected Package Details Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{isEn ? 'Selected package:' : 'Gói đăng ký:'}</span>
                <span className="font-bold text-slate-900 text-sm">{translatePackageName(selectedPkg.name, isEn)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{isEn ? 'Duration:' : 'Thời hạn sử dụng:'}</span>
                <span className="font-bold text-slate-900">{selectedPkg.durationDays} {isEn ? 'days' : 'ngày rèn luyện'}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-700 font-bold">{isEn ? 'Total payment amount:' : 'Tổng số tiền thanh toán:'}</span>
                <span className="text-xl font-black text-[#E07A5F] font-chivo">{selectedPkg.price?.toLocaleString()} VNĐ</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
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
                        ? 'bg-[#1E2235] text-white border-[#1E2235] shadow-md ring-2 ring-[#81B29A]/60'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-2.5 border border-blue-100 dark:border-blue-900/50">
              <span className="material-symbols-outlined text-[20px] text-blue-600 shrink-0 mt-0.5">verified_user</span>
              <p className="leading-relaxed">
                {isEn
                  ? 'Payment window will open in a secure tab. You will be redirected back upon completion, and your membership will activate immediately.'
                  : 'Cửa sổ thanh toán sẽ mở trong tab an toàn. Hệ thống tự động ghi nhận và kích hoạt thời hạn thẻ tập ngay sau khi nhận phản hồi từ cổng thanh toán.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {isEn ? 'Close' : 'Đóng'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscribe}
                disabled={processing}
                className="px-6 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                {processing ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    <span>{isEn ? 'Connecting Gateway...' : 'Đang Kết Nối Cổng...'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span>{isEn ? 'Confirm & Pay' : 'Xác Nhận & Thanh Toán'}</span>
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
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-semibold text-slate-800 dark:text-white">
              {isEn ? 'You have a pending invoice for package' : 'Bạn đang có một hóa đơn chờ thanh toán cho gói'}{' '}
              <strong>{translatePackageName(conflictData?.package?.name, isEn)}</strong>.
            </p>
            {conflictData?.invoiceNumber && (
              <p className="text-slate-600 dark:text-slate-400">
                {isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong className="font-mono text-slate-900 dark:text-white">{conflictData.invoiceNumber}</strong>
              </p>
            )}
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {isEn ? 'You can continue paying this invoice or cancel it to start over.' : 'Bạn có thể tiếp tục thanh toán hóa đơn này hoặc hủy đi để thao tác lại từ đầu.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setConflictModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {isEn ? 'Later' : 'Để Sau'}
            </button>
            {conflictData?.invoiceNumber && (
              <button
                type="button"
                onClick={() => handleCancelPending(conflictData.invoiceNumber)}
                disabled={cancelling}
                className="px-4 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
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
              className="px-5 py-2.5 text-xs font-bold font-chivo uppercase tracking-wider rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm transition cursor-pointer"
            >
              {isEn ? 'Continue Payment' : 'Tiếp Tục Thanh Toán'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
