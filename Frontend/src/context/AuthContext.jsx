import { authApi } from '../services/api.js';
import { getApiToken } from '../services/http.js';
import { assertAuthUser, getAuthVersion } from '../services/authState.js';

const { createContext, useContext, useState, useEffect } = React;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(() => Boolean(getApiToken()));
  const [initializationError, setInitializationError] = useState('');

  const applyUser = user => {
    assertAuthUser(user);
    setCurrentUser(user);
    return user;
  };

  useEffect(() => {
    let active = true;
    if (!getApiToken()) { setInitializing(false); return; }
    const version = getAuthVersion();
    authApi.getCurrentUser().then(user => {
      if (active) applyUser(user);
    }).catch(error => {
      if (!active || version !== getAuthVersion()) return;
      setCurrentUser(null);
      if (error.status !== 401) setInitializationError(error.message);
    }).finally(() => { if (active) setInitializing(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleExpiredToken = () => setCurrentUser(null);
    window.addEventListener('scms:auth-expired', handleExpiredToken);
    return () => window.removeEventListener('scms:auth-expired', handleExpiredToken);
  }, []);

  const refreshUser = async () => {
    if (!currentUser) return;
    const fresh = await authApi.getCurrentUser();
    return applyUser(fresh);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      return applyUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const newUser = await authApi.register(userData);
      return applyUser(newUser);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleUser) => {
    setLoading(true);
    try {
      const res = await authApi.loginWithGoogle(googleUser);
      return applyUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  const updateProfile = async (profileData) => {
    if (!currentUser) return;
    const updated = await authApi.updateProfile(currentUser.id, profileData);
    return applyUser(updated);
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return;
    const updated = await authApi.changePassword(currentUser.id, currentPassword, newPassword);
    return applyUser(updated);
  };

  const value = {
    currentUser,
    role: currentUser?.role || null,
    isAuthenticated: Boolean(currentUser),
    loading,
    initializing,
    initializationError,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
