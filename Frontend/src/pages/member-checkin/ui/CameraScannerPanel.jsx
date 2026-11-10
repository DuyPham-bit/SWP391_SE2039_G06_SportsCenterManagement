import React from 'react';

export function CameraScannerPanel({
  cameras, isEn, isScanning, scannerLoading, selectedCameraId, setSelectedCameraId, startCamera,
  stopCamera
}) {
  return (
    <div className="space-y-4 animate-fade-slide-up">
      <div className="relative rounded-2xl overflow-hidden bg-brand-navy-950 border-2 border-brand-sage-900/40 shadow-inner flex flex-col items-center justify-center min-h-[300px]">
        {/* HTML5 QR Code Container (Always present in DOM so html5-qrcode can attach) */}
        <div
          id="olympic-camera-scanner"
          className={`w-full max-w-[420px] mx-auto min-h-[280px] ${!isScanning ? 'hidden' : 'block'}`}
        />

        {/* Live Scanner HUD Overlay when active */}
        {isScanning && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-6 z-20">
            {/* Top status tag */}
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-brand-sage-400 border border-brand-sage-500/30 text-[11px] font-chivo font-black tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-sage-400 animate-ping" />
              <span>{isEn ? 'Target QR inside viewfinder' : 'Căn chỉnh mã QR vào trong khung'}</span>
            </div>

            {/* Viewfinder Target Brackets */}
            <div className="relative w-60 h-60 border-2 border-white/20 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(145,194,170,0.15)]">
              {/* 4 Glowing Corner Brackets */}
              <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-sage-400 rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-sage-400 rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-sage-400 rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-sage-400 rounded-br-lg" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-sage-400 to-transparent shadow-[0_0_12px_#91C2AA] animate-laser-scanner" />
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
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-sage-900 to-brand-sage-800 text-brand-sage-300 flex items-center justify-center shadow-lg shadow-brand-sage-950/40 border border-brand-sage-500/30">
              <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-chivo font-black text-white text-base">
                {isEn ? 'Live Camera Scanner Ready' : 'Cổng Quét Camera Sẵn Sàng'}
              </h3>
              <p className="text-xs text-brand-navy-400 mt-1 leading-relaxed">
                {isEn
                  ? 'Activate camera to scan member QR cards from mobile phones or physical passes.'
                  : 'Bật máy ảnh để quét mã QR thẻ hội viên trên điện thoại hoặc thẻ cứng vào sân.'}
              </p>
            </div>
            {cameras.length > 1 && (
              <div className="w-full mb-3 flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-brand-navy-300 font-medium shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-brand-sand-300">photo_camera</span>
                  <span>{isEn ? 'Camera:' : 'Thiết bị:'}</span>
                </span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="flex-1 py-1 px-2 rounded-lg border border-brand-navy-700 bg-brand-navy-900 text-white font-bold text-xs focus:ring-1 focus:ring-brand-sage-500 cursor-pointer"
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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-sage-900 via-brand-sage-800 to-brand-sage-900 hover:brightness-110 text-white font-chivo text-xs font-black uppercase tracking-wider shadow-lg shadow-brand-sage-950/30 transition-all hover-lift flex items-center justify-center gap-2 cursor-pointer border border-brand-sage-500/40"
            >
              <span className="material-symbols-outlined text-[18px] text-brand-sand-300">videocam</span>
              <span>{scannerLoading ? (isEn ? 'Starting Camera...' : 'Đang bật Camera...') : (isEn ? 'START LIVE CAMERA' : 'BẬT CAMERA QUÉT NGAY')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Camera Controls & Device Selector */}
      {isScanning && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/60 border border-brand-navy-200 dark:border-brand-navy-800 text-xs">
          {cameras.length > 1 ? (
            <div className="flex items-center gap-2">
              <span className="text-brand-navy-500 dark:text-brand-navy-400 font-medium">Camera:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  startCamera(e.target.value);
                }}
                className="py-1 px-2.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white font-bold text-xs"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-brand-sage-700 dark:text-brand-sage-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
              {isEn ? 'Camera Active' : 'Camera đang hoạt động'}
            </span>
          )}

          <button
            type="button"
            onClick={stopCamera}
            className="px-3.5 py-1.5 rounded-lg bg-brand-danger-500/10 hover:bg-brand-danger-500/20 text-brand-danger-600 dark:text-brand-danger-400 font-chivo font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer border border-brand-danger-500/20"
          >
            <span className="material-symbols-outlined text-[16px]">stop</span>
            <span>{isEn ? 'Stop Camera' : 'Tắt Camera'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
