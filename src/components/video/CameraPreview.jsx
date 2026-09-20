import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Video,
  AlertTriangle,
  CheckCircle2,
  Shield,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

/**
 * CameraPreview Component
 * Provides responsive live webcam preview, Web Audio API microphone level meter,
 * device toggles, permission error handling, and privacy assurance.
 */
export default function CameraPreview({
  onStreamReady,
  onFallbackToText,
  onPermissionChange,
  showControls = true,
  className = ''
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'audio_only' | 'denied'
  const [errorMessage, setErrorMessage] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);

  // Initialize camera and mic stream
  const initMedia = async () => {
    setIsLoadingMedia(true);
    setErrorMessage('');

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('denied');
      setErrorMessage('Camera and microphone are not supported in this browser environment.');
      setIsLoadingMedia(false);
      onPermissionChange?.('unsupported');
      return;
    }

    // 1. Try Video + Audio
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
          sampleRate: 48000
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermissionStatus('granted');
      setIsCameraOn(true);
      setIsMicMuted(false);
      setupAudioMeter(stream);
      onStreamReady?.(stream, { hasVideo: true, hasAudio: true });
      onPermissionChange?.('granted');
      setIsLoadingMedia(false);
      return;
    } catch (err) {
      console.warn('[CameraPreview] Video+Audio access error, testing fallback:', err);
    }

    // 2. Fallback: Audio Only
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      streamRef.current = audioStream;
      setPermissionStatus('audio_only');
      setIsCameraOn(false);
      setIsMicMuted(false);
      setupAudioMeter(audioStream);
      onStreamReady?.(audioStream, { hasVideo: false, hasAudio: true });
      onPermissionChange?.('audio_only');
      setIsLoadingMedia(false);
      return;
    } catch (audioErr) {
      console.warn('[CameraPreview] Audio-only fallback also failed:', audioErr);
      setPermissionStatus('denied');
      setErrorMessage(
        'Camera and microphone access was denied or not detected. You can practice with a Text Interview instead.'
      );
      onPermissionChange?.('denied');
      setIsLoadingMedia(false);
    }
  };

  // Setup Web Audio API volume visualizer
  const setupAudioMeter = (stream) => {
    try {
      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current || isMicMuted) {
          setAudioLevel(0);
          animFrameRef.current = requestAnimationFrame(updateMeter);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalize 0-255 to percentage 0-100
        const percentage = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(percentage);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('[CameraPreview] Audio visualizer setup error:', e);
    }
  };

  useEffect(() => {
    initMedia();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Toggle Camera
  const toggleCamera = () => {
    if (!streamRef.current) return;
    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length === 0) return;

    const nextState = !isCameraOn;
    videoTracks.forEach(track => {
      track.enabled = nextState;
    });
    setIsCameraOn(nextState);
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;

    const nextState = !isMicMuted;
    audioTracks.forEach(track => {
      track.enabled = !nextState;
    });
    setIsMicMuted(nextState);
    if (nextState) setAudioLevel(0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Preview Frame */}
      <div className="relative aspect-video w-full rounded-md overflow-hidden bg-[#1F1B16] border border-[#E5E0D5] shadow-xs flex items-center justify-center">
        {/* Actual Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain bg-black transform -scale-x-100 transition-opacity duration-300 ${
            isCameraOn && permissionStatus === 'granted' ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        />

        {/* Camera Off or Audio-Only Placeholder */}
        {(!isCameraOn || permissionStatus === 'audio_only') && permissionStatus !== 'denied' && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-[#FAF8F3]">
              {permissionStatus === 'audio_only' ? <Mic className="w-8 h-8 text-[#FAF8F3]" /> : <CameraOff className="w-8 h-8" />}
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-white">
                {permissionStatus === 'audio_only' ? 'Acoustic-Only Mode Active' : 'Optical Sensor Disengaged'}
              </p>
              <p className="text-xs text-[#E5E0D5] mt-1 max-w-sm">
                {permissionStatus === 'audio_only'
                  ? 'Microphone is connected. Your examination will proceed with oral answer capture.'
                  : 'Toggle the camera button below to re-engage video capture.'}
              </p>
            </div>
          </div>
        )}

        {/* Permission Denied State */}
        {permissionStatus === 'denied' && (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[#FDF2E9] border border-[#9A421A]/30 rounded-md max-w-md m-4">
            <div className="w-12 h-12 rounded-md bg-[#FDF2E9] border border-[#9A421A]/40 flex items-center justify-center text-[#9A421A]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-[#1F1B16]">Device Permissions Required</p>
              <p className="text-xs text-[#70685E] mt-1">{errorMessage}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={initMedia}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1B2A4A] hover:bg-[#142038] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Access
              </button>
              {onFallbackToText && (
                <button
                  type="button"
                  onClick={onFallbackToText}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] hover:bg-[#FAF8F3] text-xs font-semibold text-[#1F1B16] transition-colors cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#1A365D]" />
                  Switch to Text Mode
                </button>
              )}
            </div>
          </div>
        )}

        {/* Device Controls Bar Overlay */}
        {showControls && permissionStatus !== 'denied' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-md bg-black/60 backdrop-blur-xs border border-white/20 shadow-md">
            {/* Camera Toggle */}
            <button
              type="button"
              onClick={toggleCamera}
              title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              className={`p-2.5 rounded-md transition-all cursor-pointer ${
                isCameraOn
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-[#9A421A]/40 text-[#FAF8F3] border border-[#9A421A]'
              }`}
            >
              {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
            </button>

            {/* Mic Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              className={`p-2.5 rounded-md transition-all cursor-pointer ${
                !isMicMuted
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-[#9A421A]/40 text-[#FAF8F3] border border-[#9A421A]'
              }`}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Mic Input Level Indicator */}
            {!isMicMuted && (
              <div className="flex items-center gap-1 pl-1 border-l border-white/20" title={`Microphone input: ${audioLevel}%`}>
                <div className="w-1.5 h-4 bg-white/20 rounded-full overflow-hidden flex flex-col-reverse">
                  <div
                    className="w-full bg-[#235E3B] transition-all duration-75"
                    style={{ height: `${Math.min(100, Math.max(15, audioLevel * 1.5))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Device Status & Reassurance Footer */}
      <div className="p-4 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#70685E]">
            <CheckCircle2
              className={`w-4 h-4 ${
                permissionStatus === 'granted' && isCameraOn ? 'text-[#235E3B]' : 'text-[#8A8277]'
              }`}
            />
            <span>Camera: {permissionStatus === 'granted' ? 'Connected' : 'Unavailable'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#70685E]">
            <CheckCircle2
              className={`w-4 h-4 ${
                (permissionStatus === 'granted' || permissionStatus === 'audio_only') && !isMicMuted
                  ? 'text-[#235E3B]'
                  : 'text-[#8A8277]'
              }`}
            />
            <span>Microphone: {permissionStatus !== 'denied' ? 'Connected' : 'Unavailable'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#70685E]">
          <Shield className="w-3.5 h-3.5 text-[#1A365D] shrink-0" />
          <span>Private & confidential: session telemetry remains local to your client.</span>
        </div>
      </div>
    </div>
  );
}
