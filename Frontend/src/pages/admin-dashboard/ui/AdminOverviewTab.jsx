import React from 'react';
import { MotionButton } from '../../../shared/ui/MotionButton.jsx';
import { StatusBadge } from './Badges.jsx';

export function AdminOverviewTab({ activeCenters, centers, managers, ov, setShowCC, setShowCM, switchTab }) {
  return (
    <div className="space-y-6">
      {/* Quick Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400">bolt</span>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300">
            Thao tác nhanh quản trị
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MotionButton
            onClick={() => setShowCC(true)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="px-3.5 py-2 rounded-xl bg-brand-sage-50 dark:bg-brand-sage-950/60 text-brand-sage-700 dark:text-brand-sage-300 hover:bg-brand-sage-100 dark:hover:bg-brand-sage-900/60 font-bold text-xs flex items-center gap-1.5 border border-brand-sage-200 dark:border-brand-sage-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Thêm Cơ Sở</span>
          </MotionButton>
          <MotionButton
            onClick={() => setShowCM(true)}
            disabled={activeCenters.length === 0}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="px-3.5 py-2 rounded-xl bg-brand-teal-50 dark:bg-brand-teal-950/60 text-brand-teal-700 dark:text-brand-teal-300 hover:bg-brand-teal-100 dark:hover:bg-brand-teal-900/60 font-bold text-xs flex items-center gap-1.5 border border-brand-teal-200 dark:border-brand-teal-800 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Tạo Manager</span>
          </MotionButton>
          <a
            href="#/admin/roles-permissions"
            className="px-3.5 py-2 rounded-xl bg-brand-navy-50 dark:bg-brand-navy-950/60 text-brand-navy-800 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-900/60 font-bold text-xs flex items-center gap-1.5 border border-brand-navy-200 dark:border-brand-navy-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">security</span>
            <span>Phân Quyền RBAC</span>
          </a>
          <a
            href="#/admin/audit-logs"
            className="px-3.5 py-2 rounded-xl bg-brand-sand-50 dark:bg-brand-sand-950/60 text-brand-sand-700 dark:text-brand-sand-300 hover:bg-brand-sand-100 dark:hover:bg-brand-sand-900/60 font-bold text-xs flex items-center gap-1.5 border border-brand-sand-200 dark:border-brand-sand-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Nhật Ký Kiểm Toán</span>
          </a>
        </div>
      </div>

      {/* Visual KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: 'account_tree',
            label: 'Cơ Sở Thể Thao',
            value: ov?.activeCenterCount ?? 0,
            sub: `${centers.length} tổng cơ sở toàn hệ thống`,
            badge: `${centers.length ? Math.round(((ov?.activeCenterCount || 0) / centers.length) * 100) : 100}% hoạt động`,
            color: '#81B29A',
            bgLight: 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/60 dark:text-brand-sage-400',
            tabId: 'centers'
          },
          {
            icon: 'manage_accounts',
            label: 'Managers Đang Trực',
            value: ov?.activeManagerCount ?? 0,
            sub: `${managers.length} quản lý được bổ nhiệm`,
            badge: `${managers.length ? Math.round(((ov?.activeManagerCount || 0) / managers.length) * 100) : 100}% trực tuyến`,
            color: '#3FAEB8',
            bgLight: 'bg-brand-teal-50 text-brand-teal-700 dark:bg-brand-teal-950/60 dark:text-brand-teal-400',
            tabId: 'managers'
          },
          {
            icon: 'shield',
            label: 'An Ninh & Khóa Tài Khoản',
            value: ov?.lockedAccountCount ?? 0,
            sub: (ov?.lockedAccountCount || 0) > 0 ? 'Cần kiểm tra lý do khóa' : 'Hệ thống an toàn 100%',
            badge: (ov?.lockedAccountCount || 0) > 0 ? 'Cần xử lý' : 'An toàn',
            color: (ov?.lockedAccountCount || 0) > 0 ? '#E25D4C' : '#81B29A',
            bgLight: (ov?.lockedAccountCount || 0) > 0
              ? 'bg-brand-danger-50 text-brand-danger-600 dark:bg-brand-danger-950/60 dark:text-brand-danger-400'
              : 'bg-brand-sage-50 text-brand-sage-700 dark:bg-brand-sage-950/60 dark:text-brand-sage-400',
            tabId: 'accounts'
          },
          {
            icon: 'group',
            label: 'Tài Khoản Toàn Hệ Thống',
            value: ov?.totalAccountCount ?? 0,
            sub: 'Hội viên, HLV, Lễ tân & Quản lý',
            badge: 'Tất cả vai trò',
            color: '#E5A33C',
            bgLight: 'bg-brand-sand-50 text-brand-sand-700 dark:bg-brand-sand-950/60 dark:text-brand-sand-400',
            tabId: 'accounts'
          }
        ].map((card) => (
          <div
            key={card.label}
            onClick={() => switchTab(card.tabId)}
            className="bg-white dark:bg-brand-navy-900 rounded-2xl p-5 shadow-xs border border-brand-navy-200/80 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700 hover:shadow-md transition-all cursor-pointer space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${card.bgLight}`}>
                <span className="material-symbols-outlined text-[26px]">{card.icon}</span>
              </div>
              <span className="material-symbols-outlined text-brand-navy-300 dark:text-brand-navy-600 group-hover:text-brand-navy-600 dark:group-hover:text-brand-navy-300 transition-colors text-[20px]">
                arrow_forward
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-brand-navy-900 dark:text-white leading-none">
                {card.value}
              </div>
              <div className="text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 mt-1">{card.label}</div>
              <div className="text-[11px] text-brand-navy-400 dark:text-brand-navy-500 mt-0.5">{card.sub}</div>
            </div>

            <div className="pt-2 border-t border-brand-navy-100 dark:border-brand-navy-800 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-brand-navy-500 dark:text-brand-navy-400">Trạng thái</span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: card.color + '15', color: card.color }}
              >
                {card.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-side lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Centers preview */}
        <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-5 sm:p-6 shadow-xs border border-brand-navy-200/80 dark:border-brand-navy-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-brand-sage-700 dark:text-brand-sage-400 text-[22px]">apartment</span>
              <div>
                <h4 className="font-extrabold text-sm text-brand-navy-900 dark:text-white">Cơ Sở Thể Thao</h4>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">{centers.length} cơ sở trong hệ thống</p>
              </div>
            </div>
            <MotionButton
              onClick={() => switchTab('centers')}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </MotionButton>
          </div>

          <div className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
            {centers.slice(0, 5).map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-brand-navy-900 dark:text-white truncate flex items-center gap-1.5">
                    <span className="text-brand-navy-400 font-semibold text-xs">#{c.id}</span>
                    <span>{c.name}</span>
                  </div>
                  <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 truncate flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-brand-navy-400">location_on</span>
                    <span>{c.address || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
            {centers.length === 0 && (
              <div className="py-8 text-center text-brand-navy-400 dark:text-brand-navy-500 text-xs">
                Chưa có cơ sở nào được tạo.
              </div>
            )}
          </div>
        </div>

        {/* Managers preview */}
        <div className="bg-white dark:bg-brand-navy-900 rounded-2xl p-5 sm:p-6 shadow-xs border border-brand-navy-200/80 dark:border-brand-navy-800">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-navy-100 dark:border-brand-navy-800">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-brand-teal-700 dark:text-brand-teal-400 text-[22px]">manage_accounts</span>
              <div>
                <h4 className="font-extrabold text-sm text-brand-navy-900 dark:text-white">Đội Ngũ Manager</h4>
                <p className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400">{managers.length} quản lý được phân công</p>
              </div>
            </div>
            <MotionButton
              onClick={() => switchTab('managers')}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              className="text-xs font-bold text-brand-teal-700 dark:text-brand-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </MotionButton>
          </div>

          <div className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
            {managers.slice(0, 5).map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-brand-teal-100 dark:bg-brand-teal-950/80 text-brand-teal-700 dark:text-brand-teal-300 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                    {m.fullName?.slice(0, 2) || 'MN'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-brand-navy-900 dark:text-white truncate">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] text-brand-navy-500 dark:text-brand-navy-400 truncate flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[13px] text-brand-navy-400">domain</span>
                      <span>{m.centerName || 'Chưa gán cơ sở'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={m.status} />
                </div>
              </div>
            ))}
            {managers.length === 0 && (
              <div className="py-8 text-center text-brand-navy-400 dark:text-brand-navy-500 text-xs">
                Chưa có Manager nào được tạo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
