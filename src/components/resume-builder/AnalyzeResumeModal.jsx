import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Loader2, Target } from 'lucide-react';
import { resumeBuilderApi } from '../../services/resumeBuilderApi';
import { resumeApi } from '../../services/resumeApi';

export default function AnalyzeResumeModal({
  isOpen,
  onClose,
  content,
  targetRole = '',
  jobDescription = '',
}) {
  const navigate = useNavigate();
  const [role, setRole] = useState(targetRole || content?.personal_info?.target_role || '');
  const [jd, setJd] = useState(jobDescription || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Validation
  const hasContent = Boolean(
    content?.personal_info?.full_name?.trim() ||
      content?.professional_summary?.trim() ||
      (content?.education && content.education.length > 0) ||
      (content?.work_experience && content.work_experience.length > 0) ||
      (content?.skills && content.skills.length > 0) ||
      (content?.projects && content.projects.length > 0)
  );

  const handleStartAnalysis = async () => {
    if (!hasContent) {
      setError('Please add at least your name and some experience, education, or skills before analyzing.');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      // 1. Compile current draft content to clean plain text
      const compiled = await resumeBuilderApi.compileText(content);
      const plainText = compiled?.plain_text || '';

      if (!plainText.trim()) {
        throw new Error('Compiled resume content is empty. Please fill in your resume fields.');
      }

      // 2. Call the STRICTLY PROTECTED resumeApi.analyzeResume with rawText
      const analysisData = await resumeApi.analyzeResume({
        rawText: plainText,
        targetRole: role || content?.personal_info?.target_role || 'Software Engineer',
        jobDescription: jd || undefined,
      });

      setResult(analysisData);
    } catch (err) {
      setError(err.message || 'ATS Resume Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNavigateToScanner = () => {
    onClose();
    navigate('/ats');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-emerald-700" size={18} />
            <h2 className="text-base font-bold text-slate-800">Analyze Resume with ATS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!result && (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Validate your resume against ATS algorithms, verify keyword density, and inspect your 100-point rubric score before exporting.
              </p>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Target size={13} className="text-emerald-700" />
                    <span>Target Job Title</span>
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Job Description (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={jd}
                    onChange={e => setJd(e.target.value)}
                    placeholder="Paste the job requirements to evaluate keyword matching and tailored fit..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Analysis in Progress */}
          {analyzing && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="animate-spin text-emerald-700" size={32} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Evaluating Resume Content</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parsing sections, scoring keywords, and evaluating structural strength...
                </p>
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {result && !analyzing && (
            <div className="space-y-4 text-center">
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col items-center">
                <CheckCircle2 className="text-emerald-700 mb-2" size={32} />
                <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">
                  Overall ATS Score
                </span>
                <div className="text-4xl font-black text-emerald-800 my-1">
                  {result.overall_score || result.score || 0}
                  <span className="text-lg font-normal text-emerald-600">/100</span>
                </div>
                <p className="text-xs text-emerald-800 max-w-sm mt-1">
                  {result.score_summary ||
                    result.summary ||
                    'Your resume has been processed against ATS evaluation criteria.'}
                </p>
              </div>

              {/* Quick metrics summary */}
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-700">Target Role</div>
                  <div className="text-slate-500 truncate mt-0.5">
                    {result.target_role || role || 'Software Engineer'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-700">Matched Skills</div>
                  <div className="text-slate-500 mt-0.5">
                    {(result.matched_skills || []).length} keywords identified
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNavigateToScanner}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <span>View Full Report in ATS Scanner</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition"
          >
            {result ? 'Back to Editor' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={analyzing || !hasContent}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Sparkles size={13} />
              <span>{analyzing ? 'Analyzing...' : 'Run ATS Analysis'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
