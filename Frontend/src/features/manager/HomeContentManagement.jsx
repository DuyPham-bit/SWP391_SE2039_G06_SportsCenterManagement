import { LandingCatalogEditor } from './LandingCatalogEditor.jsx';
import React, { useState, useEffect, useRef } from 'react';
import {
  getLandingContent,
  getLegacyLandingContent,
  loadLandingContent,
  saveLandingContent,
  openLandingPreview
} from '../../services/landingContentService.js';
import { CloudMediaPickerModal } from '../../components/common/CloudMediaPickerModal.jsx';
import { useToast } from '../../context/ToastContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const cloneContent = content => JSON.parse(JSON.stringify(content));

export function HomeContentManagement() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showToast: addToast } = useToast();
  const [content, setContent] = useState(() => getLandingContent());
  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'whyUs' | 'sports' | 'facilities' | 'zones' | 'footer'
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const savedContentRef = useRef(null);
  const [discardKey, setDiscardKey] = useState(0);

  // States cho Modal chọn ảnh đám mây
  const [mediaPickerConfig, setMediaPickerConfig] = useState({
    isOpen: false,
    title: '',
    targetField: '',
    currentUrl: '',
    callback: null
  });

  // Do not replace an unsaved draft with a background refresh.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError('');
    loadLandingContent({ signal: controller.signal }).then(result => {
      if (!active) return;
      savedContentRef.current = cloneContent(result.content);
      const legacy = !result.hasPublishedContent ? getLegacyLandingContent() : null;
      setContent(legacy || result.content);
      setIsDirty(Boolean(legacy));
      if (legacy) {
        addToast(
          isEn
            ? 'Loaded previous browser content as draft. Click Save to publish.'
            : 'Đã tải nội dung cũ trên trình duyệt thành bản nháp. Bấm Lưu để công bố cho mọi người.',
          'info'
        );
      }
    }).catch(error => {
      if (active) setLoadError(error.message || (isEn ? 'Failed to load homepage content.' : 'Không thể tải nội dung trang chủ.'));
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [reloadKey, isEn]);

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

  // Cập nhật danh sách thẻ trong bản nháp
  const updateCatalogCards = (section, key, items) => {
    setContent(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: items, catalogSource: 'custom' }
    }));
    setIsDirty(true);
  };

  const deleteFacilityCard = (record, items, fallbackSports) => {
    setContent(prev => {
      const section = prev.coursesSection;
      const sports = section.sportsList.length || section.catalogSource === 'custom' ? section.sportsList : fallbackSports;
      const hasLinks = sports.some(sport => String(sport.facilityId) === String(record.id));
      return {
        ...prev,
        facilitiesSection: { ...prev.facilitiesSection, facilitiesList: items, catalogSource: 'custom' },
        coursesSection: hasLinks ? {
          ...section,
          sportsList: sports.map(sport => String(sport.facilityId) === String(record.id) ? { ...sport, facilityId: '' } : sport),
          catalogSource: 'custom'
        } : section
      };
    });
    setIsDirty(true);
  };

  // Lưu toàn bộ nội dung
  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const saved = await saveLandingContent(content);
      savedContentRef.current = cloneContent(saved);
      setContent(saved);
      setIsDirty(false);
      addToast(
        isEn
          ? 'Homepage content saved and synchronized successfully!'
          : 'Đã lưu và đồng bộ toàn bộ nội dung Trang chủ thành công!',
        'success'
      );
    } catch (error) {
      addToast(error.message || (isEn ? 'Error saving content. Please try again.' : 'Lỗi khi lưu nội dung. Vui lòng kiểm tra lại.'), 'error');
    } finally { setIsSaving(false); }
  };

  const handleDiscardChanges = () => {
    if (isSaving || !isDirty || !savedContentRef.current) return;
    setContent(cloneContent(savedContentRef.current));
    setIsDirty(false);
    setDiscardKey(previous => previous + 1);
    setMediaPickerConfig(previous => ({ ...previous, isOpen: false, callback: null, onClose: undefined }));
    addToast(
      isEn
        ? 'Unsaved changes discarded. Content restored to the last successful save.'
        : 'Đã hủy thay đổi chưa lưu và khôi phục nội dung từ lần lưu thành công gần nhất.',
      'info'
    );
  };

  // Xem trước trang chủ ở tab mới an toàn mà không làm thay đổi URL/hash của tab hiện tại
  const handlePreview = () => {
    try {
      openLandingPreview(content);
    } catch (error) {
      addToast(error.message || (isEn ? 'Cannot open preview.' : 'Không thể mở bản xem trước.'), 'error');
    }
  };

  // Mở Cloud Media Picker
  const openMediaPicker = (title, currentUrl, callback, onClose) => {
    setMediaPickerConfig({
      isOpen: true,
      title,
      currentUrl,
      callback,
      onClose
    });
  };

  // Thống kê nhanh
  const totalSports = content.coursesSection?.sportsList?.length || 0;
  const visibleSports = (content.coursesSection?.sportsList || []).filter(s => s.isVisible !== false).length;
  const totalFacilities = content.facilitiesSection?.facilitiesList?.length || 0;
  const visibleFacilities = (content.facilitiesSection?.facilitiesList || []).filter(f => f.isVisible !== false).length;

  if (isLoading) {
    return (
      <div role="status" className="p-12 text-center text-slate-500 dark:text-slate-400 font-medium animate-pulse">
        {isEn ? 'Loading homepage content...' : 'Đang tải nội dung trang chủ...'}
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="p-8 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300 space-y-4">
        <p className="font-semibold text-sm">{loadError}</p>
        <button
          type="button"
          onClick={() => setReloadKey(value => value + 1)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          {isEn ? 'Try Again' : 'Thử lại'}
        </button>
      </div>
    );
  }

  return (
    <fieldset disabled={isSaving} aria-busy={isSaving} className="space-y-6 pb-20 font-inter min-w-0 animate-fade-slide-up">
      {/* 1. TOP HEADER BANNER (Olympic Logo Gradient) */}
      <div
        className="text-white rounded-3xl p-6 sm:p-8 border border-white/30 shadow-xl shadow-[#24828F]/25 relative overflow-hidden"
        style={{
          background: 'linear-gradient(108deg, #2F7B5D 0%, #24828F 25%, #3FAEB8 48%, #76B386 70%, #DEAC46 88%, #E5A33C 100%)'
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/40 via-[#E5A33C]/25 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/40 via-[#2F7B5D]/25 to-transparent blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[11px] font-black uppercase tracking-wider mb-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>DYNAMIC CONTENT MANAGEMENT &amp; CLOUD STORAGE</span>
            </div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-black text-white uppercase tracking-tight drop-shadow-sm">
              {isEn ? 'Homepage Content & Media Management' : 'Quản Lý Nội Dung Trang Chủ & Đa Phương Tiện'}
            </h1>
            <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium">
              {isEn
                ? 'Customize public landing page content: edit headlines, upload cloud media, and toggle visibility of sports and court facilities.'
                : 'Tùy biến toàn bộ nội dung hiển thị ở Landing Page: chỉnh sửa văn bản, cập nhật ảnh đám mây, chủ động ẩn hoặc hiển thị các thẻ môn học và cụm sân thi đấu.'}
            </p>

            {/* Metrics Chips */}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-semibold">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#81B29A]">sports_score</span>
                <span>
                  {isEn ? 'Sports:' : 'Môn thể thao:'} <strong>{visibleSports}/{totalSports}</strong> {isEn ? 'visible' : 'đang hiển thị'}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#F2CC8F]">stadium</span>
                <span>
                  {isEn ? 'Facilities:' : 'Cụm sân bãi:'} <strong>{visibleFacilities}/{totalFacilities}</strong> {isEn ? 'visible' : 'đang hiển thị'}
                </span>
              </div>
              {isDirty && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>{isEn ? 'Unsaved changes' : 'Có thay đổi chưa lưu'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePreview}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer hover-lift"
              title={isEn ? 'Open homepage preview in new tab' : 'Mở xem trang chủ trong tab mới'}
            >
              <span className="material-symbols-outlined text-[17px]">visibility</span>
              <span>{isEn ? 'Preview Homepage' : 'Xem Trước Trang Chủ'}</span>
            </button>

            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={!isDirty || isSaving}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-bold uppercase transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              title={isEn ? 'Restore content from the last successful save' : 'Trở về nội dung ở lần lưu thành công gần nhất'}
            >
              <span className="material-symbols-outlined text-[17px]">undo</span>
              <span>{isEn ? 'Discard Changes' : 'Hủy thay đổi'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#2D6A4F]/30 transition-all flex items-center gap-2 cursor-pointer hover-lift"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{isSaving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save All Changes' : 'Lưu Toàn Bộ Thay Đổi')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION (6 Scientific Editorial Sections) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-2 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'hero', label: isEn ? '1. Hero Banner' : '1. Hero Banner', icon: 'crop_original', desc: isEn ? 'Main Banner & Media' : 'Banner chính & Video' },
          { id: 'whyUs', label: isEn ? '2. Why SCMS' : '2. Tại Sao Chọn SCMS', icon: 'verified', desc: isEn ? '3 Advantages & 4 Stats' : '3 Ưu thế & 4 Số liệu' },
          { id: 'sports', label: isEn ? '3. Sports Catalog' : '3. Thẻ Môn Thể Thao', icon: 'sports_kabaddi', desc: `${totalSports} ${isEn ? 'Sports' : 'Bộ môn'}` },
          { id: 'facilities', label: isEn ? '4. Court Facilities' : '4. Thẻ Cụm Sân', icon: 'stadium', desc: `${totalFacilities} ${isEn ? 'Facilities' : 'Khu liên hợp'}` },
          { id: 'zones', label: isEn ? '5. Zones Layout' : '5. Sơ Đồ Phân Khu', icon: 'apartment', desc: isEn ? 'Zones A-B-C Layout' : 'Bố trí khu A-B-C' },
          { id: 'footer', label: isEn ? '6. Call-to-Action & Footer' : '6. Banner Kêu Gọi & Footer', icon: 'contact_support', desc: isEn ? 'Events & Contacts' : 'Sự kiện & Liên hệ' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer hover-lift ${
              activeTab === tab.id
                ? 'bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[19px] shrink-0">{tab.icon}</span>
            <div className="flex flex-col text-left">
              <span>{tab.label}</span>
              <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                {tab.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 3. SECTION CONTENT */}

      {/* TAB 1: HERO BANNER */}
      {activeTab === 'hero' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {isEn ? 'Section 1: Hero Banner Header' : 'Khu Vực 1: Hero Banner Mở Đầu Trang Chủ'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? 'Edit badge, headline, subtext, background video/image and 4 quick metrics on first viewport.'
                : 'Chỉnh sửa dòng tiêu đề, phụ đề, đường dẫn video/ảnh nền và 4 chỉ số nhanh xuất hiện ở màn hình đầu tiên.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Header Badge:' : 'Huy hiệu trên tiêu đề (Badge):'}
                </label>
                <input
                  type="text"
                  value={content.heroBanner.badge}
                  onChange={(e) => updateContentField('heroBanner', 'badge', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Main Headline:' : 'Tiêu đề chính (Main Heading):'}
                </label>
                <input
                  type="text"
                  value={content.heroBanner.title}
                  onChange={(e) => updateContentField('heroBanner', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-black uppercase text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Introduction Subtext:' : 'Mô tả giới thiệu (Subtext):'}
                </label>
                <textarea
                  rows={3}
                  value={content.heroBanner.description}
                  onChange={(e) => updateContentField('heroBanner', 'description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Primary CTA Button:' : 'Nút hành động chính:'}
                  </label>
                  <input
                    type="text"
                    value={content.heroBanner.primaryCtaText}
                    onChange={(e) => updateContentField('heroBanner', 'primaryCtaText', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Primary CTA Link:' : 'Liên kết nút chính:'}
                  </label>
                  <input
                    type="text"
                    value={content.heroBanner.primaryCtaLink}
                    onChange={(e) => updateContentField('heroBanner', 'primaryCtaLink', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Media background preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Background Image / Poster (Cloud):' : 'Hình ảnh / Poster nền Đám mây:'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={content.heroBanner.posterUrl}
                    onChange={(e) => updateContentField('heroBanner', 'posterUrl', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs truncate focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaPicker(isEn ? 'Select Hero Banner Background' : 'Chọn Ảnh Nền Hero Banner', content.heroBanner.posterUrl, (url) => {
                      updateContentField('heroBanner', 'posterUrl', url);
                    })}
                    className="px-3.5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover-lift"
                  >
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    <span>{isEn ? 'Upload/Change' : 'Tải/Đổi Ảnh'}</span>
                  </button>
                </div>
                <div className="h-36 rounded-xl overflow-hidden bg-slate-900 relative border border-slate-200 dark:border-slate-800">
                  <img
                    src={content.heroBanner.posterUrl}
                    alt="Hero poster preview"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-3">
                    <span className="text-[11px] text-white font-bold bg-black/60 px-2 py-0.5 rounded">
                      {isEn ? 'Hero Poster Preview' : 'Xem trước Poster Banner'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Background Video URL (MP4):' : 'Đường dẫn Video Nền (MP4):'}
                </label>
                <input
                  type="text"
                  value={content.heroBanner.videoUrl}
                  onChange={(e) => updateContentField('heroBanner', 'videoUrl', e.target.value)}
                  placeholder="./hero-video.mp4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 4 Quick Metrics */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#2D6A4F] dark:text-[#81B29A]">speed</span>
              <span>{isEn ? '4 Quick Metrics Strip' : '4 Chỉ Số Nhanh Tại Dải Banner (Quick Metrics Strip)'}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {content.heroBanner.metrics.map((metric, idx) => (
                <div key={metric.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5 hover-lift transition-all">
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => {
                      const updated = [...content.heroBanner.metrics];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      updateContentField('heroBanner', 'metrics', updated);
                    }}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-black text-[#2D6A4F] dark:text-[#81B29A] text-center focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => {
                      const updated = [...content.heroBanner.metrics];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      updateContentField('heroBanner', 'metrics', updated);
                    }}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center uppercase focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WHY US & STATS */}
      {activeTab === 'whyUs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {isEn ? 'Section 2: Why Choose SCMS' : 'Khu Vực 2: Tại Sao Nên Chọn SCMS'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? 'Update headline, 3 competitive advantages, and 4 highlight stat cards.'
                : 'Cập nhật tiêu đề, 3 ưu thế vượt trội và 4 thẻ thống kê số liệu bên phải.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Badge:' : 'Huy hiệu (Badge):'}
                </label>
                <input
                  type="text"
                  value={content.whyUs.badge}
                  onChange={(e) => updateContentField('whyUs', 'badge', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Section Title:' : 'Tiêu đề phần Giới thiệu:'}
                </label>
                <input
                  type="text"
                  value={content.whyUs.title}
                  onChange={(e) => updateContentField('whyUs', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Detailed Description:' : 'Mô tả chi tiết:'}
                </label>
                <textarea
                  rows={3}
                  value={content.whyUs.description}
                  onChange={(e) => updateContentField('whyUs', 'description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              {/* 3 Advantages */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {isEn ? '3 Competitive Highlights:' : '3 Điểm Nổi Bật Vượt Trội:'}
                </span>
                {content.whyUs.features.map((feat, idx) => (
                  <div key={feat.id || idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 hover-lift transition-all">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center shrink-0">
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
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
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
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] leading-relaxed focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="space-y-4">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                {isEn ? '4 Highlight Statistics Cards:' : '4 Thẻ Thống Kê Số Liệu Nổi Bật:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {content.whyUs.stats.map((st, idx) => (
                  <div key={st.id || idx} className="p-4 rounded-xl bg-gradient-to-br from-[#1E2235] to-[#242A42] text-white space-y-2 shadow-md hover-lift transition-all border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="material-symbols-outlined text-[24px] text-[#81B29A]">{st.icon}</span>
                      <span className="text-[10px] font-bold uppercase bg-white/10 px-2 py-0.5 rounded text-slate-300">
                        {isEn ? `Card ${idx + 1}` : `Thẻ ${idx + 1}`}
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
                        className="w-2/3 px-2 py-1 rounded-lg bg-white/15 text-white font-black text-lg text-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                      />
                      <input
                        type="text"
                        value={st.suffix || ''}
                        placeholder={isEn ? 'Suffix' : 'Hậu tố'}
                        onChange={(e) => {
                          const updated = [...content.whyUs.stats];
                          updated[idx] = { ...updated[idx], suffix: e.target.value };
                          updateContentField('whyUs', 'stats', updated);
                        }}
                        className="w-1/3 px-2 py-1 rounded-lg bg-white/15 text-white font-bold text-xs text-center border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
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
                      className="w-full px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-extrabold uppercase focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                    />
                    <input
                      type="text"
                      value={st.subtitle}
                      onChange={(e) => {
                        const updated = [...content.whyUs.stats];
                        updated[idx] = { ...updated[idx], subtitle: e.target.value };
                        updateContentField('whyUs', 'stats', updated);
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/90 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                    />
                  </div>
                ))}
              </div>

              {/* Trust Strip */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 mt-4 hover-lift transition-all">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {isEn ? 'Quality Trust Strip:' : 'Dải Cam Kết Chất Lượng (Trust Strip):'}
                </span>
                <input
                  type="text"
                  value={content.whyUs.trustBanner.title}
                  onChange={(e) => {
                    const updated = { ...content.whyUs.trustBanner, title: e.target.value };
                    updateContentField('whyUs', 'trustBanner', updated);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
                <input
                  type="text"
                  value={content.whyUs.trustBanner.description}
                  onChange={(e) => {
                    const updated = { ...content.whyUs.trustBanner, description: e.target.value };
                    updateContentField('whyUs', 'trustBanner', updated);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPORTS CATALOG */}
      {activeTab === 'sports' && (
        <LandingCatalogEditor
          key={`sports-${discardKey}`}
          type="sports"
          metadata={content.coursesSection.sportsList}
          fallbackToCatalog={content.coursesSection.catalogSource !== 'custom'}
          facilities={content.facilitiesSection.facilitiesList.length || content.facilitiesSection.catalogSource === 'custom' ? content.facilitiesSection.facilitiesList : undefined}
          onChange={items => updateCatalogCards('coursesSection', 'sportsList', items)}
          openMediaPicker={openMediaPicker}
        />
      )}

      {/* TAB 4: COURT FACILITIES */}
      {activeTab === 'facilities' && (
        <LandingCatalogEditor
          key={`facilities-${discardKey}`}
          type="facilities"
          metadata={content.facilitiesSection.facilitiesList}
          fallbackToCatalog={content.facilitiesSection.catalogSource !== 'custom'}
          sports={content.coursesSection.sportsList.length || content.coursesSection.catalogSource === 'custom' ? content.coursesSection.sportsList : undefined}
          onChange={items => updateCatalogCards('facilitiesSection', 'facilitiesList', items)}
          onDelete={deleteFacilityCard}
          openMediaPicker={openMediaPicker}
        />
      )}

      {/* TAB 5: ZONES & AMENITIES */}
      {activeTab === 'zones' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {isEn ? 'Section 5: Training Zones & Service Amenities' : 'Khu Vực 5: Sơ Đồ Các Khu Vực Tập Luyện'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? 'Update 4 service amenities and layout of Zones A, B, C and Outdoor.'
                : 'Cập nhật 4 tiện ích dịch vụ bên trái và bố trí các phân khu Khu A, B, C và Ngoài trời.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Layout Section Title:' : 'Tiêu đề Section Sơ Đồ:'}
                </label>
                <input
                  type="text"
                  value={content.zonesLayout.title}
                  onChange={(e) => updateContentField('zonesLayout', 'title', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-extrabold uppercase focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'General Description:' : 'Mô tả tổng quát:'}
                </label>
                <textarea
                  rows={3}
                  value={content.zonesLayout.description}
                  onChange={(e) => updateContentField('zonesLayout', 'description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              {/* 4 Amenities */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                  {isEn ? '4 Attached Service Amenities:' : '4 Tiện Ích Dịch Vụ Đi Kèm:'}
                </span>
                {content.zonesLayout.serviceAmenities.map((sa, idx) => (
                  <div key={sa.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 hover-lift transition-all">
                    <span className="w-8 h-8 rounded-lg bg-[#2D6A4F]/15 text-[#2D6A4F] dark:text-[#81B29A] flex items-center justify-center shrink-0">
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
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Zones */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                {isEn ? '4 Facility Zone Blocks:' : '4 Khối Phân Bố Khu Vực:'}
              </span>
              {content.zonesLayout.zones.map((zn, idx) => (
                <div key={zn.id || idx} className="p-4 rounded-xl bg-[#1E2235] text-white space-y-2 border border-white/10 hover-lift transition-all">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#81B29A]">{zn.icon}</span>
                    <input
                      type="text"
                      value={zn.name}
                      onChange={(e) => {
                        const updated = [...content.zonesLayout.zones];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        updateContentField('zonesLayout', 'zones', updated);
                      }}
                      className="flex-1 px-3 py-1 bg-white/10 rounded-lg border border-white/20 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
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
                        className="w-full px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-[11px] text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CTA & FOOTER */}
      {activeTab === 'footer' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {isEn ? 'Section 6: Event Call-To-Action & Footer Information' : 'Khu Vực 6: Banner Kêu Gọi Sự Kiện & Chân Trang Footer'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? 'Update tournament event banner, hotline, email, Zalo, Facebook, address and business hours.'
                : 'Cập nhật banner kêu gọi đặt sân giải đấu, số hotline liên hệ, email, Zalo, Facebook, địa chỉ và thời gian hoạt động.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner CTA */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E2235] via-[#242A42] to-[#2D6A4F] text-white space-y-3 shadow-lg border border-white/10 hover-lift transition-all">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md inline-block text-slate-200">
                {isEn ? 'Event Rental Call-to-Action' : 'Banner Kêu Gọi Thuê Sân Sự Kiện (Card Đỏ)'}
              </span>
              <div>
                <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
                  {isEn ? 'Banner Title:' : 'Tiêu đề Banner:'}
                </label>
                <input
                  type="text"
                  value={content.ctaAndFooter.ctaTitle}
                  onChange={(e) => updateContentField('ctaAndFooter', 'ctaTitle', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-sm font-black uppercase focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
                  {isEn ? 'Banner Description:' : 'Mô tả kêu gọi:'}
                </label>
                <textarea
                  rows={3}
                  value={content.ctaAndFooter.ctaDescription}
                  onChange={(e) => updateContentField('ctaAndFooter', 'ctaDescription', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
                    {isEn ? 'Primary Button:' : 'Nút hành động 1:'}
                  </label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.ctaPrimaryText}
                    onChange={(e) => updateContentField('ctaAndFooter', 'ctaPrimaryText', e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg bg-white text-[#2D6A4F] font-bold text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
                    {isEn ? 'Secondary Button:' : 'Nút hành động 2:'}
                  </label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.ctaSecondaryText}
                    onChange={(e) => updateContentField('ctaAndFooter', 'ctaSecondaryText', e.target.value)}
                    className="w-full px-2.5 py-1 rounded-lg bg-white/20 border border-white/40 text-white font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Contacts & Hours */}
            <div className="space-y-4">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                {isEn ? 'Contact Info & Business Hours (Footer):' : 'Thông Tin Liên Hệ & Giờ Mở Cửa (Footer):'}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Support Hotline:' : 'Hotline CSKH:'}
                  </label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.contactPhone}
                    onChange={(e) => updateContentField('ctaAndFooter', 'contactPhone', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Contact Email:' : 'Email liên hệ:'}
                  </label>
                  <input
                    type="email"
                    value={content.ctaAndFooter.contactEmail}
                    onChange={(e) => updateContentField('ctaAndFooter', 'contactEmail', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="footer-zalo-phone" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      {isEn ? 'Zalo Phone Number:' : 'Số điện thoại Zalo:'}
                    </label>
                    <input
                      id="footer-zalo-phone"
                      type="tel"
                      autoComplete="tel"
                      value={content.ctaAndFooter.contactZaloPhone}
                      onChange={(e) => updateContentField('ctaAndFooter', 'contactZaloPhone', e.target.value)}
                      placeholder="0901 234 567"
                      aria-describedby="footer-social-links-help"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="footer-facebook-url" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      {isEn ? 'Facebook Link:' : 'Liên kết Facebook:'}
                    </label>
                    <input
                      id="footer-facebook-url"
                      type="url"
                      value={content.ctaAndFooter.contactFacebookUrl}
                      onChange={(e) => updateContentField('ctaAndFooter', 'contactFacebookUrl', e.target.value)}
                      placeholder="https://www.facebook.com/..."
                      aria-describedby="footer-social-links-help"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                </div>
                <p id="footer-social-links-help" className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {isEn
                    ? 'Zalo: 10-digit number or +84 prefix. Facebook: valid HTTP/HTTPS URL. Leave blank to hide.'
                    : 'Zalo: nhập số điện thoại 10 chữ số hoặc đầu số +84. Facebook: nhập đường dẫn HTTP/HTTPS. Để trống để ẩn liên hệ tương ứng trên trang chủ.'}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Center Address:' : 'Địa chỉ trung tâm:'}
                </label>
                <input
                  type="text"
                  value={content.ctaAndFooter.contactAddress}
                  onChange={(e) => updateContentField('ctaAndFooter', 'contactAddress', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Mon - Fri:' : 'Thứ 2 - Thứ 6:'}
                  </label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.hoursWeekdays}
                    onChange={(e) => updateContentField('ctaAndFooter', 'hoursWeekdays', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Sat - Sun:' : 'Thứ 7 - CN:'}
                  </label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.hoursWeekend}
                    onChange={(e) => updateContentField('ctaAndFooter', 'hoursWeekend', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Holidays:' : 'Ngày Lễ:'}
                  </label>
                  <input
                    type="text"
                    value={content.ctaAndFooter.hoursHolidays}
                    onChange={(e) => updateContentField('ctaAndFooter', 'hoursHolidays', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Copyright Notice:' : 'Bản quyền (Copyright):'}
                </label>
                <input
                  type="text"
                  value={content.ctaAndFooter.copyright}
                  onChange={(e) => updateContentField('ctaAndFooter', 'copyright', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLOUD MEDIA PICKER MODAL */}
      <CloudMediaPickerModal
        isOpen={mediaPickerConfig.isOpen}
        title={mediaPickerConfig.title}
        currentImage={mediaPickerConfig.currentUrl}
        onClose={() => {
          setMediaPickerConfig(prev => ({ ...prev, isOpen: false }));
          mediaPickerConfig.onClose?.();
        }}
        onSelectImage={(url) => {
          if (mediaPickerConfig.callback) {
            mediaPickerConfig.callback(url);
          }
        }}
      />
    </fieldset>
  );
}
