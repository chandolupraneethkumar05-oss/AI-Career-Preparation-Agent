/**
 * Audio Capture Service for Gemini Live API
 * AI Career Preparation Agent
 *
 * Captures microphone stream via Web Audio API, resamples to 16kHz mono,
 * encodes to 16-bit linear PCM little-endian, and emits base64 chunks.
 */

export class AudioCapture {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.source = null;
    this.isRecording = false;
    this.isMuted = false;
    this.onAudioChunk = null;
    this.onVolumeChange = null;
  }

  async start(onAudioChunk, onVolumeChange) {
    if (this.isRecording) return;
    this.onAudioChunk = onAudioChunk;
    this.onVolumeChange = onVolumeChange;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      // ScriptProcessor with 4096 buffer size (approx 256ms at 16kHz)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording || this.isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Compute RMS volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        const volume = Math.min(1.0, rms * 5.0);
        if (this.onVolumeChange) {
          this.onVolumeChange(volume);
        }

        // Convert Float32Array [-1.0, 1.0] to 16-bit signed PCM Int16Array
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to Base64
        const buffer = pcm16.buffer;
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        if (this.onAudioChunk) {
          this.onAudioChunk(base64, volume);
        }
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
      this.isRecording = true;
    } catch (err) {
      console.error('[AudioCapture] Microphone access failed:', err);
      throw err;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (muted && this.onVolumeChange) {
      this.onVolumeChange(0);
    }
  }

  stop() {
    this.isRecording = false;
    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (_) {}
      this.processor = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (_) {}
      this.source = null;
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }
}
