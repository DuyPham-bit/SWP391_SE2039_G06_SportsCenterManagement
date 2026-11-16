import React from 'react';

export function MembersHeroBanner({ busy, isEn, loading, openEdit, setRevision }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-xl shadow-brand-teal-600/25 border border-white/30"
      style={{
        background: 'linear-gradient(108deg, #2D6A4F 0%, #24828F 25%, #3FAEB8 48%, #81B29A 70%, #E5A33C 88%, #E5A33C 100%)'
      }}
    >
      {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
      <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-brand-sand-300/50 via-brand-sand-500/35 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-brand-sage-500/45 via-brand-sage-700/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/35 rounded-full blur-3xl" />

      {/* Subtle decorative Olympic curved motion lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
        <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
        <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
      </svg>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-brand-sage-900 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>{isEn ? 'Member Operations' : 'Quản trị hội viên SCMS'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-chivo tracking-tight text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Member Management' : 'Quản lý hội viên'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1.5 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Track member profiles, account statuses, subscription packages, and center-wide athletic privileges.'
              : 'Theo dõi hồ sơ hội viên, trạng thái tài khoản, lịch sử gói tập và quyền lợi thể thao toàn trung tâm.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setRevision((x) => x + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/40 transition-all hover-lift cursor-pointer disabled:opacity-50 shadow-xs"
            title={isEn ? 'Refresh' : 'Làm mới'}
          >
            <span className={`material-symbols-outlined text-[16px] text-brand-sand-200 ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>
          <button
            onClick={() => openEdit(null)}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-brand-sage-900 text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover-lift cursor-pointer border border-white/80"
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">person_add</span>
            <span>{isEn ? 'Add Member' : 'Thêm thành viên mới'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
