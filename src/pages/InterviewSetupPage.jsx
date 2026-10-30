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
  Clock
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import SelectDropdown from '../components/SelectDropdown';
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
    difficulty: 'Advanced',
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
    difficulty: 'Advanced',
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
    difficulty: 'Advanced',
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
    if (sample.role) {
      setTargetRole(sample.role);
      setCustomRole('');
    }
    if (sample.difficulty) {
      setDifficulty(sample.difficulty === 'Senior' ? 'Advanced' : sample.difficulty);
    }
  };

  const handleAddKeywordToJD = (keyword) => {
    setJobDescription(prev => {
      if (!prev.trim()) return `Required Skills: ${keyword}`;
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(prev)) return prev;
      return `${prev.trim()}, ${keyword}`;
    });
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

  const handleContinue = async () => {
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

  // Predefined role dropdown options
  const roleDropdownOptions = [
    ...MOCK_ROLES.map(r => ({ value: r, label: r })),
    { value: 'Custom', label: '+ Other / Custom Target Role...' }
  ];

  // Unified dropdown options replacing cluttered multiple-selection box lists
  const difficultyDropdownOptions = [
    { value: 'Beginner', label: 'Beginner (Campus / Junior 0-2 Yrs) — Direct logic, core syntax & foundational concepts' },
    { value: 'Intermediate', label: 'Intermediate (Mid-Level 2-4 Yrs) — Component architecture, algorithmic trade-offs & optimization' },
    { value: 'Advanced', label: 'Advanced (Senior 4+ Yrs) — Distributed scalability, high-concurrency locking & architectural trade-offs' }
  ];

  const interviewTypeDropdownOptions = [
    { value: 'Technical', label: 'Technical & Coding (Algorithms, Data Structures & Clean Code)' },
    { value: 'System Design', label: 'System Design (Microservices, Caching, Databases & Distributed SLAs)' },
    { value: 'Behavioral', label: 'STAR Behavioral & Leadership (Conflict Resolution, Cross-Functional Ownership)' }
  ];

  const deliveryModeDropdownOptions = [
    { value: 'text', label: '📝 Written Text & Code Sandbox (Draft answers with live compiler & real-time rubrics)' },
    { value: 'video', label: '📹 Video AI Mock (Webcam & AI speech pacing analysis)' },
    { value: 'face_to_face', label: '👤 Face-to-Face AI (Split-screen video call with speaking avatar)' },
    { value: 'peer_chamber', label: '👥 Peer Collaborative Chamber (2-Person live WebRTC video with AI proctor)' },
    { value: 'reverse_mock', label: '🎓 Reverse Mock Interview (You interview AI applicant Alex Rivera)' }
  ];

  const questionVolumeDropdownOptions = [
    { value: 5, label: 'Concise (5 Questions — ~15 Mins quick calibrated session)' },
    { value: 10, label: 'Exhaustive (10 Questions — ~30 Mins comprehensive drill)' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans text-slate-900">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER                                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="navy" size="sm">STAGE 1 OF 3</Badge>
          <span className="text-xs font-mono font-bold tracking-wider text-indigo-700 uppercase">
            CALIBRATION &amp; SETUP
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Customize Your Interview Session
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Configure target role, difficulty level, and optional Job Description to calibrate questions to your exact seniority.
        </p>
      </div>

      <div className="space-y-6">

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 1. 1-CLICK PRACTICE PRESETS (KEPT AS DISCOVERY CARDS)         */}
        {/* ───────────────────────────────────────────────────────────── */}
        <GlassCard className="p-5 sm:p-6 space-y-3.5 border-l-4 border-l-indigo-600 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>1-Click Practice Presets</span>
                  <Badge variant="navy" size="xs">RECOMMENDED</Badge>
                </h3>
                <p className="text-xs text-slate-500">Select an industry-calibrated template to configure all knobs in one click</p>
              </div>
            </div>
            {selectedPreset && (
              <button
                type="button"
                onClick={handleContinue}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
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
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 hover:border-indigo-400 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-mono font-bold text-indigo-700">{p.tag}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{p.desc}</p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="font-semibold text-indigo-700">{p.difficulty}</span>
                    <span>{p.questions} Qs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 2. CORE CALIBRATION CONTROLS (HIGH-DENSITY COMPACT FORM)       */}
        {/* ───────────────────────────────────────────────────────────── */}
        <GlassCard className="p-5 sm:p-6 space-y-5 bg-white shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Core Calibration &amp; Parameters</h3>
              <p className="text-xs text-slate-500">Fine-tune target role, seniority level, topic focus, and delivery mode</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Target Role Dropdown with Custom Input Extension */}
            <SelectDropdown
              label="I. Target Job Role"
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
              customPlaceholder="e.g. Senior iOS Engineer, DevSecOps Specialist, Product Manager..."
              helperText="Our Gemini AI models calibrate question complexity, tech stacks, and grading rubrics according to this role."
            />

            {/* Seniority & Difficulty Level Dropdown */}
            <SelectDropdown
              label="II. Seniority & Difficulty Level"
              value={difficulty}
              onChange={setDifficulty}
              options={difficultyDropdownOptions}
              icon={TrendingUp}
              helperText="Calibrates the interview bar-raiser expectations and evaluation rigor."
            />

            {/* Interview Focus Area Dropdown */}
            <SelectDropdown
              label="III. Interview Focus Area"
              value={interviewType}
              onChange={setInterviewType}
              options={interviewTypeDropdownOptions}
              icon={Layers}
              helperText="Dictates whether questions focus on algorithmic coding, distributed architecture, or behavioral leadership."
            />

            {/* Interview Delivery Mode Dropdown */}
            <div className="space-y-2">
              <SelectDropdown
                label="IV. Delivery Mode"
                value={interviewMode}
                onChange={setInterviewMode}
                options={deliveryModeDropdownOptions}
                icon={Video}
                helperText="Choose how you want to conduct the interview: solo against AI, live with a classmate, or as the lead interviewer."
              />

              {interviewMode === 'peer_chamber' && (
                <div className="mt-3 p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-950">Peer-to-Peer Collaborative Chamber</span>
                    </div>
                    <Badge variant="indigo" size="xs">100% FREE WEBRTC</Badge>
                  </div>
                  <p className="text-xs text-indigo-900 leading-relaxed">
                    Practice with a classmate! You can host as the Interviewer (with AI teleprompter &amp; rubric) or as the Candidate (collaborative coding &amp; speaking). Both enter the chamber together with a synchronized timer.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Option 1: Host a New Peer Room */}
                    <div className="p-3 rounded-lg bg-white/80 border border-indigo-200/80 space-y-2">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Option 1: Host New Room
                      </span>
                      <div className="text-[11px] text-slate-600 font-medium">Select your role as host:</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPeerHostRole('interviewer')}
                          className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                            peerHostRole === 'interviewer'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🎙️ Interviewer
                        </button>
                        <button
                          type="button"
                          onClick={() => setPeerHostRole('candidate')}
                          className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                            peerHostRole === 'candidate'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🎯 Candidate
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs mt-1"
                      >
                        <span>Host Room ({peerHostRole === 'interviewer' ? 'As Interviewer' : 'As Candidate'})</span>
                      </button>
                    </div>

                    {/* Option 2: Join via Room Code */}
                    <div className="p-3 rounded-lg bg-white/80 border border-indigo-200/80 space-y-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        Option 2: Join with Room Code
                      </span>
                      <div className="text-[11px] text-slate-600 font-medium">Select your joining role:</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPeerJoinRole('candidate')}
                          className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                            peerJoinRole === 'candidate'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🎯 Candidate
                        </button>
                        <button
                          type="button"
                          onClick={() => setPeerJoinRole('interviewer')}
                          className={`flex-1 py-1 px-2 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                            peerJoinRole === 'interviewer'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          🎙️ Interviewer
                        </button>
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        <input
                          type="text"
                          value={joinRoomCode}
                          onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                          placeholder="e.g. PEER-XXXXXX or code"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleJoinExistingRoom}
                          disabled={!joinRoomCode.trim()}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {interviewMode === 'reverse_mock' && (
                <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
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
          </div>
        </GlassCard>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 3. JOB DESCRIPTION & TARGET TECH STACK (CALIBRATION HUB)     */}
        {/* ───────────────────────────────────────────────────────────── */}
        <GlassCard className="p-5 sm:p-6 space-y-4 border-l-4 border-l-emerald-600 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Job Description &amp; Target Tech Stack</span>
                  <Badge variant="emerald" size="xs">CALIBRATION HUB</Badge>
                </h3>
                <p className="text-xs text-slate-500">
                  Paste your target JD or click a sample to ground interview questions directly to your expected seniority
                </p>
              </div>
            </div>
            {jobDescription && (
              <button
                type="button"
                onClick={() => setJobDescription('')}
                className="text-[11px] font-mono text-rose-600 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear JD</span>
              </button>
            )}
          </div>

          {/* 1-Click Sample JD Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                1-Click Sample JD Presets:
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">Click to populate &amp; calibrate</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_JDS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleApplySampleJD(sample)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left text-xs text-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
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

          {/* Job Description Textarea */}
          <div className="space-y-2">
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste key responsibilities, required skills (e.g. React, JavaScript, SQL, Python), or raw Job Description text here..."
              rows={3}
              className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors resize-none font-sans leading-relaxed"
            />

            {/* Detected Tech Stack & Grounding Feedback */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Code2 className="w-3.5 h-3.5 text-indigo-600" />
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
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-medium font-mono"
                    >
                      <span>{tech}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  No specific keywords detected yet. Paste a JD or click a preset above, or click suggested chips below to ground:
                </p>
              )}

              {/* Quick Tech Chip Inserters */}
              <div className="pt-1.5 border-t border-slate-200/80 flex items-center gap-1.5 flex-wrap text-[10px]">
                <span className="text-slate-500 font-medium">Quick Add to JD:</span>
                {['React', 'JavaScript', 'Python', 'SQL', 'FastAPI', 'DSA', 'REST APIs', 'Git'].map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => handleAddKeywordToJD(tech)}
                    className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 font-mono transition-colors cursor-pointer"
                  >
                    + {tech}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* 4. ADVANCED OPTIONS ACCORDION                                 */}
        {/* ───────────────────────────────────────────────────────────── */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-indigo-700 flex items-center justify-between transition-all cursor-pointer shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span>
                {showAdvanced
                  ? 'Hide Advanced Customization Options'
                  : 'Show Advanced Options (Employer Playbook, Question Volume, Resume Document)'}
              </span>
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-5 pt-1 animate-in fade-in duration-200">
            {/* Company Playbook Dropdown */}
            <GlassCard className="p-5 sm:p-6 space-y-4 bg-white shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Target Employer Interview Playbook</h3>
                  <p className="text-xs text-slate-500">Align evaluation questions and rubric grading to specific corporate hiring bars</p>
                </div>
              </div>

              <SelectDropdown
                label="Employer Evaluation Framework"
                value={companyPlaybook}
                onChange={setCompanyPlaybook}
                options={COMPANY_PLAYBOOKS.map(p => ({
                  value: p.id,
                  label: `${p.shortName} — ${p.tagline}`,
                  badge: p.badge
                }))}
                icon={Briefcase}
                helperText={COMPANY_PLAYBOOKS.find(p => p.id === companyPlaybook)?.description}
              />
            </GlassCard>

            {/* Session Length / Question Volume (SegmentedControl) */}
            <GlassCard className="p-5 sm:p-6 space-y-4 bg-white shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Session Length &amp; Question Volume</h3>
                  <p className="text-xs text-slate-500">Target questions for this calibrated practice session</p>
                </div>
              </div>

              <SelectDropdown
                label="Question Volume"
                value={totalQuestions}
                onChange={(val) => setTotalQuestions(Number(val))}
                options={questionVolumeDropdownOptions}
                icon={Clock}
                helperText="Quick calibrated session or exhaustive technical drill."
              />
            </GlassCard>

            {/* Resume File Upload Dropzone */}
            <GlassCard className="p-5 sm:p-6 space-y-4 bg-white shadow-xs">
              <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Resume Document Attachment</h3>
                  <p className="text-xs text-slate-500">Tailor oral questions to your verified past projects and work experience</p>
                </div>
              </div>

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
                  isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/60'
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-2">
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
                  <div className="mt-3 p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-center gap-2 text-xs text-indigo-700 font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate">{resumeName}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FOOTER NAVIGATION                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Cancel &amp; Return to Dashboard
        </button>

        <GradientButton
          variant="primary"
          size="lg"
          onClick={handleContinue}
          icon={ArrowRight}
          className="px-8 text-sm cursor-pointer shadow-md shadow-indigo-500/20"
        >
          Start Interview Practice →
        </GradientButton>
      </div>

    </div>
  );
}
