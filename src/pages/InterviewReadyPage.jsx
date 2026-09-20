import React, { useState } from 'react';
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
  Shield,
  Users,
  Volume2
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import CameraPreview from '../components/video/CameraPreview';
import { getInterviewerPersona } from '../data/interviewerPersonas';
import { useInterview } from '../context/InterviewContext';

export default function InterviewReadyPage() {
  const navigate = useNavigate();
  const { setup, updateSetup, startInterview } = useInterview();
  const [isStarting, setIsStarting] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'audio_only' | 'denied'
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState(false);

  const isVideoMode = setup.interviewMode === 'video';
  const isFaceToFaceMode = setup.interviewMode === 'face_to_face';
  const needsCamera = isVideoMode || isFaceToFaceMode;
  const persona = getInterviewerPersona(setup.interviewerPersona || 'julian');

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
    utterance.onend = () => setIsPlayingAudioTest(false);
    utterance.onerror = () => setIsPlayingAudioTest(false);
    setIsPlayingAudioTest(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartSession = async () => {
    setIsStarting(true);
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

  const handleSwitchToVideo = () => {
    updateSetup({ interviewMode: 'video' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 font-sans text-[#1F1B16]">
      {/* Header */}
      <div className="text-center space-y-2 border-b border-[#E5E0D5] pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1A365D] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#8C6E54]" />
          <span className="editorial-overline text-[10px]">STAGE 2 OF 3 • INTERVIEW BRIEFING &amp; SETUP</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1B16] tracking-tight">
          Interview Plan Ready
        </h1>
        <p className="text-xs sm:text-sm text-[#70685E] max-w-xl mx-auto">
          Your personalized interview session is ready based on your target role and difficulty level.
        </p>
      </div>

      {/* Main Preparation Summary Card */}
      <GlassCard className="p-8 border-[#E5E0D5] shadow-xs relative overflow-hidden space-y-8 bg-[#FFFDF9]">
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
            <Badge variant="neutral" size="sm">{setup.difficulty}</Badge>
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
                className="text-xs text-[#1A365D] hover:underline font-semibold transition-colors"
              >
                Switch to Written Text Mode
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Interviewer Persona Profile & Voice Check */}
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
                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      isPlayingAudioTest
                        ? 'bg-[#235E3B] text-white animate-pulse'
                        : 'bg-[#FFFDF9] border border-[#E5E0D5] text-[#1F1B16] hover:bg-[#FAF8F3]'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#1A365D]" />
                    <span>{isPlayingAudioTest ? 'Playing Voice...' : 'Test Interviewer Voice 🔊'}</span>
                  </button>

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
                className="text-xs text-[#1A365D] hover:underline font-semibold transition-colors"
              >
                Switch to Written Text Mode
              </button>
            </div>

            {/* Camera Preview with Live Mic Level & Permission Handler */}
            <CameraPreview
              onPermissionChange={setPermissionState}
              onFallbackToText={handleSwitchToText}
            />
          </div>
        ) : (
          <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#70685E]">
              <MessageSquare className="w-4 h-4 text-[#1A365D]" />
              <span>Written text mode selected. Type your answers using the keyboard with real-time AI feedback.</span>
            </div>
            <button
              type="button"
              onClick={() => updateSetup({ interviewMode: 'face_to_face' })}
              className="text-xs font-semibold text-[#1A365D] hover:underline shrink-0 transition-colors"
            >
              Switch to Face-to-Face
            </button>
          </div>
        )}

        {/* Evaluation Rubric Areas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
            <h3 className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1A365D]" />
              Evaluation Criteria &amp; Scoring Rubrics
            </h3>
            <span className="editorial-overline text-[10px]">EVALUATION CRITERIA</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Brain, label: 'Technical Depth & Mechanics', desc: 'Accuracy of principles, domain concepts, and practical trade-offs.' },
              { icon: Lightbulb, label: 'Problem Formulation', desc: 'Analytical thinking, edge-case consideration, and clear problem solving.' },
              { icon: MessageSquare, label: 'Answer Structure & STAR', desc: 'Logical delivery (Situation, Task, Action, Result) and concise phrasing.' },
              { icon: Target, label: 'Prompt Relevance', desc: 'Direct, focused answer addressing all parts of the question.' },
              { icon: TrendingUp, label: 'Articulation & Cadence', desc: 'Speaking pace (130-160 WPM), clarity, minimal filler words, and confidence.' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-3">
                  <div className="p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-[#1A365D] shrink-0">
                    <Icon className="w-4 h-4" />
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
            <strong className="text-[#1F1B16] font-serif block">Helpful Interview Tip:</strong>
            <p className="leading-relaxed">
              {isFaceToFaceMode
                ? 'Your AI interviewer will ask questions aloud on screen. Listen attentively, then speak looking directly at your camera. Visual cues will show when it is your turn to speak.'
                : isVideoMode
                ? 'Speak clearly at a natural, conversational pace (130–160 WPM). Support your answers with practical examples and measurable outcomes.'
                : 'Aim for structured answers (60–150 words). Include key technical concepts, real-world examples, and results to achieve the best score.'}
            </p>
          </div>
        </div>

        {/* Start Button & Navigation */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E5E0D5]">
          <button
            type="button"
            onClick={() => navigate('/interview-setup')}
            className="text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] transition-colors"
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
            className="w-full sm:w-auto px-10 py-3.5 text-sm"
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
