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

