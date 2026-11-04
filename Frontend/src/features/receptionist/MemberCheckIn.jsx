import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { receptionApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { Badge } from '../../components/common/StatCard.js';
import { BusinessAlert } from '../../components/common/BusinessAlert.jsx';
import { Modal } from '../../components/common/Modal.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

/**
 * Extracts a clean member identifier from decoded QR code data.
 * Supports plain string (MEM-00001), JSON objects, and URLs with query parameters.
 */
function extractMemberIdentifier(scannedText) {
  if (!scannedText) return '';
  const text = String(scannedText).trim();

  // Handle JSON encoded QR
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.memberCode) return String(parsed.memberCode).trim();
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.code) return String(parsed.code).trim();
      if (parsed.identifier) return String(parsed.identifier).trim();
    } catch {
      // not json, fall back
    }
  }

  // Handle URL with query params (e.g. https://domain.com/#/checkin?code=MEM-00001)
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const url = new URL(text);
      const q = url.searchParams.get('query') || url.searchParams.get('code') || url.searchParams.get('memberCode') || url.searchParams.get('id');
      if (q) return q.trim();
    } catch {
      // fall back
    }
  }

  return text;
}

/**
 * Plays a POS/turnstile scanner chime using Web Audio API.
 */
function playScannerBeep(isSuccess = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Olympic turnstile pleasant chime (B5 -> E6)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Low warning tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Audio gesture policy fallback
  }
}

export function MemberCheckIn() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError, showWarning } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [checkIns, setCheckIns] = useState([]);
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [checkInError, setCheckInError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Scanner State
  const [activeScanMode, setActiveScanMode] = useState('camera'); // 'camera' | 'file' | 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState('');

  const html5QrCodeRef = useRef(null);
  const lastScannedTimeRef = useRef(0);
  const fileInputRef = useRef(null);

  // Unhappy Case Override Handling
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideApprover, setOverrideApprover] = useState(isEn ? 'Shift Manager' : 'Quản lý ca trực');
  const [failedIdentifier, setFailedIdentifier] = useState('');
  const [historyError, setHistoryError] = useState('');

  const loadData = async () => {
    try {
      const history = await receptionApi.getCheckInHistory();
      setCheckIns(history || []);
      setHistoryError('');
    } catch (error) {
      setHistoryError(error.message || (isEn ? 'Failed to load check-in log from server.' : 'Không thể tải nhật ký check-in từ hệ thống.'));
    }
  };

  const isIrCamera = (label) => /\b(ir|infrared|depth|hello)\b/i.test(label || '');

  // Discover available camera devices, prioritizing real RGB webcams over locked IR sensors
  const discoverCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Ưu tiên chọn:
        // 1. Camera sau (nếu là tablet/điện thoại di động)
        // 2. Camera RGB thông thường (loại trừ cảm biến IR / Windows Hello thường bị OS khóa độc quyền)
        // 3. Camera đầu tiên nếu không phân biệt được
        const backCamera = devices.find(d => /back|environment|rear|sau/i.test(d.label));
        const regularCamera = devices.find(d => !isIrCamera(d.label));
        const preferred = backCamera || regularCamera || devices[0];
        setSelectedCameraId(preferred.id);
      }
    } catch (err) {
      console.warn('Could not enumerate camera devices:', err);
    }
  };

  useEffect(() => {
    loadData();
    discoverCameras();

    const hash = window.location.hash || '';
    const match = hash.match(/[?&]query=([^&]+)/);
    if (match && match[1]) {
      setIdentifier(decodeURIComponent(match[1]));
    }

    return () => {
      // Clean up scanner on unmount
      if (html5QrCodeRef.current) {
        try {
          const state = html5QrCodeRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current?.clear();
            }).catch(() => {});
          } else {
            html5QrCodeRef.current?.clear();
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleExecuteCheckIn = async (memberToScan) => {
    const term = (memberToScan?.memberCode || memberToScan?.id || memberToScan || identifier || '').toString().trim();

    if (!term) {
      showWarning(
        isEn
          ? 'Please scan member QR code or enter Member ID / Phone number / Email.'
          : 'Vui lòng quét mã QR hoặc nhập mã thẻ / Số điện thoại / Email.'
      );
      setLastCheckIn(null);
      setCheckInError(null);
      return;
    }

    setProcessing(true);
    setCheckInError(null);
    setFailedIdentifier(term);
    try {
      const result = await receptionApi.checkInMember(term);
      setLastCheckIn(result);
      if (soundEnabled) playScannerBeep(true);
      showSuccess(
        isEn
          ? `Check-in successful: ${result.memberName} (${result.memberCode})`
          : `Check-in thành công: ${result.memberName} (${result.memberCode})`
      );
      setIdentifier('');
      await loadData();
    } catch (err) {
      if (soundEnabled) playScannerBeep(false);
      setCheckInError(err);
      setLastCheckIn(null);
      showError(err);
    } finally {
      setProcessing(false);
    }
  };

  // Triggered when a QR code is detected from camera or file
  const onQrDecoded = (decodedRaw) => {
    if (!decodedRaw) return;
    const cleanCode = extractMemberIdentifier(decodedRaw);
    if (!cleanCode) return;

    // Cooldown window of 3 seconds for the identical code
    const now = Date.now();
    if (cleanCode === lastScannedCode && now - lastScannedTimeRef.current < 3000) {
      return;
    }
    lastScannedTimeRef.current = now;
    setLastScannedCode(cleanCode);
    setIdentifier(cleanCode);

    if (autoSubmit) {
      handleExecuteCheckIn(cleanCode);
    } else {
      if (soundEnabled) playScannerBeep(true);
      showSuccess(isEn ? `Scanned code: ${cleanCode}` : `Đã quét được mã: ${cleanCode}`);
    }
  };

  // Start Live Camera Scanning with auto-fallback for busy/IR cameras
  const startCamera = async (camId, isRetryFallback = false) => {
    setScannerLoading(true);
    setScannerError(null);

    try {
      const elementId = 'olympic-camera-scanner';
      const container = document.getElementById(elementId);
      if (!container) {
        setScannerLoading(false);
        return;
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(elementId);
      }
      const scanner = html5QrCodeRef.current;

      if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
      }

      const activeCam = camId || selectedCameraId;
      const cameraConfig = activeCam ? { deviceId: { exact: activeCam } } : { facingMode: 'environment' };

      await scanner.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onQrDecoded(decodedText);
        },
        () => {
          // Frame-level scan tick
        }
      );

      setIsScanning(true);
      setScannerError(null);
    } catch (err) {
      console.error('Camera activation failed:', err);
      setIsScanning(false);

      const errStr = String(err?.message || err);
      const isDeviceInUse = err?.name === 'NotReadableError' || errStr.includes('NotReadableError') || errStr.includes('Device in use');
      const isDenied = err?.name === 'NotAllowedError' || errStr.includes('NotAllowedError');

      // Tự động fallback sang camera thông thường khác nếu thiết bị được chọn bị khóa (ví dụ cảm biến IR Windows Hello)
      if (isDeviceInUse && !isRetryFallback && cameras.length > 1) {
        const currentId = camId || selectedCameraId;
        const fallbackCam = cameras.find(c => c.id !== currentId && !isIrCamera(c.label))
                         || cameras.find(c => c.id !== currentId);
        if (fallbackCam) {
          console.warn(`[Camera] Device in use on ${currentId}. Auto-fallback to ${fallbackCam.label || fallbackCam.id}`);
          setSelectedCameraId(fallbackCam.id);
          return startCamera(fallbackCam.id, true);
        }
      }

      if (isDenied) {
        setScannerError({
          type: 'denied',
          title: isEn ? 'Camera Permission Denied' : 'Quyền truy cập Camera bị từ chối',
          message: isEn
            ? 'Camera access was blocked by browser. Please allow camera permissions in browser site settings.'
            : 'Trình duyệt đang chặn quyền máy ảnh. Vui lòng bấm vào biểu tượng ổ khóa/máy ảnh trên thanh địa chỉ URL để cấp quyền.'
        });
      } else if (isDeviceInUse) {
        setScannerError({
          type: 'device_in_use',
          title: isEn ? 'Camera Locked or in Use (Device in use)' : 'Camera đang bị ứng dụng khác chiếm dụng (Device in use)',
          message: isEn
            ? 'The webcam is currently locked by another application (Zoom, Teams, Zalo, OBS...) or by Windows Hello (IR sensor). Try closing other apps, switching camera below, or using card wedge / QR upload.'
            : 'Máy ảnh hiện đang bị chiếm dụng bởi ứng dụng khác (Zoom, Teams, Zalo, OBS...) hoặc là cảm biến IR Windows Hello đang bị hệ điều hành khóa. Bạn có thể đổi sang camera khác bên dưới hoặc dùng chế độ Nhập mã / Tải ảnh QR.'
        });
      } else {
        setScannerError({
          type: 'error',
          title: isEn ? 'Cannot Start Camera' : 'Không thể bật máy ảnh',
          message: isEn
            ? `Unable to start camera: ${errStr}. You can use image upload or type code.`
            : `Không thể bật máy ảnh: ${errStr}. Bạn có thể dùng tính năng Tải ảnh QR hoặc nhập mã bên dưới.`
        });
      }
    } finally {
      setScannerLoading(false);
    }
  };

  // Stop Live Camera Scanning
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
    setScannerLoading(false);
  };

  // Switch camera tab
  const handleTabChange = async (tab) => {
    if (activeScanMode === 'camera' && tab !== 'camera' && isScanning) {
      await stopCamera();
    }
    setActiveScanMode(tab);
    setScannerError(null);
  };

  // Scan QR from image file
  const handleScanImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScannerLoading(true);
    setScannerError(null);

    try {
      const elementId = 'olympic-camera-scanner';
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(elementId);
        html5QrCodeRef.current = scanner;
      } else if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
        setIsScanning(false);
      }

      const decodedText = await scanner.scanFile(file, true);
      if (decodedText) {
        onQrDecoded(decodedText);
      }
    } catch (err) {
      console.error('File scan error:', err);
      if (soundEnabled) playScannerBeep(false);
      setScannerError(
        isEn
          ? 'No valid QR code found in this photo. Please upload a clear picture of the member QR.'
          : 'Không phát hiện thấy mã QR hợp lệ trong ảnh này. Vui lòng thử ảnh chụp rõ nét hơn.'
      );
    } finally {
      setScannerLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOverrideCheckIn = async (e) => {
    e.preventDefault();
    if (!overrideApprover.trim()) {
      showWarning(isEn ? 'Please specify the assigned reviewer.' : 'Vui lòng chỉ định người được đề nghị xử lý.');
      return;
    }
    if (!overrideReason.trim()) {
      showWarning(isEn ? 'Please specify the reason for the check-in exception.' : 'Vui lòng ghi rõ lý do cần xử lý ngoại lệ check-in.');
      return;
    }
    setProcessing(true);
    try {
      const result = await receptionApi.requestCheckInReview(failedIdentifier || identifier, overrideReason, overrideApprover);
      setOverrideModalOpen(false);
      setOverrideReason('');
      showSuccess(
        isEn
          ? `Saved exception request #${result.request.id}. Track under Support Requests.`
          : `Đã lưu yêu cầu #${result.request.id} vào hệ thống. Theo dõi xử lý tại mục Yêu cầu hỗ trợ.`
      );
    } catch (err) {
      showError(err);
    } finally {
      setProcessing(false);
    }
  };

  // Quick Demo Member Chips for instant testing without camera (matching DB seed records)
  const demoMembers = [
    { code: 'MEM-00001', name: 'Phạm Minh Tuấn', tier: 'Basic' },
    { code: 'MEM-00002', name: 'Hoàng Hải Yến', tier: 'Pro' },
    { code: 'MEM-00003', name: 'Đặng Quốc Bảo', tier: 'Basic' },
    { code: 'MEM-00004', name: 'Trần Thị Mai Anh', tier: 'Member' },
    { code: 'MEM-00005', name: 'Vũ Đức Thắng', tier: 'Olympic' },
    { code: '0900000006', name: 'SĐT: 0900000006 (P.M. Tuấn)', tier: 'Phone' },
  ];

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Component Styles for Real-time Laser Scan Animation */}
      <style>{`
        @keyframes laserScanSweep {
          0% { top: 6%; opacity: 0.4; }
          50% { top: 92%; opacity: 1; }
          100% { top: 6%; opacity: 0.4; }
        }
        .animate-laser-scanner {
          animation: laserScanSweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        #olympic-camera-scanner video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem;
        }
        #olympic-camera-scanner__scan_region {
          background: transparent !important;
        }
      `}</style>

      {/* Header Banner - Olympic Forest Emerald Theme */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#144336] via-[#1B5E4A] to-[#144336] text-white p-6 sm:p-7 border border-emerald-500/30 shadow-xl shadow-emerald-950/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient gold & emerald glow */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-[#F2CC8F]/25 via-[#E5A33C]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#34D399]/20 via-[#1B5E4A]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-black/30 backdrop-blur-md text-[#F2CC8F] border border-[#F2CC8F]/30 text-[11px] font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isEn ? 'OLYMPIC GATE TERMINAL 01' : 'CỔNG QUÉT THẺ OLYMPIC · CỔNG 01'}</span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 text-white tracking-tight drop-shadow-md">
            {isEn ? 'Gate Scanner & Member Check-in' : 'Cổng Quét Thẻ & Check-in Hội Viên'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl font-medium leading-relaxed">
            {isEn
              ? 'Scan member QR code with camera, RFID badge, or enter ID to verify active passes and unlock turnstiles.'
              : 'Quét mã QR bằng Camera, thẻ chip RFID hoặc nhập mã hội viên để đối soát gói tập và tự động mở cổng vào sân.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10 shrink-0">
          <a
            href="#/receptionist/counter-register"
            className="px-4 py-2.5 bg-gradient-to-r from-[#E5A33C] to-[#F2CC8F] hover:from-[#d99732] hover:to-[#e5bf80] text-slate-950 rounded-xl text-xs font-black font-chivo uppercase tracking-wider transition-all shadow-md hover:shadow-lg hover-lift flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
            <span>{isEn ? 'Counter Renewal' : 'Gia Hạn Tại Quầy'}</span>
          </a>
          <a
            href="#/receptionist/lookup"
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/20 hover-lift flex items-center gap-2 backdrop-blur-md shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">person_search</span>
            <span>{isEn ? 'Member Lookup' : 'Tra Cứu'}</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive QR & RFID Scanner Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-all">
          {/* Terminal Status Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="font-chivo text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                {isEn ? 'SMART ACCESS GATE TERMINAL' : 'CỔNG KIỂM SOÁT VÀO SÂN THÔNG MINH'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-chivo font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {isEn ? 'SYSTEM ONLINE' : 'HỆ THỐNG TRỰC TUYẾN'}
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs font-bold font-chivo">
            <button
              type="button"
              onClick={() => handleTabChange('camera')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeScanMode === 'camera'
                  ? 'bg-gradient-to-r from-[#144336] to-[#1B5E4A] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">photo_camera</span>
              <span className="truncate">{isEn ? 'Live Camera' : 'Quét Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('file')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeScanMode === 'file'
                  ? 'bg-gradient-to-r from-[#144336] to-[#1B5E4A] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">upload_file</span>
              <span className="truncate">{isEn ? 'Scan Image' : 'Tải Ảnh QR'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('manual')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeScanMode === 'manual'
                  ? 'bg-gradient-to-r from-[#144336] to-[#1B5E4A] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">keyboard</span>
              <span className="truncate">{isEn ? 'RFID / Key-in' : 'Đầu Đọc Thẻ'}</span>
            </button>
          </div>

          {/* TAB 1: LIVE CAMERA SCANNER VIEWPORT */}
          {activeScanMode === 'camera' && (
            <div className="space-y-4 animate-fade-slide-up">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-900/40 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
                {/* HTML5 QR Code Container (Always present in DOM so html5-qrcode can attach) */}
                <div
                  id="olympic-camera-scanner"
                  className={`w-full max-w-[420px] mx-auto min-h-[280px] ${!isScanning ? 'hidden' : 'block'}`}
                />

                {/* Live Scanner HUD Overlay when active */}
                {isScanning && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-6 z-20">
                    {/* Top status tag */}
                    <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[11px] font-chivo font-black tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>{isEn ? 'Target QR inside viewfinder' : 'Căn chỉnh mã QR vào trong khung'}</span>
                    </div>

                    {/* Viewfinder Target Brackets */}
                    <div className="relative w-60 h-60 border-2 border-white/20 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(52,211,153,0.15)]">
                      {/* 4 Glowing Corner Brackets */}
                      <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-laser-scanner" />
                    </div>

                    {/* Bottom hint */}
                    <span className="text-[11px] text-white/75 bg-black/50 px-3 py-0.5 rounded-full font-mono">
                      {isEn ? 'Auto-detecting Olympic Pass...' : 'Tự động nhận diện thẻ hội viên...'}
                    </span>
                  </div>
                )}

                {/* Idle Preview Screen when camera is off */}
                {!isScanning && (
                  <div className="p-8 text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#144336] to-[#1B5E4A] text-emerald-300 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-500/30">
                      <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                    </div>
                    <div>
                      <h3 className="font-chivo font-black text-white text-base">
                        {isEn ? 'Live Camera Scanner Ready' : 'Cổng Quét Camera Sẵn Sàng'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {isEn
                          ? 'Activate camera to scan member QR cards from mobile phones or physical passes.'
                          : 'Bật máy ảnh để quét mã QR thẻ hội viên trên điện thoại hoặc thẻ cứng vào sân.'}
                      </p>
                    </div>
                    {cameras.length > 1 && (
                      <div className="w-full mb-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                        <span className="text-slate-300 font-medium shrink-0 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-[#F2CC8F]">photo_camera</span>
                          <span>{isEn ? 'Camera:' : 'Thiết bị:'}</span>
                        </span>
                        <select
                          value={selectedCameraId}
                          onChange={(e) => setSelectedCameraId(e.target.value)}
                          className="flex-1 py-1 px-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-bold text-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          {cameras.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label || `Camera ${c.id.slice(0, 8)}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={scannerLoading}
                      onClick={() => startCamera()}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#144336] via-[#1B5E4A] to-[#144336] hover:brightness-110 text-white font-chivo text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950/30 transition-all hover-lift flex items-center justify-center gap-2 cursor-pointer border border-emerald-500/40"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#F2CC8F]">videocam</span>
                      <span>{scannerLoading ? (isEn ? 'Starting Camera...' : 'Đang bật Camera...') : (isEn ? 'START LIVE CAMERA' : 'BẬT CAMERA QUÉT NGAY')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Controls & Device Selector */}
              {isScanning && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                  {cameras.length > 1 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Camera:</span>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          startCamera(e.target.value);
                        }}
                        className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                      >
                        {cameras.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label || `Camera ${c.id.slice(0, 5)}...`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {isEn ? 'Camera Active' : 'Camera đang hoạt động'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-chivo font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-500/20"
                  >
                    <span className="material-symbols-outlined text-[16px]">stop</span>
                    <span>{isEn ? 'Stop Camera' : 'Tắt Camera'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCAN FROM IMAGE FILE */}
          {activeScanMode === 'file' && (
            <div className="space-y-4 animate-fade-slide-up">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScanImageFile}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 dark:border-emerald-600/40 dark:hover:border-emerald-500 rounded-2xl p-8 text-center bg-emerald-50/20 dark:bg-emerald-950/10 cursor-pointer transition-all hover:bg-emerald-50/40 group"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                </div>
                <h3 className="font-chivo font-black text-slate-900 dark:text-white text-sm mt-3">
                  {isEn ? 'Upload Member QR Code Photo' : 'Tải Lên Ảnh Mã QR Thẻ Hội Viên'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {isEn
                    ? 'Click to browse or drop an image screenshot of the member pass QR code (PNG, JPG, WEBP).'
                    : 'Nhấn vào đây để chọn ảnh hoặc ảnh chụp màn hình mã QR của hội viên (PNG, JPG, WEBP).'}
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#144336] to-[#1B5E4A] text-white text-xs font-chivo font-black uppercase tracking-wider shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#F2CC8F]">file_upload</span>
                  <span>{isEn ? 'Choose File' : 'Chọn Tệp Ảnh'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL KEY-IN / HARDWARE RFID SCANNER WEDGE */}
          {activeScanMode === 'manual' && (
            <form
              noValidate
              onSubmit={(e) => { e.preventDefault(); handleExecuteCheckIn(); }}
              className="space-y-3 animate-fade-slide-up"
            >
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isEn ? 'Member Card ID / Phone / Email' : 'Mã thẻ hội viên / Số điện thoại / Email'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
                    barcode_scanner
                  </span>
                  <input
                    type="text"
                    placeholder={isEn ? 'Scan card or enter ID (e.g. MEM-00002)...' : 'Quét mã thẻ (ví dụ: MEM-00002)...'}
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setCheckInError(null); }}
                    className="w-full pl-11 pr-4 py-2.5 text-base font-chivo font-bold rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#144336] to-[#1B5E4A] hover:brightness-110 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (isEn ? 'Validating...' : 'Đang kiểm tra...') : (isEn ? 'VALIDATE' : 'XÁC THỰC')}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isEn
                  ? '💡 Hardware USB/Bluetooth barcode wedge scanners will automatically submit when pressing Enter.'
                  : '💡 Đầu đọc thẻ RFID/Barcode cổng USB sẽ tự động quét và nhấn Enter xác thực vào sân.'}
              </p>
            </form>
          )}

          {/* Quick Scanner Settings Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
                    {soundEnabled ? 'volume_up' : 'volume_off'}
                  </span>
                  <span>{isEn ? 'Beep Sound' : 'Âm thanh bíp'}</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={autoSubmit}
                  onChange={e => setAutoSubmit(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">bolt</span>
                  <span>{isEn ? 'Auto Check-in' : 'Tự động xác thực'}</span>
                </span>
              </label>
            </div>

            {identifier && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                  {isEn ? 'Current ID:' : 'Mã hiện tại:'} <strong className="text-emerald-700 dark:text-emerald-300">{identifier}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleExecuteCheckIn()}
                  disabled={processing}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-chivo font-black text-[11px] uppercase tracking-wider cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {processing ? '...' : (isEn ? 'Verify' : 'Xác Thực')}
                </button>
              </div>
            )}
          </div>

          {/* Quick Demo Test Chips */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-chivo text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-amber-500">touch_app</span>
                <span>{isEn ? 'Quick Test Passes (1-Click Simulation)' : 'Thử Nghiệm Nhanh (1 Chạm Vào Sân)'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {isEn ? 'No camera required' : 'Không cần webcam'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {demoMembers.map((member) => {
                const hasCheckedInToday = checkIns.some(c => c.memberCode === member.code || (member.tier === 'Phone' && c.memberCode === 'MEM-00001'));
                return (
                  <button
                    key={member.code}
                    type="button"
                    onClick={() => {
                      setIdentifier(member.code);
                      handleExecuteCheckIn(member.code);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover-lift ${
                      hasCheckedInToday
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-slate-200 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{member.code}</span>
                    <span className="text-slate-400">•</span>
                    <span>{member.name}</span>
                    {hasCheckedInToday && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{isEn ? 'Inside' : 'Đã vào'}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error / Warning from scanner with Actionable Troubleshooting */}
          {scannerError && (() => {
            const isObj = typeof scannerError === 'object' && scannerError !== null;
            const title = isObj ? scannerError.title : (isEn ? 'Scanner Notice' : 'Thông báo máy ảnh');
            const message = isObj ? scannerError.message : String(scannerError);
            const isDeviceInUse = isObj ? scannerError.type === 'device_in_use' : (message.includes('Device in use') || message.includes('NotReadableError'));

            return (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-3 animate-fade-slide-up shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {isDeviceInUse ? 'no_photography' : 'warning'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-chivo font-black text-amber-950 dark:text-amber-100 text-sm">
                      {title}
                    </h4>
                    <p className="mt-1 leading-relaxed text-amber-800 dark:text-amber-300">
                      {message}
                    </p>
                  </div>
                </div>

                {/* Hàng nút hành động nhanh giúp lễ tân xử lý ngay */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-900/60">
                  {cameras.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                        {isEn ? 'Switch cam:' : 'Đổi cam:'}
                      </span>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          startCamera(e.target.value);
                        }}
                        className="py-1 px-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                      >
                        {cameras.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label || `Camera ${c.id.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-chivo font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    <span>{isEn ? 'Retry Camera' : 'Thử lại'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('manual')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-chivo font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">barcode_scanner</span>
                    <span>{isEn ? 'Manual ID / Scanner Wedge' : 'Nhập mã / Quẹt thẻ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('file')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-chivo font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">upload_file</span>
                    <span>{isEn ? 'Upload QR Photo' : 'Tải ảnh QR'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Result Alert: Success Feedback */}
          {lastCheckIn && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/70 text-emerald-950 dark:text-emerald-200 space-y-3 animate-fade-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#144336] to-[#1B5E4A] text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[28px] text-[#F2CC8F]">check_circle</span>
                </div>
                <div>
                  <span className="font-chivo text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>{isEn ? 'GATE UNLOCKED (ENTRY APPROVED)' : 'CỬA TỰ ĐỘNG ĐÃ MỞ (GATE UNLOCKED)'}</span>
                  </span>
                  <h3 className="font-chivo text-xl font-black text-emerald-950 dark:text-white leading-tight">
                    {lastCheckIn.memberName}
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    {isEn ? 'Card ID' : 'Mã thẻ'}: <strong className="font-mono text-emerald-950 dark:text-white">{lastCheckIn.memberCode}</strong>
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-emerald-200 dark:border-emerald-800 text-xs grid grid-cols-2 gap-3">
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold tracking-wider">
                    {isEn ? 'Package' : 'Gói tập'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{lastCheckIn.packageName}</span>
                </div>
                <div>
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold tracking-wider">
                    {isEn ? 'Entry Time' : 'Thời gian vào'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{lastCheckIn.checkInTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* Result Alert: Error / Expired Feedback with BusinessAlert */}
          {checkInError && (() => {
            const errorMsg = checkInError.message || String(checkInError);
            const isRecentCheckIn = checkInError.status === 409 || errorMsg.includes('vừa được check-in') || errorMsg.includes('already');
            const isExpiredPackage = errorMsg.includes('chưa có gói') || errorMsg.includes('hết hạn') || errorMsg.includes('expired');

            return (
              <div className="space-y-3 animate-fade-slide-up">
                <BusinessAlert
                  type={isRecentCheckIn ? 'warning' : 'error'}
                  title={
                    isRecentCheckIn
                      ? (isEn ? 'Already Checked In Recently' : 'Cảnh Báo Quét Trùng (Hội Viên Đã Vào Sân)')
                      : isExpiredPackage
                        ? (isEn ? 'Package Expired or Invalid' : 'Gói Tập Hết Hạn hoặc Không Hợp Lệ')
                        : (isEn ? 'Check-in Denied' : 'Từ chối Check-in')
                  }
                  message={
                    isRecentCheckIn
                      ? `${errorMsg} ${isEn ? '(Anti-passback protection: 15 minutes cooldown. Gate was unlocked previously).' : '(Hệ thống đang áp dụng cơ chế chống quét thẻ trùng lặp trong 15 phút).'}`
                      : errorMsg
                  }
                />
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {isExpiredPackage && (
                    <a
                      href="#/receptionist/counter-register"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-amber-500/30 hover-lift"
                    >
                      <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                      <span>{isEn ? 'Renew / Register at Counter' : 'Gia hạn / Đăng ký gói tại quầy'}</span>
                    </a>
                  )}
                  {isRecentCheckIn && (
                    <button
                      type="button"
                      onClick={() => {
                        const logSection = document.getElementById('recent-checkins-log');
                        if (logSection) {
                          logSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-emerald-500/30 hover-lift cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      <span>{isEn ? 'View Today\'s Entry Log' : 'Xem nhật ký vào sân hôm nay'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOverrideModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#144336] to-[#1B5E4A] hover:brightness-110 text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-sm hover-lift cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#F2CC8F]">verified_user</span>
                    <span>{isEn ? 'Request Exception Review' : 'Gửi yêu cầu xử lý ngoại lệ'}</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Ghi Đè Ngoại Lệ Check-In */}
        <Modal
          isOpen={overrideModalOpen}
          onClose={() => setOverrideModalOpen(false)}
          title={isEn ? 'Submit Check-in Exception Review' : 'Gửi Yêu Cầu Xử Lý Ngoại Lệ Check-in'}
          size="md"
        >
          <form onSubmit={handleOverrideCheckIn} noValidate className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              {isEn
                ? 'Requests and justifications are saved to the system for audit. Submitting does not automatically approve or unlock the gate; account validity and quota are still audited.'
                : 'Yêu cầu và lý do được lưu vào hệ thống để theo dõi xử lý. Việc gửi yêu cầu chưa phê duyệt check-in hoặc mở cổng; các điều kiện về tài khoản, gói tập và lượt vào vẫn được kiểm tra.'}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Assigned Approver / Reviewer' : 'Người được đề nghị xử lý'}
              </label>
              <input
                type="text"
                value={overrideApprover}
                onChange={e => setOverrideApprover(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Justification Reason' : 'Lý do cần xử lý'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  isEn
                    ? 'Enter exception reason (e.g., forgot physical card, coach confirmed makeup class)...'
                    : 'Nhập lý do ngoại lệ (ví dụ: Học viên quên thẻ cứng, HLV Nguyễn Văn A xác nhận vào tập buổi bù)...'
                }
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                {isEn ? 'CANCEL' : 'HỦY BỎ'}
              </button>
              <button
                type="submit"
                disabled={processing}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#144336] to-[#1B5E4A] hover:brightness-110 rounded-lg shadow-sm hover-lift cursor-pointer disabled:opacity-50"
              >
                {processing ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'SUBMIT REQUEST' : 'LƯU YÊU CẦU')}
              </button>
            </div>
          </form>
        </Modal>

        {/* Right Column: Today's Check-in Log (5 cols) */}
        <div id="recent-checkins-log" className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover-lift transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-chivo text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              {isEn ? `Today's Entry Scans (${checkIns.length})` : `Nhật Ký Quét Thẻ Hôm Nay (${checkIns.length})`}
            </h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isEn ? 'Live' : 'Trực tiếp'}
            </span>
          </div>

          {historyError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{historyError}</p>}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[520px] overflow-y-auto pr-1 space-y-2">
            {checkIns.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">badge</span>
                <p>{isEn ? 'No scans recorded today yet.' : 'Chưa có lượt quét thẻ nào hôm nay.'}</p>
                <p className="text-[11px] text-slate-400">
                  {isEn ? 'Scanned passes will appear here in real-time.' : 'Các lượt vào sân thành công sẽ tự động xuất hiện tại đây.'}
                </p>
              </div>
            ) : (
              checkIns.map(item => (
                <div key={item.id} className="pt-2.5 pb-1 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300 dark:border-emerald-800">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{item.memberName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{item.memberCode}</span> • {item.packageName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      {item.checkInTime.split(' ')[1] || item.checkInTime}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isEn ? 'Desk' : 'Lễ tân'}: {item.receptionistName?.split(' ')[0]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
