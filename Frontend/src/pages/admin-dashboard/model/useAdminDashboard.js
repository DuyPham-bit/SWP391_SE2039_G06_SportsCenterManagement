import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../../shared/ui/toast/ToastContext.jsx';
import { adminApi } from '../../../entities/center/index.js';

export function useAdminDashboard({ initialSection }) {
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

  // Accounts filter & pagination state
  const [aPage, setAPage] = useState(1);
  const [aTotal, setATotal] = useState(0);
  const [aQ, setAQ] = useState('');
  const [aRole, setARole] = useState('');
  const [aSt, setASt] = useState('');

  // Centers & Managers local search state
  const [centerSearch, setCenterSearch] = useState('');
  const [centerStatusFilter, setCenterStatusFilter] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [managerCenterFilter, setManagerCenterFilter] = useState('');

  // Modals state
  const [showCC, setShowCC] = useState(false);
  const [showCM, setShowCM] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const toast = useToast?.() || {};
  const showSuccess = toast.showSuccess || console.log;
  const showError = toast.showError || console.error;
  const PS = 20;

  // Sync tab with URL hash
  const switchTab = (newTab) => {
    setTab(newTab);
    const hashMap = {
      overview: '#/admin/dashboard',
      centers: '#/admin/centers',
      managers: '#/admin/managers',
      accounts: '#/admin/accounts'
    };
    if (hashMap[newTab] && window.location.hash !== hashMap[newTab]) {
      window.location.hash = hashMap[newTab];
    }
  };

  // Sync when initialSection changes
  useEffect(() => {
    if (initialSection) setTab(initialSection);
  }, [initialSection]);

  const loadOvFn = useCallback(async () => {
    setLoadOv(true);
    try {
      setOv(await adminApi.getOverview());
    } catch (e) {
      // ignore
    } finally {
      setLoadOv(false);
    }
  }, []);

  const loadCFn = useCallback(async () => {
    setLoadC(true);
    try {
      const d = await adminApi.getCenters();
      setCenters(Array.isArray(d) ? d : []);
    } catch {
      // ignore
    } finally {
      setLoadC(false);
    }
  }, []);

  const loadMFn = useCallback(async () => {
    setLoadM(true);
    try {
      const d = await adminApi.getManagers();
      setManagers(Array.isArray(d) ? d : []);
    } catch {
      // ignore
    } finally {
      setLoadM(false);
    }
  }, []);

  const loadAFn = useCallback(async () => {
    setLoadA(true);
    try {
      const r = await adminApi.getAccounts({ role: aRole, status: aSt, query: aQ, page: aPage, pageSize: PS });
      setAccs(Array.isArray(r?.items) ? r.items : []);
      setATotal(r?.totalCount || 0);
    } catch {
      // ignore
    } finally {
      setLoadA(false);
    }
  }, [aPage, aQ, aRole, aSt]);

  useEffect(() => {
    loadOvFn();
    loadCFn();
    loadMFn();
  }, [loadOvFn, loadCFn, loadMFn]);

  useEffect(() => {
    if (tab === 'accounts') loadAFn();
  }, [tab, loadAFn]);

  // Patch Center Status
  const patchC = async (id, currentStatus) => {
    setSaving('c' + id);
    setErr('');
    try {
      const c = centers.find((x) => x.id === id);
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await adminApi.updateCenter(id, { ...c, status: newStatus });
      showSuccess(`Đã chuyển cơ sở "${c.name}" sang trạng thái "${newStatus}".`);
      loadCFn();
      loadOvFn();
    } catch (e) {
      setErr(e.message || 'Cập nhật trạng thái cơ sở thất bại.');
      showError(e.message || 'Cập nhật trạng thái cơ sở thất bại.');
    } finally {
      setSaving(null);
    }
  };

  // Patch Manager Status
  const patchM = async (m) => {
    setSaving('m' + m.id);
    setErr('');
    try {
      const newStatus = m.status === 'Active' ? 'Disabled' : 'Active';
      await adminApi.updateManager(m.id, { fullName: m.fullName, centerId: m.centerId, status: newStatus });
      showSuccess(`Đã chuyển tài khoản Manager "${m.fullName}" sang "${newStatus}".`);
      loadMFn();
      loadOvFn();
    } catch (e) {
      setErr(e.message || 'Cập nhật trạng thái Manager thất bại.');
      showError(e.message || 'Cập nhật trạng thái Manager thất bại.');
    } finally {
      setSaving(null);
    }
  };

  // Execute Account Actions
  const handleExecuteAction = async (finalReason) => {
    if (!confirmAction) return;
    const { type, account } = confirmAction;
    setSaving('a' + account.id);
    setErr('');
    try {
      if (type === 'delete') {
        await adminApi.deleteAccount(account.id, finalReason);
        showSuccess(`Đã xóa và ẩn danh thông tin tài khoản Member "${account.username}".`);
      } else {
        const actions = { lock: adminApi.lockAccount, unlock: adminApi.unlockAccount, 'revoke-sessions': adminApi.revokeSessions };
        if (!actions[type]) throw new Error('Thao tác tài khoản không hợp lệ.');
        await actions[type](account.id, finalReason);
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

  const activeCenters = useMemo(() => centers.filter((c) => c.status === 'Active'), [centers]);
  const aPgs = Math.ceil(aTotal / PS) || 1;

  // Filtered Centers
  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchQ = !centerSearch.trim() ||
        c.name.toLowerCase().includes(centerSearch.toLowerCase()) ||
        (c.address || '').toLowerCase().includes(centerSearch.toLowerCase()) ||
        (c.phone || '').includes(centerSearch);
      const matchSt = !centerStatusFilter || c.status === centerStatusFilter;
      return matchQ && matchSt;
    });
  }, [centers, centerSearch, centerStatusFilter]);

  // Filtered Managers
  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      const matchQ = !managerSearch.trim() ||
        (m.fullName || '').toLowerCase().includes(managerSearch.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(managerSearch.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(managerSearch.toLowerCase());
      const matchC = !managerCenterFilter || String(m.centerId) === String(managerCenterFilter);
      return matchQ && matchC;
    });
  }, [managers, managerSearch, managerCenterFilter]);

  const TABS = [
    { id: 'overview', l: 'Tổng Quan', i: 'dashboard' },
    { id: 'centers', l: 'Cơ Sở', i: 'account_tree', count: centers.length },
    { id: 'managers', l: 'Managers', i: 'manage_accounts', count: managers.length },
    { id: 'accounts', l: 'Tài Khoản', i: 'group', count: aTotal || null }
  ];

  return {
    PS, TABS, aPage, aPgs, aQ, aRole, aSt, aTotal, accs, actA, activeCenters, centerSearch,
    centerStatusFilter, centers, confirmAction, deleteMember, err, filteredCenters, filteredManagers,
    handleExecuteAction, loadA, loadAFn, loadC, loadCFn, loadM, loadMFn, loadOv, loadOvFn,
    managerCenterFilter, managerSearch, managers, ov, patchC, patchM, saving, setAPage, setAQ,
    setARole, setASt, setCenterSearch, setCenterStatusFilter, setConfirmAction, setErr,
    setManagerCenterFilter, setManagerSearch, setShowCC, setShowCM, showCC, showCM, showSuccess,
    switchTab, tab
  };
}
