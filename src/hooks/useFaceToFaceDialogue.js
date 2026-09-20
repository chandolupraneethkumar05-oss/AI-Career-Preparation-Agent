import { useState, useEffect, useRef, useCallback } from 'react';
import { getInterviewerPersona } from '../data/interviewerPersonas';

/**
 * useFaceToFaceDialogue Hook
 * Orchestrates natural conversational audio dialogue, text-to-speech synthesis,
 * turn-taking events, and viseme timing for the Face-to-Face AI Chamber.
 */
export function useFaceToFaceDialogue({
  personaId = 'julian',
  language = 'en',
  isMuted = false
} = {}) {
  const persona = getInterviewerPersona(personaId);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const selectedVoiceRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  // Load available system voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Find optimal voice matching persona gender and target language
      const targetLang = language === 'te' ? 'te' : language === 'hi' ? 'hi' : language === 'es' ? 'es' : 'en';
      const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(targetLang));

      const pool = langVoices.length > 0 ? langVoices : voices;
      const prefGender = persona.voiceSettings?.preferredGender || 'male';

      // Pick natural or neural voice if present
      let matchedVoice = pool.find(v => {
        const name = v.name.toLowerCase();
        if (prefGender === 'female') {
          return name.includes('female') || name.includes('zira') || name.includes('samantha') || name.includes('karen') || name.includes('google us english');
        } else {
          return name.includes('male') || name.includes('david') || name.includes('george') || name.includes('guy') || name.includes('daniel');
        }
      });

      if (!matchedVoice && pool.length > 0) {
        matchedVoice = pool[0];
      }

      selectedVoiceRef.current = matchedVoice;
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [personaId, language]);

  // Stop any active speech synthesis
  const stopSpeaking = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsInterviewerSpeaking(false);
  }, []);

  // Speak a prompt aloud
  const speakQuestion = useCallback((text, onEndCallback) => {
    if (!('speechSynthesis' in window) || isMuted || !text) {
      setIsInterviewerSpeaking(false);
      onEndCallback?.();
      return;
    }

    window.speechSynthesis.cancel();

    // Strip Markdown symbols or code fences for cleaner verbal articulation
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = persona.voiceSettings?.rate || 1.0;
    utterance.pitch = persona.voiceSettings?.pitch || 1.0;

    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    utterance.onstart = () => {
      setIsInterviewerSpeaking(true);
    };

    utterance.onend = () => {
      setIsInterviewerSpeaking(false);
      onEndCallback?.();
    };

    utterance.onerror = (e) => {
      console.warn('[useFaceToFaceDialogue] Speech synthesis notice:', e);
      setIsInterviewerSpeaking(false);
      onEndCallback?.();
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsInterviewerSpeaking(true);
  }, [persona, isMuted]);

  return {
    isInterviewerSpeaking,
    speakQuestion,
    stopSpeaking,
    persona
  };
}
