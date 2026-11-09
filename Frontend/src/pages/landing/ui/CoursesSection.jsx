import React from 'react';
import { SPORT_CATEGORY_CONFIG } from '../lib/sportCategories.js';
import { translateFacilityBadge, translateSportName, translateFacilityName, translateLocation, translateCourseHighlight, translateCoachName, translateOpenHours } from '../../../shared/i18n/i18nHelper.js';
import { CarouselSideArrows } from './CarouselControls.jsx';

export function CoursesSection({
  catalogError, catalogLoading, categoryConfig, editorialContent, facilitiesList, filteredSports,
  handleScrollSportsToIndex, handleSportClick, handleSportsScroll, highlightedSportId, hours, isEn,
  landingContent, membershipAction, selectedCategory, setSelectedCategory, sportCarouselIndex,
  sportsCarousel, sportsCarouselRef, sportsList, visibleSports
}) {
  return (
    <section className="courses-section" id="khoa-hoc">
      {catalogLoading && !editorialContent.coursesSection?.sportsList?.length && <p role="status">{isEn ? 'Loading center catalog...' : 'Đang tải danh mục trung tâm...'}</p>}
      {(editorialContent._loadError || (catalogError && !editorialContent.coursesSection?.sportsList?.length)) && <p role="alert">{editorialContent._loadError || catalogError}</p>}
      {!catalogLoading && !catalogError && sportsList.length === 0 && <p role="status">{isEn ? 'No sports currently active.' : 'Chưa có bộ môn đang hoạt động.'}</p>}
      <div className="courses-container">
        <div className="tiya-reveal courses-section-header">
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 16px',background:'rgba(129,178,154,0.15)',border:'1px solid rgba(129,178,154,0.4)',borderRadius:'100px',color:'var(--primary-color)',fontSize:'11px',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'12px'}}>
            <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--primary-color)',animation:'tiyaPulse 2s infinite'}} />
            {isEn ? 'PROFESSIONAL TRAINING PROGRAMS' : (landingContent.coursesSection?.badge || 'Chương trình đào tạo chuyên nghiệp')}
          </div>
          <h2 className="courses-title">
            <span>{visibleSports.length} {isEn ? 'Sports' : 'Bộ Môn'}</span> {isEn ? 'Disciplines' : (landingContent.coursesSection?.title || 'Thể Thao').replace(/^(Khóa Học|Bộ môn)\s*/i, '')}
          </h2>
          <p className="courses-desc">
            {isEn ? 'Curated athletic courses taught by certified instructors with modern facilities and structured curricula.' : (landingContent.coursesSection?.description || 'Các khóa đào tạo thể thao chuyên sâu, huấn luyện viên đạt chuẩn quốc gia.')}
          </p>
          <p className="text-sm text-brand-navy-600 mt-3">
            {isEn ? 'Choose a package and complete payment before booking classes. Class access depends on your package benefits and available places.' : 'Đăng ký và thanh toán gói tập trước khi đặt ca học. Quyền tham gia lớp phụ thuộc quyền lợi gói và số chỗ còn trống.'}
          </p>

          {/* Trust Badges */}
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center',marginTop:'12px'}}>
            {(landingContent.coursesSection?.trustBadges || []).map((tb, idx) => (
              <span key={tb.id || idx} style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'6px 14px',borderRadius:'100px',background:'var(--white-color)',border:'1px solid rgba(0,0,0,0.06)',fontSize:'12px',fontWeight:600,color:'var(--p-color)',boxShadow:'0 2px 6px rgba(0,0,0,0.04)'}}>
                <span className="material-symbols-outlined" style={{fontSize:'16px',color:'var(--primary-color)'}}>{tb.icon}</span>
                {tb.text}
              </span>
            ))}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="courses-filter-tabs tiya-reveal tiya-delay-1">
          {categoryConfig.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`courses-filter-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined" style={{fontSize:'16px'}}>{cat.icon}</span>
              {cat.label}
              <span className="courses-filter-tab__count">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* COURSES CAROUSEL */}
        <div
          className="tiya-carousel-shell"
          style={{ position: 'relative', width: '100%' }}
          {...(sportsCarousel?.containerProps || {})}
        >
          <CarouselSideArrows
            carousel={sportsCarousel}
            isEn={isEn}
            itemCount={filteredSports.length}
            sectionLabel={isEn ? 'sport' : 'môn thể thao'}
          />

          <div
            ref={sportsCarouselRef}
            onScroll={handleSportsScroll}
            {...(sportsCarousel?.trackProps || {})}
            className={`tiya-carousel-track ${sportsCarousel?.isDragging ? 'is-dragging' : ''}`}
            style={{display:'flex',gap:'24px',overflowX:'auto',scrollBehavior:'smooth',scrollSnapType:'x mandatory',paddingBottom:'20px',paddingTop:'4px',msOverflowStyle:'none',scrollbarWidth:'none'}}
          >
            {filteredSports.length === 0 ? (
              <div style={{width:'100%',textAlign:'center',padding:'48px 20px',color:'var(--p-color)'}}>
                <span className="material-symbols-outlined" style={{fontSize:'36px',color:'var(--primary-color)',marginBottom:'8px'}}>sports</span>
                <p style={{fontSize:'14px',fontWeight:500,margin:0}}>{isEn ? 'No sports found in this category.' : 'Chưa có bộ môn nào trong danh mục này.'}</p>
              </div>
            ) : (
              filteredSports.map(sport => {
                const facility = facilitiesList.find(f => f.id === (sport.facilityId || sport.facilityId)) || {};
              const details = {
                level: sport.level || (isEn ? 'All levels' : 'Chưa cập nhật'),
                coach: sport.coach || (isEn ? 'Class Schedule' : 'Xem lịch lớp'),
                schedule: sport.schedule || facility.openHours || hours,
                highlight: sport.highlight || '',
                price: membershipAction.label,
                capacity: sport.capacity || (isEn ? 'Standard' : 'Chưa cập nhật'),
                badges: []
              };
              const catCfg = SPORT_CATEGORY_CONFIG[sport.category] || {
                badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                iconColor: 'text-rose-400',
                label: sport.category,
                labelEn: sport.category
              };
              const isHighlighted = highlightedSportId === sport.id;

              return (
                <div
                  key={sport.id}
                  data-carousel-item
                  style={{width:'clamp(300px,85vw,410px)',flexShrink:0,scrollSnapAlign:'start',display:'flex',flexDirection:'column'}}
                >
                  <div
                    id={`sport-card-${sport.id}`}
                    onClick={() => handleSportClick(sport)}
                    className={`tiya-course-card ${isHighlighted ? 'highlighted' : ''}`}
                  >
                    <div className="tiya-course-card__image-wrap">
                      {sport.image || facility.image || facility.secondaryImage ? <img src={sport.image || facility.image || facility.secondaryImage} alt={sport.name} loading="lazy" draggable={false} /> : <div className="h-full grid place-items-center bg-brand-navy-100 text-slate-500 text-sm">{isEn ? 'No image' : 'Chưa có ảnh'}</div>}
                      <div style={{position:'absolute',top:'12px',left:'12px',right:'12px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',zIndex:2}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'100px',background:'rgba(0,0,0,0.65)',color:'var(--white-color)',fontSize:'10px',fontWeight:700,textTransform:'uppercase',backdropFilter:'blur(4px)'}}>
                          <span className="material-symbols-outlined" style={{fontSize:'13px'}}>{sport.icon}</span>
                          {isEn ? (catCfg.labelEn || catCfg.label) : catCfg.label}
                        </span>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'100px',background:'rgba(129,178,154,0.9)',color:'var(--white-color)',fontSize:'10px',fontWeight:700,backdropFilter:'blur(4px)'}}>
                          {isEn ? translateFacilityBadge(facility.badge, true) : (facility.badge || (isEn ? 'Court / Hall' : 'Phòng / sân'))}
                        </span>
                      </div>
                      <div style={{position:'absolute',bottom:'10px',right:'12px',padding:'4px 12px',borderRadius:'8px',background:'rgba(0,0,0,0.7)',color:'var(--custom-btn-bg-color)',fontSize:'12px',fontWeight:700,backdropFilter:'blur(4px)'}}>
                        <a href={membershipAction.href} onClick={event => event.stopPropagation()} style={{color:'inherit'}}>{details.price}</a>
                      </div>
                    </div>

                    <div className="tiya-course-card__body">
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px',marginBottom:'6px',minHeight:'30px'}}>
                        <h3 className="tiya-course-card__title" style={{margin:0}}>{isEn ? translateSportName(sport.name, true) : sport.name}</h3>
                        {sport.rating && <span style={{display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'12px',fontWeight:700,color:'var(--custom-btn-bg-hover-color)',flexShrink:0}}>
                          <span className="material-symbols-outlined" style={{fontSize:'14px',color:'var(--custom-btn-bg-color)'}}>star</span>
                          {sport.rating}
                          {sport.ratingCount && <span style={{fontSize:'10px',color:'var(--p-color)'}}>({sport.ratingCount})</span>}
                        </span>}
                      </div>

                      <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:600,color:'var(--primary-color)',marginBottom:'10px',minHeight:'20px'}}>
                        <span className="material-symbols-outlined" style={{fontSize:'15px',flexShrink:0}}>location_on</span>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{isEn ? translateFacilityName(facility.name, true) : facility.name} • {isEn ? translateLocation(facility.location, true) : facility.location}</span>
                      </div>

                      <p style={{fontSize:'13px',lineHeight:1.6,color:'var(--p-color)',marginBottom:'14px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',minHeight:'42px'}}>
                        {isEn ? (translateCourseHighlight(details.highlight, true) || details.highlight) : details.highlight}
                      </p>

                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px',fontSize:'11px',color:'var(--p-color)',minHeight:'36px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 8px',background:'#F9FAFB',borderRadius:'6px'}}>
                          <span className="material-symbols-outlined" style={{fontSize:'15px',color:'var(--primary-color)'}}>sports</span>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{isEn ? translateCoachName(details.coach, true) : details.coach}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 8px',background:'#F9FAFB',borderRadius:'6px'}}>
                          <span className="material-symbols-outlined" style={{fontSize:'15px',color:'var(--custom-btn-bg-color)'}}>schedule</span>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{details.schedule ? (isEn ? translateOpenHours(details.schedule, true) : details.schedule.replace('hàng ngày', '')) : (isEn ? 'Flexible' : 'Linh hoạt')}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="custom-border-btn"
                        style={{width:'100%',justifyContent:'center'}}
                        onClick={(e) => { e.stopPropagation(); handleSportClick(sport); }}
                      >
                        {isEn ? 'View Details & Book' : 'Xem Chi Tiết & Đặt Lịch'}
                        <span className="material-symbols-outlined" style={{fontSize:'16px'}}>arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* Seamless flow into Facilities Section (both sharing Tiya Warm Cream #F4F1DE) */}
      <svg className="courses-bottom-wave" style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#F4F1DE" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,213,823,240C891.4,267,960,245,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z" />
      </svg>
    </section>
  );
}
