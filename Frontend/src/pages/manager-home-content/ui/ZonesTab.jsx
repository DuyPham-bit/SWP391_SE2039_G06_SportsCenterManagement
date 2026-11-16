import React from 'react';
import { TabSaveFooter } from './TabSaveFooter.jsx';

export function ZonesTab({ content, handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving, updateContentField }) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? 'Section 5: Training Zones & Service Amenities' : 'Khu Vực 5: Sơ Đồ Các Khu Vực Tập Luyện'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
          {isEn
            ? 'Update 4 service amenities and layout of Zones A, B, C and Outdoor.'
            : 'Cập nhật 4 tiện ích dịch vụ bên trái và bố trí các phân khu Khu A, B, C và Ngoài trời.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Layout Section Title:' : 'Tiêu đề Section Sơ Đồ:'}
            </label>
            <input
              type="text"
              value={content.zonesLayout.title}
              onChange={(e) => updateContentField('zonesLayout', 'title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm font-extrabold uppercase focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'General Description:' : 'Mô tả tổng quát:'}
            </label>
            <textarea
              rows={3}
              value={content.zonesLayout.description}
              onChange={(e) => updateContentField('zonesLayout', 'description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          {/* 4 Amenities */}
          <div className="space-y-2 pt-2">
            <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
              {isEn ? '4 Attached Service Amenities:' : '4 Tiện Ích Dịch Vụ Đi Kèm:'}
            </span>
            {content.zonesLayout.serviceAmenities.map((sa, idx) => (
              <div key={sa.id || idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800 hover-lift transition-all">
                <span className="w-8 h-8 rounded-lg bg-brand-sage-700/15 text-brand-sage-700 dark:text-brand-sage-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">{sa.icon}</span>
                </span>
                <input
                  type="text"
                  value={sa.text}
                  onChange={(e) => {
                    const updated = [...content.zonesLayout.serviceAmenities];
                    updated[idx] = { ...updated[idx], text: e.target.value };
                    updateContentField('zonesLayout', 'serviceAmenities', updated);
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 4 Zones */}
        <div className="space-y-3">
          <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
            {isEn ? '4 Facility Zone Blocks:' : '4 Khối Phân Bố Khu Vực:'}
          </span>
          {content.zonesLayout.zones.map((zn, idx) => (
            <div key={zn.id || idx} className="p-4 rounded-xl bg-brand-navy-900 text-white space-y-2 border border-white/10 hover-lift transition-all">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-brand-sage-700 dark:text-brand-sage-400">{zn.icon}</span>
                <input
                  type="text"
                  value={zn.name}
                  onChange={(e) => {
                    const updated = [...content.zonesLayout.zones];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    updateContentField('zonesLayout', 'zones', updated);
                  }}
                  className="flex-1 px-3 py-1 bg-white/10 rounded-lg border border-white/20 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                />
              </div>
              <div className="space-y-1.5 pl-6">
                {zn.items.map((it, itIdx) => (
                  <input
                    key={itIdx}
                    type="text"
                    value={it}
                    onChange={(e) => {
                      const updated = [...content.zonesLayout.zones];
                      updated[idx] = { ...updated[idx], items: updated[idx].items.map((item, index) => index === itIdx ? e.target.value : item) };
                      updateContentField('zonesLayout', 'zones', updated);
                    }}
                    className="w-full px-2.5 py-1 bg-white/5 rounded-lg border border-white/10 text-[11px] text-brand-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
