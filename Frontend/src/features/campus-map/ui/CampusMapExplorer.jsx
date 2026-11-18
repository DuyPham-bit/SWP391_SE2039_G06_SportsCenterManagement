import React, { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { useCampusMap } from '../model/useCampusMap.js';
import {
  AMENITIES, FEATURE_LEGEND, LIGHTING_MODES, LIGHTING_TIME, STATUS_META,
  buildWalkGraph, findRoute, formatArea, statusLabel, strings, wayfindingPlaces, zoneStatusAt
} from '../model/campusModel.js';
import { isWebGLAvailable } from '../lib/webgl.js';
import CampusPlan2D from './CampusPlan2D.jsx';
import { CompassNav } from './CompassNav.jsx';
import './campusMap.css';

const CampusScene3D = lazy(() => import('./CampusScene3D.jsx'));

/** Catches 3D chunk/WebGL failures and falls back to the 2D plan. */
class SceneBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.warn('[campus-map] 3D view failed, falling back to 2D', error); this.props.onFail?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const LIGHT_ICONS = { day: 'light_mode', sunset: 'wb_twilight', night: 'nightlight' };

function StatusBadge({ status, lang }) {
  return <span className="cm-status" data-tone={STATUS_META[status]?.tone || 'muted'}>{statusLabel(status, lang)}</span>;
}

function ZoneNav({ zones, statusAt, selectedZoneId, onSelect, lang, t, variant }) {
  const visible = zones.filter((z) => z.kind !== 'landscape');
  const items = visible.map((zone) => (
    <li key={zone.id} style={{ '--zone': zone.color }}>
      <button
        type="button"
        className="cm-zone"
        aria-current={zone.id === selectedZoneId ? 'true' : undefined}
        onClick={() => onSelect(zone.id === selectedZoneId ? null : zone.id)}
        title={zone.name}
      >
        <span className="cm-zone__code" aria-hidden="true">{zone.code}</span>
        {variant === 'chips' ? (
          <span className="cm-zone__name">{zone.shortName}</span>
        ) : (
          <span className="cm-zone__body">
            <span className="cm-zone__name">{zone.name}</span>
            <span className="cm-zone__meta">
              <span>{formatArea(zone.areaM2, lang)} m²</span>
              <StatusBadge status={statusAt[zone.id] || zone.status} lang={lang} />
            </span>
          </span>
        )}
      </button>
    </li>
  ));
  if (variant === 'chips') {
    return <nav className="cm-chipsnav" aria-label={t.zoneNav}><ul className="cm-zones" style={{ flexDirection: 'row' }}>{items}</ul></nav>;
  }
  return <nav aria-label={t.zoneNav}><ul className="cm-zones">{items}</ul></nav>;
}

function Legend({ zones, lang, t }) {
  const en = lang === 'en';
  return (
    <details className="cm-legend" open>
      <summary>{t.legend}<span className="material-symbols-outlined" aria-hidden="true">expand_more</span></summary>
      <ul>
        {zones.map((z) => (
          <li key={z.id}><span className="cm-swatch" style={{ background: z.color }} aria-hidden="true" />{z.kind === 'landscape' ? z.name : z.shortName}</li>
        ))}
        {FEATURE_LEGEND.map((f) => (
          <li key={f.type}><span className="material-symbols-outlined" style={{ color: f.color }} aria-hidden="true">{f.icon}</span>{en ? f.en : f.vi}</li>
        ))}
        <li><span className="cm-swatch" style={{ background: 'url(#)', backgroundImage: 'repeating-linear-gradient(45deg,#334155 0 3px,#94a3b8 3px 4px)' }} aria-hidden="true" />{en ? 'Closed / maintenance' : 'Đóng cửa / bảo trì'}</li>
        <li><span className="cm-swatch" style={{ background: '#F59E0B' }} aria-hidden="true" />{t.wayfinding}</li>
      </ul>
    </details>
  );
}

function ScaleBar({ metersPerPixel }) {
  if (!metersPerPixel) return null;
  const target = metersPerPixel * 110;
  const nice = [5, 10, 20, 25, 50, 100, 200].find((n) => n >= target * 0.6) || 200;
  return (
    <div className="cm-card cm-scalebar" aria-hidden="true">
      <span>{nice} m</span>
      <i style={{ width: `${Math.round(nice / metersPerPixel)}px` }} />
    </div>
  );
}

function DetailPanel({ zone, room, status, lang, t, onClose, onRoomSelect, onDirections, simulated }) {
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus({ preventScroll: true }); }, [zone.id]);
  const en = lang === 'en';
  const floors = zone.floors > 0 ? zone.floorsList : [0];
  return (
    <aside className="cm-detail" style={{ '--zone': zone.color }} aria-label={zone.name}>
      <div className="cm-detail__hero">
        {zone.imageUrl ? <img src={zone.imageUrl} alt="" loading="lazy" /> : (
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <line key={i} x1={i * 10 - 20} y1="40" x2={i * 10 + 10} y2="0" stroke="#0B1020" strokeWidth="2" />)}
          </svg>
        )}
        <button ref={closeRef} type="button" className="cm-btn cm-icon-btn cm-detail__close" onClick={onClose} aria-label={t.close}>
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <div className="cm-detail__title">
          <span className="cm-zone__code" style={{ '--zone': zone.color }}>{zone.code}</span>
          <h4>{zone.name}</h4>
        </div>
      </div>
      <div className="cm-detail__scroll">
        <div className="cm-facts">
          <div className="cm-fact"><small>{t.area}</small><strong>{formatArea(zone.areaM2, lang)} m²</strong></div>
          <div className="cm-fact"><small>{t.floors}</small><strong>{zone.floors > 0 ? zone.floors : t.outdoor}</strong></div>
          <div className="cm-fact"><small>{t.hours}</small><strong>{zone.openTime && zone.closeTime ? `${zone.openTime}–${zone.closeTime}` : t.allDay}</strong></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge status={zone.status} lang={lang} />
          {simulated && status !== zone.status && <span className="cm-chip">{t.simulated(simulated)}: <StatusBadge status={status} lang={lang} /></span>}
        </div>
        {zone.description && <p>{zone.description}</p>}
        {zone.amenities?.length > 0 && (
          <section>
            <h5>{t.amenities}</h5>
            <ul className="cm-amenities">
              {zone.amenities.map((code) => AMENITIES[code] && (
                <li key={code}><span className="material-symbols-outlined" aria-hidden="true">{AMENITIES[code].icon}</span>{AMENITIES[code][en ? 'en' : 'vi']}</li>
              ))}
            </ul>
          </section>
        )}
        {zone.rooms.length > 0 && (
          <section>
            <h5>{t.rooms} ({zone.rooms.length})</h5>
            {floors.map((level) => {
              const rooms = zone.rooms.filter((r) => (zone.floors > 0 ? (r.floor || 1) === level : true));
              if (!rooms.length) return null;
              return (
                <div key={level}>
                  {zone.floors > 0 && <div className="cm-floor-head">{t.floor} {level}</div>}
                  <ul className="cm-rooms">
                    {rooms.map((r) => (
                      <li key={r.id} className="cm-room" data-active={room?.id === r.id}>
                        <button type="button" className="cm-room__body" onClick={() => onRoomSelect(r)}
                          style={{ background: 'none', border: 0, color: 'inherit', textAlign: 'left', padding: 0, cursor: 'pointer' }}>
                          <b>{r.name}</b>
                          <span>{[r.kindLabel, r.width && r.depth ? `${r.width}×${r.depth} m` : null, `${t.capacity} ${r.capacity} ${t.people}`].filter(Boolean).join(' • ')}</span>
                          <StatusBadge status={r.status} lang={lang} />
                        </button>
                        {r.bookable && r.status !== 'Maintenance' && r.status !== 'Inactive' && (
                          <a className="cm-btn cm-btn--primary" href={`#/member/classes?room=${encodeURIComponent(r.baseName)}`} title={t.bookHint}>{t.book}</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        )}
        <button type="button" className="cm-btn" onClick={onDirections} style={{ justifySelf: 'start' }}>
          <span className="material-symbols-outlined" aria-hidden="true">directions_walk</span>{t.directions}
        </button>
      </div>
    </aside>
  );
}

function RouteCard({ places, fromId, toId, onFrom, onTo, route, onClear, t }) {
  return (
    <div className="cm-card cm-route" role="region" aria-label={t.wayfinding}>
      <label>{t.from}
        <select value={fromId} onChange={(e) => onFrom(e.target.value)}>
          {places.origins.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </label>
      <label>{t.to}
        <select value={toId} onChange={(e) => onTo(e.target.value)}>
          <option value="">{t.chooseDestination}</option>
          {places.destinations.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </label>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <output aria-live="polite">{toId ? (route ? t.routeResult(route.meters, route.minutes) : t.noRoute) : ''}</output>
        <button type="button" className="cm-btn" onClick={onClear}>{t.clearRoute}</button>
      </div>
    </div>
  );
}

/**
 * Campus map explorer: 3D model + 2D plan + single zone navigation + detail panel + wayfinding,
 * all rendered from GET /api/campus-map. `page` renders it full-viewport (standalone /3d-campus.html).
 */
export function CampusMapExplorer({ page = false, initialView = '3d' }) {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'vi';
  const t = strings(lang);
  const { campus, loading, error, reload } = useCampusMap(lang);

  const webgl = useMemo(() => isWebGLAvailable(), []);
  const [view, setView] = useState(webgl ? initialView : '2d');
  const [notice, setNotice] = useState(webgl ? '' : 'noWebgl');
  const [lighting, setLighting] = useState('day');
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [floor, setFloor] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 900);
  const [hover, setHover] = useState(null);
  const [camera, setCamera] = useState({ azimuth: 0, metersPerPixel: 0 });
  const [routeMode, setRouteMode] = useState(false);
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [sceneReady, setSceneReady] = useState(false);
  const [loadPct, setLoadPct] = useState(15);
  const rootRef = useRef(null);
  const viewRef = useRef(null);

  const simulated = lighting === 'day' ? null : LIGHTING_TIME[lighting];
  const statusAt = useMemo(() => {
    if (!campus) return {};
    return Object.fromEntries(campus.zones.map((z) => [z.id, simulated ? zoneStatusAt(z, simulated) : z.status]));
  }, [campus, simulated]);
  const labelSubs = useMemo(() => Object.fromEntries(Object.entries(statusAt).map(([id, s]) => [id, statusLabel(s, lang)])), [statusAt, lang]);

  const selectedZone = campus?.zones.find((z) => z.id === selectedZoneId) || null;
  const selectedRoom = selectedZone?.rooms.find((r) => r.id === selectedRoomId) || null;

  const graph = useMemo(() => (campus ? buildWalkGraph(campus.features) : null), [campus]);
  const places = useMemo(() => (campus ? wayfindingPlaces(campus, lang) : { origins: [], destinations: [] }), [campus, lang]);
  useEffect(() => { if (!routeFrom && places.origins[0]) setRouteFrom(places.origins[0].id); }, [places, routeFrom]);
  const route = useMemo(() => {
    if (!routeMode || !routeTo) return null;
    const from = places.origins.find((o) => o.id === routeFrom);
    const to = places.destinations.find((d) => d.id === routeTo);
    return from && to ? findRoute(graph, from.point, to.point) : null;
  }, [routeMode, routeFrom, routeTo, places, graph]);

  const selectZone = useCallback((zoneId, { roomId = null, roomFloor = null } = {}) => {
    setSelectedZoneId(zoneId);
    setSelectedRoomId(roomId);
    const zone = campus?.zones.find((z) => z.id === zoneId);
    const nextFloor = zone && zone.floors > 0 ? (roomFloor || null) : null;
    setFloor(nextFloor);
    if (zoneId == null) viewRef.current?.resetView();
    else requestAnimationFrame(() => viewRef.current?.focusZone(zoneId));
  }, [campus]);

  const onSceneSelect = useCallback((hit) => {
    if (!hit) { setSelectedRoomId(null); return; }
    const zone = campus?.zones.find((z) => z.id === hit.zoneId);
    if (!zone || zone.kind === 'landscape') return;
    const room = zone.rooms.find((r) => r.id === hit.roomId);
    selectZone(zone.id, { roomId: room?.id || null, roomFloor: room?.floor || null });
  }, [campus, selectZone]);

  const resetAll = (tour = false) => {
    setSelectedZoneId(null);
    setSelectedRoomId(null);
    setFloor(null);
    viewRef.current?.resetView(tour);
  };

  useEffect(() => {
    if (!campus) return undefined;
    const onExternalFocus = (event) => {
      const code = event.detail?.code;
      const targetZone = campus.zones.find((z) => z.code === code);
      if (targetZone) {
        selectZone(targetZone.id, { roomFloor: event.detail?.floor || 1 });
      }
    };
    window.addEventListener('SCMS_CAMPUS_FOCUS', onExternalFocus);
    return () => window.removeEventListener('SCMS_CAMPUS_FOCUS', onExternalFocus);
  }, [campus, selectZone]);

  const startDirections = (destinationId) => {
    setRouteMode(true);
    if (destinationId) setRouteTo(destinationId);
  };

  useEffect(() => {
    const onKey = (event) => {
      if (!rootRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (event.key === 'Escape') {
        if (selectedZoneId != null) resetAll();
        else if (routeMode) setRouteMode(false);
      } else if (event.target.closest?.('input, select, textarea')) {
        // ignore
      } else if (event.key === '+' || event.key === '=') viewRef.current?.zoomBy(0.8);
      else if (event.key === '-') viewRef.current?.zoomBy(1.25);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  const fallbackTo2D = useCallback((reason) => { setView('2d'); setNotice(reason); }, []);

  const hoverZone = hover && campus?.zones.find((z) => z.id === hover.zoneId);
  const hoverRoom = hoverZone?.rooms.find((r) => r.id === hover.roomId);

  return (
    <section ref={rootRef} className="cm" data-page={page} aria-label={t.title}>
      <header className="cm-toolbar">
        <div className="cm-toolbar__title">
          <small>{t.badge}</small>
          <h3>{t.title}</h3>
          {campus ? <span>{campus.centerName} • {t.summary(campus.functionalCount, formatArea(campus.zonesArea, lang))}</span> : <span className="cm-skeleton" style={{ width: 180, height: 12 }} />}
        </div>
        <div className="cm-seg" role="group" aria-label={`${t.view3d} / ${t.view2d}`}>
          <button type="button" aria-pressed={view === '3d'} disabled={!webgl} onClick={() => { setView('3d'); setNotice(''); }}>
            <span className="material-symbols-outlined" aria-hidden="true">view_in_ar</span><span className="cm-label-text">{t.view3d}</span>
          </button>
          <button type="button" aria-pressed={view === '2d'} onClick={() => setView('2d')}>
            <span className="material-symbols-outlined" aria-hidden="true">map</span><span className="cm-label-text">{t.view2d}</span>
          </button>
        </div>
        <div className="cm-seg" role="group" aria-label={t.lighting}>
          {LIGHTING_MODES.map((mode) => (
            <button key={mode} type="button" aria-pressed={lighting === mode} onClick={() => setLighting(mode)} title={t[mode]}>
              <span className="material-symbols-outlined" aria-hidden="true">{LIGHT_ICONS[mode]}</span><span className="cm-label-text">{t[mode]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="cm-btn cm-icon-btn cm-only-mobile" onClick={() => setPanelCollapsed((v) => !v)}
          aria-expanded={!panelCollapsed} aria-label={t.openPanel}>
          <span className="material-symbols-outlined" aria-hidden="true">list</span>
        </button>
        <button type="button" className="cm-btn" aria-pressed={routeMode} onClick={() => setRouteMode((v) => !v)}>
          <span className="material-symbols-outlined" aria-hidden="true">directions</span><span className="cm-label-text">{t.wayfinding}</span>
        </button>
        <button type="button" className="cm-btn cm-btn--primary" onClick={() => resetAll(true)} title={t.overviewHint}>
          <span className="material-symbols-outlined" aria-hidden="true">zoom_out_map</span><span className="cm-label-text">{t.overview}</span>
        </button>
        {!page && (
          <button type="button" className="cm-btn cm-icon-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
            <span className="material-symbols-outlined" aria-hidden="true">fullscreen</span>
          </button>
        )}
      </header>

      <div className="cm-body">
        <aside className="cm-panel" data-collapsed={panelCollapsed} aria-label={t.zones}>
          <div className="cm-panel__head">
            <h4>{t.zones}</h4>
            <button type="button" className="cm-btn cm-icon-btn" onClick={() => setPanelCollapsed((v) => !v)}
              aria-expanded={!panelCollapsed} aria-label={panelCollapsed ? t.expand : t.collapse}>
              <span className="material-symbols-outlined" aria-hidden="true">{panelCollapsed ? 'left_panel_open' : 'left_panel_close'}</span>
            </button>
          </div>
          <div className="cm-panel__scroll">
            {campus ? (
              <>
                <div className="cm-total" data-mismatch={!campus.areaMatchesSite}>
                  <span>{t.total} ({campus.site.width}×{campus.site.depth} m)</span>
                  <strong>{formatArea(campus.zonesArea, lang)} m²</strong>
                </div>
                <ZoneNav zones={campus.zones} statusAt={statusAt} selectedZoneId={selectedZoneId} onSelect={(id) => (id == null ? resetAll() : selectZone(id))} lang={lang} t={t} />
                <Legend zones={campus.zones} lang={lang} t={t} />
              </>
            ) : (
              Array.from({ length: 6 }, (_, i) => <span key={i} className="cm-skeleton" style={{ height: 46, marginBottom: 6 }} />)
            )}
          </div>
        </aside>

        <div className="cm-viewport" aria-busy={loading}>
          {loading && (
            <div className="cm-state" role="status"><div><div className="cm-progress" /><p>{t.loading}</p></div></div>
          )}
          {error && !campus && (
            <div className="cm-state" role="alert">
              <div>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#F87171' }} aria-hidden="true">error</span>
                <p>{t.error}{error?.message ? ` (${error.message})` : ''}</p>
                <button type="button" className="cm-btn cm-btn--primary" style={{ marginTop: 12 }} onClick={() => reload()}>{t.retry}</button>
              </div>
            </div>
          )}

          {campus && view === '3d' && (
            <SceneBoundary onFail={() => fallbackTo2D('webglLost')}>
              <Suspense fallback={<div className="cm-state" role="status"><div><div className="cm-progress" /><p>{t.loading3d} ({loadPct}%)</p></div></div>}>
                {!sceneReady && <div className="cm-state" role="status" style={{ background: 'transparent', pointerEvents: 'none' }}><div><div className="cm-progress" /><p>{t.loading3d} ({loadPct}%)</p></div></div>}
                <CampusScene3D
                  ref={viewRef}
                  campus={campus}
                  lighting={lighting}
                  statusAt={statusAt}
                  labelSubs={labelSubs}
                  selectedZoneId={selectedZoneId}
                  floor={floor}
                  route={route}
                  onHover={setHover}
                  onSelect={onSceneSelect}
                  onCameraChange={setCamera}
                  onContextLost={() => fallbackTo2D('webglLost')}
                  onProgress={setLoadPct}
                  onReady={() => { setLoadPct(100); setSceneReady(true); }}
                />
              </Suspense>
            </SceneBoundary>
          )}
          {campus && view === '2d' && (
            <CampusPlan2D
              ref={viewRef}
              campus={campus}
              lang={lang}
              statusAt={statusAt}
              selectedZoneId={selectedZoneId}
              selectedRoomId={selectedRoomId}
              floor={floor}
              route={route}
              onHover={setHover}
              onSelect={onSceneSelect}
              onScaleChange={setCamera}
              labels={t}
            />
          )}

          {campus && (
            <>
              <div className="cm-overlay cm-overlay--tl">
                {routeMode && (
                  <RouteCard places={places} fromId={routeFrom} toId={routeTo} onFrom={setRouteFrom} onTo={setRouteTo} route={route}
                    onClear={() => { setRouteTo(''); setRouteMode(false); }} t={t} />
                )}
                {notice && <div className="cm-notice" role="status">{t[notice]}</div>}
                {simulated && <span className="cm-chip"><span className="material-symbols-outlined" aria-hidden="true">schedule</span>{t.simulated(simulated)}</span>}
              </div>
              <div className="cm-overlay cm-overlay--tr">
                <CompassNav
                  azimuth={view === '3d' ? camera.azimuth : 0}
                  night={lighting === 'night'}
                  view={view}
                  onFaceNorth={() => (view === '3d' ? viewRef.current?.faceNorth() : resetAll())}
                  onResetView={resetAll}
                />
                {selectedZone && selectedZone.floors > 1 && (
                  <div className="cm-card cm-floors" role="group" aria-label={t.selectFloor}>
                    <span>{t.floor}</span>
                    <button type="button" className="cm-btn" aria-pressed={floor == null} onClick={() => setFloor(null)}>{t.allFloors}</button>
                    {[...selectedZone.floorsList].reverse().map((level) => (
                      <button key={level} type="button" className="cm-btn" aria-pressed={floor === level} onClick={() => setFloor(level)}>{level}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="cm-overlay cm-overlay--br">
                <button type="button" className="cm-btn cm-icon-btn cm-card" onClick={() => viewRef.current?.zoomBy(0.8)} aria-label="Zoom in">
                  <span className="material-symbols-outlined" aria-hidden="true">add</span>
                </button>
                <button type="button" className="cm-btn cm-icon-btn cm-card" onClick={() => viewRef.current?.zoomBy(1.25)} aria-label="Zoom out">
                  <span className="material-symbols-outlined" aria-hidden="true">remove</span>
                </button>
                {view === '3d' && (
                  <button type="button" className="cm-btn cm-icon-btn cm-card" onClick={() => viewRef.current?.rotateBy(Math.PI / 8)} aria-label="Rotate">
                    <span className="material-symbols-outlined" aria-hidden="true">rotate_right</span>
                  </button>
                )}
              </div>
              <div className="cm-overlay cm-overlay--bl">
                <ScaleBar metersPerPixel={camera.metersPerPixel} />
                {!hover && <span className="cm-chip" style={{ display: page ? undefined : 'none' }}>{t.controlsHint}</span>}
              </div>
              {hover && hoverZone && (
                <div className="cm-card cm-tooltip" style={{ left: hover.x, top: hover.y }} role="tooltip">
                  <b>{hoverRoom ? hoverRoom.name : hoverZone.name}</b>
                  <span>{hoverRoom
                    ? `${hoverRoom.kindLabel} • ${statusLabel(hoverRoom.status, lang)}`
                    : `${formatArea(hoverZone.areaM2, lang)} m² • ${statusLabel(statusAt[hoverZone.id] || hoverZone.status, lang)}`}</span>
                </div>
              )}
              <ZoneNav variant="chips" zones={campus.zones} statusAt={statusAt} selectedZoneId={selectedZoneId}
                onSelect={(id) => (id == null ? resetAll() : selectZone(id))} lang={lang} t={t} />
            </>
          )}
        </div>

        {selectedZone && (
          <DetailPanel
            zone={selectedZone}
            room={selectedRoom}
            status={statusAt[selectedZone.id]}
            simulated={simulated}
            lang={lang}
            t={t}
            onClose={resetAll}
            onRoomSelect={(r) => { setSelectedRoomId(r.id); if (selectedZone.floors > 0) setFloor(r.floor || 1); }}
            onDirections={() => startDirections(
              (selectedRoom && places.destinations.find((d) => d.roomId === selectedRoom.id)?.id)
              || places.destinations.find((d) => d.zoneId === selectedZone.id)?.id
            )}
          />
        )}
      </div>
    </section>
  );
}

export default CampusMapExplorer;
