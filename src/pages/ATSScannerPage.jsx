import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Layers,
  ArrowRight,
  Printer,
  Copy,
  Check,
  FileText,
  Wand2
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import CircularScore from '../components/CircularScore';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { resumeApi } from '../services/resumeApi';
import { storageService } from '../utils/storage/storageService';
import { analyzeSkillGaps } from '../utils/skillGapAnalyzer';
import { achievementService } from '../utils/achievementService';
import { extractTextFromFile, analyzeResumeATS } from '../utils/resumeParser';
import { resumeTailorEngine } from '../utils/resumeTailorEngine';

export default function ATSScannerPage() {
  const { user, addXP } = useAuth();

  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [jobDescription, setJobDescription] = useState(() => {
    const role = user?.targetRole || 'Machine Learning Engineer';
    if (role.toLowerCase().includes('frontend')) {
      return 'Seeking a Frontend Developer with strong React, JavaScript, TypeScript, HTML/CSS, Tailwind, and responsive UI experience.';
    }
    if (role.toLowerCase().includes('backend')) {
      return 'Seeking a Backend Developer with strong Python or Node.js, REST APIs, SQL, Docker, database performance, and scalable architecture.';
    }
    if (role.toLowerCase().includes('full stack') || role.toLowerCase().includes('fullstack')) {
      return 'Seeking a Full Stack Developer with strong React, Node.js, Python, SQL/NoSQL databases, RESTful APIs, and cloud deployment experience.';
    }
    return 'Seeking a Machine Learning Engineer with strong Python, PyTorch, Docker containerization, data pipelines, and production model deployment experience.';
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Resume Tailor State
  const [tailoredResult, setTailoredResult] = useState(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const [results, setResults] = useState(() => {
    return storageService.getATSResult();
  });

  // Load latest persistent analysis from backend on mount
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const latest = await resumeApi.getLatestAnalysis(user?.id || 'user-001');
        if (latest && latest.ats_score) {
          setResults(latest);
          if (latest.filename) {
            setFileName(latest.filename);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.debug('Could not load latest resume from backend:', err);
      }
    };
    fetchLatest();
  }, [user?.id]);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setFileName(file.name);
      setErrorMessage(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile && !results) {
      setErrorMessage('Please select a PDF or Word document (.docx) to analyze.');
      return;
    }

    setIsScanning(true);
    setScanProgress(15);
    setErrorMessage(null);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          return 85;
        }
        return prev + 20;
      });
    }, 250);

    try {
      const targetRole = user?.targetRole || 'Machine Learning Engineer';
      const userId = user?.id || 'user-001';
      const candidateName = user?.name || 'Candidate';

      let analysisResult = null;
      const sampleText = `
${candidateName} - ${targetRole}
Experience:
Software & Systems Engineer. Built production applications, API endpoints, and pipelines.
Implemented data models, automated test suites, and optimized performance benchmarks.
Education:
B.Tech in Computer Science / AIML.
Skills: Python, SQL, Docker, FastAPI, Git, Algorithms, System Design, Data Structures.
Projects:
High-throughput analytics engine, automated data processing pipeline.
`;

      try {
        if (uploadedFile) {
          analysisResult = await resumeApi.analyzeResume({
            file: uploadedFile,
            targetRole,
            jobDescription,
            userId
          });
        } else {
          analysisResult = await resumeApi.analyzeResume({
            rawText: sampleText,
            targetRole,
            jobDescription,
            userId
          });
        }
      } catch (backendErr) {
        if (import.meta.env.DEV) console.debug('[ATSScanner] Backend offline or returned error, utilizing local parser fallback:', backendErr);
        // Resilient fallback using client-side engine
        const rawText = uploadedFile ? await extractTextFromFile(uploadedFile) : sampleText;
        analysisResult = analyzeResumeATS({
          resumeText: rawText || sampleText,
          fileName: fileName || 'resume_diagnostic.txt',
          targetRole,
          jobDescription
        });
        storageService.setATSResult(analysisResult);
      }

      clearInterval(interval);
      setScanProgress(100);
      setIsScanning(false);
      setResults(analysisResult);

      // Award XP in frontend state
      addXP(35);

      // Re-evaluate client-side skill gap radar and achievements
      analyzeSkillGaps();
      achievementService.evaluateAchievements();
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[ATSScanner] Analysis error:', err);
      clearInterval(interval);
      setIsScanning(false);
      setErrorMessage(
        err.message || 'Failed to analyze resume. Please ensure you uploaded a valid, text-based PDF or DOCX file.'
      );
    }
  };

  const handleTailorResume = () => {
    setIsTailoring(true);
    setTimeout(() => {
      const tailored = resumeTailorEngine.tailorResume({
        rawResumeText: results?.rawText || '',
        missingKeywords: missingSkillsList,
        matchedKeywords: matchedSkillsList,
        targetRole,
        currentScore: overallScore
      });
      setTailoredResult(tailored);
      setIsTailoring(false);
      addXP(40);
    }, 450);
  };

  const handleCopyTailored = () => {
    if (!tailoredResult) return;
    navigator.clipboard.writeText(tailoredResult.fullTailoredMarkdown);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handlePrintTailored = () => {
    if (!tailoredResult) return;
    resumeTailorEngine.printScholarlyDocument(tailoredResult);
  };

  const overallScore = results?.ats_score ?? results?.overallScore ?? 0;
  const targetRole = results?.target_role ?? results?.targetRole ?? (user?.targetRole || 'Machine Learning Engineer');
  const matchedSkillsList = results?.matched_skills ?? results?.matchedSkills ?? [];
  const missingSkillsList = results?.missing_skills ?? results?.missingKeywords ?? [];
  const missingOptionalList = results?.missing_optional_skills ?? [];
  const breakdownList = results?.breakdown ?? [];
  const strengthsList = results?.strengths ?? results?.strengthsList ?? [];
  const weaknessesList = results?.weaknesses ?? results?.weakAreas ?? [];
  const sectionsList = results?.sections_detected ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-[#1A365D] uppercase tracking-wider font-mono">
            Resume Analysis & Keyword Match
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#235E3B]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Resume Report & ATS Audit
        </h1>
        <p className="text-sm text-[#70685E] mt-1">
          Scan your resume against real job requirements, identify missing keywords, and get tailored improvement suggestions.
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-md bg-[#FDF2E9] border border-[#F0C9B3] text-[#9A421A] text-xs flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#9A421A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-serif font-bold text-[#9A421A] block">Curriculum Vitæ Audit Notice</span>
            <p className="text-[#3B352E] leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Input Section: Upload Resume & Job Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Resume Dropzone (5 Cols) */}
        <GlassCard className="lg:col-span-5 p-6 space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
            <h3 className="text-xs font-bold text-[#1F1B16] uppercase tracking-wider font-mono">1. Select Curriculum Vitæ</h3>
            <Badge variant="navy" size="sm">PDF / DOCX</Badge>
          </div>

          <div className="border-2 border-dashed border-[#E5E0D5] hover:border-[#1A365D] rounded-md p-6 text-center transition-all bg-[#FAF8F3]">
            <input
              type="file"
              id="atsUpload"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="atsUpload" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-md bg-[#EAEFF5] border border-[#BAC7D5] flex items-center justify-center mx-auto text-[#1A365D] mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-serif font-bold text-[#1F1B16]">Upload Candidate Résumé</p>
              <p className="text-xs text-[#70685E] mt-1">Accepts PDF (.pdf) or Word (.docx)</p>
            </label>
          </div>

          {fileName && (
            <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <FileCheck className="w-4 h-4 text-[#1A365D] shrink-0" />
                <span className="text-xs font-mono text-[#1F1B16] truncate">{fileName}</span>
              </div>
              <Badge variant="neutral" size="sm">Loaded</Badge>
            </div>
          )}
        </GlassCard>

        {/* Right: Target Job Description (7 Cols) */}
        <GlassCard className="lg:col-span-7 p-6 space-y-4 border-[#E5E0D5] bg-[#FFFDF9] flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <h3 className="text-xs font-bold text-[#1F1B16] uppercase tracking-wider font-mono">2. Curricular Target & Context</h3>
              <span className="text-xs text-[#70685E]">Target Role: <strong className="text-[#1A365D]">{user?.targetRole || 'Machine Learning Engineer'}</strong></span>
            </div>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target role job description or optional keywords..."
              className="w-full p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#1F1B16] placeholder-[#70685E]/50 focus:outline-none focus:border-[#1A365D] transition-colors resize-none leading-relaxed font-serif"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#70685E] font-mono">
              ⚡ PyMuPDF &amp; python-docx extraction active
            </span>
            <GradientButton
              variant="primary"
              size="md"
              onClick={handleAnalyze}
              loading={isScanning}
              icon={FileSearch}
            >
              Analyze Résumé Now
            </GradientButton>
          </div>
        </GlassCard>

      </div>

      {/* Scanning Active Progress State */}
      {isScanning && (
        <GlassCard className="p-6 border-[#BAC7D5] bg-[#FFFDF9] text-center space-y-4 shadow-xs">
          <div className="flex items-center justify-center gap-2 text-[#1A365D] font-bold text-sm font-serif">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1A365D]" />
            <span>Extracting Text &amp; Calculating Evaluative Metrics... ({scanProgress}%)</span>
          </div>
          <ProgressBar value={scanProgress} height="h-2" />
          <p className="text-xs text-[#70685E]">
            Parsing document structure, normalizing canonical competencies, and calibrating with Unified Skill Profile.
          </p>
        </GlassCard>
      )}

      {/* Honest Empty State when No Resume Scanned Yet */}
      {!results && !isScanning && (
        <GlassCard className="p-8 border-[#E5E0D5] bg-[#FFFDF9] text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-center text-[#1A365D]">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-bold text-[#1F1B16]">No Résumé Audit On Record</h3>
          <p className="text-xs text-[#70685E] max-w-md mx-auto leading-relaxed">
            Upload candidate PDF or DOCX résumé above and click <strong>"Analyze Résumé Now"</strong> to benchmark against target role keywords and identify high-priority skill gaps.
          </p>
        </GlassCard>
      )}

      {/* Results Section */}
      {results && !isScanning && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Score Hero Card */}
          <GlassCard className="p-8 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-[#70685E] uppercase tracking-widest font-mono">
                    ATS-Style Evaluative Index
                  </span>
                  <Badge variant="navy" size="sm">Explainable Rubric</Badge>
                </div>
                <div className="flex items-baseline justify-center sm:justify-start gap-2">
                  <span className="text-5xl font-serif font-black text-[#1F1B16]">{overallScore}</span>
                  <span className="text-xl text-[#70685E] font-serif">/ 100</span>
                </div>
                <p className="text-xs text-[#70685E] max-w-md">
                  Evaluated for <strong>{targetRole}</strong>. Identified <strong>{matchedSkillsList.length}</strong> matching competencies and <strong>{missingSkillsList.length}</strong> priority gaps.
                </p>
                <div className="inline-block pt-1 text-[11px] text-[#70685E] italic">
                  ℹ️ <em>Note: This is an educational evaluative index based on keyword coverage, section completeness, and project density.</em>
                </div>
              </div>

              <CircularScore
                score={overallScore}
                size={110}
                strokeWidth={8}
                color="auto"
                label="ATS Index"
              />
            </div>
          </GlassCard>

          {/* Granular Breakdown Metrics */}
          {breakdownList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {breakdownList.map((item, idx) => (
                <GlassCard key={idx} className="p-4 text-center space-y-2 border-[#E5E0D5] bg-[#FFFDF9] shadow-xs">
                  <span className="text-[10px] text-[#70685E] uppercase font-bold tracking-wide block truncate font-mono">
                    {item.label}
                  </span>
                  <div className="text-2xl font-serif font-bold text-[#1F1B16]">
                    {item.score}<span className="text-xs text-[#70685E]">/{item.max}</span>
                  </div>
                  <Badge variant={item.percentage >= 80 ? 'forest' : item.percentage >= 60 ? 'navy' : 'bronze'} size="sm">
                    {item.status || (item.percentage >= 80 ? 'Strong' : item.percentage >= 60 ? 'Good' : 'Needs Improvement')}
                  </Badge>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Detected Resume Sections */}
          {sectionsList.length > 0 && (
            <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#1F1B16] flex items-center gap-1.5 mr-2 font-mono">
                <Layers className="w-3.5 h-3.5 text-[#1A365D]" />
                Detected Sections ({sectionsList.length}):
              </span>
              {sectionsList.map((sec, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-sm text-[11px] bg-[#EAEFF5] text-[#1A365D] border border-[#BAC7D5] font-mono">
                  {sec}
                </span>
              ))}
            </div>
          )}

          {/* Keywords: Matched vs Missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Matched Keywords */}
            <GlassCard className="p-6 space-y-4 border-[#CDE5D4] bg-[#FFFDF9] shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
                <CheckCircle2 className="w-5 h-5 text-[#235E3B]" />
                <h3 className="text-base font-serif font-bold text-[#235E3B]">
                  Demonstrated Competencies ({matchedSkillsList.length})
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                {matchedSkillsList.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-sm bg-[#EBF4EE] border border-[#CDE5D4] text-[#235E3B] text-xs font-mono font-medium"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </GlassCard>

            {/* Missing Keywords */}
            <GlassCard className="p-6 space-y-4 border-[#F0C9B3] bg-[#FFFDF9] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#9A421A]" />
                  <h3 className="text-base font-serif font-bold text-[#9A421A]">
                    Curricular Gaps ({missingSkillsList.length})
                  </h3>
                </div>
                <Badge variant="bronze" size="sm">Priority Gaps</Badge>
              </div>
              <p className="text-xs text-[#70685E]">
                Essential competencies for {targetRole} absent from candidate credentials:
              </p>
              <div className="flex flex-wrap gap-2 pt-1 max-h-60 overflow-y-auto pr-1">
                {missingSkillsList.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-sm bg-[#FDF2E9] border border-[#F0C9B3] text-[#9A421A] text-xs font-mono font-bold"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
              {missingOptionalList.length > 0 && (
                <div className="pt-2 border-t border-[#E5E0D5] space-y-1">
                  <span className="text-[11px] text-[#70685E] block font-mono">Elective / Secondary Skills Missing:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingOptionalList.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-sm text-[10px] bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5] font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

          </div>

          {/* Strengths & Weaknesses (Derived from actual document) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6 space-y-3 border-[#CDE5D4] bg-[#FFFDF9] shadow-xs">
              <h3 className="text-base font-serif font-bold text-[#235E3B] flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
                <CheckCircle2 className="w-5 h-5 text-[#235E3B]" />
                Demonstrated Résumé Strengths
              </h3>
              <ul className="space-y-2 text-xs text-[#3B352E]">
                {strengthsList.map((st, i) => (
                  <li key={i} className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16]">
                    ✓ {st}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-6 space-y-3 border-[#F0C9B3] bg-[#FFFDF9] shadow-xs">
              <h3 className="text-base font-serif font-bold text-[#9A421A] flex items-center gap-2 border-b border-[#E5E0D5] pb-3">
                <AlertCircle className="w-5 h-5 text-[#9A421A]" />
                Identified Deficits &amp; Opportunities
              </h3>
              <ul className="space-y-2 text-xs text-[#3B352E]">
                {weaknessesList.map((wa, i) => (
                  <li key={i} className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16]">
                    ⚠️ {wa}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* ========================================================================= */}
          {/* AUTONOMOUS CURRICULUM VITAE RE-ENGINEERING AGENT (XYZ FORMULA)            */}
          {/* ========================================================================= */}
          <GlassCard className="p-6 sm:p-8 border-[#1A365D] bg-[#FFFDF9] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#EAEFF5] border border-[#D0DBE7] flex items-center justify-center text-[#1A365D]">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="editorial-overline">AUTONOMOUS ARTIFACT GENERATOR</span>
                    <Badge variant="navy" size="sm">GOOGLE XYZ FORMULA</Badge>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#1F1B16]">
                    Autonomous Curriculum Vitæ Optimization Agent
                  </h3>
                </div>
              </div>

              {!tailoredResult ? (
                <GradientButton
                  variant="primary"
                  size="md"
                  onClick={handleTailorResume}
                  loading={isTailoring}
                  icon={Sparkles}
                >
                  Re-engineer Résumé with XYZ Formula
                </GradientButton>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyTailored}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-semibold text-[#1F1B16] hover:bg-[#F2EFE9] transition-all shadow-xs cursor-pointer"
                    title="Copy tailored markdown resume"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-[#235E3B]" /> : <Copy className="w-3.5 h-3.5 text-[#1A365D]" />}
                    <span>{hasCopied ? 'Copied Resume!' : 'Copy Resume'}</span>
                  </button>
                  <GradientButton
                    variant="primary"
                    size="sm"
                    onClick={handlePrintTailored}
                    icon={Printer}
                  >
                    Download Tailored PDF
                  </GradientButton>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#70685E] leading-relaxed">
              Transform passive experience descriptions into high-conviction accomplishments using Google's executive standard: <em>"Accomplished [X], as measured by [Y], by doing [Z]"</em> while seamlessly weaving in verified missing keywords.
            </p>

            {/* Generated Tailoring Output */}
            {tailoredResult && (
              <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Score Projection Strip */}
                <div className="p-4 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#235E3B] shrink-0" />
                    <div>
                      <strong className="text-[#235E3B] font-serif font-bold text-sm block">
                        Predictive ATS Score Jump: {tailoredResult.baselineScore}% → {tailoredResult.projectedScore}% (+{tailoredResult.scoreGain}% Gain)
                      </strong>
                      <span className="text-[#3B352E]">
                        Integrated {tailoredResult.newlyAddedKeywords.length} critical missing competencies into active execution narratives.
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 self-start sm:self-center">
                    {tailoredResult.newlyAddedKeywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-sm bg-[#FFFDF9] border border-[#C2E0C6] text-[#235E3B] font-mono text-[10px] font-bold">
                        +{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Side-by-Side Before/After Bullet Transformations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1F1B16] flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#1A365D]" />
                    <span>Experience Bullet Transformation Analysis</span>
                  </h4>

                  <div className="space-y-3">
                    {tailoredResult.bulletTransformations.map((b) => (
                      <div key={b.id} className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-2.5 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono pb-1 border-b border-[#E5E0D5]">
                          <span className="text-[#70685E] line-through">Original: "{b.original}"</span>
                          <span className="px-2 py-0.5 rounded bg-[#EAEFF5] text-[#1A365D] font-bold self-start sm:self-auto">
                            Injected: {b.injectedKeyword}
                          </span>
                        </div>

                        <p className="text-xs text-[#1F1B16] leading-relaxed font-serif">
                          <strong className="text-[#235E3B] font-sans">XYZ Re-engineered: </strong>
                          {b.tailored}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px] font-mono text-[#70685E]">
                          <div className="p-1.5 rounded bg-[#FFFDF9] border border-[#E5E0D5]">
                            <strong className="text-[#1A365D] block">X (Action):</strong> {b.xyzFormula.x}
                          </div>
                          <div className="p-1.5 rounded bg-[#FFFDF9] border border-[#E5E0D5]">
                            <strong className="text-[#235E3B] block">Y (Metric):</strong> {b.xyzFormula.y}
                          </div>
                          <div className="p-1.5 rounded bg-[#FFFDF9] border border-[#E5E0D5]">
                            <strong className="text-[#8C6E54] block">Z (Tech):</strong> {b.xyzFormula.z}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Connected Next Actions Navigation Card */}
          <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-serif font-bold text-[#1F1B16] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1A365D]" />
                  <span>Next Steps: Learn & Practice Missing Skills</span>
                </h3>
                <p className="text-xs text-[#70685E]">
                  Your missing skills have been automatically synchronized with your Skill Gap analysis and Daily Practice questions.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/skill-gap"
                  className="px-4 py-2 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] hover:bg-[#F2EFE9] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Inspect Skill Gaps</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#1A365D]" />
                </Link>
                <Link
                  to="/daily-challenge"
                  className="px-4 py-2 rounded-md bg-[#1B2A4A] hover:bg-[#142038] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>Practice Daily Drill</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </GlassCard>

        </div>
      )}
    </div>
  );
}
