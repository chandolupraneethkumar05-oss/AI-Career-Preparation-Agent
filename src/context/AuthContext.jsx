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

  // Initial background hydration from backend
  useEffect(() => {
    if (user?.id) {
      storageService.hydrateFromBackend(user.id).catch(() => {});
    }
  }, [user?.id]);

  const login = useCallback((email, _password) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const cleanEmail = (email || 'candidate@career-ai.dev').trim().toLowerCase();
        const userId = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
        const nameFromEmail = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase();

        // Check if there is an existing saved profile for this specific user
        const existingProfile = storageService.getProfile(userId);
        const userActivities = storageService.getActivities(userId);
        const realStreak = activityService.calculateCurrentStreak(userActivities);

        const loggedUser = existingProfile ? {
          ...existingProfile,
          id: userId,
          email: cleanEmail,
          streak: realStreak
        } : {
          id: userId,
          name: nameFromEmail || 'Career Candidate',
          email: cleanEmail,
          targetRole: 'Machine Learning Engineer',
          role: 'Machine Learning Engineer',
          avatar: MOCK_USER.avatar,
          level: 1,
          title: 'Aspiring Candidate',
          xp: 0,
          streak: realStreak,
          feedbackLanguage: 'en'
        };

        setUser(loggedUser);
        storageService.saveCurrentUser(loggedUser);
        storageService.saveProfile(loggedUser, userId);
        setIsLoading(false);
        resolve(loggedUser);
      }, 300);
    });
  }, []);

  const loginAsDemo = useCallback(() => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const demoEmail = 'alex.rivera@career-ai.dev';
        const userId = 'usr_demo_alex_rivera';
        const existingProfile = storageService.getProfile(userId);
        const userActivities = storageService.getActivities(userId);
        const realStreak = activityService.calculateCurrentStreak(userActivities);

        const demoUser = existingProfile ? {
          ...existingProfile,
          id: userId,
          email: demoEmail,
          streak: realStreak
        } : {
          id: userId,
          name: 'Alex Rivera',
          email: demoEmail,
          targetRole: 'Machine Learning Engineer',
          role: 'Machine Learning Engineer',
          avatar: MOCK_USER.avatar,
          level: 1,
          title: 'Career Candidate',
          xp: 0,
          streak: realStreak,
          feedbackLanguage: 'en'
        };

        setUser(demoUser);
        storageService.saveCurrentUser(demoUser);
        storageService.saveProfile(demoUser, userId);
        setIsLoading(false);
        resolve(demoUser);
      }, 250);
    });
  }, []);

  const signup = useCallback((name, email, _password) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const cleanEmail = (email || 'candidate@career-ai.dev').trim().toLowerCase();
        const userId = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

        const newUser = {
          id: userId,
          name: name || cleanEmail.split('@')[0].toUpperCase(),
          email: cleanEmail,
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
        storageService.saveProfile(newUser, userId);
        setIsLoading(false);
        resolve(newUser);
      }, 300);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    storageService.remove(STORAGE_KEYS.AUTH_USER);
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
