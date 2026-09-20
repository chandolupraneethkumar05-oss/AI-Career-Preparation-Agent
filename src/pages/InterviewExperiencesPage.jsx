/**
 * Real Interview Experiences & Question Knowledge Base
 * AI Career Preparation Agent
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Lightbulb,
  ShieldCheck,
  Building2,
  Briefcase,
  Code,
  Copy,
  Check,
  X,
  Sparkles,
  HelpCircle,
  Clock,
  Send,
  Eye,
  ChevronDown,
  ChevronUp,
  Award,
  Star
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { experienceApi } from '../services/experienceApi';
import { MASTER_EXEMPLARS } from '../data/exemplarTranscripts';

export default function InterviewExperiencesPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || 'user-001';

  // Tabs: 'experiences' | 'questions' | 'my_submissions' | 'exemplars'
  const [activeTab, setActiveTab] = useState('experiences');

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedRound, setSelectedRound] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Data states
  const [approvedExperiences, setApprovedExperiences] = useState([]);
  const [approvedQuestions, setApprovedQuestions] = useState([]);
  const [myExperiences, setMyExperiences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedExpIds, setExpandedExpIds] = useState(new Set());
  const [copiedQuestionId, setCopiedQuestionId] = useState(null);
  const [expandedExemplarIds, setExpandedExemplarIds] = useState(new Set(['exemplar-google-l5']));
  const [copiedExemplarId, setCopiedExemplarId] = useState(null);

  // Contribution Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExperienceId, setEditingExperienceId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const initialFormState = {
    role: '',
    experience_level: 'entry',
    round_type: 'technical',
    company: '',
    company_disclosure: 'industry_only', // 'specific' | 'industry_only' | 'anonymous'
    industry: 'Technology',
    difficulty: 'medium',
    outcome: 'offer',
    experience_text: '',
    preparation_tips: '',
    topicsInput: '',
    resume_years: 1,
    resume_skills: '',
    questions: [
      { question_text: '', round_type: 'technical', topic: '', difficulty: 'medium' }
    ]
  };
  const [formData, setFormData] = useState(initialFormState);
  const [piiFeedback, setPiiFeedback] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch approved experiences and questions
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const expRes = await experienceApi.getExperiences({
        role: selectedRole !== 'all' ? selectedRole : undefined,
        round_type: selectedRound !== 'all' ? selectedRound : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchTerm.trim() || undefined
      }, currentUserId);

      const qRes = await experienceApi.getExperienceQuestions({
        role: selectedRole !== 'all' ? selectedRole : undefined,
        round_type: selectedRound !== 'all' ? selectedRound : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
        search: searchTerm.trim() || undefined
      });

      const myRes = await experienceApi.getMyExperiences(currentUserId);

      setApprovedExperiences(expRes?.items || []);
      setApprovedQuestions(qRes?.items || []);
      setMyExperiences(myRes || []);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load experiences:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, selectedRound, selectedDifficulty, searchTerm, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle card expansion
  const toggleExpand = (id) => {
    setExpandedExpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy question text to clipboard
  const handleCopyQuestion = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionId(id);
    setTimeout(() => setCopiedQuestionId(null), 2000);
  };

  // Toggle exemplar expansion
  const toggleExpandExemplar = (id) => {
    setExpandedExemplarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Copy exemplar defense transcript
  const handleCopyExemplar = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedExemplarId(id);
    showToast('Exemplar defense copied to clipboard.', 'success');
    setTimeout(() => setCopiedExemplarId(null), 2500);
  };

  // Filtered Master Exemplars
  const filteredExemplars = useMemo(() => {
    return MASTER_EXEMPLARS.filter((ex) => {
      if (selectedRole !== 'all') {
        const matchesRole =
          ex.role.toLowerCase().includes(selectedRole.toLowerCase()) ||
          ex.domain.toLowerCase().includes(selectedRole.toLowerCase());
        if (!matchesRole) return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          ex.company.toLowerCase().includes(query) ||
          ex.role.toLowerCase().includes(query) ||
          ex.domain.toLowerCase().includes(query) ||
          ex.question.toLowerCase().includes(query) ||
          ex.summary.toLowerCase().includes(query) ||
          ex.keyTakeawayLesson.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [searchTerm, selectedRole]);

  // Real-time PII Scanning
  const handleTextScan = async (text) => {
    if (!text || text.trim().length < 15) {
      setPiiFeedback(null);
      return;
    }
    const report = await experienceApi.scanPii(text);
    if (!report.is_clean) {
      setPiiFeedback(report);
    } else {
      setPiiFeedback(null);
    }
  };

  // Add question row in form
  const addQuestionRow = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question_text: '', round_type: prev.round_type, topic: '', difficulty: prev.difficulty }
      ]
    }));
  };

  // Remove question row
  const removeQuestionRow = (idx) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  // Update question field
  const updateQuestionField = (idx, field, val) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, questions: updated };
    });
  };

  // Open modal for new submission
  const openNewModal = () => {
    setEditingExperienceId(null);
    setFormData(initialFormState);
    setPiiFeedback(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing submission
  const openEditModal = (exp) => {
    setEditingExperienceId(exp.id);
    setFormData({
      role: exp.role || '',
      experience_level: exp.experience_level || 'entry',
      round_type: exp.round_type || 'technical',
      company: exp.company || '',
      company_disclosure: exp.company_disclosure || 'industry_only',
      industry: exp.industry || 'Technology',
      difficulty: exp.difficulty || 'medium',
      outcome: exp.outcome || 'offer',
      experience_text: exp.experience_text || '',
      preparation_tips: exp.preparation_tips || '',
      topicsInput: (exp.topics || []).join(', '),
      resume_years: exp.resume_summary?.years_exp || 1,
      resume_skills: (exp.resume_summary?.top_skills || []).join(', '),
      questions: exp.questions && exp.questions.length > 0
        ? exp.questions.map((q) => ({
            question_text: q.question_text,
            round_type: q.round_type || exp.round_type,
            topic: q.topic || '',
            difficulty: q.difficulty || exp.difficulty
          }))
        : [{ question_text: '', round_type: 'technical', topic: '', difficulty: 'medium' }]
    });
    setPiiFeedback(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role.trim() || !formData.experience_text.trim()) {
      showToast('Please provide both the role and detailed experience account.', 'error');
      return;
    }

    const topics = formData.topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const validQuestions = formData.questions.filter((q) => q.question_text && q.question_text.trim().length > 4);

    const payload = {
      role: formData.role.trim(),
      experience_level: formData.experience_level,
      round_type: formData.round_type,
      company: formData.company.trim() || null,
      company_disclosure: formData.company_disclosure,
      industry: formData.industry.trim() || 'Technology',
      difficulty: formData.difficulty,
      outcome: formData.outcome,
      experience_text: formData.experience_text.trim(),
      preparation_tips: formData.preparation_tips.trim() || null,
      topics,
      resume_summary: {
        years_exp: Number(formData.resume_years) || 1,
        top_skills: formData.resume_skills.split(',').map((s) => s.trim()).filter(Boolean)
      },
      questions: validQuestions
    };

    setSubmitting(true);
    try {
      if (editingExperienceId) {
        await experienceApi.updateExperience(editingExperienceId, currentUserId, payload);
        showToast('Experience updated successfully. Submitted for moderation review.', 'success');
      } else {
        await experienceApi.createExperience(currentUserId, payload);
        showToast('Thank you for contributing! Your submission is under moderation review.', 'success');
      }
      setIsModalOpen(false);
      setEditingExperienceId(null);
      setFormData(initialFormState);
      loadData();
    } catch (err) {
      showToast(err.message || 'Error saving experience.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await experienceApi.deleteExperience(id, currentUserId);
      showToast('Interview experience deleted.', 'success');
      setDeleteConfirmId(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete experience.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-md shadow-md border flex items-center gap-2 text-sm font-medium transition-all ${
            toastMessage.type === 'error'
              ? 'bg-[#9A421A] text-white border-[#853412]'
              : 'bg-[#1B2A4A] text-white border-[#142038]'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-[#235E3B]" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E5E0D5] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-md bg-[#1B2A4A] text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#1F1B16]">
                Interview Experiences &amp; Questions Archive
              </h1>
              <p className="text-xs sm:text-sm text-[#70685E] mt-0.5">
                Authentic candidate-contributed interview questions, round formats, and preparation insights.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <GradientButton
            onClick={openNewModal}
            className="flex items-center gap-2 shadow-xs text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Contribute Experience</span>
          </GradientButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E0D5]">
        <button
          onClick={() => setActiveTab('experiences')}
          className={`pb-3 px-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'experiences'
              ? 'text-[#1F1B16] border-b-2 border-[#1B2A4A]'
              : 'text-[#70685E] hover:text-[#1F1B16]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Real Experiences ({approvedExperiences.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 px-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'questions'
              ? 'text-[#1F1B16] border-b-2 border-[#1B2A4A]'
              : 'text-[#70685E] hover:text-[#1F1B16]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Question Bank ({approvedQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my_submissions')}
          className={`pb-3 px-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_submissions'
              ? 'text-[#1F1B16] border-b-2 border-[#1B2A4A]'
              : 'text-[#70685E] hover:text-[#1F1B16]'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>My Contributions ({myExperiences.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exemplars')}
          className={`pb-3 px-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'exemplars'
              ? 'text-[#1F1B16] border-b-2 border-[#1B2A4A]'
              : 'text-[#70685E] hover:text-[#1F1B16]'
          }`}
        >
          <Award className="w-4 h-4 text-[#8C6E54]" />
          <span>Master Defense Exemplars ({MASTER_EXEMPLARS.length})</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#FAF8F3] text-[#8C6E54] border border-[#E5E0D5]">
            FAANG 90+
          </span>
        </button>
      </div>

      {/* Search & Filter Bar (Applicable to Experiences & Questions tabs) */}
      {activeTab !== 'my_submissions' && (
        <GlassCard className="p-4 sm:p-5 border-[#E5E0D5] bg-[#FFFDF9]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#70685E]" />
              <input
                type="text"
                placeholder="Search questions, roles, topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] placeholder-[#70685E]/60 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
              >
                <option value="all">All Roles</option>
                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                <option value="Backend">Backend Engineer</option>
                <option value="System Design">System Design</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="DevOps">DevOps / MLOps</option>
              </select>
            </div>

            {/* Round Filter */}
            <div>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
              >
                <option value="all">All Rounds</option>
                <option value="technical">Technical Round</option>
                <option value="system_design">System Design</option>
                <option value="coding">Coding Round</option>
                <option value="hr_behavioral">HR & Behavioral</option>
                <option value="managerial">Managerial Round</option>
              </select>
            </div>

            {/* Difficulty Filter */}
            <div>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#70685E]">
          <div className="w-8 h-8 border-2 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-serif">Consulting interview knowledge repository...</p>
        </div>
      ) : activeTab === 'experiences' ? (
        /* TAB 1: Approved Experiences */
        <div className="space-y-4">
          {approvedExperiences.length === 0 ? (
            <GlassCard className="text-center py-12 border-[#E5E0D5] bg-[#FFFDF9]">
              <BookOpen className="w-10 h-10 mx-auto text-[#70685E] mb-3 opacity-50" />
              <h3 className="font-serif text-base font-bold text-[#1F1B16]">No Experiences Found</h3>
              <p className="text-xs sm:text-sm text-[#70685E] mt-1 max-w-md mx-auto">
                No approved interview experiences matched your current filter criteria. Try adjusting filters or be the first to contribute!
              </p>
              <GradientButton onClick={openNewModal} className="mt-4 text-xs">
                Contribute an Experience
              </GradientButton>
            </GlassCard>
          ) : (
            approvedExperiences.map((exp) => {
              const isExpanded = expandedExpIds.has(exp.id);
              return (
                <GlassCard key={exp.id} className="p-5 transition-all border-[#E5E0D5] bg-[#FFFDF9] rounded-md">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif font-bold text-base text-[#1F1B16]">
                          {exp.role}
                        </span>

                        <Badge variant={exp.difficulty === 'hard' ? 'pink' : exp.difficulty === 'medium' ? 'amber' : 'green'} size="sm">
                          {exp.difficulty.toUpperCase()}
                        </Badge>

                        <Badge variant="neutral" size="sm">
                          {exp.round_type.replace('_', ' ')}
                        </Badge>

                        {exp.display_company && (
                          <span className="inline-flex items-center gap-1 text-xs text-[#3B352E] font-medium px-2 py-0.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5]">
                            <Building2 className="w-3 h-3 text-[#70685E]" />
                            {exp.display_company}
                          </span>
                        )}
                      </div>

                      {/* Summary Text */}
                      <p className="text-xs sm:text-sm text-[#3B352E] mt-2 leading-relaxed">
                        {isExpanded ? exp.experience_text : `${exp.experience_text.slice(0, 180)}${exp.experience_text.length > 180 ? '...' : ''}`}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => toggleExpand(exp.id)}
                        className="text-xs text-[#1A365D] font-semibold hover:underline flex items-center gap-1 cursor-pointer py-1"
                      >
                        <span>{isExpanded ? 'Show Less' : 'Full Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Sections */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#E5E0D5] space-y-3 animate-in fade-in">
                      {/* Preparation Tips */}
                      {exp.preparation_tips && (
                        <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-[#9A421A] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-[#1F1B16] block">Candidate Preparation Insight:</span>
                            <p className="text-xs text-[#3B352E] mt-0.5 leading-relaxed">
                              {exp.preparation_tips}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Real Questions Encountered */}
                      {exp.questions && exp.questions.length > 0 && (
                        <div>
                          <span className="text-xs font-bold text-[#1F1B16] block mb-2 font-mono uppercase tracking-wider">
                            Questions Asked in this Interview ({exp.questions.length}):
                          </span>
                          <div className="space-y-2">
                            {exp.questions.map((q, idx) => (
                              <div
                                key={q.id || idx}
                                className="p-2.5 rounded-md border border-[#E5E0D5] bg-[#FFFDF9] flex items-start justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[#70685E] font-semibold">Q{idx + 1}.</span>
                                    <span className="text-[#1F1B16] font-medium font-serif">{q.question_text}</span>
                                  </div>
                                  <div className="flex items-center gap-2 pl-4">
                                    {q.topic && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[#70685E] font-mono">
                                        {q.topic}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-[#70685E] uppercase font-mono">
                                      {q.difficulty}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleCopyQuestion(q.id || idx, q.question_text)}
                                  className="p-1 rounded-sm text-[#70685E] hover:text-[#1F1B16] hover:bg-[#F2EFE9] transition-colors shrink-0 cursor-pointer"
                                  title="Copy Question"
                                >
                                  {copiedQuestionId === (q.id || idx) ? (
                                    <Check className="w-3.5 h-3.5 text-[#235E3B]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sanitized Resume Snapshot */}
                      {exp.resume_summary && (exp.resume_summary.years_exp || exp.resume_summary.top_skills?.length) && (
                        <div className="flex items-center gap-3 text-[11px] text-[#70685E] font-mono">
                          <span>Experience Profile: {exp.resume_summary.years_exp || 0} years</span>
                          {exp.resume_summary.top_skills && (
                            <span>• Core Stack: {exp.resume_summary.top_skills.join(', ')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Topics Tags & Academic Disclaimer Footer */}
                  <div className="mt-3 pt-3 border-t border-[#E5E0D5] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {exp.topics && exp.topics.map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-sm bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5] font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <span className="text-[10px] text-[#70685E] italic">
                      Candidate-contributed experience • Not an official company question list
                    </span>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      ) : activeTab === 'questions' ? (
        /* TAB 2: Approved Questions Bank */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {approvedQuestions.length === 0 ? (
            <div className="col-span-2">
              <GlassCard className="text-center py-12 border-[#E5E0D5] bg-[#FFFDF9]">
                <HelpCircle className="w-10 h-10 mx-auto text-[#70685E] mb-3 opacity-50" />
                <h3 className="font-serif text-base font-bold text-[#1F1B16]">No Questions Found</h3>
                <p className="text-xs sm:text-sm text-[#70685E] mt-1">
                  No interview questions match the selected role or round filter.
                </p>
              </GlassCard>
            </div>
          ) : (
            approvedQuestions.map((q) => (
              <GlassCard key={q.id} className="p-4 flex flex-col justify-between border-[#E5E0D5] bg-[#FFFDF9] rounded-md">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-[#70685E] font-mono">
                      {q.role}
                    </span>
                    <Badge variant={q.difficulty === 'hard' ? 'pink' : q.difficulty === 'medium' ? 'amber' : 'green'} size="sm">
                      {q.difficulty}
                    </Badge>
                  </div>

                  <p className="font-serif text-sm font-medium text-[#1F1B16] leading-snug">
                    "{q.question_text}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-sm bg-[#FAF8F3] border border-[#E5E0D5] text-[10px] font-mono text-[#70685E]">
                      {q.topic}
                    </span>
                    <span className="text-[10px] text-[#70685E]">
                      {q.display_company}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyQuestion(q.id, q.question_text)}
                    className="p-1 rounded-sm text-[#70685E] hover:text-[#1F1B16] hover:bg-[#F2EFE9] transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedQuestionId === q.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#235E3B]" />
                        <span className="text-[#235E3B] font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      ) : activeTab === 'my_submissions' ? (
        /* TAB 3: My Contributions */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs sm:text-sm text-[#70685E]">
              Submissions undergo deterministic privacy & moderation scans before publication to ensure community quality.
            </p>
            <GradientButton onClick={openNewModal} className="text-xs flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>New Submission</span>
            </GradientButton>
          </div>

          {myExperiences.length === 0 ? (
            <GlassCard className="text-center py-12 border-[#E5E0D5] bg-[#FFFDF9]">
              <Briefcase className="w-10 h-10 mx-auto text-[#70685E] mb-3 opacity-50" />
              <h3 className="font-serif text-base font-bold text-[#1F1B16]">No Contributions Yet</h3>
              <p className="text-xs sm:text-sm text-[#70685E] mt-1 max-w-sm mx-auto">
                Have you recently interviewed for a technical role? Help fellow candidates by contributing your experience anonymously.
              </p>
              <GradientButton onClick={openNewModal} className="mt-4 text-xs">
                Contribute an Experience
              </GradientButton>
            </GlassCard>
          ) : (
            myExperiences.map((exp) => (
              <GlassCard key={exp.id} className="p-5 border-[#E5E0D5] bg-[#FFFDF9] rounded-md">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-base text-[#1F1B16]">
                        {exp.role}
                      </span>

                      {/* Moderation Badge */}
                      <Badge
                        variant={
                          exp.moderation_status === 'APPROVED'
                            ? 'green'
                            : exp.moderation_status === 'REJECTED'
                            ? 'pink'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {exp.moderation_status}
                      </Badge>

                      {/* PII Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-sm border ${
                          exp.pii_scan_status === 'CLEAN'
                            ? 'bg-[#EBF4EE] text-[#235E3B] border-[#235E3B]/30'
                            : 'bg-[#FDF2E9] text-[#9A421A] border-[#9A421A]/30'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        PII: {exp.pii_scan_status}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#3B352E] mt-2 line-clamp-2">
                      {exp.experience_text}
                    </p>

                    {/* Moderator Note if any */}
                    {exp.moderation_notes && (
                      <div className="mt-2 text-xs text-[#9A421A] bg-[#FDF2E9] p-2 rounded-md border border-[#9A421A]/30">
                        <strong>Reviewer note:</strong> {exp.moderation_notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(exp)}
                      className="p-1.5 rounded-md border border-[#E5E0D5] text-[#3B352E] hover:bg-[#F2EFE9] transition-colors text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(exp.id)}
                      className="p-1.5 rounded-md border border-[#9A421A]/30 text-[#9A421A] hover:bg-[#FDF2E9] transition-colors text-xs flex items-center gap-1 cursor-pointer"
                      title="Delete experience"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-[11px] text-[#70685E] font-mono">
                  <span>Questions attached: {exp.questions?.length || 0}</span>
                  <span>Submitted: {new Date(exp.created_at).toLocaleDateString()}</span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      ) : (
        /* TAB 4: Master Defense Exemplars */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 border-b border-[#E5E0D5] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="editorial-overline">CANONICAL DEFENSE TRANSCRIPTS</span>
                <Badge variant="bronze" size="sm">90–98 Percentile Bar</Badge>
              </div>
              <h2 className="font-serif text-lg font-bold text-[#1F1B16]">
                Master Defense Exemplar Archive
              </h2>
              <p className="text-xs sm:text-sm text-[#70685E] mt-0.5">
                Authentic, de-identified transcripts of top-percentile engineering defenses with committee rationales and 4-pillar scoring.
              </p>
            </div>
            <div className="text-xs font-mono text-[#70685E] bg-[#FAF8F3] px-3 py-1.5 rounded-md border border-[#E5E0D5] shrink-0">
              Showing {filteredExemplars.length} of {MASTER_EXEMPLARS.length} Exemplars
            </div>
          </div>

          {filteredExemplars.length === 0 ? (
            <GlassCard className="text-center py-12 border-[#E5E0D5] bg-[#FFFDF9]">
              <Award className="w-10 h-10 mx-auto text-[#70685E] mb-3 opacity-50" />
              <h3 className="font-serif text-base font-bold text-[#1F1B16]">No Exemplars Found</h3>
              <p className="text-xs sm:text-sm text-[#70685E] mt-1 max-w-sm mx-auto">
                No master defense transcripts match your active search terms. Try clearing your search.
              </p>
            </GlassCard>
          ) : (
            filteredExemplars.map((ex) => {
              const isExpanded = expandedExemplarIds.has(ex.id);
              return (
                <GlassCard
                  key={ex.id}
                  className="p-6 border-[#E5E0D5] bg-[#FFFDF9] rounded-md shadow-xs space-y-4 hover:border-[#1A365D] transition-all"
                >
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E5E0D5] pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-sm bg-[#1B2A4A] text-white text-xs font-mono font-bold uppercase tracking-wider">
                          {ex.company}
                        </span>
                        <span className="font-serif font-bold text-base text-[#1F1B16]">
                          {ex.role}
                        </span>
                        <Badge variant="navy" size="sm">
                          {ex.domain}
                        </Badge>
                        <span className="text-[11px] font-mono text-[#70685E] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E5E0D5]">
                          ⏱ {ex.timeElapsed}
                        </span>
                      </div>
                      <p className="text-xs text-[#70685E] leading-relaxed">
                        <strong>Synthesis:</strong> {ex.summary}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-serif font-black text-[#1F1B16]">
                          {ex.score}
                        </span>
                        <span className="text-xs text-[#70685E] font-mono">/ 100</span>
                        <span className="px-2.5 py-0.5 rounded-sm bg-[#EBF4EE] text-[#235E3B] border border-[#CDE5D4] text-xs font-bold font-mono">
                          ● {ex.verdict}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8C6E54] font-semibold">
                        {ex.calibratedLevel}
                      </span>
                    </div>
                  </div>

                  {/* Question Box */}
                  <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                    <span className="editorial-overline text-[9px] block">REAL INTERVIEW QUESTION</span>
                    <p className="font-serif text-sm font-semibold text-[#1F1B16] leading-relaxed">
                      "{ex.question}"
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#70685E]">
                      <Star className="w-3.5 h-3.5 text-[#8C6E54]" />
                      <span>Calibrated against Google &amp; Meta L5 Rubrics</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpandExemplar(ex.id)}
                      className="text-xs text-[#1A365D] font-semibold hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                    >
                      <span>{isExpanded ? 'Hide Candidate Defense & Deliberations' : 'Inspect Full Defense & Deliberations'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded Sections */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-[#E5E0D5] space-y-5 animate-in fade-in">
                      {/* 4-Pillar Industry Rubric */}
                      <div className="space-y-2">
                        <span className="editorial-overline text-[10px] block">CANONICAL 4-PILLAR INDUSTRY RUBRIC BREAKDOWN</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                            <span className="text-[10px] text-[#70685E] uppercase font-bold font-mono block">
                              1. Algorithmic Depth
                            </span>
                            <span className="text-xl font-serif font-bold text-[#1F1B16]">
                              {ex.rubricBreakdown.algorithmicDepth}%
                            </span>
                            <p className="text-[10px] text-[#235E3B]">● Complexity & Correctness</p>
                          </div>

                          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                            <span className="text-[10px] text-[#70685E] uppercase font-bold font-mono block">
                              2. Architecture & Code
                            </span>
                            <span className="text-xl font-serif font-bold text-[#1F1B16]">
                              {ex.rubricBreakdown.architectureQuality}%
                            </span>
                            <p className="text-[10px] text-[#235E3B]">● High Scale & Modularity</p>
                          </div>

                          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                            <span className="text-[10px] text-[#70685E] uppercase font-bold font-mono block">
                              3. Communication Pacing
                            </span>
                            <span className="text-xl font-serif font-bold text-[#1F1B16]">
                              {ex.rubricBreakdown.communicationPacing}%
                            </span>
                            <p className="text-[10px] text-[#235E3B]">● Structured Trade-offs</p>
                          </div>

                          <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                            <span className="text-[10px] text-[#70685E] uppercase font-bold font-mono block">
                              4. Autonomy & Coachability
                            </span>
                            <span className="text-xl font-serif font-bold text-[#1F1B16]">
                              {ex.rubricBreakdown.autonomyCoachability}%
                            </span>
                            <p className="text-[10px] text-[#235E3B]">● Zero Prompts Needed</p>
                          </div>
                        </div>
                      </div>

                      {/* Verbatim Candidate Defense Transcript */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="editorial-overline text-[10px]">VERBATIM CANDIDATE DEFENSE TRANSCRIPT</span>
                          <button
                            type="button"
                            onClick={() => handleCopyExemplar(ex.id, ex.candidateDefense)}
                            className="text-xs text-[#1A365D] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedExemplarId === ex.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#235E3B]" />
                                <span className="text-[#235E3B]">Transcript Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Transcript</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 rounded-md bg-[#1B2A4A] text-[#F4EFE6] font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-[#142038]">
                          {ex.candidateDefense}
                        </div>
                      </div>

                      {/* Committee Deliberation Box */}
                      <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-3">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-[#8C6E54]" />
                          <span className="text-xs font-serif font-bold text-[#1F1B16]">
                            Hiring Committee Deliberation Consensus
                          </span>
                        </div>
                        <p className="text-xs text-[#3B352E] leading-relaxed">
                          {ex.committeeDeliberation.consensus}
                        </p>

                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-[#1F1B16] block">Committee-Observed Strengths:</span>
                          <ul className="list-disc list-inside space-y-1 text-xs text-[#3B352E]">
                            {ex.committeeDeliberation.strengths.map((str, sIdx) => (
                              <li key={sIdx} className="leading-relaxed">{str}</li>
                            ))}
                          </ul>
                        </div>

                        {ex.committeeDeliberation.coachingNotes && (
                          <div className="pt-2 border-t border-[#E5E0D5] text-[11px] text-[#70685E] italic">
                            <strong>Committee Note on Seniority Scope:</strong> {ex.committeeDeliberation.coachingNotes}
                          </div>
                        )}
                      </div>

                      {/* Key Takeaway Lesson */}
                      <div className="p-3.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex items-start gap-2.5 shadow-xs">
                        <Lightbulb className="w-4 h-4 text-[#8C6E54] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-[#1F1B16] block">Candidate Strategic Lesson:</span>
                          <p className="text-xs text-[#3B352E] mt-0.5 leading-relaxed">
                            {ex.keyTakeawayLesson}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </GlassCard>
              );
            })
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E5E0D5] rounded-md max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-[#9A421A]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-serif font-bold text-base text-[#1F1B16]">Delete Experience?</h3>
            </div>
            <p className="text-xs text-[#70685E] leading-relaxed">
              Are you sure you want to delete this interview experience and its associated questions? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs rounded-md border border-[#E5E0D5] text-[#70685E] hover:bg-[#F2EFE9] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs rounded-md bg-[#9A421A] hover:bg-[#853412] text-white font-semibold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute / Edit Experience Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFDF9] border border-[#E5E0D5] rounded-md max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1F1B16]">
                  {editingExperienceId ? 'Edit Interview Experience' : 'Contribute Real Interview Experience'}
                </h2>
                <p className="text-xs text-[#70685E] mt-0.5">
                  Share realistic interview details to help others prepare. All submissions are PII-scanned.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-[#70685E] hover:text-[#1F1B16] hover:bg-[#F2EFE9] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Warning Banner */}
            <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#235E3B] shrink-0 mt-0.5" />
              <div className="text-xs text-[#3B352E] leading-relaxed">
                <span className="font-bold text-[#1F1B16] block">Candidate Privacy & Security First:</span>
                Never share confidential trade secrets, API credentials, or NDA-protected source code. Emails, phone numbers, and secrets are automatically flagged and redacted.
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Row 1: Role, Level, Round Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                    Job Title / Role *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Machine Learning Engineer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="entry">Entry Level / Student</option>
                    <option value="mid">Mid Level (2-4 yrs)</option>
                    <option value="senior">Senior Level (5+ yrs)</option>
                    <option value="lead">Lead / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                    Round Type
                  </label>
                  <select
                    value={formData.round_type}
                    onChange={(e) => setFormData({ ...formData, round_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="technical">Technical Assessment</option>
                    <option value="system_design">System Design</option>
                    <option value="coding">Live Coding / Algorithms</option>
                    <option value="hr_behavioral">HR & Behavioral</option>
                    <option value="managerial">Managerial Round</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Company Disclosure Option */}
              <div className="p-3 rounded-md border border-[#E5E0D5] bg-[#FAF8F3] space-y-2">
                <label className="block text-xs font-semibold text-[#1F1B16]">
                  Company Privacy & Disclosure Setting
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="disclosure"
                      value="specific"
                      checked={formData.company_disclosure === 'specific'}
                      onChange={() => setFormData({ ...formData, company_disclosure: 'specific' })}
                    />
                    <span>Specific Company Name</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="disclosure"
                      value="industry_only"
                      checked={formData.company_disclosure === 'industry_only'}
                      onChange={() => setFormData({ ...formData, company_disclosure: 'industry_only' })}
                    />
                    <span>Industry Only (Recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="disclosure"
                      value="anonymous"
                      checked={formData.company_disclosure === 'anonymous'}
                      onChange={() => setFormData({ ...formData, company_disclosure: 'anonymous' })}
                    />
                    <span>Completely Anonymous</span>
                  </label>
                </div>

                {formData.company_disclosure === 'specific' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Company Name (e.g. Google, Microsoft)"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                    />
                  </div>
                )}

                {formData.company_disclosure === 'industry_only' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Industry domain (e.g. Fintech, Healthcare, E-Commerce)"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                    />
                  </div>
                )}
              </div>

              {/* Row 3: Difficulty & Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                    Overall Interview Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                    Interview Outcome (Optional)
                  </label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                  >
                    <option value="offer">Received Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="in_progress">In Progress</option>
                    <option value="declined">Offer Declined</option>
                    <option value="undisclosed">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Real Questions Encountered Builder */}
              <div className="space-y-2 border-t border-[#E5E0D5] pt-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#1F1B16]">
                    Specific Interview Questions Encountered ({formData.questions.length})
                  </label>
                  <button
                    type="button"
                    onClick={addQuestionRow}
                    className="text-xs text-[#1A365D] font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.questions.map((q, idx) => (
                    <div key={idx} className="p-3 rounded-md border border-[#E5E0D5] bg-[#FAF8F3] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#70685E] font-mono">Question #{idx + 1}</span>
                        {formData.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestionRow(idx)}
                            className="text-[#9A421A] hover:text-[#853412] text-xs p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="e.g. How does backpropagation handle vanishing gradients with ReLU?"
                        value={q.question_text}
                        onChange={(e) => updateQuestionField(idx, 'question_text', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Topic / Skill (e.g. PyTorch, SQL)"
                          value={q.topic}
                          onChange={(e) => updateQuestionField(idx, 'topic', e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                        />
                        <select
                          value={q.difficulty}
                          onChange={(e) => updateQuestionField(idx, 'difficulty', e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Experience Account */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                  Interview Process Walkthrough & Account *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the format, conversation dynamics, technical depth, and what the interviewers looked for..."
                  value={formData.experience_text}
                  onChange={(e) => {
                    setFormData({ ...formData, experience_text: e.target.value });
                    handleTextScan(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] placeholder-[#70685E]/60 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]"
                />
              </div>

              {/* Preparation Tips */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                  Actionable Preparation Advice (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What topics should future candidates prioritize? Any specific resources or practice strategies?"
                  value={formData.preparation_tips}
                  onChange={(e) => setFormData({ ...formData, preparation_tips: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] placeholder-[#70685E]/60 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]"
                />
              </div>

              {/* Skills & Resume Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#E5E0D5] pt-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                    Key Topics / Technologies (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Python, Docker, PyTorch, SQL"
                    value={formData.topicsInput}
                    onChange={(e) => setFormData({ ...formData, topicsInput: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F1B16] mb-1">
                    Sanitized Background: Years of Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={formData.resume_years}
                    onChange={(e) => setFormData({ ...formData, resume_years: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>

              {/* Live PII Alert Warning if triggered */}
              {piiFeedback && !piiFeedback.is_clean && (
                <div className="p-3 rounded-md bg-[#FDF2E9] border border-[#9A421A]/30 text-[#9A421A] text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Potential PII or Secrets Detected ({piiFeedback.detected_categories.join(', ')})</span>
                  </div>
                  <p className="text-[11px]">
                    Please remove emails, phone numbers, or credentials before submitting to safeguard your privacy.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-md border border-[#E5E0D5] text-[#70685E] hover:bg-[#F2EFE9] cursor-pointer"
                >
                  Cancel
                </button>
                <GradientButton
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 text-xs py-2 px-4 shadow-xs"
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{editingExperienceId ? 'Update & Re-Submit' : 'Submit Experience'}</span>
                    </>
                  )}
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
