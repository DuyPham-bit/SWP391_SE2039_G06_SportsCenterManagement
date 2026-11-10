import React from 'react';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { labelClass, inputClass } from './formStyles.js';
import { today, getAvatarGradient, getInitials } from '../lib/staffDisplay.js';
import { SpecialtyPicker } from './SpecialtyPicker.jsx';

export function CreateStaffModal({
  addingSpecialty, createModalOpen, createMode, dropdownRef, existingStaffUserIds, filteredMembers,
  form, handleAddSpecialty, handleFormChange, handleSaveStaff, isDropdownOpen, isEn, loadSports,
  memberSearchQuery, newSpecialtyName, roleConfig, saving, searchingMembers, selectedMember,
  setCreateModalOpen, setCreateMode, setForm, setIsDropdownOpen, setMemberSearchQuery,
  setNewSpecialtyName, setSelectedMember, sports, sportsError
}) {
  return (
    <Modal
      isOpen={createModalOpen}
      onClose={() => !saving && setCreateModalOpen(false)}
      title={isEn ? 'Add New Staff to Sports Center' : 'Thêm nhân sự mới vào trung tâm'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Tabs: DIRECT vs APPOINT */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-brand-navy-100 dark:bg-brand-navy-800 rounded-xl">
          <button
            type="button"
            onClick={() => setCreateMode('DIRECT')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                createMode === 'DIRECT'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-100'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>{isEn ? 'Create Direct Account' : 'Tạo tài khoản trực tiếp'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCreateMode('APPOINT')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                createMode === 'APPOINT'
                  ? 'bg-white dark:bg-brand-navy-900 text-brand-navy-900 dark:text-brand-navy-100 shadow-sm'
                  : 'text-brand-navy-600 dark:text-brand-navy-400 hover:text-brand-navy-900 dark:hover:text-brand-navy-100'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">upgrade</span>
            <span>{isEn ? 'Appoint Existing Member' : 'Bổ nhiệm từ hội viên có sẵn'}</span>
          </button>
        </div>

        <form onSubmit={handleSaveStaff} className="space-y-4">
          {createMode === 'DIRECT' ? (
            <div className="space-y-4">
              <div className="p-3 bg-brand-sage-50/70 dark:bg-brand-sage-950/40 border border-brand-sage-200/60 dark:border-brand-sage-800/60 rounded-xl text-xs text-brand-sage-900 dark:text-brand-sage-300 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-500 text-[18px] flex-shrink-0 mt-0.5">info</span>
                <span>
                  {isEn
                    ? 'Creates a complete new staff account. Access rights will be granted according to the selected role and they can log in right away.'
                    : 'Tạo tài khoản nhân sự mới hoàn chỉnh. Tài khoản sẽ được cấp quyền truy cập theo vai trò đã chọn và có thể đăng nhập ngay.'}
                </span>
              </div>

              {/* Role selection */}
              <div>
                <label className={labelClass}>{isEn ? 'Staff Role *' : 'Vai trò bổ nhiệm *'}</label>
                <div className="grid grid-cols-2 gap-3">
                  {['COACH', 'RECEPTIONIST'].map((r) => {
                    const cfg = roleConfig[r];
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, role: r }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            form.role === r
                              ? 'border-brand-sage-700 bg-brand-sage-700/10 dark:bg-brand-sage-700/20 shadow-xs'
                              : 'border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-600'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`material-symbols-outlined text-[22px] ${form.role === r ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-400'}`}>
                            {cfg.icon}
                          </span>
                          <div>
                            <div className={`text-xs font-bold ${form.role === r ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-800 dark:text-brand-navy-200'}`}>
                              {cfg.label}
                            </div>
                            <div className="text-[10px] text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider">{r}</div>
                          </div>
                        </div>
                        {form.role === r && (
                          <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-500">check_circle</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>{isEn ? 'Username *' : 'Tên đăng nhập *'}</label>
                  <input
                    className={inputClass}
                    name="username"
                    required
                    minLength={3}
                    maxLength={100}
                    placeholder={isEn ? 'e.g. coach.nam' : 'ví dụ: coach.nam'}
                    pattern="[a-zA-Z0-9._-]+"
                    value={form.username}
                    onChange={handleFormChange}
                  />
                  <span className="text-[11px] text-brand-navy-400 mt-1 block">
                    {isEn ? 'Letters, numbers, dots/dashes only.' : 'Chỉ gồm chữ cái, số, dấu chấm/gạch.'}
                  </span>
                </div>

                <div>
                  <label className={labelClass}>{isEn ? 'Initial Password *' : 'Mật khẩu khởi tạo *'}</label>
                  <input
                    className={inputClass}
                    type="password"
                    autoComplete="new-password"
                    name="password"
                    required
                    minLength={6}
                    maxLength={128}
                    placeholder={isEn ? 'Minimum 6 characters' : 'Tối thiểu 6 ký tự'}
                    value={form.password}
                    onChange={handleFormChange}
                  />
                  <span className="text-[11px] text-brand-navy-400 mt-1 block">
                    {isEn ? 'Required: use uppercase, lowercase, a number and a special character.' : 'Bắt buộc nhập, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'}
                  </span>
                </div>

                <div>
                  <label className={labelClass}>{isEn ? 'Full Name *' : 'Họ và tên đầy đủ *'}</label>
                  <input
                    className={inputClass}
                    name="fullName"
                    required
                    maxLength={150}
                    placeholder={isEn ? 'e.g. Tran Van Nam' : 'ví dụ: Trần Văn Nam'}
                    value={form.fullName}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isEn ? 'Contact & Login Email *' : 'Email đăng nhập & liên hệ *'}</label>
                  <input
                    className={inputClass}
                    type="email"
                    name="email"
                    required
                    maxLength={150}
                    placeholder="email@sportscenter.vn"
                    value={form.email}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isEn ? 'Phone Number' : 'Số điện thoại'}</label>
                  <input
                    className={inputClass}
                    type="tel"
                    name="phone"
                    maxLength={20}
                    placeholder="0912 345 678"
                    value={form.phone}
                    onChange={handleFormChange}
                  />
                </div>

                <div>
                  <label className={labelClass}>{isEn ? 'Hire Date' : 'Ngày nhận việc'}</label>
                  <input
                    className={inputClass}
                    type="date"
                    name="hireDate"
                    max={today()}
                    value={form.hireDate}
                    onChange={handleFormChange}
                  />
                </div>

                {form.role === 'COACH' && (
                  <>
                    <SpecialtyPicker addingSpecialty={addingSpecialty} form={form} handleAddSpecialty={handleAddSpecialty} isEn={isEn} loadSports={loadSports} newSpecialtyName={newSpecialtyName} saving={saving} setForm={setForm} setNewSpecialtyName={setNewSpecialtyName} sports={sports} sportsError={sportsError} />

                    <div>
                      <label className={labelClass}>{isEn ? 'Certifications' : 'Chứng chỉ quốc tế'}</label>
                      <input
                        className={inputClass}
                        name="certification"
                        placeholder={isEn ? 'e.g. NASM-CPT, AFC Level A...' : 'VD: NASM-CPT, AFC Level A...'}
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
                        placeholder={isEn ? 'e.g. 3' : 'Số năm kinh nghiệm (VD: 3)'}
                        value={form.experienceYears}
                        onChange={handleFormChange}
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className={labelClass}>{isEn ? 'Biography / Notes' : 'Tiểu sử / Ghi chú'}</label>
                <textarea
                  rows={2}
                  className={inputClass}
                  name="bio"
                  placeholder={isEn ? 'Brief description about coaching background, achievements...' : 'Mô tả ngắn gọn về kinh nghiệm, thành tích hoặc phân công chuyên môn...'}
                  value={form.bio}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          ) : (
            /* APPOINT MODE */
            <div className="space-y-4">
              <div className="p-3 bg-brand-navy-50/70 dark:bg-brand-navy-950/40 border border-brand-navy-200/60 dark:border-brand-navy-800/60 rounded-xl text-xs text-brand-navy-900 dark:text-brand-navy-300 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-brand-navy-700 dark:text-brand-navy-400 text-[18px] flex-shrink-0 mt-0.5">upgrade</span>
                <span>
                  {isEn
                    ? 'Promotes an existing member account to Coach or Receptionist. Their login history and credentials will remain intact.'
                    : 'Chuyển đổi hoặc nâng cấp tài khoản hội viên có sẵn trong hệ thống thành Huấn luyện viên hoặc Lễ tân quầy. Lịch sử và thông tin đăng nhập được giữ nguyên.'}
                </span>
              </div>

              {/* Step 1: Member search */}
              <div className="space-y-2">
                <label className={labelClass}>{isEn ? '1. Find member account to appoint *' : '1. Tìm tài khoản hội viên cần bổ nhiệm *'}</label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-brand-navy-400 text-[18px]">search</span>
                    <input
                      type="text"
                      placeholder={isEn ? 'Type at least 2 chars: Name, Email, Phone or Member ID...' : 'Nhập ít nhất 2 ký tự: Tên, Email, SĐT hoặc mã hội viên...'}
                      value={memberSearchQuery}
                      onChange={(e) => {
                        setMemberSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                        setSelectedMember(null);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className={inputClass}
                    />
                    {memberSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setMemberSearchQuery('');
                          setSelectedMember(null);
                          setIsDropdownOpen(true);
                        }}
                        className="absolute right-3 top-2.5 text-brand-navy-400 hover:text-brand-navy-600 dark:hover:text-brand-navy-200 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-brand-navy-800 border border-brand-navy-200 dark:border-brand-navy-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-brand-navy-100 dark:divide-brand-navy-700">
                      {searchingMembers ? (
                        <div className="p-4 text-xs text-brand-navy-500 dark:text-brand-navy-400 text-center flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-brand-sage-600 border-t-transparent rounded-full animate-spin" />
                          <span>{isEn ? 'Searching accounts...' : 'Đang tìm kiếm tài khoản...'}</span>
                        </div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="p-3 text-xs text-brand-navy-500 dark:text-brand-navy-400 text-center flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-brand-navy-400 text-[20px]">search_off</span>
                          <span>
                            {memberSearchQuery.trim().length === 1
                              ? isEn
                                ? 'Enter at least 2 characters to search accounts.'
                                : 'Nhập ít nhất 2 ký tự để tìm tài khoản.'
                              : isEn
                              ? `No accounts match "${memberSearchQuery}"`
                              : `Không tìm thấy tài khoản nào khớp với "${memberSearchQuery}"`}
                          </span>
                        </div>
                      ) : (
                        filteredMembers.map((m) => {
                          const isAlreadyStaff = existingStaffUserIds.has(Number(m.userId)) || (m.role && m.role !== 'MEMBER');
                          const isInactive = m.status && m.status !== 'ACTIVE';
                          const isSelectable = !isAlreadyStaff && !isInactive;

                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                if (!isSelectable) return;
                                setSelectedMember(m);
                                setMemberSearchQuery(`${m.fullName} (${m.email})`);
                                setIsDropdownOpen(false);
                              }}
                              className={`p-2.5 flex items-center justify-between gap-3 transition-colors ${
                                  !isSelectable
                                    ? 'opacity-60 bg-brand-navy-50 dark:bg-brand-navy-800/60 cursor-not-allowed'
                                    : 'hover:bg-brand-sage-50/80 dark:hover:bg-brand-navy-700 cursor-pointer'
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                                      m.fullName
                                    )} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                                >
                                  {getInitials(m.fullName)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-xs truncate">{m.fullName}</span>
                                    {m.memberCode && (
                                      <span className="font-mono text-[10px] font-semibold bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 px-1.5 py-0.5 rounded">
                                        {m.memberCode}
                                      </span>
                                    )}
                                    {isAlreadyStaff && (
                                      <span className="text-[10px] font-semibold bg-brand-sand-100 dark:bg-brand-sand-900/60 text-brand-sand-800 dark:text-brand-sand-300 px-1.5 py-0.5 rounded">
                                        {isEn ? 'Already Staff' : 'Đã là nhân sự'}
                                      </span>
                                    )}
                                    {isInactive && (
                                      <span className="text-[10px] font-semibold bg-brand-danger-100 dark:bg-brand-danger-900/60 text-brand-danger-800 dark:text-brand-danger-300 px-1.5 py-0.5 rounded">
                                        {isEn ? 'Inactive' : 'Tài khoản khóa'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 truncate">
                                    {m.email} {m.phone ? `• ${m.phone}` : ''}
                                  </div>
                                </div>
                              </div>
                              {isSelectable ? (
                                <span className="text-[11px] font-bold text-brand-sage-700 dark:text-brand-sage-500 flex-shrink-0 bg-brand-sage-700/10 px-2 py-1 rounded">
                                  {isEn ? 'Select' : 'Chọn'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-brand-navy-400 flex-shrink-0">
                                  {isAlreadyStaff ? (isEn ? 'Ineligible' : 'Không khả dụng') : (isEn ? 'Locked' : 'Đã khóa')}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {selectedMember && (
                  <div className="bg-brand-sage-50 dark:bg-brand-sage-950/40 border border-brand-sage-200 dark:border-brand-sage-800 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                            selectedMember.fullName
                          )} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                      >
                        {getInitials(selectedMember.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-navy-900 dark:text-brand-navy-100 text-sm truncate">{selectedMember.fullName}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-sage-100 dark:bg-brand-sage-900/60 text-brand-sage-800 dark:text-brand-sage-300">
                            {isEn ? 'Selected' : 'Đã chọn'}
                          </span>
                        </div>
                        <div className="text-xs text-brand-navy-600 dark:text-brand-navy-400 truncate">
                          {selectedMember.email} {selectedMember.phone ? `• ${isEn ? 'Tel' : 'SĐT'}: ${selectedMember.phone}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberSearchQuery('');
                        setIsDropdownOpen(true);
                      }}
                      className="text-xs text-brand-danger-600 dark:text-brand-danger-400 hover:text-brand-danger-700 font-bold hover:underline flex-shrink-0 cursor-pointer"
                    >
                      {isEn ? 'Change' : 'Đổi tài khoản'}
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Role selection */}
              <div>
                <label className={labelClass}>{isEn ? '2. Select Role to Assign *' : '2. Chọn vai trò trao cho tài khoản này *'}</label>
                <div className="grid grid-cols-2 gap-3">
                  {['COACH', 'RECEPTIONIST'].map((r) => {
                    const cfg = roleConfig[r];
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, role: r }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                            form.role === r
                              ? 'border-brand-sage-700 bg-brand-sage-700/10 dark:bg-brand-sage-700/20 shadow-xs'
                              : 'border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-600'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`material-symbols-outlined text-[22px] ${form.role === r ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-400'}`}>
                            {cfg.icon}
                          </span>
                          <div>
                            <div className={`text-xs font-bold ${form.role === r ? 'text-brand-sage-700 dark:text-brand-sage-500' : 'text-brand-navy-800 dark:text-brand-navy-200'}`}>
                              {cfg.label}
                            </div>
                            <div className="text-[10px] text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider">{r}</div>
                          </div>
                        </div>
                        {form.role === r && (
                          <span className="material-symbols-outlined text-[18px] text-brand-sage-700 dark:text-brand-sage-500">check_circle</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{isEn ? 'Hire Date' : 'Ngày nhận việc'}</label>
                  <input
                    className={inputClass}
                    type="date"
                    name="hireDate"
                    max={today()}
                    value={form.hireDate}
                    onChange={handleFormChange}
                  />
                </div>
                {form.role === 'COACH' && <SpecialtyPicker addingSpecialty={addingSpecialty} form={form} handleAddSpecialty={handleAddSpecialty} isEn={isEn} loadSports={loadSports} newSpecialtyName={newSpecialtyName} saving={saving} setForm={setForm} setNewSpecialtyName={setNewSpecialtyName} sports={sports} sportsError={sportsError} />}
                <div>
                  <label className={labelClass}>{isEn ? 'Certifications' : 'Chứng chỉ quốc tế'}</label>
                  <input
                    className={inputClass}
                    name="certification"
                    placeholder={isEn ? 'e.g. NASM-CPT, AFC...' : 'VD: NASM-CPT, AFC...'}
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
                    placeholder={isEn ? 'e.g. 3' : 'VD: 3'}
                    value={form.experienceYears}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 text-xs font-bold hover:bg-brand-navy-50 dark:hover:bg-brand-navy-800 transition-colors"
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
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>{createMode === 'DIRECT' ? (isEn ? 'Create Staff' : 'Tạo nhân viên') : isEn ? 'Confirm Appointment' : 'Xác nhận bổ nhiệm'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
