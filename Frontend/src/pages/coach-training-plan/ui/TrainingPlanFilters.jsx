import React from 'react';
import { getSportBadgeTheme } from '../lib/planPresets.js';
import { translateClassName } from '../../../shared/i18n/i18nHelper.js';

export function TrainingPlanFilters({
  classFilterList, isEn, plans, searchQuery, selectedFilterClass, setSearchQuery,
  setSelectedFilterClass, setTypeFilter, stats, typeFilter
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-navy-200/80 p-4 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-navy-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isEn ? "Search by plan title, student name, goal, or sport..." : "Tìm kiếm theo tên giáo án, học viên, mục tiêu hoặc bộ môn..."}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500 focus:border-brand-sage-500 bg-brand-navy-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy-400 hover:text-brand-navy-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-brand-navy-100/80 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-white text-brand-navy-900 shadow-xs'
                  : 'text-brand-navy-600 hover:text-brand-navy-900'
              }`}
          >
            {isEn ? `All (${plans.length})` : `Tất cả (${plans.length})`}
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'CUSTOM'
                  ? 'bg-brand-sand-100 text-brand-sand-900 shadow-xs'
                  : 'text-brand-navy-600 hover:text-brand-sand-700'
              }`}
          >
            <span className="material-symbols-outlined text-[14px]">star</span>
            <span>{isEn ? `Custom (${stats.custom})` : `Cá nhân (${stats.custom})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('CLASS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                typeFilter === 'CLASS'
                  ? 'bg-brand-teal-100 text-brand-teal-900 shadow-xs'
                  : 'text-brand-navy-600 hover:text-brand-teal-700'
              }`}
          >
            <span className="material-symbols-outlined text-[14px]">groups</span>
            <span>{isEn ? `Class (${stats.classCount})` : `Cả lớp (${stats.classCount})`}</span>
          </button>
        </div>
      </div>

      {/* Class Filter Tabs */}
      {classFilterList.length > 0 && (
        <div className="pt-2 border-t border-brand-navy-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedFilterClass('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer shrink-0 ${
                selectedFilterClass === 'ALL'
                  ? 'bg-brand-navy-700 text-brand-sand-300 shadow-xs'
                  : 'bg-white text-brand-navy-600 border border-brand-navy-200 hover:bg-brand-navy-50'
              }`}
          >
            {isEn ? `All Classes (${plans.length})` : `Tất cả lớp (${plans.length})`}
          </button>
          {classFilterList.map(c => {
            const sportTheme = getSportBadgeTheme(c.sportName, isEn);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedFilterClass(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedFilterClass === c.id
                      ? 'bg-brand-navy-700 text-brand-sand-300 shadow-xs'
                      : 'bg-white text-brand-navy-600 border border-brand-navy-200 hover:bg-brand-navy-50'
                  }`}
              >
                <span className={`material-symbols-outlined text-[15px] ${selectedFilterClass === c.id ? 'text-brand-sand-300' : 'text-brand-navy-400'}`}>
                  {sportTheme.icon}
                </span>
                <span>{translateClassName(c.displayName, isEn)}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    c.count > 0
                      ? (selectedFilterClass === c.id ? 'bg-brand-sand-300/20 text-brand-sand-300' : 'bg-brand-navy-100 text-brand-navy-700')
                      : 'text-brand-navy-400'
                  }`}>
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
