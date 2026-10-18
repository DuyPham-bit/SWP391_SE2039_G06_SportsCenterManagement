import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { getDynamicNavItems } from '../../services/permissions.js';

export function Sidebar({ isOpen, onClose, currentPath }) {
  const { role, logout } = useAuth();
  const [navItems, setNavItems] = useState(() => getDynamicNavItems(role));

  useEffect(() => {
    // Initial update
    setNavItems(getDynamicNavItems(role));

    // Listen to real-time permission changes
    const handlePermissionsChanged = () => {
      setNavItems(getDynamicNavItems(role));
    };

    window.addEventListener('SCMS_PERMISSIONS_CHANGED', handlePermissionsChanged);
    return () => window.removeEventListener('SCMS_PERMISSIONS_CHANGED', handlePermissionsChanged);
  }, [role]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-[#1E2235] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, idx) => {
            if (item.isHeader) {
              return (
                <div
                  key={idx}
                  className="px-3 pt-4 pb-1 text-[10px] font-sans font-bold tracking-widest text-[#A8DADC] uppercase"
                >
                  {item.label}
                </div>
              );
            }

            const isActive = currentPath === item.path || (currentPath.startsWith(item.path) && item.path !== '#/manager/dashboard');

            const isAIAssistant = item.path === '#/member/ai-assistant';

            return (
              <a
                key={idx}
                href={item.path}
                onClick={(e) => {
                  if (isAIAssistant) {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('SCMS_OPEN_AI_POPUP'));
                    onClose?.();
                  } else {
                    onClose?.();
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all ${isActive
                    ? 'bg-[#3D405B] text-[#F2CC8F] shadow-sm border-l-4 border-[#F2CC8F]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? 'text-[#F2CC8F]' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
                {isAIAssistant && (
                  <span className="ml-auto px-1.5 py-0.2 rounded bg-[#81B29A]/20 text-[#81B29A] text-[9px] font-bold uppercase border border-[#81B29A]/30">
                    Popup
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#81B29A] text-[18px]">verified</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">Olympic Arena</span>
                <span className="text-[9px] text-slate-400">Tiêu Chuẩn SCMS</span>
              </div>
            </div>
            <button
              onClick={() => { logout(); window.location.hash = '#/login'; }}
              className="text-slate-400 hover:text-[#F2CC8F] p-1 transition-colors"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
