import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { getLandingContent, loadLandingContent, loadLandingDraft, getLegacyLandingContent, saveLandingContent, openLandingPreview } from '../../../entities/landing-content/index.js';
import { cloneContent, saveDraft, clearDraft, readLocalDraft, flushDraft } from './draft.js';

export function useHomeContentEditor() {
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
    Promise.all([
      loadLandingContent({ signal: controller.signal }),
      // The draft lives in the DB; a failed lookup only means "no draft to restore".
      loadLandingDraft({ signal: controller.signal }).catch(() => null)
    ]).then(([result, serverDraft]) => {
      if (!active) return;
      savedContentRef.current = cloneContent(result.content);
      const published = JSON.stringify(result.content);
      // Prefer the server draft; a local copy only exists if a previous autosave could not reach the server.
      const localDraft = readLocalDraft();
      const draft = serverDraft?.content && JSON.stringify(serverDraft.content) !== published ? serverDraft.content
        : localDraft && JSON.stringify(localDraft) !== published ? localDraft
        : null;

      if (draft) {
        setContent(draft);
        setIsDirty(true);
        if (draft === localDraft) saveDraft(localDraft); // push the offline copy to the server
        addToast(
          isEn
            ? 'Restored the saved draft. Click "Save All Changes" to publish it.'
            : 'Đã khôi phục bản nháp đã lưu. Bấm "Lưu Toàn Bộ Thay Đổi" để công bố.',
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

  // Save any pending autosave when the editor is left inside the app.
  useEffect(() => () => { void flushDraft(); }, []);

  // Prevent accidental loss of edits when hitting F5
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      void flushDraft();
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

  return {
    activeTab, addToast, content, deleteFacilityCard, discardKey, handleDiscardChanges,
    handlePreview, handleSaveAll, handleTabChange, isDirty, isEn, isLoading, isSaving, loadError,
    mediaPickerConfig, openMediaPicker, setContent, setIsDirty, setMediaPickerConfig, setReloadKey,
    totalFacilities, totalSports, updateCatalogCards, updateContentField, visibleFacilities,
    visibleSports
  };
}
