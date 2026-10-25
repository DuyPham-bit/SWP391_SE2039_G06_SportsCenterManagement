import React, { useState, useEffect } from 'react';
import { packageApi, classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import { MAX_PACKAGE_PRICE, sortMembershipPackages, validatePackagePrice, canEditPackage } from './packageManagementForm.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const PACKAGE_PRESETS = [
  {
    id: 'starter',
    icon: 'fitness_center',
    tag: 'STARTER',
    tagEn: 'STARTER',
    name: 'Gói Basic Thể Thao',
    nameEn: 'Starter Fitness Pass',
    price: 650000,
    durationDays: 30,
    allowedSports: 1,
    badge: 'TIẾT KIỆM',
    badgeEn: 'SAVER',
    description: 'Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu hoặc lịch tập cố định. Bao gồm quyền sử dụng tủ locker và tiện ích tập luyện.',
    descriptionEn: 'Single discipline pass ideal for beginners. Includes smart locker and standard Olympic amenities.'
  },
  {
    id: 'pro',
    icon: 'bolt',
    tag: 'PRO ATHLETE',
    tagEn: 'PRO ATHLETE',
    name: 'Gói Pro Bứt Phá',
    nameEn: 'Pro Athlete Pass',
    price: 1800000,
    durationDays: 90,
    allowedSports: 3,
    badge: 'PHỔ BIẾN',
    badgeEn: 'POPULAR',
    description: 'Lựa chọn 3 bộ môn kết hợp (Gym + Bơi lội + Cầu lông), kèm 1 buổi kiểm tra chỉ số InBody và tủ locker riêng.',
    descriptionEn: 'Access to 3 sports of choice, 1 complimentary InBody fitness assessment, and digital locker.'
  },
  {
    id: 'elite',
    icon: 'diamond',
    tag: 'ELITE ATHLETE',
    tagEn: 'ELITE ATHLETE',
    name: 'Gói Elite Chuyên Nghiệp',
    nameEn: 'Elite Performance Pass',
    price: 3200000,
    durationDays: 180,
    allowedSports: 6,
    badge: 'ELITE ATHLETE',
    badgeEn: 'ELITE',
    description: 'Trải nghiệm thể thao đa năng toàn diện, hỗ trợ đặt sân ưu tiên và quyền vào phòng xông hơi Sauna đẳng cấp quốc tế.',
    descriptionEn: 'Comprehensive multi-sport pass with priority court booking and Finnish Sauna access.'
  },
  {
    id: 'olympic',
    icon: 'workspace_premium',
    tag: 'VIP OLYMPIC',
    tagEn: 'VIP OLYMPIC',
    name: 'Gói All-Access Olympic Pass',
    nameEn: 'Olympic VIP All-Access',
    price: 5800000,
    durationDays: 365,
    allowedSports: 10,
    badge: 'VIP OLYMPIC',
    badgeEn: 'VIP PASS',
    description: 'Toàn quyền sử dụng toàn bộ môn thể thao và cụm sân thi đấu đẳng cấp quốc tế 365 ngày, dịch vụ phục hồi thể lực VIP.',
    descriptionEn: 'Unlimited 365-day access to all Olympic disciplines, championship arenas, and VIP recovery zone.'
  }
];

const QUICK_PRICES = [500000, 650000, 1200000, 1800000, 3200000, 5800000];
const QUICK_DURATIONS = [
  { days: 30, label: '30 ngày' },
  { days: 90, label: '90 ngày' },
  { days: 180, label: '180 ngày' },
  { days: 365, label: '365 ngày' }
];
const QUICK_BADGES = ['TIẾT KIỆM', 'PHỔ BIẾN', 'HOT', 'ELITE ATHLETE', 'VIP OLYMPIC', 'ƯU ĐÃI'];

export function PackageManagement() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError, confirm } = useToast();
  const [packages, setPackages] = useState([]);
  const [centerSports, setCenterSports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(500000);
  const [allowedSports, setAllowedSports] = useState(1);
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('TIẾT KIỆM');
  const [saving, setSaving] = useState(false);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  const totalSports = centerSports.length > 0 ? centerSports.length : 10;

  const activeCount = packages.filter(p => String(p.status).toUpperCase() === 'ACTIVE').length;
  const inactiveCount = packages.length - activeCount;
  const totalSubscribers = packages.reduce((acc, p) => acc + (p.subscriberCount || (p.hasOrders ? 1 : 0)), 0);

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = !searchTerm || pkg.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = String(pkg.status).toUpperCase() === 'ACTIVE';
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);
    return matchesSearch && matchesStatus;
  });

  const getPackageTier = (pkg, sportsCount) => {
    const name = (pkg.name || '').toLowerCase();
    const days = Number(pkg.durationDays) || 0;
    const sports = Number(pkg.allowedSports) || 0;

    // VIP Olympic All-Access
    if (
      name.includes('olympic') ||
      name.includes('all-access') ||
      name.includes('vip') ||
      days >= 365 ||
      sports >= sportsCount
    ) {
      return {
        tierKey: 'olympic',
        tierLabel: 'VIP OLYMPIC PASS',
        tierIcon: 'workspace_premium',
        isVip: true,
        cardClasses:
          'bg-gradient-to-br from-[#071912] via-[#0d2a1e] to-[#05140d] text-white border-2 border-amber-400/60 shadow-xl shadow-emerald-950/40 relative overflow-hidden ring-1 ring-amber-400/20',
        badgeGradient: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-md',
        priceColor: 'text-amber-300 drop-shadow-[0_2px_10px_rgba(251,191,36,0.25)]',
        unitColor: 'text-amber-200/70',
        titleColor: 'text-white drop-shadow-xs',
        termColor: 'text-emerald-300 font-bold',
        checkColor: 'text-amber-400',
        textColor: 'text-slate-100',
        mutedText: 'text-emerald-200/70',
        divider: 'border-white/10',
        descBorder: 'border-amber-400/40 text-slate-300',
      };
    }

    // Elite
    if (name.includes('elite') || days >= 180 || sports >= 6) {
      return {
        tierKey: 'elite',
        tierLabel: 'ELITE ATHLETE',
        tierIcon: 'diamond',
        isVip: false,
        cardClasses:
          'bg-white dark:bg-slate-900 border-2 border-teal-300/80 dark:border-teal-700/80 shadow-md shadow-teal-500/5 hover:border-teal-400 dark:hover:border-teal-600 relative overflow-hidden',
        accentBar: 'bg-gradient-to-r from-teal-400 to-cyan-500',
        badgeGradient: 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-black shadow-xs',
        priceColor: 'text-teal-600 dark:text-teal-300',
        unitColor: 'text-teal-600/70 dark:text-teal-400/70',
        titleColor: 'text-slate-900 dark:text-white',
        termColor: 'text-teal-700 dark:text-teal-400 font-bold',
        checkColor: 'text-teal-500',
        textColor: 'text-slate-800 dark:text-slate-100',
        mutedText: 'text-slate-500 dark:text-slate-400',
        divider: 'border-slate-100 dark:border-slate-800',
        descBorder: 'border-teal-500/40 text-slate-600 dark:text-slate-300',
      };
    }

    // Pro
    if (name.includes('pro') || days >= 90 || sports >= 3) {
      return {
        tierKey: 'pro',
        tierLabel: 'PRO ATHLETE',
        tierIcon: 'bolt',
        isVip: false,
        cardClasses:
          'bg-white dark:bg-slate-900 border-2 border-emerald-300/80 dark:border-emerald-700/80 shadow-sm shadow-emerald-500/5 hover:border-emerald-400 dark:hover:border-emerald-600 relative overflow-hidden',
        accentBar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        badgeGradient: 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black shadow-xs',
        priceColor: 'text-[#2D6A4F] dark:text-[#81B29A]',
        unitColor: 'text-emerald-700/70 dark:text-emerald-400/70',
        titleColor: 'text-slate-900 dark:text-white',
        termColor: 'text-emerald-700 dark:text-emerald-400 font-bold',
        checkColor: 'text-emerald-500',
        textColor: 'text-slate-800 dark:text-slate-100',
        mutedText: 'text-slate-500 dark:text-slate-400',
        divider: 'border-slate-100 dark:border-slate-800',
        descBorder: 'border-emerald-500/40 text-slate-600 dark:text-slate-300',
      };
    }

    // Starter / Basic
    return {
      tierKey: 'starter',
      tierLabel: 'STARTER PASS',
      tierIcon: 'fitness_center',
      isVip: false,
      cardClasses:
        'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 relative overflow-hidden',
      accentBar: 'bg-slate-300 dark:bg-slate-700',
      badgeGradient: 'bg-slate-700 text-white font-black shadow-xs',
      priceColor: 'text-slate-900 dark:text-white',
      unitColor: 'text-slate-500 dark:text-slate-400',
      titleColor: 'text-slate-900 dark:text-white',
      termColor: 'text-slate-600 dark:text-slate-400 font-bold',
      checkColor: 'text-emerald-500',
      textColor: 'text-slate-800 dark:text-slate-100',
      mutedText: 'text-slate-500 dark:text-slate-400',
      divider: 'border-slate-100 dark:border-slate-800',
      descBorder: 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300',
    };
  };

  const loadPackages = async () => {
    try {
      const [data, sportsData] = await Promise.all([
        packageApi.getAll(),
        classApi.getSports().catch(() => [])
      ]);
      setPackages(sortMembershipPackages(data));
      setCenterSports(Array.isArray(sportsData) ? sportsData : []);
    } catch (e) {
      showError(isEn ? 'Failed to load membership packages' : 'Không thể tải danh sách gói tập');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setName('');
    setDurationDays(30);
    setPrice(650000);
    setAllowedSports(1);
    setDescription('');
    setBadge(isEn ? 'SAVER' : 'TIẾT KIỆM');
    setModalOpen(true);
  };

  const applyPreset = preset => {
    setName(isEn ? preset.nameEn : preset.name);
    setPrice(preset.price);
    setDurationDays(preset.durationDays);
    const maxSports = centerSports.length > 0 ? centerSports.length : 10;
    setAllowedSports(Math.min(preset.allowedSports, maxSports));
    setBadge(isEn ? preset.badgeEn : preset.badge);
    setDescription(isEn ? preset.descriptionEn : preset.description);
  };

  const handleDuplicatePackage = pkg => {
    setEditingPkg(null);
    setName(isEn ? `${pkg.name} (Copy)` : `${pkg.name} (Bản sao)`);
    setDurationDays(pkg.durationDays);
    setPrice(pkg.price);
    const sportsCount = centerSports.length > 0 ? centerSports.length : 10;
    setAllowedSports(pkg.allowedSports >= sportsCount ? sportsCount : (pkg.allowedSports || 1));
    setDescription(pkg.description || '');
    setBadge(pkg.badge || (isEn ? 'NEW' : 'MỚI'));
    setModalOpen(true);
  };

  const openEditModal = pkg => {
    if (!canEditPackage(pkg)) {
      showError({
        message: isEn
          ? 'Cannot edit package: This package is active and has existing member subscriptions or orders.'
          : 'Không thể chỉnh sửa: Gói tập này đã kích hoạt và có người đặt/đăng ký.',
        code: 'PKG-HAS-ORDERS',
        proposedHandling: isEn
          ? 'To change pricing or terms, discontinue this package (Lock sales) and create a new package.'
          : 'Để thay đổi chính sách hoặc biểu phí, vui lòng Khóa bán gói hiện tại và tạo một gói mới.'
      });
      return;
    }
    setEditingPkg(pkg);
    setName(pkg.name);
    setDurationDays(pkg.durationDays);
    setPrice(pkg.price);
    const sportsCount = centerSports.length > 0 ? centerSports.length : 6;
    setAllowedSports(pkg.allowedSports >= sportsCount ? sportsCount : (pkg.allowedSports || 1));
    setDescription(pkg.description || '');
    setBadge(pkg.badge || '');
    setModalOpen(true);
  };

  const handleSavePackage = async e => {
    e.preventDefault();
    if (editingPkg && !canEditPackage(editingPkg)) {
      showError({
        message: isEn
          ? 'Cannot edit package: This package is active and has existing member subscriptions or orders.'
          : 'Không thể chỉnh sửa: Gói tập này đã kích hoạt và có người đặt/đăng ký.',
        code: 'PKG-HAS-ORDERS',
        proposedHandling: isEn
          ? 'To change pricing or terms, discontinue this package (Lock sales) and create a new package.'
          : 'Để thay đổi chính sách hoặc biểu phí, vui lòng Khóa bán gói hiện tại và tạo một gói mới.'
      });
      return;
    }
    if (!name.trim()) {
      showError({
        message: isEn ? 'Please enter package name!' : 'Vui lòng nhập tên gói tập!',
        code: 'VAL-PKG-NAME',
        proposedHandling: isEn ? 'Provide a descriptive name (e.g., Olympic Monthly Swim, Platinum Pass).' : 'Đặt tên gợi nhớ rõ ràng (ví dụ: Gói Bơi Olympic Tháng, Gói Hội Viên Bạch Kim).'
      });
      return;
    }

    const priceValidation = validatePackagePrice(price);
    if (!priceValidation.valid) {
      showError({
        message: priceValidation.message,
        code: 'VAL-PKG-PRICE',
        proposedHandling: isEn
          ? `Enter amount greater than 0 and not exceeding ${MAX_PACKAGE_PRICE.toLocaleString()} VND.`
          : `Nhập số tiền lớn hơn 0 và không vượt quá ${MAX_PACKAGE_PRICE.toLocaleString('vi-VN')} VNĐ; không bắt buộc theo bước 50.000 VNĐ.`
      });
      return;
    }

    if (Number(durationDays) <= 0) {
      showError({
        message: isEn ? 'Duration must be at least 1 day.' : 'Thời hạn sử dụng gói phải từ 1 ngày trở lên.',
        code: 'VAL-PKG-DURATION',
        proposedHandling: isEn ? 'Standard terms: 30 days (1 mo), 90 days (3 mo), 365 days (1 yr).' : 'Quy định thời hạn phổ biến: 30 ngày (1 tháng), 90 ngày (3 tháng), 365 ngày (1 năm).'
      });
      return;
    }

    if (Number(allowedSports) <= 0) {
      showError({
        message: isEn ? 'Allowed disciplines must be at least 1 sport.' : 'Số bộ môn thể thao được phép tập phải từ 1 môn trở lên.',
        code: 'VAL-PKG-SPORTS',
        proposedHandling: isEn ? `Choose between 1 and ${totalSports} disciplines.` : `Chọn số môn từ 1 đến ${totalSports} môn.`
      });
      return;
    }

    setSaving(true);
    try {
      if (editingPkg) {
        await packageApi.update(editingPkg.id, {
          name: name.trim(),
          durationDays: Number(durationDays),
          price: priceValidation.value,
          allowedSports: Number(allowedSports),
          description: description.trim(),
          badge: badge.trim()
        });
        showSuccess(isEn ? 'Package updated successfully!' : 'Cập nhật gói tập thành công!');
      } else {
        await packageApi.create({
          name: name.trim(),
          durationDays: Number(durationDays),
          price: priceValidation.value,
          allowedSports: Number(allowedSports),
          description: description.trim(),
          badge: badge.trim(),
          features: isEn
            ? ['Full facility access included in package', 'Smart digital locker', 'Electrolyte hydration station']
            : ['Toàn quyền sử dụng sân bãi trong gói', 'Tủ đồ thông minh', 'Nước uống điện giải']
        });
        showSuccess(isEn ? 'New package created successfully!' : 'Tạo gói tập mới thành công!');
      }
      setModalOpen(false);
      loadPackages();
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async pkg => {
    if (pkg.status === 'ACTIVE' || pkg.status === 'Active') {
      const confirmed = await confirm({
        title: isEn ? 'Discontinue Package' : 'Ngưng phát hành gói tập',
        message: isEn
          ? `Are you sure you want to stop offering "${pkg.name}"?`
          : `Bạn có chắc chắn muốn ngưng phát hành gói "${pkg.name}"?`,
        detail: isEn
          ? 'Existing active members will retain access until their pass expires.'
          : 'Các hội viên đã mua gói này trước đó vẫn được bảo lưu quyền lợi và thời hạn đến ngày kết thúc.',
        confirmText: isEn ? 'Discontinue' : 'Ngưng phát hành',
        cancelText: isEn ? 'Keep Offering' : 'Giữ lại gói',
        type: 'warning'
      });
      if (!confirmed) return;
    }

    try {
      await packageApi.toggleStatus(pkg.id);
      showSuccess(isEn ? `Updated status for ${pkg.name}` : `Đã thay đổi trạng thái của gói ${pkg.name}`);
      loadPackages();
    } catch (err) {
      showError(err);
    }
  };

  if (loading) return <LoadingSpinner text={isEn ? 'Loading membership packages...' : 'Đang tải gói tập hội viên...'} />;

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner Header (Olympic Multi-stop Gradient matching Image 1) */}
      <section
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-[#24828F]/25 border border-white/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-[#A8DADC]/35 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-[#1B4332] text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{isEn ? 'MEMBERSHIP & PRICING PLANS' : 'CHÍNH SÁCH GÓI TẬP & BIỂU PHÍ'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Membership Packages Management' : 'Quản Lý Gói Tập Hội Viên'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Configure pricing plans, validity duration, sport discipline quotas, and catalog availability.'
              : 'Thiết lập giá cước, thời hạn và phân quyền bộ môn cho các gói tập rèn luyện.'}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#1B4332] text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover-lift cursor-pointer border border-white/80 shrink-0 relative z-10"
        >
          <span className="material-symbols-outlined text-[18px] text-[#2D6A4F]">add_card</span>
          <span>{isEn ? 'Create New Package' : 'Tạo Gói Tập Mới'}</span>
        </button>
      </section>

      {/* Controls & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'All Plans' : 'Tất cả'} ({packages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{isEn ? 'On Sale' : 'Đang mở bán'} ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'INACTIVE'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>{isEn ? 'Sales Locked' : 'Đã khóa bán'} ({inactiveCount})</span>
          </button>
        </div>

        {/* Search Input & Total Stats */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isEn ? 'Search package name...' : 'Tìm kiếm theo tên gói...'}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold whitespace-nowrap">
            <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">group</span>
            <span>{totalSubscribers} {isEn ? 'members registered' : 'lượt hội viên'}</span>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-3xl">sports_gymnastics</span>
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isEn ? 'No membership packages match the filter' : 'Không tìm thấy gói tập phù hợp với bộ lọc'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {isEn
              ? 'Try modifying your search keywords or switch the status filter above.'
              : 'Hãy thử đổi từ khóa tìm kiếm hoặc chọn hiển thị tất cả các gói tập.'}
          </p>
          {(searchTerm || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E2235] text-white hover:bg-[#2B2D42] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
              <span>{isEn ? 'Clear Filters' : 'Đặt lại bộ lọc'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPackages.map(pkg => {
            const isActive = String(pkg.status).toUpperCase() === 'ACTIVE';
            const tier = getPackageTier(pkg, totalSports);

            return (
              <div
                key={pkg.id}
                className={`${tier.cardClasses} rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover-lift ${
                  !isActive ? 'opacity-85 border-dashed' : ''
                }`}
              >
                {/* Accent bar on top for non-VIP cards */}
                {tier.accentBar && (
                  <div className={`h-1.5 w-full ${tier.accentBar} absolute top-0 left-0 right-0`} />
                )}

                {/* VIP ambient decorative effects */}
                {tier.isVip && (
                  <>
                    <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/15 via-emerald-500/10 to-transparent blur-2xl" />
                    <div className="pointer-events-none absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-2xl" />
                    <span className="material-symbols-outlined pointer-events-none absolute -right-4 -bottom-4 text-9xl text-white/5 rotate-12 select-none">
                      military_tech
                    </span>
                  </>
                )}

                {/* Upper Card Content */}
                <div className="relative z-10">
                  {/* Micro Header: Status & Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isActive
                          ? tier.isVip
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? (tier.isVip ? 'bg-emerald-400' : 'bg-emerald-500') + ' animate-pulse'
                            : 'bg-slate-400'
                        }`}
                      />
                      <span>{isActive ? (isEn ? 'On sale' : 'Đang mở bán') : (isEn ? 'Sales locked' : 'Đã khóa bán')}</span>
                    </span>

                    {/* Badge or Tier Pill */}
                    {pkg.badge ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${tier.badgeGradient}`}>
                        {pkg.badge}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          tier.isVip
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">{tier.tierIcon}</span>
                        <span>{tier.tierLabel}</span>
                      </span>
                    )}
                  </div>

                  {/* Subhead: Duration & Active Subscribers */}
                  <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <div className={`flex items-center gap-1 text-[11px] uppercase tracking-wider ${tier.termColor}`}>
                      <span className="material-symbols-outlined text-[14px]">timelapse</span>
                      <span>
                        {isEn ? 'Term' : 'Thời hạn'}: <strong className="font-extrabold">{pkg.durationDays} {isEn ? 'days' : 'ngày'}</strong>
                      </span>
                    </div>

                    {(pkg.hasOrders || !canEditPackage(pkg)) && (
                      <span
                        title={isEn ? 'Package has active member registrations or orders' : 'Gói đã có hội viên đăng ký hoặc đặt mua'}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-400/50 bg-amber-400/15 text-amber-700 dark:text-amber-300 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[12px]">how_to_reg</span>
                        <span>
                          {pkg.subscriberCount > 0
                            ? isEn
                              ? `${pkg.subscriberCount} booked`
                              : `${pkg.subscriberCount} người đặt`
                            : isEn
                            ? 'Has orders'
                            : 'Đã có người đặt'}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Package Name */}
                  <h3 className={`font-chivo text-lg sm:text-xl font-black tracking-tight leading-snug line-clamp-2 min-h-[3.25rem] flex items-center ${tier.titleColor}`}>
                    {pkg.name}
                  </h3>

                  {/* Price Block */}
                  <div className={`mt-3 pt-3 border-t ${tier.divider} flex items-baseline gap-1.5`}>
                    <span className={`text-2xl sm:text-3xl font-black font-chivo tracking-tight ${tier.priceColor}`}>
                      {Number(pkg.price).toLocaleString('vi-VN')}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${tier.unitColor}`}>
                      VNĐ
                    </span>
                  </div>

                  {/* Athletic Feature Matrix */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-[17px] shrink-0 mt-0.5 ${tier.checkColor}`}>
                        sports_score
                      </span>
                      <span className={`font-semibold ${tier.textColor}`}>
                        {pkg.allowedSports >= totalSports
                          ? isEn
                            ? `All ${totalSports} disciplines (All-Access)`
                            : `Toàn bộ ${totalSports} môn (All-Access)`
                          : isEn
                          ? `${pkg.allowedSports} sport disciplines included`
                          : `${pkg.allowedSports} môn thể thao tự chọn`}
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-[17px] shrink-0 mt-0.5 ${tier.checkColor}`}>
                        check_circle
                      </span>
                      <span className={`font-medium ${tier.mutedText}`}>
                        {isEn ? 'Digital locker & Olympic amenities' : 'Tủ locker & tiện ích tập luyện chuẩn Olympic'}
                      </span>
                    </div>

                    {pkg.description && (
                      <p className={`mt-2.5 text-[11px] leading-relaxed line-clamp-2 pl-2.5 border-l-2 italic ${tier.descBorder}`}>
                        {pkg.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className={`mt-6 pt-4 border-t ${tier.divider} flex items-center justify-between gap-2 relative z-10`}>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(pkg)}
                    title={
                      isActive
                        ? isEn
                          ? 'Stop new members from buying this package'
                          : 'Ngăn hội viên mới mua gói này'
                        : isEn
                        ? 'Allow members to buy this package'
                        : 'Cho phép hội viên mua gói này'
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? tier.isVip
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">{isActive ? 'lock' : 'lock_open'}</span>
                    <span>{isActive ? (isEn ? 'Lock sales' : 'Khóa bán') : (isEn ? 'Open sales' : 'Mở bán')}</span>
                  </button>

                  {canEditPackage(pkg) ? (
                    <button
                      type="button"
                      onClick={() => openEditModal(pkg)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer shadow-xs ${
                        tier.isVip
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-[#1E2235] hover:bg-[#2B2D42] text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>{isEn ? 'Edit' : 'Sửa'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title={
                        isEn
                          ? 'Cannot edit: This package has existing members or orders.'
                          : 'Gói đã kích hoạt và có người đặt, không thể chỉnh sửa.'
                      }
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-chivo uppercase tracking-wider cursor-not-allowed opacity-60 ${
                        tier.isVip
                          ? 'bg-white/10 text-slate-400 border border-white/10'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">lock</span>
                      <span>{isEn ? 'Locked' : 'Khóa sửa'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create/Edit Package */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPkg ? (isEn ? `Edit Package: ${editingPkg.name}` : `Chỉnh sửa gói tập: ${editingPkg.name}`) : (isEn ? 'Create New Membership Package' : 'Tạo gói tập hội viên mới')}
      >
        {editingPkg && !canEditPackage(editingPkg) && (
          <div className="mb-4">
            <BusinessAlert
              type="warning"
              title={isEn ? 'Package is locked from modification' : 'Gói tập đã bị khóa chỉnh sửa'}
              message={
                isEn
                  ? 'This package has already been activated and has existing member subscriptions or orders. To protect data integrity, pricing and details cannot be changed. You can toggle "Lock sales" to discontinue this package.'
                  : 'Gói tập này đã được kích hoạt và có hội viên đăng ký hoặc đặt mua. Để bảo đảm tính nhất quán của dữ liệu hợp đồng và hóa đơn, không thể sửa thông tin gói. Bạn có thể chọn "Khóa bán" nếu muốn dừng phát hành gói mới.'
              }
            />
          </div>
        )}
        <form onSubmit={handleSavePackage} className="space-y-4">
          {/* 1-Click Quick Presets Banner */}
          {!editingPkg && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 font-chivo">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">bolt</span>
                  {isEn ? '⚡ 1-Click Quick Presets (Auto-fill)' : '⚡ Gợi ý gói mẫu chuẩn Olympic (1-Click điền nhanh)'}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {isEn ? 'Click to auto-fill all fields' : 'Nhấp để tự động điền nhanh'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PACKAGE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200/80 dark:border-emerald-800/70 hover:border-emerald-500 hover:shadow-xs text-left transition-all cursor-pointer group hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 truncate">
                      <span className="material-symbols-outlined text-[14px] text-emerald-500 shrink-0">{preset.icon}</span>
                      <span className="truncate">{isEn ? preset.nameEn : preset.name}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{Number(preset.price).toLocaleString()}đ</span>
                      <span>{preset.durationDays}d</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Package Name *' : 'Tên gói tập *'}
            </label>
            <input
              type="text"
              required
              disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isEn ? 'e.g. Olympic Annual Pass, 3-Month Swim...' : 'Ví dụ: Gói Bơi 3 Tháng, Gói Hội Viên Năm...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A] disabled:bg-slate-100 disabled:dark:bg-slate-800/60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Price (VNĐ) *' : 'Học phí (VNĐ) *'}
              </label>
              <input
                type="number"
                required
                disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                min={1}
                max={MAX_PACKAGE_PRICE}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A] disabled:bg-slate-100 disabled:dark:bg-slate-800/60 disabled:cursor-not-allowed"
              />
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isEn ? 'Quick pick:' : 'Gợi ý nhanh:'}</span>
                {QUICK_PRICES.map(qp => (
                  <button
                    key={qp}
                    type="button"
                    disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                    onClick={() => setPrice(qp)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-chivo transition-all cursor-pointer ${
                      price === qp
                        ? 'bg-[#2D6A4F] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {(qp / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Validity (Days) *' : 'Thời hạn (Ngày) *'}
              </label>
              <input
                type="number"
                required
                disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                min={1}
                value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A] disabled:bg-slate-100 disabled:dark:bg-slate-800/60 disabled:cursor-not-allowed"
              />
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isEn ? 'Terms:' : 'Mốc chuẩn:'}</span>
                {QUICK_DURATIONS.map(qd => (
                  <button
                    key={qd.days}
                    type="button"
                    disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                    onClick={() => setDurationDays(qd.days)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-chivo transition-all cursor-pointer ${
                      durationDays === qd.days
                        ? 'bg-[#2D6A4F] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {qd.days}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Disciplines Included *' : 'Số môn được tập *'}
              </label>
              <select
                disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                value={allowedSports}
                onChange={e => setAllowedSports(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A] disabled:bg-slate-100 disabled:dark:bg-slate-800/60 disabled:cursor-not-allowed"
              >
                {Array.from({ length: totalSports }, (_, i) => {
                  const val = i + 1;
                  const isAll = val === totalSports;
                  return (
                    <option key={val} value={val}>
                      {isAll
                        ? (isEn ? `All ${totalSports} Disciplines (All-Access)` : `Toàn bộ ${totalSports} môn (All-Access)`)
                        : val === 1
                          ? (isEn ? '1 Sport (Single Discipline)' : '1 môn tự chọn')
                          : (isEn ? `${val} Sports` : `${val} môn`)}
                    </option>
                  );
                })}
                {allowedSports > totalSports && (
                  <option value={allowedSports}>
                    {isEn ? `All ${totalSports} Disciplines (All-Access)` : `Toàn bộ ${totalSports} môn (All-Access)`}
                  </option>
                )}
              </select>
              {centerSports.length > 0 && (
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {isEn ? 'Active center sports: ' : 'Môn hiện có tại trung tâm: '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {centerSports.map(s => s.name).join(', ')}
                  </span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Promotional Badge' : 'Huy hiệu nổi bật'}
              </label>
              <input
                type="text"
                disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder={isEn ? 'e.g. POPULAR, BEST VALUE' : 'Ví dụ: PHỔ BIẾN, TIẾT KIỆM'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A] disabled:bg-slate-100 disabled:dark:bg-slate-800/60 disabled:cursor-not-allowed"
              />
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                {QUICK_BADGES.map(qb => (
                  <button
                    key={qb}
                    type="button"
                    disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                    onClick={() => setBadge(qb)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      badge === qb
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {qb}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isEn ? 'Description & Member Benefits' : 'Mô tả quyền lợi'}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-bold">{isEn ? 'Templates:' : 'Mẫu:'}</span>
                <button
                  type="button"
                  disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                  onClick={() => setDescription(isEn ? 'Single discipline pass. Includes smart locker and standard amenities.' : 'Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu. Bao gồm quyền sử dụng tủ locker và tiện ích chuẩn Olympic.')}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {isEn ? 'Basic' : 'Cơ bản'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                  onClick={() => setDescription(isEn ? 'Access to 3 sports of choice, 1 InBody assessment, and smart locker.' : 'Lựa chọn 3 bộ môn kết hợp (Gym + Bơi lội + Cầu lông), kèm 1 buổi kiểm tra chỉ số InBody và tủ locker riêng.')}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {isEn ? 'Pro' : 'Pro Đa môn'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                  onClick={() => setDescription(isEn ? 'Unlimited 365-day access to all Olympic disciplines, arenas, and VIP recovery zone.' : 'Toàn quyền sử dụng toàn bộ môn thể thao và cụm sân thi đấu đẳng cấp quốc tế 365 ngày, kèm phòng xông hơi Sauna.')}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {isEn ? 'VIP' : 'Olympic VIP'}
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isEn ? 'Describe included facilities, equipment, or pass privileges...' : 'Chi tiết quyền lợi, thời gian sử dụng cụm sân bãi...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A] disabled:bg-slate-100 disabled:dark:bg-slate-800/60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={saving || Boolean(editingPkg && !canEditPackage(editingPkg))}
              className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Package' : 'Lưu Gói Tập')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
