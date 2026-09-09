import React, { useState } from 'react';
import {
  FileSearch,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Cpu
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import CircularScore from '../components/CircularScore';
import ProgressBar from '../components/ProgressBar';
import Badge from '../components/Badge';
import { MOCK_ATS_RESULT } from '../data/mockData';

export default function ATSScannerPage() {
  const [fileName, setFileName] = useState('Alex_Rivera_ML_Engineer_Resume.pdf');
  const [jobDescription, setJobDescription] = useState(
    'Seeking a Machine Learning Engineer with strong Python, PyTorch, AWS SageMaker, Docker containerization, and distributed model training experience. Must have experience optimizing model latency and tracking metrics.'
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState(() => {
    try {
      const saved = localStorage.getItem('interview_ai_ats_result');
      return saved ? JSON.parse(saved) : MOCK_ATS_RESULT;
    } catch {
      return MOCK_ATS_RESULT;
    }
  });

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleAnalyze = () => {
    setIsScanning(true);
    setScanProgress(15);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(interval);
      setScanProgress(100);
      setIsScanning(false);
      setResults(MOCK_ATS_RESULT);
      try {
        localStorage.setItem('interview_ai_ats_result', JSON.stringify(MOCK_ATS_RESULT));
        localStorage.setItem('interview_ai_ats_scanned', 'true');
      } catch (err) {
        console.error(err);
      }
    }, 1400);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            Resume Intelligence Scanner
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          ATS Resume Scanner 📄
        </h1>
        <p className="text-sm text-[#A5B4FC] mt-1">
          Audit your resume against Applicant Tracking Systems (ATS) algorithms, detect omitted tech keywords, and optimize readability.
        </p>
      </div>

      {/* Input Section: Upload Resume & Job Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Resume Dropzone (5 Cols) */}
        <GlassCard className="lg:col-span-5 p-6 space-y-4 border-purple-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Resume PDF</h3>
            <Badge variant="cyan" size="sm">PDF / DOCX</Badge>
          </div>

          <div className="border-2 border-dashed border-purple-500/30 hover:border-cyan-400/60 rounded-2xl p-6 text-center transition-all bg-[#0F1026]/50">
            <input
              type="file"
              id="atsUpload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="atsUpload" className="cursor-pointer block">
              <div className="w-12 h-12 rounded-full bg-purple-900/30 border border-purple-500/40 flex items-center justify-center mx-auto text-cyan-400 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">Upload Your Resume</p>
              <p className="text-xs text-[#A5B4FC] mt-1">Drop PDF here or browse filesystem</p>
            </label>
          </div>

          {fileName && (
            <div className="p-3 rounded-xl bg-[#0F1026] border border-cyan-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-mono text-cyan-300 truncate">{fileName}</span>
              </div>
              <Badge variant="purple" size="sm">Ready</Badge>
            </div>
          )}
        </GlassCard>

        {/* Right: Target Job Description (7 Cols) */}
        <GlassCard className="lg:col-span-7 p-6 space-y-4 border-purple-500/30 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Target Job Description</h3>
              <span className="text-xs text-[#A5B4FC]">For semantic keyword matching</span>
            </div>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste target role job description or leave as default to test..."
              className="w-full p-3.5 rounded-xl bg-[#0F1026]/70 border border-purple-500/30 text-xs text-white placeholder-[#A5B4FC]/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#A5B4FC]/70">
              ⚡ Multi-dimensional keyword extraction enabled
            </span>
            <GradientButton
              variant="primary"
              size="md"
              onClick={handleAnalyze}
              loading={isScanning}
              icon={FileSearch}
            >
              Analyze Resume Now
            </GradientButton>
          </div>
        </GlassCard>

      </div>

      {/* Scanning Active Progress State */}
      {isScanning && (
        <GlassCard className="p-6 border-cyan-500/40 text-center space-y-4 animate-pulse">
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Scanning Resume Tokens & Simulating ATS Parser... ({scanProgress}%)</span>
          </div>
          <ProgressBar value={scanProgress} gradient="purple-cyan" height="h-2.5" />
          <p className="text-xs text-[#A5B4FC]">
            Matching 48 key engineering competencies against job requirements.
          </p>
        </GlassCard>
      )}

      {/* Results Section */}
      {results && !isScanning && (
        <div className="space-y-6">
          
          {/* Main Score Hero Card */}
          <GlassCard className="p-8 border-cyan-500/30 bg-gradient-to-r from-[#191A3A] via-[#15233E] to-[#191A3A]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    ATS Compatibility Score
                  </span>
                  <Badge variant="cyan" size="sm">Prototype ATS Score • Demo Analysis</Badge>
                </div>
                <div className="flex items-baseline justify-center sm:justify-start gap-2">
                  <span className="text-5xl font-black text-white">{results.overallScore}</span>
                  <span className="text-xl text-[#A5B4FC]">/ 100</span>
                </div>
                <p className="text-xs text-[#A5B4FC] max-w-md">
                  Strong alignment! Your resume passes initial keyword filters for <strong>{results.targetRole}</strong>, but requires quantifiable impact tweaks.
                </p>
                <div className="inline-block pt-1 text-[11px] text-amber-300/90 font-medium">
                  💡 Recommendation: Add relevant keywords only when they accurately represent your skills.
                </div>
              </div>

              <CircularScore
                score={results.overallScore}
                size={110}
                strokeWidth={9}
                color="#06B6D4"
                label="ATS Index"
              />
            </div>
          </GlassCard>

          {/* Granular Breakdown Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {results.breakdown.map((item, idx) => (
              <GlassCard key={idx} className="p-4 text-center space-y-2 border-purple-500/25">
                <span className="text-[10px] text-[#A5B4FC] uppercase font-bold tracking-wide block truncate">
                  {item.label}
                </span>
                <div className="text-2xl font-black text-white">{item.score}%</div>
                <Badge variant={item.score >= 80 ? 'green' : item.score >= 70 ? 'cyan' : 'amber'} size="sm">
                  {item.status}
                </Badge>
              </GlassCard>
            ))}
          </div>

          {/* Keywords: Matched vs Missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Matched Keywords */}
            <GlassCard className="p-6 space-y-4 border-emerald-500/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Matched Keywords ({results.matchedKeywords.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.matchedKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium"
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </GlassCard>

            {/* Missing Keywords */}
            <GlassCard className="p-6 space-y-4 border-pink-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-pink-400" />
                  <h3 className="text-base font-bold text-white">Missing Critical Keywords ({results.missingKeywords.length})</h3>
                </div>
                <Badge variant="pink" size="sm">High Priority</Badge>
              </div>
              <p className="text-xs text-[#A5B4FC]">
                These terms appear frequently in job postings for this title but are absent from your resume:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {results.missingKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-pink-950/40 border border-pink-500/40 text-pink-300 text-xs font-mono font-bold"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
              <div className="p-2.5 rounded-lg bg-[#0F1026]/80 border border-pink-500/20 text-[11px] text-[#A5B4FC]">
                <strong className="text-pink-300">ATS Best Practice:</strong> Incorporate these keywords naturally in project bullet points with quantified outcomes.
              </div>
            </GlassCard>

          </div>

          {/* Recommended Keywords for Target Domain */}
          <GlassCard className="p-6 space-y-3 border-purple-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Recommended High-Yield Keywords ({results.targetRole})
              </h3>
              <Badge variant="purple" size="sm">Indexed Domain Corpus</Badge>
            </div>
            <p className="text-xs text-[#A5B4FC]">
              Keywords with highest statistical correlation to successful technical phone screens:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                'Distributed Training', 'Latency Optimization', 'ONNX / TensorRT',
                'Feature Stores', 'Canary Deployments', 'Model Observability',
                'Hyperparameter Tuning', 'RESTful Inference APIs'
              ].map((recKw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono"
                >
                  ⚡ {recKw}
                </span>
              ))}
            </div>
          </GlassCard>

          {/* Weak Areas & AI Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="p-6 space-y-3 border-amber-500/30">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                Identified Weak Areas
              </h3>
              <ul className="space-y-2 text-xs text-[#A5B4FC]">
                {results.weakAreas.map((wa, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-[#0F1026]/60 border border-amber-500/20">
                    {wa}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard className="p-6 space-y-3 border-cyan-500/30">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Actionable AI Recommendations
              </h3>
              <ul className="space-y-2 text-xs text-[#A5B4FC]">
                {results.aiRecommendations.map((rec, i) => (
                  <li key={i} className="p-2.5 rounded-lg bg-[#0F1026]/60 border border-cyan-500/20 text-white font-medium">
                    → {rec}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>

          {/* Prototype Scope Note */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center gap-3 text-xs text-[#A5B4FC]">
            <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Architecture Note:</strong> In Phase 2, this view will parse real PDFs with multimodal Gemini document intelligence and automatically generate rewritten XYZ bullet points.
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
