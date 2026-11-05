import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Compass,
  FileSearch,
  Mic,
  Code2,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Target,
  Layers,
  Cpu
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import OnboardingTourModal from '../components/OnboardingTourModal';
import ConceptPrimerModal from '../components/ConceptPrimerModal';

const FAQS = [
  {
    category: 'Interviews & Technologies',
    question: 'Can I practice an interview focused strictly on Java (or another specific technology)?',
    answer:
      'Yes! On the Mock Interview Setup page, you can choose the Technology Track, select one or more technologies (like Java, Python, C++, C, or SQL), and toggle "Strict Technology Focus". The AI will strictly restrict every single question, code construct, and scenario to your chosen stack without asking about unrelated languages.'
  },
  {
    category: 'Interviews & Technologies',
    question: 'How does Resume-Based Language Grounding work?',
    answer:
      'When you upload a resume, the ATS scanner extracts your verified programming languages (e.g. Java, Python, SQL). When you take a general role interview (like "Software Engineer" or "Backend Developer"), the AI interviewer automatically grounds coding problems in the languages found on your resume, so you are never asked questions in languages you do not know.'
  },
  {
    category: 'Evaluation & Scoring',
    question: 'How does the AI evaluate my interview answers?',
    answer:
      'Every answer is evaluated across 5 industry-standard hiring axes: 1) Technical Accuracy (correctness & depth), 2) Relevance (direct alignment with prompt), 3) Communication Quality (clarity & structure), 4) Completeness (covering trade-offs & edge cases), and 5) Confidence Indicators. Feedback is calibrated to your selected seniority (Beginner, Intermediate, or Senior).'
  },
  {
    category: 'Skill Gaps & Learning',
    question: 'What if I am preparing for a role (e.g., DevOps) but have 0% baseline in a required skill (e.g., Docker)?',
    answer:
      'We solve the "assessment trap" through Just-In-Time (JIT) Skill Primers. Instead of repeatedly failing an interview on a skill you have never touched, the agent prescribes a 3-minute grounded Concept Primer. It explains the core mental models in plain English, provides the top interview question, and tests your understanding with 2 quick questions to verify your foundation before taking full mock interviews.'
  },
  {
    category: 'Skill Arena & Execution',
    question: 'Is code execution in the Skill Arena safe and secure?',
    answer:
      'Yes. Code submitted in the Skill Arena runs inside an isolated Docker sandbox with restricted permissions, memory limits (256MB), a strict execution timeout (3s kill), and secret scrubbing. Submissions are compiled against unit test suites with detailed pass/fail feedback.'
  },
  {
    category: 'Progress & Competency',
    question: 'How do I close a skill gap on my Competency Radar?',
    answer:
      'When you score 70% or higher in a targeted mock interview question, pass a daily coding challenge, or complete a JIT primer verification, verified evidence records are written to your profile. This increases your score in that competency node, updates your radar chart, and closes the corresponding skill gap.'
  }
];

const MODULES = [
  {
    id: 'interview',
    title: 'Adaptive Mock Interviews',
    icon: Mic,
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    description: 'Realistic multi-turn technical and behavioral interviews with dynamic follow-up probing.',
    features: [
      'Role Track & Technology Track (Java, Python, C++, SQL, etc.)',
      'Text, Voice & Video interview modes',
      '5-Axis hiring committee rubric scoring and STAR feedback'
    ],
    actionText: 'Start Mock Interview',
    actionRoute: '/interview-setup'
  },
  {
    id: 'ats',
    title: 'Resume & ATS Scanner',
    icon: FileSearch,
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    description: 'Audits your resume against Applicant Tracking Systems to maximize recruiter callback rates.',
    features: [
      'Automatic programming language and framework extraction',
      'Missing critical keywords and role compatibility score',
      'Feeds directly into diagnostic skill gaps and interview prompts'
    ],
    actionText: 'Scan Resume',
    actionRoute: '/ats'
  },
  {
    id: 'arena',
    title: 'Skill Arena & Daily Challenges',
    icon: Code2,
    iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    description: 'Hands-on coding challenges executed in isolated Docker containers with instant test validation.',
    features: [
      'Multi-language code editor (Python, Java, C++, JavaScript)',
      'Real-time stdout/stderr, memory profiling, and test case execution',
      'Daily streak multipliers and XP gamification rewards'
    ],
    actionText: 'Enter Skill Arena',
    actionRoute: '/skill-arena'
  },
  {
    id: 'peer',
    title: 'Peer Chamber',
    icon: Users,
    iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    description: 'Practice live collaborative interviews with peers, mentors, or simulated AI interviewer roleplay.',
    features: [
      'Real-time collaborative code editor and whiteboard',
      'Simultaneous dual evaluation and peer grading',
      'Shared room codes with instant WebSocket synchronization'
    ],
    actionText: 'Open Peer Chamber',
    actionRoute: '/peer-room'
  }
];

const POPULAR_PRIMERS = ['Docker', 'Java', 'Python', 'SQL', 'C', 'C++'];

export default function HelpGuidePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const primerParam = searchParams.get('primer');

  const [tourOpen, setTourOpen] = useState(false);
  const [activePrimerSkill, setActivePrimerSkill] = useState(primerParam || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const q = searchQuery.toLowerCase();
    return FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      
      {/* Hero Banner */}
      <GlassCard className="p-6 sm:p-10 relative overflow-hidden bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border border-slate-200">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Platform Knowledge & Help Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Your AI Career Preparation Agent Works
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Welcome! This platform operates as an autonomous, closed-loop career accelerator. From ATS resume diagnostics to targeted technology interviews and Docker-isolated code sandboxes, here is your complete user manual.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <GradientButton
              variant="primary"
              size="md"
              onClick={() => setTourOpen(true)}
              icon={Sparkles}
            >
              Start Interactive Tour
            </GradientButton>
            <GradientButton
              variant="secondary"
              size="md"
              onClick={() => navigate('/interview-setup')}
              icon={Mic}
            >
              Configure Mock Interview
            </GradientButton>
          </div>
        </div>
      </GlassCard>

      {/* Visual Roadmap: The Closed-Loop Lifecycle */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              The Closed-Loop Career Acceleration Workflow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              How every action feeds into verified hiring readiness without disconnected quizzes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-5 border border-slate-200 bg-white relative">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xs mb-3">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Perception (Resume)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload your resume. The engine scans ATS keywords, extracts your programming languages, and identifies gaps for your target role.
            </p>
          </GlassCard>

          <GlassCard className="p-5 border border-slate-200 bg-white relative">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-xs mb-3">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Diagnosis (Gaps)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Skill deficits populate your profile as High-Priority items. For 0% baseline skills, 3-minute JIT primers are prescribed first.
            </p>
          </GlassCard>

          <GlassCard className="p-5 border border-slate-200 bg-white relative">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-xs mb-3">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Targeted Practice</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Engage in multi-turn AI interviews grounded in your resume languages or choose a strict technology deep-dive (e.g. pure Java).
            </p>
          </GlassCard>

          <GlassCard className="p-5 border border-slate-200 bg-white relative">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-xs mb-3">
              4
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Mastery & Radar</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              5-Axis rubric evaluations write verified evidence records into your profile, increasing your scores and closing skill gaps.
            </p>
          </GlassCard>
        </div>
      </div>

      {/* JIT Primer Interactive Showcase */}
      <GlassCard className="p-6 border border-indigo-100 bg-gradient-to-r from-indigo-50/40 via-white to-purple-50/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Featured Remediation Tool
              </span>
              <span className="text-xs text-slate-500">• Solves the Assessment Trap</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Try a 3-Minute Just-In-Time (JIT) Skill Primer
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Never get stuck failing an interview on a technology you have never learned. Click any technology below to preview its 3-minute briefing and 2-question verification check:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-4">
          {POPULAR_PRIMERS.map((tech) => (
            <button
              key={tech}
              onClick={() => setActivePrimerSkill(tech)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/50 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>{tech} Primer</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Module Capabilities Explorer */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            Core Platform Capabilities
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click into any core module to explore how it assists your interview readiness
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <GlassCard key={mod.id} className="p-6 border border-slate-200 bg-white flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${mod.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Active Module
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{mod.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    {mod.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
                  <GradientButton
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(mod.actionRoute)}
                    icon={ArrowRight}
                  >
                    {mod.actionText}
                  </GradientButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Frequently Asked Questions & Guardrails
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear answers to technical details and preparation workflows
            </p>
          </div>

          {/* FAQ Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <GlassCard
                key={idx}
                className="border border-slate-200 bg-white overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {faq.category}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {faq.question}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4.5 pb-4.5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.answer}
                  </div>
                )}
              </GlassCard>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching questions found for "{searchQuery}". Try a different search term.
            </div>
          )}
        </div>
      </div>

      {/* Onboarding Tour Modal */}
      <OnboardingTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />

      {/* Concept Primer Modal (Interactive preview or triggered via URL query) */}
      <ConceptPrimerModal
        isOpen={Boolean(activePrimerSkill)}
        onClose={() => setActivePrimerSkill(null)}
        skillName={activePrimerSkill || 'Docker'}
        targetRole="Software Engineer"
        difficulty="Beginner"
      />
    </div>
  );
}
