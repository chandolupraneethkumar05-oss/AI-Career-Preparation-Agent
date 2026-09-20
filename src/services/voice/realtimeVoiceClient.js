/**
 * Real-Time Bidirectional Voice Client for Gemini Live API
 * AI Career Preparation Agent
 *
 * Implements:
 * 1. Full-duplex audio streaming (16kHz PCM upload, 24kHz PCM playback).
 * 2. Instant barge-in / interruption detection.
 * 3. Bidirectional state machine.
 * 4. Resilient simulation fallback when no live Google Cloud credentials exist.
 */

import { AudioCapture } from './audioCapture';
import { AudioPlayback } from './audioPlayback';

export const VoiceState = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  READY: 'READY',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  AI_SPEAKING: 'AI_SPEAKING',
  INTERRUPTED: 'INTERRUPTED',
  ENDED: 'ENDED',
  ERROR: 'ERROR'
};

export class RealtimeVoiceClient {
  constructor({
    sessionData,
    onStateChange,
    onTranscriptTurn,
    onCandidateVolume,
    onAIVolume,
    onQuestionChange,
    onError
  }) {
    this.sessionData = sessionData;
    this.onStateChange = onStateChange || (() => {});
    this.onTranscriptTurn = onTranscriptTurn || (() => {});
    this.onCandidateVolume = onCandidateVolume || (() => {});
    this.onAIVolume = onAIVolume || (() => {});
    this.onQuestionChange = onQuestionChange || (() => {});
    this.onError = onError || (() => {});

    this.state = VoiceState.DISCONNECTED;
    this.socket = null;
    this.audioCapture = new AudioCapture();
    this.audioPlayback = new AudioPlayback(24000);

    this.transcriptHistory = [];
    this.isMuted = false;
    this._bargeInThreshold = 0.25;
    this._speakingFrames = 0;
    this.currentQuestionIndex = 0;
    this.totalQuestions = 5;
    this.questions = [];
  }

  _buildCurriculum() {
    const role = this.sessionData.role || 'Software Engineer';
    const topic = this.sessionData.topic || 'System Design & Algorithms';

    return [
      {
        stage: 'Architecture & System Design',
        question: `Welcome to your technical mock interview for the ${role} position. To start with Question 1 of 5: In ${topic}, what core system architecture would you design for high-throughput production workloads, and which components would you prioritize?`
      },
      {
        stage: 'Algorithmic & Technical Depth',
        question: `Moving into Question 2 of 5 on algorithmic depth: What specific data structures and computational complexity trade-offs would you implement to guarantee minimal latency and prevent bottlenecks?`
      },
      {
        stage: 'Scalability & Concurrency',
        question: `Now for Question 3 of 5 on scalability: How would you architect this solution to handle horizontal scaling, caching strategies, and backpressure when user traffic surges tenfold?`
      },
      {
        stage: 'Fault Tolerance & Resilience',
        question: `For Question 4 of 5 on reliability: What are the primary failure modes in this distributed design, and how would you implement automated circuit breaking, data replication, and graceful degradation?`
      },
      {
        stage: 'Observability & Production Readiness',
        question: `To conclude our technical questions with Question 5 of 5: How would you monitor this system in production—specifically defining your SLIs, SLOs, and strategies for detecting subtle performance degradations?`
      }
    ];
  }

  _setState(newState) {
    this.state = newState;
    this.onStateChange(newState);
  }

  async connect() {
    this._setState(VoiceState.CONNECTING);
    this.questions = this._buildCurriculum();
    this.currentQuestionIndex = 0;
    this.onQuestionChange(1, this.totalQuestions, this.questions[0].stage, this.questions[0].question);

    // Setup audio playback interruption callback
    this.audioPlayback.onInterrupted = () => {
      this._setState(VoiceState.INTERRUPTED);
      setTimeout(() => {
        if (this.state === VoiceState.INTERRUPTED) {
          this._setState(VoiceState.LISTENING);
        }
      }, 400);
    };

    this.audioPlayback.onVolumeChange = (vol) => {
      this.onAIVolume(vol);
      if (vol > 0.05 && this.state !== VoiceState.INTERRUPTED) {
        this._setState(VoiceState.AI_SPEAKING);
      } else if (vol <= 0.01 && this.state === VoiceState.AI_SPEAKING) {
        this._setState(VoiceState.LISTENING);
      }
    };

    if (this.sessionData.mode === 'live' && this.sessionData.websocket_url) {
      await this._connectLiveWebSocket();
    } else {
      await this._initSimulatedVoiceSession();
    }

    // Start microphone capture
    try {
      await this.audioCapture.start(
        (chunk, volume) => this._handleOutgoingAudio(chunk, volume),
        (vol) => this.onCandidateVolume(vol)
      );
    } catch (err) {
      this._setState(VoiceState.ERROR);
      this.onError(new Error('Microphone permission denied or unavailable.'));
    }
  }

  interrupt() {
    console.log('[RealtimeVoice] Interrupting AI speech');
    if (this._speechTimer) {
      clearTimeout(this._speechTimer);
      this._speechTimer = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    this.audioPlayback.interrupt();
    this.onAIVolume(0);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ clientContent: { turnComplete: true } }));
      } catch (_) {}
    }

    this._setState(VoiceState.INTERRUPTED);
    setTimeout(() => {
      if (this.state === VoiceState.INTERRUPTED) {
        this._setState(VoiceState.LISTENING);
      }
    }, 350);
  }

  _handleOutgoingAudio(base64Chunk, volume) {
    const isAISpeaking =
      this.state === VoiceState.AI_SPEAKING ||
      this.audioPlayback.isPlaying ||
      ('speechSynthesis' in window && window.speechSynthesis.speaking);

    // Client-side barge-in detection: if candidate speaks while AI is talking, interrupt AI immediately
    if (isAISpeaking && volume > 0.08) {
      this._speakingFrames++;
      if (this._speakingFrames >= 2) {
        console.log('[RealtimeVoice] Candidate speech detected during AI playback -> Triggering barge-in');
        this.interrupt();
        this._speakingFrames = 0;
      }
    } else {
      this._speakingFrames = 0;
    }

    // Stream audio chunk to live Gemini WebSocket if open
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const msg = {
        realtimeInput: {
          mediaChunks: [
            {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Chunk
            }
          ]
        }
      };
      this.socket.send(JSON.stringify(msg));
    }
  }

  async _connectLiveWebSocket() {
    try {
      this.socket = new WebSocket(this.sessionData.websocket_url);

      this.socket.onopen = () => {
        console.log('[RealtimeVoice] WebSocket connected to Gemini Live API');
        this._setState(VoiceState.READY);

        // Send Setup Frame
        const setupPayload = {
          setup: {
            model: this.sessionData.model || 'models/gemini-2.0-flash-exp',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: this.sessionData.voice_name || 'Puck'
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: this.sessionData.system_instruction }]
            }
          }
        };
        this.socket.send(JSON.stringify(setupPayload));
        this._setState(VoiceState.LISTENING);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleServerMessage(data);
        } catch (e) {
          console.error('[RealtimeVoice] Error parsing server message:', e);
        }
      };

      this.socket.onerror = (err) => {
        console.error('[RealtimeVoice] WebSocket error:', err);
        this._setState(VoiceState.ERROR);
        this.onError(err);
      };

      this.socket.onclose = () => {
        console.log('[RealtimeVoice] WebSocket closed');
        if (this.state !== VoiceState.ENDED) {
          this._setState(VoiceState.DISCONNECTED);
        }
      };
    } catch (err) {
      console.error('[RealtimeVoice] Live connection failed, falling back to simulated mode:', err);
      await this._initSimulatedVoiceSession();
    }
  }

  _handleServerMessage(data) {
    // 1. Interruption from server
    if (data.serverContent?.interrupted) {
      console.log('[RealtimeVoice] Server signaled interruption');
      this.audioPlayback.interrupt();
      this._setState(VoiceState.INTERRUPTED);
      return;
    }

    // 2. Incoming model turn parts (Audio + Text)
    const parts = data.serverContent?.modelTurn?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
        this.audioPlayback.playChunk(part.inlineData.data);
      }
      if (part.text) {
        this._recordTurn('ai', part.text);
      }
    }
  }

  async _initSimulatedVoiceSession() {
    console.log('[RealtimeVoice] Initialized simulated 5-question voice session');
    this._setState(VoiceState.READY);

    // Initial Question 1 of 5
    if (this._speechTimer) clearTimeout(this._speechTimer);
    this._speechTimer = setTimeout(() => {
      if (this.state === VoiceState.ENDED) return;
      const q1 = this.questions[0].question;
      this._recordTurn('ai', q1);
      this._speakSimulated(q1);
    }, 600);
  }

  _speakSimulated(text, isFinalWrapUp = false) {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        this._setState(VoiceState.AI_SPEAKING);
        this.onAIVolume(0.65);
      };
      utterance.onend = () => {
        this.onAIVolume(0);
        if (isFinalWrapUp) {
          this.audioCapture.setMuted(true);
          this._setState(VoiceState.ENDED);
        } else if (this.state === VoiceState.AI_SPEAKING) {
          this._setState(VoiceState.LISTENING);
        }
      };
      utterance.onerror = () => {
        this.onAIVolume(0);
        if (isFinalWrapUp) {
          this.audioCapture.setMuted(true);
          this._setState(VoiceState.ENDED);
        } else if (this.state === VoiceState.AI_SPEAKING) {
          this._setState(VoiceState.LISTENING);
        }
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (isFinalWrapUp) {
        this.audioCapture.setMuted(true);
        this._setState(VoiceState.ENDED);
      } else {
        this._setState(VoiceState.LISTENING);
      }
    }
  }

  _recordTurn(speaker, text) {
    const turn = {
      speaker,
      text,
      timestamp: new Date().toISOString()
    };
    this.transcriptHistory.push(turn);
    this.onTranscriptTurn(turn);
  }

  recordCandidateSpeech(text) {
    if (!text || !text.trim()) return;
    this._recordTurn('candidate', text.trim());

    // In simulated mode, advance to next question
    if (this.sessionData.mode === 'simulated') {
      this._setState(VoiceState.THINKING);
      this.currentQuestionIndex++;
      const nextIdx = this.currentQuestionIndex;

      if (this._speechTimer) clearTimeout(this._speechTimer);
      this._speechTimer = setTimeout(() => {
        if (this.state === VoiceState.ENDED) return;
        if (nextIdx < this.totalQuestions) {
          const nextItem = this.questions[nextIdx];
          this.onQuestionChange(nextIdx + 1, this.totalQuestions, nextItem.stage, nextItem.question);

          const acks = [
            "Good point on that implementation.",
            "That's a sound architectural trade-off.",
            "Understood, that addresses the scaling bottleneck.",
            "Solid analysis of the recovery pattern."
          ];
          const ack = acks[(nextIdx - 1) % acks.length];
          const speech = `${ack} Let's proceed to Question ${nextIdx + 1} of ${this.totalQuestions}: ${nextItem.question}`;
          this._recordTurn('ai', speech);
          this._speakSimulated(speech, false);
        } else {
          const wrapUp = `Excellent work! You have successfully completed all 5 technical interview questions for the ${this.sessionData.role} role. Please click 'View Feedback Report' below to review your comprehensive 5-axis score report.`;
          this.onQuestionChange(this.totalQuestions, this.totalQuestions, 'Interview Completed', wrapUp);
          this._recordTurn('ai', wrapUp);
          this._speakSimulated(wrapUp, true);
        }
      }, 1000);
    }
  }

  skipToNextQuestion() {
    this.recordCandidateSpeech("[Candidate advanced to next question]");
  }

  setMute(muted) {
    this.isMuted = muted;
    this.audioCapture.setMuted(muted);
    if (muted) {
      this.onCandidateVolume(0);
    }
  }

  disconnect() {
    this._setState(VoiceState.ENDED);
    this.interrupt();
    this.audioCapture.stop();
    this.audioPlayback.stop();
    if (this.socket) {
      try {
        this.socket.close();
      } catch (_) {}
      this.socket = null;
    }
  }
}
