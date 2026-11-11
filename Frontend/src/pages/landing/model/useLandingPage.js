import { useMemo, useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../entities/session/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { getMembershipAction } from '../../../entities/membership/index.js';
import { useLandingContent, normalizeZaloPhone, getExternalContactUrl } from '../../../entities/landing-content/index.js';
import { usePublicCatalog, getLandingPresentation } from '../../../entities/catalog/index.js';
import { translateLandingContent, translateSportName } from '../../../shared/i18n/i18nHelper.js';
import { SPORT_CATEGORY_CONFIG } from '../lib/sportCategories.js';
import { useHorizontalCarousel } from './useHorizontalCarousel.js';

export function useLandingPage() {
  const { isAuthenticated, role, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isEn = language === 'en';
  const membershipAction = getMembershipAction(isAuthenticated, role, isEn);
  const editorialContent = useLandingContent();
  const { catalog, loading: catalogLoading, error: catalogError } = usePublicCatalog();
  const rawLandingContent = getLandingPresentation(editorialContent, catalog);
  const landingContent = useMemo(() => isEn ? translateLandingContent(rawLandingContent, true) : rawLandingContent, [rawLandingContent, isEn]);
  const facilitiesList = landingContent.facilitiesSection.facilitiesList;
  const catalogSportList = landingContent.coursesSection.sportsList;
  const hours = landingContent.ctaAndFooter?.hoursWeekdays || (catalog?.center.openingTime && catalog?.center.closingTime ? catalog.center.openingTime.slice(0, 5) + ' - ' + catalog.center.closingTime.slice(0, 5) : 'Chưa cập nhật');
  const zaloPhone = normalizeZaloPhone(landingContent.ctaAndFooter?.contactZaloPhone);
  const socialContacts = [
    { label: `Zalo: ${zaloPhone}`, icon: 'chat', url: zaloPhone ? `https://zalo.me/${zaloPhone}` : '' },
    { label: 'Facebook', icon: 'public', url: getExternalContactUrl(landingContent.ctaAndFooter?.contactFacebookUrl) }
  ].filter(contact => contact.url);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
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

  // Danh sách các môn học (Chủ động ẩn/hiện bởi manager qua isVisible)
  const sportsList = catalogSportList;
  const visibleSports = useMemo(() => {
    return sportsList.filter(s => s.isVisible !== false);
  }, [sportsList]);

  const leftSports = useMemo(() => {
    const items = [{ id: 'all', name: isEn ? 'All Sports' : 'Tất cả' }];
    visibleSports.slice(0, Math.ceil(visibleSports.length / 2)).forEach(s => items.push({ id: s.id, name: isEn ? translateSportName(s.name, true) : s.name }));
    return items;
  }, [visibleSports, isEn]);

  const rightSports = useMemo(() => {
    return visibleSports.slice(Math.ceil(visibleSports.length / 2)).map(s => ({ id: s.id, name: isEn ? translateSportName(s.name, true) : s.name }));
  }, [visibleSports, isEn]);

  const navItems = [
    { id: 'trang-chu', href: '#/', label: isEn ? 'HOME' : 'TRANG CHỦ', targetId: 'trang-chu' },
    { id: 've-chung-toi', href: '#ve-chung-toi', label: isEn ? 'ABOUT US' : 'VỀ CHÚNG TÔI', targetId: 've-chung-toi' },
    { id: 'khoa-hoc', href: '#khoa-hoc', label: isEn ? 'COURSES' : 'KHÓA HỌC', targetId: 'khoa-hoc', hasDropdown: true },
    { id: 'co-so-vat-chat', href: '#co-so-vat-chat', label: isEn ? 'FACILITIES' : 'CƠ SỞ VẬT CHẤT', targetId: 'co-so-vat-chat' },
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
      setSelectedCategory('Tất cả');
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
      setSelectedCategory('Tất cả');
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
    { id: 'Tất cả', label: isEn ? 'All Sports' : 'Tất cả', icon: 'grid_view', count: visibleSports.length },
    ...[...new Set(visibleSports.map(sport => sport.category).filter(Boolean))].map(category => {
      const cfg = SPORT_CATEGORY_CONFIG[category];
      const label = isEn ? (cfg?.labelEn || category) : (cfg?.label || category);
      return { id: category, label, icon: 'sports', count: visibleSports.filter(sport => sport.category === category).length };
    })
  ], [visibleSports, isEn]);

  const filteredSports = selectedCategory === 'Tất cả'
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
    editorialContent, facilitiesList, filteredSports, getDashboardLink, handleCoursesMouseEnter,
    handleCoursesMouseLeave, handleNavClick, handleScrollSportsToIndex, handleSelectMenuItem,
    handleSportClick, handleSportsScroll, highlightedSportId, hours, isAuthenticated,
    isCoursesDropdownOpen, isEn, isMobileCoursesOpen, isMobileMenuOpen, isScrolled, isVideoMuted,
    landingContent, language, leftSports, logout, membershipAction, navItems, rightSports, role,
    selectedCategory, selectedFacilityForModal, selectedSportFromMenu, setIsMobileCoursesOpen,
    setIsMobileMenuOpen, setIsVideoMuted, setLanguage, setSelectedCategory,
    setSelectedFacilityForModal, setShowIntro, showIntro, socialContacts, sportCarouselIndex,
    sportsCarousel, sportsCarouselRef, sportsList, toggleCoursesDropdown, videoRef, visibleSports
  };
}
