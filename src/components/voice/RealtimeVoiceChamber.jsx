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
    stage: 'Architecture & System Design',
    questionText: ''
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
  const latestTranscriptRef = useRef('');

  const isMicActiveRef = useRef(isMicActive);
  isMicActiveRef.current = isMicActive;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const voiceStateRef = useRef(voiceState);
  voiceStateRef.current = voiceState;
  const isCompletedRef = useRef(false);

  useEffect(() => {
    const isDone =
      questionProgress.stage === 'Interview Completed' ||
      questionProgress.current > questionProgress.total ||
      voiceState === VoiceState.ENDED;
    isCompletedRef.current = isDone;
    if (isDone && recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.abort();
        isRecognitionRunningRef.current = false;
      } catch (_) {}
    }
  }, [questionProgress, voiceState]);

  // Call duration counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

    const answer = (
      (typeof customText === 'string' && customText.trim()) ||
      manualInput.trim() ||
      liveSpeechTranscript.trim() ||
      latestTranscriptRef.current.trim() ||
      "[Candidate provided verbal answer]"
    ).trim();

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
    latestTranscriptRef.current = '';
  }, [liveSpeechTranscript, manualInput]);

  // Safe Recognition Helpers
  const startRecognition = useCallback(() => {
    if (!recognitionRef.current || isRecognitionRunningRef.current || isCompletedRef.current) return;
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

  // Initialize Realtime Voice Session & Client
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
          onQuestionChange: (current, total, stage, questionText) => {
            setQuestionProgress({ current, total, stage, questionText: questionText || '' });
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

  // Web Speech Recognition for Real-Time Speech-to-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition = null;
    let isMounted = true;

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
      };

      recognition.onresult = (event) => {
        // If AI is currently speaking and user speaks, trigger barge-in interrupt immediately
        if (voiceStateRef.current === VoiceState.AI_SPEAKING && clientRef.current) {
          clientRef.current.interrupt();
          return;
        }

        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        fullTranscript = fullTranscript.trim();

        if (fullTranscript) {
          latestTranscriptRef.current = fullTranscript;
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
            if (fullTranscript && !isCompletedRef.current) {
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
        if (
          isMounted &&
          isMicActiveRef.current &&
          !isMutedRef.current &&
          !isCompletedRef.current &&
          voiceStateRef.current === VoiceState.LISTENING
        ) {
          setTimeout(() => {
            if (
              isMounted &&
              isMicActiveRef.current &&
              !isMutedRef.current &&
              !isCompletedRef.current &&
              !isRecognitionRunningRef.current
            ) {
              try {
                recognition.start();
              } catch (_) {}
            }
          }, 250);
        }
      };

      recognitionRef.current = recognition;

      if (isMicActiveRef.current && !isMutedRef.current && !isCompletedRef.current) {
        try {
          recognition.start();
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[SpeechRecognition] Initialization failed:', err);
    }

    return () => {
      isMounted = false;
      if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
      if (speechCountdownIntervalRef.current) clearInterval(speechCountdownIntervalRef.current);
      if (recognition) {
        try {
          recognition.abort();
          isRecognitionRunningRef.current = false;
        } catch (_) {}
      }
    };
  }, [submitCandidateAnswer]);

  // Synchronize Recognition Lifecycle with Voice State
  useEffect(() => {
    if (voiceState === VoiceState.LISTENING && isMicActive && !isMuted && !isCompletedRef.current) {
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
        <div className="mt-4 p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E5E0D5]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div className="flex items-center gap-2 font-serif font-bold text-[#1A365D]">
              <Layers className="w-4 h-4" />
              <span>Question {Math.min(questionProgress.current, questionProgress.total)} of {questionProgress.total}</span>
              <span className="text-[#70685E] font-normal">• {questionProgress.stage}</span>
            </div>
            <span className="font-mono text-[11px] text-[#70685E]">
              {Math.round((Math.min(questionProgress.current, questionProgress.total) / questionProgress.total) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-[#E5E0D5] h-2 rounded-full overflow-hidden">
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

      {/* Main Body: Either Completed Interview View OR Active Question Voice Chamber */}
      {isInterviewCompleted ? (
        /* INTERVIEW COMPLETED STATE */
        <div className="my-auto py-10 px-6 flex flex-col items-center justify-center text-center max-w-xl mx-auto rounded-2xl bg-[#FFFDF9] border border-[#BAC7D5] shadow-sm animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#235E3B] text-white flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-[#4ADE80]" />
          </div>
          <h3 className="text-xl font-serif font-bold text-[#1F1B16]">
            All 5 Technical Questions Completed!
          </h3>
          <p className="text-xs text-[#70685E] mt-2 mb-6 max-w-md leading-relaxed">
            Congratulations! You have completed all 5 technical interview stages for the <strong>{setup.targetRole}</strong> role. Click below to view your full 5-axis score report, rubric grading, and personalized improvement plan.
          </p>
          <GradientButton
            size="lg"
            variant="primary"
            onClick={handleEndInterview}
            icon={ChevronRight}
            className="shadow-md cursor-pointer px-8 py-3 text-sm"
          >
            View Comprehensive Feedback Report
          </GradientButton>
        </div>
      ) : (
        /* ACTIVE INTERVIEW CHAMBER */
        <div className="py-4 flex flex-col items-center justify-center space-y-4">
          {/* Current Question Text Card */}
          {questionProgress.questionText && (
            <div className="w-full max-w-2xl p-4 rounded-xl bg-[#FFFDF9] border-2 border-[#1A365D]/20 shadow-xs text-left">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#1A365D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Stage {questionProgress.current} • {questionProgress.stage}
                </span>
                {getStateBadge()}
              </div>
              <p className="text-sm font-serif font-semibold text-[#1F1B16] leading-relaxed">
                {questionProgress.questionText}
              </p>
            </div>
          )}

          {/* Central Animated Orb */}
          <div className="relative flex items-center justify-center my-2">
            <div
              className="absolute rounded-full transition-all duration-150 ease-out pointer-events-none"
              style={{
                width: `${130 + aiVol * 110}px`,
                height: `${130 + aiVol * 110}px`,
                backgroundColor: voiceState === VoiceState.AI_SPEAKING
                  ? 'rgba(34, 197, 94, 0.15)'
                  : voiceState === VoiceState.INTERRUPTED
                  ? 'rgba(234, 88, 12, 0.15)'
                  : 'rgba(26, 54, 93, 0.08)',
                filter: 'blur(16px)'
              }}
            />

            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border relative z-10"
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
                <Sparkles className={`w-7 h-7 ${voiceState === VoiceState.AI_SPEAKING ? 'text-[#4ADE80] animate-spin' : 'text-[#BAC7D5]'}`} style={{ animationDuration: '6s' }} />
                <span className="text-[10px] font-mono tracking-wider uppercase mt-1 text-[#BAC7D5]">
                  {voiceState === VoiceState.AI_SPEAKING ? 'Speaking' : 'Listening'}
                </span>
              </div>
            </div>
          </div>

          {/* Instant Interrupt Button (When AI is speaking) */}
          {voiceState === VoiceState.AI_SPEAKING && (
            <button
              type="button"
              onClick={handleInterrupt}
              className="px-5 py-2 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all animate-pulse cursor-pointer"
              title="Interrupt AI to begin speaking immediately"
            >
              <Zap className="w-4 h-4 fill-amber-200 text-amber-200" />
              <span>Interrupt AI (Stop Speaking &amp; Answer)</span>
            </button>
          )}

          {/* Mic Volume Level & Quick Mic Control */}
          <div className="flex flex-col items-center space-y-1.5">
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

          {/* PERMANENT, ALWAYS-VISIBLE PRIMARY SUBMIT & ANSWER ACTION BAR */}
          <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3 mt-1">
            {/* Live speech transcription preview card */}
            <div className="w-full p-3 rounded-lg bg-[#FAF8F3] border border-[#BAC7D5] flex items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2 truncate flex-1">
                <Mic className={`w-4 h-4 shrink-0 ${isMicActive && !isMuted ? 'text-[#1A365D] animate-pulse' : 'text-[#70685E]'}`} />
                <span className="font-semibold text-[#1A365D] shrink-0">Your Answer:</span>
                <span className="text-[#1F1B16] italic truncate">
                  {liveSpeechTranscript || manualInput || (isMicActive && !isMuted ? "Speak your answer or click 'Submit My Answer' below..." : "Mic stopped. Click 'Start Mic' to speak, or type below...")}
                </span>
              </div>
              {silenceCountdown !== null && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#CDE5D4] text-[#235E3B] shrink-0 animate-pulse">
                  Auto-submitting in {silenceCountdown}s
                </span>
              )}
            </div>

            {/* UNMISSABLE PRIMARY ACTION BUTTONS */}
            <div className="flex items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => submitCandidateAnswer()}
                className="flex-1 max-w-xs py-3 px-6 rounded-lg bg-[#1A365D] hover:bg-[#132845] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                title="Submit your spoken or typed answer to advance to the next question"
              >
                <CheckCircle2 className="w-4.5 h-4.5 text-[#4ADE80]" />
                <span>Submit My Answer</span>
              </button>

              <button
                type="button"
                onClick={handleSkipQuestion}
                className="py-3 px-5 rounded-lg bg-[#FAF8F3] hover:bg-[#EAEFF5] border border-[#BAC7D5] text-[#70685E] hover:text-[#1A365D] font-semibold text-xs transition-colors cursor-pointer"
                title="Skip this question and move to the next stage"
              >
                Skip Question →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Log (Always Visible) */}
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between text-xs font-serif font-bold text-[#70685E] px-1">
          <span>Live Conversation Captions ({turns.length} turns)</span>
          <span className="text-[10px] font-mono uppercase text-[#1A365D]">Turn-by-Turn Audio Stream</span>
        </div>
        <div
          ref={transcriptScrollRef}
          className="max-h-36 overflow-y-auto p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-3 font-sans text-xs"
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

        {/* Text Input Option for Candidates Who Prefer Typing */}
        {!isInterviewCompleted && (
          <div className="pt-2">
            <form onSubmit={handleManualFormSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Prefer typing? Type your answer here and press Enter or Submit..."
                className="flex-1 px-3.5 py-2 rounded-md bg-[#FFFDF9] border border-[#BAC7D5] text-xs text-[#1F1B16] focus:outline-none focus:border-[#1A365D] shadow-inner"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1A365D] hover:bg-[#132845] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Answer</span>
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
            disabled={isInterviewCompleted}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
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
            disabled={isInterviewCompleted}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
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
