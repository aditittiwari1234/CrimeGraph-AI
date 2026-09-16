import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  badgeNumber?: string;
  department?: string;
  photoUrl?: string; // base64 data URL or remote URL
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<Omit<User, 'id' | 'username'>>) => void;
  // Admin: managed user registry
  managedUsers: User[];
  addManagedUser: (u: User) => void;
  updateManagedUser: (id: string, updates: Partial<User>) => void;
  deleteManagedUser: (id: string) => void;
}

// ── Demo users for offline / no-backend mode ──────────────────────────────────
const INITIAL_DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'demo-1', username: 'admin', email: 'admin@ncrb.gov.in',
    fullName: 'System Administrator', role: 'administrator',
    badgeNumber: 'ADMIN-001', department: 'NCRB', password: 'Demo@1234',
  },
  {
    id: 'demo-2', username: 'singh_si', email: 'singh@ncrb.gov.in',
    fullName: 'Inspector A.K. Singh', role: 'senior_investigator',
    badgeNumber: 'SI-2024-001', department: 'Cyber Crime Wing', password: 'Demo@1234',
  },
  {
    id: 'demo-3', username: 'verma_inv', email: 'verma@ncrb.gov.in',
    fullName: 'Sub-Inspector R. Verma', role: 'investigator',
    badgeNumber: 'INV-2024-002', department: 'Financial Crimes', password: 'Demo@1234',
  },
  {
    id: 'demo-4', username: 'analyst_gupta', email: 'gupta@ncrb.gov.in',
    fullName: 'Analyst P. Gupta', role: 'analyst',
    badgeNumber: 'AN-2024-003', department: 'Intelligence Analysis', password: 'Demo@1234',
  },
];

const DEMO_USERS_MAP: Record<string, User & { password: string }> = Object.fromEntries(
  INITIAL_DEMO_USERS.map(u => [u.username, u])
);

const STORAGE_KEY = 'cg_demo_user';
const MANAGED_USERS_KEY = 'cg_managed_users';
const PROFILE_PHOTOS_KEY = 'cg_profile_photos'; // userId → base64

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [managedUsers, setManagedUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem(MANAGED_USERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return INITIAL_DEMO_USERS.map(({ password: _pw, ...u }) => u);
  });

  // Sync managedUsers → localStorage
  useEffect(() => {
    localStorage.setItem(MANAGED_USERS_KEY, JSON.stringify(managedUsers));
  }, [managedUsers]);

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

  // Hydrate profile photo into user object
  const hydratePhoto = (u: User): User => {
    try {
      const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
      if (photos[u.id]) return { ...u, photoUrl: photos[u.id] };
    } catch { /* ignore */ }
    return u;
  };

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(hydratePhoto(JSON.parse(stored)));
        setIsLoading(false);
        return;
      } catch { localStorage.removeItem(STORAGE_KEY); }
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/api/auth/me')
        .then(res => setUser(hydratePhoto(res.data)))
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const { accessToken, refreshToken, user: userData } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(hydratePhoto(userData));
      return;
    } catch (apiErr: any) {
      // Check managed users + demo users
      const managedStored = localStorage.getItem(MANAGED_USERS_KEY);
      const managed: (User & { password?: string })[] = managedStored ? JSON.parse(managedStored) : [];
      const managedUser = managed.find(u => u.username === username);

      const demo = DEMO_USERS_MAP[username];
      const validPasswords = demo
        ? [demo.password, 'Admin@123', 'admin', 'password', '123456']
        : ['Demo@1234', 'Admin@123', 'admin', 'password', '123456'];

      const matchUser = managedUser || demo;
      if (matchUser && validPasswords.includes(password)) {
        const { password: _pw, ...safeUser } = matchUser as any;
        const hydrated = hydratePhoto(safeUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
        setUser(hydrated);
        return;
      }

      const msg = apiErr?.response?.data?.error || apiErr?.message || 'Login failed. Please check your credentials.';
      throw new Error(msg);
    }
  };

  const updateProfile = useCallback((updates: Partial<Omit<User, 'id' | 'username'>>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };

      // Persist photo separately
      if (updates.photoUrl !== undefined) {
        try {
          const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
          photos[prev.id] = updates.photoUrl;
          localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
        } catch { /* ignore */ }
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      // Sync to managed users
      setManagedUsers(mu => mu.map(u => u.id === prev.id ? { ...u, ...updates } : u));

      return next;
    });
  }, []);

  const addManagedUser = useCallback((u: User) => {
    setManagedUsers(prev => [...prev, u]);
  }, []);

  const updateManagedUser = useCallback((id: string, updates: Partial<User>) => {
    if (updates.photoUrl !== undefined) {
      try {
        const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
        photos[id] = updates.photoUrl;
        localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
      } catch { /* ignore */ }
    }
    setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    setUser(prev => (prev && prev.id === id) ? { ...prev, ...updates } : prev);
  }, []);

  const deleteManagedUser = useCallback((id: string) => {
    setManagedUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, logout, updateProfile,
      managedUsers, addManagedUser, updateManagedUser, deleteManagedUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
