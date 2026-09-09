import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Zap,
  Target,
  FileText,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Bot,
  HelpCircle,
  X,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Mic,
  Brain,
  MessageSquare,
  Compass,
  Check,
  Play
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import CircularScore from '../components/CircularScore';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import PerformanceChart from '../components/PerformanceChart';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { DEFAULT_DASHBOARD_DATA } from '../data/mockData';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, addXP } = useAuth();
  const { session, history } = useInterview();

  // Dialog state for "Why this recommendation?"
  const [showRationale, setShowRationale] = useState(false);

  // Read ATS data from localStorage if available
  const atsData = (() => {
    try {
      const saved = localStorage.getItem('interview_ai_ats_result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const atsScore = atsData?.overallScore || DEFAULT_DASHBOARD_DATA.atsScore;
  const atsKeywordMatch = atsData?.breakdown?.find((b) => b.label === 'Keyword Match')?.score || DEFAULT_DASHBOARD_DATA.atsKeywordMatch;
  const atsSkillsMatch = atsData?.breakdown?.find((b) => b.label === 'Skills Alignment')?.score || DEFAULT_DASHBOARD_DATA.atsSkillsMatch;
  const atsFormatting = atsData?.breakdown?.find((b) => b.label.includes('Formatting'))?.score || DEFAULT_DASHBOARD_DATA.atsFormatting;

  // Interactive Today's Practice Plan state for demo interactivity
  const isDailyDone = (() => {
    try {
      return localStorage.getItem('interview_ai_daily_challenge_completed') === 'true';
    } catch {
      return false;
    }
  })();

  const [practicePlan, setPracticePlan] = useState(() => {
    return DEFAULT_DASHBOARD_DATA.todayPracticePlan.map((t) => {
      if (t.id === 'tp-3' && isDailyDone) {
        return { ...t, completed: true };
      }
      return t;
    });
  });

  const toggleTask = (taskId, xpReward) => {
    setPracticePlan((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextState = !t.completed;
          if (nextState) {
            addXP(xpReward);
          }
          return { ...t, completed: nextState };
        }
        return t;
      })
    );
  };

  const completedCount = practicePlan.filter((t) => t.completed).length;
  const practicePercent = Math.round((completedCount / practicePlan.length) * 100);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = (user?.name || DEFAULT_DASHBOARD_DATA.userName).split(' ')[0];
  const userRole = user?.role || DEFAULT_DASHBOARD_DATA.targetRole;
  const userStreak = user?.streak ?? DEFAULT_DASHBOARD_DATA.streak;
  const userXP = user?.xp ?? DEFAULT_DASHBOARD_DATA.xp;
  const userLevel = user?.level ?? DEFAULT_DASHBOARD_DATA.level;

  // Derive dynamic readiness and recent interviews if live session was just evaluated
  const currentReadiness = session.summaryResult?.scores?.overall
    ? Math.round((DEFAULT_DASHBOARD_DATA.readiness + session.summaryResult.scores.overall) / 2)
    : DEFAULT_DASHBOARD_DATA.readiness;

  // Merge context history if present, fallback to default mock interviews
  const recentInterviews = history && history.length > 0
    ? history.slice(0, 3)
    : DEFAULT_DASHBOARD_DATA.recentInterviews;

  return (
    <div className="space-y-8 pb-16">
      
      {/* ========================================================================= */}
      {/* 2. WELCOME SECTION                                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Autonomous AI Career Preparation Agent
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-base font-semibold text-white/90 mt-1">
            Ready to improve your interview performance?
          </p>
          <p className="text-xs sm:text-sm text-[#A5B4FC] mt-0.5">
            Your AI career coach has analyzed your recent activity and identified targeted focus areas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <GradientButton
            variant="primary"
            size="md"
            onClick={() => navigate('/interview-setup')}
            icon={ArrowRight}
            className="shadow-xl shadow-purple-900/40"
          >
            Start Mock Interview →
          </GradientButton>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KEY METRICS (4 Metric Cards)                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Current Streak */}
        <GlassCard hoverEffect glow="amber" className="p-5 flex items-center justify-between border-orange-500/30">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#A5B4FC] uppercase tracking-wider">
              Current Streak
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tight">{userStreak}</span>
              <span className="text-sm font-bold text-orange-400">Days</span>
            </div>
            <p className="text-[11px] text-orange-300/90 font-medium flex items-center gap-1">
              <span>🔥 1 day to reach next milestone!</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-orange-950/40">
            <Flame className="w-6 h-6 text-orange-400 fill-orange-400 animate-pulse" />
          </div>
        </GlassCard>

        {/* Metric 2: Total XP */}
        <GlassCard hoverEffect glow="purple" className="p-5 flex items-center justify-between border-purple-500/30">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#A5B4FC] uppercase tracking-wider">
              Total XP
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tight">
                {userXP.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-purple-400">XP</span>
            </div>
            <p className="text-[11px] text-purple-300/90 font-medium">
              Level {userLevel} • {DEFAULT_DASHBOARD_DATA.xpMax - userXP} XP to Level {userLevel + 1}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-purple-950/40">
            <Zap className="w-6 h-6 text-purple-400 fill-purple-400" />
          </div>
        </GlassCard>

        {/* Metric 3: Interview Readiness */}
        <GlassCard hoverEffect glow="cyan" className="p-5 flex items-center justify-between border-cyan-500/30">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#A5B4FC] uppercase tracking-wider">
              Interview Readiness
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white tracking-tight">
                {currentReadiness}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>↑ {DEFAULT_DASHBOARD_DATA.readinessDelta}% from previous interview</span>
            </p>
          </div>
          <div className="shrink-0">
            <CircularScore
              score={currentReadiness}
              size={64}
              strokeWidth={6}
              color="#06B6D4"
              showPercentage={false}
            />
          </div>
        </GlassCard>

        {/* Metric 4: ATS Resume Score */}
        <GlassCard
          hoverEffect
          glow="purple"
          className="p-5 flex items-center justify-between border-pink-500/30 cursor-pointer group"
          onClick={() => navigate('/ats')}
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#A5B4FC] uppercase tracking-wider">
              ATS Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white tracking-tight">
                {atsScore}
              </span>
              <span className="text-xs text-[#A5B4FC]">/100</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>↑ {DEFAULT_DASHBOARD_DATA.atsDelta}% vs initial upload</span>
            </p>
          </div>
          <div className="shrink-0">
            <CircularScore
              score={atsScore}
              size={64}
              strokeWidth={6}
              color="#EC4899"
              showPercentage={false}
            />
          </div>
        </GlassCard>

      </div>

      {/* ========================================================================= */}
      {/* TWO COLUMN GRID: MAIN CONTENT (8 Cols) vs SIDE PANEL (4 Cols)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

        {/* ======================================================================= */}
        {/* LEFT COLUMN (8 Cols)                                                    */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-7">

          {/* --------------------------------------------------------------------- */}
          {/* 4. AI AGENT RECOMMENDATION (Most Important Card on the Dashboard)     */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-6 sm:p-7 border-purple-500/40 relative overflow-hidden bg-gradient-to-r from-[#191A3A] via-[#1D1845] to-[#14233F] shadow-2xl space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
                  <Bot className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-cyan-400">
                    🤖 YOUR AI COACH RECOMMENDS
                  </h2>
                  <p className="text-xs text-[#A5B4FC]">
                    Autonomous evaluation synthesized across recent mock rounds
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>Next Best Action</span>
              </div>
            </div>

            <div className="space-y-2 relative">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {DEFAULT_DASHBOARD_DATA.agentRecommendation.title}
              </h3>
              <p className="text-sm sm:text-base text-[#F8FAFC]/90 leading-relaxed">
                "{DEFAULT_DASHBOARD_DATA.agentRecommendation.description}"
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-purple-500/20 relative">
              <div className="flex items-center gap-3">
                <GradientButton
                  variant="primary"
                  size="md"
                  onClick={() => navigate(DEFAULT_DASHBOARD_DATA.agentRecommendation.primaryActionRoute)}
                  icon={ArrowRight}
                  className="shadow-lg shadow-purple-900/50"
                >
                  Practice Now →
                </GradientButton>

                <button
                  onClick={() => setShowRationale(!showRationale)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/30 text-xs font-bold text-[#A5B4FC] hover:text-white hover:border-cyan-400/50 transition-all flex items-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Why this recommendation?</span>
                </button>
              </div>

              <span className="text-xs text-[#A5B4FC]/80 italic">
                Target: {userRole}
              </span>
            </div>

            {/* Collapsible / Expandable Agent Rationale */}
            {showRationale && (
              <div className="p-4 rounded-xl bg-[#0F1026]/90 border border-cyan-500/40 text-xs space-y-2 animate-fadeIn transition-all">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Agent Decision Rationale:
                  </span>
                  <button
                    onClick={() => setShowRationale(false)}
                    className="text-[#A5B4FC] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[#A5B4FC] whitespace-pre-line leading-relaxed font-sans">
                  {DEFAULT_DASHBOARD_DATA.agentRecommendation.rationale}
                </p>
                <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Calculated via continuous feedback loop (Evaluator → Gap Analyzer → Coach)</span>
                </div>
              </div>
            )}
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 6. PERFORMANCE CHART (SVG Line Chart)                                 */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-6 sm:p-7 border-purple-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  YOUR PERFORMANCE
                </h2>
                <p className="text-xs text-[#A5B4FC]">
                  Longitudinal trajectory across completed mock interview evaluations
                </p>
              </div>

              <Badge variant="cyan" size="sm">5 Sessions Scored</Badge>
            </div>

            {/* Zero-Dependency SVG Performance Chart */}
            <div className="pt-2">
              <PerformanceChart
                data={DEFAULT_DASHBOARD_DATA.performanceHistory}
                height={200}
              />
            </div>

            {/* Performance Summary Banner */}
            <div className="p-3.5 rounded-xl bg-[#0F1026]/70 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-white font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Score Trajectory:</span>
                <span className="text-emerald-400 font-bold">
                  +14 points since your first interview
                </span>
              </div>
              <span className="text-[11px] text-[#A5B4FC] font-mono">
                68 → 82/100
              </span>
            </div>
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 7. TODAY'S PRACTICE PLAN (3 Interactive Action Cards)                 */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-6 sm:p-7 border-purple-500/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  TODAY'S PRACTICE PLAN
                </h2>
                <p className="text-xs text-[#A5B4FC]">
                  Curated daily drills targeted at closing your identified gaps
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-cyan-300 font-mono">
                  {completedCount} / {practicePlan.length} completed
                </span>
                <Badge variant={completedCount === practicePlan.length ? 'green' : 'purple'} size="sm">
                  {practicePercent}% Done
                </Badge>
              </div>
            </div>

            {/* Completion Progress Bar */}
            <ProgressBar
              value={practicePercent}
              gradient="purple-cyan"
              height="h-2.5"
            />

            {/* Practice Items List */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {practicePlan.map((task) => (
                <div
                  key={task.id}
                  className={`
                    p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative
                    ${task.completed
                      ? 'bg-[#0F1026]/70 border-emerald-500/30 opacity-80'
                      : 'bg-[#191A3A] border-purple-500/40 shadow-lg hover:border-cyan-400/50'
                    }
                  `}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-900/40 text-[#A5B4FC] border border-purple-500/25">
                        {task.category}
                      </span>
                      <Badge variant="green" size="sm">+{task.xpReward} XP</Badge>
                    </div>

                    <h3 className={`text-sm font-bold leading-snug ${task.completed ? 'text-emerald-300 line-through' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-[#A5B4FC] font-mono">{task.specs}</p>
                  </div>

                  <div className="pt-2">
                    {task.completed ? (
                      <button
                        onClick={() => toggleTask(task.id, task.xpReward)}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 hover:bg-emerald-950/60 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(task.route)}
                        className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Start Drill</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 8. RECENT INTERVIEWS (Clickable to /interview-feedback)               */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-6 sm:p-7 border-purple-500/30 space-y-5">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-5 h-5 text-cyan-400" />
                  RECENT INTERVIEWS
                </h2>
                <p className="text-xs text-[#A5B4FC]">
                  Click any session to inspect detailed evaluation and rubrics
                </p>
              </div>

              <GradientButton
                variant="secondary"
                size="sm"
                onClick={() => navigate('/interview-setup')}
                icon={Sparkles}
              >
                New Mock
              </GradientButton>
            </div>

            <div className="space-y-3">
              {recentInterviews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/interview-feedback')}
                  className="p-4 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 hover:border-cyan-400/50 hover:bg-[#1D1E45] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.role}
                      </span>
                      <Badge variant="purple" size="sm">{item.type}</Badge>
                      <span className="text-[11px] text-[#A5B4FC]/70 font-mono">• {item.date}</span>
                    </div>
                    <p className="text-xs text-[#A5B4FC] line-clamp-1">
                      {item.feedbackSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-[#A5B4FC] block">Score</span>
                      <span className="text-lg font-black text-cyan-300 font-mono">
                        {item.score}<span className="text-xs text-[#A5B4FC]">/100</span>
                      </span>
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-[#191A3A] border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:text-white group-hover:border-cyan-400 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN (4 Cols)                                                   */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-7">

          {/* --------------------------------------------------------------------- */}
          {/* 5. SKILL PROFILE OVERVIEW                                             */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-6 border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  YOUR SKILL PROFILE
                </h2>
                <p className="text-xs text-[#A5B4FC]">Core technical competencies</p>
              </div>
              <Badge variant="cyan" size="sm">6 Evaluated</Badge>
            </div>

            <div className="space-y-3 pt-1">
              {DEFAULT_DASHBOARD_DATA.skills.map((skill) => (
                <div key={skill.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{skill.name}</span>
                    <span className="font-mono font-bold text-cyan-300">{skill.score}%</span>
                  </div>
                  <ProgressBar
                    value={skill.score}
                    gradient={skill.score >= 80 ? 'green' : skill.score >= 70 ? 'cyan' : 'purple-pink'}
                    height="h-1.5"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-purple-500/20">
              <Link
                to="/skill-gap"
                className="w-full py-2.5 px-3 rounded-xl bg-[#0F1026] border border-cyan-500/40 text-xs font-bold text-cyan-300 hover:bg-cyan-500/10 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Full Skill Analysis →</span>
              </Link>
            </div>
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 9. ATS RESUME SUMMARY                                                 */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-6 border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pink-400" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  RESUME / ATS
                </h2>
              </div>
              <Badge variant="pink" size="sm">Indexed</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F1026]/70 border border-purple-500/20">
              <div>
                <span className="text-xs text-[#A5B4FC] block uppercase tracking-wider">ATS Score</span>
                <span className="text-2xl font-black text-white font-mono">
                  {atsScore}<span className="text-xs text-[#A5B4FC]"> / 100</span>
                </span>
                <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                  High keyword optimization
                </p>
              </div>
              <CircularScore
                score={atsScore}
                size={58}
                strokeWidth={5}
                color="#EC4899"
                showPercentage={false}
              />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A5B4FC]">Keyword Match</span>
                <span className="font-bold text-white font-mono">{atsKeywordMatch}%</span>
              </div>
              <ProgressBar value={atsKeywordMatch} gradient="purple-cyan" height="h-1.5" />

              <div className="flex items-center justify-between">
                <span className="text-[#A5B4FC]">Skills Match</span>
                <span className="font-bold text-white font-mono">{atsSkillsMatch}%</span>
              </div>
              <ProgressBar value={atsSkillsMatch} gradient="cyan" height="h-1.5" />

              <div className="flex items-center justify-between">
                <span className="text-[#A5B4FC]">Formatting</span>
                <span className="font-bold text-white font-mono">{atsFormatting}%</span>
              </div>
              <ProgressBar value={atsFormatting} gradient="green" height="h-1.5" />
            </div>

            <div className="pt-1">
              <button
                onClick={() => navigate('/ats')}
                className="w-full py-2 px-3 rounded-xl bg-[#191A3A] border border-pink-500/30 text-xs font-bold text-pink-300 hover:bg-pink-500/20 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Resume Analysis →</span>
              </button>
            </div>
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 10. STREAK / GAMIFICATION CARD                                        */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-6 border-orange-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  YOUR STREAK
                </h2>
              </div>
              <Badge variant="amber" size="sm">{userStreak} Days</Badge>
            </div>

            {/* 7 Small Day Indicators: M T W T F S S */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {DEFAULT_DASHBOARD_DATA.weeklyStreak.map((item, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl bg-[#0F1026] border border-orange-500/40 text-xs font-bold shadow-sm"
                >
                  <span className="text-[10px] text-[#A5B4FC]/70">{item.day}</span>
                  <span className="text-orange-400 mt-0.5">✓</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-orange-300/90 font-medium text-center">
              1 more day to reach a new streak milestone!
            </p>

            {/* Level & XP Tracker */}
            <div className="pt-2 border-t border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Level {userLevel}</span>
                <span className="font-mono text-[#A5B4FC]">{userXP} / {DEFAULT_DASHBOARD_DATA.xpMax} XP</span>
              </div>
              <ProgressBar
                value={userXP}
                max={DEFAULT_DASHBOARD_DATA.xpMax}
                gradient="purple-cyan"
                height="h-2"
              />
            </div>
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 13. AI AGENT STATUS (Autonomous Coach Presence)                       */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-5 border-cyan-500/30 bg-gradient-to-b from-[#191A3A] to-[#121E36] space-y-3">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI AGENT STATUS
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Agent Active</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#A5B4FC]">Last analysis:</span>
                <span className="font-bold text-white">{DEFAULT_DASHBOARD_DATA.agentStatus.lastAnalysis}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A5B4FC]">Profile:</span>
                <span className="font-bold text-white">{userRole}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A5B4FC]">Current focus:</span>
                <span className="font-bold text-cyan-300">{DEFAULT_DASHBOARD_DATA.agentStatus.currentFocus}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#A5B4FC]">Next recommendation:</span>
                <span className="font-bold text-purple-300">{DEFAULT_DASHBOARD_DATA.agentStatus.nextRecommendation}</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#0F1026]/70 border border-purple-500/20 text-[10px] text-[#A5B4FC] italic">
              Continuously optimizing candidate readiness beyond standard chatbots.
            </div>
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 11. RECENT ACHIEVEMENTS                                               */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-5 border-purple-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  RECENT ACHIEVEMENTS
                </h2>
              </div>
              <Link
                to="/achievements"
                className="text-[11px] text-cyan-400 hover:underline flex items-center font-bold"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-2.5">
              {DEFAULT_DASHBOARD_DATA.recentAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-2.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 flex items-center gap-3"
                >
                  <span className="text-xl shrink-0">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">{ach.title}</h3>
                    <p className="text-[10px] text-[#A5B4FC] truncate">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/achievements')}
              className="w-full py-2 px-3 rounded-xl bg-[#191A3A] border border-purple-500/30 text-xs font-semibold text-[#A5B4FC] hover:text-white hover:border-cyan-400/50 transition-all"
            >
              View All Achievements →
            </button>
          </GlassCard>

          {/* --------------------------------------------------------------------- */}
          {/* 12. QUICK ACTIONS                                                     */}
          {/* --------------------------------------------------------------------- */}
          <GlassCard className="p-5 border-purple-500/30 space-y-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              QUICK ACTIONS
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => navigate('/interview-setup')}
                className="p-3 rounded-xl bg-[#0F1026] border border-purple-500/30 hover:border-cyan-400/50 hover:bg-[#191A3A] transition-all cursor-pointer space-y-1"
              >
                <div className="text-cyan-400 font-bold text-xs flex items-center gap-1">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Mock Interview</span>
                </div>
                <p className="text-[10px] text-[#A5B4FC]">Practice with AI</p>
              </div>

              <div
                onClick={() => navigate('/ats')}
                className="p-3 rounded-xl bg-[#0F1026] border border-purple-500/30 hover:border-pink-400/50 hover:bg-[#191A3A] transition-all cursor-pointer space-y-1"
              >
                <div className="text-pink-400 font-bold text-xs flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Resume / ATS</span>
                </div>
                <p className="text-[10px] text-[#A5B4FC]">Check readiness</p>
              </div>

              <div
                onClick={() => navigate('/skill-gap')}
                className="p-3 rounded-xl bg-[#0F1026] border border-purple-500/30 hover:border-purple-400/50 hover:bg-[#191A3A] transition-all cursor-pointer space-y-1"
              >
                <div className="text-purple-400 font-bold text-xs flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" />
                  <span>Skill Gap</span>
                </div>
                <p className="text-[10px] text-[#A5B4FC]">Find weaknesses</p>
              </div>

              <div
                onClick={() => navigate('/daily-challenge')}
                className="p-3 rounded-xl bg-[#0F1026] border border-purple-500/30 hover:border-orange-400/50 hover:bg-[#191A3A] transition-all cursor-pointer space-y-1"
              >
                <div className="text-orange-400 font-bold text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Daily Challenge</span>
                </div>
                <p className="text-[10px] text-[#A5B4FC]">Earn +20 XP</p>
              </div>
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
}
