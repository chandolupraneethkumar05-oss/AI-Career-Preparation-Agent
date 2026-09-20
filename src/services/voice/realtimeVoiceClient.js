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
    onError
  }) {
    this.sessionData = sessionData;
    this.onStateChange = onStateChange || (() => {});
    this.onTranscriptTurn = onTranscriptTurn || (() => {});
    this.onCandidateVolume = onCandidateVolume || (() => {});
    this.onAIVolume = onAIVolume || (() => {});
    this.onError = onError || (() => {});

    this.state = VoiceState.DISCONNECTED;
    this.socket = null;
    this.audioCapture = new AudioCapture();
    this.audioPlayback = new AudioPlayback(24000);

    this.transcriptHistory = [];
    this.isMuted = false;
    this._bargeInThreshold = 0.25;
    this._speakingFrames = 0;
  }

  _setState(newState) {
    this.state = newState;
    this.onStateChange(newState);
  }

  async connect() {
    this._setState(VoiceState.CONNECTING);

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

  _handleOutgoingAudio(base64Chunk, volume) {
    // Client-side barge-in detection: if candidate speaks while AI is talking, interrupt AI immediately
    if (this.audioPlayback.isPlaying && volume > this._bargeInThreshold) {
      this._speakingFrames++;
      if (this._speakingFrames >= 2) {
        console.log('[RealtimeVoice] Candidate speech detected during AI playback -> Triggering barge-in');
        this.audioPlayback.interrupt();
        this._speakingFrames = 0;

        // If connected to Gemini Live, send client content cancellation
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          try {
            this.socket.send(JSON.stringify({ clientContent: { turnComplete: true } }));
          } catch (_) {}
        }
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
    console.log('[RealtimeVoice] Initialized simulated voice session');
    this._setState(VoiceState.READY);

    // Initial interviewer greeting
    setTimeout(() => {
      const greeting = `Welcome! I will be conducting your technical interview for the ${this.sessionData.role} role. Let us begin with your experience in ${this.sessionData.topic}. Could you walk me through your high-level approach?`;
      this._recordTurn('ai', greeting);
      this._speakSimulated(greeting);
    }, 600);
  }

  _speakSimulated(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        this._setState(VoiceState.AI_SPEAKING);
        this.onAIVolume(0.6);
      };
      utterance.onend = () => {
        this._setState(VoiceState.LISTENING);
        this.onAIVolume(0);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      this._setState(VoiceState.LISTENING);
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

    // In simulated mode, generate next AI response
    if (this.sessionData.mode === 'simulated') {
      this._setState(VoiceState.THINKING);
      setTimeout(() => {
        const nextQuestions = [
          'That is a solid foundation. How would you handle scale and backpressure under peak traffic in that architecture?',
          'Understood. How would you monitor model drift and data distribution shift once deployed in production?',
          'Interesting tradeoff. What are the key failure modes and how would you implement automated circuit breaking or rollback?'
        ];
        const nextQ = nextQuestions[Math.floor(Math.random() * nextQuestions.length)];
        this._recordTurn('ai', nextQ);
        this._speakSimulated(nextQ);
      }, 1200);
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    this.audioCapture.setMuted(muted);
  }

  disconnect() {
    this._setState(VoiceState.ENDED);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
