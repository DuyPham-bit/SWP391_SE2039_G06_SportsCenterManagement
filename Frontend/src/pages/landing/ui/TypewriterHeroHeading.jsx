import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';

const SCMS_SLOGANS_VI = [
  "LÊN MỘT BẬC HÀNH TRÌNH FITNESS",
  "BỨT PHÁ GIỚI HẠN THỂ CHẤT CÙNG SCMS",
  "HỆ THỐNG ĐA BỘ MÔN CHUẨN OLYMPIC",
  "ĐỒNG HÀNH CÙNG ĐỘI NGŨ HLV CHUYÊN NGHIỆP"
];

const SCMS_SLOGANS_EN = [
  "ELEVATE YOUR FITNESS JOURNEY",
  "PUSH YOUR PHYSICAL LIMITS WITH SCMS",
  "OLYMPIC-STANDARD MULTI-SPORT SYSTEM",
  "TRAIN WITH PROFESSIONAL CERTIFIED COACHES"
];

export function TypewriterHeroHeading({ heroBadge, heroTitle }) {
  const customTitle = typeof heroTitle === 'string' ? heroTitle.trim() : '';
  const { language } = useLanguage();
  const isEn = language === 'en';
  const slogans = isEn ? SCMS_SLOGANS_EN : SCMS_SLOGANS_VI;

  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // Chờ tiêu đề chính trượt lên hoàn tất rồi mới bắt đầu gõ chữ
  useEffect(() => {
    const startTimer = setTimeout(() => {
      setHasStartedTyping(true);
    }, 1300);
    return () => clearTimeout(startTimer);
  }, []);

  // Hiệu ứng Typewriter tự động gõ và xóa câu
  useEffect(() => {
    if (!hasStartedTyping) return;

    const currentWord = slogans[wordIndex] || slogans[0];
    let timer;
    let speed = isDeleting ? 35 : 70;

    if (!isDeleting && charIndex === currentWord.length) {
      speed = 1800; // Dừng lại 1.8s sau khi gõ xong 1 câu
      timer = setTimeout(() => setIsDeleting(true), speed);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % slogans.length);
      speed = 400; // Nghỉ 0.4s trước khi gõ câu tiếp
      timer = setTimeout(() => {}, speed);
    } else {
      timer = setTimeout(() => {
        setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [hasStartedTyping, charIndex, isDeleting, wordIndex, slogans]);

  // Reset khi đổi ngôn ngữ
  useEffect(() => {
    setWordIndex(0);
    setCharIndex(0);
    setIsDeleting(false);
  }, [language]);

  const displayedText = (slogans[wordIndex] || '').substring(0, charIndex);

  const displayBadge = heroBadge && heroBadge.length <= 30
    ? heroBadge
    : (isEn ? 'SCMS OLYMPIC ARENA' : 'TRUNG TÂM THỂ THAO SCMS');

  return (
    <div
      className="flex flex-col items-center text-center max-w-5xl mx-auto px-4 select-none"
      style={{ fontFamily: "'Archivo', 'Be Vietnam Pro', system-ui, sans-serif" }}
    >
      {/* 1. Badge tinh gọn phía trên */}
      <div className="hero-badge scms-hero-sub mb-3 sm:mb-4">
        <span className="hero-badge-dot" />
        {displayBadge}
      </div>

      {/* 2. Tiêu đề chính thể thao cao cấp: Bố cục 2 dòng tinh gọn, loại bỏ chữ thừa */}
      <h1
        className="text-center font-black uppercase text-white tracking-tight"
        style={{
          fontFamily: "'Archivo', 'Be Vietnam Pro', system-ui, sans-serif",
          textShadow: '0 4px 28px rgba(0, 0, 0, 0.9)',
          lineHeight: '1.25'
        }}
      >
        {/* A manager-published title replaces the default two-line headline. */}
        {customTitle ? (
          <span className="scms-hero-line-1 block text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white break-words">
            {customTitle}
          </span>
        ) : (<>
        {/* Dòng 1: ĐI ĐẦU VỀ TẬP LUYỆN */}
        <span className="scms-hero-line-1 block text-2xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 font-black tracking-tight text-white">
          {isEn ? 'PIONEERING IN' : 'ĐI ĐẦU VỀ TẬP LUYỆN'}
        </span>

        {/* Dòng 2: Cặp thẻ đôi cân xứng [NHÓM] & [CÁ NHÂN] tinh tế */}
        <span className="scms-hero-line-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xl sm:text-3xl md:text-4xl lg:text-5xl">
          <span className="scms-highlight-primary">
            {isEn ? 'GROUP' : 'NHÓM'}
          </span>
          <span
            className="font-bold text-brand-sand-300 px-1"
            style={{ textShadow: '0 2px 10px rgba(242, 204, 143, 0.4)' }}
          >
            &
          </span>
          <span className="scms-highlight-accent">
            {isEn ? 'PERSONAL' : 'CÁ NHÂN'}
          </span>
        </span>
        </>)}
      </h1>

      {/* 3. Hiệu ứng Typewriter gõ chữ với màu vàng đồng Warm Gold thương hiệu */}
      <div
        className="scms-hero-typewriter mt-4 sm:mt-5 min-h-[38px] flex items-center justify-center text-xs sm:text-base md:text-lg font-bold tracking-wider uppercase text-white"
        style={{ fontFamily: "'Archivo', 'Be Vietnam Pro', system-ui, sans-serif" }}
      >
        <span className="text-white/85 mr-2" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
          {isEn ? 'READY TO:' : 'SẴN SÀNG ĐỂ:'}
        </span>
        <span
          className="font-extrabold"
          style={{
            color: '#F2CC8F',
            textShadow: '0 2px 14px rgba(242, 204, 143, 0.5)'
          }}
        >
          {displayedText}
        </span>
        <span className="scms-hero-cursor ml-1">|</span>
      </div>
    </div>
  );
}
