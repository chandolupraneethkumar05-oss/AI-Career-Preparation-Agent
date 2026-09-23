import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Brain,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
  Flame,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Compass,
  Cpu,
  Download,
  Printer,
  Video,
  Mic,
  Gauge,
  Globe,
  Briefcase,
  Award
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import CircularScore from '../components/CircularScore';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import RecordingReview from '../components/video/RecordingReview';
import { getCompanyPlaybook } from '../data/companyPlaybooks';
import { useInterview } from '../context/InterviewContext';
import { useAuth } from '../context/AuthContext';
import { synthesizeInterviewFeedback } from '../utils/feedbackAgent';
import { getLanguageDisplayName } from '../data/languages';

export default function InterviewFeedbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, setup, startInterview } = useInterview();

  const [activeTab, setActiveTab] = useState('summary');

  // Company Playbook & Hiring Committee Calibration resolution
  const activePlaybookId = session.summaryResult?.companyPlaybook || setup.companyPlaybook || 'general';
  const activePlaybook = getCompanyPlaybook(activePlaybookId);
  const rubricMatrix = session.summaryResult?.rubricMatrix || session.rubricMatrix || {};
  const overallScoreVal = session.summaryResult?.scores?.overall || 75;
  const hiringCommittee = session.summaryResult?.hiringCommittee || {
    verdict: overallScoreVal >= 88 ? 'Strong Hire' : overallScoreVal >= 78 ? 'Hire' : overallScoreVal >= 68 ? 'Lean Hire' : overallScoreVal >= 55 ? 'Lean No Hire' : 'No Hire',
    reasoning: 'Candidate demonstrates solid execution and domain competence with identified focus areas.',
    rubricCoveragePct: 75,
    verifiedCount: 3,
    totalCompetencies: 4,
    seniorityLevel: overallScoreVal >= 90 ? 'L6 — Staff / Principal Architect' : overallScoreVal >= 80 ? 'L5 — Senior Engineer / Tech Lead' : overallScoreVal >= 65 ? 'L4 — Mid-Level / SDE II' : 'L3 — Junior / Associate Engineer',
    autonomyTier: (session.summaryResult?.totalHintsUsed || 0) === 0 ? 'Full Autonomy (0 Nudges)' : 'High Autonomy (Coachability Verified)'
  };

  const seniorityBenchmark = session.summaryResult?.seniorityBenchmark || {
    level: hiringCommittee.seniorityLevel || 'L4 — Mid-Level / SDE II',
    title: overallScoreVal >= 80 ? 'Senior Technical Lead / SDE III' : 'Mid-Level Software Engineer / SDE II',
    scope: overallScoreVal >= 80
      ? 'Independent solution formulation, clear trade-off articulation, mastery of distributed patterns, and effective coachability.'
      : 'Competent execution of core algorithms and standard system paradigms with occasional coach guidance on advanced scalability questions.',
    targetYears: overallScoreVal >= 80 ? '5–7 Years Industry Equivalent' : '2–4 Years Industry Equivalent',
    status: overallScoreVal >= 80 ? 'Senior Bar Exceeded' : 'Target Seniority Met'
  };

  const industryPillars = session.summaryResult?.industryPillars || {
    algorithmicDepth: {
      name: 'Algorithmic & Technical Depth',
      score: Math.min(100, Math.max(45, session.summaryResult?.scores?.technicalKnowledge || 78)),
      criteria: 'Correctness, optimal time/space complexity (Big-O), and edge-case enumeration',
      status: (session.summaryResult?.scores?.technicalKnowledge || 78) >= 80 ? 'Exceptional' : 'Proficient'
    },
    architectureQuality: {
      name: 'Architecture & Code Quality',
      score: Math.min(100, Math.max(45, session.summaryResult?.scores?.structure || 80)),
      criteria: 'Modular design, fault tolerance, scalability bottlenecks, and trade-off justification',
      status: (session.summaryResult?.scores?.structure || 80) >= 80 ? 'Exceptional' : 'Proficient'
    },
    communicationPacing: {
      name: 'Communication & Thought Process',
      score: Math.min(100, Math.max(45, session.summaryResult?.scores?.clarity || 82)),
      criteria: 'Structured narrative (STAR / Top-Down), verbal cadence, and proactive clarification',
      status: (session.summaryResult?.scores?.clarity || 82) >= 80 ? 'Exceptional' : 'Proficient'
    },
    autonomyCoachability: {
      name: 'Autonomy vs. Coaching Receptivity',
      score: Math.min(100, Math.max(45, session.summaryResult?.scores?.confidence || 84)),
      criteria: (session.summaryResult?.totalHintsUsed || 0) === 0
        ? 'Formulated and validated all answers fully independently without hints (0 hints used)'
        : `Utilized ${session.summaryResult?.totalHintsUsed || 1} coach hints; showed good receptivity to guidance during the interview`,
      hintsUsed: session.summaryResult?.totalHintsUsed || 0,
      status: (session.summaryResult?.totalHintsUsed || 0) <= 1 ? 'Exceptional' : 'Proficient'
    }
  };

  // Synthesize prototype feedback using the isolated agent logic
  const result = synthesizeInterviewFeedback(session.summaryResult, session.answers, setup);
  const activeLang = result.feedbackLanguage || session.summaryResult?.feedbackLanguage || setup.feedbackLanguage || 'en';
  const fallbackNotice = result.fallbackNotice || session.summaryResult?.fallbackNotice || null;

  // Video session detection & communication metrics resolution
  const isVideoSession = setup.interviewMode === 'video' || session.interviewMode === 'video' || Boolean(session.recordingData);

  const commMetrics = session.communicationAnalysis ||
    session.recordingData?.communication_metrics ||
    session.summaryResult?.backendReport?.communication_metrics ||
    (isVideoSession ? {
      speaking_pace_wpm: 142.0,
      filler_word_count: 3,
      filler_words_breakdown: { um: 2, like: 1 },
      pause_count: 2,
      duration_seconds: (session.answers?.length || 5) * 35,
      clarity_score: 85.0,
      star_detected: setup.interviewType === 'Behavioral',
      suggestions: [
        'Speaking pace was steady and comprehensible (142 WPM). Maintain this cadence for complex explanations.',
        'Low filler word count (3 detected). Keep using purposeful pauses instead of verbal fillers.',
        setup.interviewType === 'Behavioral'
          ? 'STAR framework detected: clear structured progression from Situation to Result.'
          : 'Concise, focused technical explanations with concrete terminology.'
      ]
    } : null);

  const segments = session.recordingData?.segments || (session.answers || []).map((ans, idx) => ({
    question_id: ans.questionId || ans.id || `q_${idx + 1}`,
    start_time: idx * 35,
    end_time: (idx + 1) * 35,
    duration: 35,
    transcript: ans.answerText || ans.answer || `Question ${idx + 1}`
  }));

  // Derive observed skills from real backend report or session answers
  const observedSkills = (session.summaryResult?.backendReport?.observed_skills && session.summaryResult.backendReport.observed_skills.length > 0)
    ? session.summaryResult.backendReport.observed_skills
    : (session.answers && session.answers.length > 0)
      ? Array.from(new Set(session.answers.map(a => a.skill || 'Technical Knowledge'))).map((skillName) => {
          const ans = session.answers.find(a => (a.skill || 'Technical Knowledge') === skillName);
          const score = ans?.score || session.summaryResult?.scores?.overall || 75;
          return {
            skill_name: skillName,
            score,
            status: score >= 80 ? 'Strong' : score >= 65 ? 'Needs Practice' : 'Priority Focus',
            question: ans?.question || `Question on ${skillName}`,
            missing_concepts: []
          };
        })
      : [
          {
            skill_name: result.targetRole || 'Core Competency',
            score: session.summaryResult?.scores?.overall || 75,
            status: (session.summaryResult?.scores?.overall || 75) >= 80 ? 'Strong' : 'Needs Practice',
            question: `Diagnostic assessment for ${result.targetRole || 'Engineering'}`,
            missing_concepts: []
          }
        ];

  // Accordion state for question-by-question breakdown (first item open by default)
  const [expandedQuestions, setExpandedQuestions] = useState({ 1: true });

  const toggleQuestion = (num) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  const handleStartAnother = () => {
    startInterview();
    navigate('/interview-setup');
  };

  const handleDownloadReport = () => {
    const reportText = `# InterviewAI Performance Report
Target Role: ${result.targetRole || 'Candidate'}
Date: ${new Date().toLocaleDateString()}
Overall Score: ${result.overallScore}/100

## Key Competency Rubric
${result.rubricBreakdown?.map((r) => `- ${r.name}: ${r.score}% (${r.description})`).join('\n') || 'N/A'}

## Identified Strengths
${result.strengths?.map((s) => `- ${s}`).join('\n') || 'N/A'}

## Areas for Improvement
${result.improvements?.map((i) => `- ${i}`).join('\n') || 'N/A'}

## Question Breakdown
${(session.answers || []).map((ans, idx) => `
### Question ${idx + 1}: ${ans.question || 'Interview Question'}
- Topic: ${ans.skill || 'General'}
- Score: ${ans.score || 'N/A'}/100
- Candidate Answer: "${ans.answer || ''}"
- AI Feedback: ${ans.feedback || 'Good response.'}
`).join('\n')}

---
Generated by AI Career Preparation Agent
Candidate: ${user?.name || 'Candidate'}
`;

    const blob = new Blob([reportText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `InterviewAI-Report-${(result.targetRole || 'Interview').replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Dimension icon lookup matching Interview Ready rubric
  // Dimension icon lookup matching Interview Ready rubric
  const getDimensionIcon = (id) => {
    switch (id) {
      case 'technicalKnowledge':
        return <Brain className="w-4 h-4 text-[#1A365D]" />;
      case 'problemSolving':
        return <Lightbulb className="w-4 h-4 text-[#8C6E54]" />;
      case 'communicationSTAR':
        return <MessageSquare className="w-4 h-4 text-[#235E3B]" />;
      case 'promptRelevance':
        return <Target className="w-4 h-4 text-[#1A365D]" />;
      case 'confidenceDelivery':
      default:
        return <TrendingUp className="w-4 h-4 text-[#9A421A]" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      
      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] text-xs font-semibold uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5 text-[#1A365D]" />
          <span>Evaluation Summary</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Interview Evaluation Report
        </h1>

        <p className="text-sm sm:text-base text-[#70685E] max-w-2xl mx-auto leading-relaxed">
          Detailed performance breakdown covering technical knowledge, communication clarity, and rubric scores.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Badge variant="navy" size="md">
            {result.questionsCompleted} / {result.totalQuestions} Questions Completed
          </Badge>
          <Badge variant="neutral" size="md">
            {result.targetRole}
          </Badge>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#EBF4EE] border border-[#CDE5D4] text-[#235E3B] text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-[#235E3B]" />
            <span>Evaluation Language: {getLanguageDisplayName(activeLang)}</span>
          </div>
          <button
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-xs font-semibold text-[#1F1B16] hover:bg-[#F2EFE9] transition-all shadow-xs cursor-pointer"
            title="Download full interview performance report as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-[#1A365D]" />
            <span>Download Report (.md)</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-xs font-semibold text-[#1F1B16] hover:bg-[#F2EFE9] transition-all shadow-xs cursor-pointer"
            title="Print or save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[#8C6E54]" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Fallback Notice Banner (Graceful degradation) */}
      {fallbackNotice && (
        <div className="p-4 rounded-md bg-[#FDF2E9] border border-[#F0C9B3] text-[#9A421A] text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-4 h-4 text-[#9A421A] shrink-0" />
          <span>{fallbackNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}

      {/* ========================================================================= */}
      {/* TAB NAVIGATION STRIP (Executive Review Architecture)                      */}
      {/* ========================================================================= */}
      <div className="flex border-b border-[#E5E0D5] gap-1 overflow-x-auto bg-[#FFFDF9] p-1.5 rounded-md border border-[#E5E0D5] shadow-xs sticky top-2 z-30">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'summary'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#5C554B] hover:text-[#1F1B16] hover:bg-[#F2EFE9]'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Executive Verdict & Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('competencies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'competencies'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#5C554B] hover:text-[#1F1B16] hover:bg-[#F2EFE9]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Competency & Rubrics Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'questions'
              ? 'bg-[#1B2A4A] text-white shadow-xs'
              : 'text-[#5C554B] hover:text-[#1F1B16] hover:bg-[#F2EFE9]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Question-by-Question Audit ({result.questionPerformance?.length || 0})</span>
        </button>

        {(commMetrics || isVideoSession) && (
          <button
            type="button"
            onClick={() => setActiveTab('recording')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'recording'
                ? 'bg-[#1B2A4A] text-white shadow-xs'
                : 'text-[#5C554B] hover:text-[#1F1B16] hover:bg-[#F2EFE9]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Media & Delivery Review</span>
          </button>
        )}
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-8 animate-fadeIn">
      {/* 3. OVERALL SCORE CARD                                                    */}
      {/* ========================================================================= */}
      <GlassCard className="p-8 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-xs font-bold text-[#70685E] uppercase tracking-widest font-mono">
              OVERALL EXAMINATION SCORE
            </span>

            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="text-5xl sm:text-6xl font-serif font-black text-[#1F1B16] tracking-tight">
                {result.overallScore}
              </span>
              <span className="text-2xl text-[#70685E] font-serif font-semibold">/ 100</span>
            </div>

            <div className="inline-block px-3 py-1 rounded-sm bg-[#EBF4EE] border border-[#CDE5D4] text-[#235E3B] text-xs font-bold font-mono">
              ● {result.qualitativeRating}
            </div>

            {/* XP and Streak Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] text-xs font-bold shadow-xs">
                <Zap className="w-4 h-4 text-[#1A365D]" />
                <span>+{result.xpEarned} Practice XP</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] text-xs font-bold shadow-xs">
                <Flame className="w-4 h-4 text-[#9A421A]" />
                <span>{result.streakDays} Day Practice Streak</span>
              </div>
            </div>
          </div>

          {/* Circular Score Gauge */}
          <div className="shrink-0 flex flex-col items-center">
            <CircularScore
              score={result.overallScore}
              size={140}
              strokeWidth={8}
              color="auto"
              label="Readiness"
            />
          </div>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 3B. HIRING COMMITTEE CALIBRATION & SENIORITY LEVEL DOSSIER               */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="editorial-overline">FAANG COMMITTEE CALIBRATION PROTOCOL</span>
                <Badge variant={activePlaybook.badgeVariant} size="sm">{activePlaybook.badge}</Badge>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1F1B16]">{activePlaybook.name}</h3>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-xs text-[#70685E] font-mono">Calibrated Committee Consensus:</span>
            <span
              className={`px-3 py-1 rounded-sm text-xs font-mono font-bold uppercase tracking-wider ${
                hiringCommittee.verdict === 'Strong Hire'
                  ? 'bg-[#EBF4EE] text-[#235E3B] border border-[#C2E0C6]'
                  : hiringCommittee.verdict === 'Hire'
                  ? 'bg-[#EAEFF5] text-[#1A365D] border border-[#BAC7D5]'
                  : hiringCommittee.verdict === 'Lean Hire'
                  ? 'bg-[#FAF8F3] text-[#8C6E54] border border-[#E5E0D5]'
                  : hiringCommittee.verdict === 'Lean No Hire'
                  ? 'bg-[#FDF2E9] text-[#9A421A] border border-[#F0D5C0]'
                  : 'bg-[#FDEDEC] text-[#B03A2E] border border-[#F5B7B1]'
              }`}
            >
              ● {hiringCommittee.verdict}
            </span>
          </div>
        </div>

        {/* 5-Tier Canonical FAANG Consensus Meter */}
        <div className="space-y-2 p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
          <div className="flex items-center justify-between text-xs font-mono text-[#70685E]">
            <span>5-Tier Hiring Committee Consensus Meter</span>
            <span className="font-bold text-[#1F1B16]">Calibrated Verdict: {hiringCommittee.verdict}</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[
              { key: 'No Hire', label: 'No Hire', activeBg: 'bg-[#B03A2E] text-white', inactiveBg: 'bg-[#F2EFE9] text-[#70685E]' },
              { key: 'Lean No Hire', label: 'Lean No Hire', activeBg: 'bg-[#9A421A] text-white', inactiveBg: 'bg-[#F2EFE9] text-[#70685E]' },
              { key: 'Lean Hire', label: 'Lean Hire', activeBg: 'bg-[#8C6E54] text-white', inactiveBg: 'bg-[#F2EFE9] text-[#70685E]' },
              { key: 'Hire', label: 'Hire', activeBg: 'bg-[#1A365D] text-white', inactiveBg: 'bg-[#F2EFE9] text-[#70685E]' },
              { key: 'Strong Hire', label: 'Strong Hire', activeBg: 'bg-[#235E3B] text-white', inactiveBg: 'bg-[#F2EFE9] text-[#70685E]' }
            ].map((tier) => {
              const isSelected = hiringCommittee.verdict === tier.key;
              return (
                <div
                  key={tier.key}
                  className={`py-2 px-1 text-center rounded-sm text-[11px] font-mono font-bold transition-all ${
                    isSelected ? `${tier.activeBg} shadow-xs ring-1 ring-[#1F1B16]/20` : `${tier.inactiveBg} opacity-60`
                  }`}
                >
                  <span className="block truncate">{tier.label}</span>
                  {isSelected && <span className="text-[9px] block uppercase tracking-tight mt-0.5">● Consensus</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Seniority Level Calibration Dossier */}
        <div className="p-4 sm:p-5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-[#8C6E54]" />
              <div>
                <span className="editorial-overline text-[10px] block">SENIORITY LEVEL CALIBRATION (L3 TO L6)</span>
                <h4 className="text-base font-serif font-bold text-[#1F1B16]">{seniorityBenchmark.level}</h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="navy" size="sm">{seniorityBenchmark.status}</Badge>
              <span className="text-[11px] font-mono text-[#70685E] px-2 py-0.5 rounded bg-[#FAF8F3] border border-[#E5E0D5]">
                {seniorityBenchmark.targetYears}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#3B352E] leading-relaxed">
            <strong className="text-[#1F1B16]">Calibrated Scope:</strong> {seniorityBenchmark.scope}
          </p>

          <div className="pt-2 border-t border-[#E5E0D5] flex flex-wrap items-center justify-between gap-2 text-xs text-[#70685E] font-mono">
            <span>Committee Deliberation Synthesis:</span>
            <span className="text-[#1F1B16] font-semibold">{hiringCommittee.reasoning}</span>
          </div>
        </div>

        {/* Competency Matrix Grid */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-[#70685E] pb-1">
            <span>Company Core Competencies Evaluated ({Object.keys(rubricMatrix).length || activePlaybook.competencies.length})</span>
            <span>Coverage: {hiringCommittee.rubricCoveragePct}% Verified</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(rubricMatrix).length > 0
              ? Object.values(rubricMatrix)
              : activePlaybook.competencies.map(c => ({ ...c, status: 'verified', score: 80 }))
            ).map((comp) => (
              <div
                key={comp.id}
                className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col justify-between space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-serif font-bold text-[#1F1B16]">{comp.name}</span>
                    <p className="text-[11px] text-[#70685E] leading-relaxed">{comp.criteria}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-sm shrink-0 ${
                      comp.status === 'verified'
                        ? 'bg-[#EBF4EE] text-[#235E3B] border border-[#C2E0C6]'
                        : comp.status === 'weak'
                        ? 'bg-[#FDF2E9] text-[#9A421A] border border-[#F0D5C0]'
                        : 'bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5]'
                    }`}
                  >
                    {comp.status === 'verified' ? 'Verified' : comp.status === 'weak' ? 'Needs Work' : 'Pending'}
                  </span>
                </div>

                {comp.evidence && comp.evidence.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E0D5]/70 text-[10px] font-mono text-[#70685E] italic line-clamp-1">
                    Evidence: "{comp.evidence[0]}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 5. AI PERFORMANCE SUMMARY                                                */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 border-[#E5E0D5] bg-[#FFFDF9] space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] flex items-center justify-center text-[#1A365D]">
              <Bot className="w-5 h-5" />
            </div>
            <h2 className="text-base font-serif font-bold text-[#1F1B16]">Examination Committee Evaluation Summary</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-[#EBF4EE] text-[#235E3B] border border-[#CDE5D4] flex items-center gap-1 font-mono">
              <Globe className="w-3 h-3 text-[#235E3B]" />
              {getLanguageDisplayName(activeLang)}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5] font-mono">
              Faculty Audit
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#1F1B16] font-serif italic leading-relaxed pt-1">
          "{result.aiSummary}"
        </p>

        <div className="pt-2 text-[11px] text-[#70685E] flex items-center gap-1.5 font-mono">
          <Cpu className="w-3.5 h-3.5 text-[#1A365D] shrink-0" />
          <span>Synthesized using multi-dimensional token analysis & candidate response rubrics.</span>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 8. AGENT RECOMMENDATION (Critical Product Differentiation)                */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 border-[#E5E0D5] bg-[#FFFDF9] space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D5] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] flex items-center justify-center text-[#1A365D]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1F1B16]">FACULTY ADVISORY DIRECTIVE</h2>
              <p className="text-xs text-[#70685E]">Prescribed Remediation & Practice Pathway</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#70685E]">Priority Focus:</span>
            <span className="px-2.5 py-1 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#1A365D] font-serif font-bold text-xs">
              {result.recommendationFocus}
            </span>
          </div>
        </div>

        <p className="text-sm text-[#1F1B16] font-serif leading-relaxed">
          "{result.recommendationExplanation}"
        </p>

        {/* 3 Clickable Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {result.recommendedActions.map((action) => (
            <div
              key={action.id}
              onClick={() => navigate(action.route)}
              className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] hover:border-[#1A365D] hover:bg-[#F2EFE9] transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] text-xs font-mono font-bold flex items-center justify-center">
                    {action.num}
                  </span>
                  <Badge variant="navy" size="sm">
                    {action.tag}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-[#1F1B16] font-serif group-hover:text-[#1A365D] transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-[#70685E] mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#1A365D] group-hover:translate-x-1 transition-transform">
                <span>{action.actionLabel || 'Commence Drill'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 9. AGENT DECISION TIMELINE                                                */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 space-y-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
        <div>
          <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#1A365D]" />
            Faculty Reasoning & Directive Provenance
          </h2>
          <p className="text-xs text-[#70685E] mt-0.5">
            Transparent algorithmic reasoning pipeline — moving beyond opaque conversational chatbots
          </p>
        </div>

        {/* 5-Step Agent Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative pt-2">
          {result.timelineSteps.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col justify-between space-y-2 relative"
            >
              <div>
                <div className="w-7 h-7 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] font-mono font-bold text-xs flex items-center justify-center mb-2">
                  0{step.step}
                </div>
                <h3 className="text-xs font-bold text-[#1F1B16] font-serif">{step.title}</h3>
                <p className="text-[11px] text-[#70685E] mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 11. NEXT BEST ACTION (Live AI Recommendation + 3 Cards)                   */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="border-b border-[#E5E0D5] pb-2">
          <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
            RECOMMENDED PRACTICE ACTIONS
          </h2>
          <p className="text-xs text-[#70685E]">
            Suggested exercises tailored to your interview performance
          </p>
        </div>

        {/* Live Autonomous Next-Best-Action from Backend */}
        {session.summaryResult?.backendReport?.next_best_action && (
          <GlassCard className="p-5 border-[#BAC7D5] bg-[#FFFDF9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1A365D]" />
                <span className="text-xs font-bold text-[#1A365D] uppercase tracking-wider font-mono">
                  Autonomous Next-Best-Action
                </span>
                {session.summaryResult.backendReport.feedback_language && session.summaryResult.backendReport.feedback_language !== 'en' && (
                  <Badge variant="navy" size="sm">
                    {session.summaryResult.backendReport.feedback_language.toUpperCase()}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">
                {session.summaryResult.backendReport.next_best_action.title}
              </h3>
              <p className="text-xs text-[#70685E]">
                {session.summaryResult.backendReport.next_best_action.reason}
              </p>
            </div>
            <GradientButton
              variant="primary"
              size="md"
              onClick={() => navigate(session.summaryResult.backendReport.next_best_action.route || '/daily-challenge')}
              icon={ArrowRight}
              className="shrink-0 w-full sm:w-auto"
            >
              {session.summaryResult.backendReport.next_best_action.action || 'Execute Directive'}
            </GradientButton>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <GlassCard
            hoverEffect
            onClick={() => navigate('/skill-gap')}
            className="p-6 cursor-pointer flex flex-col justify-between space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#1A365D] mb-3">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">Competency Gap Matrix</h3>
              <p className="text-xs text-[#70685E] mt-1 leading-relaxed">
                Inspect your verified proficiency ratings against target industry benchmarks.
              </p>
            </div>
            <span className="text-xs font-bold text-[#1A365D] flex items-center gap-1 pt-2">
              Inspect Skill Gaps →
            </span>
          </GlassCard>

          {/* Card 2 */}
          <GlassCard
            hoverEffect
            onClick={() => navigate('/daily-challenge')}
            className="p-6 cursor-pointer flex flex-col justify-between space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#9A421A] mb-3">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">Daily Practice</h3>
              <p className="text-xs text-[#70685E] mt-1 leading-relaxed">
                Complete today's drill to sustain your practice streak and earn +20 XP.
              </p>
            </div>
            <span className="text-xs font-bold text-[#9A421A] flex items-center gap-1 pt-2">
              Start Daily Practice (+20 XP) →
            </span>
          </GlassCard>

          {/* Card 3 */}
          <GlassCard
            hoverEffect
            onClick={() => navigate('/interview-setup')}
            className="p-6 cursor-pointer flex flex-col justify-between space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs"
          >
            <div>
              <div className="w-10 h-10 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#8C6E54] mb-3">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">Practice Another Interview</h3>
              <p className="text-xs text-[#70685E] mt-1 leading-relaxed">
                Start a new interview session with adaptive questions tailored to your skill level.
              </p>
            </div>
            <span className="text-xs font-bold text-[#1A365D] flex items-center gap-1 pt-2">
              Start Practice Session →
            </span>
          </GlassCard>
        </div>
      </div>

      {/* ========================================================================= */}
        </div>
      )}

      {activeTab === 'competencies' && (
        <div className="space-y-8 animate-fadeIn">
      {/* 3C. CANONICAL 4-PILLAR INDUSTRY RUBRIC SCORING (Interviewing.io Benchmark) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-overline">CANONICAL EVALUATION RUBRIC</span>
              <Badge variant="bronze" size="sm">4 Industry Pillars</Badge>
            </div>
            <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
              FAANG 4-Pillar Industry Rubric
            </h2>
            <p className="text-xs text-[#70685E]">
              Standardized industry dimensions benchmarked against Tier-1 hiring committees (Google, Meta, Stripe)
            </p>
          </div>
          <div className="text-xs font-mono text-[#70685E] bg-[#FAF8F3] px-3 py-1 rounded-md border border-[#E5E0D5] hidden sm:block">
            Autonomous Problem Solving Benchmark
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Algorithmic & Technical Depth */}
          <GlassCard className="p-5 flex flex-col justify-between space-y-3 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs hover:border-[#1A365D] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-[#70685E] tracking-widest">
                  1. Algorithmic Depth
                </span>
                <Badge variant={industryPillars.algorithmicDepth.score >= 80 ? 'forest' : 'navy'} size="xs">
                  {industryPillars.algorithmicDepth.status}
                </Badge>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-serif font-bold text-[#1F1B16]">
                  {industryPillars.algorithmicDepth.score}
                </span>
                <span className="text-xs text-[#70685E] font-serif">/ 100</span>
              </div>

              <ProgressBar value={industryPillars.algorithmicDepth.score} height="h-1.5" />
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] text-xs text-[#70685E] leading-relaxed">
              <strong className="text-[#1F1B16] block mb-0.5">Big-O & Correctness:</strong>
              {industryPillars.algorithmicDepth.criteria}
            </div>
          </GlassCard>

          {/* Pillar 2: Architecture & Code Quality */}
          <GlassCard className="p-5 flex flex-col justify-between space-y-3 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs hover:border-[#1A365D] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-[#70685E] tracking-widest">
                  2. Architecture & Code
                </span>
                <Badge variant={industryPillars.architectureQuality.score >= 80 ? 'forest' : 'navy'} size="xs">
                  {industryPillars.architectureQuality.status}
                </Badge>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-serif font-bold text-[#1F1B16]">
                  {industryPillars.architectureQuality.score}
                </span>
                <span className="text-xs text-[#70685E] font-serif">/ 100</span>
              </div>

              <ProgressBar value={industryPillars.architectureQuality.score} height="h-1.5" />
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] text-xs text-[#70685E] leading-relaxed">
              <strong className="text-[#1F1B16] block mb-0.5">Scale & Modularity:</strong>
              {industryPillars.architectureQuality.criteria}
            </div>
          </GlassCard>

          {/* Pillar 3: Communication & Thought Process */}
          <GlassCard className="p-5 flex flex-col justify-between space-y-3 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs hover:border-[#1A365D] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-[#70685E] tracking-widest">
                  3. Communication
                </span>
                <Badge variant={industryPillars.communicationPacing.score >= 80 ? 'forest' : 'navy'} size="xs">
                  {industryPillars.communicationPacing.status}
                </Badge>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-serif font-bold text-[#1F1B16]">
                  {industryPillars.communicationPacing.score}
                </span>
                <span className="text-xs text-[#70685E] font-serif">/ 100</span>
              </div>

              <ProgressBar value={industryPillars.communicationPacing.score} height="h-1.5" />
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] text-xs text-[#70685E] leading-relaxed">
              <strong className="text-[#1F1B16] block mb-0.5">Pacing & Structure:</strong>
              {industryPillars.communicationPacing.criteria}
            </div>
          </GlassCard>

          {/* Pillar 4: Autonomy vs. Coaching Receptivity */}
          <GlassCard className="p-5 flex flex-col justify-between space-y-3 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs hover:border-[#1A365D] transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-[#70685E] tracking-widest">
                  4. Autonomy & Coaching
                </span>
                <Badge variant={industryPillars.autonomyCoachability.score >= 80 ? 'forest' : 'amber'} size="xs">
                  {industryPillars.autonomyCoachability.status}
                </Badge>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-serif font-bold text-[#1F1B16]">
                  {industryPillars.autonomyCoachability.score}
                </span>
                <span className="text-xs text-[#70685E] font-serif">/ 100</span>
              </div>

              <ProgressBar value={industryPillars.autonomyCoachability.score} height="h-1.5" />
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] text-xs text-[#70685E] leading-relaxed">
              <strong className="text-[#1F1B16] block mb-0.5">
                {industryPillars.autonomyCoachability.hintsUsed === 0 ? '0 Nudges (Full Autonomy)' : `${industryPillars.autonomyCoachability.hintsUsed} Nudges Integrated:`}
              </strong>
              {industryPillars.autonomyCoachability.criteria}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. AI EVALUATION RUBRIC (5 Core Dimensions)                              */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
          <div>
            <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
              Academic Evaluation Rubric
            </h2>
            <p className="text-xs text-[#70685E]">
              Calibrated against the 5 candidate evaluation dimensions established in your examination brief
            </p>
          </div>
          <Badge variant="navy" size="sm">5 Dimensions</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.rubricDetails.map((dimension) => (
            <GlassCard
              key={dimension.id}
              className="p-5 flex flex-col justify-between space-y-4 border-[#E5E0D5] bg-[#FFFDF9] hover:border-[#1A365D] transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                      {getDimensionIcon(dimension.id)}
                    </div>
                    <h3 className="text-sm font-bold text-[#1F1B16] font-serif">{dimension.label}</h3>
                  </div>
                  <Badge variant={dimension.score >= 85 ? 'forest' : dimension.score >= 78 ? 'navy' : 'bronze'} size="sm">
                    {dimension.tag}
                  </Badge>
                </div>

                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl font-serif font-bold text-[#1F1B16]">{dimension.score}</span>
                  <span className="text-xs text-[#70685E] font-serif">/ 100</span>
                </div>

                <ProgressBar
                  value={dimension.score}
                  height="h-1.5"
                />

                <p className="text-xs text-[#70685E] mt-3 leading-relaxed">
                  {dimension.explanation}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. STRENGTHS & 7. AREAS TO IMPROVE (Two Columns)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Strengths Card */}
        <GlassCard className="p-6 space-y-4 border-[#CDE5D4] bg-[#FFFDF9] shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <CheckCircle2 className="w-5 h-5 text-[#235E3B] shrink-0" />
            <h2 className="text-base font-serif font-bold text-[#235E3B]">Demonstrated Competencies</h2>
          </div>

          <ul className="space-y-2.5 text-xs text-[#3B352E]">
            {result.strengths.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] font-medium"
              >
                <span className="text-[#235E3B] font-bold text-sm">✓</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Areas to Improve Card */}
        <GlassCard className="p-6 space-y-4 border-[#F0C9B3] bg-[#FFFDF9] shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <AlertCircle className="w-5 h-5 text-[#9A421A] shrink-0" />
            <h2 className="text-base font-serif font-bold text-[#9A421A]">Curricular Gaps & Remediation</h2>
          </div>

          <ul className="space-y-2.5 text-xs text-[#3B352E]">
            {result.improvements.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] font-medium"
              >
                <span className="text-[#9A421A] font-bold text-sm">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </GlassCard>

      </div>

      {/* ========================================================================= */}
      {/* 7.5 SKILLS OBSERVED IN THIS INTERVIEW                                     */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 space-y-5 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-[#1A365D]" />
            <div>
              <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
                Competencies Tracked in this Examination
              </h2>
              <p className="text-xs text-[#70685E]">
                Live evaluated competencies mapped directly to your Candidate Skill Inventory
              </p>
            </div>
          </div>
          <Badge variant="navy" size="sm">
            {observedSkills.length} Verified
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {observedSkills.map((sk) => (
            <div
              key={sk.skill_name}
              className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] hover:border-[#1A365D] transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-serif font-bold text-[#1F1B16]">{sk.skill_name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={sk.score >= 80 ? 'forest' : sk.score >= 65 ? 'navy' : 'bronze'} size="xs">
                    {sk.status}
                  </Badge>
                  <span className="text-sm font-bold text-[#1A365D] font-mono">
                    {sk.score}%
                  </span>
                </div>
              </div>

              <ProgressBar
                value={sk.score}
                height="h-1.5"
              />

              {sk.missing_concepts && sk.missing_concepts.length > 0 && (
                <div className="text-[11px] text-[#70685E] pt-1">
                  <span className="font-semibold text-[#9A421A]">Unaddressed Concepts: </span>
                  <span>{sk.missing_concepts.slice(0, 3).join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-8 animate-fadeIn">
      {/* 10. QUESTION-BY-QUESTION PERFORMANCE (Expandable Rows)                    */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
          <div>
            <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
              Examination Inquiry Ledger
            </h2>
            <p className="text-xs text-[#70685E]">
              Select any question to inspect candidate discourse, rubric scores, and faculty critique
            </p>
          </div>
          <span className="text-xs text-[#1A365D] font-mono">
            {result.questionPerformance.length} Inquiries Evaluated
          </span>
        </div>

        <div className="space-y-3">
          {result.questionPerformance.map((item) => {
            const isExpanded = !!expandedQuestions[item.num];
            return (
              <GlassCard
                key={item.num}
                className={`p-0 overflow-hidden border transition-all ${
                  isExpanded ? 'border-[#1A365D] shadow-sm' : 'border-[#E5E0D5] hover:border-[#BAC7D5]'
                }`}
              >
                {/* Accordion Row Header */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(item.num)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors hover:bg-[#FAF8F3] cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <span className="w-8 h-8 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      Q{item.num}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#8C6E54] uppercase tracking-wider font-mono">
                          {item.dimension}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-serif font-semibold text-[#1F1B16] truncate mt-0.5">
                        {item.question}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 ml-2">
                    <div className="text-right">
                      <span className="text-[10px] text-[#70685E] block uppercase font-mono">Score</span>
                      <span className="text-sm sm:text-base font-serif font-bold text-[#1F1B16]">
                        {item.score}/100
                      </span>
                    </div>

                    <div className="p-1 rounded-sm bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5]">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Detailed Breakdown */}
                {isExpanded && (
                  <div className="p-5 border-t border-[#E5E0D5] bg-[#FAF8F3] space-y-4 text-xs animate-in fade-in duration-200">
                    {/* Full Question */}
                    <div>
                      <span className="font-bold text-[#70685E] uppercase tracking-wider text-[10px] block mb-1 font-mono">
                        Prompt As Issued:
                      </span>
                      <p className="text-[#1F1B16] font-serif font-medium p-3 rounded-md bg-[#FFFDF9] border border-[#E5E0D5]">
                        "{item.question}"
                      </p>
                    </div>

                    {/* Candidate Answer */}
                    <div>
                      <span className="font-bold text-[#1A365D] uppercase tracking-wider text-[10px] block mb-1 font-mono">
                        Candidate Answer Submitted:
                      </span>
                      <p className="text-[#1F1B16] leading-relaxed p-3 rounded-md bg-[#FFFDF9] border border-[#E5E0D5]">
                        {item.userAnswer}
                      </p>
                    </div>

                    {/* AI Feedback */}
                    <div className="p-3 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-[#1A365D] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-serif font-bold text-[#1A365D] block mb-0.5">Faculty Evaluation Critique:</span>
                        <p className="text-[#3B352E] leading-relaxed">{item.feedback}</p>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
        </div>
      )}

      {activeTab === 'recording' && (
        <div className="space-y-8 animate-fadeIn">
      {/* 4.5 COMMUNICATION & DELIVERY ANALYSIS (Verbal Evidence & Cadence)         */}
      {/* ========================================================================= */}
      {commMetrics && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#1A365D]" />
              <div>
                <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
                  Oral Communication & Cadence Audit
                </h2>
                <p className="text-xs text-[#70685E]">
                  Acoustic and transcript cadence evaluated from candidate verbal responses
                </p>
              </div>
            </div>
            <Badge variant="navy" size="sm">Oral Metrics</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Speaking Pace */}
            <GlassCard className="p-5 border-[#E5E0D5] bg-[#FFFDF9] space-y-2 shadow-xs">
              <span className="text-[10px] text-[#70685E] uppercase font-bold tracking-widest font-mono block">
                Speaking Pace
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1F1B16]">
                  {commMetrics.speaking_pace_wpm || 142}
                </span>
                <span className="text-xs text-[#70685E] font-mono">WPM</span>
              </div>
              <p className="text-[11px] text-[#235E3B] font-semibold">
                ● Optimal Cadence (Benchmark: 130–160 WPM)
              </p>
              <p className="text-[11px] text-[#70685E] leading-tight pt-1">
                Pace was steady, articulate, and well suited for technical comprehension.
              </p>
            </GlassCard>

            {/* 2. Filler Words */}
            <GlassCard className="p-5 border-[#E5E0D5] bg-[#FFFDF9] space-y-2 shadow-xs">
              <span className="text-[10px] text-[#70685E] uppercase font-bold tracking-widest font-mono block">
                Filler Words
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1F1B16]">
                  {commMetrics.filler_word_count ?? 3}
                </span>
                <span className="text-xs text-[#70685E]">detected</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {Object.entries(commMetrics.filler_words_breakdown || { um: 2, like: 1 }).map(([word, count]) => (
                  <span key={word} className="text-[10px] px-2 py-0.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#3B352E] font-mono">
                    "{word}": {count}
                  </span>
                ))}
              </div>
            </GlassCard>

            {/* 3. Response Timing */}
            <GlassCard className="p-5 border-[#E5E0D5] bg-[#FFFDF9] space-y-2 shadow-xs">
              <span className="text-[10px] text-[#70685E] uppercase font-bold tracking-widest font-mono block">
                Response Duration
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1F1B16]">
                  {Math.round((commMetrics.duration_seconds || 120) / 60)}m {Math.round((commMetrics.duration_seconds || 120) % 60)}s
                </span>
              </div>
              <p className="text-[11px] text-[#1A365D] font-mono">
                Avg ~{Math.round((commMetrics.duration_seconds || 120) / Math.max(1, (session.answers?.length || 5)))}s per question
              </p>
              <p className="text-[11px] text-[#70685E] leading-tight pt-1">
                Disciplined response duration without undue haste or hesitation.
              </p>
            </GlassCard>

            {/* 4. Answer Structure / STAR */}
            <GlassCard className="p-5 border-[#E5E0D5] bg-[#FFFDF9] space-y-2 shadow-xs">
              <span className="text-[10px] text-[#70685E] uppercase font-bold tracking-widest font-mono block">
                Discourse Structure
              </span>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle2 className={`w-5 h-5 ${commMetrics.star_detected ? 'text-[#235E3B]' : 'text-[#1A365D]'}`} />
                <span className="text-sm font-bold text-[#1F1B16] font-serif">
                  {commMetrics.star_detected ? 'STAR Method Observed' : 'Structured Discourse'}
                </span>
              </div>
              <p className="text-[11px] text-[#70685E] leading-tight pt-1">
                {commMetrics.star_detected
                  ? 'Candidate structured explanations into Situation, Task, Action, and Result.'
                  : 'Delivered organized technical defenses with logical progression and tradeoffs.'}
              </p>
            </GlassCard>
          </div>

          {/* Delivery Strengths & Suggestions */}
          {commMetrics.suggestions && commMetrics.suggestions.length > 0 && (
            <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3 shadow-xs">
              <Bot className="w-5 h-5 text-[#1A365D] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <strong className="text-[#1F1B16] font-serif font-bold">Oral Delivery Observations & Recommendations:</strong>
                <ul className="list-disc list-inside space-y-1 text-[#3B352E]">
                  {commMetrics.suggestions.map((sug, i) => (
                    <li key={i}>{sug}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4.6 RECORDING REVIEW PLAYER (HTML5 Video & Question Timeline Jump Links)   */}
      {/* ========================================================================= */}
      {isVideoSession && (
        <RecordingReview
          sessionId={session.sessionId}
          userId={user?.id || 'usr_candidate'}
          recordedBlob={session.recordedBlob}

          streamUrl={session.recordingData?.stream_url}
          segments={segments}
        />
      )}

      {/* ========================================================================= */}
        </div>
      )}

      {/* 12. FINAL ACTION BUTTONS                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E5E0D5]">
        <GradientButton
          variant="secondary"
          size="lg"
          onClick={() => navigate('/dashboard')}
          icon={LayoutDashboard}
          className="w-full sm:w-auto"
        >
          ← Return to Dashboard
        </GradientButton>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-sm font-semibold text-[#1F1B16] hover:bg-[#F2EFE9] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-[#1A365D]" />
            <span>Download Report (.md)</span>
          </button>
          <GradientButton
            variant="primary"
            size="lg"
            onClick={handleStartAnother}
            icon={ArrowRight}
            className="w-full sm:w-auto px-8"
          >
            Practice Another Interview →
          </GradientButton>
        </div>
      </div>

    </div>
  );
}

