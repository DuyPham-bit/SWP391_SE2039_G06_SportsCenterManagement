import React from 'react';
import { COACH_CLASS_FILTER } from '../model/staffManagementView.js';

export function StaffFilters({
  coachClassFilter, displayedStaff, handleResetFilters, handleRoleFilterChange, isEn, roleFilter,
  searchQuery, setCoachClassFilter, setSearchQuery, setSortBy, setStatusFilter, sortBy, staffList,
  stats, statusFilter
}) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 p-4 sm:p-5 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search box */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-brand-navy-400 text-[18px]">search</span>
          <input
            type="text"
            aria-label={isEn ? 'Search staff' : 'Tìm nhân viên'}
            placeholder={isEn ? 'Search by name, email, phone, specialty or staff ID...' : 'Tìm theo họ tên, email, SĐT, chuyên môn hoặc mã nhân viên...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50/70 dark:bg-brand-navy-800 text-sm text-brand-navy-900 dark:text-brand-navy-100 placeholder:text-brand-navy-400 focus:bg-white dark:focus:bg-brand-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 focus:border-brand-sage-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-1 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200 rounded-lg hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 transition-colors"
              title={isEn ? 'Clear search' : 'Xóa tìm kiếm'}
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

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
              <option value="ROLE" className="dark:bg-brand-navy-800">{isEn ? 'By Role' : 'Theo vai trò'}</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL' || coachClassFilter !== COACH_CLASS_FILTER.ALL || sortBy !== 'DEFAULT') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-brand-navy-600 dark:text-brand-navy-300 bg-brand-navy-100 dark:bg-brand-navy-800 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span className="hidden sm:inline">{isEn ? 'Reset' : 'Đặt lại'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs by Role and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-brand-navy-100 dark:border-brand-navy-800 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-400 mr-1 hidden lg:inline">
            {isEn ? 'Role:' : 'Vai trò:'}
          </span>
          <button
            onClick={() => handleRoleFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'ALL'
                  ? 'bg-brand-navy-900 text-white shadow-sm'
                  : 'bg-brand-navy-100 dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-200 dark:hover:bg-brand-navy-700'
              }`}
          >
            {isEn ? 'All' : 'Tất cả'} ({staffList.length})
          </button>
          <button
            onClick={() => handleRoleFilterChange('COACH')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'COACH'
                  ? 'bg-brand-sand-600 text-white shadow-sm shadow-brand-sand-600/20'
                  : 'bg-brand-sand-50 dark:bg-brand-sand-950/40 text-brand-sand-700 dark:text-brand-sand-300 hover:bg-brand-sand-100 dark:hover:bg-brand-sand-900/60'
              }`}
          >
            {isEn ? 'Coaches' : 'HLV'} ({stats.coaches})
          </button>
          <button
            onClick={() => handleRoleFilterChange('RECEPTIONIST')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'RECEPTIONIST'
                  ? 'bg-brand-navy-700 text-white shadow-sm shadow-brand-navy-700/20'
                  : 'bg-brand-navy-50 dark:bg-brand-navy-950/40 text-brand-navy-800 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-900/60'
              }`}
          >
            {isEn ? 'Receptionists' : 'Lễ tân'} ({stats.receptionists})
          </button>
          <button
            onClick={() => handleRoleFilterChange('MANAGER')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                roleFilter === 'MANAGER'
                  ? 'bg-brand-sage-700 text-white shadow-sm shadow-brand-sage-700/20'
                  : 'bg-brand-sage-700/10 text-brand-sage-700 dark:text-brand-sage-500 hover:bg-brand-sage-700/20'
              }`}
          >
            {isEn ? 'Managers' : 'Quản lý'} ({stats.managers})
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <div className="inline-flex rounded-lg bg-brand-navy-100 dark:bg-brand-navy-800 p-0.5 border border-brand-navy-200 dark:border-brand-navy-700">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-xs'
                    : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
                }`}
            >
              {isEn ? 'All' : 'Tất cả'}
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white dark:bg-brand-navy-900 text-brand-sage-700 dark:text-brand-sage-400 shadow-xs'
                    : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
                }`}
            >
              {isEn ? 'Active' : 'Hoạt động'}
            </button>
            <button
              onClick={() => setStatusFilter('DISABLED')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all ${
                  statusFilter === 'DISABLED'
                    ? 'bg-white dark:bg-brand-navy-900 text-brand-danger-700 dark:text-brand-danger-400 shadow-xs'
                    : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-200'
                }`}
            >
              {isEn ? 'Locked' : 'Đã khóa'}
            </button>
          </div>
          <span className="text-brand-navy-400">·</span>
          <span className="font-medium text-brand-navy-500 dark:text-brand-navy-400">
            {isEn ? 'Showing' : 'Hiển thị'} <strong className="text-brand-navy-800 dark:text-brand-navy-200">{displayedStaff.length}</strong> / {staffList.length}
          </span>
        </div>
      </div>

      {roleFilter === 'COACH' && (
        <div className="flex flex-wrap items-center gap-2 border-t border-brand-navy-100 dark:border-brand-navy-800 pt-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-brand-navy-400 mr-1">
            {isEn ? 'Class assignment:' : 'Phân công lớp:'}
          </span>
          {[
            [COACH_CLASS_FILTER.ALL, isEn ? 'All coaches' : 'Tất cả HLV', stats.coaches],
            [COACH_CLASS_FILTER.UNASSIGNED, isEn ? 'Without classes' : 'Chưa có lớp', stats.coachesWithoutClasses],
            [COACH_CLASS_FILTER.ASSIGNED, isEn ? 'With classes' : 'Đã có lớp', stats.coachesWithClasses]
          ].map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCoachClassFilter(value)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                  coachClassFilter === value
                    ? value === COACH_CLASS_FILTER.UNASSIGNED
                      ? 'bg-brand-danger-600 border-brand-danger-600 text-white shadow-sm'
                      : 'bg-brand-sand-600 border-brand-sand-600 text-white shadow-sm'
                    : 'bg-white dark:bg-brand-navy-900 border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 hover:border-brand-sand-400'
                }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
