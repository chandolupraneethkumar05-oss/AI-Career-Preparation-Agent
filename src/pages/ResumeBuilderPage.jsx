import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  FolderOpen,
  Palette,
  Sparkles,
  Printer,
  ChevronRight,
  Eye,
  Edit,
  Loader2,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import ResumeFormEditor from '../components/resume-builder/ResumeFormEditor';
import ResumePreview from '../components/resume-builder/ResumePreview';
import TemplateSelector from '../components/resume-builder/TemplateSelector';
import DraftManagerModal from '../components/resume-builder/DraftManagerModal';
import AnalyzeResumeModal from '../components/resume-builder/AnalyzeResumeModal';
import { resumeBuilderApi } from '../services/resumeBuilderApi';

const DEFAULT_CONTENT = {
  personal_info: {
    full_name: '',
    target_role: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
  },
  professional_summary: '',
  education: [],
  skills: [],
  projects: [],
  work_experience: [],
  internships: [],
  certifications: [],
  achievements: [],
  custom_sections: [],
};

const LOCAL_STORAGE_KEY = 'talentpath_resume_builder_state_v1';

export default function ResumeBuilderPage() {
  const [draftId, setDraftId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('Untitled Resume');
  const [targetRole, setTargetRole] = useState('');
  const [templateId, setTemplateId] = useState('modern_professional');
  const [accentColor, setAccentColor] = useState('#245A45');
  const [content, setContent] = useState(DEFAULT_CONTENT);

  // Status and UI state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeMobileView, setActiveMobileView] = useState('edit'); // 'edit' or 'preview'
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);

  // Restore local draft on mount if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.content) setContent(parsed.content);
        if (parsed.draftTitle) setDraftTitle(parsed.draftTitle);
        if (parsed.targetRole) setTargetRole(parsed.targetRole);
        if (parsed.templateId) setTemplateId(parsed.templateId);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.draftId) setDraftId(parsed.draftId);
      }
    } catch (e) {
      console.warn('Failed to parse cached resume draft:', e);
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          draftId,
          draftTitle,
          targetRole,
          templateId,
          accentColor,
          content,
        })
      );
    } catch (e) {
      console.warn('Failed to cache resume draft:', e);
    }
  }, [draftId, draftTitle, targetRole, templateId, accentColor, content]);

  // Keep targetRole in sync between header & personal info
  const handleContentChange = newContent => {
    setContent(newContent);
    if (newContent.personal_info?.target_role && newContent.personal_info.target_role !== targetRole) {
      setTargetRole(newContent.personal_info.target_role);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setStatusMessage(null);

      const payload = {
        title: draftTitle.trim() || 'Untitled Resume',
        target_role: targetRole.trim() || content.personal_info?.target_role || '',
        template_id: templateId,
        accent_color: accentColor,
        content: content,
      };

      let saved;
      if (draftId) {
        saved = await resumeBuilderApi.updateDraft(draftId, payload);
      } else {
        saved = await resumeBuilderApi.createDraft(payload);
        setDraftId(saved.id);
      }

      setLastSaved(new Date());
      setStatusMessage({ type: 'success', text: 'Resume saved successfully' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save resume draft' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectDraft = async selectedId => {
    try {
      setIsSaving(true);
      const draft = await resumeBuilderApi.getDraftById(selectedId);
      setDraftId(draft.id);
      setDraftTitle(draft.title);
      setTargetRole(draft.target_role || '');
      setTemplateId(draft.template_id || 'modern_professional');
      setAccentColor(draft.accent_color || '#245A45');
      setContent(draft.content || DEFAULT_CONTENT);
      setLastSaved(new Date(draft.updated_at));
      setStatusMessage({ type: 'success', text: `Loaded draft "${draft.title}"` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load draft' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewDraft = () => {
    setDraftId(null);
    setDraftTitle('Untitled Resume');
    setTargetRole('');
    setTemplateId('modern_professional');
    setAccentColor('#245A45');
    setContent(DEFAULT_CONTENT);
    setLastSaved(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setStatusMessage({ type: 'success', text: 'Started new blank resume' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[1700px] mx-auto px-2 sm:px-4 pb-2">
      {/* Top Application Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3 mb-2 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
        {/* Left: Title & Role */}
        <div className="flex items-center space-x-3 min-w-0">
          <input
            type="text"
            value={draftTitle}
            onChange={e => setDraftTitle(e.target.value)}
            placeholder="Resume Title"
            className="text-sm sm:text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:outline-none px-1 py-0.5 rounded transition max-w-[220px] sm:max-w-[320px] truncate"
            title="Click to rename resume title"
          />
          {lastSaved && (
            <span className="hidden lg:inline text-[11px] text-slate-400 font-mono">
              Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Center / Right: Action Buttons */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Status badge */}
          {statusMessage && (
            <div
              className={`hidden md:flex items-center space-x-1 text-xs px-2.5 py-1 rounded-lg ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Drafts Manager */}
          <button
            type="button"
            onClick={() => setIsDraftsModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shadow-xs"
            title="Manage saved drafts"
          >
            <FolderOpen size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Drafts</span>
          </button>

          {/* Template & Color Selector */}
          <button
            type="button"
            onClick={() => setIsTemplateDrawerOpen(true)}
            className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition shadow-xs"
            title="Change template or accent color"
          >
            <Palette size={14} className="text-slate-500" />
            <span className="hidden sm:inline">Design</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Analyze with ATS */}
          <button
            type="button"
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-sm"
            title="Score and evaluate resume against ATS rubric"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Analyze</span>
          </button>

          {/* Print / Export PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
            title="Export Vector PDF via browser print"
          >
            <Printer size={13} />
            <span className="hidden md:inline">PDF</span>
          </button>
        </div>
      </header>

      {/* Mobile Segmented Toggle (Edit vs Preview) */}
      <div className="flex md:hidden mb-2 bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveMobileView('edit')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition ${
            activeMobileView === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Edit size={13} />
          <span>Edit Resume</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileView('preview')}
          className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition ${
            activeMobileView === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <Eye size={13} />
          <span>A4 Preview</span>
        </button>
      </div>

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left: Guided Form Editor */}
        <div
          className={`md:col-span-6 lg:col-span-5 h-full overflow-hidden ${
            activeMobileView === 'edit' ? 'block' : 'hidden md:block'
          }`}
        >
          <ResumeFormEditor content={content} onChange={handleContentChange} />
        </div>

        {/* Right: Live A4 Preview */}
        <div
          className={`md:col-span-6 lg:col-span-7 h-full overflow-hidden ${
            activeMobileView === 'preview' ? 'block' : 'hidden md:block'
          }`}
        >
          <ResumePreview
            content={content}
            templateId={templateId}
            accentColor={accentColor}
            onPrint={() => window.print()}
          />
        </div>
      </main>

      {/* Template & Color Selector Modal / Drawer */}
      {isTemplateDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Palette className="text-emerald-700" size={18} />
                <h3 className="text-sm font-bold text-slate-800">Customize Template & Palette</h3>
              </div>
              <button
                onClick={() => setIsTemplateDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <TemplateSelector
              templateId={templateId}
              accentColor={accentColor}
              onSelectTemplate={setTemplateId}
              onSelectAccentColor={setAccentColor}
            />

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTemplateDrawerOpen(false)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Apply Styling
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Manager Modal */}
      <DraftManagerModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        onSelectDraft={handleSelectDraft}
        onNewDraft={handleNewDraft}
        currentDraftId={draftId}
      />

      {/* ATS Analysis Modal */}
      <AnalyzeResumeModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        content={content}
        targetRole={targetRole}
      />
    </div>
  );
}
