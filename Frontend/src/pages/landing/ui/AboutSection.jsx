import React from 'react';
import { AnimatedNumber } from './AnimatedNumber.jsx';

/** Auto-counted cards read their number from the database counts (s1 = facilities, s2 = sports). */
function statNumber(card, stats) {
  if (!card.isAutoCount) return card.number;
  if (card.id === 's1') return stats?.facilities?.visible ?? card.number;
  if (card.id === 's2') return stats?.sports?.visible ?? card.number;
  return card.number;
}

/** "Why choose us": every text is published content in the selected language. */
export function AboutSection({ landingContent, stats }) {
  const whyUs = landingContent?.whyUs || {};
  const features = whyUs.features || [];
  const statCards = whyUs.stats || [];
  const trust = whyUs.trustBanner || {};

  return (
    <section className="about-section" id="ve-chung-toi">
      <div className="about-container">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',gap:'clamp(32px, 6vw, 60px)',alignItems:'start'}}>
          {/* Left Column */}
          <div className="tiya-reveal" style={{display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
            {whyUs.badge && (
              <div className="about-badge">
                <span className="material-symbols-outlined" style={{fontSize:'16px'}}>verified</span>
                {whyUs.badge}
              </div>
            )}
            <h2 className="about-title">{whyUs.title}</h2>
            {whyUs.description && <p className="about-desc">{whyUs.description}</p>}

            <div style={{width:'100%',marginTop:'20px'}}>
              {features.map((feat, idx) => (
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

          {/* Right Column: stat cards */}
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
              {statCards.map((st, idx) => (
                <div key={st.id || idx} className={`about-stat-card tiya-reveal tiya-delay-${idx + 1}`}>
                  <div className="about-stat-card__bg-icon">
                    <span className="material-symbols-outlined" style={{fontSize:'90px'}}>{st.icon}</span>
                  </div>
                  <div className="about-stat-card__icon">
                    <span className="material-symbols-outlined" style={{fontSize:'22px'}}>{st.icon}</span>
                  </div>
                  <div className="about-stat-card__number">
                    <AnimatedNumber value={statNumber(st, stats) ?? 0} duration={1200} suffix={st.suffix} formatThousands={Boolean(st.formatThousands)} />
                  </div>
                  <div className="about-stat-card__title">{st.title}</div>
                  <div className="about-stat-card__sub">{st.subtitle}</div>
                </div>
              ))}
            </div>

            {(trust.title || trust.description) && (
              <div className="tiya-trust-strip tiya-reveal tiya-delay-4" style={{marginTop:'20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <span className="material-symbols-outlined" style={{fontSize:'28px',color:'var(--primary-color)'}}>verified_user</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:'13px',color:'var(--dark-color)'}}>{trust.title}</div>
                    <div style={{fontSize:'12px',color:'var(--p-color)'}}>{trust.description}</div>
                  </div>
                </div>
                {trust.certificate && <span className="tiya-trust-strip__badge">{trust.certificate}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
