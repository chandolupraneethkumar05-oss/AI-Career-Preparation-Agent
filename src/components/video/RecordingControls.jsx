import React from 'react';
import {
  Square,
  Play,
  RotateCcw,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  FileText,
  Clock
} from 'lucide-react';

/**
 * RecordingControls Component
 * Minimalist, non-intrusive in-interview recording controls.
 * Adheres strictly to the requirement of NO distracting live metrics or emotional overlays.
 */
export default function RecordingControls({
  isRecording,
  durationSeconds,
  onStartRecording,
  onStopRecording,
  onResetRecording,
  isCameraOn,
  onToggleCamera,
  isMicMuted,
  onToggleMic,
  showTranscript,
  onToggleTranscript,
  canRecord = true,
  disabled = false
}) {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-md bg-[#FFFDF9] border border-[#E5E0D5] shadow-xs">
      {/* Left: Recording State & Duration */}
      <div className="flex items-center gap-3">
        {isRecording ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FDF2E9] border border-[#9A421A]/30 text-[#9A421A] font-mono text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9A421A] animate-pulse" />
            <span>REC</span>
            <span className="text-[#1F1B16] ml-1">{formatTime(durationSeconds)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-[#70685E] font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-[#1A365D]" />
            <span>{durationSeconds > 0 ? `Recorded: ${formatTime(durationSeconds)}` : 'Ready to record'}</span>
          </div>
        )}
      </div>

      {/* Center: Primary Answer Capture Actions */}
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={onStartRecording}
            disabled={!canRecord || disabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1B2A4A] hover:bg-[#142038] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{durationSeconds > 0 ? 'Resume / Record Answer' : 'Start Answer'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStopRecording}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#9A421A] hover:bg-[#853412] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Answer</span>
          </button>
        )}

        {durationSeconds > 0 && !isRecording && onResetRecording && (
          <button
            type="button"
            onClick={onResetRecording}
            disabled={disabled}
            title="Re-record answer from beginning"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#FAF8F3] hover:bg-[#F2EFE9] border border-[#E5E0D5] text-xs text-[#70685E] hover:text-[#1F1B16] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-record</span>
          </button>
        )}
      </div>

      {/* Right: Device Toggles & Transcript Visibility */}
      <div className="flex items-center gap-2">
        {/* Toggle Live Transcript View */}
        {onToggleTranscript && (
          <button
            type="button"
            onClick={onToggleTranscript}
            title={showTranscript ? 'Hide live transcript' : 'Show live transcript'}
            className={`p-2 rounded-md border text-xs transition-colors cursor-pointer ${
              showTranscript
                ? 'bg-[#EAEFF5] border-[#BDD0E2] text-[#1A365D]'
                : 'bg-[#FAF8F3] border-[#E5E0D5] text-[#70685E] hover:text-[#1F1B16]'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>
        )}

        {/* Camera Toggle */}
        {onToggleCamera && (
          <button
            type="button"
            onClick={onToggleCamera}
            title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            className={`p-2 rounded-md border text-xs transition-colors cursor-pointer ${
              isCameraOn
                ? 'bg-[#FAF8F3] border-[#E5E0D5] text-[#1F1B16] hover:bg-[#F2EFE9]'
                : 'bg-[#FDF2E9] border-[#9A421A]/30 text-[#9A421A]'
            }`}
          >
            {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>
        )}

        {/* Mic Toggle */}
        {onToggleMic && (
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            className={`p-2 rounded-md border text-xs transition-colors cursor-pointer ${
              !isMicMuted
                ? 'bg-[#FAF8F3] border-[#E5E0D5] text-[#1F1B16] hover:bg-[#F2EFE9]'
                : 'bg-[#FDF2E9] border-[#9A421A]/30 text-[#9A421A]'
            }`}
          >
            {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
