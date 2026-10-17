import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLandingContent } from '../../hooks/useLandingContent.js';
import { SCMS_FACILITIES } from '../../services/facilitiesCatalog.js';

export { SCMS_FACILITIES };

export function FacilitiesSection({ externalFacility = null, onModalClose = null } = {}) {
  const landingContent = useLandingContent();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('booking'); // 'booking' | 'specs' | 'photos'
  const [bookingType, setBookingType] = useState('rent'); // 'rent' (thuê sân) | 'tour' (tham quan trải nghiệm)

  // Carousel State
  const [facilityCarouselIndex, setFacilityCarouselIndex] = useState(0);
  const facilityCarouselRef = useRef(null);
  const isFacilityProgrammaticScrollRef = useRef(false);
  const facilityScrollTimeoutRef = useRef(null);

  const facilitiesList = landingContent.facilitiesSection?.facilitiesList || SCMS_FACILITIES;
  // Lọc chỉ những cụm sân có isVisible !== false (manager chủ động ẩn/hiện)
  const visibleFacilities = useMemo(() => {
    return facilitiesList.filter(f => f.isVisible !== false);
  }, [facilitiesList]);
  
  // Booking Form State
  const [formState, setFormState] = useState({
    fullName: '',
    phone: '',
    email: '',
    organization: '',
    expectedDate: '',
    timeSlot: 'Sáng (08:00 - 11:30)',
    rentalPurpose: 'Tập luyện thể thao thường xuyên',
    extraServices: ['Nước uống đóng chai'],
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [showFacilityPicker, setShowFacilityPicker] = useState(false);

  const categories = useMemo(() => [
    {
      id: 'all',
      label: 'Tất cả',
      count: visibleFacilities.length,
      icon: 'grid_view'
    },
    {
      id: 'team-sports',
      label: 'Bóng & Vợt',
      count: visibleFacilities.filter(f => f.category === 'team-sports').length,
      icon: 'sports_tennis'
    },
    {
      id: 'aquatics',
      label: 'Bơi lội',
      count: visibleFacilities.filter(f => f.category === 'aquatics').length,
      icon: 'pool'
    },
    {
      id: 'fitness',
      label: 'Sức bền',
      count: visibleFacilities.filter(f => f.category === 'fitness').length,
      icon: 'fitness_center'
    },
    {
      id: 'combat-studio',
      label: 'Đối kháng',
      count: visibleFacilities.filter(f => f.category === 'combat-studio' || f.category === 'martial-arts').length,
      icon: 'sports_mma'
    }
  ], [visibleFacilities]);

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

  const handleOpenModal = (facility, initialTab = 'rent') => {
    setSelectedFacility(facility);
    setBookingType('rent');
    const targetTab = (initialTab === 'rent' || initialTab === 'booking') ? 'booking' : 'specs';
    setActiveModalTab(targetTab);
    setSubmitted(false);
    setShowFacilityPicker(false);
  };

  const handleCloseModal = () => {
    setSelectedFacility(null);
    setSubmitted(false);
    setShowFacilityPicker(false);
    if (onModalClose) onModalClose();
  };

  const handleChangeFacility = (facilityId) => {
    const facility = SCMS_FACILITIES.find(f => f.id === facilityId);
    if (!facility) return;
    setSelectedFacility(facility);
    setShowFacilityPicker(false);
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
      const target = facility || SCMS_FACILITIES.find(f => f.id === facilityId);
      if (target) {
        handleOpenModal(target, type || 'specs');
      }
    };
    window.addEventListener('SCMS_OPEN_FACILITY', handleCustomOpen);
    return () => window.removeEventListener('SCMS_OPEN_FACILITY', handleCustomOpen);
  }, []);

  const handleToggleExtraService = (service) => {
    setFormState(prev => {
      const exists = prev.extraServices.includes(service);
      return {
        ...prev,
        extraServices: exists 
          ? prev.extraServices.filter(s => s !== service)
          : [...prev.extraServices, service]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.fullName.trim() || !formState.phone.trim()) {
      alert('Vui lòng điền đầy đủ họ tên và số điện thoại liên hệ!');
      return;
    }
    setSubmitted(true);
  };

  const FACILITY_RATINGS = {
    'room-01': { rating: '4.9', count: '128' },
    'room-02': { rating: '4.8', count: '310' },
    'room-03': { rating: '4.9', count: '280' },
    'room-04': { rating: '4.8', count: '190' },
    'room-05': { rating: '5.0', count: '240' },
    'room-06': { rating: '4.9', count: '155' },
    'room-07': { rating: '4.9', count: '165' },
    'room-08': { rating: '4.8', count: '142' },
    'room-09': { rating: '4.8', count: '110' }
  };

  const FACILITY_HIGHLIGHTS = {
    'room-01': 'Kiện tướng Bơi lội Quốc Gia',
    'room-02': 'Cựu Cầu Thủ Chuyên Nghiệp',
    'room-03': 'HLV Liên đoàn Cầu Lông Cấp 1',
    'room-04': 'VĐV Bóng Rổ Giải Quốc Gia',
    'room-05': 'Master Trainer Thể Hình',
    'room-06': 'Võ Sư Đai Đen Quốc Tế',
    'room-07': 'Giảng viên Yoga Quốc Tế',
    'room-08': 'HLV Pickleball Chuẩn PPR',
    'room-09': 'HLV Bóng Bàn Cấp 1'
  };

  const getFacilityCategoryMeta = (fac) => {
    if (fac.id === 'room-02') {
      return { label: 'Bóng & Vợt', icon: 'sports_soccer' };
    }
    if (fac.id === 'room-03') {
      return { label: 'Bóng & Vợt', icon: 'sports_tennis' };
    }
    if (fac.id === 'room-04') {
      return { label: 'Bóng & Vợt', icon: 'sports_basketball' };
    }
    if (fac.id === 'room-08' || fac.id === 'room-09') {
      return { label: 'Bóng & Vợt', icon: 'sports_tennis' };
    }
    if (fac.category === 'aquatics') {
      return { label: 'Bơi lội', icon: 'pool' };
    }
    if (fac.category === 'fitness') {
      return { label: 'Sức bền', icon: 'fitness_center' };
    }
    if (fac.category === 'combat-studio' || fac.category === 'martial-arts') {
      return { label: 'Đối kháng', icon: 'sports_mma' };
    }
    return { label: 'Thể thao', icon: 'sports' };
  };

  const getFacilityShortPrice = (fac) => {
    if (!fac.priceRate) return 'Từ 50.000đ/giờ';
    const first = fac.priceRate.split('•')[0].trim();
    return first.replace(/\s*-\s*[0-9.,]+đ/, '');
  };

  const renderFacilityCard = (fac, isCarousel = false) => {
    const ratingData = FACILITY_RATINGS[fac.id] || { rating: '4.9', count: '150' };
    const catMeta = getFacilityCategoryMeta(fac);
    const displayPrice = getFacilityShortPrice(fac);
    const highlightSpec = FACILITY_HIGHLIGHTS[fac.id] || fac.specs?.[0]?.value || fac.capacity;

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
          onClick={() => handleOpenModal(fac, 'rent')}
          className="tiya-course-card"
        >
          {/* Card Image Area */}
          <div className="tiya-course-card__image-wrap">
            <img src={fac.image || fac.secondaryImage} alt={fac.name} loading="lazy" />

            {/* Top Bar Badges */}
            <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(0,0,0,0.65)', color: 'var(--white-color)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backdropFilter: 'blur(4px)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{catMeta.icon}</span>
                {catMeta.label}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '100px', background: 'rgba(129,178,154,0.9)', color: 'var(--white-color)', fontSize: '10px', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                {fac.badge || 'Tiêu chuẩn'}
              </span>
            </div>

            {/* Bottom Right Price Pill */}
            <div style={{ position: 'absolute', bottom: '10px', right: '12px', padding: '4px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.7)', color: 'var(--custom-btn-bg-color)', fontSize: '12px', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              {displayPrice}
            </div>
          </div>

          {/* Card Body */}
          <div className="tiya-course-card__body">
            {/* Title & Rating */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', minHeight: '30px' }}>
              <h3 className="tiya-course-card__title" style={{ margin: 0, fontSize: '18px' }}>{fac.name}</h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: 'var(--custom-btn-bg-hover-color)', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--custom-btn-bg-color)' }}>star</span>
                {ratingData.rating}
                <span style={{ fontSize: '10px', color: 'var(--p-color)' }}>({ratingData.count})</span>
              </span>
            </div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '10px', minHeight: '20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', flexShrink: 0 }}>location_on</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fac.location}</span>
            </div>

            {/* Description */}
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--p-color)', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '42px' }}>
              {fac.highlights || fac.description}
            </p>

            {/* 2 Specs / Info Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '11px', color: 'var(--p-color)', minHeight: '36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: '#F9FAFB', borderRadius: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary-color)' }}>sports</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlightSpec}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', background: '#F9FAFB', borderRadius: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--custom-btn-bg-color)' }}>schedule</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fac.openHours ? fac.openHours.replace('hàng ngày', '').trim() : '06:00 - 22:00'}</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              className="custom-border-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={(e) => { e.stopPropagation(); handleOpenModal(fac, 'rent'); }}
            >
              Xem Chi Tiết &amp; Đặt Lịch
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
        
        {/* SECTION HEADER: BẢN SẮC THỂ THAO SCMS TIÊU CHUẨN */}
        <div className="text-center max-w-3xl mx-auto mb-12 tiya-reveal">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(129,178,154,0.15)] text-[var(--primary-color)] text-xs font-sans font-bold uppercase tracking-widest mb-4 border border-[rgba(129,178,154,0.4)]">
            <span className="w-2 h-2 rounded-full bg-[var(--primary-color)] animate-pulse" />
            {landingContent.facilitiesSection?.badge || 'HẠ TẦNG THỂ THAO TIÊU CHUẨN'}
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold uppercase text-slate-900 tracking-tight leading-tight">
            {landingContent.facilitiesSection?.title || 'HỆ THỐNG CƠ SỞ VẬT CHẤT TIỆN NGHI & CHẤT LƯỢNG'}
          </h2>
          <p className="font-sans text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            {landingContent.facilitiesSection?.description || `Khu liên hợp thể thao rộng rãi, sạch đẹp với ${visibleFacilities.length} cụm sân bãi và phòng tập dành cho các bộ môn chuẩn Olympic.`}
          </p>
        </div>

        {/* 4 CORE HIGHLIGHT METRICS (CON SỐ THỰC TẾ ĐỘNG TỪ MANAGER) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {(landingContent.facilitiesSection?.metrics || [
            { icon: 'domain', value: '3.500m²', label: 'Tổng diện tích mặt sàn' },
            { icon: 'verified', value: `${visibleFacilities.length} Khu Vực`, label: 'Đa dạng môn tập luyện' },
            { icon: 'groups', value: '600+', label: 'Lượt tập luyện/ngày' },
            { icon: 'cleaning_services', value: '100%', label: 'Vệ sinh & Bảo trì định kỳ' }
          ]).map((metric, idx) => {
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
                  <div className="font-sans text-2xl sm:text-3xl font-bold text-slate-900">{metric.value}</div>
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{metric.label}</div>
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
            placeholder="Tìm theo tên sân, môn tập..."
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
            Hiển thị <strong>{filteredFacilities.length}</strong> / {visibleFacilities.length} cụm sân và phòng chức năng
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-emerald-700">Tất cả cụm sân đều sẵn sàng phục vụ</span>
          </div>
        </div>

        {/* FACILITIES CAROUSEL RENDERING */}
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 mb-16 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 block">search_off</span>
            <h3 className="font-chivo text-lg font-bold text-slate-700">Không tìm thấy cụm sân phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Hãy thử tìm với từ khóa khác như "bơi lội", "bóng đá", "cầu lông", hoặc chọn mục Tất cả.</p>
            <button
              type="button"
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="mt-4 px-5 py-2.5 bg-[var(--primary-color)] text-white text-xs font-bold uppercase rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            >
              Xem tất cả
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
                {landingContent.zonesLayout?.badge || 'BỐ TRÍ KHÔNG GIAN THUẬN TIỆN'}
              </span>
              <h3 className="tiya-campus-directory__title">
                {landingContent.zonesLayout?.title || 'SƠ ĐỒ CÁC KHU VỰC TẬP LUYỆN'}
              </h3>
              <p className="tiya-campus-directory__desc">
                {landingContent.zonesLayout?.description || `${visibleFacilities.length} cụm sân bãi và phòng tập được quy hoạch gọn gàng, lối đi thông thoáng, biển báo chỉ dẫn rõ ràng.`}
              </p>

              {/* Added Service Amenities */}
              <div className="space-y-2.5">
                {(landingContent.zonesLayout?.serviceAmenities || [
                  { icon: 'badge', text: 'Tủ cất đồ cá nhân có chìa khóa an toàn, thuận tiện sử dụng' },
                  { icon: 'shower', text: 'Phòng thay đồ và khu vực tắm tráng nóng lạnh sạch sẽ' },
                  { icon: 'local_cafe', text: 'Quầy căn-tin nước giải khát, nước khoáng phục vụ nhanh' },
                  { icon: 'medical_services', text: 'Tủ thuốc y tế và dụng cụ sơ cứu ban đầu luôn sẵn sàng' }
                ]).map((amenity, idx) => (
                  <div key={amenity.id || idx} className="tiya-campus-amenity-item">
                    <span className="material-symbols-outlined">{amenity.icon}</span>
                    <span>{amenity.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Zones Map Columns */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(landingContent.zonesLayout?.zones || [
                {
                  id: 'zone-a',
                  name: 'Khu A: Bơi Lội, Gym & Fitness',
                  icon: 'pool',
                  color: '#F87171',
                  items: ['Tầng 1: Bể bơi 4 mùa 25m trong nhà nước ấm', 'Tầng 2: Phòng tập Gym & Fitness', 'Tầng 3: Khu thay đồ & tắm tráng nóng lạnh']
                },
                {
                  id: 'zone-b',
                  name: 'Khu B: Bóng Rổ, Cầu Lông & Bóng Bàn',
                  icon: 'sports_basketball',
                  color: '#60A5FA',
                  items: ['Tầng 1: Sân bóng rổ tiêu chuẩn phong trào có mái che', 'Tầng 2: Cụm 4 sân cầu lông thảm cao su chống trượt', 'Tầng 3: Khu bóng bàn trong nhà với 4 bàn tập']
                },
                {
                  id: 'zone-c',
                  name: 'Khu C: Võ Thuật, Boxing, Yoga & Pilates',
                  icon: 'self_improvement',
                  color: '#C084FC',
                  items: ['Tầng 1: Phòng tập võ thuật & Boxing, thảm và bao cát', 'Tầng 3: Phòng tập Yoga & Pilates, khu thảm và máy Reformer', 'Tủ đồ cá nhân và khu thay đồ phục vụ học viên']
                },
                {
                  id: 'zone-d',
                  name: 'Khu Ngoài Trời: Bóng Đá & Pickleball',
                  icon: 'stadium',
                  color: '#34D399',
                  items: ['Cụm sân bóng đá cỏ nhân tạo (sân 5 và sân 7)', 'Cụm 4 sân Pickleball, có lưới riêng và vạch khu vực bếp', 'Dàn đèn pha LED chiếu sáng ban đêm rõ nét']
                }
              ]).map((zone, idx) => (
                <div key={zone.id || idx} className="tiya-zone-card">
                  <div className="tiya-zone-card__header" style={{ color: zone.color || '#F87171' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{zone.icon}</span>
                    <span>{zone.name}</span>
                  </div>
                  <ul className="tiya-zone-card__list">
                    {(zone.items || []).map((item, itemIdx) => (
                      <li key={itemIdx}>• {item}</li>
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
              {landingContent.ctaAndFooter?.ctaBadge || 'DÀNH CHO ĐỘI NHÓM & TỔ CHỨC SỰ KIỆN'}
            </span>
            <h3 className="tiya-rental-banner__title">
              {landingContent.ctaAndFooter?.ctaTitle || 'Liên Hệ Đặt Thuê Sân Tập & Tổ Chức Giải Đấu'}
            </h3>
            <p className="tiya-rental-banner__desc">
              {landingContent.ctaAndFooter?.ctaDescription || 'Bạn đang tìm sân tập thường xuyên cho đội nhóm hoặc cần thuê sân tổ chức giao lưu, giải đấu phong trào? Hãy liên hệ ngay với chúng tôi để chọn khung giờ đẹp và nhận mức giá ưu đãi nhất.'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleOpenModal(visibleFacilities[0] || SCMS_FACILITIES[0], 'rent')}
              className="tiya-rental-banner__btn-primary w-full sm:w-auto"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>calendar_today</span>
              <span>{landingContent.ctaAndFooter?.ctaPrimaryText || 'Đặt Thuê Cụm Sân Ngay'}</span>
            </button>
            <a
              href={landingContent.ctaAndFooter?.ctaSecondaryLink || '#/login'}
              className="tiya-rental-banner__btn-secondary w-full sm:w-auto"
            >
              <span>{landingContent.ctaAndFooter?.ctaSecondaryText || 'Xem Bảng Giá Gói Tập'}</span>
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
                    {selectedFacility.location} • {selectedFacility.badge || 'TIÊU CHUẨN'}
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
                title="Đóng cửa sổ"
                aria-label="Đóng cửa sổ"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Modal Navigation Tabs (Tiya Pill / Underline Tabs) */}
            <div className="tiya-modal-tabs">
              <button
                type="button"
                onClick={() => setActiveModalTab('booking')}
                className={`tiya-modal-tab ${activeModalTab === 'booking' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_calendar</span>
                <span>Đặt thuê cụm sân</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('specs')}
                className={`tiya-modal-tab ${activeModalTab === 'specs' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>straighten</span>
                <span>Thông số &amp; Tiện ích</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('photos')}
                className={`tiya-modal-tab ${activeModalTab === 'photos' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_library</span>
                <span>Hình ảnh thực tế</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="tiya-modal-body">
              {submitted ? (
                /* SUCCESS CELEBRATION */
                <div style={{ padding: '36px 24px', textAlign: 'center', background: '#FAF8F5', borderRadius: '16px', border: '2px solid var(--primary-color)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-color)', color: 'var(--white-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(129, 178, 154, 0.35)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>check</span>
                  </div>
                  <h4 style={{ fontFamily: 'var(--body-font-family)', fontSize: '20px', fontWeight: 700, color: 'var(--secondary-color)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Gửi Yêu Cầu Đặt Thuê Sân Thành Công!
                  </h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 20px' }}>
                    Cảm ơn <strong>{formState.fullName}</strong>! Nhân viên phụ trách cụm sân <strong>{selectedFacility.name}</strong> sẽ liên hệ trực tiếp qua số <strong>{formState.phone}</strong> trong thời gian sớm nhất để xác nhận giờ tập và hỗ trợ nhận sân.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="tiya-modal-btn-submit"
                    style={{ display: 'inline-flex', margin: '0 auto' }}
                  >
                    <span>Hoàn Tất &amp; Đóng</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>done</span>
                  </button>
                </div>
              ) : activeModalTab === 'specs' ? (
                /* SPECS & AMENITIES TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="tiya-spec-section">
                    <div className="tiya-spec-section__title">
                      <span className="material-symbols-outlined">verified</span>
                      <span>Thông số kỹ thuật &amp; Tiêu chuẩn sân</span>
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
                      <span>Tiện ích dịch vụ tích hợp sẵn</span>
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
                    <strong>Mức giá tham khảo: </strong>
                    <span>{selectedFacility.priceRate}. Hội viên sở hữu gói tập tháng hoặc thẻ hội viên được hưởng ưu đãi giảm giá khi thuê sân.</span>
                  </div>
                </div>
              ) : activeModalTab === 'photos' ? (
                /* PHOTOS GALLERY TAB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                    <img
                      src={selectedFacility.image}
                      alt={selectedFacility.name}
                      style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ padding: '12px 18px', background: 'var(--secondary-color)', color: 'var(--white-color)', fontSize: '12.5px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Góc máy toàn cảnh — {selectedFacility.name}</span>
                      <span style={{ color: 'var(--custom-btn-bg-color)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{selectedFacility.location}</span>
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
                        <span>Chi tiết mặt sàn &amp; trang thiết bị</span>
                        <span style={{ color: 'var(--primary-color)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Thực tế SCMS</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* BOOKING & TOUR FORM TAB */
                <>
                  {/* Quick Card Summary */}
                  <div className="tiya-modal-summary-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={selectedFacility.image}
                        alt={selectedFacility.name}
                        className="tiya-modal-summary-card__img"
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <strong className="tiya-modal-summary-card__title">{selectedFacility.name}</strong>
                          <button
                            type="button"
                            onClick={() => setShowFacilityPicker(prev => !prev)}
                            aria-expanded={showFacilityPicker}
                            aria-controls="booking-facility-picker"
                            className="tiya-modal-pill-btn"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>swap_horiz</span>
                            <span>Đổi sân</span>
                          </button>
                        </div>
                        <div className="tiya-modal-summary-card__meta">
                          {selectedFacility.location} • Giờ mở cửa: {selectedFacility.openHours}
                        </div>
                        <div className="tiya-modal-summary-card__price">
                          {selectedFacility.priceRate}
                        </div>
                      </div>
                    </div>

                    {showFacilityPicker && (
                      <div id="booking-facility-picker" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(61, 64, 91, 0.1)' }}>
                        <label htmlFor="booking-facility" className="tiya-form-label">
                          Chọn sân hoặc phòng tập muốn đặt
                        </label>
                        <select
                          id="booking-facility"
                          autoFocus
                          value={selectedFacility.id}
                          onChange={e => handleChangeFacility(e.target.value)}
                          className="tiya-form-select"
                        >
                          {SCMS_FACILITIES.map(facility => (
                            <option key={facility.id} value={facility.id}>
                              {facility.name} — {facility.location}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Booking Form */}
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="tiya-modal-form-header">
                      <div className="tiya-modal-form-title">
                        <span className="material-symbols-outlined">calendar_month</span>
                        <span>Phiếu Đăng Ký Đặt Thuê Cụm Sân</span>
                      </div>
                      <span className="tiya-modal-form-subtitle">
                        Giữ chỗ &amp; xác nhận nhanh qua điện thoại
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <div>
                        <label className="tiya-form-label">
                          Họ và tên người liên hệ <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={formState.fullName}
                          onChange={e => setFormState({ ...formState, fullName: e.target.value })}
                          className="tiya-form-input"
                        />
                      </div>
                      <div>
                        <label className="tiya-form-label">
                          Số điện thoại liên hệ <span className="req">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="0912 345 678"
                          value={formState.phone}
                          onChange={e => setFormState({ ...formState, phone: e.target.value })}
                          className="tiya-form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <div>
                        <label className="tiya-form-label">
                          Email (nhận hóa đơn &amp; xác nhận)
                        </label>
                        <input
                          type="email"
                          placeholder="vidu@scms.vn"
                          value={formState.email}
                          onChange={e => setFormState({ ...formState, email: e.target.value })}
                          className="tiya-form-input"
                        />
                      </div>
                      <div>
                        <label className="tiya-form-label">
                          Đơn vị / Doanh nghiệp / CLB
                        </label>
                        <input
                          type="text"
                          placeholder="Tập thể lớp / Công ty ABC..."
                          value={formState.organization}
                          onChange={e => setFormState({ ...formState, organization: e.target.value })}
                          className="tiya-form-input"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      <div>
                        <label className="tiya-form-label">
                          Ngày dự kiến <span className="req">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formState.expectedDate}
                          onChange={e => setFormState({ ...formState, expectedDate: e.target.value })}
                          className="tiya-form-input"
                        />
                      </div>
                      <div>
                        <label className="tiya-form-label">
                          Khung giờ mong muốn
                        </label>
                        <select
                          value={formState.timeSlot}
                          onChange={e => setFormState({ ...formState, timeSlot: e.target.value })}
                          className="tiya-form-select"
                        >
                          <option value="Sáng sớm (05:30 - 08:00)">Buổi sáng sớm (05:30 - 08:00)</option>
                          <option value="Sáng (08:00 - 11:30)">Buổi sáng (08:00 - 11:30)</option>
                          <option value="Chiều (13:30 - 17:30)">Buổi chiều (13:30 - 17:30)</option>
                          <option value="Tối (17:30 - 22:00)">Buổi tối (17:30 - 22:00)</option>
                          <option value="Trọn gói sự kiện">Thuê trọn ngày tổ chức giải đấu</option>
                        </select>
                      </div>
                    </div>

                    {/* Dịch vụ bổ trợ (Extra Services) */}
                    <div>
                      <label className="tiya-form-label">
                        Dịch vụ bổ trợ mong muốn:
                      </label>
                      <div className="tiya-service-grid">
                        {[
                          'Nước uống đóng chai',
                          'Áo bib phân đội',
                          'Trọng tài giao lưu',
                          'Bóng tập thể thao',
                          'Loa mic di động',
                          'Bảng lật điểm số tay'
                        ].map((srv, idx) => {
                          const isChecked = formState.extraServices.includes(srv);
                          return (
                            <label
                              key={idx}
                              className={`tiya-service-card ${isChecked ? 'is-checked' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleExtraService(srv)}
                              />
                              <span>{srv}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Ghi chú */}
                    <div>
                      <label className="tiya-form-label">
                        Ghi chú yêu cầu cụ thể
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Số lượng người tham gia dự kiến, yêu cầu về bảng điểm, nước uống hoặc thời gian bàn giao..."
                        value={formState.notes}
                        onChange={e => setFormState({ ...formState, notes: e.target.value })}
                        className="tiya-form-textarea"
                      />
                    </div>

                    {/* Modal Footer Buttons */}
                    <div className="tiya-modal-footer">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="tiya-modal-btn-cancel"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        className="tiya-modal-btn-submit"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                        <span>Xác Nhận Đặt Thuê Sân</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
