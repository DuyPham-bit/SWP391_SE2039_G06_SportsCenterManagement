import React from 'react';
import { TabSaveFooter } from './TabSaveFooter.jsx';

export function FooterTab({ content, handleDiscardChanges, handleSaveAll, isDirty, isEn, isSaving, updateContentField }) {
  return (
    <div className="bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200/80 dark:border-brand-navy-800 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="border-b border-brand-navy-100 dark:border-brand-navy-800 pb-4">
        <h2 className="text-lg font-black text-brand-navy-900 dark:text-white uppercase tracking-wide">
          {isEn ? 'Section 6: Event Call-To-Action & Footer Information' : 'Khu Vực 6: Banner Kêu Gọi Sự Kiện & Chân Trang Footer'}
        </h2>
        <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
          {isEn
            ? 'Update membership registration banner, hotline, email, Zalo, Facebook, address and business hours.'
            : 'Cập nhật banner kêu gọi đăng ký gói tập, số hotline liên hệ, email, Zalo, Facebook, địa chỉ và thời gian hoạt động.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banner CTA */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-navy-900 via-brand-navy-800 to-brand-sage-700 text-white space-y-3 shadow-lg border border-white/10 hover-lift transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md inline-block text-brand-navy-200">
            {isEn ? 'Membership Call-to-Action' : 'Banner Kêu Gọi Đăng Ký Gói Tập (Card Đỏ)'}
          </span>
          <div>
            <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
              {isEn ? 'Banner Title:' : 'Tiêu đề Banner:'}
            </label>
            <input
              type="text"
              value={content.ctaAndFooter.ctaTitle}
              onChange={(e) => updateContentField('ctaAndFooter', 'ctaTitle', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-sm font-black uppercase focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
              {isEn ? 'Banner Description:' : 'Mô tả kêu gọi:'}
            </label>
            <textarea
              rows={3}
              value={content.ctaAndFooter.ctaDescription}
              onChange={(e) => updateContentField('ctaAndFooter', 'ctaDescription', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/15 border border-white/30 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
                {isEn ? 'Primary Button:' : 'Nút hành động 1:'}
              </label>
              <input
                type="text"
                value={content.ctaAndFooter.ctaPrimaryText}
                onChange={(e) => updateContentField('ctaAndFooter', 'ctaPrimaryText', e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-white text-brand-sage-700 font-bold text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase opacity-80 mb-1">
                {isEn ? 'Secondary Button:' : 'Nút hành động 2:'}
              </label>
              <input
                type="text"
                value={content.ctaAndFooter.ctaSecondaryText}
                onChange={(e) => updateContentField('ctaAndFooter', 'ctaSecondaryText', e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-white/20 border border-white/40 text-white font-bold text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contacts & Hours */}
        <div className="space-y-4">
          <span className="block text-xs font-bold text-brand-navy-800 dark:text-brand-navy-200 uppercase">
            {isEn ? 'Contact Info & Business Hours (Footer):' : 'Thông Tin Liên Hệ & Giờ Mở Cửa (Footer):'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Support Hotline:' : 'Hotline CSKH:'}
              </label>
              <input
                type="text"
                value={content.ctaAndFooter.contactPhone}
                onChange={(e) => updateContentField('ctaAndFooter', 'contactPhone', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Contact Email:' : 'Email liên hệ:'}
              </label>
              <input
                type="email"
                value={content.ctaAndFooter.contactEmail}
                onChange={(e) => updateContentField('ctaAndFooter', 'contactEmail', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="footer-zalo-phone" className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                  {isEn ? 'Zalo Phone Number:' : 'Số điện thoại Zalo:'}
                </label>
                <input
                  id="footer-zalo-phone"
                  type="tel"
                  autoComplete="tel"
                  value={content.ctaAndFooter.contactZaloPhone}
                  onChange={(e) => updateContentField('ctaAndFooter', 'contactZaloPhone', e.target.value)}
                  placeholder="0901 234 567"
                  aria-describedby="footer-social-links-help"
                  className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="footer-facebook-url" className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                  {isEn ? 'Facebook Link:' : 'Liên kết Facebook:'}
                </label>
                <input
                  id="footer-facebook-url"
                  type="url"
                  value={content.ctaAndFooter.contactFacebookUrl}
                  onChange={(e) => updateContentField('ctaAndFooter', 'contactFacebookUrl', e.target.value)}
                  placeholder="https://www.facebook.com/..."
                  aria-describedby="footer-social-links-help"
                  className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
                />
              </div>
            </div>
            <p id="footer-social-links-help" className="mt-1.5 text-[11px] text-brand-navy-500 dark:text-brand-navy-400">
              {isEn
                ? 'Zalo: 10-digit number or +84 prefix. Facebook: valid HTTP/HTTPS URL. Leave blank to hide.'
                : 'Zalo: nhập số điện thoại 10 chữ số hoặc đầu số +84. Facebook: nhập đường dẫn HTTP/HTTPS. Để trống để ẩn liên hệ tương ứng trên trang chủ.'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Center Address:' : 'Địa chỉ trung tâm:'}
            </label>
            <input
              type="text"
              value={content.ctaAndFooter.contactAddress}
              onChange={(e) => updateContentField('ctaAndFooter', 'contactAddress', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Mon - Fri:' : 'Thứ 2 - Thứ 6:'}
              </label>
              <input
                type="text"
                value={content.ctaAndFooter.hoursWeekdays}
                onChange={(e) => updateContentField('ctaAndFooter', 'hoursWeekdays', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Sat - Sun:' : 'Thứ 7 - CN:'}
              </label>
              <input
                type="text"
                value={content.ctaAndFooter.hoursWeekend}
                onChange={(e) => updateContentField('ctaAndFooter', 'hoursWeekend', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
                {isEn ? 'Holidays:' : 'Ngày Lễ:'}
              </label>
              <input
                type="text"
                value={content.ctaAndFooter.hoursHolidays}
                onChange={(e) => updateContentField('ctaAndFooter', 'hoursHolidays', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-brand-navy-700 dark:text-brand-navy-300 uppercase mb-1">
              {isEn ? 'Copyright Notice:' : 'Bản quyền (Copyright):'}
            </label>
            <input
              type="text"
              value={content.ctaAndFooter.copyright}
              onChange={(e) => updateContentField('ctaAndFooter', 'copyright', e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-600 dark:text-brand-navy-400 text-xs focus:ring-2 focus:ring-brand-sage-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <TabSaveFooter handleDiscardChanges={handleDiscardChanges} handleSaveAll={handleSaveAll} isDirty={isDirty} isEn={isEn} isSaving={isSaving} />
    </div>
  );
}
