import React from 'react';

export function ClassesToolbar({
  classGroups, data, isEn, searchQuery, selectedSportFilter, selectedStatusFilter, setSearchQuery,
  setSelectedSportFilter, setSelectedStatusFilter, setTab, setViewMode, tab, viewMode
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 p-4 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        {/* Segmented Tab Buttons */}
        <div className="flex items-center p-1 bg-brand-navy-100 dark:bg-brand-navy-800 rounded-xl max-w-full overflow-x-auto">
          <button
            onClick={() => {
              setTab('classes');
              setSelectedSportFilter('');
              setSelectedStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'classes'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">school</span>
            <span>{isEn ? 'Active Classes' : 'Lớp đào tạo'}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'classes' ? 'bg-brand-sage-700/10 text-brand-sage-700 dark:text-brand-sage-500' : 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300'
                }`}
            >
              {classGroups.active.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('cancelled');
              setSelectedSportFilter('');
              setSelectedStatusFilter('');
            }}
            className={`flex shrink-0 items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'cancelled'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-danger-700 dark:text-brand-danger-400 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">event_busy</span>
            <span>{isEn ? 'Cancelled Classes' : 'Lớp đã hủy'}</span>
            <span className="text-[11px]">{classGroups.cancelled.length}</span>
          </button>

          <button
            onClick={() => {
              setTab('rooms');
              setSelectedSportFilter('');
              setSelectedStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'rooms'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">meeting_room</span>
            <span>{isEn ? 'Courts & Rooms' : 'Phòng tập & Sân bãi'}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'rooms' ? 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/40 dark:text-brand-teal-300' : 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300'
                }`}
            >
              {data.rooms.length}
            </span>
          </button>

          <button
            onClick={() => {
              setTab('sports');
              setSelectedSportFilter('');
              setSelectedStatusFilter('');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
                tab === 'sports'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">fitness_center</span>
            <span>{isEn ? 'Disciplines' : 'Bộ môn thể thao'}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  tab === 'sports' ? 'bg-brand-sand-50 text-brand-sand-700 dark:bg-brand-sand-950/40 dark:text-brand-sand-300' : 'bg-brand-navy-200 dark:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300'
                }`}
            >
              {data.sports.length}
            </span>
          </button>
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
            placeholder={
              tab === 'classes'
                ? isEn
                  ? 'Search by class name, sport, coach, room...'
                  : 'Tìm theo tên lớp, bộ môn, HLV phụ trách, phòng tập...'
                : tab === 'rooms'
                ? isEn
                  ? 'Search by room name, type, location...'
                  : 'Tìm theo tên phòng, loại phòng, vị trí sân bãi...'
                : isEn
                ? 'Search by discipline name, description...'
                : 'Tìm theo tên bộ môn, mô tả quy chuẩn...'
            }
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
        {tab === 'classes' && (
          <div className="w-full md:w-56">
            <select
              value={selectedSportFilter}
              onChange={(e) => setSelectedSportFilter(e.target.value)}
              className="w-full py-2 px-3 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-700 dark:text-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
            >
              <option value="">{isEn ? 'All disciplines' : 'Tất cả bộ môn'}</option>
              {data.sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-brand-navy-50 dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl text-sm text-brand-navy-700 dark:text-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500"
          >
            <option value="">{isEn ? 'All statuses' : 'Tất cả trạng thái'}</option>
            {tab === 'classes' ? (
              <>
                <option value="Published">{isEn ? 'Published' : 'Đang mở (Published)'}</option>
                <option value="Draft">{isEn ? 'Draft' : 'Bản nháp (Draft)'}</option>
                <option value="Cancelled">{isEn ? 'Cancelled' : 'Đã hủy (Cancelled)'}</option>
              </>
            ) : (
              <>
                <option value="Active">{isEn ? 'Active' : 'Đang sử dụng (Active)'}</option>
                <option value="Inactive">{isEn ? 'Inactive' : 'Ngừng sử dụng (Inactive)'}</option>
              </>
            )}
          </select>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedSportFilter || selectedStatusFilter) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSportFilter('');
              setSelectedStatusFilter('');
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
