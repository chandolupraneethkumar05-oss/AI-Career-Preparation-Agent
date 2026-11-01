/**
 * Centralized Theme Configuration & Metadata
 * Official Themes:
 *  - system: Auto-detects OS color-scheme preference
 *  - white: Modern Crisp Executive White & Emerald (Default)
 *  - warm: Archival Warm Editorial Parchment
 *  - dark: Midnight Deep Carbon & Slate
 */

export const DEFAULT_THEME = 'white';

export const THEMES = [
  {
    id: 'system',
    name: 'System Preference',
    badge: 'Auto Dynamic',
    description: 'Automatically adapts between light and dark based on your device settings.',
    mode: 'auto',
    emoji: '🖥️',
    preview: {
      bg: '#F1F5F9',
      card: '#FFFFFF',
      primary: '#059669',
      secondary: '#0F172A'
    }
  },
  {
    id: 'white',
    name: 'Pure White',
    badge: 'Clean Modern',
    description: 'Crisp minimalist white canvas with high-contrast slate ink, subtle cool borders, and emerald accents.',
    mode: 'light',
    emoji: '☀️',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceHover: '#F1F5F9',
      surfaceSubtle: '#F8FAFC',
      surfaceLow: '#F1F5F9',
      sidebar: '#FFFFFF',
      border: '#E2E8F0',
      borderStrong: '#CBD5E1',
      primary: '#059669',
      primaryLight: '#10B981',
      cta: '#059669',
      ctaHover: '#047857',
      ctaText: '#FFFFFF',
      secondary: '#0F172A',
      bronze: '#D97706',
      bronzeHover: '#B45309',
      accent: '#059669',
      success: '#10B981',
      successBg: '#ECFDF5',
      warning: '#F59E0B',
      warningBg: '#FFFBEB',
      danger: '#EF4444',
      dangerBg: '#FEF2F2',
      neutral: '#64748B',
      neutralBg: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',
      textMicro: '#475569',
      cardBg: '#FFFFFF',
      headerBg: 'rgba(255, 255, 255, 0.98)',
      inputBg: '#FFFFFF',
      selected: '#ECFDF5'
    },
    preview: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      primary: '#059669',
      secondary: '#0F172A'
    }
  },
  {
    id: 'warm',
    aliases: ['editorial_scholar'],
    name: 'Warm Parchment',
    badge: 'Editorial Scholar',
    description: 'Archival warm sandstone aesthetic with navy serif ink, warm bronze highlights, and parchment cards.',
    mode: 'light',
    emoji: '📜',
    colors: {
      bg: '#FBF9F5',
      surface: '#FFFFFF',
      surfaceHover: '#F5EFE6',
      surfaceSubtle: '#FAF6EE',
      surfaceLow: '#F4EFE6',
      sidebar: '#FDFBF7',
      border: '#E8E2D5',
      borderStrong: '#D5CCBA',
      primary: '#1B2A4A',
      primaryLight: '#2D4474',
      cta: '#1B2A4A',
      ctaHover: '#131F37',
      ctaText: '#FFFFFF',
      secondary: '#2C251E',
      bronze: '#8C6E54',
      bronzeHover: '#735841',
      accent: '#1B2A4A',
      success: '#2B6E44',
      successBg: '#EFF7F1',
      warning: '#B45309',
      warningBg: '#FEF8EE',
      danger: '#C53030',
      dangerBg: '#FDF2F2',
      neutral: '#786E63',
      neutralBg: '#F4EFE6',
      text: '#1F1B16',
      textSecondary: '#3B352E',
      textMuted: '#786E63',
      textMicro: '#544D44',
      cardBg: '#FFFFFF',
      headerBg: 'rgba(251, 249, 245, 0.98)',
      inputBg: '#FFFFFF',
      selected: '#F4EFE6'
    },
    preview: {
      bg: '#FBF9F5',
      card: '#FFFFFF',
      primary: '#1B2A4A',
      secondary: '#8C6E54'
    }
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    badge: 'Deep Carbon',
    description: 'Immersive deep obsidian slate canvas with midnight card surfaces, luminescent typography, and emerald accents.',
    mode: 'dark',
    emoji: '🌙',
    colors: {
      bg: '#090D16',
      surface: '#0F172A',
      surfaceHover: '#1E293B',
      surfaceSubtle: '#1E293B',
      surfaceLow: '#0B1120',
      sidebar: '#090D16',
      border: '#1E293B',
      borderStrong: '#334155',
      primary: '#10B981',
      primaryLight: '#34D399',
      cta: '#059669',
      ctaHover: '#047857',
      ctaText: '#FFFFFF',
      secondary: '#E2E8F0',
      bronze: '#38BDF8',
      bronzeHover: '#0EA5E9',
      accent: '#10B981',
      success: '#22C55E',
      successBg: '#052E16',
      warning: '#F59E0B',
      warningBg: '#451A03',
      danger: '#EF4444',
      dangerBg: '#450A0A',
      neutral: '#94A3B8',
      neutralBg: '#1E293B',
      text: '#F8FAFC',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textMicro: '#CBD5E1',
      cardBg: '#0F172A',
      headerBg: 'rgba(9, 13, 22, 0.95)',
      inputBg: '#0F172A',
      selected: '#1E293B'
    },
    preview: {
      bg: '#090D16',
      card: '#0F172A',
      primary: '#10B981',
      secondary: '#38BDF8'
    }
  }
];

export const PRIMARY_THEMES = THEMES;
export const VALID_THEME_IDS = ['system', 'warm', 'editorial_scholar', 'white', 'dark'];

export function isValidTheme(themeId) {
  if (typeof themeId !== 'string') return false;
  const tid = themeId.toLowerCase();
  return VALID_THEME_IDS.includes(tid);
}

export function getThemeConfig(themeId = DEFAULT_THEME) {
  const tid = typeof themeId === 'string' ? themeId.toLowerCase() : DEFAULT_THEME;
  if (tid === 'editorial_scholar') {
    return THEMES.find(t => t.id === 'warm') || THEMES[2];
  }
  return THEMES.find(t => t.id === tid) || THEMES.find(t => t.id === 'white') || THEMES[1];
}

/**
 * Resolves effective concrete theme ID ('warm', 'white', or 'dark') given an active theme ID.
 * If theme is 'system', queries window.matchMedia.
 */
export function resolveEffectiveTheme(themeId) {
  if (themeId === 'editorial_scholar') return 'warm';
  if (themeId === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'white';
    }
    return 'white';
  }
  return isValidTheme(themeId) ? themeId : 'white';
}
