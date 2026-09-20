import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Bug,
  HelpCircle,
  PlaySquare,
  Sparkles,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  History,
  TrendingUp,
  Award
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { skillArenaApi } from '../services/skillArenaApi';
import { skillApi } from '../services/skillApi';

const PRACTICE_MODES = [
  {
    id: 'all',
    label: 'All Modes',
    icon: Sparkles,
    description: 'Career-prioritized challenges across all technical modes'
  },
  {
    id: 'coding',
    label: 'Coding Challenge',
    icon: Code2,
    description: 'Algorithmic & functional implementation'
  },
  {
    id: 'debug',
    label: 'Debug Challenge',
    icon: Bug,
    description: 'Identify root causes and fix production bugs'
  },
  {
    id: 'mcq',
    label: 'Technical MCQ',
    icon: HelpCircle,
    description: 'Architectural tradeoffs & concept questions'
  },
  {
    id: 'predict_output',
    label: 'Predict Output',
    icon: PlaySquare,
    description: 'Trace execution flow and object scoping'
  }
];

export default function SkillArenaPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const userId = user?.id || 'user-001';
  const targetRole = user?.targetRole || 'Machine Learning Engineer';

  // Active mode & challenge states
  const [selectedMode, setSelectedMode] = useState('all');
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Skill Profile & Career Focus State
  const [careerFocusSkill, setCareerFocusSkill] = useState('Core Competency');
  const [careerFocusReason, setCareerFocusReason] = useState('Bridging active competency gaps for your target role.');

  // History & Stats States
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [arenaStats, setArenaStats] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load career focus from unified profile
  useEffect(() => {
    const fetchFn = skillApi.getUnifiedProfile || skillApi.getSkillProfile;
    if (typeof fetchFn === 'function') {
      fetchFn.call(skillApi, userId)
        .then((data) => {
          if (data && data.top_skill_gaps && data.top_skill_gaps.length > 0) {
            const topGap = data.top_skill_gaps[0];
            setCareerFocusSkill(topGap.skill_name);
            setCareerFocusReason(
              `${topGap.skill_name} is currently your highest-priority skill gap (${topGap.demonstrated_score}% demonstrated vs ${topGap.target_score}% benchmark) for ${targetRole} roles.`
            );
          }
        })
        .catch(() => {
          setCareerFocusSkill('Python');
        });
    }
  }, [userId, targetRole]);

  // Fetch recommended challenge
  const fetchChallenge = (modeFilter = null) => {
    setIsLoadingChallenge(true);
    setEvaluationResult(null);
    setShowHint(false);
    setUserAnswer('');
    setSelectedOption(null);

    const mode = (modeFilter && modeFilter !== 'all') ? modeFilter : (selectedMode !== 'all' ? selectedMode : null);

    skillArenaApi.getNextChallenge(userId, targetRole, mode)
      .then((challenge) => {
        if (challenge) {
          setActiveChallenge(challenge);
          if (challenge.initial_code) {
            setUserAnswer(challenge.initial_code);
          }
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.debug('[SkillArena] Challenge fetch failed:', err);
      })
      .finally(() => setIsLoadingChallenge(false));
  };

  // Fetch History & Stats
  const refreshHistoryAndStats = () => {
    skillArenaApi.getHistory(userId, 15).then((history) => {
      if (Array.isArray(history)) setAttemptHistory(history);
      else setAttemptHistory([]);
    }).catch(() => setAttemptHistory([]));

    skillArenaApi.getStats(userId).then((stats) => {
      if (stats && typeof stats === 'object') setArenaStats(stats);
    }).catch(() => setArenaStats(null));
  };

  useEffect(() => {
    fetchChallenge();
    refreshHistoryAndStats();
  }, [userId]);

  const handleModeChange = (modeId) => {
    setSelectedMode(modeId);
    fetchChallenge(modeId);
  };

  const handleSubmit = async () => {
    if (!activeChallenge) return;

    let answerPayload = userAnswer;
    if (activeChallenge.mode === 'mcq') {
      if (selectedOption === null) return;
      answerPayload = String(selectedOption);
    }

    if (!answerPayload || !answerPayload.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await skillArenaApi.submitAttempt(userId, {
        challenge_id: activeChallenge.id,
        user_answer: answerPayload,
        time_spent_seconds: 60,
        target_role: targetRole
      });

      if (result) {
        setEvaluationResult(result);
        if (result.xp_earned) {
          updateUser({
            xp: (user?.xp || 0) + result.xp_earned,
            streak: result.streak || user?.streak || 1
          });
        }
        refreshHistoryAndStats();
      }
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[SkillArena] Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#1F1B16] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* =========================================================================
            HEADER & CAREER FOCUS BANNER
           ========================================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] shadow-xs">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#1F1B16] flex items-center gap-2">
                  Skill Arena Coding Practice
                  <Badge variant="navy" size="sm">Practice</Badge>
                </h1>
                <p className="text-sm text-[#70685E]">
                  Curricular technical practice: Code, Debug, Predict & Solve for {targetRole}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistoryModal(!showHistoryModal)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#FFFDF9] hover:bg-[#F2EFE9] border border-[#E5E0D5] text-xs font-semibold text-[#1F1B16] transition-colors cursor-pointer shadow-xs"
            >
              <History className="w-4 h-4 text-[#8C6E54]" />
              Practice History ({(attemptHistory || []).length})
            </button>
            <GradientButton
              size="sm"
              variant="primary"
              onClick={() => fetchChallenge()}
              icon={RotateCcw}
            >
              Next Challenge
            </GradientButton>
          </div>
        </div>

        {/* Career Focus Context Card */}
        <GlassCard className="p-5 border-l-4 border-l-[#1A365D] border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A365D] uppercase tracking-wider font-mono">
                <Target className="w-4 h-4" />
                Target Role: {targetRole} • Active Focus: {careerFocusSkill}
              </div>
              <p className="text-sm text-[#3B352E]">
                {careerFocusReason}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-[#FAF8F3] px-3 py-1.5 rounded-sm border border-[#E5E0D5] text-xs text-[#70685E]">
              <ShieldCheck className="w-4 h-4 text-[#235E3B]" />
              Deterministic Ast & Heuristic Evaluation
            </div>
          </div>
        </GlassCard>

        {/* Stats Strip */}
        {arenaStats && arenaStats.total_attempts > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
              <Award className="w-5 h-5 text-[#8C6E54]" />
              <div>
                <div className="text-lg font-serif font-bold text-[#1F1B16]">{arenaStats.total_passed}/{arenaStats.total_attempts}</div>
                <div className="text-xs text-[#70685E]">Solved / Accuracy: {arenaStats.accuracy_rate}%</div>
              </div>
            </div>
            <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
              <Zap className="w-5 h-5 text-[#1A365D]" />
              <div>
                <div className="text-lg font-serif font-bold text-[#1F1B16]">+{arenaStats.total_xp_earned} XP</div>
                <div className="text-xs text-[#70685E]">Total Practice XP</div>
              </div>
            </div>
            <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
              <TrendingUp className="w-5 h-5 text-[#235E3B]" />
              <div>
                <div className="text-lg font-serif font-bold text-[#1F1B16]">{(arenaStats?.skills_practiced || []).length} Skills</div>
                <div className="text-xs text-[#70685E]">Demonstrated in Arena</div>
              </div>
            </div>
            <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
              <Sparkles className="w-5 h-5 text-[#1A365D]" />
              <div>
                <div className="text-lg font-serif font-bold text-[#1F1B16]">Multi-Source</div>
                <div className="text-xs text-[#70685E]">Synced to Skill Profile</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE SELECTOR
           ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRACTICE_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`
                  p-3.5 rounded-md border text-left transition-all duration-200 flex flex-col justify-between gap-2 cursor-pointer
                  ${isSelected
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1A365D] shadow-xs'
                    : 'bg-[#FFFDF9] hover:bg-[#FAF8F3] border-[#E5E0D5] text-[#3B352E]'}
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#1A365D]' : 'text-[#8C6E54]'}`} />
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#1A365D]" />}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-[#1A365D]' : 'text-[#1F1B16]'}`}>
                    {mode.label}
                  </div>
                  <div className="text-[10px] text-[#70685E] line-clamp-1">
                    {mode.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            CHALLENGE WORKSPACE
           ========================================================================= */}
        {isLoadingChallenge ? (
          <GlassCard className="p-12 text-center space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
            <div className="w-8 h-8 border-2 border-[#1A365D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#70685E]">
              Loading practice coding challenge for {targetRole}...
            </p>
          </GlassCard>
        ) : activeChallenge ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Challenge Prompt & Metadata */}
            <div className="lg:col-span-6 space-y-5">
              <GlassCard className="p-6 space-y-5 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
                {/* Meta pills */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="navy" size="sm">{activeChallenge.skill}</Badge>
                    <Badge variant="neutral" size="sm">{activeChallenge.subtopic}</Badge>
                    <Badge
                      variant={
                        activeChallenge.difficulty === 'Advanced' ? 'bronze' :
                        activeChallenge.difficulty === 'Intermediate' ? 'neutral' : 'forest'
                      }
                      size="sm"
                    >
                      {activeChallenge.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#70685E]">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#1A365D]" />
                      ~{activeChallenge.estimated_minutes}m
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#8C6E54] font-mono">
                      <Zap className="w-3.5 h-3.5" />
                      +{activeChallenge.xp_reward} XP
                    </span>
                  </div>
                </div>

                {/* Challenge Title & Question */}
                <div>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1F1B16] mb-3">
                    {activeChallenge.title}
                  </h2>
                  <div className="text-sm text-[#1F1B16] whitespace-pre-wrap leading-relaxed bg-[#FAF8F3] p-4 rounded-md border border-[#E5E0D5] font-serif">
                    {activeChallenge.question}
                  </div>
                </div>

                {/* Career Relevance */}
                {activeChallenge.career_relevance && (
                  <div className="text-xs text-[#3B352E] flex items-start gap-2 bg-[#FAF8F3] p-3 rounded-md border border-[#E5E0D5]">
                    <Lightbulb className="w-4 h-4 text-[#8C6E54] shrink-0 mt-0.5" />
                    <span><strong className="text-[#1F1B16]">Curricular Context:</strong> {activeChallenge.career_relevance}</span>
                  </div>
                )}

                {/* Hint Accordion */}
                {activeChallenge.hints && activeChallenge.hints.length > 0 && (
                  <div className="border-t border-[#E5E0D5] pt-4">
                    <button
                      type="button"
                      onClick={() => setShowHint(!showHint)}
                      className="text-xs font-bold text-[#1A365D] hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      {showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                    {showHint && (
                      <div className="mt-2.5 p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#3B352E] space-y-1">
                        {activeChallenge.hints.map((hint, idx) => (
                          <div key={idx}>• {hint}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Right Column: Solution Workspace & Evaluation */}
            <div className="lg:col-span-6 space-y-5">
              <GlassCard className="p-6 space-y-5 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
                <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
                  <span className="text-xs font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2 font-mono">
                    <Code2 className="w-4 h-4 text-[#1A365D]" />
                    {activeChallenge.mode === 'mcq' ? 'Select Best Architecture / Answer' : 'Your Solution / Explanation'}
                  </span>
                  <span className="text-[11px] text-[#70685E] font-mono">
                    {activeChallenge.mode === 'mcq' ? 'Single Choice' : 'Static Pattern Analysis'}
                  </span>
                </div>

                {/* MCQ Mode Options */}
                {activeChallenge.mode === 'mcq' ? (
                  <div className="space-y-2.5">
                    {(activeChallenge.options || []).map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={evaluationResult !== null}
                          onClick={() => setSelectedOption(idx)}
                          className={`
                            w-full text-left p-3.5 rounded-md border text-xs transition-all flex items-start gap-3 cursor-pointer
                            ${isSelected
                              ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs'
                              : 'bg-[#FAF8F3] hover:bg-[#F2EFE9] border-[#E5E0D5] text-[#3B352E]'}
                          `}
                        >
                          <span className={`
                            w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 text-[10px] font-bold font-mono
                            ${isSelected ? 'border-[#1A365D] bg-[#1B2A4A] text-white' : 'border-[#BAC7D5] bg-[#FFFDF9] text-[#1A365D]'}
                          `}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-relaxed">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : activeChallenge.mode === 'predict_output' ? (
                  /* Predict Output Input */
                  <div className="space-y-2">
                    <label className="text-xs text-[#70685E] font-mono uppercase">Exact Printed Output:</label>
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={evaluationResult !== null}
                      placeholder="e.g. [6, 6, 6, 6] or 0"
                      className="w-full bg-[#FAF8F3] text-[#1F1B16] font-mono text-sm p-3.5 rounded-md border border-[#E5E0D5] focus:outline-none focus:border-[#1A365D]"
                    />
                    <span className="text-[11px] text-[#70685E]">
                      Enter exact formatted output as emitted to standard output.
                    </span>
                  </div>
                ) : (
                  /* Coding & Debug Textarea */
                  <div className="space-y-2">
                    <textarea
                      rows={12}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={evaluationResult !== null}
                      placeholder="Write your code or structured technical defense here..."
                      className="w-full bg-[#FAF8F3] text-[#1F1B16] font-mono text-xs p-4 rounded-md border border-[#E5E0D5] focus:outline-none focus:border-[#1A365D] resize-y leading-relaxed"
                    />
                    <div className="flex justify-between text-[11px] text-[#70685E] font-mono">
                      <span>Keywords & syntax patterns analyzed deterministically</span>
                      <span>{userAnswer.split(/\s+/).filter(Boolean).length} words</span>
                    </div>
                  </div>
                )}

                {/* Submit / Reset Actions */}
                {!evaluationResult && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUserAnswer(activeChallenge.initial_code || '');
                        setSelectedOption(null);
                      }}
                      className="px-4 py-2 rounded-md text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] hover:bg-[#FAF8F3] border border-transparent hover:border-[#E5E0D5] transition-colors cursor-pointer"
                    >
                      Reset
                    </button>
                    <GradientButton
                      size="sm"
                      variant="primary"
                      disabled={isSubmitting || (activeChallenge.mode === 'mcq' ? selectedOption === null : !userAnswer.trim())}
                      onClick={handleSubmit}
                      icon={Sparkles}
                    >
                      {isSubmitting ? 'Evaluating Solution...' : 'Submit Solution'}
                    </GradientButton>
                  </div>
                )}

                {/* =========================================================================
                    EVALUATION RESULT DISPLAY
                   ========================================================================= */}
                {evaluationResult && (
                  <div className="space-y-4 pt-4 border-t border-[#E5E0D5]">
                    <div className={`flex items-center justify-between p-4 rounded-md border ${
                      evaluationResult.correctness
                        ? 'bg-[#EBF4EE] border-[#CDE5D4] text-[#235E3B]'
                        : 'bg-[#FDF2E9] border-[#F0C9B3] text-[#9A421A]'
                    }`}>
                      <div className="flex items-center gap-3">
                        {evaluationResult.correctness ? (
                          <CheckCircle2 className="w-6 h-6 text-[#235E3B]" />
                        ) : (
                          <XCircle className="w-6 h-6 text-[#9A421A]" />
                        )}
                        <div>
                          <div className="text-sm font-serif font-bold flex items-center gap-2">
                            {evaluationResult.correctness ? 'Challenge Solved!' : 'Remediation Advised'}
                            <span className="text-xs font-mono">
                              (Score: {evaluationResult.score}/100)
                            </span>
                          </div>
                          <div className="text-xs mt-0.5">
                            {evaluationResult.feedback}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          +{evaluationResult.xp_earned} XP
                        </div>
                        <div className="text-[10px] uppercase tracking-wider font-mono">Evidence Logged</div>
                      </div>
                    </div>

                    {/* Strengths & Mistakes */}
                    {evaluationResult.strengths && evaluationResult.strengths.length > 0 && (
                      <div className="p-3 rounded-md bg-[#EBF4EE] border border-[#CDE5D4] text-xs text-[#235E3B]">
                        <div className="font-serif font-bold mb-1">Demonstrated Strengths:</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {evaluationResult.strengths.map((s, idx) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluationResult.mistakes && evaluationResult.mistakes.length > 0 && (
                      <div className="p-3 rounded-md bg-[#FDF2E9] border border-[#F0C9B3] text-xs text-[#9A421A]">
                        <div className="font-serif font-bold mb-1">Conceptual Deficits:</div>
                        <ul className="list-disc list-inside space-y-0.5">
                          {evaluationResult.mistakes.map((m, idx) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Explanation */}
                    {evaluationResult.explanation && (
                      <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#3B352E] space-y-1">
                        <div className="font-serif font-bold text-[#1A365D] flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          Conceptual Commentary:
                        </div>
                        <p className="leading-relaxed">{evaluationResult.explanation}</p>
                      </div>
                    )}

                    {/* RAG Context */}
                    {evaluationResult.rag_context && (
                      <div className="p-3 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] text-xs text-[#1A365D]">
                        <div className="font-serif font-bold mb-0.5">Curricular Reference:</div>
                        <p>{evaluationResult.rag_context}</p>
                      </div>
                    )}

                    {/* Next Step Action */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-[#70685E]">
                        Next Recommended: <strong className="text-[#1F1B16]">{evaluationResult.next_recommended_skill || 'Core Technical Practice'}</strong>
                      </span>
                      <GradientButton
                        size="sm"
                        variant="primary"
                        onClick={() => fetchChallenge()}
                        icon={ArrowRight}
                      >
                        Next Challenge
                      </GradientButton>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        ) : (
          <GlassCard className="p-12 text-center space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-[#235E3B] mx-auto" />
            <h3 className="text-lg font-serif font-bold text-[#1F1B16]">All Challenges Completed in This Mode!</h3>
            <p className="text-xs text-[#70685E]">
              You have solved all currently available challenges in this mode. Switch modes or revisit previous exercises.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <GradientButton
                size="sm"
                variant="primary"
                onClick={() => handleModeChange('all')}
              >
                Reset to All Modes
              </GradientButton>
              <GradientButton
                size="sm"
                variant="secondary"
                icon={RotateCcw}
                onClick={() => fetchChallenge()}
              >
                Reload Challenges
              </GradientButton>
            </div>
          </GlassCard>
        )}

        {/* =========================================================================
            PRACTICE HISTORY MODAL / DRAWER
           ========================================================================= */}
        {showHistoryModal && (
          <GlassCard className="p-6 space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-md">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <h3 className="text-base font-serif font-bold text-[#1F1B16] flex items-center gap-2">
                <History className="w-4 h-4 text-[#8C6E54]" />
                Practice History ({(attemptHistory || []).length})
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-xs text-[#70685E] hover:text-[#1F1B16] cursor-pointer"
              >
                Close
              </button>
            </div>

            {(attemptHistory || []).length === 0 ? (
              <p className="text-xs text-[#70685E] py-4 text-center">
                No practice attempts logged yet. Start your first coding challenge above!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#3B352E]">
                  <thead>
                    <tr className="border-b border-[#E5E0D5] text-[#70685E] font-mono uppercase text-[10px]">
                      <th className="py-2.5 font-medium">Skill</th>
                      <th className="py-2.5 font-medium">Mode</th>
                      <th className="py-2.5 font-medium">Difficulty</th>
                      <th className="py-2.5 font-medium">Score</th>
                      <th className="py-2.5 font-medium">Status</th>
                      <th className="py-2.5 font-medium">XP</th>
                      <th className="py-2.5 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]">
                    {(attemptHistory || []).map((att) => (
                      <tr key={att.id} className="hover:bg-[#FAF8F3]">
                        <td className="py-2.5 font-serif font-semibold text-[#1F1B16]">{att.skill}</td>
                        <td className="py-2.5 capitalize">{(att.mode || '').replace('_', ' ')}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono ${
                            att.difficulty === 'Advanced' ? 'bg-[#FDF2E9] text-[#9A421A] border border-[#F0C9B3]' :
                            att.difficulty === 'Intermediate' ? 'bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5]' :
                            'bg-[#EBF4EE] text-[#235E3B] border border-[#CDE5D4]'
                          }`}>
                            {att.difficulty}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono">{att.score}%</td>
                        <td className="py-2.5">
                          {att.correctness ? (
                            <span className="text-[#235E3B] font-bold">Passed</span>
                          ) : (
                            <span className="text-[#9A421A]">Review</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-[#8C6E54]">+{att.xp_earned}</td>
                        <td className="py-2.5 text-[#70685E] font-mono">
                          {att.created_at ? new Date(att.created_at).toLocaleDateString() : 'Today'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  );
}
