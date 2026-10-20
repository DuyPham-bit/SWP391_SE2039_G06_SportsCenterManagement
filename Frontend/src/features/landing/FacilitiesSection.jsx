import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLandingContent } from '../../hooks/useLandingContent.js';
import { usePublicCatalog } from '../../hooks/usePublicCatalog.js';
import { getLandingPresentation } from '../../services/landingPresentation.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.js';
import { getMembershipAction, getMembershipBanner } from '../../services/membershipEntry.js';
import {
  translateLandingContent,
  translateFacilityName,
  translateFacilityCategory,
  translateFacilityBadge,
  translateLocation,
  translateFacilityHighlight,
  translateFacilityDescription,
  translateSpecLabel,
  translateSpecValue,
  translateAmenity,
  translateMetricLabel,
  translateMetricValue,
  translateZoneName,
  translateZoneItem,
  translateCapacityString,
  translateOpenHours
} from '../../services/i18nHelper.js';

export function FacilitiesSection({ externalFacility = null, onModalClose = null } = {}) {
  const { isAuthenticated, role } = useAuth();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const membershipAction = getMembershipAction(isAuthenticated, role, isEn);
  const isMember = isAuthenticated && role === 'MEMBER';
  const editorialContent = useLandingContent();
  const { catalog, loading: catalogLoading, error: catalogError } = usePublicCatalog();
  const rawLandingContent = getLandingPresentation(editorialContent, catalog);
  const landingContent = useMemo(() => isEn ? translateLandingContent(rawLandingContent, true) : rawLandingContent, [rawLandingContent, isEn]);
  const membershipBanner = getMembershipBanner(landingContent.ctaAndFooter, isEn);
  const contactPhone = landingContent.ctaAndFooter?.contactPhone || catalog?.center.phone;
  const contactEmail = landingContent.ctaAndFooter?.contactEmail || catalog?.center.email;
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('packages');

  // Carousel State
  const [facilityCarouselIndex, setFacilityCarouselIndex] = useState(0);
  const facilityCarouselRef = useRef(null);
  const isFacilityProgrammaticScrollRef = useRef(false);
  const facilityScrollTimeoutRef = useRef(null);

  const facilitiesList = landingContent.facilitiesSection.facilitiesList;
  // Lọc chỉ những cụm sân có isVisible !== false (manager chủ động ẩn/hiện)
  const visibleFacilities = useMemo(() => {
    return facilitiesList.filter(f => f.isVisible !== false);
  }, [facilitiesList]);
  
  const categories = useMemo(() => [
    { id: 'all', label: isEn ? 'ALL' : 'TẤT CẢ', count: visibleFacilities.length, icon: 'grid_view' },
    ...[...new Set(visibleFacilities.map(f => f.category).filter(Boolean))].map(category => {
      const sample = visibleFacilities.find(f => f.category === category);
      const rawLabel = sample?.categoryName || category;
      return {
        id: category,
        label: (isEn ? translateFacilityCategory(rawLabel, true) : rawLabel).toUpperCase(),
        count: visibleFacilities.filter(f => f.category === category).length,
        icon: 'stadium'
      };
    })
  ], [visibleFacilities, isEn]);

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

  const handleFacilityScroll = () => {
    if (isFacilityProgrammaticScrollRef.current) return;
    const el = facilityCarouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const items = el.querySelectorAll('[data-facility-carousel-item]');
    if (!items.length) return;

    // Nếu đã cuộn gần chạm mép phải (thẻ cuối cùng đang hiển thị đầy đủ)
    if (scrollLeft >= maxScroll - 25) {
      setFacilityCarouselIndex(items.length - 1);
      return;
    }

    // Tìm thẻ có mép trái gần sát vị trí đầu container nhất
    let closestIdx = 0;
    let minDiff = Infinity;
    const containerLeft = el.getBoundingClientRect().left;

    items.forEach((item, idx) => {
      const itemRect = item.getBoundingClientRect();
      const diff = Math.abs(itemRect.left - containerLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setFacilityCarouselIndex(closestIdx);
  };

  const handleScrollFacilityToIndex = (idx) => {
    const el = facilityCarouselRef.current;
    if (!el) return;
    const items = el.querySelectorAll('[data-facility-carousel-item]');
    if (!items[idx]) return;

    isFacilityProgrammaticScrollRef.current = true;
    setFacilityCarouselIndex(idx);

    const targetItem = items[idx];
    const scrollTarget = targetItem.offsetLeft - el.offsetLeft;

    el.scrollTo({
      left: Math.max(0, scrollTarget),
      behavior: 'smooth'
    });

    if (facilityScrollTimeoutRef.current) clearTimeout(facilityScrollTimeoutRef.current);
    facilityScrollTimeoutRef.current = setTimeout(() => {
      isFacilityProgrammaticScrollRef.current = false;
    }, 450);
  };

  useEffect(() => {
    setFacilityCarouselIndex(0);
    if (facilityCarouselRef.current) {
      facilityCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeCategory, searchQuery, filteredFacilities.length]);

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

  const getFacilityCategoryMeta = fac => ({
    label: (isEn ? translateFacilityCategory(fac.categoryName || fac.category || 'Phòng / sân', true) : (fac.categoryName || 'Phòng / sân')).toUpperCase(),
    icon: 'stadium'
  });

  const renderFacilityCard = (fac, isCarousel = false) => {
    const catMeta = getFacilityCategoryMeta(fac);
    const highlightSpec = isEn ? translateCapacityString(fac.capacity, true) : (fac.capacity || (isEn ? 'Not updated' : 'Chưa cập nhật'));
    const displayHours = fac.openHours ? (isEn ? translateOpenHours(fac.openHours, true) : fac.openHours.replace('hàng ngày', '').trim()) : (isEn ? 'Not updated' : 'Chưa cập nhật');
    const displayName = isEn ? translateFacilityName(fac.name, true) : fac.name;
    const displayLocation = isEn ? translateLocation(fac.location, true) : fac.location;
    const displayBadge = isEn ? translateFacilityBadge(fac.badge, true) : (fac.badge || '');
    const displayHighlight = isEn ? (translateFacilityHighlight(fac.highlights, true) || translateFacilityDescription(fac.description, true)) : (fac.highlights || fac.description);

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
            {fac.image || fac.secondaryImage ? <img src={fac.image || fac.secondaryImage} alt={displayName} loading="lazy" /> : <div className="h-full grid place-items-center bg-slate-100 text-slate-500 text-sm">{isEn ? 'No image' : 'Chưa có ảnh'}</div>}

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
              <a href={membershipAction.href} onClick={event => event.stopPropagation()} style={{color:'inherit'}}>{membershipAction.label}</a>
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
              {isEn ? 'View Details & Packages' : 'Xem Chi Tiết & Gói Tập'}
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="co-so-vat-chat" className="w-full bg-white text-slate-900 font-sans min-h-screen pt-20 pb-0 px-6 sm:px-10 md:px-14 lg:px-20 relative overflow-hidden flex flex-col justify-center">
      
      {/* Decorative ambient elements */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-[var(--primary-color)]/5 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-40 w-96 h-96 bg-[var(--custom-btn-bg-color)]/5 rounded-full blur-3xl" />

      <div className="w-full max-w-[1360px] mx-auto relative z-10">
        {catalogLoading && !editorialContent.facilitiesSection?.facilitiesList?.length && <p role="status">{isEn ? 'Loading facilities...' : 'Đang tải phòng / sân...'}</p>}
        {(editorialContent._loadError || (catalogError && !editorialContent.facilitiesSection?.facilitiesList?.length)) && <p role="alert">{editorialContent._loadError || catalogError}</p>}
        {!catalogLoading && !catalogError && facilitiesList.length === 0 && <p role="status">{isEn ? 'No venues currently operating.' : 'Chưa có phòng / sân đang hoạt động.'}</p>}
        
        {/* SECTION HEADER: BẢN SẮC THỂ THAO SCMS TIÊU CHUẨN */}
        <div className="text-center max-w-3xl mx-auto mb-12 tiya-reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(129,178,154,0.15)] text-[var(--primary-color)] text-xs font-sans font-bold uppercase tracking-widest mb-4 border border-[rgba(129,178,154,0.4)]">
            <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse" />
            {isEn ? 'STANDARD ATHLETIC INFRASTRUCTURE' : (landingContent.facilitiesSection?.badge || 'HẠ TẦNG THỂ THAO TIÊU CHUẨN')}
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold uppercase text-slate-900 tracking-tight leading-tight">
            {isEn ? 'MODERN & QUALITY OLYMPIC FACILITY COMPLEX' : (landingContent.facilitiesSection?.title || 'HỆ THỐNG CƠ SỞ VẬT CHẤT TIỆN NGHI & CHẤT LƯỢNG')}
          </h2>
          <p className="font-sans text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            {isEn
              ? 'Spacious, clean, and modern athletic complex featuring 9 courts and training studios for Swimming, Gym & Fitness, Yoga & Pilates, Martial Arts & Boxing, Football, Badminton, Basketball, Table Tennis, and Pickleball. Catering to fitness, club activities, and friendly tournaments.'
              : (landingContent.facilitiesSection?.description || '')}
          </p>
        </div>

        {/* 4 CORE HIGHLIGHT METRICS (CON SỐ THỰC TẾ ĐỘNG TỪ MANAGER) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {(landingContent.facilitiesSection?.metrics || []).map((metric, idx) => {
            const colors = [
              { bg: 'bg-[#81B29A]/15', text: 'text-[var(--primary-color)]' },
              { bg: 'bg-[#F2CC8F]/30', text: 'text-[#3D405B]' },
              { bg: 'bg-[#3D405B]/10', text: 'text-[#3D405B]' },
              { bg: 'bg-[#81B29A]/15', text: 'text-[var(--primary-color)]' }
            ];
            const color = colors[idx % colors.length];

            return (
              <div key={metric.id || idx} className={`bg-white p-6 rounded-[20px] border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group tiya-reveal tiya-delay-${idx + 1}`}>
                <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-[28px]">{metric.icon || 'domain'}</span>
                </div>
                <div>
                  <div className="font-sans text-2xl sm:text-3xl font-bold text-slate-900">{isEn ? translateMetricValue(metric.value, true) : metric.value}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{isEn ? translateMetricLabel(metric.label, true) : metric.label}</div>
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
            placeholder={isEn ? "Search by venue, court, discipline..." : "Tìm theo tên sân, môn tập..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 40px 10px 44px',
              borderRadius: '100px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'var(--white-color)',
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
        <div className="flex items-center justify-between mb-6 text-xs text-slate-500 font-semibold px-1">
          <div>
            {isEn ? (
              <>Showing <strong>{filteredFacilities.length}</strong> / {visibleFacilities.length} courts and venues</>
            ) : (
              <>Hiển thị <strong>{filteredFacilities.length}</strong> / {visibleFacilities.length} cụm sân và phòng chức năng</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-emerald-700">{isEn ? 'All venues ready for reservations' : 'Tất cả cụm sân đều sẵn sàng phục vụ'}</span>
          </div>
        </div>

        {/* FACILITIES CAROUSEL RENDERING */}
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 mb-16 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">search_off</span>
            <h3 className="font-chivo text-lg font-bold text-slate-700">{isEn ? 'No venues match your search' : 'Không tìm thấy cụm sân phù hợp'}</h3>
            <p className="text-xs text-slate-500 mt-1">{isEn ? 'Try keywords like "swimming", "football", "badminton", or select All.' : 'Hãy thử tìm với từ khóa khác như "bơi lội", "bóng đá", "cầu lông", hoặc chọn mục Tất cả.'}</p>
            <button
              type="button"
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="mt-4 px-5 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold uppercase rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            >
              {isEn ? 'View All' : 'Xem tất cả'}
            </button>
          </div>
        ) : (
          <div className="relative w-full mb-16">
            {/* Scroll Track */}
            <div
              ref={facilityCarouselRef}
              onScroll={handleFacilityScroll}
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

            {/* Carousel Bottom Interactive Indicator Dots */}
            {filteredFacilities.length > 1 && (
              <div className="tiya-carousel-dots" style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '16px' }}>
                {filteredFacilities.map((fac, idx) => (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => handleScrollFacilityToIndex(idx)}
                    aria-label={`Chuyển tới cụm sân ${idx + 1}: ${fac.name}`}
                    className={`tiya-carousel-dot ${facilityCarouselIndex === idx ? 'active' : ''}`}
                    style={{
                      height: '8px',
                      borderRadius: '100px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      width: facilityCarouselIndex === idx ? '36px' : '8px',
                      background: facilityCarouselIndex === idx ? 'var(--primary-color)' : 'rgba(0,0,0,0.15)'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAMPUS ARCHITECTURE & ZONE DIRECTORY (SƠ ĐỒ PHÂN BỐ KHU VỰC) */}
        <div className="tiya-campus-directory tiya-reveal--scale">
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-[var(--primary-color)]/10 blur-3xl" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <span className="tiya-campus-directory__badge">
                {isEn ? 'CONVENIENT SPATIAL LAYOUT' : (landingContent.zonesLayout?.badge || 'BỐ TRÍ KHÔNG GIAN THUẬN TIỆN')}
              </span>
              <h3 className="tiya-campus-directory__title">
                {isEn ? 'TRAINING & MATCH ZONE MAP' : (landingContent.zonesLayout?.title || 'SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN')}
              </h3>
              <p className="tiya-campus-directory__desc">
                {isEn
                  ? '9 neatly planned courts and training studios with open corridors, clear navigation signs, and dedicated front desks for seamless booking in person or online.'
                  : (landingContent.zonesLayout?.description || '')}
              </p>

              {/* Added Service Amenities */}
              <div className="space-y-2.5">
                {(landingContent.zonesLayout?.serviceAmenities || []).map((amenity, idx) => (
                  <div key={amenity.id || idx} className="tiya-campus-amenity-item">
                    <span className="material-symbols-outlined">{amenity.icon}</span>
                    <span>{isEn ? translateAmenity(amenity.text, true) : amenity.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Zones Map Columns */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(landingContent.zonesLayout?.zones || []).map((zone, idx) => (
                <div key={zone.id || idx} className="tiya-zone-card">
                  <div className="tiya-zone-card__header" style={{ color: zone.color || '#F87171' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{zone.icon}</span>
                    <span>{isEn ? translateZoneName(zone.name, true) : zone.name}</span>
                  </div>
                  <ul className="tiya-zone-card__list">
                    {(zone.items || []).map((item, itemIdx) => (
                      <li key={itemIdx}>• {isEn ? translateZoneItem(item, true) : item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
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
              <span>{isMember ? (isEn ? 'View Class Schedule' : 'Xem lịch lớp') : (isEn ? 'Explore Sports' : 'Khám phá bộ môn')}</span>
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
                    {isEn ? translateLocation(selectedFacility.location, true) : selectedFacility.location} • {isEn ? translateFacilityBadge(selectedFacility.badge, true) : (selectedFacility.badge || '')}
                  </span>
                  <h3 className="tiya-modal-title">
                    {isEn ? translateFacilityName(selectedFacility.name, true) : selectedFacility.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="tiya-modal-close-btn"
                title={isEn ? "Close modal" : "Đóng cửa sổ"}
                aria-label={isEn ? "Close modal" : "Đóng cửa sổ"}
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
                <span>{isEn ? 'Membership Packages' : 'Gói tập & Lịch lớp'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('specs')}
                className={`tiya-modal-tab ${activeModalTab === 'specs' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>straighten</span>
                <span>{isEn ? 'Specs & Amenities' : 'Thông số & Tiện ích'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('photos')}
                className={`tiya-modal-tab ${activeModalTab === 'photos' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_library</span>
                <span>{isEn ? 'Actual Photos' : 'Hình ảnh thực tế'}</span>
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
                      <span>{isEn ? 'Specifications & Court Standards' : 'Thông số kỹ thuật & Tiêu chuẩn sân'}</span>
                    </div>
                    <div className="tiya-spec-grid">
                      {selectedFacility.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="tiya-spec-item">
                          <span className="tiya-spec-item__label">{isEn ? translateSpecLabel(spec.label, true) : spec.label}</span>
                          <strong className="tiya-spec-item__val">{isEn ? translateSpecValue(spec.value, true) : spec.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="tiya-spec-section" style={{ marginBottom: 0 }}>
                    <div className="tiya-spec-section__title">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>{isEn ? 'Included Service Amenities' : 'Tiện ích dịch vụ tích hợp sẵn'}</span>
                    </div>
                    <div className="tiya-amenity-grid">
                      {selectedFacility.amenities.map((amenity, aIdx) => (
                        <div key={aIdx} className="tiya-amenity-item">
                          <span className="material-symbols-outlined">done</span>
                          <span>{isEn ? translateAmenity(amenity, true) : amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="tiya-price-callout">
                    <strong>{isEn ? 'Membership: ' : 'Gói tập: '}</strong>
                    <a href={membershipAction.href}>{membershipAction.label}</a>
                    <p className="mt-2 text-sm">{isEn ? 'Prices and access to classes depend on the selected package.' : 'Giá và quyền tham gia lớp được quy định trong từng gói tập.'}</p>
                  </div>
                </div>
              ) : activeModalTab === 'photos' ? (
                /* PHOTOS GALLERY TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                    {selectedFacility.image ? <img
                      src={selectedFacility.image}
                      alt={selectedFacility.name}
                      style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                    /> : <p className="p-12 text-center text-slate-500">{isEn ? 'No venue photo available.' : 'Chưa có ảnh phòng / sân.'}</p>}
                    <div style={{ padding: '12px 18px', background: 'var(--secondary-color)', color: 'var(--white-color)', fontSize: '12.5px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{isEn ? `Panoramic View — ${isEn ? translateFacilityName(selectedFacility.name, true) : selectedFacility.name}` : `Góc máy toàn cảnh — ${selectedFacility.name}`}</span>
                      <span style={{ color: 'var(--custom-btn-bg-color)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{isEn ? translateLocation(selectedFacility.location, true) : selectedFacility.location}</span>
                    </div>
                  </div>

                  {selectedFacility.secondaryImage && (
                    <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                      <img
                        src={selectedFacility.secondaryImage}
                        alt={`${selectedFacility.name} chi tiết`}
                        style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                      />
                      <div style={{ padding: '12px 18px', background: 'var(--secondary-color)', color: 'var(--white-color)', fontSize: '12.5px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{isEn ? 'Floor surface & equipment details' : 'Chi tiết mặt sàn & trang thiết bị'}</span>
                        <span style={{ color: 'var(--primary-color)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{isEn ? 'SCMS Actual' : 'Thực tế SCMS'}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Membership entry uses the existing package and class schedule flows. */
                <div className="space-y-4 p-6">
                  <h4>{isEn ? 'Choose a package, then book a class' : 'Đăng ký gói tập, sau đó đặt ca học'}</h4>
                  <p>{isEn ? translateFacilityName(selectedFacility.name, true) : selectedFacility.name}</p>
                  <p>{isEn ? 'Choose a suitable package and complete payment. Once your membership is active, select an available class covered by your package.' : 'Chọn gói phù hợp và hoàn tất thanh toán. Khi gói có hiệu lực, chọn ca học còn chỗ thuộc quyền lợi gói của bạn.'}</p>
                  <p>{isEn ? 'Explore the training facilities here, then reserve a place through the class schedule for your membership.' : 'Khám phá cơ sở tập luyện tại đây, sau đó đặt chỗ theo lịch lớp của gói tập đã đăng ký.'}</p>
                  <div className="flex flex-wrap gap-3">
                    <a className="custom-border-btn" href={membershipAction.href}>{membershipAction.label}</a>
                    {isMember && <a className="custom-border-btn" href="#/member/schedule">{isEn ? 'View Class Schedule' : 'Xem lịch lớp'}</a>}
                  </div>
                  <p>{isEn ? 'Need help choosing a package? Contact the center.' : 'Cần tư vấn chọn gói? Liên hệ trung tâm.'}</p>
                  <div className="flex flex-wrap gap-3">
                    {contactPhone && <a href={'tel:' + contactPhone}>{contactPhone}</a>}
                    {contactEmail && <a href={'mailto:' + contactEmail}>{contactEmail}</a>}
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
