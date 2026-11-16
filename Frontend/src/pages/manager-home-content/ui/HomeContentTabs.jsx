import React from 'react';

export function HomeContentTabs({ activeTab, handleTabChange, isEn, totalFacilities, totalSports }) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-2.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
      {[
        { id: 'hero', label: isEn ? '1. Hero Banner' : '1. Hero Banner', icon: 'crop_original', desc: isEn ? 'Main Banner & Media' : 'Banner chính & Video' },
        { id: 'whyUs', label: isEn ? '2. Why SCMS' : '2. Tại Sao Chọn SCMS', icon: 'verified', desc: isEn ? '3 Merits & 4 Stats' : '3 Ưu thế & 4 Số liệu' },
        { id: 'sports', label: isEn ? '3. Sports' : '3. Môn Thể Thao', icon: 'sports_kabaddi', desc: `${totalSports} ${isEn ? 'Sports' : 'Bộ môn'}` },
        { id: 'facilities', label: isEn ? '4. Facilities' : '4. Thẻ Cụm Sân', icon: 'stadium', desc: `${totalFacilities} ${isEn ? 'Facilities' : 'Khu liên hợp'}` },
        { id: 'zones', label: isEn ? '5. Zones' : '5. Sơ Đồ Phân Khu', icon: 'apartment', desc: isEn ? 'Zones A-B-C' : 'Bố trí khu A-B-C' },
        { id: 'footer', label: isEn ? '6. CTA & Footer' : '6. Kêu Gọi & Footer', icon: 'contact_support', desc: isEn ? 'Events & Info' : 'Sự kiện & Liên hệ' },
        {
          id: 'authShowcase',
          label: isEn ? '7. Auth Showcase' : '7. Banner Đăng Nhập',
          icon: 'badge',
          desc: isEn ? 'Login Page (3 Stats)' : 'Trang Đăng Nhập (3 số liệu)',
          badge: isEn ? 'Login Stats' : '3 Số liệu Login'
        }
      ].map(tab => (
        <button
          key={tab.id}
          type="button"
          onClick={() => handleTabChange(tab.id)}
          className={`flex flex-col items-start justify-between p-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative hover-lift text-left ${
              activeTab === tab.id
                ? 'bg-brand-sage-700 text-white shadow-md shadow-brand-sage-700/25 ring-2 ring-brand-sage-700/30'
                : 'text-brand-navy-700 dark:text-brand-navy-200 bg-brand-navy-50/70 dark:bg-brand-navy-800/40 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 border border-brand-navy-200/60 dark:border-brand-navy-700/60'
            }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-white' : 'text-brand-sage-700 dark:text-brand-sage-500'}`}>
              {tab.icon}
            </span>
            {tab.badge && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide uppercase ${
                  activeTab === tab.id
                    ? 'bg-white/25 text-white'
                    : 'bg-brand-sage-100 dark:bg-brand-sage-950 text-brand-sage-800 dark:text-brand-sage-300 border border-brand-sage-300 dark:border-brand-sage-700'
                }`}>
                {tab.badge}
              </span>
            )}
          </div>
          <div className="w-full">
            <span className="block truncate font-black tracking-tight">{tab.label}</span>
            <span className={`block text-[10px] font-medium truncate mt-0.5 ${activeTab === tab.id ? 'text-white/80' : 'text-brand-navy-400 dark:text-brand-navy-500'}`}>
              {tab.desc}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
