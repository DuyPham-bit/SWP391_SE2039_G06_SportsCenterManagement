import React from 'react';

const OPTIONS = [
  { code: 'vi', label: 'VI', name: 'Tiếng Việt' },
  { code: 'en', label: 'EN', name: 'English' },
];

/** Frosted VI | EN pill. Switches the app language in place (LanguageContext, no reload). */
export function LangToggle({ language, onChange, label }) {
  return (
    <div className="osa-splash__lang" role="group" aria-label={label} data-lang={language}>
      <span className="osa-splash__lang-thumb" aria-hidden="true" />
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          lang={option.code}
          aria-label={option.name}
          aria-pressed={language === option.code}
          onClick={() => onChange(option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
