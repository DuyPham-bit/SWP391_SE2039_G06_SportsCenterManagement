import React from 'react';
import {
  SCMS_HERO_BADGE_CLASS,
  SCMS_HERO_BTN_DARK,
  SCMS_HERO_BTN_GLASS,
  SCMS_HERO_BTN_LIGHT,
  SCMS_HERO_SECTION_CLASS,
  ScmsHeroDecor
} from '../../../shared/ui/ScmsHeroBanner.jsx';

export function ReportsHeroBanner({
  exportExcel, exportPdf, exportReport, exportingCsv, exportingPdf, exportingXlsx, isEn, loading,
  metrics
}) {
  return (
    <section className={`${SCMS_HERO_SECTION_CLASS} lg:p-8 print:p-5 print:rounded-2xl`}>
      <ScmsHeroDecor />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className={`${SCMS_HERO_BADGE_CLASS} mb-2.5`}>
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse shrink-0" />
            <span>Olympic Analytics</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-chivo text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Reports & Operational Analytics' : 'Báo Cáo & Thống Kê Hoạt Động'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-2xl leading-relaxed font-medium drop-shadow-xs">
            {isEn
              ? 'Visual analytics dashboard, sport market share metrics, and center-wide operational performance.'
              : 'Tổng hợp biểu đồ thống kê trực quan, thị phần bộ môn và hiệu suất vận hành toàn trung tâm.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap no-print shrink-0">
          {/* In trực tiếp / Print */}
          <button
            id="btn-print-report"
            className={SCMS_HERO_BTN_LIGHT}
            disabled={loading || !metrics}
            onClick={() => window.print()}
            title={isEn ? 'Print report directly or save as PDF' : 'In báo cáo trực tiếp hoặc lưu PDF từ trình duyệt'}
          >
            <span className="material-symbols-outlined text-[18px] text-brand-sage-700">print</span>
            <span>{isEn ? 'Print' : 'In Báo Cáo'}</span>
          </button>

          {/* PDF */}
          <button
            id="btn-export-pdf"
            className={SCMS_HERO_BTN_DARK}
            disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
            onClick={exportPdf}
            title={isEn ? 'Download formatted A4 PDF report for printing' : 'Tải PDF khổ A4 để in báo cáo'}
          >
            {exportingPdf
              ? <span className="material-symbols-outlined text-[18px] text-brand-sand-300 animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px] text-brand-sand-300">picture_as_pdf</span>}
            <span>{exportingPdf ? (isEn ? 'Generating…' : 'Đang tạo…') : 'PDF'}</span>
          </button>

          {/* Excel */}
          <button
            id="btn-export-excel"
            className={SCMS_HERO_BTN_GLASS}
            disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
            onClick={exportExcel}
            title={isEn ? 'Download .xlsx spreadsheet for data analysis' : 'Tải file .xlsx để phân tích số liệu'}
          >
            {exportingXlsx
              ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]">table_chart</span>}
            <span>{exportingXlsx ? (isEn ? 'Generating…' : 'Đang tạo…') : 'Excel'}</span>
          </button>

          {/* CSV (legacy) */}
          <button
            id="btn-export-csv"
            className={SCMS_HERO_BTN_GLASS}
            disabled={loading || !metrics || exportingPdf || exportingXlsx || exportingCsv}
            onClick={exportReport}
            title={isEn ? 'Raw CSV export for custom processing' : 'Xuất CSV thô cho xử lý tuỳ chỉnh'}
          >
            {exportingCsv
              ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]">download</span>}
            <span>CSV</span>
          </button>
        </div>
      </div>
    </section>
  );
}
