import React, { useState, useEffect, useCallback } from 'react';
import {
  CLOUD_SPORT_ASSETS,
  uploadMediaFileToCloud,
  fetchDriveFiles,
  fetchGoogleDriveStatus
} from '../../services/cloudMediaStorage.js';

const BROKEN_IMG_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='90' viewBox='0 0 120 90' fill='%23f1f5f9'%3E%3Crect width='120' height='90' fill='%23f8fafc'/%3E%3Cpath d='M40 40a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-20 30h80L75 42l-20 25-15-18-20 21z' fill='%23cbd5e1'/%3E%3C/svg%3E";

/**
 * CloudMediaPickerModal: Modal Quản lý và chọn tệp Đa phương tiện Đám mây & Google Drive API
 * Tự động đồng bộ với Google Drive của quản trị viên và lưu cơ sở dữ liệu.
 */
export function CloudMediaPickerModal({
  isOpen,
  onClose,
  onSelectImage,
  currentImage = '',
  title = 'Chọn / Tải Lên Hình Ảnh Đám Mây'
}) {
  const [activeTab, setActiveTab] = useState('drive-gallery'); // 'drive-gallery' | 'upload' | 'cloud-gallery' | 'url'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewUrl, setPreviewUrl] = useState(currentImage || '');
  const [customUrl, setCustomUrl] = useState(currentImage || '');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [fileMeta, setFileMeta] = useState(null);

  // Google Drive state
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState('');
  const [driveStatus, setDriveStatus] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const loadDriveData = useCallback(async () => {
    setDriveLoading(true);
    setDriveError('');
    try {
      const [status, files] = await Promise.all([
        fetchGoogleDriveStatus(),
        fetchDriveFiles()
      ]);
      setDriveStatus(status);
      setDriveFiles(files || []);
      if (status && !status.isConnected) {
        setDriveError(status.message);
      }
    } catch (err) {
      setDriveError(err.message || 'Không thể kết nối đến Google Drive');
    } finally {
      setDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentImage || '');
      setCustomUrl(currentImage || '');
      setUploadError('');
      setUploadSuccess('');
      loadDriveData();
    }
  }, [isOpen, currentImage, loadDriveData]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Tất cả môn' },
    { id: 'aquatics', label: 'Bơi lội' },
    { id: 'fitness-wellness', label: 'Gym & Yoga' },
    { id: 'team-sports', label: 'Bóng & Vợt' },
    { id: 'combat', label: 'Võ thuật & Boxing' }
  ];

  const filteredCuratedAssets = selectedCategory === 'all'
    ? CLOUD_SPORT_ASSETS
    : CLOUD_SPORT_ASSETS.filter(a => a.category === selectedCategory);

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleFileChange = async (e) => {
    const inputEl = e.target;
    const file = inputEl?.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const result = await uploadMediaFileToCloud(file);
      setPreviewUrl(result.url);
      setFileMeta(result);
      setUploadSuccess(`Đã tải ảnh lên thành công: ${result.name}`);
      // Làm mới lại danh sách để ảnh mới xuất hiện ngay lập tức
      loadDriveData();
    } catch (err) {
      setUploadError(err.message || 'Lỗi khi tải ảnh lên máy chủ');
    } finally {
      setUploadLoading(false);
      if (inputEl) {
        inputEl.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) {
      setUploadError('Vui lòng nhập đường dẫn hình ảnh');
      return;
    }
    setPreviewUrl(customUrl.trim());
    setFileMeta({ name: 'External CDN Image', dimensions: 'Direct URL' });
    setUploadError('');
  };

  const handleConfirm = () => {
    if (!previewUrl) {
      setUploadError('Vui lòng chọn hoặc tải lên một hình ảnh');
      return;
    }
    onSelectImage(previewUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col font-inter">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
              <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
            </span>
            <div>
              <span className="font-chivo text-[10px] font-black uppercase tracking-widest text-red-400 block">
                GOOGLE DRIVE CLOUD OBJECT STORAGE &amp; CMS
              </span>
              <h3 className="font-chivo text-lg font-black uppercase text-white leading-tight mt-0.5">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Status Alert Bar */}
        {driveStatus && !driveStatus.isConnected && (
          <div className="bg-amber-50 border-b border-amber-200 p-3.5 px-6 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">warning</span>
              <div>
                <p className="font-bold text-amber-950">
                  Google Drive API chưa được kích hoạt hoặc chưa phân quyền thư mục
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Vui lòng bấm <b>Bật Google Drive API</b> trên Google Cloud Console và chia sẻ thư mục Drive cho email Service Account.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <a
                href="https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=27992237181"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-colors"
              >
                <span>Bật Google Drive API</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
              <button
                type="button"
                onClick={() => handleCopyEmail(driveStatus.serviceAccountEmail)}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                title="Sao chép email Service Account"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                <span>{copiedEmail ? 'Đã sao chép!' : 'Copy Email Bot'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex items-center bg-slate-100 border-b border-slate-200 px-6 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('drive-gallery')}
            className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'drive-gallery'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-blue-600">photo_library</span>
            <span>Kho Ảnh Đã Tải Lên</span>
            {driveFiles.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                {driveFiles.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'upload'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span>Tải Lên Từ Máy Tính</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud-gallery')}
            className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'cloud-gallery'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">photo_library</span>
            <span>Kho Mẫu Tuyển Chọn (Olympic CDN)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-3 px-4 font-chivo text-xs font-bold uppercase border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'url'
                ? 'border-red-600 text-red-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">link</span>
            <span>Nhập URL Đám Mây</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {uploadError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0 mt-0.5">error</span>
              <div className="flex-1 min-w-0">
                <span className="font-bold">Lỗi: </span>
                <span>{uploadError}</span>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* TAB 1: KHO ẢNH GOOGLE DRIVE CỦA TÔI */}
          {activeTab === 'drive-gallery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    {driveStatus?.folderId?.includes('uploads') ? 'Ảnh Lưu Trữ Máy Chủ Cục Bộ' : 'Kho Ảnh Hệ Thống'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {driveStatus?.folderId ? 'Ảnh dùng chung từ Google Drive' : 'Thư viện ảnh đã lưu trên máy chủ'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={loadDriveData}
                  disabled={driveLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Làm mới danh sách ảnh"
                >
                  <span className={`material-symbols-outlined text-[16px] ${driveLoading ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                  <span>{driveLoading ? 'Đang tải...' : 'Làm mới'}</span>
                </button>
              </div>

              {driveLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <span className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-600">Đang tải danh sách ảnh từ máy chủ...</p>
                </div>
              )}

              {!driveLoading && driveFiles.length === 0 && (
                <div className="py-10 px-4 rounded-2xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center bg-slate-50">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                    <span className="material-symbols-outlined text-[28px]">photo_library</span>
                  </div>
                  <h4 className="font-chivo text-sm font-bold text-slate-800 uppercase">
                    Chưa có ảnh nào trong kho lưu trữ
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                    Bạn có thể chọn tab <b>"TẢI LÊN TỪ MÁY TÍNH"</b> để tải ảnh lên máy chủ ngay lập tức, hoặc chọn nhanh từ Kho Mẫu Tuyển Chọn.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      <span>Tải ảnh lên ngay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cloud-gallery')}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      Chọn từ Kho Mẫu
                    </button>
                  </div>
                </div>
              )}

              {!driveLoading && driveFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto p-1">
                  {driveFiles.map((item) => {
                    const isSelected = previewUrl === item.url;
                    const displayThumb = item.thumbnailUrl || item.url;
                    const isLocal = item.url?.startsWith('/uploads');
                    return (
                      <div
                        key={item.fileId || item.id}
                        onClick={() => {
                          setPreviewUrl(item.url);
                          setFileMeta({
                            name: item.fileName,
                            size: item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : '',
                            dimensions: isLocal ? 'Local Server Media' : 'Google Drive Cloud'
                          });
                        }}
                        className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-red-600 ring-2 ring-red-600/40 shadow-lg scale-95'
                            : 'border-slate-200 hover:border-slate-400 bg-white'
                        }`}
                      >
                        <div className="aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                          <img
                            src={displayThumb}
                            alt={item.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.src === BROKEN_IMG_FALLBACK) return;
                              if (item.url && img.src !== item.url && !img.dataset.retried) {
                                img.dataset.retried = 'true';
                                img.src = item.url;
                              } else {
                                img.src = BROKEN_IMG_FALLBACK;
                              }
                            }}
                          />
                        </div>
                        <div className="p-2 bg-white">
                          <span className="text-[10px] font-bold text-blue-600 block uppercase truncate flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">cloud_done</span>
                            {isLocal ? 'Máy chủ Cục bộ' : 'Google Drive'}
                          </span>
                          <p className="text-[11px] font-medium text-slate-700 truncate mt-0.5" title={item.fileName}>
                            {item.fileName}
                          </p>
                          {item.fileSize && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {Math.round(item.fileSize / 1024)} KB
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TẢI LÊN TỪ MÁY */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-red-50/20 transition-all">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif,.avif"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadLoading}
                />
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">add_photo_alternate</span>
                </div>
                <span className="font-chivo text-sm font-bold text-slate-900 uppercase">
                  Nhấp để chọn ảnh từ máy
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Định dạng PNG, JPG, JPEG, WEBP, GIF, AVIF (Tối đa 15MB)
                </span>
                <span className="mt-3 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">cloud_done</span>
                  <span>Ảnh được lưu vào thư viện chung</span>
                </span>
              </label>

              {uploadLoading && (
                <div className="text-center py-4 text-xs font-semibold text-slate-600 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải ảnh lên thư viện...</span>
                </div>
              )}

              {/* Thông tin hướng dẫn cấu hình Service Account nếu cần */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">info</span>
                  <span>Lưu trữ hình ảnh:</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Ảnh được lưu vào thư viện dùng chung. Khi Google Drive tạm thời không khả dụng, hệ thống lưu ảnh trên máy chủ để bạn có thể tiếp tục sử dụng.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: KHO ẢNH MẪU TUYỂN CHỌN */}
          {activeTab === 'cloud-gallery' && (
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[340px] overflow-y-auto p-1">
                {filteredCuratedAssets.map(asset => {
                  const isSelected = previewUrl === asset.url;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => {
                        setPreviewUrl(asset.url);
                        setFileMeta({ name: asset.title, dimensions: 'Curated High-Res CDN' });
                      }}
                      className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-red-600 ring-2 ring-red-600/40 shadow-lg scale-95'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div className="aspect-video bg-slate-100 overflow-hidden">
                        <img
                          src={asset.thumb}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2 bg-white">
                        <span className="text-[10px] font-bold text-red-600 block uppercase">{asset.categoryName}</span>
                        <p className="text-[11px] font-medium text-slate-700 truncate">{asset.title}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: NHẬP URL ĐÁM MÂY */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Đường dẫn Cloud Storage URL / Object CDN:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://lh3.googleusercontent.com/d/... hoặc S3 / Cloudinary"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Xem trước
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Hỗ trợ link trực tiếp từ Google Drive, Cloudinary, AWS S3, Firebase Storage, ImgBB, Unsplash hoặc server tĩnh.
                </p>
              </div>
            </div>
          )}

          {/* Preview Box */}
          {previewUrl && (
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Xem trước ảnh"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src === BROKEN_IMG_FALLBACK) return;
                    img.src = BROKEN_IMG_FALLBACK;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase">Hình ảnh đang chọn:</span>
                </div>
                <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">{fileMeta?.name || previewUrl}</p>
                {fileMeta?.dimensions && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {fileMeta.dimensions}
                  </span>
                )}
                {fileMeta?.size && (
                  <span className="inline-block ml-2 mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                    {fileMeta.size}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-chivo text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!previewUrl}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-chivo text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">done</span>
            <span>Áp Dụng Hình Ảnh Này</span>
          </button>
        </div>
      </div>
    </div>
  );
}
