import { useMemo, useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { getMembershipAction } from '../../../entities/membership/index.js';
import { useLandingContentState, normalizeZaloPhone, getExternalContactUrl } from '../../../entities/landing-content/index.js';
import { usePublicCatalog, getLandingPresentation } from '../../../entities/catalog/index.js';
import { useHorizontalCarousel } from './useHorizontalCarousel.js';

// Filter id meaning "every category" (category names themselves are published content).
const ALL_CATEGORIES = 'all';

export function useLandingPage() {
  const { isAuthenticated, role, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const membershipAction = getMembershipAction(isAuthenticated, role, t);
  // Content comes localized from GET /api/home-content?lang=…; no client-side translation or defaults.
  const { content: editorialContent, stats: editorialStats, loaded: editorialLoaded, error: editorialError, retry: retryEditorial } = useLandingContentState();
  const { catalog, loading: catalogLoading, error: catalogError } = usePublicCatalog();
  const includedLabel = t('landing.priceIncluded');
  const landingContent = useMemo(
    () => getLandingPresentation(editorialContent, catalog, includedLabel),
    [editorialContent, catalog, includedLabel]
  );
  const facilitiesList = landingContent?.facilitiesSection?.facilitiesList || [];
  const catalogSportList = landingContent?.coursesSection?.sportsList || [];
  const hours = landingContent?.ctaAndFooter?.hoursWeekdays || (catalog?.center?.openingTime && catalog?.center?.closingTime ? catalog.center.openingTime.slice(0, 5) + ' - ' + catalog.center.closingTime.slice(0, 5) : t('landing.hoursNotSet'));
  const zaloPhone = normalizeZaloPhone(landingContent.ctaAndFooter?.contactZaloPhone);
  const socialContacts = [
    { label: `Zalo: ${zaloPhone}`, icon: 'chat', url: zaloPhone ? `https://zalo.me/${zaloPhone}` : '' },
    { label: 'Facebook', icon: 'public', url: getExternalContactUrl(landingContent.ctaAndFooter?.contactFacebookUrl) }
  ].filter(contact => contact.url);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [selectedFacilityForModal, setSelectedFacilityForModal] = useState(null);
  const [activeNav, setActiveNav] = useState('trang-chu');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);
  const [highlightedSportId, setHighlightedSportId] = useState(null);
  const [selectedSportFromMenu, setSelectedSportFromMenu] = useState('all');
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef(null);
  const coursesDropdownRef = useRef(null);
  const closeTimerRef = useRef(null);
  const isManualScrollRef = useRef(false);
  const manualScrollTimerRef = useRef(null);

  const [showIntro, setShowIntro] = useState(true);

  // Tiya Scroll Reveal Observer (Synchronized with Tiya animations)
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  const elements = document.querySelectorAll('.tiya-reveal, .tiya-reveal--scale');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [catalog, editorialContent, selectedCategory]);

  // Sport cards; managers hide/show them with isVisible.
  const sportsList = catalogSportList;
  const visibleSports = useMemo(() => {
    return sportsList.filter(s => s.isVisible !== false);
  }, [sportsList]);

  const leftSports = useMemo(() => {
    const items = [{ id: 'all', name: t('landing.nav.allSports') }];
    visibleSports.slice(0, Math.ceil(visibleSports.length / 2)).forEach(s => items.push({ id: s.id, name: s.name }));
    return items;
  }, [visibleSports, t]);

  const rightSports = useMemo(() => {
    return visibleSports.slice(Math.ceil(visibleSports.length / 2)).map(s => ({ id: s.id, name: s.name }));
  }, [visibleSports]);

  const navItems = [
    { id: 'trang-chu', href: '#/', label: t('landing.nav.home'), targetId: 'trang-chu' },
    { id: 've-chung-toi', href: '#ve-chung-toi', label: t('landing.nav.about'), targetId: 've-chung-toi' },
    { id: 'khoa-hoc', href: '#khoa-hoc', label: t('landing.nav.courses'), targetId: 'khoa-hoc', hasDropdown: true },
    { id: 'co-so-vat-chat', href: '#co-so-vat-chat', label: t('landing.nav.facilities'), targetId: 'co-so-vat-chat' },
  ];

  const handleSportClick = (sport) => {
    const facility = facilitiesList.find(f => f.id === sport.facilityId);
    if (facility) setSelectedFacilityForModal(facility);
  };

  const handleCoursesMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsCoursesDropdownOpen(true);
  };

  const handleCoursesMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsCoursesDropdownOpen(false);
    }, 220);
  };

  const toggleCoursesDropdown = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsCoursesDropdownOpen(prev => !prev);
  };

  const handleSelectMenuItem = (item) => {
    setIsCoursesDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setActiveNav('khoa-hoc');
    setSelectedSportFromMenu(item.id);
    isManualScrollRef.current = true;
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 900);

    if (item.id === 'all') {
      setSelectedCategory(ALL_CATEGORIES);
      setHighlightedSportId(null);
      const sectionEl = document.getElementById('khoa-hoc');
      if (sectionEl) {
        const headerOffset = 80;
        const elementPosition = sectionEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
      return;
    }

    const sport = sportsList.find(s => s.id === item.id);
    if (sport) {
      setSelectedCategory(ALL_CATEGORIES);
      setHighlightedSportId(sport.id);

      const targetEl = document.getElementById(`sport-card-${sport.id}`) || document.getElementById('khoa-hoc');
      if (targetEl) {
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }

      const facility = facilitiesList.find(f => f.id === sport.facilityId);
      if (facility) {
        setTimeout(() => {
          setSelectedFacilityForModal(facility);
        }, 350);
      }

      setTimeout(() => {
        setHighlightedSportId(null);
      }, 4500);
    }
  };

  const handleNavClick = (item, e) => {
    if (e) e.preventDefault();
    if (!item) return;
    setActiveNav(item.id);
    window.location.hash = item.href;

    isManualScrollRef.current = true;
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    manualScrollTimerRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 900);

    if (item.id === 'trang-chu') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(item.targetId);
      if (el) {
        const headerOffset = 80;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (coursesDropdownRef.current && !coursesDropdownRef.current.contains(e.target)) {
        setIsCoursesDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsCoursesDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // ScrollSpy & Hash synchronization & Header scroll transition
  useEffect(() => {
    const sectionIds = ['trang-chu', 've-chung-toi', 'khoa-hoc', 'co-so-vat-chat'];

    const syncFromHash = () => {
      const raw = window.location.hash || '';
      const anchor = raw.replace(/^#\/?/, '').split('?')[0];
      if (anchor && sectionIds.includes(anchor)) {
        setActiveNav(anchor);
        const el = document.getElementById(anchor);
        if (el) {
          isManualScrollRef.current = true;
          if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
          manualScrollTimerRef.current = setTimeout(() => {
            isManualScrollRef.current = false;
          }, 900);
          setTimeout(() => {
            const headerOffset = 80;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }, 100);
        }
      } else if (!anchor || anchor === '/') {
        setActiveNav('trang-chu');
      }
    };

    syncFromHash();

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 40);

      if (isManualScrollRef.current) return;

      if (scrollY < 180) {
        setActiveNav('trang-chu');
        return;
      }

      // If near bottom of the document, activate the last section ('co-so-vat-chat')
      const isNearBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - 120;
      if (isNearBottom) {
        setActiveNav('co-so-vat-chat');
        return;
      }

      const scrollPos = scrollY + Math.min(260, window.innerHeight * 0.35);
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + scrollY;
          if (scrollPos >= top) {
            setActiveNav(id);
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', syncFromHash);
      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    };
  }, []);

  const categoryConfig = useMemo(() => [
    { id: ALL_CATEGORIES, label: t('landing.nav.allSports'), icon: 'grid_view', count: visibleSports.length },
    // Category names are published content in the page language.
    ...[...new Set(visibleSports.map(sport => sport.category).filter(Boolean))].map(category => (
      { id: category, label: category, icon: 'sports', count: visibleSports.filter(sport => sport.category === category).length }
    ))
  ], [visibleSports, t]);

  const filteredSports = selectedCategory === ALL_CATEGORIES
    ? visibleSports
    : visibleSports.filter(s => s.category === selectedCategory);

  const sportsCarousel = useHorizontalCarousel({
    itemCount: filteredSports.length,
    itemSelector: '[data-carousel-item]',
    resetKey: `${selectedCategory}-${filteredSports.length}`,
    isModalOpen: Boolean(selectedFacilityForModal),
    autoPlayIntervalMs: 3800
  });
  const sportCarouselIndex = sportsCarousel.activeIndex;
  const sportsCarouselRef = sportsCarousel.carouselRef;
  const handleSportsScroll = sportsCarousel.handleScroll;
  const handleScrollSportsToIndex = sportsCarousel.scrollToIndex;

  const getDashboardLink = () => {
    const normalized = String(role || '').toUpperCase();
    switch (normalized) {
      case 'SYSTEMADMIN':
      case 'ADMIN': return '#/admin/dashboard';
      case 'MANAGER': return '#/manager/dashboard';
      case 'RECEPTIONIST': return '#/receptionist/dashboard';
      case 'COACH': return '#/coach/dashboard';
      case 'MEMBER': return '#/member/dashboard';
      default: return '#/login';
    }
  };

  return {
    activeNav, catalog, catalogError, catalogLoading, categoryConfig, coursesDropdownRef,
    editorialContent, editorialError, editorialLoaded, editorialStats, facilitiesList, filteredSports, getDashboardLink, handleCoursesMouseEnter,
    handleCoursesMouseLeave, handleNavClick, handleScrollSportsToIndex, handleSelectMenuItem,
    handleSportClick, handleSportsScroll, highlightedSportId, hours, isAuthenticated,
    isCoursesDropdownOpen, isMobileCoursesOpen, isMobileMenuOpen, isScrolled, isVideoMuted,
    landingContent, language, leftSports, retryEditorial, t, logout, membershipAction, navItems, rightSports, role,
    selectedCategory, selectedFacilityForModal, selectedSportFromMenu, setIsMobileCoursesOpen,
    setIsMobileMenuOpen, setIsVideoMuted, setLanguage, setSelectedCategory,
    setSelectedFacilityForModal, setShowIntro, showIntro, socialContacts, sportCarouselIndex,
    sportsCarousel, sportsCarouselRef, sportsList, toggleCoursesDropdown, videoRef, visibleSports
  };
}
