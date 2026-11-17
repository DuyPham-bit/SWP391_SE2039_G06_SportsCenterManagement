import React, { useMemo, useState } from 'react';
import { TabSaveFooter } from './TabSaveFooter.jsx';
import { translateLandingTexts } from '../../../entities/landing-content/index.js';
import { builtInEnglish, collectLandingTexts } from '../../../shared/i18n/landingTranslation.js';

const SECTION_LABELS = {
  heroBanner: { vi: 'Hero Banner', en: 'Hero banner' },
  whyUs: { vi: 'Về trung tâm', en: 'About' },
  coursesSection: { vi: 'Môn thể thao', en: 'Sports' },
  facilitiesSection: { vi: 'Cơ sở vật chất', en: 'Facilities' },
  zonesLayout: { vi: 'Khu vực tập luyện', en: 'Training areas' },
  ctaAndFooter: { vi: 'Liên hệ & Footer', en: 'Contact & footer' },
  authShowcase: { vi: 'Trang đăng nhập', en: 'Login page' }
};

// One request stays well under the backend limits (60 texts, 20,000 characters).
const BATCH_TEXTS = 40;
const BATCH_CHARS = 12000;

function toBatches(texts) {
  const batches = [];
  let current = [];
  let size = 0;
  for (const text of texts) {
    if (current.length && (current.length >= BATCH_TEXTS || size + text.length > BATCH_CHARS)) {
      batches.push(current);
      current = [];
      size = 0;
    }
    current.push(text);
    size += text.length;
  }
  if (current.length) batches.push(current);
  return batches;
}

/**
 * English version of the homepage. Lists every Vietnamese text on the page with its English text:
 * written here, built in for the standard texts, or missing (the English page then shows Vietnamese).
 */
export function EnglishTab({ addToast, content, handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving, mergeTranslations, updateContentField }) {
  const [filter, setFilter] = useState('missing');
  const [translating, setTranslating] = useState(null);
  // Rows edited while filtering by "not translated" stay in view instead of vanishing mid-typing.
  const [touched, setTouched] = useState(() => new Set());
  const translations = content.translations && typeof content.translations === 'object' ? content.translations : {};

  const rows = useMemo(() => collectLandingTexts(content).map(item => {
    const saved = typeof translations[item.text] === 'string' ? translations[item.text] : '';
    const builtIn = builtInEnglish(item.text);
    return { ...item, saved, builtIn, state: saved.trim() ? 'saved' : builtIn ? 'builtIn' : 'missing' };
  }), [content, translations]);

  const missing = rows.filter(row => row.state === 'missing');
  const shown = filter === 'missing' ? rows.filter(row => row.state === 'missing' || touched.has(row.text)) : rows;

  const handleAutoTranslate = async () => {
    if (!missing.length || translating) return;
    const batches = toBatches(missing.map(row => row.text));
    let added = 0;
    try {
      for (let index = 0; index < batches.length; index += 1) {
        setTranslating({ done: index, total: batches.length });
        const result = await translateLandingTexts(batches[index]);
        added += Object.keys(result).length;
        mergeTranslations(result);
      }
      addToast(isEn
        ? `Drafted ${added} English texts. Check them, then save to publish.`
        : `Đã dịch tự động ${added} đoạn. Hãy kiểm tra lại rồi bấm Lưu để áp dụng.`, 'success');
    } catch (error) {
      addToast((added ? (isEn ? `Translated ${added} texts, then stopped: ` : `Đã dịch ${added} đoạn rồi dừng: `) : '') +
        (error?.message || (isEn ? 'Automatic translation is not available.' : 'Chưa dịch tự động được.')), 'error');
    } finally {
      setTranslating(null);
    }
  };

  const label = section => SECTION_LABELS[section]?.[isEn ? 'en' : 'vi'] || section;

  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-bold text-brand-navy-900 dark:text-white">
          {isEn ? 'English version' : 'Bản tiếng Anh'}
        </h2>
        <p className="text-sm text-brand-navy-600 dark:text-brand-navy-300 mt-1 max-w-3xl leading-relaxed">
          {isEn
            ? 'The homepage is written in Vietnamese in the other tabs. When a visitor switches to English, each text below is shown in its English version. A text with no English version is shown in Vietnamese. If you change a Vietnamese text, it appears here again as not translated.'
            : 'Nội dung trang chủ được viết bằng tiếng Việt ở các tab khác. Khi khách chuyển sang English, mỗi đoạn dưới đây sẽ hiển thị theo bản tiếng Anh. Đoạn chưa có bản tiếng Anh sẽ hiện bằng tiếng Việt. Khi bạn sửa một đoạn tiếng Việt, đoạn đó sẽ quay lại danh sách "Chưa dịch".'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-brand-navy-700 dark:text-brand-navy-200">
            {isEn
              ? <><strong>{rows.length - missing.length}</strong>/{rows.length} texts have English</>
              : <><strong>{rows.length - missing.length}</strong>/{rows.length} đoạn đã có tiếng Anh</>}
          </span>
          <div className="inline-flex rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 p-0.5" role="tablist">
            {[
              { id: 'missing', label: isEn ? `Not translated (${missing.length})` : `Chưa dịch (${missing.length})` },
              { id: 'all', label: isEn ? 'All' : 'Tất cả' }
            ].map(option => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={filter === option.id}
                onClick={() => { setFilter(option.id); setTouched(new Set()); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${filter === option.id
                  ? 'bg-brand-navy-900 text-white dark:bg-white dark:text-brand-navy-900'
                  : 'text-brand-navy-600 dark:text-brand-navy-300 hover:text-brand-navy-900 dark:hover:text-white'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={handleAutoTranslate}
          disabled={!missing.length || Boolean(translating)}
          className="px-4 py-2 rounded-lg bg-brand-navy-900 text-white text-sm font-semibold hover:bg-brand-navy-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-brand-navy-900"
        >
          {translating
            ? (isEn ? `Translating… ${translating.done + 1}/${translating.total}` : `Đang dịch… ${translating.done + 1}/${translating.total}`)
            : (isEn ? 'Translate missing texts automatically' : 'Dịch tự động các đoạn chưa dịch')}
        </button>
      </div>
      <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 -mt-3">
        {isEn
          ? 'Automatic translation uses the AI service configured on the server. Read the result before saving; nothing is published until you click Save.'
          : 'Dịch tự động dùng dịch vụ AI đã cấu hình ở máy chủ. Hãy đọc lại bản dịch trước khi lưu; chưa bấm Lưu thì trang chủ chưa thay đổi.'}
      </p>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-navy-500 dark:text-brand-navy-400 border border-dashed border-brand-navy-200 dark:border-brand-navy-700 rounded-xl">
          {isEn ? 'Every text on the homepage has an English version.' : 'Tất cả nội dung trang chủ đã có bản tiếng Anh.'}
        </p>
      ) : (
        <ul className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800 border-y border-brand-navy-100 dark:border-brand-navy-800">
          {shown.map(row => (
            <li key={row.text} className="py-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-brand-navy-500 dark:text-brand-navy-400">
                  <span>{label(row.section)}</span>
                  <span aria-hidden="true">·</span>
                  <span className={row.state === 'missing' ? 'text-amber-700 dark:text-amber-400 font-semibold' : ''}>
                    {row.state === 'saved'
                      ? (isEn ? 'Translated' : 'Đã dịch')
                      : row.state === 'builtIn'
                        ? (isEn ? 'Standard translation' : 'Bản dịch có sẵn')
                        : (isEn ? 'Not translated' : 'Chưa dịch')}
                  </span>
                </div>
                <p className="mt-1 text-sm text-brand-navy-900 dark:text-white whitespace-pre-line break-words">{row.text}</p>
              </div>
              <label className="block">
                <span className="sr-only">{isEn ? 'English text' : 'Bản tiếng Anh'}</span>
                <textarea
                  rows={row.text.length > 90 ? 3 : 1}
                  value={row.saved}
                  placeholder={row.builtIn || (isEn ? 'English text (shown in Vietnamese until filled in)' : 'Nhập bản tiếng Anh (để trống thì trang tiếng Anh hiện tiếng Việt)')}
                  onChange={(event) => {
                    if (!touched.has(row.text)) setTouched(prev => new Set(prev).add(row.text));
                    updateContentField('translations', row.text, event.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-sm leading-relaxed focus:ring-2 focus:ring-brand-sage-700 focus:outline-none resize-y"
                />
              </label>
            </li>
          ))}
        </ul>
      )}

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
