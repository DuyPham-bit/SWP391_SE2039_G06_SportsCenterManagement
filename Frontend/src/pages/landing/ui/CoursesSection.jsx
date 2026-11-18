import React from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { CarouselSideArrows } from './CarouselControls.jsx';

export function CoursesSection({
  catalogError, catalogLoading, categoryConfig, editorialContent, facilitiesList, filteredSports,
  handleScrollSportsToIndex, handleSportClick, handleSportsScroll, highlightedSportId, hours,
  landingContent, membershipAction, selectedCategory, setSelectedCategory, sportCarouselIndex,
  sportsCarousel, sportsCarouselRef, sportsList, visibleSports
}) {
  const { t } = useLanguage();
  const section = landingContent?.coursesSection || {};
  return (
    <section className="courses-section" id="khoa-hoc">
      <div className="courses-container">
        {catalogLoading && !editorialContent?.coursesSection?.sportsList?.length && (
          <p role="status" className="text-center text-sm text-brand-navy-600 mb-4">{t('landing.courses.loading')}</p>
        )}
        {catalogError && !editorialContent?.coursesSection?.sportsList?.length && (
          <div role="alert" className="max-w-2xl mx-auto mb-6 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center">
            {catalogError}
          </div>
        )}
        {!catalogLoading && !catalogError && sportsList.length === 0 && (
          <p role="status" className="text-center text-sm text-brand-navy-600 mb-4">{t('landing.courses.none')}</p>
        )}
        <div className="tiya-reveal courses-section-header">
          <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 16px',background:'rgba(129,178,154,0.15)',border:'1px solid rgba(129,178,154,0.4)',borderRadius:'100px',color:'var(--primary-color)',fontSize:'11px',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'12px'}}>
            <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--primary-color)',animation:'tiyaPulse 2s infinite'}} />
            {section.badge}
          </div>
          <h2 className="courses-title">
            <span>{t('landing.courses.count', { count: visibleSports?.length || 0 })}</span> {section.title}
          </h2>
          <p className="courses-desc">
            {section.description}
          </p>
          <p className="text-sm text-brand-navy-600 mt-3">
            {t('landing.courses.packageNote')}
          </p>

          {/* Trust Badges */}
          <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center',marginTop:'12px'}}>
            {(section.trustBadges || []).map((tb, idx) => (
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
            itemCount={filteredSports.length}
            sectionLabel={t('landing.courses.carouselLabel')}
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
                <p style={{fontSize:'14px',fontWeight:500,margin:0}}>{t('landing.courses.noneInCategory')}</p>
              </div>
            ) : (
              filteredSports.map(sport => {
                const facility = facilitiesList.find(f => f.id === (sport.facilityId || sport.facilityId)) || {};
              const details = {
                level: sport.level || t('landing.common.notUpdated'),
                coach: sport.coach || t('landing.courses.viewSchedule'),
                schedule: sport.schedule || facility.openHours || hours,
                highlight: sport.highlight || '',
                price: membershipAction.label,
                capacity: sport.capacity || t('landing.common.notUpdated'),
                badges: []
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
                      {sport.image || facility.image || facility.secondaryImage ? <img src={sport.image || facility.image || facility.secondaryImage} alt={sport.name} loading="lazy" draggable={false} /> : <div className="h-full grid place-items-center bg-brand-navy-100 text-slate-500 text-sm">{t('landing.common.noImage')}</div>}
                      <div style={{position:'absolute',top:'12px',left:'12px',right:'12px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',zIndex:2}}>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'100px',background:'rgba(0,0,0,0.65)',color:'var(--white-color)',fontSize:'10px',fontWeight:700,textTransform:'uppercase',backdropFilter:'blur(4px)'}}>
                          <span className="material-symbols-outlined" style={{fontSize:'13px'}}>{sport.icon}</span>
                          {sport.category}
                        </span>
                        <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'100px',background:'rgba(129,178,154,0.9)',color:'var(--white-color)',fontSize:'10px',fontWeight:700,backdropFilter:'blur(4px)'}}>
                          {facility.badge || t('landing.courses.courtFallback')}
                        </span>
                      </div>
                      <div style={{position:'absolute',bottom:'10px',right:'12px',padding:'4px 12px',borderRadius:'8px',background:'rgba(0,0,0,0.7)',color:'var(--custom-btn-bg-color)',fontSize:'12px',fontWeight:700,backdropFilter:'blur(4px)'}}>
                        <a href={membershipAction.href} onClick={event => event.stopPropagation()} style={{color:'inherit'}}>{details.price}</a>
                      </div>
                    </div>

                    <div className="tiya-course-card__body">
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px',marginBottom:'6px',minHeight:'30px'}}>
                        <h3 className="tiya-course-card__title" style={{margin:0}}>{sport.name}</h3>
                        {sport.rating && <span style={{display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'12px',fontWeight:700,color:'var(--custom-btn-bg-hover-color)',flexShrink:0}}>
                          <span className="material-symbols-outlined" style={{fontSize:'14px',color:'var(--custom-btn-bg-color)'}}>star</span>
                          {sport.rating}
                          {sport.ratingCount && <span style={{fontSize:'10px',color:'var(--p-color)'}}>({sport.ratingCount})</span>}
                        </span>}
                      </div>

                      <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:600,color:'var(--primary-color)',marginBottom:'10px',minHeight:'20px'}}>
                        <span className="material-symbols-outlined" style={{fontSize:'15px',flexShrink:0}}>location_on</span>
                        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{facility.name} • {facility.location}</span>
                      </div>

                      <p style={{fontSize:'13px',lineHeight:1.6,color:'var(--p-color)',marginBottom:'14px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden',minHeight:'42px'}}>
                        {details.highlight}
                      </p>

                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px',fontSize:'11px',color:'var(--p-color)',minHeight:'36px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 8px',background:'#F9FAFB',borderRadius:'6px'}}>
                          <span className="material-symbols-outlined" style={{fontSize:'15px',color:'var(--primary-color)'}}>sports</span>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{details.coach}</span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 8px',background:'#F9FAFB',borderRadius:'6px'}}>
                          <span className="material-symbols-outlined" style={{fontSize:'15px',color:'var(--custom-btn-bg-color)'}}>schedule</span>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{details.schedule || t('landing.courses.flexible')}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="custom-border-btn"
                        style={{width:'100%',justifyContent:'center'}}
                        onClick={(e) => { e.stopPropagation(); handleSportClick(sport); }}
                      >
                        {t('landing.courses.viewDetails')}
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
