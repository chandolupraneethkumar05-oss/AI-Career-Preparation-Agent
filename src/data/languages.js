/**
 * Supported Languages Registry for Multilingual AI Feedback
 * AI Career Preparation Agent — Academic IDP Project
 * Candidate: Chandolu Praneeth Kumar (241FA18483) — Vignan University
 */

export const SUPPORTED_FEEDBACK_LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    native: 'English',
    default: true,
    description: 'Standard international technical explanations with universal hiring terminology'
  },
  {
    code: 'te',
    name: 'Telugu',
    native: 'తెలుగు',
    default: false,
    description: 'స్పష్టమైన తెలుగు విశ్లేషణ (Professional Telugu feedback with preserved English technical terms)'
  },
  {
    code: 'hi',
    name: 'Hindi',
    native: 'हिन्दी',
    default: false,
    description: 'सटीक और संरचित हिन्दी समीक्षा (Professional Hindi feedback with preserved English technical terms)'
  }
];

export const DEFAULT_FEEDBACK_LANGUAGE = 'en';

export function getLanguageDisplayName(code) {
  const lang = SUPPORTED_FEEDBACK_LANGUAGES.find(l => l.code === code) || SUPPORTED_FEEDBACK_LANGUAGES[0];
  if (lang.code === 'en') return lang.name;
  return `${lang.name} (${lang.native})`;
}

export function isValidLanguageCode(code) {
  return SUPPORTED_FEEDBACK_LANGUAGES.some(l => l.code === code);
}
