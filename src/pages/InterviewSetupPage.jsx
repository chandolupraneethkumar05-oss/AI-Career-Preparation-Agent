import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  Layers,
  FileText,
  Upload,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Video,
  Briefcase,
  Sparkles,
  Users,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Code2,
  X,
  Clock,
  Building,
  Check
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import SelectDropdown from '../components/SelectDropdown';
import RadioCard from '../components/RadioCard';
import { MOCK_ROLES } from '../data/mockData';
import { COMPANY_PLAYBOOKS } from '../data/companyPlaybooks';
import { useAuth } from '../context/AuthContext';
import { useInterview } from '../context/InterviewContext';
import { profileApi } from '../services/profileApi';
import { reverseInterviewApi } from '../services/reverseInterviewApi';

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
    desc: 'React lifecycle, state trees, re-rendering optimization & DOM performance.',
    sampleJD: "Job Role: Mid-Level Frontend Engineer (2-4 yrs)\nRequired Skills: Modern React, Next.js, Redux / Zustand, performance optimization (memo, useMemo, virtualization), TypeScript, and responsive CSS architectures."
  },
  {
    id: 'backend_sde',
    title: 'Backend & Scalability',
    role: 'Backend Engineer',
    type: 'System Design',
    difficulty: 'Advanced',
    playbook: 'amazon',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'Distributed Scale',
    desc: 'Distributed caching, database concurrency, idempotency & low-latency APIs.',
    sampleJD: "Job Role: Senior Backend Engineer (4+ yrs)\nRequired Skills: Distributed Systems, High-concurrency architectures, Redis caching strategies, PostgreSQL/NoSQL query tuning, Kafka message streaming, and horizontal scaling."
  },
  {
    id: 'ml_engineer',
    title: 'Machine Learning',
    role: 'Machine Learning Engineer',
    type: 'Technical',
    difficulty: 'Advanced',
    playbook: 'google',
    mode: 'text',
    persona: 'julian',
    questions: 5,
    tag: 'Production ML',
    desc: 'Feature engineering, drift monitoring, latency-sensitive serving & LLM evaluation.',
    sampleJD: "Job Role: Machine Learning Engineer (3+ yrs)\nRequired Skills: Python, PyTorch/TensorFlow, model training pipelines, MLOps, latency optimization, RAG retrieval architecture, and production inference deployment."
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
    difficulty: 'Advanced',
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
    const escaped = k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
  });
}

const POPULAR_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Developer',
  'Machine Learning Engineer',
  'Data Scientist',
  'DevOps Engineer',
  'Mobile Developer'
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setup, updateSetup } = useInterview();

  const [selectedPreset, setSelectedPreset] = useState(null);

  const [targetRole, setTargetRole] = useState(user?.targetRole || user?.role || setup.targetRole || 'Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState(setup.interviewType || 'Technical');
  const [companyPlaybook, setCompanyPlaybook] = useState(setup.companyPlaybook || 'general');
  const [difficulty, setDifficulty] = useState(setup.difficulty || 'Beginner');
  const [interviewMode, setInterviewMode] = useState(setup.interviewMode || 'text');
  const [interviewerPersona, setInterviewerPersona] = useState(setup.interviewerPersona || 'julian');
  const [resumeName, setResumeName] = useState(setup.resumeFileName || 'Candidate_Resume.pdf');
  const [resumeError, setResumeError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState(setup.jobDescription || '');
  const [totalQuestions, setTotalQuestions] = useState(setup.totalQuestions || 5);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [peerHostRole, setPeerHostRole] = useState('interviewer');
  const [peerJoinRole, setPeerJoinRole] = useState('candidate');

  const detectedTech = useMemo(() => extractDetectedTech(jobDescription), [jobDescription]);

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setTargetRole(preset.role);
    setCustomRole('');
    setInterviewType(preset.type);
    setDifficulty(preset.difficulty === 'Senior' ? 'Advanced' : preset.difficulty);
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
    if (sample.role && (!targetRole || targetRole === 'Software Engineer')) {
      setTargetRole(sample.role);
    }
    if (sample.difficulty) {
      setDifficulty(sample.difficulty);
    }
  };

  const handleAddKeywordToJD = (tech) => {
    setJobDescription((prev) => {
      const trimmed = (prev || '').trim();
      if (!trimmed) return `Required skills and technologies: ${tech}`;
      if (trimmed.toLowerCase().includes(tech.toLowerCase())) return prev;
      return `${trimmed}\n- Key technology requirement: ${tech}`;
    });
  };

  const handleResumeFile = (file) => {
    if (!file) return;
    setResumeError('');
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));
    if (!isValid) {
      setResumeError('Please upload a PDF, Word (.doc, .docx), or text document.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('File size exceeds the 10MB limit.');
      return;
    }
    setResumeName(file.name);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleResumeFile(e.target.files[0]);
    }
  };

  const handleContinue = async () => {
    const finalRole = targetRole === 'Custom' ? (customRole.trim() || 'Software Engineer') : targetRole;
    updateSetup({
      targetRole: finalRole,
      interviewType,
      difficulty,
      companyPlaybook,
      interviewMode,
      interviewerPersona,
      resumeFileName: resumeName,
      jobDescription: jobDescription.trim(),
      totalQuestions
    });
    if (user?.id) {
      profileApi.updateProfile({ target_role: finalRole, role: finalRole }, user.id).catch(() => {});
    }

    if (interviewMode === 'peer_chamber') {
      try {
        const res = await reverseInterviewApi.createPeerRoom(finalRole, difficulty, interviewType);
        navigate(`/peer-room/${res.room_id}?role=${peerHostRole}`);
        return;
      } catch (_err) {
        navigate(`/peer-room?role=${peerHostRole}`);
        return;
      }
    }

    if (interviewMode === 'reverse_mock') {
      navigate('/mock-interview');
      return;
    }

    navigate('/interview-ready');
  };

  const handleJoinExistingRoom = () => {
    if (!joinRoomCode.trim()) return;
    let clean = joinRoomCode.trim().toUpperCase();
    if (!clean.startsWith('PEER-') && !clean.startsWith('ROOM-')) {
      clean = `PEER-${clean}`;
    }
    navigate(`/peer-room/${clean}?role=${peerJoinRole}`);
  };

  // Dropdown options
  const roleDropdownOptions = [
    ...MOCK_ROLES.map(r => ({ value: r, label: r })),
    { value: 'Custom', label: '+ Other / Custom Target Role...' }
  ];

  const difficultyDropdownOptions = [
    { value: 'Beginner', label: 'Beginner (Campus / Junior 0-2 Yrs)', badge: 'Easy' },
    { value: 'Intermediate', label: 'Intermediate (Mid-Level 2-4 Yrs)', badge: 'Medium' },
    { value: 'Advanced', label: 'Advanced (Senior 4+ Yrs)', badge: 'Hard' }
  ];

  const interviewTypeDropdownOptions = [
    { value: 'Technical', label: 'Technical & Coding' },
    { value: 'System Design', label: 'System Design' },
    { value: 'Behavioral', label: 'STAR Behavioral & Leadership' }
  ];

  const deliveryModeDropdownOptions = [
    { value: 'text', label: 'Written & Coding Sandbox Mode' },
    { value: 'video', label: 'Video AI Mock Interview' },
    { value: 'face_to_face', label: 'Face-to-Face AI Mode' },
    { value: 'peer_chamber', label: 'Peer Collaborative Chamber' },
    { value: 'reverse_mock', label: 'Reverse Mock Interview' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* PAGE HEADER */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Configure Interview Practice
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize each dimension of your mock interview loop. Our AI models calibrate question complexity, tech stacks, and grading rubrics accordingly.
        </p>
      </div>

      <div className="space-y-6">

        {/* ------------------------------------------------------------- */}
        {/* DIVISION 1: 1-CLICK PRACTICE PRESETS                          */}
        {/* ------------------------------------------------------------- */}
        <GlassCard className="p-5 sm:p-6 space-y-3.5 border-l-4 border-l-emerald-600 bg-white shadow-xs rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>1-Click Practice Presets</span>
                  <Badge variant="emerald" size="xs">RECOMMENDED</Badge>
                </h3>
                <p className="text-xs text-slate-500">Pick an industry-calibrated role preset to pre-fill all configuration settings</p>
              </div>
            </div>
            {selectedPreset && (
              <button
                type="button"
                onClick={handleContinue}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
              >
                <span>Launch Selected Preset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {FAST_PRESETS.map((p) => {
              const isSelected = selectedPreset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-emerald-400 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-700">{p.tag}</span>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{p.desc}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="font-semibold text-emerald-700">{p.difficulty}</span>
                    <span>{p.questions} Qs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* ------------------------------------------------------------- */}
        {/* DIVISION 2: TARGET CAREER ROLE (SEPARATE DIVISION)             */}
        {/* ------------------------------------------------------------- */}
        <GlassCard className="p-5 sm:p-6 space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">1. Target Career Role</h3>
              <p className="text-xs text-slate-500">Specifies the exact job role to calibrate coding questions, frameworks, and rubrics</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <SelectDropdown
              label="Select Target Job Title"
              value={MOCK_ROLES.includes(targetRole) ? targetRole : 'Custom'}
              onChange={(val) => {
                if (val === 'Custom') {
                  setTargetRole('Custom');
                  if (!customRole) setCustomRole(!MOCK_ROLES.includes(targetRole) ? targetRole : '');
                } else {
                  setTargetRole(val);
                  setCustomRole('');
                }
              }}
              options={roleDropdownOptions}
              icon={Target}
              isCustom={targetRole === 'Custom' || !MOCK_ROLES.includes(targetRole)}
              customValue={targetRole === 'Custom' ? customRole : targetRole}
              onCustomChange={(val) => {
                setTargetRole('Custom');
                setCustomRole(val);
              }}
              customPlaceholder="e.g. Senior iOS Engineer, DevSecOps Specialist, Product Engineer..."
              helperText="Our AI engine retrieves role-specific syllabus topics and technical competencies tailored to this role."
            />

            {/* Quick-Select Role Pills */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Popular Target Roles (Click to select):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ROLES.map((r) => {
                  const isCurrent = targetRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setTargetRole(r);
                        setCustomRole('');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 hover:bg-emerald-50/60 border-slate-200 text-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ------------------------------------------------------------- */}
        {/* DIVISION 3: SENIORITY & DIFFICULTY LEVEL (SEPARATE DIVISION)    */}
        {/* ------------------------------------------------------------- */}
        <GlassCard className="p-5 sm:p-6 space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">2. Seniority &amp; Experience Level</h3>
              <p className="text-xs text-slate-500">Controls the depth of expected engineering answers, trade-offs, and evaluation rigor</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Interactive Radio Cards for Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RadioCard
                selected={difficulty === 'Beginner'}
                onClick={() => setDifficulty('Beginner')}
                title="Beginner / Campus"
                badge="0-2 Yrs • Easy"
                badgeColor="emerald"
                description="Direct logic, core programming syntax, basic debugging, and foundational data structures."
                meta={<span>Score on clarity &amp; core correctness</span>}
              />
              <RadioCard
                selected={difficulty === 'Intermediate'}
                onClick={() => setDifficulty('Intermediate')}
                title="Intermediate"
                badge="2-4 Yrs • Medium"
                badgeColor="amber"
                description="Component architecture, concurrency, database indexing, caching strategies &amp; API resilience."
                meta={<span>Score on trade-offs &amp; incident triage</span>}
              />
              <RadioCard
                selected={difficulty === 'Advanced'}
                onClick={() => setDifficulty('Advanced')}
                title="Senior / Staff"
                badge="4+ Yrs • Hard"
                badgeColor="rose"
                description="High-throughput distributed systems, CAP/PACELC trade-offs, Kafka streaming &amp; p99 latency SLAs."
                meta={<span>Score on massive scale &amp; failure modes</span>}
              />
            </div>

            {/* Dropdown Alternative */}
            <SelectDropdown
              label="Or choose from Difficulty Menu"
              value={difficulty}
              onChange={setDifficulty}
              options={difficultyDropdownOptions}
              icon={TrendingUp}
              helperText="Level calibration ensures beginners receive foundational questions, while seniors are challenged with complex architecture."
            />
          </div>
        </GlassCard>

        {/* ------------------------------------------------------------- */}
        {/* DIVISION 4: INTERVIEW FOCUS AREA (SEPARATE DIVISION)          */}
        {/* ------------------------------------------------------------- */}
        <GlassCard className="p-5 sm:p-6 space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">3. Interview Focus Area</h3>
              <p className="text-xs text-slate-500">Dictates whether questions focus on algorithmic coding, distributed architecture, or leadership</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Interactive Radio Cards for Focus Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <RadioCard
                selected={interviewType === 'Technical'}
                onClick={() => setInterviewType('Technical')}
                title="Technical & Coding"
                badge="Algorithms & DSA"
                badgeColor="sky"
                icon={Code2}
                description="Algorithmic problem-solving, data structures, runtime space/time complexity, and clean code."
              />
              <RadioCard
                selected={interviewType === 'System Design'}
                onClick={() => setInterviewType('System Design')}
                title="System Design"
                badge="Architecture & Scale"
                badgeColor="sky"
                icon={Layers}
                description="Distributed microservices, database schemas, Redis caching, message queues, and high availability."
              />
              <RadioCard
                selected={interviewType === 'Behavioral'}
                onClick={() => setInterviewType('Behavioral')}
                title="STAR Behavioral"
                badge="Leadership & Impact"
                badgeColor="sky"
                icon={Briefcase}
                description="Real-world STAR stories, conflict resolution, technical trade-off decisions, and cross-team leadership."
              />
            </div>

            <SelectDropdown
              label="Or choose Focus Area from Menu"
              value={interviewType}
              onChange={setInterviewType}
              options={interviewTypeDropdownOptions}
              icon={Layers}
              helperText="Focus area determines syllabus chunking and technical rubric weights for your session."
            />
          </div>
        </GlassCard>

        {/* ------------------------------------------------------------- */}
        {/* DIVISION 5: INTERVIEW DELIVERY MODE (SEPARATE DIVISION)        */}
        {/* ------------------------------------------------------------- */}
        <GlassCard className="p-5 sm:p-6 space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">4. Interview Delivery Mode</h3>
              <p className="text-xs text-slate-500">Choose your practice modality: solo coding sandbox, multimodal video, live peer room, or reverse mock</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Interactive Radio Cards for Delivery Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <RadioCard
                selected={interviewMode === 'text'}
                onClick={() => setInterviewMode('text')}
                title="Written & Coding Sandbox"
                badge="Code Editor"
                badgeColor="emerald"
                icon={Code2}
                description="In-browser code editor with test execution, syntax highlighting, and written answer submissions."
              />
              <RadioCard
                selected={interviewMode === 'video'}
                onClick={() => setInterviewMode('video')}
                title="Video AI Mock Interview"
                badge="Camera & Voice AI"
                badgeColor="sky"
                icon={Video}
                description="Realistic video mock interview with real-time camera feed, speech pace, and vocal presence feedback."
              />
              <RadioCard
                selected={interviewMode === 'face_to_face'}
                onClick={() => setInterviewMode('face_to_face')}
                title="Face-to-Face AI Mode"
                badge="Live Conversational"
                badgeColor="sky"
                icon={Sparkles}
                description="Low-latency conversational interview simulating an authentic conversational interview room."
              />
              <RadioCard
                selected={interviewMode === 'peer_chamber'}
                onClick={() => setInterviewMode('peer_chamber')}
                title="Peer Collaborative Chamber"
                badge="WebRTC Peer-to-Peer"
                badgeColor="emerald"
                icon={Users}
                description="Practice live with a classmate. Live code editor, video call, and AI teleprompter hints."
              />
              <RadioCard
                selected={interviewMode === 'reverse_mock'}
                onClick={() => setInterviewMode('reverse_mock')}
                title="Reverse Mock Interview"
                badge="Tech Lead Mode"
                badgeColor="amber"
                icon={UserCheck}
                description="You act as the interviewer evaluating AI applicant Alex Rivera on algorithmic trade-offs."
              />
            </div>

            <SelectDropdown
              label="Or choose Mode from Menu"
              value={interviewMode}
              onChange={setInterviewMode}
              options={deliveryModeDropdownOptions}
              icon={Video}
              helperText="Choose how you want to conduct the interview: solo against AI, live with a classmate, or as the lead interviewer."
            />

            {/* Peer-to-Peer Chamber Sub-Card */}
            {interviewMode === 'peer_chamber' && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">Peer-to-Peer Collaborative Chamber</span>
                  </div>
                  <Badge variant="emerald" size="xs">100% FREE WEBRTC</Badge>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Practice with a classmate! You can host as the Interviewer (with AI teleprompter &amp; rubric) or as the Candidate (collaborative coding &amp; speaking). Both enter the chamber together with a synchronized timer.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Host a New Peer Room */}
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Option 1: Host New Room
                    </span>
                    <div className="text-[11px] text-slate-600 font-medium">Select your role as host:</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPeerHostRole('interviewer')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          peerHostRole === 'interviewer'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Interviewer
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeerHostRole('candidate')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          peerHostRole === 'candidate'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Candidate
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs mt-1"
                    >
                      <span>Host Room ({peerHostRole === 'interviewer' ? 'As Interviewer' : 'As Candidate'})</span>
                    </button>
                  </div>

                  {/* Option 2: Join via Room Code */}
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Option 2: Join with Room Code
                    </span>
                    <div className="text-[11px] text-slate-600 font-medium">Select your joining role:</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPeerJoinRole('candidate')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          peerJoinRole === 'candidate'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Candidate
                      </button>
                      <button
                        type="button"
                        onClick={() => setPeerJoinRole('interviewer')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          peerJoinRole === 'interviewer'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Interviewer
                      </button>
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <input
                        type="text"
                        value={joinRoomCode}
                        onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                        placeholder="e.g. PEER-XXXXXX"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleJoinExistingRoom}
                        disabled={!joinRoomCode.trim()}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reverse Mock Coaching Explanation */}
            {interviewMode === 'reverse_mock' && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950">Reverse Mock Interview (Be The Interviewer)</span>
                  </div>
                  <Badge variant="amber" size="xs">TECH LEAD MODE</Badge>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  You take the interviewer seat and evaluate AI applicant <strong>Alex Rivera</strong>. Challenge Alex on algorithmic complexity, spot naive solutions, and provide constructive guidance. Your interviewing and leadership skills will be graded at session end.
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* ------------------------------------------------------------- */}
        {/* DIVISION 6: TARGET JOB DESCRIPTION & TECH STACK (SEPARATE)    */}
        {/* ------------------------------------------------------------- */}
        <GlassCard className="p-5 sm:p-6 space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">5. Target Job Description &amp; Tech Stack Context</h3>
                <p className="text-xs text-slate-500">Paste job requirements or pick a pre-calibrated sample to ground your questions</p>
              </div>
            </div>
            {jobDescription && (
              <button
                type="button"
                onClick={() => setJobDescription('')}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <X className="w-3 h-3" />
                Clear JD
              </button>
            )}
          </div>

          <div className="space-y-3 pt-1">
            {/* Preset JDs Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-600 block">
                1-Click Sample Job Description Templates:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_JDS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleApplySampleJD(sample)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left text-xs text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="font-medium">{sample.title}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white text-slate-500 border border-slate-200">
                      {sample.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste key responsibilities, required skills (e.g. React, JavaScript, SQL, Python), or raw Job Description text here..."
              rows={3}
              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors resize-none font-sans leading-relaxed"
            />

            {/* Detected Tech Stack */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Code2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Detected Competencies Grounded from JD:</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {detectedTech.length} skill{detectedTech.length === 1 ? '' : 's'} identified
                </span>
              </div>

              {detectedTech.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detectedTech.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium font-mono"
                    >
                      <span>{tech}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No specific keywords detected yet. Paste a JD or click a template above, or use quick add chips below:
                </p>
              )}

              {/* Quick Add Chips */}
              <div className="pt-1.5 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-slate-500 font-medium">Quick Add to JD:</span>
                {['React', 'JavaScript', 'Python', 'SQL', 'FastAPI', 'DSA', 'REST APIs', 'Git'].map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => handleAddKeywordToJD(tech)}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-emerald-50 border border-slate-200 text-slate-700 font-mono transition-colors cursor-pointer"
                  >
                    + {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ------------------------------------------------------------- */}
        {/* DIVISION 7: SESSION VOLUME & RESUME DOCUMENT (SEPARATE)       */}
        {/* ------------------------------------------------------------- */}
        <GlassCard className="p-5 sm:p-6 space-y-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">6. Session Volume &amp; Resume Document</h3>
              <p className="text-xs text-slate-500">Configure round length and optionally attach your resume for personalized questions</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Question Volume Radio Cards */}
            <div>
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                Interview Length (Question Count)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <RadioCard
                  selected={totalQuestions === 3}
                  onClick={() => setTotalQuestions(3)}
                  title="Quick Screening"
                  badge="3 Questions"
                  badgeColor="emerald"
                  description="Fast 10-15 minute focused screening to quickly check core competency."
                />
                <RadioCard
                  selected={totalQuestions === 5}
                  onClick={() => setTotalQuestions(5)}
                  title="Standard Round"
                  badge="5 Questions • Recommended"
                  badgeColor="emerald"
                  description="Complete 20-30 minute interview with balanced depth and adaptive branching."
                />
                <RadioCard
                  selected={totalQuestions === 8}
                  onClick={() => setTotalQuestions(8)}
                  title="Comprehensive Drill"
                  badge="8 Questions"
                  badgeColor="sky"
                  description="Exhaustive 40-50 minute deep drill for thorough seniority assessment."
                />
              </div>
            </div>

            {/* Resume Upload Box */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                Resume Attachment (Optional)
              </span>
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
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  isDragging ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 bg-slate-50/60'
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
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-700 mb-2">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">Select or drag resume document</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">PDF or Word document up to 10MB</p>
                </label>
                {resumeError && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 text-left">
                    {resumeError}
                  </div>
                )}
                {resumeName && !resumeError && (
                  <div className="mt-3 p-2 rounded-lg bg-white border border-emerald-200 flex items-center justify-center gap-2 text-xs text-emerald-800 font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{resumeName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          Cancel &amp; Return to Dashboard
        </button>

        <button
          type="button"
          onClick={handleContinue}
          className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
        >
          <span>Start Interview Practice</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
