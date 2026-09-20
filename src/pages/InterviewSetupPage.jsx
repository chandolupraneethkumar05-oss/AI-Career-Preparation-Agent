import React, { useState } from 'react';
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
  Award,
  Sparkles,
  Users
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { MOCK_ROLES, INTERVIEW_TYPES, DIFFICULTY_LEVELS } from '../data/mockData';
import { COMPANY_PLAYBOOKS } from '../data/companyPlaybooks';
import { INTERVIEWER_PERSONAS } from '../data/interviewerPersonas';
import { useInterview } from '../context/InterviewContext';

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { setup, updateSetup } = useInterview();

  const [targetRole, setTargetRole] = useState(setup.targetRole || 'Machine Learning Engineer');
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState(setup.interviewType || 'Technical');
  const [companyPlaybook, setCompanyPlaybook] = useState(setup.companyPlaybook || 'general');
  const [difficulty, setDifficulty] = useState(setup.difficulty || 'Intermediate');
  const [interviewMode, setInterviewMode] = useState(setup.interviewMode || 'text');
  const [interviewerPersona, setInterviewerPersona] = useState(setup.interviewerPersona || 'julian');
  const [resumeName, setResumeName] = useState(setup.resumeFileName || 'Candidate_Resume.pdf');
  const [jobDescription, setJobDescription] = useState(setup.jobDescription || '');
  const [interviewLanguage, setInterviewLanguage] = useState(setup.interviewLanguage || 'en');
  const [feedbackLanguage, setFeedbackLanguage] = useState(setup.feedbackLanguage || 'en');
  const [totalQuestions, setTotalQuestions] = useState(setup.totalQuestions || 5);

  const handleRoleSelect = (role) => {
    setTargetRole(role);
    if (role !== 'Custom') {
      setCustomRole('');
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeName(e.target.files[0].name);
    }
  };

  const handleContinue = () => {
    const finalRole = targetRole === 'Custom' && customRole.trim() ? customRole : targetRole;
    updateSetup({
      targetRole: finalRole,
      interviewType,
      companyPlaybook,
      difficulty,
      interviewMode,
      interviewerPersona,
      resumeFileName: resumeName,
      jobDescription,
      interviewLanguage,
      feedbackLanguage,
      totalQuestions
    });
    navigate('/interview-ready');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 font-sans text-[#1F1B16]">
      {/* Header */}
      <div className="border-b border-[#E5E0D5] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="navy" size="sm">STAGE 1 OF 3</Badge>
          <span className="editorial-overline">INTERVIEW SETUP</span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Customize Your Interview
        </h1>
        <p className="text-sm text-[#70685E] mt-1">
          Choose your target role, interview type, difficulty level, and practice preferences.
        </p>
      </div>

      <div className="space-y-6">
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
                  p-3 rounded-md border text-left transition-all text-xs font-semibold
                  ${targetRole === role
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs'
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
          </div>
        </GlassCard>

        {/* 2. Interview Type Selection */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#8C6E54]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">II. Interview Focus Type</h3>
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
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs'
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

        {/* 3. Company Playbook / Rubric Calibration */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">III. Target Employer Interview Playbook</h3>
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
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs'
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

        {/* 4. Interview Mode Selection */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#FDF2E9] border border-[#F0D5C0] flex items-center justify-center text-[#9A421A]">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">IV. Interview Mode</h3>
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

            {/* Face-to-Face AI Chamber (Special) */}
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
                    <span className="text-sm font-serif font-bold text-[#1F1B16]">Face-to-Face Interview</span>
                  </div>
                  {interviewMode === 'face_to_face' && <CheckCircle2 className="w-4 h-4 text-[#235E3B]" />}
                </div>
                <p className="text-xs text-[#70685E] leading-relaxed mt-2">
                  Live split-screen call with an interactive AI interviewer who speaks aloud and listens to your verbal responses.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E5E0D5] flex items-center justify-between">
                <Badge variant="emerald" size="xs">INTERACTIVE AVATAR</Badge>
                <span className="text-[10px] font-bold text-[#235E3B] uppercase tracking-wider">Flagship</span>
              </div>
            </div>
          </div>

          {/* Interviewer Persona Selection (Only in Face-to-Face Mode) */}
          {interviewMode === 'face_to_face' && (
            <div className="mt-4 p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C6E54]" />
                  <span>Choose AI Lead Interviewer Persona</span>
                </label>
                <span className="editorial-overline text-[10px]">AI INTERVIEWER</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {INTERVIEWER_PERSONAS.map((p) => {
                  const isSelected = interviewerPersona === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setInterviewerPersona(p.id)}
                      className={`p-3.5 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#FFFDF9] border-[#1A365D] shadow-xs ring-1 ring-[#1A365D]'
                          : 'bg-white border-[#E5E0D5] hover:border-[#1A365D]/50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="w-7 h-7 rounded bg-[#1B2A4A] text-white flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                            {p.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1A365D]" />}
                        </div>
                        <div>
                          <h4 className="font-serif text-xs font-bold text-[#1F1B16]">{p.name}</h4>
                          <p className="text-[10px] text-[#70685E] font-medium">{p.title}</p>
                        </div>
                        <p className="text-[11px] text-[#70685E] leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[#E5E0D5]">
                        <Badge variant={p.badgeVariant} size="xs" className="text-[9px]">
                          {p.archetype}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center gap-2 text-xs text-[#70685E]">
            <Shield className="w-4 h-4 text-[#1A365D] shrink-0" />
            <span>Data Privacy: Video and audio recordings stay local to your session. You can review or delete session records at any time.</span>
          </div>
        </GlassCard>

        {/* 5. Difficulty Level */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] flex items-center justify-center text-[#235E3B]">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">V. Difficulty Level</h3>
              <p className="text-xs text-[#70685E]">Choose how challenging the questions and evaluations will be</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {DIFFICULTY_LEVELS.map((diff) => (
              <div
                key={diff.id}
                onClick={() => setDifficulty(diff.id)}
                className={`
                  p-4 rounded-md border cursor-pointer transition-all text-center
                  ${difficulty === diff.id
                    ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1F1B16] shadow-xs'
                    : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#3B352E] hover:border-[#1A365D]'
                  }
                `}
              >
                <span className="text-sm font-serif font-bold text-[#1F1B16] block mb-1">{diff.label}</span>
                <p className="text-[11px] text-[#70685E]">{diff.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 6. Resume & Job Description (Optional context) */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#8C6E54]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">VI. Resume &amp; Job Description (Optional)</h3>
              <p className="text-xs text-[#70685E]">Upload your resume or paste job requirements to tailor questions to your background</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Resume Upload UI */}
            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Resume File</label>
              <div className="border border-dashed border-[#E5E0D5] hover:border-[#1A365D] rounded-md p-4 text-center transition-all bg-[#FAF8F3]">
                <input
                  type="file"
                  id="resumeUpload"
                  accept=".pdf,.doc,.docx"
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
                {resumeName && (
                  <div className="mt-3 p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-center justify-center gap-2 text-xs text-[#1A365D] font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-[#235E3B]" />
                    <span className="truncate">{resumeName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description Textarea */}
            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Job Description / Competency List</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities, required tech stack, or employer rubrics..."
                rows={4}
                className="w-full p-3 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-xs text-[#1F1B16] placeholder-[#70685E]/50 focus:outline-none focus:border-[#1A365D] transition-colors resize-none font-sans"
              />
            </div>
          </div>
        </GlassCard>

        {/* 7. AI Engine & Multilingual Settings */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#E5E0D5] pb-3">
            <div className="w-8 h-8 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#1F1B16]">VII. Language &amp; Session Length</h3>
              <p className="text-xs text-[#70685E]">Configure interview question language, feedback presentation, and question count</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Interview Question Language */}
            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Interview Language</label>
              <select
                value={interviewLanguage}
                onChange={(e) => setInterviewLanguage(e.target.value)}
                className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-xs text-[#1F1B16] focus:outline-none focus:border-[#1A365D]"
              >
                <option value="en">English (Canonical)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="hi">Hindi (हिन्दी)</option>
                <option value="es">Spanish (Español)</option>
              </select>
              <p className="text-[10px] text-[#70685E] mt-1">Language for oral / text queries</p>
            </div>

            {/* Feedback Language */}
            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Feedback &amp; Rubric Language</label>
              <select
                value={feedbackLanguage}
                onChange={(e) => setFeedbackLanguage(e.target.value)}
                className="w-full p-2.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-xs text-[#1F1B16] focus:outline-none focus:border-[#1A365D]"
              >
                <option value="en">English (Canonical)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="hi">Hindi (हिन्दी)</option>
              </select>
              <p className="text-[10px] text-[#235E3B] mt-1">
                Scoring is language-independent. Tech nomenclature preserved.
              </p>
            </div>

            {/* Session Length */}
            <div>
              <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Question Volume</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTotalQuestions(5)}
                  className={`p-2.5 rounded-md border text-xs font-bold transition-all ${
                    totalQuestions === 5
                      ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1A365D]'
                      : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#70685E]'
                  }`}
                >
                  Concise (5 Qs)
                </button>
                <button
                  type="button"
                  onClick={() => setTotalQuestions(10)}
                  className={`p-2.5 rounded-md border text-xs font-bold transition-all ${
                    totalQuestions === 10
                      ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1A365D]'
                      : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#70685E]'
                  }`}
                >
                  Exhaustive (10 Qs)
                </button>
              </div>
              <p className="text-[10px] text-[#70685E] mt-1">Number of questions for this session</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E0D5]">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] transition-colors"
        >
          Cancel &amp; Return to Dashboard
        </button>

        <GradientButton
          variant="primary"
          size="lg"
          onClick={handleContinue}
          icon={ArrowRight}
          className="px-8 text-sm"
        >
          Start Interview Practice →
        </GradientButton>
      </div>
    </div>
  );
}
