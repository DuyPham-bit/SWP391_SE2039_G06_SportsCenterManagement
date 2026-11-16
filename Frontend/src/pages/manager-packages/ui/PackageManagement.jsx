import React, { useState, useEffect } from 'react';
import { packageApi } from '../../../entities/membership/index.js';
import { classApi } from '../../../entities/class/index.js';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { LoadingSpinner } from '../../../shared/ui/Table.jsx';
import { BusinessAlert } from '../../../shared/ui/BusinessAlert.jsx';
import { MAX_PACKAGE_PRICE, sortMembershipPackages, validatePackagePrice, canEditPackage } from '../model/packageManagementForm.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { PACKAGE_PRESETS, QUICK_PRICES, QUICK_DURATIONS, QUICK_BADGES } from '../model/presets.js';

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

  // Tier = which look a card gets. Same three looks as the member pricing grid: premium navy + sand,
  // featured solid sage, and the white standard card (teal price for Elite).
  const getPackageTier = (pkg, sportsCount) => {
    const name = (pkg.name || '').toLowerCase();
    const days = Number(pkg.durationDays) || 0;
    const sports = Number(pkg.allowedSports) || 0;
    const standard = {
      card: 'bg-white dark:bg-brand-navy-900 border-brand-navy-200 dark:border-brand-navy-800',
      title: 'text-brand-navy-900 dark:text-white',
      price: 'text-brand-navy-900 dark:text-white',
      muted: 'text-brand-navy-600 dark:text-brand-navy-300',
      chip: 'bg-brand-sand-100 dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-200',
      icon: 'text-brand-sage-700 dark:text-brand-sage-400',
      divider: 'bg-brand-navy-100 dark:bg-brand-navy-800',
      ghost: 'text-brand-navy-700 dark:text-brand-navy-200 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800',
      danger: 'text-brand-danger-700 dark:text-brand-danger-300 hover:bg-brand-danger-50 dark:hover:bg-brand-danger-950/40',
      primary: 'bg-brand-navy-900 hover:bg-brand-navy-800 text-white dark:bg-brand-sage-500 dark:text-brand-navy-950 dark:hover:bg-brand-sage-400'
    };

    if (name.includes('olympic') || name.includes('all-access') || name.includes('vip') || days >= 365 || sports >= sportsCount) {
      return {
        tierKey: 'olympic',
        tierLabel: 'VIP OLYMPIC PASS',
        tierIcon: 'workspace_premium',
        isVip: true,
        card: 'bg-brand-navy-900 dark:bg-brand-navy-950 border-brand-sand-300/50',
        title: 'text-white',
        price: 'text-brand-sand-300',
        muted: 'text-brand-navy-200',
        chip: 'bg-white/10 text-brand-sand-200',
        icon: 'text-brand-sand-300',
        divider: 'bg-white/10',
        ghost: 'text-brand-navy-100 hover:bg-white/10',
        danger: 'text-brand-danger-200 hover:bg-white/10',
        primary: 'bg-brand-sand-300 hover:bg-brand-sand-400 text-brand-navy-950'
      };
    }
    if (name.includes('elite') || days >= 180 || sports >= 6) {
      return { ...standard, tierKey: 'elite', tierLabel: 'ELITE ATHLETE', tierIcon: 'diamond', isVip: false, price: 'text-brand-teal-700 dark:text-brand-teal-300', icon: 'text-brand-teal-700 dark:text-brand-teal-400' };
    }
    if (name.includes('pro') || days >= 90 || sports >= 3) {
      return {
        tierKey: 'pro',
        tierLabel: 'PRO ATHLETE',
        tierIcon: 'bolt',
        isVip: false,
        isFeatured: true,
        card: 'bg-brand-sage-700 dark:bg-brand-sage-900 border-brand-sage-700',
        title: 'text-white',
        price: 'text-white',
        muted: 'text-brand-sage-100',
        chip: 'bg-white/15 text-white',
        icon: 'text-brand-sand-300',
        divider: 'bg-white/15',
        ghost: 'text-white hover:bg-white/10',
        danger: 'text-brand-danger-100 hover:bg-white/10',
        primary: 'bg-brand-sand-50 hover:bg-brand-sand-200 text-brand-sage-900'
      };
    }
    return { ...standard, tierKey: 'starter', tierLabel: 'STARTER PASS', tierIcon: 'fitness_center', isVip: false };
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

  // Fastest path to a new package: reset the form, fill it from the template, open it.
  const openCreateFromPreset = preset => {
    openCreateModal();
    applyPreset(preset);
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

  const handleDeletePackage = async pkg => {
    const confirmed = await confirm({
      title: isEn ? 'Delete Package' : 'Xóa gói tập',
      message: isEn
        ? `Delete "${pkg.name}" permanently?`
        : `Xóa vĩnh viễn gói "${pkg.name}"?`,
      detail: isEn
        ? 'Nobody has registered for this package yet. This cannot be undone.'
        : 'Gói chưa có hội viên đăng ký. Thao tác này không thể hoàn tác.',
      confirmText: isEn ? 'Delete' : 'Xóa gói',
      cancelText: isEn ? 'Cancel' : 'Hủy',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await packageApi.remove(pkg.id);
      showSuccess(isEn ? `Deleted ${pkg.name}` : `Đã xóa gói ${pkg.name}`);
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
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-brand-teal-600/25 border border-white/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(108deg, #2D6A4F 0%, #24828F 25%, #3FAEB8 48%, #81B29A 70%, #E5A33C 88%, #E5A33C 100%)'
        }}
      >
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/50 via-brand-sand-500/35 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/45 via-brand-sage-700/30 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/35 rounded-full blur-3xl" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
          <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        </svg>

        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-brand-sage-900 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-brand-sage-900 text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover-lift cursor-pointer border border-white/80 shrink-0 relative z-10"
        >
          <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">add_card</span>
          <span>{isEn ? 'Create New Package' : 'Tạo Gói Tập Mới'}</span>
        </button>
      </section>

      {/* Controls & Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-brand-navy-900 p-3 sm:p-4 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-navy-100 dark:bg-brand-navy-800/80 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-white shadow-xs'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'All Plans' : 'Tất cả'} ({packages.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-brand-navy-700 text-brand-sage-700 dark:text-brand-sage-400 shadow-xs'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 shrink-0" />
            <span>{isEn ? 'On Sale' : 'Đang mở bán'} ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-chivo transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'INACTIVE'
                ? 'bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-white shadow-xs'
                : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-brand-navy-400 shrink-0" />
            <span>{isEn ? 'Sales Locked' : 'Đã khóa bán'} ({inactiveCount})</span>
          </button>
        </div>

        {/* Search Input & Total Stats */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined text-[18px] text-brand-navy-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={isEn ? 'Search package name...' : 'Tìm kiếm theo tên gói...'}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white placeholder-brand-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/40 border border-brand-sand-200/80 dark:border-brand-sand-900/60 text-brand-sand-800 dark:text-brand-sand-300 text-xs font-bold whitespace-nowrap">
            <span className="material-symbols-outlined text-[16px] text-brand-sand-700 dark:text-brand-sand-400">group</span>
            <span>{totalSubscribers} {isEn ? 'members registered' : 'lượt hội viên'}</span>
          </div>
        </div>
      </div>

      {/* Quick create: one click opens the form already filled from a template */}
      <section aria-labelledby="quick-create-heading" className="rounded-3xl bg-brand-sand-100 dark:bg-brand-navy-900 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="quick-create-heading" className="font-chivo text-lg font-black text-brand-navy-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-brand-sage-700 dark:text-brand-sage-400" aria-hidden="true">bolt</span>
            {isEn ? 'Quick create from a template' : 'Tạo nhanh từ gói mẫu'}
          </h2>
          <p className="text-sm text-brand-navy-600 dark:text-brand-navy-300">
            {isEn ? 'Pick a template, review, then save.' : 'Chọn mẫu → kiểm tra → bấm Lưu. Mọi trường đã được điền sẵn.'}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {PACKAGE_PRESETS.map((preset, index) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => openCreateFromPreset(preset)}
              style={{ animationDelay: `${index * 60}ms` }}
              className="scms-shine group animate-fade-slide-up text-left rounded-2xl bg-white dark:bg-brand-navy-800 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgb(var(--brand-navy-900)/0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-500 cursor-pointer"
            >
              <span className="w-9 h-9 rounded-xl bg-brand-sage-100 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 flex items-center justify-center transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{preset.icon}</span>
              </span>
              <span className="mt-3 block text-sm font-bold text-brand-navy-900 dark:text-white leading-snug">{isEn ? preset.nameEn : preset.name}</span>
              <span className="mt-1 block text-sm font-semibold text-brand-sage-700 dark:text-brand-sage-300 tabular-nums">
                {Number(preset.price).toLocaleString('vi-VN')}đ
              </span>
              <span className="block text-xs text-brand-navy-600 dark:text-brand-navy-300">
                {preset.durationDays} {isEn ? 'days' : 'ngày'} · {preset.allowedSports} {isEn ? 'sports' : 'môn'}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={openCreateModal}
            className="col-span-2 lg:col-span-1 group rounded-2xl border-2 border-dashed border-brand-navy-300 dark:border-brand-navy-600 p-4 flex flex-col items-center justify-center gap-2 text-brand-navy-700 dark:text-brand-navy-200 hover:border-brand-sage-500 hover:text-brand-sage-800 dark:hover:text-brand-sage-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-500"
          >
            <span className="material-symbols-outlined text-[28px] transition-transform group-hover:rotate-90" aria-hidden="true">add</span>
            <span className="text-sm font-bold">{isEn ? 'Blank package' : 'Gói trống'}</span>
          </button>
        </div>
      </section>

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="bg-white dark:bg-brand-navy-900 rounded-3xl border border-brand-navy-200 dark:border-brand-navy-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy-100 dark:bg-brand-navy-800 mx-auto flex items-center justify-center text-brand-navy-400">
            <span className="material-symbols-outlined text-3xl">sports_gymnastics</span>
          </div>
          <h4 className="text-base font-bold text-brand-navy-800 dark:text-brand-navy-200">
            {isEn ? 'No membership packages match the filter' : 'Không tìm thấy gói tập phù hợp với bộ lọc'}
          </h4>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 max-w-sm mx-auto">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
              <span>{isEn ? 'Clear Filters' : 'Đặt lại bộ lọc'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {filteredPackages.map((pkg, index) => {
            const isActive = String(pkg.status).toUpperCase() === 'ACTIVE';
            const tier = getPackageTier(pkg, totalSports);
            const editable = canEditPackage(pkg);

            return (
              <article
                key={pkg.id}
                style={{ animationDelay: `${Math.min(index, 5) * 70}ms` }}
                className={`group relative flex flex-col rounded-3xl border p-6 sm:p-7 animate-fade-slide-up transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-24px_rgb(var(--brand-navy-900)/0.45)] ${tier.card} ${
                  !isActive ? 'border-dashed opacity-80' : ''
                }`}
              >
                {/* Status, tier and orders */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isActive
                        ? tier.isVip || tier.isFeatured
                          ? 'bg-white/15 text-white'
                          : 'bg-brand-sage-100 text-brand-sage-800 dark:bg-brand-sage-950/60 dark:text-brand-sage-300'
                        : tier.isVip || tier.isFeatured
                        ? 'bg-black/20 text-white'
                        : 'bg-brand-navy-100 text-brand-navy-700 dark:bg-brand-navy-800 dark:text-brand-navy-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-brand-sage-400 animate-pulse' : 'bg-brand-navy-400'}`} />
                    {isActive ? (isEn ? 'On sale' : 'Đang mở bán') : (isEn ? 'Sales locked' : 'Đã khóa bán')}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${tier.chip}`}>
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{tier.tierIcon}</span>
                    {pkg.badge || tier.tierLabel}
                  </span>
                  {(pkg.hasOrders || !editable) && (
                    <span
                      title={isEn ? 'Package has active member registrations or orders' : 'Gói đã có hội viên đăng ký hoặc đặt mua'}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        tier.isVip || tier.isFeatured ? 'bg-brand-sand-300 text-brand-navy-950' : 'bg-brand-sand-100 text-brand-sand-800 dark:bg-brand-sand-950/60 dark:text-brand-sand-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">how_to_reg</span>
                      {pkg.subscriberCount > 0
                        ? isEn ? `${pkg.subscriberCount} booked` : `${pkg.subscriberCount} người đặt`
                        : isEn ? 'Has orders' : 'Đã có người đặt'}
                    </span>
                  )}
                </div>

                {/* Name, term and price */}
                <h3 className={`mt-4 font-chivo text-xl font-black leading-tight line-clamp-2 ${tier.title}`}>{pkg.name}</h3>
                <p className={`mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold ${tier.muted}`}>
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">calendar_month</span>
                  {isEn ? 'Term' : 'Thời hạn'}: {pkg.durationDays} {isEn ? 'days' : 'ngày'}
                </p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className={`font-chivo text-4xl font-black tracking-tight tabular-nums ${tier.price}`}>
                    {Number(pkg.price).toLocaleString('vi-VN')}
                  </span>
                  <span className={`text-sm font-bold ${tier.muted}`}>VNĐ</span>
                </div>

                {/* What the package includes */}
                <div className="mt-5 flex-1">
                  <div className={`h-0.5 rounded-full ${tier.divider}`} aria-hidden="true" />
                  <ul className="mt-4 space-y-2.5 text-sm">
                    <li className={`flex items-start gap-2.5 font-semibold ${tier.title}`}>
                      <span className={`material-symbols-outlined text-[18px] shrink-0 ${tier.icon}`} aria-hidden="true">sports_score</span>
                      {pkg.allowedSports >= totalSports
                        ? isEn ? `All ${totalSports} disciplines (All-Access)` : `Toàn bộ ${totalSports} môn (All-Access)`
                        : isEn ? `${pkg.allowedSports} sport disciplines included` : `${pkg.allowedSports} môn thể thao tự chọn`}
                    </li>
                    <li className={`flex items-start gap-2.5 ${tier.muted}`}>
                      <span className={`material-symbols-outlined text-[18px] shrink-0 ${tier.icon}`} aria-hidden="true">check_circle</span>
                      {isEn ? 'Digital locker & Olympic amenities' : 'Tủ locker & tiện ích tập luyện chuẩn Olympic'}
                    </li>
                  </ul>
                  {pkg.description && (
                    <p className={`mt-3.5 text-sm leading-relaxed line-clamp-3 ${tier.muted}`}>{pkg.description}</p>
                  )}
                </div>

                {/* Actions: lock / duplicate on the left, edit on the right */}
                <div className="mt-6 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(pkg)}
                    title={isActive ? (isEn ? 'Stop new members from buying this package' : 'Ngăn hội viên mới mua gói này') : (isEn ? 'Allow members to buy this package' : 'Cho phép hội viên mua gói này')}
                    className={`inline-flex items-center gap-1 min-h-10 px-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive ? tier.danger : 'bg-brand-sage-700 hover:bg-brand-sage-800 text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{isActive ? 'lock' : 'lock_open'}</span>
                    {isActive ? (isEn ? 'Lock sales' : 'Khóa bán') : (isEn ? 'Open sales' : 'Mở bán')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicatePackage(pkg)}
                    title={isEn ? 'Create a new package from this one' : 'Tạo gói mới từ gói này'}
                    className={`inline-flex items-center gap-1 min-h-10 px-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${tier.ghost}`}
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
                    {isEn ? 'Duplicate' : 'Nhân bản'}
                  </button>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg)}
                      title={isEn ? 'Delete: nobody has registered yet' : 'Xóa gói: chưa có hội viên đăng ký'}
                      aria-label={isEn ? `Delete ${pkg.name}` : `Xóa gói ${pkg.name}`}
                      className={`inline-flex items-center justify-center min-h-10 min-w-10 rounded-xl transition-colors cursor-pointer ${tier.danger}`}
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                    </button>
                  )}
                  {editable ? (
                    <button
                      type="button"
                      onClick={() => openEditModal(pkg)}
                      className={`scms-shine ml-auto inline-flex items-center gap-1 min-h-10 px-3.5 rounded-xl text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${tier.primary}`}
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                      {isEn ? 'Edit' : 'Sửa'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title={isEn ? 'Cannot edit: This package has existing members or orders.' : 'Gói đã kích hoạt và có người đặt, không thể chỉnh sửa.'}
                      className={`ml-auto inline-flex items-center gap-1 min-h-10 px-2.5 rounded-xl text-sm font-bold whitespace-nowrap cursor-not-allowed opacity-70 ${tier.ghost}`}
                    >
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">lock</span>
                      {isEn ? 'Locked' : 'Khóa sửa'}
                    </button>
                  )}
                </div>
              </article>
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
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-sage-50 via-brand-teal-50 to-brand-sage-50 dark:from-brand-sage-950/40 dark:via-brand-teal-950/30 dark:to-brand-sage-950/40 border border-brand-sage-200 dark:border-brand-sage-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-brand-sage-900 dark:text-brand-sage-300 flex items-center gap-1.5 font-chivo">
                  <span className="material-symbols-outlined text-[16px] text-brand-sage-700 dark:text-brand-sage-400">bolt</span>
                  {isEn ? '⚡ 1-Click Quick Presets (Auto-fill)' : '⚡ Gợi ý gói mẫu chuẩn Olympic (1-Click điền nhanh)'}
                </span>
                <span className="text-[10px] text-brand-sage-700 dark:text-brand-sage-400 font-medium">
                  {isEn ? 'Click to auto-fill all fields' : 'Nhấp để tự động điền nhanh'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PACKAGE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-xl bg-white dark:bg-brand-navy-800 border border-brand-sage-200/80 dark:border-brand-sage-800/70 hover:border-brand-sage-500 hover:shadow-xs text-left transition-all cursor-pointer group hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-brand-navy-800 dark:text-brand-navy-100 group-hover:text-brand-sage-700 truncate">
                      <span className="material-symbols-outlined text-[14px] text-brand-sage-700 dark:text-brand-sage-400 shrink-0">{preset.icon}</span>
                      <span className="truncate">{isEn ? preset.nameEn : preset.name}</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between text-[10px] text-brand-navy-500 dark:text-brand-navy-400">
                      <span className="font-bold text-brand-sage-700 dark:text-brand-sage-300">{Number(preset.price).toLocaleString()}đ</span>
                      <span>{preset.durationDays}d</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Package Name *' : 'Tên gói tập *'}
            </label>
            <input
              type="text"
              required
              disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isEn ? 'e.g. Olympic Annual Pass, 3-Month Swim...' : 'Ví dụ: Gói Bơi 3 Tháng, Gói Hội Viên Năm...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 disabled:bg-brand-navy-100 disabled:dark:bg-brand-navy-800/60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 disabled:bg-brand-navy-100 disabled:dark:bg-brand-navy-800/60 disabled:cursor-not-allowed"
              />
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-brand-navy-400 uppercase tracking-wider">{isEn ? 'Quick pick:' : 'Gợi ý nhanh:'}</span>
                {QUICK_PRICES.map(qp => (
                  <button
                    key={qp}
                    type="button"
                    disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                    onClick={() => setPrice(qp)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-chivo transition-all cursor-pointer ${
                      price === qp
                        ? 'bg-brand-sage-700 text-white shadow-xs'
                        : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700'
                    }`}
                  >
                    {(qp / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Validity (Days) *' : 'Thời hạn (Ngày) *'}
              </label>
              <input
                type="number"
                required
                disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                min={1}
                value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 disabled:bg-brand-navy-100 disabled:dark:bg-brand-navy-800/60 disabled:cursor-not-allowed"
              />
              <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-brand-navy-400 uppercase tracking-wider">{isEn ? 'Terms:' : 'Mốc chuẩn:'}</span>
                {QUICK_DURATIONS.map(qd => (
                  <button
                    key={qd.days}
                    type="button"
                    disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                    onClick={() => setDurationDays(qd.days)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-chivo transition-all cursor-pointer ${
                      durationDays === qd.days
                        ? 'bg-brand-sage-700 text-white shadow-xs'
                        : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700'
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
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Disciplines Included *' : 'Số môn được tập *'}
              </label>
              <select
                disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                value={allowedSports}
                onChange={e => setAllowedSports(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 disabled:bg-brand-navy-100 disabled:dark:bg-brand-navy-800/60 disabled:cursor-not-allowed"
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
                <p className="mt-1.5 text-[11px] text-brand-navy-500 dark:text-brand-navy-400 leading-tight">
                  {isEn ? 'Active center sports: ' : 'Môn hiện có tại trung tâm: '}
                  <span className="font-semibold text-brand-navy-700 dark:text-brand-navy-300">
                    {centerSports.map(s => s.name).join(', ')}
                  </span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Promotional Badge' : 'Huy hiệu nổi bật'}
              </label>
              <input
                type="text"
                disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder={isEn ? 'e.g. POPULAR, BEST VALUE' : 'Ví dụ: PHỔ BIẾN, TIẾT KIỆM'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 disabled:bg-brand-navy-100 disabled:dark:bg-brand-navy-800/60 disabled:cursor-not-allowed"
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
                        ? 'bg-brand-sand-700 text-white shadow-xs'
                        : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700'
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
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300">
                {isEn ? 'Description & Member Benefits' : 'Mô tả quyền lợi'}
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-brand-navy-400 font-bold">{isEn ? 'Templates:' : 'Mẫu:'}</span>
                <button
                  type="button"
                  disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                  onClick={() => setDescription(isEn ? 'Single discipline pass. Includes smart locker and standard amenities.' : 'Rèn luyện 1 bộ môn tự chọn, phù hợp cho người mới bắt đầu. Bao gồm quyền sử dụng tủ locker và tiện ích chuẩn Olympic.')}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 cursor-pointer"
                >
                  {isEn ? 'Basic' : 'Cơ bản'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                  onClick={() => setDescription(isEn ? 'Access to 3 sports of choice, 1 InBody assessment, and smart locker.' : 'Lựa chọn 3 bộ môn kết hợp (Gym + Bơi lội + Cầu lông), kèm 1 buổi kiểm tra chỉ số InBody và tủ locker riêng.')}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 cursor-pointer"
                >
                  {isEn ? 'Pro' : 'Pro Đa môn'}
                </button>
                <button
                  type="button"
                  disabled={Boolean(editingPkg && !canEditPackage(editingPkg))}
                  onClick={() => setDescription(isEn ? 'Unlimited 365-day access to all Olympic disciplines, arenas, and VIP recovery zone.' : 'Toàn quyền sử dụng toàn bộ môn thể thao và cụm sân thi đấu đẳng cấp quốc tế 365 ngày, kèm phòng xông hơi Sauna.')}
                  className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 cursor-pointer"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage-500 disabled:bg-brand-navy-100 disabled:dark:bg-brand-navy-800/60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 rounded-xl cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={saving || Boolean(editingPkg && !canEditPackage(editingPkg))}
              className="px-5 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Package' : 'Lưu Gói Tập')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
