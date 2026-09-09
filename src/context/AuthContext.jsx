import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USER } from '../data/mockData';

const AuthContext = createContext(null);

const STORAGE_KEY = 'interview_ai_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email, _password) => {
    setIsLoading(true);
    // Simulate lightweight auth
    return new Promise((resolve) => {
      setTimeout(() => {
        const loggedUser = {
          ...MOCK_USER,
          email: email || MOCK_USER.email,
          name: email ? email.split('@')[0].replace('.', ' ').toUpperCase() : MOCK_USER.name
        };
        setUser(loggedUser);
        setIsLoading(false);
        resolve(loggedUser);
      }, 400);
    });
  };

  const loginAsDemo = () => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser(MOCK_USER);
        setIsLoading(false);
        resolve(MOCK_USER);
      }, 250);
    });
  };

  const signup = (name, email, _password) => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          ...MOCK_USER,
          name: name || 'Career Candidate',
          email: email,
          xp: 100,
          level: 1,
          streak: 1,
          interviewsCompleted: 0,
          averageScore: 0,
          questionsAnswered: 0
        };
        setUser(newUser);
        setIsLoading(false);
        resolve(newUser);
      }, 400);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addXP = (amount) => {
    if (!user) return;
    const newXP = (user.xp || 0) + amount;
    // 0-499 XP -> Level 1, 500-999 XP -> Level 2, 1000-1499 XP -> Level 3 (or preserve current level)
    const computedLevel = Math.floor(newXP / 500) + 1;
    setUser(prev => ({
      ...prev,
      xp: newXP,
      level: Math.max(prev.level || 1, computedLevel)
    }));
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

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
