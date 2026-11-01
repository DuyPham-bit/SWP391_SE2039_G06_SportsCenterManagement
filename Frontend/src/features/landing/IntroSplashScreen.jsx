import React, { useState, useEffect, useRef } from 'react';

// Cấu trúc 4 cột chữ SCMS định vị trên vành cung không gian 3D (Cylindrical Arc)
// Bán kính R = 250px giúp 4 cột phân bổ góc xoay (-36°, -12°, +12°, +36°)
const SCMS_COLUMNS = [
  {
    key: 'col-s1',
    angleDeg: -36,
    zDepth: 250,
    letters: ['S', 'P', 'O', 'R', 'T', 'S']
  },
  {
    key: 'col-c',
    angleDeg: -12,
    zDepth: 260,
    letters: ['C', 'E', 'N', 'T', 'E', 'R']
  },
  {
    key: 'col-m',
    angleDeg: 12,
    zDepth: 260,
    letters: ['M', 'A', 'N', 'A', 'G', 'E', 'M', 'E', 'N', 'T']
  },
  {
    key: 'col-s2',
    angleDeg: 36,
    zDepth: 250,
    letters: ['S', 'Y', 'S', 'T', 'E', 'M']
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

    // GIAI ĐOẠN 1: Ban đầu chỉ hiện 4 chữ cái SCMS và xoay mượt 1 vòng 360 độ (1.35s).
    // GIAI ĐOẠN 2: Khi xoay xong 1 vòng, kích hoạt tuôn rơi toàn bộ chữ (full words)!
    const wordsTimer = setTimeout(() => {
      setShowFullWords(true);
    }, 1350);

    // GIAI ĐOẠN 3: Khóa vị trí và phát sáng màu nhận diện thương hiệu SCMS (1.9s)
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
      aria-label="SCMS Athletic 3D Preloader"
      className={`fixed inset-0 z-[99999] w-full h-full min-h-screen min-h-[100dvh] flex flex-col items-center justify-center select-none cursor-pointer overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] scms-intro-backdrop ${
        isExiting
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
      style={{
        backgroundColor: 'rgba(9, 15, 22, 0.88)',
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
      {/* 1. Hiệu ứng thể thao: Ánh đèn sân vận động (Stadium Spotlights) góc chéo */}
      <div
        className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-br from-[#81B29A]/15 to-transparent blur-[80px] sm:blur-[120px] pointer-events-none"
      />
      <div
        className="absolute -bottom-32 -right-32 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-tl from-[#F2CC8F]/10 to-transparent blur-[80px] sm:blur-[120px] pointer-events-none"
      />

      {/* 2. Khung chữ 3D: Hiện SCMS trước, xoay đúng 1 vòng tròn 360 độ rồi mới tuôn rơi full chữ */}
      <div className="scms-3d-stage relative flex items-center justify-center w-full px-2 sm:px-4 overflow-visible scale-[0.72] xs:scale-[0.82] sm:scale-90 md:scale-100">
        {/* Khung chữ 3D: Cả 4 cột chữ đều căn thẳng hàng ngang ở đỉnh (top-0) để S C M S hoàn toàn đều nhau */}
        <div
          className="scms-spinner-1turn flex items-start justify-center w-[320px] sm:w-[360px] h-[460px] sm:h-[500px] md:h-[520px]"
          style={{
            fontFamily: "'Montserrat', 'Lexend', system-ui, -apple-system, sans-serif",
            WebkitTransformStyle: 'preserve-3d',
            transformStyle: 'preserve-3d'
          }}
        >
          {SCMS_COLUMNS.map((col) => {
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

                  // Hàng đầu tiên (S C M S): Luôn hiển thị trong lúc xoay 1 vòng
                  if (isTopHeader) {
                    const topColor = isLocked
                      ? 'text-[#81B29A] font-black drop-shadow-[0_0_24px_rgba(129,178,154,0.95)] scale-105'
                      : 'text-white font-bold drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]';

                    return (
                      <span
                        key={`${col.key}-${rowIdx}`}
                        className={`scms-letter-cell flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xl sm:text-2xl md:text-3xl transition-all duration-500 ${topColor}`}
                        style={{
                          opacity: 1,
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden',
                          WebkitFontSmoothing: 'antialiased',
                          textShadow: isLocked
                            ? '0 0 20px rgba(129, 178, 154, 0.95)'
                            : '0 0 12px rgba(255, 255, 255, 0.65)'
                        }}
                      >
                        {char}
                      </span>
                    );
                  }

                  // Các ký tự bên dưới (P-O-R-T-S, E-N-T-E-R, v.v.):
                  // Chỉ xuất hiện sau khi đã xoay xong 1 vòng tròn (showFullWords = true)
                  let customOpacity = Math.max(0.12, 0.9 - rowIdx * 0.12);
                  let textClasses = 'text-white/20 font-normal';

                  if (rowIdx === 1) textClasses = 'text-white/85 font-semibold';
                  else if (rowIdx === 2) textClasses = 'text-white/65 font-medium';
                  else if (rowIdx === 3) textClasses = 'text-white/45 font-normal';
                  else if (rowIdx === 4) textClasses = 'text-white/30 font-normal';
                  else textClasses = 'text-white/18 font-normal';

                  return (
                    <span
                      key={`${col.key}-${rowIdx}`}
                      className={`scms-letter-cell flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-xl sm:text-2xl md:text-3xl transition-all duration-500 ease-out ${textClasses}`}
                      style={{
                        opacity: showFullWords ? customOpacity : 0,
                        WebkitTransform: showFullWords ? 'translateY(0)' : 'translateY(-14px)',
                        transform: showFullWords ? 'translateY(0)' : 'translateY(-14px)',
                        transitionDelay: `${rowIdx * 50}ms`,
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'antialiased'
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

      {/* 3. Hiệu ứng thể thao: Đồng hồ điện tử bấm giờ mili-giây (Olympic Timing Meter) */}
      <div className="absolute bottom-6 sm:bottom-10 md:bottom-12 pb-[env(safe-area-inset-bottom,0px)] flex flex-col items-center gap-1 font-mono text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-white/50 pointer-events-none">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isLocked ? 'bg-[#81B29A] shadow-[0_0_8px_#81B29A]' : 'bg-[#F2CC8F] animate-ping'
            }`}
          />
          <span ref={tickerRef} className="font-semibold text-white/70">00:00.00</span>
          <span className="text-white/30">•</span>
          <span className={isLocked ? 'text-[#81B29A] font-bold' : 'text-white/40'}>
            {isLocked ? 'SYSTEM ACTIVE' : 'OLYMPIC ARENA'}
          </span>
        </div>
        <span className="text-[9px] text-white/40 mt-1 tracking-[0.25em] sm:tracking-[0.3em]">
          BẤM MÀN HÌNH / SPACE ĐỂ TIẾP TỤC
        </span>
      </div>
    </div>
  );
}
export default IntroSplashScreen;
