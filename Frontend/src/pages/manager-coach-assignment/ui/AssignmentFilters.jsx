import React from 'react';

export function AssignmentFilters({
  classes, isEn, metrics, publicationTab, searchQuery, selectedSportFilter, selectedStatusFilter,
  setPublicationTab, setSearchQuery, setSelectedSportFilter, setSelectedStatusFilter, setViewMode,
  uniqueSports, viewMode
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-4 shadow-sm space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 p-1.5" role="tablist" aria-label={isEn ? 'Class publication status' : 'Trạng thái công bố lớp'}>
        {[
          { id: 'PUBLISHED', label: isEn ? 'Published classes' : 'Lớp đã công bố', icon: 'public', count: classes.filter(c => String(c.status).toUpperCase() === 'PUBLISHED').length },
          { id: 'PENDING', label: isEn ? 'Pending publication' : 'Lớp chờ công bố', icon: 'pending_actions', count: classes.filter(c => String(c.status).toUpperCase() !== 'PUBLISHED').length }
        ].map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={publicationTab === item.id}
            onClick={() => setPublicationTab(item.id)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold transition-all ${publicationTab === item.id
                ? 'bg-white dark:bg-brand-navy-900 text-brand-sage-700 dark:text-brand-sage-500 shadow-sm ring-1 ring-brand-navy-200 dark:ring-brand-navy-700'
                : 'text-brand-navy-500 dark:text-brand-navy-400 hover:text-brand-navy-800 dark:hover:text-brand-navy-200'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            <span>{item.label}</span>
            <span className="rounded-full bg-brand-navy-200 dark:bg-brand-navy-700 px-2 py-0.5 text-[11px]">{item.count}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        {/* Status Filter Buttons */}
        <div className="flex items-center p-1 bg-brand-navy-100 dark:bg-brand-navy-800 rounded-xl max-w-full overflow-x-auto">
          <button
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
              }`}
          >
            <span>{isEn ? 'All' : 'Tất cả'}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300">
              {metrics.totalClasses}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('ASSIGNED')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'ASSIGNED'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-sage-800 dark:text-brand-sage-300 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-brand-sage-500" />
            <span>{isEn ? 'Assigned' : 'Đã có HLV'}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300">
              {metrics.assignedClasses}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusFilter('UNASSIGNED')}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                selectedStatusFilter === 'UNASSIGNED'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-sand-800 dark:text-brand-sand-300 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-brand-sand-500" />
            <span>{isEn ? 'Unassigned' : 'Chưa phân công'}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300">
              {metrics.unassignedClasses}
            </span>
          </button>

          {metrics.mismatchCount > 0 && (
            <button
              onClick={() => setSelectedStatusFilter('MISMATCH')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                  selectedStatusFilter === 'MISMATCH'
                    ? 'bg-white dark:bg-brand-navy-900 text-brand-danger-800 dark:text-brand-danger-300 shadow-sm'
                    : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
                }`}
            >
              <span className="w-2 h-2 rounded-full bg-brand-danger-500" />
              <span>{isEn ? 'Discipline Mismatch' : 'Lệch chuyên môn'}</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300">
                {metrics.mismatchCount}
              </span>
            </button>
          )}
        </div>

        {/* View Mode Toggle: Grid Cards vs List Table */}
        <div className="flex items-center gap-1 bg-brand-navy-100 dark:bg-brand-navy-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            title={isEn ? 'Card view' : 'Chế độ thẻ trực quan'}
            className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards' ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm' : 'text-brand-navy-500 hover:text-brand-navy-800 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            title={isEn ? 'Table view' : 'Chế độ bảng dữ liệu'}
            className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm' : 'text-brand-navy-500 hover:text-brand-navy-800 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">view_list</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-navy-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? 'Search by class name, sport, coach, court...' : 'Tìm theo tên lớp, bộ môn, tên HLV phụ trách, phòng tập...'}
            className="w-full pl-10 pr-9 py-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-900 dark:text-brand-navy-100 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Sport Filter */}
        <div className="w-full md:w-56">
          <select
            value={selectedSportFilter}
            onChange={(e) => setSelectedSportFilter(e.target.value)}
            className="w-full py-2 px-3 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-700 dark:text-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
          >
            <option value="">{isEn ? `All disciplines (${uniqueSports.length})` : `Tất cả bộ môn (${uniqueSports.length})`}</option>
            {uniqueSports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || selectedSportFilter || selectedStatusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSportFilter('');
              setSelectedStatusFilter('ALL');
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-danger-600 dark:text-brand-danger-400 bg-brand-danger-50 dark:bg-brand-danger-950/40 hover:bg-brand-danger-100 rounded-xl transition shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
            {isEn ? 'Clear filters' : 'Xóa bộ lọc'}
          </button>
        )}
      </div>
    </div>
  );
}
