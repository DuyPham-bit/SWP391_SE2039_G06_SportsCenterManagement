import { LandingCatalogEditor } from './LandingCatalogEditor.jsx';
import React from 'react';
import { R2ImagePickerModal } from '../../../shared/ui/R2ImagePickerModal.jsx';
import { useHomeContentEditor } from '../model/useHomeContentEditor.js';
import { HomeContentHeader } from './HomeContentHeader.jsx';
import { HomeContentTabs } from './HomeContentTabs.jsx';
import { HeroBannerTab } from './HeroBannerTab.jsx';
import { WhyUsTab } from './WhyUsTab.jsx';
import { ZonesTab } from './ZonesTab.jsx';
import { FooterTab } from './FooterTab.jsx';
import { AuthShowcaseTab } from './AuthShowcaseTab.jsx';
import { PublishBar } from './PublishBar.jsx';

export function HomeContentManagement() {
  const {
    activeTab, addToast, content, deleteFacilityCard, discardKey, handleDiscardChanges,
    handleMediaSelected, handlePreview, handleSaveAll, handleTabChange, isDirty, isEn, isLoading, isSaving, loadError,
    mediaPickerConfig, openMediaPicker, setContent, setIsDirty, setMediaPickerConfig, setReloadKey,
    totalFacilities, totalSports, updateCatalogCards, updateContentField, visibleFacilities,
    visibleSports
  } = useHomeContentEditor();

  if (isLoading) {
    return (
      <div role="status" className="p-12 text-center text-brand-navy-500 dark:text-brand-navy-400 font-medium animate-pulse">
        {isEn ? 'Loading homepage content...' : 'Đang tải nội dung trang chủ...'}
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="p-8 rounded-2xl bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-900/50 text-brand-danger-800 dark:text-brand-danger-300 space-y-4">
        <p className="font-semibold text-sm">{loadError}</p>
        <button
          type="button"
          onClick={() => setReloadKey(value => value + 1)}
          className="px-4 py-2 bg-brand-danger-600 hover:bg-brand-danger-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          {isEn ? 'Try Again' : 'Thử lại'}
        </button>
      </div>
    );
  }

  return (
    <fieldset disabled={isSaving} aria-busy={isSaving} className="space-y-6 pb-20 font-inter min-w-0 animate-fade-slide-up">
      {/* 1. TOP HEADER BANNER (Olympic Logo Gradient) */}
      <HomeContentHeader
        handleDiscardChanges={handleDiscardChanges}
        handlePreview={handlePreview}
        handleSaveAll={handleSaveAll}
        isDirty={isDirty}
        isEn={isEn}
        isSaving={isSaving}
        totalFacilities={totalFacilities}
        totalSports={totalSports}
        visibleFacilities={visibleFacilities}
        visibleSports={visibleSports}
      />

      {/* 2. TAB NAVIGATION (7 Sections - All 7 tabs fully visible in responsive grid) */}
      <HomeContentTabs
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        isEn={isEn}
        totalFacilities={totalFacilities}
        totalSports={totalSports}
      />

      {/* 3. SECTION CONTENT */}

      {/* TAB 1: HERO BANNER */}
      {activeTab === 'hero' && (
        <HeroBannerTab
          content={content}
          handleDiscardChanges={handleDiscardChanges}
          handleSaveAll={handleSaveAll}
          isDirty={isDirty}
          isEn={isEn}
          isSaving={isSaving}
          openMediaPicker={openMediaPicker}
          updateContentField={updateContentField}
        />
      )}

      {/* TAB 2: WHY US & STATS */}
      {activeTab === 'whyUs' && (
        <WhyUsTab
          content={content}
          openMediaPicker={openMediaPicker}
          handleDiscardChanges={handleDiscardChanges}
          handleSaveAll={handleSaveAll}
          handleTabChange={handleTabChange}
          isDirty={isDirty}
          isEn={isEn}
          isSaving={isSaving}
          updateContentField={updateContentField}
        />
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
        <ZonesTab
          content={content}
          handleDiscardChanges={handleDiscardChanges}
          handleSaveAll={handleSaveAll}
          isDirty={isDirty}
          isEn={isEn}
          isSaving={isSaving}
          updateContentField={updateContentField}
        />
      )}

      {/* TAB 6: CTA & FOOTER */}
      {activeTab === 'footer' && (
        <FooterTab
          content={content}
          handleDiscardChanges={handleDiscardChanges}
          handleSaveAll={handleSaveAll}
          isDirty={isDirty}
          isEn={isEn}
          isSaving={isSaving}
          updateContentField={updateContentField}
        />
      )}

      {/* TAB 7: AUTH SHOWCASE (Login & Register Column) */}
      {activeTab === 'authShowcase' && (
        <AuthShowcaseTab
          addToast={addToast}
          content={content}
          handleDiscardChanges={handleDiscardChanges}
          handleSaveAll={handleSaveAll}
          isDirty={isDirty}
          isEn={isEn}
          isSaving={isSaving}
          openMediaPicker={openMediaPicker}
          setContent={setContent}
          setIsDirty={setIsDirty}
          updateContentField={updateContentField}
        />
      )}

      {/* 4. CLOUD MEDIA PICKER MODAL */}
      <R2ImagePickerModal
        isOpen={mediaPickerConfig.isOpen}
        title={mediaPickerConfig.title}
        currentImage={mediaPickerConfig.currentUrl}
        onClose={() => {
          setMediaPickerConfig(prev => ({ ...prev, isOpen: false }));
          mediaPickerConfig.onClose?.();
        }}
        onSelectImage={handleMediaSelected}
      />

      {/* 5. STICKY FLOATING ACTION BAR FOR INSTANT SAVING */}
      {isDirty && (
        <PublishBar
          handleDiscardChanges={handleDiscardChanges}
          handleSaveAll={handleSaveAll}
          isEn={isEn}
          isSaving={isSaving}
        />
      )}
    </fieldset>
  );
}
