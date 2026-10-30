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
  Lightbulb,
  FileText,
  Code2,
  Send,
  Award,
  ChevronRight,
  Brain,
  ArrowLeft,
  RefreshCw,
  Download,
  MessageSquare,
  Play,
  Square,
  Volume2,
  Loader2
} from 'lucide-react';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import VoiceWaveformIndicator from '../components/VoiceWaveformIndicator';
import { peerRoomService } from '../services/peerRoomService';
import { reverseInterviewApi } from '../services/reverseInterviewApi';
import { interviewApi } from '../services/interviewApi';
import { useAuth } from '../context/AuthContext';

export default function PeerInterviewRoomPage() {
  const { roomId: urlRoomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roleParam = searchParams.get('role') || 'candidate';
  const rawRoomId = (urlRoomId || 'PEER-ROOM1').toUpperCase().trim();
  const [roomId, setRoomId] = useState(rawRoomId);
  const [assignedRole, setAssignedRole] = useState(roleParam);
  const [_roomInfo, setRoomInfo] = useState(null);

  // Synchronized Lobby & Chamber Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [roleToast, setRoleToast] = useState(null);

  // Media & WebRTC State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peerInRoom, setPeerInRoom] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerName, setPeerName] = useState('Remote Peer');
  const [peerRole, setPeerRole] = useState(roleParam === 'interviewer' ? 'candidate' : 'interviewer');
  const [peerMediaState, setPeerMediaState] = useState({ video: true, audio: true });
  const [_connectionState, setConnectionState] = useState('connecting');
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);

  // Video & Audio Element Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const assignedRoleRef = useRef(assignedRole);
  const isSessionActiveRef = useRef(isSessionActive);
  const peerRoleRef = useRef(peerRole);

  useEffect(() => {
    assignedRoleRef.current = assignedRole;
    isSessionActiveRef.current = isSessionActive;
    peerRoleRef.current = peerRole;
  }, [assignedRole, isSessionActive, peerRole]);

  // Live Speech Recognition & Floating Closed-Captions
  const speechRecognitionRef = useRef(null);
  const isSpeechListeningRef = useRef(false);
  const [_isSpeechListening, setIsSpeechListening] = useState(false);
  const [interimCaption, setInterimCaption] = useState({ speaker: '', text: '' });
  const captionTimeoutRef = useRef(null);
  const [transcript, setTranscript] = useState([]);

  // Active Answer Voice Recording & Whisper Neural Transcription
  const answerAudioRecorderRef = useRef(null);
  const answerAudioChunksRef = useRef([]);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [isTranscribingAnswer, setIsTranscribingAnswer] = useState(false);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [transcriptionEngineNotice, setTranscriptionEngineNotice] = useState('');

  // Session Audio Recording (Native Web Audio Mixer)
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);

  // Collaborative Room State
  const [activeTab, setActiveTab] = useState('question'); // 'question' | 'code' | 'notes'
  const [suggestedQuestion, setSuggestedQuestion] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [copilotHint, setCopilotHint] = useState(null);
  const [interviewerNote, setInterviewerNote] = useState('');
  const [interviewerRating, setInterviewerRating] = useState(4);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [sharedCode, setSharedCode] = useState('# Collaborative Coding Sandbox\ndef solution():\n    pass\n');

  // Clipboard & Concluding State
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [isConcluding, setIsConcluding] = useState(false);
  const fallbackReportTimerRef = useRef(null);

  // Computed Clean Role Labels
  const peerRoleLabel = assignedRole === 'interviewer' ? 'Candidate' : 'Lead Interviewer';
  const myRoleLabel = assignedRole === 'interviewer' ? 'Lead Interviewer' : 'Candidate';

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Synchronized Elapsed Timer
  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) {
      return;
    }
    const updateElapsed = () => {
      const now = Date.now();
      const start = typeof sessionStartTime === 'number'
        ? sessionStartTime
        : new Date(sessionStartTime).getTime();
      const diff = Math.max(0, Math.floor((now - start) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [isSessionActive, sessionStartTime]);

  // Session Audio Mixer (Mixed Local + Remote Streams)
  const startAudioMixerRecording = useCallback((localStream, remoteStream) => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const destination = ctx.createMediaStreamDestination();

      if (localStream && localStream.getAudioTracks().length > 0) {
        const sourceLocal = ctx.createMediaStreamSource(localStream);
        sourceLocal.connect(destination);
      }
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        const sourceRemote = ctx.createMediaStreamSource(remoteStream);
        sourceRemote.connect(destination);
      }

      if (destination.stream.getAudioTracks().length > 0) {
        const recorder = new MediaRecorder(destination.stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      }
    } catch (err) {
      console.warn('[PeerRoom] Audio mixer recording initialization notice:', err);
    }
  }, []);

  // Web Speech API Dual-Channel Transcription & Closed-Captions
  const setupSpeechRecognition = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[PeerRoom] Web Speech API not supported in this browser environment.');
      return;
    }

    try {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      isSpeechListeningRef.current = true;
      setIsSpeechListening(true);

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += trans;
          } else {
            interimText += trans;
          }
        }

        if (interimText.trim()) {
          setInterimCaption({ speaker: assignedRole, text: interimText.trim() });
          peerRoomService.sendInterimSpeech(interimText.trim());
        }

        if (finalText.trim()) {
          const finalUtterance = finalText.trim();
          peerRoomService.sendTranscriptUtterance(finalUtterance);
          setTranscript((prev) => [
            ...prev,
            { speaker: assignedRole, text: finalUtterance, time: new Date().toLocaleTimeString() }
          ]);
          setInterimCaption({ speaker: assignedRole, text: finalUtterance });
          if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
          captionTimeoutRef.current = setTimeout(() => {
            setInterimCaption((curr) => (curr.text === finalUtterance ? { speaker: '', text: '' } : curr));
          }, 3500);
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech') {
          console.warn('[PeerRoom] Speech recognition event:', e.error);
        }
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          isSpeechListeningRef.current = false;
          setIsSpeechListening(false);
        }
      };

      recognition.onend = () => {
        // Continuous auto-restart with safety timeout for mobile browsers
        if (isSpeechListeningRef.current) {
          setTimeout(() => {
            if (isSpeechListeningRef.current && speechRecognitionRef.current) {
              try {
                speechRecognitionRef.current.start();
              } catch {
                // Already started or busy
              }
            }
          }, 300);
        }
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('[PeerRoom] Web Speech API setup notice:', err);
    }
  }, [assignedRole]);

  // Connect to WebRTC & Signaling Service
  useEffect(() => {
    let active = true;

    const initRoom = async () => {
      const currentRoomId = (urlRoomId || 'PEER-ROOM1').toUpperCase().trim();
      setRoomId(currentRoomId);

      // 1. Start local webcam & microphone
      const stream = await peerRoomService.startMedia(true, true);
      if (active && localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // 2. Connect signaling WebSocket with full event handlers
      await peerRoomService.connect(
        currentRoomId,
        roleParam,
        user?.name || (roleParam === 'interviewer' ? 'Student Interviewer' : 'Candidate'),
        user?.id,
        {
          joined: (data) => {
            if (!active) return;
            setAssignedRole(data.role);
            setRoomInfo(data.room);
            if (data.room && data.room.status === 'active' && data.room.started_at) {
              setIsSessionActive(true);
              setSessionStartTime(new Date(data.room.started_at));
            }
          },
          sessionStart: (data) => {
            if (!active) return;
            setIsSessionActive(true);
            setSessionStartTime(data.startedAt ? new Date(data.startedAt) : new Date());
            if (data.room) setRoomInfo(data.room);
            startAudioMixerRecording(peerRoomService.localStream, peerRoomService.remoteStream);
          },
          peerJoined: (data) => {
            if (!active) return;
            setPeerInRoom(true);
            setPeerName(data.peerName || 'Remote Peer');
            setPeerRole(data.peerRole || (assignedRoleRef.current === 'interviewer' ? 'candidate' : 'interviewer'));
          },
          peerLeft: () => {
            if (!active) return;
            setPeerInRoom(false);
            setPeerConnected(false);
            setConnectionState('peer_disconnected');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
          },
          remoteStream: (stream) => {
            if (!active) return;
            if (stream) {
              // 1. Bind remote video (muted so browser autoplay never blocks video rendering)
              if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
                remoteVideoRef.current.srcObject = stream;
              }
              if (remoteVideoRef.current) {
                remoteVideoRef.current.play().catch(() => {});
              }

              // 2. Bind remote audio to dedicated audio element
              if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== stream) {
                remoteAudioRef.current.srcObject = stream;
              }
              if (remoteAudioRef.current) {
                remoteAudioRef.current.play().then(() => {
                  setAudioAutoplayBlocked(false);
                }).catch(() => {
                  setAudioAutoplayBlocked(true);
                });
              }

              // Listen for tracks added later
              stream.onaddtrack = () => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = stream;
                  remoteVideoRef.current.play().catch(() => {});
                }
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.srcObject = stream;
                  remoteAudioRef.current.play().catch(() => {});
                }
              };

              setPeerConnected(true);
              setConnectionState('connected');
              if (isSessionActiveRef.current) {
                startAudioMixerRecording(peerRoomService.localStream, stream);
              }
            }
          },
          localStream: (stream) => {
            if (!active) return;
            if (localVideoRef.current && stream) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
          },
          trackResumed: () => {
            if (!active) return;
            if (peerRoomService.remoteStream) {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = peerRoomService.remoteStream;
                remoteVideoRef.current.play().catch(() => {});
              }
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = peerRoomService.remoteStream;
                remoteAudioRef.current.play().catch(() => {});
              }
            }
          },
          peerMediaState: (state) => {
            if (!active) return;
            setPeerMediaState((prev) => ({ ...prev, ...state }));
            if (state.video && remoteVideoRef.current && peerRoomService.remoteStream) {
              remoteVideoRef.current.srcObject = peerRoomService.remoteStream;
              remoteVideoRef.current.play().catch(() => {});
            }
          },
          roleSwapped: (data) => {
            if (!active) return;
            setAssignedRole(data.yourNewRole);
            setPeerRole(data.yourNewRole === 'interviewer' ? 'candidate' : 'interviewer');
            setRoleToast(`Roles swapped! You are now the ${data.yourNewRole === 'interviewer' ? '🎙️ Lead Interviewer' : '🎯 Candidate'}.`);
            setTimeout(() => setRoleToast(null), 3500);
          },
          roleUpdated: (data) => {
            if (!active) return;
            setAssignedRole(data.role);
          },
          peerRoleUpdated: (data) => {
            if (!active) return;
            setPeerRole(data.peerRole);
            setPeerName(data.peerRole === 'interviewer' ? 'Lead Interviewer' : 'Candidate');
          },
          peerInterimSpeech: (data) => {
            if (!active) return;
            setInterimCaption({ speaker: data.speaker || peerRoleRef.current, text: data.text });
            if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
            captionTimeoutRef.current = setTimeout(() => {
              setInterimCaption({ speaker: '', text: '' });
            }, 3500);
          },
          aiQuestionSuggested: (question) => {
            if (!active) return;
            setSuggestedQuestion(question);
            setIsGeneratingQuestion(false);
          },
          activeQuestion: (q) => {
            if (!active) return;
            setActiveQuestion(q);
          },
          transcriptUpdate: (utterance) => {
            if (!active) return;
            setTranscript((prev) => [
              ...prev,
              { speaker: utterance.speaker, text: utterance.text, time: new Date().toLocaleTimeString() }
            ]);
          },
          aiCopilotHint: (hint) => {
            if (!active) return;
            setCopilotHint(hint);
          },
          codeSync: (code) => {
            if (!active) return;
            setSharedCode(code);
          },
          noteSaved: () => {
            if (!active) return;
            setNoteSavedFeedback(true);
            setTimeout(() => setNoteSavedFeedback(false), 2500);
          },
          sessionConcluded: (report) => {
            if (!active) return;
            if (fallbackReportTimerRef.current) {
              clearTimeout(fallbackReportTimerRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              try { mediaRecorderRef.current.stop(); } catch {}
            }
            setFinalReport(report);
            setIsConcluding(false);
          },
          connectionState: (state) => {
            if (!active) return;
            setConnectionState(state);
            if (state === 'connected') setPeerConnected(true);
          },
          iceState: (state) => {
            if (!active) return;
            if (state === 'connected' || state === 'completed') {
              setPeerConnected(true);
            }
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
      active = false;
      isSpeechListeningRef.current = false;
      if (fallbackReportTimerRef.current) {
        clearTimeout(fallbackReportTimerRef.current);
      }
      if (captionTimeoutRef.current) {
        clearTimeout(captionTimeoutRef.current);
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (answerAudioRecorderRef.current && answerAudioRecorderRef.current.state === 'recording') {
        try { answerAudioRecorderRef.current.stop(); } catch {}
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
      peerRoomService.disconnect();
    };
  }, [urlRoomId, roleParam, user, setupSpeechRecognition, startAudioMixerRecording]);

  // Video Re-render Watcher
  useEffect(() => {
    if (peerConnected && peerMediaState.video && remoteVideoRef.current && peerRoomService.remoteStream) {
      if (remoteVideoRef.current.srcObject !== peerRoomService.remoteStream) {
        remoteVideoRef.current.srcObject = peerRoomService.remoteStream;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [peerConnected, peerMediaState.video]);

  // Copy Room Link & Code
  const handleCopyLink = () => {
    const oppositeRole = assignedRole === 'interviewer' ? 'candidate' : 'interviewer';
    const link = `${window.location.origin}/peer-room/${roomId}?role=${oppositeRole}`;
    navigator.clipboard.writeText(link);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2500);
  };

  // User-Controlled Role Switching in Lobby
  const handleSelectRole = (newRole) => {
    if (newRole === assignedRole) return;
    setAssignedRole(newRole);
    peerRoomService.setRole(newRole);
  };

  // In-Chamber Dynamic Role Swapping
  const handleSwapRoles = () => {
    peerRoomService.swapRoles();
  };

  // Media Controls
  const handleToggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    peerRoomService.toggleAudio(next);
  };

  const handleToggleVideo = () => {
    const next = !isVideoOn;
    setIsVideoOn(next);
    peerRoomService.toggleVideo(next);
    if (next && localVideoRef.current && peerRoomService.localStream) {
      localVideoRef.current.srcObject = peerRoomService.localStream;
      localVideoRef.current.play().catch(() => {});
    }
  };

  const handleToggleScreenShare = async () => {
    const sharing = await peerRoomService.toggleScreenShare();
    setIsScreenSharing(sharing);
  };

  // Unblock Audio Autoplay on User Gesture
  const handleUnblockAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().then(() => {
        setAudioAutoplayBlocked(false);
      }).catch(() => {});
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().catch(() => {});
    }
  };

  // Passive click/touch gesture listener to seamlessly unblock remote audio on any user touch/click
  useEffect(() => {
    const handleUserGesture = () => {
      if (remoteAudioRef.current && remoteAudioRef.current.paused && remoteAudioRef.current.srcObject) {
        remoteAudioRef.current.play().then(() => {
          setAudioAutoplayBlocked(false);
        }).catch(() => {});
      }
    };
    window.addEventListener('click', handleUserGesture, { passive: true });
    window.addEventListener('touchstart', handleUserGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleUserGesture);
      window.removeEventListener('touchstart', handleUserGesture);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Active Answer Voice Recording & Neural Whisper Transcription
  // ─────────────────────────────────────────────────────────────────
  const handleStartRecordingAnswer = async () => {
    try {
      let stream = peerRoomService.localStream;
      if (!stream || stream.getAudioTracks().length === 0) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = true;

      const audioOnlyStream = new MediaStream(stream.getAudioTracks());
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const selectedMime = mimeTypes.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';

      const recorder = selectedMime
        ? new MediaRecorder(audioOnlyStream, { mimeType: selectedMime })
        : new MediaRecorder(audioOnlyStream);

      answerAudioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          answerAudioChunksRef.current.push(e.data);
        }
      };

      recorder.start(500);
      answerAudioRecorderRef.current = recorder;
      setIsRecordingAnswer(true);
      setTranscriptionEngineNotice('Recording voice... Speak clearly into your mic.');

      // Also trigger speech recognition for live interim subtitles if supported
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.start(); } catch {}
      }
    } catch (err) {
      console.warn('[PeerRoom] Could not start answer recording:', err);
      setTranscriptionEngineNotice('Microphone access notice: Please ensure mic permissions are granted in browser.');
    }
  };

  const handleStopRecordingAnswer = async () => {
    if (!answerAudioRecorderRef.current) return;

    setIsRecordingAnswer(false);
    setIsTranscribingAnswer(true);
    setTranscriptionEngineNotice('Transcribing audio via Whisper neural engine...');

    const recorder = answerAudioRecorderRef.current;
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }

    // Wait a brief moment for final chunk
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (answerAudioChunksRef.current.length > 0) {
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(answerAudioChunksRef.current, { type: mime });

      try {
        const hint = interimCaption.text || '';
        const res = await interviewApi.transcribeAudio(audioBlob, 'en', hint);
        const transcriptText = res.transcript || hint || '';

        if (transcriptText.trim()) {
          setCandidateAnswer((prev) => (prev ? `${prev} ${transcriptText.trim()}` : transcriptText.trim()));
          setTranscriptionEngineNotice(`Whisper ASR: ${res.word_count || transcriptText.split(' ').length} words transcribed (${res.source || 'neural'})`);

          // Send to peer over WebSocket
          peerRoomService.sendTranscriptUtterance(transcriptText.trim());

          // Append to session transcript
          setTranscript((prev) => [
            ...prev,
            { speaker: assignedRole, text: transcriptText.trim(), time: new Date().toLocaleTimeString() }
          ]);
        } else {
          setTranscriptionEngineNotice('No speech detected in recording. Try speaking closer to the mic.');
        }
      } catch (err) {
        console.warn('Transcription fallback notice:', err);
        if (interimCaption.text.trim()) {
          const fallbackText = interimCaption.text.trim();
          setCandidateAnswer((prev) => (prev ? `${prev} ${fallbackText}` : fallbackText));
          peerRoomService.sendTranscriptUtterance(fallbackText);
        }
        setTranscriptionEngineNotice('Transcribed verbal response to room.');
      } finally {
        setIsTranscribingAnswer(false);
      }
    } else {
      setIsTranscribingAnswer(false);
    }
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

  // Conclude Session with Guaranteed Non-Hanging Fallback
  const handleConcludeSession = async () => {
    if (isConcluding) return;
    setIsConcluding(true);

    // Stop audio recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (answerAudioRecorderRef.current && answerAudioRecorderRef.current.state === 'recording') {
      try { answerAudioRecorderRef.current.stop(); } catch {}
    }

    // 1. Send WebSocket event
    peerRoomService.concludeSession();

    // 2. Guaranteed 4.5-second HTTP fallback so it NEVER hangs indefinitely
    fallbackReportTimerRef.current = setTimeout(async () => {
      try {
        const res = await reverseInterviewApi.getPeerReport(roomId);
        if (res.report) {
          setFinalReport(res.report);
          setIsConcluding(false);
        }
      } catch (err) {
        console.warn('Fallback report fetch fallback:', err);
        setIsConcluding(false);
      }
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none" onClick={audioAutoplayBlocked ? handleUnblockAudio : undefined}>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* DEDICATED REMOTE AUDIO ELEMENT (Always unmuted)              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ROLE SWAP TOAST NOTIFICATION                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {roleToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-indigo-600 border border-indigo-400 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{roleToast}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* AUTOPLAY AUDIO UNBLOCK BANNER                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {audioAutoplayBlocked && (
        <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center cursor-pointer flex items-center justify-center gap-2 z-40" onClick={handleUnblockAudio}>
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>Tap anywhere to enable remote audio &amp; video sound</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & HUD BAR                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/interview-setup')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Back to Setup"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">Peer Chamber</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 flex items-center gap-1 cursor-pointer"
                  title="Click to copy room code"
                >
                  <span>{roomId}</span>
                  {isCopiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs transition-colors cursor-pointer"
            title="Copy invite link for your peer"
          >
            {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-medium hidden sm:inline">
              {isCopiedLink ? 'Invite Copied!' : 'Copy Peer Invite Link'}
            </span>
            <span className="text-[11px] font-medium sm:hidden">
              {isCopiedLink ? 'Copied' : 'Invite'}
            </span>
          </button>
        </div>

        {/* Center: Role Indicator, Dynamic Role Swap & Synchronized Timer */}
        <div className="flex items-center gap-2">
          <Badge variant={assignedRole === 'interviewer' ? 'indigo' : 'emerald'} size="sm">
            {assignedRole === 'interviewer' ? '🎙️ Lead Interviewer' : '🎯 Candidate'}
          </Badge>

          {/* Dynamic Role Swap Button */}
          {isSessionActive && (
            <button
              type="button"
              onClick={handleSwapRoles}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600/80 border border-slate-700 hover:border-indigo-500 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Reverse roles: Interviewer becomes Candidate, Candidate becomes Interviewer"
            >
              <RefreshCw className="w-3 h-3 text-indigo-400" />
              <span className="hidden md:inline">Swap Roles</span>
            </button>
          )}

          {/* Synchronized Timer (Counts together once chamber entered) */}
          <div className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span>{isSessionActive ? formatTime(elapsedSeconds) : '00:00 (Lobby)'}</span>
          </div>
        </div>

        {/* Right: Connection State & End Button */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              peerConnected
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : peerInRoom
                ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/60'
                : 'bg-amber-950/40 text-amber-400 border-amber-800/60 animate-pulse'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${peerConnected ? 'bg-emerald-400' : peerInRoom ? 'bg-indigo-400' : 'bg-amber-400'}`} />
            <span>{peerConnected ? 'Live P2P Stream Active' : peerInRoom ? 'Connecting P2P...' : 'Waiting for Peer...'}</span>
          </div>

          {isSessionActive && (
            <button
              type="button"
              onClick={handleConcludeSession}
              disabled={isConcluding}
              className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{isConcluding ? 'Analyzing...' : 'End & Grade (360°)'}</span>
            </button>
          )}
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. LOBBY OR DUAL-PANE CHAMBER VIEW                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {!isSessionActive ? (
        /* ============================================================= */
        /* PRE-MEETING LOBBY (Self Check, Role Decision & Synchronized Entry) */
        /* ============================================================= */
        <div className="flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full justify-center space-y-6">
          <div className="text-center space-y-1">
            <Badge variant="indigo" size="sm">PRE-MEETING LOBBY</Badge>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Collaborative Chamber Setup
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
              Verify your camera, microphone, and chosen role. The interview and timer will start synchronously once both of you enter the chamber.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left Column: Self Video Preview & Device Check */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-indigo-400" />
                  Your Video &amp; Mic Preview
                </span>
                <span className="text-[11px] font-mono text-emerald-400">Ready</span>
              </div>

              {/* Local Mirror Box */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                />
                {!isVideoOn && (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <VideoOff className="w-10 h-10 text-slate-600" />
                    <span className="text-xs">Camera is Off</span>
                  </div>
                )}
                {isMicOn && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <VoiceWaveformIndicator isSpeaking={true} />
                  </div>
                )}
              </div>

              {/* Device Toggle Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`py-2 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isMicOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-rose-950/60 text-rose-400 border-rose-800'
                  }`}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span>{isMicOn ? 'Mic Active' : 'Mic Muted'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`py-2 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isVideoOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-rose-950/60 text-rose-400 border-rose-800'
                  }`}
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span>{isVideoOn ? 'Camera On' : 'Camera Off'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Prominent Room Code & User Role Decision */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
              {/* Prominent Room ID Display */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Chamber Room Code:</span>
                  <Badge variant="indigo" size="xs">P2P CODE</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-2xl font-mono font-extrabold text-indigo-300 tracking-wider">
                    {roomId}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Copy 6-character room code"
                    >
                      {isCopiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                      title="Copy full invite link"
                    >
                      {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Share this code with your peer. They can join directly from the Setup Page without opening full URLs.
                </p>
              </div>

              {/* User Decides Their Role */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Your Role for This Session:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('interviewer')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      assignedRole === 'interviewer'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-400">🎙️ Lead Interviewer</span>
                      {assignedRole === 'interviewer' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Access AI teleprompter, scenario questions, rubric criteria &amp; hints.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('candidate')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      assignedRole === 'candidate'
                        ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-400">🎯 Candidate</span>
                      {assignedRole === 'candidate' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Answer questions verbally, code in shared sandbox &amp; receive feedback.
                    </p>
                  </button>
                </div>
              </div>

              {/* Peer Lobby Status & Action */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Peer Lobby Status:</span>
                  <span className={`font-semibold ${peerInRoom ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {peerInRoom ? `✅ Peer Connected in Room (${peerRole})` : '⏳ Waiting for Peer to Join...'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {peerInRoom
                    ? 'Both participants are in the room! Click below to enter the chamber and start the synchronized timer.'
                    : 'Once the second participant enters with the code, both of you will enter simultaneously.'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsSessionActive(true);
                    setSessionStartTime(Date.now());
                    startAudioMixerRecording(peerRoomService.localStream, peerRoomService.remoteStream);
                  }}
                  disabled={!peerInRoom}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{peerInRoom ? 'Enter Chamber Together Now 🚀' : 'Waiting for Peer to Connect...'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================= */
        /* ACTIVE IN-CHAMBER COLLABORATIVE WORKSPACE                     */
        /* ============================================================= */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* LEFT / CENTER: Split-Screen Video Chamber */}
          <div className="flex-1 p-3 flex flex-col gap-3 min-h-[380px] lg:min-h-0 bg-slate-950/70 relative">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 relative">
              {/* Remote Peer Video Container */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg group">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${(!peerConnected || !peerMediaState.video) ? 'hidden' : ''}`}
                />

                {(!peerConnected || !peerMediaState.video) && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                      <Users className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {peerConnected ? peerRoleLabel : peerInRoom ? 'Establishing P2P Video Link...' : 'Waiting for Peer to Connect...'}
                      </h4>
                      <p className="text-xs text-slate-400 max-w-xs mt-1">
                        {peerConnected
                          ? 'Peer has muted camera. Live audio is streaming.'
                          : peerInRoom
                          ? 'Connected to signaling hub. Initializing STUN/TURN media relay...'
                          : `Share Room Code (${roomId}) with your peer to connect.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Remote Peer Label */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-medium text-slate-200 z-10">
                  <span>{peerName && !['Remote Peer', 'Candidate', 'Interviewer', 'Lead Interviewer'].includes(peerName) ? peerName : peerRoleLabel}</span>
                  <span className="text-[10px] text-indigo-400">
                    ({peerRoleLabel})
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
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] font-medium text-slate-200 z-10">
                  <span>You</span>
                  <span className="text-[10px] text-indigo-400">
                    ({myRoleLabel})
                  </span>
                </div>

                {/* Local Mic Waveform Indicator */}
                {isMicOn && (
                  <div className="absolute bottom-3 left-3 z-10">
                    <VoiceWaveformIndicator isSpeaking={true} />
                  </div>
                )}
              </div>
            </div>

            {/* FLOATING CLOSED-CAPTIONS / LIVE TRANSLATION HUD OVERLAY */}
            {interimCaption.text && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-11/12 px-4 py-2.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 shadow-2xl flex items-center gap-3 z-20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider shrink-0">
                  {interimCaption.speaker === assignedRole ? 'You' : peerRoleLabel}:
                </span>
                <p className="text-xs text-slate-100 font-medium truncate sm:whitespace-normal">
                  "{interimCaption.text}"
                </p>
              </div>
            )}

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

              <button
                type="button"
                onClick={() => {
                  if (isSpeechListening) {
                    if (speechRecognitionRef.current) {
                      try { speechRecognitionRef.current.abort(); } catch {}
                    }
                    isSpeechListeningRef.current = false;
                    setIsSpeechListening(false);
                  } else {
                    setupSpeechRecognition();
                  }
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSpeechListening
                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
                title={isSpeechListening ? 'Live Subtitles & ASR: Active' : 'Enable Live Subtitles & ASR'}
              >
                <span className={`w-2 h-2 rounded-full ${isSpeechListening ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>{isSpeechListening ? 'Live Subtitles ON' : 'Subtitles OFF'}</span>
              </button>

              {audioAutoplayBlocked && (
                <button
                  type="button"
                  onClick={handleUnblockAudio}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
                  title="Unmute incoming peer audio"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Unmute Audio</span>
                </button>
              )}
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
              {/* TAB 1: QUESTION / AI PROCTOR TELEPROMPTER */}
              {activeTab === 'question' && (
                <div className="space-y-4">
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

                          <button
                            type="button"
                            onClick={handlePushQuestion}
                            className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
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

                      {/* Candidate Spoken Response Box (Visible to Interviewer in Real-Time) */}
                      {candidateAnswer && (
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            Candidate Latest Spoken Answer:
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            "{candidateAnswer}"
                          </p>
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

                      {/* ───────────────────────────────────────────────────────────── */}
                      {/* VERBAL ANSWER RECORDER & NEURAL WHISPER ASR BAR                */}
                      {/* ───────────────────────────────────────────────────────────── */}
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Mic className="w-4 h-4 text-emerald-400" />
                            <span>Verbal Answer Recording &amp; Live AI Transcribe</span>
                          </span>
                          {isRecordingAnswer && (
                            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span>Recording Voice...</span>
                            </span>
                          )}
                          {isTranscribingAnswer && (
                            <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                              <span>Transcribing...</span>
                            </span>
                          )}
                        </div>

                        {/* Status message */}
                        {transcriptionEngineNotice && (
                          <p className="text-xs text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            {transcriptionEngineNotice}
                          </p>
                        )}

                        {/* Interactive Recording Buttons */}
                        <div className="flex gap-2">
                          {!isRecordingAnswer ? (
                            <button
                              type="button"
                              onClick={handleStartRecordingAnswer}
                              disabled={isTranscribingAnswer}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Start Speaking Answer (Live Transcribe)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleStopRecordingAnswer}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md animate-pulse"
                            >
                              <Square className="w-4 h-4 fill-current" />
                              <span>Finish &amp; Transcribe Answer</span>
                            </button>
                          )}
                        </div>

                        {/* Display Transcribed Response */}
                        {candidateAnswer && (
                          <div className="pt-2 border-t border-slate-800 space-y-1">
                            <span className="text-[11px] font-semibold text-slate-400 block">Your Transcribed Response:</span>
                            <p className="text-xs text-emerald-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                              "{candidateAnswer}"
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

              {/* TAB 2: SHARED CODE SANDBOX */}
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

              {/* TAB 3: PRIVATE NOTES OR TRANSCRIPT */}
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
                    <span className="text-xs font-semibold text-slate-400 block flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      Live Dual-Channel Speech Transcript:
                    </span>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {transcript.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No utterances recorded yet. Click 'Start Speaking Answer' to record and transcribe...</p>
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
      )}

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

            {/* Audio Download Link if Captured */}
            {recordedAudioUrl && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Session Audio Recording (Live WebRTC Dialogue)</span>
                </div>
                <a
                  href={recordedAudioUrl}
                  download={`peer_interview_${roomId}.webm`}
                  className="py-1 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Download Audio (.webm)
                </a>
              </div>
            )}

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
