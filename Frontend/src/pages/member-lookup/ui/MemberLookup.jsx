import React, { useState, useEffect } from 'react';
import { receptionApi, formatMemberDate } from '../../../entities/member/index.js';
import { Badge } from '../../../shared/ui/StatCard.jsx';
import { Modal } from '../../../shared/ui/Modal.jsx';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { CounterError } from '../../../features/counter-desk/index.js';
import { useLanguage } from '../../../shared/i18n/LanguageContext.jsx';
import { processAvatarFile, setStoredAvatar } from '../../../shared/lib/avatarHelper.js';

export function MemberLookup() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError } = useToast();
  const memberAvatarInputRef = React.useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subsError, setSubsError] = useState('');
  const [subsVersion, setSubsVersion] = useState(0);

  // Modal Register Member At Counter
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSaving, setRegSaving] = useState(false);
  const [regError, setRegError] = useState('');

  // Auto-search if query parameter exists in URL
  useEffect(() => {
    const hash = window.location.hash || '';
    const match = hash.match(/[?&]query=([^&]+)/);
    if (match && match[1]) {
      const q = decodeURIComponent(match[1]);
      setQuery(q);
      executeSearch(q);
    }
  }, []);

  const executeSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchError(isEn ? 'Please enter at least 2 characters to search.' : 'Nhập ít nhất 2 ký tự để tìm hội viên.');
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const data = await receptionApi.lookupMember(searchTerm.trim());
      setResults(data);
      setHasSearched(true);
      if (data.length === 1) {
        setSelectedMember(data[0]);
      } else {
        setSelectedMember(null);
      }
    } catch (error) {
      setResults([]);
      setSelectedMember(null);
      setHasSearched(true);
      setSearchError(error.message || (isEn ? 'Failed to look up member.' : 'Không thể tra cứu hội viên.'));
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    executeSearch(query);
  };

  // Load subscriptions whenever selectedMember changes
  useEffect(() => {
    if (!selectedMember?.id) {
      setSubscriptions([]);
      return;
    }

    let isMounted = true;
    setLoadingSubs(true);
    setSubscriptions([]);
    setSubsError('');
    receptionApi.getMemberSubscriptions(selectedMember.id)
      .then(data => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : (data?.items || []);
          setSubscriptions(list);
        }
      })
      .catch(error => {
        if (isMounted) setSubsError(error.message || (isEn ? 'Failed to load package history.' : 'Không thể tải lịch sử gói tập.'));
      })
      .finally(() => {
        if (isMounted) setLoadingSubs(false);
      });

    return () => { isMounted = false; };
  }, [selectedMember?.id, subsVersion]);

  const handleRegisterMember = async (e) => {
    e.preventDefault();
    if (!regFullName.trim() || !regPhone.trim() || !regEmail.trim()) {
      setRegError(isEn ? 'Please provide Full Name, Phone number and Email!' : 'Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Email!');
      return;
    }
    if (!regPassword.trim()) {
      setRegError(isEn ? 'Please enter an initial password.' : 'Vui lòng nhập mật khẩu khởi tạo.');
      return;
    }
    setRegSaving(true);
    setRegError('');
    try {
      const newMember = await receptionApi.createMember({
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        username: regUsername.trim() || undefined,
        password: regPassword,
        dateOfBirth: regDob || undefined
      });
      showSuccess(isEn ? `Member created successfully! Code: ${newMember.memberCode}` : `Đăng ký hội viên thành công! Mã: ${newMember.memberCode}`);
      setRegisterModalOpen(false);
      setRegFullName('');
      setRegPhone('');
      setRegEmail('');
      setRegUsername('');
      setRegDob('');
      setRegPassword('');
      setSelectedMember(newMember);
      setResults([newMember]);
      setHasSearched(true);
      setQuery(newMember.memberCode || newMember.phone || '');
    } catch (err) {
      setRegError(err.message || (isEn ? 'Error creating member profile.' : 'Lỗi khi đăng ký hội viên.'));
      showError(err.message || (isEn ? 'Member registration failed' : 'Lỗi đăng ký hội viên'));
    } finally {
      setRegSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Top Banner Header */}
      <div className="scms-hero relative rounded-3xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 dark:from-brand-sage-900 dark:via-brand-teal-900 dark:via-brand-teal-800 dark:to-brand-sand-900 text-white p-6 sm:p-7 border border-white/30 dark:border-white/10 shadow-xl shadow-brand-teal-600/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        {/* Dynamic ambient glow & sports wave overlays matching logo palette */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-gradient-to-br from-brand-sand-300/45 via-brand-sand-500/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-brand-sage-500/40 via-brand-sage-700/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-96 h-40 bg-brand-teal-300/30 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle decorative Olympic curved motion lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
          <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-brand-navy-900/90 backdrop-blur-md text-brand-sage-900 dark:text-brand-sage-300 border border-white/80 dark:border-white/20 text-xs font-black uppercase tracking-wider shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-sage-500 animate-pulse" />
            <span>{isEn ? 'COUNTER MEMBER DIRECTORY' : 'HỒ SƠ HỘI VIÊN & THẺ THỂ THAO'}</span>
          </div>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-2 text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
            {isEn ? 'Counter Member Profile Lookup' : 'Tra Cứu Hồ Sơ Hội Viên Tại Quầy'}
          </h1>
          <p className="text-xs sm:text-sm text-white/95 mt-1 max-w-xl font-medium leading-relaxed drop-shadow-xs">
            {isEn
              ? 'Quickly search member card ID, phone, or email to verify membership status, subscriptions, and entry eligibility.'
              : 'Nhập mã thẻ hội viên, số điện thoại hoặc email để kiểm tra tình trạng thẻ và gói tập đã gia hạn.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRegError('');
            setRegisterModalOpen(true);
          }}
          className="scms-shine px-5 py-3 bg-brand-navy-950 hover:bg-brand-navy-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer relative z-10"
        >
          <span className="material-symbols-outlined text-[18px] text-brand-sand-300">person_add</span>
          <span>{isEn ? 'Register New Member' : 'Đăng Ký Hội Viên Mới'}</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={handleSearch}
        className="max-w-2xl bg-white dark:bg-brand-navy-900 p-2.5 rounded-2xl shadow-sm border border-brand-navy-200 dark:border-brand-navy-800 flex items-center gap-2 transition-all hover-lift"
      >
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-brand-navy-400">
            search
          </span>
          <input
            type="text"
            placeholder={
              isEn
                ? 'Search card ID (MEM-8899), phone (0912...), email, or name...'
                : 'Nhập mã thẻ (MEM-8899), Số điện thoại (0912...), Email hoặc Họ tên...'
            }
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-sage-500/40 text-brand-navy-900 dark:text-white bg-transparent font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50"
        >
          {searching ? (isEn ? 'Searching...' : 'Đang tra cứu...') : (isEn ? 'Search' : 'Tra Cứu')}
        </button>
      </form>

      {searchError && <p role="alert" className="text-sm text-brand-danger-600 dark:text-brand-danger-400">{searchError}</p>}

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 max-w-xl mx-auto shadow-sm">
              <span className="material-symbols-outlined text-5xl text-brand-navy-300 dark:text-brand-navy-600">person_off</span>
              <h3 className="font-chivo text-base font-bold text-brand-navy-900 dark:text-white mt-2">
                {isEn ? 'No Member Found' : 'Không Tìm Thấy Hội Viên'}
              </h3>
              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-1">
                {isEn
                  ? `No matching records found for "${query}". Please check the phone number or card ID.`
                  : `Không có dữ liệu trùng khớp với từ khóa "${query}". Vui lòng kiểm tra lại số điện thoại hoặc mã thẻ.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setRegError('');
                  setRegFullName('');
                  setRegPhone(/^\d+$/.test(query) ? query : '');
                  setRegEmail(query.includes('@') ? query : '');
                  setRegisterModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>{isEn ? 'Register Member With This Info' : 'Đăng Ký Hội Viên Mới Với Thông Tin Này'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Member list column if multiple */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-brand-navy-500 dark:text-brand-navy-400 uppercase tracking-wider block">
                  {isEn ? `Search Results (${results.length})` : `Kết quả tìm kiếm (${results.length})`}
                </span>
                {results.map(member => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover-lift ${
                      selectedMember?.id === member.id
                        ? 'bg-brand-sage-500/10 border-brand-sage-500 ring-2 ring-brand-sage-500/20 shadow-sm'
                        : 'bg-white dark:bg-brand-navy-900 border-brand-navy-200 dark:border-brand-navy-800 hover:border-brand-navy-300 dark:hover:border-brand-navy-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-brand-navy-200 dark:border-brand-navy-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-brand-navy-900 dark:text-white truncate">{member.fullName}</div>
                        <div className="text-[11px] text-brand-sage-700 dark:text-brand-sage-500 font-semibold font-mono">{member.memberCode}</div>
                        <div className="text-[10px] text-brand-navy-400">{member.phone}</div>
                      </div>
                      <Badge variant={member.packageStatus} size="sm">{member.packageStatus}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Profile Card (2 cols) */}
              {selectedMember && (
                <div className="lg:col-span-2 bg-white dark:bg-brand-navy-900 rounded-2xl border border-brand-navy-200 dark:border-brand-navy-800 p-6 shadow-sm space-y-6 hover-lift transition-all">
                  <div className="flex items-start justify-between pb-6 border-b border-brand-navy-100 dark:border-brand-navy-800">
                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <img
                          src={selectedMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                          alt={selectedMember.fullName}
                          onClick={() => memberAvatarInputRef.current?.click()}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-sage-500 shadow cursor-pointer transition-transform group-hover:scale-105"
                          title={isEn ? "Click to change photo from phone or computer" : "Nhấp để đổi ảnh thẻ hội viên từ máy tính/điện thoại"}
                        />
                        <button
                          type="button"
                          onClick={() => memberAvatarInputRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-navy-900 text-brand-sand-300 hover:text-white border-2 border-white dark:border-brand-navy-800 flex items-center justify-center shadow transition-transform hover:scale-110 cursor-pointer"
                          title={isEn ? "Upload photo" : "Tải ảnh thẻ"}
                        >
                          <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                        </button>
                        <input
                          ref={memberAvatarInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !selectedMember) return;
                            try {
                              const result = await processAvatarFile(file, 360, 0.88);
                              const key = selectedMember.userId || selectedMember.id;
                              setStoredAvatar(key, result.dataUrl);
                              setSelectedMember(prev => ({ ...prev, avatar: result.dataUrl }));
                              setResults(prev => prev.map(m => (m.id === selectedMember.id ? { ...m, avatar: result.dataUrl } : m)));
                              showSuccess(isEn ? 'Member photo updated successfully!' : 'Đã cập nhật ảnh thẻ hội viên thành công!');
                            } catch (err) {
                              showError(err.message || (isEn ? 'Failed to process image!' : 'Không thể xử lý hình ảnh!'));
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-chivo text-xl font-black text-brand-navy-900 dark:text-white">{selectedMember.fullName}</h2>
                          <Badge variant={selectedMember.status}>{selectedMember.status}</Badge>
                        </div>
                        <div className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-0.5">{selectedMember.email} • {selectedMember.phone}</div>
                        <div className="text-xs font-bold text-brand-sage-700 dark:text-brand-sage-500 mt-1 font-mono">
                          {isEn ? 'SCMS Card ID' : 'Mã Thẻ SCMS'}: {selectedMember.memberCode}
                        </div>
                      </div>
                    </div>

                    <Badge variant={selectedMember.packageStatus} size="md">
                      {selectedMember.packageStatus === 'ACTIVE'
                        ? (isEn ? 'ACTIVE / RENEWED' : 'ĐÃ GIA HẠN / ACTIVE')
                        : selectedMember.packageStatus}
                    </Badge>
                  </div>

                  {/* Membership Card Information */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-sage-700 via-brand-teal-600 via-brand-teal-500 to-brand-sand-500 text-white shadow-xl shadow-brand-teal-600/20 space-y-4 border border-white/30 relative overflow-hidden">
                    <div className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full bg-brand-sand-300/30 blur-2xl" />
                    <div className="flex items-center justify-between relative z-10">
                      <span className="font-chivo text-xs uppercase tracking-widest text-brand-sand-200 font-black flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-brand-sand-300">workspace_premium</span>
                        {isEn ? 'SCMS OLYMPIC MEMBERSHIP CARD' : 'THẺ TẬP HỘI VIÊN SCMS OLYMPIC'}
                      </span>
                      <span className="material-symbols-outlined text-white/90 text-[26px]">sports_kabaddi</span>
                    </div>

                    <div className="relative z-10">
                      <div className="text-[11px] uppercase tracking-wider text-white/80 font-bold">
                        {isEn ? 'Current Enrolled Package' : 'Gói Đang Sở Hữu'}
                      </div>
                      <div className="font-chivo text-xl font-black text-white mt-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
                        {selectedMember.packageName || (isEn ? 'No Active Package' : 'Chưa đăng ký gói')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-brand-navy-400 block text-[10px] uppercase font-bold tracking-wider">
                          {isEn ? 'Expiry Date' : 'Hạn Sử Dụng'}
                        </span>
                        <span className="font-bold text-white text-sm">{formatMemberDate(selectedMember.packageExpiry)}</span>
                        <span className="block text-brand-navy-400 mt-1">
                          {isEn ? 'Start' : 'Bắt đầu'}: {formatMemberDate(selectedMember.packageStartDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-brand-navy-400 block text-[10px] uppercase font-bold tracking-wider">
                          {isEn ? 'Pass Status' : 'Trạng Thái Thẻ'}
                        </span>
                        {selectedMember.packageStatus === 'ACTIVE' ? (
                          <span className="font-bold text-sm text-brand-sage-700 dark:text-brand-sage-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            {isEn ? 'Valid - Entry Allowed' : 'Hợp lệ - Đã gia hạn / Cho phép vào sân'}
                          </span>
                        ) : selectedMember.packageStatus === 'SCHEDULED' ? (
                          <span className="font-bold text-sm text-brand-sand-300">
                            {isEn ? 'Not Yet Effective' : 'Chưa đến ngày hiệu lực'}
                          </span>
                        ) : selectedMember.packageStatus === 'PENDING' ? (
                          <span className="font-bold text-sm text-brand-sand-300 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {isEn ? 'Awaiting Payment Activation' : 'Chờ thanh toán kích hoạt'}
                          </span>
                        ) : (
                          <span className="font-bold text-sm text-brand-terra-700 dark:text-brand-terra-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {isEn ? 'No Valid Pass - Check History' : 'Chưa có gói hợp lệ - Kiểm tra lịch sử gói'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions History Table */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-chivo text-xs font-black uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand-navy-400 text-[18px]">history</span>
                        <span>{isEn ? `Subscription & Renewal History (${subscriptions.length})` : `Lịch Sử Gói Tập & Gia Hạn (${subscriptions.length})`}</span>
                      </h3>
                    </div>

                    {loadingSubs ? (
                      <div className="p-4 text-center text-xs text-brand-navy-400">{isEn ? 'Loading package history...' : 'Đang tải lịch sử gói tập...'}</div>
                    ) : subsError ? (
                      <CounterError message={subsError} retry={() => setSubsVersion(v => v + 1)} />
                    ) : subscriptions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-brand-navy-400 border border-dashed rounded-xl dark:border-brand-navy-800">
                        {isEn ? 'Member has no subscription history yet.' : 'Hội viên chưa có lịch sử đăng ký gói tập nào.'}
                      </div>
                    ) : (
                      <div className="border border-brand-navy-200 dark:border-brand-navy-800 rounded-xl overflow-x-auto shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-brand-navy-50 dark:bg-brand-navy-800 text-[11px] font-bold text-brand-navy-600 dark:text-brand-navy-300 uppercase border-b border-brand-navy-200 dark:border-brand-navy-700">
                            <tr>
                              <th className="py-2.5 px-3">{isEn ? 'Package' : 'Gói Tập'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Duration' : 'Thời Hạn'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Valid Until' : 'Hạn Đến'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Amount' : 'Giá Tiền'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Status' : 'Trạng Thái'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-navy-100 dark:divide-brand-navy-800">
                            {subscriptions.map(sub => (
                              <tr key={sub.subscriptionId} className="hover:bg-brand-navy-50/50 dark:hover:bg-brand-navy-800/40">
                                <td className="py-2.5 px-3 font-semibold text-brand-navy-900 dark:text-white">{sub.packageName}</td>
                                <td className="py-2.5 px-3 text-brand-navy-600 dark:text-brand-navy-400">
                                  {sub.startDate ? `${sub.startDate} → ${sub.endDate}` : `${sub.durationDays} ${isEn ? 'days' : 'ngày'}`}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-brand-navy-700 dark:text-brand-navy-300">
                                  {sub.endDate || '—'}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-brand-sage-700 dark:text-brand-sage-500">
                                  {sub.price?.toLocaleString()}đ
                                </td>
                                <td className="py-2.5 px-3">
                                  <Badge variant={sub.status} size="sm">{sub.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Action Shortcuts for Receptionist */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-brand-navy-100 dark:border-brand-navy-800">
                    {[
                      ['bookings', isEn ? 'Bookings / Cancellations' : 'Đặt / Hủy lớp'],
                      ['invoices', isEn ? 'Invoices' : 'Hóa đơn'],
                      ['support', isEn ? 'Support Requests' : 'Yêu cầu hỗ trợ']
                    ].map(([route, label]) => (
                      <a
                        key={route}
                        className="rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 px-4 py-2 text-xs font-bold text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700 hover-lift transition-all shadow-xs"
                        href={`#/receptionist/${route}?query=${encodeURIComponent(selectedMember.memberCode)}`}
                      >
                        {label}
                      </a>
                    ))}
                    <a
                      href={`#/receptionist/counter-register?query=${encodeURIComponent(selectedMember.memberCode || selectedMember.phone || '')}`}
                      className="px-5 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift"
                    >
                      <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                      <span>{isEn ? 'Counter Renewal' : 'Gia Hạn Gói Tại Quầy'}</span>
                    </a>

                    <a
                      href={`#/receptionist/check-in?query=${encodeURIComponent(selectedMember.memberCode || selectedMember.phone || '')}`}
                      className="px-5 py-2.5 bg-brand-sage-700 hover:bg-brand-sage-900 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift"
                    >
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      <span>{isEn ? 'Check-in Now' : 'Check-in Ngay'}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Register Member At Counter */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title={isEn ? 'Register New Member at Counter' : 'Đăng Ký Thành Viên Mới Tại Quầy'}
      >
        <form onSubmit={handleRegisterMember} noValidate className="space-y-4">
          {regError && (
            <div className="p-3 bg-brand-danger-50 dark:bg-brand-danger-950/30 border border-brand-danger-200 dark:border-brand-danger-800 text-brand-danger-700 dark:text-brand-danger-300 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{regError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Full Name *' : 'Họ và tên *'}
            </label>
            <input
              type="text"
              placeholder={isEn ? 'John Doe' : 'Nguyễn Văn A'}
              value={regFullName}
              onChange={e => setRegFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Phone Number *' : 'Số điện thoại *'}
              </label>
              <input
                type="tel"
                placeholder="0912345678"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                placeholder="member@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Username (Optional)' : 'Tên đăng nhập (Tùy chọn)'}
              </label>
              <input
                type="text"
                placeholder={isEn ? 'Auto-generated if blank' : 'Tự động nếu để trống'}
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
                {isEn ? 'Date of Birth (Optional)' : 'Ngày sinh (Tùy chọn)'}
              </label>
              <input
                type="date"
                value={regDob}
                onChange={e => setRegDob(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-navy-700 dark:text-brand-navy-300 mb-1">
              {isEn ? 'Initial Temporary Password' : 'Mật khẩu khởi tạo'}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              maxLength={128}
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-brand-navy-300 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 text-brand-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-sage-500"
            />
            <p className="text-[11px] text-brand-navy-400 mt-1">
              {isEn ? 'Required: use uppercase, lowercase, a number and a special character.' : 'Bắt buộc nhập, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-navy-100 dark:border-brand-navy-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-800 rounded-lg transition-colors cursor-pointer"
            >
              {isEn ? 'CANCEL' : 'HỦY'}
            </button>
            <button
              type="submit"
              disabled={regSaving}
              className="px-5 py-2 bg-brand-sage-700 hover:bg-brand-sage-900 disabled:opacity-50 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all hover-lift flex items-center gap-1.5 cursor-pointer"
            >
              {regSaving ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>{isEn ? 'Processing...' : 'Đang xử lý...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                  <span>{isEn ? 'Create Member' : 'Tạo Hội Viên'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
