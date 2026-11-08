/**
 * Centralized Theme Configuration & Metadata
 * Postman-Inspired Modern Design System:
 *  - system: Auto-detects OS color-scheme preference (Postman Auto)
 *  - white: Postman Light — Modern Crisp Executive White, high contrast slate typography, emerald & indigo accents
 *  - dark: Postman Dark — Sleek refined charcoal canvas (#181818), elevated card panels (#212121), crisp readable text (#F5F5F5)
 *  - black: Postman Black — Ultra-deep OLED pitch black (#000000), deep obsidian surfaces (#111111), razor-sharp hairline dividers (#242424), pure white text (#FFFFFF)
 *  - warm: Archival Warm Editorial Parchment (Legacy compatibility)
 */

export const DEFAULT_THEME = 'white';

export const THEMES = [
  {
    id: 'system',
    name: 'System Preference',
    badge: 'Auto Dynamic',
    description: 'Automatically adapts between Postman Light and Postman Dark based on your device settings.',
    mode: 'auto',
    emoji: '🖥️',
    preview: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      primary: '#4F46E5',
      secondary: '#0F172A',
      border: '#E2E8F0'
    }
  },
  {
    id: 'white',
    name: 'Postman Light',
    badge: 'Pure White',
    description: 'Crisp minimalist white canvas with high-contrast slate ink, subtle cool borders, and electric indigo & emerald accents.',
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
      primary: '#4F46E5',
      primaryLight: '#6366F1',
      cta: '#4F46E5',
      ctaHover: '#4338CA',
      ctaText: '#FFFFFF',
      secondary: '#0F172A',
      bronze: '#F59E0B',
      bronzeHover: '#D97706',
      accent: '#FF6C37',
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
      secondary: '#0F172A',
      border: '#E2E8F0'
    }
  },
  {
    id: 'dark',
    name: 'Postman Dark',
    badge: 'Charcoal Slate',
    description: 'Sleek Postman charcoal canvas with elevated card surfaces, crisp readable typography, and vibrant accents.',
    mode: 'dark',
    emoji: '🌙',
    colors: {
      bg: '#181818',
      surface: '#212121',
      surfaceHover: '#2A2A2A',
      surfaceSubtle: '#262626',
      surfaceLow: '#1E1E1E',
      sidebar: '#181818',
      border: '#2E2E2E',
      borderStrong: '#444444',
      primary: '#6366F1',
      primaryLight: '#818CF8',
      cta: '#4F46E5',
      ctaHover: '#4338CA',
      ctaText: '#FFFFFF',
      secondary: '#F5F5F5',
      bronze: '#F59E0B',
      bronzeHover: '#D97706',
      accent: '#FF6C37',
      success: '#10B981',
      successBg: 'rgba(16, 185, 129, 0.15)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.15)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.15)',
      neutral: '#94A3B8',
      neutralBg: '#262626',
      text: '#F5F5F5',
      textSecondary: '#D4D4D8',
      textMuted: '#A1A1AA',
      textMicro: '#71717A',
      cardBg: '#212121',
      headerBg: 'rgba(24, 24, 24, 0.95)',
      inputBg: '#181818',
      selected: '#2A2A2A'
    },
    preview: {
      bg: '#181818',
      card: '#212121',
      primary: '#6366F1',
      secondary: '#F5F5F5',
      border: '#2E2E2E'
    }
  },
  {
    id: 'black',
    name: 'Postman Black',
    badge: 'OLED Obsidian',
    description: 'Ultra-deep OLED pitch black canvas with sharp hairline dividers, pure white typography, and maximum contrast.',
    mode: 'dark',
    emoji: '🌌',
    colors: {
      bg: '#000000',
      surface: '#111111',
      surfaceHover: '#1C1C1C',
      surfaceSubtle: '#161616',
      surfaceLow: '#0A0A0A',
      sidebar: '#0A0A0A',
      border: '#242424',
      borderStrong: '#383838',
      primary: '#6366F1',
      primaryLight: '#818CF8',
      cta: '#4F46E5',
      ctaHover: '#4338CA',
      ctaText: '#FFFFFF',
      secondary: '#FFFFFF',
      bronze: '#F59E0B',
      bronzeHover: '#D97706',
      accent: '#FF6C37',
      success: '#10B981',
      successBg: 'rgba(16, 185, 129, 0.2)',
      warning: '#F59E0B',
      warningBg: 'rgba(245, 158, 11, 0.2)',
      danger: '#EF4444',
      dangerBg: 'rgba(239, 68, 68, 0.2)',
      neutral: '#A1A1AA',
      neutralBg: '#1A1A1A',
      text: '#FFFFFF',
      textSecondary: '#E4E4E7',
      textMuted: '#A1A1AA',
      textMicro: '#71717A',
      cardBg: '#111111',
      headerBg: 'rgba(0, 0, 0, 0.95)',
      inputBg: '#0A0A0A',
      selected: '#1C1C1C'
    },
    preview: {
      bg: '#000000',
      card: '#111111',
      primary: '#6366F1',
      secondary: '#FFFFFF',
      border: '#242424'
    }
  },
  {
    id: 'warm',
    aliases: ['editorial_scholar'],
    name: 'Warm Parchment',
    badge: 'Editorial Scholar',
    description: 'Archival warm sandstone aesthetic with navy ink, warm bronze highlights, and parchment cards.',
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
      secondary: '#8C6E54',
      border: '#E8E2D5'
    }
  }
];

export const PRIMARY_THEMES = THEMES;
export const VALID_THEME_IDS = ['system', 'white', 'dark', 'black', 'warm', 'editorial_scholar'];

export function isValidTheme(themeId) {
  if (typeof themeId !== 'string') return false;
  const tid = themeId.toLowerCase();
  return VALID_THEME_IDS.includes(tid);
}

export function getThemeConfig(themeId = DEFAULT_THEME) {
  const tid = typeof themeId === 'string' ? themeId.toLowerCase() : DEFAULT_THEME;
  if (tid === 'editorial_scholar') {
    return THEMES.find(t => t.id === 'warm') || THEMES[4];
  }
  return THEMES.find(t => t.id === tid) || THEMES.find(t => t.id === 'white') || THEMES[1];
}

/**
 * Resolves effective concrete theme ID ('white', 'dark', 'black', or 'warm') given an active theme ID.
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
