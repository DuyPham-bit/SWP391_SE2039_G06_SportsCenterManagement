import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { receptionApi } from '../../../entities/member/index.js';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { playScannerBeep, extractMemberIdentifier } from '../lib/scanner.js';

export function useMemberCheckIn() {
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
  // Sau mỗi lần quét được mã, camera tạm dừng cho tới khi lễ tân bấm "Quét tiếp"
  const [isScanPaused, setIsScanPaused] = useState(false);

  const html5QrCodeRef = useRef(null);
  const lastScannedCodeRef = useRef('');
  const lastScannedTimeRef = useRef(0);
  const scanLockRef = useRef(false);
  // html5-qrcode giữ callback từ lúc start() -> dùng ref để luôn gọi handler mới nhất (tránh stale state)
  const onQrDecodedRef = useRef(null);
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
  const pauseCameraScan = () => {
    const scanner = html5QrCodeRef.current;
    try {
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        scanner.pause(true);
      }
    } catch (err) {
      console.warn('Could not pause scanner:', err);
    }
    // Always show "Scan next": the scan lock is held even if the camera could not pause.
    setIsScanPaused(true);
  };

  // Lễ tân chủ động quét mã tiếp theo
  const resumeScan = () => {
    const scanner = html5QrCodeRef.current;
    try {
      if (scanner && scanner.getState() === Html5QrcodeScannerState.PAUSED) {
        scanner.resume();
      }
    } catch (err) {
      console.warn('Could not resume scanner:', err);
    }
    scanLockRef.current = false;
    setIsScanPaused(false);
  };

  const onQrDecoded = async (decodedRaw, fromCamera = false) => {
    if (!decodedRaw || scanLockRef.current) return;
    const cleanCode = extractMemberIdentifier(decodedRaw);
    if (!cleanCode) return;

    // Bỏ qua cùng một mã trong 5 giây (kể cả sau khi bấm "Quét tiếp" mà thẻ vẫn trước camera)
    const now = Date.now();
    if (cleanCode === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 5000) {
      return;
    }
    scanLockRef.current = true;
    if (fromCamera) pauseCameraScan();
    lastScannedCodeRef.current = cleanCode;
    lastScannedTimeRef.current = now;
    setIdentifier(cleanCode);

    try {
      if (autoSubmit) {
        await handleExecuteCheckIn(cleanCode);
      } else {
        if (soundEnabled) playScannerBeep(true);
        showSuccess(isEn ? `Scanned code: ${cleanCode}` : `Đã quét được mã: ${cleanCode}`);
      }
    } finally {
      // Camera giữ khóa tới khi bấm "Quét tiếp"; quét file thì mở khóa ngay
      if (!fromCamera) scanLockRef.current = false;
    }
  };
  onQrDecodedRef.current = onQrDecoded;

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

      const currentState = scanner.getState();
      if (currentState === Html5QrcodeScannerState.SCANNING || currentState === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
      scanLockRef.current = false;
      setIsScanPaused(false);

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
          onQrDecodedRef.current?.(decodedText, true);
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
    scanLockRef.current = false;
    setIsScanPaused(false);
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
      } else if ([Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(scanner.getState())) {
        await scanner.stop();
        setIsScanning(false);
        setIsScanPaused(false);
        scanLockRef.current = false;
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

  return {
    activeScanMode, autoSubmit, cameras, checkInError, checkIns, fileInputRef, handleExecuteCheckIn,
    handleOverrideCheckIn, handleScanImageFile, handleTabChange, historyError, identifier, isEn,
    isScanning, isScanPaused, lastCheckIn, resumeScan, overrideApprover, overrideModalOpen, overrideReason, processing,
    scannerError, scannerLoading, selectedCameraId, setAutoSubmit, setCheckInError, setIdentifier,
    setOverrideApprover, setOverrideModalOpen, setOverrideReason, setSelectedCameraId,
    setSoundEnabled, soundEnabled, startCamera, stopCamera
  };
}
