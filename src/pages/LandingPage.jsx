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
    <div className="min-h-screen bg-[#F8F6F0] text-[#1F1B16] selection:bg-[#1A365D] selection:text-white font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 border-b border-[#E5E0D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1A365D] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#8C6E54]" />
                <span className="editorial-overline text-[11px]">AI Career Preparation Agent</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[#1F1B16] leading-[1.15]">
                Master the Art of <br />
                <span className="text-[#1A365D] italic">
                  Interview Preparation.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#70685E] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Practice with AI-powered mock interviews. Our platform adapts questions to your skill level, evaluates your answers with detailed rubrics, scans your resume, and guides your daily practice.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <GradientButton
                  variant="primary"
                  size="lg"
                  onClick={handleStart}
                  icon={ArrowRight}
                  className="w-full sm:w-auto text-sm"
                >
                  Start Mock Interview
                </GradientButton>

                <a href="#features" className="w-full sm:w-auto">
                  <GradientButton
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto text-sm"
                  >
                    Explore Features
                  </GradientButton>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#70685E]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#235E3B]" />
                  <span>Adaptive Question Hierarchy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1A365D]" />
                  <span>STAR Discourse Rubrics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8C6E54]" />
                  <span>ATS Archival Indexation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual - Archival Interviewer Panel */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                <GlassCard className="relative bg-[#FFFDF9] border border-[#E5E0D5] p-6 sm:p-7 space-y-5 shadow-sm">
                  {/* Top Bar with Status */}
                  <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white">
                        <span className="font-serif font-bold text-sm">TP</span>
                      </div>
                      <div>
                        <h2 className="text-sm font-serif font-bold text-[#1F1B16] tracking-wide">
                          EVALUATION COMMITTEE
                        </h2>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#235E3B] font-medium">
                          <span className="w-2 h-2 rounded-full bg-[#235E3B]" />
                          <span>Session Formatted &amp; Calibrated</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="navy" size="sm">
                      Interactive Interview
                    </Badge>
                  </div>

                  {/* Interview Question Bubble */}
                  <div className="space-y-2">
                    <span className="editorial-overline">
                      SAMPLE QUESTION • TECHNICAL ROUND
                    </span>
                    <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] font-serif text-sm leading-relaxed">
                      "Compare gradient-boosted trees against transformer architectures for tabular data. Under what conditions would you prioritize tree-based models in production?"
                    </div>
                  </div>

                  {/* Simulated Audio Waveform */}
                  <div className="p-3 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#70685E]">
                      <Mic className="w-3.5 h-3.5 text-[#1A365D]" />
                      <span className="font-sans font-medium">Speaking Pace &amp; Audio Clarity</span>
                    </div>
                    {/* Visual Sound Bars */}
                    <div className="flex items-center gap-1 h-4">
                      {[35, 70, 90, 50, 80, 25, 85, 45, 65, 40, 90, 30].map((val, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-[#1A365D] rounded-xs"
                          style={{ height: `${val}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Candidate Quick Stats Floating Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                      <p className="editorial-overline text-[9px]">Clarity</p>
                      <p className="text-xs font-serif font-bold text-[#1F1B16] mt-0.5">9.2 / 10</p>
                    </div>
                    <div className="p-2 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                      <p className="editorial-overline text-[9px]">Relevance</p>
                      <p className="text-xs font-serif font-bold text-[#1A365D] mt-0.5">95%</p>
                    </div>
                    <div className="p-2 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                      <p className="editorial-overline text-[9px]">Level</p>
                      <p className="text-xs font-serif font-bold text-[#235E3B] mt-0.5">Mid/Senior</p>
                    </div>
                  </div>

                  {/* Criteria Evaluated */}
                  <div className="space-y-2">
                    <span className="editorial-overline">
                      RUBRICS APPLIED
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center">
                        <span className="text-[10px] text-[#70685E] block font-mono">Precision</span>
                        <span className="text-xs font-bold text-[#1F1B16]">Algorithmic</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center">
                        <span className="text-[10px] text-[#70685E] block font-mono">Structure</span>
                        <span className="text-xs font-bold text-[#1F1B16]">Trade-Offs</span>
                      </div>
                      <div className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center">
                        <span className="text-[10px] text-[#70685E] block font-mono">Delivery</span>
                        <span className="text-xs font-bold text-[#1F1B16]">Clarity</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA inside Card */}
                  <GradientButton
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={handleStart}
                  >
                    Start Mock Interview →
                  </GradientButton>
                </GlassCard>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Precepts Grid */}
      <section id="features" className="py-20 bg-[#F8F6F0] border-b border-[#E5E0D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="editorial-overline">CORE CAPABILITIES</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#1F1B16]">
              A Complete Platform for Interview Success
            </h2>
            <p className="text-[#70685E] text-sm leading-relaxed">
              Combining resume analysis, realistic AI mock interviews, and career readiness tracking into one unified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <GlassCard className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
                <Mic className="w-5 h-5" />
              </div>
              <div className="editorial-overline">FEATURE I</div>
              <h3 className="text-lg font-serif font-bold text-[#1F1B16]">AI Mock Interviews</h3>
              <p className="text-xs text-[#70685E] leading-relaxed">
                Practice realistic technical, system design, and behavioral rounds with objective rubrics and detailed constructive feedback.
              </p>
            </GlassCard>

            {/* Feature 2 */}
            <GlassCard className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#8C6E54]">
                <FileSearch className="w-5 h-5" />
              </div>
              <div className="editorial-overline">FEATURE II</div>
              <h3 className="text-lg font-serif font-bold text-[#1F1B16]">ATS Resume Scanner</h3>
              <p className="text-xs text-[#70685E] leading-relaxed">
                Scan your resume against job requirements. Identify missing skills, formatting issues, and quantify narrative impact.
              </p>
            </GlassCard>

            {/* Feature 3 */}
            <GlassCard className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] flex items-center justify-center text-[#235E3B]">
                <Brain className="w-5 h-5" />
              </div>
              <div className="editorial-overline">FEATURE III</div>
              <h3 className="text-lg font-serif font-bold text-[#1F1B16]">Skill Gap Analysis</h3>
              <p className="text-xs text-[#70685E] leading-relaxed">
                Map your skills against industry benchmarks to uncover weak spots and prioritize what to practice next.
              </p>
            </GlassCard>

            {/* Feature 4 */}
            <GlassCard className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] flex items-center justify-center text-[#9A421A]">
                <Flame className="w-5 h-5" />
              </div>
              <div className="editorial-overline">FEATURE IV</div>
              <h3 className="text-lg font-serif font-bold text-[#1F1B16]">Daily Practice &amp; Challenges</h3>
              <p className="text-xs text-[#70685E] leading-relaxed">
                Build consistent interview skills through concise daily challenges that keep your practice streak active.
              </p>
            </GlassCard>

            {/* Feature 5 */}
            <GlassCard className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="editorial-overline">FEATURE V</div>
              <h3 className="text-lg font-serif font-bold text-[#1F1B16]">Performance &amp; Progress Tracking</h3>
              <p className="text-xs text-[#70685E] leading-relaxed">
                Review your historical progress across technical depth, communication clarity, and speaking speed over time.
              </p>
            </GlassCard>

            {/* Feature 6 */}
            <GlassCard className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#8C6E54]">
                <Target className="w-5 h-5" />
              </div>
              <div className="editorial-overline">FEATURE VI</div>
              <h3 className="text-lg font-serif font-bold text-[#1F1B16]">Personalized Practice Plans</h3>
              <p className="text-xs text-[#70685E] leading-relaxed">
                The AI recommends specific exercises and practice drills to help you reach interview readiness.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#E5E0D5]">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="editorial-overline">CURRICULUM METHODOLOGY</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-[#1F1B16]">
            Five Stages of Candidate Elevation
          </h2>
          <p className="text-[#70685E] text-sm">
            From initial resume submission to confident interview execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: 'I', title: 'Resume Analysis', desc: 'Upload your resume and prospective job description.' },
            { step: 'II', title: 'Role Alignment', desc: 'Select domain focus (ML, Software, Data) and difficulty level.' },
            { step: 'III', title: 'Mock Interview', desc: 'Engage with targeted questions and adaptive interviewers.' },
            { step: 'IV', title: 'Detailed Feedback', desc: 'Receive rubrics evaluating clarity, STAR method, and depth.' },
            { step: 'V', title: 'Targeted Practice', desc: 'Improve key skills via daily challenges and coding practice.' }
          ].map((item, idx) => (
            <GlassCard key={idx} className="p-5 text-center flex flex-col items-center justify-between">
              <div className="w-8 h-8 rounded-md bg-[#1B2A4A] text-white flex items-center justify-center font-serif font-bold text-xs mb-3">
                {item.step}
              </div>
              <h4 className="text-sm font-serif font-bold text-[#1F1B16] mb-1.5">{item.title}</h4>
              <p className="text-xs text-[#70685E] leading-relaxed">{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Agent Vision Architecture Callout */}
      <section id="agent-vision" className="py-20 bg-[#FAF8F3] border-b border-[#E5E0D5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <GlassCard className="p-8 sm:p-10 border-[#E5E0D5] space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1A365D] text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5 text-[#8C6E54]" />
                <span className="editorial-overline text-[10px]">Intelligent Career Preparation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1B16]">
                More Than a Chatbot. A Real AI Career Coach.
              </h2>
              <p className="text-xs sm:text-sm text-[#70685E] max-w-2xl mx-auto leading-relaxed">
                Instead of generic answers, our platform analyzes your interview history, resume gaps, and skill levels to recommend <strong className="text-[#1F1B16]">exactly what you should practice next</strong>.
              </p>
            </div>

            {/* Architecture Schematic Grid */}
            <div className="p-5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                  <span className="editorial-overline text-[10px] text-[#1A365D]">1. Resume Analysis</span>
                  <p className="text-xs font-serif font-semibold text-[#1F1B16] mt-1">Resume Parsing</p>
                </div>
                <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                  <span className="editorial-overline text-[10px] text-[#8C6E54]">2. Skill Gap</span>
                  <p className="text-xs font-serif font-semibold text-[#1F1B16] mt-1">Industry Skills</p>
                </div>
                <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                  <span className="editorial-overline text-[10px] text-[#1A365D]">3. Mock Interview</span>
                  <p className="text-xs font-serif font-semibold text-[#1F1B16] mt-1">Adaptive Difficulty</p>
                </div>
                <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5]">
                  <span className="editorial-overline text-[10px] text-[#235E3B]">4. Personalized Plan</span>
                  <p className="text-xs font-serif font-semibold text-[#1F1B16] mt-1">Smart Action Plan</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Ready to Start Your Interview Practice?
        </h2>
        <p className="text-sm text-[#70685E] max-w-xl mx-auto leading-relaxed">
          Start your complete preparation journey: from role setup and realistic interviews to detailed feedback and targeted skill improvement.
        </p>
        <div className="pt-2">
          <GradientButton
            size="lg"
            variant="primary"
            onClick={handleStart}
            icon={ArrowRight}
            className="text-sm px-8 py-3.5"
          >
            Start Mock Interview →
          </GradientButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-[#E5E0D5] bg-[#FFFDF9] text-xs text-[#70685E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#1F1B16]">TalentPath</span>
            <span>— AI Career Preparation Agent</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link to="/interview-setup" className="hover:text-[#1A365D] transition-colors">Mock Interview</Link>
            <Link to="/ats" className="hover:text-[#1A365D] transition-colors">Resume Scanner</Link>
            <Link to="/skill-gap" className="hover:text-[#1A365D] transition-colors">Skill Gaps</Link>
            <Link to="/login" className="hover:text-[#1A365D] transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
