import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  Award,
  Zap,
  Target
} from 'lucide-react';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import Badge from './Badge';
import { skillApi } from '../services/skillApi';
import { useAuth } from '../context/AuthContext';

export default function ConceptPrimerModal({
  isOpen,
  onClose,
  skillName,
  targetRole = 'Software Engineer',
  difficulty = 'Beginner',
  onPrimerCompleted = () => {}
}) {
  const { user, addXP } = useAuth();
  const [activeTab, setActiveTab] = useState('learn'); // 'learn' | 'quiz'
  const [loading, setLoading] = useState(false);
  const [primerData, setPrimerData] = useState(null);
  const [error, setError] = useState(null);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    if (isOpen && skillName) {
      setActiveTab('learn');
      setUserAnswers({});
      setQuizResult(null);
      setError(null);
      setLoading(true);

      skillApi.getSkillPrimer(skillName, targetRole, difficulty)
        .then((data) => {
          if (data) {
            setPrimerData(data);
          } else {
            setError(`Could not load primer for ${skillName}.`);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load concept primer.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, skillName, targetRole, difficulty]);

  if (!isOpen) return null;

  const handleSelectOption = (questionId, optionIndex) => {
    if (quizResult) return; // Locked after submission
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleVerify = async () => {
    if (!primerData?.verification_quiz) return;
    setSubmittingQuiz(true);
    try {
      const res = await skillApi.verifyPrimer(skillName, userAnswers, user?.id);
      setQuizResult(res);
      if (res?.passed && res?.awarded_xp) {
        addXP(res.awarded_xp);
      }
      onPrimerCompleted(res);
    } catch (err) {
      setError(err.message || 'Quiz verification failed.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const allQuestionsAnswered =
    primerData?.verification_quiz?.length > 0 &&
    primerData.verification_quiz.every((q) => userAnswers[q.id] !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  3-Minute JIT Primer
                </span>
                <span className="text-xs text-slate-500">• {primerData?.estimated_read_time || '3 mins'}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {primerData?.concept_title || `${skillName} Fundamentals`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('learn')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'learn'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1. Core Mental Models
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            2. Knowledge Check (2 Qs)
            {quizResult?.passed && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">Synthesizing 3-minute concept primer for {skillName}...</p>
              <p className="text-xs text-slate-400 mt-1">Grounding knowledge via RAG curriculum</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load primer</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && primerData && activeTab === 'learn' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Plain English Definition */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  What is it? (Plain English)
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {primerData.plain_english_definition}
                </p>
              </div>

              {/* Why the Target Role needs it */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Why {targetRole} Requires It
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {primerData.why_role_needs_it}
                </p>
              </div>

              {/* 3 Core Mental Models */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  The 3 Core Mental Models
                </h3>
                <div className="space-y-2.5">
                  {primerData.core_mental_models?.map((model, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        {model}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview Golden Question & Answer */}
              {primerData.interview_golden_qa && (
                <div className="p-4 bg-slate-900 text-white rounded-xl shadow-inner border border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Top Interview Question & Golden Model Answer
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-100 mb-2">
                    "{primerData.interview_golden_qa.question}"
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-2 font-mono">
                    {primerData.interview_golden_qa.answer}
                  </p>
                </div>
              )}

              {/* Next Step CTA */}
              <div className="pt-2 flex justify-end">
                <GradientButton
                  variant="primary"
                  onClick={() => setActiveTab('quiz')}
                  icon={ArrowRight}
                >
                  I Understand — Take 2-Question Check
                </GradientButton>
              </div>
            </div>
          )}

          {!loading && !error && primerData && activeTab === 'quiz' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Answer both questions correctly to establish your baseline foundation, earn <strong className="text-slate-900">+35 XP</strong>, and unblock targeted mock interviews.
                </span>
              </div>

              {/* Questions */}
              {primerData.verification_quiz?.map((q, qIdx) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                      Q{qIdx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {q.question}
                    </h4>
                  </div>

                  <div className="space-y-2 pt-1">
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = userAnswers[q.id] === optIdx;
                      const isCorrect = q.correct_option_index === optIdx;
                      let optionClasses = 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50';

                      if (quizResult) {
                        if (isCorrect) {
                          optionClasses = 'border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold';
                        } else if (isSelected && !isCorrect) {
                          optionClasses = 'border-rose-400 bg-rose-50 text-rose-900';
                        } else {
                          optionClasses = 'border-slate-100 text-slate-400 opacity-60';
                        }
                      } else if (isSelected) {
                        optionClasses = 'border-indigo-600 bg-indigo-50/60 text-indigo-900 font-semibold shadow-sm';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={Boolean(quizResult)}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optionClasses}`}
                        >
                          <span>{opt}</span>
                          {quizResult && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizResult && (
                    <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              {/* Quiz Submission Result */}
              {quizResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    quizResult.passed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <Award className="w-6 h-6 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{quizResult.message}</p>
                    <p className="text-xs mt-1">
                      {quizResult.passed
                        ? 'Your competency record has been saved. You are ready to start technical mock drills.'
                        : 'Review the primer slides and attempt the quiz again to verify comprehension.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('learn')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ← Back to Primer Slides
                </button>

                {!quizResult ? (
                  <GradientButton
                    variant="primary"
                    disabled={!allQuestionsAnswered || submittingQuiz}
                    loading={submittingQuiz}
                    onClick={handleVerify}
                  >
                    Submit Answers & Verify Baseline
                  </GradientButton>
                ) : (
                  <GradientButton
                    variant="primary"
                    onClick={onClose}
                  >
                    Done & Close
                  </GradientButton>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
