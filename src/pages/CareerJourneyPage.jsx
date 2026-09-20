import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { careerJourneyApi } from '../services/careerJourneyApi';
import { 
  Compass, 
  CheckCircle2, 
  Clock, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  FileSearch, 
  Target, 
  Code2, 
  Flame, 
  Mic, 
  Award, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function CareerJourneyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [journeyData, setJourneyData] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [error, setError] = useState(null);

  const fetchJourney = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await careerJourneyApi.getCareerJourney(user?.id || 'user-001');
      if (data) {
        setJourneyData(data);
      } else {
        // Fallback local mock if backend is totally unreachable
        setJourneyData(getFallbackJourney(user));
      }
    } catch (err) {
      console.error('[CareerJourneyPage] fetch error:', err);
      setJourneyData(getFallbackJourney(user));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [user?.id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1A365D]/10 text-[#1A365D] border border-[#1A365D]/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1A365D]" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8C6E54]/10 text-[#8C6E54] border border-[#8C6E54]/20">
            <span className="w-2 h-2 rounded-full bg-[#8C6E54] animate-pulse" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F2EFE9] text-[#70685E] border border-[#E5E0D5]">
            <Circle className="w-3.5 h-3.5 text-[#A8A29E]" />
            Not Started
          </span>
        );
    }
  };

  const getReadinessBadge = (band) => {
    switch (band) {
      case 'strong_preparation':
        return {
          label: 'Strong Preparation',
          subtext: 'High Readiness Across All Core Areas',
          bgColor: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          accent: 'text-emerald-700'
        };
      case 'interview_ready':
        return {
          label: 'Interview Ready',
          subtext: 'Core Competency Threshold Achieved',
          bgColor: 'bg-[#1A365D]/10 border-[#1A365D]/30 text-[#1A365D]',
          accent: 'text-[#1A365D]'
        };
      case 'developing':
        return {
          label: 'Developing',
          subtext: 'Active Preparation & Practice in Progress',
          bgColor: 'bg-[#8C6E54]/10 border-[#8C6E54]/30 text-[#8C6E54]',
          accent: 'text-[#8C6E54]'
        };
      case 'building_foundations':
        return {
          label: 'Building Foundations',
          subtext: 'Initial Profiles & Diagnostics Configured',
          bgColor: 'bg-[#F2EFE9] border-[#E5E0D5] text-[#3B352E]',
          accent: 'text-[#70685E]'
        };
      default:
        return {
          label: 'Getting Started',
          subtext: 'Onboarding Candidate Journey',
          bgColor: 'bg-[#F8F6F0] border-[#E5E0D5] text-[#70685E]',
          accent: 'text-[#8C6E54]'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-3 border-[#1A365D] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-[#3B352E] text-sm tracking-wide">
          Synthesizing authentic career trajectory & preparation evidence...
        </p>
      </div>
    );
  }

  const {
    candidate_name,
    target_role,
    preparation_headline,
    current_focus,
    next_best_action,
    readiness,
    milestones,
    stats
  } = journeyData || {};

  const readinessStyle = getReadinessBadge(readiness?.readiness_band);

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Editorial Page Header & Dossier Masthead */}
      <div className="bg-[#FFFDF9] border border-[#E5E0D5] rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(31,27,22,0.03)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2EFE9] rounded-full filter blur-3xl -z-0 opacity-50 transform translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-[#1A365D]/10 text-[#1A365D] border border-[#1A365D]/20 text-xs font-semibold uppercase tracking-wider">
                Preparation Lifecycle
              </span>
              <span className="text-xs text-[#70685E] font-medium">
                Candidate: <strong className="text-[#1F1B16]">{candidate_name || user?.name || 'Candidate'}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1F1B16] tracking-tight">
              Career Journey & Readiness
            </h1>

            <p className="text-sm sm:text-base text-[#3B352E] font-sans max-w-2xl leading-relaxed">
              {preparation_headline || `Structured preparation path toward ${target_role || 'AIML Engineer'}`}
            </p>
          </div>

          {/* Quick Stats & Refresh Button */}
          <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-[#E5E0D5]">
            <button
              onClick={() => fetchJourney(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E0D5] bg-[#F8F6F0] hover:bg-[#F2EFE9] text-[#3B352E] text-xs font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Sync Evidence'}</span>
            </button>

            <div className="flex items-center gap-4 text-xs text-[#70685E]">
              <div>
                <span className="font-bold text-[#1F1B16] text-sm">{stats?.completed_milestones || 0}</span>
                <span className="text-[11px] block">Completed</span>
              </div>
              <div className="h-6 w-px bg-[#E5E0D5]" />
              <div>
                <span className="font-bold text-[#8C6E54] text-sm">{stats?.in_progress_milestones || 0}</span>
                <span className="text-[11px] block">In Progress</span>
              </div>
              <div className="h-6 w-px bg-[#E5E0D5]" />
              <div>
                <span className="font-bold text-[#1A365D] text-sm">{stats?.total_interviews || 0}</span>
                <span className="text-[11px] block">Interviews</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Focus & Next Best Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Focus Banner */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E5E0D5] rounded-xl p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(31,27,22,0.02)]">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6E54] uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              <span>Strategic Focus</span>
            </div>
            <h2 className="font-serif text-lg font-bold text-[#1F1B16]">
              Current Preparation Priority
            </h2>
            <p className="text-sm text-[#3B352E] leading-relaxed">
              {current_focus || 'Establish your diagnostic baseline across resume parsing and technical interviewing.'}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#70685E]">
            <span>Target Role: <strong className="text-[#1F1B16]">{target_role}</strong></span>
            <span>Based on verified audit</span>
          </div>
        </div>

        {/* Autonomous Next-Best-Action Callout */}
        <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#1A365D]/30 rounded-xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1A365D]/5 rounded-bl-full pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#1B2A4A] text-white text-[11px] font-semibold tracking-wide">
                  Next Best Action
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  next_best_action?.priority === 'high'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {next_best_action?.priority || 'High'} Priority
                </span>
              </div>
              <span className="text-xs text-[#70685E]">{next_best_action?.estimated_effort || '10 mins'}</span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1F1B16] tracking-tight">
                {next_best_action?.title || 'Audit Your Resume with ATS'}
              </h3>
              <p className="text-xs sm:text-sm text-[#3B352E] mt-1 leading-relaxed">
                {next_best_action?.reason || 'Submit your latest resume to establish matched competencies and discover critical gaps.'}
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E5E0D5] flex items-center justify-between gap-4 relative z-10">
            <span className="text-xs text-[#70685E] truncate">
              Route: <code className="text-[#1A365D] font-mono font-semibold">{next_best_action?.route || '/ats'}</code>
            </span>
            <button
              onClick={() => navigate(next_best_action?.route || '/ats')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B2A4A] hover:bg-[#1A365D] text-white text-xs sm:text-sm font-semibold transition-colors shadow cursor-pointer shrink-0"
            >
              <span>{next_best_action?.action || 'Execute Action'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Career Readiness Foundation Section */}
      <div className="bg-[#FFFDF9] border border-[#E5E0D5] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(31,27,22,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1A365D] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Dimensional Verification</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1B16]">
              Career Readiness Foundation
            </h2>
            <p className="text-xs sm:text-sm text-[#70685E]">
              Transparent, evidence-based readiness bands derived deterministically from candidate practice.
            </p>
          </div>

          {/* Current Readiness Badge */}
          <div className={`px-4 py-2.5 rounded-xl border ${readinessStyle.bgColor} flex flex-col sm:items-end justify-center shrink-0`}>
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              Assessed Readiness
            </span>
            <span className="text-base sm:text-lg font-serif font-bold tracking-tight">
              {readinessStyle.label}
            </span>
            <span className="text-[11px] opacity-90 hidden sm:block">
              {readinessStyle.subtext}
            </span>
          </div>
        </div>

        {/* Transparent Rationale Callout */}
        <div className="p-4 rounded-lg bg-[#F8F6F0] border border-[#E5E0D5] text-xs sm:text-sm text-[#3B352E] leading-relaxed flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#8C6E54] shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-[#1F1B16] block mb-0.5">Evaluation Rationale:</strong>
            {readiness?.rationale || 'Candidate preparation profile is active. Grounding based on platform evidence.'}
          </div>
        </div>

        {/* 5 Preparation Dimensions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {readiness?.dimensions?.map((dim) => {
            const isVerified = dim.status === 'Verified';
            const isInProgress = dim.status === 'In Progress';
            return (
              <div
                key={dim.dimension_key}
                className="bg-[#F8F6F0] border border-[#E5E0D5] rounded-lg p-4 flex flex-col justify-between space-y-3 transition-colors hover:border-[#1A365D]/40"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1F1B16] tracking-tight">
                      {dim.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : isInProgress
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#E5E0D5] text-[#70685E]'
                      }`}
                    >
                      {dim.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#3B352E] leading-relaxed">
                    {dim.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between text-[11px] text-[#70685E]">
                  <span>Evidence count: <strong>{dim.evidence_count}</strong></span>
                  {dim.score_indicator && (
                    <span className="font-semibold text-[#1A365D] bg-[#1A365D]/10 px-1.5 py-0.5 rounded">
                      {dim.score_indicator}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Academic Non-Predictive Disclaimer Notice */}
        <div className="pt-2 flex items-start gap-2.5 text-[11px] text-[#70685E] border-t border-[#E5E0D5] leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-[#8C6E54] shrink-0 mt-0.5" />
          <span>{readiness?.disclaimer}</span>
        </div>
      </div>

      {/* 14-Milestone Sequential Lifecycle Timeline */}
      <div className="bg-[#FFFDF9] border border-[#E5E0D5] rounded-xl p-6 sm:p-8 space-y-6 shadow-[0_1px_3px_rgba(31,27,22,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8C6E54] uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Chronological Preparation Chain</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1B16]">
              14 Lifecycle Milestones
            </h2>
            <p className="text-xs sm:text-sm text-[#70685E]">
              Step-by-step career readiness path from initial profile registration to live mock interviews.
            </p>
          </div>

          <div className="text-xs font-medium text-[#70685E] bg-[#F8F6F0] px-3 py-1.5 rounded-lg border border-[#E5E0D5] self-start sm:self-center">
            Progression: <strong className="text-[#1A365D]">{stats?.completed_milestones || 0}</strong> of 14 Completed
          </div>
        </div>

        {/* Milestone List */}
        <div className="space-y-4">
          {milestones?.map((milestone, idx) => {
            const isCompleted = milestone.status === 'completed';
            const isInProgress = milestone.status === 'in_progress';
            const isLast = idx === (milestones.length - 1);

            return (
              <div
                key={milestone.id}
                className={`relative rounded-xl border p-4 sm:p-5 transition-all ${
                  isCompleted
                    ? 'bg-[#FFFDF9] border-[#E5E0D5] hover:border-[#1A365D]/30'
                    : isInProgress
                    ? 'bg-[#FAF8F5] border-[#8C6E54]/40 shadow-sm'
                    : 'bg-[#FDFDFD] border-[#EAE6DF] opacity-75'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Column: Sequence Number & Details */}
                  <div className="flex items-start gap-3.5">
                    {/* Visual Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-serif font-bold text-sm shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-[#1A365D] text-white shadow-sm'
                          : isInProgress
                          ? 'bg-[#8C6E54] text-white animate-pulse'
                          : 'bg-[#F2EFE9] border border-[#E5E0D5] text-[#70685E]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>{milestone.sequence}</span>
                      )}
                    </div>

                    {/* Milestone Text Details */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-serif font-bold text-[#1F1B16]">
                          {milestone.title}
                        </h3>
                        {getStatusBadge(milestone.status)}
                        {milestone.completed_at && (
                          <span className="text-[11px] text-[#70685E] font-sans">
                            Recorded: {milestone.completed_at}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-[#3B352E] max-w-2xl leading-relaxed">
                        {milestone.description}
                      </p>

                      {/* Evidence Citations */}
                      {milestone.evidence && milestone.evidence.length > 0 && (
                        <div className="pt-2 space-y-1.5">
                          {milestone.evidence.map((ev, evIdx) => (
                            <div
                              key={evIdx}
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#F2EFE9] border border-[#E5E0D5] text-xs text-[#3B352E] mr-2 mb-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1A365D]" />
                              <span className="font-semibold text-[#1F1B16]">{ev.title}:</span>
                              <span className="text-[#554D43]">{ev.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Direct Navigation CTA */}
                  {milestone.action_route && (
                    <div className="sm:self-center shrink-0">
                      <button
                        onClick={() => navigate(milestone.action_route)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isInProgress
                            ? 'bg-[#8C6E54] hover:bg-[#72573F] text-white shadow-sm'
                            : isCompleted
                            ? 'bg-[#F2EFE9] hover:bg-[#EAE6DF] border border-[#E5E0D5] text-[#3B352E]'
                            : 'bg-[#F8F6F0] hover:bg-[#F2EFE9] border border-[#E5E0D5] text-[#70685E]'
                        }`}
                      >
                        <span>{milestone.action_label || 'Inspect'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Fallback generator for zero-crash offline resiliency
function getFallbackJourney(user) {
  const role = user?.target_role || 'Machine Learning Engineer';
  return {
    user_id: user?.id || 'user-001',
    candidate_name: user?.name || 'Chandolu Praneeth Kumar',
    target_role: role,
    preparation_headline: `Structured preparation path toward ${role}`,
    current_focus: 'Establish baseline ATS analysis and take your first technical mock interview.',
    next_best_action: {
      action_type: 'RESUME_AUDIT',
      priority: 'high',
      title: 'Audit Your Resume with ATS',
      headline: 'Diagnostic resume audit pending',
      action: 'Upload Resume',
      route: '/ats',
      target_role: role,
      primary_skill: 'General Alignment',
      reason: 'Upload your resume to extract matched competencies and calculate your ATS benchmark.',
      source: 'onboarding_baseline',
      estimated_effort: '5 mins'
    },
    readiness: {
      readiness_band: 'building_foundations',
      display_title: 'Building Foundations — Initial Profiles & Diagnostics',
      rationale: 'Candidate account and profile initialized. Target role calibrated.',
      disclaimer: 'Career readiness reflects structured preparation evidence recorded within the platform.',
      dimensions: [
        { dimension_key: 'resume_ats', title: 'Resume & ATS Baseline', status: 'Needs Evidence', summary: 'No ATS audit yet.', evidence_count: 0 },
        { dimension_key: 'technical_depth', title: 'Technical & Domain Depth', status: 'In Progress', summary: 'Target competencies mapped.', evidence_count: 1 },
        { dimension_key: 'coding_practice', title: 'Coding & Problem Solving', status: 'Needs Evidence', summary: 'Skill arena drills pending.', evidence_count: 0 },
        { dimension_key: 'interview_simulation', title: 'Interview Chamber Simulation', status: 'Needs Evidence', summary: 'Simulations pending.', evidence_count: 0 },
        { dimension_key: 'communication_quality', title: 'Communication & Articulation', status: 'Needs Evidence', summary: 'Oral evaluation pending.', evidence_count: 0 }
      ]
    },
    milestones: [
      { id: 'm1', sequence: 1, milestone_type: 'PROFILE', title: 'Candidate Profile Initialized', description: 'Identity registered.', status: 'completed', action_route: '/settings', action_label: 'Edit Profile' },
      { id: 'm2', sequence: 2, milestone_type: 'TARGET_ROLE', title: 'Target Role Selected', description: `Role calibrated to ${role}.`, status: 'completed', action_route: '/settings', action_label: 'Change Role' },
      { id: 'm3', sequence: 3, milestone_type: 'RESUME', title: 'Resume Added', description: 'Upload CV for ATS audit.', status: 'not_started', action_route: '/ats', action_label: 'Upload Resume' },
      { id: 'm4', sequence: 4, milestone_type: 'RESUME_ANALYSIS', title: 'Resume Analyzed', description: 'ATS audit scoring.', status: 'not_started', action_route: '/ats', action_label: 'View ATS' },
      { id: 'm5', sequence: 5, milestone_type: 'SKILL_GAP', title: 'Skill Gaps Identified', description: 'Skill matrix deltas.', status: 'not_started', action_route: '/skill-gap', action_label: 'View Gaps' },
      { id: 'm6', sequence: 6, milestone_type: 'RECOMMENDATION', title: 'Personalized Recommendations Generated', description: 'Autonomous guidance.', status: 'in_progress', action_route: '/dashboard', action_label: 'View Action' },
      { id: 'm7', sequence: 7, milestone_type: 'PRACTICE', title: 'Practice Started', description: 'Daily conceptual drills.', status: 'not_started', action_route: '/daily-challenge', action_label: 'Solve Drill' },
      { id: 'm8', sequence: 8, milestone_type: 'SKILL_IMPROVEMENT', title: 'Skills Improved', description: 'Verified skill evidence.', status: 'not_started', action_route: '/skill-gap', action_label: 'View Evidence' },
      { id: 'm9', sequence: 9, milestone_type: 'CODING', title: 'Coding Practice Completed', description: 'Skill Arena drills.', status: 'not_started', action_route: '/skill-arena', action_label: 'Enter Arena' },
      { id: 'm10', sequence: 10, milestone_type: 'INTERVIEW', title: 'Mock Interviews Completed', description: 'AI Chamber simulation.', status: 'not_started', action_route: '/interview-setup', action_label: 'Start Interview' },
      { id: 'm11', sequence: 11, milestone_type: 'EVALUATION', title: 'Interview Performance Evaluated', description: '4-pillar rubric evaluation.', status: 'not_started', action_route: '/interview-feedback', action_label: 'View Rubric' },
      { id: 'm12', sequence: 12, milestone_type: 'FEEDBACK', title: 'Feedback Received', description: 'Actionable feedback summary.', status: 'not_started', action_route: '/interview-feedback', action_label: 'View Feedback' },
      { id: 'm13', sequence: 13, milestone_type: 'PROGRESS', title: 'Progress Demonstrated', description: 'Streak and XP trajectory.', status: 'not_started', action_route: '/progress', action_label: 'View Velocity' },
      { id: 'm14', sequence: 14, milestone_type: 'READINESS', title: 'Career Readiness Developed', description: 'Synthesis across dimensions.', status: 'in_progress', action_route: '/career-journey', action_label: 'Inspect Readiness' }
    ],
    stats: {
      total_milestones: 14,
      completed_milestones: 2,
      in_progress_milestones: 2,
      not_started_milestones: 10,
      total_interviews: 0,
      average_interview_score: 0.0,
      ats_score: null,
      drills_completed: 0
    }
  };
}
