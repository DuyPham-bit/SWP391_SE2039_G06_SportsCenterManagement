import React from 'react';

export function ZonesSection({ facilitiesList, hours, isEn }) {
  return (
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
  );
}
