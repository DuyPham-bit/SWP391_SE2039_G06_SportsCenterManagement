import React, { useState } from 'react';

export function Floating3DControl({ is3DMode, toggle3DMode, onOpenSport3D, isEn = false }) {
  const [isMinimized, setIsMinimized] = useState(false);

  const scrollToCampus3D = () => {
    const el = document.getElementById('khong-gian-tap-luyen');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isMinimized) {
    return (
      <aside
        aria-label="3D Control"
        className="fixed bottom-6 right-6 z-[120] flex items-center"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-xl border transition-all duration-300 cursor-pointer ${
            is3DMode
              ? 'bg-slate-900/90 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/85 border-white/20 text-slate-300 hover:text-white'
          }`}
          title={isEn ? 'Open 3D Spatial Controls' : 'Mở bảng điều khiển 3D'}
        >
          <span className="material-symbols-outlined text-[18px] animate-pulse">view_in_ar</span>
          <span className="text-xs font-black uppercase tracking-wider">
            {is3DMode ? '3D: ON' : '3D: OFF'}
          </span>
          <span className={`w-2 h-2 rounded-full ${is3DMode ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-500'}`} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="3D Control Panel"
      className="fixed bottom-6 right-6 z-[120] flex flex-col items-end gap-2"
    >
      <div className={`p-4 rounded-3xl backdrop-blur-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 max-w-[340px] ${
        is3DMode
          ? 'bg-slate-950/90 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
          : 'bg-slate-950/85 border-white/15'
      }`}>
        {/* Top Title & Minimize */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${is3DMode ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
              {isEn ? 'Spatial 3D Experience' : 'Trải Nghiệm Không Gian 3D'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title={isEn ? 'Minimize' : 'Thu nhỏ'}
          >
            <span className="material-symbols-outlined text-[14px]">remove</span>
          </button>
        </div>

        {/* Master 3D Toggle Switch */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.06] border border-white/10 mb-3">
          <div className="flex items-center gap-2.5">
            <span className={`material-symbols-outlined text-[20px] ${is3DMode ? 'text-cyan-400' : 'text-slate-400'}`}>
              view_in_ar
            </span>
            <div>
              <div className="text-xs font-bold text-white">
                {is3DMode ? (isEn ? '3D Models Active' : 'Chế độ 3D: Đang Bật') : (isEn ? 'Standard 2D Mode' : 'Chế độ 3D: Đang Tắt')}
              </div>
              <div className="text-[10.5px] text-slate-400">
                {isEn ? 'Campus & sport simulation' : 'Mô hình sân bãi & dụng cụ 3D'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggle3DMode()}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              is3DMode ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={is3DMode}
            aria-label="Toggle 3D Mode"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                is3DMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Quick 3D Navigation Actions when 3D is active */}
        {is3DMode && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={scrollToCampus3D}
              className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-white/10 text-white text-[11.5px] font-bold flex items-center justify-between transition cursor-pointer group"
            >
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-cyan-400 group-hover:scale-110 transition-transform">
                  apartment
                </span>
                <span>{isEn ? 'Explore 13,000m² Campus 3D' : 'Xem Tổ hợp 13.000m² 3D'}</span>
              </span>
              <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>

            {onOpenSport3D && (
              <button
                type="button"
                onClick={() => onOpenSport3D({ name: 'Bóng rổ' })}
                className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-red-600/30 to-rose-600/30 hover:from-red-600/50 hover:to-rose-600/50 border border-red-500/30 text-white text-[11.5px] font-bold flex items-center justify-between transition cursor-pointer group"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-red-400 group-hover:scale-110 transition-transform">
                    sports_basketball
                  </span>
                  <span>{isEn ? 'Inspect 3D Sport Courts' : 'Mô hình 3D từng bộ môn'}</span>
                </span>
                <span className="material-symbols-outlined text-[14px] text-red-300">
                  open_in_full
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Floating3DControl;
