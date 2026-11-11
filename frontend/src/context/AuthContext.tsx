'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import SessionTimeoutModal from '@/components/auth/SessionTimeoutModal';

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
  logout: (expired?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  extendSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  extendSession: async () => {},
});

// Konfigurasi Standar Enterprise Session Timeout
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit Waktu Diam
const WARNING_WINDOW_MS = 60 * 1000; // 60 Detik Jendela Peringatan
const LAST_ACTIVE_KEY = 'firenalytics_last_active';
const THROTTLE_ACTIVITY_MS = 2500; // Throttle pencatatan aktivitas ke storage (2.5 detik)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // State Manajemen Modal Peringatan Timeout Sesi
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isExtending, setIsExtending] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(0);

  const refreshUser = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Prioritaskan cek cookie atau Bearer token via /api/auth/me
      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        if (json?.success && json?.data) {
          setUser(json.data);
          localStorage.setItem('auth_user', JSON.stringify(json.data));
          return;
        }
      }

      // Jika server menolak sesi (401 Unauthorized / Token Invalid / Expired)
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem(LAST_ACTIVE_KEY);
          if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/login?expired=true';
            return;
          }
        }
        setUser(null);
        return;
      }

      // Fallback: periksa localStorage jika cookie terblokir oleh browser (namun bukan karena 401)
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
    const now = Date.now();
    setUser(data.user);
    lastActiveRef.current = now;
    lastThrottleRef.current = now;
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
  };

  const logout = useCallback(async (expired: boolean = false) => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setIsTimeoutModalOpen(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem(LAST_ACTIVE_KEY);
        if (expired) {
          window.location.href = '/login?expired=true';
          return;
        }
      }
      router.push('/login');
    }
  }, [router]);

  // Perpanjang sesi aktif & ping server
  const extendSession = useCallback(async () => {
    setIsExtending(true);
    try {
      const now = Date.now();
      lastActiveRef.current = now;
      lastThrottleRef.current = now;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_ACTIVE_KEY, String(now));
      }
      setIsTimeoutModalOpen(false);
      setRemainingSeconds(60);
      await refreshUser();
    } finally {
      setIsExtending(false);
    }
  }, [refreshUser]);

  // Pencatat aktivitas pengguna (mousemove, keydown, scroll, touch) dengan throttle
  const recordUserActivity = useCallback(() => {
    // Jika modal peringatan sedang terbuka, jangan reset otomatis dari gerakan mouse kecil
    // Pengguna harus mengklik tombol 'Tetap Masuk' secara eksplisit
    if (isTimeoutModalOpen) return;

    const now = Date.now();
    lastActiveRef.current = now;

    if (now - lastThrottleRef.current > THROTTLE_ACTIVITY_MS) {
      lastThrottleRef.current = now;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_ACTIVE_KEY, String(now));
      }
    }
  }, [isTimeoutModalOpen]);

  // Detektor Waktu Diam (Idle Timeout & Heartbeat Interval)
  useEffect(() => {
    if (!user) {
      setIsTimeoutModalOpen(false);
      return;
    }

    // Inisialisasi waktu aktif aman di tab saat ini
    if (typeof window !== 'undefined') {
      const existing = Number(localStorage.getItem(LAST_ACTIVE_KEY));
      const now = Date.now();
      if (!existing || isNaN(existing) || existing <= 0 || now - existing > DEFAULT_IDLE_TIMEOUT_MS) {
        localStorage.setItem(LAST_ACTIVE_KEY, String(now));
        lastActiveRef.current = now;
      } else {
        lastActiveRef.current = existing;
      }
    }

    // Pasang listener aktivitas interaktif pengguna
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleEvent = () => recordUserActivity();

    events.forEach((evt) => {
      window.addEventListener(evt, handleEvent, { passive: true });
    });

    // Multi-tab synchronization via storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVE_KEY && e.newValue) {
        const remoteActive = Number(e.newValue);
        if (!isNaN(remoteActive) && remoteActive > 0) {
          lastActiveRef.current = remoteActive;
          // Jika pengguna aktif di tab lain, tutup modal peringatan di tab ini
          setIsTimeoutModalOpen(false);
        }
      } else if (e.key === 'auth_token' && !e.newValue) {
        // Tab lain melakukan logout
        setUser(null);
        setIsTimeoutModalOpen(false);
        router.push('/login');
      }
    };
    window.addEventListener('storage', handleStorage);

    // Evaluator interval setiap 1 detik
    const checkTimeout = () => {
      const now = Date.now();
      let storageActive =
        typeof window !== 'undefined'
          ? Number(localStorage.getItem(LAST_ACTIVE_KEY))
          : now;

      if (!storageActive || isNaN(storageActive) || storageActive <= 0) {
        storageActive = now;
        if (typeof window !== 'undefined') {
          localStorage.setItem(LAST_ACTIVE_KEY, String(now));
        }
      }

      const effectiveActive = Math.max(storageActive, lastActiveRef.current);

      // Support override durasi testing via localStorage 'debug_session_timeout_sec'
      const customTimeoutSec =
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('debug_session_timeout_sec'))
          : 0;
      const timeoutMs =
        customTimeoutSec > 0 ? customTimeoutSec * 1000 : DEFAULT_IDLE_TIMEOUT_MS;
      const warningMs =
        customTimeoutSec > 0
          ? Math.min(customTimeoutSec * 1000, WARNING_WINDOW_MS)
          : WARNING_WINDOW_MS;

      const elapsed = now - effectiveActive;
      const remainingTotal = Math.max(0, timeoutMs - elapsed);

      if (remainingTotal <= 0) {
        // Waktu sesi diam habis total -> logout otomatis
        logout(true);
      } else if (remainingTotal <= warningMs) {
        // Masuk ke fase peringatan countdown
        setIsTimeoutModalOpen(true);
        setRemainingSeconds(Math.ceil(remainingTotal / 1000));
      } else {
        // Sesi masih aktif / baru saja diperpanjang
        setIsTimeoutModalOpen(false);
      }
    };

    const intervalId = setInterval(checkTimeout, 1000);

    // Tangani saat komputer bangun dari mode tidur (sleep/wake)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleEvent);
      });
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [user, recordUserActivity, logout, router]);

  // Global 401 Fetch Interceptor (Server-side Token Expiration Protection)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      if (res.status === 401) {
        const rawUrl =
          typeof args[0] === 'string'
            ? args[0]
            : (args[0] as Request)?.url || '';
        const isAuthEndpoint =
          rawUrl.includes('/api/auth/login') ||
          rawUrl.includes('/api/auth/register');
        if (
          !isAuthEndpoint &&
          window.location.pathname.startsWith('/dashboard')
        ) {
          logout(true);
        }
      }
      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        extendSession,
      }}
    >
      {children}
      {user && (
        <SessionTimeoutModal
          isOpen={isTimeoutModalOpen}
          remainingSeconds={remainingSeconds}
          totalWarningSeconds={60}
          onStayLoggedIn={extendSession}
          onLogoutNow={() => logout(false)}
          isExtending={isExtending}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
