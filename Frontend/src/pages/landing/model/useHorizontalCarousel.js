import { useState, useRef, useEffect, useCallback } from 'react';
import { prefersReducedMotion } from '../../../shared/lib/motion.js';
import {
  computeNextCarouselIndex,
  computeDragScrollDelta,
  shouldAutoAdvanceCarousel
} from '../lib/carouselController.js';

export function useHorizontalCarousel({
  itemCount = 0,
  itemSelector = '[data-carousel-item]',
  resetKey = '',
  isModalOpen = false,
  autoPlayIntervalMs = 3800
} = {}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const carouselRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const didDragRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  const findClosestIndex = useCallback((el) => {
    if (!el) return 0;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const items = el.querySelectorAll(itemSelector);
    if (!items.length) return 0;

    if (maxScroll > 0 && scrollLeft >= maxScroll - 25) {
      return items.length - 1;
    }

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

    return closestIdx;
  }, [itemSelector]);

  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    const el = carouselRef.current;
    if (!el) return;
    setActiveIndex(findClosestIndex(el));
  }, [findClosestIndex]);

  const scrollToIndex = useCallback((idx) => {
    const el = carouselRef.current;
    if (!el) return;
    const items = el.querySelectorAll(itemSelector);
    if (!items.length) return;
    const clampedIdx = Math.max(0, Math.min(idx, items.length - 1));
    const targetItem = items[clampedIdx];
    if (!targetItem) return;

    isProgrammaticScrollRef.current = true;
    setActiveIndex(clampedIdx);

    const scrollTarget = targetItem.offsetLeft - el.offsetLeft;
    el.style.scrollBehavior = 'smooth';
    el.style.scrollSnapType = 'x mandatory';

    el.scrollTo({
      left: Math.max(0, scrollTarget),
      behavior: 'smooth'
    });

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 480);
  }, [itemSelector]);

  const scrollStep = useCallback((direction = 1) => {
    const el = carouselRef.current;
    if (!el) return;
    const items = el.querySelectorAll(itemSelector);
    if (!items.length) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const nextIdx = computeNextCarouselIndex({
      currentIndex: activeIndex,
      itemCount: items.length,
      scrollLeft: el.scrollLeft,
      maxScroll,
      direction
    });
    scrollToIndex(nextIdx);
  }, [activeIndex, itemSelector, scrollToIndex]);

  const scrollPrev = useCallback(() => scrollStep(-1), [scrollStep]);
  const scrollNext = useCallback(() => scrollStep(1), [scrollStep]);

  // Reset to start when category / search / count changes
  useEffect(() => {
    setActiveIndex(0);
    const el = carouselRef.current;
    if (el) {
      el.scrollLeft = 0;
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  }, [resetKey, itemCount]);

  // Smart Auto-Play Timer
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const reducedMotion = prefersReducedMotion();
    const isDocumentHidden = typeof document !== 'undefined' ? Boolean(document.hidden) : false;

    if (!shouldAutoAdvanceCarousel({
      itemCount,
      isAutoPlayEnabled,
      isHovered,
      isDragging,
      isFocused,
      isModalOpen,
      isDocumentHidden,
      reducedMotion
    })) {
      return undefined;
    }

    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      scrollStep(1);
    }, autoPlayIntervalMs);

    return () => clearInterval(timer);
  }, [
    itemCount,
    isAutoPlayEnabled,
    isHovered,
    isDragging,
    isFocused,
    isModalOpen,
    autoPlayIntervalMs,
    scrollStep
  ]);

  const finishPointerDrag = useCallback(() => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    const el = carouselRef.current;
    const wasDragged = didDragRef.current;
    didDragRef.current = false;
    setIsDragging(false);

    if (el) {
      el.style.scrollBehavior = 'smooth';
      el.style.scrollSnapType = 'x mandatory';
      if (wasDragged) {
        suppressNextClickRef.current = true;
        setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 120);
        const closest = findClosestIndex(el);
        scrollToIndex(closest);
      }
    }
  }, [findClosestIndex, scrollToIndex]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onWindowMouseUp = () => finishPointerDrag();
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mouseup', onWindowMouseUp);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [finishPointerDrag]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = carouselRef.current;
    if (!el) return;
    isPointerDownRef.current = true;
    didDragRef.current = false;
    dragStartXRef.current = e.pageX;
    dragStartScrollLeftRef.current = el.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isPointerDownRef.current) return;
    const el = carouselRef.current;
    if (!el) return;

    const { scrollLeft, didDrag } = computeDragScrollDelta({
      startX: dragStartXRef.current,
      currentX: e.pageX,
      startScrollLeft: dragStartScrollLeftRef.current
    });

    if (didDrag) {
      if (!didDragRef.current) {
        didDragRef.current = true;
        setIsDragging(true);
        el.style.scrollBehavior = 'auto';
        el.style.scrollSnapType = 'none';
      }
      e.preventDefault();
      el.scrollLeft = scrollLeft;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    finishPointerDrag();
  }, [finishPointerDrag]);

  const handleClickCapture = useCallback((e) => {
    if (suppressNextClickRef.current || didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressNextClickRef.current = false;
    }
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollNext();
    }
  }, [scrollPrev, scrollNext]);

  const handleBlurCapture = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsFocused(false);
    }
  }, []);

  return {
    carouselRef,
    activeIndex,
    setActiveIndex,
    isAutoPlayEnabled,
    setIsAutoPlayEnabled,
    isHovered,
    setIsHovered,
    isDragging,
    scrollToIndex,
    scrollPrev,
    scrollNext,
    handleScroll,
    containerProps: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: handleMouseLeave,
      onFocusCapture: () => setIsFocused(true),
      onBlurCapture: handleBlurCapture
    },
    trackProps: {
      onScroll: handleScroll,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: finishPointerDrag,
      onClickCapture: handleClickCapture,
      onKeyDown: handleKeyDown,
      tabIndex: 0
    }
  };
}

