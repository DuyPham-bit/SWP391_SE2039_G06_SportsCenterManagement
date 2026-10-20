import React, { useState, useEffect } from 'react';
import { receptionApi } from '../../services/api.js';
import { Badge } from '../../components/common/StatCard.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { useToast } from '../../context/ToastContext.js';
import { CounterError } from './ReceptionistShared.jsx';
import { formatMemberDate } from '../member/memberOverview.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export function MemberLookup() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const { showSuccess, showError } = useToast();
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
  const [regPassword, setRegPassword] = useState('Member@123456');
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
    setRegSaving(true);
    setRegError('');
    try {
      const newMember = await receptionApi.createMember({
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        username: regUsername.trim() || undefined,
        password: regPassword || 'Member@123456',
        dateOfBirth: regDob || undefined
      });
      showSuccess(isEn ? `Member created successfully! Code: ${newMember.memberCode}` : `Đăng ký hội viên thành công! Mã: ${newMember.memberCode}`);
      setRegisterModalOpen(false);
      setRegFullName('');
      setRegPhone('');
      setRegEmail('');
      setRegUsername('');
      setRegDob('');
      setRegPassword('Member@123456');
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
      <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#40916C] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-emerald-700/30 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-300/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#F2CC8F]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <span className="font-chivo text-xs uppercase tracking-widest text-[#F2CC8F] font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#81B29A] animate-pulse" />
            {isEn ? 'COUNTER MEMBER DIRECTORY' : 'HỒ SƠ HỘI VIÊN & THẺ THỂ THAO'}
          </span>
          <h1 className="font-chivo text-2xl md:text-3xl font-black mt-1 text-white tracking-tight">
            {isEn ? 'Counter Member Profile Lookup' : 'Tra Cứu Hồ Sơ Hội Viên Tại Quầy'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
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
          className="px-5 py-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer hover-lift relative z-10"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>{isEn ? 'Register New Member' : 'Đăng Ký Hội Viên Mới'}</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <form
        onSubmit={handleSearch}
        className="max-w-2xl bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-all hover-lift"
      >
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
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
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#81B29A]/40 text-slate-900 dark:text-white bg-transparent font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="px-6 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift shrink-0 cursor-pointer disabled:opacity-50"
        >
          {searching ? (isEn ? 'Searching...' : 'Đang tra cứu...') : (isEn ? 'Search' : 'Tra Cứu')}
        </button>
      </form>

      {searchError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{searchError}</p>}

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          {results.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto shadow-sm">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">person_off</span>
              <h3 className="font-chivo text-base font-bold text-slate-900 dark:text-white mt-2">
                {isEn ? 'No Member Found' : 'Không Tìm Thấy Hội Viên'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all hover-lift cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>{isEn ? 'Register Member With This Info' : 'Đăng Ký Hội Viên Mới Với Thông Tin Này'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Member list column if multiple */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {isEn ? `Search Results (${results.length})` : `Kết quả tìm kiếm (${results.length})`}
                </span>
                {results.map(member => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover-lift ${
                      selectedMember?.id === member.id
                        ? 'bg-[#81B29A]/10 border-[#81B29A] ring-2 ring-[#81B29A]/20 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{member.fullName}</div>
                        <div className="text-[11px] text-[#2D6A4F] dark:text-[#81B29A] font-semibold font-mono">{member.memberCode}</div>
                        <div className="text-[10px] text-slate-400">{member.phone}</div>
                      </div>
                      <Badge variant={member.packageStatus} size="sm">{member.packageStatus}</Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Profile Card (2 cols) */}
              {selectedMember && (
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 hover-lift transition-all">
                  <div className="flex items-start justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <img
                        src={selectedMember.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#81B29A] shadow"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-chivo text-xl font-black text-slate-900 dark:text-white">{selectedMember.fullName}</h2>
                          <Badge variant={selectedMember.status}>{selectedMember.status}</Badge>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedMember.email} • {selectedMember.phone}</div>
                        <div className="text-xs font-bold text-[#2D6A4F] dark:text-[#81B29A] mt-1 font-mono">
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
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E2235] via-[#242A42] to-[#1E2235] text-white shadow-md space-y-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-chivo text-xs uppercase tracking-widest text-[#F2CC8F] font-bold">
                        {isEn ? 'SCMS OLYMPIC MEMBERSHIP CARD' : 'THẺ TẬP HỘI VIÊN SCMS OLYMPIC'}
                      </span>
                      <span className="material-symbols-outlined text-[#81B29A] text-[28px]">sports_kabaddi</span>
                    </div>

                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400">
                        {isEn ? 'Current Enrolled Package' : 'Gói Đang Sở Hữu'}
                      </div>
                      <div className="font-chivo text-xl font-black text-white mt-0.5">
                        {selectedMember.packageName || (isEn ? 'No Active Package' : 'Chưa đăng ký gói')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                          {isEn ? 'Expiry Date' : 'Hạn Sử Dụng'}
                        </span>
                        <span className="font-bold text-white text-sm">{formatMemberDate(selectedMember.packageExpiry)}</span>
                        <span className="block text-slate-400 mt-1">
                          {isEn ? 'Start' : 'Bắt đầu'}: {formatMemberDate(selectedMember.packageStartDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                          {isEn ? 'Pass Status' : 'Trạng Thái Thẻ'}
                        </span>
                        {selectedMember.packageStatus === 'ACTIVE' ? (
                          <span className="font-bold text-sm text-[#81B29A] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            {isEn ? 'Valid - Entry Allowed' : 'Hợp lệ - Đã gia hạn / Cho phép vào sân'}
                          </span>
                        ) : selectedMember.packageStatus === 'SCHEDULED' ? (
                          <span className="font-bold text-sm text-[#F2CC8F]">
                            {isEn ? 'Not Yet Effective' : 'Chưa đến ngày hiệu lực'}
                          </span>
                        ) : selectedMember.packageStatus === 'PENDING' ? (
                          <span className="font-bold text-sm text-[#F2CC8F] flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {isEn ? 'Awaiting Payment Activation' : 'Chờ thanh toán kích hoạt'}
                          </span>
                        ) : (
                          <span className="font-bold text-sm text-[#E07A5F] flex items-center gap-1">
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
                      <h3 className="font-chivo text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
                        <span>{isEn ? `Subscription & Renewal History (${subscriptions.length})` : `Lịch Sử Gói Tập & Gia Hạn (${subscriptions.length})`}</span>
                      </h3>
                    </div>

                    {loadingSubs ? (
                      <div className="p-4 text-center text-xs text-slate-400">{isEn ? 'Loading package history...' : 'Đang tải lịch sử gói tập...'}</div>
                    ) : subsError ? (
                      <CounterError message={subsError} retry={() => setSubsVersion(v => v + 1)} />
                    ) : subscriptions.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl dark:border-slate-800">
                        {isEn ? 'Member has no subscription history yet.' : 'Hội viên chưa có lịch sử đăng ký gói tập nào.'}
                      </div>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="py-2.5 px-3">{isEn ? 'Package' : 'Gói Tập'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Duration' : 'Thời Hạn'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Valid Until' : 'Hạn Đến'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Amount' : 'Giá Tiền'}</th>
                              <th className="py-2.5 px-3">{isEn ? 'Status' : 'Trạng Thái'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {subscriptions.map(sub => (
                              <tr key={sub.subscriptionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{sub.packageName}</td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                  {sub.startDate ? `${sub.startDate} → ${sub.endDate}` : `${sub.durationDays} ${isEn ? 'days' : 'ngày'}`}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                                  {sub.endDate || '—'}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-[#2D6A4F] dark:text-[#81B29A]">
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
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {[
                      ['bookings', isEn ? 'Bookings / Cancellations' : 'Đặt / Hủy lớp'],
                      ['invoices', isEn ? 'Invoices' : 'Hóa đơn'],
                      ['support', isEn ? 'Support Requests' : 'Yêu cầu hỗ trợ']
                    ].map(([route, label]) => (
                      <a
                        key={route}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover-lift transition-all shadow-xs"
                        href={`#/receptionist/${route}?query=${encodeURIComponent(selectedMember.memberCode)}`}
                      >
                        {label}
                      </a>
                    ))}
                    <a
                      href={`#/receptionist/counter-register?query=${encodeURIComponent(selectedMember.memberCode || selectedMember.phone || '')}`}
                      className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift"
                    >
                      <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                      <span>{isEn ? 'Counter Renewal' : 'Gia Hạn Gói Tại Quầy'}</span>
                    </a>

                    <a
                      href={`#/receptionist/check-in?query=${encodeURIComponent(selectedMember.memberCode || selectedMember.phone || '')}`}
                      className="px-5 py-2.5 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 hover-lift"
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
        <form onSubmit={handleRegisterMember} className="space-y-4">
          {regError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{regError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Full Name *' : 'Họ và tên *'}
            </label>
            <input
              type="text"
              required
              placeholder={isEn ? 'John Doe' : 'Nguyễn Văn A'}
              value={regFullName}
              onChange={e => setRegFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Phone Number *' : 'Số điện thoại *'}
              </label>
              <input
                type="tel"
                required
                placeholder="0912345678"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="member@example.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Username (Optional)' : 'Tên đăng nhập (Tùy chọn)'}
              </label>
              <input
                type="text"
                placeholder={isEn ? 'Auto-generated if blank' : 'Tự động nếu để trống'}
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {isEn ? 'Date of Birth (Optional)' : 'Ngày sinh (Tùy chọn)'}
              </label>
              <input
                type="date"
                value={regDob}
                onChange={e => setRegDob(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              {isEn ? 'Initial Temporary Password' : 'Mật khẩu khởi tạo'}
            </label>
            <input
              type="text"
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {isEn ? 'Default: Member@123456 (Member can change after logging in)' : 'Mặc định: Member@123456 (Hội viên có thể đổi sau khi đăng nhập)'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              {isEn ? 'CANCEL' : 'HỦY'}
            </button>
            <button
              type="submit"
              disabled={regSaving}
              className="px-5 py-2 bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white font-chivo text-xs font-bold uppercase tracking-wider rounded-lg shadow-md transition-all hover-lift flex items-center gap-1.5 cursor-pointer"
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
