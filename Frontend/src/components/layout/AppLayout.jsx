import React, { useState } from 'react';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { ProfileModal } from '../../features/auth/ProfileModal.js';
import { useAuth } from '../../context/AuthContext.js';
import { MemberAIChatPopup, openMemberAIChat } from '../../features/member/MemberAIChatPopup.jsx';

export function AppLayout({ children, currentPath }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { role } = useAuth();

  const isMemberArea = role === 'MEMBER' || (currentPath && currentPath.startsWith('#/member'));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter">
      {/* Top Header */}
      <Header
        onOpenProfile={() => setProfileModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath={currentPath}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>

          {/* Compact System Footer */}
          <footer className="py-4 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Sports Center Management System (SCMS) - Chuẩn Olympic.</span>
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-600">
              <a href="#/" className="hover:text-red-600">Trang chủ Landing</a>
              <span className="text-slate-300">|</span>
              {isMemberArea ? (
                <button
                  type="button"
                  onClick={() => openMemberAIChat()}
                  className="hover:text-red-600 inline-flex items-center gap-1 font-semibold text-slate-700"
                >
                  <span className="material-symbols-outlined text-[13px] text-red-500">smart_toy</span>
                  <span>Hỏi đáp AI (Popup)</span>
                </button>
              ) : (
                <a href="#/member/ai-assistant" className="hover:text-red-600">Hỏi đáp AI</a>
              )}
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">Phiên bản 1.0.0</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating AI Chat Popup Widget for Members */}
      {isMemberArea && <MemberAIChatPopup />}

      {/* User Profile & Password Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}

