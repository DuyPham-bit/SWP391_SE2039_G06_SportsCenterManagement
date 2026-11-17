import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { usePublicCatalog, catalogFacilities, catalogSports } from '../../../entities/catalog/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';

const SPORT_FIELDS = [
  ['name', 'Tên bộ môn', 'Sport name'],
  ['category', 'Nhóm bộ môn', 'Category'],
  ['icon', 'Biểu tượng', 'Icon'],
  ['highlight', 'Nội dung giới thiệu', 'Introduction', true],
  ['coach', 'Huấn luyện viên', 'Coach'],
  ['schedule', 'Lịch tập', 'Schedule'],
  ['level', 'Trình độ', 'Level'],
  ['capacity', 'Sức chứa', 'Capacity'],
  ['rating', 'Điểm đánh giá', 'Rating'],
  ['ratingCount', 'Số lượt đánh giá', 'Rating count']
];

const FACILITY_FIELDS = [
  ['name', 'Tên cụm sân / phòng tập', 'Court / facility name'],
  ['category', 'Nhóm phân loại', 'Category'],
  ['categoryName', 'Tên nhóm hiển thị', 'Category label'],
  ['badge', 'Nhãn trên thẻ', 'Card badge'],
  ['location', 'Vị trí', 'Location'],
  ['zone', 'Khu vực', 'Zone'],
  ['capacity', 'Sức chứa', 'Capacity'],
  ['openHours', 'Giờ hoạt động', 'Opening hours'],
  ['highlights', 'Nội dung nổi bật', 'Highlights', true],
  ['description', 'Mô tả chi tiết', 'Description', true]
];

const inputClass = 'w-full mt-1 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 px-3 py-2 text-xs text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-700';

export function LandingCatalogEditor({ type, metadata = [], facilities, sports, fallbackToCatalog = true, onChange, onDelete, openMediaPicker }) {
  const { language } = useLanguage();
  const isEn = language === 'en';
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
      `${isEn ? 'Image' : 'Ảnh'}: ${record.name}`,
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
      ...Object.fromEntries(fields.map(([key]) => [key, ''])),
      id,
      name: isSports ? (isEn ? 'New sport' : 'Bộ môn mới') : (isEn ? 'New facility' : 'Cụm sân mới'),
      image: '',
      isVisible: true,
      ...(isSports
        ? { icon: 'sports', facilityId: '', badges: [] }
        : { secondaryImage: '', specs: [], amenities: [], tags: [] })
    };
    onChange([...records, card]);
  };
  const renderField = (record, [key, vi, en, multiline]) => (
    <label key={key} className={`block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 ${multiline ? 'sm:col-span-2' : ''}`}>
      {isEn ? en : vi}
      {multiline ? (
        <textarea
          name={key}
          value={record[key] ?? ''}
          onChange={event => update(record, { [key]: event.target.value })}
          rows={3}
          maxLength={10000}
          className={inputClass}
        />
      ) : (
        <input
          name={key}
          type="text"
          value={record[key] ?? ''}
          onChange={event => update(record, { [key]: event.target.value })}
          maxLength={10000}
          className={inputClass}
        />
      )}
    </label>
  );
  const renderCardContent = record => (
    <div className="space-y-3">
      {record.image ? (
        <div className="h-40 w-full rounded-lg overflow-hidden bg-brand-navy-900">
          <img src={record.image} alt={record.name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="py-10 text-center bg-white dark:bg-brand-navy-800 rounded-lg border border-dashed border-brand-navy-300 dark:border-brand-navy-700 text-brand-navy-400 text-xs">
          <span className="material-symbols-outlined text-[28px] mb-1">image_not_supported</span>
          <div>{isEn ? 'No image set' : 'Chưa có ảnh'}</div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          className="rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          onClick={() => pickImage(record)}
        >
          <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
          <span>{isEn ? 'Upload/Change Image' : 'Tải/Đổi Ảnh'}</span>
        </button>
        <label className="flex items-center gap-2 text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 cursor-pointer">
          <input
            type="checkbox"
            checked={record.isVisible !== false}
            onChange={event => update(record, { isVisible: event.target.checked })}
            className="rounded text-brand-sage-700 dark:text-brand-sage-400 focus:ring-brand-sage-700 accent-brand-sage-700 cursor-pointer"
          />
          <span>{isEn ? 'Show on Homepage' : 'Hiển thị trên trang chủ'}</span>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(field => renderField(record, field))}
        {isSports && (
          <label className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300 sm:col-span-2">
            {isEn ? 'Linked facility' : 'Cụm sân liên kết'}
            <select
              name="facilityId"
              value={record.facilityId ?? ''}
              onChange={event => update(record, { facilityId: event.target.value })}
              className={inputClass}
            >
              <option value="">{isEn ? 'No linked facility' : 'Chưa liên kết cụm sân'}</option>
              {record.facilityId && !availableFacilities.some(facility => String(facility.id) === String(record.facilityId)) && (
                <option value={record.facilityId}>{record.venue || record.facilityId}</option>
              )}
              {availableFacilities.map(facility => <option key={facility.id} value={String(facility.id)}>{facility.name}</option>)}
            </select>
          </label>
        )}
        {renderField(record, ['image', 'Đường dẫn ảnh', 'Image URL'])}
        {!isSports && renderField(record, ['secondaryImage', 'Đường dẫn ảnh phụ', 'Secondary image URL'])}
      </div>
      {!isSports && (
        <>
          <button
            type="button"
            onClick={() => pickImage(record, 'secondaryImage')}
            className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:underline"
          >
            {isEn ? 'Upload/Change Secondary Image' : 'Tải/Đổi Ảnh Phụ'}
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            {['amenities', 'tags'].map(key => (
              <label key={key} className="block text-xs font-semibold text-brand-navy-700 dark:text-brand-navy-300">
                {key === 'amenities'
                  ? (isEn ? 'Amenities (one per line)' : 'Tiện ích (mỗi dòng một mục)')
                  : (isEn ? 'Tags (one per line)' : 'Nhãn tìm kiếm (mỗi dòng một mục)')}
                <textarea
                  name={key}
                  rows={3}
                  value={(record[key] || []).join('\n')}
                  onChange={event => update(record, { [key]: event.target.value ? event.target.value.split('\n') : [] })}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300">{isEn ? 'Specifications' : 'Thông số'}</h4>
            {(record.specs || []).map((spec, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                {['label', 'value'].map(key => (
                  <label key={key} className="min-w-0 text-xs text-brand-navy-700 dark:text-brand-navy-300">
                    {key === 'label' ? (isEn ? 'Label' : 'Tên thông số') : (isEn ? 'Value' : 'Giá trị')}
                    <input
                      type="text"
                      name={`spec-${key}`}
                      value={spec[key] || ''}
                      maxLength={10000}
                      onChange={event => update(record, { specs: record.specs.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: event.target.value } : entry) })}
                      className={inputClass}
                    />
                  </label>
                ))}
                <button
                  type="button"
                  aria-label={isEn ? 'Remove specification' : 'Xóa thông số'}
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
              onClick={() => update(record, { specs: [...(record.specs || []), { label: '', value: '' }] })}
              className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:underline disabled:opacity-50"
            >
              {isEn ? 'Add specification' : 'Thêm thông số'}
            </button>
          </div>
        </>
      )}
    </div>
  );
  return (
    <section className="space-y-5 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 bg-white dark:bg-brand-navy-900 p-6 shadow-sm">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-lg text-brand-navy-900 dark:text-white">
            {isSports
              ? (isEn ? 'Homepage Sports' : 'Bộ môn trên trang chủ')
              : (isEn ? 'Homepage Courts & Facilities' : 'Phòng / sân trên trang chủ')}
          </h2>
          <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
            {isEn
              ? 'Add cards and edit their content, images and visibility. Click Save All Changes to publish.'
              : 'Thêm thẻ và chỉnh nội dung, hình ảnh, ẩn/hiện. Bấm Lưu Toàn Bộ Thay Đổi để công bố.'}
          </p>
          <a className="inline-flex items-center gap-1 text-xs font-semibold text-brand-sage-700 dark:text-brand-sage-500 hover:underline mt-2" href="#/manager/classes-rooms">
            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            <span>{isEn ? 'Manage sports, classes, courts & rooms' : 'Quản lý bộ môn, lớp và phòng / sân'}</span>
          </a>
        </div>
        <button
          type="button"
          onClick={addCard}
          disabled={records.length >= 200 || (loading && usesCatalog)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-sage-700 hover:bg-brand-sage-900 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {isSports ? (isEn ? 'Add sport card' : 'Thêm thẻ bộ môn') : (isEn ? 'Add facility card' : 'Thêm thẻ cụm sân')}
        </button>
      </div>
      {loading && usesCatalog && <p role="status" className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{isEn ? 'Loading catalog...' : 'Đang tải danh mục...'}</p>}
      {error && usesCatalog && <p role="alert" className="text-xs text-brand-danger-600 dark:text-brand-danger-400">{error}</p>}
      {(!usesCatalog || (!loading && !error)) && records.length === 0 && (
        <p role="status" className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
          {isEn ? 'No cards yet. Add a card to start.' : 'Chưa có thẻ. Bấm thêm thẻ để bắt đầu.'}
        </p>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {records.map(record => {
          return (
            <article key={`${type}-${record.id}`} data-card-id={record.id} className="min-w-0 rounded-xl border border-brand-navy-200/80 dark:border-brand-navy-800 bg-brand-navy-50/50 dark:bg-brand-navy-800/40 p-4 space-y-3 hover-lift transition-all">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-brand-navy-900 dark:text-white">{record.name}</h3>
                {Number.isFinite(record.capacity) && (
                  <span className="text-[11px] font-semibold text-brand-navy-500 dark:text-brand-navy-400 bg-white dark:bg-brand-navy-800 px-2 py-0.5 rounded border border-brand-navy-200 dark:border-brand-navy-700">
                    {isEn ? `Capacity: ${record.capacity}` : `Sức chứa: ${record.capacity} người`}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={() => setEditingCard({ type, id: String(record.id) })}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-brand-sage-700/10 px-3 py-2.5 text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 hover:bg-brand-sage-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage-700"
              >
                <span>{isEn ? 'Expand content' : 'Mở rộng nội dung'}</span>
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">open_in_new</span>
              </button>
              <button
                type="button"
                aria-label={`${isEn ? 'Delete card' : 'Xóa thẻ'}: ${record.name}`}
                onClick={() => setDeletingCard({ type, id: String(record.id) })}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-danger-200 px-3 py-2 text-xs font-bold text-brand-danger-600 hover:bg-brand-danger-50 dark:border-brand-danger-900 dark:text-brand-danger-400 dark:hover:bg-brand-danger-950/30"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                {isEn ? 'Delete card' : 'Xóa thẻ'}
              </button>
            </article>
          );
        })}
      </div>
      {activeRecord && createPortal(
        <Modal
          isOpen={!isMediaPickerOpen}
          onClose={() => setEditingCard(null)}
          title={`${isEn ? 'Edit card' : 'Chỉnh sửa thẻ'}: ${activeRecord.name}`}
          maxWidth="max-w-2xl"
        >
          {renderCardContent(activeRecord)}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-brand-navy-200 pt-4">
            <p className="text-xs text-brand-navy-500">
              {isEn
                ? 'Changes stay in your draft. Click Save All Changes after closing.'
                : 'Thay đổi được giữ trong bản nháp. Bấm Lưu Toàn Bộ Thay Đổi sau khi đóng.'}
            </p>
            <button
              type="button"
              onClick={() => setEditingCard(null)}
              className="rounded-xl bg-brand-sage-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-sage-900"
            >
              {isEn ? 'Done' : 'Hoàn tất'}
            </button>
          </div>
        </Modal>,
        document.body
      )}
      {pendingDelete && createPortal(
        <Modal
          isOpen
          onClose={() => setDeletingCard(null)}
          title={isEn ? 'Delete card?' : 'Xóa thẻ?'}
        >
          <p className="text-sm text-brand-navy-700">
            {isEn ? `Remove "${pendingDelete.name}" from the homepage?` : `Xóa thẻ "${pendingDelete.name}" khỏi trang chủ?`}
          </p>
          {linkedSportsCount > 0 && (
            <p className="mt-3 text-sm text-brand-sand-700 dark:text-brand-sand-400">
              {isEn
                ? `${linkedSportsCount} linked sport card(s) will be kept with their facility link cleared.`
                : `${linkedSportsCount} thẻ bộ môn liên kết sẽ được giữ lại và chuyển về trạng thái chưa liên kết cụm sân.`}
            </p>
          )}
          <p className="mt-3 text-xs text-brand-navy-500">
            {isEn ? 'Click Save All Changes to publish the deletion.' : 'Bấm Lưu Toàn Bộ Thay Đổi để lưu việc xóa thẻ.'}
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setDeletingCard(null)} className="rounded-xl border border-brand-navy-300 px-4 py-2 text-xs font-bold text-brand-navy-700 hover:bg-brand-navy-50">
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button type="button" onClick={deleteCard} className="rounded-xl bg-brand-danger-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-danger-700">
              {isEn ? 'Confirm deletion' : 'Xác nhận xóa'}
            </button>
          </div>
        </Modal>,
        document.body
      )}
    </section>
  );
}

