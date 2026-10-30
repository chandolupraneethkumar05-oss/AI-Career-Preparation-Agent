import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Copy,
  Check,
  Sparkles,
  Users,
  Shield,
  Lightbulb,
  FileText,
  Code2,
  Send,
  Award,
  ChevronRight,
  TrendingUp,
  Brain,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import VoiceWaveformIndicator from '../components/VoiceWaveformIndicator';
import { peerRoomService } from '../services/peerRoomService';
import { reverseInterviewApi } from '../services/reverseInterviewApi';
import { useAuth } from '../context/AuthContext';

export default function PeerInterviewRoomPage() {
  const { roomId: urlRoomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roleParam = searchParams.get('role') || 'candidate';
  const [roomId, setRoomId] = useState(urlRoomId || 'ROOM-DEMO1');
  const [assignedRole, setAssignedRole] = useState(roleParam);
  const [roomInfo, setRoomInfo] = useState(null);

  // Media & WebRTC State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerName, setPeerName] = useState('Remote Peer');
  const [peerMediaState, setPeerMediaState] = useState({ video: true, audio: true });
  const [connectionState, setConnectionState] = useState('connecting');

  // Video Element Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Collaborative Room State
  const [activeTab, setActiveTab] = useState('question'); // 'question' | 'code' | 'notes'
  const [suggestedQuestion, setSuggestedQuestion] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [copilotHint, setCopilotHint] = useState(null);
  const [interviewerNote, setInterviewerNote] = useState('');
  const [interviewerRating, setInterviewerRating] = useState(4);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [sharedCode, setSharedCode] = useState('# Collaborative Coding Chamber\ndef solution():\n    pass\n');
  const [transcript, setTranscript] = useState([]);
  const [isSpeechListening, setIsSpeechListening] = useState(false);

  // Timer & Modals
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [isConcluding, setIsConcluding] = useState(false);

  // Speech Recognition Ref
  const speechRecognitionRef = useRef(null);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Speech API Dual-Channel Transcription (Free browser-native)
  const setupSpeechRecognition = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalUtterance = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalUtterance += event.results[i][0].transcript;
          }
        }
        if (finalUtterance.trim()) {
          peerRoomService.sendTranscriptUtterance(finalUtterance.trim());
          setTranscript((prev) => [
            ...prev,
            { speaker: assignedRole, text: finalUtterance.trim(), time: new Date().toLocaleTimeString() }
          ]);
        }
      };

      recognition.onerror = () => {};
      recognition.onend = () => {
        if (isSpeechListening) {
          try {
            recognition.start();
          } catch {
            // Ignore auto-restart error
          }
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
      setIsSpeechListening(true);
    } catch (err) {
      console.warn('[PeerRoom] Web Speech API init notice:', err);
    }
  }, [assignedRole, isSpeechListening]);

  // Connect to WebRTC & Signaling Service
  useEffect(() => {
    const initRoom = async () => {
      const currentRoomId = urlRoomId || roomId;
      setRoomId(currentRoomId);

      // Start local webcam & microphone
      const stream = await peerRoomService.startMedia(true, true);
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect signaling WebSocket
      await peerRoomService.connect(
        currentRoomId,
        roleParam,
        user?.name || (roleParam === 'interviewer' ? 'Student Interviewer' : 'Candidate'),
        user?.id,
        {
          joined: (data) => {
            setAssignedRole(data.role);
            setRoomInfo(data.room);
          },
          peerJoined: (data) => {
            setPeerConnected(true);
            setPeerName(data.peerName || 'Remote Peer');
            setConnectionState('connected');
          },
          peerLeft: () => {
            setPeerConnected(false);
            setConnectionState('peer_disconnected');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
          },
          remoteStream: (stream) => {
            if (remoteVideoRef.current && stream) {
              remoteVideoRef.current.srcObject = stream;
              setPeerConnected(true);
              setConnectionState('connected');
            }
          },
          localStream: (stream) => {
            if (localVideoRef.current && stream) {
              localVideoRef.current.srcObject = stream;
            }
          },
          peerMediaState: (state) => {
            setPeerMediaState((prev) => ({ ...prev, ...state }));
          },
          aiQuestionSuggested: (question) => {
            setSuggestedQuestion(question);
            setIsGeneratingQuestion(false);
          },
          activeQuestion: (q) => {
            setActiveQuestion(q);
          },
          transcriptUpdate: (utterance) => {
            setTranscript((prev) => [
              ...prev,
              { speaker: utterance.speaker, text: utterance.text, time: new Date().toLocaleTimeString() }
            ]);
          },
          aiCopilotHint: (hint) => {
            setCopilotHint(hint);
          },
          codeSync: (code) => {
            setSharedCode(code);
          },
          noteSaved: () => {
            setNoteSavedFeedback(true);
            setTimeout(() => setNoteSavedFeedback(false), 2500);
          },
          sessionConcluded: (report) => {
            setFinalReport(report);
            setIsConcluding(false);
          },
          connectionState: (state) => {
            setConnectionState(state);
            if (state === 'connected') setPeerConnected(true);
          }
        }
      );

      // Start dual-channel speech recognition
      setupSpeechRecognition();
    };

    initRoom().catch((err) => {
      console.error('Peer room initialization failed:', err);
    });

    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      peerRoomService.disconnect();
    };
  }, [urlRoomId, roleParam, user, setupSpeechRecognition]);

  // Copy Room Link
  const handleCopyLink = () => {
    const oppositeRole = assignedRole === 'interviewer' ? 'candidate' : 'interviewer';
    const link = `${window.location.origin}/peer-room/${roomId}?role=${oppositeRole}`;
    navigator.clipboard.writeText(link);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  // Toggle Media
  const handleToggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    peerRoomService.toggleAudio(next);
  };

  const handleToggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    peerRoomService.toggleVideo(next);
  };

  const handleToggleScreenShare = async () => {
    const sharing = await peerRoomService.toggleScreenShare();
    setIsScreenSharing(sharing);
  };

  // Interviewer: Request Calibrated Question from AI
  const handleRequestAiQuestion = () => {
    setIsGeneratingQuestion(true);
    peerRoomService.requestAiQuestion();
  };

  // Interviewer: Push Question to Candidate Screen
  const handlePushQuestion = () => {
    peerRoomService.pushQuestionToCandidate();
  };

  // Interviewer: Save Private Evaluation Note
  const handleSaveNote = () => {
    if (!interviewerNote.trim()) return;
    peerRoomService.submitNote(interviewerNote.trim(), interviewerRating);
    setInterviewerNote('');
  };

  // Shared Code Synchronization
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setSharedCode(newCode);
    peerRoomService.sendCodeSync(newCode);
  };

  // Conclude Session
  const handleConcludeSession = () => {
    setIsConcluding(true);
    peerRoomService.concludeSession();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & HUD BAR                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Peer Chamber</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {roomId}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                WebRTC Direct Encrypted Video • AI Proctor Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs transition-colors cursor-pointer"
            title="Copy invite link for peer"
          >
            {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium">
              {isCopiedLink ? 'Invite Copied!' : 'Copy Peer Invite'}
            </span>
          </button>
        </div>

        {/* Center: Role Indicator & Elapsed Timer */}
        <div className="flex items-center gap-2">
          <Badge variant={assignedRole === 'interviewer' ? 'indigo' : 'emerald'} size="sm">
            {assignedRole === 'interviewer' ? '🎙️ Lead Interviewer' : '🎯 Candidate'}
          </Badge>

          <div className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Right: Connection State & Exit */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              peerConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : 'bg-amber-950/40 text-amber-400 border-amber-800/60 animate-pulse'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${peerConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{peerConnected ? 'Direct P2P 60fps' : 'Waiting for Peer...'}</span>
          </div>

          <button
            type="button"
            onClick={handleConcludeSession}
            disabled={isConcluding}
            className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>{isConcluding ? 'Analyzing...' : 'End & Grade (360°)'}</span>
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. DUAL-PANE WORKSPACE: VIDEO FEEDS + AI CO-PILOT HUD          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT / CENTER: Split-Screen Video Chamber */}
        <div className="flex-1 p-3 flex flex-col gap-3 min-h-[380px] lg:min-h-0 bg-slate-950/50">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 relative">
            {/* Remote Peer Video Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg group">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {(!peerConnected || !peerMediaState.video) && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 p-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {peerConnected ? peerName : 'Waiting for Peer to Join...'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">
                      {peerConnected
                        ? 'Peer has disabled camera or audio-only mode is active.'
                        : 'Share the invite link at top to connect with your peer.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Remote Peer Label */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-medium text-slate-200">
                <span>{peerName}</span>
                <span className="text-[10px] text-slate-400">
                  ({assignedRole === 'interviewer' ? 'Candidate' : 'Lead Interviewer'})
                </span>
              </div>
            </div>

            {/* Local Video Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
              />

              {!isVideoOn && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-indigo-900/40 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Users className="w-8 h-8" />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">You (Camera Muted)</span>
                </div>
              )}

              {/* Local Self Label */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-medium text-slate-200">
                <span>You</span>
                <span className="text-[10px] text-indigo-400">
                  ({assignedRole === 'interviewer' ? 'Lead Interviewer' : 'Candidate'})
                </span>
              </div>

              {/* Local Mic Waveform Indicator */}
              {isMicOn && (
                <div className="absolute bottom-3 left-3">
                  <VoiceWaveformIndicator isSpeaking={true} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Floating Media Control Bar */}
          <div className="h-14 rounded-xl bg-slate-900/90 border border-slate-800 px-4 flex items-center justify-center gap-3 backdrop-blur-md shrink-0">
            <button
              type="button"
              onClick={handleToggleMic}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMicOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-rose-950/60 text-rose-400 border-rose-800'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleVideo}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isVideoOn
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-rose-950/60 text-rose-400 border-rose-800'
              }`}
              title={isVideoOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT: AI Proctor & Contextual Workstation */}
        <div className="w-full lg:w-[460px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 flex flex-col shrink-0">
          {/* Workspace Tabs */}
          <div className="h-11 border-b border-slate-800 px-3 flex items-center gap-2 bg-slate-900/60 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('question')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'question'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>{assignedRole === 'interviewer' ? 'AI Teleprompter' : 'Live Question'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Shared Sandbox</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{assignedRole === 'interviewer' ? 'Private Notes' : 'Transcript'}</span>
            </button>
          </div>

          {/* Workspace Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ───────────────────────────────────────────────────────── */}
            {/* TAB 1: QUESTION / AI PROCTOR TELEPROMPTER                */}
            {/* ───────────────────────────────────────────────────────── */}
            {activeTab === 'question' && (
              <div className="space-y-4">
                {/* INTERVIEWER PERSPECTIVE */}
                {assignedRole === 'interviewer' ? (
                  <>
                    <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5" />
                          <span>AI Bar-Raiser Teleprompter</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Private to You</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Generate calibrated scenario questions tailored to the candidate's target seniority.
                        Review expected concepts, then push the question to their screen.
                      </p>

                      <div className="pt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={handleRequestAiQuestion}
                          disabled={isGeneratingQuestion}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>{isGeneratingQuestion ? 'Synthesizing...' : 'Generate Calibrated Question'}</span>
                        </button>
                      </div>
                    </div>

                    {suggestedQuestion && (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400">{suggestedQuestion.topic}</span>
                          <Badge variant="indigo" size="xs">{suggestedQuestion.difficulty}</Badge>
                        </div>

                        <p className="text-sm font-medium text-white leading-relaxed">
                          "{suggestedQuestion.question}"
                        </p>

                        {/* Push to Candidate Action */}
                        <button
                          type="button"
                          onClick={handlePushQuestion}
                          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Push Question to Candidate Screen</span>
                        </button>

                        {/* Secret Rubric Checklist */}
                        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                          <span className="font-semibold text-slate-300 block">Concepts to Listen For:</span>
                          <ul className="space-y-1 text-slate-400 list-disc list-inside">
                            {suggestedQuestion.what_to_look_for?.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>

                          {suggestedQuestion.probing_follow_ups?.length > 0 && (
                            <div className="pt-2 border-t border-slate-800">
                              <span className="font-semibold text-indigo-400 block">Recommended Probing Follow-ups:</span>
                              <ul className="space-y-1 text-slate-400 list-disc list-inside mt-1">
                                {suggestedQuestion.probing_follow_ups.map((f, i) => (
                                  <li key={i}>"{f}"</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Live AI Co-Pilot Advice Hint */}
                    {copilotHint && (
                      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Live AI Co-Pilot Proctor Hint:</span>
                        </div>
                        <p className="text-xs text-slate-200">
                          {copilotHint.suggested_probe}
                        </p>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
                          <span>Coverage: {copilotHint.coverage_status}</span>
                          <span>Confidence: {copilotHint.confidence_score}%</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* CANDIDATE PERSPECTIVE */
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">
                          {activeQuestion ? activeQuestion.topic : 'Awaiting Question'}
                        </span>
                        {activeQuestion && <Badge variant="emerald" size="xs">{activeQuestion.difficulty}</Badge>}
                      </div>

                      {activeQuestion ? (
                        <p className="text-base font-semibold text-white leading-relaxed">
                          "{activeQuestion.question}"
                        </p>
                      ) : (
                        <div className="py-6 text-center space-y-2">
                          <Brain className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400">
                            The lead interviewer is selecting the first scenario question...
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-slate-300 space-y-1.5">
                      <span className="font-semibold text-emerald-400 block">Candidate Pacing Tips:</span>
                      <p>
                        • Begin by clarifying ambiguous constraints with the interviewer.<br />
                        • Propose a high-level solution before writing code or details.<br />
                        • Talk through time and space trade-offs out loud.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ───────────────────────────────────────────────────────── */}
            {/* TAB 2: SHARED CODE SANDBOX                                */}
            {/* ───────────────────────────────────────────────────────── */}
            {activeTab === 'code' && (
              <div className="space-y-2 flex flex-col h-full">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Collaborative Sandbox (Real-time P2P Sync)</span>
                  <span className="font-mono text-[10px] text-indigo-400">Python / JavaScript</span>
                </div>
                <textarea
                  value={sharedCode}
                  onChange={handleCodeChange}
                  rows={16}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>
            )}

            {/* ───────────────────────────────────────────────────────── */}
            {/* TAB 3: PRIVATE NOTES OR TRANSCRIPT                        */}
            {/* ───────────────────────────────────────────────────────── */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {assignedRole === 'interviewer' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Interviewer Notes &amp; Rating:</span>
                      {noteSavedFeedback && (
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Saved to 360° Rubric
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] text-slate-400">Score for Current Question:</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setInterviewerRating(star)}
                            className={`flex-1 py-1 rounded-md text-xs font-mono border transition-all cursor-pointer ${
                              interviewerRating >= star
                                ? 'bg-amber-950/60 border-amber-600 text-amber-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            ★ {star}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={interviewerNote}
                      onChange={(e) => setInterviewerNote(e.target.value)}
                      placeholder="Record observations, strengths, missed edge cases, or communication clarity..."
                      rows={5}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                    />

                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Save Evaluation Note
                    </button>
                  </div>
                ) : null}

                {/* Live Speech Transcript List */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Live Dual-Channel Speech Transcript:
                  </span>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {transcript.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No utterances recorded yet. Speak into your mic...</p>
                    ) : (
                      transcript.map((u, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-indigo-400 uppercase">{u.speaker}</span>
                            <span className="font-mono">{u.time}</span>
                          </div>
                          <p className="text-slate-200">{u.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. JOINT 360° EVALUATION MODAL                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {finalReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Joint 360° Collaborative Evaluation</h3>
                  <p className="text-xs text-slate-400">
                    Graded simultaneously for Candidate Competency &amp; Interviewer Mentorship
                  </p>
                </div>
              </div>
              <Badge variant="emerald" size="sm">Graded</Badge>
            </div>

            {/* Side-by-Side Score Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Candidate Scorecard */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Candidate Scorecard</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {finalReport.candidate_evaluation?.overall_score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {finalReport.candidate_evaluation?.executive_summary}
                </p>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block">Candidate Strengths:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {finalReport.candidate_evaluation?.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Verdict: </span>
                  <span className="text-emerald-400 font-bold">{finalReport.candidate_evaluation?.hire_recommendation}</span>
                </div>
              </div>

              {/* Interviewer Scorecard */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Interviewer Scorecard</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {finalReport.interviewer_evaluation?.overall_score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {finalReport.interviewer_evaluation?.executive_summary}
                </p>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block">Interviewer Strengths:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {finalReport.interviewer_evaluation?.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Leadership Bar: </span>
                  <span className="text-indigo-400 font-bold">{finalReport.interviewer_evaluation?.leadership_verdict}</span>
                </div>
              </div>
            </div>

            {/* Exit Action */}
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <GradientButton onClick={() => navigate('/dashboard')} variant="emerald" size="md">
                <span>Return to Dashboard</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
