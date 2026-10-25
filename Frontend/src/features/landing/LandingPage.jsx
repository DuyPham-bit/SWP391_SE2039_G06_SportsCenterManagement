import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { FacilitiesSection } from './FacilitiesSection.js';
import { usePublicCatalog } from '../../hooks/usePublicCatalog.js';
import { getLandingPresentation } from '../../services/landingPresentation.js';
import { useLandingContent } from '../../hooks/useLandingContent.js';
import { getExternalContactUrl, normalizeZaloPhone } from '../../services/landingContentService.js';
import { Logo } from '../../components/common/Logo.jsx';
import { getMembershipAction } from '../../services/membershipEntry.js';
import {
  translateLandingContent,
  translateSportName,
  translateFacilityName,
  translateFacilityBadge,
  translateFacilityCategory,
  translateLocation,
  translateCourseHighlight,
  translateCoachName,
  translateOpenHours,
  translatePriceRate,
  translateMetricLabel,
  translateMetricValue
} from '../../services/i18nHelper.js';

// Danh mục trang chủ và cơ sở tập luyện tương ứng cho từng môn.
export const SPORT_CATEGORY_CONFIG = {
  'Thể thao đối kháng': {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    iconColor: 'text-rose-400',
    gradientHover: 'group-hover:from-red-600 group-hover:to-rose-500',
    label: 'Đối Kháng',
    labelEn: 'Combat'
  },
  'Combat & Martial Arts': {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    iconColor: 'text-rose-400',
    gradientHover: 'group-hover:from-red-600 group-hover:to-rose-500',
    label: 'Đối Kháng',
    labelEn: 'Combat'
  },
  'Bóng & Vợt': {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconColor: 'text-amber-400',
    gradientHover: 'group-hover:from-amber-500 group-hover:to-rose-500',
    label: 'Bóng & Vợt',
    labelEn: 'Ball & Racket'
  },
  'Ball & Racket': {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconColor: 'text-amber-400',
    gradientHover: 'group-hover:from-amber-500 group-hover:to-rose-500',
    label: 'Bóng & Vợt',
    labelEn: 'Ball & Racket'
  },
  'Sức bền & Tĩnh tâm': {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    gradientHover: 'group-hover:from-emerald-500 group-hover:to-teal-500',
    label: 'Sức Bền',
    labelEn: 'Endurance'
  },
  'Endurance & Mindful': {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    gradientHover: 'group-hover:from-emerald-500 group-hover:to-teal-500',
    label: 'Sức Bền',
    labelEn: 'Endurance'
  },
  'Golf & Thể thao cao cấp': {
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    iconColor: 'text-teal-400',
    gradientHover: 'group-hover:from-teal-600 group-hover:to-emerald-500',
    label: 'Golf & Cao Cấp',
    labelEn: 'Golf & Precision'
  },
  'Golf & Precision': {
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    iconColor: 'text-teal-400',
    gradientHover: 'group-hover:from-teal-600 group-hover:to-emerald-500',
    label: 'Golf & Cao Cấp',
    labelEn: 'Golf & Precision'
  }
};



// Component đếm số nhảy động khi mới lướt trúng (chỉ nhảy 1 lần duy nhất khi F5 hay mới vào trang)
export function AnimatedNumber({ value, duration = 1400, suffix = '', prefix = '', formatThousands = false }) {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Nếu đã nhảy rồi thì giữ nguyên giá trị đích
    if (hasAnimatedRef.current) {
      setDisplayValue(value);
      return;
    }

    // Fallback cho môi trường không có IntersectionObserver
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setDisplayValue(value);
      hasAnimatedRef.current = true;
      return;
    }

    let animationFrameId = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Chỉ kích hoạt khi lướt trúng lần đầu tiên
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            observer.disconnect(); // Ngắt observer ngay để không bao giờ reset hay nhảy lại khi cuộn lên/xuống

            let startTime = null;

            const animate = (currentTime) => {
              if (!startTime) startTime = currentTime;
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);

              // Ease Out Cubic: 1 - (1 - progress)^3 giúp số nhảy mượt dần về đích
              const easeOut = 1 - Math.pow(1 - progress, 3);
              const currentVal = Math.round(easeOut * value);
              setDisplayValue(currentVal);

              if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
              } else {
                setDisplayValue(value);
              }
            };

            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = formatThousands
    ? displayValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    : displayValue;

  return (
    <span ref={elementRef} className="tabular-nums inline-block">
      {prefix}{formatted}{suffix}
    </span>
  );
}

export function LandingPage() {
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
  const [sportCarouselIndex, setSportCarouselIndex] = useState(0);
  const sportsCarouselRef = useRef(null);
  const isSportsProgrammaticScrollRef = useRef(false);
  const sportsScrollTimeoutRef = useRef(null);
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

  // Tiya cd-headline rotate-1 3D perspective flip effect
  const [headlineVisible, setHeadlineVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineVisible(false);
      setTimeout(() => {
        setHeadlineVisible(true);
      }, 350);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

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

  const handleSportsScroll = () => {
    if (isSportsProgrammaticScrollRef.current) return;
    const el = sportsCarouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const items = el.querySelectorAll('[data-carousel-item]');
    if (!items.length) return;

    // Nếu đã cuộn gần chạm mép phải (thẻ cuối cùng đang hiển thị đầy đủ)
    if (scrollLeft >= maxScroll - 25) {
      setSportCarouselIndex(items.length - 1);
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

    setSportCarouselIndex(closestIdx);
  };

  const handleScrollSportsToIndex = (idx) => {
    const el = sportsCarouselRef.current;
    if (!el) return;
    const items = el.querySelectorAll('[data-carousel-item]');
    if (!items[idx]) return;

    isSportsProgrammaticScrollRef.current = true;
    setSportCarouselIndex(idx);

    const targetItem = items[idx];
    const scrollTarget = targetItem.offsetLeft - el.offsetLeft;

    el.scrollTo({
      left: Math.max(0, scrollTarget),
      behavior: 'smooth'
    });

    if (sportsScrollTimeoutRef.current) clearTimeout(sportsScrollTimeoutRef.current);
    sportsScrollTimeoutRef.current = setTimeout(() => {
      isSportsProgrammaticScrollRef.current = false;
    }, 450);
  };

  useEffect(() => {
    if (sportsCarouselRef.current) {
      sportsCarouselRef.current.scrollLeft = 0;
      setSportCarouselIndex(0);
    }
  }, [selectedCategory, filteredSports.length]);

  const getDashboardLink = () => {
    const normalized = String(role || '').toUpperCase();
    switch (normalized) {
      case 'SYSTEMADMIN':
      case 'ADMIN':
      case 'MANAGER': return '#/manager/dashboard';
      case 'RECEPTIONIST': return '#/receptionist/dashboard';
      case 'COACH': return '#/coach/dashboard';
      case 'MEMBER': return '#/member/dashboard';
      default: return '#/login';
    }
  };

  return (
    <div className="landing-page-root tiya-page w-full min-h-screen">
      {/* LANDING HEADER (TIYA NAVBAR) */}
      <header
        id="site-header"
        className={`tiya-navbar ${isScrolled ? 'is-sticky scrolled' : ''}`}
      >
        <div className="tiya-navbar__container">
          {/* Brand Logo - SCMS Olympic Sports Arena */}
          <Logo variant="dark" size="md" onClick={(e) => handleNavClick(navItems[0], e)} />

          {/* Navigation Links */}
          <nav className="tiya-nav-menu">
            {/* TRANG CHỦ */}
            <a
              href="#/"
              onClick={(e) => handleNavClick(navItems[0], e)}
              className={`tiya-nav-link ${activeNav === 'trang-chu' ? 'active' : ''}`}
            >
              {isEn ? 'HOME' : 'TRANG CHỦ'}
            </a>

            {/* VỀ CHÚNG TÔI */}
            <a
              href="#ve-chung-toi"
              onClick={(e) => handleNavClick(navItems[1], e)}
              className={`tiya-nav-link ${activeNav === 've-chung-toi' ? 'active' : ''}`}
            >
              {isEn ? 'ABOUT US' : 'VỀ CHÚNG TÔI'}
            </a>

            {/* KHÓA HỌC with 2-Column Sports Dropdown */}
            <div
              ref={coursesDropdownRef}
              className="tiya-dropdown"
              onMouseEnter={handleCoursesMouseEnter}
              onMouseLeave={handleCoursesMouseLeave}
            >
              <button
                type="button"
                onClick={(e) => {
                  handleNavClick(navItems[2], e);
                  toggleCoursesDropdown(e);
                }}
                className={`tiya-nav-link ${isCoursesDropdownOpen || activeNav === 'khoa-hoc' ? 'active' : ''}`}
              >
                {isEn ? 'COURSES' : 'KHÓA HỌC'}
                <span className="material-symbols-outlined" style={{fontSize:'16px',transition:'transform 0.2s',transform:isCoursesDropdownOpen?'rotate(180deg)':'none'}}>
                  keyboard_arrow_down
                </span>
              </button>

              {isCoursesDropdownOpen && (
                <div className="tiya-dropdown-menu">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px',padding:'4px 8px'}}>
                    <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                      {leftSports.map(sportItem => (
                        <button
                          key={sportItem.id}
                          type="button"
                          onClick={() => handleSelectMenuItem(sportItem)}
                          className={`tiya-dropdown-item ${selectedSportFromMenu === sportItem.id ? 'active' : ''}`}
                        >
                          {sportItem.name}
                        </button>
                      ))}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
                      {rightSports.map(sportItem => (
                        <button
                          key={sportItem.id}
                          type="button"
                          onClick={() => handleSelectMenuItem(sportItem)}
                          className={`tiya-dropdown-item ${selectedSportFromMenu === sportItem.id ? 'active' : ''}`}
                        >
                          {sportItem.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CƠ SỞ VẬT CHẤT */}
            <a
              href="#co-so-vat-chat"
              onClick={(e) => handleNavClick(navItems[3], e)}
              className={`tiya-nav-link ${activeNav === 'co-so-vat-chat' ? 'active' : ''}`}
            >
              {isEn ? 'FACILITIES' : 'CƠ SỞ VẬT CHẤT'}
            </a>
          </nav>

          {/* Action / Auth Buttons */}
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {/* Minimalist Refined Language Toggle */}
            <div className="tiya-lang-toggle" role="group" aria-label="Language selector">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`tiya-lang-toggle__btn ${language === 'vi' ? 'active' : ''}`}
                aria-label="Tiếng Việt"
                title="Tiếng Việt"
              >
                <span className="lang-code">VI</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`tiya-lang-toggle__btn ${language === 'en' ? 'active' : ''}`}
                aria-label="English"
                title="English"
              >
                <span className="lang-code">EN</span>
              </button>
            </div>

            {isAuthenticated ? (
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <a
                  href={getDashboardLink()}
                  className="custom-btn"
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>space_dashboard</span>
                  <span>{isEn ? `Dashboard (${role})` : `Vào Dashboard (${role})`}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.hash = '#/login';
                  }}
                  className="custom-border-btn"
                  title={isEn ? 'Sign out' : 'Đăng xuất tài khoản'}
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>logout</span>
                  <span>{isEn ? 'Logout' : 'Đăng xuất'}</span>
                </button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <a href="#/login" className="custom-border-btn">{isEn ? 'SIGN IN' : 'ĐĂNG NHẬP'}</a>
                <a href="#/register" className="custom-btn">
                  {isEn ? 'REGISTER' : 'ĐĂNG KÝ'}
                  <span className="material-symbols-outlined" style={{fontSize:'16px'}}>arrow_forward</span>
                </a>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`tiya-nav__toggler ${isMobileMenuOpen ? 'active' : ''}`}
              aria-label="Toggle menu"
            >
              <span className="tiya-nav__toggler-bar" />
              <span className="tiya-nav__toggler-bar" style={{width: isMobileMenuOpen ? '70%' : '100%'}} />
              <span className="tiya-nav__toggler-bar" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="tiya-mobile-drawer">
            {/* Mobile Language Selector */}
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'12px'}}>
              <div className="tiya-lang-toggle" role="group" aria-label="Language selector">
                <button
                  type="button"
                  onClick={() => setLanguage('vi')}
                  className={`tiya-lang-toggle__btn ${language === 'vi' ? 'active' : ''}`}
                  aria-label="Tiếng Việt"
                >
                  <span className="lang-code">VI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`tiya-lang-toggle__btn ${language === 'en' ? 'active' : ''}`}
                  aria-label="English"
                >
                  <span className="lang-code">EN</span>
                </button>
              </div>
            </div>

            <a href="#/" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(navItems[0], e); }}
              className={`tiya-mobile-drawer__link ${activeNav === 'trang-chu' ? 'active' : ''}`}>
              {isEn ? 'HOME' : 'TRANG CHỦ'}
            </a>
            <a href="#ve-chung-toi" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(navItems[1], e); }}
              className={`tiya-mobile-drawer__link ${activeNav === 've-chung-toi' ? 'active' : ''}`}>
              {isEn ? 'ABOUT US' : 'VỀ CHÚNG TÔI'}
            </a>
            {/* Mobile Courses Accordion */}
            <button type="button" onClick={() => setIsMobileCoursesOpen(!isMobileCoursesOpen)}
              className={`tiya-mobile-drawer__link ${activeNav === 'khoa-hoc' || isMobileCoursesOpen ? 'active' : ''}`}
              style={{display:'flex',justifyContent:'space-between',width:'100%'}}>
              <span>{isEn ? 'COURSES' : 'KHÓA HỌC'}</span>
              <span className="material-symbols-outlined" style={{fontSize:'18px'}}>
                {isMobileCoursesOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
            {isMobileCoursesOpen && (
              <div style={{padding:'8px 16px 12px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 20px'}}>
                {[...leftSports,...rightSports].map(sportItem => (
                  <button key={sportItem.id} type="button" onClick={() => handleSelectMenuItem(sportItem)}
                    className={`tiya-dropdown-item ${selectedSportFromMenu === sportItem.id ? 'active' : ''}`}
                    style={{color: selectedSportFromMenu === sportItem.id ? 'var(--custom-btn-bg-color)' : 'rgba(255,255,255,0.75)'}}>
                    {sportItem.name}
                  </button>
                ))}
              </div>
            )}
            <a href="#co-so-vat-chat" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(navItems[3], e); }}
              className={`tiya-mobile-drawer__link ${activeNav === 'co-so-vat-chat' ? 'active' : ''}`}>
              {isEn ? 'FACILITIES' : 'CƠ SỞ VẬT CHẤT'}
            </a>
            <hr className="tiya-mobile-drawer__divider" />
            {isAuthenticated ? (
              <>
                <a href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}
                  className="custom-btn" style={{width:'100%',justifyContent:'center',borderRadius:'10px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>space_dashboard</span>
                  <span>{isEn ? `Dashboard (${role})` : `Vào Dashboard (${role})`}</span>
                </a>
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); logout(); window.location.hash = '#/login'; }}
                  className="custom-border-btn" style={{width:'100%',marginTop:'8px',borderRadius:'10px',justifyContent:'center'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>logout</span>
                  {isEn ? 'Sign out' : 'Đăng xuất tài khoản'}
                </button>
              </>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <a href="#/login" onClick={() => setIsMobileMenuOpen(false)}
                  className="custom-border-btn" style={{width:'100%',justifyContent:'center',borderRadius:'10px'}}>
                  {isEn ? 'SIGN IN' : 'ĐĂNG NHẬP'}
                </a>
                <a href="#/register" onClick={() => setIsMobileMenuOpen(false)}
                  className="custom-btn" style={{width:'100%',justifyContent:'center',borderRadius:'10px'}}>
                  {isEn ? 'REGISTER NEW MEMBER' : 'ĐĂNG KÝ HỘI VIÊN MỚI'}
                </a>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Tiya Wave Elements with Compact Balanced Height)
      ───────────────────────────────────────────────────────────── */}
      <section id="trang-chu" className="hero-section">
        {/* Top Wave: #3D405B (Tiya Wave styled with compact height) */}
        <svg className="hero-top-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#3D405B" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,213,823,240C891.4,267,960,245,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,0L1405.7,0C1371.4,0,1303,0,1234,0C1165.7,0,1097,0,1029,0C960,0,891,0,823,0C754.3,0,686,0,617,0C548.6,0,480,0,411,0C342.9,0,274,0,206,0C137.1,0,69,0,34,0L0,0Z" />
        </svg>

        {/* Video Background */}
        <video
          ref={videoRef}
          autoPlay loop muted playsInline
          className="hero-video-bg"
          poster={landingContent.heroBanner?.posterUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=1280&auto=format&fit=crop'}
        >
          <source src={landingContent.heroBanner?.videoUrl || './hero-video.mp4'} type="video/mp4" />
        </video>
        <div className="section-overlay" />

        {/* Hero Container */}
        <div className="hero-container">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',maxWidth:'900px',margin:'0 auto'}}>
            {/* Badge */}
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              {isEn ? 'OLYMPIC SPORTS CENTER' : (landingContent.heroBanner?.badge || 'TRUNG TÂM THỂ THAO')}
            </div>

            {/* Headline */}
            <h1 className="hero-title">
              {landingContent.heroBanner?.title || 'SHAPING RESILIENCE THROUGH SPORTS'}
            </h1>

            {/* Subtext */}
            <p className="hero-desc">
              {isEn
                ? `Develop fitness, build resilience, and push boundaries across our ${facilitiesList.length} sports facilities and ${visibleSports.length} disciplines.`
                : (landingContent.heroBanner?.description || `Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống ${facilitiesList.length} cụm sân, phòng tập phục vụ ${visibleSports.length} bộ môn thể thao.`)}
            </p>

            {/* CTA Buttons */}
            <div className="custom-btn-group" style={{justifyContent:'center'}}>
              <a href={landingContent.heroBanner?.primaryCtaLink || '#/register'}
                className="custom-btn" style={{padding:'14px 34px',fontSize:'14px'}}>
                {isEn ? 'REGISTER NEW MEMBER' : (landingContent.heroBanner?.primaryCtaText || 'ĐĂNG KÝ HỘI VIÊN MỚI')}
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>arrow_forward</span>
              </a>
              <a href={landingContent.heroBanner?.secondaryCtaLink || '#khoa-hoc'}
                className="link">
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>sports_score</span>
                {isEn ? `EXPLORE ${visibleSports.length} DISCIPLINES` : (landingContent.heroBanner?.secondaryCtaText || `KHÁM PHÁ ${visibleSports.length} MÔN HỌC`)}
              </a>
            </div>

            {/* Metrics Strip */}
            <div className="tiya-metrics-strip" style={{width:'100%'}}>
              {(landingContent.heroBanner?.metrics || []).map((metric, idx) => (
                <div key={metric.id || idx} className="tiya-metrics-item">
                  <span className="tiya-metrics-value">{metric.value}</span>
                  <span className="tiya-metrics-label">{metric.label}</span>
                </div>
              ))}
            </div>

            <div style={{display:'flex',justifyContent:'center',marginTop:'18px'}}>
              <a href="#ve-chung-toi" className="tiya-hero__scroll-cue">
                {isEn ? 'Scroll down to explore' : 'Cuộn xuống khám phá'}
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>keyboard_arrow_down</span>
              </a>
            </div>
          </div>
        </div>

        {/* Sound Toggle Button */}
        <button
          type="button"
          onClick={() => {
            if (videoRef.current) {
              const nextMuted = !videoRef.current.muted;
              videoRef.current.muted = nextMuted;
              setIsVideoMuted(nextMuted);
            }
          }}
          aria-label={isVideoMuted ? (isEn ? 'Unmute video audio' : 'Bật âm thanh video') : (isEn ? 'Mute video audio' : 'Tắt âm thanh video')}
          className="hero-sound-btn"
        >
          <span className="material-symbols-outlined" style={{fontSize:'18px'}}>
            {isVideoMuted ? 'volume_off' : 'volume_up'}
          </span>
          {isVideoMuted ? (isEn ? 'Unmute' : 'Bật âm thanh') : (isEn ? 'Mute' : 'Tắt âm thanh')}
        </button>

        {/* Bottom Wave: Pure White #ffffff (Tiya Wave styled with compact height) */}
        <svg className="hero-bottom-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#ffffff" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,213,823,240C891.4,267,960,245,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z" />
        </svg>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ABOUT SECTION (Tiya Pure White Background #ffffff)
      ───────────────────────────────────────────────────────────── */}
      <section className="about-section" id="ve-chung-toi">
        <div className="about-container">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:'60px',alignItems:'start'}}>
            {/* Left Column */}
            <div className="tiya-reveal" style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
              <div className="about-badge">
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>verified</span>
                {isEn ? 'WHY CHOOSE SCMS' : (landingContent.whyUs?.badge || 'TẠI SAO NÊN CHỌN SCMS')}
              </div>
              <h2 className="about-title">
                {isEn
                  ? 'Solid Foundation For Your Journey To Athletic Excellence'
                  : (landingContent.whyUs?.title || 'Nền Tảng Vững Chắc Cho Hành Trình Chinh Phục Đỉnh Cao')}
              </h2>
              <p className="about-desc">
                {isEn
                  ? (catalog?.center?.description || 'Modern athletic center equipped with international standard courts, certified coaching staff, and comprehensive sports training ecosystems.')
                  : (landingContent.whyUs?.description || 'Hệ thống cơ sở vật chất chuẩn quốc tế, huấn luyện viên tận tâm và phương pháp đào tạo hiện đại giúp bạn phát triển toàn diện.')}
              </p>

              <div style={{width:'100%',marginTop:'20px'}}>
                {(landingContent.whyUs?.features?.length ? landingContent.whyUs.features : [
                  { id: 'f1', icon: 'verified', title: isEn ? 'Olympic Standard Facilities' : 'Tiêu Chuẩn Thi Đấu Olympic', description: isEn ? 'High-grade synthetic courts, anti-glare illumination, and international competition specifications.' : 'Mặt sàn cao cấp, ánh sáng chống chói và trang thiết bị đạt chuẩn thi đấu quốc tế.' },
                  { id: 'f2', icon: 'military_tech', title: isEn ? 'Certified Coaching Staff' : 'Đội Ngũ HLV Chuyên Nghiệp', description: isEn ? 'Experienced coaches holding national and international athletic certificates.' : 'Giàu kinh nghiệm thi đấu thực chiến, sở hữu chứng chỉ huấn luyện chuyên môn.' },
                  { id: 'f3', icon: 'schedule', title: isEn ? 'Smart & Flexible Booking' : 'Thời Gian Linh Hoạt & Đặt Lịch Dễ Dàng', description: isEn ? 'Easily reserve courts, sign up for classes, and manage schedules through our portal.' : 'Chủ động sắp xếp thời gian biểu rèn luyện, đăng ký trực tuyến nhanh chóng qua hệ thống.' }
                ]).map((feat, idx) => {
                  let title = feat.title;
                  let desc = feat.description;
                  if (isEn) {
                    if (feat.title?.toLowerCase().includes('tiêu chuẩn') || feat.title?.toLowerCase().includes('olympic')) {
                      title = 'Olympic Standard Facilities';
                      desc = 'High-grade synthetic courts, anti-glare illumination, and international competition specifications.';
                    } else if (feat.title?.toLowerCase().includes('huấn luyện') || feat.title?.toLowerCase().includes('hlv')) {
                      title = 'Certified Coaching Staff';
                      desc = 'Experienced coaches holding national and international athletic certificates.';
                    } else if (feat.title?.toLowerCase().includes('linh hoạt') || feat.title?.toLowerCase().includes('đặt lịch')) {
                      title = 'Smart & Flexible Booking';
                      desc = 'Easily reserve courts, sign up for classes, and manage schedules through our portal.';
                    }
                  }
                  return (
                    <div key={feat.id || idx} className="about-feature-item">
                      <div className="about-feature-icon">
                        <span className="material-symbols-outlined" style={{fontSize:'22px'}}>{feat.icon}</span>
                      </div>
                      <div>
                        <div className="about-feature-title">{title}</div>
                        <p className="about-feature-desc">{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: 4 Stat Cards */}
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
                {(landingContent.whyUs?.stats?.length ? landingContent.whyUs.stats : [
                  { id: 'rooms', number: catalog?.rooms?.length || facilitiesList.length || 10, suffix: '', title: isEn ? 'ROOMS & COURTS' : 'CỤM SÂN & PHÒNG TẬP', subtitle: isEn ? 'Olympic standard' : 'Tiêu chuẩn thi đấu chuyên nghiệp', icon: 'stadium' },
                  { id: 'sports', number: visibleSports.length || 10, suffix: '', title: isEn ? 'SPORTS DISCIPLINES' : 'MÔN THỂ THAO', subtitle: isEn ? 'Diverse options for all ages' : 'Đa dạng lựa chọn cho mọi lứa tuổi', icon: 'sports' },
                  { id: 'members', number: 400, suffix: '+', title: isEn ? 'ACTIVE ATHLETES' : 'HỌC VIÊN', subtitle: isEn ? 'Daily regular training' : 'Thường xuyên rèn luyện mỗi ngày', icon: 'groups' },
                  { id: 'area', number: 13000, suffix: ' m²', formatThousands: true, title: isEn ? 'TOTAL AREA' : 'DIỆN TÍCH', subtitle: isEn ? 'Modern integrated sports complex' : 'Tổ hợp liên hợp khép kín hiện đại', icon: 'domain' }
                ]).map((st, idx) => {
                  let title = st.title;
                  let subtitle = st.subtitle;
                  if (isEn) {
                    if (st.id === 'rooms' || st.id === 's1' || st.title?.includes('PHÒNG') || st.title?.includes('CỤM SÂN')) {
                      title = 'ROOMS & COURTS';
                      subtitle = 'Olympic competition standards';
                    } else if (st.id === 'sports' || st.id === 's2' || st.title?.includes('BỘ MÔN') || st.title?.includes('MÔN THỂ THAO')) {
                      title = 'SPORTS DISCIPLINES';
                      subtitle = 'Diverse options for all ages';
                    } else if (st.id === 'coaches' || st.title?.includes('HLV')) {
                      title = 'CERTIFIED COACHES';
                      subtitle = 'International certificates';
                    } else if (st.id === 'members' || st.id === 's3' || st.title?.includes('HỘI VIÊN') || st.title?.includes('HỌC VIÊN')) {
                      title = 'ACTIVE ATHLETES';
                      subtitle = 'Daily regular training';
                    } else if (st.id === 'area' || st.id === 's4' || st.title?.includes('DIỆN TÍCH')) {
                      title = 'TOTAL AREA';
                      subtitle = 'Modern integrated sports complex';
                    }
                  }
                  return (
                    <div key={st.id || idx} className={`about-stat-card tiya-reveal tiya-delay-${idx + 1}`}>
                      <div className="about-stat-card__bg-icon">
                        <span className="material-symbols-outlined" style={{fontSize:'90px'}}>{st.icon}</span>
                      </div>
                      <div className="about-stat-card__icon">
                        <span className="material-symbols-outlined" style={{fontSize:'22px'}}>{st.icon}</span>
                      </div>
                      <div className="about-stat-card__number">
                        <AnimatedNumber value={st.number} duration={1200} suffix={st.suffix} formatThousands={Boolean(st.formatThousands)} />
                      </div>
                      <div className="about-stat-card__title">{title}</div>
                      <div className="about-stat-card__sub">{subtitle}</div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Strip */}
              <div className="tiya-trust-strip tiya-reveal tiya-delay-4" style={{marginTop:'20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'28px',color:'var(--primary-color)'}}>verified_user</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:'13px',color:'var(--dark-color)'}}>
                      {isEn ? 'Verified Olympic Training Quality' : (landingContent.whyUs?.trustBanner?.title || 'Chất Lượng Chuẩn Olympic Đã Được Kiểm Định')}
                    </div>
                    <div style={{fontSize:'12px',color:'var(--p-color)'}}>
                      {isEn ? 'Certified sports management and athletic curriculum meeting national and international benchmarks.' : (landingContent.whyUs?.trustBanner?.description || 'Hệ thống vận hành đạt chuẩn và chứng chỉ đào tạo thể thao quốc tế.')}
                    </div>
                  </div>
                </div>
                <span className="tiya-trust-strip__badge">
                  {landingContent.whyUs?.trustBanner?.certificate || 'ISO 9001:2026'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. BACKGROUND IMAGE SECTION WITH FROSTED GLASS BLOCK (Tiya Signature)
          Matches 100% the user's reference screenshot!
      ───────────────────────────────────────────────────────────── */}
      <section className="section-bg-image">
        {/* Top Wave: White #ffffff */}
        <svg className="section-bg-image-top-wave" viewBox="0 0 1265 144" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path fill="rgba(255, 255, 255, 1)" d="M 0 40 C 164 40 164 20 328 20 L 328 20 L 328 0 L 0 0 Z" strokeWidth="0" />
          <path fill="rgba(255, 255, 255, 1)" d="M 327 20 C 445.5 20 445.5 89 564 89 L 564 89 L 564 0 L 327 0 Z" strokeWidth="0" />
          <path fill="rgba(255, 255, 255, 1)" d="M 563 89 C 724.5 89 724.5 48 886 48 L 886 48 L 886 0 L 563 0 Z" strokeWidth="0" />
          <path fill="rgba(255, 255, 255, 1)" d="M 885 48 C 1006.5 48 1006.5 67 1128 67 L 1128 67 L 1128 0 L 885 0 Z" strokeWidth="0" />
          <path fill="rgba(255, 255, 255, 1)" d="M 1127 67 C 1196 67 1196 0 1265 0 L 1265 0 L 1265 0 L 1127 0 Z" strokeWidth="0" />
        </svg>

        <div className="section-bg-image-container">
          <div className="tiya-reveal--scale">
            <div className="section-bg-image-block">
              {/* Status Badge */}
              <div className="section-bg-badge">
                <span className="section-bg-badge-dot" aria-hidden="true" />
                {isEn ? 'Facilities & Courts on Campus' : 'Phòng và sân tập tại trung tâm'}
              </div>

              <h2>{isEn ? 'Find Your Sport & Training Package' : 'Chọn Bộ Môn & Gói Tập Phù Hợp'}</h2>

              <p>
                {isEn
                  ? 'Explore the facilities, choose a membership package, then book available classes covered by your package.'
                  : 'Khám phá cơ sở tập luyện, đăng ký gói tập rồi chọn ca học còn chỗ theo quyền lợi của gói.'}
              </p>

              {/* 3 Key Highlights with High-Contrast Chips */}
              <div className="section-bg-features">
                <span className="section-bg-feature-chip">
                  <span className="material-symbols-outlined chip-icon chip-icon--amber" aria-hidden="true">bolt</span>
                  <span>{isEn ? 'Class Schedules' : 'Xem lịch lớp'}</span>
                </span>
                <span className="section-bg-feature-chip">
                  <span className="material-symbols-outlined chip-icon chip-icon--emerald" aria-hidden="true">groups</span>
                  <span>{isEn ? 'Official Info' : 'Thông tin từ trung tâm'}</span>
                </span>
                <span className="section-bg-feature-chip">
                  <span className="material-symbols-outlined chip-icon chip-icon--sky" aria-hidden="true">light_mode</span>
                  <span>{isEn ? 'Nighttime LED' : 'Đèn LED Ban Đêm'}</span>
                </span>
              </div>

              {/* Signature Action Bar - 100% Visible Text, Zero Truncation */}
              <div className="section-bg-cta-bar">
                <div className="section-bg-cta-info">
                  <div className="section-bg-cta-icon-wrap" aria-hidden="true">
                    <span className="material-symbols-outlined">stadium</span>
                  </div>
                  <div className="section-bg-cta-text-group">
                    <span className="section-bg-cta-title">
                      {isEn ? `System of ${facilitiesList.length} courts & halls` : `Hệ thống ${facilitiesList.length} cụm sân & phòng tập`}
                    </span>
                    <span className="section-bg-cta-sub">
                      <span className="section-bg-cta-sub-dot" aria-hidden="true" />
                      {hours === 'Chưa cập nhật' && isEn ? '06:00 - 22:00 Daily' : hours}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="section-bg-cta-btn"
                  onClick={() => {
                    const el = document.getElementById('co-so-vat-chat');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  aria-label={isEn ? "View courts and rooms at center" : "Xem phòng và sân tập của trung tâm"}
                >
                  <span>{isEn ? `View ${facilitiesList.length} Courts / Rooms` : `Xem ${facilitiesList.length} Phòng / Sân`}</span>
                  <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave: Warm Cream #F4F1DE flowing directly into Courses Section */}
        <svg className="section-bg-image-bottom-wave" viewBox="0 0 1265 144" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path fill="#F4F1DE" d="M 0 40 C 164 40 164 20 328 20 L 328 20 L 328 0 L 0 0 Z" strokeWidth="0" />
          <path fill="#F4F1DE" d="M 327 20 C 445.5 20 445.5 89 564 89 L 564 89 L 564 0 L 327 0 Z" strokeWidth="0" />
          <path fill="#F4F1DE" d="M 563 89 C 724.5 89 724.5 48 886 48 L 886 48 L 886 0 L 563 0 Z" strokeWidth="0" />
          <path fill="#F4F1DE" d="M 885 48 C 1006.5 48 1006.5 67 1128 67 L 1128 67 L 1128 0 L 885 0 Z" strokeWidth="0" />
          <path fill="#F4F1DE" d="M 1127 67 C 1196 67 1196 0 1265 0 L 1265 0 L 1265 0 L 1127 0 Z" strokeWidth="0" />
        </svg>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. COURSES CATALOG SECTION (Tiya Warm Cream #F4F1DE Background)
      ───────────────────────────────────────────────────────────── */}
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
            <p className="text-sm text-slate-600 mt-3">
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
          <div style={{position:'relative',width:'100%'}}>
            <div
              ref={sportsCarouselRef}
              onScroll={handleSportsScroll}
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
                        {sport.image || facility.image || facility.secondaryImage ? <img src={sport.image || facility.image || facility.secondaryImage} alt={sport.name} loading="lazy" /> : <div className="h-full grid place-items-center bg-slate-100 text-slate-500 text-sm">{isEn ? 'No image' : 'Chưa có ảnh'}</div>}
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

            {/* Carousel Dots */}
            {filteredSports.length > 1 && (
              <div className="tiya-carousel-dots">
                {filteredSports.map((sport, idx) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => handleScrollSportsToIndex(idx)}
                    aria-label={isEn ? `Go to ${sport.name}` : `Chuyển đến môn ${sport.name}`}
                    className={`tiya-carousel-dot ${sportCarouselIndex === idx ? 'active' : ''}`}
                    style={{width: sportCarouselIndex === idx ? '36px' : '8px', background: sportCarouselIndex === idx ? 'var(--primary-color)' : 'rgba(0,0,0,0.15)'}}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Wave: Pure White #ffffff flowing into Facilities Section */}
        <svg className="courses-bottom-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#ffffff" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,213,823,240C891.4,267,960,245,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z" />
        </svg>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. FACILITIES SECTION (Pure White Background #ffffff)
      ───────────────────────────────────────────────────────────── */}
      <div className="facilities-section-wrapper">
        <FacilitiesSection
          externalFacility={selectedFacilityForModal}
          onModalClose={() => setSelectedFacilityForModal(null)}
        />

        {/* Bottom Wave: Deep Slate #0F172A flowing seamlessly into Footer */}
        <svg className="facilities-bottom-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#0F172A" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,235,823,280C891.4,318,960,285,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z" />
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. SITE FOOTER (SCMS Modern Olympic Dark Theme)
      ───────────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-container tiya-reveal">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'40px',marginBottom:'36px'}}>
            {/* Col 1: Brand */}
            <div>
              <div className="mb-4">
                <Logo variant="dark" size="md" onClick={e => handleNavClick(navItems[0], e)} />
              </div>
              <p style={{fontSize:'13.5px',lineHeight:1.7,color:'#CBD5E1',maxWidth:'320px'}}>
                {isEn
                  ? 'Premier sports learning and training ground for all ages. Join SCMS to pursue your passion, enhance physical health, and connect with fellow athletes.'
                  : 'Không gian học tập và rèn luyện thể thao dành cho mọi lứa tuổi. Cùng SCMS chọn bộ môn yêu thích, nâng cao thể lực và kết nối cộng đồng.'}
              </p>
              <div style={{display:'inline-flex',alignItems:'center',gap:'8px',marginTop:'16px',padding:'7px 16px',background:'rgba(129,178,154,0.12)',border:'1px solid rgba(129,178,154,0.3)',borderRadius:'100px',fontSize:'12px',fontWeight:600,color:'#A7F3D0'}}>
                <span className="material-symbols-outlined" style={{fontSize:'16px',color:'#81B29A'}}>sports_score</span>
                {visibleSports.length} {isEn ? 'disciplines' : 'bộ môn'} · {(landingContent.facilitiesSection?.facilitiesList || facilitiesList).filter(f => f.isVisible !== false).length} {isEn ? 'facilities' : 'khu tập luyện'}
              </div>
            </div>

            {/* Col 2: Contact */}
            <div>
              <h4 className="site-footer-title">{isEn ? 'Contact Info' : 'Thông Tin Liên Hệ'}</h4>
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                <div className="footer-link">
                  <span className="footer-icon-pill material-symbols-outlined">location_on</span>
                  <span>{isEn ? translateLocation(landingContent.ctaAndFooter?.contactAddress, true) : (landingContent.ctaAndFooter?.contactAddress || 'Chưa cập nhật')}</span>
                </div>
                <a href={`tel:${(landingContent.ctaAndFooter?.contactPhone || 'Chưa cập nhật').replace(/\s+/g, '')}`} className="footer-link">
                  <span className="footer-icon-pill material-symbols-outlined">call</span>
                  <span>{landingContent.ctaAndFooter?.contactPhone || (isEn ? '(028) 7300 5588' : 'Chưa cập nhật')}</span>
                </a>
                <a href={`mailto:${landingContent.ctaAndFooter?.contactEmail || 'Chưa cập nhật'}`} className="footer-link" style={{wordBreak:'break-all'}}>
                  <span className="footer-icon-pill material-symbols-outlined">mail</span>
                  <span>{landingContent.ctaAndFooter?.contactEmail || (isEn ? 'contact@scms.vn' : 'Chưa cập nhật')}</span>
                </a>
                <div className="social-icon" style={{marginTop:'8px'}}>
                  {socialContacts.map(contact => (
                    <a key={contact.label} href={contact.url} target="_blank" rel="noopener noreferrer" className="social-icon-link" title={contact.label}>
                      <span className="material-symbols-outlined" style={{fontSize:'18px'}}>{contact.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 3: Hours */}
            <div>
              <h4 className="site-footer-title">{isEn ? 'Opening Hours' : 'Thời Gian Hoạt Động'}</h4>
              <div className="footer-hours-card">
                <div className="footer-hours-row">
                  <span className="footer-hours-label">{isEn ? 'Monday - Friday:' : 'Thứ Hai - Thứ Sáu:'}</span>
                  <span className="footer-hours-value">{landingContent.ctaAndFooter?.hoursWeekdays || (isEn ? '05:30 - 22:30' : 'Chưa cập nhật')}</span>
                </div>
                <div className="footer-hours-row">
                  <span className="footer-hours-label">{isEn ? 'Saturday - Sunday:' : 'Thứ Bảy - Chủ Nhật:'}</span>
                  <span className="footer-hours-value">{landingContent.ctaAndFooter?.hoursWeekend || (isEn ? '06:00 - 22:00' : 'Chưa cập nhật')}</span>
                </div>
                <div className="footer-hours-row">
                  <span className="footer-hours-label">{isEn ? 'Holidays:' : 'Ngày Lễ:'}</span>
                  <span className="footer-hours-value footer-hours-gold">{isEn ? translateOpenHours(landingContent.ctaAndFooter?.hoursHolidays, true) : (landingContent.ctaAndFooter?.hoursHolidays || (isEn ? 'Flexible Opening' : 'Chưa cập nhật'))}</span>
                </div>
              </div>
              <p style={{fontSize:'12px',color:'#94A3B8',marginTop:'12px',lineHeight:1.6}}>
                {isEn ? 'Specific opening hours are listed in each facility & court detail.' : 'Giờ hoạt động cụ thể được ghi trong thông tin từng sân và phòng tập.'}
              </p>
            </div>

            {/* Col 4: Sports List */}
            <div>
              <h4 className="site-footer-title">{isEn ? 'Disciplines & Facilities' : 'Bộ Môn & Cơ Sở'}</h4>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 14px'}}>
                {visibleSports.map(sport => {
                  const sName = isEn ? translateSportName(sport.name, true) : sport.name;
                  return (
                    <button key={sport.id} type="button" onClick={() => handleSportClick(sport)}
                      title={isEn ? `View facility for ${sName}` : `Xem cơ sở tập luyện ${sName}`}
                      className="footer-sport-btn"
                    >
                      <span className="footer-sport-dot" />
                      <span className="truncate">{sName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Navigation */}
          <div className="footer-bottom-bar">
            <p className="footer-copyright">
              {isEn ? '© 2026 SCMS Sports Center. All rights reserved.' : (landingContent.ctaAndFooter?.copyright || '© 2026 SCMS Sports Center. Bảo lưu mọi quyền.')}
            </p>
            <nav aria-label={isEn ? "Footer navigation" : "Liên kết cuối trang"} className="footer-bottom-nav">
              {navItems.filter(item => item.id !== 'trang-chu').map(item => (
                <a key={item.id} href={item.href} onClick={e => handleNavClick(item, e)} className="footer-nav-link">
                  {item.label}
                </a>
              ))}
              <a href="#/register" className="custom-border-btn footer-register-btn">
                <span>{isEn ? 'Register Member' : 'Đăng ký hội viên'}</span>
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>arrow_forward</span>
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
