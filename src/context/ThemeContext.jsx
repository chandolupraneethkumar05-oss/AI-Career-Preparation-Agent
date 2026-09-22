import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_THEME, THEMES, getThemeConfig, resolveEffectiveTheme, isValidTheme } from '../theme/themeConfig';
import { storageService } from '../utils/storage/storageService';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = storageService.getTheme();
      return isValidTheme(saved) ? saved : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const applyThemeToDOM = useCallback((themeId) => {
    const effectiveTheme = resolveEffectiveTheme(themeId);
    const config = getThemeConfig(effectiveTheme);
    const root = document.documentElement;

    root.setAttribute('data-theme', effectiveTheme);
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Update browser theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor && config?.colors?.bg) {
      metaThemeColor.setAttribute('content', config.colors.bg);
    }
  }, []);

  // Handle system preference changes when theme === 'system'
  useEffect(() => {
    applyThemeToDOM(theme);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyThemeToDOM('system');
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme, applyThemeToDOM]);

  const setTheme = useCallback((newTheme) => {
    const valid = isValidTheme(newTheme) ? newTheme : DEFAULT_THEME;
    setThemeState(valid);
    try {
      storageService.setTheme(valid);
    } catch {
      // ignore
    }
    applyThemeToDOM(valid);
  }, [applyThemeToDOM]);

  const effectiveTheme = resolveEffectiveTheme(theme);
  const activeConfig = getThemeConfig(effectiveTheme);

  const value = {
    theme,
    effectiveTheme,
    setTheme,
    themes: THEMES,
    availableThemes: THEMES,
    themeConfig: activeConfig,
    isDark: effectiveTheme === 'dark'
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
