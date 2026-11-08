import React from 'react';
import { labelClass, inputClass } from './formStyles.js';

// Sport specialty selector shared by the create and edit staff dialogs.
export function SpecialtyPicker({ addingSpecialty, form, handleAddSpecialty, isEn, loadSports, newSpecialtyName, saving, setForm, setNewSpecialtyName, sports, sportsError }) {
  return (
    <div className="space-y-3 sm:col-span-2">
      <label className={labelClass}>{isEn ? 'Sport Disciplines / Specialties *' : 'Chuyên môn thể thao *'}</label>
      {sportsError ? (
        <div role="alert" className="text-sm text-brand-danger-700 dark:text-brand-danger-400">
          <p>{sportsError}</p>
          <button type="button" className="underline font-bold" onClick={loadSports}>
            {isEn ? 'Retry' : 'Thử lại'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sports.map((sport) => {
            const selected = (form.sportIds || []).includes(Number(sport.id));
            return (
              <button
                key={sport.id}
                type="button"
                disabled={saving || addingSpecialty}
                aria-pressed={selected}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    sportIds: selected
                      ? current.sportIds.filter((id) => id !== Number(sport.id))
                      : [...(current.sportIds || []), Number(sport.id)]
                  }))
                }
                className={`rounded-xl border p-2.5 text-left text-xs font-bold transition-all ${
                  selected
                    ? 'border-brand-sage-700 bg-brand-sage-700/10 text-brand-sage-700 dark:text-brand-sage-500 dark:border-brand-sage-500'
                    : 'border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700'
                }`}
              >
                {sport.name}
              </button>
            );
          })}
          {!sports.length && (
            <p className="col-span-full text-xs text-brand-navy-500 dark:text-brand-navy-400">
              {isEn ? 'No active sport disciplines.' : 'Chưa có chuyên môn hoạt động.'}
            </p>
          )}
        </div>
      )}
      <div className="flex gap-2">
        <input
          aria-label={isEn ? 'New specialty name' : 'Tên chuyên môn mới'}
          maxLength={100}
          className={inputClass}
          value={newSpecialtyName}
          onChange={(event) => setNewSpecialtyName(event.target.value)}
          placeholder={isEn ? 'Add new sport discipline...' : 'Thêm chuyên môn mới...'}
        />
        <button
          type="button"
          disabled={addingSpecialty || saving || !newSpecialtyName.trim()}
          onClick={handleAddSpecialty}
          className="shrink-0 rounded-xl bg-brand-navy-900 hover:bg-brand-navy-800 px-4 text-xs font-bold text-white disabled:opacity-50 transition-colors"
        >
          {addingSpecialty ? (isEn ? 'Adding...' : 'Đang thêm...') : isEn ? 'Add' : 'Thêm'}
        </button>
      </div>
    </div>
  );
}
