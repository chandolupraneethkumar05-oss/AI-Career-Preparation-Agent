/**
 * Centralized Theme Configuration & Metadata
 * Official Themes:
 *  - system: Auto-detects OS color-scheme preference
 *  - warm: Editorial Scholar & Alexandria Archival Parchment (Default)
 *  - white: Modern Crisp Executive White
 *  - dark: Midnight Scholar Deep Dark
 */

export const DEFAULT_THEME = 'white';

export const THEMES = [
  {
    id: 'system',
    name: 'System Preference',
    badge: 'Auto Dynamic',
    description: 'Automatically synchronizes with your operating system light or dark mode preference.',
    mode: 'auto',
    emoji: '🖥️',
    preview: {
      bg: '#F1F5F9',
      card: '#FFFFFF',
      primary: '#0284C7',
      secondary: '#475569'
    }
  },
  {
    id: 'warm',
    aliases: ['editorial_scholar'],
    name: 'TalentShine Modern',
    badge: 'Clean Modern',
    description: 'Clean slate canvas with high-contrast slate ink, subtle cool borders, and vibrant electric indigo accents.',
    mode: 'light',
    emoji: '☀️',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceHover: '#F1F5F9',
      surfaceSubtle: '#F1F5F9',
      surfaceLow: '#FAFAFA',
      sidebar: '#FFFFFF',
      border: '#E2E8F0',
      borderStrong: '#CBD5E1',
      primary: '#4F46E5',
      primaryLight: '#6366F1',
      cta: '#4F46E5',
      ctaHover: '#4338CA',
      ctaText: '#FFFFFF',
      secondary: '#334155',
      bronze: '#F59E0B',
      bronzeHover: '#D97706',
      accent: '#4F46E5',
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
      headerBg: 'rgba(255, 255, 255, 0.95)',
      inputBg: '#FFFFFF',
      selected: '#EEF2FF'
    },
    preview: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      primary: '#4F46E5',
      secondary: '#10B981'
    }
  },
  {
    id: 'white',
    name: 'Pure White',
    badge: 'Clean Modern',
    description: 'Crisp minimalist white canvas with high-contrast slate ink, subtle cool borders, and vibrant electric indigo accents.',
    mode: 'light',
    emoji: '☀️',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceHover: '#F1F5F9',
      surfaceSubtle: '#F1F5F9',
      surfaceLow: '#FAFAFA',
      sidebar: '#FFFFFF',
      border: '#E2E8F0',
      borderStrong: '#CBD5E1',
      primary: '#4F46E5',
      primaryLight: '#6366F1',
      cta: '#4F46E5',
      ctaHover: '#4338CA',
      ctaText: '#FFFFFF',
      secondary: '#334155',
      bronze: '#F59E0B',
      bronzeHover: '#D97706',
      accent: '#4F46E5',
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
      selected: '#EEF2FF'
    },
    preview: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      primary: '#4F46E5',
      secondary: '#10B981'
    }
  },
  {
    id: 'dark',
    name: 'Midnight Dark',
    badge: 'Deep Carbon',
    description: 'Immersive deep obsidian canvas with midnight card surfaces, luminescent typography, and electric sapphire accents.',
    mode: 'dark',
    emoji: '🌙',
    colors: {
      bg: '#0B0F17',
      surface: '#111827',
      surfaceHover: '#1E293B',
      surfaceSubtle: '#1E293B',
      surfaceLow: '#0F172A',
      sidebar: '#0B0F17',
      border: '#1E293B',
      borderStrong: '#334155',
      primary: '#38BDF8',
      primaryLight: '#60A5FA',
      cta: '#2563EB',
      ctaHover: '#1D4ED8',
      ctaText: '#FFFFFF',
      secondary: '#E2E8F0',
      bronze: '#38BDF8',
      bronzeHover: '#0EA5E9',
      accent: '#38BDF8',
      success: '#22C55E',
      successBg: '#052E16',
      warning: '#F97316',
      warningBg: '#431407',
      danger: '#EF4444',
      dangerBg: '#450A0A',
      neutral: '#94A3B8',
      neutralBg: '#1E293B',
      text: '#F8FAFC',
      textSecondary: '#E2E8F0',
      textMuted: '#94A3B8',
      textMicro: '#A1A1AA',
      cardBg: '#111827',
      headerBg: 'rgba(11, 15, 23, 0.95)',
      inputBg: '#111827',
      selected: '#1E3A5F'
    },
    preview: {
      bg: '#0B0F17',
      card: '#111827',
      primary: '#38BDF8',
      secondary: '#60A5FA'
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
    return THEMES.find(t => t.id === 'warm') || THEMES[1];
  }
  return THEMES.find(t => t.id === tid) || THEMES.find(t => t.id === 'warm') || THEMES[1];
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
