import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { apiRequest } from '../../services/http.js';
import { useToast } from '../../context/ToastContext.jsx';
import { MotionButton } from '../../components/common/MotionButton.jsx';

const OG = 'linear-gradient(108deg,#2F7B5D 0%,#24828F 25%,#3FAEB8 48%,#76B386 70%,#DEAC46 88%,#E5A33C 100%)';
const fmtDate = v => { try { return v ? new Date(v).toLocaleString('vi-VN') : '—'; } catch { return '—'; } };
const fmtDO = v => { try { return v ? new Date(v).toLocaleDateString('vi-VN') : '—'; } catch { return '—'; } };

function Badge({ status }) {
  const s = (status || '').toLowerCase();
  const M = { active:{bg:'#D1FAE5',c:'#065F46',d:'#10B981'}, inactive:{bg:'#FEF3C7',c:'#92400E',d:'#F59E0B'}, disabled:{bg:'#FEE2E2',c:'#991B1B',d:'#EF4444'} };
  const t = M[s] || { bg:'#F1F5F9', c:'#475569', d:'#94A3B8' };
  return (
    <span style={{ background:t.bg, color:t.c, display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:t.d, display:'inline-block' }} />
      {(status||'—').toUpperCase()}
    </span>
  );
}

function CenterModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name:'', address:'', phone:'', email:'', status:'Active' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = async () => {
    setSaving(true); setErr('');
    try { await apiRequest('admin/centers',{method:'POST',body:form}); onSaved(); }
    catch(e){ setErr(e.message||'Đã xảy ra lỗi.'); } finally { setSaving(false); }
  };
  return (
    <div style={{position:'fixed',inset:0,background:'#0008',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:20,padding:32,width:'100%',maxWidth:480,boxShadow:'0 20px 60px #0003'}}>
        <h3 style={{margin:0,fontSize:18,fontWeight:800,color:'#0F172A'}}>Tạo Cơ Sở Mới</h3>
        <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:12}}>
          {[['Tên cơ sở *','name','text'],['Địa chỉ *','address','text'],['Số điện thoại','phone','tel'],['Email liên hệ','email','email']].map(([lbl,key,type])=>(
            <label key={key} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
              {lbl}
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}} />
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
            Trạng thái hoạt động
            <select value={form.status} onChange={e=>set('status',e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}}>
              <option value="Active">Hoạt động (Active)</option>
              <option value="Inactive">Tạm ngưng (Inactive)</option>
              <option value="Disabled">Vô hiệu hóa (Disabled)</option>
            </select>
          </label>
        </div>
        {err&&<div style={{marginTop:10,color:'#DC2626',fontSize:12}}>{err}</div>}
        <div style={{marginTop:20,display:'flex',gap:8,justifyContent:'flex-end'}}>
          <MotionButton onClick={onClose} style={{padding:'8px 20px',borderRadius:8,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:13,fontWeight:600}}>Hủy</MotionButton>
          <MotionButton onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:13,fontWeight:700,opacity:saving?.6:1}}>{saving?'Đang lưu...':'Tạo cơ sở'}</MotionButton>
        </div>
      </div>
    </div>
  );
}

function ManagerModal({ centers, onClose, onSaved }) {
  const ac = (centers||[]).filter(c=>c.status==='Active');
  const [form, setForm] = useState({ username:'', email:'', password:'', fullName:'', phone:'', centerId:ac[0]?.id||'' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const save = async () => {
    setSaving(true); setErr('');
    try { await apiRequest('admin/managers',{method:'POST',body:{...form,centerId:Number(form.centerId)}}); onSaved(); }
    catch(e){ setErr(e.message||'Đã xảy ra lỗi.'); } finally { setSaving(false); }
  };
  return (
    <div style={{position:'fixed',inset:0,background:'#0008',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:20,padding:32,width:'100%',maxWidth:480,boxShadow:'0 20px 60px #0003'}}>
        <h3 style={{margin:0,fontSize:18,fontWeight:800,color:'#0F172A'}}>Tạo Tài Khoản Manager</h3>
        <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:12}}>
          {[['Họ và tên *','fullName','text'],['Tên đăng nhập (Username) *','username','text'],['Email *','email','email'],['Mật khẩu khởi tạo *','password','password'],['Số điện thoại','phone','tel']].map(([lbl,key,type])=>(
            <label key={key} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
              {lbl}
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}} />
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
            Cơ sở trực thuộc *
            <select value={form.centerId} onChange={e=>set('centerId',e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}}>
              {ac.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {err&&<div style={{marginTop:10,color:'#DC2626',fontSize:12}}>{err}</div>}
        <div style={{marginTop:20,display:'flex',gap:8,justifyContent:'flex-end'}}>
          <MotionButton onClick={onClose} style={{padding:'8px 20px',borderRadius:8,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:13,fontWeight:600}}>Hủy</MotionButton>
          <MotionButton onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:13,fontWeight:700,opacity:saving?.6:1}}>{saving?'Đang lưu...':'Tạo Manager'}</MotionButton>
        </div>
      </div>
    </div>
  );
}

function AccountActionModal({ actionData, onClose, onConfirm, isSaving }) {
  if (!actionData) return null;
  const { type, account } = actionData;
  const isDelete = type === 'delete';
  const isLock = type === 'lock';
  const isUnlock = type === 'unlock';

  const defaultReasons = {
    delete: 'Admin xóa tài khoản',
    lock: 'Admin tạm khóa tài khoản',
    unlock: 'Admin mở khóa tài khoản',
    'revoke-sessions': 'Admin thu hồi phiên đăng nhập'
  };

  const [reason, setReason] = useState(defaultReasons[type] || '');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSaving]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = reason.trim();
    if (!finalReason) {
      setLocalError('Vui lòng nhập lý do thực hiện thao tác.');
      return;
    }
    setLocalError('');
    onConfirm(finalReason);
  };

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-sm transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[480px] bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3),0_0_0_1px_rgba(15,23,42,0.06)] border border-slate-100 p-6 sm:p-7 text-left transition-all duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient lighting tint */}
        <div
          className={`absolute top-0 inset-x-0 h-32 pointer-events-none ${
            isDelete
              ? 'bg-gradient-to-b from-red-100/70 via-rose-50/40 to-transparent'
              : isLock
              ? 'bg-gradient-to-b from-amber-100/70 via-amber-50/40 to-transparent'
              : isUnlock
              ? 'bg-gradient-to-b from-emerald-100/70 via-emerald-50/40 to-transparent'
              : 'bg-gradient-to-b from-slate-100/80 via-slate-50/40 to-transparent'
          }`}
        />

        {/* Close button */}
        <MotionButton
          type="button"
          disabled={isSaving}
          onClick={onClose}
          aria-label="Đóng"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center border border-slate-200/80 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 z-10 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </MotionButton>

        {/* Top Icon Badge & Header */}
        <div className="relative z-10 flex items-center gap-3.5 mb-4">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-sm border ring-4 shrink-0 ${
              isDelete
                ? 'bg-gradient-to-br from-red-50 to-rose-100 text-red-600 border-red-200 ring-red-50'
                : isLock
                ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200 ring-amber-50'
                : isUnlock
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-50'
                : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 border-slate-300 ring-slate-100'
            }`}
          >
            {isDelete && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            )}
            {isLock && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
            {isUnlock && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            )}
            {!isDelete && !isLock && !isUnlock && (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            )}
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-1 ${
                isDelete
                  ? 'bg-red-100 text-red-800'
                  : isLock
                  ? 'bg-amber-100 text-amber-800'
                  : isUnlock
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-800'
              }`}
            >
              {isDelete ? 'Hành động nguy hiểm' : isLock ? 'Bảo mật tài khoản' : isUnlock ? 'Mở quyền truy cập' : 'Quản trị phiên'}
            </span>
            <h3 id="confirm-dialog-title" className="text-lg font-black text-slate-900 tracking-tight">
              {isDelete
                ? 'Xóa tài khoản Member'
                : isLock
                ? 'Khóa tài khoản'
                : isUnlock
                ? 'Mở khóa tài khoản'
                : 'Thu hồi phiên đăng nhập'}
            </h3>
          </div>
        </div>

        {/* Target Account Summary Card */}
        <div className="relative z-10 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs shrink-0 uppercase">
              {account.username?.slice(0, 2) || 'MB'}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                <span>{account.username}</span>
                <span className="text-[11px] font-semibold text-slate-400">#{account.id}</span>
              </div>
              <div className="text-xs text-slate-500 truncate">{account.email || 'Chưa cập nhật email'}</div>
            </div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
            {account.role}
          </span>
        </div>

        {/* Consequence Note */}
        <div
          className={`relative z-10 p-3 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 mb-4 border ${
            isDelete
              ? 'bg-amber-50/90 border-amber-200/90 text-amber-900'
              : isLock
              ? 'bg-amber-50/90 border-amber-200/90 text-amber-900'
              : isUnlock
              ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-900'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            {isDelete ? (
              <>
                <strong>Lưu ý:</strong> Thao tác này sẽ <strong>thu hồi quyền đăng nhập vĩnh viễn</strong> và ẩn danh thông tin cá nhân. <strong>Lịch sử giao dịch và hóa đơn vẫn được lưu giữ an toàn</strong> cho công tác đối soát & kiểm toán.
              </>
            ) : isLock ? (
              <>
                Tài khoản sẽ bị tạm ngưng và không thể đăng nhập hoặc thực hiện bất kỳ hoạt động nào trong hệ thống cho đến khi được mở khóa.
              </>
            ) : isUnlock ? (
              <>
                Tài khoản sẽ được kích hoạt hoạt động trở lại ngay lập tức và người dùng có thể đăng nhập bình thường.
              </>
            ) : (
              <>
                Tất cả phiên đăng nhập hiện tại trên các thiết bị sẽ bị hủy ngay lập tức. Người dùng cần nhập lại mật khẩu để tiếp tục.
              </>
            )}
          </div>
        </div>

        {/* Reason Form */}
        <form onSubmit={handleSubmit} className="relative z-10 space-y-3.5">
          <div>
            <label htmlFor="action-reason" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Lý do thực hiện <span className="text-red-500">*</span>
            </label>
            <input
              id="action-reason"
              autoFocus
              type="text"
              required
              maxLength={500}
              disabled={isSaving}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thực hiện thao tác..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A3B8B] focus:border-[#1A3B8B] transition-all"
            />
            {localError && <p className="text-xs text-red-600 font-medium mt-1">{localError}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <MotionButton
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="min-h-10 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </MotionButton>
            <MotionButton
              type="submit"
              disabled={isSaving}
              className={`min-h-10 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                isDelete
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-red-600/25'
                  : isLock
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-600/25'
                  : isUnlock
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/25'
                  : 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black shadow-slate-700/25'
              }`}
            >
              {isSaving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <span>
                {isSaving
                  ? 'Đang xử lý...'
                  : isDelete
                  ? 'Xác nhận xóa tài khoản'
                  : isLock
                  ? 'Xác nhận khóa'
                  : isUnlock
                  ? 'Xác nhận mở khóa'
                  : 'Xác nhận thu hồi'}
              </span>
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
}

export function AdminDashboard({ initialSection }) {
  const [tab, setTab] = useState(initialSection || 'overview');
  const [ov, setOv] = useState(null);
  const [centers, setCenters] = useState([]);
  const [managers, setManagers] = useState([]);
  const [accs, setAccs] = useState([]);
  const [loadOv, setLoadOv] = useState(true);
  const [loadC, setLoadC] = useState(false);
  const [loadM, setLoadM] = useState(false);
  const [loadA, setLoadA] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(null);
  const [aPage, setAPage] = useState(1);
  const [aTotal, setATotal] = useState(0);
  const [aQ, setAQ] = useState('');
  const [aRole, setARole] = useState('');
  const [aSt, setASt] = useState('');
  const [showCC, setShowCC] = useState(false);
  const [showCM, setShowCM] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const toast = useToast?.() || {};
  const showSuccess = toast.showSuccess || console.log;
  const showError = toast.showError || console.error;
  const PS = 20;

  const loadOvFn = useCallback(async()=>{
    setLoadOv(true);
    try{ setOv(await apiRequest('admin/overview')); }catch{}finally{ setLoadOv(false); }
  },[]);
  const loadCFn = useCallback(async()=>{
    setLoadC(true);
    try{ const d=await apiRequest('admin/centers'); setCenters(Array.isArray(d)?d:[]); }catch{}finally{ setLoadC(false); }
  },[]);
  const loadMFn = useCallback(async()=>{
    setLoadM(true);
    try{ const d=await apiRequest('admin/managers'); setManagers(Array.isArray(d)?d:[]); }catch{}finally{ setLoadM(false); }
  },[]);
  const loadAFn = useCallback(async()=>{
    setLoadA(true);
    try{
      const p=new URLSearchParams({page:aPage,pageSize:PS});
      if(aQ.trim()) p.set('query',aQ.trim());
      if(aRole) p.set('role',aRole);
      if(aSt) p.set('status',aSt);
      const r=await apiRequest('admin/accounts?'+p);
      setAccs(Array.isArray(r?.items)?r.items:[]); setATotal(r?.totalCount||0);
    }catch{}finally{ setLoadA(false); }
  },[aPage,aQ,aRole,aSt]);

  useEffect(()=>{ loadOvFn(); loadCFn(); loadMFn(); },[loadOvFn,loadCFn,loadMFn]);
  useEffect(()=>{ if(tab==='accounts') loadAFn(); },[tab,loadAFn]);
  useEffect(()=>{ if(initialSection) setTab(initialSection); },[initialSection]);

  const patchC = async(id,cs)=>{
    setSaving('c'+id); setErr('');
    try{
      const c=centers.find(x=>x.id===id);
      await apiRequest('admin/centers/'+id,{method:'PATCH',body:{...c,status:cs==='Active'?'Inactive':'Active'}});
      loadCFn(); loadOvFn();
    }catch(e){ setErr(e.message); }finally{ setSaving(null); }
  };
  const patchM = async(m)=>{
    setSaving('m'+m.id); setErr('');
    try{
      await apiRequest('admin/managers/'+m.id,{method:'PATCH',body:{fullName:m.fullName,centerId:m.centerId,status:m.status==='Active'?'Disabled':'Active'}});
      loadMFn(); loadOvFn();
    }catch(e){ setErr(e.message); }finally{ setSaving(null); }
  };
  const handleExecuteAction = async (finalReason) => {
    if (!confirmAction) return;
    const { type, account } = confirmAction;
    setSaving('a' + account.id);
    setErr('');
    try {
      if (type === 'delete') {
        await apiRequest('admin/accounts/' + account.id, {
          method: 'DELETE',
          body: { reason: finalReason }
        });
        showSuccess(`Đã xóa và ẩn danh thông tin tài khoản Member "${account.username}".`);
      } else {
        await apiRequest('admin/accounts/' + account.id + '/' + type, {
          method: 'POST',
          body: { reason: finalReason }
        });
        const labels = {
          lock: 'Đã khóa tài khoản',
          unlock: 'Đã mở khóa tài khoản',
          'revoke-sessions': 'Đã thu hồi các phiên đăng nhập của'
        };
        showSuccess(`${labels[type] || 'Thao tác thành công'} "${account.username}".`);
      }
      setConfirmAction(null);
      loadAFn();
      loadOvFn();
    } catch (e) {
      setErr(e.message || 'Thao tác thất bại.');
      showError(e.message || 'Thao tác thất bại.');
    } finally {
      setSaving(null);
    }
  };

  const deleteMember = (acc) => {
    setConfirmAction({ type: 'delete', account: acc });
  };
  const actA = (id, action) => {
    const acc = accs.find((x) => x.id === id);
    if (!acc) return;
    setConfirmAction({ type: action, account: acc });
  };

  const ac = centers.filter(c=>c.status==='Active');
  const aPgs = Math.ceil(aTotal/PS);
  const TABS = [{id:'overview',l:'Tổng Quan',i:'dashboard'},{id:'centers',l:'Cơ Sở',i:'account_tree'},{id:'managers',l:'Managers',i:'manage_accounts'},{id:'accounts',l:'Tài Khoản',i:'group'}];
  const THS = {padding:'10px 12px',textAlign:'left',fontWeight:700,color:'#475569',fontSize:11,textTransform:'uppercase',borderBottom:'2px solid #E2E8F0',whiteSpace:'nowrap'};
  const TDS = {padding:'10px 12px'};

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'Inter,sans-serif'}}>
      {showCC&&<CenterModal onClose={()=>setShowCC(false)} onSaved={()=>{setShowCC(false);loadCFn();loadOvFn();}} />}
      {showCM&&<ManagerModal centers={centers} onClose={()=>setShowCM(false)} onSaved={()=>{setShowCM(false);loadMFn();loadOvFn();}} />}
      {confirmAction && (
        <AccountActionModal
          actionData={confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleExecuteAction}
          isSaving={saving === 'a' + confirmAction.account.id}
        />
      )}

      {/* Top Banner / Header - Olympic Multi-stop Gradient with Embedded Tabs (Image 2 style) */}
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
        <section
          className="relative overflow-hidden rounded-3xl text-white p-6 lg:p-8 shadow-xl shadow-[#24828F]/20 border border-white/30"
          style={{ background: OG }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#F2CC8F]/50 via-[#E5A33C]/35 to-transparent blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-tr from-[#81B29A]/45 via-[#2F7B5D]/30 to-transparent blur-3xl" />

          {/* Olympic curved motion lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 1000 300">
            <path d="M-50,220 C200,80 450,260 750,120 C900,40 1050,180 1100,140" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="6 6" />
            <path d="M-20,260 C250,120 500,300 800,160 C950,90 1050,200 1120,180" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="850" cy="80" r="140" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
            <circle cx="890" cy="110" r="90" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
          </svg>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-white/20 text-white uppercase backdrop-blur-md border border-white/30 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  HỆ THỐNG QUẢN TRỊ TRUNG TÂM
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white border border-white/30">
                  Toàn Hệ Thống SCMS
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-chivo text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                Bảng Quản Trị Hệ Thống
              </h1>
              <p className="text-sm text-white/95 mt-1 max-w-3xl leading-relaxed drop-shadow-xs">
                Quản lý các cơ sở thể thao, phân quyền Manager và giám sát tài khoản toàn hệ thống SCMS an toàn, minh bạch.
              </p>
            </div>

            {/* Quick Metrics & Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="grid grid-cols-4 gap-3 bg-white/20 p-3 rounded-2xl border border-white/30 backdrop-blur-md shadow-xs">
                <div className="text-center px-3">
                  <div className="text-xl font-black text-white">{ov?.activeCenterCount ?? '—'}</div>
                  <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">Cơ Sở</div>
                </div>
                <div className="text-center px-3 border-l border-white/20">
                  <div className="text-xl font-black text-white">{ov?.activeManagerCount ?? '—'}</div>
                  <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">Managers</div>
                </div>
                <div className="text-center px-3 border-l border-white/20">
                  <div className="text-xl font-black text-white">{ov?.lockedAccountCount ?? '—'}</div>
                  <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">Bị Khóa</div>
                </div>
                <div className="text-center px-3 border-l border-white/20">
                  <div className="text-xl font-black text-white">{ov?.totalAccountCount ?? '—'}</div>
                  <div className="text-[10px] text-white/90 uppercase tracking-wider font-bold">Tài Khoản</div>
                </div>
              </div>

              <MotionButton
                onClick={() => { loadOvFn(); loadCFn(); loadMFn(); if (tab === 'accounts') loadAFn(); }}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold font-chivo uppercase tracking-wider transition-all border border-white/30 backdrop-blur-md shadow-xs cursor-pointer"
                title="Làm mới dữ liệu"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span className="hidden sm:inline">Làm Mới</span>
              </MotionButton>
            </div>
          </div>

          {/* Master Tabs Embedded Inside Banner (Image 2 Style) */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/20">
            {TABS.map(t => {
              const isActive = tab === t.id;
              return (
                <MotionButton
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-white text-[#1B4332] shadow-lg shadow-black/15 font-black scale-102'
                      : 'bg-white/20 text-white hover:bg-white/30 border border-white/20 backdrop-blur-md'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{t.i}</span>
                  <span>{t.l}</span>
                </MotionButton>
              );
            })}
          </div>
        </section>
      </div>

      <div style={{padding:'0 32px 32px',maxWidth:1400,margin:'0 auto'}}>
        {err&&<div style={{marginBottom:16,color:'#DC2626',fontSize:12,background:'#FEF2F2',borderRadius:12,padding:'12px 16px',border:'1px solid #FECACA'}}>{err}</div>}
        {tab==='overview'&&(
          <div className="space-y-6">
            {/* Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">bolt</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Thao tác nhanh quản trị</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <MotionButton
                  onClick={() => setShowCC(true)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 border border-emerald-200"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>+ Cơ Sở Mới
                </MotionButton>
                <MotionButton
                  onClick={() => setShowCM(true)}
                  disabled={ac.length === 0}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 border border-blue-200 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>Tạo Manager
                </MotionButton>
                <a
                  href="#/admin/roles-permissions"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs flex items-center gap-1.5 border border-indigo-200"
                >
                  <span className="material-symbols-outlined text-[16px]">security</span>Phân Quyền RBAC
                </a>
                <a
                  href="#/admin/audit-logs"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 border border-amber-200"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>Nhật Ký Kiểm Toán
                </a>
              </div>
            </div>

            {/* Visual KPI Cards with Progress Ratios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  i: 'account_tree',
                  l: 'Cơ Sở Thể Thao',
                  v: ov?.activeCenterCount ?? 0,
                  sub: `${centers.length} tổng cơ sở`,
                  pct: centers.length ? Math.round(((ov?.activeCenterCount || 0) / centers.length) * 100) : 100,
                  a: '#10B981',
                  tabId: 'centers'
                },
                {
                  i: 'manage_accounts',
                  l: 'Managers Đang Trực',
                  v: ov?.activeManagerCount ?? 0,
                  sub: `${managers.length} quản lý bổ nhiệm`,
                  pct: managers.length ? Math.round(((ov?.activeManagerCount || 0) / managers.length) * 100) : 100,
                  a: '#3B82F6',
                  tabId: 'managers'
                },
                {
                  i: 'lock',
                  l: 'Tài Khoản Bị Khóa',
                  v: ov?.lockedAccountCount ?? 0,
                  sub: 'Cần kiểm tra an ninh',
                  pct: ov?.totalAccountCount ? Math.round(((ov?.lockedAccountCount || 0) / ov?.totalAccountCount) * 100) : 0,
                  a: '#EF4444',
                  tabId: 'accounts'
                },
                {
                  i: 'group',
                  l: 'Tài Khoản Toàn Hệ Thống',
                  v: ov?.totalAccountCount ?? 0,
                  sub: 'Hội viên, nhân sự, admin',
                  pct: 100,
                  a: '#F59E0B',
                  tabId: 'accounts'
                }
              ].map(x => (
                <div
                  key={x.l}
                  onClick={() => setTab(x.tabId)}
                  className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ background: x.a + '18' }}
                    >
                      <span className="material-symbols-outlined text-[26px]" style={{ color: x.a }}>
                        {x.i}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 transition-colors text-[20px]">
                      arrow_forward
                    </span>
                  </div>

                  <div>
                    <div className="text-3xl font-black text-slate-900 font-chivo leading-none">
                      {x.v}
                    </div>
                    <div className="text-xs font-bold text-slate-600 mt-1">{x.l}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{x.sub}</div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Tỉ lệ hoạt động</span>
                      <span>{x.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, x.pct)}%`, backgroundColor: x.a }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Side-by-side lists */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',gap:20}}>
              {[['Cơ Sở Thể Thao',centers,'centers'],['Đội Ngũ Manager',managers,'managers']].map(([ttl,list,sid])=>(
                <div key={ttl} style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{fontWeight:800,fontSize:14,color:'#0F172A'}}>{ttl}</div>
                    <MotionButton onClick={()=>setTab(sid)} whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }} style={{fontSize:12,color:'#2F7B5D',fontWeight:600,background:'none',border:'none'}}>Xem tất cả →</MotionButton>
                  </div>
                  {list.slice(0,5).map(item=>(
                    <div key={item.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #F1F5F9'}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:'#0F172A'}}>{item.name||item.fullName}</div>
                        <div style={{fontSize:11,color:'#94A3B8'}}>{item.address||item.centerName||item.email||''}</div>
                      </div>
                      <Badge status={item.status} />
                    </div>
                  ))}
                  {list.length===0&&<div style={{color:'#CBD5E1',fontSize:13,textAlign:'center',padding:16}}>Chưa có dữ liệu</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==='centers'&&(
          <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0F172A'}}>Danh Sách Cơ Sở ({centers.length})</div>
              <MotionButton onClick={()=>setShowCC(true)} style={{padding:'8px 18px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:6}}>
                <span className='material-symbols-outlined' style={{fontSize:16}}>add</span>Tạo Cơ Sở
              </MotionButton>
            </div>
            {loadC?<div style={{textAlign:'center',padding:32,color:'#94A3B8'}}>Đang tải dữ liệu...</div>:(
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'#F8FAFC'}}>{['ID','Tên cơ sở','Địa chỉ','Số điện thoại','Email','Trạng thái','Ngày tạo','Thao tác'].map(h=><th key={h} style={THS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {centers.map(c=>(
                      <tr key={c.id} style={{borderBottom:'1px solid #F1F5F9'}}>
                        <td style={TDS}>#{c.id}</td>
                        <td style={{...TDS,fontWeight:700,color:'#0F172A'}}>{c.name}</td>
                        <td style={TDS}>{c.address}</td>
                        <td style={TDS}>{c.phone||'—'}</td>
                        <td style={TDS}>{c.email||'—'}</td>
                        <td style={TDS}><Badge status={c.status} /></td>
                        <td style={{...TDS,color:'#94A3B8'}}>{fmtDO(c.createdAt)}</td>
                        <td style={TDS}>
                          <MotionButton onClick={()=>patchC(c.id,c.status)} disabled={saving==='c'+c.id} style={{padding:'4px 12px',borderRadius:6,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:11,fontWeight:600,color:'#475569'}}>
                            {saving==='c'+c.id?'...':c.status==='Active'?'Vô Hiệu Hóa':'Kích Hoạt'}
                          </MotionButton>
                        </td>
                      </tr>
                    ))}
                    {centers.length===0&&<tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'#CBD5E1'}}>Chưa có cơ sở nào.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab==='managers'&&(
          <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0F172A'}}>Tài Khoản Manager ({managers.length})</div>
              <MotionButton onClick={()=>setShowCM(true)} disabled={ac.length===0} style={{padding:'8px 18px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:6,opacity:ac.length===0?.4:1}}>
                <span className='material-symbols-outlined' style={{fontSize:16}}>person_add</span>Tạo Manager
              </MotionButton>
            </div>
            {loadM?<div style={{textAlign:'center',padding:32,color:'#94A3B8'}}>Đang tải dữ liệu...</div>:(
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'#F8FAFC'}}>{['ID','Họ và tên','Username','Email','Cơ sở','Trạng thái','Đăng nhập cuối','Thao tác'].map(h=><th key={h} style={THS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {managers.map(m=>(
                      <tr key={m.id} style={{borderBottom:'1px solid #F1F5F9'}}>
                        <td style={TDS}>#{m.id}</td>
                        <td style={{...TDS,fontWeight:700,color:'#0F172A'}}>{m.fullName}</td>
                        <td style={TDS}>{m.username}</td>
                        <td style={TDS}>{m.email}</td>
                        <td style={{...TDS,fontWeight:600,color:'#0F172A'}}>{m.centerName}</td>
                        <td style={TDS}><Badge status={m.status} /></td>
                        <td style={{...TDS,color:'#94A3B8',fontSize:11}}>{fmtDate(m.lastLoginAt)}</td>
                        <td style={TDS}>
                          <MotionButton onClick={()=>patchM(m)} disabled={saving==='m'+m.id} style={{padding:'4px 12px',borderRadius:6,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:11,fontWeight:600,color:'#475569'}}>
                            {saving==='m'+m.id?'...':m.status==='Active'?'Vô Hiệu Hóa':'Kích Hoạt'}
                          </MotionButton>
                        </td>
                      </tr>
                    ))}
                    {managers.length===0&&<tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'#CBD5E1'}}>Chưa có Manager nào.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab==='accounts'&&(
          <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#0F172A',marginBottom:16}}>Quản Lý Tài Khoản Toàn Hệ Thống</div>
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
              <input value={aQ} onChange={e=>{setAQ(e.target.value);setAPage(1);}} placeholder='Tìm username, email...' style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:13,outline:'none',minWidth:220}} />
              <select value={aRole} onChange={e=>{setARole(e.target.value);setAPage(1);}} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:13}}>
                <option value=''>Tất cả vai trò</option>
                {['Admin','Manager','Receptionist','Coach','Member'].map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              <select value={aSt} onChange={e=>{setASt(e.target.value);setAPage(1);}} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:13}}>
                <option value=''>Tất cả trạng thái</option>
                <option value='Active'>Hoạt động (Active)</option>
                <option value='Disabled'>Bị khóa (Disabled)</option>
              </select>
              <MotionButton onClick={loadAFn} style={{padding:'7px 16px',borderRadius:8,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:12,fontWeight:600,color:'#475569'}}>Tìm kiếm</MotionButton>
              <div style={{marginLeft:'auto',color:'#94A3B8',fontSize:12}}>Tổng: {aTotal} tài khoản</div>
            </div>
            {loadA?<div style={{textAlign:'center',padding:32,color:'#94A3B8'}}>Đang tải dữ liệu...</div>:(
              <div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr style={{background:'#F8FAFC'}}>{['ID','Username','Email','Vai trò','Cơ sở','Trạng thái','Bị khóa đến','Đăng nhập cuối','Thao tác'].map(h=><th key={h} style={THS}>{h}</th>)}</tr></thead>
                    <tbody>
                      {accs.map(a=>{
                        const lk=a.lockedUntil&&new Date(a.lockedUntil)>new Date();
                        return (
                          <tr key={a.id} style={{borderBottom:'1px solid #F1F5F9'}}>
                            <td style={TDS}>#{a.id}</td>
                            <td style={{...TDS,fontWeight:700,color:'#0F172A'}}>{a.username}</td>
                            <td style={TDS}>{a.email}</td>
                            <td style={TDS}><span style={{padding:'2px 8px',borderRadius:6,background:'#EFF6FF',color:'#1E40AF',fontSize:11,fontWeight:700}}>{a.role}</span></td>
                            <td style={TDS}>{a.centerName||'—'}</td>
                            <td style={TDS}><Badge status={lk?'Disabled':a.status} /></td>
                            <td style={{...TDS,color:lk?'#EF4444':'#94A3B8',fontSize:11}}>{lk?fmtDate(a.lockedUntil):'—'}</td>
                            <td style={{...TDS,color:'#94A3B8',fontSize:11}}>{fmtDate(a.lastLoginAt)}</td>
                            <td style={TDS}>
                              <div style={{display:'flex',gap:4}}>
                                {!lk&&a.role!=='Admin'&&<MotionButton onClick={()=>actA(a.id,'lock')} disabled={!!saving} title='Khóa tài khoản' whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid #FECACA',background:'#FEF2F2',fontSize:11,color:'#DC2626'}}><span className='material-symbols-outlined' style={{fontSize:14,verticalAlign:'middle'}}>lock</span></MotionButton>}
                                {lk&&<MotionButton onClick={()=>actA(a.id,'unlock')} disabled={!!saving} title='Mở khóa tài khoản' whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid #BBF7D0',background:'#F0FDF4',fontSize:11,color:'#16A34A'}}><span className='material-symbols-outlined' style={{fontSize:14,verticalAlign:'middle'}}>lock_open</span></MotionButton>}
                                {a.role!=='Admin'&&<MotionButton onClick={()=>actA(a.id,'revoke-sessions')} disabled={!!saving} title='Thu hồi phiên đăng nhập' whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:11,color:'#64748B'}}><span className='material-symbols-outlined' style={{fontSize:14,verticalAlign:'middle'}}>logout</span></MotionButton>}
                                {a.role==='Member'&&<MotionButton onClick={()=>deleteMember(a)} disabled={!!saving} title='Xóa tài khoản Member' whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid #FCA5A5',background:'#DC2626',fontSize:11,color:'#fff'}}><span className='material-symbols-outlined' style={{fontSize:14,verticalAlign:'middle'}}>delete_forever</span></MotionButton>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {accs.length===0&&<tr><td colSpan={9} style={{padding:32,textAlign:'center',color:'#CBD5E1'}}>Không có tài khoản nào.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {aPgs>1&&(
                  <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:16}}>
                    {Array.from({length:aPgs},(_,i)=>i+1).map(p=>(
                      <MotionButton key={p} onClick={()=>setAPage(p)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} style={{padding:'4px 12px',borderRadius:6,border:'1.5px solid #E2E8F0',background:p===aPage?'#2F7B5D':'#F8FAFC',color:p===aPage?'#fff':'#475569',fontSize:12,fontWeight:600}}>{p}</MotionButton>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

