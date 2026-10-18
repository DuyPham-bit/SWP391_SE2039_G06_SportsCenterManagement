import React, { useState } from 'react';

export function Table({
  columns,
  data = [],
  searchKey = '',
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  emptyMessage = 'Không có bản ghi nào phù hợp',
  actions = null,
  pageSize = 8
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter(item => {
    if (!searchTerm || !searchKey) return true;
    const val = item[searchKey];
    if (typeof val === 'string') {
      return val.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      {(searchKey || actions) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          {searchKey ? (
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1A3B8B]/20 focus:border-[#1A3B8B] bg-white transition-all"
              />
            </div>
          ) : <div />}

          {actions && <div className="flex items-center gap-2 w-full sm:w-auto">{actions}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-[#F8FAFC] text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3.5 px-4 font-bold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-slate-50/70 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-3.5 px-4 ${col.className || ''}`}>
                      {col.render ? col.render(row, rIdx) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-slate-300">folder_off</span>
                    <span className="text-xs font-medium">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-500">
          <span>
            Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} trên tổng số {filteredData.length} bản ghi
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Trước
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-[#EBF2FC] text-[#1A3B8B] font-bold text-xs">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LoadingSpinner({ text = 'Đang tải dữ liệu...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-[#1A3B8B] rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{text}</span>
    </div>
  );
}
