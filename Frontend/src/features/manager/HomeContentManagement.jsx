import React, { useState, useEffect } from 'react';
import {
  getLandingContent,
  getLegacyLandingContent,
  loadLandingContent,
  saveLandingContent,
  resetLandingContentToDefault,
  openLandingPreview
} from '../../services/landingContentService.js';
import { CloudMediaPickerModal } from '../../components/common/CloudMediaPickerModal.jsx';
import { useToast } from '../../context/ToastContext.js';

export function HomeContentManagement() {
  const { showToast: addToast } = useToast();
  const [content, setContent] = useState(() => getLandingContent());
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'whyUs' | 'sports' | 'facilities' | 'zones' | 'footer'
  const [isDirty, setIsDirty] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // States cho Modal chọn ảnh đám mây
  const [mediaPickerConfig, setMediaPickerConfig] = useState({
    isOpen: false,
    title: '',
    targetField: '',
    currentUrl: '',
    callback: null
  });

  // States cho Modal sửa / thêm Môn học
  const [editingSport, setEditingSport] = useState(null); // null = đóng, object = đang sửa/thêm
  const [isNewSport, setIsNewSport] = useState(false);

  // States cho Modal sửa / thêm Cụm sân
  const [editingFacility, setEditingFacility] = useState(null); // null = đóng, object = đang sửa/thêm
  const [isNewFacility, setIsNewFacility] = useState(false);

  // Filter cho môn học & cụm sân trong manager
  const [sportSearch, setSportSearch] = useState('');
  const [facilitySearch, setFacilitySearch] = useState('');

  // Do not replace an unsaved draft with a background refresh.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');
    loadLandingContent({ signal: controller.signal }).then(result => {
      if (!active) return;
      const legacy = !result.hasPublishedContent ? getLegacyLandingContent() : null;
      setContent(legacy || result.content);
      setIsDirty(Boolean(legacy));
      if (legacy) {
        addToast('Đã tải nội dung cũ trên trình duyệt thành bản nháp. Bấm Lưu để công bố cho mọi người.', 'info');
      }
    }).catch(error => {
      if (active) setLoadError(error.message || 'Không thể tải nội dung trang chủ.');
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [reloadKey]);

  // Đánh dấu có thay đổi
  const updateContentField = (section, key, value) => {
    setContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  // Lưu toàn bộ nội dung
  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const saved = await saveLandingContent(content);
      setContent(saved);
      setIsDirty(false);
      addToast('Đã lưu và đồng bộ toàn bộ nội dung Trang chủ thành công!', 'success');
    } catch (error) {
      addToast(error.message || 'Lỗi khi lưu nội dung. Vui lòng kiểm tra lại.', 'error');
    } finally { setIsSaving(false); }
  };

  // Khôi phục mặc định
  const handleResetDefault = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const defaultData = await resetLandingContentToDefault();
      setContent(defaultData);
      setIsDirty(false);
      setIsResetConfirmOpen(false);
      addToast('Đã khôi phục toàn bộ nội dung Trang chủ về chuẩn thiết kế ban đầu!', 'info');
    } catch (error) {
      addToast(error.message || 'Không thể khôi phục nội dung. Vui lòng thử lại.', 'error');
    } finally { setIsSaving(false); }
  };

  // Xem trước trang chủ ở tab mới an toàn mà không làm thay đổi URL/hash của tab hiện tại
  const handlePreview = () => {
    try {
      openLandingPreview(content);
    } catch (error) {
      addToast(error.message || 'Không thể mở bản xem trước.', 'error');
    }
  };

  // Mở Cloud Media Picker
  const openMediaPicker = (title, currentUrl, callback) => {
    setMediaPickerConfig({
      isOpen: true,
      title,
      currentUrl,
      callback
    });
  };

  // Xử lý bật/tắt hiển thị môn học
  const handleToggleSport = (sportId, e) => {
    e.stopPropagation();
    const updated = content.coursesSection.sportsList.map(s => {
      if (s.id === sportId) return { ...s, isVisible: !s.isVisible };
      return s;
    });
    setContent(prev => ({
      ...prev,
      coursesSection: {
        ...prev.coursesSection,
        sportsList: updated
      }
    }));
    setIsDirty(true);
  };

  // Xử lý bật/tắt hiển thị cụm sân
  const handleToggleFacility = (facilityId, e) => {
    e.stopPropagation();
    const updated = content.facilitiesSection.facilitiesList.map(f => {
      if (f.id === facilityId) return { ...f, isVisible: !f.isVisible };
      return f;
    });
    setContent(prev => ({
      ...prev,
      facilitiesSection: {
        ...prev.facilitiesSection,
        facilitiesList: updated
      }
    }));
    setIsDirty(true);
  };

  // Lưu thẻ Môn học (Thêm mới hoặc Cập nhật)
  const handleSaveSportModal = () => {
    if (!editingSport.name?.trim()) {
      addToast('Vui lòng nhập tên môn học', 'warning');
      return;
    }

    let updatedList;
    if (isNewSport) {
      const newId = editingSport.id || `sport-${Date.now()}`;
      updatedList = [...content.coursesSection.sportsList, { ...editingSport, id: newId, isVisible: true }];
    } else {
      updatedList = content.coursesSection.sportsList.map(s =>
        s.id === editingSport.id ? editingSport : s
      );
    }

    setContent(prev => ({
      ...prev,
      coursesSection: {
        ...prev.coursesSection,
        sportsList: updatedList
      }
    }));
    setIsDirty(true);
    setEditingSport(null);
    addToast(isNewSport ? 'Đã thêm môn học mới' : 'Đã cập nhật môn học', 'success');
  };

  // Xóa thẻ môn học
  const handleDeleteSport = (sportId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thẻ môn học này không?')) {
      const updatedList = content.coursesSection.sportsList.filter(s => s.id !== sportId);
      setContent(prev => ({
        ...prev,
        coursesSection: {
          ...prev.coursesSection,
          sportsList: updatedList
        }
      }));
      setIsDirty(true);
      addToast('Đã xóa thẻ môn học', 'info');
    }
  };

  // Lưu thẻ Cụm sân (Thêm mới hoặc Cập nhật)
  const handleSaveFacilityModal = () => {
    if (!editingFacility.name?.trim()) {
      addToast('Vui lòng nhập tên cụm sân', 'warning');
      return;
    }

    let updatedList;
    if (isNewFacility) {
      const newId = editingFacility.id || `room-${Date.now()}`;
      updatedList = [...content.facilitiesSection.facilitiesList, { ...editingFacility, id: newId, isVisible: true }];
    } else {
      updatedList = content.facilitiesSection.facilitiesList.map(f =>
        f.id === editingFacility.id ? editingFacility : f
      );
    }

    setContent(prev => ({
      ...prev,
      facilitiesSection: {
        ...prev.facilitiesSection,
        facilitiesList: updatedList
      }
    }));
    setIsDirty(true);
    setEditingFacility(null);
    addToast(isNewFacility ? 'Đã thêm cụm sân mới' : 'Đã cập nhật cụm sân', 'success');
  };

  // Xóa thẻ cụm sân
  const handleDeleteFacility = (facilityId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thẻ cụm sân này không?')) {
      const updatedList = content.facilitiesSection.facilitiesList.filter(f => f.id !== facilityId);
      setContent(prev => ({
        ...prev,
        facilitiesSection: {
          ...prev.facilitiesSection,
          facilitiesList: updatedList
        }
      }));
      setIsDirty(true);
      addToast('Đã xóa thẻ cụm sân', 'info');
    }
  };

  // Thống kê nhanh
  const totalSports = content.coursesSection.sportsList.length;
  const visibleSports = content.coursesSection.sportsList.filter(s => s.isVisible !== false).length;
  const totalFacilities = content.facilitiesSection.facilitiesList.length;
  const visibleFacilities = content.facilitiesSection.facilitiesList.filter(f => f.isVisible !== false).length;

  if (isLoading) return <div role="status" className="p-8 text-center">Đang tải nội dung trang chủ...</div>;
  if (loadError) return (
    <div role="alert" className="p-8 rounded-xl bg-red-50 text-red-800 space-y-4">
      <p>{loadError}</p>
      <button type="button" onClick={() => setReloadKey(value => value + 1)} className="px-4 py-2 border rounded-lg">Thử lại</button>
    </div>
  );

  return (
    <fieldset disabled={isSaving} aria-busy={isSaving} className="space-y-6 pb-20 font-inter min-w-0">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-red-600/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[11px] font-black uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DYNAMIC CONTENT MANAGEMENT &amp; CLOUD STORAGE</span>
            </div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Quản Lý Nội Dung Trang Chủ &amp; Đa Phương Tiện
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Tùy biến toàn bộ nội dung hiển thị ở Landing Page: chỉnh sửa văn bản, cập nhật ảnh đám mây, chủ động ẩn hoặc hiển thị các thẻ môn học và cụm sân thi đấu.
            </p>

            {/* Metrics Chips */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-rose-400">sports_score</span>
                <span>Môn thể thao: <strong>{visibleSports}/{totalSports}</strong> đang hiển thị</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-400">stadium</span>
                <span>Cụm sân bãi: <strong>{visibleFacilities}/{totalFacilities}</strong> đang hiển thị</span>
              </div>
              {isDirty && (
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>Có thay đổi chưa lưu</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePreview}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold font-chivo uppercase transition-all flex items-center gap-1.5 cursor-pointer"
              title="Mở xem trang chủ trong tab mới"
            >
              <span className="material-symbols-outlined text-[17px]">visibility</span>
              <span>Xem Trước Trang Chủ</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 text-xs font-bold font-chivo uppercase transition-all flex items-center gap-1.5"
              title="Khôi phục lại nội dung chuẩn ban đầu"
            >
              <span className="material-symbols-outlined text-[17px]">restart_alt</span>
              <span>Khôi Phục Gốc</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-black uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Lưu Toàn Bộ Thay Đổi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION (6 KHU VỰC NHẬP LIỆU KHOA HỌC) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'hero', label: '1. Hero Banner', icon: 'crop_original', desc: 'Banner chính & Video' },
          { id: 'whyUs', label: '2. Tại Sao Chọn SCMS', icon: 'verified', desc: '3 Ưu thế & 4 Số liệu' },
          { id: 'sports', label: '3. Thẻ Môn Thể Thao', icon: 'sports_kabaddi', desc: `${totalSports} Bộ môn` },
          { id: 'facilities', label: '4. Thẻ Cụm Sân', icon: 'stadium', desc: `${totalFacilities} Khu liên hợp` },
          { id: 'zones', label: '5. Sơ Đồ Phân Khu', icon: 'apartment', desc: 'Bố trí khu A-B-C' },
          { id: 'footer', label: '6. Banner Kêu Gọi & Footer', icon: 'contact_support', desc: 'Sự kiện & Liên hệ' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-chivo text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[19px] shrink-0">{tab.icon}</span>
            <div className="flex flex-col text-left">
              <span>{tab.label}</span>
              <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-white/80' : 'text-slate-400'}`}>
                {tab.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 3. NỘI DUNG TỪNG TAB */}

      {/* TAB 1: HERO BANNER */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-chivo text-lg font-black text-slate-900 uppercase">
                Khu Vực 1: Hero Banner Mở Đầu Trang Chủ (Ảnh 1)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉnh sửa dòng tiêu đề, phụ đề, đường dẫn video/ảnh nền và 4 chỉ số nhanh xuất hiện ở màn hình đầu tiên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Huy hiệu trên tiêu đề (Badge):</label>
                <input
                  type="text"
                  value={content.heroBanner.badge}
                  onChange={(e) => updateContentField('heroBanner', 'badge', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề chính (Main Heading):</label>
                <input
                  type="text"
                  value={content.heroBanner.title}
                  onChange={(e) => updateContentField('heroBanner', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-black uppercase text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả giới thiệu (Subtext):</label>
                <textarea
                  rows={3}
                  value={content.heroBanner.description}
                  onChange={(e) => updateContentField('heroBanner', 'description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nút hành động chính:</label>
                  <input
                    type="text"
                    value={content.heroBanner.primaryCtaText}
                    onChange={(e) => updateContentField('heroBanner', 'primaryCtaText', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Liên kết nút chính:</label>
                  <input
                    type="text"
                    value={content.heroBanner.primaryCtaLink}
                    onChange={(e) => updateContentField('heroBanner', 'primaryCtaLink', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Media background preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hình ảnh / Poster nền Đám mây:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={content.heroBanner.posterUrl}
                    onChange={(e) => updateContentField('heroBanner', 'posterUrl', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs truncate"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaPicker('Chọn Ảnh Nền Hero Banner', content.heroBanner.posterUrl, (url) => {
                      updateContentField('heroBanner', 'posterUrl', url);
                    })}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    <span>Tải/Đổi Ảnh</span>
                  </button>
                </div>
                <div className="h-36 rounded-xl overflow-hidden bg-slate-900 relative border border-slate-200">
                  <img
                    src={content.heroBanner.posterUrl}
                    alt="Hero poster preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[11px] text-white font-bold bg-black/60 px-2 py-0.5 rounded">
                      Xem trước Poster Banner
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Đường dẫn Video Nền (MP4):</label>
                <input
                  type="text"
                  value={content.heroBanner.videoUrl}
                  onChange={(e) => updateContentField('heroBanner', 'videoUrl', e.target.value)}
                  placeholder="./hero-video.mp4"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 4 Chỉ số nhanh Hero */}
          <div className="border-t border-slate-200 pt-5">
            <h3 className="font-chivo text-xs font-bold text-slate-800 uppercase mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-red-600">speed</span>
              <span>4 Chỉ Số Nhanh Tại Dải Banner (Quick Metrics Strip)</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {content.heroBanner.metrics.map((metric, idx) => (
                <div key={metric.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => {
                      const updated = [...content.heroBanner.metrics];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      updateContentField('heroBanner', 'metrics', updated);
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-sm font-black text-red-600 text-center"
                  />
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => {
                      const updated = [...content.heroBanner.metrics];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      updateContentField('heroBanner', 'metrics', updated);
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 text-center uppercase"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TẠI SAO CHỌN SCMS & THỐNG KÊ */}
      {activeTab === 'whyUs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-chivo text-lg font-black text-slate-900 uppercase">
              Khu Vực 2: Tại Sao Nên Chọn SCMS (Ảnh 2)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật tiêu đề, 3 ưu thế vượt trội và 4 thẻ thống kê số liệu màu đỏ bên phải.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Huy hiệu (Badge):</label>
                <input
                  type="text"
                  value={content.whyUs.badge}
                  onChange={(e) => updateContentField('whyUs', 'badge', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề phần Giới thiệu:</label>
                <input
                  type="text"
                  value={content.whyUs.title}
                  onChange={(e) => updateContentField('whyUs', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-extrabold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả chi tiết:</label>
                <textarea
                  rows={3}
                  value={content.whyUs.description}
                  onChange={(e) => updateContentField('whyUs', 'description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed"
                />
              </div>

              {/* 3 Khối ưu thế */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-bold text-slate-800 uppercase">3 Điểm Nổi Bật Vượt Trội:</span>
                {content.whyUs.features.map((feat, idx) => (
                  <div key={feat.id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded bg-red-600 text-white flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">{feat.icon}</span>
                      </span>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={(e) => {
                          const updated = [...content.whyUs.features];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          updateContentField('whyUs', 'features', updated);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={feat.description}
                      onChange={(e) => {
                        const updated = [...content.whyUs.features];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        updateContentField('whyUs', 'features', updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[11px] leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Thẻ thống kê màu đỏ */}
            <div className="space-y-4">
              <span className="block text-xs font-bold text-slate-800 uppercase">
                4 Thẻ Thống Kê Số Liệu Nổi Bật (Card Đỏ):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.whyUs.stats.map((st, idx) => (
                  <div key={st.id || idx} className="p-4 rounded-xl bg-red-600 text-white space-y-2 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-[24px] text-white/80">{st.icon}</span>
                      <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-0.5 rounded">
                        Thẻ {idx + 1}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={st.number}
                        onChange={(e) => {
                          const updated = [...content.whyUs.stats];
                          updated[idx] = { ...updated[idx], number: Number(e.target.value) };
                          updateContentField('whyUs', 'stats', updated);
                        }}
                        className="w-2/3 px-2 py-1 rounded bg-white text-slate-900 font-chivo font-black text-lg text-center"
                      />
                      <input
                        type="text"
                        value={st.suffix || ''}
                        placeholder="Hậu tố"
                        onChange={(e) => {
                          const updated = [...content.whyUs.stats];
                          updated[idx] = { ...updated[idx], suffix: e.target.value };
                          updateContentField('whyUs', 'stats', updated);
                        }}
                        className="w-1/3 px-2 py-1 rounded bg-white text-slate-900 font-bold text-xs text-center"
                      />
                    </div>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const updated = [...content.whyUs.stats];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        updateContentField('whyUs', 'stats', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white/20 border border-white/30 text-white text-xs font-extrabold uppercase"
                    />
                    <input
                      type="text"
                      value={st.subtitle}
                      onChange={(e) => {
                        const updated = [...content.whyUs.stats];
                        updated[idx] = { ...updated[idx], subtitle: e.target.value };
                        updateContentField('whyUs', 'stats', updated);
                      }}
                      className="w-full px-2 py-1 rounded bg-white/10 border border-white/20 text-white/90 text-[11px]"
                    />
                  </div>
                ))}
              </div>

              {/* Dải cam kết */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 mt-4">
                <span className="block text-[11px] font-bold text-slate-700 uppercase">
                  Dải Cam Kết Chất Lượng (Trust Strip):
                </span>
                <input
                  type="text"
                  value={content.whyUs.trustBanner.title}
                  onChange={(e) => {
                    const updated = { ...content.whyUs.trustBanner, title: e.target.value };
                    updateContentField('whyUs', 'trustBanner', updated);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                />
                <input
                  type="text"
                  value={content.whyUs.trustBanner.description}
                  onChange={(e) => {
                    const updated = { ...content.whyUs.trustBanner, description: e.target.value };
                    updateContentField('whyUs', 'trustBanner', updated);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ CÁC THẺ MÔN THỂ THAO */}
      {activeTab === 'sports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-chivo text-lg font-black text-slate-900 uppercase">
                Khu Vực 3: Các Thẻ Hiển Thị Môn Học (Ảnh 3 &amp; 4)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chủ động chỉnh sửa nội dung, thêm môn học, tải ảnh đám mây hoặc <strong>bật/tắt ẩn khỏi giao diện</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsNewSport(true);
                setEditingSport({
                  name: '',
                  category: 'Bóng & Vợt',
                  icon: 'sports_tennis',
                  facilityId: 'room-01',
                  venue: 'Khu thể thao SCMS',
                  rating: '5.0',
                  ratingCount: '100',
                  level: 'Mọi trình độ',
                  coach: 'HLV Chuyên Nghiệp',
                  schedule: '06:00 - 21:00',
                  highlight: 'Mô tả tóm tắt lớp học thể thao...',
                  price: 'Từ 50.000đ/buổi',
                  badges: ['ĐẠT CHUẨN', 'CHUYÊN NGHIỆP'],
                  image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop',
                  isVisible: true
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Thêm Môn Học Mới</span>
            </button>
          </div>

          {/* Header section config */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Tiêu đề Section Môn Học:</label>
              <input
                type="text"
                value={content.coursesSection.title}
                onChange={(e) => updateContentField('coursesSection', 'title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-extrabold uppercase"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mô tả Section:</label>
              <input
                type="text"
                value={content.coursesSection.description}
                onChange={(e) => updateContentField('coursesSection', 'description', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={sportSearch}
                onChange={(e) => setSportSearch(e.target.value)}
                placeholder="Tìm kiếm theo tên môn học, danh mục, huấn luyện viên..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
              Hiển thị: <strong>{visibleSports}</strong> / {totalSports} môn
            </span>
          </div>

          {/* Danh sách các thẻ môn học */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.coursesSection.sportsList
              .filter(s => !sportSearch || s.name.toLowerCase().includes(sportSearch.toLowerCase()) || s.category?.toLowerCase().includes(sportSearch.toLowerCase()))
              .map((sport) => {
                const isVisible = sport.isVisible !== false;

                return (
                  <div
                    key={sport.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      isVisible
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                        : 'bg-slate-100/70 border-slate-300/80 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Media Image */}
                      <div className="h-36 rounded-xl overflow-hidden bg-slate-900 relative mb-3 border border-slate-200">
                        <img
                          src={sport.image}
                          alt={sport.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/75 text-white uppercase backdrop-blur-sm">
                            {sport.category}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-md ${
                            isVisible ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {isVisible ? 'Đang Hiển Thị' : 'Tạm Ẩn'}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold drop-shadow">
                          <span>{sport.price}</span>
                          <span>⭐ {sport.rating}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-chivo text-base font-black text-slate-900 uppercase">
                          {sport.name}
                        </h3>
                        <span className="text-xs text-rose-600 font-bold shrink-0">
                          {sport.schedule}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                        {sport.venue}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                        {sport.highlight}
                      </p>
                    </div>

                    {/* Actions bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Nút bật tắt ẩn/hiện */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSport(sport.id, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                        title={isVisible ? 'Nhấp để ẩn thẻ này khỏi trang chủ' : 'Nhấp để hiển thị lại thẻ này trên trang chủ'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isVisible ? 'visibility' : 'visibility_off'}
                        </span>
                        <span>{isVisible ? 'Hiện' : 'Đang ẩn'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewSport(false);
                            setEditingSport({ ...sport });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSport(sport.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa môn học"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: QUẢN LÝ CÁC THẺ CỤM SÂN */}
      {activeTab === 'facilities' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-chivo text-lg font-black text-slate-900 uppercase">
                Khu Vực 4: Các Thẻ Cơ Sở Vật Chất &amp; Cụm Sân (Ảnh 5 &amp; 6)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý các cụm sân bãi: sửa đổi thông số, cập nhật ảnh chính &amp; phụ đám mây, <strong>bật/tắt ẩn khỏi giao diện</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsNewFacility(true);
                setEditingFacility({
                  name: '',
                  category: 'team-sports',
                  categoryName: 'Sân bóng & Vợt',
                  location: 'Khu B • Tầng 1',
                  zone: 'Khu B',
                  capacity: '10 - 20 người',
                  openHours: '06:00 - 22:00 hàng ngày',
                  priceRate: 'Từ 80.000đ/giờ',
                  badge: 'Đạt Chuẩn Thi Đấu',
                  badgeColor: 'bg-red-600',
                  image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
                  highlights: 'Mặt sàn tiêu chuẩn • Chiếu sáng ban đêm • Tiện nghi',
                  description: 'Không gian cụm sân đạt tiêu chuẩn phục vụ thi đấu và tập luyện phong trào.',
                  specs: [
                    { label: 'Quy cách', value: 'Tiêu chuẩn quốc tế' },
                    { label: 'Mặt sàn', value: 'Sơn phủ thể thao chống trượt' }
                  ],
                  amenities: ['Phòng thay đồ', 'Tủ để đồ cá nhân', 'Nước uống miễn phí'],
                  isVisible: true
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>Thêm Cụm Sân Mới</span>
            </button>
          </div>

          {/* 4 Chỉ số mặt sàn sân bãi */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-xs font-bold text-slate-800 uppercase mb-3">
              4 Chỉ Số Thống Kê Cơ Sở Vật Chất (Ảnh 5):
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {content.facilitiesSection.metrics.map((fm, idx) => (
                <div key={fm.id || idx} className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <input
                    type="text"
                    value={fm.value}
                    onChange={(e) => {
                      const updated = [...content.facilitiesSection.metrics];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      updateContentField('facilitiesSection', 'metrics', updated);
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 font-chivo text-sm font-black text-slate-900 text-center"
                  />
                  <input
                    type="text"
                    value={fm.label}
                    onChange={(e) => {
                      const updated = [...content.facilitiesSection.metrics];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      updateContentField('facilitiesSection', 'metrics', updated);
                    }}
                    className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 text-center uppercase"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
                placeholder="Tìm kiếm cụm sân theo tên, khu vực A-B-C, tầng, vị trí..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
              Hiển thị: <strong>{visibleFacilities}</strong> / {totalFacilities} sân
            </span>
          </div>

          {/* Danh sách các thẻ cụm sân */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.facilitiesSection.facilitiesList
              .filter(f => !facilitySearch || f.name.toLowerCase().includes(facilitySearch.toLowerCase()) || f.location?.toLowerCase().includes(facilitySearch.toLowerCase()))
              .map((fac) => {
                const isVisible = fac.isVisible !== false;

                return (
                  <div
                    key={fac.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                      isVisible
                        ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                        : 'bg-slate-100/70 border-slate-300/80 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Media Image */}
                      <div className="h-40 rounded-xl overflow-hidden bg-slate-900 relative mb-3 border border-slate-200">
                        <img
                          src={fac.image}
                          alt={fac.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/75 text-white uppercase backdrop-blur-sm">
                            {fac.location}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-md ${
                            isVisible ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {isVisible ? 'Đang Hiển Thị' : 'Tạm Ẩn'}
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-bold drop-shadow">
                          <span>Sức chứa: {fac.capacity}</span>
                          <span className="text-emerald-400">Mở cửa</span>
                        </div>
                      </div>

                      {/* Info */}
                      <h3 className="font-chivo text-base font-black text-slate-900 leading-snug">
                        {fac.name}
                      </h3>
                      <div className="text-xs text-red-600 font-bold mt-1">
                        {fac.priceRate}
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-200">
                        <strong className="text-red-600 block mb-0.5">Đặc điểm:</strong>
                        <span className="line-clamp-2">{fac.highlights}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFacility(fac.id, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                        title={isVisible ? 'Nhấp để ẩn cụm sân này khỏi trang chủ' : 'Nhấp để hiển thị lại'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isVisible ? 'visibility' : 'visibility_off'}
                        </span>
                        <span>{isVisible ? 'Hiện' : 'Đang ẩn'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewFacility(false);
                            setEditingFacility({ ...fac });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFacility(fac.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa cụm sân"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 5: SƠ ĐỒ PHÂN KHU & TIỆN ÍCH */}
      {activeTab === 'zones' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-chivo text-lg font-black text-slate-900 uppercase">
              Khu Vực 5: Sơ Đồ Các Khu Vực Tập Luyện (Ảnh 7)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật 4 tiện ích dịch vụ bên trái và bố trí các phân khu Khu A, B, C và Ngoài trời.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề Section Sơ Đồ:</label>
                <input
                  type="text"
                  value={content.zonesLayout.title}
                  onChange={(e) => updateContentField('zonesLayout', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-extrabold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả tổng quát:</label>
                <textarea
                  rows={3}
                  value={content.zonesLayout.description}
                  onChange={(e) => updateContentField('zonesLayout', 'description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed"
                />
              </div>

              {/* 4 Tiện ích */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-bold text-slate-800 uppercase">4 Tiện Ích Dịch Vụ Đi Kèm:</span>
                {content.zonesLayout.serviceAmenities.map((sa, idx) => (
                  <div key={sa.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">{sa.icon}</span>
                    </span>
                    <input
                      type="text"
                      value={sa.text}
                      onChange={(e) => {
                        const updated = [...content.zonesLayout.serviceAmenities];
                        updated[idx] = { ...updated[idx], text: e.target.value };
                        updateContentField('zonesLayout', 'serviceAmenities', updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Phân khu */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-slate-800 uppercase">4 Khối Phân Bố Khu Vực:</span>
              {content.zonesLayout.zones.map((zn, idx) => (
                <div key={zn.id || idx} className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-red-400">{zn.icon}</span>
                    <input
                      type="text"
                      value={zn.name}
                      onChange={(e) => {
                        const updated = [...content.zonesLayout.zones];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        updateContentField('zonesLayout', 'zones', updated);
                      }}
                      className="flex-1 px-3 py-1 bg-white/10 rounded border border-white/20 text-xs font-bold text-white uppercase"
                    />
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {zn.items.map((it, itIdx) => (
                      <input
                        key={itIdx}
                        type="text"
                        value={it}
                        onChange={(e) => {
                          const updated = [...content.zonesLayout.zones];
                          updated[idx] = { ...updated[idx], items: updated[idx].items.map((item, index) => index === itIdx ? e.target.value : item) };
                          updateContentField('zonesLayout', 'zones', updated);
                        }}
                        className="w-full px-2.5 py-1 bg-white/5 rounded border border-white/10 text-[11px] text-slate-300"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BANNER KÊU GỌI & FOOTER */}
      {activeTab === 'footer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-chivo text-lg font-black text-slate-900 uppercase">
              Khu Vực 6: Banner Kêu Gọi Sự Kiện &amp; Chân Trang Footer (Ảnh 8)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật banner đỏ kêu gọi đặt sân giải đấu, số hotline liên hệ, email, Zalo, Facebook, địa chỉ và thời gian hoạt động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner kêu gọi */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white space-y-3 shadow-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2.5 py-1 rounded inline-block">
                Banner Kêu Gọi Thuê Sân Sự Kiện (Card Đỏ)
              </span>
              <div>
                <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">Tiêu đề Banner:</label>
                <input
                  type="text"
                  value={content.ctaAndFooter.ctaTitle}
                  onChange={(e) => updateContentField('ctaAndFooter', 'ctaTitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/20 border border-white/30 text-white font-chivo text-sm font-black uppercase"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">Mô tả kêu gọi:</label>
                <textarea
                  rows={3}
                  value={content.ctaAndFooter.ctaDescription}
                  onChange={(e) => updateContentField('ctaAndFooter', 'ctaDescription', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/20 border border-white/30 text-white text-xs leading-relaxed"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">Nút hành động 1:</label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.ctaPrimaryText}
                    onChange={(e) => updateContentField('ctaAndFooter', 'ctaPrimaryText', e.target.value)}
                    className="w-full px-2.5 py-1 rounded bg-white text-red-600 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">Nút hành động 2:</label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.ctaSecondaryText}
                    onChange={(e) => updateContentField('ctaAndFooter', 'ctaSecondaryText', e.target.value)}
                    className="w-full px-2.5 py-1 rounded bg-white/20 border border-white/40 text-white font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin liên hệ & Giờ mở cửa */}
            <div className="space-y-4">
              <span className="block text-xs font-bold text-slate-800 uppercase">
                Thông Tin Liên Hệ &amp; Giờ Mở Cửa (Footer):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Hotline CSKH:</label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.contactPhone}
                    onChange={(e) => updateContentField('ctaAndFooter', 'contactPhone', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email liên hệ:</label>
                  <input
                    type="email"
                    value={content.ctaAndFooter.contactEmail}
                    onChange={(e) => updateContentField('ctaAndFooter', 'contactEmail', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="footer-zalo-phone" className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Số điện thoại Zalo:</label>
                    <input
                      id="footer-zalo-phone"
                      type="tel"
                      autoComplete="tel"
                      value={content.ctaAndFooter.contactZaloPhone}
                      onChange={(e) => updateContentField('ctaAndFooter', 'contactZaloPhone', e.target.value)}
                      placeholder="0901 234 567"
                      aria-describedby="footer-social-links-help"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label htmlFor="footer-facebook-url" className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Liên kết Facebook:</label>
                    <input
                      id="footer-facebook-url"
                      type="url"
                      value={content.ctaAndFooter.contactFacebookUrl}
                      onChange={(e) => updateContentField('ctaAndFooter', 'contactFacebookUrl', e.target.value)}
                      placeholder="https://www.facebook.com/..."
                      aria-describedby="footer-social-links-help"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
                <p id="footer-social-links-help" className="mt-1.5 text-[11px] text-slate-500">
                  Zalo: nhập số điện thoại 10 chữ số hoặc đầu số +84. Facebook: nhập đường dẫn HTTP/HTTPS. Để trống để ẩn liên hệ tương ứng trên trang chủ.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Địa chỉ trung tâm:</label>
                <input
                  type="text"
                  value={content.ctaAndFooter.contactAddress}
                  onChange={(e) => updateContentField('ctaAndFooter', 'contactAddress', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Thứ 2 - Thứ 6:</label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.hoursWeekdays}
                    onChange={(e) => updateContentField('ctaAndFooter', 'hoursWeekdays', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Thứ 7 - CN:</label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.hoursWeekend}
                    onChange={(e) => updateContentField('ctaAndFooter', 'hoursWeekend', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Ngày Lễ:</label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.hoursHolidays}
                    onChange={(e) => updateContentField('ctaAndFooter', 'hoursHolidays', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Bản quyền (Copyright):</label>
                <input
                  type="text"
                  value={content.ctaAndFooter.copyright}
                  onChange={(e) => updateContentField('ctaAndFooter', 'copyright', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL CHỈNH SỬA / THÊM MỚI THẺ MÔN HỌC */}
      {editingSport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col font-inter">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{editingSport.icon || 'sports'}</span>
                </span>
                <div>
                  <span className="font-chivo text-[10px] font-black uppercase tracking-widest text-red-400 block">
                    DYNAMIC SPORT CARD MANAGEMENT
                  </span>
                  <h3 className="font-chivo text-lg font-black uppercase text-white leading-tight">
                    {isNewSport ? 'Thêm Thẻ Môn Học Mới' : `Chỉnh Sửa Thẻ: ${editingSport.name}`}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSport(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên môn học (*):</label>
                  <input
                    type="text"
                    value={editingSport.name}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Danh mục môn:</label>
                  <select
                    value={editingSport.category}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    <option value="Sức bền & Tĩnh tâm">Sức bền & Tĩnh tâm</option>
                    <option value="Thể thao đối kháng">Thể thao đối kháng</option>
                    <option value="Bóng & Vợt">Bóng & Vợt</option>
                  </select>
                </div>
              </div>

              {/* Upload Ảnh đám mây */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hình ảnh thẻ môn học (Cloud Media Storage):
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editingSport.image}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, image: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaPicker('Chọn Ảnh Đám Mây Cho Môn Học', editingSport.image, (url) => {
                      setEditingSport(prev => ({ ...prev, image: url }));
                    })}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    <span>Tải/Chọn Ảnh</span>
                  </button>
                </div>
                <div className="h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src={editingSport.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Học phí / Vé:</label>
                  <input
                    type="text"
                    value={editingSport.price}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khung giờ hoạt động:</label>
                  <input
                    type="text"
                    value={editingSport.schedule}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, schedule: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Huấn luyện viên phụ trách:</label>
                  <input
                    type="text"
                    value={editingSport.coach}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, coach: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cơ sở / Sân tập liên kết:</label>
                  <input
                    type="text"
                    value={editingSport.venue}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, venue: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả đặc điểm nổi bật:</label>
                <textarea
                  rows={2}
                  value={editingSport.highlight}
                  onChange={(e) => setEditingSport(prev => ({ ...prev, highlight: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed"
                />
              </div>

              {/* Trạng thái hiển thị */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase block">Trạng Thái Hiển Thị Trên Trang Chủ:</span>
                  <span className="text-[11px] text-slate-500">Nếu tắt, thẻ môn học sẽ bị ẩn khỏi Landing Page của khách hàng</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSport.isVisible !== false}
                    onChange={(e) => setEditingSport(prev => ({ ...prev, isVisible: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setEditingSport(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveSportModal}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-black uppercase rounded-xl shadow-md cursor-pointer"
              >
                Lưu Thẻ Môn Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL CHỈNH SỬA / THÊM MỚI THẺ CỤM SÂN */}
      {editingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col font-inter">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-[20px]">stadium</span>
                </span>
                <div>
                  <span className="font-chivo text-[10px] font-black uppercase tracking-widest text-red-400 block">
                    DYNAMIC FACILITY CARD MANAGEMENT
                  </span>
                  <h3 className="font-chivo text-lg font-black uppercase text-white leading-tight">
                    {isNewFacility ? 'Thêm Thẻ Cụm Sân Mới' : `Chỉnh Sửa Thẻ Cụm Sân: ${editingFacility.name}`}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFacility(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên cụm sân (*):</label>
                  <input
                    type="text"
                    value={editingFacility.name}
                    onChange={(e) => setEditingFacility(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vị trí phân khu:</label>
                  <input
                    type="text"
                    value={editingFacility.location}
                    onChange={(e) => setEditingFacility(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="VD: Khu A • Tầng 1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Upload Ảnh chính đám mây */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hình ảnh cụm sân chính (Cloud Media Storage):
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={editingFacility.image}
                    onChange={(e) => setEditingFacility(prev => ({ ...prev, image: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaPicker('Chọn Ảnh Đám Mây Cho Cụm Sân', editingFacility.image, (url) => {
                      setEditingFacility(prev => ({ ...prev, image: url }));
                    })}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    <span>Tải/Chọn Ảnh</span>
                  </button>
                </div>
                <div className="h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img src={editingFacility.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mức giá thuê:</label>
                  <input
                    type="text"
                    value={editingFacility.priceRate}
                    onChange={(e) => setEditingFacility(prev => ({ ...prev, priceRate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sức chứa phục vụ:</label>
                  <input
                    type="text"
                    value={editingFacility.capacity}
                    onChange={(e) => setEditingFacility(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Huy hiệu thẻ (Badge):</label>
                <input
                  type="text"
                  value={editingFacility.badge}
                  onChange={(e) => setEditingFacility(prev => ({ ...prev, badge: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Đặc điểm nổi bật (Highlights):</label>
                <input
                  type="text"
                  value={editingFacility.highlights}
                  onChange={(e) => setEditingFacility(prev => ({ ...prev, highlights: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả chi tiết:</label>
                <textarea
                  rows={2}
                  value={editingFacility.description}
                  onChange={(e) => setEditingFacility(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed"
                />
              </div>

              {/* Trạng thái hiển thị */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase block">Trạng Thái Hiển Thị Trên Trang Chủ:</span>
                  <span className="text-[11px] text-slate-500">Nếu tắt, cụm sân này sẽ bị ẩn khỏi Landing Page của khách hàng</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFacility.isVisible !== false}
                    onChange={(e) => setEditingFacility(prev => ({ ...prev, isVisible: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setEditingFacility(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold uppercase"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveFacilityModal}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-black uppercase rounded-xl shadow-md cursor-pointer"
              >
                Lưu Thẻ Cụm Sân
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL XÁC NHẬN KHÔI PHỤC MẶC ĐỊNH */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-center font-inter">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <h3 className="font-chivo text-lg font-black uppercase text-slate-900">
              Xác Nhận Khôi Phục Mặc Định?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Toàn bộ các tùy biến về chữ, hình ảnh, trạng thái ẩn/hiện môn học và sân bãi sẽ được đặt lại theo đúng thiết kế ban đầu trong ảnh mẫu screenshot.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold uppercase hover:bg-slate-50"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Đồng Ý Khôi Phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CLOUD MEDIA PICKER MODAL */}
      <CloudMediaPickerModal
        isOpen={mediaPickerConfig.isOpen}
        title={mediaPickerConfig.title}
        currentImage={mediaPickerConfig.currentUrl}
        onClose={() => setMediaPickerConfig(prev => ({ ...prev, isOpen: false }))}
        onSelectImage={(url) => {
          if (mediaPickerConfig.callback) {
            mediaPickerConfig.callback(url);
          }
        }}
      />
    </fieldset>
  );
}
