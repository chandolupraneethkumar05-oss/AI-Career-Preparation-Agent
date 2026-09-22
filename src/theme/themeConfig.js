/**
 * Centralized Theme Configuration & Metadata
 * Official Themes:
 *  - system: Auto-detects OS color-scheme preference
 *  - warm: Editorial Scholar & Alexandria Archival Parchment (Default)
 *  - white: Modern Crisp Executive White
 *  - dark: Midnight Scholar Deep Dark
 */

export const DEFAULT_THEME = 'warm';

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
    name: 'Warm Scholar',
    badge: 'Archival Canvas',
    description: 'Classical academic dossier with archival parchment, porcelain surfaces, deep carbon ink, and academic navy accents.',
    mode: 'light',
    emoji: '🏛️',
    colors: {
      bg: '#F8F6F0',
      surface: '#FFFDF9',
      surfaceHover: '#F2EFE9',
      surfaceSubtle: '#F2EFE9',
      surfaceLow: '#FAF8F3',
      sidebar: '#F8F6F0',
      border: '#E5E0D5',
      borderStrong: '#D5CFBF',
      primary: '#1A365D',
      primaryLight: '#2A4A7F',
      cta: '#1B2A4A',
      ctaHover: '#142038',
      ctaText: '#FFFFFF',
      secondary: '#3B352E',
      bronze: '#8C6E54',
      bronzeHover: '#795E47',
      accent: '#1A365D',
      success: '#235E3B',
      successBg: '#EBF4EE',
      warning: '#9A421A',
      warningBg: '#FDF2E9',
      danger: '#9A421A',
      dangerBg: '#FDF2E9',
      neutral: '#4A453E',
      neutralBg: '#EFECE6',
      text: '#1F1B16',
      textSecondary: '#3B352E',
      textMuted: '#70685E',
      textMicro: '#5C554B',
      cardBg: '#FFFDF9',
      headerBg: 'rgba(255, 253, 249, 0.98)',
      inputBg: '#FFFDF9',
      selected: '#EAE6DC'
    },
    preview: {
      bg: '#F8F6F0',
      card: '#FFFDF9',
      primary: '#1A365D',
      secondary: '#8C6E54'
    }
  },
  {
    id: 'white',
    name: 'Pure White',
    badge: 'Clean Modern',
    description: 'Crisp minimalist white canvas with high-contrast slate ink, subtle cool borders, and vibrant cobalt blue accents.',
    mode: 'light',
    emoji: '☀️',
    colors: {
      bg: '#FFFFFF',
      surface: '#F8FAFC',
      surfaceHover: '#F1F5F9',
      surfaceSubtle: '#F1F5F9',
      surfaceLow: '#FAFAFA',
      sidebar: '#FFFFFF',
      border: '#E2E8F0',
      borderStrong: '#CBD5E1',
      primary: '#1E40AF',
      primaryLight: '#3B82F6',
      cta: '#1E40AF',
      ctaHover: '#1D4ED8',
      ctaText: '#FFFFFF',
      secondary: '#334155',
      bronze: '#0284C7',
      bronzeHover: '#0369A1',
      accent: '#1E40AF',
      success: '#15803D',
      successBg: '#F0FDF4',
      warning: '#C2410C',
      warningBg: '#FFF7ED',
      danger: '#B91C1C',
      dangerBg: '#FEF2F2',
      neutral: '#475569',
      neutralBg: '#F1F5F9',
      text: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',
      textMicro: '#475569',
      cardBg: '#FFFFFF',
      headerBg: 'rgba(255, 255, 255, 0.98)',
      inputBg: '#FFFFFF',
      selected: '#E0E7FF'
    },
    preview: {
      bg: '#FFFFFF',
      card: '#F8FAFC',
      primary: '#1E40AF',
      secondary: '#0284C7'
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
    return 'warm';
  }
  return isValidTheme(themeId) ? themeId : 'warm';
}
