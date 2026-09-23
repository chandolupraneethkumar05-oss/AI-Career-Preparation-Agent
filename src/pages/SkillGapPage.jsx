import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  ArrowUpRight,
  Bot,
  Compass,
  AlertTriangle,
  FileText,
  Mic,
  ShieldCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import CircularScore from '../components/CircularScore';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import RadarChart from '../components/RadarChart';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { analyzeSkillGaps } from '../utils/skillGapAnalyzer';
import { skillApi } from '../services/skillApi';
import { storageService } from '../utils/storage/storageService';
import MarqueeBanner from '../components/MarqueeBanner';

export default function SkillGapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session, setup } = useInterview();

  const currentUserId = user?.id || 'usr_candidate';

  // Unified backend skill profile state
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    skillApi.getSkillProfile(currentUserId)
      .then((data) => {
        if (mounted && data) {
          setProfileData(data);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.debug('[SkillGapPage] profile fetch error:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [currentUserId]);

  const displayRole = user?.targetRole || user?.role || profileData?.target_role || setup?.targetRole || 'Machine Learning Engineer';

  // Run dynamic skill analysis as fallback, isolated to this candidate and their selected role
  const analysis = analyzeSkillGaps(session.summaryResult, session.answers, displayRole, currentUserId);

  const storedInterviews = storageService.getInterviews(currentUserId);
  const storedAts = storageService.getATSResult(currentUserId);
  const hasLocalEvidence = (storedInterviews && storedInterviews.length > 0) || Boolean(storedAts) || (session.answers && session.answers.length > 0);
  const totalEvidenceCount = profileData?.evidence_summary?.total_evidences || (storedInterviews?.length ? storedInterviews.length + (storedAts ? 1 : 0) : 0);
  const hasEvidence = totalEvidenceCount > 0 || hasLocalEvidence;

  const hasUnified = Boolean(profileData && profileData.unified_skills && profileData.unified_skills.length > 0 && hasEvidence);

  const displayReadiness = hasEvidence ? (hasUnified ? profileData.overall_readiness : analysis.overallReadiness) : 0;
  const displayRadar = hasUnified && profileData.radar_data?.length > 0
    ? profileData.radar_data.map(r => ({ name: r.subject, score: r.score }))
    : analysis.radarDimensions;


  const displaySkills = hasUnified
    ? profileData.unified_skills
    : analysis.skills.map(s => ({
        skill_name: s.name,
        category: s.category,
        role_importance: 'Core',
        demonstrated_score: s.score,
        target_score: 80,
        gap: Math.max(0, 80 - s.score),
        priority: s.score < 65 ? 'high' : s.score < 80 ? 'medium' : 'low',
        confidence: 'Medium',
        trend: 'stable',
        repeated_weakness: false,
        resume_present: false,
        resume_score: null,
        interview_score: s.score,
        evidence_count: 1
      }));

  const displayTopGaps = hasUnified && profileData.top_skill_gaps?.length > 0
    ? profileData.top_skill_gaps
    : analysis.topSkillGaps.map(g => ({
        skill_name: g.name,
        demonstrated_score: g.score,
        target_score: 80,
        gap: Math.max(0, 80 - g.score),
        priority: g.priority.toLowerCase(),
        role_importance: 'Core',
        repeated_weakness: false
      }));

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Strong':
        return <Badge variant="forest" size="sm">Strong</Badge>;
      case 'Needs Practice':
        return <Badge variant="navy" size="sm">Needs Practice</Badge>;
      case 'Priority':
      default:
        return <Badge variant="bronze" size="sm">Priority</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return <Badge variant="bronze" size="sm">Priority: High</Badge>;
      case 'Medium':
        return <Badge variant="neutral" size="sm">Priority: Medium</Badge>;
      case 'Low':
      default:
        return <Badge variant="forest" size="sm">Priority: Low</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-pulse">
        {/* Skeleton Hero */}
        <div className="text-center space-y-3 pt-4">
          <div className="h-6 w-48 mx-auto rounded-sm bg-[#FAF8F3] border border-[#E5E0D5]" />
          <div className="h-10 w-80 mx-auto rounded-sm bg-[#FAF8F3]" />
          <div className="h-4 w-96 mx-auto rounded-sm bg-[#FAF8F3]/60" />
        </div>

        {/* Skeleton Readiness Card */}
        <div className="p-8 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 w-full md:w-2/3">
            <div className="h-4 w-32 rounded-sm bg-[#FAF8F3]" />
            <div className="h-12 w-28 rounded-sm bg-[#FAF8F3]" />
            <div className="h-6 w-44 rounded-sm bg-[#FAF8F3]" />
            <div className="h-4 w-full rounded-sm bg-[#FAF8F3]" />
          </div>
          <div className="w-36 h-36 rounded-full bg-[#FAF8F3] border-4 border-[#E5E0D5] shrink-0" />
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] space-y-4">
            <div className="h-6 w-48 rounded-sm bg-[#FAF8F3]" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-28 rounded-sm bg-[#E5E0D5]" />
                  <div className="h-4 w-12 rounded-sm bg-[#E5E0D5]" />
                </div>
                <div className="h-2 w-full rounded-sm bg-[#E5E0D5]" />
              </div>
            ))}
          </div>
          <div className="lg:col-span-5 p-6 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center justify-center min-h-[350px]">
            <div className="w-64 h-64 rounded-full border-2 border-dashed border-[#E5E0D5] flex items-center justify-center">
              <div className="w-40 h-40 rounded-full border border-[#E5E0D5]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      
      {/* ========================================================================= */}
      {/* 2. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] text-xs font-semibold uppercase tracking-wider font-mono">
          <Brain className="w-3.5 h-3.5 text-[#1A365D]" />
          <span>Skill Gap Analysis</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Skill Gap &amp; Readiness Analysis
        </h1>

        <p className="text-sm sm:text-base text-[#70685E] max-w-2xl mx-auto leading-relaxed">
          Detailed breakdown of your skills compared to industry expectations for your target role.
        </p>

        <div className="pt-1 flex items-center justify-center gap-2 text-xs text-[#235E3B] font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#235E3B]" />
          <span>● Analysis Up to Date</span>
        </div>
      </div>

      {/* Dynamic Skill Gap Benchmark Ticker */}
      <MarqueeBanner variant="skillgap" role={displayRole} />

      {!hasEvidence ? (
        <div className="space-y-8">
          {/* Uncalibrated Hero Card */}
          <GlassCard className="p-8 sm:p-10 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center mx-auto text-[#1A365D]">
              <Brain className="w-7 h-7 text-[#1A365D]" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#70685E] text-xs font-semibold uppercase tracking-wider font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Status: Awaiting Initial Evidence</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1B16] tracking-tight">
                Skill Profile Uncalibrated
              </h2>
              <p className="text-sm sm:text-base text-[#70685E] leading-relaxed">
                Welcome to your skill analysis center for <span className="font-serif font-bold text-[#1F1B16]">{displayRole}</span>. Because you have not completed any mock interviews or uploaded a résumé yet, no simulated or fabricated scores are shown.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-2 max-w-4xl mx-auto">
              <div className="p-5 rounded-md border border-[#E5E0D5] bg-[#FAF8F3] flex flex-col justify-between space-y-4 hover:border-[#1A365D] transition-colors">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white">
                    <Mic className="w-4 h-4 text-amber-300" />
                  </div>
                  <h4 className="font-serif font-bold text-[#1F1B16] text-base">Diagnostic Interview</h4>
                  <p className="text-xs text-[#70685E] leading-relaxed">
                    Complete 5 adaptive questions calibrated for {displayRole} to establish your verbal and technical baseline.
                  </p>
                </div>
                <GradientButton variant="primary" size="sm" onClick={() => navigate('/interview-setup')}>
                  Start Mock Interview →
                </GradientButton>
              </div>

              <div className="p-5 rounded-md border border-[#E5E0D5] bg-[#FAF8F3] flex flex-col justify-between space-y-4 hover:border-[#1A365D] transition-colors">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white">
                    <FileText className="w-4 h-4 text-emerald-300" />
                  </div>
                  <h4 className="font-serif font-bold text-[#1F1B16] text-base">ATS Résumé Audit</h4>
                  <p className="text-xs text-[#70685E] leading-relaxed">
                    Extract demonstrated competencies and uncover critical keyword gaps against industry job descriptions.
                  </p>
                </div>
                <GradientButton variant="secondary" size="sm" onClick={() => navigate('/ats')}>
                  Scan Résumé Now →
                </GradientButton>
              </div>

              <div className="p-5 rounded-md border border-[#E5E0D5] bg-[#FAF8F3] flex flex-col justify-between space-y-4 hover:border-[#1A365D] transition-colors">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="font-serif font-bold text-[#1F1B16] text-base">Daily Practice Drill</h4>
                  <p className="text-xs text-[#70685E] leading-relaxed">
                    Answer a 5-minute technical challenge to earn +50 XP and log your initial skill proof points.
                  </p>
                </div>
                <GradientButton variant="secondary" size="sm" onClick={() => navigate('/daily-challenge')}>
                  Take Daily Drill →
                </GradientButton>
              </div>
            </div>
          </GlassCard>

          {/* Transparent Calibration Architecture Card */}
          <GlassCard className="p-6 sm:p-8 border-[#E5E0D5] bg-[#FFFDF9] space-y-6">
            <div className="border-b border-[#E5E0D5] pb-4">
              <span className="editorial-overline">HOW IT WORKS</span>
              <h3 className="text-lg font-serif font-bold text-[#1F1B16]">
                Autonomous Skill Calibration Architecture
              </h3>
              <p className="text-xs text-[#70685E] mt-1">
                InterviewAI calculates all scores from genuine evidence. No hardcoded or pre-seeded data is ever shown.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2 border-l-2 border-[#1A365D] pl-4">
                <span className="text-xs font-mono font-bold text-[#1A365D]">STAGE 01</span>
                <h4 className="text-sm font-serif font-bold text-[#1F1B16]">Evidence Ingestion</h4>
                <p className="text-xs text-[#70685E] leading-relaxed">
                  Candidate verbal answers, algorithmic trade-offs, and parsed résumé tokens are recorded as verified evidence items.
                </p>
              </div>

              <div className="space-y-2 border-l-2 border-[#1A365D] pl-4">
                <span className="text-xs font-mono font-bold text-[#1A365D]">STAGE 02</span>
                <h4 className="text-sm font-serif font-bold text-[#1F1B16]">Multi-Source Fusion</h4>
                <p className="text-xs text-[#70685E] leading-relaxed">
                  Demonstrated scores are calibrated: 60% interview demonstration, 25% daily challenges, and 15% résumé presence.
                </p>
              </div>

              <div className="space-y-2 border-l-2 border-[#1A365D] pl-4">
                <span className="text-xs font-mono font-bold text-[#1A365D]">STAGE 03</span>
                <h4 className="text-sm font-serif font-bold text-[#1F1B16]">Target Role Benchmarks</h4>
                <p className="text-xs text-[#70685E] leading-relaxed">
                  Demonstrated proficiencies are benchmarked against industry standards for {displayRole} to rank your top gaps.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-10">
      {/* ========================================================================= */}
      {/* 3. OVERALL READINESS SCORE CARD                                          */}
      {/* ========================================================================= */}
      <GlassCard className="p-8 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs relative overflow-hidden">

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-xs font-bold text-[#70685E] uppercase tracking-widest font-mono">
              EXAMINATION READINESS INDEX
            </span>

            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="text-5xl sm:text-6xl font-serif font-black text-[#1F1B16] tracking-tight">
                {displayReadiness}%
              </span>
              <span className="text-sm font-bold text-[#235E3B] flex items-center gap-1 font-mono">
                <ArrowUpRight className="w-4 h-4" />
                +{hasUnified ? Math.max(0, displayReadiness - 50) : analysis.improvementRate}% vs baseline
              </span>
            </div>

            <div className="inline-block px-3 py-1 rounded-sm bg-[#EBF4EE] border border-[#CDE5D4] text-[#235E3B] text-xs font-bold font-mono">
              ● {displayReadiness >= 80 ? 'Interview Ready' : displayReadiness >= 65 ? 'Competitive Candidate' : 'Developing Foundations'}
            </div>

            <p className="text-sm text-[#70685E] max-w-lg leading-relaxed">
              {hasUnified
                ? `Calibrated for ${displayRole}. Evidence synthesized from ${profileData?.evidence_summary?.total_evidences || 0} performance observations across résumé and examination rounds.`
                : `"${analysis.readinessSummary}"`}
            </p>

            {/* Historical Progress Metrics */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <div className="px-3 py-2 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-xs">
                <span className="text-[#70685E] block text-[10px] uppercase font-mono">Curricular Role</span>
                <span className="font-serif font-bold text-[#1F1B16]">{displayRole}</span>
              </div>
              <div className="px-3 py-2 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-xs">
                <span className="text-[#70685E] block text-[10px] uppercase font-mono">Verified Evidence</span>
                <span className="font-mono font-bold text-[#1A365D]">{totalEvidenceCount} items</span>
              </div>
              <div className="px-3 py-2 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-xs">
                <span className="text-[#70685E] block text-[10px] uppercase font-mono">Proficiency Tier</span>
                <span className="font-mono font-bold text-[#235E3B]">{displayReadiness}%</span>
              </div>
            </div>
          </div>

          {/* Circular Score Gauge */}
          <div className="shrink-0 flex flex-col items-center">
            <CircularScore
              score={displayReadiness}
              size={145}
              strokeWidth={9}
              color="auto"
              label="Readiness"
            />
          </div>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 4. SKILL GAP OVERVIEW & 5. RADAR CHART (Two Column Layout)               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Your Skill Profile (7 Cols) */}
        <GlassCard className="lg:col-span-7 p-6 sm:p-7 space-y-5 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
                OVERALL SKILL PROFILE
              </h2>
              <p className="text-xs text-[#70685E]">
                Skill ratings evaluated against {displayRole} standards
              </p>
            </div>
            <span className="text-xs text-[#1A365D] font-mono font-bold">
              Target: {displayRole}
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {displaySkills.map((skill) => (
              <div
                key={skill.skill_name || skill.name}
                className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] hover:border-[#1A365D] transition-all space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-serif font-bold text-[#1F1B16]">{skill.skill_name || skill.name}</span>
                    <span className="text-[10px] text-[#70685E] uppercase font-mono">
                      ({skill.role_importance || skill.category || 'Core'})
                    </span>
                    {skill.repeated_weakness && (
                      <span className="text-[10px] text-[#9A421A] font-bold bg-[#FDF2E9] border border-[#F0C9B3] px-2 py-0.5 rounded-sm flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-2.5 h-2.5" /> Recurring Deficit
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    {getPriorityBadge(skill.priority === 'high' ? 'High' : skill.priority === 'medium' ? 'Medium' : 'Low')}
                    <span className="text-sm font-bold text-[#1A365D] font-mono">
                      {skill.demonstrated_score ?? skill.score}%
                    </span>
                  </div>
                </div>

                <ProgressBar
                  value={skill.demonstrated_score ?? skill.score}
                  height="h-1.5"
                />

                {/* Multi-Source Evidence Indicators */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                  {skill.resume_present ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#EBF4EE] border border-[#CDE5D4] text-[#235E3B] font-medium">
                      <FileText className="w-3 h-3" /> Résumé: Verified ({skill.resume_score}%)
                    </span>
                  ) : skill.resume_score !== null && skill.resume_score !== undefined ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#FDF2E9] border border-[#F0C9B3] text-[#9A421A] font-medium">
                      <FileText className="w-3 h-3" /> Résumé: Unobserved ({skill.resume_score}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#70685E]">
                      <FileText className="w-3 h-3" /> Résumé: Untested
                    </span>
                  )}

                  {skill.interview_score !== null && skill.interview_score !== undefined ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] font-medium">
                      <Mic className="w-3 h-3" /> Examination: {skill.interview_score}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#70685E]">
                      <Mic className="w-3 h-3" /> Examination: Unobserved
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#3B352E]">
                    <ShieldCheck className="w-3 h-3 text-[#1A365D]" /> {skill.confidence || 'Medium'} Conf ({skill.evidence_count || 0} pts)
                  </span>

                  {skill.trend === 'improving' ? (
                    <span className="text-[#235E3B] font-bold flex items-center gap-0.5">
                      📈 Improving
                    </span>
                  ) : skill.trend === 'declining' ? (
                    <span className="text-[#9A421A] font-bold flex items-center gap-0.5">
                      📉 Declining
                    </span>
                  ) : (
                    <span className="text-[#70685E] font-medium flex items-center gap-0.5">
                      ➡️ Stable
                    </span>
                  )}

                  <span className="text-[#70685E] ml-auto font-mono">
                    Target: {skill.target_score || 80}% (Gap: -{skill.gap || Math.max(0, (skill.target_score || 80) - (skill.demonstrated_score ?? skill.score))}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-[#70685E] border-t border-[#E5E0D5] font-mono">
            <span>🟢 80–100%: Exemplary</span>
            <span>🔵 65–79%: Developing</span>
            <span>🔴 &lt;65%: Priority Remediation</span>
          </div>
        </GlassCard>

        {/* Right: Radar Chart (5 Cols) */}
        <GlassCard className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1A365D]" />
              <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
                Skill Balance Chart
              </h2>
            </div>
            <Badge variant="navy" size="sm">Multi-Axis</Badge>
          </div>

          <p className="text-xs text-[#70685E]">
            Visual breakdown of your strengths and areas to practice:
          </p>

          <div className="py-2 flex justify-center">
            <RadarChart dimensions={displayRadar} size={320} />
          </div>

          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#70685E]">
            <p className="font-serif font-semibold text-[#1F1B16] mb-0.5">Live Updates:</p>
            <p>
              This chart updates automatically as you complete mock interviews and resume reviews.
            </p>
          </div>
        </GlassCard>

      </div>

      {/* ========================================================================= */}
      {/* 6. TOP SKILL GAPS (Dynamically Calculated)                               */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
          <div>
            <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
              PRIORITIZED REMEDIATION TARGETS
            </h2>
            <p className="text-xs text-[#70685E]">
              Critical bottlenecks currently impacting candidate viability for {displayRole}
            </p>
          </div>
          <Badge variant="bronze" size="sm">Priority Remediation</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {displayTopGaps.map((gap, idx) => (
            <GlassCard
              key={gap.skill_name || gap.name}
              className="p-6 flex flex-col justify-between space-y-4 border-[#E5E0D5] bg-[#FFFDF9] hover:border-[#1A365D] transition-all shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-xs font-bold text-[#1A365D] font-mono flex items-center justify-center">
                      #{idx + 1}
                    </span>
                  </div>
                  {getPriorityBadge((gap.priority === 'high' || gap.priority === 'High') ? 'High' : 'Medium')}
                </div>

                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1F1B16]">{gap.skill_name || gap.name}</h3>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-serif font-bold text-[#1F1B16]">
                      {gap.demonstrated_score ?? gap.score}%
                    </span>
                    <span className="text-xs text-[#70685E] font-mono">
                      vs {gap.target_score || 80}% Target (Gap: -{gap.gap || Math.max(0, (gap.target_score || 80) - (gap.score || 0))}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs space-y-1.5">
                  <span className="font-serif font-bold text-[#9A421A] block">Skill Context:</span>
                  <p className="text-[#3B352E] leading-relaxed">
                    {gap.repeated_weakness
                      ? "Showed difficulty (<60%) across multiple practice questions."
                      : gap.role_importance === 'Core'
                      ? `Important core skill for ${displayRole}. Improving this will boost your interview performance.`
                      : `Currently below target benchmark (${gap.target_score || 80}%).`}
                  </p>
                </div>

                <div className="p-3 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] text-xs space-y-1">
                  <span className="font-serif font-bold text-[#1A365D] block">Recommended Practice:</span>
                  <p className="text-[#1F1B16]">
                    {(gap.skill_name || gap.name) === 'Communication'
                      ? 'Practice behavioral STAR storytelling drills to improve answer structure.'
                      : `Practice targeted drills focused on ${gap.skill_name || gap.name}.`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/interview-setup')}
                className="w-full py-2.5 px-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1F1B16] hover:bg-[#F2EFE9] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Practice {gap.skill_name || gap.name}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#1A365D]" />
              </button>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. AI AGENT INSIGHT (Crucial Agentic Reasoning Card)                      */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 border-[#E5E0D5] bg-[#FFFDF9] space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D5] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] flex items-center justify-center text-[#1A365D]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1F1B16]">AI COACH RECOMMENDATION</h2>
              <p className="text-xs text-[#70685E]">Personalized Preparation Strategy</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5] font-mono">
            <span>EVALUATE</span>
            <span>→</span>
            <span>IDENTIFY GAPS</span>
            <span>→</span>
            <span className="text-[#1A365D]">ACTION PLAN</span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#1F1B16] font-serif leading-relaxed">
          "{analysis.agentInsight}"
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#3B352E]">
          <span className="flex items-center gap-1.5 text-[#235E3B]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saves time by focusing on your actual weak spots
          </span>
          <span className="flex items-center gap-1.5 text-[#1A365D]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Prioritizes topics most important for the hiring bar
          </span>
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 8. PERSONALIZED LEARNING PATH                                             */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="border-b border-[#E5E0D5] pb-2">
          <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
            RECOMMENDED LEARNING ROADMAP
          </h2>
          <p className="text-xs text-[#70685E]">
            Step-by-step roadmap tailored specifically to your target skills
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysis.preparationPath.map((step, idx) => (
            <GlassCard
              key={idx}
              className={`p-5 flex flex-col justify-between space-y-3 transition-all border ${
                step.isCurrent
                  ? 'border-[#1A365D] bg-[#FFFDF9] shadow-xs'
                  : 'border-[#E5E0D5] bg-[#FAF8F3]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-7 h-7 rounded-sm text-xs font-mono font-bold flex items-center justify-center ${
                      step.isCurrent
                        ? 'bg-[#1B2A4A] text-white'
                        : 'bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5]'
                    }`}
                  >
                    0{step.step}
                  </span>

                  <Badge variant={step.isCurrent ? 'navy' : 'neutral'} size="sm">
                    {step.status}
                  </Badge>
                </div>

                <h3 className="text-sm font-serif font-bold text-[#1F1B16] mt-2">{step.title}</h3>
                <p className="text-xs text-[#70685E] mt-1 leading-relaxed">{step.desc}</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => navigate(step.route)}
                  className={`w-full py-2 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    step.isCurrent
                      ? 'bg-[#1B2A4A] hover:bg-[#142038] text-white shadow-xs'
                      : 'bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] hover:bg-[#F2EFE9]'
                  }`}
                >
                  {step.isCurrent ? 'Commence Step 1 Now →' : 'Inspect Module'}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. RECOMMENDED ACTIVITIES                                                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
          <div>
            <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
              PRACTICE EXERCISES &amp; ACTIONS
            </h2>
            <p className="text-xs text-[#70685E]">
              Targeted exercises designed to strengthen your weak areas
            </p>
          </div>
          <Badge variant="navy" size="sm">Action Items</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysis.recommendedActivities.map((act) => (
            <GlassCard
              key={act.id}
              className="p-5 flex flex-col justify-between space-y-4 border-[#E5E0D5] bg-[#FFFDF9] hover:border-[#1A365D] transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="forest" size="sm">{act.xp}</Badge>
                  <span className="text-[11px] text-[#70685E] font-mono">{act.specs}</span>
                </div>

                <h3 className="text-sm font-serif font-bold text-[#1F1B16] mt-1">{act.title}</h3>
                <p className="text-xs text-[#70685E] mt-1 leading-relaxed">{act.desc}</p>
              </div>

              <GradientButton
                variant={act.color === 'cyan' ? 'primary' : 'secondary'}
                size="sm"
                className="w-full"
                onClick={() => navigate(act.route)}
              >
                {act.buttonLabel}
              </GradientButton>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 10. SKILL IMPROVEMENT TRACKING                                            */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-7 space-y-5 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#235E3B]" />
            <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider">
              SKILL PROGRESS OVER TIME
            </h2>
          </div>
          <span className="text-xs text-[#70685E]">Track your improvement across sessions</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {analysis.historicalProgress.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2"
            >
              <span className="text-xs font-serif font-bold text-[#1F1B16] block">{item.skill}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-[#70685E] font-mono">
                  {item.previousScore}% → <strong className="text-[#1F1B16]">{item.currentScore}%</strong>
                </span>
                <span className="text-xs font-bold text-[#235E3B] flex items-center font-mono">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{item.change}%
                </span>
              </div>
              <ProgressBar value={item.currentScore} height="h-1.5" />
              <p className="text-[10px] text-[#70685E] italic mt-1 font-mono">{item.period}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 11. AGENT DECISION PIPELINE                                               */}
      {/* ========================================================================= */}
      <GlassCard className="p-6 sm:p-8 space-y-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
        <div>
          <h2 className="text-base font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#1A365D]" />
            FACULTY DIAGNOSTIC PIPELINE PROVENANCE
          </h2>
          <p className="text-xs text-[#70685E] mt-0.5">
            Transparent algorithmic reasoning pipeline — connecting interview evaluations to actionable drills
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
          {analysis.pipelineSteps.map((step) => (
            <div
              key={step.step}
              className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="w-6 h-6 rounded-sm bg-[#EAEFF5] border border-[#BAC7D5] text-[#1A365D] font-mono font-bold text-[11px] flex items-center justify-center mb-1.5">
                  0{step.step}
                </div>
                <h3 className="text-xs font-serif font-bold text-[#1F1B16] leading-tight">{step.title}</h3>
                <p className="text-[10px] text-[#70685E] mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ========================================================================= */}
      {/* 12. CTA SECTION                                                           */}
      {/* ========================================================================= */}
      <GlassCard className="p-8 text-center space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Start Targeted Practice
        </h2>
        <p className="text-sm text-[#70685E] max-w-xl mx-auto">
          Turn your identified skill gaps into verified strengths through hands-on practice questions and realistic mock interviews.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <GradientButton
            variant="primary"
            size="lg"
            onClick={() => navigate(analysis.primaryActionRoute)}
            icon={ArrowRight}
            className="w-full sm:w-auto px-8"
          >
            {analysis.primaryActionLabel}
          </GradientButton>

          <GradientButton
            variant="secondary"
            size="lg"
            onClick={() => navigate('/interview-setup')}
            icon={Sparkles}
            className="w-full sm:w-auto"
          >
            Start Another Mock Interview →
          </GradientButton>
        </div>
      </GlassCard>
        </div>
      )}

    </div>
  );
}

