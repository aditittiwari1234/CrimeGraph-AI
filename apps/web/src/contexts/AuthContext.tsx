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
  isActive?: boolean;
  lastLogin?: string | Date;
  updatedAt?: string | Date;
  auditLogsCount?: number;
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
  addManagedUser: (u: User & { password?: string }) => Promise<User>;
  updateManagedUser: (id: string, updates: Partial<User> & { password?: string }) => Promise<User>;
  deleteManagedUser: (id: string) => Promise<void>;
  refreshManagedUsers: () => Promise<{ success: boolean; count?: number; error?: string }>;
}

// ── Demo users for offline / no-backend mode ──────────────────────────────────
const INITIAL_DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'USR-001', username: 'admin', email: 'admin@crimegraph.ai',
    fullName: 'System Administrator', role: 'administrator',
    badgeNumber: 'ADMIN-001', department: 'CrimeGraph AI Master Operations', password: 'Demo@1234',
  },
  {
    id: 'USR-002', username: 'singh_si', email: 'inspector.singh@ncrb.gov.in',
    fullName: 'Inspector Rajendra Singh', role: 'senior_investigator',
    badgeNumber: 'SI-2024-042', department: 'NCRB — Women Safety & Special Crimes', password: 'Demo@1234',
  },
  {
    id: 'USR-003', username: 'verma_inv', email: 'investigator.verma@ncrb.gov.in',
    fullName: 'Sub-Inspector Priya Verma', role: 'investigator',
    badgeNumber: 'INV-2024-118', department: 'NCRB — Organised Crime Syndicate Unit', password: 'Demo@1234',
  },
  {
    id: 'USR-004', username: 'analyst_gupta', email: 'analyst.gupta@ncrb.gov.in',
    fullName: 'Data Analyst Suresh Gupta', role: 'analyst',
    badgeNumber: 'ANA-2024-023', department: 'NCRB — Cyber & Financial Intelligence Cell', password: 'Demo@1234',
  },
];

const STORAGE_KEY = 'cg_demo_user';
const MANAGED_USERS_KEY = 'cg_managed_users';
const PROFILE_PHOTOS_KEY = 'cg_profile_photos'; // userId → base64

const AuthContext = createContext<AuthContextType | null>(null);

function getInitialUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    try {
      const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
      if (photos[parsed.id]) {
        return { ...parsed, photoUrl: photos[parsed.id] };
      }
    } catch { /* ignore */ }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If we have a cached user, we do not block UI with a loading spinner
    return !getInitialUser() && !!localStorage.getItem('accessToken');
  });
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

  // Hydrate profile photo into user object
  const hydratePhoto = useCallback((u: User): User => {
    try {
      const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
      if (photos[u.id]) return { ...u, photoUrl: photos[u.id] };
    } catch { /* ignore */ }
    return u;
  }, []);

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

  // Fetch users directly from PostgreSQL database
  const refreshManagedUsers = useCallback(async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const res = await api.get('/api/auth/users');
      if (res.data?.users && Array.isArray(res.data.users)) {
        const hydratedList = res.data.users.map((u: any) => hydratePhoto(u));
        setManagedUsers(hydratedList);
        return { success: true, count: hydratedList.length };
      }
      return { success: false, error: 'Database did not return user records' };
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'API server offline or unreachable';
      console.warn('Failed to sync users from PostgreSQL database:', msg);
      return { success: false, error: msg };
    }
  }, [hydratePhoto]);

  // Restore session and sync users on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/api/auth/me')
        .then(res => {
          if (res.data) {
            const hydrated = hydratePhoto(res.data);
            setUser(hydrated);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
          }
        })
        .catch((err) => {
          // Only log out if backend explicitly rejected authentication with 401 or 403
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            logout();
          } else {
            console.warn('Backend session verification skipped/failed, keeping current session:', err?.message);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    refreshManagedUsers().catch(() => {});
  }, [hydratePhoto, logout, refreshManagedUsers]);

  const login = async (username: string, password: string) => {
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const { accessToken, refreshToken, user: userData } = res.data;
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      const hydrated = hydratePhoto(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
      setUser(hydrated);
      refreshManagedUsers().catch(() => {});
      return;
    } catch (apiErr: any) {
      // Fallback for offline / network outage if credentials match demo credentials
      const isNetworkError = !apiErr.response || apiErr.code === 'ERR_NETWORK' || apiErr.message?.includes('Network Error');
      if (isNetworkError) {
        const demoUser = INITIAL_DEMO_USERS.find(
          u => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase())
        );
        if (demoUser && (password === demoUser.password || password === 'Demo@1234')) {
          const { password: _pw, ...cleanUser } = demoUser;
          const hydrated = hydratePhoto(cleanUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
          setUser(hydrated);
          return;
        }
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

  const addManagedUser = useCallback(async (newUser: User & { password?: string }) => {
    try {
      const res = await api.post('/api/auth/users', newUser);
      const created = res.data?.user ? hydratePhoto(res.data.user) : newUser;

      // Save photo locally if provided
      if (newUser.photoUrl && created.id) {
        try {
          const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
          photos[created.id] = newUser.photoUrl;
          localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
        } catch { /* ignore */ }
      }

      setManagedUsers(prev => {
        const filtered = prev.filter(u => u.id !== created.id && u.username !== created.username);
        return [...filtered, created];
      });
      return created;
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to add user to database';
      throw new Error(msg);
    }
  }, [hydratePhoto]);

  const updateManagedUser = useCallback(async (id: string, updates: Partial<User> & { password?: string }) => {
    if (updates.photoUrl !== undefined) {
      try {
        const photos = JSON.parse(localStorage.getItem(PROFILE_PHOTOS_KEY) || '{}');
        photos[id] = updates.photoUrl;
        localStorage.setItem(PROFILE_PHOTOS_KEY, JSON.stringify(photos));
      } catch { /* ignore */ }
    }

    try {
      const res = await api.put(`/api/auth/users/${id}`, updates);
      const updated = res.data?.user ? hydratePhoto(res.data.user) : { ...updates, id } as User;
      setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
      setUser(prev => (prev && prev.id === id) ? { ...prev, ...updated } : prev);
      return updated;
    } catch (err: any) {
      // optimistic fallback
      setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      setUser(prev => (prev && prev.id === id) ? { ...prev, ...updates } : prev);
      const msg = err.response?.data?.error || err.message || 'Failed to update user in database';
      throw new Error(msg);
    }
  }, [hydratePhoto]);

  const deleteManagedUser = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/auth/users/${id}`);
      setManagedUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      setManagedUsers(prev => prev.filter(u => u.id !== id));
      const msg = err.response?.data?.error || err.message || 'Failed to delete user from database';
      throw new Error(msg);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading,
      login, logout, updateProfile,
      managedUsers, addManagedUser, updateManagedUser, deleteManagedUser, refreshManagedUsers
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
