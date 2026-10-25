import React, { useState, useEffect } from 'react';
import { packageApi, classApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import { MAX_PACKAGE_PRICE, sortMembershipPackages, validatePackagePrice, canEditPackage } from './packageManagementForm.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

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

  const totalSports = centerSports.length > 0 ? centerSports.length : 10;

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

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map(pkg => {
          const isActive = String(pkg.status).toUpperCase() === 'ACTIVE';
          return (
            <div
              key={pkg.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative hover-lift ${
                isActive ? 'border-emerald-200 dark:border-emerald-900/70' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              {pkg.badge && (
                <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] font-chivo text-[10px] font-black uppercase tracking-wider border border-[#81B29A]/30">
                  {pkg.badge}
                </span>
              )}

              <div>
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    <span className="material-symbols-outlined text-[13px]">{isActive ? 'storefront' : 'lock'}</span>
                    {isActive ? (isEn ? 'On sale' : 'Đang mở bán') : (isEn ? 'Sales locked' : 'Đã khóa bán')}
                  </span>

                  {(pkg.hasOrders || !canEditPackage(pkg)) && (
                    <span
                      title={isEn ? 'Package has active member registrations or orders' : 'Gói đã có hội viên đăng ký hoặc đặt mua'}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[13px] text-amber-600 dark:text-amber-400">how_to_reg</span>
                      <span>
                        {pkg.subscriberCount > 0
                          ? (isEn ? `${pkg.subscriberCount} booked` : `${pkg.subscriberCount} người đặt`)
                          : (isEn ? 'Has orders' : 'Đã có người đặt')}
                      </span>
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {isEn ? 'Term' : 'Thời hạn'}: {pkg.durationDays} {isEn ? 'days' : 'ngày'}
                </div>
                <h3 className="font-chivo text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {pkg.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black font-chivo text-[#2D6A4F] dark:text-[#81B29A]">
                    {Number(pkg.price).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-500">VNĐ</span>
                </div>

                <div className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {isEn ? 'Sport Disciplines' : 'Môn được tập'}:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {pkg.allowedSports >= totalSports
                      ? (isEn ? `All ${totalSports} disciplines (All-Access)` : `Toàn bộ ${totalSports} môn (All-Access)`)
                      : (isEn ? `${pkg.allowedSports} sports` : `${pkg.allowedSports} môn tự chọn`)}
                  </strong>
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {pkg.description || (isEn ? 'Full facility & locker room access.' : 'Bao gồm quyền sử dụng tủ locker và tiện ích tập luyện.')}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(pkg)}
                  title={isActive ? (isEn ? 'Stop new members from buying this package' : 'Ngăn hội viên mới mua gói này') : (isEn ? 'Allow members to buy this package' : 'Cho phép hội viên mua gói này')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                      : 'bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700 shadow-sm'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{isActive ? 'lock' : 'lock_open'}</span>
                  {isActive ? (isEn ? 'Lock sales' : 'Khóa bán') : (isEn ? 'Open sales' : 'Mở bán')}
                </button>

                {canEditPackage(pkg) ? (
                  <button
                    type="button"
                    onClick={() => openEditModal(pkg)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1E2235] hover:bg-[#2B2D42] text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>{isEn ? 'Edit' : 'Sửa'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title={isEn ? 'Cannot edit: This package has existing members or orders.' : 'Gói đã kích hoạt và có người đặt, không thể chỉnh sửa.'}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-bold font-chivo uppercase tracking-wider cursor-not-allowed flex items-center gap-1 opacity-70"
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

          <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Description & Member Benefits' : 'Mô tả quyền lợi'}
            </label>
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
