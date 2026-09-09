import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  ArrowRight,
  Mic,
  FileSearch,
  Brain,
  Flame,
  TrendingUp,
  Target,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import Navbar from '../components/Navbar';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/interview-setup');
    } else {
      navigate('/login?redirect=/interview-setup');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1026] text-[#F8FAFC] selection:bg-purple-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Futuristic Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-purple-700/25 to-cyan-500/20 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-900/20 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-900/15 blur-[110px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Next-Gen Autonomous Career Preparation</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                Ace Your Next <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Interview with AI.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[#A5B4FC] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Practice smarter. Improve faster. Get interview-ready with your personal AI career coach that adapts questions, audits resume gaps, and tracks your daily mastery.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <GradientButton
                  variant="primary"
                  size="lg"
                  onClick={handleStart}
                  icon={ArrowRight}
                  className="w-full sm:w-auto text-base shadow-xl shadow-purple-900/40"
                >
                  Start Mock Interview →
                </GradientButton>

                <a href="#features" className="w-full sm:w-auto">
                  <GradientButton
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Explore Features
                  </GradientButton>
                </a>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#A5B4FC]/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Adaptive Question Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>STAR Framework Feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>ATS Resume Audit</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual - AI Interviewer Panel */}
            <div className="lg:col-span-5 relative">
              {/* Outer decorative ring */}
              <div className="relative mx-auto max-w-md">
                
                {/* Glow ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#06B6D4] rounded-3xl blur-lg opacity-40 animate-pulse" />

                {/* Main AI Interviewer Card */}
                <GlassCard className="relative bg-[#151635]/90 border border-purple-500/40 shadow-2xl p-6 sm:p-7 space-y-6">
                  {/* Top Bar with Status */}
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 p-0.5 shadow-md">
                        <div className="w-full h-full bg-[#0F1026] rounded-[14px] flex items-center justify-center">
                          <Bot className="w-6 h-6 text-cyan-300" />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0F1026] rounded-full" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-white tracking-wide">AI INTERVIEWER</h2>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>AI Interviewer Ready</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="cyan" size="sm">
                      Interactive Session
                    </Badge>
                  </div>

                  {/* Interview Question Bubble */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                      Current Question • Technical
                    </span>
                    <div className="p-4 rounded-2xl bg-[#1D1E45] border border-purple-500/30 text-white font-medium text-sm sm:text-base leading-relaxed">
                      "Explain the difference between Machine Learning and Deep Learning. When would you choose an ensemble model over a neural network?"
                    </div>
                  </div>

                  {/* Simulated Audio Waveform */}
                  <div className="p-3 rounded-xl bg-[#0F1026]/70 border border-purple-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#A5B4FC]">
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>Audio Input Simulation</span>
                    </div>
                    {/* Animated sound bars */}
                    <div className="flex items-center gap-1 h-5">
                      {[40, 75, 100, 60, 85, 30, 90, 50, 70, 45, 95, 35].map((val, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-gradient-to-t from-purple-500 to-cyan-400 rounded-full"
                          style={{
                            height: `${val}%`,
                            animation: `pulse 1.${(idx % 5) + 2}s infinite alternate`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Candidate Quick Stats Floating Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-xl bg-[#191A3A] border border-purple-500/20">
                      <p className="text-[10px] text-[#A5B4FC]">Clarity</p>
                      <p className="text-xs font-bold text-cyan-300">9.2 / 10</p>
                    </div>
                    <div className="p-2 rounded-xl bg-[#191A3A] border border-purple-500/20">
                      <p className="text-[10px] text-[#A5B4FC]">Relevance</p>
                      <p className="text-xs font-bold text-purple-300">95%</p>
                    </div>
                    <div className="p-2 rounded-xl bg-[#191A3A] border border-purple-500/20">
                      <p className="text-[10px] text-[#A5B4FC]">Adaptive</p>
                      <p className="text-xs font-bold text-emerald-400">Escalated</p>
                    </div>
                  </div>

                  {/* CTA inside Card */}
                  <GradientButton
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={handleStart}
                  >
                    Launch Interactive Demo →
                  </GradientButton>
                </GlassCard>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 bg-[#0C0D20] border-y border-purple-500/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="purple" size="md">
              Comprehensive Career Toolkit
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Everything You Need to Win High-Stakes Interviews
            </h2>
            <p className="text-[#A5B4FC] text-base">
              A continuous preparation platform that connects resume optimization, realistic mock sessions, and actionable skill progression.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <GlassCard hoverEffect glow="purple" className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">🎤 AI Mock Interviews</h3>
              <p className="text-sm text-[#A5B4FC] leading-relaxed">
                Experience role-specific technical, behavioral, and HR interview rounds with instantaneous structured scoring and actionable improvement tips.
              </p>
            </GlassCard>

            {/* Feature 2 */}
            <GlassCard hoverEffect glow="cyan" className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">📄 ATS Resume Scanner</h3>
              <p className="text-sm text-[#A5B4FC] leading-relaxed">
                Scan your resume against real job specifications. Detect missing keywords, formatting traps, and quantify your project impact score.
              </p>
            </GlassCard>

            {/* Feature 3 */}
            <GlassCard hoverEffect glow="purple" className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">🧠 Skill Gap Analysis</h3>
              <p className="text-sm text-[#A5B4FC] leading-relaxed">
                Visualize exactly where your capabilities stand versus market standards. Identify strong proficiencies and urgent gaps before recruiters do.
              </p>
            </GlassCard>

            {/* Feature 4 */}
            <GlassCard hoverEffect glow="cyan" className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">🔥 Daily Practice & Streaks</h3>
              <p className="text-sm text-[#A5B4FC] leading-relaxed">
                Keep your mind sharp with bite-sized daily challenges. Earn XP, maintain your consecutive preparation streak, and build interview confidence.
              </p>
            </GlassCard>

            {/* Feature 5 */}
            <GlassCard hoverEffect glow="purple" className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">📊 Performance Tracking</h3>
              <p className="text-sm text-[#A5B4FC] leading-relaxed">
                Track historical scores across technical knowledge, clarity, structure, and confidence over time with detailed visual progression charts.
              </p>
            </GlassCard>

            {/* Feature 6 */}
            <GlassCard hoverEffect glow="cyan" className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">🎯 Personalized Recommendations</h3>
              <p className="text-sm text-[#A5B4FC] leading-relaxed">
                The agent doesn't just score you—it prescribes what to practice next, guiding you continuously until you achieve offer-ready performance.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="cyan" size="md">
            Product Journey
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            5 Simple Steps to Career Readiness
          </h2>
          <p className="text-[#A5B4FC] text-base">
            From raw resume to confident offer negotiation in one continuous, agent-guided loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            { step: '01', title: 'Upload Resume', desc: 'Feed your resume and target job description for instant indexing.' },
            { step: '02', title: 'Choose Target Role', desc: 'Select domain (ML, Software Eng, Data Science) and interview type.' },
            { step: '03', title: 'Practice Interview', desc: 'Engage with dynamic questions and simulated audio responses.' },
            { step: '04', title: 'Get AI Feedback', desc: 'Receive granular scores on clarity, STAR structure, and depth.' },
            { step: '05', title: 'Improve Your Skills', desc: 'Address recommended gaps with targeted drills and daily challenges.' }
          ].map((item, idx) => (
            <GlassCard key={idx} className="relative p-5 text-center flex flex-col items-center justify-between border-purple-500/25">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-sm mb-3 shadow-md shadow-purple-900/40">
                {item.step}
              </div>
              <h4 className="text-base font-bold text-white mb-2">{item.title}</h4>
              <p className="text-xs text-[#A5B4FC] leading-relaxed">{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Agent Vision vs Regular Chatbot Callout */}
      <section id="agent-vision" className="py-20 bg-gradient-to-b from-[#0C0D20] to-[#0F1026] border-t border-purple-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlassCard className="p-8 sm:p-12 border-purple-500/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-3xl pointer-events-none" />
            
            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Agentic Architecture Differentiation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Not Just a Chatbot. An Autonomous Career Preparation Agent.
              </h2>
              <p className="text-sm sm:text-base text-[#A5B4FC] max-w-2xl mx-auto">
                Unlike simple conversational chatbots, InterviewAI synthesizes historical performance, resume gaps, and continuous feedback to decide <strong className="text-white">what you should improve next</strong>.
              </p>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="p-6 rounded-2xl bg-[#0F1026]/90 border border-purple-500/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-xl bg-[#191A3A] border border-purple-500/20">
                  <span className="text-xs font-bold text-purple-300">1. Resume Analysis</span>
                  <p className="text-[11px] text-[#A5B4FC] mt-1">Extracts skills & projects</p>
                </div>
                <div className="p-3 rounded-xl bg-[#191A3A] border border-cyan-500/20">
                  <span className="text-xs font-bold text-cyan-300">2. Skill Gap Audit</span>
                  <p className="text-[11px] text-[#A5B4FC] mt-1">Identifies market deficits</p>
                </div>
                <div className="p-3 rounded-xl bg-[#191A3A] border border-pink-500/20">
                  <span className="text-xs font-bold text-pink-300">3. Adaptive Interview</span>
                  <p className="text-[11px] text-[#A5B4FC] mt-1">Escalates or reinforces depth</p>
                </div>
                <div className="p-3 rounded-xl bg-[#191A3A] border border-emerald-500/20">
                  <span className="text-xs font-bold text-emerald-300">4. Next Action Agent</span>
                  <p className="text-[11px] text-[#A5B4FC] mt-1">Recommends exact practice</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Become Interview-Ready?
          </h2>
          <p className="text-lg text-[#A5B4FC] max-w-xl mx-auto">
            Experience the complete user journey from role setup and live mock interview to detailed performance feedback and skill gap analysis.
          </p>
          <div className="pt-2">
            <GradientButton
              size="lg"
              variant="primary"
              onClick={handleStart}
              icon={ArrowRight}
              className="text-base px-8 py-4 shadow-2xl shadow-purple-900/50"
            >
              Start Practicing →
            </GradientButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-purple-500/20 bg-[#0A0B1A] text-xs text-[#A5B4FC]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">InterviewAI</span>
            <span>— AI Career Preparation Agent Prototype (IDP Project)</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/interview-setup" className="hover:text-white transition-colors">Mock Interview</Link>
            <Link to="/ats" className="hover:text-white transition-colors">ATS Scanner</Link>
            <Link to="/skill-gap" className="hover:text-white transition-colors">Skill Gap</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
