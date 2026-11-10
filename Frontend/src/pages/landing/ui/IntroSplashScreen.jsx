import React, { useState, useEffect, useRef } from 'react';

// Cấu trúc 3 cột chữ OLYMPIC SPORTS ARENA định vị trên vành cung không gian 3D (Cylindrical Arc)
// Phân bổ góc xoay cân xứng (-28°, 0°, +28°) tạo hiệu ứng vòm khán đài Olympic
const OLYMPIC_COLUMNS = [
  {
    key: 'col-olympic',
    angleDeg: -28,
    zDepth: 260,
    accentColor: '#3FAEB8',
    glowColor: 'rgba(63, 174, 184, 0.95)',
    shadowColor: 'rgba(36, 130, 143, 0.65)',
    topTextClass: 'text-brand-teal-500',
    rowStyles: [
      'text-cyan-200/90 font-bold',
      'text-teal-200/80 font-semibold',
      'text-teal-200/65 font-medium',
      'text-teal-300/50 font-normal',
      'text-teal-300/35 font-normal',
      'text-teal-400/22 font-normal'
    ],
    letters: ['O', 'L', 'Y', 'M', 'P', 'I', 'C']
  },
  {
    key: 'col-sports',
    angleDeg: 0,
    zDepth: 275,
    accentColor: '#81B29A',
    glowColor: 'rgba(129, 178, 154, 0.95)',
    shadowColor: 'rgba(45, 106, 79, 0.65)',
    topTextClass: 'text-brand-sage-500',
    rowStyles: [
      'text-emerald-200/90 font-bold',
      'text-emerald-200/80 font-semibold',
      'text-emerald-300/65 font-medium',
      'text-emerald-300/50 font-normal',
      'text-emerald-400/25 font-normal'
    ],
    letters: ['S', 'P', 'O', 'R', 'T', 'S']
  },
  {
    key: 'col-arena',
    angleDeg: 28,
    zDepth: 260,
    accentColor: '#F2CC8F',
    glowColor: 'rgba(242, 204, 143, 0.95)',
    shadowColor: 'rgba(229, 163, 60, 0.65)',
    topTextClass: 'text-brand-sand-300',
    rowStyles: [
      'text-amber-200/90 font-bold',
      'text-amber-200/80 font-semibold',
      'text-amber-300/60 font-medium',
      'text-amber-400/30 font-normal'
    ],
    letters: ['A', 'R', 'E', 'N', 'A']
  }
];

export function IntroSplashScreen({ onFinish, duration = 4000 }) {
  const [isExiting, setIsExiting] = useState(false);
  const [showFullWords, setShowFullWords] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const tickerRef = useRef(null);

  useEffect(() => {
    // Khóa cuộn trang khi đang hiển thị intro
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cập nhật đồng hồ bấm giờ thể thao trực tiếp qua DOM (requestAnimationFrame)
    let animFrameId;
    const startTimestamp = performance.now();

    const updateTimer = (now) => {
      const elapsed = now - startTimestamp;
      if (elapsed >= 1900) {
        if (tickerRef.current) tickerRef.current.textContent = '00:01.40';
        return;
      }
      const secs = Math.floor(elapsed / 1000).toString().padStart(2, '0');
      const ms = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
      if (tickerRef.current) {
        tickerRef.current.textContent = `00:${secs}.${ms}`;
      }
      animFrameId = requestAnimationFrame(updateTimer);
    };

    animFrameId = requestAnimationFrame(updateTimer);

    // GIAI ĐOẠN 1: Ban đầu chỉ hiện 3 chữ cái O - S - A và xoay mượt 1 vòng 360 độ (1.35s).
    // GIAI ĐOẠN 2: Khi xoay xong 1 vòng, kích hoạt tuôn rơi toàn bộ chữ (full words OLYMPIC SPORTS ARENA)!
    const wordsTimer = setTimeout(() => {
      setShowFullWords(true);
    }, 1350);

    // GIAI ĐOẠN 3: Khóa vị trí và bùng sáng 3 gam màu nhận diện thương hiệu Olympic (1.9s)
    const lockTimer = setTimeout(() => {
      setIsLocked(true);
    }, 1900);

    // Kích hoạt rèm trượt lên trên (slide-up reveal) ở giây thứ 2.75
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(1400, duration - 550));

    // Kết thúc và tháo gỡ intro screen
    const finishTimer = setTimeout(() => {
      document.body.style.overflow = originalOverflow;
      if (onFinish) onFinish();
    }, duration);

    // Bấm phím bất kỳ để bỏ qua nhanh
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        triggerExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(wordsTimer);
      clearTimeout(lockTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [duration, onFinish]);

  const triggerExit = (e) => {
    if (e && e.cancelable && e.type === 'touchend') {
      e.preventDefault();
    }
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 450);
  };

  return (
    <div
      onClick={triggerExit}
      onTouchEnd={triggerExit}
      role="banner"
      aria-label="Olympic Sports Arena 3D Preloader"
      className={`fixed inset-0 z-[99999] w-full h-full min-h-screen min-h-[100dvh] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] scms-intro-backdrop ${
        isExiting
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
      style={{
        backgroundColor: 'rgba(9, 15, 22, 0.92)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
        WebkitTransform: isExiting ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 0, 0)',
        transform: isExiting ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 0, 0)',
        willChange: 'transform, opacity',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      title="Bấm để vào nhanh (Click / Space to skip)"
    >
      {/* 1. Hiệu ứng thể thao: Ánh đèn sân vận động đa sắc (Olympic Tri-Color Spotlights) */}
      <div
        className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-br from-brand-teal-600/25 to-transparent blur-[80px] sm:blur-[120px] pointer-events-none"
      />
      <div
        className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-tl from-brand-sand-300/20 to-transparent blur-[80px] sm:blur-[120px] pointer-events-none"
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[480px] h-[380px] sm:h-[480px] rounded-full bg-gradient-to-tr from-brand-sage-700/15 via-transparent to-brand-teal-500/10 blur-[100px] pointer-events-none"
      />

      {/* 2. Khung chữ 3D: Hiện O - S - A trước, xoay 1 vòng tròn 360 độ rồi tuôn rơi toàn bộ OLYMPIC SPORTS ARENA */}
      <div className="scms-3d-stage relative flex items-center justify-center w-full px-2 sm:px-4 overflow-visible scale-[0.78] xs:scale-[0.88] sm:scale-95 md:scale-100">
        {/* Khung chữ 3D: Cả 3 cột chữ đều căn thẳng hàng ngang ở đỉnh (top-0) để O - S - A hoàn toàn đều nhau */}
        <div
          className="scms-spinner-1turn flex items-start justify-center w-[280px] sm:w-[320px] md:w-[340px] h-[460px] sm:h-[500px] md:h-[520px]"
          style={{
            fontFamily: "'Archivo', 'Be Vietnam Pro', system-ui, sans-serif",
            WebkitTransformStyle: 'preserve-3d',
            transformStyle: 'preserve-3d'
          }}
        >
          {OLYMPIC_COLUMNS.map((col) => {
            return (
              <div
                key={col.key}
                className="absolute top-0 flex flex-col items-center justify-start gap-2.5 sm:gap-3 md:gap-4 select-none tracking-[0.2em] sm:tracking-[0.25em]"
                style={{
                  WebkitTransformStyle: 'preserve-3d',
                  transformStyle: 'preserve-3d',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                  WebkitTransform: `rotateY(${col.angleDeg}deg) translateZ(${col.zDepth}px)`,
                  transform: `rotateY(${col.angleDeg}deg) translateZ(${col.zDepth}px)`,
                  willChange: 'transform'
                }}
              >
                {col.letters.map((char, rowIdx) => {
                  const isTopHeader = rowIdx === 0;

                  // Hàng đầu tiên (O - S - A): Luôn hiển thị trong lúc xoay 1 vòng
                  if (isTopHeader) {
                    const topColor = isLocked
                      ? `${col.topTextClass} font-black scale-110`
                      : 'text-white font-bold';

                    return (
                      <span
                        key={`${col.key}-${rowIdx}`}
                        className={`scms-letter-cell flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-2xl sm:text-3xl md:text-4xl transition-all duration-500 ${topColor}`}
                        style={{
                          opacity: 1,
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden',
                          WebkitFontSmoothing: 'antialiased',
                          textShadow: isLocked
                            ? `0 0 24px ${col.glowColor}, 0 0 45px ${col.shadowColor}`
                            : '0 0 14px rgba(255, 255, 255, 0.75)'
                        }}
                      >
                        {char}
                      </span>
                    );
                  }

                  // Các ký tự bên dưới (L-Y-M-P-I-C, P-O-R-T-S, R-E-N-A):
                  // Xuất hiện sau khi đã xoay xong 1 vòng tròn (showFullWords = true) với điểm nhấn màu đặc trưng
                  const customOpacity = Math.max(0.18, 0.95 - (rowIdx - 1) * 0.13);
                  const styleClass = col.rowStyles[rowIdx - 1] || 'text-white/20 font-normal';

                  return (
                    <span
                      key={`${col.key}-${rowIdx}`}
                      className={`scms-letter-cell flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 text-2xl sm:text-3xl md:text-4xl transition-all duration-500 ease-out ${styleClass}`}
                      style={{
                        opacity: showFullWords ? customOpacity : 0,
                        WebkitTransform: showFullWords ? 'translateY(0)' : 'translateY(-16px)',
                        transform: showFullWords ? 'translateY(0)' : 'translateY(-16px)',
                        transitionDelay: `${rowIdx * 50}ms`,
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'antialiased',
                        textShadow: showFullWords && rowIdx <= 2
                          ? `0 0 14px ${col.accentColor}40`
                          : 'none'
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Hiệu ứng thể thao: Đồng hồ điện tử bấm giờ mili-giây (Olympic Timing Meter & Tri-Color Badge) */}
      <div className="absolute bottom-6 sm:bottom-10 md:bottom-12 pb-[env(safe-area-inset-bottom,0px)] flex flex-col items-center gap-1.5 font-mono text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white/50 pointer-events-none">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
              isLocked
                ? 'bg-gradient-to-r from-brand-teal-500 via-brand-sage-500 to-brand-sand-300 shadow-[0_0_12px_#81B29A]'
                : 'bg-brand-sand-300 animate-ping'
            }`}
          />
          <span ref={tickerRef} className="font-semibold text-white/85 tracking-widest">00:00.00</span>
          <span className="text-white/30">•</span>
          <span
            className={`transition-all duration-500 ${
              isLocked
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-teal-500 via-brand-sage-500 to-brand-sand-300 font-black tracking-wider drop-shadow-sm'
                : 'text-white/40 font-medium'
            }`}
          >
            {isLocked ? 'OLYMPIC SPORTS ARENA' : 'SYSTEM INITIALIZING'}
          </span>
        </div>
        <span className="text-[9px] text-white/40 tracking-[0.25em] sm:tracking-[0.3em]">
          BẤM MÀN HÌNH / SPACE ĐỂ TIẾP TỤC
        </span>
      </div>
    </div>
  );
}

export default IntroSplashScreen;
