import React from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';

export function CarouselSideArrows({ carousel, itemCount = 0, sectionLabel = '' }) {
  const { t } = useLanguage();
  if (itemCount <= 1 || !carousel) return null;

  const prevLabel = t('landing.carousel.prev', { label: sectionLabel });
  const nextLabel = t('landing.carousel.next', { label: sectionLabel });

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

