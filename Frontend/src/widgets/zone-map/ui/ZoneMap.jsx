import React, { useEffect, useMemo, useState } from 'react';
import { ZONE_MAP_COLUMNS, ZONE_MAP_ROWS } from '../../../entities/catalog/index.js';

const formatCapacity = (value, isEn) => (value ? `${value.toLocaleString('vi-VN')} ${isEn ? 'people' : 'người'}` : '');

/**
 * Site plan of the training zones. Each zone is a block on a 3×4 floor-plan grid (manager-chosen cell,
 * otherwise auto-placed) holding its rooms; selecting a block shows its rooms in the side panel, and a
 * room opens the facility detail through onOpenRoom. Rooms come from the data, never from this component.
 */
export function ZoneMap({ zones = [], isEn = false, onOpenRoom, translateName = name => name, compact = false }) {
  const [selectedId, setSelectedId] = useState(zones[0]?.id ?? null);
  useEffect(() => {
    if (!zones.some(zone => zone.id === selectedId)) setSelectedId(zones[0]?.id ?? null);
  }, [zones, selectedId]);

  const selected = zones.find(zone => zone.id === selectedId) || zones[0];
  const totals = useMemo(() => ({
    rooms: zones.reduce((total, zone) => total + (zone.rooms?.length ?? zone.items?.length ?? 0), 0),
    capacity: zones.reduce((total, zone) => total + (zone.capacityTotal || 0), 0)
  }), [zones]);

  // Only as many plan rows as the zones need (wide auto-placed blocks take two cells), up to the
  // lowest row a manager placed a zone on, so a small centre does not show an empty floor plan.
  const planRows = useMemo(() => {
    const cells = zones.reduce((total, zone) => {
      const roomCount = zone.rooms?.length ?? zone.items?.length ?? 0;
      return total + (!zone.col && roomCount >= 3 ? 2 : 1);
    }, 0);
    const lowestPlaced = Math.max(0, ...zones.map(zone => zone.row || 0));
    return Math.min(Math.max(1, Math.ceil(cells / ZONE_MAP_COLUMNS), lowestPlaced), Math.max(ZONE_MAP_ROWS, lowestPlaced));
  }, [zones]);

  if (!zones.length) {
    return (
      <div className="zmap-empty" role="status">
        <span className="material-symbols-outlined" aria-hidden="true">map</span>
        <span>{isEn ? 'No training zones to show yet.' : 'Chưa có khu vực tập luyện để hiển thị.'}</span>
      </div>
    );
  }

  const roomsOf = zone => zone.rooms ?? (zone.items || []).map((item, index) => ({ id: `${zone.id}-${index}`, name: item, detail: '' }));

  return (
    <div className={`zmap ${compact ? 'zmap--compact' : ''}`}>
      <div className="zmap__plan" aria-label={isEn ? 'Training zone site plan' : 'Sơ đồ mặt bằng các khu vực tập luyện'}>
        <div className="zmap__compass" aria-hidden="true">
          <span className="material-symbols-outlined">explore</span>N
        </div>
        <div
          className="zmap__grid"
          style={{ '--zmap-cols': ZONE_MAP_COLUMNS, '--zmap-rows': planRows }}
        >
          {zones.map(zone => {
            const rooms = roomsOf(zone);
            const isActive = zone.id === selected?.id;
            const wide = !zone.col && rooms.length >= 3;
            return (
              <button
                key={zone.id}
                type="button"
                className={`zmap__zone ${isActive ? 'is-active' : ''} ${wide ? 'zmap__zone--wide' : ''}`}
                style={{
                  '--zone-color': zone.color || '#81B29A',
                  ...(zone.col ? { '--zone-col': zone.col } : {}),
                  ...(zone.row ? { '--zone-row': zone.row } : {})
                }}
                data-placed={zone.col || zone.row ? 'true' : undefined}
                aria-pressed={isActive}
                onClick={() => setSelectedId(zone.id)}
              >
                <span className="zmap__zone-head">
                  <span className="zmap__zone-icon material-symbols-outlined" aria-hidden="true">{zone.icon || 'stadium'}</span>
                  <span className="zmap__zone-name">{translateName(zone.name)}</span>
                </span>
                <span className="zmap__zone-meta">
                  {rooms.length} {isEn ? (rooms.length === 1 ? 'room' : 'rooms') : 'phòng/sân'}
                  {zone.capacityTotal ? ` · ${formatCapacity(zone.capacityTotal, isEn)}` : ''}
                </span>
                {!compact && (
                  <span className="zmap__chips">
                    {rooms.slice(0, 3).map(room => <span key={room.id} className="zmap__chip">{room.name}</span>)}
                    {rooms.length > 3 && <span className="zmap__chip zmap__chip--more">+{rooms.length - 3}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="zmap__entrance" aria-hidden="true">
          <span className="material-symbols-outlined">door_front</span>
          {isEn ? 'Main entrance' : 'Lối vào chính'}
        </div>
      </div>

      {selected && (
        <aside className="zmap__panel" style={{ '--zone-color': selected.color || '#81B29A' }} aria-live="polite">
          <div className="zmap__panel-head">
            <span className="zmap__panel-icon material-symbols-outlined" aria-hidden="true">{selected.icon || 'stadium'}</span>
            <div className="min-w-0">
              <h4 className="zmap__panel-title">{translateName(selected.name)}</h4>
              <p className="zmap__panel-sub">
                {roomsOf(selected).length} {isEn ? 'rooms / courts' : 'phòng / sân'}
                {selected.capacityTotal ? ` · ${isEn ? 'capacity' : 'sức chứa'} ${formatCapacity(selected.capacityTotal, isEn)}` : ''}
              </p>
            </div>
          </div>
          {selected.description && <p className="zmap__panel-desc">{selected.description}</p>}
          <ul className="zmap__rooms">
            {roomsOf(selected).map(room => {
              const content = (
                <>
                  <span className="zmap__room-dot" aria-hidden="true" />
                  <span className="zmap__room-text">
                    <span className="zmap__room-name">{room.name}</span>
                    {(room.detail || room.capacity) && (
                      <span className="zmap__room-detail">
                        {[room.detail, room.capacity ? formatCapacity(room.capacity, isEn) : ''].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                  {room.facility && onOpenRoom && <span className="material-symbols-outlined zmap__room-arrow" aria-hidden="true">chevron_right</span>}
                </>
              );
              return (
                <li key={room.id}>
                  {room.facility && onOpenRoom
                    ? <button type="button" className="zmap__room" onClick={() => onOpenRoom(room.facility)}>{content}</button>
                    : <div className="zmap__room">{content}</div>}
                </li>
              );
            })}
          </ul>
          <p className="zmap__totals">
            {isEn
              ? `${zones.length} zones · ${totals.rooms} rooms${totals.capacity ? ` · ${formatCapacity(totals.capacity, true)} total` : ''}`
              : `${zones.length} khu vực · ${totals.rooms} phòng/sân${totals.capacity ? ` · tổng sức chứa ${formatCapacity(totals.capacity, false)}` : ''}`}
          </p>
        </aside>
      )}
    </div>
  );
}
