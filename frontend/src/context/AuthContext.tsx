'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { token?: string; user: User }) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      // Prioritaskan cek cookie via /api/auth/me
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
          localStorage.setItem('auth_user', JSON.stringify(json.data));
          return;
        }
      }
      
      // Fallback: periksa localStorage jika cookie terblokir oleh browser
      const local = localStorage.getItem('auth_user');
      if (local) {
        try {
          setUser(JSON.parse(local));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      const local = localStorage.getItem('auth_user');
      if (local) {
        try {
          setUser(JSON.parse(local));
        } catch {
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (data: { token?: string; user: User }) => {
    setUser(data.user);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
