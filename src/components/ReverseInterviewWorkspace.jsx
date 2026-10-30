import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  MessageSquare,
  Sparkles,
  Send,
  Award,
  ChevronRight,
  UserCheck,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Mic,
  MicOff,
  Code2,
  Layers,
  Shield,
  ArrowRight
} from 'lucide-react';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import Badge from './Badge';
import AiInterviewerAvatar from './video/AiInterviewerAvatar';
import VoiceWaveformIndicator from './VoiceWaveformIndicator';
import { reverseInterviewApi } from '../services/reverseInterviewApi';
import { useAuth } from '../context/AuthContext';

const QUESTION_CATEGORIES = {
  dsa: {
    label: 'Algorithms & DSA',
    icon: Code2,
    questions: [
      "Can you design an LRU Cache, and what time complexity should we target for get and put operations?",
      "How would you find the longest substring without repeating characters in O(N) time?",
      "Can you explain the trade-offs between depth-first search (DFS) and breadth-first search (BFS) on graph cycle detection?"
    ]
  },
  architecture: {
    label: 'System Design',
    icon: Layers,
    questions: [
      "How would you design an idempotent payment processing API to prevent duplicate charges on network timeouts?",
      "If our relational database experiences heavy write lock contention during flash sales, what architecture would you propose?",
      "Walk me through how you'd design a distributed rate limiter across multiple service nodes."
    ]
  },
  concurrency: {
    label: 'Concurrency & DBs',
    icon: Shield,
    questions: [
      "What is the difference between optimistic locking with versioning and pessimistic row-level locking (SELECT FOR UPDATE)?",
      "How does JavaScript's Event Loop handle microtasks versus macrotasks, and why can heavy promises freeze the UI?",
      "How would you prevent a cache stampede or thundering herd problem when a popular key expires?"
    ]
  },
  behavioral: {
    label: 'STAR Behavioral',
    icon: UserCheck,
    questions: [
      "Tell me about a time you strongly disagreed with a senior engineer's architectural choice. How did you resolve it?",
      "Describe a situation where a critical production outage occurred under your watch. What was your triage protocol?"
    ]
  }
};

export default function ReverseInterviewWorkspace({ targetRole = 'Software Engineer', difficulty = 'Intermediate' }) {
  const navigate = useNavigate();
  const { addXP } = useAuth();

  const [session, setSession] = useState(null);
  const [turns, setTurns] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isCandidateThinking, setIsCandidateThinking] = useState(false);
  const [activeGuidanceTip, setActiveGuidanceTip] = useState(null);
  const [activeCategory, setActiveCategory] = useState('dsa');
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState(null);
  const [isListeningMic, setIsListeningMic] = useState(false);

  const turnsEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll conversation
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, isCandidateThinking]);

  // Initialize reverse mock session
  useEffect(() => {
    let mounted = true;
    const start = async () => {
      try {
        setError(null);
        const data = await reverseInterviewApi.start(targetRole, difficulty);
        if (mounted) {
          setSession(data.session);
          if (data.opening_turn) {
            setTurns([data.opening_turn]);
          }
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to initialize reverse interview session. Please refresh or try again.');
        }
      }
    };
    start();
    return () => { mounted = false; };
  }, [targetRole, difficulty]);

  // Web Speech API Voice Input
  const toggleSpeechRecognition = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListeningMic && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e) => {
        const spoken = e.results[0][0].transcript;
        if (spoken) {
          setUserInput((prev) => (prev ? `${prev} ${spoken}` : spoken));
        }
      };

      rec.onerror = () => {
        setIsListeningMic(false);
      };

      rec.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListeningMic(true);
    } catch (err) {
      console.warn('Speech recognition start error:', err);
      setIsListeningMic(false);
    }
  };

  // Submit Question or Hint to Candidate Alex
  const handleSendPrompt = async (textToSend) => {
    const message = (textToSend || userInput).trim();
    if (!message || !session || isCandidateThinking) return;

    setUserInput('');
    setIsCandidateThinking(true);
    setError(null);

    // Optimistically append interviewer turn
    setTurns((prev) => [
      ...prev,
      { speaker: 'interviewer', text: message, timestamp: new Date().toISOString() }
    ]);

    try {
      const res = await reverseInterviewApi.ask(session.session_id, message);
      if (res.turn) {
        setTurns((prev) => [...prev, res.turn]);
        if (res.turn.interviewer_guidance_tip) {
          setActiveGuidanceTip(res.turn.interviewer_guidance_tip);
        }
      }
    } catch (err) {
      setError('Candidate response timed out. Please try posing your question again.');
    } finally {
      setIsCandidateThinking(false);
    }
  };

  // Conclude Session & Grade User
  const handleFinishSession = async () => {
    if (!session || isFinishing) return;
    setIsFinishing(true);
    setError(null);
    try {
      const res = await reverseInterviewApi.finish(session.session_id);
      if (res.evaluation) {
        setFinalEvaluation(res.evaluation);
        addXP(60);
      }
    } catch (err) {
      setError('Failed to compile interviewer leadership scorecard.');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 select-none font-sans text-slate-900 pb-12">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & INTERVIEWER MISSION BRIEFING                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Reverse Mock Interview</h2>
              <Badge variant="indigo" size="xs">YOU ARE THE INTERVIEWER</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assessing Candidate: <strong>Alex Rivera</strong> ({targetRole} • {difficulty})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleFinishSession}
            disabled={isFinishing || turns.length < 2}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Award className="w-4 h-4 text-emerald-200" />
            <span>{isFinishing ? 'Grading Leadership...' : 'Conclude & Grade My Interviewing'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. DUAL-COLUMN CONSOLE: CANDIDATE STAGE + CONVERSATION STREAM */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Candidate Stage & Interviewer Co-Pilot (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Candidate Alex Profile Card */}
          <GlassCard className="p-5 border border-slate-200 bg-white text-center space-y-4 shadow-xs">
            <div className="mx-auto w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner flex items-center justify-center">
              <AiInterviewerAvatar
                personaId="julian"
                isSpeaking={isCandidateThinking}
                size="md"
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Alex Rivera</h3>
              <p className="text-xs text-indigo-600 font-mono font-medium">{targetRole} Applicant ({difficulty})</p>
              <p className="text-xs text-slate-500 leading-relaxed pt-1">
                Knows core CS algorithms, but may overlook edge cases, proposes quadratic solutions first, or assumes unbounded memory unless guided by your questions.
              </p>
            </div>

            {isCandidateThinking ? (
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center gap-2">
                <VoiceWaveformIndicator isSpeaking={true} />
                <span className="text-xs font-mono text-indigo-700 font-medium">Alex is thinking &amp; speaking...</span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-2 text-xs font-mono text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Alex is waiting for your question or hint</span>
              </div>
            )}
          </GlassCard>

          {/* AI Interviewer Co-Pilot Guidance Card */}
          {activeGuidanceTip && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Interviewer Probing Recommendation:</span>
                </div>
                <Badge variant="amber" size="xs">CO-PILOT</Badge>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed font-sans">
                {activeGuidanceTip}
              </p>
              <button
                type="button"
                onClick={() => setUserInput(activeGuidanceTip)}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 underline flex items-center gap-1 cursor-pointer"
              >
                <span>Use as question prompt</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* 1-Click Curated Prompt Presets */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Curated Challenge Presets:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Click to test Alex</span>
            </div>

            {/* Category Switcher Pills */}
            <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-2">
              {Object.entries(QUESTION_CATEGORIES).map(([key, cat]) => {
                const IconComp = cat.icon;
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <IconComp className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Questions for Active Category */}
            <div className="space-y-1.5">
              {QUESTION_CATEGORIES[activeCategory]?.questions.map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendPrompt(promptText)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs text-slate-800 transition-colors cursor-pointer line-clamp-2"
                >
                  "{promptText}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Conversation Timeline & Voice Console (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex-1 min-h-[480px] max-h-[640px] overflow-y-auto p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            {turns.map((turn, idx) => {
              const isUser = turn.speaker === 'interviewer';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{isUser ? 'You (Lead Interviewer)' : 'Alex Rivera (Candidate)'}</span>
                  </div>
                  <div
                    className={`max-w-[88%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-xs'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{turn.text}</p>

                    {turn.candidate_thought && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-indigo-700 italic font-sans flex items-start gap-1.5">
                        <span className="shrink-0">💭</span>
                        <span>Alex's Internal Thought: {turn.candidate_thought}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={turnsEndRef} />
          </div>

          {/* Interviewer Console Input */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isListeningMic
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={isListeningMic ? 'Stop Mic Dictation' : 'Speak Your Question via Mic'}
            >
              {isListeningMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendPrompt();
              }}
              placeholder="Ask a technical question, probe an edge case, or nudge Alex on complexity..."
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => handleSendPrompt()}
              disabled={isCandidateThinking || !userInput.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. INTERVIEWER LEADERSHIP EVALUATION MODAL                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {finalEvaluation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Your Interviewer Leadership Scorecard</h3>
                  <p className="text-xs text-slate-500">
                    Graded on Question Clarity, Probing Depth &amp; Technical Mentorship
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {finalEvaluation.overall_score}/100
                </span>
                <span className="block text-[10px] text-slate-400 font-mono uppercase">Leadership Score</span>
              </div>
            </div>

            {/* Core Leadership Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Question Clarity:</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {finalEvaluation.question_clarity}/100
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Probing Depth:</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {finalEvaluation.probing_depth}/100
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Hint Calibration:</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {finalEvaluation.hint_calibration}/100
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 space-y-1">
                <span className="text-indigo-700 font-semibold block">Mentorship Verdict:</span>
                <span className="text-base font-bold text-indigo-900">
                  {finalEvaluation.verdict}
                </span>
              </div>
            </div>

            {/* Strengths & Growth */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-800 block">Key Interviewing Strengths:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                {finalEvaluation.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
              <span className="font-bold text-indigo-900 block">Executive Coaching Advice:</span>
              <p className="leading-relaxed">{finalEvaluation.interviewer_coaching_advice}</p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <GradientButton onClick={() => navigate('/dashboard')} variant="emerald" size="md">
                <span>Back to Dashboard (+60 XP)</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
