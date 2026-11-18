import React from 'react';
import { TypewriterHeroHeading } from './TypewriterHeroHeading.jsx';
import { safeHref } from '../../../shared/lib/safeUrl.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';

/** All copy comes from the published home content (already in the selected language); no fallback text. */
export function HeroSection({ heroReady = true, isVideoMuted, landingContent, setIsVideoMuted, videoRef }) {
  const { t } = useLanguage();
  const hero = landingContent?.heroBanner || {};
  const metrics = hero.metrics || [];

  return (
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
        poster={hero.posterUrl || undefined}
      >
        {hero.videoUrl && <source src={hero.videoUrl} type={/\.webm($|\?)/i.test(hero.videoUrl) ? 'video/webm' : 'video/mp4'} />}
      </video>
      <div className="section-overlay" />

      {/* Hero Container */}
      <div className="hero-container">
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',maxWidth:'900px',margin:'0 auto'}}>
          {/* Animated Headline with Slide-up & Typewriter */}
          <TypewriterHeroHeading
            heroBadge={hero.badge || ''}
            heroReady={heroReady}
            heroTitle={hero.title || ''}
          />

          {/* Subtext */}
          <p className="hero-desc scms-hero-desc mt-5">{hero.description || ' '}</p>

          {/* CTA Buttons */}
          <div className="custom-btn-group scms-hero-cta" style={{justifyContent:'center'}}>
            {hero.primaryCtaText && safeHref(hero.primaryCtaLink) && (
              <a href={safeHref(hero.primaryCtaLink)} className="custom-btn" style={{padding:'14px 34px',fontSize:'14px'}}>
                {hero.primaryCtaText}
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>arrow_forward</span>
              </a>
            )}
            {hero.secondaryCtaText && safeHref(hero.secondaryCtaLink) && (
              <a href={safeHref(hero.secondaryCtaLink)} className="link">
                <span className="material-symbols-outlined" style={{fontSize:'18px'}}>sports_score</span>
                {hero.secondaryCtaText}
              </a>
            )}
          </div>

          {/* Metrics Strip */}
          {metrics.length > 0 && (
            <div className="tiya-metrics-strip" style={{width:'100%'}}>
              {metrics.map((metric, idx) => (
                <div key={metric.id || idx} className="tiya-metrics-item">
                  <span className="tiya-metrics-value">{metric.value}</span>
                  <span className="tiya-metrics-label">{metric.label}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'flex',justifyContent:'center',marginTop:'18px'}}>
            <a href="#ve-chung-toi" className="tiya-hero__scroll-cue">
              {t('landing.hero.scrollCue')}
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
        aria-label={t(isVideoMuted ? 'landing.hero.unmuteAria' : 'landing.hero.muteAria')}
        className="hero-sound-btn"
      >
        <span className="material-symbols-outlined" style={{fontSize:'18px'}}>
          {isVideoMuted ? 'volume_off' : 'volume_up'}
        </span>
        {t(isVideoMuted ? 'landing.hero.unmute' : 'landing.hero.mute')}
      </button>

      {/* Bottom Wave: Pure White #ffffff (Tiya Wave styled with compact height) */}
      <svg className="hero-bottom-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#ffffff" fillOpacity="1" d="M0,224L34.3,192C68.6,160,137,96,206,90.7C274.3,85,343,139,411,144C480,149,549,107,617,122.7C685.7,139,754,213,823,240C891.4,267,960,245,1029,224C1097.1,203,1166,181,1234,160C1302.9,139,1371,117,1406,106.7L1440,96L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z" />
      </svg>
    </section>
  );
}
