import React, { useState, useMemo, useEffect } from 'react';
import { useLandingContent } from '../../../entities/landing-content/index.js';
import { usePublicCatalog, getLandingPresentation } from '../../../entities/catalog/index.js';
import { useLanguage } from '../../../shared/i18n/index.js';
import { useAuth } from '../../../entities/session/index.js';
import { getMembershipAction, getMembershipBanner, packageApi } from '../../../entities/membership/index.js';
import { useHorizontalCarousel } from '../model/useHorizontalCarousel.js';
import { CarouselSideArrows } from './CarouselControls.jsx';
import { CampusMapExplorer } from '../../../features/campus-map/index.js';
import { formatVnd } from '../../../shared/lib/money.js';

// Facility category codes (stored in the content) → Material icon.
const CATEGORY_ICONS = {
  golf: 'golf_course', aquatics: 'pool', pool: 'pool', fitness: 'fitness_center',
  'combat-studio': 'sports_kabaddi', 'martial-arts': 'sports_kabaddi', 'team-sports': 'sports_soccer'
};

export function FacilitiesSection({ externalFacility = null, onModalClose = null } = {}) {
  const { isAuthenticated, role } = useAuth();
  const { language, t } = useLanguage();
  const notSet = t('landing.common.notUpdated');
  const membershipAction = getMembershipAction(isAuthenticated, role, t);
  const isMember = isAuthenticated && role === 'MEMBER';
  // Published content is already in the selected language (GET /api/home-content?lang=…).
  const editorialContent = useLandingContent();
  const { catalog, loading: catalogLoading, error: catalogError } = usePublicCatalog();
  const includedLabel = t('landing.priceIncluded');
  const landingContent = useMemo(() => getLandingPresentation(editorialContent, catalog, includedLabel), [editorialContent, catalog, includedLabel]);
  const membershipBanner = getMembershipBanner(landingContent?.ctaAndFooter, t);
  const contactPhone = landingContent?.ctaAndFooter?.contactPhone || catalog?.center?.phone;
  const contactEmail = landingContent?.ctaAndFooter?.contactEmail || catalog?.center?.email;
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('packages');
  const [packages, setPackages] = useState([]);
  useEffect(() => {
    let active = true;
    packageApi.getAll()
      .then((res) => {
        if (active && Array.isArray(res) && res.length > 0) {
          setPackages(res);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Classes held in this room; otherwise classes of the sports whose cards link to this facility.
  const facilityClasses = useMemo(() => {
    if (!catalog?.classes || !selectedFacility) return [];
    const byRoom = catalog.classes.filter(cls => String(cls.roomId) === String(selectedFacility.id));
    if (byRoom.length > 0) return byRoom;
    const linkedSportIds = new Set((landingContent?.coursesSection?.sportsList || [])
      .filter(sport => String(sport.facilityId) === String(selectedFacility.id))
      .map(sport => String(sport.id)));
    return catalog.classes.filter(cls => linkedSportIds.has(String(cls.sportId)));
  }, [catalog, selectedFacility, landingContent]);

  const facilitiesList = landingContent?.facilitiesSection?.facilitiesList || [];
  // Only facilities with isVisible !== false (managers hide/show them).
  const visibleFacilities = useMemo(() => {
    return facilitiesList.filter(f => f.isVisible !== false);
  }, [facilitiesList]);
  
  const categories = useMemo(() => [
    { id: 'all', label: t('landing.facilities.all'), count: visibleFacilities.length, icon: 'grid_view' },
    ...[...new Set(visibleFacilities.map(f => f.category).filter(Boolean))].map(category => {
      const sample = visibleFacilities.find(f => f.category === category);
      const rawLabel = sample?.categoryName || category;
      const icon = category === 'golf' ? 'golf_course'
        : category === 'aquatics' || category === 'pool' ? 'pool'
        : category === 'fitness' ? 'fitness_center'
        : category === 'combat-studio' || category === 'martial-arts' ? 'sports_kabaddi'
        : category === 'team-sports' ? 'sports_soccer'
        : 'stadium';
      return {
        id: category,
        label: String(rawLabel).toUpperCase(),
        count: visibleFacilities.filter(f => f.category === category).length,
        icon
      };
    })
  ], [visibleFacilities, t]);

  const filteredFacilities = useMemo(() => {
    return visibleFacilities.filter(fac => {
      const matchCat = activeCategory === 'all' || fac.category === activeCategory ||
        (activeCategory === 'combat-studio' && (fac.category === 'combat-studio' || fac.category === 'martial-arts'));
      const matchSearch = !searchQuery.trim() || 
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fac.highlights && fac.highlights.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (fac.tags && Array.isArray(fac.tags) && fac.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchCat && matchSearch;
    });
  }, [visibleFacilities, activeCategory, searchQuery]);

  const facilityCarousel = useHorizontalCarousel({
    itemCount: filteredFacilities.length,
    itemSelector: '[data-facility-carousel-item]',
    resetKey: `${activeCategory}-${searchQuery}-${filteredFacilities.length}`,
    isModalOpen: Boolean(selectedFacility),
    autoPlayIntervalMs: 4200
  });
  const facilityCarouselRef = facilityCarousel.carouselRef;
  const handleFacilityScroll = facilityCarousel.handleScroll;

  const handleOpenModal = (facility, initialTab = 'packages') => {
    setSelectedFacility(facility);
    const targetTab = initialTab === 'specs' || initialTab === 'photos' ? initialTab : 'packages';
    setActiveModalTab(targetTab);
  };

  const handleCloseModal = () => {
    setSelectedFacility(null);
    if (onModalClose) onModalClose();
  };

  // Sync when parent component (LandingPage) requests to open a specific facility -> open specs
  useEffect(() => {
    if (externalFacility) {
      handleOpenModal(externalFacility, 'specs');
    }
  }, [externalFacility]);

  // Support global event dispatching as well
  useEffect(() => {
    const handleCustomOpen = (e) => {
      const { facility, facilityId, type } = e.detail || {};
      const target = facility || facilitiesList.find(f => f.id === facilityId);
      if (target) {
        handleOpenModal(target, type || 'specs');
      }
    };
    window.addEventListener('SCMS_OPEN_FACILITY', handleCustomOpen);
    return () => window.removeEventListener('SCMS_OPEN_FACILITY', handleCustomOpen);
  }, [catalog, editorialContent]);

  // Icon from the sport card linked to the facility, else from its category code.
  const getFacilityCategoryMeta = fac => {
    const linkedSport = (landingContent?.coursesSection?.sportsList || []).find(sport => String(sport.facilityId) === String(fac.id) && sport.icon);
    const icon = linkedSport?.icon || CATEGORY_ICONS[String(fac.category || '').toLowerCase()] || 'stadium';
    return {
      label: (fac.categoryName || fac.category || t('landing.courses.courtFallback')).toUpperCase(),
      icon
    };
  };

  const renderFacilityCard = (fac, isCarousel = false) => {
    const catMeta = getFacilityCategoryMeta(fac);
    const highlightSpec = fac.capacity || notSet;
    const displayHours = fac.openHours || notSet;
    const displayName = fac.name;
    const displayLocation = fac.location;
    const displayBadge = fac.badge || '';
    const displayHighlight = fac.highlights || fac.description;
    const displayPrice = includedLabel;

    return (
      <div
        key={fac.id}
        data-facility-carousel-item={isCarousel ? true : undefined}
        style={{
          width: 'clamp(300px, 85vw, 410px)',
          flexShrink: 0,
          scrollSnapAlign: 'start',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          id={`facility-card-${fac.id}`}
          onClick={() => handleOpenModal(fac, 'packages')}
          className="tiya-course-card"
        >
          {/* Card Image Area */}
          <div className="tiya-course-card__image-wrap">
            {fac.image || fac.secondaryImage ? <img src={fac.image || fac.secondaryImage} alt={displayName} loading="lazy" draggable={false} /> : <div className="h-full grid place-items-center bg-brand-navy-100 text-slate-500 text-sm">{t('landing.common.noImage')}</div>}

            {/* Top Bar Badges */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(0,0,0,0.65)', color: 'var(--white-color)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{catMeta.icon}</span>
                {catMeta.label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(129,178,154,0.9)', color: 'var(--white-color)', fontSize: '10px', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                {displayBadge}
              </span>
            </div>

            {/* Bottom Right Price Pill */}
            <div style={{ position: 'absolute', bottom: '10px', right: '12px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.7)', color: 'var(--custom-btn-bg-color)', fontSize: '12px', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              <span style={{ color: 'inherit' }}>{displayPrice}</span>
            </div>
          </div>

          {/* Card Body */}
          <div className="tiya-course-card__body">
            {/* Title & Rating */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', minHeight: '30px' }}>
              <h3 className="tiya-course-card__title" style={{ margin: 0, fontSize: '18px' }}>{displayName}</h3>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '10px', minHeight: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', flexShrink: 0 }}>location_on</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayLocation}</span>
            </div>

            {/* Description */}
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--p-color)', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '42px' }}>
              {displayHighlight}
            </p>

            {/* 2 Specs / Info Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '11px', color: 'var(--p-color)', minHeight: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: '#F9FAFB', borderRadius: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary-color)' }}>sports</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlightSpec}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: '#F9FAFB', borderRadius: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--custom-btn-bg-color)' }}>schedule</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayHours}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              className="custom-border-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={(e) => { e.stopPropagation(); handleOpenModal(fac, 'packages'); }}
            >
              {t('landing.facilities.viewDetails')}
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="co-so-vat-chat" className="w-full bg-[#F4F1DE] text-slate-900 font-sans min-h-screen pt-12 pb-0 px-6 sm:px-10 md:px-14 lg:px-20 relative overflow-hidden flex flex-col justify-center">
      
      {/* Decorative ambient elements */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-[var(--primary-color)]/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-40 w-96 h-96 bg-[var(--custom-btn-bg-color)]/5 rounded-full blur-3xl" />

      <div className="w-full max-w-[1360px] mx-auto relative z-10">
        {catalogLoading && !editorialContent?.facilitiesSection?.facilitiesList?.length && <p role="status">{t('landing.facilities.loading')}</p>}
        {catalogError && !editorialContent?.facilitiesSection?.facilitiesList?.length && <p role="alert">{catalogError}</p>}
        {!catalogLoading && !catalogError && facilitiesList.length === 0 && <p role="status">{t('landing.facilities.none')}</p>}
        
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12 tiya-reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(129,178,154,0.15)] text-[var(--primary-color)] text-xs font-sans font-bold uppercase tracking-widest mb-4 border border-[rgba(129,178,154,0.4)]">
            <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse" />
            {landingContent.facilitiesSection?.badge}
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold uppercase text-slate-900 tracking-tight leading-tight">
            {landingContent.facilitiesSection?.title}
          </h2>
          <p className="font-sans text-brand-navy-600 text-sm sm:text-base mt-4 leading-relaxed">
            {landingContent.facilitiesSection?.description}
          </p>
        </div>

        {/* HIGHLIGHT METRICS (managed in the home-content editor) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {(landingContent.facilitiesSection?.metrics || []).map((metric, idx) => {
            const colors = [
              { bg: 'bg-brand-sage-500/15', text: 'text-[var(--primary-color)]' },
              { bg: 'bg-brand-sand-300/30', text: 'text-brand-navy-700' },
              { bg: 'bg-brand-navy-700/10', text: 'text-brand-navy-700' },
              { bg: 'bg-brand-sage-500/15', text: 'text-[var(--primary-color)]' }
            ];
            const color = colors[idx % colors.length];

            return (
              <div key={metric.id || idx} className={`bg-white p-4 sm:p-6 rounded-[20px] border border-brand-navy-200/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0 group tiya-reveal tiya-delay-${idx + 1}`}>
                <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[28px]">{metric.icon || 'domain'}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 break-words">{metric.value}</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wide sm:tracking-wider mt-0.5 break-words">{metric.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Category Filter Tabs (Tiya Pill Style matching Image 1) */}
        <div className="courses-filter-tabs" style={{ marginBottom: '20px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`courses-filter-tab ${activeCategory === cat.id ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{cat.icon}</span>
              {cat.label}
              <span className="courses-filter-tab__count">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Sleek Search Pill */}
        <div style={{ maxWidth: '420px', margin: '0 auto 28px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', fontSize: '18px' }}>
            search
          </span>
          <input
            type="text"
            placeholder={t('landing.facilities.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 40px 10px 44px',
              borderRadius: '100px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'var(--white-color)',
              color: '#0F172A',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </button>
          )}
        </div>

        {/* RESULTS COUNT & STATUS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-3 mb-6 text-xs text-slate-500 font-semibold px-1">
          <div>
            {t('landing.facilities.showingPrefix')} <strong>{filteredFacilities.length}</strong> {t('landing.facilities.showingSuffix', { total: visibleFacilities.length })}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-emerald-700">{t('landing.facilities.allIncluded')}</span>
          </div>
        </div>

        {/* FACILITIES CAROUSEL RENDERING */}
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-brand-navy-200 p-8 mb-16 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-brand-navy-300 mb-3 block">search_off</span>
            <h3 className="font-chivo text-lg font-bold text-brand-navy-700">{t('landing.facilities.noMatchTitle')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('landing.facilities.noMatchHint')}</p>
            <button
              type="button"
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="mt-4 px-5 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold uppercase rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            >
              {t('landing.facilities.viewAll')}
            </button>
          </div>
        ) : (
          <div
            className="tiya-carousel-shell relative w-full mb-16"
            {...facilityCarousel.containerProps}
          >
            <CarouselSideArrows
              carousel={facilityCarousel}
              itemCount={filteredFacilities.length}
              sectionLabel={t('landing.facilities.carouselLabel')}
            />

            {/* Scroll Track */}
            <div
              ref={facilityCarouselRef}
              onScroll={handleFacilityScroll}
              {...facilityCarousel.trackProps}
              className={`tiya-carousel-track ${facilityCarousel.isDragging ? 'is-dragging' : ''}`}
              style={{
                display: 'flex',
                gap: '24px',
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                scrollSnapType: 'x mandatory',
                paddingBottom: '20px',
                paddingTop: '4px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}
            >
              {filteredFacilities.map(fac => renderFacilityCard(fac, true))}
            </div>
          </div>
        )}

        {/* CAMPUS MAP: 3D model + 2D plan rendered from GET /api/campus-map (single source of zone data) */}
        <div className="tiya-reveal--scale relative mb-8">
          <CampusMapExplorer />
          {(landingContent?.zonesLayout?.description || landingContent?.zonesLayout?.serviceAmenities?.length > 0) && (
            <div className="tiya-campus-amenities-bar mt-3">
              {landingContent?.zonesLayout?.description && (
                <p className="tiya-campus-directory__desc m-0">{landingContent.zonesLayout.description}</p>
              )}
              <ul className="tiya-campus-amenities-grid m-0 p-0 list-none">
                {(landingContent?.zonesLayout?.serviceAmenities || []).map((amenity, idx) => {
                  const focusCode = amenity.icon === 'badge' || amenity.icon === 'shower' ? 'A' : 'L';
                  const focusFloor = amenity.icon === 'badge' ? 2 : 1;
                  return (
                    <li
                      key={amenity.id || idx}
                      className="tiya-campus-amenity-item cursor-pointer"
                      onClick={() => window.dispatchEvent(new CustomEvent('SCMS_CAMPUS_FOCUS', { detail: { code: focusCode, floor: focusFloor } }))}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">{amenity.icon}</span>
                      <span>{amenity.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* CALL TO ACTION: RENTAL & EVENT BANNER (Tiya Slate Navy & Gold) */}
        <div className="tiya-rental-banner tiya-reveal flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="tiya-rental-banner__badge">
              {membershipBanner.ctaBadge}
            </span>
            <h3 className="tiya-rental-banner__title">
              {membershipBanner.ctaTitle}
            </h3>
            <p className="tiya-rental-banner__desc">
              {membershipBanner.ctaDescription}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <a
              href={membershipAction.href}
              className="tiya-rental-banner__btn-primary w-full sm:w-auto cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>calendar_today</span>
              <span>{membershipAction.label}</span>
            </a>
            <a
              href={isMember ? '#/member/schedule' : '#khoa-hoc'}
              className="tiya-rental-banner__btn-secondary w-full sm:w-auto"
            >
              <span>{t(isMember ? 'landing.facilities.viewSchedule' : 'landing.facilities.exploreSports')}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>arrow_forward</span>
            </a>
          </div>
        </div>

      </div>

      {/* DETAIL & BOOKING MODAL (Tiya Design System) */}
      {selectedFacility && (
        <div
          className="tiya-modal-backdrop"
          onClick={e => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="tiya-modal-container" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header (Tiya Slate Navy & Gold Accent) */}
            <div className="tiya-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="tiya-modal-header__icon-box">
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                    {getFacilityCategoryMeta(selectedFacility).icon || 'domain'}
                  </span>
                </div>
                <div>
                  <span className="tiya-modal-header__badge">
                    {selectedFacility.location} • {selectedFacility.badge || ''}
                  </span>
                  <h3 className="tiya-modal-title">
                    {selectedFacility.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="tiya-modal-close-btn"
                title={t('landing.facilities.closeModal')}
                aria-label={t('landing.facilities.closeModal')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Modal Navigation Tabs (Tiya Pill / Underline Tabs) */}
            <div className="tiya-modal-tabs">
              <button
                type="button"
                onClick={() => setActiveModalTab('packages')}
                className={`tiya-modal-tab ${activeModalTab === 'packages' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_calendar</span>
                <span>{t('landing.facilities.tabPackages')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('specs')}
                className={`tiya-modal-tab ${activeModalTab === 'specs' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>straighten</span>
                <span>{t('landing.facilities.tabSpecs')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('photos')}
                className={`tiya-modal-tab ${activeModalTab === 'photos' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_library</span>
                <span>{t('landing.facilities.tabPhotos')}</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="tiya-modal-body">
              {activeModalTab === 'specs' ? (
                /* SPECS & AMENITIES TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="tiya-spec-section">
                    <div className="tiya-spec-section__title">
                      <span className="material-symbols-outlined">verified</span>
                      <span>{t('landing.facilities.specsTitle')}</span>
                    </div>
                    <div className="tiya-spec-grid">
                      {selectedFacility.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="tiya-spec-item">
                          <span className="tiya-spec-item__label">{spec.label}</span>
                          <strong className="tiya-spec-item__val">{spec.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="tiya-spec-section" style={{ marginBottom: 0 }}>
                    <div className="tiya-spec-section__title">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>{t('landing.facilities.amenitiesTitle')}</span>
                    </div>
                    <div className="tiya-amenity-grid">
                      {selectedFacility.amenities.map((amenity, aIdx) => (
                        <div key={aIdx} className="tiya-amenity-item">
                          <span className="material-symbols-outlined">done</span>
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="tiya-price-callout">
                    <strong>{t('landing.facilities.membershipLabel')}</strong>
                    <a href={membershipAction.href}>{membershipAction.label}</a>
                    <p className="mt-2 text-sm">{t('landing.facilities.priceNote')}</p>
                  </div>
                </div>
              ) : activeModalTab === 'photos' ? (
                /* PHOTOS GALLERY TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #E7E7E9', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                    {selectedFacility.image ? <img
                      src={selectedFacility.image}
                      alt={selectedFacility.name}
                      style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                    /> : <p className="p-12 text-center text-slate-500">{t('landing.facilities.noPhoto')}</p>}
                    <div style={{ padding: '12px 18px', background: 'var(--secondary-color)', color: 'var(--white-color)', fontSize: '12.5px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{t('landing.facilities.panorama', { name: selectedFacility.name })}</span>
                      <span style={{ color: 'var(--custom-btn-bg-color)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{selectedFacility.location}</span>
                    </div>
                  </div>

                  {selectedFacility.secondaryImage && (
                    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #E7E7E9', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                      <img
                        src={selectedFacility.secondaryImage}
                        alt={t('landing.facilities.detailAlt', { name: selectedFacility.name })}
                        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: '12px 18px', background: 'var(--secondary-color)', color: 'var(--white-color)', fontSize: '12.5px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{t('landing.facilities.floorDetails')}</span>
                        <span style={{ color: 'var(--primary-color)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{t('landing.facilities.scmsActual')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* PACKAGES & SCHEDULE TAB - CONCISE & EASY TO CHOOSE */
                <div className="space-y-4">
                  {/* 1. Quick Facility Summary Banner */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-brand-navy-50 border border-brand-navy-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">
                          {getFacilityCategoryMeta(selectedFacility).icon || 'stadium'}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {selectedFacility.badge || t('landing.courses.courtFallback')}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            ⏱ {selectedFacility.openHours || notSet} • 👥 {selectedFacility.capacity || notSet}
                          </span>
                        </div>
                        <p className="text-xs text-brand-navy-700 font-medium leading-snug">
                          {t('landing.facilities.joinNote', { name: selectedFacility.name })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Three Core Package Cards for Quick Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[17px] text-amber-600">loyalty</span>
                        {t('landing.facilities.choosePass')}
                      </h5>
                      <span className="text-[11px] text-slate-500">
                        {t('landing.facilities.instantActivation')}
                      </span>
                    </div>

                    {packages.length === 0 && (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        {t('landing.facilities.noPackages')}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {packages.slice(0, 3).map((pkg) => {
                        const price = formatVnd(pkg.price, language);
                        // Highlight only packages the manager gave a badge to (no invented "most popular").
                        const isPop = Boolean(pkg.badge);
                        const unit = t(pkg.durationDays >= 365 ? 'landing.facilities.unitYear' : pkg.durationDays >= 90 ? 'landing.facilities.unitQuarter' : 'landing.facilities.unitMonth');

                        return (
                          <div
                            key={pkg.id}
                            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                              isPop
                                ? 'bg-brand-sand-50/50 border-amber-300 ring-1 ring-amber-300/50 shadow-sm'
                                : 'bg-white border-brand-navy-200 hover:border-brand-navy-300 shadow-sm'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded ${
                                  isPop ? 'bg-amber-500 text-white' : 'bg-brand-navy-100 text-brand-navy-600'
                                }`}>
                                  {pkg.badge || t('landing.facilities.standard')}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                  {t('landing.facilities.days', { count: pkg.durationDays })}
                                </span>
                              </div>

                              <h6 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                                {pkg.name}
                              </h6>

                              <div className="my-2">
                                <span className="text-base sm:text-lg font-black text-brand-sage-700 font-chivo">
                                  {price}
                                </span>
                                <span className="text-[11px] text-slate-500 ml-1">
                                  / {unit}
                                </span>
                              </div>

                              <ul className="space-y-1 text-[11px] text-brand-navy-600 mb-3">
                                <li className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[13px] text-emerald-600 shrink-0">check</span>
                                  <span>{pkg.accessType || t('landing.facilities.courtIncluded')}</span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[13px] text-emerald-600 shrink-0">check</span>
                                  <span>{t('landing.facilities.lockers')}</span>
                                </li>
                              </ul>
                            </div>

                            <a
                              href={membershipAction.href}
                              className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition active:scale-95 ${
                                isPop
                                  ? 'bg-brand-sage-700 hover:bg-brand-sage-900 text-white shadow-sm'
                                  : 'bg-brand-navy-100 hover:bg-brand-navy-200 text-slate-800'
                              }`}
                            >
                              <span>{t('landing.facilities.selectPass')}</span>
                              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Action Toolbar & Hotline */}
                  <div className="pt-2 border-t border-brand-navy-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <a
                        href={membershipAction.href}
                        className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                        <span>{t('landing.facilities.viewAllPackages')}</span>
                      </a>
                      <a
                        href={isMember ? '#/member/schedule' : '#khoa-hoc'}
                        className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-white hover:bg-brand-navy-50 border border-brand-navy-300 text-brand-navy-700 text-xs font-bold text-center inline-flex items-center justify-center gap-1.5 transition"
                      >
                        <span className="material-symbols-outlined text-[16px] text-blue-600">calendar_month</span>
                        <span>{t('landing.facilities.classTimetable')}</span>
                      </a>
                    </div>

                    {contactPhone && (
                      <div className="text-[11.5px] text-slate-500 flex items-center gap-1.5">
                        <span>{t('landing.facilities.needAdvice')}</span>
                        <a href={`tel:${contactPhone}`} className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">call</span>
                          <span>{contactPhone}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
