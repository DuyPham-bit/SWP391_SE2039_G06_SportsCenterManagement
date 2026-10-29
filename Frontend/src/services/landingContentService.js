 /**
 * SCMS Dynamic Content Management Service
 * Dịch vụ Quản lý Nội dung Động Trang Chủ (Landing Page)
 * Cho phép Manager chủ động thay đổi nội dung, thẻ môn học, thẻ cụm sân bãi và đa phương tiện.
 */

import { apiRequest } from './http.js';
import { fixMojibake } from './encodingHelper.js';

const LEGACY_STORAGE_KEY = 'SCMS_DYNAMIC_LANDING_CONTENT_V1';
const PREVIEW_STORAGE_KEY = 'SCMS_LANDING_PREVIEW_V1';
const UPDATE_STORAGE_KEY = 'SCMS_LANDING_CONTENT_UPDATED';
export const LANDING_CONTENT_CHANGE_EVENT = 'SCMS_LANDING_CONTENT_CHANGED';

// Empty editor structure; business records come from the public catalog API.
export const DEFAULT_LANDING_CONTENT = {
  "heroBanner": {
    "badge": "TRUNG TÂM THỂ THAO",
    "title": "",
    "description": "",
    "videoUrl": "",
    "posterUrl": "",
    "primaryCtaText": "ĐĂNG KÝ HỘI VIÊN",
    "primaryCtaLink": "#/register",
    "secondaryCtaText": "KHÁM PHÁ BỘ MÔN",
    "secondaryCtaLink": "#khoa-hoc",
    "metrics": []
  },
  "whyUs": {
    "badge": "VỀ TRUNG TÂM",
    "title": "Thông tin trung tâm",
    "description": "",
    "features": [],
    "stats": [],
    "trustBanner": {
      "title": "",
      "description": "",
      "certificate": ""
    }
  },
  "coursesSection": {
    "badge": "BỘ MÔN",
    "title": "Bộ môn thể thao",
    "description": "",
    "trustBadges": [],
    "sportsList": []
  },
  "facilitiesSection": {
    "badge": "PHÒNG VÀ SÂN TẬP",
    "title": "Cơ sở vật chất",
    "description": "",
    "metrics": [],
    "facilitiesList": []
  },
  "zonesLayout": {
    "badge": "KHÔNG GIAN TẬP LUYỆN",
    "title": "Khu vực tập luyện",
    "description": "",
    "zones": [],
    "serviceAmenities": []
  },
  "ctaAndFooter": {
    "ctaBadge": "LIÊN HỆ TRUNG TÂM",
    "ctaTitle": "Liên hệ tư vấn",
    "ctaDescription": "",
    "ctaPrimaryText": "Xem các gói tập",
    "ctaPrimaryLink": "#/member/packages",
    "ctaSecondaryText": "Xem cơ sở vật chất",
    "ctaSecondaryLink": "#co-so-vat-chat",
    "brandName": "",
    "brandTag": "",
    "brandSubtitle": "",
    "brandDescription": "",
    "contactAddress": "",
    "contactPhone": "",
    "contactEmail": "",
    "contactZaloPhone": "",
    "contactFacebookUrl": "",
    "hoursWeekdays": "",
    "hoursWeekend": "",
    "hoursHolidays": "",
    "hoursNote": "",
    "copyright": ""
  },
  "authShowcase": {
    "badge": "Sân tập mở cửa 24/7",
    "tagline": "Khởi đầu bứt phá",
    "loginTitle": "Tập luyện hôm nay, bứt phá mỗi ngày.",
    "registerTitle": "Hành trình mới, phiên bản khỏe hơn.",
    "description": "Hệ sinh thái thể thao đa năng với 9 cụm sân thi đấu chuẩn Olympic. Đặt ca học siêu tốc, cá nhân hóa lịch tập và theo dõi chỉ số InBody cùng huấn luyện viên hàng đầu.",
    "posterUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=75&w=800&auto=format&fit=crop",
    "feature1Title": "Đặt chỗ trong 30s",
    "feature1Desc": "Đăng ký ca học theo gói",
    "feature1Icon": "bolt",
    "feature2Title": "Chuẩn Olympic 5★",
    "feature2Desc": "Hệ thống sân bãi cao cấp",
    "feature2Icon": "verified",
    "stat1Value": "09",
    "stat1Label": "Bộ môn thi đấu",
    "stat2Value": "09",
    "stat2Label": "Khu tập luyện",
    "stat3Value": "2.5K+",
    "stat3Label": "Hội viên active"
  }
};

// Published content is cached only in memory. SQL/API remains the source of truth.
let publishedContent = null;
const clone = value => JSON.parse(JSON.stringify(value));

function mergeContent(defaults, value) {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(value)) return clone(defaults);
    return value.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return clone(item);
      const template = defaults[index] || defaults[0] || {};
      const merged = mergeContent(template, item);
      if (!Object.hasOwn(item, 'id')) delete merged.id;
      return merged;
    });
  }
  if (defaults && typeof defaults === 'object') {
    const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const result = {};
    for (const key of new Set([...Object.keys(defaults), ...Object.keys(input)])) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      result[key] = key in defaults ? mergeContent(defaults[key], input[key]) : clone(input[key]);
    }
    return result;
  }
  return value === undefined || value === null ? clone(defaults) : clone(value);
}

export function getDefaultLandingContent() {
  return clone(DEFAULT_LANDING_CONTENT);
}

export function getLandingContent() {
  return fixMojibake(clone(publishedContent || DEFAULT_LANDING_CONTENT));
}

export function getLegacyLandingContent() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? fixMojibake(mergeContent(DEFAULT_LANDING_CONTENT, JSON.parse(raw))) : null;
  } catch { return null; }
}

export async function loadLandingContent({ signal } = {}) {
  const response = await apiRequest('landing-content', { signal, token: null });
  publishedContent = fixMojibake(mergeContent(DEFAULT_LANDING_CONTENT, response?.content));
  return { content: getLandingContent(), hasPublishedContent: response?.content != null };
}

function notifyPublishedContent() {
  window.dispatchEvent(new CustomEvent(LANDING_CONTENT_CHANGE_EVENT, { detail: getLandingContent() }));
  // This is only a refresh signal for other tabs; a storage failure cannot undo a successful API save.
  try { localStorage.setItem(UPDATE_STORAGE_KEY, `${Date.now()}-${Math.random()}`); } catch { /* optional */ }
}

export function getExternalContactUrl(value) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!/^https?:\/\//i.test(url) || /[\u0000-\u001f\u007f\\]/.test(url)) return '';
  try {
    return new URL(url).hostname ? url : '';
  } catch { return ''; }
}

export function normalizeZaloPhone(value) {
  if (typeof value !== 'string') return '';
  const phone = value.replace(/[\s().-]/g, '');
  return /^(0\d{9}|\+84\d{9})$/.test(phone) ? phone.replace(/^\+84/, '0') : '';
}

export async function saveLandingContent(content) {
  const cleaned = fixMojibake(content);
  const footer = { ...cleaned.ctaAndFooter };
  const zaloValue = footer.contactZaloPhone ?? '';
  const zaloPhone = normalizeZaloPhone(zaloValue);
  if (typeof zaloValue !== 'string' || (zaloValue.trim() && !zaloPhone)) {
    throw new Error('Số điện thoại Zalo phải gồm 10 chữ số, bắt đầu bằng 0 hoặc dùng đầu số +84. Để trống để ẩn Zalo.');
  }
  footer.contactZaloPhone = zaloPhone;
  const facebookValue = footer.contactFacebookUrl ?? '';
  const facebookUrl = getExternalContactUrl(facebookValue);
  if (typeof facebookValue !== 'string' || (facebookValue.trim() && !facebookUrl)) {
    throw new Error('Liên kết Facebook phải là đường dẫn HTTP/HTTPS hợp lệ hoặc để trống.');
  }
  footer.contactFacebookUrl = facebookUrl;
  const response = await apiRequest('landing-content', { method: 'PUT', body: { content: { ...cleaned, ctaAndFooter: footer } } });
  publishedContent = fixMojibake(mergeContent(DEFAULT_LANDING_CONTENT, response.content));
  notifyPublishedContent();
  return getLandingContent();
}

export function getLandingPreviewContent() {
  const query = (window.location.hash || '').split('?')[1] || '';
  if (new URLSearchParams(query).get('preview') !== '1') return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    return raw ? fixMojibake(mergeContent(DEFAULT_LANDING_CONTENT, JSON.parse(raw))) : null;
  } catch { return null; }
}

export function openLandingPreview(content) {
  const previewWindow = window.open('about:blank', '_blank');
  if (!previewWindow) throw new Error('Trình duyệt đã chặn tab xem trước. Vui lòng cho phép mở tab mới.');
  try {
    previewWindow.opener = null;
    previewWindow.sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(content));
    previewWindow.location.replace(new URL('#/?preview=1', window.location.href).href);
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}

export function subscribeLandingContentRefresh(refresh) {
  const onStorage = event => { if (event.key === UPDATE_STORAGE_KEY) refresh(); };
  window.addEventListener('storage', onStorage);
  window.addEventListener('focus', refresh);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('focus', refresh);
  };
}
