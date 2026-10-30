import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Component Xác thực mã OTP 6 chữ số
 * Tái tạo chính xác 100% theo ảnh 2, 3, 4:
 * - Ảnh 2 (Normal / Verifying):
 *   + Icon ổ khóa tím trong vòng tròn có viền cung tiến trình (progress arc)
 *   + 6 ô hình chữ nhật đứng (squircle card) bo góc 20px với viền tím đậm đặc trưng
 *   + Từng số đen đậm, phía dưới có thanh gạch chân (underline bar) màu tím
 *   + Nút xanh tím "Verifying" có vòng xoay spinner
 *   + Dòng chữ "Didn't get a code? ⭮ Resend in 0:xx"
 * - Ảnh 3 (You're verified / Success):
 *   + Icon chuyển sang hình tròn xanh lá lớn có vòng hào quang (ring halo) + dấu tích trắng
 *   + Tất cả 6 ô thẻ chuyển thành nền XANH LÁ ĐẶC số TRẮNG
 *   + Nút xanh lá "Continue →"
 * - Ảnh 4 (Error / Wrong Code):
 *   + Toàn bộ số chuyển màu ĐỎ, viền ô màu ĐỎ, thanh gạch chân màu ĐỎ
 *   + Báo lỗi tròn đỏ: "! That code didn't match. Try again."
 *   + Nút "Verify code"
 */

// Icon Ổ khóa viền tím (Ảnh 2 & 4)
function LockIcon({ className = "w-7 h-7 text-[#4338ca]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="10.5" width="17" height="11" rx="3" ry="3" />
      <path d="M7 10.5V7a5 5 0 0 1 10 0v3.5" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" />
    </svg>
  );
}

// Icon Dấu tích trắng (Ảnh 3)
function CheckIcon({ className = "w-8 h-8 text-white" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Icon Chấm than đỏ dạng badge (Ảnh 4)
function ErrorExclamationBadge() {
  return (
    <span className="w-4 h-4 rounded-full bg-[#dc2626] text-white flex items-center justify-center text-[10px] font-black shrink-0">
      !
    </span>
  );
}

// Icon Spinner xoay tròn (Ảnh 2)
function SpinnerIcon({ className = "w-4 h-4 animate-spin text-white" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function OtpVerification({
  email = "s••••••@gmail.com",
  onVerifySuccess,
  onResendCode,
  correctCode = "123456", // Mã kiểm tra mẫu
  initialTimer = 27,
  onClose
}) {
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [activeInput, setActiveInput] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(initialTimer);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRefs = useRef([]);

  // Bộ đếm ngược Resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Tự focus ô đầu tiên
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Xử lý khi gõ từng số
  const handleChange = (e, index) => {
    const value = e.target.value;
    if (value && !/^\d+$/.test(value)) return;

    setHasError(false);
    setErrorMessage("");
    const newOtp = [...otp];
    newOtp[index] = value ? value.slice(-1) : "";
    setOtp(newOtp);

    // Nhảy sang ô kế tiếp
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }

    // Tự động kiểm tra khi đủ 6 số
    const combinedOtp = newOtp.join("");
    if (combinedOtp.length === OTP_LENGTH) {
      triggerVerification(combinedOtp);
    }
  };

  // Xử lý Backspace & mũi tên
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      setHasError(false);
      setErrorMessage("");
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
        setActiveInput(index - 1);
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setActiveInput(index - 1);
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setActiveInput(index + 1);
    }
  };

  // Hỗ trợ Paste trực tiếp 6 số từ clipboard (Ctrl+V)
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d+$/.test(pastedData)) return;

    setHasError(false);
    setErrorMessage("");
    const digits = pastedData.slice(0, OTP_LENGTH).split("");
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      newOtp[idx] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
    setActiveInput(nextIndex);

    if (digits.length === OTP_LENGTH) {
      triggerVerification(newOtp.join(""));
    }
  };

  // Kích hoạt xác thực mã OTP
  const triggerVerification = async (code) => {
    setIsVerifying(true);
    setHasError(false);
    setErrorMessage("");

    try {
      if (onVerifySuccess) {
        await onVerifySuccess(code);
        setIsVerified(true);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1300));
        if (code === correctCode) {
          setIsVerified(true);
        } else {
          // Kích hoạt trạng thái sai mã (Ảnh 4)
          setHasError(true);
          setErrorMessage("That code didn't match. Try again.");
          setShakeKey((prev) => prev + 1);
        }
      }
    } catch (err) {
      setHasError(true);
      setErrorMessage(err?.message || "That code didn't match. Try again.");
      setShakeKey((prev) => prev + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  // Gửi lại mã
  const handleResend = () => {
    if (timer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setHasError(false);
    setErrorMessage("");
    setTimer(initialTimer);
    inputRefs.current[0]?.focus();
    setActiveInput(0);
    if (onResendCode) {
      onResendCode();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7fc] p-4 font-sans select-none">
      {/* Khung Card chính (Bo góc mềm 36px, bóng đổ tím mờ như Ảnh 2, 3, 4) */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white p-7 sm:p-9 rounded-[36px] shadow-[0_22px_65px_-15px_rgba(99,102,241,0.16),0_0_0_1px_rgba(240,242,255,0.9)] w-full max-w-[430px] text-center relative"
      >
        {/* Nút đóng nếu có onClose */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <span className="text-sm font-bold">✕</span>
          </button>
        )}

        {/* 1. TOP ICON BADGE (Ảnh 2/4 vs Ảnh 3) */}
        <div className="relative mx-auto mb-5 w-[76px] h-[76px] flex items-center justify-center">
          {isVerified ? (
            /* Ảnh 3: Hình tròn xanh lá đặc + Dấu tích trắng + Vòng hào quang xanh */
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
              className="w-[74px] h-[74px] rounded-full bg-[#10b981] flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-[8px] ring-emerald-100/80"
            >
              <CheckIcon className="w-8 h-8 text-white" />
            </motion.div>
          ) : (
            /* Ảnh 2 & 4: Icon Ổ khóa tím + Vòng cung tiến trình phía trên */
            <div className="relative w-[74px] h-[74px] rounded-full bg-[#f4f3ff] flex items-center justify-center shadow-inner">
              {/* Vòng cung viền tím ở góc trên (Progress Arc) */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 74 74">
                <circle
                  cx="37"
                  cy="37"
                  r="35"
                  fill="none"
                  stroke="#4338ca"
                  strokeWidth="2.4"
                  strokeDasharray="220"
                  strokeDashoffset="145"
                  strokeLinecap="round"
                />
              </svg>
              <LockIcon className="w-7 h-7 text-[#4338ca]" />
            </div>
          )}
        </div>

        {/* 2. TIÊU ĐỀ & MÔ TẢ (Ảnh 2, 3, 4) */}
        <h2 className="text-2xl sm:text-[27px] font-black text-gray-900 tracking-tight mb-2">
          {isVerified ? "You're verified" : "Verify it's you"}
        </h2>

        <p className="text-xs sm:text-sm text-gray-500 mb-7 leading-relaxed font-normal">
          {isVerified ? (
            <span className="text-gray-400">Tài khoản của bạn đã được xác minh an toàn.</span>
          ) : (
            <>
              Enter the 6-digit code we just sent to <br />
              <strong className="font-bold text-gray-900">{email}</strong>
            </>
          )}
        </p>

        {/* 3. 6 Ô THẺ SỐ (SQUIRCLE CARDS NHƯ ẢNH 2, 3, 4) */}
        <motion.div
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.35 }}
          className="flex justify-center items-center gap-2 sm:gap-2.5 mb-5"
        >
          {otp.map((digit, index) => {
            const isFocused = activeInput === index && !isVerified;

            /*
              Styling chuẩn xác 3 trạng thái:
              - Verified (Ảnh 3): nền xanh lá đặc #10b981, viền xanh lá, chữ trắng
              - Error (Ảnh 4): nền trắng, viền đỏ #f87171, chữ đỏ #dc2626, gạch chân đỏ
              - Normal (Ảnh 2): nền trắng, viền tím đặc trưng #4338ca, chữ đen #111827, gạch chân tím
            */
            let boxStyle = "bg-white border-2 border-[#3730a3] text-gray-900";
            let underlineStyle = "bg-[#3730a3]";

            if (isVerified) {
              boxStyle = "bg-[#10b981] border-2 border-[#10b981] text-white shadow-md shadow-emerald-500/25";
              underlineStyle = "opacity-0";
            } else if (hasError) {
              boxStyle = "bg-white border-2 border-[#f87171] text-[#dc2626] shadow-xs";
              underlineStyle = "bg-[#dc2626]";
            } else if (isFocused) {
              boxStyle = "bg-white border-2 border-[#4f46e5] text-gray-900 ring-4 ring-indigo-500/20 shadow-sm scale-[1.04]";
              underlineStyle = "bg-[#4f46e5]";
            } else if (!digit) {
              boxStyle = "bg-white border-2 border-[#3730a3] text-gray-900";
              underlineStyle = "bg-[#3730a3]";
            }

            return (
              <div key={index} className="flex flex-col items-center">
                <input
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  disabled={isVerifying || isVerified}
                  value={digit}
                  onFocus={() => setActiveInput(index)}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className={`w-[48px] h-[66px] sm:w-[54px] sm:h-[72px] rounded-[20px] text-center text-2xl sm:text-3xl font-extrabold focus:outline-none transition-all duration-150 cursor-text ${boxStyle}`}
                />

                {/* Thanh gạch chân bên dưới số (Underline bar) */}
                <div
                  className={`w-5 h-[2.5px] rounded-full mt-2 transition-all duration-200 ${underlineStyle}`}
                />
              </div>
            );
          })}
        </motion.div>

        {/* 4. THÔNG BÁO LỖI (Ảnh 4: "! That code didn't match. Try again.") */}
        <AnimatePresence>
          {hasError && errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center justify-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#dc2626] mb-5"
            >
              <ErrorExclamationBadge />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. NÚT HÀNH ĐỘNG CHÍNH (Ảnh 2, 3, 4) */}
        <div className="mb-5 mt-1">
          {isVerified ? (
            /* Ảnh 3: Nút "Continue →" màu xanh lá đặc */
            <button
              type="button"
              onClick={() => {
                if (typeof onVerifySuccess === 'function') {
                  onVerifySuccess(otp.join(''));
                } else if (typeof onClose === 'function') {
                  onClose();
                }
              }}
              className="w-full h-[52px] rounded-[18px] font-bold text-white bg-[#10b981] hover:bg-[#059669] shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer text-base"
            >
              <span>Continue</span>
              <span className="text-xl">→</span>
            </button>
          ) : isVerifying ? (
            /* Ảnh 2: Nút "Verifying" xoay spinner */
            <button
              type="button"
              disabled
              className="w-full h-[52px] rounded-[18px] font-bold text-white bg-[#4f46e5] opacity-95 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2.5 cursor-wait text-base"
            >
              <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
              <span className="tracking-wide">Verifying</span>
            </button>
          ) : (
            /* Ảnh 4: Nút "Verify code" màu xanh tím */
            <button
              type="button"
              onClick={() => {
                const combinedOtp = otp.join("");
                if (combinedOtp.length === OTP_LENGTH) {
                  triggerVerification(combinedOtp);
                } else {
                  inputRefs.current[otp.findIndex((v) => !v) || 0]?.focus();
                }
              }}
              className="w-full h-[52px] rounded-[18px] font-bold text-white bg-[#4f46e5] hover:bg-[#4338ca] shadow-lg shadow-indigo-500/30 flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer text-base"
            >
              <span>Verify code</span>
            </button>
          )}
        </div>

        {/* 6. DÒNG RESEND Ở CHÂN (Ảnh 2 & 4: "Didn't get a code? ⭮ Resend in 0:27") */}
        {!isVerified && (
          <div className="text-xs sm:text-[13px] text-gray-500 flex items-center justify-center gap-1.5">
            <span>Didn't get a code?</span>
            {timer > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-gray-900">
                <svg className="w-3.5 h-3.5 text-[#4338ca] animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Resend in 0:{timer < 10 ? `0${timer}` : timer}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-bold text-[#4f46e5] hover:underline cursor-pointer focus:outline-none"
              >
                Resend now
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
