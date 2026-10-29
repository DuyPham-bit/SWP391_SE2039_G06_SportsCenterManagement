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
const MANAGER_DRAFT_KEY = 'SCMS_MANAGER_LANDING_DRAFT_V2';

const saveDraft = (updatedContent) => {
  try {
    localStorage.setItem(MANAGER_DRAFT_KEY, JSON.stringify(updatedContent));
  } catch { /* storage quota or private browsing */ }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(MANAGER_DRAFT_KEY);
  } catch { /* storage disabled */ }
};

export function HomeContentManagement() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const { showToast: addToast } = useToast();
  const [content, setContent] = useState(() => getLandingContent());
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const hash = window.location.hash || '';
      const query = hash.includes('?') ? hash.split('?')[1] : '';
      const tabFromQuery = new URLSearchParams(query).get('tab');
      if (tabFromQuery) return tabFromQuery;
      const tabFromSession = sessionStorage.getItem('SCMS_MANAGER_ACTIVE_TAB');
      if (tabFromSession) return tabFromSession;
    } catch { /* ignore */ }
    return 'hero';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      sessionStorage.setItem('SCMS_MANAGER_ACTIVE_TAB', tabId);
      const hash = window.location.hash || '';
      const [path, queryString] = hash.split('?');
      const params = new URLSearchParams(queryString || '');
      params.set('tab', tabId);
      window.history.replaceState(null, '', `${path}?${params.toString()}`);
    } catch { /* ignore */ }
  };

  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const savedContentRef = useRef(null);
  const latestContentRef = useRef(content);
  const [discardKey, setDiscardKey] = useState(0);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

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

      // Check for local draft preserved across F5
      let localDraft = null;
      try {
        const raw = localStorage.getItem(MANAGER_DRAFT_KEY);
        if (raw) localDraft = JSON.parse(raw);
      } catch { localDraft = null; }

      if (localDraft && JSON.stringify(localDraft) !== JSON.stringify(result.content)) {
        setContent(localDraft);
        setIsDirty(true);
        addToast(
          isEn
            ? 'Restored your unsaved draft. Click "Save All Changes" to publish to server.'
            : 'Đã giữ lại số liệu bạn đang chỉnh sửa (Bản nháp). Bấm "Lưu Toàn Bộ Thay Đổi" để công bố lên máy chủ.',
          'info'
        );
      } else {
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
      }
    }).catch(error => {
      if (active) setLoadError(error.message || (isEn ? 'Failed to load homepage content.' : 'Không thể tải nội dung trang chủ.'));
    }).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [reloadKey, isEn]);

  // Prevent accidental loss of edits when hitting F5
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Đánh dấu có thay đổi và lưu bản nháp vào localStorage
  const updateContentField = (section, key, value) => {
    setContent(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...(prev[section] || {}),
          [key]: value
        }
      };
      saveDraft(updated);
      return updated;
    });
    setIsDirty(true);
  };

  // Cập nhật danh sách thẻ trong bản nháp
  const updateCatalogCards = (section, key, items) => {
    setContent(prev => {
      const updated = {
        ...prev,
        [section]: { ...(prev[section] || {}), [key]: items, catalogSource: 'custom' }
      };
      saveDraft(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const deleteFacilityCard = (record, items, fallbackSports) => {
    setContent(prev => {
      const section = prev.coursesSection;
      const sports = section.sportsList.length || section.catalogSource === 'custom' ? section.sportsList : fallbackSports;
      const hasLinks = sports.some(sport => String(sport.facilityId) === String(record.id));
      const updated = {
        ...prev,
        facilitiesSection: { ...prev.facilitiesSection, facilitiesList: items, catalogSource: 'custom' },
        coursesSection: hasLinks ? {
          ...section,
          sportsList: sports.map(sport => String(sport.facilityId) === String(record.id) ? { ...sport, facilityId: '' } : sport),
          catalogSource: 'custom'
        } : section
      };
      saveDraft(updated);
      return updated;
    });
    setIsDirty(true);
  };

  // Lưu toàn bộ nội dung thủ công khi người dùng bấm nút Lưu
  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const target = latestContentRef.current || content;
      const saved = await saveLandingContent(target);
      savedContentRef.current = cloneContent(saved);
      setContent(saved);
      clearDraft();
      setIsDirty(false);
      addToast(
        isEn
          ? 'Homepage content saved and published successfully!'
          : 'Đã lưu và công bố toàn bộ nội dung thành công!',
        'success'
      );
    } catch (error) {
      addToast(error.message || (isEn ? 'Error saving content. Please try again.' : 'Lỗi khi lưu nội dung. Vui lòng kiểm tra lại.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (isSaving || !isDirty || !savedContentRef.current) return;
    setContent(cloneContent(savedContentRef.current));
    clearDraft();
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

  // Nút lưu trực tiếp tại chân mỗi mục để không cần cuộn lên trên cùng
  const renderTabSaveFooter = () => (
    <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl">
      <div className="flex items-center gap-2 text-xs">
        <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {isDirty
            ? (isEn ? 'Unsaved changes. Click "Save All Changes" to apply.' : 'Có thay đổi chưa lưu. Hãy bấm "Lưu Toàn Bộ Thay Đổi" để áp dụng.')
            : (isEn ? 'All changes synchronized with server.' : 'Toàn bộ số liệu đã được lưu và đồng bộ với máy chủ.')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDiscardChanges}
          disabled={!isDirty || isSaving}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isEn ? 'Discard Changes' : 'Hủy thay đổi'}
        </button>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={!isDirty || isSaving}
          className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#2D6A4F]/25 transition-all flex items-center gap-1.5 cursor-pointer hover-lift disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isSaving ? 'sync' : 'save'}
          </span>
          <span>
            {isSaving
              ? (isEn ? 'Saving...' : 'Đang lưu...')
              : (isEn ? 'Save All Changes' : 'Lưu Toàn Bộ Thay Đổi')}
          </span>
        </button>
      </div>
    </div>
  );

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
                  <span>{isEn ? 'Unsaved changes' : 'Có thay đổi chưa lưu (Bấm Lưu để áp dụng)'}</span>
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
              disabled={isSaving || !isDirty}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer hover-lift ${
                isDirty
                  ? 'bg-[#2D6A4F] hover:bg-[#1B4332] shadow-[#2D6A4F]/30 ring-2 ring-emerald-400/50'
                  : 'bg-white/10 text-white/50 border border-white/15 cursor-not-allowed opacity-60 shadow-none'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSaving ? 'sync' : 'save'}
              </span>
              <span>
                {isSaving
                  ? (isEn ? 'Saving...' : 'Đang lưu...')
                  : (isEn ? 'Save All Changes' : 'Lưu Toàn Bộ Thay Đổi')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION (7 Sections - All 7 tabs fully visible in responsive grid) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
        {[
          { id: 'hero', label: isEn ? '1. Hero Banner' : '1. Hero Banner', icon: 'crop_original', desc: isEn ? 'Main Banner & Media' : 'Banner chính & Video' },
          { id: 'whyUs', label: isEn ? '2. Why SCMS' : '2. Tại Sao Chọn SCMS', icon: 'verified', desc: isEn ? '3 Merits & 4 Stats' : '3 Ưu thế & 4 Số liệu' },
          { id: 'sports', label: isEn ? '3. Sports' : '3. Môn Thể Thao', icon: 'sports_kabaddi', desc: `${totalSports} ${isEn ? 'Sports' : 'Bộ môn'}` },
          { id: 'facilities', label: isEn ? '4. Facilities' : '4. Thẻ Cụm Sân', icon: 'stadium', desc: `${totalFacilities} ${isEn ? 'Facilities' : 'Khu liên hợp'}` },
          { id: 'zones', label: isEn ? '5. Zones' : '5. Sơ Đồ Phân Khu', icon: 'apartment', desc: isEn ? 'Zones A-B-C' : 'Bố trí khu A-B-C' },
          { id: 'footer', label: isEn ? '6. CTA & Footer' : '6. Kêu Gọi & Footer', icon: 'contact_support', desc: isEn ? 'Events & Info' : 'Sự kiện & Liên hệ' },
          {
            id: 'authShowcase',
            label: isEn ? '7. Auth Showcase' : '7. Banner Đăng Nhập',
            icon: 'badge',
            desc: isEn ? 'Login Page (3 Stats)' : 'Trang Đăng Nhập (3 số liệu)',
            badge: isEn ? 'Login Stats' : '3 Số liệu Login'
          }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={`flex flex-col items-start justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative hover-lift text-left ${
              activeTab === tab.id
                ? 'bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25 ring-2 ring-[#2D6A4F]/30'
                : 'text-slate-700 dark:text-slate-200 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-white' : 'text-[#2D6A4F] dark:text-[#81B29A]'}`}>
                {tab.icon}
              </span>
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase ${
                  activeTab === tab.id
                    ? 'bg-white/25 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </div>
            <div className="w-full">
              <span className="block truncate font-black tracking-tight">{tab.label}</span>
              <span className={`block text-[10px] font-medium truncate mt-0.5 ${activeTab === tab.id ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
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

          {renderTabSaveFooter()}
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
              {/* Quick Jump to Tab 7 for Login Stats */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px] shrink-0">info</span>
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isEn ? 'Looking to change stats on Login / Register page?' : 'Bạn muốn đổi 3 số liệu hiển thị trên trang Đăng nhập & Đăng ký?'}
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                      {isEn
                        ? 'The 4 cards below appear on the Homepage "Why Choose SCMS". To edit the 3 stats on Login page (10 Sports, 10 Courts, 2.5K+ Members), jump to Tab 7.'
                        : '4 thẻ dưới đây hiển thị ở mục "Tại sao chọn SCMS" trên Trang chủ. Để đổi 3 số liệu trên trang Đăng nhập (10 Bộ môn, 10 Khu tập luyện, 2.5K+ Hội viên), hãy chuyển sang Tab 7.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('authShowcase')}
                  className="px-3.5 py-1.5 rounded-lg bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm hover-lift"
                >
                  <span>{isEn ? 'Go to Tab 7' : 'Sang Tab 7: Banner Đăng Nhập'}</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>

              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                {isEn ? '4 Highlight Statistics Cards (Homepage "Why Choose SCMS"):' : '4 Thẻ Thống Kê Số Liệu Nổi Bật (Mục "Tại sao chọn SCMS" trên Trang chủ):'}
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

          {renderTabSaveFooter()}
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

          {renderTabSaveFooter()}
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
                ? 'Update membership registration banner, hotline, email, Zalo, Facebook, address and business hours.'
                : 'Cập nhật banner kêu gọi đăng ký gói tập, số hotline liên hệ, email, Zalo, Facebook, địa chỉ và thời gian hoạt động.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Banner CTA */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E2235] via-[#242A42] to-[#2D6A4F] text-white space-y-3 shadow-lg border border-white/10 hover-lift transition-all">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md inline-block text-slate-200">
                {isEn ? 'Membership Call-to-Action' : 'Banner Kêu Gọi Đăng Ký Gói Tập (Card Đỏ)'}
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

          {renderTabSaveFooter()}
        </div>
      )}

      {/* TAB 7: AUTH SHOWCASE (Login & Register Column) */}
      {activeTab === 'authShowcase' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
              {isEn ? 'Section 7: Login & Register Showcase Banner' : 'Khu Vực 7: Banner Giới Thiệu Đăng Nhập & Đăng Ký'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? 'Customize the athletic showcase banner, headline, frosted cards, and live metrics on Login and Register pages.'
                : 'Chỉnh sửa cột giới thiệu thể thao Olympic, tiêu đề truyền cảm hứng, thẻ nổi và 3 chỉ số thống kê trên màn hình Đăng nhập và Đăng ký.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Badge Pill:' : 'Huy hiệu mở cửa (Badge):'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.badge || ''}
                    onChange={(e) => updateContentField('authShowcase', 'badge', e.target.value)}
                    placeholder="Sân tập mở cửa 24/7"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    {isEn ? 'Tagline / Category:' : 'Dòng phụ (Tagline):'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.tagline || ''}
                    onChange={(e) => updateContentField('authShowcase', 'tagline', e.target.value)}
                    placeholder="Khởi đầu bứt phá"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Login Page Headline:' : 'Tiêu đề trang Đăng nhập:'}
                </label>
                <textarea
                  rows={2}
                  value={content.authShowcase?.loginTitle || ''}
                  onChange={(e) => updateContentField('authShowcase', 'loginTitle', e.target.value)}
                  placeholder={"Tập luyện hôm nay, \nbứt phá mỗi ngày."}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isEn ? 'Tip: Enter a new line to apply the multi-color highlight effect to the second line.' : 'Mẹo: Xuống dòng để áp dụng hiệu ứng chuyển màu rực rỡ cho dòng thứ hai.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Register Page Headline:' : 'Tiêu đề trang Đăng ký:'}
                </label>
                <textarea
                  rows={2}
                  value={content.authShowcase?.registerTitle || ''}
                  onChange={(e) => updateContentField('authShowcase', 'registerTitle', e.target.value)}
                  placeholder={"Hành trình mới, \nphiên bản khỏe hơn."}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Showcase Description:' : 'Đoạn văn mô tả giới thiệu:'}
                </label>
                <textarea
                  rows={3}
                  value={content.authShowcase?.description || ''}
                  onChange={(e) => updateContentField('authShowcase', 'description', e.target.value)}
                  placeholder="Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Media background preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  {isEn ? 'Showcase Background Image / Poster (Cloud):' : 'Ảnh nền Cột Đăng nhập / Poster Đám mây:'}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={content.authShowcase?.posterUrl || ''}
                    onChange={(e) => updateContentField('authShowcase', 'posterUrl', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs truncate focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => openMediaPicker(
                      isEn ? 'Select Showcase Background Image' : 'Chọn Ảnh Nền Cột Đăng Nhập',
                      content.authShowcase?.posterUrl || '',
                      (url) => updateContentField('authShowcase', 'posterUrl', url)
                    )}
                    className="px-3.5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all hover-lift shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                    <span>{isEn ? 'Upload/Change' : 'Tải/Đổi Ảnh'}</span>
                  </button>
                </div>

                {/* Live Preview Box like Login left column */}
                <div className="h-64 rounded-2xl overflow-hidden bg-[#2D3047] relative border border-slate-700 p-5 flex flex-col justify-between text-white shadow-inner">
                  {content.authShowcase?.posterUrl && (
                    <img
                      src={content.authShowcase.posterUrl}
                      alt="Showcase preview"
                      className="absolute inset-0 w-full h-full object-cover opacity-35"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#27293D] via-[#3D405B]/80 to-transparent pointer-events-none" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                      {content.authShowcase?.badge || 'Sân tập mở cửa 24/7'}
                    </span>
                    <span className="text-[10px] bg-black/50 text-white/70 px-2 py-0.5 rounded font-mono">
                      {isEn ? 'Preview' : 'Xem trước'}
                    </span>
                  </div>

                  <div className="relative z-10 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#F2CC8F]">
                      {content.authShowcase?.tagline || 'Khởi đầu bứt phá'}
                    </div>
                    <div className="text-sm font-black text-white leading-tight line-clamp-2">
                      {content.authShowcase?.loginTitle || 'Tập luyện hôm nay, bứt phá mỗi ngày.'}
                    </div>
                  </div>

                  <div className="relative z-10 flex gap-4 pt-2 border-t border-white/10 text-xs">
                    <div>
                      <span className="font-bold text-white">{content.authShowcase?.stat1Value || '09'}</span>
                      <span className="text-[10px] text-slate-300 block">{content.authShowcase?.stat1Label || 'Bộ môn'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-white">{content.authShowcase?.stat2Value || '09'}</span>
                      <span className="text-[10px] text-slate-300 block">{content.authShowcase?.stat2Label || 'Khu tập'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-white">{content.authShowcase?.stat3Value || '2.5K+'}</span>
                      <span className="text-[10px] text-slate-300 block">{content.authShowcase?.stat3Label || 'Hội viên'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Feature Cards */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#2D6A4F]">featured_play_list</span>
              <span>{isEn ? '2 Frosted Showcase Feature Cards' : '2 Thẻ Kính Nổi Bật (Feature Cards)'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  {isEn ? 'Feature Card 1' : 'Thẻ tính năng 1'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      {isEn ? 'Icon (Material):' : 'Biểu tượng:'}
                    </label>
                    <input
                      type="text"
                      value={content.authShowcase?.feature1Icon || ''}
                      onChange={(e) => updateContentField('authShowcase', 'feature1Icon', e.target.value)}
                      placeholder="bolt"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      {isEn ? 'Title:' : 'Tiêu đề:'}
                    </label>
                    <input
                      type="text"
                      value={content.authShowcase?.feature1Title || ''}
                      onChange={(e) => updateContentField('authShowcase', 'feature1Title', e.target.value)}
                      placeholder="Đặt chỗ trong 30s"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Description:' : 'Mô tả ngắn:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.feature1Desc || ''}
                    onChange={(e) => updateContentField('authShowcase', 'feature1Desc', e.target.value)}
                    placeholder="Giữ sân & lớp học 7 ngày"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  {isEn ? 'Feature Card 2' : 'Thẻ tính năng 2'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      {isEn ? 'Icon (Material):' : 'Biểu tượng:'}
                    </label>
                    <input
                      type="text"
                      value={content.authShowcase?.feature2Icon || ''}
                      onChange={(e) => updateContentField('authShowcase', 'feature2Icon', e.target.value)}
                      placeholder="verified"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                      {isEn ? 'Title:' : 'Tiêu đề:'}
                    </label>
                    <input
                      type="text"
                      value={content.authShowcase?.feature2Title || ''}
                      onChange={(e) => updateContentField('authShowcase', 'feature2Title', e.target.value)}
                      placeholder="Chuẩn Olympic 5★"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Description:' : 'Mô tả ngắn:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.feature2Desc || ''}
                    onChange={(e) => updateContentField('authShowcase', 'feature2Desc', e.target.value)}
                    placeholder="Hệ thống sân bãi cao cấp"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Stats Metrics */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#2D6A4F]">analytics</span>
                  <span>{isEn ? '3 Quick Stat Numbers on Login Page' : '3 Số Liệu Thống Kê Chân Trang Đăng Nhập & Đăng Ký'}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isEn ? 'Directly controls the numbers displayed at the bottom of the Login & Register hero column.' : 'Chính là 3 số liệu hiển thị tại chân trang cột giới thiệu của màn hình Đăng nhập và Đăng ký.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const s1 = content.whyUs?.stats?.[1]?.number || content.coursesSection?.sportsList?.length || 10;
                  const s2 = content.whyUs?.stats?.[0]?.number || content.facilitiesSection?.facilitiesList?.length || 10;
                  const s3 = content.whyUs?.stats?.[2] ? `${content.whyUs.stats[2].number}${content.whyUs.stats[2].suffix || ''}` : '2.5K+';
                  setContent(prev => {
                    const updated = {
                      ...prev,
                      authShowcase: {
                        ...(prev.authShowcase || {}),
                        stat1Value: String(s1),
                        stat2Value: String(s2),
                        stat3Value: String(s3)
                      }
                    };
                    saveDraft(updated);
                    return updated;
                  });
                  setIsDirty(true);
                  addToast(
                    isEn
                      ? 'Synchronized 3 stats from "Why Choose SCMS" (Tab 2)!'
                      : 'Đã sao chép nhanh số liệu từ Tab 2 (Tại sao chọn SCMS) sang đây!',
                    'success'
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer hover-lift shrink-0"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-600">sync_alt</span>
                <span>{isEn ? 'Sync numbers from Tab 2' : 'Sao chép số liệu từ Tab 2 sang'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Stat 1 */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{isEn ? 'Stat #1 (Sports)' : 'Chỉ số 1 (Bộ môn)'}</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Value:' : 'Con số:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.stat1Value || ''}
                    onChange={(e) => updateContentField('authShowcase', 'stat1Value', e.target.value)}
                    placeholder="10"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Label:' : 'Nhãn mô tả:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.stat1Label || ''}
                    onChange={(e) => updateContentField('authShowcase', 'stat1Label', e.target.value)}
                    placeholder="Bộ môn thi đấu"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Stat 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{isEn ? 'Stat #2 (Courts/Zones)' : 'Chỉ số 2 (Khu tập/Sân)'}</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Value:' : 'Con số:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.stat2Value || ''}
                    onChange={(e) => updateContentField('authShowcase', 'stat2Value', e.target.value)}
                    placeholder="10"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Label:' : 'Nhãn mô tả:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.stat2Label || ''}
                    onChange={(e) => updateContentField('authShowcase', 'stat2Label', e.target.value)}
                    placeholder="Khu tập luyện"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>

              {/* Stat 3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{isEn ? 'Stat #3 (Members)' : 'Chỉ số 3 (Hội viên)'}</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Value:' : 'Con số:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.stat3Value || ''}
                    onChange={(e) => updateContentField('authShowcase', 'stat3Value', e.target.value)}
                    placeholder="2.5K+"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    {isEn ? 'Label:' : 'Nhãn mô tả:'}
                  </label>
                  <input
                    type="text"
                    value={content.authShowcase?.stat3Label || ''}
                    onChange={(e) => updateContentField('authShowcase', 'stat3Label', e.target.value)}
                    placeholder="Hội viên active"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-[#2D6A4F] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Box as seen on Login screen */}
            <div className="mt-5 p-4 rounded-2xl bg-[#2D3047] text-white border border-white/10 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isEn ? 'Live Preview as displayed on Login & Register screen' : 'Xem trước trực tiếp hiển thị tại chân trang Đăng Nhập / Đăng Ký'}</span>
                </div>
                <div className="flex items-center gap-8 sm:gap-12 mt-2.5">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{content.authShowcase?.stat1Value || '09'}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{content.authShowcase?.stat1Label || 'Bộ môn thi đấu'}</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{content.authShowcase?.stat2Value || '09'}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{content.authShowcase?.stat2Label || 'Khu tập luyện'}</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#F2CC8F] tracking-tight">{content.authShowcase?.stat3Value || '2.5K+'}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5">{content.authShowcase?.stat3Label || 'Hội viên active'}</div>
                  </div>
                </div>
              </div>
              <a
                href="#/login"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover-lift"
              >
                <span>{isEn ? 'Open Login Page in New Tab' : 'Mở xem Trang Đăng Nhập'}</span>
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
              </a>
            </div>
          </div>

          {renderTabSaveFooter()}
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

      {/* 5. STICKY FLOATING ACTION BAR FOR INSTANT SAVING */}
      {isDirty && (
        <aside
          role="status"
          aria-label={isEn ? 'Unsaved changes alert bar' : 'Thanh cảnh báo thay đổi số liệu chưa lưu'}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-2xl bg-[#1E2235]/95 text-white backdrop-blur-xl border-2 border-emerald-500/80 rounded-2xl px-5 py-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-slide-up"
        >
          <div className="flex items-center gap-3 text-left">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-emerald-300 flex items-center gap-1.5">
                <span>{isEn ? 'Unsaved Changes Detected' : 'Phát hiện thay đổi số liệu mới'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {isEn ? 'Auto-draft active' : 'Đã giữ trong nháp F5'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {isEn
                  ? 'Your edits survive F5 reload. Click Save to apply to server & live pages.'
                  : 'Dữ liệu được tự động lưu tạm trên trình duyệt. Hãy bấm nút xanh để áp dụng chính thức lên hệ thống.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
            >
              {isEn ? 'Discard' : 'Hủy thay đổi'}
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/40 transition-all flex items-center gap-2 cursor-pointer hover-lift"
            >
              <span className="material-symbols-outlined text-[17px]">save</span>
              <span>{isSaving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save All Changes' : 'Lưu Thay Đổi Ngay')}</span>
            </button>
          </div>
        </aside>
      )}
    </fieldset>
  );
}
