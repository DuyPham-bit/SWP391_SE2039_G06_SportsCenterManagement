import React from 'react';

export function TrainingPlanEmptyState({ handleOpenCreateModal, isEn }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-brand-navy-300 p-12 text-center text-brand-navy-500 space-y-3">
      <div className="w-16 h-16 rounded-full bg-brand-navy-100 flex items-center justify-center mx-auto text-brand-navy-400">
        <span className="material-symbols-outlined text-3xl">assignment_late</span>
      </div>
      <div className="font-bold text-brand-navy-800 text-base">
        {isEn ? 'No lesson plans found' : 'Không tìm thấy giáo án nào phù hợp'}
      </div>
      <p className="text-xs text-brand-navy-500 max-w-md mx-auto leading-relaxed">
        {isEn
          ? 'Try adjusting your search criteria or class filter, or click "Create New Plan" to design a new program.'
          : 'Hãy thử thay đổi điều kiện tìm kiếm hoặc bấm nút "Soạn Giáo Án Mới" để thiết lập chương trình rèn luyện.'}
      </p>
      <div className="pt-2">
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-sand-300 hover:bg-brand-terra-500 text-brand-navy-900 hover:text-white font-bold text-xs uppercase transition-all shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>{isEn ? 'Create Plan Now' : 'Soạn Giáo Án Ngay'}</span>
        </button>
      </div>
    </div>
  );
}
