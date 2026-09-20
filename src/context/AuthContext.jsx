import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MOCK_USER } from '../data/mockData';
import { storageService, STORAGE_KEYS } from '../utils/storage/storageService';
import { activityService } from '../utils/activityService';

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

  const login = useCallback((email, _password) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const existing = storageService.getCurrentUser();
        const currentActivities = activityService.getActivities();
        const realStreak = activityService.calculateCurrentStreak(currentActivities);
        const loggedUser = {
          name: email ? email.split('@')[0].replace('.', ' ').toUpperCase() : (existing?.name || 'Career Candidate'),
          email: email || existing?.email || 'candidate@career-ai.dev',
          targetRole: existing?.targetRole || 'Machine Learning Engineer',
          role: existing?.role || 'Machine Learning Engineer',
          avatar: existing?.avatar || MOCK_USER.avatar,
          level: existing?.level || 1,
          title: existing?.title || 'Aspiring Candidate',
          xp: existing?.xp || 0,
          streak: realStreak,
          feedbackLanguage: existing?.feedbackLanguage || 'en'
        };
        setUser(loggedUser);
        storageService.saveCurrentUser(loggedUser);
        setIsLoading(false);
        resolve(loggedUser);
      }, 300);
    });
  }, []);

  const loginAsDemo = useCallback(() => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const existing = storageService.getCurrentUser();
        const currentActivities = activityService.getActivities();
        const realStreak = activityService.calculateCurrentStreak(currentActivities);
        const demoUser = {
          name: 'Alex Rivera',
          email: 'alex.rivera@career-ai.dev',
          targetRole: existing?.targetRole || 'Machine Learning Engineer',
          role: existing?.role || 'Machine Learning Engineer',
          avatar: MOCK_USER.avatar,
          level: existing?.level || 1,
          title: 'Career Candidate',
          xp: existing?.xp || 0,
          streak: realStreak,
          feedbackLanguage: existing?.feedbackLanguage || 'en'
        };
        setUser(demoUser);
        storageService.saveCurrentUser(demoUser);
        setIsLoading(false);
        resolve(demoUser);
      }, 250);
    });
  }, []);

  const signup = useCallback((name, email, _password) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          name: name || 'Career Candidate',
          email: email || 'candidate@career-ai.dev',
          targetRole: 'Machine Learning Engineer',
          role: 'Machine Learning Engineer',
          avatar: MOCK_USER.avatar,
          xp: 0,
          level: 1,
          streak: 0,
          title: 'New Candidate',
          feedbackLanguage: 'en'
        };
        setUser(newUser);
        storageService.saveCurrentUser(newUser);
        setIsLoading(false);
        resolve(newUser);
      }, 300);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }, []);

  const addXP = useCallback((amount) => {
    setUser(prev => {
      if (!prev) return prev;
      const newXP = (prev.xp || 0) + amount;
      // 0-499 XP -> Level 1, 500-999 XP -> Level 2, 1000-1499 XP -> Level 3
      const computedLevel = Math.floor(newXP / 500) + 1;
      return {
        ...prev,
        xp: newXP,
        level: Math.max(prev.level || 1, computedLevel)
      };
    });
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => (prev ? { ...prev, ...updates } : prev));
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
