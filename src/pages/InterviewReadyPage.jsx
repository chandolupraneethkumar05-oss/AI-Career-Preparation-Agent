import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Brain,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Video,
  Mic,
  MicOff,
  Shield,
  Users,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Cpu,
  Layers,
  Code2,
  FileText
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import CameraPreview from '../components/video/CameraPreview';
import { getInterviewerPersona } from '../data/interviewerPersonas';
import { useInterview } from '../context/InterviewContext';
import { interviewApi } from '../services/interviewApi';

const TECH_KEYWORDS = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'Django',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes',
  'AWS', 'Git', 'HTML5', 'CSS3', 'REST APIs', 'GraphQL', 'DSA', 'OOP',
  'Pandas', 'PyTorch', 'Kafka', 'CI/CD'
];

function extractTechBadges(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return TECH_KEYWORDS.filter(k => {
    const escaped = k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
  });
}

export default function InterviewReadyPage() {
  const navigate = useNavigate();
  const { setup, updateSetup, startInterview } = useInterview();
  const [isStarting, setIsStarting] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'audio_only' | 'denied'
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState(false);
  const [speakerVerified, setSpeakerVerified] = useState(false);

  // Live Microphone Test State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [micVerified, setMicVerified] = useState(false);
  const micStreamRef = useRef(null);
  const micAudioCtxRef = useRef(null);
  const micAnimRef = useRef(null);

  // System Diagnostics State
  const [systemStatus, setSystemStatus] = useState({ status: 'checking' });

  const isVideoMode = setup.interviewMode === 'video';
  const isFaceToFaceMode = setup.interviewMode === 'face_to_face';
  const needsCamera = isVideoMode || isFaceToFaceMode;
  const persona = getInterviewerPersona(setup.interviewerPersona || 'julian');

  const detectedTech = useMemo(() => extractTechBadges(setup.jobDescription), [setup.jobDescription]);

  // Check backend readiness on mount
  useEffect(() => {
    let mounted = true;
    interviewApi.checkSystemStatus()
      .then(res => {
        if (mounted) setSystemStatus(res);
      })
      .catch(() => {
        if (mounted) setSystemStatus({ status: 'offline_ready' });
      });

    return () => {
      mounted = false;
      stopMicTest();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startMicTest = async () => {
    if (isTestingMic) {
      stopMicTest();
      return;
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone input is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      micAudioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsTestingMic(true);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        if (normalized > 12) {
          setMicVerified(true);
        }
        micAnimRef.current = requestAnimationFrame(updateMeter);
      };
      micAnimRef.current = requestAnimationFrame(updateMeter);
    } catch (err) {
      console.warn('[InterviewReadyPage] Mic test access error:', err);
      setIsTestingMic(false);
    }
  };

  const stopMicTest = () => {
    if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current && micAudioCtxRef.current.state !== 'closed') {
      micAudioCtxRef.current.close().catch(() => {});
      micAudioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setMicVolume(0);
  };

  const handleTestAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudioTest) {
      window.speechSynthesis.cancel();
      setIsPlayingAudioTest(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(persona.introGreeting);
    utterance.rate = persona.voiceSettings?.rate || 1.0;
    utterance.pitch = persona.voiceSettings?.pitch || 1.0;
    utterance.onend = () => {
      setIsPlayingAudioTest(false);
      setSpeakerVerified(true);
    };
    utterance.onerror = () => setIsPlayingAudioTest(false);
    setIsPlayingAudioTest(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartSession = async () => {
    setIsStarting(true);
    stopMicTest();
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // If user had permission denied in video or face_to_face mode, fallback to text mode automatically
      if (needsCamera && permissionState === 'denied') {
        updateSetup({ interviewMode: 'text' });
        await startInterview({ ...setup, interviewMode: 'text' });
      } else {
        await startInterview();
      }
      navigate('/mock-interview');
    } catch (err) {
      if (import.meta.env.DEV) console.debug('[InterviewReadyPage] Failed to start interview session:', err);
      navigate('/mock-interview');
    } finally {
      setIsStarting(false);
    }
  };

  const handleSwitchToText = () => {
    updateSetup({ interviewMode: 'text' });
  };

  const getDifficultyExplanation = (diff) => {
    switch (diff) {
      case 'Beginner':
        return 'Calibrated for 0-2 yrs fundamentals. Direct logic & core explanations; zero penalty for omitting complex distributed architectures.';
      case 'Intermediate':
        return 'Calibrated for 2-4 yrs applied engineering. Expects practical trade-offs, edge-case coverage, and clean modular code.';
      case 'Senior':
      case 'Staff':
        return 'Calibrated for 4+ yrs high-concurrency systems, distributed scalability, and architectural trade-offs.';
      default:
        return 'Industry standard calibration.';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 font-sans text-[#1F1B16]">
      {/* Header */}
      <div className="text-center space-y-2 border-b border-[#E5E0D5] pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1A365D] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#8C6E54]" />
          <span className="editorial-overline text-[10px]">STAGE 2 OF 3 • PRE-FLIGHT CHECK &amp; BRIEFING</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Interview Readiness Hub
        </h1>
        <p className="text-xs sm:text-sm text-[#70685E] max-w-xl mx-auto">
          Verify your audio equipment, review calibration settings, and inspect system status before starting.
        </p>
      </div>

      {/* Main Preparation Summary Card */}
      <GlassCard className="p-6 sm:p-8 border-[#E5E0D5] shadow-xs relative overflow-hidden space-y-7 bg-[#FFFDF9]">
        {/* Top Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center">
            <span className="editorial-overline text-[9px] block mb-1">Target Role</span>
            <p className="text-xs sm:text-sm font-serif font-bold text-[#1F1B16] line-clamp-1">{setup.targetRole}</p>
          </div>
          <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center">
            <span className="editorial-overline text-[9px] block mb-1">Interview Type</span>
            <Badge variant="navy" size="sm">{setup.interviewType}</Badge>
          </div>
          <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center">
            <span className="editorial-overline text-[9px] block mb-1">Interview Mode</span>
            <Badge variant={isFaceToFaceMode ? 'navy' : isVideoMode ? 'bronze' : 'emerald'} size="sm">
              {isFaceToFaceMode ? 'Face-to-Face AI' : isVideoMode ? 'Voice & Video' : 'Written Text'}
            </Badge>
          </div>
          <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-center">
            <span className="editorial-overline text-[9px] block mb-1">Difficulty Level</span>
            <Badge variant={setup.difficulty === 'Beginner' ? 'emerald' : 'neutral'} size="sm">
              {setup.difficulty}
            </Badge>
          </div>
        </div>

        {/* System & Equipment Pre-Flight Check Panel */}
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
            <h3 className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1A365D]" />
              Pre-Flight Equipment &amp; Calibration Check
            </h3>
            <span className="editorial-overline text-[10px]">ALL SYSTEMS GO</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Microphone Check */}
            <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#1F1B16] flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#1A365D]" />
                    Microphone Input
                  </span>
                  {micVerified ? (
                    <Badge variant="emerald" size="xs">READY</Badge>
                  ) : isTestingMic ? (
                    <Badge variant="navy" size="xs">TESTING</Badge>
                  ) : (
                    <Badge variant="neutral" size="xs">NOT TESTED</Badge>
                  )}
                </div>
                <p className="text-[11px] text-[#70685E] leading-relaxed">
                  {micVerified
                    ? 'Voice detected loud and clear.'
                    : isTestingMic
                    ? 'Speak aloud into your mic to test volume level.'
                    : 'Click to speak and test input sensitivity.'}
                </p>
              </div>

              {/* Volume Bar */}
              {isTestingMic && (
                <div className="space-y-1">
                  <div className="h-2 w-full bg-[#E5E0D5] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-75 ${
                        micVolume > 50 ? 'bg-amber-500' : 'bg-[#235E3B]'
                      }`}
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#70685E]">
                    <span>0%</span>
                    <span>Level: {micVolume}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={startMicTest}
                className={`w-full py-1.5 px-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                  isTestingMic
                    ? 'bg-[#1A365D] text-white'
                    : 'bg-white border border-[#E5E0D5] text-[#1F1B16] hover:bg-[#FAF8F3]'
                }`}
              >
                {isTestingMic ? 'Stop Mic Test' : 'Test Microphone 🎙️'}
              </button>
            </div>

            {/* 2. Speaker Audio Output Check */}
            <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col justify-between space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#1F1B16] flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#1A365D]" />
                    Interviewer Audio
                  </span>
                  {speakerVerified ? (
                    <Badge variant="emerald" size="xs">CONFIRMED</Badge>
                  ) : isPlayingAudioTest ? (
                    <Badge variant="navy" size="xs">PLAYING</Badge>
                  ) : (
                    <Badge variant="neutral" size="xs">UNTESTED</Badge>
                  )}
                </div>
                <p className="text-[11px] text-[#70685E] leading-relaxed">
                  {speakerVerified
                    ? 'Audio synthesizer tested successfully.'
                    : 'Listen to a sample greeting from your AI interviewer.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestAudio}
                className={`w-full py-1.5 px-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                  isPlayingAudioTest
                    ? 'bg-[#235E3B] text-white animate-pulse'
                    : 'bg-white border border-[#E5E0D5] text-[#1F1B16] hover:bg-[#FAF8F3]'
                }`}
              >
                {isPlayingAudioTest ? 'Playing Greeting...' : 'Test Speaker 🔊'}
              </button>
            </div>

            {/* 3. AI Engine Diagnostics */}
            <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#1F1B16] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#1A365D]" />
                    AI Engine &amp; Logic
                  </span>
                  <Badge variant={systemStatus.status === 'online' ? 'emerald' : 'navy'} size="xs">
                    {systemStatus.status === 'online' ? 'ONLINE' : 'AUTONOMOUS'}
                  </Badge>
                </div>
                <p className="text-[11px] text-[#70685E] leading-relaxed">
                  {systemStatus.status === 'online'
                    ? 'FastAPI LLM & RAG database fully operational.'
                    : 'Client-side autonomous engine ready for instant practice.'}
                </p>
              </div>

              <div className="pt-1.5 border-t border-[#E5E0D5] text-[10px] text-[#235E3B] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#235E3B]" />
                <span>Zero-penalty skip active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modality Preview & Calibration Section */}
        {isFaceToFaceMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
              <h3 className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#235E3B]" />
                Face-to-Face Camera &amp; Mic Check
              </h3>
              <button
                type="button"
                onClick={handleSwitchToText}
                className="text-xs text-[#1A365D] hover:underline font-semibold transition-colors cursor-pointer"
              >
                Switch to Written Text Mode
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Interviewer Persona Profile */}
              <div className="p-5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-[#1B2A4A] text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs">
                    {persona.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#1F1B16]">{persona.name}</h4>
                    <p className="text-[11px] text-[#70685E] font-medium">{persona.title}</p>
                    <span className="text-[10px] text-[#1A365D] font-mono">{persona.organization}</span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-white border border-[#E5E0D5] text-xs text-[#70685E] italic leading-relaxed">
                  "{persona.introGreeting}"
                </div>

                <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between">
                  <span className="text-[11px] text-[#70685E]">Persona Archetype:</span>
                  <Badge variant={persona.badgeVariant} size="xs">
                    {persona.archetype}
                  </Badge>
                </div>
              </div>

              {/* Candidate Camera Preview */}
              <div>
                <CameraPreview
                  onPermissionChange={setPermissionState}
                  onFallbackToText={handleSwitchToText}
                />
              </div>
            </div>
          </div>
        ) : isVideoMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
              <h3 className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-[#1A365D]" />
                Camera &amp; Audio Check
              </h3>
              <button
                type="button"
                onClick={handleSwitchToText}
                className="text-xs text-[#1A365D] hover:underline font-semibold transition-colors cursor-pointer"
              >
                Switch to Written Text Mode
              </button>
            </div>

            <CameraPreview
              onPermissionChange={setPermissionState}
              onFallbackToText={handleSwitchToText}
            />
          </div>
        ) : (
          <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#70685E]">
              <MessageSquare className="w-4 h-4 text-[#1A365D]" />
              <span>Written text mode selected. Type your answers using the keyboard with real-time AI rubrics and Coding Sandbox.</span>
            </div>
            <button
              type="button"
              onClick={() => updateSetup({ interviewMode: 'face_to_face' })}
              className="text-xs font-semibold text-[#1A365D] hover:underline shrink-0 transition-colors cursor-pointer"
            >
              Switch to Face-to-Face
            </button>
          </div>
        )}

        {/* Job Description Calibration Grounding Card */}
        {setup.jobDescription && (
          <div className="p-4 rounded-md bg-[#EBF4EE] border border-[#C2E0C6] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#235E3B] font-serif font-bold">
                <FileText className="w-4 h-4" />
                <span>Job Description Grounding Active</span>
              </div>
              <Badge variant="emerald" size="xs">LEVEL CALIBRATED</Badge>
            </div>
            <p className="text-xs text-[#235E3B]/90 leading-relaxed">
              Questions and evaluation thresholds are specifically calibrated to this role's seniority and tech stack.
            </p>
            {detectedTech.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {detectedTech.map(tech => (
                  <span key={tech} className="px-2 py-0.5 rounded-full bg-white text-[#235E3B] border border-[#C2E0C6] text-[10px] font-mono font-semibold">
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Difficulty Level Calibration Explanation */}
        <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
          <Brain className="w-4 h-4 text-[#1A365D] shrink-0 mt-0.5" />
          <div className="text-xs text-[#70685E] space-y-0.5">
            <span className="font-semibold text-[#1F1B16] block">
              {setup.difficulty} Calibration Profile:
            </span>
            <p className="leading-relaxed">
              {getDifficultyExplanation(setup.difficulty)}
            </p>
          </div>
        </div>

        {/* Evaluation Rubric Areas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
            <h3 className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1A365D]" />
              Evaluation Criteria &amp; Scoring Rubrics
            </h3>
            <span className="editorial-overline text-[10px]">SCORING DIMENSIONS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Brain, label: 'Technical Depth & Mechanics', desc: 'Accuracy of principles, domain concepts, and practical clarity.' },
              { icon: Lightbulb, label: 'Problem Formulation', desc: 'Analytical thinking, edge-case consideration, and clear problem solving.' },
              { icon: MessageSquare, label: 'Answer Structure & STAR', desc: 'Logical delivery (Situation, Task, Action, Result) and concise phrasing.' },
              { icon: Target, label: 'Prompt Relevance', desc: 'Direct, focused answer addressing all parts of the question.' },
              { icon: TrendingUp, label: 'Articulation & Cadence', desc: 'Speaking pace (130-160 WPM), clarity, minimal filler words, and confidence.' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1A365D] shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-serif font-bold text-[#1F1B16]">{item.label}</h4>
                    <p className="text-[11px] text-[#70685E] mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidate Advice */}
        <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
          <Bot className="w-5 h-5 text-[#8C6E54] shrink-0 mt-0.5" />
          <div className="text-xs text-[#70685E] space-y-1">
            <strong className="text-[#1F1B16] font-serif block">Interview Strategy:</strong>
            <p className="leading-relaxed">
              {isFaceToFaceMode
                ? 'Your AI interviewer will speak questions aloud. Listen attentively, then speak looking directly at your camera. You can also skip unfamiliar questions without penalty.'
                : isVideoMode
                ? 'Speak clearly at a natural, conversational pace (130–160 WPM). You have a secondary Skip Question button if you are unfamiliar with a specific prompt.'
                : 'Aim for structured answers (60–150 words). If you encounter a concept you have not studied yet, use the Skip Question button to move forward gracefully and log the skill gap for later practice.'}
            </p>
          </div>
        </div>

        {/* Start Button & Navigation */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E5E0D5]">
          <button
            type="button"
            onClick={() => {
              stopMicTest();
              navigate('/interview-setup');
            }}
            className="text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] transition-colors cursor-pointer"
          >
            ← Back to Setup
          </button>

          <GradientButton
            variant="primary"
            size="lg"
            onClick={handleStartSession}
            disabled={isStarting}
            loading={isStarting}
            icon={ArrowRight}
            className="w-full sm:w-auto px-10 py-3.5 text-sm cursor-pointer"
          >
            {isStarting
              ? 'Preparing Interview Session...'
              : isFaceToFaceMode
              ? permissionState === 'audio_only'
                ? 'Start Face-to-Face (Audio-Only) →'
                : permissionState === 'denied'
                ? 'Start Written Interview (Fallback) →'
                : 'Start Face-to-Face Interview →'
              : isVideoMode
              ? permissionState === 'audio_only'
                ? 'Start Audio-Only Interview →'
                : permissionState === 'denied'
                ? 'Start Written Interview (Fallback) →'
                : 'Start Voice & Video Interview →'
              : 'Start Written Interview →'}
          </GradientButton>
        </div>
      </GlassCard>
    </div>
  );
}
