import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { labelClass, inputClass } from './formStyles.js';
import { SpecialtyPicker } from './SpecialtyPicker.jsx';

export function EditStaffModal({
  addingSpecialty, editingStaff, form, handleAddSpecialty, handleFormChange, handleSaveStaff, isEn,
  loadSports, newSpecialtyName, saving, setEditingStaff, setForm, setNewSpecialtyName, sports,
  sportsError
}) {
  return (
    <Modal
      isOpen={Boolean(editingStaff)}
      onClose={() => !saving && setEditingStaff(null)}
      title={
        editingStaff
          ? isEn
            ? `Edit Staff Member · ${editingStaff.fullName} (ID: ${editingStaff.id})`
            : `Chỉnh sửa nhân viên · ${editingStaff.fullName} (ID: ${editingStaff.id})`
          : isEn
          ? 'Edit Staff'
          : 'Chỉnh sửa'
      }
      maxWidth="max-w-xl"
    >
      {editingStaff && (
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className={labelClass}>{isEn ? 'Full Name *' : 'Họ và tên nhân viên *'}</label>
              <input
                className={inputClass}
                required
                name="fullName"
                maxLength={150}
                value={form.fullName}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Email (Permanent Account ID)' : 'Email (Cố định tài khoản)'}</label>
              <input
                className={`${inputClass} bg-brand-navy-100 dark:bg-brand-navy-800/60 cursor-not-allowed text-brand-navy-500`}
                disabled
                value={form.email}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Phone Number' : 'Số điện thoại'}</label>
              <input
                className={inputClass}
                name="phone"
                type="tel"
                placeholder="0912 345 678"
                value={form.phone}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Role *' : 'Vai trò nhân sự *'}</label>
              <select name="role" value={form.role} onChange={handleFormChange} className={`${inputClass} font-semibold`}>
                <option value="COACH">{isEn ? 'Coach / Instructor (COACH)' : 'Huấn luyện viên (COACH)'}</option>
                <option value="RECEPTIONIST">{isEn ? 'Front Desk Receptionist (RECEPTIONIST)' : 'Lễ tân quầy (RECEPTIONIST)'}</option>
                <option value="MANAGER">{isEn ? 'Center Manager (MANAGER)' : 'Quản lý trung tâm (MANAGER)'}</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Hire Date' : 'Ngày nhận việc'}</label>
              <input
                className={inputClass}
                type="date"
                name="hireDate"
                value={form.hireDate}
                onChange={handleFormChange}
              />
            </div>

            {form.role === 'COACH' && <SpecialtyPicker addingSpecialty={addingSpecialty} form={form} handleAddSpecialty={handleAddSpecialty} isEn={isEn} loadSports={loadSports} newSpecialtyName={newSpecialtyName} saving={saving} setForm={setForm} setNewSpecialtyName={setNewSpecialtyName} sports={sports} sportsError={sportsError} />}

            <div>
              <label className={labelClass}>{isEn ? 'Certifications' : 'Chứng chỉ đào tạo quốc tế'}</label>
              <input
                className={inputClass}
                name="certification"
                placeholder={isEn ? 'e.g. AFC Level A, NASM-CPT' : 'VD: AFC Level A, NASM-CPT'}
                value={form.certification}
                onChange={handleFormChange}
              />
            </div>

            <div>
              <label className={labelClass}>{isEn ? 'Years of Experience' : 'Số năm kinh nghiệm'}</label>
              <input
                className={inputClass}
                type="number"
                name="experienceYears"
                min="0"
                max="50"
                value={form.experienceYears}
                onChange={handleFormChange}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>{isEn ? 'Biography / Introduction' : 'Tiểu sử / Giới thiệu'}</label>
              <textarea
                rows={2}
                className={inputClass}
                name="bio"
                placeholder={isEn ? 'Notes on expertise, career history...' : 'Ghi chú về chuyên môn, lịch sử công tác...'}
                value={form.bio}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => setEditingStaff(null)}
              className="px-4 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800"
            >
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-sage-700/30 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isEn ? 'Saving...' : 'Đang lưu...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isEn ? 'Save Changes' : 'Lưu thay đổi'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
