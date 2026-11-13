import React from 'react';
import { BusinessAlert } from '../../../shared/ui/BusinessAlert.jsx';
import { useMemberCheckIn } from '../model/useMemberCheckIn.js';
import { CheckInHeader } from './CheckInHeader.jsx';
import { ScanModeTabs } from './ScanModeTabs.jsx';
import { CameraScannerPanel } from './CameraScannerPanel.jsx';
import { FileScannerPanel } from './FileScannerPanel.jsx';
import { ManualCheckInForm } from './ManualCheckInForm.jsx';
import { ScannedIdentifierBar } from './ScannedIdentifierBar.jsx';
import { CheckInSuccessCard } from './CheckInSuccessCard.jsx';
import { CheckInReviewModal } from './CheckInReviewModal.jsx';
import { TodayCheckInsPanel } from './TodayCheckInsPanel.jsx';

export function MemberCheckIn() {
  const {
    activeScanMode, autoSubmit, cameras, checkInError, checkIns, fileInputRef, handleExecuteCheckIn,
    handleOverrideCheckIn, handleScanImageFile, handleTabChange, historyError, identifier, isEn,
    isScanning, isScanPaused, lastCheckIn, resumeScan, overrideApprover, overrideModalOpen, overrideReason, processing,
    scannerError, scannerLoading, selectedCameraId, setAutoSubmit, setCheckInError, setIdentifier,
    setOverrideApprover, setOverrideModalOpen, setOverrideReason, setSelectedCameraId,
    setSoundEnabled, soundEnabled, startCamera, stopCamera
  } = useMemberCheckIn();

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
      <CheckInHeader isEn={isEn} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive QR & RFID Scanner Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-brand-navy-900 p-6 sm:p-7 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 shadow-sm space-y-5 transition-all">
          {/* Terminal Status Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-brand-navy-100 dark:border-brand-navy-800">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-sage-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-sage-500" />
              </span>
              <span className="font-chivo text-xs font-black uppercase text-brand-navy-900 dark:text-white tracking-wider">
                {isEn ? 'SMART ACCESS GATE TERMINAL' : 'CỔNG KIỂM SOÁT VÀO SÂN THÔNG MINH'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-chivo font-black tracking-wider uppercase bg-brand-sage-500/10 text-brand-sage-700 dark:text-brand-sage-300 border border-brand-sage-500/20">
                {isEn ? 'SYSTEM ONLINE' : 'HỆ THỐNG TRỰC TUYẾN'}
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <ScanModeTabs
            activeScanMode={activeScanMode}
            handleTabChange={handleTabChange}
            isEn={isEn}
          />

          {/* TAB 1: LIVE CAMERA SCANNER VIEWPORT */}
          {activeScanMode === 'camera' && (
            <CameraScannerPanel
              cameras={cameras}
              isEn={isEn}
              isScanning={isScanning}
              scannerLoading={scannerLoading}
              selectedCameraId={selectedCameraId}
              setSelectedCameraId={setSelectedCameraId}
              startCamera={startCamera}
              stopCamera={stopCamera}
              isScanPaused={isScanPaused}
              processing={processing}
              resumeScan={resumeScan}
            />
          )}

          {/* TAB 2: SCAN FROM IMAGE FILE */}
          {activeScanMode === 'file' && (
            <FileScannerPanel
              fileInputRef={fileInputRef}
              handleScanImageFile={handleScanImageFile}
              isEn={isEn}
            />
          )}

          {/* TAB 3: MANUAL KEY-IN / HARDWARE RFID SCANNER WEDGE */}
          {activeScanMode === 'manual' && (
            <ManualCheckInForm
              handleExecuteCheckIn={handleExecuteCheckIn}
              identifier={identifier}
              isEn={isEn}
              processing={processing}
              setCheckInError={setCheckInError}
              setIdentifier={setIdentifier}
            />
          )}

          {/* Quick Scanner Settings Bar */}
          <ScannedIdentifierBar
            autoSubmit={autoSubmit}
            handleExecuteCheckIn={handleExecuteCheckIn}
            identifier={identifier}
            isEn={isEn}
            processing={processing}
            setAutoSubmit={setAutoSubmit}
            setSoundEnabled={setSoundEnabled}
            soundEnabled={soundEnabled}
          />

          {/* Error / Warning from scanner with Actionable Troubleshooting */}
          {scannerError && (() => {
            const isObj = typeof scannerError === 'object' && scannerError !== null;
            const title = isObj ? scannerError.title : (isEn ? 'Scanner Notice' : 'Thông báo máy ảnh');
            const message = isObj ? scannerError.message : String(scannerError);
            const isDeviceInUse = isObj ? scannerError.type === 'device_in_use' : (message.includes('Device in use') || message.includes('NotReadableError'));

            return (
              <div className="p-4 rounded-2xl bg-brand-sand-50 dark:bg-brand-sand-950/30 border border-brand-sand-300 dark:border-brand-sand-800 text-xs text-brand-sand-900 dark:text-brand-sand-200 space-y-3 animate-fade-slide-up shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-sand-500/20 text-brand-sand-700 dark:text-brand-sand-300 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {isDeviceInUse ? 'no_photography' : 'warning'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-chivo font-black text-brand-sand-950 dark:text-brand-sand-100 text-sm">
                      {title}
                    </h4>
                    <p className="mt-1 leading-relaxed text-brand-sand-800 dark:text-brand-sand-300">
                      {message}
                    </p>
                  </div>
                </div>

                {/* Hàng nút hành động nhanh giúp lễ tân xử lý ngay */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-brand-sand-200 dark:border-brand-sand-900/60">
                  {cameras.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-brand-sand-900 dark:text-brand-sand-200">
                        {isEn ? 'Switch cam:' : 'Đổi cam:'}
                      </span>
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          startCamera(e.target.value);
                        }}
                        className="py-1 px-2 rounded-lg border border-brand-sand-300 dark:border-brand-sand-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white font-bold text-xs"
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
                    className="px-3 py-1.5 rounded-lg bg-brand-sand-700 hover:bg-brand-sand-800 text-white font-chivo font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    <span>{isEn ? 'Retry Camera' : 'Thử lại'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('manual')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-brand-navy-800 hover:bg-brand-sand-100 dark:hover:bg-brand-sand-900/40 border border-brand-sand-300 dark:border-brand-sand-700 text-brand-sand-900 dark:text-brand-sand-200 font-chivo font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">barcode_scanner</span>
                    <span>{isEn ? 'Manual ID / Scanner Wedge' : 'Nhập mã / Quẹt thẻ'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('file')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-brand-navy-800 hover:bg-brand-sand-100 dark:hover:bg-brand-sand-900/40 border border-brand-sand-300 dark:border-brand-sand-700 text-brand-sand-900 dark:text-brand-sand-200 font-chivo font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
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
            <CheckInSuccessCard isEn={isEn} lastCheckIn={lastCheckIn} />
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
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-sand-500/10 hover:bg-brand-sand-500/20 text-brand-sand-800 dark:text-brand-sand-300 text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-brand-sand-500/30 hover-lift"
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
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-sage-500/10 hover:bg-brand-sage-500/20 text-brand-sage-800 dark:text-brand-sage-300 text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-brand-sage-500/30 hover-lift cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      <span>{isEn ? 'View Today\'s Entry Log' : 'Xem nhật ký vào sân hôm nay'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOverrideModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-sage-900 to-brand-sage-800 hover:brightness-110 text-white text-xs font-bold font-chivo uppercase tracking-wider transition-all shadow-sm hover-lift cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-brand-sand-300">verified_user</span>
                    <span>{isEn ? 'Request Exception Review' : 'Gửi yêu cầu xử lý ngoại lệ'}</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Ghi Đè Ngoại Lệ Check-In */}
        <CheckInReviewModal
          handleOverrideCheckIn={handleOverrideCheckIn}
          isEn={isEn}
          overrideApprover={overrideApprover}
          overrideModalOpen={overrideModalOpen}
          overrideReason={overrideReason}
          processing={processing}
          setOverrideApprover={setOverrideApprover}
          setOverrideModalOpen={setOverrideModalOpen}
          setOverrideReason={setOverrideReason}
        />

        {/* Right Column: Today's Check-in Log (5 cols) */}
        <TodayCheckInsPanel checkIns={checkIns} historyError={historyError} isEn={isEn} />
      </div>
    </div>
  );
}
