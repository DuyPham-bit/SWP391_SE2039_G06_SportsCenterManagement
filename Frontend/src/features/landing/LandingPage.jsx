import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { SUPPORTED_SPORTS } from '../../services/sportsCatalog.js';
import { FacilitiesSection } from './FacilitiesSection.js';
import { SCMS_FACILITIES } from '../../services/facilitiesCatalog.js';
import { useLandingContent } from '../../hooks/useLandingContent.js';
import { getExternalContactUrl, normalizeZaloPhone } from '../../services/landingContentService.js';

// Danh mục trang chủ và cơ sở tập luyện tương ứng cho từng môn.
export const LANDING_SPORTS = SUPPORTED_SPORTS.map(sport => ({
  ...sport,
  venue: SCMS_FACILITIES.find(facility => facility.id === sport.facilityId).name
}));

export const SPORT_FACILITY_MAP = Object.fromEntries(
  LANDING_SPORTS.map(sport => [sport.id, sport.facilityId])
);

export const SPORT_CATEGORY_CONFIG = {
  'Thể thao đối kháng': {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    iconColor: 'text-rose-400',
    gradientHover: 'group-hover:from-red-600 group-hover:to-rose-500',
    label: 'Đối Kháng'
  },
  'Bóng & Vợt': {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconColor: 'text-amber-400',
    gradientHover: 'group-hover:from-amber-500 group-hover:to-rose-500',
    label: 'Bóng & Vợt'
  },
  'Sức bền & Tĩnh tâm': {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    gradientHover: 'group-hover:from-emerald-500 group-hover:to-teal-500',
    label: 'Sức Bền'
  }
};

export const SPORT_CATALOG_DETAILS = {
  'boi-loi': {
    rating: '4.9',
    ratingCount: '128',
    level: 'Mọi lứa tuổi • Nhập môn đến Thi đấu',
    coach: 'Kiện tướng Bơi lội Quốc Gia',
    schedule: '06:00 - 21:00 hàng ngày',
    highlight: 'Bể bơi 25m tiêu chuẩn tập luyện, 5 làn bơi nước ấm 4 mùa, lọc ozone an toàn tuyệt đối.',
    price: 'Từ 50.000đ/buổi',
    capacity: '25 - 35 người/ca',
    badges: ['Nước Ấm 4 Mùa', '5 Làn Chuẩn']
  },
  'gym-fitness': {
    rating: '5.0',
    ratingCount: '240',
    level: 'Tăng cơ • Giảm mỡ • Thể lực toàn diện',
    coach: 'Master Trainer & Chuyên gia Thể Hình',
    schedule: '05:30 - 21:30 hàng ngày',
    highlight: 'Không gian 250m² trang bị giàn máy kháng lực Matrix, dàn tạ tự do đa dạng và máy đo InBody 770.',
    price: 'Từ 30.000đ/ngày',
    capacity: '30 - 45 hội viên/ca',
    badges: ['Máy Tập Đầy Đủ', 'InBody Miễn Phí']
  },
  'yoga-pilates': {
    rating: '4.9',
    ratingCount: '165',
    level: 'Tĩnh tâm • Dẻo dai • Cân bằng cột sống',
    coach: 'Giảng viên Yoga Alliance Quốc Tế',
    schedule: '06:00 - 21:00 hàng ngày',
    highlight: 'Không gian yên tĩnh sàn gỗ tự nhiên, trang bị máy Pilates Reformer và thảm tập cao cấp lớp nhóm nhỏ.',
    price: 'Từ 50.000đ/buổi',
    capacity: '15 - 20 học viên/lớp',
    badges: ['Reformer Nhập Khẩu', 'Thư Giãn Chuyên Sâu']
  },
  'vo-thuat': {
    rating: '4.9',
    ratingCount: '98',
    level: 'Boxing • Muay Thai • Vovinam • Tự vệ',
    coach: 'Võ sư Đai Đen & HLV Đội tuyển',
    schedule: '06:00 - 21:30 hàng ngày',
    highlight: 'Sàn tập trải thảm xốp EVA dày 3cm chống trơn, dàn bao cát thi đấu kiên cố và trang bị bảo hộ đầy đủ.',
    price: 'Từ 300.000đ/tháng',
    capacity: '15 - 25 võ sinh/ca',
    badges: ['Sàn Thảm An Toàn', 'Đấu Tập Chuẩn']
  },
  'bong-da': {
    rating: '4.8',
    ratingCount: '310',
    level: 'Sân 5 & Sân 7 • Phong trào & Năng khiếu',
    coach: 'Cựu Cầu Thủ Chuyên Nghiệp',
    schedule: '06:00 - 22:30 hàng ngày',
    highlight: 'Mặt cỏ nhân tạo dày êm chân rải hạt cao su giảm chấn, thoát nước nhanh và dàn đèn LED cao áp đêm.',
    price: 'Từ 180.000đ/giờ',
    capacity: '10 - 20 cầu thủ/sân',
    badges: ['Cỏ Tiêu Chuẩn', 'Đèn LED Ban Đêm']
  },
  'cau-long': {
    rating: '4.9',
    ratingCount: '280',
    level: 'Kỹ thuật • Tốc độ • Đánh đơn & Đánh đôi',
    coach: 'HLV Liên đoàn Cầu Lông Cấp 1',
    schedule: '06:00 - 22:00 hàng ngày',
    highlight: '4 sân cầu lông trong nhà với thảm PVC vân kim cương chống trơn, trần 8m không gió tạt, đèn chống lóa.',
    price: 'Từ 60.000đ/giờ',
    capacity: '16 - 24 người chơi',
    badges: ['Thảm Chuyên Dụng', 'Trần Cao 8m']
  },
  'bong-ro': {
    rating: '4.8',
    ratingCount: '190',
    level: 'Dẫn bóng • Sức bật • Chiến thuật nhóm',
    coach: 'VĐV Bóng Rổ Giải Quốc Gia',
    schedule: '06:00 - 22:00 hàng ngày',
    highlight: 'Mặt sân sơn thể thao Acrylic chống trượt, trụ rổ kiên cố bảng kính cường lực độ nảy tốt, mái che mát.',
    price: 'Từ 80.000đ/nửa sân',
    capacity: '15 - 20 người chơi',
    badges: ['Bảng Kính Cường Lực', 'Mái Che Mát']
  },
  'bong-ban': {
    rating: '4.8',
    ratingCount: '115',
    level: 'Phản xạ • Kỹ thuật giật bóng & cắt bóng',
    coach: 'Kiện tướng Bóng Bàn Quốc Gia',
    schedule: '06:00 - 22:00 hàng ngày',
    highlight: '4 bàn thi đấu đạt chuẩn quốc tế, ánh sáng đều hạn chế chói mắt, khoảng trống di chuyển an toàn.',
    price: 'Từ 40.000đ/giờ',
    capacity: '8 - 16 người chơi',
    badges: ['Bàn Chuẩn Thi Đấu', 'Phòng Máy Lạnh']
  },
  'pickleball': {
    rating: '5.0',
    ratingCount: '210',
    level: 'Nhập môn • Dinking • Giao lưu phong trào',
    coach: 'HLV Chứng chỉ Pickleball Pro',
    schedule: '05:30 - 22:00 hàng ngày',
    highlight: 'Cụm 4 sân ngoài trời mới nhất, mặt sơn Acrylic chống trơn, vạch bếp chuẩn và rào chắn bóng kiên cố.',
    price: 'Từ 50.000đ/giờ',
    capacity: '8 - 16 người chơi',
    badges: ['Sơn Đạt Chuẩn', 'Bộ Môn Hot 2026']
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
  const landingContent = useLandingContent();
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
  }, []);

  // Danh sách các môn học (Chủ động ẩn/hiện bởi manager qua isVisible)
  const sportsList = landingContent.coursesSection?.sportsList || LANDING_SPORTS;
  const visibleSports = useMemo(() => {
    return sportsList.filter(s => s.isVisible !== false);
  }, [sportsList]);

  const leftSports = useMemo(() => {
    const items = [{ id: 'all', name: 'Tất cả' }];
    visibleSports.slice(0, Math.ceil(visibleSports.length / 2)).forEach(s => items.push({ id: s.id, name: s.name }));
    return items;
  }, [visibleSports]);

  const rightSports = useMemo(() => {
    return visibleSports.slice(Math.ceil(visibleSports.length / 2)).map(s => ({ id: s.id, name: s.name }));
  }, [visibleSports]);

  const navItems = [
    { id: 'trang-chu', href: '#/', label: 'TRANG CHỦ', targetId: 'trang-chu' },
    { id: 've-chung-toi', href: '#ve-chung-toi', label: 'VỀ CHÚNG TÔI', targetId: 've-chung-toi' },
    { id: 'khoa-hoc', href: '#khoa-hoc', label: 'KHÓA HỌC', targetId: 'khoa-hoc', hasDropdown: true },
    { id: 'co-so-vat-chat', href: '#co-so-vat-chat', label: 'CƠ SỞ VẬT CHẤT', targetId: 'co-so-vat-chat' },
  ];

  const handleSportClick = (sport) => {
    const facility = SCMS_FACILITIES.find(f => f.id === SPORT_FACILITY_MAP[sport.id]);
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

    const sport = LANDING_SPORTS.find(s => s.id === item.id);
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

      const facility = SCMS_FACILITIES.find(f => f.id === SPORT_FACILITY_MAP[sport.id]);
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

  const categoryConfig = useMemo(() => {
    const counts = { 'Thể thao đối kháng': 0, 'Bóng & Vợt': 0, 'Sức bền & Tĩnh tâm': 0 };
    visibleSports.forEach(s => {
      if (counts[s.category] !== undefined) counts[s.category]++;
    });
    return [
      { id: 'Tất cả', label: 'Tất cả', icon: 'grid_view', count: visibleSports.length },
      { id: 'Thể thao đối kháng', label: 'Đối kháng', icon: 'sports_mma', count: counts['Thể thao đối kháng'] || 0 },
      { id: 'Bóng & Vợt', label: 'Bóng & Vợt', icon: 'sports_tennis', count: counts['Bóng & Vợt'] || 0 },
      { id: 'Sức bền & Tĩnh tâm', label: 'Sức bền', icon: 'self_improvement', count: counts['Sức bền & Tĩnh tâm'] || 0 },
    ];
  }, [visibleSports]);

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
      sportsCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
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
          {/* Brand Logo - SCMS PRO */}
          <a
            href="#/"
            onClick={(e) => handleNavClick(navItems[0], e)}
            aria-label="SCMS Olympic Sports Arena - Về trang chủ"
            className="tiya-brand"
          >
            <div className="tiya-brand-icon">S</div>
            <div className="tiya-brand-text">
              SCMS
              <small>Olympic Sports Arena</small>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="tiya-nav-menu">
            {/* TRANG CHỦ */}
            <a
              href="#/"
              onClick={(e) => handleNavClick(navItems[0], e)}
              className={`tiya-nav-link ${activeNav === 'trang-chu' ? 'active' : ''}`}
            >
              TRANG CHỦ
            </a>

            {/* VỀ CHÚNG TÔI */}
            <a
              href="#ve-chung-toi"
              onClick={(e) => handleNavClick(navItems[1], e)}
              className={`tiya-nav-link ${activeNav === 've-chung-toi' ? 'active' : ''}`}
            >
              VỀ CHÚNG TÔI
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
                KHÓA HỌC
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
              CƠ SỞ VẬT CHẤT
            </a>
          </nav>

          {/* Action / Auth Buttons */}
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {isAuthenticated ? (
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <a
                  href={getDashboardLink()}
                  className="custom-btn"
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>space_dashboard</span>
                  <span>Vào Dashboard ({role})</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.hash = '#/login';
                  }}
                  className="custom-border-btn"
                  title="Đăng xuất tài khoản"
                >
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>logout</span>
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <a href="#/login" className="custom-border-btn">ĐĂNG NHẬP</a>
                <a href="#/register" className="custom-btn">
                  ĐĂNG KÝ
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
            <a href="#/" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(navItems[0], e); }}
              className={`tiya-mobile-drawer__link ${activeNav === 'trang-chu' ? 'active' : ''}`}>
              TRANG CHỦ
            </a>
            <a href="#ve-chung-toi" onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(navItems[1], e); }}
              className={`tiya-mobile-drawer__link ${activeNav === 've-chung-toi' ? 'active' : ''}`}>
              VỀ CHÚNG TÔI
            </a>
            {/* Mobile Courses Accordion */}
            <button type="button" onClick={() => setIsMobileCoursesOpen(!isMobileCoursesOpen)}
              className={`tiya-mobile-drawer__link ${activeNav === 'khoa-hoc' || isMobileCoursesOpen ? 'active' : ''}`}
              style={{display:'flex',justifyContent:'space-between',width:'100%'}}>
              <span>KHÓA HỌC</span>
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
              CƠ SỞ VẬT CHẤT
            </a>
            <hr className="tiya-mobile-drawer__divider" />
            {isAuthenticated ? (
              <>
                <a href={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}
                  className="custom-btn" style={{width:'100%',justifyContent:'center',borderRadius:'10px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>space_dashboard</span>
                  <span>Vào Dashboard ({role})</span>
                </a>
                <button type="button" onClick={() => { setIsMobileMenuOpen(false); logout(); window.location.hash = '#/login'; }}
                  className="custom-border-btn" style={{width:'100%',marginTop:'8px',borderRadius:'10px',justifyContent:'center'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>logout</span>
                  Đăng xuất tài khoản
                </button>
              </>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                <a href="#/login" onClick={() => setIsMobileMenuOpen(false)}
                  className="custom-border-btn" style={{width:'100%',justifyContent:'center',borderRadius:'10px'}}>ĐĂNG NHẬP</a>
                <a href="#/register" onClick={() => setIsMobileMenuOpen(false)}
                  className="custom-btn" style={{width:'100%',justifyContent:'center',borderRadius:'10px'}}>ĐĂNG KÝ HỘI VIÊN MỚI</a>
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
              {landingContent.heroBanner?.badge || 'TRUNG TÂM THỂ THAO ĐẲNG CẤP QUỐC TẾ SCMS'}
            </div>

            {/* Headline */}
            <h1 className="hero-title">
              {landingContent.heroBanner?.title || 'SHAPING RESILIENCE THROUGH SPORTS'}
            </h1>

            {/* Subtext */}
            <p className="hero-desc">
              {landingContent.heroBanner?.description || `Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống ${SCMS_FACILITIES.length} cụm sân, phòng tập phục vụ ${visibleSports.length} bộ môn thể thao.`}
            </p>

            {/* CTA Buttons */}
            <div className="custom-btn-group" style={{justifyContent:'center'}}>
              <a href={landingContent.heroBanner?.primaryCtaLink || '#/register'}
                className="custom-btn" style={{padding:'14px 34px',fontSize:'14px'}}>
                {landingContent.heroBanner?.primaryCtaText || 'ĐĂNG KÝ HỘI VIÊN MỚI'}
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>arrow_forward</span>
              </a>
              <a href={landingContent.heroBanner?.secondaryCtaLink || '#khoa-hoc'}
                className="link">
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>sports_score</span>
                {landingContent.heroBanner?.secondaryCtaText || `KHÁM PHÁ ${visibleSports.length} MÔN HỌC`}
              </a>
            </div>

            {/* Metrics Strip */}
            <div className="tiya-metrics-strip" style={{width:'100%'}}>
              {(landingContent.heroBanner?.metrics || [
                { value: '100%', label: 'Chuẩn Thi Đấu' },
                { value: '24/7', label: 'Lọc Khí & Điều Hòa' },
                { value: '50+', label: 'Chuyên Gia Huấn Luyện' },
                { value: '5.0 ★', label: 'Đánh Giá Hội Viên' }
              ]).map((metric, idx) => (
                <div key={metric.id || idx} className="tiya-metrics-item">
                  <span className="tiya-metrics-value">{metric.value}</span>
                  <span className="tiya-metrics-label">{metric.label}</span>
                </div>
              ))}
            </div>

            <div style={{display:'flex',justifyContent:'center',marginTop:'18px'}}>
              <a href="#ve-chung-toi" className="tiya-hero__scroll-cue">
                Cuộn xuống khám phá
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
          aria-label={isVideoMuted ? 'Bật âm thanh video' : 'Tắt âm thanh video'}
          className="hero-sound-btn"
        >
          <span className="material-symbols-outlined" style={{fontSize:'18px'}}>
            {isVideoMuted ? 'volume_off' : 'volume_up'}
          </span>
          {isVideoMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
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
                {landingContent.whyUs?.badge || 'TẠI SAO NÊN CHỌN SCMS'}
              </div>
              <h2 className="about-title">
                {landingContent.whyUs?.title || 'Nền Tảng Vững Chắc Cho Hành Trình Chinh Phục Đỉnh Cao'}
              </h2>
              <p className="about-desc">
                {landingContent.whyUs?.description || 'SCMS tự hào là tổ hợp thể thao đa năng chuẩn quốc tế, mang đến không gian tập luyện chuyên nghiệp, đội ngũ huấn luyện viên chứng chỉ AFC & NASM cùng quy trình cá nhân hóa toàn diện cho từng học viên.'}
              </p>

              <div style={{width:'100%',marginTop:'20px'}}>
                {(landingContent.whyUs?.features || [
                  { id: 'f1', icon: 'workspace_premium', title: 'Huấn luyện viên đạt chuẩn quốc tế', description: '100% đội ngũ huấn luyện sở hữu chứng chỉ AFC, FIBA, BWF hoặc NASM với kinh nghiệm đào tạo thực chiến.' },
                  { id: 'f2', icon: 'tune', title: 'Giáo án cá nhân hóa theo từng thể trạng', description: 'Đo lường chỉ số InBody định kỳ, thiết lập biểu đồ vận động riêng biệt và AI Workout Recommender theo mục tiêu.' },
                  { id: 'f3', icon: 'local_fire_department', title: 'Môi trường năng động và truyền cảm hứng', description: 'Cộng đồng hội viên văn minh, các giải đấu nội bộ định kỳ và hệ thống sân bãi đạt chuẩn thi đấu Olympic.' }
                ]).map((feat, idx) => (
                  <div key={feat.id || idx} className="about-feature-item">
                    <div className="about-feature-icon">
                      <span className="material-symbols-outlined" style={{fontSize:'22px'}}>{feat.icon}</span>
                    </div>
                    <div>
                      <div className="about-feature-title">{feat.title}</div>
                      <p className="about-feature-desc">{feat.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: 4 Stat Cards */}
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
                {(landingContent.whyUs?.stats || [
                  { number: SCMS_FACILITIES.length, suffix: '', title: 'CỤM SÂN & PHÒNG TẬP', subtitle: 'Tiêu chuẩn thi đấu chuyên nghiệp', icon: 'stadium' },
                  { number: visibleSports.length, suffix: '', title: 'MÔN THỂ THAO', subtitle: 'Đa dạng lựa chọn cho mọi lứa tuổi', icon: 'sports_kabaddi' },
                  { number: 400, suffix: '+', title: 'HỌC VIÊN', subtitle: 'Thường xuyên rèn luyện mỗi ngày', icon: 'diversity_3' },
                  { number: 13000, suffix: ' m²', title: 'DIỆN TÍCH', subtitle: 'Tổ hợp liên hợp khép kín hiện đại', icon: 'domain', formatThousands: true }
                ]).map((st, idx) => (
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
                    <div className="about-stat-card__title">{st.title}</div>
                    <div className="about-stat-card__sub">{st.subtitle}</div>
                  </div>
                ))}
              </div>

              {/* Trust Strip */}
              <div className="tiya-trust-strip tiya-reveal tiya-delay-4" style={{marginTop:'20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'28px',color:'var(--primary-color)'}}>verified_user</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:'13px',color:'var(--dark-color)'}}>
                      {landingContent.whyUs?.trustBanner?.title || 'Bảo hiểm rèn luyện toàn diện'}
                    </div>
                    <div style={{fontSize:'12px',color:'var(--p-color)'}}>
                      {landingContent.whyUs?.trustBanner?.description || 'Tất cả hội viên được trang bị y tế sơ cấp cứu tại sân 24/7'}
                    </div>
                  </div>
                </div>
                <span className="tiya-trust-strip__badge">
                  {landingContent.whyUs?.trustBanner?.certificate || 'ISO 9001'}
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
              <div style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'4px 12px',borderRadius:'100px',background:'rgba(129,178,154,0.18)',color:'var(--primary-color)',fontSize:'11px',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'12px'}}>
                <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--primary-color)',animation:'tiyaPulse 2s infinite'}} />
                Cụm Sân Quốc Tế • Mở Cửa 24/7
              </div>

              <h2>Bạn Cần Thuê Sân Tự Do Hoặc Tổ Chức Giải Đấu?</h2>

              <p>
                Hệ thống {SCMS_FACILITIES.length} khu liên hợp thể thao tiêu chuẩn: Bể bơi 4 mùa, sân bóng đá cỏ nhân tạo, cụm sân cầu lông, bóng rổ, pickleball, võ thuật &amp; gym. Đặt chỗ trực tuyến nhanh trong 30 giây với đầy đủ tiện ích tủ đồ, phòng tắm nước nóng, trọng tài &amp; y tế.
              </p>

              <div style={{display:'flex',flexWrap:'wrap',gap:'16px',marginBottom:'24px',fontSize:'13px',fontWeight:600,color:'var(--p-color)'}}>
                <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px',color:'var(--custom-btn-bg-hover-color)'}}>bolt</span>Giữ Chỗ Tức Thì
                </span>
                <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px',color:'var(--primary-color)'}}>groups</span>Ưu Đãi Đội Nhóm 20%
                </span>
                <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px',color:'var(--custom-btn-bg-color)'}}>light_mode</span>Đèn LED Ban Đêm
                </span>
              </div>

              {/* Tiya Exact Input Group Form */}
              <div className="input-group">
                <span className="input-group-text material-symbols-outlined">stadium</span>
                <input
                  type="text"
                  readOnly
                  value={`Hệ thống ${SCMS_FACILITIES.length} cụm sân & phòng tập sẵn sàng phục vụ`}
                  aria-label="Thông tin cụm sân"
                />
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('co-so-vat-chat');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Xem 9 Khu Vực &amp; Đặt Chỗ Ngay
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
        <div className="courses-container">
          <div className="tiya-reveal courses-section-header">
            <div style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'6px 16px',background:'rgba(129,178,154,0.15)',border:'1px solid rgba(129,178,154,0.4)',borderRadius:'100px',color:'var(--primary-color)',fontSize:'11px',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'12px'}}>
              <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--primary-color)',animation:'tiyaPulse 2s infinite'}} />
              {landingContent.coursesSection?.badge || 'Chương trình đào tạo chuyên nghiệp'}
            </div>
            <h2 className="courses-title">
              <span>{visibleSports.length} Khóa Học</span> {(landingContent.coursesSection?.title || 'Thể Thao Đa Năng').replace(/^Khóa Học\s*/i, '')}
            </h2>
            <p className="courses-desc">
              {landingContent.coursesSection?.description || 'Thiết kế bài bản từ nền tảng đến chuyên sâu thi đấu, đáp ứng mọi nhu cầu rèn luyện thể chất chuẩn Olympic cùng đội ngũ huấn luyện viên kiện tướng quốc gia.'}
            </p>

            {/* Trust Badges */}
            <div style={{display:'flex',flexWrap:'wrap',gap:'10px',justifyContent:'center',marginTop:'12px'}}>
              {(landingContent.coursesSection?.trustBadges || [
                { id: 'tb1', icon: 'military_tech', text: 'Chuẩn Đào Tạo Olympic' },
                { id: 'tb2', icon: 'verified', text: '100% HLV Chứng Chỉ Quốc Tế' },
                { id: 'tb3', icon: 'shield', text: 'Bảo Hiểm & Y Tế 24/7' }
              ]).map((tb, idx) => (
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
              {filteredSports.map(sport => {
                const facility = SCMS_FACILITIES.find(f => f.id === (sport.facilityId || SPORT_FACILITY_MAP[sport.id])) || {};
                const staticDetails = SPORT_CATALOG_DETAILS[sport.id] || {};
                const details = {
                  rating: sport.rating || staticDetails.rating || '4.9',
                  ratingCount: sport.ratingCount || staticDetails.ratingCount || '150',
                  level: sport.level || staticDetails.level || 'Mọi trình độ',
                  coach: sport.coach || staticDetails.coach || 'HLV Chuyên Nghiệp',
                  schedule: sport.schedule || staticDetails.schedule || facility.openHours || '06:00 - 22:00',
                  highlight: sport.highlight || staticDetails.highlight || facility.highlights || facility.description,
                  price: sport.price || staticDetails.price || facility.priceRate?.split('•')[0]?.trim() || 'Học phí ưu đãi',
                  capacity: sport.capacity || staticDetails.capacity || facility.capacity || 'Tiêu chuẩn',
                  badges: (sport.badges && sport.badges.length > 0) ? sport.badges : (staticDetails.badges || [facility.badge || 'Đạt Chuẩn'])
                };
                const catCfg = SPORT_CATEGORY_CONFIG[sport.category] || {
                  badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                  iconColor: 'text-rose-400',
                  label: sport.category
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
                      className={`tiya-course-card tiya-reveal ${isHighlighted ? 'highlighted' : ''}`}
                    >
                      <div className="tiya-course-card__image-wrap">
                        <img src={sport.image || facility.image || facility.secondaryImage} alt={sport.name} loading="lazy" />
                        <div style={{position:'absolute',top:'12px',left:'12px',right:'12px',display:'flex',justifyContent:'space-between',alignItems:'flex-start',zIndex:2}}>
                          <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'100px',background:'rgba(0,0,0,0.65)',color:'var(--white-color)',fontSize:'10px',fontWeight:700,textTransform:'uppercase',backdropFilter:'blur(4px)'}}>
                            <span className="material-symbols-outlined" style={{fontSize:'13px'}}>{sport.icon}</span>
                            {catCfg.label}
                          </span>
                          <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',borderRadius:'100px',background:'rgba(129,178,154,0.9)',color:'var(--white-color)',fontSize:'10px',fontWeight:700,backdropFilter:'blur(4px)'}}>
                            {facility.badge || 'Tiêu chuẩn'}
                          </span>
                        </div>
                        <div style={{position:'absolute',bottom:'10px',right:'12px',padding:'4px 12px',borderRadius:'8px',background:'rgba(0,0,0,0.7)',color:'var(--custom-btn-bg-color)',fontSize:'12px',fontWeight:700,backdropFilter:'blur(4px)'}}>
                          {details.price}
                        </div>
                      </div>

                      <div className="tiya-course-card__body">
                        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px',marginBottom:'6px',minHeight:'30px'}}>
                          <h3 className="tiya-course-card__title" style={{margin:0}}>{sport.name}</h3>
                          <span style={{display:'inline-flex',alignItems:'center',gap:'3px',fontSize:'12px',fontWeight:700,color:'var(--custom-btn-bg-hover-color)',flexShrink:0}}>
                            <span className="material-symbols-outlined" style={{fontSize:'14px',color:'var(--custom-btn-bg-color)'}}>star</span>
                            {details.rating}
                            <span style={{fontSize:'10px',color:'var(--p-color)'}}>({details.ratingCount})</span>
                          </span>
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
                            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{facility.openHours ? facility.openHours.replace('hàng ngày', '') : 'Linh hoạt'}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="custom-border-btn"
                          style={{width:'100%',justifyContent:'center'}}
                          onClick={(e) => { e.stopPropagation(); handleSportClick(sport); }}
                        >
                          Xem Chi Tiết &amp; Đặt Lịch
                          <span className="material-symbols-outlined" style={{fontSize:'16px'}}>arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carousel Dots */}
            <div className="tiya-carousel-dots">
              {filteredSports.map((sport, idx) => (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => handleScrollSportsToIndex(idx)}
                  aria-label={`Chuyển đến môn ${sport.name}`}
                  className={`tiya-carousel-dot ${sportCarouselIndex === idx ? 'active' : ''}`}
                  style={{width: sportCarouselIndex === idx ? '36px' : '8px', background: sportCarouselIndex === idx ? 'var(--primary-color)' : 'rgba(0,0,0,0.15)'}}
                />
              ))}
            </div>
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

        {/* Bottom Wave: Dark Slate Navy #3D405B flowing into Footer */}
        <svg className="facilities-bottom-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#3D405B" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,235,823,280C891.4,318,960,285,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z" />
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. SITE FOOTER (Tiya .site-footer with Bottom #81B29A SVG Wave)
      ───────────────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer-container tiya-reveal">
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'40px',marginBottom:'40px'}}>
            {/* Col 1: Brand */}
            <div>
              <a href="#/" onClick={e => handleNavClick(navItems[0], e)} aria-label="SCMS Olympic Sports Arena - Về trang chủ"
                style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px',textDecoration:'none'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'linear-gradient(135deg,var(--scms-red),var(--custom-btn-bg-hover-color))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:900,fontSize:'20px',flexShrink:0}}>
                  S
                </div>
                <div>
                  <div style={{fontFamily:'var(--body-font-family)',fontWeight:700,fontSize:'22px',color:'var(--white-color)',letterSpacing:'-0.5px'}}>SCMS</div>
                  <div style={{fontSize:'10px',fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.6)'}}>Olympic Sports Arena</div>
                </div>
              </a>
              <p style={{fontSize:'14px',lineHeight:1.7,color:'rgba(255,255,255,0.65)'}}>
                Không gian học tập và rèn luyện thể thao dành cho mọi lứa tuổi. Cùng SCMS chọn bộ môn yêu thích, nâng cao thể lực và kết nối cộng đồng.
              </p>
              <div style={{display:'inline-flex',alignItems:'center',gap:'8px',marginTop:'12px',padding:'6px 14px',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'100px',fontSize:'11px',fontWeight:600,color:'rgba(255,255,255,0.7)'}}>
                <span className="material-symbols-outlined" style={{fontSize:'16px',color:'var(--primary-color)'}}>sports_score</span>
                {visibleSports.length} bộ môn · {(landingContent.facilitiesSection?.facilitiesList || SCMS_FACILITIES).filter(f => f.isVisible !== false).length} khu tập luyện
              </div>
            </div>

            {/* Col 2: Contact */}
            <div>
              <h4 className="site-footer-title">Thông Tin Liên Hệ</h4>
              <div>
                <div className="footer-link">
                  <span className="material-symbols-outlined" style={{fontSize:'18px',color:'var(--primary-color)',flexShrink:0}}>location_on</span>
                  {landingContent.ctaAndFooter?.contactAddress || 'Khu công nghệ cao, Thủ Đức, TP. Hồ Chí Minh'}
                </div>
                <a href={`tel:${(landingContent.ctaAndFooter?.contactPhone || '0859859367').replace(/\s+/g, '')}`} className="footer-link">
                  <span className="material-symbols-outlined" style={{fontSize:'18px',color:'var(--primary-color)',flexShrink:0}}>call</span>
                  {landingContent.ctaAndFooter?.contactPhone || '0859 859 367'}
                </a>
                <a href={`mailto:${landingContent.ctaAndFooter?.contactEmail || 'lienhe@scmsportscenter.vn'}`} className="footer-link" style={{wordBreak:'break-all'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px',color:'var(--primary-color)',flexShrink:0}}>mail</span>
                  {landingContent.ctaAndFooter?.contactEmail || 'lienhe@scmsportscenter.vn'}
                </a>
                <div className="social-icon" style={{marginTop:'16px'}}>
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
              <h4 className="site-footer-title">Thời Gian Hoạt Động</h4>
              <div className="footer-hours-row">
                <span>Thứ Hai - Thứ Sáu:</span>
                <span className="footer-hours-value">{landingContent.ctaAndFooter?.hoursWeekdays || '05:30 - 22:30'}</span>
              </div>
              <div className="footer-hours-row">
                <span>Thứ Bảy - Chủ Nhật:</span>
                <span className="footer-hours-value">{landingContent.ctaAndFooter?.hoursWeekend || '06:00 - 22:00'}</span>
              </div>
              <div className="footer-hours-row">
                <span>Ngày Lễ:</span>
                <span className="footer-hours-value" style={{color:'var(--custom-btn-bg-color)'}}>{landingContent.ctaAndFooter?.hoursHolidays || 'Mở cửa linh hoạt'}</span>
              </div>
              <p style={{fontSize:'11px',color:'rgba(255,255,255,0.45)',marginTop:'10px',lineHeight:1.6}}>
                Giờ hoạt động cụ thể được ghi trong thông tin từng sân và phòng tập.
              </p>
            </div>

            {/* Col 4: Sports List */}
            <div>
              <h4 className="site-footer-title">Bộ Môn &amp; Cơ Sở</h4>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 10px'}}>
                {visibleSports.map(sport => (
                  <button key={sport.id} type="button" onClick={() => handleSportClick(sport)}
                    title={`Xem cơ sở tập luyện ${sport.name}`}
                    style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'rgba(255,255,255,0.7)',background:'none',border:'none',cursor:'pointer',textAlign:'left',padding:'4px 0',transition:'color 0.2s'}}
                    onMouseEnter={e => e.currentTarget.style.color='var(--custom-btn-bg-color)'}
                    onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.7)'}
                  >
                    <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--primary-color)',flexShrink:0}} />
                    {sport.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:'24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'14px'}}>
            <p style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',margin:0}}>{landingContent.ctaAndFooter?.copyright || '© 2026 SCMS Sports Center. Bảo lưu mọi quyền.'}</p>
            <nav aria-label="Liên kết cuối trang" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'12px 20px',justifyContent:'flex-end'}}>
              {navItems.filter(item => item.id !== 'trang-chu').map(item => (
                <a key={item.id} href={item.href} onClick={e => handleNavClick(item, e)}
                  style={{fontSize:'12px',color:'rgba(255,255,255,0.6)',textDecoration:'none',transition:'color 0.2s'}}
                  onMouseEnter={e => e.target.style.color='var(--custom-btn-bg-color)'}
                  onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.6)'}>
                  {item.label}
                </a>
              ))}
              <a href="#/register" className="custom-border-btn" style={{fontSize:'12px',padding:'6px 16px'}}>
                Đăng ký hội viên
                <span className="material-symbols-outlined" style={{fontSize:'15px'}}>arrow_forward</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Tiya Signature Bottom Wave: #81B29A (Sage Green) */}
        <svg className="site-footer-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#81B29A" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,213,823,240C891.4,267,960,245,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z" />
        </svg>
      </footer>
    </div>
  );
}
