import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a stored token and validate it
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('keyzen_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch {
        localStorage.removeItem('keyzen_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('keyzen_token');
    setUser(null);
  }, []);

  // Auto-lock: track setting reactively so timer updates without page reload
  const [autoLockMinutes, setAutoLockMinutes] = useState(
    () => parseInt(localStorage.getItem('keyzen_autolock') || '0')
  );

  // Listen for auto-lock setting changes (same tab and cross-tab)
  useEffect(() => {
    const syncAutoLock = () => {
      setAutoLockMinutes(parseInt(localStorage.getItem('keyzen_autolock') || '0'));
    };

    // Cross-tab changes fire 'storage'; same-tab changes need a custom event
    window.addEventListener('storage', syncAutoLock);
    window.addEventListener('keyzen_autolock_changed', syncAutoLock);

    return () => {
      window.removeEventListener('storage', syncAutoLock);
      window.removeEventListener('keyzen_autolock_changed', syncAutoLock);
    };
  }, []);

  // Auto-lock: log out after inactivity
  useEffect(() => {
    if (!autoLockMinutes || !user) return;

    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, autoLockMinutes * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, autoLockMinutes, logout]);

  // Step 1: Login with credentials (returns OTP requirement)
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    // Don't set user yet — OTP verification is needed
    return res.data;
  };

  // Step 2: Verify OTP and get full JWT token
  const verifyOTP = async (tempToken, otp) => {
    const res = await api.post('/auth/verify-otp', { tempToken, otp });
    localStorage.setItem('keyzen_token', res.data.token);
    setUser({ _id: res.data._id, name: res.data.name, email: res.data.email });
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOTP, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
