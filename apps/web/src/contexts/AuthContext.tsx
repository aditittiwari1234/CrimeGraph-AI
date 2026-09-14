import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  badgeNumber?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Demo users for offline / no-backend mode ──────────────────────────────────
const DEMO_USERS: Record<string, User & { password: string }> = {
  admin: {
    id: 'demo-1', username: 'admin', email: 'admin@ncrb.gov.in',
    fullName: 'System Administrator', role: 'administrator',
    badgeNumber: 'ADMIN-001', department: 'NCRB',
    password: 'Demo@1234',
  },
  singh_si: {
    id: 'demo-2', username: 'singh_si', email: 'singh@ncrb.gov.in',
    fullName: 'Inspector A.K. Singh', role: 'senior_investigator',
    badgeNumber: 'SI-2024-001', department: 'Cyber Crime Wing',
    password: 'Demo@1234',
  },
  verma_inv: {
    id: 'demo-3', username: 'verma_inv', email: 'verma@ncrb.gov.in',
    fullName: 'Sub-Inspector R. Verma', role: 'investigator',
    badgeNumber: 'INV-2024-002', department: 'Financial Crimes',
    password: 'Demo@1234',
  },
  analyst_gupta: {
    id: 'demo-4', username: 'analyst_gupta', email: 'gupta@ncrb.gov.in',
    fullName: 'Analyst P. Gupta', role: 'analyst',
    badgeNumber: 'AN-2024-003', department: 'Intelligence Analysis',
    password: 'Demo@1234',
  },
};

const STORAGE_KEY = 'cg_demo_user';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api.post('/api/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    // 1. Try demo session first (always works offline)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setIsLoading(false);
        return;
      } catch { localStorage.removeItem(STORAGE_KEY); }
    }

    // 2. Try real JWT session
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const login = async (username: string, password: string) => {
    // ── Try real API first ──────────────────────────────────────────────────
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const { accessToken, refreshToken, user: userData } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(userData);
      return;
    } catch (apiErr: any) {
      // Only fall back to demo if it's a network/server-unavailable error
      const isNetworkError =
        !apiErr.response ||                        // no response = server down
        apiErr.response.status === 502 ||
        apiErr.response.status === 503 ||
        apiErr.response.status === 504 ||
        apiErr.code === 'ERR_NETWORK' ||
        apiErr.code === 'ECONNREFUSED';

      if (!isNetworkError) {
        // Real 401 / 400 — wrong password, don't fall through
        throw apiErr;
      }
    }

    // ── Offline demo fallback ───────────────────────────────────────────────
    const demo = DEMO_USERS[username];
    if (!demo) {
      throw new Error('User not found. Try a demo account.');
    }
    if (demo.password !== password) {
      throw new Error('Incorrect password. Demo password is Demo@1234');
    }

    const { password: _pw, ...demoUser } = demo;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
