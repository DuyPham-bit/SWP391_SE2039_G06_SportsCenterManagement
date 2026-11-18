import React, { useEffect, useState } from 'react';
import { CAMPUS_ZONE_STATUSES, fetchCampusMap, updateCampusZone } from '../../../entities/campus-map/index.js';

// Amenity codes seeded with the campus map.
export const CAMPUS_AMENITIES = ['locker', 'shower', 'wc', 'wc_accessible', 'first_aid', 'extinguisher', 'water', 'reception',
  'cafe', 'wifi', 'floodlight', 'stand', 'parking', 'moto', 'ev', 'accessible_parking', 'security', 'shade', 'sign'];

const FIELD = 'w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none';
const LABEL = 'block text-[10px] font-bold text-brand-navy-600 dark:text-brand-navy-400 uppercase mb-1';

function centerIdFromEnv() {
  const id = Number(import.meta.env?.VITE_SPORTS_CENTER_ID);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

const toForm = zone => ({
  nameVi: zone.nameVi || '', nameEn: zone.nameEn || '',
  descriptionVi: zone.descriptionVi || '', descriptionEn: zone.descriptionEn || '',
  colorHex: zone.color || '#000000', openTime: zone.openTime || '', closeTime: zone.closeTime || '',
  status: zone.configuredStatus || 'Open', imageUrl: zone.imageUrl || '', amenities: zone.amenities || []
});

/** English missing for any zone name/description (drives the tab's EN warning dot). */
export const zonesMissingEnglish = forms => Object.values(forms).some(form =>
  (form.nameVi.trim() && !form.nameEn.trim()) || (form.descriptionVi.trim() && !form.descriptionEn.trim()));

/**
 * Campus zones (GET /api/campus-map, PUT /api/campus-map/zones/{id}). Each zone saves on its own,
 * independently of the home-content document.
 */
export function CampusZonesEditor({ lang, openMediaPicker, t, onMissingChange }) {
  const [zones, setZones] = useState([]);
  const [forms, setForms] = useState({});
  const [state, setState] = useState({ loading: true, error: '' });
  const [zoneStatus, setZoneStatus] = useState({}); // id → { saving, message, error }
  const [reloadKey, setReloadKey] = useState(0);
  const suffix = lang === 'en' ? 'En' : 'Vi';

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, error: '' });
    fetchCampusMap({ centerId: centerIdFromEnv(), signal: controller.signal })
      .then(map => {
        const list = map?.zones || [];
        setZones(list);
        setForms(Object.fromEntries(list.map(zone => [zone.id, toForm(zone)])));
        setState({ loading: false, error: '' });
      })
      .catch(error => { if (error.name !== 'AbortError') setState({ loading: false, error: error.message || t('homeContent.error.load') }); });
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => { onMissingChange?.(zonesMissingEnglish(forms)); }, [forms]);

  const setForm = (id, values) => {
    setForms(previous => ({ ...previous, [id]: { ...previous[id], ...values } }));
    setZoneStatus(previous => ({ ...previous, [id]: undefined }));
  };

  const save = async zone => {
    const form = forms[zone.id];
    setZoneStatus(previous => ({ ...previous, [zone.id]: { saving: true } }));
    try {
      const saved = await updateCampusZone(zone.id, {
        ...form,
        openTime: form.openTime || null,
        closeTime: form.closeTime || null,
        imageUrl: form.imageUrl || null
      });
      setZones(previous => previous.map(item => (item.id === zone.id ? saved : item)));
      setForms(previous => ({ ...previous, [zone.id]: toForm(saved) }));
      setZoneStatus(previous => ({ ...previous, [zone.id]: { message: t('homeContent.zones.saved') } }));
    } catch (error) {
      setZoneStatus(previous => ({ ...previous, [zone.id]: { error: true, message: error.message || t('homeContent.status.saveFailed') } }));
    }
  };

  if (state.loading) {
    return <div role="status" className="space-y-3">{[0, 1].map(i => <div key={i} className="h-40 rounded-xl bg-brand-navy-100 dark:bg-brand-navy-800 animate-pulse" />)}</div>;
  }
  if (state.error) {
    return (
      <div role="alert" className="p-4 rounded-xl bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-900/50 text-xs text-brand-danger-800 dark:text-brand-danger-300 space-y-2">
        <p className="font-semibold">{state.error}</p>
        <button type="button" onClick={() => setReloadKey(key => key + 1)} className="px-3 py-1.5 rounded-lg bg-brand-danger-600 text-white font-bold">{t('homeContent.action.retry')}</button>
      </div>
    );
  }
  if (zones.length === 0) return <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{t('homeContent.zones.empty')}</p>;

  return (
    <div className="space-y-3">
      {zones.map(zone => {
        const form = forms[zone.id];
        const status = zoneStatus[zone.id] || {};
        const dirty = JSON.stringify(form) !== JSON.stringify(toForm(zone));
        return (
          <div key={zone.id} className="p-4 rounded-xl bg-brand-navy-900 text-white space-y-3 border border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: form.colorHex }} />
              <span className="text-[10px] font-mono text-white/60">{zone.code}</span>
              <input
                type="text"
                aria-label={t('homeContent.zones.name')}
                lang={lang}
                value={form[`name${suffix}`]}
                placeholder={lang === 'en' ? form.nameVi : ''}
                maxLength={120}
                onChange={e => setForm(zone.id, { [`name${suffix}`]: e.target.value })}
                className="flex-1 px-3 py-1 bg-white/10 rounded-lg border border-white/20 text-xs font-bold text-white uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
              />
            </div>
            <textarea
              rows={2}
              aria-label={t('homeContent.field.description')}
              lang={lang}
              value={form[`description${suffix}`]}
              placeholder={lang === 'en' ? form.descriptionVi : ''}
              maxLength={500}
              onChange={e => setForm(zone.id, { [`description${suffix}`]: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10 text-[11px] text-brand-navy-200 focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-brand-navy-900">
              <label className="text-white">
                <span className={`${LABEL} text-white/70`}>{t('homeContent.zones.color')}</span>
                <input type="color" value={form.colorHex} onChange={e => setForm(zone.id, { colorHex: e.target.value })} className="w-full h-8 rounded-lg bg-transparent cursor-pointer" />
              </label>
              <label className="text-white">
                <span className={`${LABEL} text-white/70`}>{t('homeContent.zones.status')}</span>
                <select value={form.status} onChange={e => setForm(zone.id, { status: e.target.value })} className={FIELD}>
                  {CAMPUS_ZONE_STATUSES.map(code => <option key={code} value={code}>{t(`homeContent.zones.statusOption.${code}`)}</option>)}
                </select>
              </label>
              <label className="text-white">
                <span className={`${LABEL} text-white/70`}>{t('homeContent.zones.openTime')}</span>
                <input type="time" value={form.openTime} onChange={e => setForm(zone.id, { openTime: e.target.value })} className={FIELD} />
              </label>
              <label className="text-white">
                <span className={`${LABEL} text-white/70`}>{t('homeContent.zones.closeTime')}</span>
                <input type="time" value={form.closeTime} onChange={e => setForm(zone.id, { closeTime: e.target.value })} className={FIELD} />
              </label>
            </div>
            <div className="flex gap-2">
              <input type="url" aria-label={t('homeContent.zones.image')} value={form.imageUrl} placeholder={t('homeContent.placeholder.url')}
                onChange={e => setForm(zone.id, { imageUrl: e.target.value })} className={`${FIELD} flex-1`} />
              <button type="button" onClick={() => openMediaPicker(t('homeContent.zones.image'), form.imageUrl, url => setForm(zone.id, { imageUrl: url }))}
                className="px-3 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                <span>{t('homeContent.action.uploadImage')}</span>
              </button>
            </div>
            <fieldset>
              <legend className={`${LABEL} text-white/70`}>{t('homeContent.zones.amenities')}</legend>
              <div className="flex flex-wrap gap-1.5">
                {CAMPUS_AMENITIES.map(code => {
                  const checked = form.amenities.includes(code);
                  return (
                    <label key={code} className={`px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer border ${checked ? 'bg-brand-sage-700 border-brand-sage-500 text-white' : 'bg-white/5 border-white/15 text-white/70'}`}>
                      <input type="checkbox" className="sr-only" checked={checked}
                        onChange={e => setForm(zone.id, { amenities: e.target.checked ? [...form.amenities, code] : form.amenities.filter(item => item !== code) })} />
                      {t(`homeContent.zones.amenity.${code}`)}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span role={status.error ? 'alert' : 'status'} className={`text-[11px] ${status.error ? 'text-brand-danger-300' : 'text-white/70'}`}>
                {status.saving ? t('homeContent.status.saving') : status.message || (dirty ? t('homeContent.status.unsaved') : '')}
              </span>
              <button type="button" disabled={!dirty || status.saving} onClick={() => save(zone)}
                className="px-4 py-1.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                {t('homeContent.zones.saveZone')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
