import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_THEME, THEMES, getThemeConfig } from '../theme/themeConfig';
import { storageService } from '../utils/storage/storageService';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Always lock and migrate to the single official Editorial Scholar theme
  const [theme] = useState(DEFAULT_THEME);

  const applyThemeToDOM = useCallback(() => {
    const config = getThemeConfig(DEFAULT_THEME);
    const root = document.documentElement;

    root.setAttribute('data-theme', config.id);
    root.classList.remove('dark');
    root.classList.add('light');

    // Update browser theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', config.colors.bg);
    }

    // Auto-migrate storage if legacy theme was present
    try {
      storageService.setTheme(DEFAULT_THEME);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    applyThemeToDOM();
  }, [applyThemeToDOM]);

  const setTheme = useCallback(() => {
    // No-op or fixed to single official theme
    applyThemeToDOM();
  }, [applyThemeToDOM]);

  const activeConfig = getThemeConfig(DEFAULT_THEME);

  const value = {
    theme: DEFAULT_THEME,
    setTheme,
    themes: THEMES,
    availableThemes: THEMES,
    themeConfig: activeConfig,
    isDark: false
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
