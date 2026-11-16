import React from 'react';
import { TrainingZones3D } from './TrainingZones3D.jsx';

export function ZonesSection({ facilitiesList = [], hours, isEn = false }) {
  return (
    <section className="section-bg-image" id="khong-gian-tap-luyen">
      {/* Top Wave: White #ffffff */}
      <svg className="section-bg-image-top-wave" viewBox="0 0 1265 144" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path fill="rgba(255, 255, 255, 1)" d="M 0 40 C 164 40 164 20 328 20 L 328 20 L 328 0 L 0 0 Z" strokeWidth="0" />
        <path fill="rgba(255, 255, 255, 1)" d="M 327 20 C 445.5 20 445.5 89 564 89 L 564 89 L 564 0 L 327 0 Z" strokeWidth="0" />
        <path fill="rgba(255, 255, 255, 1)" d="M 563 89 C 724.5 89 724.5 48 886 48 L 886 48 L 886 0 L 563 0 Z" strokeWidth="0" />
        <path fill="rgba(255, 255, 255, 1)" d="M 885 48 C 1006.5 48 1006.5 67 1128 67 L 1128 67 L 1128 0 L 885 0 Z" strokeWidth="0" />
        <path fill="rgba(255, 255, 255, 1)" d="M 1127 67 C 1196 67 1196 0 1265 0 L 1265 0 L 1265 0 L 1127 0 Z" strokeWidth="0" />
      </svg>

      <div className="section-bg-image-container" style={{ maxWidth: '1440px', padding: '24px 20px 48px' }}>
        <div className="tiya-reveal--scale">
          {/* Header Card */}
          <div className="section-bg-image-block" style={{ marginBottom: '24px', padding: '28px 32px' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="section-bg-badge">
                  <span className="section-bg-badge-dot" aria-hidden="true" />
                  {isEn ? 'Campus Masterplan • 13,000 m² (130m × 100m)' : 'Không Gian Tập Luyện • Chuẩn Olympic 13.000 m²'}
                </div>
                <h2 style={{ margin: '8px 0 10px' }}>
                  {isEn ? 'Interactive 3D Training Campus & Facilities' : 'Sơ Đồ 3D Các Khu Vực Tập Luyện'}
                </h2>
                <p style={{ margin: 0, maxWidth: '840px' }}>
                  {isEn
                    ? 'Explore 9 Olympic training clusters with interactive 3D navigation. Rotate 360°, inspect floor cutaways, toggle Flycam view, and switch between realistic day, sunset, and night LED floodlights.'
                    : 'Khám phá 9 cụm sân bãi và phòng tập hiện đại qua mô hình 3D thực tế tương tác. Tự do xoay 360°, bóc tách từng tầng, đổi góc nhìn Flycam và trải nghiệm các chế độ ánh sáng ban ngày, hoàng hôn và đèn LED thi đấu ban đêm.'}
                </p>
              </div>

              {/* Quick highlight chips */}
              <div className="section-bg-features" style={{ margin: 0 }}>
                <span className="section-bg-feature-chip">
                  <span className="material-symbols-outlined chip-icon chip-icon--amber" aria-hidden="true">explore</span>
                  <span>{isEn ? '3D 360° ArchViz' : 'Mô hình 3D 360°'}</span>
                </span>
                <span className="section-bg-feature-chip">
                  <span className="material-symbols-outlined chip-icon chip-icon--emerald" aria-hidden="true">layers</span>
                  <span>{isEn ? 'Floor Cutaways' : 'Bóc tách 3 tầng'}</span>
                </span>
                <span className="section-bg-feature-chip">
                  <span className="material-symbols-outlined chip-icon chip-icon--sky" aria-hidden="true">light_mode</span>
                  <span>{isEn ? 'Night LED Lights' : 'Dàn đèn LED Đêm'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive 3D Model */}
          <TrainingZones3D
            isEn={isEn}
            onBookingClick={() => {
              const el = document.getElementById('co-so-vat-chat');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
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
  );
}
