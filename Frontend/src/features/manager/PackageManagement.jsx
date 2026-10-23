import React, { useState, useEffect } from 'react';
import { packageApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Badge } from '../../components/common/StatCard.js';
import { LoadingSpinner } from '../../components/common/Table.js';
import { MAX_PACKAGE_PRICE, sortMembershipPackages, validatePackagePrice } from './packageManagementForm.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function PackageManagement() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError } = useToast();
  const [packages, setPackages] = useState([]);
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

  const loadPackages = async () => {
    try {
      const data = await packageApi.getAll();
      setPackages(sortMembershipPackages(data));
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
    setEditingPkg(pkg);
    setName(pkg.name);
    setDurationDays(pkg.durationDays);
    setPrice(pkg.price);
    setAllowedSports(pkg.allowedSports || 1);
    setDescription(pkg.description || '');
    setBadge(pkg.badge || '');
    setModalOpen(true);
  };

  const handleSavePackage = async e => {
    e.preventDefault();
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
        proposedHandling: isEn ? 'Choose at least 1 discipline (or 15 for All-Access pass).' : 'Chọn số môn tối thiểu là 1 môn (hoặc 15 môn cho gói All-Access).'
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
      const confirmed = window.confirm(
        isEn
          ? `Warning: Are you sure you want to discontinue "${pkg.name}"?\nExisting active members will keep their current validity until expiry.`
          : `Cảnh báo: Bạn có chắc chắn muốn ngưng phát hành gói "${pkg.name}"?\nCác hội viên đã mua gói này trước đó vẫn được bảo lưu thời hạn đến ngày kết thúc.`
      );
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
                isActive ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              {pkg.badge && (
                <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#81B29A]/15 text-[#2D6A4F] dark:text-[#81B29A] font-chivo text-[10px] font-black uppercase tracking-wider border border-[#81B29A]/30">
                  {pkg.badge}
                </span>
              )}

              <div>
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
                    {pkg.allowedSports === 15 ? (isEn ? 'All 15 disciplines' : 'Toàn bộ 15 môn') : `${pkg.allowedSports} ${isEn ? 'sports' : 'môn'}`}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isActive ? (isEn ? 'Active' : 'Mở bán') : (isEn ? 'Paused' : 'Tạm ngưng')}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(pkg)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#1E2235] hover:bg-[#2B2D42] text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all hover-lift cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>{isEn ? 'Edit' : 'Sửa'}</span>
                </button>
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
        <form onSubmit={handleSavePackage} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Package Name *' : 'Tên gói tập *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isEn ? 'e.g. Olympic Annual Pass, 3-Month Swim...' : 'Ví dụ: Gói Bơi 3 Tháng, Gói Hội Viên Năm...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
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
                min={1}
                max={MAX_PACKAGE_PRICE}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Validity (Days) *' : 'Thời hạn (Ngày) *'}
              </label>
              <input
                type="number"
                required
                min={1}
                value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Disciplines Included *' : 'Số môn được tập *'}
              </label>
              <select
                value={allowedSports}
                onChange={e => setAllowedSports(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              >
                <option value={1}>{isEn ? '1 Sport (Single Discipline)' : '1 môn tự chọn'}</option>
                <option value={2}>{isEn ? '2 Sports' : '2 môn'}</option>
                <option value={3}>{isEn ? '3 Sports' : '3 môn'}</option>
                <option value={15}>{isEn ? 'All 15 Disciplines (All-Access)' : 'Toàn bộ 15 môn (All-Access)'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Promotional Badge' : 'Huy hiệu nổi bật'}
              </label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder={isEn ? 'e.g. POPULAR, BEST VALUE' : 'Ví dụ: PHỔ BIẾN, TIẾT KIỆM'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Description & Member Benefits' : 'Mô tả quyền lợi'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isEn ? 'Describe included facilities, equipment, or pass privileges...' : 'Chi tiết quyền lợi, thời gian sử dụng cụm sân bãi...'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
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
              disabled={saving}
              className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift cursor-pointer disabled:opacity-50"
            >
              {saving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save Package' : 'Lưu Gói Tập')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
