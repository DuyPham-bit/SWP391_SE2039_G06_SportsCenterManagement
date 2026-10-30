import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../app/providers/LanguageContext.jsx';

const SCMS_SLOGANS_VI = [
  "LÊN MỘT BẬC HÀNH TRÌNH FITNESS",
  "BỨT PHÁ GIỚI HẠN THỂ CHẤT CÙNG SCMS",
  "HỆ THỐNG ĐA BỘ MÔN CHUẨN OLYMPIC",
  "ĐỒNG HÀNH CÙNG ĐỘI NGŨ HLV CHUYÊN NGHIỆP",
  "TẬP LUYỆN CÁ NHÂN & NHÓM ĐẲNG CẤP"
];

const SCMS_SLOGANS_EN = [
  "ELEVATE YOUR FITNESS JOURNEY",
  "PUSH YOUR PHYSICAL LIMITS WITH SCMS",
  "OLYMPIC-STANDARD MULTI-SPORT SYSTEM",
  "TRAIN WITH PROFESSIONAL CERTIFIED COACHES",
  "ELITE PERSONAL & GROUP TRAINING"
];

export function TypewriterHeroHeading({ heroBadge }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const slogans = isEn ? SCMS_SLOGANS_EN : SCMS_SLOGANS_VI;

  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // Chờ tiêu đề chính trượt lên xong (1.3s) rồi mới bắt đầu gõ chữ
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

  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto px-4 select-none">
      {/* 1. Dòng chào mừng trên cùng trượt lên */}
      <p className="scms-hero-sub text-xs sm:text-sm font-bold tracking-[0.25em] sm:tracking-[0.35em] uppercase text-red-300 mb-3 drop-shadow">
        {heroBadge || (isEn ? 'WELCOME TO SCMS SPORTS COMPLEX' : 'CHÀO MỪNG BẠN ĐẾN TRUNG TÂM THỂ THAO SCMS')}
      </p>

      {/* 2. Tiêu đề chính dạng Khối Highlight Thể thao (Đỏ & Trắng) trượt lên nối tiếp */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight sm:leading-snug drop-shadow-lg">
        <span className="scms-hero-line-1 block mb-2">
          {isEn ? 'PIONEERING IN' : 'ĐI ĐẦU VỀ TẬP LUYỆN'}{' '}
          <span className="scms-highlight-red">
            {isEn ? 'SMALL GROUP' : 'NHÓM NHỎ'}
          </span>
        </span>
        <span className="scms-hero-line-2 block">
          &{' '}
          <span className="scms-highlight-white">
            {isEn ? 'PERSONAL 1:1' : 'CÁ NHÂN'}
          </span>{' '}
          {isEn ? 'TRAINING IN VIETNAM' : 'TẠI VIỆT NAM'}
        </span>
      </h1>

      {/* 3. Hiệu ứng Typewriter gõ chữ tự động với con trỏ nhấp nháy */}
      <div className="scms-hero-typewriter mt-5 sm:mt-6 min-h-[38px] flex items-center justify-center text-sm sm:text-xl font-bold tracking-wider uppercase text-slate-100 drop-shadow">
        <span className="text-slate-200 mr-2">
          {isEn ? 'READY TO:' : 'SẴN SÀNG ĐỂ:'}
        </span>
        <span className="text-red-400 font-extrabold">{displayedText}</span>
        <span className="scms-hero-cursor ml-0.5">|</span>
      </div>
    </div>
  );
}
