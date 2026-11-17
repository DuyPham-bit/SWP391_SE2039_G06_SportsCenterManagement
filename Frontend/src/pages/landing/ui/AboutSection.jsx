import React from 'react';
import { AnimatedNumber } from './AnimatedNumber.jsx';

export function AboutSection({ catalog, facilitiesList, isEn, landingContent, visibleSports }) {
  return (
    <section className="about-section" id="ve-chung-toi">
      <div className="about-container">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',gap:'clamp(32px, 6vw, 60px)',alignItems:'start'}}>
          {/* Left Column */}
          <div className="tiya-reveal" style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
            <div className="about-badge">
              <span className="material-symbols-outlined" style={{fontSize:'16px'}}>verified</span>
              {landingContent.whyUs?.badge || (isEn ? 'WHY CHOOSE OLYMPIC SPORTS ARENA' : 'TẠI SAO NÊN CHỌN OLYMPIC SPORTS ARENA')}
            </div>
            <h2 className="about-title">
              {landingContent.whyUs?.title || (isEn
                ? 'A solid foundation for your training'
                : 'Nền Tảng Vững Chắc Cho Hành Trình Chinh Phục Đỉnh Cao')}
            </h2>
            <p className="about-desc">
              {landingContent?.whyUs?.description || (isEn
                ? 'International-standard facilities, dedicated coaches and modern training methods to help you develop all round.'
                : 'Hệ thống cơ sở vật chất chuẩn quốc tế, huấn luyện viên tận tâm và phương pháp đào tạo hiện đại giúp bạn phát triển toàn diện.')}
            </p>

            <div style={{width:'100%',marginTop:'20px'}}>
              {(landingContent?.whyUs?.features?.length ? landingContent.whyUs.features : [
                { id: 'f1', icon: 'verified', title: isEn ? 'Olympic Standard Facilities' : 'Tiêu Chuẩn Thi Đấu Olympic', description: isEn ? 'High-grade synthetic courts, anti-glare illumination, and international competition specifications.' : 'Mặt sàn cao cấp, ánh sáng chống chói và trang thiết bị đạt chuẩn thi đấu quốc tế.' },
                { id: 'f2', icon: 'military_tech', title: isEn ? 'Certified Coaching Staff' : 'Đội Ngũ HLV Chuyên Nghiệp', description: isEn ? 'Experienced coaches holding national and international athletic certificates.' : 'Giàu kinh nghiệm thi đấu thực chiến, sở hữu chứng chỉ huấn luyện chuyên môn.' },
                { id: 'f3', icon: 'schedule', title: isEn ? 'Smart & Flexible Booking' : 'Thời Gian Linh Hoạt & Đặt Lịch Dễ Dàng', description: isEn ? 'Easily reserve courts, sign up for classes, and manage schedules through our portal.' : 'Chủ động sắp xếp thời gian biểu rèn luyện, đăng ký trực tuyến nhanh chóng qua hệ thống.' }
              ]).map((feat, idx) => {
                const title = feat.title;
                const desc = feat.description;
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
              {/* CMS stats win. Without them, show only figures backed by the live catalog (never invented counts). */}
              {(landingContent?.whyUs?.stats?.length ? landingContent.whyUs.stats : [
                { id: 'rooms', number: catalog?.rooms?.length || facilitiesList?.length || 0, suffix: '', title: isEn ? 'ROOMS & COURTS' : 'CỤM SÂN & PHÒNG TẬP', subtitle: isEn ? 'Olympic standard' : 'Tiêu chuẩn thi đấu chuyên nghiệp', icon: 'stadium' },
                { id: 'sports', number: visibleSports?.length || 0, suffix: '', title: isEn ? 'SPORTS DISCIPLINES' : 'MÔN THỂ THAO', subtitle: isEn ? 'Diverse options for all ages' : 'Đa dạng lựa chọn cho mọi lứa tuổi', icon: 'sports' }
              ].filter(st => st.number > 0)).map((st, idx) => {
                const title = st.title;
                const subtitle = st.subtitle;
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
                    {landingContent.whyUs?.trustBanner?.title || (isEn ? 'Verified Olympic-standard quality' : 'Chất Lượng Chuẩn Olympic Đã Được Kiểm Định')}
                  </div>
                  <div style={{fontSize:'12px',color:'var(--p-color)'}}>
                    {landingContent.whyUs?.trustBanner?.description || (isEn ? 'Operations that meet the standard, with international sports training certificates.' : 'Hệ thống vận hành đạt chuẩn và chứng chỉ đào tạo thể thao quốc tế.')}
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
  );
}
