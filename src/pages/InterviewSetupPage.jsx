import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Layers,
  BarChart2,
  FileText,
  Upload,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Globe,
  Video,
  MessageSquare,
  Shield,
  Briefcase,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  Zap,
  Code2,
  Tag,
  X,
  Plus
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { MOCK_ROLES, INTERVIEW_TYPES, DIFFICULTY_LEVELS } from '../data/mockData';
import { COMPANY_PLAYBOOKS } from '../data/companyPlaybooks';
import { INTERVIEWER_PERSONAS } from '../data/interviewerPersonas';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { profileApi } from '../services/profileApi';

const FAST_PRESETS = [
  {
    id: 'fresher_fullstack',
    title: 'Campus Fresher (Full Stack)',
    role: 'Software Engineer',
    type: 'Technical',
    difficulty: 'Beginner',
    playbook: 'general',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'Fresher • 0-1 Yrs',
    badgeVariant: 'emerald',
    desc: 'JavaScript/HTML/CSS basics, React component state, fundamental SQL, and REST APIs.',
    sampleJD: "Job Role: Junior / Fresher Full Stack Developer (0-1 yrs)\nRequired Skills: HTML5, CSS3, JavaScript (ES6+), React fundamentals (props, state, basic hooks), Basic REST APIs, and simple SQL queries. Looking for fresh graduates with strong problem-solving fundamentals, direct logic, and clean code habits."
  },
  {
    id: 'junior_backend',
    title: 'Junior Python & SQL',
    role: 'Backend Engineer',
    type: 'Technical',
    difficulty: 'Beginner',
    playbook: 'general',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'Junior • 0-2 Yrs',
    badgeVariant: 'emerald',
    desc: 'Python fundamentals (lists, dicts, functions), basic SQL queries (JOINs, GROUP BY), and REST endpoints.',
    sampleJD: "Job Role: Junior Backend Engineer (0-2 yrs)\nRequired Skills: Python, basic data structures (lists, dicts, tuples), SQL queries (SELECT, JOIN, aggregations), Git version control, and basic HTTP methods (GET, POST). Focus on clarity, logic, and core coding standards."
  },
  {
    id: 'campus_dsa',
    title: 'Campus DSA & Core CS',
    role: 'Software Engineer',
    type: 'Technical',
    difficulty: 'Beginner',
    playbook: 'general',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'Campus DSA',
    badgeVariant: 'emerald',
    desc: 'Arrays, strings, two-pointer techniques, hash maps, recursion, and Big-O notation basics.',
    sampleJD: "Job Role: Graduate Software Development Engineer (Campus Hiring)\nRequired Skills: Data Structures (Arrays, Strings, Hash Maps, Linked Lists), Algorithms (Sorting, Searching, Two Pointers), Object-Oriented Programming (OOP), and DBMS fundamentals."
  },
  {
    id: 'frontend_sde',
    title: 'Frontend Specialist',
    role: 'Frontend Engineer',
    type: 'Technical',
    difficulty: 'Intermediate',
    playbook: 'meta',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'UI & React',
    badgeVariant: 'navy',
    desc: 'React lifecycle, state trees, re-rendering optimization & DOM performance.',
    sampleJD: "Job Role: Mid-Level Frontend Engineer (2-4 yrs)\nRequired Skills: Modern React, Next.js, Redux / Zustand, performance optimization (memo, useMemo, virtualization), TypeScript, and responsive CSS architectures."
  },
  {
    id: 'backend_sde',
    title: 'Backend & Scalability',
    role: 'Backend Engineer',
    type: 'System Design',
    difficulty: 'Senior',
    playbook: 'amazon',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'Distributed Scale',
    badgeVariant: 'bronze',
    desc: 'Distributed caching, database concurrency, idempotency & low-latency APIs.',
    sampleJD: "Job Role: Senior Backend Engineer (4+ yrs)\nRequired Skills: Distributed Systems, High-concurrency architectures, Redis caching strategies, PostgreSQL/NoSQL query tuning, Kafka message streaming, and horizontal scaling."
  },
  {
    id: 'ml_engineer',
    title: 'Machine Learning',
    role: 'Machine Learning Engineer',
    type: 'Technical',
    difficulty: 'Senior',
    playbook: 'google',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'AI & Data Systems',
    badgeVariant: 'bronze',
    desc: 'Model architectures, transformer embeddings, loss calibration & pipelines.',
    sampleJD: "Job Role: Senior Machine Learning Engineer\nRequired Skills: PyTorch, Transformer architectures, feature engineering, vector search (Faiss), MLOps deployment (Docker, Triton), model drift monitoring, and evaluation metrics."
  },
  {
    id: 'behavioral_lead',
    title: 'Behavioral & Leadership',
    role: 'Engineering Manager',
    type: 'Behavioral',
    difficulty: 'Staff',
    playbook: 'general',
    mode: 'text',
    persona: 'elena',
    questions: 5,
    tag: 'STAR & Influence',
    badgeVariant: 'navy',
    desc: 'Cross-functional ownership, technical dispute mitigation & engineering velocity.',
    sampleJD: "Job Role: Engineering Manager / Tech Lead\nCompetencies: Cross-functional leadership, conflict resolution, mentoring junior engineers, architectural decision making, and delivering complex engineering initiatives on schedule."
  }
];

const SAMPLE_JDS = [
  {
    id: 'fresher_web',
    title: 'Junior React Frontend (0-1 yrs)',
    role: 'Frontend Engineer',
    difficulty: 'Beginner',
    tag: '0-1 Yrs',
    text: "Job Title: Junior Frontend Developer (0-1 yrs)\nExperience: Fresh graduate to 1 year\nCore Requirements:\n- Strong fundamentals in HTML5, CSS3, and JavaScript (ES6+ basics: arrow functions, map/filter, promises).\n- Practical knowledge of React (functional components, props, useState, useEffect).\n- Familiarity with consuming REST APIs using fetch() or axios.\n- Basic understanding of DOM rendering and responsive design.\n- Focus on clean syntax, readable naming conventions, and fundamental problem-solving."
  },
  {
    id: 'junior_python',
    title: 'Junior Python & SQL Backend (0-2 yrs)',
    role: 'Backend Engineer',
    difficulty: 'Beginner',
    tag: '0-2 Yrs',
    text: "Job Title: Junior Backend Engineer (0-2 yrs)\nExperience: 0-2 years\nCore Requirements:\n- Solid proficiency in Python (lists, dictionaries, functions, exception handling, string manipulation).\n- Hands-on relational database querying in SQL (SELECT, WHERE, INNER/LEFT JOIN, GROUP BY, aggregations).\n- Understanding of HTTP methods (GET, POST, PUT, DELETE) and basic RESTful endpoints.\n- Git version control fundamentals (commit, branch, pull request).\n- Direct, logical communication with good debugging skills."
  },
  {
    id: 'campus_dsa',
    title: 'Campus Fresher (DSA & OOP)',
    role: 'Software Engineer',
    difficulty: 'Beginner',
    tag: 'Campus Core CS',
    text: "Job Title: Graduate Software Development Engineer (Campus Hiring)\nEligibility: Final Year / Fresh Engineering Graduates\nCore Requirements:\n- Strong grounding in Data Structures: Arrays, Strings, Hash Tables, Linked Lists, Stacks, Queues.\n- Algorithmic thinking: Linear & Binary Search, basic Sorting, Two-Pointer approach, and Time/Space Complexity (Big-O).\n- Object-Oriented Programming (OOP) concepts: Classes, Objects, Inheritance, Polymorphism, Abstraction, Encapsulation.\n- DBMS fundamentals: Keys, Normalization, ACID properties."
  },
  {
    id: 'mid_fullstack',
    title: 'Full Stack Engineer (2-4 yrs)',
    role: 'Software Engineer',
    difficulty: 'Intermediate',
    tag: '2-4 Yrs',
    text: "Job Title: Full Stack Developer (2-4 yrs)\nExperience: 2-4 years\nCore Requirements:\n- Frontend: React / Next.js, state management, component lifecycle, performance optimization.\n- Backend: Node.js or Python (FastAPI/Django), REST API design, authentication (JWT/OAuth2).\n- Database: PostgreSQL or MongoDB, indexing, relational schema design.\n- Tooling: Docker containers, basic CI/CD, unit testing, Git workflows."
  },
  {
    id: 'senior_backend',
    title: 'Senior Distributed Backend (4+ yrs)',
    role: 'Backend Engineer',
    difficulty: 'Senior',
    tag: '4+ Yrs',
    text: "Job Title: Senior Backend Architect / Staff Engineer\nExperience: 4+ years\nCore Requirements:\n- High-throughput distributed systems design, microservices, idempotent APIs, and RPC protocols.\n- Caching strategies with Redis/Memcached, message queuing with Kafka or RabbitMQ.\n- Database sharding, partitioning, read replicas, and ACID vs BASE trade-offs.\n- Sub-50ms latency optimization, SLA management, and horizontal scalability."
  }
];

const COMMON_TECH_KEYWORDS = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'Django',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Git', 'HTML5', 'CSS3', 'REST APIs', 'GraphQL', 'DSA', 'OOP',
  'Pandas', 'PyTorch', 'Kafka', 'CI/CD'
];

function extractDetectedTech(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return COMMON_TECH_KEYWORDS.filter(k => {
    const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
  });
}

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { setup, updateSetup } = useInterview();

  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [targetRole, setTargetRole] = useState(user?.targetRole || user?.role || setup.targetRole || 'Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState(setup.interviewType || 'Technical');
  const [companyPlaybook, setCompanyPlaybook] = useState(setup.companyPlaybook || 'general');
  const [difficulty, setDifficulty] = useState(setup.difficulty || 'Beginner');
  const [interviewMode, setInterviewMode] = useState(setup.interviewMode || 'text');
  const [interviewerPersona, setInterviewerPersona] = useState(setup.interviewerPersona || 'julian');
  const [resumeName, setResumeName] = useState(setup.resumeFileName || 'Candidate_Resume.pdf');
  const [jobDescription, setJobDescription] = useState(setup.jobDescription || '');
  const [totalQuestions, setTotalQuestions] = useState(setup.totalQuestions || 5);

  const detectedTech = useMemo(() => extractDetectedTech(jobDescription), [jobDescription]);

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setTargetRole(preset.role);
    setCustomRole('');
    setInterviewType(preset.type);
    setDifficulty(preset.difficulty);
    setCompanyPlaybook(preset.playbook);
    setInterviewMode(preset.mode);
    setInterviewerPersona(preset.persona);
    setTotalQuestions(preset.questions);
    if (preset.sampleJD) {
      setJobDescription(preset.sampleJD);
    }
  };

  const handleApplySampleJD = (sample) => {
    setJobDescription(sample.text);
    if (sample.role) {
      setTargetRole(sample.role);
      setCustomRole('');
    }
    if (sample.difficulty) {
      setDifficulty(sample.difficulty);
    }
  };

  const handleAddKeywordToJD = (keyword) => {
    setJobDescription(prev => {
      if (!prev.trim()) return `Required Skills: ${keyword}`;
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(prev)) return prev;
      return `${prev.trim()}, ${keyword}`;
    });
  };

  const handleRoleSelect = (role) => {
    setTargetRole(role);
    if (role !== 'Custom') {
      setCustomRole('');
    }
  };

  const [isDragging, setIsDragging] = useState(false);
  const [resumeError, setResumeError] = useState(null);

  const handleResumeFile = (file) => {
    if (!file) return;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      setResumeError('Selected file exceeds the 10MB limit. Please upload a smaller document.');
      return;
    }
    const validExts = ['.pdf', '.doc', '.docx', '.txt'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExts.some(ext => lowerName.endsWith(ext));
    if (!isValidExt) {
      setResumeError('Unsupported file type. Please upload a PDF or Word document (.docx/.doc).');
      return;
    }
    setResumeError(null);
    setResumeName(file.name);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleResumeFile(e.target.files[0]);
    }
  };

  const handleContinue = () => {
    const finalRole = targetRole === 'Custom' && customRole.trim() ? customRole : targetRole;
    updateUser({ targetRole: finalRole, role: finalRole });
    updateSetup({
      targetRole: finalRole,
      interviewType,
      companyPlaybook,
      difficulty,
      interviewMode,
      interviewerPersona,
      resumeFileName: resumeName,
      jobDescription,
      interviewLanguage: 'en',
      feedbackLanguage: 'en',
      totalQuestions
    });
    if (user?.id) {
      profileApi.updateProfile({ target_role: finalRole, role: finalRole }, user.id).catch(() => {});
    }
    navigate('/interview-ready');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans text-[#1F1B16]">
      {/* Header */}
      <div className="border-b border-[#E5E0D5] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="navy" size="sm">STAGE 1 OF 3</Badge>
          <span className="editorial-overline">INTERVIEW SETUP &amp; CALIBRATION</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Customize Your Interview
        </h1>
        <p className="text-sm text-[#70685E] mt-1">
          Choose your target role, difficulty level, and optional Job Description to calibrate questions to your exact seniority.
        </p>
      </div>

      <div className="space-y-6">
        {/* 0. 1-Click Practice Presets */}
        <GlassCard className="p-5 sm:p-6 space-y-4 border-l-4 border-l-[#1A365D] bg-[#FFFDF9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white">
                <Zap className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#1F1B16] flex items-center gap-2">
                  <span>1-Click Practice Presets</span>
                  <Badge variant="navy" size="xs">RECOMMENDED</Badge>
                </h3>
                <p className="text-xs text-[#70685E]">Select an industry-calibrated preset to configure your interview in one click</p>
              </div>
            </div>
            {selectedPreset && (
              <button
                type="button"
                onClick={handleContinue}
                className="px-3.5 py-1.5 rounded-md bg-[#1B2A4A] hover:bg-[#142038] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
              >
                <span>Launch Selected Preset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {FAST_PRESETS.map((p) => {
              const isSelected = selectedPreset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`p-3.5 rounded-md border cursor-pointer transition-all flex flex-col justify-between text-left ${
                    isSelected
                      ? 'bg-[#EAEFF5] border-[#1A365D] ring-1 ring-[#1A365D] shadow-xs'
                      : 'bg-[#FAF8F3] border-[#E5E0D5] hover:border-[#1A365D]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#1A365D]">{p.tag}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1A365D]" />}
                    </div>
                    <h4 className="font-serif text-xs font-bold text-[#1F1B16] leading-tight">{p.title}</h4>
                    <p className="text-[11px] text-[#70685E] leading-relaxed line-clamp-2">{p.desc}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#E5E0D5] flex items-center justify-between text-[10px] text-[#70685E] font-mono">
                    <span className="font-semibold text-[#1A365D]">{p.difficulty}</span>
                    <span>{p.questions} Qs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 1. Target Role Selection */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">I. Select Target Role</h3>
              <p className="text-xs text-[#70685E]">Choose the job role you want to practice for</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {MOCK_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`
                  p-3 rounded-md border text-left transition-all text-xs font-semibold cursor-pointer
                  ${targetRole === role
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs ring-1 ring-[#1A365D]'
                    : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{role}</span>
                  {targetRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-[#1A365D]" />}
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setTargetRole('Custom');
                if (!customRole) setCustomRole(!MOCK_ROLES.includes(targetRole) ? targetRole : '');
              }}
              className={`
                p-3 rounded-md border text-left transition-all text-xs font-semibold cursor-pointer
                ${targetRole === 'Custom' || !MOCK_ROLES.includes(targetRole)
                  ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs ring-1 ring-[#1A365D]'
                  : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span>+ Other / Custom Role</span>
                {(targetRole === 'Custom' || !MOCK_ROLES.includes(targetRole)) && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1A365D]" />
                )}
              </div>
            </button>
          </div>

          {(targetRole === 'Custom' || !MOCK_ROLES.includes(targetRole)) && (
            <div className="pt-2 border-t border-[#E5E0D5] space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-semibold text-[#8C6E54]">
                Specify Custom Target Role:
              </label>
              <input
                type="text"
                value={targetRole === 'Custom' ? customRole : targetRole}
                onChange={(e) => {
                  setTargetRole('Custom');
                  setCustomRole(e.target.value);
                }}
                placeholder="e.g., Senior iOS Engineer, DevSecOps Specialist, Product Manager, Embedded Systems Lead..."
                className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#1A365D] text-[#1F1B16] text-sm focus:outline-none ring-1 ring-[#1A365D]"
              />
              <p className="text-[11px] text-[#70685E]">
                Our AI and Gemini LLM will synthesize role-specific questions and evaluation rubrics tailored to this discipline.
              </p>
            </div>
          )}
        </GlassCard>

        {/* 2. Difficulty Level */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] flex items-center justify-center text-[#235E3B]">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">II. Difficulty Level Calibration</h3>
              <p className="text-xs text-[#70685E]">Calibrates question depth, expected trade-offs, and scoring rubrics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {DIFFICULTY_LEVELS.map((diff) => (
              <div
                key={diff.id}
                onClick={() => setDifficulty(diff.id)}
                className={`
                  p-4 rounded-md border cursor-pointer transition-all text-left
                  ${difficulty === diff.id
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs ring-1 ring-[#1A365D]'
                    : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-serif font-bold text-[#1F1B16]">{diff.label}</span>
                  {difficulty === diff.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#1A365D]" />}
                </div>
                <p className="text-[11px] text-[#70685E] leading-relaxed">{diff.desc}</p>
                {diff.id === 'Beginner' && (
                  <div className="mt-2 pt-1.5 border-t border-[#E5E0D5] text-[10px] text-[#235E3B] font-medium flex items-center gap-1">
                    <span>✓ Direct logic &amp; core concepts (no harsh penalties)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 3. Interview Focus Type Selection */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#8C6E54]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">III. Interview Focus Type</h3>
              <p className="text-xs text-[#70685E]">Select the interview topic and question format</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {INTERVIEW_TYPES.map((type) => (
              <div
                key={type.id}
                onClick={() => setInterviewType(type.id)}
                className={`
                  p-4 rounded-md border cursor-pointer transition-all
                  ${interviewType === type.id
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs ring-1 ring-[#1A365D]'
                    : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-serif font-bold text-[#1F1B16]">{type.label}</span>
                  <Badge variant={type.badge === 'Core' ? 'emerald' : type.badge === 'System' ? 'navy' : 'bronze'} size="sm">
                    {type.badge}
                  </Badge>
                </div>
                <p className="text-xs text-[#70685E] leading-relaxed">{type.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 4. Prominent Job Description & Tech Stack Hub (Calibration Anchor) */}
        <GlassCard className="p-6 space-y-4 border-l-4 border-l-[#235E3B] bg-[#FFFDF9]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] flex items-center justify-center text-[#235E3B]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#1F1B16] flex items-center gap-2">
                  <span>IV. Job Description &amp; Target Tech Stack</span>
                  <Badge variant="emerald" size="xs">CALIBRATION HUB</Badge>
                </h3>
                <p className="text-xs text-[#70685E]">
                  Paste your target JD or click a 1-click preset to ground questions directly to your expected seniority
                </p>
              </div>
            </div>
            {jobDescription && (
              <button
                type="button"
                onClick={() => setJobDescription('')}
                className="text-[11px] font-mono text-[#9A421A] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear JD</span>
              </button>
            )}
          </div>

          {/* 1-Click Sample JD Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#70685E] uppercase tracking-wider">
                1-Click Sample JD Presets:
              </span>
              <span className="text-[10px] text-[#235E3B] font-mono">Click to populate JD &amp; calibrate level</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_JDS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleApplySampleJD(sample)}
                  className="px-2.5 py-1.5 rounded-md bg-[#FAF8F3] hover:bg-[#EAEFF5] border border-[#E5E0D5] hover:border-[#1A365D] text-left text-xs text-[#1F1B16] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-[#235E3B] shrink-0" />
                  <span className="font-medium">{sample.title}</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white text-[#70685E] border border-[#E5E0D5]">
                    {sample.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Job Description Textarea */}
          <div className="space-y-2">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste key responsibilities, required skills (e.g. React, JavaScript, SQL, Python), or raw Job Description text here..."
              rows={4}
              className="w-full p-3 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-xs text-[#1F1B16] placeholder-[#70685E]/50 focus:outline-none focus:border-[#1A365D] transition-colors resize-none font-sans leading-relaxed"
            />

            {/* Detected Tech Stack & Grounding Feedback */}
            <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#1F1B16]">
                  <Code2 className="w-3.5 h-3.5 text-[#1A365D]" />
                  <span>Detected Competencies Grounded from JD:</span>
                </div>
                <span className="text-[11px] font-mono text-[#70685E]">
                  {detectedTech.length} skill{detectedTech.length === 1 ? '' : 's'} identified
                </span>
              </div>

              {detectedTech.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detectedTech.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAEFF5] border border-[#D0DBE7] text-[#1A365D] text-[11px] font-medium font-mono"
                    >
                      <span>{tech}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#70685E] italic">
                  No specific keywords detected yet. Paste a JD or click a preset above, or click suggested chips below to ground:
                </p>
              )}

              {/* Quick Tech Chip Inserters */}
              <div className="pt-1.5 border-t border-[#E5E0D5]/70 flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-[#70685E] font-medium">Quick Add to JD:</span>
                {['React', 'JavaScript', 'Python', 'SQL', 'FastAPI', 'DSA', 'REST APIs', 'Git'].map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => handleAddKeywordToJD(tech)}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-[#EAEFF5] border border-[#E5E0D5] text-[#3B352E] font-mono transition-colors cursor-pointer"
                  >
                    + {tech}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] text-[11px] text-[#235E3B] flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Talent Shine Calibration Advantage:</strong> Grounding questions in the raw JD coordinates the AI interviewer to the candidate's exact experience level, preventing overly harsh system architecture questions for beginners.
              </span>
            </div>
          </div>
        </GlassCard>

        {/* 5. Interview Mode Selection */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] flex items-center justify-center text-[#9A421A]">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">V. Interview Mode</h3>
              <p className="text-xs text-[#70685E]">Choose between written text, voice/video, or face-to-face AI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Text Interview */}
            <div
              onClick={() => setInterviewMode('text')}
              className={`
                p-4 rounded-md border cursor-pointer transition-all flex flex-col justify-between
                ${interviewMode === 'text'
                  ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs ring-1 ring-[#1A365D]'
                  : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#1A365D]" />
                    <span className="text-sm font-serif font-bold text-[#1F1B16]">Written Text Mode</span>
                  </div>
                  {interviewMode === 'text' && <CheckCircle2 className="w-4 h-4 text-[#1A365D]" />}
                </div>
                <p className="text-xs text-[#70685E] leading-relaxed mt-2">
                  Draft responses with real-time technical rubrics, reasoning feedback, and Coding Sandbox.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E5E0D5]">
                <Badge variant="navy" size="xs">KEYBOARD &amp; CODE</Badge>
              </div>
            </div>

            {/* Standard Video Interview */}
            <div
              onClick={() => setInterviewMode('video')}
              className={`
                p-4 rounded-md border cursor-pointer transition-all flex flex-col justify-between
                ${interviewMode === 'video'
                  ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs ring-1 ring-[#1A365D]'
                  : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#8C6E54]" />
                    <span className="text-sm font-serif font-bold text-[#1F1B16]">Video Interview</span>
                  </div>
                  {interviewMode === 'video' && <CheckCircle2 className="w-4 h-4 text-[#8C6E54]" />}
                </div>
                <p className="text-xs text-[#70685E] leading-relaxed mt-2">
                  Uses webcam &amp; microphone. Analyzes speaking speed (WPM), clarity, and answer structure.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E5E0D5]">
                <Badge variant="bronze" size="xs">VIDEO &amp; AUDIO</Badge>
              </div>
            </div>

            {/* Face-to-Face AI Chamber */}
            <div
              onClick={() => setInterviewMode('face_to_face')}
              className={`
                p-4 rounded-md border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden
                ${interviewMode === 'face_to_face'
                  ? 'bg-[#FFFDF9] border-[#1A365D] text-[#1F1B16] shadow-sm ring-2 ring-[#1A365D]'
                  : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#235E3B]" />
                    <span className="text-sm font-serif font-bold text-[#1F1B16]">Face-to-Face</span>
                  </div>
                  {interviewMode === 'face_to_face' && <CheckCircle2 className="w-4 h-4 text-[#235E3B]" />}
                </div>
                <p className="text-xs text-[#70685E] leading-relaxed mt-2">
                  Live split-screen call with an interactive AI interviewer who speaks aloud and listens to verbal responses.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E5E0D5] flex items-center justify-between">
                <Badge variant="emerald" size="xs">INTERACTIVE AVATAR</Badge>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center gap-2 text-xs text-[#70685E]">
            <Shield className="w-4 h-4 text-[#1A365D] shrink-0" />
            <span>Data Privacy: Video and audio recordings stay local to your session. You can review or delete session records at any time.</span>
          </div>
        </GlassCard>

        {/* Toggle Advanced Configuration Accordion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-3.5 px-4 rounded-md border border-[#D5CFBF] bg-[#FAF8F3] hover:bg-[#F2EFE9] text-xs font-semibold text-[#1A365D] flex items-center justify-between transition-all cursor-pointer shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#8C6E54]" />
              <span>
                {showAdvanced
                  ? 'Hide Advanced Customization Options'
                  : 'Show Advanced Options (Target Employer Playbook, Custom Resume File, Question Count)'}
              </span>
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-[#1A365D]" /> : <ChevronDown className="w-4 h-4 text-[#1A365D]" />}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-6 pt-1 animate-in fade-in duration-200">
            {/* 6. Company Playbook / Rubric Calibration */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
                <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#1F1B16]">Target Employer Interview Playbook</h3>
                  <p className="text-xs text-[#70685E]">Align the AI interviewer's questions and rubrics to specific company standards</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {COMPANY_PLAYBOOKS.map((playbook) => (
                  <div
                    key={playbook.id}
                    onClick={() => setCompanyPlaybook(playbook.id)}
                    className={`
                      p-4 rounded-md border cursor-pointer transition-all flex flex-col justify-between
                      ${companyPlaybook === playbook.id
                        ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs ring-1 ring-[#1A365D]'
                        : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                      }
                    `}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-serif font-bold text-[#1F1B16] truncate">{playbook.shortName}</span>
                        <Badge variant={playbook.badgeVariant} size="sm">
                          {playbook.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-medium text-[#1A365D] mb-1">{playbook.tagline}</p>
                      <p className="text-[11px] text-[#70685E] leading-relaxed line-clamp-2">{playbook.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#E5E0D5]/70 flex flex-wrap gap-1">
                      {playbook.competencies.slice(0, 3).map((comp) => (
                        <span key={comp.id} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FAF8F3] border border-[#E5E0D5] text-[#70685E]">
                          {comp.name}
                        </span>
                      ))}
                      {playbook.competencies.length > 3 && (
                        <span className="text-[9px] font-mono text-[#70685E] self-center">+{playbook.competencies.length - 3}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* 7. Resume Document Upload */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
                <div className="w-8 h-8 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#8C6E54]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#1F1B16]">Resume Document Attachment</h3>
                  <p className="text-xs text-[#70685E]">Upload your resume to tailor questions to your project history</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Resume File</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
                      handleResumeFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-md p-4 text-center transition-all ${
                    isDragging ? 'border-[#1A365D] bg-[#EAEFF5]' : 'border-[#E5E0D5] hover:border-[#1A365D] bg-[#FAF8F3]'
                  }`}
                >
                  <input
                    type="file"
                    id="resumeUpload"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="resumeUpload" className="cursor-pointer block">
                    <div className="w-9 h-9 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center mx-auto text-[#1A365D] mb-2">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-[#1F1B16]">Select or drag resume document</p>
                    <p className="text-[10px] text-[#70685E] mt-0.5">PDF or Word document up to 10MB</p>
                  </label>
                  {resumeError && (
                    <div className="mt-2.5 p-2 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] text-[11px] text-[#9A421A] text-left">
                      {resumeError}
                    </div>
                  )}
                  {resumeName && !resumeError && (
                    <div className="mt-3 p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center justify-center gap-2 text-xs text-[#1A365D] font-mono">
                      <FileCheck className="w-3.5 h-3.5 text-[#235E3B]" />
                      <span className="truncate">{resumeName}</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* 8. Session Length */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-sans">Session Length &amp; Question Volume</h3>
                  <p className="text-xs text-slate-500 font-sans">Configure your target practice session question count</p>
                </div>
              </div>

              <div className="pt-1 max-w-sm">
                <label className="block text-xs font-semibold text-slate-700 mb-2">Question Volume</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTotalQuestions(5)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      totalQuestions === 5
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Concise (5 Qs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTotalQuestions(10)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      totalQuestions === 10
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    Exhaustive (10 Qs)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 font-sans">Target questions for this calibrated session</p>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D5]">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] transition-colors cursor-pointer"
        >
          Cancel &amp; Return to Dashboard
        </button>

        <GradientButton
          variant="primary"
          size="lg"
          onClick={handleContinue}
          icon={ArrowRight}
          className="px-8 text-sm cursor-pointer"
        >
          Start Interview Practice →
        </GradientButton>
      </div>
    </div>
  );
}
