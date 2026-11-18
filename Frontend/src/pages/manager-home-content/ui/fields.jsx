import React from 'react';
import { readText, writeText } from '../../../entities/landing-content/index.js';

export const LABEL_CLASS = 'block text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1';
export const INPUT_CLASS = 'w-full px-4 py-2.5 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none';

/** VI | EN switch for the content language being edited; a dot marks a language with missing text. */
export function LangToggle({ lang, onChange, missing = {}, t }) {
  return (
    <div role="group" aria-label={t('homeContent.lang.toggleLabel')} className="inline-flex items-center rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-brand-navy-50 dark:bg-brand-navy-800/60 p-1 gap-1 shrink-0">
      {['vi', 'en'].map(code => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => onChange(code)}
          title={missing[code] ? t('homeContent.lang.missing', { lang: code.toUpperCase() }) : undefined}
          className={`relative px-3 py-1 rounded-lg text-[11px] font-black tracking-wider transition-all ${
            lang === code
              ? 'bg-brand-sage-700 text-white shadow-sm'
              : 'text-brand-navy-600 dark:text-brand-navy-300 hover:bg-white dark:hover:bg-brand-navy-700'
          }`}
        >
          {code.toUpperCase()}
          {missing[code] && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-sand-400 ring-2 ring-white dark:ring-brand-navy-900" aria-hidden="true" />
          )}
        </button>
      ))}
    </div>
  );
}

/** Tab heading with its content-language switch. */
export function SectionHeading({ title, description, lang, setLang, missing, t }) {
  return (
    <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">{title}</h2>
        {description && <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">{description}</p>}
      </div>
      {setLang && <LangToggle lang={lang} onChange={setLang} missing={missing} t={t} />}
    </div>
  );
}

/**
 * Input bound to one language of a { vi, en } value. While editing English the Vietnamese text is shown
 * as the placeholder, so translators see the source.
 */
export function LocalizedInput({ value, lang, onChange, multiline = false, placeholder, className = INPUT_CLASS, ...rest }) {
  const text = readText(value, lang);
  const hint = lang === 'en' ? (readText(value, 'vi') || placeholder) : placeholder;
  const props = {
    ...rest,
    value: text,
    placeholder: hint,
    lang,
    onChange: event => onChange(writeText(value, lang, event.target.value)),
    className
  };
  return multiline ? <textarea rows={3} {...props} /> : <input type="text" {...props} />;
}

/** Shows a { vi, en } value in the editing language, falling back to Vietnamese (for previews). */
export const showText = (value, lang) => readText(value, lang) || readText(value, 'vi');
