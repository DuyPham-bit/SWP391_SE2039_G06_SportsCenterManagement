import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { usePublicCatalog, catalogFacilities, catalogSports } from '../../../entities/catalog/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { readText, writeText } from '../../../entities/landing-content/index.js';

// [key, multiline, shared] — shared fields are the same in every language (icons, numbers).
const SPORT_FIELDS = [
  ['name'], ['category'], ['icon', false, true], ['highlight', true], ['coach'], ['schedule'], ['level'], ['capacity'],
  ['rating', false, true], ['ratingCount', false, true]
];
const FACILITY_FIELDS = [
  ['name'], ['category'], ['categoryName'], ['badge'], ['location'], ['zone'], ['capacity'], ['openHours'],
  ['highlights', true], ['description', true]
];

const inputClass = 'w-full mt-1 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 px-3 py-2 text-xs text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-700';

/** Card name in the editing language, else Vietnamese. */
const nameOf = (record, lang) => readText(record.name, lang) || readText(record.name, 'vi');

export function LandingCatalogEditor({ type, lang = 'vi', metadata = [], facilities, sports, fallbackToCatalog = true, onChange, onDelete, openMediaPicker }) {
  const { t } = useLanguage();
  const isSports = type === 'sports';
  const [editingCard, setEditingCard] = useState(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState(null);
  useEffect(() => {
    setEditingCard(null);
    setIsMediaPickerOpen(false);
    setDeletingCard(null);
  }, [type]);
  const { catalog, loading, error } = usePublicCatalog();
  const usesCatalog = !metadata.length && fallbackToCatalog;
  const records = !usesCatalog ? metadata : (isSports
    ? catalogSports(catalog).map(record => ({ ...record, facilityId: record.facilityId || '' }))
    : catalogFacilities(catalog));
  const availableFacilities = facilities ?? catalogFacilities(catalog);
  const relatedSports = isSports ? [] : (sports ?? catalogSports(catalog).map(record => ({ ...record, facilityId: record.facilityId || '' })));
  const fields = isSports ? SPORT_FIELDS : FACILITY_FIELDS;
  const activeRecord = editingCard?.type === type
    ? records.find(record => String(record.id) === editingCard.id)
    : null;
  const pendingDelete = deletingCard?.type === type
    ? records.find(record => String(record.id) === deletingCard.id)
    : null;
  const linkedSportsCount = pendingDelete && !isSports
    ? relatedSports.filter(sport => String(sport.facilityId) === String(pendingDelete.id)).length
    : 0;
  const deleteCard = () => {
    if (!pendingDelete) return;
    const remaining = records.filter(record => String(record.id) !== String(pendingDelete.id));
    if (onDelete) onDelete(pendingDelete, remaining, relatedSports);
    else onChange(remaining);
    setDeletingCard(null);
    setEditingCard(null);
  };
  const pickImage = (record, key = 'image') => {
    setIsMediaPickerOpen(true);
    openMediaPicker(
      t('homeContent.catalog.imageFor', { name: nameOf(record, lang) }),
      record[key] || '',
      url => update(record, { [key]: url }),
      () => setIsMediaPickerOpen(false)
    );
  };
  const update = (record, values) => {
    const current = metadata.find(item => String(item.id) === String(record.id));
    const updated = { ...record, ...current, id: String(record.id), ...values };
    onChange(records.map(item => String(item.id) === String(record.id) ? updated : item));
  };
  const addCard = () => {
    if (records.length >= 200 || (loading && usesCatalog)) return;
    let id;
    do {
      id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    } while (records.some(record => String(record.id) === id));
    const card = {
      ...Object.fromEntries(fields.map(([key, , shared]) => [key, shared ? '' : { vi: '', en: '' }])),
      id,
      name: { vi: t('homeContent.catalog.newCard'), en: '' },
      image: '',
      isVisible: true,
      ...(isSports
        ? { icon: 'sports', facilityId: '', badges: [] }
        : { secondaryImage: '', specs: [], amenities: [], tags: [] })
    };
    onChange([...records, card]);
  };
  const renderField = (record, [key, multiline, shared]) => {
    const props = {
      name: key,
      lang: shared ? undefined : lang,
      value: shared ? (record[key] ?? '') : readText(record[key], lang),
      placeholder: shared || lang === 'vi' ? undefined : readText(record[key], 'vi'),
      onChange: event => update(record, { [key]: shared ? event.target.value : writeText(record[key], lang, event.target.value) }),
      maxLength: 10000,
      className: inputClass
    };
    return (
      <label key={key} className={`block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 ${multiline ? 'sm:col-span-2' : ''}`}>
        {t(`homeContent.catalog.field.${key}`)}
        {multiline ? <textarea rows={3} {...props} /> : <input type="text" {...props} />}
      </label>
    );
  };
  // One entry per line in the editing language; lines keep their position across languages.
  const renderLines = (record, key) => (
    <label key={key} className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300">
      {t(`homeContent.catalog.field.${key}`)}
      <textarea
        name={key}
        rows={3}
        lang={lang}
        value={(record[key] || []).map(item => readText(item, lang)).join('\n')}
        onChange={event => {
          const lines = event.target.value ? event.target.value.split('\n') : [];
          const items = record[key] || [];
          update(record, { [key]: lines.map((line, index) => writeText(items[index], lang, line)) });
        }}
        className={inputClass}
      />
    </label>
  );
  const renderCardContent = record => (
    <div className="space-y-3">
      {record.image ? (
        <div className="h-40 w-full rounded-lg overflow-hidden bg-brand-navy-900">
          <img src={record.image} alt={nameOf(record, lang)} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="py-10 text-center bg-white dark:bg-brand-navy-800 rounded-lg border border-dashed border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-400 text-xs">
          <span className="material-symbols-outlined text-[28px] mb-1">image_not_supported</span>
          <div>{t('homeContent.catalog.noImage')}</div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          className="rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          onClick={() => pickImage(record)}
        >
          <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
          <span>{t('homeContent.action.uploadImage')}</span>
        </button>
        <label className="flex items-center gap-2 text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 cursor-pointer">
          <input
            type="checkbox"
            checked={record.isVisible !== false}
            onChange={event => update(record, { isVisible: event.target.checked })}
            className="rounded text-brand-sage-700 dark:text-brand-sage-400 focus:ring-brand-sage-700 accent-brand-sage-700 cursor-pointer"
          />
          <span>{t('homeContent.catalog.showOnHomepage')}</span>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(field => renderField(record, field))}
        {isSports && (
          <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 sm:col-span-2">
            {t('homeContent.catalog.linkedFacility')}
            <select
              name="facilityId"
              value={record.facilityId ?? ''}
              onChange={event => update(record, { facilityId: event.target.value })}
              className={inputClass}
            >
              <option value="">{t('homeContent.catalog.noLinkedFacility')}</option>
              {record.facilityId && !availableFacilities.some(facility => String(facility.id) === String(record.facilityId)) && (
                <option value={record.facilityId}>{readText(record.venue, lang) || record.facilityId}</option>
              )}
              {availableFacilities.map(facility => <option key={facility.id} value={String(facility.id)}>{nameOf(facility, lang)}</option>)}
            </select>
          </label>
        )}
        {renderField(record, ['image', false, true])}
        {!isSports && renderField(record, ['secondaryImage', false, true])}
      </div>
      {!isSports && (
        <>
          <button
            type="button"
            onClick={() => pickImage(record, 'secondaryImage')}
            className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:underline"
          >
            {t('homeContent.catalog.uploadSecondary')}
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            {['amenities', 'tags'].map(key => renderLines(record, key))}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">{t('homeContent.catalog.specs')}</h4>
            {(record.specs || []).map((spec, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                {['label', 'value'].map(key => (
                  <label key={key} className="min-w-0 text-xs text-brand-navy-700 dark:text-brand-navy-300">
                    {t(`homeContent.catalog.spec.${key}`)}
                    <input
                      type="text"
                      name={`spec-${key}`}
                      lang={lang}
                      value={readText(spec[key], lang)}
                      placeholder={lang === 'vi' ? undefined : readText(spec[key], 'vi')}
                      maxLength={10000}
                      onChange={event => update(record, { specs: record.specs.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: writeText(entry[key], lang, event.target.value) } : entry) })}
                      className={inputClass}
                    />
                  </label>
                ))}
                <button
                  type="button"
                  aria-label={t('homeContent.catalog.removeSpec')}
                  onClick={() => update(record, { specs: record.specs.filter((_, entryIndex) => entryIndex !== index) })}
                  className="p-2 text-brand-danger-600 hover:text-brand-danger-700"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={(record.specs || []).length >= 200}
              onClick={() => update(record, { specs: [...(record.specs || []), { label: { vi: '', en: '' }, value: { vi: '', en: '' } }] })}
              className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:underline disabled:opacity-50"
            >
              {t('homeContent.catalog.addSpec')}
            </button>
          </div>
        </>
      )}
    </div>
  );
  return (
    <section className="space-y-5">
      {loading && usesCatalog && <p role="status" className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{t('homeContent.catalog.loading')}</p>}
      {error && usesCatalog && <p role="alert" className="text-xs text-brand-danger-600 dark:text-brand-danger-400">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a className="inline-flex items-center gap-1 text-xs font-semibold text-brand-sage-700 dark:text-brand-sage-500 hover:underline" href="#/manager/classes-rooms">
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
          <span>{t('homeContent.catalog.manageLink')}</span>
        </a>
        <button
          type="button"
          onClick={addCard}
          disabled={records.length >= 200 || (loading && usesCatalog)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t(isSports ? 'homeContent.catalog.addSport' : 'homeContent.catalog.addFacility')}
        </button>
      </div>
      {(!usesCatalog || (!loading && !error)) && records.length === 0 && (
        <p role="status" className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{t('homeContent.catalog.empty')}</p>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {records.map(record => (
          <article key={`${type}-${record.id}`} data-card-id={record.id} className="min-w-0 rounded-xl border border-brand-navy-200/80 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 p-4 space-y-3 hover-lift transition-all">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-brand-navy-900 dark:text-white">{nameOf(record, lang)}</h3>
              {record.isVisible === false && (
                <span className="text-[11px] font-semibold text-brand-navy-500 dark:text-brand-navy-400 bg-white dark:bg-brand-navy-800 px-2 py-0.5 rounded border border-brand-navy-200 dark:border-brand-navy-700">
                  {t('homeContent.catalog.hidden')}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setEditingCard({ type, id: String(record.id) })}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-brand-sage-700/10 px-3 py-2.5 text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:bg-brand-sage-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700"
            >
              <span>{t('homeContent.catalog.expand')}</span>
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">open_in_new</span>
            </button>
            <button
              type="button"
              aria-label={t('homeContent.catalog.deleteNamed', { name: nameOf(record, lang) })}
              onClick={() => setDeletingCard({ type, id: String(record.id) })}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-danger-200 px-3 py-2 text-xs font-bold text-brand-danger-600 hover:bg-brand-danger-50 dark:border-brand-danger-900 dark:text-brand-danger-400 dark:hover:bg-brand-danger-950/30"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
              {t('homeContent.catalog.delete')}
            </button>
          </article>
        ))}
      </div>
      {activeRecord && createPortal(
        <Modal
          isOpen={!isMediaPickerOpen}
          onClose={() => setEditingCard(null)}
          title={t('homeContent.catalog.editNamed', { name: nameOf(activeRecord, lang), lang: lang.toUpperCase() })}
          maxWidth="max-w-2xl"
        >
          {renderCardContent(activeRecord)}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-brand-navy-200 pt-4">
            <p className="text-xs text-brand-navy-500">{t('homeContent.catalog.draftHint')}</p>
            <button
              type="button"
              onClick={() => setEditingCard(null)}
              className="rounded-xl bg-brand-sage-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-sage-900"
            >
              {t('homeContent.action.done')}
            </button>
          </div>
        </Modal>,
        document.body
      )}
      {pendingDelete && createPortal(
        <Modal isOpen onClose={() => setDeletingCard(null)} title={t('homeContent.catalog.deleteTitle')}>
          <p className="text-sm text-brand-navy-700">{t('homeContent.catalog.deleteConfirm', { name: nameOf(pendingDelete, lang) })}</p>
          {linkedSportsCount > 0 && (
            <p className="mt-3 text-sm text-brand-sand-700 dark:text-brand-sand-400">{t('homeContent.catalog.deleteLinked', { count: linkedSportsCount })}</p>
          )}
          <p className="mt-3 text-xs text-brand-navy-500">{t('homeContent.catalog.deleteHint')}</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setDeletingCard(null)} className="rounded-xl border border-brand-navy-300 px-4 py-2 text-xs font-bold text-brand-navy-700 hover:bg-brand-navy-50">
              {t('homeContent.action.cancel')}
            </button>
            <button type="button" onClick={deleteCard} className="rounded-xl bg-brand-danger-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-danger-700">
              {t('homeContent.catalog.confirmDelete')}
            </button>
          </div>
        </Modal>,
        document.body
      )}
    </section>
  );
}
