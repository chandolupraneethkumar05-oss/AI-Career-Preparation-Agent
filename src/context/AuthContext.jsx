import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USER } from '../data/mockData';
import { storageService, STORAGE_KEYS } from '../utils/storage/storageService';
import { API_BASE_URL, ensureAuthToken } from '../services/apiConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    return storageService.getCurrentUser();
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      storageService.saveCurrentUser(user);
    }
  }, [user]);

  // Initial background token verification and profile hydration
  useEffect(() => {
    const token = storageService.getToken();
    if (token) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setUser((prev) => ({
              ...(prev || {}),
              id: data.id,
              name: data.name,
              email: data.email,
              targetRole: data.target_role || data.role,
              role: data.role || data.target_role,
              xp: data.xp,
              level: data.level,
              streak: data.streak
            }));
          } else if (res.status === 401) {
            // Token expired or invalidated; refresh via demo token
            storageService.removeToken();
            const fresh = await ensureAuthToken();
            if (fresh) {
              const demoUser = storageService.getCurrentUser();
              if (demoUser) setUser(demoUser);
            }
          }
        })
        .catch(() => {});
    } else {
      // Auto-ensure demo token on initial visit
      ensureAuthToken().then((fresh) => {
        if (fresh) {
          const demoUser = storageService.getCurrentUser();
          if (demoUser) setUser(demoUser);
        }
      }).catch(() => {});
    }

    if (user?.id) {
      storageService.hydrateFromBackend(user.id).catch(() => {});
    }
  }, [user?.id]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Authentication failed. Please verify your credentials.');
      }

      const data = await res.json();
      storageService.setToken(data.access_token);

      const authenticatedUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        targetRole: data.user.target_role || data.user.role || 'Machine Learning Engineer',
        role: data.user.role || 'Machine Learning Engineer',
        xp: data.user.xp || 0,
        level: data.user.level || 1,
        streak: data.user.streak || 0,
        avatar: MOCK_USER.avatar,
        feedbackLanguage: 'en'
      };

      setUser(authenticatedUser);
      storageService.saveCurrentUser(authenticatedUser);
      storageService.saveProfile(authenticatedUser, authenticatedUser.id);
      return authenticatedUser;
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsDemo = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Could not initialize demo sandbox token.');
      }

      const data = await res.json();
      storageService.setToken(data.access_token);

      const demoUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        targetRole: data.user.target_role || data.user.role || 'Machine Learning Engineer',
        role: data.user.role || 'Machine Learning Engineer',
        xp: data.user.xp || 0,
        level: data.user.level || 1,
        streak: data.user.streak || 0,
        avatar: MOCK_USER.avatar,
        feedbackLanguage: 'en',
        isDemo: true
      };

      setUser(demoUser);
      storageService.saveCurrentUser(demoUser);
      storageService.saveProfile(demoUser, demoUser.id);
      return demoUser;
    } catch (err) {
      console.warn('[AuthContext] Demo login backend offline fallback:', err);
      // Offline fallback
      const fallbackUser = {
        id: 'user-001',
        name: 'Demo Candidate',
        email: 'candidate@example.com',
        targetRole: 'Machine Learning Engineer',
        role: 'Machine Learning Engineer',
        avatar: MOCK_USER.avatar,
        level: 1,
        xp: 0,
        streak: 0,
        feedbackLanguage: 'en'
      };
      setUser(fallbackUser);
      storageService.saveCurrentUser(fallbackUser);
      return fallbackUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name, email, password, targetRole) => {
    setIsLoading(true);
    try {
      const cleanEmail = (email || '').trim().toLowerCase();
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (name || '').trim(),
          email: cleanEmail,
          password,
          target_role: targetRole || 'Machine Learning Engineer'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed. An account with this email may already exist.');
      }

      const data = await res.json();
      storageService.setToken(data.access_token);

      const newUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        targetRole: data.user.target_role || targetRole || 'Machine Learning Engineer',
        role: data.user.role || targetRole || 'Machine Learning Engineer',
        xp: 0,
        level: 1,
        streak: 0,
        avatar: MOCK_USER.avatar,
        feedbackLanguage: 'en'
      };

      setUser(newUser);
      storageService.saveCurrentUser(newUser);
      storageService.saveProfile(newUser, newUser.id);
      return newUser;
    } catch (err) {
      console.error('[AuthContext] Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const headers = storageService.getAuthHeaders();
      if (headers.Authorization) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers
        }).catch(() => {});
      }
    } finally {
      setUser(null);
      storageService.removeToken();
      storageService.remove(STORAGE_KEYS.AUTH_USER);
    }
  }, []);

  const addXP = useCallback((amount) => {
    setUser(prev => {
      if (!prev) return prev;
      const newXP = (prev.xp || 0) + amount;
      // 0-499 XP -> Level 1, 500-999 XP -> Level 2, 1000-1499 XP -> Level 3
      const computedLevel = Math.floor(newXP / 500) + 1;
      const updated = {
        ...prev,
        xp: newXP,
        level: Math.max(prev.level || 1, computedLevel)
      };
      storageService.saveCurrentUser(updated);
      return updated;
    });
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      if (updates.targetRole) {
        updated.role = updates.targetRole;
      } else if (updates.role) {
        updated.targetRole = updates.role;
      }
      storageService.saveCurrentUser(updated);
      if (updated.id) {
        storageService.saveProfile(updated, updated.id);
      }
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemo,
        signup,
        logout,
        addXP,
        updateUser
      }}
    >
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
