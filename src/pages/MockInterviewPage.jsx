import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  Send,
  ArrowRight,
  Sparkles,
  Clock,
  Lightbulb,
  Zap,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  FileText,
  Code2,
  Briefcase,
  Users,
  Loader2,
  SkipForward,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Target
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GradientButton from '../components/GradientButton';
import Badge from '../components/Badge';
import ProgressBar from '../components/ProgressBar';
import CircularScore from '../components/CircularScore';
import RecordingControls from '../components/video/RecordingControls';
import InterviewProcessingModal from '../components/video/InterviewProcessingModal';
import AiInterviewerAvatar from '../components/video/AiInterviewerAvatar';
import CodeDisputationSandbox from '../components/CodeDisputationSandbox';
import { getCompanyPlaybook } from '../data/companyPlaybooks';
import { getInterviewerPersona } from '../data/interviewerPersonas';
import { useFaceToFaceDialogue } from '../hooks/useFaceToFaceDialogue';
import { useInterview } from '../context/InterviewContext';
import { useAuth } from '../context/AuthContext';
import { interviewApi } from '../services/interviewApi';
import MarqueeBanner from '../components/MarqueeBanner';

export default function MockInterviewPage() {
  const navigate = useNavigate();
  const {
    session,
    setup,
    startInterview,
    submitCurrentAnswer,
    advanceQuestion,
    completeInterview,
    recordHintUsed,
    setRecordingData,
    setCommunicationAnalysis,
    setRecordedBlob
  } = useInterview();
  const { user, addXP } = useAuth();


  const isFaceToFaceMode = setup.interviewMode === 'face_to_face';
  const isVideoMode = setup.interviewMode === 'video' || isFaceToFaceMode;
  const activePlaybook = getCompanyPlaybook(session.companyPlaybook || setup.companyPlaybook || 'general');
  const activePersona = getInterviewerPersona(session.interviewerPersona || setup.interviewerPersona || 'julian');
  const [isInterviewerMuted, setIsInterviewerMuted] = useState(false);

  const {
    isInterviewerSpeaking,
    speakQuestion,
    stopSpeaking
  } = useFaceToFaceDialogue({
    personaId: activePersona.id,
    language: setup.interviewLanguage || 'en',
    isMuted: isInterviewerMuted
  });

  // State
  const [activeCandidateTab, setActiveCandidateTab] = useState('defense'); // 'defense' | 'sandbox'
  const [answerInput, setAnswerInput] = useState('');
  const [currentEval, setCurrentEval] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQuickAnswer, setIsGeneratingQuickAnswer] = useState(false);
  const [quickAnswerError, setQuickAnswerError] = useState(null);
  const [activeNudge, setActiveNudge] = useState(null);

  // Stage 2: Workspace Redesign & Skip Support
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isCopiedQuestion, setIsCopiedQuestion] = useState(false);
  const [isCopiedExemplar, setIsCopiedExemplar] = useState(false);
  const [showRubricFocus, setShowRubricFocus] = useState(true);
  const [showExemplarAnswer, setShowExemplarAnswer] = useState(false);
  const [exemplarAnswerText, setExemplarAnswerText] = useState('');
  const [isLoadingExemplar, setIsLoadingExemplar] = useState(false);

  // Per-Question Overall Timer (180 seconds / 3 minutes per question)
  const QUESTION_TIME_LIMIT = 180;
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_LIMIT);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Video & Recording State
  const [mediaStream, setMediaStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [answerDurationSeconds, setAnswerDurationSeconds] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [transcriptionEngineNotice, setTranscriptionEngineNotice] = useState('');

  // Refs
  const candidateVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const isRecordingAnswerRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const allRecordedChunksRef = useRef([]);
  const answerAudioRecorderRef = useRef(null);
  const answerAudioChunksRef = useRef([]);
  const answerTimerIntervalRef = useRef(null);
  const segmentsRef = useRef([]);
  const totalSessionRecordedSecsRef = useRef(0);
  const sessionRecordingStartTimeRef = useRef(null);
  const questionStartSecRef = useRef(0);

  // Auto-start session if loaded without active session
  useEffect(() => {
    if (!session.active && !session.isLoading) {
      startInterview();
    }
  }, [session.active, session.isLoading, startInterview]);

  // Initialize media stream if in video mode
  useEffect(() => {
    if (!isVideoMode) return;

    let localStream = null;

    const initVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            aspectRatio: { ideal: 1.7777777778 },
            frameRate: { ideal: 30, min: 24 },
            facingMode: 'user'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1
          }
        });
        localStream = stream;
        setMediaStream(stream);
        if (candidateVideoRef.current) {
          candidateVideoRef.current.srcObject = stream;
        }

        // Setup MediaRecorder with crystal clear high bitrate and optimal codecs
        allRecordedChunksRef.current = [];
        sessionRecordingStartTimeRef.current = Date.now();
        questionStartSecRef.current = 0;

        if (typeof MediaRecorder !== 'undefined') {
          const preferredMimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264,opus',
            'video/webm',
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4'
          ];

          let selectedMime = '';
          for (const mime of preferredMimeTypes) {
            if (MediaRecorder.isTypeSupported(mime)) {
              selectedMime = mime;
              break;
            }
          }

          let recorder = null;
          const recorderOptions = {
            videoBitsPerSecond: 2500000, // 2.5 Mbps crystal clear HD video
            audioBitsPerSecond: 128000   // 128 kbps high fidelity voice
          };
          if (selectedMime) {
            recorderOptions.mimeType = selectedMime;
          }

          try {
            recorder = new MediaRecorder(stream, recorderOptions);
          } catch (optErr) {
            console.warn('[MockInterviewPage] Fallback to basic MediaRecorder options:', optErr);
            try {
              recorder = selectedMime ? new MediaRecorder(stream, { mimeType: selectedMime }) : new MediaRecorder(stream);
            } catch (basicErr) {
              recorder = new MediaRecorder(stream);
            }
          }

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              allRecordedChunksRef.current.push(e.data);
            }
          };

          mediaRecorderRef.current = recorder;

          // Start the continuous session recording in 1-second timeslices
          try {
            recorder.start(1000);
          } catch (startErr) {
            console.debug('[MockInterviewPage] Auto-start video capture notice:', startErr);
          }
        }
      } catch (err) {
        console.warn('[MockInterviewPage] Could not initialize camera/mic:', err);
      }
    };

    initVideo();

    // Setup Web Speech API for verbal answer transcription
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = setup.interviewLanguage === 'te' ? 'te-IN' : setup.interviewLanguage === 'hi' ? 'hi-IN' : setup.interviewLanguage === 'es' ? 'es-ES' : 'en-US';
        
        let sessionFinalText = '';

        recognition.onresult = (event) => {
          let interim = '';
          let sessionFinal = '';
          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            if (item.isFinal) {
              sessionFinal += item[0].transcript + ' ';
            } else {
              interim += item[0].transcript;
            }
          }
          sessionFinalText = sessionFinal;

          // Combine committed transcript from previous sessions + current session's final and interim words
          const base = accumulatedTranscriptRef.current ? accumulatedTranscriptRef.current + ' ' : '';
          const current = (base + sessionFinalText + interim).replace(/\s+/g, ' ').trim();

          if (current) {
            setAnswerInput(current);
          }
        };

        // Browser engines (Chrome/Edge) auto-stop recognition after ~60-70 words or silence.
        // We catch onend, commit the current chunk into accumulatedTranscriptRef, and seamlessly restart!
        recognition.onend = () => {
          if (sessionFinalText) {
            accumulatedTranscriptRef.current = (
              (accumulatedTranscriptRef.current ? accumulatedTranscriptRef.current + ' ' : '') + sessionFinalText
            ).replace(/\s+/g, ' ').trim();
            sessionFinalText = '';
          }

          if (isRecordingAnswerRef.current) {
            try {
              recognition.start();
            } catch (err) {
              console.debug('[SpeechRecognition] Auto-restart notice:', err);
            }
          }
        };

        recognition.onerror = (e) => {
          if (e.error !== 'no-speech') {
            console.debug('[SpeechRecognition error]', e.error);
          }
        };

        speechRecognitionRef.current = recognition;
      } catch (speechErr) {
        console.warn('SpeechRecognition setup notice:', speechErr);
      }
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.abort(); } catch (_) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isVideoMode]);

  // Overall question countdown loop
  useEffect(() => {
    let interval;
    if (isTimerRunning && secondsLeft > 0 && !currentEval) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft, currentEval]);

  // Answer recording timer loop
  useEffect(() => {
    if (isRecordingAnswer) {
      answerTimerIntervalRef.current = setInterval(() => {
        setAnswerDurationSeconds(prev => prev + 1);
        totalSessionRecordedSecsRef.current += 1;
      }, 1000);
    } else {
      if (answerTimerIntervalRef.current) {
        clearInterval(answerTimerIntervalRef.current);
      }
    }
    return () => {
      if (answerTimerIntervalRef.current) clearInterval(answerTimerIntervalRef.current);
    };
  }, [isRecordingAnswer]);

  const totalQuestions = session.totalQuestions || 5;
  const currentNum = session.currentIndex + 1;
  const currentQuestion = session.questions[session.currentIndex] || {
    id: 'fallback_1',
    question: 'Explain the fundamental difference between Machine Learning and Deep Learning.',
    category: 'Core Concepts',
    currentDifficulty: 'Intermediate'
  };

  const wordCount = answerInput.trim().split(/\s+/).filter(Boolean).length;

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start verbal answer recording (audio MediaRecorder for Whisper ASR + browser live interim preview)
  const handleStartRecording = async () => {
    isRecordingAnswerRef.current = true;
    accumulatedTranscriptRef.current = answerInput.trim();
    answerAudioChunksRef.current = [];
    setTranscriptionEngineNotice('');

    // Setup dedicated audio recording for neural Whisper ASR
    try {
      let streamToUse = mediaStream;
      if (!streamToUse && navigator.mediaDevices?.getUserMedia) {
        streamToUse = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      }

      if (streamToUse && typeof MediaRecorder !== 'undefined') {
        const audioTracks = streamToUse.getAudioTracks();
        if (audioTracks.length > 0) {
          const audioOnlyStream = new MediaStream(audioTracks);
          const preferredAudioMime = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4'
          ].find(mime => MediaRecorder.isTypeSupported(mime)) || '';

          const audioRec = preferredAudioMime
            ? new MediaRecorder(audioOnlyStream, { mimeType: preferredAudioMime })
            : new MediaRecorder(audioOnlyStream);

          audioRec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              answerAudioChunksRef.current.push(e.data);
            }
          };

          audioRec.start(250); // Timeslice into 250ms chunks
          answerAudioRecorderRef.current = audioRec;
        }
      }
    } catch (recErr) {
      console.warn('[MockInterviewPage] Audio recorder init notice:', recErr);
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.start();
      } catch (err) {
        console.debug('SpeechRecognition already active');
      }
    }
    setIsRecordingAnswer(true);
  };

  // Stop verbal answer recording (triggers server-side Whisper neural transcription)
  const handleStopRecording = () => {
    isRecordingAnswerRef.current = false;
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (err) {
        console.debug('SpeechRecognition stop notice');
      }
    }

    if (answerAudioRecorderRef.current && answerAudioRecorderRef.current.state === 'recording') {
      try {
        const activeRec = answerAudioRecorderRef.current;
        activeRec.onstop = async () => {
          if (answerAudioChunksRef.current.length > 0) {
            const mimeType = activeRec.mimeType || 'audio/webm';
            const audioBlob = new Blob(answerAudioChunksRef.current, { type: mimeType });
            if (audioBlob.size > 1000) {
              setIsTranscribingAudio(true);
              setTranscriptionEngineNotice('Transcribing audio via Whisper ASR neural engine...');
              try {
                const lang = setup.interviewLanguage || 'en';
                const result = await interviewApi.transcribeAudio(
                  audioBlob,
                  lang,
                  accumulatedTranscriptRef.current
                );
                if (result && result.transcript) {
                  setAnswerInput(result.transcript);
                  accumulatedTranscriptRef.current = result.transcript;
                  setTranscriptionEngineNotice(`Whisper ASR: ${result.word_count} words transcribed (${result.source || 'neural'})`);
                } else if (!answerInput.trim() && accumulatedTranscriptRef.current) {
                  setAnswerInput(accumulatedTranscriptRef.current);
                  setTranscriptionEngineNotice('');
                }
              } catch (txErr) {
                console.warn('[MockInterviewPage] Whisper transcription error:', txErr);
                setTranscriptionEngineNotice('');
              } finally {
                setIsTranscribingAudio(false);
              }
            }
          }
        };
        activeRec.stop();
      } catch (stopErr) {
        console.warn('[MockInterviewPage] Audio recorder stop notice:', stopErr);
      }
    }

    setIsRecordingAnswer(false);
  };

  // In Face-to-Face mode: automatically speak question upon arrival and open candidate mic when speech ends
  useEffect(() => {
    setActiveNudge(null);
    if (!isFaceToFaceMode || !currentQuestion?.question || !!currentEval) return;

    const timer = setTimeout(() => {
      speakQuestion(currentQuestion.question, () => {
        handleStartRecording();
      });
    }, 450);

    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [currentQuestion?.id, isFaceToFaceMode]);

  // Reset answer recording
  const handleResetRecording = () => {
    handleStopRecording();
    answerAudioChunksRef.current = [];
    accumulatedTranscriptRef.current = '';
    setTranscriptionEngineNotice('');
    setAnswerDurationSeconds(0);
    setAnswerInput('');
  };

  // Toggle Camera
  const handleToggleCamera = () => {
    if (!mediaStream) return;
    const videoTracks = mediaStream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const nextState = !isCameraOn;
    videoTracks.forEach(track => { track.enabled = nextState; });
    setIsCameraOn(nextState);
  };

  // Toggle Mic
  const handleToggleMic = () => {
    if (!mediaStream) return;
    const audioTracks = mediaStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    const nextState = !isMicMuted;
    audioTracks.forEach(track => { track.enabled = !nextState; });
    setIsMicMuted(nextState);
  };

  // Optional AI Question Read-Aloud (Text-to-Speech)
  const handleToggleAiReadAloud = () => {
    if (!('speechSynthesis' in window)) return;
    if (isAiSpeaking) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsAiSpeaking(true);
    }
  };

  // AI Coach Hint System ("Request a Hint")
  const handleRequestNudge = () => {
    if (isSubmitting || !!currentEval) return;

    let hint = '';
    const qText = currentQuestion?.question || '';
    const qCategory = currentQuestion?.category || '';
    const qFocus = currentQuestion?.expectedFocus || '';

    if (qFocus) {
      hint = `Coach Hint: Focus your answer on "${qFocus}". Mention practical examples, any edge cases, and the main trade-offs.`;
    } else if (/system|architect|design|scale|throughput|cache|distribut/i.test(qText + qCategory)) {
      hint = 'Coach Hint: Break down your architecture step-by-step: handle incoming requests, data storage, and how the system handles failures or high traffic.';
    } else if (/ml|model|learning|data|neural|gradient|train|drift/i.test(qText + qCategory)) {
      hint = 'Coach Hint: Explain how you train the model, how it handles real-time predictions, and how you monitor performance in production.';
    } else if (/tree|graph|dp|dynamic|array|pointer|sort|search|hash|algorithm/i.test(qText + qCategory)) {
      hint = 'Coach Hint: Start with a simple approach, identify what makes it slow, and improve it using better data structures or caching.';
    } else {
      hint = 'Coach Hint: Start with your key assumption, address the main problem constraint, and clearly explain why your approach works.';
    }

    recordHintUsed(currentQuestion?.id);
    setActiveNudge(hint);

    // In face-to-face mode, interviewer speaks the coach hint aloud with mouth animation
    if (isFaceToFaceMode && speakQuestion) {
      speakQuestion(hint);
    }
  };

  // Copy question text to clipboard
  const handleCopyQuestion = () => {
    if (currentQuestion?.question) {
      navigator.clipboard.writeText(currentQuestion.question);
      setIsCopiedQuestion(true);
      setTimeout(() => setIsCopiedQuestion(false), 2000);
    }
  };

  // Confirm and execute skip action
  const handleConfirmSkip = async () => {
    setIsSkipModalOpen(false);
    setIsSkipping(true);
    stopSpeaking();
    if (isRecordingAnswer) {
      handleStopRecording();
    }
    setIsTimerRunning(false);

    try {
      const evaluation = await submitCurrentAnswer("", { skipped: true, isSkipped: true });
      setCurrentEval(evaluation);
    } catch (err) {
      if (import.meta.env.DEV) console.debug('Skip submission error:', err);
      handleNext();
    } finally {
      setIsSkipping(false);
      addXP(10); // Reward active session progress
    }
  };

  // Fetch or reveal staff-level model answer
  const handleFetchExemplarAnswer = async () => {
    if (exemplarAnswerText) {
      setShowExemplarAnswer(prev => !prev);
      return;
    }
    setShowExemplarAnswer(true);
    setIsLoadingExemplar(true);
    try {
      const resp = await interviewApi.getQuickAnswer({
        question: currentQuestion.question,
        topic: currentQuestion.category || currentQuestion.skill || 'Engineering Fundamentals',
        difficulty: currentQuestion.currentDifficulty || currentQuestion.difficulty || 'Intermediate',
        interviewType: setup?.interviewType || 'Technical',
        targetRole: setup?.targetRole || 'Software Engineer',
        language: setup?.interviewLanguage || 'en',
        userId: user?.id || 'usr_candidate',
        sessionId: session?.sessionId,
        questionId: currentQuestion?.id
      });
      if (resp && resp.quick_answer) {
        setExemplarAnswerText(resp.quick_answer);
      } else {
        setExemplarAnswerText(
          `Staff-Level Model Response:\n\n` +
          `1. Thesis & Fundamentals: For "${currentQuestion.question}", start with direct definitions and core mechanisms.\n\n` +
          `2. Technical Trade-Offs: Contrast the standard approach with practical alternatives (e.g. latency vs consistency, memory vs CPU overhead).\n\n` +
          `3. Real-World Context: Close by citing concrete production edge-cases or empirical metrics that validate reliability.`
        );
      }
    } catch (err) {
      setExemplarAnswerText(
        `Staff-Level Model Response:\n\n` +
        `1. Thesis & Fundamentals: For "${currentQuestion.question}", start with direct definitions and core mechanisms.\n\n` +
        `2. Technical Trade-Offs: Contrast the standard approach with practical alternatives (e.g. latency vs consistency, memory vs CPU overhead).\n\n` +
        `3. Real-World Context: Close by citing concrete production edge-cases or empirical metrics that validate reliability.`
      );
    } finally {
      setIsLoadingExemplar(false);
    }
  };

  // Quick Answer Autofill for testing
  const handleQuickAnswer = async () => {
    if (isGeneratingQuickAnswer || !currentQuestion?.question || !!currentEval) return;
    setIsGeneratingQuickAnswer(true);
    setQuickAnswerError(null);

    try {
      const resp = await interviewApi.getQuickAnswer({
        question: currentQuestion.question,
        topic: currentQuestion.category || currentQuestion.skill || 'Machine Learning',
        difficulty: currentQuestion.currentDifficulty || currentQuestion.difficulty || 'Intermediate',
        interviewType: setup?.interviewType || 'Technical',
        targetRole: setup?.targetRole || 'Machine Learning Engineer',
        language: setup?.interviewLanguage || 'en',
        userId: user?.id || 'usr_candidate',

        sessionId: session?.sessionId,
        questionId: currentQuestion?.id
      });

      if (resp && resp.quick_answer) {
        setAnswerInput(resp.quick_answer);
        if (isVideoMode && answerDurationSeconds === 0) {
          setAnswerDurationSeconds(42); // Simulate realistic spoken answer duration for metrics
          totalSessionRecordedSecsRef.current += 42;
        }
      }
    } catch (err) {
      if (import.meta.env.DEV) console.debug('Failed to generate quick answer:', err);
      setQuickAnswerError('Could not autofill answer. Please try again.');
    } finally {
      setIsGeneratingQuickAnswer(false);
    }
  };

  // Submit current question answer
  const handleSubmit = async () => {
    if (!answerInput.trim() || isSubmitting) return;

    stopSpeaking();
    if (isRecordingAnswer) {
      handleStopRecording();
    }

    setIsSubmitting(true);
    setIsTimerRunning(false);

    // Save segment info based on the continuous session recording clock
    const nowSec = sessionRecordingStartTimeRef.current
      ? (Date.now() - sessionRecordingStartTimeRef.current) / 1000
      : (totalSessionRecordedSecsRef.current || 30);
    const startSec = questionStartSecRef.current || 0;
    const durationSec = Math.max(1, Math.round(nowSec - startSec));

    const segment = {
      question_id: currentQuestion.id,
      start_time: Math.round(startSec),
      end_time: Math.round(nowSec),
      duration: durationSec,
      transcript: answerInput
    };
    segmentsRef.current.push(segment);

    try {
      const evaluation = await submitCurrentAnswer(answerInput);
      setCurrentEval(evaluation);
    } catch (err) {
      if (import.meta.env.DEV) console.debug('Submission evaluation error:', err);
    } finally {
      setIsSubmitting(false);
      addXP(25);
    }
  };

  // Advance to next question or trigger completion
  const handleNext = async () => {
    stopSpeaking();
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }

    const isFinished = advanceQuestion();
    setAnswerInput('');
    accumulatedTranscriptRef.current = '';
    setCurrentEval(null);
    setActiveNudge(null);
    setQuickAnswerError(null);
    setIsGeneratingQuickAnswer(false);
    setSecondsLeft(QUESTION_TIME_LIMIT);
    setAnswerDurationSeconds(0);
    setIsTimerRunning(true);
    setExemplarAnswerText('');
    setShowExemplarAnswer(false);
    setIsSkipModalOpen(false);
    setIsSkipping(false);

    // Track the start offset of the new question in the continuous recording
    if (sessionRecordingStartTimeRef.current) {
      questionStartSecRef.current = (Date.now() - sessionRecordingStartTimeRef.current) / 1000;
    }

    if (isFinished) {
      if (isVideoMode) {
        setIsProcessingModalOpen(true);
      } else {
        navigate('/interview-feedback');
      }
    }
  };

  // Final processing pipeline executed inside InterviewProcessingModal
  const handleProcessRecordingPipeline = async () => {
    // 0. Flush in-flight MediaRecorder data and finalize the single continuous container
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
        // Allow time for ondataavailable event to fire
        await new Promise(res => setTimeout(res, 300));
      } catch (recStopErr) {
        console.warn('Recorder flush error:', recStopErr);
      }
    }

    const sessionId = session.sessionId || `session_${Date.now()}`;
    const totalDuration = sessionRecordingStartTimeRef.current
      ? Math.round((Date.now() - sessionRecordingStartTimeRef.current) / 1000)
      : (totalSessionRecordedSecsRef.current || 120);
    const allSegments = segmentsRef.current;
    const fullTranscript = allSegments.map(s => s.transcript).join(' ');

    // 1. Compile video Blob from the single continuous recording
    let fullBlob = null;
    if (allRecordedChunksRef.current.length > 0) {
      try {
        const chunkMime = mediaRecorderRef.current?.mimeType || allRecordedChunksRef.current[0]?.type || 'video/webm';
        fullBlob = new Blob(allRecordedChunksRef.current, { type: chunkMime });
        setRecordedBlob(fullBlob);
      } catch (blobErr) {
        console.warn('Blob assembly error:', blobErr);
      }
    }

    // 2. Perform communication analysis
    let commMetrics = null;
    try {
      commMetrics = await interviewApi.analyzeCommunication({
        sessionId,
        transcript: fullTranscript,
        durationSeconds: totalDuration,
        questionCount: totalQuestions,
        isBehavioral: setup.interviewType === 'Behavioral',
        userId: user?.id || 'usr_candidate'
      });
      setCommunicationAnalysis(commMetrics);
    } catch (commErr) {
      console.warn('Communication analysis notice:', commErr);
    }

    // 3. Save recording metadata and physical file
    try {
      const recResp = await interviewApi.saveRecording({
        sessionId,
        fileBlob: fullBlob,
        recordingMode: 'video',
        durationSeconds: totalDuration,
        mimeType: fullBlob?.type || 'video/webm',
        segments: allSegments,
        communicationMetrics: commMetrics,
        userId: user?.id || 'usr_candidate'
      });

      setRecordingData(recResp);
    } catch (saveErr) {
      console.warn('Save recording notice:', saveErr);
    }

    // 4. Complete session and calculate final aggregates
    await completeInterview();
  };

  // Loading state
  if (session.isLoading || (session.active && session.questions.length === 0)) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6 font-sans text-[#1F1B16]">
        <GlassCard className="p-10 border-[#E5E0D5] shadow-xs relative overflow-hidden space-y-6 bg-[#FFFDF9]">
          <div className="w-14 h-14 rounded-md bg-[#1B2A4A] flex items-center justify-center mx-auto text-white">
            <span className="font-serif font-bold text-xl text-white">TP</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#1F1B16]">Calibrating Examination Committee...</h2>
            <p className="text-xs sm:text-sm text-[#70685E] max-w-md mx-auto">
              Synthesizing tailored prompts and checking knowledge base archives to structure an authoritative, dynamic interview session.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-[#1A365D] font-mono">
            <Sparkles className="w-4 h-4 text-[#8C6E54]" />
            <span>Aligning syllabus with local RAG and pedagogical corpus...</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20 font-sans text-[#1F1B16] relative">
      {/* Top Header Bar: Progress, Question Counter & Active Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4 bg-[#FFFDF9]/60 backdrop-blur-xs rounded-lg p-3 sm:p-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="editorial-overline text-[10px]">AI INTERVIEW ROOM</span>
            <span className="w-2 h-2 rounded-full bg-[#235E3B] animate-pulse" />
            
            {/* Target Role Pill */}
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FAF8F3] text-[#1A365D] border border-[#E5E0D5] flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-[#1A365D]" />
              {setup?.targetRole || 'Engineering Candidate'}
            </span>

            {/* Mode Indicator */}
            {isFaceToFaceMode ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EBF4EE] text-[#235E3B] border border-[#C2E0C6] flex items-center gap-1">
                <Users className="w-3 h-3 text-[#235E3B]" />
                Face-to-Face AI
              </span>
            ) : isVideoMode ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FDF2E9] text-[#9A421A] border border-[#F0D5C0] flex items-center gap-1">
                <Video className="w-3 h-3 text-[#9A421A]" />
                Voice &amp; Video
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EAEFF5] text-[#1A365D] border border-[#D0DBE7]">
                Written Text
              </span>
            )}

            {setup?.jobDescription && (
              <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF8F3] text-[#8C6E54] border border-[#E5E0D5] items-center gap-1">
                <Target className="w-3 h-3 text-[#8C6E54]" />
                JD Grounded
              </span>
            )}
          </div>

          {/* Question Step Navigator Pills (Talent Shine Style [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]) */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const qNum = idx + 1;
                const isCompleted = idx < currentNum - 1 || (idx === currentNum - 1 && !!currentEval);
                const isCurrent = idx === currentNum - 1 && !currentEval;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center w-7 h-7 rounded-md text-xs font-mono font-bold transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-[#1B2A4A] text-white ring-2 ring-[#8C6E54] shadow-xs'
                        : isCompleted
                        ? 'bg-[#EBF4EE] text-[#235E3B] border border-[#C2E0C6]'
                        : 'bg-[#FAF8F3] text-[#70685E]/70 border border-[#E5E0D5]'
                    }`}
                    title={`Question ${qNum}${isCurrent ? ' (Active)' : isCompleted ? ' (Completed)' : ''}`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 text-[#235E3B]" /> : qNum}
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-serif font-bold text-[#1F1B16] ml-1">
              Question {currentNum} of {totalQuestions}
            </span>
            <Badge
              variant={
                currentQuestion.currentDifficulty === 'Advanced'
                  ? 'bronze'
                  : currentQuestion.currentDifficulty === 'Beginner'
                  ? 'emerald'
                  : 'navy'
              }
              size="xs"
            >
              {currentQuestion.currentDifficulty || session.currentDifficulty || 'Intermediate'}
            </Badge>
          </div>
        </div>

        {/* Top Right Controls: Timer, TTS, Hint */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Active Timer Pill */}
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-bold transition-colors
              ${secondsLeft < 30
                ? 'bg-[#FDF2E9] border-[#F0D5C0] text-[#9A421A] animate-pulse'
                : 'bg-[#FAF8F3] border-[#E5E0D5] text-[#1A365D]'
              }
            `}
          >
            <Clock className="w-3.5 h-3.5 text-[#1A365D]" />
            <span>{formatTimer(secondsLeft)}</span>
          </div>

          {/* Text-to-Speech AI Read-Aloud Toggle */}
          <button
            type="button"
            onClick={handleToggleAiReadAloud}
            title={isAiSpeaking ? 'Mute AI read-aloud' : 'Read question aloud'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
              isAiSpeaking
                ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1A365D]'
                : 'bg-[#FAF8F3] border-[#E5E0D5] text-[#70685E] hover:text-[#1F1B16]'
            }`}
          >
            {isAiSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAiSpeaking ? 'Mute Prompt' : 'Read Aloud'}</span>
          </button>

          {/* AI Coach Hint Button */}
          <button
            type="button"
            onClick={handleRequestNudge}
            disabled={isSubmitting || !!currentEval}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
              activeNudge
                ? 'bg-[#FAF8F3] border-[#8C6E54] text-[#8C6E54]'
                : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#70685E] hover:text-[#1F1B16] hover:border-[#8C6E54]'
            }`}
            title="Receive a helpful hint from your AI coach"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#8C6E54]" />
            <span className="hidden sm:inline">{activeNudge ? 'Hint Active' : 'Request Hint'}</span>
            <span className="sm:hidden">Hint</span>
            {(session.hintsPerQuestion?.[currentQuestion?.id] || 0) > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#FAF8F3] border border-[#E5E0D5] text-[#8C6E54] font-bold">
                {session.hintsPerQuestion[currentQuestion.id]}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        value={currentNum}
        max={totalQuestions}
        displayValue={`Section ${currentNum} of ${totalQuestions}`}
        gradient="navy"
        height="h-1.5"
      />

      {/* Dynamic Interview Radar Ticker */}
      <MarqueeBanner variant="interview" role={setup?.targetRole || 'Engineering Candidate'} />

      {/* Adaptive Notification Banner if Triggered */}
      {session.adaptiveEvent && !currentEval && (
        <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-[#8C6E54] shrink-0" />
            <span className="text-[#70685E]">
              <strong className="text-[#1F1B16]">{session.adaptiveEvent.title}:</strong> {session.adaptiveEvent.message}
            </span>
          </div>
          <Badge variant="navy" size="sm">
            {session.adaptiveEvent.badge}
          </Badge>
        </div>
      )}

      {/* =========================================================================
          TALENT SHINE 50/50 SPLIT-SCREEN WORKSPACE
          Left Rail: Question, Context, Copy, Rubric Guidance, Competency Matrix
          Right Rail: Response Editor, Camera Viewport, Dictation, Model Answer
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Sticky Question & Assessment Rubric (50% on lg: col-span-6) */}
        <div className="lg:col-span-6 lg:sticky lg:top-4 self-start space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-thin">
          
          {/* Main Question Card */}
          <GlassCard className="p-5 sm:p-6 border-[#E5E0D5] bg-[#FFFDF9] space-y-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white">
                  <span className="font-serif font-bold text-xs">TP</span>
                </div>
                <div>
                  <h3 className="text-xs font-serif font-bold text-[#1F1B16] tracking-wide">
                    {currentQuestion.category || 'Core Engineering Competency'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#70685E]">
                    <span>Target: {setup?.targetRole || 'Engineer'}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#1A365D]">{currentQuestion.currentDifficulty || 'Intermediate'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {currentQuestion.generatedSource?.includes('Vault') && (
                  <Badge variant="amber" size="xs">🏛️ Vault</Badge>
                )}
                {setup?.jobDescription && (
                  <Badge variant="emerald" size="xs">🎯 Calibrated</Badge>
                )}
                {/* Copy Question Button */}
                <button
                  type="button"
                  onClick={handleCopyQuestion}
                  title="Copy question text"
                  className="p-1.5 rounded-md border border-[#E5E0D5] hover:bg-[#FAF8F3] text-[#70685E] hover:text-[#1F1B16] transition-all cursor-pointer"
                >
                  {isCopiedQuestion ? <Check className="w-3.5 h-3.5 text-[#235E3B]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* If Face-to-Face Mode, show interactive 3D avatar */}
            {isFaceToFaceMode && (
              <div className="space-y-3 pb-2 border-b border-[#E5E0D5]">
                <AiInterviewerAvatar
                  personaId={session.interviewerPersona || setup.interviewerPersona || 'julian'}
                  isSpeaking={isInterviewerSpeaking}
                  isListening={!isInterviewerSpeaking && isRecordingAnswer}
                  isEvaluating={isSubmitting}
                  currentQuestionText={currentQuestion?.question}
                  onReplayQuestion={() => speakQuestion(currentQuestion?.question)}
                  isMuted={isInterviewerMuted}
                  onToggleMute={() => setIsInterviewerMuted(prev => !prev)}
                />
              </div>
            )}

            {/* Question Text Display */}
            <div className="space-y-2">
              <span className="editorial-overline text-[10px] text-[#8C6E54] flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-[#8C6E54]" />
                CURRENT QUESTION PROMPT
              </span>
              <div className="p-4 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#1F1B16] font-serif font-medium text-base sm:text-lg leading-relaxed shadow-2xs">
                "{currentQuestion.question}"
              </div>
            </div>

            {/* Audio Waveform Simulation */}
            <div className="p-2.5 rounded-md bg-[#F2EFE9] border border-[#E5E0D5] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#70685E]">
                <Mic className="w-3.5 h-3.5 text-[#1A365D]" />
                <span className="font-medium text-[11px]">Audio Telemetry Active</span>
              </div>
              <div className="flex items-center gap-1 h-3">
                {[45, 80, 40, 95, 60, 85, 30, 70, 90, 45].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-xs transition-all duration-150 ${
                      isAiSpeaking || isRecordingAnswer ? 'bg-[#1A365D]' : 'bg-[#70685E]/50'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Expandable Evaluation Rubric & Focus Criteria (Talent Shine Model) */}
          <GlassCard className="p-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-2xs space-y-3">
            <button
              type="button"
              onClick={() => setShowRubricFocus(prev => !prev)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#1F1B16]">
                <Lightbulb className="w-4 h-4 text-[#8C6E54]" />
                <span>Rubric Expectations &amp; Focus Criteria</span>
              </div>
              <span className="text-[11px] text-[#70685E] font-medium flex items-center gap-1">
                {showRubricFocus ? 'Collapse' : 'Expand'}
                {showRubricFocus ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            </button>

            {showRubricFocus && (
              <div className="pt-2 border-t border-[#E5E0D5]/70 space-y-3 text-xs leading-relaxed animate-in fade-in">
                <div>
                  <span className="font-semibold text-[#1F1B16] text-[11px] uppercase tracking-wider block mb-0.5">
                    Expected Assessment Scope:
                  </span>
                  <p className="text-[#3B352E]">
                    {currentQuestion.expectedFocus ||
                      "Articulate core definitions, cite standard real-world applications, explain trade-offs between approaches, and use concrete examples."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                    <span className="font-bold text-[#235E3B] text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#235E3B]" />
                      High Scoring (8-10):
                    </span>
                    <p className="text-[11px] text-[#70685E] leading-normal">
                      Clear foundational explanation, practical trade-offs, structured delivery.
                    </p>
                  </div>
                  <div className="p-2.5 rounded bg-[#FAF8F3] border border-[#E5E0D5] space-y-1">
                    <span className="font-bold text-[#9A421A] text-[10px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-[#9A421A]" />
                      Common Pitfalls:
                    </span>
                    <p className="text-[11px] text-[#70685E] leading-normal">
                      Abstract claims without naming specific APIs or mechanisms.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* Live Competency Matrix Card */}
          <GlassCard className="p-4 border-[#E5E0D5] bg-[#FFFDF9] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-[#1A365D]" />
                <h4 className="text-xs font-serif font-bold text-[#1F1B16]">{activePlaybook.shortName} Assessment Matrix</h4>
              </div>
              <Badge variant={activePlaybook.badgeVariant} size="xs">
                {activePlaybook.badge}
              </Badge>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {Object.values(session.rubricMatrix || {}).map((comp) => (
                <div
                  key={comp.id}
                  className="p-2 rounded bg-[#FAF8F3] border border-[#E5E0D5] flex items-center justify-between text-xs transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        comp.status === 'verified'
                          ? 'bg-[#235E3B]'
                          : comp.status === 'weak'
                          ? 'bg-[#9A421A]'
                          : 'bg-[#70685E]/40'
                      }`}
                    />
                    <span className="font-semibold text-[#1F1B16] text-[11px]">{comp.name}</span>
                  </div>

                  <span
                    className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-xs shrink-0 ${
                      comp.status === 'verified'
                        ? 'bg-[#EBF4EE] text-[#235E3B] border border-[#C2E0C6]'
                        : comp.status === 'weak'
                        ? 'bg-[#FDF2E9] text-[#9A421A] border border-[#F0D5C0]'
                        : 'bg-[#FAF8F3] text-[#70685E] border border-[#E5E0D5]'
                    }`}
                  >
                    {comp.status === 'verified' ? 'Verified' : comp.status === 'weak' ? 'Focus Gap' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN: Candidate Workspace & Response Engine (50% on lg: col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Candidate Mode Toggle Tab Bar */}
          <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-2">
            <button
              type="button"
              onClick={() => setActiveCandidateTab('defense')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCandidateTab === 'defense'
                  ? 'bg-[#1B2A4A] text-white shadow-xs'
                  : 'bg-[#FAF8F3] text-[#70685E] hover:text-[#1F1B16] border border-[#E5E0D5]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Verbal &amp; Written Response</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCandidateTab('sandbox')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeCandidateTab === 'sandbox'
                  ? 'bg-[#1B2A4A] text-white shadow-xs'
                  : 'bg-[#FAF8F3] text-[#70685E] hover:text-[#1F1B16] border border-[#E5E0D5]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Sandbox</span>
              <Badge variant="navy" size="xs">IDE</Badge>
            </button>
          </div>

          {activeCandidateTab === 'sandbox' ? (
            <CodeDisputationSandbox
              initialQuestion={currentQuestion?.question}
              onAttachCodeToAnswer={(snippet) => {
                setAnswerInput((prev) => (prev ? prev + '\n\n' + snippet : snippet));
                setActiveCandidateTab('defense');
              }}
            />
          ) : (
            <>
              {/* Candidate Video Area (in Video / Face-to-Face Mode) */}
              {isVideoMode && (
                <GlassCard className="p-4 border-[#E5E0D5] space-y-3 bg-[#FFFDF9] shadow-sm">
                  {/* Face-to-Face Turn State Bar */}
                  {isFaceToFaceMode && (
                    <div className={`p-2.5 px-3 rounded-md border flex items-center justify-between text-xs font-semibold transition-all ${
                      isInterviewerSpeaking
                        ? 'bg-[#FAF8F3] border-[#8C6E54]/30 text-[#8C6E54]'
                        : isRecordingAnswer
                        ? 'bg-[#EBF4EE] border-[#235E3B]/40 text-[#235E3B]'
                        : 'bg-[#FFFDF9] border-[#E5E0D5] text-[#70685E]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isInterviewerSpeaking
                            ? 'bg-[#8C6E54] animate-pulse'
                            : isRecordingAnswer
                            ? 'bg-[#235E3B] animate-ping'
                            : 'bg-[#70685E]'
                        }`} />
                        <span>
                          {isInterviewerSpeaking
                            ? 'Interviewer is speaking... Listen attentively'
                            : isRecordingAnswer
                            ? 'Your Turn: Speak clearly into your microphone'
                            : 'Floor open for candidate'}
                        </span>
                      </div>

                      {isRecordingAnswer && !currentEval && (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={!answerInput.trim() || isSubmitting}
                          className="px-3 py-1 rounded bg-[#235E3B] hover:bg-[#1C4B2F] text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          Finish Answering →
                        </button>
                      )}
                    </div>
                  )}

                  <div className="relative aspect-video sm:h-56 w-full rounded-md overflow-hidden bg-black border border-[#E5E0D5] flex items-center justify-center">
                    <video
                      ref={candidateVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-contain bg-black transform -scale-x-100 transition-opacity duration-300 ${
                        isCameraOn ? 'opacity-100' : 'opacity-0 absolute'
                      }`}
                    />

                    {!isCameraOn && (
                      <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 text-[#70685E]">
                        <VideoOff className="w-8 h-8 opacity-50" />
                        <p className="text-xs">Camera transmission paused</p>
                      </div>
                    )}
                  </div>

                  {/* Recording Controls */}
                  <RecordingControls
                    isRecording={isRecordingAnswer}
                    durationSeconds={answerDurationSeconds}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onResetRecording={handleResetRecording}
                    isCameraOn={isCameraOn}
                    onToggleCamera={handleToggleCamera}
                    isMicMuted={isMicMuted}
                    onToggleMic={handleToggleMic}
                    showTranscript={showTranscript}
                    onToggleTranscript={() => setShowTranscript(prev => !prev)}
                    disabled={!!currentEval || isSubmitting}
                  />
                </GlassCard>
              )}

              {/* Answer / Transcript Editor Card */}
              {(!isVideoMode || showTranscript) && (
                <GlassCard className="p-5 sm:p-6 space-y-4 border-[#E5E0D5] bg-[#FFFDF9] shadow-sm">
                  <div className="flex flex-wrap items-center justify-between border-b border-[#E5E0D5] pb-3 gap-2">
                    <label className="text-xs font-serif font-bold text-[#1F1B16] uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#1A365D]" />
                      <span>{isVideoMode ? 'Spoken Transcript' : 'Your Response'}</span>
                    </label>

                    <div className="flex items-center gap-2 text-xs">
                      {/* Live Speech Dictation Button (for Text Mode) */}
                      {!isVideoMode && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isRecordingAnswer) {
                              handleStopRecording();
                            } else {
                              handleStartRecording();
                            }
                          }}
                          disabled={!!currentEval || isSubmitting}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-all cursor-pointer ${
                            isRecordingAnswer
                              ? 'bg-[#EBF4EE] border-[#235E3B] text-[#235E3B] animate-pulse'
                              : 'bg-[#FAF8F3] border-[#E5E0D5] text-[#70685E] hover:text-[#1F1B16]'
                          }`}
                          title="Click to dictate your answer using speech recognition"
                        >
                          <Mic className={`w-3.5 h-3.5 ${isRecordingAnswer ? 'text-[#235E3B]' : 'text-[#70685E]'}`} />
                          <span>{isRecordingAnswer ? 'Listening...' : 'Dictate'}</span>
                        </button>
                      )}

                      {isTranscribingAudio && (
                        <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#8C6E54] bg-[#FAF8F3] border border-[#8C6E54]/30 px-2 py-0.5 rounded animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin text-[#8C6E54]" />
                          <span>Transcribing...</span>
                        </span>
                      )}
                      {transcriptionEngineNotice && !isTranscribingAudio && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-[#235E3B] bg-[#EBF4EE] border border-[#235E3B]/30 px-2 py-0.5 rounded">
                          <Sparkles className="w-3 h-3 text-[#235E3B]" />
                          <span>{transcriptionEngineNotice}</span>
                        </span>
                      )}
                      <span className={`font-mono font-bold ${wordCount >= 50 ? 'text-[#235E3B]' : 'text-[#70685E]'}`}>
                        {wordCount} words
                      </span>
                      <span className="text-[#70685E] hidden sm:inline text-[11px]">(Recommended: 60–150)</span>
                    </div>
                  </div>

                  {/* AI Coach Hint Alert if Requested */}
                  {activeNudge && (
                    <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#8C6E54]/40 flex items-start gap-2.5 text-xs text-[#3B352E] shadow-2xs animate-in fade-in">
                      <Lightbulb className="w-4 h-4 text-[#8C6E54] shrink-0 mt-0.5" />
                      <div className="space-y-1 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-[#1F1B16]">AI Coach Guidance:</span>
                          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#8C6E54] px-1.5 py-0.5 rounded bg-[#FFFDF9] border border-[#E5E0D5]">
                            Hint #{(session.hintsPerQuestion?.[currentQuestion?.id] || 1)}
                          </span>
                        </div>
                        <p className="leading-relaxed text-[#1F1B16] font-serif font-medium">
                          {activeNudge}
                        </p>
                      </div>
                    </div>
                  )}

                  <textarea
                    rows={isVideoMode ? 5 : 8}
                    value={answerInput}
                    onChange={(e) => {
                      setAnswerInput(e.target.value);
                      accumulatedTranscriptRef.current = e.target.value;
                    }}
                    disabled={!!currentEval}
                    placeholder={
                      isVideoMode
                        ? "Click 'Start Answer' above or speak your response. Your spoken transcript will populate here automatically..."
                        : "Type your structured response here... Focus on foundational mechanisms, practical application, and clear technical reasoning..."
                    }
                    className="w-full p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-sm text-[#1F1B16] placeholder-[#70685E]/50 focus:outline-none focus:border-[#1A365D] focus:ring-1 focus:ring-[#1A365D] transition-colors resize-y leading-relaxed disabled:opacity-75 font-sans"
                  />

                  {/* Dev Fast-Test Helper */}
                  {import.meta.env.DEV && (
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={handleQuickAnswer}
                        disabled={isGeneratingQuickAnswer || !!currentEval}
                        className="inline-flex items-center gap-1.5 text-[#70685E] hover:text-[#1A365D] opacity-60 hover:opacity-100 font-mono transition-opacity disabled:cursor-not-allowed cursor-pointer"
                        title="Developer Fast Test Utility"
                      >
                        <Sparkles className={`w-3 h-3 ${isGeneratingQuickAnswer ? 'animate-spin text-[#8C6E54]' : 'text-[#8C6E54]'}`} />
                        <span>{isGeneratingQuickAnswer ? 'Generating sample...' : '[Dev] Autofill Sample Answer'}</span>
                      </button>
                      {quickAnswerError && (
                        <span className="text-[#9A421A] font-mono">{quickAnswerError}</span>
                      )}
                    </div>
                  )}
                </GlassCard>
              )}
            </>
          )}

          {/* Instant Evaluation Report Card */}
          {currentEval && (
            <GlassCard className="p-6 border-[#1A365D] bg-[#FAF8F3] space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
                <div>
                  <span className="editorial-overline text-[10px]">
                    SECTION EVALUATION SUMMARY
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-serif font-bold text-[#1F1B16]">
                      Score: {currentEval.scores.overall} / 10
                    </span>
                    <Badge variant={currentEval.scores.overall >= 8 ? 'emerald' : currentEval.scores.overall >= 5 ? 'warning' : 'bronze'} size="sm">
                      {currentEval.scores.overall >= 8 ? 'Mastery Demonstrated' : currentEval.scores.overall >= 5 ? 'Meets Baseline' : 'Focus Area'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CircularScore
                    score={Math.round(currentEval.scores.overall * 10)}
                    size={65}
                    strokeWidth={6}
                    color="auto"
                    showPercentage={false}
                  />
                </div>
              </div>

              {/* Sub-Scores Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5]">
                  <p className="editorial-overline text-[9px]">Technical</p>
                  <p className="text-sm font-serif font-bold text-[#1F1B16]">{currentEval.scores.technicalKnowledge}/10</p>
                </div>
                <div className="p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5]">
                  <p className="editorial-overline text-[9px]">Relevance</p>
                  <p className="text-sm font-serif font-bold text-[#1A365D]">{currentEval.scores.relevance}/10</p>
                </div>
                <div className="p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5]">
                  <p className="editorial-overline text-[9px]">Clarity</p>
                  <p className="text-sm font-serif font-bold text-[#235E3B]">{currentEval.scores.clarity}/10</p>
                </div>
                <div className="p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5]">
                  <p className="editorial-overline text-[9px]">Structure</p>
                  <p className="text-sm font-serif font-bold text-[#8C6E54]">{currentEval.scores.structure}/10</p>
                </div>
                <div className="p-2 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] col-span-2 sm:col-span-1">
                  <p className="editorial-overline text-[9px]">Delivery</p>
                  <p className="text-sm font-serif font-bold text-[#9A421A]">{currentEval.scores.confidence}/10</p>
                </div>
              </div>

              {/* Feedback Summary */}
              <div className="p-3.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-[#1A365D] font-serif font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C6E54]" />
                  <span>Interviewer Feedback</span>
                </div>
                <p className="text-[#3B352E] leading-relaxed">{currentEval.aiRecommendation}</p>

                {currentEval.strengths && currentEval.strengths.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E0D5]/60 space-y-1">
                    <span className="font-semibold text-[#235E3B] text-[11px] block">Key Strengths:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[#235E3B] text-[11px]">
                      {currentEval.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentEval.areasToImprove && currentEval.areasToImprove.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <span className="font-semibold text-[#9A421A] text-[11px] block">Areas to Elevate:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[#9A421A] text-[11px]">
                      {currentEval.areasToImprove.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Staff-Level Exemplar Model Answer Card (Talent Shine Model) */}
              <div className="rounded-lg border border-[#8C6E54]/30 bg-[#FFFDF9] p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#8C6E54]" />
                    <span className="text-xs font-serif font-bold text-[#1F1B16]">
                      Staff-Level Exemplar Answer
                    </span>
                    <Badge variant="bronze" size="xs">Model Benchmark</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchExemplarAnswer}
                    className="text-xs font-semibold text-[#8C6E54] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showExemplarAnswer ? 'Hide Exemplar' : 'Reveal Model Answer'}
                    {showExemplarAnswer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {showExemplarAnswer && (
                  <div className="p-3.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs leading-relaxed text-[#1F1B16] font-serif space-y-2 animate-in fade-in">
                    {isLoadingExemplar ? (
                      <div className="flex items-center gap-2 text-[#70685E] py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#8C6E54]" />
                        <span>Synthesizing model exemplar answer...</span>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-line text-[13px]">{exemplarAnswerText}</p>
                        <div className="pt-2 border-t border-[#E5E0D5]/60 flex items-center justify-between text-[11px] text-[#70685E]">
                          <span>💡 Notice the direct answer, concrete mechanisms, and structured reasoning.</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(exemplarAnswerText);
                              setIsCopiedExemplar(true);
                              setTimeout(() => setIsCopiedExemplar(false), 2000);
                            }}
                            className="text-[#8C6E54] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {isCopiedExemplar ? <Check className="w-3 h-3 text-[#235E3B]" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopiedExemplar ? 'Copied' : 'Copy Exemplar'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Proceed to Next Question Button */}
              <GradientButton
                variant="primary"
                size="md"
                className="w-full cursor-pointer text-xs"
                onClick={handleNext}
                icon={ArrowRight}
              >
                {currentNum >= totalQuestions ? 'View Full Interview Results 🎉' : 'Proceed to Next Section →'}
              </GradientButton>
            </GlassCard>
          )}

        </div>

      </div>

      {/* =========================================================================
          STICKY BOTTOM CONTROL DOCK
          Provides clear primary "Submit Defense", secondary "Skip Question", and Timer
         ========================================================================= */}
      <div className="sticky bottom-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E5E0D5] p-3 sm:p-4 shadow-lg -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Left: Current Question Progress & Time Remaining */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-serif font-bold text-[#1F1B16] hidden sm:inline">
              Section {currentNum} / {totalQuestions}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs font-mono font-bold text-[#1A365D]">
              <Clock className="w-3.5 h-3.5 text-[#1A365D]" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5">
            {!currentEval ? (
              <>
                {/* Skip Question Button */}
                <button
                  type="button"
                  onClick={() => setIsSkipModalOpen(true)}
                  disabled={isSubmitting || isSkipping}
                  className="px-3.5 py-2 rounded-md border border-[#E5E0D5] bg-[#FAF8F3] hover:bg-[#FDF2E9] hover:border-[#F0D5C0] text-[#70685E] hover:text-[#9A421A] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
                  title="Skip this question if unsure - marks it for future roadmap practice"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Question</span>
                </button>

                {/* Primary Submit Button */}
                <GradientButton
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={!answerInput.trim() || isSubmitting}
                  icon={Send}
                  className="cursor-pointer text-xs shadow-xs"
                >
                  Submit Defense
                </GradientButton>
              </>
            ) : (
              <GradientButton
                variant="primary"
                size="md"
                onClick={handleNext}
                icon={ArrowRight}
                className="cursor-pointer text-xs shadow-xs"
              >
                {currentNum >= totalQuestions ? 'Conclude Examination 🎉' : 'Proceed to Next Section →'}
              </GradientButton>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SKIP QUESTION CONFIRMATION MODAL
         ========================================================================= */}
      {isSkipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFDF9] border border-[#E5E0D5] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FDF2E9] border border-[#F0D5C0] flex items-center justify-center text-[#9A421A] shrink-0">
                <SkipForward className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1F1B16]">Skip this question?</h3>
                <p className="text-xs text-[#70685E]">Question {currentNum} of {totalQuestions}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#70685E] leading-relaxed">
              If you haven't reviewed <strong>{currentQuestion.category || currentQuestion.skill || 'this topic'}</strong> yet, you can skip it without penalties.
              We'll record it as a high-priority learning gap on your preparation dashboard and immediately advance to the next topic.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E0D5]/60">
              <button
                type="button"
                onClick={() => setIsSkipModalOpen(false)}
                className="px-4 py-2 rounded-md border border-[#E5E0D5] text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] hover:bg-[#FAF8F3] transition-all cursor-pointer"
              >
                Keep Answering
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                disabled={isSkipping}
                className="px-4 py-2 rounded-md bg-[#9A421A] hover:bg-[#7D3413] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isSkipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SkipForward className="w-3.5 h-3.5" />}
                <span>Skip &amp; Advance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Interview Processing Modal */}
      <InterviewProcessingModal
        isOpen={isProcessingModalOpen}
        processAction={handleProcessRecordingPipeline}
        onComplete={() => navigate('/interview-feedback')}
      />
    </div>
  );
}