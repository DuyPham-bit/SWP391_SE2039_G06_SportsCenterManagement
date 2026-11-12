import React, { useLayoutEffect } from 'react';
import { FacilitiesSection } from './FacilitiesSection.jsx';
import { IntroSplashScreen } from './IntroSplashScreen.jsx';
import { useLandingPage } from '../model/useLandingPage.js';
import { LandingHeader } from './LandingHeader.jsx';
import { HeroSection } from './HeroSection.jsx';
import { AboutSection } from './AboutSection.jsx';
import { ZonesSection } from './ZonesSection.jsx';
import { CoursesSection } from './CoursesSection.jsx';
import { LandingFooter } from './LandingFooter.jsx';

export function LandingPage() {
  const {
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
  } = useLandingPage();

  // The landing is a light-only design. index.html adds html.dark from the OS/browser dark theme,
  // and the app-wide html.dark rules (e.g. `h2 { color: light !important }`) turn landing headings
  // white on white. Drop the class while the landing is mounted; restore it for the dashboard.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => { if (wasDark) root.classList.add('dark'); };
  }, []);

  return (
    <div className="landing-page-root tiya-page w-full min-h-screen" style={{ colorScheme: 'light' }}>
      {showIntro && <IntroSplashScreen onFinish={() => setShowIntro(false)} />}
      {/* LANDING HEADER (TIYA NAVBAR) */}
      <LandingHeader
        activeNav={activeNav}
        coursesDropdownRef={coursesDropdownRef}
        getDashboardLink={getDashboardLink}
        handleCoursesMouseEnter={handleCoursesMouseEnter}
        handleCoursesMouseLeave={handleCoursesMouseLeave}
        handleNavClick={handleNavClick}
        handleSelectMenuItem={handleSelectMenuItem}
        isAuthenticated={isAuthenticated}
        isCoursesDropdownOpen={isCoursesDropdownOpen}
        isEn={isEn}
        isMobileCoursesOpen={isMobileCoursesOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        isScrolled={isScrolled}
        language={language}
        leftSports={leftSports}
        logout={logout}
        navItems={navItems}
        rightSports={rightSports}
        role={role}
        selectedSportFromMenu={selectedSportFromMenu}
        setIsMobileCoursesOpen={setIsMobileCoursesOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setLanguage={setLanguage}
        toggleCoursesDropdown={toggleCoursesDropdown}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION (Tiya Wave Elements with Compact Balanced Height)
      ───────────────────────────────────────────────────────────── */}
      <HeroSection
        facilitiesList={facilitiesList}
        isEn={isEn}
        isVideoMuted={isVideoMuted}
        landingContent={landingContent}
        setIsVideoMuted={setIsVideoMuted}
        videoRef={videoRef}
        visibleSports={visibleSports}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. ABOUT SECTION (Tiya Pure White Background #ffffff)
      ───────────────────────────────────────────────────────────── */}
      <AboutSection
        catalog={catalog}
        facilitiesList={facilitiesList}
        isEn={isEn}
        landingContent={landingContent}
        visibleSports={visibleSports}
      />

      {/* ─────────────────────────────────────────────────────────────
          3. BACKGROUND IMAGE SECTION WITH FROSTED GLASS BLOCK (Tiya Signature)
          Matches 100% the user's reference screenshot!
      ───────────────────────────────────────────────────────────── */}
      <ZonesSection facilitiesList={facilitiesList} hours={hours} isEn={isEn} />

      {/* ─────────────────────────────────────────────────────────────
          4. COURSES CATALOG SECTION (Tiya Warm Cream #F4F1DE Background)
      ───────────────────────────────────────────────────────────── */}
      <CoursesSection
        catalogError={catalogError}
        catalogLoading={catalogLoading}
        categoryConfig={categoryConfig}
        editorialContent={editorialContent}
        facilitiesList={facilitiesList}
        filteredSports={filteredSports}
        handleScrollSportsToIndex={handleScrollSportsToIndex}
        handleSportClick={handleSportClick}
        handleSportsScroll={handleSportsScroll}
        highlightedSportId={highlightedSportId}
        hours={hours}
        isEn={isEn}
        landingContent={landingContent}
        membershipAction={membershipAction}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sportCarouselIndex={sportCarouselIndex}
        sportsCarousel={sportsCarousel}
        sportsCarouselRef={sportsCarouselRef}
        sportsList={sportsList}
        visibleSports={visibleSports}
      />

      {/* ─────────────────────────────────────────────────────────────
          5. FACILITIES SECTION (Tiya Warm Cream #F4F1DE Background)
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
      <LandingFooter
        facilitiesList={facilitiesList}
        handleNavClick={handleNavClick}
        handleSportClick={handleSportClick}
        isEn={isEn}
        landingContent={landingContent}
        navItems={navItems}
        socialContacts={socialContacts}
        visibleSports={visibleSports}
      />
    </div>
  );
}
