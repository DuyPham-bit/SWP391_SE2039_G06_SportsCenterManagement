import React from 'react';

export function CarouselSideArrows({ carousel, isEn = false, itemCount = 0, sectionLabel = '' }) {
  if (itemCount <= 1 || !carousel) return null;

  const prevLabel = isEn
    ? `Previous ${sectionLabel || 'slide'}`
    : `Lướt sang trái ${sectionLabel}`;
  const nextLabel = isEn
    ? `Next ${sectionLabel || 'slide'}`
    : `Lướt sang phải ${sectionLabel}`;

  return (
    <>
      <button
        type="button"
        onClick={carousel.scrollPrev}
        aria-label={prevLabel}
        title={prevLabel}
        className="tiya-carousel-side-btn tiya-carousel-side-btn--prev"
      >
        <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
      </button>
      <button
        type="button"
        onClick={carousel.scrollNext}
        aria-label={nextLabel}
        title={nextLabel}
        className="tiya-carousel-side-btn tiya-carousel-side-btn--next"
      >
        <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
      </button>
    </>
  );
}

export function CarouselBottomBar({ carousel, items = [], isEn = false, getDotAriaLabel }) {
  if (!Array.isArray(items) || items.length <= 1 || !carousel) return null;

  const {
    activeIndex,
    scrollToIndex,
    scrollPrev,
    scrollNext,
    isAutoPlayEnabled,
    setIsAutoPlayEnabled,
    isHovered,
    isDragging
  } = carousel;

  const isTemporarilyPaused = isAutoPlayEnabled && (isHovered || isDragging);

  return (
    <div className="tiya-carousel-controls-bar">
      <div className="tiya-carousel-dots-group">
        <button
          type="button"
          onClick={scrollPrev}
          aria-label={isEn ? 'Previous item' : 'Thẻ trước'}
          title={isEn ? 'Previous (Arrow Left)' : 'Thẻ trước (Phím mũi tên trái)'}
          className="tiya-carousel-step-btn"
        >
          <span className="material-symbols-outlined" aria-hidden="true">west</span>
        </button>

        <div className="tiya-carousel-dots">
          {items.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              aria-label={getDotAriaLabel ? getDotAriaLabel(item, idx) : (isEn ? `Go to slide ${idx + 1}` : `Chuyển tới thẻ ${idx + 1}`)}
              className={`tiya-carousel-dot ${activeIndex === idx ? 'active' : ''}`}
              style={{
                width: activeIndex === idx ? '36px' : '8px',
                background: activeIndex === idx ? 'var(--primary-color)' : 'rgba(0,0,0,0.15)'
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={scrollNext}
          aria-label={isEn ? 'Next item' : 'Thẻ tiếp theo'}
          title={isEn ? 'Next (Arrow Right)' : 'Thẻ tiếp theo (Phím mũi tên phải)'}
          className="tiya-carousel-step-btn"
        >
          <span className="material-symbols-outlined" aria-hidden="true">east</span>
        </button>
      </div>

      <div className="tiya-carousel-meta-group">
        <span className="tiya-carousel-counter">
          <strong>{activeIndex + 1}</strong> / {items.length}
        </span>

        <button
          type="button"
          onClick={() => setIsAutoPlayEnabled((prev) => !prev)}
          aria-pressed={isAutoPlayEnabled}
          aria-label={
            isAutoPlayEnabled
              ? (isEn ? 'Pause auto-slide' : 'Tạm dừng tự động lướt')
              : (isEn ? 'Enable auto-slide' : 'Bật tự động lướt')
          }
          className={`tiya-carousel-autoplay-btn ${isAutoPlayEnabled ? 'is-active' : ''}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }} aria-hidden="true">
            {isAutoPlayEnabled ? (isTemporarilyPaused ? 'motion_photos_paused' : 'autorenew') : 'play_arrow'}
          </span>
          <span>
            {isAutoPlayEnabled
              ? (isTemporarilyPaused
                  ? (isEn ? 'Paused on hover' : 'Tạm dừng khi rê chuột')
                  : (isEn ? 'Auto-sliding' : 'Tự động lướt'))
              : (isEn ? 'Auto-slide off' : 'Đã tắt tự lướt')}
          </span>
        </button>
      </div>
    </div>
  );
}

