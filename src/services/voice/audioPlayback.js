/**
 * Audio Playback Service for Gemini Live API
 * AI Career Preparation Agent
 *
 * Plays 24kHz 16-bit linear PCM audio chunks with sub-second latency
 * and instant barge-in interruption capability.
 */

export class AudioPlayback {
  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
    this.audioContext = null;
    this.scheduledTime = 0;
    this.activeSources = [];
    this.isPlaying = false;
    this.onVolumeChange = null;
    this.onInterrupted = null;
  }

  _initContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: this.sampleRate
      });
      this.scheduledTime = this.audioContext.currentTime;
    } else if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playChunk(base64Pcm) {
    this._initContext();
    if (!base64Pcm) return;

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 16-bit PCM little-endian
      const int16View = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16View.length);

      let sum = 0;
      for (let i = 0; i < int16View.length; i++) {
        const val = int16View[i] / 32768.0;
        float32[i] = val;
        sum += val * val;
      }

      const rms = Math.sqrt(sum / int16View.length);
      const volume = Math.min(1.0, rms * 4.0);
      if (this.onVolumeChange) {
        this.onVolumeChange(volume);
      }

      const audioBuffer = this.audioContext.createBuffer(1, float32.length, this.sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      if (this.scheduledTime < now) {
        this.scheduledTime = now + 0.02; // small 20ms lead buffer
      }

      source.start(this.scheduledTime);
      this.scheduledTime += audioBuffer.duration;
      this.activeSources.push(source);
      this.isPlaying = true;

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.activeSources.length === 0) {
          this.isPlaying = false;
          if (this.onVolumeChange) this.onVolumeChange(0);
        }
      };
    } catch (err) {
      console.error('[AudioPlayback] Failed to decode audio chunk:', err);
    }
  }

  /**
   * Barge-in interruption: Instantly stops all queued and playing audio buffers.
   */
  interrupt() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (_) {}
    }
    this.activeSources = [];
    if (this.audioContext) {
      this.scheduledTime = this.audioContext.currentTime;
    }
    this.isPlaying = false;
    if (this.onVolumeChange) {
      this.onVolumeChange(0);
    }
    if (this.onInterrupted) {
      this.onInterrupted();
    }
  }

  stop() {
    this.interrupt();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }
  }
}
