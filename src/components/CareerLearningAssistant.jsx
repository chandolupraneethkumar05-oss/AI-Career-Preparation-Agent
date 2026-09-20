import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  Send,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Globe,
  HelpCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import { aiApi } from '../services/aiApi';
import { useAuth } from '../context/AuthContext';

const SUGGESTED_QUESTIONS = [
  'What is overfitting in machine learning?',
  'How do I structure a STAR behavioral answer?',
  'What SQL JOINs are most important for interviews?',
  'Why is Docker essential for MLOps and deployment?',
  'What is the difference between Precision and Recall?'
];

const LANGUAGES = [
  { code: 'en', label: 'English (EN)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'es', label: 'Spanish (Español)' }
];

export default function CareerLearningAssistant({ initialTopic: _initialTopic = null } = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleAsk = async (questionText = query) => {
    const q = (questionText || '').trim();
    if (!q || q.length < 2) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await aiApi.askQuestion(q, selectedLanguage, user?.id || 'user-001');
      setResponse(res);
      setQuery('');
    } catch (err) {
      console.error('[CareerLearningAssistant] Error:', err);
      setError(err.message || 'Failed to generate grounded explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggested = (question) => {
    setQuery(question);
    handleAsk(question);
  };

  return (
    <GlassCard className="p-6 md:p-8 relative overflow-hidden border border-purple-500/20">
      {/* Background Accent Glow */}
      <div className="absolute -right-24 -top-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Career Learning Assistant
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                RAG + LLM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Grounded in 18 curated technical preparation categories • Personalized to your target role
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <Globe className="w-4 h-4 text-slate-400 ml-1.5" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none pr-2 cursor-pointer"
            aria-label="Feedback Language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="mb-6 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
          Suggested Interview Questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSuggested(q)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="relative z-10 mb-6"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about technical concepts, interviews, or preparation (e.g. Explain SQL Joins)..."
              disabled={isLoading}
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
          </div>
          <GradientButton
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex items-center gap-2 px-5 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Retrieving...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask Coach</span>
              </>
            )}
          </GradientButton>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/40 flex items-start gap-3 relative z-10">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* AI Response Card */}
      {response && (
        <div className="relative z-10 space-y-4 animate-in fade-in duration-300">
          <div className="p-5 md:p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-xl space-y-4">
            {/* Context & Grounding Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {response.grounded ? 'Grounded in Curriculum' : 'General Guidance'}
                </span>
                {response.career_context_applied && (
                  <span className="text-[11px] font-medium text-purple-300 bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                    {response.career_context_applied}
                  </span>
                )}
              </div>
              {response.latency_ms && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {response.latency_ms}ms • {response.model_provider}
                </span>
              )}
            </div>

            {/* Main Narrative Answer */}
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {response.answer}
            </div>

            {/* Key Points */}
            {response.key_points && response.key_points.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Key Takeaways:
                </p>
                <div className="space-y-1.5">
                  {response.key_points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Next Action Banner */}
            {response.recommended_action && (
              <div className="pt-3 border-t border-slate-800/80">
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/50 to-slate-900 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                      Recommended Career Action
                    </span>
                    <h4 className="text-xs font-bold text-white">
                      {response.recommended_action.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {response.recommended_action.reason}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(response.recommended_action.route)}
                    className="self-start sm:self-auto px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <span>{response.recommended_action.action}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Verified Curriculum Sources */}
            {response.sources && response.sources.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  Grounded Knowledge References:
                </p>
                <div className="flex flex-wrap gap-2">
                  {response.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950/60 border border-slate-800 text-slate-400 flex items-center gap-2"
                    >
                      <span className="text-white font-medium">{src.title}</span>
                      <span className="text-[10px] text-purple-400 font-semibold">[{src.category}]</span>
                      <span className="text-[9px] text-slate-500">{src.difficulty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
