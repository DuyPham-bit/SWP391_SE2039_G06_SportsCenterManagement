import React from 'react';
import { Logo } from '../../../shared/ui/Logo.jsx';
import { translateLocation, translateOpenHours, translateSportName } from '../../../shared/i18n/i18nHelper.js';

export function LandingFooter({
  facilitiesList, handleNavClick, handleSportClick, isEn, landingContent, navItems, socialContacts,
  visibleSports
}) {
  return (
    <footer className="site-footer">
      <div className="footer-container tiya-reveal">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',gap:'40px',marginBottom:'36px'}}>
          {/* Col 1: Brand */}
          <div>
            <div className="mb-4">
              <Logo variant="auto" size="lg" onClick={e => handleNavClick(navItems[0], e)} />
            </div>
            <p style={{fontSize:'13.5px',lineHeight:1.7,color:'#D3D4D7',maxWidth:'320px'}}>
              {isEn
                ? 'Premier sports learning and training ground for all ages. Join Olympic Sports Arena to pursue your passion, enhance physical health, and connect with fellow athletes.'
                : 'Không gian học tập và rèn luyện thể thao dành cho mọi lứa tuổi. Cùng Olympic Sports Arena chọn bộ môn yêu thích, nâng cao thể lực và kết nối cộng đồng.'}
            </p>
            <div style={{display:'inline-flex',alignItems:'center',gap:'8px',marginTop:'16px',padding:'7px 16px',background:'rgb(var(--color-primary) / 0.15)',border:'1px solid rgb(var(--color-primary) / 0.35)',borderRadius:'100px',fontSize:'12px',fontWeight:600,color:'rgb(var(--color-primary))'}}>
              <span className="material-symbols-outlined" style={{fontSize:'16px',color:'var(--primary-color)'}}>sports_score</span>
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
            {isEn ? '© 2026 Olympic Sports Arena. All rights reserved.' : (landingContent.ctaAndFooter?.copyright || '© 2026 Olympic Sports Arena. Bảo lưu mọi quyền.')}
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
  );
}
