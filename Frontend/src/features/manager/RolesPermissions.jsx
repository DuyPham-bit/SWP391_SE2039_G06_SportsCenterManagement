import React, { useEffect, useState } from 'react';
import { systemApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { SYSTEM_CAPABILITIES } from '../../services/permissions.js';

export function RolesPermissions() {
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [matrix, setMatrix] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [codes, setCodes] = useState([]);
  const [caps, setCaps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const isCenter = currentUser?.role === 'MANAGER';
  const selected = matrix.find(r => String(r.roleId) === String(roleId));
  const choose = row => { setRoleId(row.roleId); setCodes((row.permissions || []).map(p => p.code)); setCaps(row.capabilityIds || []); };
  useEffect(() => {
    systemApi.getPermissions().then(rows => { setMatrix(rows); if (rows[0]) choose(rows[0]); }).catch(e => showError(e.message)).finally(() => setLoading(false));
  }, []);
  const toggle = (value, setter) => setter(prev => prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]);
  const save = async () => {
    setBusy(true);
    try {
      await systemApi.updatePermissions(roleId, codes, caps);
      const rows = await systemApi.getPermissions(); setMatrix(rows);
      const row = rows.find(r => String(r.roleId) === String(roleId)); if (row) choose(row);
      showSuccess('Đã lưu phân quyền. API áp dụng từ request tiếp theo; giao diện cập nhật khi đăng nhập lại.');
    } catch (e) { showError(e.message); } finally { setBusy(false); }
  };
  if (loading) return <p>Đang tải phân quyền...</p>;
  return <div className="space-y-5">
    <h1 className="text-2xl font-bold">{isCenter ? 'Phân quyền trong trung tâm' : 'Ma trận quyền hệ thống'}</h1>
    <p>{isCenter ? 'Quyền áp dụng riêng cho trung tâm này. Chỉ cấp trong phạm vi nghiệp vụ của từng vai trò.' : 'Thay đổi ma trận quyền toàn hệ thống.'}</p>
    <select className="border rounded p-2" disabled={busy} value={roleId} onChange={e => choose(matrix.find(r => String(r.roleId) === e.target.value))}>{matrix.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}</select>
    {selected && <>
      {isCenter && <section className="space-y-2"><h2 className="font-bold">Chức năng</h2>{(selected.availableCapabilities || []).map(id => <label className="block" key={id}><input type="checkbox" disabled={busy} checked={caps.includes(id)} onChange={() => toggle(id,setCaps)} /> {SYSTEM_CAPABILITIES.find(c => c.id === id)?.label || id}</label>)}</section>}
      <section className="space-y-2"><h2 className="font-bold">Quyền dữ liệu</h2>{(selected.availablePermissions || selected.permissions || []).map(p => <label className="block" key={p.code}><input type="checkbox" disabled={busy} checked={codes.includes(p.code)} onChange={() => toggle(p.code,setCodes)} /> {p.name} <span className="text-xs text-slate-500">({p.code})</span></label>)}</section>
      <button className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50" disabled={busy} onClick={save}>{busy ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
    </>}
    {!selected && <p>Không có vai trò khả dụng hoặc tài khoản chưa đủ quyền.</p>}
  </div>;
}
