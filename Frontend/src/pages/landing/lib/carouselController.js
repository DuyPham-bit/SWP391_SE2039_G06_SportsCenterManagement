export function computeNextCarouselIndex({
  currentIndex = 0,
  itemCount = 0,
  scrollLeft = 0,
  maxScroll = 0,
  direction = 1
} = {}) {
  if (itemCount <= 1) return 0;

  if (direction > 0) {
    const isAtRightEdge = maxScroll > 0 && scrollLeft >= maxScroll - 25;
    if (currentIndex >= itemCount - 1 || isAtRightEdge) {
      return 0;
    }
    return currentIndex + 1;
  }

  const isAtLeftEdge = scrollLeft <= 10 && currentIndex <= 0;
  if (currentIndex <= 0 || isAtLeftEdge) {
    return itemCount - 1;
  }
  return currentIndex - 1;
}

export function computeDragScrollDelta({
  startX = 0,
  currentX = 0,
  startScrollLeft = 0,
  dragThreshold = 6
} = {}) {
  const deltaX = currentX - startX;
  return {
    scrollLeft: startScrollLeft - deltaX,
    didDrag: Math.abs(deltaX) >= dragThreshold
  };
}

export function shouldAutoAdvanceCarousel({
  itemCount = 0,
  isAutoPlayEnabled = true,
  isHovered = false,
  isDragging = false,
  isFocused = false,
  isModalOpen = false,
  isDocumentHidden = false,
  reducedMotion = false
} = {}) {
  if (itemCount <= 1) return false;
  if (!isAutoPlayEnabled) return false;
  if (isHovered || isDragging || isFocused || isModalOpen || isDocumentHidden || reducedMotion) {
    return false;
  }
  return true;
}

