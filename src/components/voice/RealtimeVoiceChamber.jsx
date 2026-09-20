import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Radio,
  Clock,
  Zap,
  Send,
  CheckCircle2,
  ChevronRight,
  Layers,
  Square,
  Play
} from 'lucide-react';
import Badge from '../Badge';
import GradientButton from '../GradientButton';
import { RealtimeVoiceClient, VoiceState } from '../../services/voice/realtimeVoiceClient';
import { realtimeVoiceApi } from '../../services/realtimeVoiceApi';

export default function RealtimeVoiceChamber({
  session,
  setup,
  onCompleteInterview,
  onCancel
}) {
  const [voiceSession, setVoiceSession] = useState(null);
  const [voiceState, setVoiceState] = useState(VoiceState.CONNECTING);
  const [candidateVol, setCandidateVol] = useState(0);
  const [aiVol, setAiVol] = useState(0);
  const [isMicActive, setIsMicActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [interruptedFlash, setInterruptedFlash] = useState(false);
  const [turns, setTurns] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // 5-Question Multi-Turn Tracking
  const [questionProgress, setQuestionProgress] = useState({
    current: 1,
    total: 5,
    stage: 'Architecture & System Design'
  });
  const [manualInput, setManualInput] = useState('');
  const [liveSpeechTranscript, setLiveSpeechTranscript] = useState('');
  const [silenceCountdown, setSilenceCountdown] = useState(null);

  const recognitionRef = useRef(null);
  const isRecognitionRunningRef = useRef(false);
  const speechSilenceTimerRef = useRef(null);
  const speechCountdownIntervalRef = useRef(null);

  const transcriptScrollRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let activeClient = null;

    async function initVoice() {
      try {
        setVoiceState(VoiceState.CONNECTING);
        const sess = await realtimeVoiceApi.createSession({
          role: setup.targetRole || 'Machine Learning Engineer',
          difficulty: setup.difficulty || 'Intermediate',
          topic: setup.interviewType || 'System Design & Algorithms',
          interview_id: session?.id,
          voice_name: 'Puck'
        });
        setVoiceSession(sess);

        const client = new RealtimeVoiceClient({
          sessionData: sess,
          onStateChange: (st) => {
            setVoiceState(st);
            if (st === VoiceState.INTERRUPTED) {
              setInterruptedFlash(true);
              setTimeout(() => setInterruptedFlash(false), 2000);
            }
          },
          onQuestionChange: (current, total, stage) => {
            setQuestionProgress({ current, total, stage });
          },
          onTranscriptTurn: (turn) => {
            setTurns((prev) => [...prev, turn]);
            if (sess?.session_id) {
              realtimeVoiceApi.appendTurn(sess.session_id, turn.speaker, turn.text).catch(() => {});
            }
          },
          onCandidateVolume: (v) => setCandidateVol(v),
          onAIVolume: (v) => setAiVol(v),
          onError: (err) => setErrorMessage(err?.message || 'Voice connection failed')
        });

        activeClient = client;
        clientRef.current = client;
        await client.connect();
      } catch (err) {
        setErrorMessage(err?.message || 'Failed to initialize voice session');
        setVoiceState(VoiceState.ERROR);
      }
    }

    initVoice();

    return () => {
      if (activeClient) {
        activeClient.disconnect();
      }
    };
  }, [setup, session]);

  // Submit candidate answer (from speech or text)
  const submitCandidateAnswer = useCallback((customText) => {
    if (speechSilenceTimerRef.current) {
      clearTimeout(speechSilenceTimerRef.current);
      speechSilenceTimerRef.current = null;
    }
    if (speechCountdownIntervalRef.current) {
      clearInterval(speechCountdownIntervalRef.current);
      speechCountdownIntervalRef.current = null;
    }
    setSilenceCountdown(null);

    const answer = (typeof customText === 'string' ? customText : (liveSpeechTranscript || manualInput)).trim();
    if (!answer) return;

    // Temporarily pause speech recognition while AI evaluates & speaks
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.abort();
        isRecognitionRunningRef.current = false;
      } catch (_) {}
    }

    if (clientRef.current) {
      clientRef.current.recordCandidateSpeech(answer);
    }

    setLiveSpeechTranscript('');
    setManualInput('');
  }, [liveSpeechTranscript, manualInput]);

  // Safe Recognition Helpers
  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || isRecognitionRunningRef.current) return;
    try {
      recognitionRef.current.start();
      isRecognitionRunningRef.current = true;
    } catch (_) {}
  }, []);

  const stopRecognition = useCallback(() => {
    if (!recognitionRef.current || !isRecognitionRunningRef.current) return;
    try {
      recognitionRef.current.abort();
      isRecognitionRunningRef.current = false;
    } catch (_) {}
  }, []);

  // Web Speech Recognition for Real-Time Speech-to-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
      };

      recognition.onresult = (event) => {
        // If AI is currently speaking and user speaks, trigger barge-in interrupt immediately
        if (voiceState === VoiceState.AI_SPEAKING && clientRef.current) {
          console.log('[RealtimeVoiceChamber] User speech detected during AI talk -> Triggering interrupt');
          clientRef.current.interrupt();
          return;
        }

        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        fullTranscript = fullTranscript.trim();

        if (fullTranscript) {
          setLiveSpeechTranscript(fullTranscript);

          // Reset silence countdown timer
          if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
          if (speechCountdownIntervalRef.current) clearInterval(speechCountdownIntervalRef.current);

          setSilenceCountdown(2);
          let seconds = 2;
          speechCountdownIntervalRef.current = setInterval(() => {
            seconds -= 1;
            if (seconds > 0) {
              setSilenceCountdown(seconds);
            } else {
              clearInterval(speechCountdownIntervalRef.current);
              setSilenceCountdown(null);
            }
          }, 1000);

          speechSilenceTimerRef.current = setTimeout(() => {
            if (fullTranscript) {
              submitCandidateAnswer(fullTranscript);
            }
          }, 2400);
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('[SpeechRecognition] Error:', e.error);
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;
        // Only restart if mic is active, unmuted, not ended, and in listening state
        if (isMicActive && !isMuted && voiceState === VoiceState.LISTENING) {
          try {
            recognition.start();
            isRecognitionRunningRef.current = true;
          } catch (_) {}
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('[SpeechRecognition] Initialization failed:', err);
    }

    return () => {
      if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
      if (speechCountdownIntervalRef.current) clearInterval(speechCountdownIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          isRecognitionRunningRef.current = false;
        } catch (_) {}
      }
    };
  }, [voiceState, isMicActive, isMuted, submitCandidateAnswer]);

  // Synchronize Recognition Lifecycle with Voice State
  useEffect(() => {
    if (voiceState === VoiceState.LISTENING && isMicActive && !isMuted) {
      startRecognition();
    } else if (
      voiceState === VoiceState.AI_SPEAKING ||
      voiceState === VoiceState.THINKING ||
      voiceState === VoiceState.ENDED ||
      voiceState === VoiceState.ERROR
    ) {
      stopRecognition();
    }
  }, [voiceState, isMicActive, isMuted, startRecognition, stopRecognition]);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [turns]);

  // User Actions
  const handleInterrupt = () => {
    if (clientRef.current) {
      clientRef.current.interrupt();
    }
  };

  const toggleMicActive = () => {
    const nextState = !isMicActive;
    setIsMicActive(nextState);

    if (clientRef.current) {
      clientRef.current.setMute(!nextState || isMuted);
    }

    if (!nextState) {
      if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
      if (speechCountdownIntervalRef.current) clearInterval(speechCountdownIntervalRef.current);
      setSilenceCountdown(null);
      stopRecognition();
    } else {
      if (voiceState === VoiceState.LISTENING && !isMuted) {
        startRecognition();
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (clientRef.current) {
      clientRef.current.setMute(nextMuted || !isMicActive);
    }
    if (nextMuted) {
      stopRecognition();
    } else if (isMicActive && voiceState === VoiceState.LISTENING) {
      startRecognition();
    }
  };

  const handleManualFormSubmit = (e) => {
    if (e) e.preventDefault();
    submitCandidateAnswer();
  };

  const handleSkipQuestion = () => {
    if (clientRef.current) {
      clientRef.current.skipToNextQuestion();
    }
    setManualInput('');
    setLiveSpeechTranscript('');
    setSilenceCountdown(null);
  };

  const handleEndInterview = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    stopRecognition();
    setVoiceState(VoiceState.ENDED);
    if (onCompleteInterview) {
      onCompleteInterview(turns);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStateBadge = () => {
    switch (voiceState) {
      case VoiceState.AI_SPEAKING:
        return <Badge variant="emerald" size="sm" className="animate-pulse">AI Speaking</Badge>;
      case VoiceState.LISTENING:
        return <Badge variant="navy" size="sm">Listening to You</Badge>;
      case VoiceState.INTERRUPTED:
        return <Badge variant="bronze" size="sm">Barge-in Interrupted</Badge>;
      case VoiceState.THINKING:
        return <Badge variant="navy" size="sm" className="animate-pulse">AI Evaluating &amp; Formulating...</Badge>;
      case VoiceState.CONNECTING:
        return <Badge variant="outline" size="sm">Connecting Live...</Badge>;
      case VoiceState.ERROR:
        return <Badge variant="bronze" size="sm">Connection Error</Badge>;
      default:
        return <Badge variant="outline" size="sm">{voiceState}</Badge>;
    }
  };

  const isInterviewCompleted = questionProgress.stage === 'Interview Completed' || questionProgress.current > questionProgress.total;

  return (
    <div className="min-h-[85vh] flex flex-col justify-between p-4 sm:p-6 lg:p-8 bg-[#F8F6F0] text-[#1F1B16] rounded-xl border border-[#E5E0D5] shadow-sm">
      {/* Top Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#1B2A4A] text-white flex items-center justify-center shadow-xs">
              <Radio className="w-4 h-4 animate-pulse text-[#4ADE80]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-[#1F1B16]">
                  Real-Time Voice Interview
                </h2>
                {getStateBadge()}
              </div>
              <p className="text-xs text-[#70685E] flex items-center gap-2 mt-0.5">
                <span>{setup.targetRole} ({setup.difficulty})</span>
                <span>•</span>
                <span className="font-mono text-[11px]">
                  {voiceSession?.mode === 'live' ? 'Google Gemini Live WebSocket' : 'Interactive Multi-Turn Voice Session'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {interruptedFlash && (
              <div className="px-3 py-1 rounded-full bg-[#FDF2E9] border border-[#F0C9B3] text-[#9A421A] text-xs font-bold font-mono animate-bounce flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Candidate Barge-in Detected
              </div>
            )}
            <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1A365D]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(callDuration)}</span>
            </div>
          </div>
        </div>

        {/* 5-Question Progress Header */}
        <div className="mt-4 p-3 rounded-lg bg-[#FAF8F3] border border-[#E5E0D5]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2 font-serif font-bold text-[#1A365D]">
              <Layers className="w-3.5 h-3.5" />
              <span>Question {Math.min(questionProgress.current, questionProgress.total)} of {questionProgress.total}</span>
              <span className="text-[#70685E] font-normal">• {questionProgress.stage}</span>
            </div>
            <span className="font-mono text-[11px] text-[#70685E]">
              {Math.round((Math.min(questionProgress.current, questionProgress.total) / questionProgress.total) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-[#E5E0D5] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1A365D] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(Math.min(questionProgress.current, questionProgress.total) / questionProgress.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="my-3 p-3 rounded-md bg-[#FDF2E9] border border-[#F0C9B3] text-xs text-[#9A421A]">
          {errorMessage}
        </div>
      )}

      {/* Completion Banner */}
      {isInterviewCompleted && (
        <div className="my-4 p-4 rounded-lg bg-[#EBF4EE] border border-[#CDE5D4] text-xs text-[#235E3B] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#235E3B] shrink-0" />
            <div>
              <strong className="block font-serif font-bold text-sm text-[#1B4D2E]">All 5 Questions Successfully Completed!</strong>
              <span>You have completed the oral technical evaluation. Click below to view your 5-axis score breakdown.</span>
            </div>
          </div>
          <GradientButton
            size="sm"
            variant="primary"
            onClick={handleEndInterview}
            icon={ChevronRight}
          >
            View Feedback Report
          </GradientButton>
        </div>
      )}

      {/* Central Visualizer & Core Interactive Voice Hub */}
      <div className="py-6 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full transition-all duration-150 ease-out pointer-events-none"
            style={{
              width: `${140 + aiVol * 120}px`,
              height: `${140 + aiVol * 120}px`,
              backgroundColor: voiceState === VoiceState.AI_SPEAKING
                ? 'rgba(34, 197, 94, 0.15)'
                : voiceState === VoiceState.INTERRUPTED
                ? 'rgba(234, 88, 12, 0.15)'
                : 'rgba(26, 54, 93, 0.08)',
              filter: 'blur(16px)'
            }}
          />

          <div
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border relative z-10"
            style={{
              backgroundColor: voiceState === VoiceState.AI_SPEAKING
                ? '#1B2A4A'
                : voiceState === VoiceState.INTERRUPTED
                ? '#7C2D12'
                : '#1F1B16',
              borderColor: voiceState === VoiceState.AI_SPEAKING
                ? '#22C55E'
                : '#BAC7D5',
              transform: `scale(${1.0 + (voiceState === VoiceState.AI_SPEAKING ? aiVol * 0.15 : 0)})`
            }}
          >
            <div className="flex flex-col items-center justify-center text-center p-2 text-white">
              <Sparkles className={`w-8 h-8 ${voiceState === VoiceState.AI_SPEAKING ? 'text-[#4ADE80] animate-spin' : 'text-[#BAC7D5]'}`} style={{ animationDuration: '6s' }} />
              <span className="text-[11px] font-mono tracking-wider uppercase mt-1 text-[#BAC7D5]">
                {voiceState === VoiceState.AI_SPEAKING ? 'Speaking' : 'Listening'}
              </span>
            </div>
          </div>
        </div>

        {/* Instant Interrupt Button (Available whenever AI is speaking) */}
        {voiceState === VoiceState.AI_SPEAKING && (
          <button
            type="button"
            onClick={handleInterrupt}
            className="px-4 py-2 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all animate-pulse cursor-pointer"
            title="Interrupt AI and begin speaking immediately"
          >
            <Zap className="w-4 h-4 fill-amber-200 text-amber-200" />
            <span>Interrupt AI (Stop Speaking)</span>
          </button>
        )}

        {/* Candidate Mic Controls & Level Bar */}
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#70685E] font-medium flex items-center gap-1.5">
              <Mic className={`w-3.5 h-3.5 ${isMicActive && !isMuted ? 'text-[#1A365D]' : 'text-[#70685E]'}`} />
              <span>
                {!isMicActive
                  ? 'Microphone is Stopped'
                  : isMuted
                  ? 'Microphone is Muted'
                  : 'Microphone Active (Speak naturally)'}
              </span>
            </div>

            {/* Quick Stop/Start Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleMicActive}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                isMicActive
                  ? 'bg-[#FAF8F3] hover:bg-[#F2EFE9] border-[#BAC7D5] text-[#1A365D]'
                  : 'bg-[#FDF2E9] hover:bg-[#FBE5D6] border-[#F0C9B3] text-[#9A421A]'
              }`}
            >
              {isMicActive ? (
                <>
                  <Square className="w-3 h-3 fill-[#1A365D] text-[#1A365D]" />
                  <span>Stop Mic</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-[#9A421A] text-[#9A421A]" />
                  <span>Start Mic</span>
                </>
              )}
            </button>
          </div>

          <div className="w-48 h-2 bg-[#E5E0D5] rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[#1A365D] rounded-full transition-all duration-75"
              style={{ width: `${isMicActive && !isMuted ? Math.max(4, candidateVol * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Live Detected Speech Chip with "Done Speaking" Action */}
        {liveSpeechTranscript && (
          <div className="max-w-xl w-full p-3 rounded-lg bg-[#EBF4EE] border border-[#CDE5D4] text-xs text-[#1F1B16] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-start gap-2.5 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full bg-[#235E3B] animate-ping mt-1 shrink-0" />
              <div className="truncate">
                <div className="text-[11px] font-bold text-[#235E3B] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Transcribed Answer</span>
                  {silenceCountdown !== null && (
                    <span className="font-mono text-[#70685E] font-normal">
                      (Auto-submitting in {silenceCountdown}s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#1F1B16] italic line-clamp-2 mt-0.5">
                  "{liveSpeechTranscript}"
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => submitCandidateAnswer()}
              className="px-3.5 py-1.5 rounded-md bg-[#235E3B] hover:bg-[#1B4D2E] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs self-end sm:self-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Done Speaking</span>
            </button>
          </div>
        )}
      </div>

      {/* Transcript Log */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-serif font-bold text-[#70685E] px-1">
          <span>Live Conversation Captions ({turns.length} turns)</span>
          <span className="text-[10px] font-mono uppercase text-[#1A365D]">Turn-by-Turn Audio Stream</span>
        </div>
        <div
          ref={transcriptScrollRef}
          className="max-h-40 overflow-y-auto p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-3 font-sans text-xs"
        >
          {turns.length === 0 ? (
            <div className="text-center py-6 text-[#70685E] italic">
              Connecting to voice interviewer... Spoken dialogue and AI questions will stream here in real time.
            </div>
          ) : (
            turns.map((t, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${t.speaker === 'candidate' ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] font-mono text-[#70685E] mb-0.5">
                  {t.speaker === 'candidate' ? 'You (Candidate)' : 'AI Interviewer (Gemini)'}
                </div>
                <div
                  className={`max-w-[85%] p-2.5 rounded-md leading-relaxed ${
                    t.speaker === 'candidate'
                      ? 'bg-[#EAEFF5] text-[#1A365D] border border-[#BAC7D5]'
                      : 'bg-[#FFFDF9] text-[#1F1B16] border border-[#E5E0D5]'
                  }`}
                >
                  {t.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Candidate Interactive Response Bar (Speak or Type to Advance) */}
        {!isInterviewCompleted && (
          <div className="pt-2">
            <form onSubmit={handleManualFormSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={isMicActive ? "Speak into microphone or type your response here..." : "Type your response here (or click Start Mic)..."}
                className="flex-1 px-3.5 py-2 rounded-md bg-[#FFFDF9] border border-[#BAC7D5] text-xs text-[#1F1B16] focus:outline-none focus:border-[#1A365D] shadow-inner"
              />
              <button
                type="submit"
                disabled={!manualInput.trim() && !liveSpeechTranscript.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1A365D] hover:bg-[#132845] text-white text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Answer</span>
              </button>
              <button
                type="button"
                onClick={handleSkipQuestion}
                className="px-3 py-2 rounded-md bg-[#FAF8F3] hover:bg-[#EAEFF5] border border-[#BAC7D5] text-[#70685E] hover:text-[#1A365D] text-xs font-semibold transition-colors cursor-pointer"
                title="Advance to next question"
              >
                Next Question →
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E5E0D5] mt-4">
        <div className="flex items-center gap-2">
          {/* Dedicated Stop/Start Mic Button */}
          <button
            type="button"
            onClick={toggleMicActive}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
              isMicActive
                ? 'bg-[#FFFDF9] hover:bg-[#FAF8F3] border-[#E5E0D5] text-[#1F1B16]'
                : 'bg-[#FDF2E9] border-[#F0C9B3] text-[#9A421A]'
            }`}
          >
            {isMicActive ? <Square className="w-3.5 h-3.5 fill-[#1F1B16]" /> : <Play className="w-3.5 h-3.5 fill-[#9A421A]" />}
            <span>{isMicActive ? 'Stop Mic' : 'Start Mic'}</span>
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-[#FDF2E9] border-[#F0C9B3] text-[#9A421A]'
                : 'bg-[#FFFDF9] hover:bg-[#FAF8F3] border-[#E5E0D5] text-[#1F1B16]'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-[#9A421A]" /> : <Mic className="w-4 h-4 text-[#70685E]" />}
            <span>{isMuted ? 'Muted' : 'Mute'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] hover:bg-[#FAF8F3] transition-colors cursor-pointer"
            >
              Exit
            </button>
          )}
          <GradientButton
            size="sm"
            variant="primary"
            onClick={handleEndInterview}
            icon={PhoneOff}
          >
            End Interview &amp; Generate Report
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
