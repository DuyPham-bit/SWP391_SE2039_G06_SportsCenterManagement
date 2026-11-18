import { LandingCatalogEditor } from './LandingCatalogEditor.jsx';
import React from 'react';
import { CloudMediaPickerModal } from './CloudMediaPickerModal.jsx';
import { TAB_SECTIONS, useHomeContentEditor } from '../model/useHomeContentEditor.js';
import { HomeContentHeader } from './HomeContentHeader.jsx';
import { HomeContentTabs } from './HomeContentTabs.jsx';
import { HeroBannerTab } from './HeroBannerTab.jsx';
import { WhyUsTab } from './WhyUsTab.jsx';
import { ZonesTab } from './ZonesTab.jsx';
import { FooterTab } from './FooterTab.jsx';
import { AuthShowcaseTab } from './AuthShowcaseTab.jsx';
import { PublishBar } from './PublishBar.jsx';
import { TabSaveFooter } from './TabSaveFooter.jsx';
import { SectionHeading } from './fields.jsx';

function EditorSkeleton({ label }) {
  return (
    <div role="status" aria-label={label} className="space-y-6 animate-pulse">
      <div className="h-44 rounded-2xl bg-brand-navy-200/70 dark:bg-brand-navy-800" />
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => <div key={i} className="h-16 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800/70" />)}
      </div>
      <div className="rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-6 sm:p-8 space-y-4">
        <div className="h-5 w-1/3 rounded bg-brand-navy-200/70 dark:bg-brand-navy-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map(column => (
            <div key={column} className="space-y-3">
              {[0, 1, 2].map(row => <div key={row} className="h-10 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800/70" />)}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function HomeContentManagement() {
  const editor = useHomeContentEditor();
  const {
    activeTab, content, deleteFacilityCard, dirtySections, discardKey, editLang, handleDiscardChanges, handlePreview,
    handleSaveAll, handleSaveSection, handleTabChange, isDirty, isLoading, isSaving, loadError, mediaPickerConfig,
    missingBySection, openMediaPicker, saveStatus, setEditLang, setMediaPickerConfig, setReloadKey, stats, t,
    updateCatalogCards, updateContentField
  } = editor;

  if (isLoading) return <EditorSkeleton label={t('homeContent.status.loading')} />;

  if (loadError) {
    return (
      <div role="alert" className="p-8 rounded-2xl bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-900/50 text-brand-danger-800 dark:text-brand-danger-300 space-y-4">
        <p className="font-semibold text-sm">{loadError}</p>
        <button
          type="button"
          onClick={() => setReloadKey(value => value + 1)}
          className="px-4 py-2 bg-brand-danger-600 hover:bg-brand-danger-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          {t('homeContent.action.retry')}
        </button>
      </div>
    );
  }

  const section = TAB_SECTIONS[activeTab];
  const tabProps = {
    addToast: editor.addToast, content, lang: editLang, setLang: setEditLang, missing: missingBySection[activeTab] || {}, openMediaPicker, stats, t,
    updateContentField,
    footer: (
      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveSection={handleSaveSection} isDirty={isDirty}
        isSectionDirty={dirtySections.has(section)} isSaving={isSaving} saveStatus={saveStatus} t={t} />
    )
  };
  const catalogTab = type => {
    const isSports = type === 'sports';
    const sports = content.coursesSection || {};
    const facilities = content.facilitiesSection || {};
    return (
      <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
        <SectionHeading
          title={t(isSports ? 'homeContent.catalog.sportsTitle' : 'homeContent.catalog.facilitiesTitle')}
          description={t('homeContent.catalog.description', stats?.[isSports ? 'sports' : 'facilities'] || { visible: '—', total: '—' })}
          lang={editLang} setLang={setEditLang} missing={tabProps.missing} t={t}
        />
        {isSports ? (
          <LandingCatalogEditor
            key={`sports-${discardKey}`}
            type="sports"
            lang={editLang}
            metadata={sports.sportsList || []}
            fallbackToCatalog={sports.catalogSource !== 'custom'}
            facilities={facilities.facilitiesList?.length || facilities.catalogSource === 'custom' ? facilities.facilitiesList : undefined}
            onChange={items => updateCatalogCards('coursesSection', 'sportsList', items)}
            openMediaPicker={openMediaPicker}
          />
        ) : (
          <LandingCatalogEditor
            key={`facilities-${discardKey}`}
            type="facilities"
            lang={editLang}
            metadata={facilities.facilitiesList || []}
            fallbackToCatalog={facilities.catalogSource !== 'custom'}
            sports={sports.sportsList?.length || sports.catalogSource === 'custom' ? sports.sportsList : undefined}
            onChange={items => updateCatalogCards('facilitiesSection', 'facilitiesList', items)}
            onDelete={deleteFacilityCard}
            openMediaPicker={openMediaPicker}
          />
        )}
        {tabProps.footer}
      </div>
    );
  };

  return (
    <fieldset disabled={isSaving} aria-busy={isSaving} className="space-y-6 pb-20 font-inter min-w-0 animate-fade-slide-up">
      <HomeContentHeader
        handleDiscardChanges={handleDiscardChanges}
        handlePreview={handlePreview}
        handleSaveAll={handleSaveAll}
        isDirty={isDirty}
        isSaving={isSaving}
        saveStatus={saveStatus}
        stats={stats}
        t={t}
      />

      <HomeContentTabs
        activeTab={activeTab}
        content={content}
        dirtySections={dirtySections}
        handleTabChange={handleTabChange}
        missingBySection={missingBySection}
        sectionOf={TAB_SECTIONS}
        stats={stats}
        t={t}
      />

      {activeTab === 'hero' && <HeroBannerTab {...tabProps} />}
      {activeTab === 'whyUs' && <WhyUsTab {...tabProps} handleTabChange={handleTabChange} />}
      {activeTab === 'sports' && catalogTab('sports')}
      {activeTab === 'facilities' && catalogTab('facilities')}
      {activeTab === 'zones' && <ZonesTab {...tabProps} />}
      {activeTab === 'footer' && <FooterTab {...tabProps} />}
      {activeTab === 'authShowcase' && <AuthShowcaseTab {...tabProps} />}

      <CloudMediaPickerModal
        isOpen={mediaPickerConfig.isOpen}
        title={mediaPickerConfig.title}
        currentImage={mediaPickerConfig.currentUrl}
        onClose={() => {
          setMediaPickerConfig(prev => ({ ...prev, isOpen: false }));
          mediaPickerConfig.onClose?.();
        }}
        onSelectImage={url => mediaPickerConfig.callback?.(url)}
      />

      {isDirty && <PublishBar handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isSaving={isSaving} t={t} />}
    </fieldset>
  );
}
