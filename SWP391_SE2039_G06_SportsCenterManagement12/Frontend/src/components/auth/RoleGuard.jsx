import { useAuth } from '../../context/AuthContext.js';
import { hasCapability, getCapabilityById } from '../../services/permissions.js';

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    window.location.hash = '#/login';
    return null;
  }

  return children;
}

export function RoleGuard({ allowedRoles = [], requiredCapability, children }) {
  const { role } = useAuth();
  const normalizedRole = String(role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map(r => String(r).toUpperCase());

  // 1. Manager and Admin/SystemAdmin have superuser access
  const isSuperUser = normalizedRole === 'MANAGER' || normalizedRole === 'ADMIN' || normalizedRole === 'SYSTEMADMIN';
  // 2. Direct role match
  // 3. User's role has the specific capability granted via Roles & Permissions matrix
  const isRoleAllowed = normalizedAllowed.includes(normalizedRole);
  const hasCap = requiredCapability ? hasCapability(normalizedRole, requiredCapability) : false;
  const isAllowed = isSuperUser || (isRoleAllowed && (!requiredCapability || hasCap));

  if (!isAllowed) {
    const capInfo = requiredCapability ? getCapabilityById(requiredCapability) : null;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[36px]">gpp_bad</span>
        </div>
        <h2 className="font-chivo text-2xl font-black text-slate-900 tracking-tight">
          QUYỀN TRUY CẬP BỊ TỪ CHỐI
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-sm">
          Tài khoản hiện tại với vai trò <span className="font-bold text-red-600">{role}</span> chưa được cấp quyền truy cập vào chức năng này.
        </p>

        {capInfo && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-left w-full text-xs">
            <span className="font-bold text-red-800 block mb-1">Yêu cầu quyền hạn trong Ma trận phân quyền:</span>
            <div className="flex items-center gap-2 text-slate-800 mt-1">
              <span className="material-symbols-outlined text-[18px] text-red-600">{capInfo.icon}</span>
              <strong className="font-bold">{capInfo.label}</strong>
              <code className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-mono">({capInfo.id})</code>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Quản trị viên cần kích hoạt quyền này trong mục <strong>Vai Trò & Phân Quyền</strong> để vai trò của bạn có thể thực hiện.
            </p>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 w-full text-xs text-left">
          <span className="font-bold text-slate-700 block mb-2">Vai trò mặc định được phép:</span>
          <div className="flex flex-wrap gap-2">
            {allowedRoles.map(r => (
              <span
                key={r}
                className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-bold tracking-wider text-xs"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            switch (normalizedRole) {
              case 'SYSTEMADMIN':
              case 'ADMIN':
              case 'MANAGER': window.location.hash = '#/manager/dashboard'; break;
              case 'RECEPTIONIST': window.location.hash = '#/receptionist/dashboard'; break;
              case 'COACH': window.location.hash = '#/coach/dashboard'; break;
              case 'MEMBER': window.location.hash = '#/member/dashboard'; break;
              default: window.location.hash = '#/';
            }
          }}
          className="mt-6 px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
        >
          Quay lại Bảng điều khiển của tôi
        </button>
      </div>
    );
  }

  return children;
}
