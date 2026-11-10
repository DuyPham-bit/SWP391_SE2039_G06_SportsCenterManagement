import React from 'react';

export function ReportsHeroBanner({
  adminMode = false, exportExcel, exportPdf, exportReport, exportingCsv, exportingPdf, exportingXlsx, isEn, loading,
  metrics, reportScopeLabel
}) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl text-white p-6 lg:p-8 shadow-xl shadow-brand-teal-600/25 border border-white/30 print:p-5 print:rounded-2xl"
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

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 text-brand-sage-900 text-xs font-black uppercase tracking-wider backdrop-blur-md border border-white/80 shadow-xs mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>Olympic Analytics</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-chivo text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {adminMode
              ? (isEn ? 'System Reports & Analytics' : 'Báo Cáo & Phân Tích Toàn Hệ Thống')
              : (isEn ? 'Reports & Operational Analytics' : 'Báo Cáo & Thống Kê Hoạt Động')}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
            {adminMode
              ? (isEn ? `Read-only system oversight · ${reportScopeLabel}` : `Giám sát chỉ đọc · ${reportScopeLabel}`)
              : (isEn
                  ? 'Visual analytics dashboard, sport market share metrics, and center-wide operational performance.'
                  : 'Tổng hợp biểu đồ thống kê trực quan, thị phần bộ môn và hiệu suất vận hành toàn trung tâm.')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap no-print">
          {/* In trực tiếp / Print */}
          <button
            id="btn-print-report"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-brand-sage-900 text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover-lift cursor-pointer border border-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !metrics}
            onClick={() => window.print()}
            title={isEn ? 'Print report directly or save as PDF' : 'In báo cáo trực tiếp hoặc lưu PDF từ trình duyệt'}
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-400">print</span>
            <span>{isEn ? 'Print' : 'In Báo Cáo'}</span>
          </button>

          {/* PDF */}
          <button
            id="btn-export-pdf"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-danger-700 hover:bg-brand-danger-800 text-white text-sm font-semibold transition-all shadow-md shadow-brand-danger-700/20 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
            disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
            onClick={exportPdf}
            title={isEn ? 'Download formatted A4 PDF report for printing' : 'Tải PDF khổ A4 để in báo cáo'}
          >
            {exportingPdf
              ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>}
            {exportingPdf ? (isEn ? 'Generating…' : 'Đang tạo…') : 'PDF'}
          </button>

          {/* Excel */}
          <button
            id="btn-export-excel"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-800 text-white text-sm font-semibold transition-all shadow-md shadow-brand-sage-700/20 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
            disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
            onClick={exportExcel}
            title={isEn ? 'Download .xlsx spreadsheet for data analysis' : 'Tải file .xlsx để phân tích số liệu'}
          >
            {exportingXlsx
              ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]">table_chart</span>}
            {exportingXlsx ? (isEn ? 'Generating…' : 'Đang tạo…') : 'Excel'}
          </button>

          {/* CSV (legacy) */}
          <button
            id="btn-export-csv"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
            disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
            onClick={exportReport}
            title={isEn ? 'Raw CSV export for custom processing' : 'Xuất CSV thô cho xử lý tuỳ chỉnh'}
          >
            {exportingCsv
              ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]">download</span>}
            CSV
          </button>
        </div>
      </div>
    </section>
  );
}
