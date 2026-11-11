import React, { useMemo } from 'react';
import {
  buildZoneMap, isLegacyZoneList, usePublicCatalog, zoneRoomSource,
  ZONE_COLORS, ZONE_ICONS, ZONE_MAP_COLUMNS, ZONE_MAP_ROWS
} from '../../../entities/catalog/index.js';
import { ZoneMap } from '../../../widgets/zone-map/index.js';
import { TabSaveFooter } from './TabSaveFooter.jsx';

const AMENITY_ICONS = ['local_parking', 'shower', 'lock', 'wifi', 'local_cafe', 'medical_services', 'ac_unit', 'accessible', 'storefront', 'child_care'];
const MAX_AMENITIES = 6;

const inputClass = 'w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none';
const labelClass = 'block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase tracking-wide mb-1';
const iconButtonClass = 'w-8 h-8 inline-flex items-center justify-center rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer';

/** Stored shape of one zone's display settings (all strings + isVisible, as the landing API accepts). */
const toSetting = zone => ({
  id: String(zone.id),
  key: String(zone.key),
  name: zone.name === zone.key ? '' : String(zone.name || ''),
  icon: String(zone.icon || ''),
  color: String(zone.color || ''),
  description: String(zone.description || ''),
  col: zone.col ? String(zone.col) : '',
  row: zone.row ? String(zone.row) : '',
  isVisible: zone.isVisible !== false
});

export function ZonesTab({ content, handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving, updateContentField }) {
  const { catalog, loading: catalogLoading, error: catalogError } = usePublicCatalog();
  const layout = content.zonesLayout || {};
  const entries = layout.zones || [];
  const legacy = isLegacyZoneList(entries);

  // Rooms come straight from the DB (Classes & Rooms), exactly as the homepage map reads them.
  const facilities = useMemo(() => zoneRoomSource(content, catalog), [content, catalog]);
  const zones = useMemo(() => (legacy ? [] : buildZoneMap(facilities, entries, { includeHidden: true })), [facilities, entries, legacy]);
  const visibleZones = zones.filter(zone => zone.isVisible);

  const writeZones = next => updateContentField('zonesLayout', 'zones', next.map(toSetting));
  const updateZone = (key, patch) => writeZones(zones.map(zone => (zone.key === key ? { ...zone, ...patch } : zone)));
  const moveZone = (index, delta) => {
    const next = [...zones];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    writeZones(next);
  };
  const resetZones = () => updateContentField('zonesLayout', 'zones', []);

  const amenities = layout.serviceAmenities || [];
  const updateAmenity = (index, patch) => updateContentField('zonesLayout', 'serviceAmenities',
    amenities.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const addAmenity = () => updateContentField('zonesLayout', 'serviceAmenities',
    [...amenities, { id: `amenity-${Date.now()}`, icon: AMENITY_ICONS[amenities.length % AMENITY_ICONS.length], text: '' }]);
  const removeAmenity = index => updateContentField('zonesLayout', 'serviceAmenities', amenities.filter((_, i) => i !== index));

  const cellTaken = (zone, col, row) => zones.some(other => other.key !== zone.key && other.isVisible
    && other.col === col && other.row === row);

  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? 'Section 5: Training Zone Map' : 'Khu Vực 5: Sơ Đồ Các Khu Vực Tập Luyện'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
          {isEn
            ? 'Rooms and courts are read from Classes & Rooms and grouped by their location ("Zone A • Floor 2"). Here you choose how each zone looks and where it sits on the map.'
            : 'Phòng/sân được đọc từ mục Lớp học & Phòng tập và tự nhóm theo vị trí (VD: "Khu A • Tầng 2"). Tại đây bạn chỉnh cách hiển thị và vị trí của từng khu trên sơ đồ.'}
        </p>
      </div>

      {/* Section texts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className={labelClass}>{isEn ? 'Badge' : 'Nhãn nhỏ'}</span>
          <input type="text" maxLength={80} value={layout.badge || ''} onChange={e => updateContentField('zonesLayout', 'badge', e.target.value)} className={`${inputClass} uppercase font-bold`} />
        </label>
        <label className="block md:col-span-2">
          <span className={labelClass}>{isEn ? 'Section title' : 'Tiêu đề sơ đồ'}</span>
          <input type="text" maxLength={120} value={layout.title || ''} onChange={e => updateContentField('zonesLayout', 'title', e.target.value)} className={`${inputClass} uppercase font-extrabold`} />
        </label>
        <label className="block md:col-span-3">
          <span className={labelClass}>{isEn ? 'Description (leave empty for an automatic summary)' : 'Mô tả (để trống để tự tóm tắt số phòng & khu)'}</span>
          <textarea rows={2} maxLength={600} value={layout.description || ''} onChange={e => updateContentField('zonesLayout', 'description', e.target.value)} className={inputClass} />
        </label>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <span className={labelClass}>{isEn ? 'Live preview' : 'Xem trước sơ đồ'}</span>
        <div className="rounded-2xl bg-[#25283c] p-3 sm:p-4">
          {catalogLoading
            ? <p className="text-xs text-white/70 p-4">{isEn ? 'Loading rooms…' : 'Đang tải danh sách phòng…'}</p>
            : <ZoneMap zones={legacy ? entries : visibleZones} isEn={isEn} compact />}
        </div>
        {catalogError && <p role="alert" className="text-xs text-brand-danger-600">{catalogError}</p>}
      </div>

      {legacy && (
        <div role="status" className="rounded-xl border border-brand-sand-300 bg-brand-sand-50 dark:bg-brand-navy-800 p-4 text-xs text-brand-navy-700 dark:text-brand-navy-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="flex-1">
            {isEn
              ? 'This page still uses hand-written zones from an older version. Switch to the automatic map to read rooms from the database.'
              : 'Trang đang dùng danh sách khu viết tay từ phiên bản cũ. Chuyển sang sơ đồ tự động để đọc phòng/sân từ cơ sở dữ liệu.'}
          </span>
          <button type="button" onClick={resetZones} className="rounded-lg bg-brand-sage-700 px-3 py-2 font-bold text-white hover:bg-brand-sage-900 cursor-pointer">
            {isEn ? 'Use automatic map' : 'Dùng sơ đồ tự động'}
          </button>
        </div>
      )}

      {/* Per-zone settings */}
      {!legacy && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={labelClass}>{isEn ? `Zones (${zones.length})` : `Các khu (${zones.length})`}</span>
            {entries.length > 0 && (
              <button type="button" onClick={resetZones} className="text-[11px] font-bold text-brand-navy-500 hover:text-brand-terra-700 underline cursor-pointer">
                {isEn ? 'Reset to automatic layout' : 'Khôi phục bố trí tự động'}
              </button>
            )}
          </div>
          {!catalogLoading && zones.length === 0 && (
            <p className="rounded-xl border border-dashed border-brand-navy-300 dark:border-brand-navy-700 p-4 text-xs text-brand-navy-600 dark:text-brand-navy-300">
              {isEn
                ? 'No rooms to group yet. Add rooms (with a location such as "Zone A • Floor 2") in Classes & Rooms, or show facility cards in section 4.'
                : 'Chưa có phòng/sân để nhóm. Hãy thêm phòng (vị trí dạng "Khu A • Tầng 2") ở mục Lớp học & Phòng tập, hoặc hiển thị thẻ cụm sân ở mục 4.'}
            </p>
          )}

          {zones.map((zone, index) => (
            <article key={zone.key} className={`rounded-2xl border p-4 space-y-3 ${zone.isVisible ? 'border-brand-navy-200 dark:border-brand-navy-700' : 'border-dashed border-brand-navy-300 dark:border-brand-navy-700 opacity-70'}`}
              style={{ borderLeft: `5px solid ${zone.color}` }}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-brand-navy-900 shrink-0" style={{ background: zone.color }}>
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{zone.icon}</span>
                </span>
                <div className="flex-1 min-w-[160px]">
                  <p className="text-sm font-black text-brand-navy-900 dark:text-white">{zone.name}</p>
                  <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                    {isEn ? 'DB location' : 'Vị trí trong DB'}: <strong>{zone.key}</strong> · {zone.rooms.length} {isEn ? 'rooms' : 'phòng/sân'}
                    {zone.capacityTotal ? ` · ${zone.capacityTotal} ${isEn ? 'people' : 'người'}` : ''}
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-200 cursor-pointer">
                  <input type="checkbox" checked={zone.isVisible} onChange={e => updateZone(zone.key, { isVisible: e.target.checked })} className="w-4 h-4 accent-brand-sage-700" />
                  {isEn ? 'Show' : 'Hiển thị'}
                </label>
                <div className="flex gap-1">
                  <button type="button" className={iconButtonClass} onClick={() => moveZone(index, -1)} disabled={index === 0} aria-label={isEn ? 'Move up' : 'Đưa lên'}>
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button type="button" className={iconButtonClass} onClick={() => moveZone(index, 1)} disabled={index === zones.length - 1} aria-label={isEn ? 'Move down' : 'Đưa xuống'}>
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelClass}>{isEn ? 'Display name' : 'Tên hiển thị'}</span>
                  <input type="text" maxLength={80} placeholder={zone.key} value={zone.name === zone.key ? '' : zone.name}
                    onChange={e => updateZone(zone.key, { name: e.target.value || zone.key })} className={inputClass} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>{isEn ? 'Map column' : 'Cột trên sơ đồ'}</span>
                    <select value={zone.col || ''} onChange={e => updateZone(zone.key, { col: Number(e.target.value) || null })} className={inputClass}>
                      <option value="">{isEn ? 'Automatic' : 'Tự động'}</option>
                      {Array.from({ length: ZONE_MAP_COLUMNS }, (_, i) => i + 1).map(col => (
                        <option key={col} value={col} disabled={zone.row && cellTaken(zone, col, zone.row)}>{isEn ? `Column ${col}` : `Cột ${col}`}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>{isEn ? 'Map row' : 'Hàng trên sơ đồ'}</span>
                    <select value={zone.row || ''} onChange={e => updateZone(zone.key, { row: Number(e.target.value) || null })} className={inputClass}>
                      <option value="">{isEn ? 'Automatic' : 'Tự động'}</option>
                      {Array.from({ length: ZONE_MAP_ROWS }, (_, i) => i + 1).map(row => (
                        <option key={row} value={row} disabled={zone.col && cellTaken(zone, zone.col, row)}>{isEn ? `Row ${row}` : `Hàng ${row}`}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block lg:col-span-2">
                  <span className={labelClass}>{isEn ? 'Zone description' : 'Mô tả khu'}</span>
                  <textarea rows={2} maxLength={400} value={zone.description} onChange={e => updateZone(zone.key, { description: e.target.value })} className={inputClass}
                    placeholder={isEn ? 'e.g. Air-conditioned, lockers next to the entrance' : 'VD: Có điều hoà, tủ đồ cạnh lối vào'} />
                </label>
                <div>
                  <span className={labelClass}>{isEn ? 'Icon' : 'Biểu tượng'}</span>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={isEn ? 'Zone icon' : 'Biểu tượng khu'}>
                    {ZONE_ICONS.map(icon => (
                      <button key={icon} type="button" role="radio" aria-checked={zone.icon === icon} aria-label={icon}
                        onClick={() => updateZone(zone.key, { icon })}
                        className={`w-8 h-8 rounded-lg inline-flex items-center justify-center border cursor-pointer ${zone.icon === icon ? 'border-brand-sage-700 bg-brand-sage-700 text-white' : 'border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800'}`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className={labelClass}>{isEn ? 'Colour' : 'Màu khu'}</span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={isEn ? 'Zone colour' : 'Màu khu'}>
                    {ZONE_COLORS.map(color => (
                      <button key={color} type="button" role="radio" aria-checked={zone.color === color} aria-label={color}
                        onClick={() => updateZone(zone.key, { color })}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer ${zone.color === color ? 'border-brand-navy-900 dark:border-white scale-110' : 'border-transparent'}`}
                        style={{ background: color }} />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
                {isEn ? 'Rooms' : 'Phòng/sân'}: {zone.rooms.map(room => room.name).join(', ')}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* Service amenities */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={labelClass}>{isEn ? 'Service amenities' : 'Tiện ích dịch vụ'} ({amenities.length}/{MAX_AMENITIES})</span>
          <button type="button" onClick={addAmenity} disabled={amenities.length >= MAX_AMENITIES}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-sage-700 px-2.5 py-1 text-[11px] font-bold text-brand-sage-700 hover:bg-brand-sage-700 hover:text-white disabled:opacity-40 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">add</span>{isEn ? 'Add' : 'Thêm'}
          </button>
        </div>
        {amenities.map((amenity, index) => (
          <div key={amenity.id || index} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-800/50 border border-brand-navy-200 dark:border-brand-navy-800">
            <select value={amenity.icon || ''} onChange={e => updateAmenity(index, { icon: e.target.value })} aria-label={isEn ? 'Amenity icon' : 'Biểu tượng tiện ích'}
              className="w-40 px-2 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-xs text-brand-navy-900 dark:text-white">
              {[...new Set([amenity.icon, ...AMENITY_ICONS].filter(Boolean))].map(icon => <option key={icon} value={icon}>{icon}</option>)}
            </select>
            <span className="material-symbols-outlined text-[20px] text-brand-sage-700 dark:text-brand-sage-500" aria-hidden="true">{amenity.icon}</span>
            <input type="text" maxLength={80} value={amenity.text || ''} onChange={e => updateAmenity(index, { text: e.target.value })}
              placeholder={isEn ? 'e.g. Free parking' : 'VD: Gửi xe miễn phí'} className={`${inputClass} flex-1`} />
            <button type="button" onClick={() => removeAmenity(index)} className={iconButtonClass} aria-label={isEn ? 'Remove amenity' : 'Xoá tiện ích'}>
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        ))}
      </div>

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
