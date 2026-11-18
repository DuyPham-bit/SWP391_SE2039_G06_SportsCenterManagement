import React from 'react';
import { Logo } from '../../../shared/ui/Logo.jsx';
import { useLanguage } from '../../../shared/i18n/index.js';

export function LandingFooter({
  facilitiesList, handleNavClick, handleSportClick, landingContent, navItems, socialContacts,
  visibleSports
}) {
  const { t } = useLanguage();
  const footer = landingContent?.ctaAndFooter || {};
  const notSet = t('landing.common.notUpdated');
  const visibleFacilities = (landingContent?.facilitiesSection?.facilitiesList || facilitiesList || []).filter(f => f?.isVisible !== false).length;
  return (
    <footer className="site-footer">
      <div className="footer-container tiya-reveal">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',gap:'40px',marginBottom:'36px'}}>
          {/* Col 1: Brand */}
          <div>
            <div className="mb-4">
              <Logo variant="dark" size="lg" onClick={e => handleNavClick(navItems[0], e)} />
            </div>
            <p style={{fontSize:'13.5px',lineHeight:1.7,color:'#D3D4D7',maxWidth:'320px'}}>
              {footer.brandDescription}
            </p>
            <div style={{display:'inline-flex',alignItems:'center',gap:'8px',marginTop:'16px',padding:'7px 16px',background:'rgba(129,178,154,0.12)',border:'1px solid rgba(129,178,154,0.3)',borderRadius:'100px',fontSize:'12px',fontWeight:600,color:'#A7F3D0'}}>
              <span className="material-symbols-outlined" style={{fontSize:'16px',color:'#81B29A'}}>sports_score</span>
              {t('landing.footer.counts', { sports: visibleSports?.length || 0, facilities: visibleFacilities })}
            </div>
          </div>

          {/* Col 2: Contact */}
          <div>
            <h4 className="site-footer-title">{t('landing.footer.contact')}</h4>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div className="footer-link">
                <span className="footer-icon-pill material-symbols-outlined">location_on</span>
                <span>{footer.contactAddress || notSet}</span>
              </div>
              {footer.contactPhone?.trim() ? (
                <a href={`tel:${footer.contactPhone.trim().replace(/\s+/g, '')}`} className="footer-link">
                  <span className="footer-icon-pill material-symbols-outlined">call</span>
                  <span>{footer.contactPhone.trim()}</span>
                </a>
              ) : (
                <div className="footer-link">
                  <span className="footer-icon-pill material-symbols-outlined">call</span>
                  <span>{notSet}</span>
                </div>
              )}
              {footer.contactEmail ? (
                <a href={`mailto:${footer.contactEmail}`} className="footer-link" style={{wordBreak:'break-all'}}>
                  <span className="footer-icon-pill material-symbols-outlined">mail</span>
                  <span>{footer.contactEmail}</span>
                </a>
              ) : (
                <div className="footer-link">
                  <span className="footer-icon-pill material-symbols-outlined">mail</span>
                  <span>{notSet}</span>
                </div>
              )}
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
            <h4 className="site-footer-title">{t('landing.footer.hours')}</h4>
            <div className="footer-hours-card">
              <div className="footer-hours-row">
                <span className="footer-hours-label">{t('landing.footer.weekdays')}</span>
                <span className="footer-hours-value">{footer.hoursWeekdays || notSet}</span>
              </div>
              <div className="footer-hours-row">
                <span className="footer-hours-label">{t('landing.footer.weekend')}</span>
                <span className="footer-hours-value">{footer.hoursWeekend || notSet}</span>
              </div>
              <div className="footer-hours-row">
                <span className="footer-hours-label">{t('landing.footer.holidays')}</span>
                <span className="footer-hours-value footer-hours-gold">{footer.hoursHolidays || notSet}</span>
              </div>
            </div>
            <p style={{fontSize:'12px',color:'#94A3B8',marginTop:'12px',lineHeight:1.6}}>
              {footer.hoursNote}
            </p>
          </div>

          {/* Col 4: Sports List */}
          <div>
            <h4 className="site-footer-title">{t('landing.footer.sports')}</h4>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 14px'}}>
              {visibleSports.map(sport => {
                const sName = sport.name;
                return (
                  <button key={sport.id} type="button" onClick={() => handleSportClick(sport)}
                    title={t('landing.footer.viewFacility', { name: sName })}
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
            {footer.copyright}
          </p>
          <nav aria-label={t('landing.footer.navLabel')} className="footer-bottom-nav">
            {navItems.filter(item => item.id !== 'trang-chu').map(item => (
              <a key={item.id} href={item.href} onClick={e => handleNavClick(item, e)} className="footer-nav-link">
                {item.label}
              </a>
            ))}
            <a href="#/register" className="custom-border-btn footer-register-btn">
              <span>{t('landing.footer.register')}</span>
              <span className="material-symbols-outlined" style={{fontSize:'16px'}}>arrow_forward</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
