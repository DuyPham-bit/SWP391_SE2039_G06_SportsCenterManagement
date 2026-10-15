import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { SUPPORTED_SPORTS } from '../../services/sportsCatalog.js';
import { FacilitiesSection } from './FacilitiesSection.js';
import { SCMS_FACILITIES } from '../../services/facilitiesCatalog.js';
import { getLandingContent, LANDING_CONTENT_CHANGE_EVENT } from '../../services/landingContentService.js';

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
  const [landingContent, setLandingContent] = useState(() => getLandingContent());
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [coursesViewMode, setCoursesViewMode] = useState('cards'); // 'cards' (chi tiết đầy đủ) | 'compact' (lưới tinh gọn)
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

  // Đồng bộ thời gian thực khi Manager chỉnh sửa nội dung
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail) setLandingContent(e.detail);
      else setLandingContent(getLandingContent());
    };
    window.addEventListener(LANDING_CONTENT_CHANGE_EVENT, handleSync);
    return () => window.removeEventListener(LANDING_CONTENT_CHANGE_EVENT, handleSync);
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
    <div className="landing-page-root w-full min-h-screen bg-white text-slate-900 font-inter antialiased">
      {/* LANDING HEADER (ẨN HIỆN THEO SCROLL: TRONG SUỐT Ở TOP - HIỆN NỀN TRẮNG KHI CUỘN) */}
      <header
        id="site-header"
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-md py-0'
            : 'bg-transparent border-b border-transparent py-1'
        }`}
      >
        <div className="h-20 w-full max-w-[1720px] mx-auto px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between">
          {/* Brand Logo - SCMS PRO */}
          <a
            href="#/"
            onClick={(e) => handleNavClick(navItems[0], e)}
            aria-label="SCMS Olympic Sports Arena - Về trang chủ"
            className="flex items-center gap-3.5 group shrink-0 cursor-pointer focus:outline-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 font-chivo font-black text-xl tracking-tight transition-transform duration-300 group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={`font-chivo font-black text-xl tracking-tight leading-none transition-colors duration-200 ${
                  isScrolled ? 'text-slate-900' : 'text-white'
                }`}>
                  SCMS
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-600/20 text-red-400 font-extrabold uppercase border border-red-500/30">
                  PRO
                </span>
              </div>
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase mt-1 transition-colors duration-200 ${
                isScrolled ? 'text-slate-500' : 'text-slate-300'
              }`}>
                Olympic Sports Arena
              </span>
            </div>
          </a>

          {/* Navigation Links matching User's Screenshots */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-3 font-chivo text-xs xl:text-sm uppercase tracking-wider">
            {/* TRANG CHỦ */}
            <a
              href="#/"
              onClick={(e) => handleNavClick(navItems[0], e)}
              className={`relative inline-flex items-center justify-center -skew-x-12 px-3.5 xl:px-4 py-2 font-bold transition-all duration-200 cursor-pointer ${
                activeNav === 'trang-chu'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : `bg-transparent hover:bg-red-600 ${isScrolled ? 'text-slate-800' : 'text-white'} hover:text-white hover:shadow-md hover:shadow-red-600/30`
              }`}
            >
              <span className="skew-x-12 whitespace-nowrap">TRANG CHỦ</span>
            </a>

            {/* VỀ CHÚNG TÔI */}
            <a
              href="#ve-chung-toi"
              onClick={(e) => handleNavClick(navItems[1], e)}
              className={`relative inline-flex items-center justify-center -skew-x-12 px-3.5 xl:px-4 py-2 font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeNav === 've-chung-toi'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : `bg-transparent hover:bg-red-600 ${isScrolled ? 'text-slate-800' : 'text-white'} hover:text-white hover:shadow-md hover:shadow-red-600/30`
              }`}
            >
              <span className="skew-x-12 whitespace-nowrap">VỀ CHÚNG TÔI</span>
            </a>

            {/* KHÓA HỌC with 2-Column Sports Dropdown */}
            <div
              ref={coursesDropdownRef}
              className="relative"
              onMouseEnter={handleCoursesMouseEnter}
              onMouseLeave={handleCoursesMouseLeave}
            >
              <button
                type="button"
                onClick={(e) => {
                  handleNavClick(navItems[2], e);
                  toggleCoursesDropdown(e);
                }}
                className={`relative inline-flex items-center justify-center -skew-x-12 px-3.5 xl:px-4 py-2 font-bold transition-all duration-200 cursor-pointer focus:outline-none whitespace-nowrap ${
                  isCoursesDropdownOpen || activeNav === 'khoa-hoc'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : `bg-transparent hover:bg-red-600 ${isScrolled ? 'text-slate-800' : 'text-white'} hover:text-white hover:shadow-md hover:shadow-red-600/30`
                }`}
              >
                <span className="skew-x-12 inline-flex items-center gap-1 whitespace-nowrap">
                  <span>KHÓA HỌC</span>
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${isCoursesDropdownOpen ? 'rotate-180' : ''}`}>
                    keyboard_arrow_down
                  </span>
                </span>
              </button>

              {isCoursesDropdownOpen && (
                <div className="absolute top-full left-0 z-50 pt-1.5 animate-in fade-in duration-150">
                  <div className="w-[300px] bg-white rounded-none shadow-2xl border border-slate-200 p-5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                      <div className="flex flex-col space-y-3.5">
                        {leftSports.map(sportItem => {
                          const isSelected = selectedSportFromMenu === sportItem.id;
                          return (
                            <button
                              key={sportItem.id}
                              type="button"
                              onClick={() => handleSelectMenuItem(sportItem)}
                              className={`text-left text-[14px] leading-snug transition-colors cursor-pointer ${
                                isSelected
                                  ? 'text-red-600 font-semibold'
                                  : 'text-slate-800 hover:text-red-600 font-medium'
                              }`}
                            >
                              {sportItem.name}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-col space-y-3.5">
                        {rightSports.map(sportItem => {
                          const isSelected = selectedSportFromMenu === sportItem.id;
                          return (
                            <button
                              key={sportItem.id}
                              type="button"
                              onClick={() => handleSelectMenuItem(sportItem)}
                              className={`text-left text-[14px] leading-snug transition-colors cursor-pointer ${
                                isSelected
                                  ? 'text-red-600 font-semibold'
                                  : 'text-slate-800 hover:text-red-600 font-medium'
                              }`}
                            >
                              {sportItem.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CƠ SỞ VẬT CHẤT */}
            <a
              href="#co-so-vat-chat"
              onClick={(e) => handleNavClick(navItems[3], e)}
              className={`relative inline-flex items-center justify-center -skew-x-12 px-3.5 xl:px-4 py-2 font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                activeNav === 'co-so-vat-chat'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : `bg-transparent hover:bg-red-600 ${isScrolled ? 'text-slate-800' : 'text-white'} hover:text-white hover:shadow-md hover:shadow-red-600/30`
              }`}
            >
              <span className="skew-x-12 whitespace-nowrap">CƠ SỞ VẬT CHẤT</span>
            </a>
          </nav>

          {/* Action / Auth Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <a
                  href={getDashboardLink()}
                  className="bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-4 sm:px-5 py-2.5 shadow-md hover:shadow-lg transition-all flex items-center gap-2 -skew-x-12 cursor-pointer"
                >
                  <span className="skew-x-12 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                    <span>Vào Dashboard ({role})</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.hash = '#/login';
                  }}
                  className={`border px-3 py-2.5 font-chivo text-xs font-bold uppercase transition-colors flex items-center gap-1.5 ${
                    isScrolled
                      ? 'border-slate-300 hover:border-red-600 hover:bg-red-50 hover:text-red-600 text-slate-700'
                      : 'border-white/30 hover:border-white hover:bg-white/10 text-white'
                  }`}
                  title="Đăng xuất tài khoản"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <a
                  href="#/login"
                  className={`relative inline-flex items-center justify-center -skew-x-12 px-3.5 xl:px-4 py-2 font-chivo text-xs xl:text-sm font-bold uppercase transition-all duration-200 cursor-pointer ${
                    `bg-transparent hover:bg-red-600 ${isScrolled ? 'text-slate-800' : 'text-white'} hover:text-white hover:shadow-md hover:shadow-red-600/30`
                  }`}
                >
                  <span className="skew-x-12 whitespace-nowrap">ĐĂNG NHẬP</span>
                </a>
                <a
                  href="#/register"
                  className="bg-red-600 hover:bg-red-700 text-white font-chivo text-xs xl:text-sm font-bold uppercase px-4 py-2.5 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 -skew-x-12 cursor-pointer"
                >
                  <span className="skew-x-12 flex items-center gap-1.5">
                    <span>ĐĂNG KÝ</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </a>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden w-10 h-10 flex items-center justify-center transition-colors cursor-pointer ${
                isScrolled
                  ? 'text-slate-800 hover:bg-slate-100'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed top-20 left-0 right-0 bg-white border-b border-slate-200 px-4 py-5 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto z-50">
            <div className="flex flex-col space-y-1">
              <a
                href="#/"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNavClick(navItems[0], e);
                }}
                className={`px-3.5 py-2.5 font-chivo text-xs uppercase tracking-wider font-bold ${
                  activeNav === 'trang-chu' ? 'bg-red-600 text-white' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                TRANG CHỦ
              </a>

              <a
                href="#ve-chung-toi"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNavClick(navItems[1], e);
                }}
                className={`px-3.5 py-2.5 font-chivo text-xs uppercase tracking-wider font-bold ${
                  activeNav === 've-chung-toi' ? 'bg-red-600 text-white' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                VỀ CHÚNG TÔI
              </a>

              {/* Mobile Courses Accordion */}
              <div className="overflow-hidden border border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMobileCoursesOpen(!isMobileCoursesOpen)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 font-chivo text-xs uppercase tracking-wider font-bold ${
                    activeNav === 'khoa-hoc' || isMobileCoursesOpen ? 'bg-red-600 text-white' : 'text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>KHÓA HỌC</span>
                  <span className="material-symbols-outlined text-[18px]">
                    {isMobileCoursesOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                </button>

                {isMobileCoursesOpen && (
                  <div className="bg-white p-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="flex flex-col space-y-3">
                        {leftSports.map(sportItem => (
                          <button
                            key={sportItem.id}
                            type="button"
                            onClick={() => handleSelectMenuItem(sportItem)}
                            className={`text-left text-sm transition-colors ${
                              selectedSportFromMenu === sportItem.id
                                ? 'text-red-600 font-semibold'
                                : 'text-slate-800 hover:text-red-600 font-medium'
                            }`}
                          >
                            {sportItem.name}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col space-y-3">
                        {rightSports.map(sportItem => (
                          <button
                            key={sportItem.id}
                            type="button"
                            onClick={() => handleSelectMenuItem(sportItem)}
                            className={`text-left text-sm transition-colors ${
                              selectedSportFromMenu === sportItem.id
                                ? 'text-red-600 font-semibold'
                                : 'text-slate-800 hover:text-red-600 font-medium'
                            }`}
                          >
                            {sportItem.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <a
                href="#co-so-vat-chat"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  handleNavClick(navItems[3], e);
                }}
                className={`px-3.5 py-2.5 font-chivo text-xs uppercase tracking-wider font-bold ${
                  activeNav === 'co-so-vat-chat' ? 'bg-red-600 text-white' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                CƠ SỞ VẬT CHẤT
              </a>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <a
                    href={getDashboardLink()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full bg-red-600 text-white font-chivo text-xs font-bold uppercase py-2.5 text-center shadow-md flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
                    <span>Vào Dashboard ({role})</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                      window.location.hash = '#/login';
                    }}
                    className="w-full text-center py-2 text-slate-700 hover:text-red-600 font-chivo text-xs font-bold uppercase border border-slate-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Đăng xuất tài khoản</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <a
                    href="#/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-slate-700 font-chivo text-xs font-bold uppercase border border-slate-300"
                  >
                    ĐĂNG NHẬP
                  </a>
                  <a
                    href="#/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-red-600 text-white font-chivo text-xs font-bold uppercase shadow-md"
                  >
                    ĐĂNG KÝ HỘI VIÊN MỚI
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION - FULL 1 PAGE WEB VIEWPORT */}
      <section
        id="trang-chu"
        className="relative w-full min-h-screen flex flex-col justify-between items-center text-center px-4 overflow-hidden pt-24 pb-6 bg-slate-950"
      >
        {/* Background Video with Cinematic Dark Scrim */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105"
            poster={landingContent.heroBanner?.posterUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=1280&auto=format&fit=crop'}
          >
            <source src={landingContent.heroBanner?.videoUrl || './hero-video.mp4'} type="video/mp4" />
          </video>
          {/* Olympic Scrim Overlay: ensures sharp readability of headings, badges, and stats */}
          <div className="absolute inset-0 bg-slate-950/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
        </div>

        {/* Top spacer for vertical balance with fixed header */}
        <div className="w-full h-4 pointer-events-none shrink-0" />

        {/* Main Hero Content (Centered vertically) */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center my-auto py-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 shadow-sm mb-6">
            <span className="w-2.5 h-2.5 bg-red-600 animate-pulse" />
            <span className="font-chivo text-xs uppercase tracking-widest text-white font-bold">
              {landingContent.heroBanner?.badge || 'TRUNG TÂM THỂ THAO ĐẲNG CẤP QUỐC TẾ SCMS'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-chivo text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-black tracking-tight leading-tight uppercase max-w-4xl mx-auto drop-shadow-md">
            {landingContent.heroBanner?.title || 'SHAPING RESILIENCE THROUGH SPORTS'}
          </h1>

          {/* Subtext */}
          <p className="font-inter text-base sm:text-lg text-slate-200 max-w-2xl mx-auto mt-6 leading-relaxed">
            {landingContent.heroBanner?.description || `Phát triển thể lực, tôi luyện ý chí và bứt phá mọi giới hạn cùng hệ thống ${SCMS_FACILITIES.length} cụm sân, phòng tập phục vụ ${visibleSports.length} bộ môn thể thao.`}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
            <a
              href={landingContent.heroBanner?.primaryCtaLink || '#/register'}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-chivo text-xs font-bold uppercase px-8 py-4 shadow-lg hover:shadow-red-600/40 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <span>{landingContent.heroBanner?.primaryCtaText || 'ĐĂNG KÝ HỘI VIÊN MỚI'}</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </a>
            <a
              href={landingContent.heroBanner?.secondaryCtaLink || '#khoa-hoc'}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-chivo text-xs font-bold uppercase px-8 py-4 border border-white/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">sports_score</span>
              <span>{landingContent.heroBanner?.secondaryCtaText || `KHÁM PHÁ ${visibleSports.length} MÔN HỌC`}</span>
            </a>
          </div>
        </div>

        {/* Quick Metrics Strip & Scroll Indicator Anchored at Bottom of 1st Page */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full bg-white/5 backdrop-blur-md p-6 border border-white/10 shadow-xl">
            {(landingContent.heroBanner?.metrics || [
              { value: '100%', label: 'Chuẩn Thi Đấu' },
              { value: '24/7', label: 'Lọc Khí & Điều Hòa' },
              { value: '50+', label: 'Chuyên Gia Huấn Luyện' },
              { value: '5.0 ★', label: 'Đánh Giá Hội Viên' }
            ]).map((metric, idx) => (
              <div key={metric.id || idx} className="flex flex-col items-center">
                <span className="font-chivo text-3xl font-black text-red-500">{metric.value}</span>
                <span className="font-chivo text-xs text-slate-300 uppercase tracking-wider mt-1 font-bold">{metric.label}</span>
              </div>
            ))}
          </div>

          {/* Subtle scroll down indicator */}
          <a
            href="#ve-chung-toi"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs font-chivo tracking-widest uppercase mt-3 transition-colors animate-bounce"
          >
            <span>Cuộn xuống khám phá</span>
            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
          </a>
        </div>

        {/* Sound Toggle Button (Bottom-Right of Hero) */}
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
          className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/60 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-chivo font-bold tracking-wider transition-all cursor-pointer shadow-lg"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isVideoMuted ? 'volume_off' : 'volume_up'}
          </span>
          <span className="hidden sm:inline">
            {isVideoMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          </span>
        </button>
      </section>

      {/* ABOUT US SECTION - FULL 1 PAGE VIEWPORT */}
      <section className="w-full bg-white min-h-screen flex items-center justify-center py-24 px-6 sm:px-10 md:px-14 lg:px-20" id="ve-chung-toi">
        <div className="w-full max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-center">
          {/* Left Column (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-50 text-red-600 font-chivo text-xs uppercase tracking-widest font-bold mb-4 border border-red-200">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {landingContent.whyUs?.badge || 'TẠI SAO NÊN CHỌN SCMS'}
            </div>
            <h2 className="font-chivo text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {landingContent.whyUs?.title || 'Nền Tảng Vững Chắc Cho Hành Trình Chinh Phục Đỉnh Cao'}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mt-5">
              {landingContent.whyUs?.description || 'SCMS tự hào là tổ hợp thể thao đa năng chuẩn quốc tế, mang đến không gian tập luyện chuyên nghiệp, đội ngũ huấn luyện viên chứng chỉ AFC & NASM cùng quy trình cá nhân hóa toàn diện cho từng học viên.'}
            </p>

            <div className="w-full space-y-4 mt-8">
              {(landingContent.whyUs?.features || [
                {
                  id: 'f1',
                  icon: 'workspace_premium',
                  title: 'Huấn luyện viên đạt chuẩn quốc tế',
                  description: '100% đội ngũ huấn luyện sở hữu chứng chỉ AFC, FIBA, BWF hoặc NASM với kinh nghiệm đào tạo thực chiến.'
                },
                {
                  id: 'f2',
                  icon: 'tune',
                  title: 'Giáo án cá nhân hóa theo từng thể trạng',
                  description: 'Đo lường chỉ số InBody định kỳ, thiết lập biểu đồ vận động riêng biệt và AI Workout Recommender theo mục tiêu.'
                },
                {
                  id: 'f3',
                  icon: 'local_fire_department',
                  title: 'Môi trường năng động và truyền cảm hứng',
                  description: 'Cộng đồng hội viên văn minh, các giải đấu nội bộ định kỳ và hệ thống sân bãi đạt chuẩn thi đấu Olympic.'
                }
              ]).map((feat, idx) => (
                <div key={feat.id || idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[22px]">{feat.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-chivo text-sm font-bold text-slate-900">{feat.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{feat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: 4 Stat Cards (6 cols) */}
          <div className="lg:col-span-6 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(landingContent.whyUs?.stats || [
                { number: SCMS_FACILITIES.length, suffix: '', title: 'CỤM SÂN & PHÒNG TẬP', subtitle: 'Tiêu chuẩn thi đấu chuyên nghiệp', icon: 'stadium' },
                { number: visibleSports.length, suffix: '', title: 'MÔN THỂ THAO', subtitle: 'Đa dạng lựa chọn cho mọi lứa tuổi', icon: 'sports_kabaddi' },
                { number: 400, suffix: '+', title: 'HỌC VIÊN', subtitle: 'Thường xuyên rèn luyện mỗi ngày', icon: 'diversity_3' },
                { number: 13000, suffix: ' m²', title: 'DIỆN TÍCH', subtitle: 'Tổ hợp liên hợp khép kín hiện đại', icon: 'domain', formatThousands: true }
              ]).map((st, idx) => (
                <div key={st.id || idx} className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center hover:-translate-y-1.5 transition-transform duration-300 justify-center min-h-[180px] relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-white/10 pointer-events-none">
                    <span className="material-symbols-outlined text-[100px]">{st.icon}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined text-[22px]">{st.icon}</span>
                  </div>
                  <div className="font-chivo text-4xl sm:text-5xl font-black tracking-tight leading-none text-white whitespace-nowrap">
                    <AnimatedNumber value={st.number} duration={1200} suffix={st.suffix} formatThousands={Boolean(st.formatThousands)} />
                  </div>
                  <div className="font-chivo text-base font-extrabold uppercase tracking-wide mt-2">{st.title}</div>
                  <div className="text-xs text-white/80 mt-1 font-medium">{st.subtitle}</div>
                </div>
              ))}
            </div>

            {/* Extra Trust Strip */}
            <div className="mt-6 p-4 rounded-xl bg-slate-100 flex items-center justify-between gap-4 border border-slate-200">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600 text-[28px]">verified_user</span>
                <div>
                  <div className="font-chivo text-xs font-bold text-slate-900">
                    {landingContent.whyUs?.trustBanner?.title || 'Bảo hiểm rèn luyện toàn diện'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {landingContent.whyUs?.trustBanner?.description || 'Tất cả hội viên được trang bị y tế sơ cấp cứu tại sân 24/7'}
                  </div>
                </div>
              </div>
              <span className="font-chivo text-xs font-bold text-red-600 px-3 py-1 bg-white rounded shadow-sm shrink-0 border border-slate-200">
                {landingContent.whyUs?.trustBanner?.certificate || 'ISO 9001'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* COURSES CATALOG SECTION - OLYMPIC MASTER TRAINING */}
      <section
        className="w-full bg-[#080d1a] py-16 sm:py-20 lg:py-28 px-4 sm:px-6 md:px-10 lg:px-14 text-white scroll-mt-20 relative overflow-hidden"
        id="khoa-hoc"
      >
        {/* Ambient atmospheric sport lighting & subtle tech grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(225,29,72,0.22),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(245,158,11,0.1),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 dynamic-typo-grid opacity-20 pointer-events-none" />

        <div className="w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-4xl mb-8 sm:mb-10 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-500/15 via-rose-500/15 to-amber-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-extrabold uppercase tracking-[0.2em] mb-3.5 shadow-sm backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{landingContent.coursesSection?.badge || 'Chương trình đào tạo chuyên nghiệp'}</span>
            </div>
            <h2 className="font-chivo text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
              {visibleSports.length} {landingContent.coursesSection?.title || 'Khóa Học Thể Thao Đa Năng'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-3xl mx-auto font-normal leading-relaxed">
              {landingContent.coursesSection?.description || 'Thiết kế bài bản từ nền tảng đến chuyên sâu thi đấu, đáp ứng mọi nhu cầu rèn luyện thể chất chuẩn Olympic cùng đội ngũ huấn luyện viên kiện tướng quốc gia.'}
            </p>

            {/* Trust & Credentials Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mt-5 text-xs text-slate-300/90">
              {(landingContent.coursesSection?.trustBadges || [
                { id: 'tb1', icon: 'military_tech', text: 'Chuẩn Đào Tạo Olympic' },
                { id: 'tb2', icon: 'verified', text: '100% HLV Chứng Chỉ Quốc Tế' },
                { id: 'tb3', icon: 'shield', text: 'Bảo Hiểm & Y Tế 24/7' }
              ]).map((tb, idx) => (
                <span key={tb.id || idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-rose-400">{tb.icon}</span>
                  <span>{tb.text}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Filter & View Mode Controls Bar */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-8 sm:mb-10 pb-3 border-b border-slate-800/80">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5">
              {categoryConfig.map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-chivo text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-red-600/30 border-rose-500/60 scale-105'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Switcher: Full Cards vs Compact Grid */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden lg:inline">Chế độ hiển thị:</span>
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
                <button
                  onClick={() => setCoursesViewMode('cards')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    coursesViewMode === 'cards'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Hiển thị thẻ đầy đủ hình ảnh & thông tin chi tiết"
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span className="hidden sm:inline">Thẻ Chi Tiết</span>
                </button>
                <button
                  onClick={() => setCoursesViewMode('compact')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    coursesViewMode === 'compact'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Hiển thị lưới thẻ tinh gọn"
                >
                  <span className="material-symbols-outlined text-[16px]">view_compact</span>
                  <span className="hidden sm:inline">Lưới Tinh Gọn</span>
                </button>
              </div>
            </div>
          </div>

          {/* COURSES VIEW: MODE 'cards' (FULL DETAIL CARDS) */}
          {coursesViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 xl:gap-8 w-full">
              {filteredSports.map(sport => {
                const isHighlighted = highlightedSportId === sport.id;
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
                  gradientHover: 'group-hover:from-red-600 group-hover:to-rose-500',
                  label: sport.category
                };

                return (
                  <div
                    key={sport.id}
                    id={`sport-card-${sport.id}`}
                    onClick={() => handleSportClick(sport)}
                    className={`group relative overflow-hidden rounded-2xl bg-slate-900/90 border transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 ${
                      isHighlighted
                        ? 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.45)] ring-2 ring-rose-500/80 scale-[1.02] z-10'
                        : 'border-slate-800/90 hover:border-rose-500/60 shadow-xl hover:shadow-[0_22px_45px_rgba(0,0,0,0.7),0_0_30px_rgba(244,63,94,0.18)]'
                    }`}
                  >
                    {/* Highlight Pulse Indicator if navigated from header */}
                    {isHighlighted && (
                      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-lg shadow-rose-600/50 animate-bounce">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        <span>Đang chọn</span>
                      </div>
                    )}

                    {/* CARD MEDIA HEADER (IMAGE + OVERLAYS + BADGES) */}
                    <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-950">
                      <img
                        src={sport.image || facility.image || facility.secondaryImage}
                        alt={sport.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                      {/* Gradient Scrims for perfect readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-80" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${catCfg.badge}`}>
                          <span className="material-symbols-outlined text-[13px]">{sport.icon}</span>
                          <span>{catCfg.label}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/55 text-slate-200 border border-white/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{facility.badge || 'Tiêu chuẩn'}</span>
                        </span>
                      </div>

                      {/* Overlaid Sport Icon & Price Tag */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
                        <div className="w-11 h-11 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg group-hover:bg-gradient-to-tr group-hover:from-red-600 group-hover:to-rose-500 group-hover:border-transparent group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                          <span className="material-symbols-outlined text-[24px] text-rose-300 group-hover:text-white transition-colors">{sport.icon}</span>
                        </div>

                        <div className="px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-right shadow-md">
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Học phí / Vé</span>
                          <span className="text-xs sm:text-sm font-black text-amber-300">{details.price}</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD BODY CONTENT */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Title and Rating */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-chivo text-xl sm:text-2xl font-black text-white group-hover:text-rose-400 transition-colors uppercase tracking-tight">
                            {sport.name}
                          </h3>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold shrink-0">
                            <span className="material-symbols-outlined text-[13px] text-amber-400 fill-1">star</span>
                            <span>{details.rating}</span>
                            <span className="text-slate-400 text-[10px]">({details.ratingCount})</span>
                          </div>
                        </div>

                        {/* Venue Location Pin */}
                        <div className="flex items-center gap-1.5 text-xs text-rose-400/95 font-semibold mb-3">
                          <span className="material-symbols-outlined text-[15px] shrink-0 text-rose-500">location_on</span>
                          <span className="truncate">{facility.name} • {facility.location}</span>
                        </div>

                        {/* Highlights Description */}
                        <p className="text-xs sm:text-[13px] text-slate-300 line-clamp-2 leading-relaxed mb-4">
                          {details.highlight}
                        </p>

                        {/* Feature Pills */}
                        <div className="grid grid-cols-2 gap-2 mb-5">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300" title={details.coach}>
                            <span className="material-symbols-outlined text-[15px] text-rose-400 shrink-0">sports</span>
                            <span className="truncate">{details.coach}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300" title={facility.openHours}>
                            <span className="material-symbols-outlined text-[15px] text-amber-400 shrink-0">schedule</span>
                            <span className="truncate">{facility.openHours ? facility.openHours.replace('hàng ngày', '') : 'Linh hoạt'}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 col-span-2" title={details.level}>
                            <span className="material-symbols-outlined text-[15px] text-emerald-400 shrink-0">verified</span>
                            <span className="truncate">{details.level}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action CTA Button */}
                      <button
                        className="w-full py-3 px-4 rounded-xl bg-slate-800/90 group-hover:bg-gradient-to-r group-hover:from-red-600 group-hover:via-rose-600 group-hover:to-amber-600 border border-slate-700/80 group-hover:border-transparent text-white text-xs sm:text-[13px] font-bold font-chivo uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-rose-600/30 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSportClick(sport);
                        }}
                      >
                        <span>Xem Chi Tiết &amp; Đặt Lịch</span>
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1.5 transition-transform duration-200">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* COURSES VIEW: MODE 'compact' (ELEGANT 5-COLUMN / BENTO CARDS) */}
          {coursesViewMode === 'compact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full">
              {filteredSports.map(sport => {
                const isHighlighted = highlightedSportId === sport.id;
                const facility = SCMS_FACILITIES.find(f => f.id === SPORT_FACILITY_MAP[sport.id]) || {};
                const details = SPORT_CATALOG_DETAILS[sport.id] || { price: 'Ưu đãi' };
                const catCfg = SPORT_CATEGORY_CONFIG[sport.category] || {
                  badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
                  iconColor: 'text-rose-400',
                  gradientHover: 'group-hover:from-red-600 group-hover:to-rose-500',
                  label: sport.category
                };

                return (
                  <div
                    key={sport.id}
                    id={`sport-card-${sport.id}`}
                    onClick={() => handleSportClick(sport)}
                    className={`group relative overflow-hidden rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-300 border h-[200px] sm:h-[210px] ${
                      isHighlighted
                        ? 'bg-slate-900 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.45)] scale-[1.02] z-10'
                        : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-rose-500/60 shadow-lg hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1'
                    }`}
                  >
                    {/* Background cover image with subtle opacity and zoom */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <img
                        src={sport.image || facility.image || facility.secondaryImage}
                        alt={sport.name}
                        className="w-full h-full object-cover opacity-20 group-hover:opacity-35 group-hover:scale-110 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
                    </div>

                    {/* Top: Icon + Badge */}
                    <div className="flex items-center justify-between w-full relative z-10">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border bg-rose-500/15 ${catCfg.iconColor} border-rose-500/25 group-hover:bg-gradient-to-tr ${catCfg.gradientHover} group-hover:text-white group-hover:border-transparent group-hover:scale-105 shrink-0 shadow-md`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{sport.icon}</span>
                      </div>

                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catCfg.badge} backdrop-blur-sm`}
                      >
                        {catCfg.label}
                      </span>
                    </div>

                    {/* Bottom: Sport Name + Venue + Price */}
                    <div className="flex flex-col mt-auto pt-2 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="font-chivo text-sm sm:text-base font-black text-white group-hover:text-rose-300 transition-colors tracking-tight leading-tight">
                          {sport.name}
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-rose-400 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                          arrow_forward
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300/90 font-medium truncate mt-0.5 leading-tight">
                        {sport.venue}
                      </span>
                      <span className="text-[10px] text-amber-300 font-bold mt-1.5">
                        {sport.price || details.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* WIDE SPOTLIGHT HERO BANNER: ĐẶT THUÊ CỤM SÂN & KHÔNG GIAN THỂ THAO 24/7 */}
          <div
            onClick={() => {
              const el = document.getElementById('co-so-vat-chat');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 w-full mt-8 sm:mt-10 lg:mt-12 cursor-pointer transition-all duration-500 bg-gradient-to-r from-slate-900 via-rose-950/60 to-slate-900 border border-rose-500/30 hover:border-rose-500/70 shadow-2xl hover:shadow-[0_25px_60px_rgba(225,29,72,0.25)]"
          >
            {/* Background glow and subtle athletics pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_80%_50%,rgba(225,29,72,0.25),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 dynamic-typo-grid opacity-15 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-10">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-black uppercase tracking-wider mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cụm Sân Quốc Tế • Mở Cửa 24/7</span>
                </div>

                <h3 className="font-chivo text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight">
                  Bạn Cần Thuê Sân Tự Do Hoặc Tổ Chức Giải Đấu?
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed font-normal">
                  Hệ thống {SCMS_FACILITIES.length} khu liên hợp thể thao tiêu chuẩn: Bể bơi 4 mùa, sân bóng đá cỏ nhân tạo, cụm sân cầu lông, bóng rổ, pickleball, võ thuật &amp; gym. Đặt chỗ trực tuyến nhanh trong 30 giây với đầy đủ tiện ích tủ đồ, phòng tắm nước nóng, trọng tài &amp; y tế.
                </p>

                {/* Quick Features Row */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-xs font-semibold text-slate-200">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400">bolt</span>
                    <span>Giữ Chỗ Tức Thì</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-rose-400">groups</span>
                    <span>Ưu Đãi Đội Nhóm 20%</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-400">light_mode</span>
                    <span>Đèn LED Ban Đêm</span>
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <button
                  className="w-full sm:w-auto px-6 py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-chivo text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-red-600/30 group-hover:shadow-2xl group-hover:shadow-rose-600/50 group-hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">stadium</span>
                  <span>Xem 9 Khu Vực &amp; Đặt Chỗ Ngay</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1.5 transition-transform">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FACILITIES SECTION FROM FONTMAU */}
      <FacilitiesSection
        externalFacility={selectedFacilityForModal}
        onModalClose={() => setSelectedFacilityForModal(null)}
      />



      {/* FOOTER */}
      <footer className="w-full bg-slate-950 text-slate-400 pt-14 pb-8 border-t border-slate-800">
        <div className="w-full max-w-[1720px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 mb-10">
            <div>
              <a
                href="#/"
                onClick={e => handleNavClick(navItems[0], e)}
                aria-label="SCMS Olympic Sports Arena - Về trang chủ"
                className="inline-flex items-center gap-3.5 mb-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 group"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 font-chivo font-black text-xl tracking-tight transition-transform duration-300 group-hover:scale-105">
                  S
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-chivo font-black text-xl tracking-tight text-white leading-none">
                      SCMS
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-600/20 text-red-400 font-extrabold uppercase border border-red-500/30">
                      PRO
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">
                    Olympic Sports Arena
                  </span>
                </div>
              </a>
              <p className="text-xs leading-6 text-slate-300 max-w-xs">
                Không gian học tập và rèn luyện thể thao dành cho mọi lứa tuổi. Cùng SCMS chọn bộ môn yêu thích, nâng cao thể lực và kết nối cộng đồng.
              </p>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/70 text-[11px] font-semibold text-slate-300">
                <span className="material-symbols-outlined text-red-400 text-[16px]" aria-hidden="true">sports_score</span>
                <span>{visibleSports.length} bộ môn · {(landingContent.facilitiesSection?.facilitiesList || SCMS_FACILITIES).filter(f => f.isVisible !== false).length} khu tập luyện</span>
              </div>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Thông Tin Liên Hệ
              </h4>
              <ul className="space-y-3 text-xs leading-6 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0 mt-0.5" aria-hidden="true">location_on</span>
                  <span>{landingContent.ctaAndFooter?.contactAddress || 'Khu công nghệ cao, Thủ Đức, TP. Hồ Chí Minh'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0" aria-hidden="true">call</span>
                  <a href={`tel:${(landingContent.ctaAndFooter?.contactPhone || '0859859367').replace(/\s+/g, '')}`} className="rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                    {landingContent.ctaAndFooter?.contactPhone || '0859 859 367'}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0 mt-0.5" aria-hidden="true">mail</span>
                  <a href={`mailto:${landingContent.ctaAndFooter?.contactEmail || 'lienhe@scmsportscenter.vn'}`} className="min-w-0 break-words rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                    {landingContent.ctaAndFooter?.contactEmail || 'lienhe@scmsportscenter.vn'}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Thời Gian Hoạt Động
              </h4>
              <ul className="space-y-2 text-xs leading-6">
                <li className="flex justify-between gap-3 pb-2 border-b border-slate-800">
                  <span>Thứ Hai - Thứ Sáu:</span>
                  <span className="font-bold text-slate-200 tabular-nums whitespace-nowrap">
                    {landingContent.ctaAndFooter?.hoursWeekdays || '05:30 - 22:30'}
                  </span>
                </li>
                <li className="flex justify-between gap-3 pb-2 border-b border-slate-800">
                  <span>Thứ Bảy - Chủ Nhật:</span>
                  <span className="font-bold text-slate-200 tabular-nums whitespace-nowrap">
                    {landingContent.ctaAndFooter?.hoursWeekend || '06:00 - 22:00'}
                  </span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Ngày Lễ:</span>
                  <span className="font-semibold text-red-400 text-right">
                    {landingContent.ctaAndFooter?.hoursHolidays || 'Mở cửa linh hoạt'}
                  </span>
                </li>
              </ul>
              <p className="text-[11px] leading-5 text-slate-400 mt-3">
                Giờ hoạt động cụ thể được ghi trong thông tin từng sân và phòng tập.
              </p>
            </div>

            <div>
              <h4 className="font-chivo text-xs uppercase tracking-wider text-white mb-4 font-bold">
                Bộ Môn &amp; Cơ Sở
              </h4>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {visibleSports.map(sport => (
                  <li key={sport.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => handleSportClick(sport)}
                      title={`Xem cơ sở tập luyện ${sport.name}`}
                      className="flex items-start gap-2 text-left leading-5 text-slate-300 hover:text-red-400 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                    >
                      <span className="w-1 h-1 rounded-full bg-red-500 shrink-0 mt-2" aria-hidden="true" />
                      <span>{sport.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-5 text-[11px]">
            <p className="text-center lg:text-left leading-5">{landingContent.ctaAndFooter?.copyright || '© 2026 SCMS Sports Center. Bảo lưu mọi quyền.'}</p>
            <nav aria-label="Liên kết cuối trang" className="flex flex-wrap items-center justify-center lg:justify-end gap-x-5 gap-y-3">
              {navItems.filter(item => item.id !== 'trang-chu').map(item => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={e => handleNavClick(item, e)}
                  className="text-slate-300 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <a href="#/register" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors">
                <span>Đăng ký hội viên</span>
                <span className="material-symbols-outlined text-[15px]" aria-hidden="true">arrow_forward</span>
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
