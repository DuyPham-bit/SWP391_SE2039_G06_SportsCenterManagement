import React from 'react';

export function MembersFilters({
  data, filter, filteredAndSortedItems, handleResetSearch, handleSearchSubmit, isEn, loading, query,
  setQuery, setSortBy, setStatusFilter, sortBy, statusFilter
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 p-4 sm:p-5 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-brand-navy-400 text-[18px]">search</span>
          <input
            type="text"
            aria-label={isEn ? 'Search members' : 'Tìm thành viên'}
            placeholder={isEn ? 'Search by name, ID (MEM-...), email, phone...' : 'Tìm kiếm theo họ tên, mã thẻ (MEM-...), email, số điện thoại...'}
            maxLength={100}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/70 dark:bg-brand-navy-800 text-sm text-brand-navy-900 dark:text-brand-navy-100 placeholder:text-brand-navy-400 focus:bg-white dark:focus:bg-brand-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
              className="absolute right-[4.75rem] top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200 rounded-lg hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 transition-colors"
              title={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
            >
              <span className="material-symbols-outlined text-[16px] leading-none">close</span>
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-brand-navy-900 hover:bg-brand-navy-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isEn ? 'Search' : 'Tìm'}
          </button>
        </form>

        {/* Quick Actions & Sorting */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-xs text-brand-navy-600 dark:text-brand-navy-300 font-medium">
            <span className="material-symbols-outlined text-[16px] text-brand-navy-400">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none font-semibold text-brand-navy-800 dark:text-brand-navy-200 cursor-pointer"
            >
              <option value="DEFAULT" className="dark:bg-brand-navy-800">{isEn ? 'Sort: Default' : 'Sắp xếp: Mặc định'}</option>
              <option value="NAME_ASC" className="dark:bg-brand-navy-800">{isEn ? 'Name: A → Z' : 'Họ tên: A → Z'}</option>
              <option value="NAME_DESC" className="dark:bg-brand-navy-800">{isEn ? 'Name: Z → A' : 'Họ tên: Z → A'}</option>
              <option value="EXPIRY" className="dark:bg-brand-navy-800">{isEn ? 'Expiring soonest' : 'Hạn gói gần nhất'}</option>
            </select>
          </div>

          {(filter.query || statusFilter !== 'ALL' || sortBy !== 'DEFAULT') && (
            <button
              type="button"
              onClick={handleResetSearch}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-brand-navy-600 dark:text-brand-navy-300 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span className="hidden sm:inline">{isEn ? 'Reset' : 'Đặt lại'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-t border-brand-navy-100 dark:border-brand-navy-800 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-brand-navy-900 text-white shadow-sm'
                  : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700'
              }`}
          >
            {isEn ? 'All' : 'Tất cả'} ({data.items?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-brand-sage-700 text-white shadow-sm shadow-brand-sage-600/20'
                  : 'bg-brand-sage-50 dark:bg-brand-sage-950/40 text-brand-sage-700 dark:text-brand-sage-300 hover:bg-brand-sage-100 dark:hover:bg-brand-sage-900/60'
              }`}
          >
            {isEn ? 'Active' : 'Đang hoạt động'}
          </button>
          <button
            onClick={() => setStatusFilter('HAS_PACKAGE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'HAS_PACKAGE'
                  ? 'bg-brand-sage-700 text-white shadow-sm shadow-brand-sage-700/20'
                  : 'bg-brand-sage-700/10 text-brand-sage-700 dark:text-brand-sage-500 hover:bg-brand-sage-700/20'
              }`}
          >
            {isEn ? 'Has Package' : 'Có gói tập'}
          </button>
          <button
            onClick={() => setStatusFilter('NO_PACKAGE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'NO_PACKAGE'
                  ? 'bg-brand-sand-600 text-white shadow-sm shadow-brand-sand-600/20'
                  : 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 hover:bg-brand-sand-100 dark:hover:bg-brand-sand-900/60'
              }`}
          >
            {isEn ? 'No Package / Expired' : 'Chưa có / Hết hạn'}
          </button>
          <button
            onClick={() => setStatusFilter('DISABLED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === 'DISABLED'
                  ? 'bg-brand-danger-600 text-white shadow-sm shadow-brand-danger-600/20'
                  : 'bg-brand-danger-50 dark:bg-brand-danger-950/40 text-brand-danger-700 dark:text-brand-danger-300 hover:bg-brand-danger-100 dark:hover:bg-brand-danger-900/60'
              }`}
          >
            {isEn ? 'Locked' : 'Đã khóa'}
          </button>
        </div>

        <div className="hidden sm:block text-xs font-medium text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'Showing' : 'Hiển thị'} <span className="font-bold text-brand-navy-800 dark:text-brand-navy-200">{filteredAndSortedItems.length}</span> / {data.totalCount} {isEn ? 'members' : 'hội viên'}
        </div>
      </div>
    </div>
  );
}
