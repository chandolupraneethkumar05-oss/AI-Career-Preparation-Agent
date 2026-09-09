import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Mic,
  Send,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lightbulb,
  Zap
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import CircularScore from '../components/CircularScore';
import { useInterview } from '../context/InterviewContext';
import { useAuth } from '../context/AuthContext';

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const { session, startInterview, submitCurrentAnswer, advanceQuestion } = useInterview();
  const { addXP } = useAuth();

  const [answerInput, setAnswerInput] = useState('');
  const [currentEval, setCurrentEval] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Per-Question Timer (180 seconds / 3 minutes per question)
  const QUESTION_TIME_LIMIT = 180;
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_LIMIT);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // If page loaded without an active session, start one automatically
  useEffect(() => {
    if (!session.active || !session.questions.length) {
      startInterview();
    }
  }, [session.active, session.questions.length, startInterview]);

  // Timer countdown loop
  useEffect(() => {
    let interval;
    if (isTimerRunning && secondsLeft > 0 && !currentEval) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft, currentEval]);

  const currentQuestion = session.questions[session.currentIndex] || {
    id: 'fallback_1',
    question: 'Explain the fundamental difference between Machine Learning and Deep Learning.',
    category: 'Core Concepts',
    currentDifficulty: 'Intermediate'
  };

  const totalQuestions = session.questions.length || 5;
  const currentNum = session.currentIndex + 1;
  const wordCount = answerInput.trim().split(/\s+/).filter(Boolean).length;

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = () => {
    if (!answerInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setIsTimerRunning(false);

    setTimeout(() => {
      const evaluation = submitCurrentAnswer(answerInput);
      setCurrentEval(evaluation);
      setIsSubmitting(false);
      // Award XP for submitting thoughtful answer
      addXP(25);
    }, 500);
  };

  const handleNext = () => {
    const isFinished = advanceQuestion();
    setAnswerInput('');
    setCurrentEval(null);
    setSecondsLeft(QUESTION_TIME_LIMIT);
    setIsTimerRunning(true);

    if (isFinished) {
      navigate('/interview-feedback');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header Bar: Progress, Question Counter & Active Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Live Mock Interview Session
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Question {currentNum} of {totalQuestions}
            </h1>
            <Badge
              variant={
                currentQuestion.currentDifficulty === 'Advanced'
                  ? 'pink'
                  : currentQuestion.currentDifficulty === 'Beginner'
                  ? 'green'
                  : 'cyan'
              }
              size="sm"
            >
              {currentQuestion.currentDifficulty || session.currentDifficulty || 'Intermediate'}
            </Badge>
            {currentQuestion.adaptiveTriggered && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                Adaptive
              </span>
            )}
          </div>
        </div>

        {/* Action Bar: Timer & Voice Mode "Coming Soon" */}
        <div className="flex items-center gap-3">
          {/* Active Timer Pill */}
          <div
            className={`
              flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors
              ${secondsLeft < 30
                ? 'bg-red-950/60 border-red-500/60 text-red-300 animate-pulse'
                : 'bg-[#191A3A] border-purple-500/30 text-cyan-300'
              }
            `}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          {/* Voice Mode Button (Clearly Labeled Coming Soon) */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:text-white hover:border-cyan-400/50 text-xs font-semibold transition-all group"
          >
            <Mic className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>🎤 Voice Mode — Coming Soon</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={currentNum}
        max={totalQuestions}
        displayValue={`Question ${currentNum} of ${totalQuestions}`}
        gradient="purple-cyan"
        height="h-2"
      />

      {/* Adaptive Notification Banner if Triggered */}
      {session.adaptiveEvent && !currentEval && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-[#191A3A] border border-cyan-500/40 flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[#A5B4FC]">
              <strong className="text-white">{session.adaptiveEvent.title}:</strong> {session.adaptiveEvent.message}
            </span>
          </div>
          <Badge variant="cyan" size="sm">
            {session.adaptiveEvent.badge}
          </Badge>
        </div>
      )}

      {/* Main Grid: AI Interviewer (Left) & Candidate Response (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Interviewer Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard className="p-6 border-purple-500/40 relative overflow-hidden space-y-5 bg-[#17183B]">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-900/40">
                  <div className="w-full h-full bg-[#0F1026] rounded-[14px] flex items-center justify-center">
                    <Bot className="w-6 h-6 text-cyan-300" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F1026] rounded-full" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">AI INTERVIEWER</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Active Listening</span>
                  </div>
                </div>
              </div>

              <Badge variant="purple" size="sm">
                {currentQuestion.category || 'Interview Question'}
              </Badge>
            </div>

            {/* Question Text Prompt */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#A5B4FC]/70 uppercase tracking-wider">
                Question Prompt
              </span>
              <div className="p-4 rounded-2xl bg-[#0F1026]/90 border border-purple-500/30 text-white font-medium text-base leading-relaxed shadow-inner">
                "{currentQuestion.question}"
              </div>
            </div>

            {/* Audio Waveform Simulation */}
            <div className="p-3 rounded-xl bg-[#0F1026]/50 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#A5B4FC]">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span>Interviewer Audio Waveform</span>
              </div>
              <div className="flex items-center gap-1 h-4">
                {[50, 80, 40, 95, 60, 85, 30, 70, 100, 45].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Response Tips */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-[#A5B4FC] space-y-1">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Interviewer Advice</span>
              </div>
              <p>
                Provide a structured answer (60–150 words). Include domain terminology, a production example, and quantifiable metrics to maximize your score.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Answer Textarea & Live Evaluation Report (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Answer Textarea Card */}
          <GlassCard className="p-6 space-y-4 border-purple-500/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Your Answer
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-mono font-bold ${wordCount >= 50 ? 'text-emerald-400' : 'text-[#A5B4FC]'}`}>
                  {wordCount} words
                </span>
                <span className="text-[#A5B4FC]/60">(Target: 60–150 words)</span>
              </div>
            </div>

            <textarea
              rows={7}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              disabled={!!currentEval}
              placeholder="Type your response here... (e.g. Machine Learning relies on explicit feature engineering algorithms like Random Forests and SVMs, whereas Deep Learning uses layered neural networks to automatically learn hierarchical representations from high-dimensional raw data. For example, in a past fraud detection project...)"
              className="w-full p-4 rounded-xl bg-[#0F1026]/80 border border-purple-500/30 text-sm text-white placeholder-[#A5B4FC]/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-y leading-relaxed disabled:opacity-75"
            />

            {/* Fast Tester Helper + Submit / Next Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAnswerInput(
                    'Machine Learning involves algorithms that learn patterns from structured features created via domain expertise (such as Scikit-Learn decision trees or linear models). Deep Learning is a specialized subfield utilizing multi-layered neural networks (like CNNs and Transformers) that automatically perform representation learning directly on unstructured raw data like images and text. For instance, in our recommendation pipeline, we chose a tree-based XGBoost model for tabular click logs for fast 15ms latency and high interpretability, while using a Transformer embedding network for semantic query matching.'
                  );
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono"
              >
                Autofill High-Scoring Response (Quick Test)
              </button>

              {!currentEval ? (
                <GradientButton
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={!answerInput.trim()}
                  icon={Send}
                  className="w-full sm:w-auto"
                >
                  Submit Answer
                </GradientButton>
              ) : (
                <GradientButton
                  variant="pink"
                  size="md"
                  onClick={handleNext}
                  icon={ArrowRight}
                  className="w-full sm:w-auto"
                >
                  {currentNum >= totalQuestions ? 'Complete Interview 🎉' : 'Next Question →'}
                </GradientButton>
              )}
            </div>
          </GlassCard>

          {/* Instant Evaluation Report Card (Displayed upon submitting) */}
          {currentEval && (
            <GlassCard className="p-6 border-cyan-500/40 bg-gradient-to-br from-[#191A3A] to-[#13233E] space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/20 pb-4">
                <div>
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    AI Agent Evaluation Report
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-black text-white">
                      Overall Score: {currentEval.scores.overall} / 10
                    </span>
                    <Badge variant={currentEval.scores.overall >= 8 ? 'green' : 'amber'} size="sm">
                      {currentEval.scores.overall >= 8 ? 'Strong Answer' : 'Needs Polish'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CircularScore
                    score={Math.round(currentEval.scores.overall * 10)}
                    size={65}
                    strokeWidth={6}
                    color="auto"
                    showPercentage={false}
                  />
                </div>
              </div>

              {/* Sub-Scores Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20">
                  <p className="text-[10px] text-[#A5B4FC]">Technical</p>
                  <p className="text-sm font-extrabold text-purple-300">{currentEval.scores.technicalKnowledge}/10</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20">
                  <p className="text-[10px] text-[#A5B4FC]">Relevance</p>
                  <p className="text-sm font-extrabold text-cyan-300">{currentEval.scores.relevance}/10</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20">
                  <p className="text-[10px] text-[#A5B4FC]">Clarity</p>
                  <p className="text-sm font-extrabold text-emerald-300">{currentEval.scores.clarity}/10</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20">
                  <p className="text-[10px] text-[#A5B4FC]">Structure</p>
                  <p className="text-sm font-extrabold text-pink-300">{currentEval.scores.structure}/10</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-[#A5B4FC]">Confidence</p>
                  <p className="text-sm font-extrabold text-amber-300">{currentEval.scores.confidence}/10</p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="space-y-3 pt-1">
                <div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Identified
                  </span>
                  <ul className="space-y-1 text-xs text-[#A5B4FC]">
                    {currentEval.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Areas to Improve
                  </span>
                  <ul className="space-y-1 text-xs text-[#A5B4FC]">
                    {currentEval.areasToImprove.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400">⚠</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* AI Agent Adaptive Action Banner */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Agent Feedback & Next Action</span>
                </div>
                <p className="text-[#A5B4FC]">{currentEval.aiRecommendation}</p>
                {currentEval.adaptiveNote && (
                  <div className="pt-1 text-[11px] text-purple-300 font-medium flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentEval.adaptiveNote}</span>
                  </div>
                )}
              </div>

              {/* Continue to Next Question Button */}
              <GradientButton
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleNext}
                icon={ArrowRight}
              >
                {currentNum >= totalQuestions ? 'View Complete Interview Results 🎉' : 'Continue to Next Question →'}
              </GradientButton>
            </GlassCard>
          )}

        </div>

      </div>

      {/* Voice Mode Explanation Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="max-w-md w-full p-6 border-cyan-500/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Voice Mode & Audio Analysis</h3>
                <Badge variant="cyan" size="sm">Coming Soon (Phase 2)</Badge>
              </div>
            </div>

            <p className="text-xs text-[#A5B4FC] leading-relaxed">
              In this functional prototype, text input is active so evaluators can test structured multi-metric scoring, adaptive logic, and feedback.
            </p>

            <div className="p-3.5 rounded-xl bg-[#0F1026] border border-purple-500/20 text-xs text-white space-y-2">
              <p className="font-semibold text-cyan-300">Phase 2 Future Integration Roadmap:</p>
              <ul className="list-disc list-inside space-y-1 text-[#A5B4FC]">
                <li>Bidirectional WebSocket audio via Gemini Live API</li>
                <li>Real-time speech-to-text transcript processing</li>
                <li>Filler-word ('um', 'like') & pace-of-speech rhythm tracking</li>
                <li>Prosody and vocal confidence analysis</li>
              </ul>
            </div>

            <GradientButton
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => setShowVoiceModal(false)}
            >
              Got it, continue with text mode
            </GradientButton>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
