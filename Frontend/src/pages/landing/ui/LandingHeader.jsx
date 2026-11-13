import React from 'react';
import { Logo } from '../../../shared/ui/Logo.jsx';

export function LandingHeader({
  activeNav, coursesDropdownRef, getDashboardLink, handleCoursesMouseEnter, handleCoursesMouseLeave,
  handleNavClick, handleSelectMenuItem, isAuthenticated, isCoursesDropdownOpen, isEn,
  isMobileCoursesOpen, isMobileMenuOpen, isScrolled, language, leftSports, logout, navItems,
  rightSports, role, selectedSportFromMenu, setIsMobileCoursesOpen, setIsMobileMenuOpen, setLanguage,
  toggleCoursesDropdown
}) {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    try {
      const savedMode = localStorage.getItem('SCMS_THEME_MODE');
      if (savedMode === 'dark') return true;
      if (savedMode === 'light') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    try {
      localStorage.setItem('SCMS_THEME_MODE', nextMode ? 'dark' : 'light');
      if (nextMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  };

  return (
    <header
      id="site-header"
      className={`tiya-navbar ${isScrolled ? 'is-sticky scrolled' : ''}`}
    >
      <div className="tiya-navbar__container">
        {/* Brand Logo - SCMS Olympic Sports Arena */}
        <Logo variant="auto" size="lg" onClick={(e) => handleNavClick(navItems[0], e)} />

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
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="tiya-theme-toggle-btn tiya-navbar__desktop-only"
            aria-label={isDarkMode ? (isEn ? 'Switch to Light mode' : 'Chuyển sang Chế độ Sáng') : (isEn ? 'Switch to Dark mode' : 'Chuyển sang Chế độ Tối')}
            title={isDarkMode ? (isEn ? 'Light Mode' : 'Chế độ Sáng') : (isEn ? 'Dark Mode' : 'Chế độ Tối')}
          >
            <span className="material-symbols-outlined" style={{fontSize:'18px'}}>
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Minimalist Refined Language Toggle */}
          <div className="tiya-lang-toggle tiya-navbar__desktop-only" role="group" aria-label="Language selector">
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
            <div className="tiya-navbar__desktop-only" style={{display:'flex',alignItems:'center',gap:'8px'}}>
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
            <div className="tiya-navbar__desktop-only" style={{display:'flex',alignItems:'center',gap:'8px'}}>
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
          {/* Mobile Quick Actions: Theme & Language */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="tiya-theme-toggle-btn"
              aria-label={isDarkMode ? (isEn ? 'Switch to Light mode' : 'Chuyển sang Chế độ Sáng') : (isEn ? 'Switch to Dark mode' : 'Chuyển sang Chế độ Tối')}
              title={isDarkMode ? (isEn ? 'Light Mode' : 'Chế độ Sáng') : (isEn ? 'Dark Mode' : 'Chế độ Tối')}
            >
              <span className="material-symbols-outlined" style={{fontSize:'18px'}}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

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
  );
}
