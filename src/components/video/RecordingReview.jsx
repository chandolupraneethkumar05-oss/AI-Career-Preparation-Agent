import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
  Trash2,
  Clock,
  Video,
  AlertTriangle,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import GlassCard from '../GlassCard';
import Badge from '../Badge';
import { interviewApi } from '../../services/interviewApi';

/**
 * RecordingReview Component
 * Full-featured HTML5 video review player with timeline question jump links
 * and permanent delete confirmation modal with user isolation.
 */
export default function RecordingReview({
  sessionId,
  userId = 'user-001',
  streamUrl = null,
  recordedBlob = null,
  segments = [],
  onDeleteSuccess
}) {
  const videoRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(null); // 'deleted' | null

  // Resolve media source URL: prioritize local in-memory blob, then streaming URL, then session stream
  const [mediaSrc, setMediaSrc] = useState(null);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  // Compute fallback duration from segments if available
  const estimatedDuration = React.useMemo(() => {
    if (segments && segments.length > 0) {
      return Math.max(...segments.map(s => (s.end_time || ((s.start_time || 0) + (s.duration || 30)))));
    }
    return 60;
  }, [segments]);

  useEffect(() => {
    setHasPlaybackError(false);

    // 1. High priority: in-memory blob from active session (instant, no buffering)
    if (recordedBlob && recordedBlob.size > 0) {
      const url = URL.createObjectURL(recordedBlob);
      setMediaSrc(url);
      return () => URL.revokeObjectURL(url);
    }

    // 2. Secondary: streamUrl from API response
    if (streamUrl) {
      let resolved = streamUrl;
      // If relative URL like /api/interviews/..., ensure full host or Vite proxy compatibility
      if (!resolved.startsWith('http://') && !resolved.startsWith('https://') && !resolved.startsWith('blob:')) {
        const base = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/api\/?$/, '');
        resolved = `${base}${resolved.startsWith('/') ? '' : '/'}${resolved}`;
      }
      if (!resolved.includes('user_id=') && userId) {
        resolved += `${resolved.includes('?') ? '&' : '?'}user_id=${encodeURIComponent(userId)}`;
      }
      setMediaSrc(resolved);
      return;
    }

    // 3. Fallback: construct standard streaming URL
    if (sessionId) {
      setMediaSrc(interviewApi.getRecordingStreamUrl(sessionId, userId));
    }
  }, [streamUrl, recordedBlob, sessionId, userId]);

  // Video time update listener
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Update duration if Chrome reports valid duration during playback
    const rawDur = videoRef.current.duration;
    if (isFinite(rawDur) && !isNaN(rawDur) && rawDur > 0) {
      if (rawDur !== duration) setDuration(rawDur);
    } else if (cur > duration) {
      setDuration(Math.ceil(cur + 5));
    }

    // Identify active question segment
    if (segments && segments.length > 0) {
      const foundIdx = segments.findIndex(
        s => cur >= (s.start_time || 0) && cur <= (s.end_time || 99999)
      );
      if (foundIdx !== -1) {
        setActiveSegmentIndex(foundIdx);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const rawDur = videoRef.current.duration;
      // Handle WebM Infinity/NaN in Chromium
      if (isFinite(rawDur) && !isNaN(rawDur) && rawDur > 0) {
        setDuration(rawDur);
      } else {
        setDuration(estimatedDuration);
      }
    }
  };

  const handleVideoError = (e) => {
    console.warn('[RecordingReview] HTML5 Video playback error:', e);
    setHasPlaybackError(true);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasPlaybackError(false);
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('[RecordingReview] Play failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e) => {
    const target = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const handleJumpToSegment = (startTime, idx) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);
      setActiveSegmentIndex(idx);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setVolume(val);
      if (val === 0) setIsMuted(true);
      else if (isMuted) setIsMuted(false);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    setPlaybackSpeed(nextSpeed);
  };

  const handleDeleteRecording = async () => {
    setIsDeleting(true);
    try {
      await interviewApi.deleteRecording(sessionId, userId);
      setDeleteStatus('deleted');
      setShowDeleteModal(false);
      onDeleteSuccess?.();
    } catch (e) {
      console.warn('Failed to delete recording:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  if (deleteStatus === 'deleted') {
    return (
      <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#EBF4EE] border border-[#CDE5D4] flex items-center justify-center text-[#235E3B] mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-[#1F1B16] font-serif">Media Archive Removed</h4>
        <p className="text-xs text-[#70685E] max-w-md mx-auto">
          The video recording media has been expunged from local storage. All candidate evaluation rubrics, question scores, and transcript insights remain preserved in the permanent examination register.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Review Card */}
      <GlassCard className="p-6 border-[#E5E0D5] bg-[#FFFDF9] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D5] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#1A365D]" />
              <h3 className="text-base font-bold text-[#1F1B16] font-serif">Session Recording & Timeline Review</h3>
            </div>
            <p className="text-xs text-[#70685E] mt-0.5">
              Review candidate oral defense, jump to specific questions, or manage stored media.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FDF2E9] hover:bg-[#FBE4D5] border border-[#F0C9B3] text-[#9A421A] text-xs font-semibold transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Recording</span>
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full rounded-md overflow-hidden bg-[#1F1B16] border border-[#E5E0D5] shadow-sm group">
          {mediaSrc ? (
            <video
              ref={videoRef}
              src={mediaSrc}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onClick={togglePlay}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain bg-black cursor-pointer"
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-[#70685E]">
              <Video className="w-10 h-10 opacity-50" />
              <p className="text-xs">No media file available for playback.</p>
            </div>
          )}

          {/* Playback Error Overlay */}
          {hasPlaybackError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#1F1B16]/90 text-center space-y-3 z-10">
              <AlertTriangle className="w-10 h-10 text-[#9A421A]" />
              <div className="space-y-1 max-w-sm">
                <p className="text-sm font-bold text-white">Video Stream Notice</p>
                <p className="text-xs text-[#E5E0D5]">
                  Direct streaming could not load the video file. If running locally, ensure the FastAPI backend is active on port 8000.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setHasPlaybackError(false);
                    if (videoRef.current) {
                      videoRef.current.load();
                      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }}
                  className="px-3 py-1.5 rounded-md bg-[#1B2A4A] hover:bg-[#142038] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Retry Playback
                </button>
              </div>
            </div>
          )}

          {/* Big Play overlay when paused */}
          {!isPlaying && mediaSrc && !hasPlaybackError && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-md cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </button>
          )}

          {/* Bottom Custom Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 space-y-2">
            {/* Scrubber / Seek Bar */}
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={duration > 0 && isFinite(duration) ? duration : (estimatedDuration || 100)}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-white/20 rounded-sm appearance-none cursor-pointer accent-[#1A365D]"
              />
            </div>

            {/* Playback Controls Row */}
            <div className="flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 hover:text-[#E5E0D5] transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <div className="font-mono text-[11px] text-[#E5E0D5]">
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1">/</span>
                  <span>{formatTime(duration > 0 && isFinite(duration) ? duration : estimatedDuration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Speed toggle */}
                <button
                  type="button"
                  onClick={cycleSpeed}
                  className="px-2 py-0.5 rounded-sm bg-white/10 hover:bg-white/20 font-mono text-[11px] font-bold text-white transition-colors"
                >
                  {playbackSpeed}x
                </button>

                {/* Volume control */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="p-1 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-14 h-1 bg-white/20 rounded-sm appearance-none cursor-pointer accent-[#1A365D]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Timeline Jump Links */}
        {segments && segments.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1F1B16] uppercase tracking-wider">
              <ListOrdered className="w-4 h-4 text-[#1A365D]" />
              <span>Inquiry Timeline Jump Links</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {segments.map((seg, idx) => {
                const isActive = activeSegmentIndex === idx;
                const startSec = seg.start_time || 0;

                return (
                  <button
                    key={seg.question_id || idx}
                    type="button"
                    onClick={() => handleJumpToSegment(startSec, idx)}
                    className={`p-3 rounded-md border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isActive
                        ? 'bg-[#EAEFF5] border-[#1A365D] text-[#1A365D] shadow-xs'
                        : 'bg-[#FAF8F3] border-[#E5E0D5] hover:bg-[#F2EFE9] text-[#3B352E]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A365D]">
                          Q{idx + 1}
                        </span>
                        <span className="font-mono text-[10px] text-[#70685E]">
                          {formatTime(startSec)}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#1F1B16] truncate">
                        {seg.transcript ? `"${seg.transcript.slice(0, 45)}..."` : `Question ${idx + 1}`}
                      </p>
                    </div>

                    <div className="text-[10px] font-mono text-[#70685E] shrink-0 mt-0.5">
                      {seg.duration ? `${Math.round(seg.duration)}s` : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <GlassCard className="max-w-md w-full p-6 border-[#E5E0D5] bg-[#FFFDF9] shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDF2E9] border border-[#F0C9B3] flex items-center justify-center text-[#9A421A] mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#1F1B16] font-serif">Permanently Expunge Recording?</h4>
              <p className="text-xs text-[#70685E] leading-relaxed">
                This will delete the media video recording file from the server. Your interview scores, rubric breakdowns, and performance analytics will be safely preserved in your archive.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E0D5]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-[#FAF8F3] hover:bg-[#F2EFE9] border border-[#E5E0D5] text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRecording}
                disabled={isDeleting}
                className="px-4 py-2 rounded-md bg-[#9A421A] hover:bg-[#803513] text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Expunge'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
