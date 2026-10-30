import React, { useState, useEffect } from 'react';
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
  RotateCcw
} from 'lucide-react';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import Badge from './Badge';
import AiInterviewerAvatar from './video/AiInterviewerAvatar';
import VoiceWaveformIndicator from './VoiceWaveformIndicator';
import { reverseInterviewApi } from '../services/reverseInterviewApi';
import { useAuth } from '../context/AuthContext';

const SUGGESTED_INTERVIEWER_PROMPTS = [
  "Can you explain how you would design an LRU Cache, and what time complexity we should expect for get and put operations?",
  "How would you prevent duplicate transactions in an asynchronous payment processing system?",
  "If your relational database starts experiencing high lock contention on writes, what architectural steps would you take?",
  "Walk me through a scenario where poor microtask scheduling in JavaScript caused UI frame drops."
];

export default function ReverseInterviewWorkspace({ targetRole = 'Software Engineer', difficulty = 'Intermediate' }) {
  const navigate = useNavigate();
  const { addXP } = useAuth();

  const [session, setSession] = useState(null);
  const [turns, setTurns] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isCandidateThinking, setIsCandidateThinking] = useState(false);
  const [activeGuidanceTip, setActiveGuidanceTip] = useState(null);
  const [finalEvaluation, setFinalEvaluation] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize reverse session on mount
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
          setError('Failed to start reverse interview session. Please try again.');
        }
      }
    };
    start();
    return () => { mounted = false; };
  }, [targetRole, difficulty]);

  // Submit Question or Hint to Candidate Alex
  const handleSendPrompt = async (textToSend) => {
    const message = (textToSend || userInput).trim();
    if (!message || !session || isCandidateThinking) return;

    setUserInput('');
    setIsCandidateThinking(true);

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
      setError('Candidate response timed out. Please try asking again.');
    } finally {
      setIsCandidateThinking(false);
    }
  };

  // Conclude Session & Grade User
  const handleFinishSession = async () => {
    if (!session || isFinishing) return;
    setIsFinishing(true);
    try {
      const res = await reverseInterviewApi.finish(session.session_id);
      if (res.evaluation) {
        setFinalEvaluation(res.evaluation);
        addXP(60); // Reward user for completing interviewer practice
      }
    } catch (err) {
      setError('Failed to generate interviewer scorecard.');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 select-none">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & INTERVIEWER BRIEFING                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Reverse Mock Interview: You Are The Interviewer</h2>
              <Badge variant="indigo" size="xs">TECH LEAD MODE</Badge>
            </div>
            <p className="text-xs text-slate-300">
              Candidate: <strong>Alex Rivera</strong> ({targetRole} • {difficulty})
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinishSession}
          disabled={isFinishing || turns.length < 2}
          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto shadow-xs"
        >
          <Award className="w-3.5 h-3.5" />
          <span>{isFinishing ? 'Analyzing Leadership...' : 'Conclude & Grade My Interviewing'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. DUAL-COLUMN CONSOLE: AVATAR & CONVERSATION FEED            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Candidate Alex Persona & Voice Status (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="p-5 border border-slate-800 bg-slate-950/70 text-center space-y-4">
            <div className="mx-auto w-32 h-32 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
              <AiInterviewerAvatar
                personaId="julian"
                isSpeaking={isCandidateThinking}
                size="md"
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">Alex Rivera</h3>
              <p className="text-xs text-indigo-400 font-mono">Job Applicant ({difficulty})</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Receptive and thoughtful, but may propose naive algorithms first or overlook edge cases unless prompted.
              </p>
            </div>

            {isCandidateThinking && (
              <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-800/50 flex items-center justify-center gap-2">
                <VoiceWaveformIndicator isSpeaking={true} />
                <span className="text-xs font-mono text-indigo-300">Alex is formulating an answer...</span>
              </div>
            )}
          </GlassCard>

          {/* AI Co-Pilot Tip For the User */}
          {activeGuidanceTip && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                <Lightbulb className="w-4 h-4" />
                <span>Interviewer Probing Recommendation:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {activeGuidanceTip}
              </p>
            </div>
          )}

          {/* 1-Click Sample Interviewer Questions */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Calibration Questions:
            </span>
            <div className="space-y-1.5">
              {SUGGESTED_INTERVIEWER_PROMPTS.map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendPrompt(promptText)}
                  className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-700 text-xs text-slate-300 transition-colors cursor-pointer line-clamp-2"
                >
                  "{promptText}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Conversation Dialogue & Input (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex-1 min-h-[420px] max-h-[560px] overflow-y-auto p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            {turns.map((turn, idx) => {
              const isUser = turn.speaker === 'interviewer';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{isUser ? 'You (Lead Interviewer)' : 'Alex Rivera (Candidate)'}</span>
                  </div>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{turn.text}</p>

                    {turn.candidate_thought && (
                      <p className="text-[10px] italic text-indigo-300/80 mt-2 pt-2 border-t border-slate-800">
                        💭 Alex's thought: {turn.candidate_thought}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interviewer Input Box */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendPrompt();
              }}
              placeholder="Ask a technical question, probe an edge case, or give Alex a nudge..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSendPrompt()}
              disabled={isCandidateThinking || !userInput.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. INTERVIEWER LEADERSHIP EVALUATION MODAL                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {finalEvaluation && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Your Interviewer Performance Report</h3>
                  <p className="text-xs text-slate-400">
                    Graded on Question Clarity, Probing Depth &amp; Technical Mentorship
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {finalEvaluation.overall_score}/100
              </span>
            </div>

            {/* Core Leadership Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Question Clarity:</span>
                <span className="text-base font-bold font-mono text-white">
                  {finalEvaluation.question_clarity}/100
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Probing Depth:</span>
                <span className="text-base font-bold font-mono text-white">
                  {finalEvaluation.probing_depth}/100
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Hint Calibration:</span>
                <span className="text-base font-bold font-mono text-white">
                  {finalEvaluation.hint_calibration}/100
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Mentorship Bar:</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {finalEvaluation.verdict}
                </span>
              </div>
            </div>

            {/* Strengths & Growth */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block">Key Mentorship Strengths:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                {finalEvaluation.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/60 text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-indigo-400 block">Executive Coaching Advice:</span>
              <p>{finalEvaluation.interviewer_coaching_advice}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
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
