import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../services/http.js';

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
    try { await apiRequest('admin/centers',{method:'POST',body:JSON.stringify(form)}); onSaved(); }
    catch(e){ setErr(e.message||'Loi.'); } finally { setSaving(false); }
  };
  return (
    <div style={{position:'fixed',inset:0,background:'#0008',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:20,padding:32,width:'100%',maxWidth:480,boxShadow:'0 20px 60px #0003'}}>
        <h3 style={{margin:0,fontSize:18,fontWeight:800,color:'#0F172A'}}>Tao Co So Moi</h3>
        <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:12}}>
          {[['Ten co so *','name','text'],['Dia chi *','address','text'],['SDT','phone','tel'],['Email','email','email']].map(([lbl,key,type])=>(
            <label key={key} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
              {lbl}
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}} />
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
            Trang Thai
            <select value={form.status} onChange={e=>set('status',e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}}>
              {['Active','Inactive','Disabled'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        {err&&<div style={{marginTop:10,color:'#DC2626',fontSize:12}}>{err}</div>}
        <div style={{marginTop:20,display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 20px',borderRadius:8,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:13,fontWeight:600,cursor:'pointer'}}>Huy</button>
          <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',opacity:saving?.6:1}}>{saving?'Dang luu...':'Tao Co So'}</button>
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
    try { await apiRequest('admin/managers',{method:'POST',body:JSON.stringify({...form,centerId:Number(form.centerId)})}); onSaved(); }
    catch(e){ setErr(e.message||'Loi.'); } finally { setSaving(false); }
  };
  return (
    <div style={{position:'fixed',inset:0,background:'#0008',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:20,padding:32,width:'100%',maxWidth:480,boxShadow:'0 20px 60px #0003'}}>
        <h3 style={{margin:0,fontSize:18,fontWeight:800,color:'#0F172A'}}>Tao Tai Khoan Manager</h3>
        <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:12}}>
          {[['Ho ten *','fullName','text'],['Username *','username','text'],['Email *','email','email'],['Mat khau *','password','password'],['SDT','phone','tel']].map(([lbl,key,type])=>(
            <label key={key} style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
              {lbl}
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}} />
            </label>
          ))}
          <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:12,fontWeight:600,color:'#475569'}}>
            Co So *
            <select value={form.centerId} onChange={e=>set('centerId',e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:14}}>
              {ac.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {err&&<div style={{marginTop:10,color:'#DC2626',fontSize:12}}>{err}</div>}
        <div style={{marginTop:20,display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 20px',borderRadius:8,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:13,fontWeight:600,cursor:'pointer'}}>Huy</button>
          <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',opacity:saving?.6:1}}>{saving?'Dang luu...':'Tao'}</button>
        </div>
      </div>
    </div>
  );
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
      await apiRequest('admin/centers/'+id,{method:'PATCH',body:JSON.stringify({...c,status:cs==='Active'?'Inactive':'Active'})});
      loadCFn(); loadOvFn();
    }catch(e){ setErr(e.message); }finally{ setSaving(null); }
  };
  const patchM = async(m)=>{
    setSaving('m'+m.id); setErr('');
    try{
      await apiRequest('admin/managers/'+m.id,{method:'PATCH',body:JSON.stringify({fullName:m.fullName,centerId:m.centerId,status:m.status==='Active'?'Disabled':'Active'})});
      loadMFn(); loadOvFn();
    }catch(e){ setErr(e.message); }finally{ setSaving(null); }
  };
  const actA = async(id,action)=>{
    const reason=window.prompt('Ly do:'); if(!reason) return;
    setSaving('a'+id); setErr('');
    try{ await apiRequest('admin/accounts/'+id+'/'+action,{method:'POST',body:JSON.stringify({reason})}); loadAFn(); loadOvFn(); }
    catch(e){ setErr(e.message); }finally{ setSaving(null); }
  };

  const ac = centers.filter(c=>c.status==='Active');
  const aPgs = Math.ceil(aTotal/PS);
  const TABS = [{id:'overview',l:'Tong Quan',i:'dashboard'},{id:'centers',l:'Co So',i:'account_tree'},{id:'managers',l:'Managers',i:'manage_accounts'},{id:'accounts',l:'Tai Khoan',i:'group'}];
  const THS = {padding:'10px 12px',textAlign:'left',fontWeight:700,color:'#475569',fontSize:11,textTransform:'uppercase',borderBottom:'2px solid #E2E8F0',whiteSpace:'nowrap'};
  const TDS = {padding:'10px 12px'};

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'Inter,sans-serif'}}>
      {showCC&&<CenterModal onClose={()=>setShowCC(false)} onSaved={()=>{setShowCC(false);loadCFn();loadOvFn();}} />}
      {showCM&&<ManagerModal centers={centers} onClose={()=>setShowCM(false)} onSaved={()=>{setShowCM(false);loadMFn();loadOvFn();}} />}

      <div style={{position:'relative',overflow:'hidden',background:OG,padding:'40px 32px 48px'}}>
        <div style={{position:'absolute',top:-60,right:-60,width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle,#F2CC8F55 0%,transparent 70%)',pointerEvents:'none'}} />
        <svg style={{position:'absolute',right:24,top:16,opacity:.12}} width='220' height='90' viewBox='0 0 220 90' fill='none'>
          <circle cx='30' cy='45' r='28' stroke='white' strokeWidth='5' fill='none'/>
          <circle cx='80' cy='25' r='28' stroke='white' strokeWidth='5' fill='none'/>
          <circle cx='130' cy='45' r='28' stroke='white' strokeWidth='5' fill='none'/>
          <circle cx='180' cy='25' r='28' stroke='white' strokeWidth='5' fill='none'/>
          <circle cx='105' cy='65' r='28' stroke='white' strokeWidth='5' fill='none'/>
        </svg>
        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.18)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.35)',borderRadius:999,padding:'6px 16px',marginBottom:16}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#fff',display:'inline-block'}} />
            <span style={{fontSize:12,fontWeight:700,color:'#fff',letterSpacing:'.08em'}}>ADMIN - HE THONG</span>
          </div>
          <h1 style={{margin:0,fontSize:28,fontWeight:900,color:'#fff'}}>Bang Quan Tri He Thong</h1>
          <p style={{margin:'8px 0 0',fontSize:14,color:'rgba(255,255,255,0.8)'}}>Quan ly co so, Manager va phan quyen SCMS</p>
          {!loadOv&&ov&&(
            <div style={{display:'flex',gap:12,marginTop:24,flexWrap:'wrap'}}>
              {[['account_tree',ov.activeCenterCount,'Co So'],['manage_accounts',ov.activeManagerCount,'Managers'],['lock',ov.lockedAccountCount,'Bi Khoa'],['group',ov.totalAccountCount,'Tong TK']].map(([ic,val,lbl])=>(
                <div key={lbl} style={{background:'rgba(255,255,255,0.18)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:12,padding:'12px 20px',display:'flex',alignItems:'center',gap:10,minWidth:130}}>
                  <span className='material-symbols-outlined' style={{color:'#fff',fontSize:22}}>{ic}</span>
                  <div>
                    <div style={{fontSize:22,fontWeight:900,color:'#fff',lineHeight:1}}>{val??'—'}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.75)',fontWeight:600}}>{lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{background:'#fff',borderBottom:'1.5px solid #E2E8F0',padding:'0 32px',display:'flex',gap:4,overflowX:'auto'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:'14px 20px',border:'none',background:'none',cursor:'pointer',fontSize:13,fontWeight:tab===t.id?800:600,color:tab===t.id?'#2F7B5D':'#64748B',borderBottom:tab===t.id?'3px solid #2F7B5D':'3px solid transparent',display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap'}}>
            <span className='material-symbols-outlined' style={{fontSize:18}}>{t.i}</span>{t.l}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center'}}>
          <button onClick={()=>{loadOvFn();loadCFn();loadMFn();if(tab==='accounts')loadAFn();}} style={{padding:'6px 14px',borderRadius:8,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:12,fontWeight:600,cursor:'pointer',color:'#475569',display:'flex',alignItems:'center',gap:4,margin:'8px 0'}}>
            <span className='material-symbols-outlined' style={{fontSize:15}}>refresh</span>Lam Moi
          </button>
        </div>
      </div>

      <div style={{padding:'28px 32px',maxWidth:1400,margin:'0 auto'}}>
        {err&&<div style={{marginBottom:12,color:'#DC2626',fontSize:12,background:'#FEF2F2',borderRadius:8,padding:'8px 12px'}}>{err}</div>}
        {tab==='overview'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:24}}>
              {[{i:'account_tree',l:'Co So Hoat Dong',v:ov?.activeCenterCount,a:'#10B981'},{i:'manage_accounts',l:'Manager Hoat Dong',v:ov?.activeManagerCount,a:'#3B82F6'},{i:'lock',l:'Tai Khoan Bi Khoa',v:ov?.lockedAccountCount,a:'#EF4444'},{i:'group',l:'Tong Tai Khoan',v:ov?.totalAccountCount,a:'#F59E0B'}].map(x=>(
                <div key={x.l} style={{background:'#fff',borderRadius:16,padding:'20px 24px',boxShadow:'0 1px 6px #0001',border:'1.5px solid '+x.a+'22',display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:48,height:48,borderRadius:14,background:x.a+'18',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span className='material-symbols-outlined' style={{color:x.a,fontSize:26}}>{x.i}</span>
                  </div>
                  <div>
                    <div style={{fontSize:26,fontWeight:800,color:'#0F172A',lineHeight:1}}>{x.v??'—'}</div>
                    <div style={{fontSize:12,color:'#64748B',fontWeight:600,marginTop:2}}>{x.l}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              {[['Co So',centers,'centers'],['Manager',managers,'managers']].map(([ttl,list,sid])=>(
                <div key={ttl} style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <div style={{fontWeight:800,fontSize:14,color:'#0F172A'}}>{ttl}</div>
                    <button onClick={()=>setTab(sid)} style={{fontSize:12,color:'#2F7B5D',fontWeight:600,background:'none',border:'none',cursor:'pointer'}}>Xem tat ca →</button>
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
                  {list.length===0&&<div style={{color:'#CBD5E1',fontSize:13,textAlign:'center',padding:16}}>Chua co du lieu</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==='centers'&&(
          <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0F172A'}}>Danh Sach Co So ({centers.length})</div>
              <button onClick={()=>setShowCC(true)} style={{padding:'8px 18px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                <span className='material-symbols-outlined' style={{fontSize:16}}>add</span>Tao Co So
              </button>
            </div>
            {loadC?<div style={{textAlign:'center',padding:32,color:'#94A3B8'}}>Dang tai...</div>:(
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'#F8FAFC'}}>{['ID','Ten','Dia Chi','Phone','Email','Trang Thai','Tao Luc',''].map(h=><th key={h} style={THS}>{h}</th>)}</tr></thead>
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
                          <button onClick={()=>patchC(c.id,c.status)} disabled={saving==='c'+c.id} style={{padding:'4px 12px',borderRadius:6,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:11,fontWeight:600,cursor:'pointer',color:'#475569'}}>
                            {saving==='c'+c.id?'...':c.status==='Active'?'Vo Hieu':'Kich Hoat'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {centers.length===0&&<tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'#CBD5E1'}}>Chua co co so nao.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab==='managers'&&(
          <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:800,color:'#0F172A'}}>Tai Khoan Manager ({managers.length})</div>
              <button onClick={()=>setShowCM(true)} disabled={ac.length===0} style={{padding:'8px 18px',borderRadius:8,border:'none',background:OG,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6,opacity:ac.length===0?.4:1}}>
                <span className='material-symbols-outlined' style={{fontSize:16}}>person_add</span>Tao Manager
              </button>
            </div>
            {loadM?<div style={{textAlign:'center',padding:32,color:'#94A3B8'}}>Dang tai...</div>:(
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'#F8FAFC'}}>{['ID','Ho Ten','Username','Email','Co So','Trang Thai','Dang Nhap Cuoi',''].map(h=><th key={h} style={THS}>{h}</th>)}</tr></thead>
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
                          <button onClick={()=>patchM(m)} disabled={saving==='m'+m.id} style={{padding:'4px 12px',borderRadius:6,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:11,fontWeight:600,cursor:'pointer',color:'#475569'}}>
                            {saving==='m'+m.id?'...':m.status==='Active'?'Vo Hieu':'Kich Hoat'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {managers.length===0&&<tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'#CBD5E1'}}>Chua co Manager nao.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab==='accounts'&&(
          <div style={{background:'#fff',borderRadius:16,padding:24,boxShadow:'0 1px 6px #0001',border:'1.5px solid #E2E8F0'}}>
            <div style={{fontSize:15,fontWeight:800,color:'#0F172A',marginBottom:16}}>Quan Ly Tai Khoan Toan He Thong</div>
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
              <input value={aQ} onChange={e=>{setAQ(e.target.value);setAPage(1);}} placeholder='Tim username/email...' style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:13,outline:'none',minWidth:200}} />
              <select value={aRole} onChange={e=>{setARole(e.target.value);setAPage(1);}} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:13}}>
                <option value=''>Tat ca Role</option>
                {['Admin','Manager','Receptionist','Coach','Member'].map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              <select value={aSt} onChange={e=>{setASt(e.target.value);setAPage(1);}} style={{padding:'7px 12px',borderRadius:8,border:'1.5px solid #E2E8F0',fontSize:13}}>
                <option value=''>Tat ca Trang Thai</option>
                {['Active','Disabled'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={loadAFn} style={{padding:'7px 14px',borderRadius:8,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:12,fontWeight:600,cursor:'pointer',color:'#475569'}}>Tim</button>
              <div style={{marginLeft:'auto',color:'#94A3B8',fontSize:12}}>Tong: {aTotal} tai khoan</div>
            </div>
            {loadA?<div style={{textAlign:'center',padding:32,color:'#94A3B8'}}>Dang tai...</div>:(
              <div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                    <thead><tr style={{background:'#F8FAFC'}}>{['ID','Username','Email','Role','Co So','Trang Thai','Bi Khoa Den','Dang Nhap Cuoi','Thao Tac'].map(h=><th key={h} style={THS}>{h}</th>)}</tr></thead>
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
                                {!lk&&a.role!=='Admin'&&<button onClick={()=>actA(a.id,'lock')} disabled={!!saving} title='Khoa' style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid #FECACA',background:'#FEF2F2',fontSize:11,cursor:'pointer',color:'#DC2626'}}><span className='material-symbols-outlined' style={{fontSize:14,verticalAlign:'middle'}}>lock</span></button>}
                                {lk&&<button onClick={()=>actA(a.id,'unlock')} disabled={!!saving} title='Mo khoa' style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid #BBF7D0',background:'#F0FDF4',fontSize:11,cursor:'pointer',color:'#16A34A'}}><span className='material-symbols-outlined' style={{fontSize:14,verticalAlign:'middle'}}>lock_open</span></button>}
                                {a.role!=='Admin'&&<button onClick={()=>actA(a.id,'revoke-sessions')} disabled={!!saving} title='Thu hoi phien' style={{padding:'4px 8px',borderRadius:6,border:'1.5px solid #E2E8F0',background:'#F8FAFC',fontSize:11,cursor:'pointer',color:'#64748B'}}><span className='material-symbols-outlined' style={{fontSize:14,verticalAlign:'middle'}}>logout</span></button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {accs.length===0&&<tr><td colSpan={9} style={{padding:32,textAlign:'center',color:'#CBD5E1'}}>Khong co tai khoan nao.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {aPgs>1&&(
                  <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:16}}>
                    {Array.from({length:aPgs},(_,i)=>i+1).map(p=>(
                      <button key={p} onClick={()=>setAPage(p)} style={{padding:'4px 12px',borderRadius:6,border:'1.5px solid #E2E8F0',background:p===aPage?'#2F7B5D':'#F8FAFC',color:p===aPage?'#fff':'#475569',fontSize:12,fontWeight:600,cursor:'pointer'}}>{p}</button>
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
