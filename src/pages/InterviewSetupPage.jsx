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
  FileCheck
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { MOCK_ROLES, INTERVIEW_TYPES, DIFFICULTY_LEVELS } from '../data/mockData';
import { useInterview } from '../context/InterviewContext';

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { setup, updateSetup } = useInterview();

  const [targetRole, setTargetRole] = useState(setup.targetRole || 'Machine Learning Engineer');
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState(setup.interviewType || 'Technical');
  const [difficulty, setDifficulty] = useState(setup.difficulty || 'Intermediate');
  const [resumeName, setResumeName] = useState(setup.resumeFileName || 'Alex_Rivera_Resume.pdf');
  const [jobDescription, setJobDescription] = useState(setup.jobDescription || '');

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
      difficulty,
      resumeFileName: resumeName,
      jobDescription
    });
    navigate('/interview-ready');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="cyan" size="sm">Step 1 of 3</Badge>
          <span className="text-xs text-[#A5B4FC]">Configuration & Personalization</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Let's Prepare Your Interview 🎯
        </h1>
        <p className="text-sm text-[#A5B4FC] mt-1">
          Customize your mock session. The AI Agent will calibrate question depth, scoring thresholds, and evaluation criteria accordingly.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Target Role Selection */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">1. Select Target Role</h3>
              <p className="text-xs text-[#A5B4FC]">Choose your prospective engineering domain</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {MOCK_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`
                  p-3 rounded-xl border text-left transition-all text-xs font-semibold
                  ${targetRole === role
                    ? 'bg-gradient-to-r from-purple-600/30 to-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                    : 'bg-[#0F1026]/70 border-purple-500/20 text-[#A5B4FC] hover:border-purple-500/50 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{role}</span>
                  {targetRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* 2. Interview Type Selection */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">2. Interview Focus Type</h3>
              <p className="text-xs text-[#A5B4FC]">Select which interview round you want to simulate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {INTERVIEW_TYPES.map((type) => (
              <div
                key={type.id}
                onClick={() => setInterviewType(type.id)}
                className={`
                  p-4 rounded-xl border cursor-pointer transition-all
                  ${interviewType === type.id
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-500/20 border-pink-400 text-white shadow-[0_0_15px_-3px_rgba(236,72,153,0.4)]'
                    : 'bg-[#0F1026]/70 border-purple-500/20 text-[#A5B4FC] hover:border-purple-500/50'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{type.label}</span>
                  {interviewType === type.id && <CheckCircle2 className="w-4 h-4 text-pink-400" />}
                </div>
                <p className="text-xs text-[#A5B4FC]/80">{type.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 3. Difficulty Level */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">3. Difficulty Level</h3>
              <p className="text-xs text-[#A5B4FC]">Calibrate question depth and evaluation strictness</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {DIFFICULTY_LEVELS.map((diff) => (
              <div
                key={diff.id}
                onClick={() => setDifficulty(diff.id)}
                className={`
                  p-4 rounded-xl border cursor-pointer transition-all text-center
                  ${difficulty === diff.id
                    ? 'bg-gradient-to-b from-purple-600/30 to-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                    : 'bg-[#0F1026]/70 border-purple-500/20 text-[#A5B4FC] hover:border-purple-500/50'
                  }
                `}
              >
                <span className="text-sm font-bold text-white block mb-1">{diff.label}</span>
                <p className="text-[11px] text-[#A5B4FC]/80">{diff.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* 4. Resume & Job Description (Optional context) */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">4. Resume & Target Job Description (Optional)</h3>
              <p className="text-xs text-[#A5B4FC]">Upload your CV and paste job requirements to personalize the question bank</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Resume Upload UI */}
            <div>
              <label className="block text-xs font-semibold text-[#A5B4FC] mb-2">Resume Document</label>
              <div className="border-2 border-dashed border-purple-500/30 hover:border-cyan-400/60 rounded-xl p-4 text-center transition-all bg-[#0F1026]/50">
                <input
                  type="file"
                  id="resumeUpload"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="resumeUpload" className="cursor-pointer block">
                  <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-500/40 flex items-center justify-center mx-auto text-cyan-400 mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-white">Click to upload or drag resume</p>
                  <p className="text-[10px] text-[#A5B4FC] mt-0.5">PDF or Word document up to 10MB</p>
                </label>
                {resumeName && (
                  <div className="mt-3 p-2 rounded-lg bg-[#191A3A] border border-cyan-500/30 flex items-center justify-center gap-2 text-xs text-cyan-300 font-mono">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                    <span className="truncate">{resumeName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Job Description Textarea */}
            <div>
              <label className="block text-xs font-semibold text-[#A5B4FC] mb-2">Job Description (Optional)</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste key responsibilities, required tech stack, or job requirements..."
                rows={4}
                className="w-full p-3 rounded-xl bg-[#0F1026]/70 border border-purple-500/30 text-xs text-white placeholder-[#A5B4FC]/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-none"
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-semibold text-[#A5B4FC] hover:text-white transition-colors"
        >
          Cancel & Return to Dashboard
        </button>

        <GradientButton
          variant="primary"
          size="lg"
          onClick={handleContinue}
          icon={ArrowRight}
          className="px-8 shadow-xl shadow-purple-900/40"
        >
          Continue to Interview Brief →
        </GradientButton>
      </div>
    </div>
  );
}
