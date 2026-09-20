/**
 * Centralized Theme Configuration & Metadata
 * Official Design System: EDITORIAL SCHOLAR & ACADEMIC CURATOR (Alexandria Style)
 *
 * Single Official Application Theme:
 *  - Canvas: Warm Archival Parchment (#F8F6F0)
 *  - Surfaces: Porcelain Cream (#FFFDF9, #F2EFE9)
 *  - Ink: Deep Carbon/Espresso (#1F1B16, #3B352E, #70685E)
 *  - Accent: Academic Navy (#1A365D / #1B2A4A) & Aged Bronze (#8C6E54)
 *  - Hairline borders: #E5E0D5
 *
 * All previous themes (neon, purple, sunset, dark, gradient, etc.) have been sunset.
 */

export const DEFAULT_THEME = 'editorial_scholar';

export const THEMES = [
  {
    id: 'editorial_scholar',
    name: 'Editorial Scholar',
    badge: 'Alexandria Style',
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
      textMicro: '#8A8277',
      cardBg: '#FFFDF9',
      headerBg: 'rgba(255, 253, 249, 0.98)',
      inputBg: '#FFFDF9',
      selected: '#EAE6DC',
      glowPrimary: 'none',
      glowSecondary: 'none'
    },
    preview: {
      bg: '#F8F6F0',
      card: '#FFFDF9',
      primary: '#1A365D',
      secondary: '#8C6E54'
    }
  }
];

export const PRIMARY_THEMES = THEMES;
export const VALID_THEME_IDS = ['editorial_scholar'];

export function isValidTheme(themeId) {
  return typeof themeId === 'string' && themeId.toLowerCase() === 'editorial_scholar';
}

export function getThemeConfig(_themeId) {
  // Single official theme: always return Editorial Scholar
  return THEMES[0];
}
