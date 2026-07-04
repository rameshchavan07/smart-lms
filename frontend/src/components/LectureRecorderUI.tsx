import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, Circle, Loader2, Maximize, Minimize, Square, Settings, RefreshCw, AlertCircle, Play, Pause, RotateCcw, UploadCloud, Download, Video, VideoOff, X, Mic, MicOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useScreenRecorder, type RecordingQuality } from '../hooks/useScreenRecorder';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import toast from 'react-hot-toast';

interface LectureRecorderUIProps {
  lectureId: string;
}

// ── Audio Waveform ─────────────────────────────────────────────────────────
const BAR_BASES = [0.3, 0.6, 1, 0.8, 0.5, 0.9, 0.4, 0.7];

const AudioWaveform: React.FC<{ level: number; active: boolean }> = ({ level, active }) => {
  // Randomness lives in state, updated via an interval — not during render
  const [offsets, setOffsets] = useState<number[]>(() => BAR_BASES.map(() => 0));

  useEffect(() => {
    if (!active) return;  // offsets unused when inactive — no reset needed
    const id = setInterval(() => {
      setOffsets(BAR_BASES.map(() => Math.random()));
    }, 80);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex items-center gap-[2px] h-5">
      {BAR_BASES.map((base, i) => {
        const height = active
          ? Math.max(4, Math.round(base * level * 0.4 + offsets[i] * level * 0.1))
          : 3;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75"
            style={{
              height: `${Math.min(20, height)}px`,
              background: active
                ? `hsl(${220 - level}, 90%, 60%)`
                : 'rgb(148 163 184)',
              opacity: active ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
};

// ── Format time ────────────────────────────────────────────────────────────
const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
};

// ── Countdown Overlay ──────────────────────────────────────────────────────
const CountdownOverlay: React.FC<{ count: number }> = ({ count }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div
        key={count}
        className="text-[120px] font-black text-white leading-none"
        style={{ animation: 'countdown-pop 0.9s ease-out forwards' }}
      >
        {count}
      </div>
      <p className="text-white/70 text-lg font-semibold tracking-widest uppercase">
        Recording starts…
      </p>
    </div>
    <style>{`
      @keyframes countdown-pop {
        0%   { transform: scale(1.6); opacity: 0; }
        20%  { transform: scale(1);   opacity: 1; }
        80%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(0.6); opacity: 0; }
      }
    `}</style>
  </div>
);

// ── Preview Modal ──────────────────────────────────────────────────────────
interface PreviewModalProps {
  blob: Blob;
  duration: number;
  lectureId: string;
  onDiscard: () => void;
  onUploaded: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ blob, duration, lectureId, onDiscard, onUploaded }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const videoUrl = URL.createObjectURL(blob);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `lecture-${lectureId}-${Date.now()}.webm`;
    a.click();
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    abortRef.current = new AbortController();

    const formData = new FormData();
    formData.append('recording', blob, `lecture-${lectureId}.webm`);
    formData.append('duration', duration.toString());

    try {
      await api.put(API_ENDPOINTS.LECTURES.RECORDING(lectureId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortRef.current.signal,
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      setUploadSuccess(true);
      setTimeout(() => onUploaded(), 2000);
    } catch (err: unknown) {
      if ((err as Error).name !== 'CanceledError') {
        const errorResponse = err as { response?: { data?: { message?: string } }, message?: string };
        const msg = errorResponse?.response?.data?.message || errorResponse.message || 'Upload failed. Try again.';
        setUploadError(msg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    abortRef.current?.abort();
    setIsUploading(false);
    setUploadProgress(0);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col bg-surface shadow-xl border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-primary font-bold text-lg">Preview Recording</h3>
            <p className="text-muted text-xs mt-0.5">Duration: {formatTime(duration)}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary">
            <span className="px-2 py-1 rounded-full bg-bg-subtle border border-border">WebM · {(blob.size / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </div>

        {/* Video */}
        <div className="bg-black">
          <video
            src={videoUrl}
            controls
            className="w-full max-h-[340px]"
            style={{ outline: 'none' }}
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="px-5 py-3 bg-bg-subtle border-t border-border">
            <div className="flex items-center justify-between text-xs text-secondary mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Uploading to Google Drive…
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-surface border border-border rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, #4361f0, #8b5cf6)',
                }}
              />
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="px-5 py-3 bg-green-50 dark:bg-green-500/10 border-t border-green-200 dark:border-green-500/20 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <Check className="w-4 h-4" /> Uploaded successfully to Google Drive!
          </div>
        )}

        {uploadError && (
          <div className="px-5 py-3 bg-red-50 dark:bg-red-500/10 border-t border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {uploadError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-border bg-surface">
          <button
            onClick={onDiscard}
            disabled={isUploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-primary hover:bg-bg-subtle transition disabled:opacity-40"
          >
            <X className="w-4 h-4" /> Discard
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-bg-subtle border border-border hover:bg-border text-primary transition"
          >
            <Download className="w-4 h-4" /> Download
          </button>

          <div className="flex-1" />

          {isUploading ? (
            <button
              onClick={handleCancelUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 transition"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          ) : !uploadSuccess ? (
            <button
              onClick={handleUpload}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #4361f0, #8b5cf6)' }}
            >
              <UploadCloud className="w-4 h-4" /> Upload to Cloud
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
export const LectureRecorderUI: React.FC<LectureRecorderUIProps> = ({ lectureId }) => {
  const [quality, setQuality] = useState<RecordingQuality>('720p');
  const [enableWebcam, setEnableWebcam] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // Derived directly from recorder state — no setState-in-effect needed
  const webcamVideoRef = useRef<HTMLVideoElement>(null);

  const {
    status,
    error,
    duration,
    countdown,
    audioLevel,
    webcamStream,
    previewBlob,
    pausedSegments,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecorder,
  } = useScreenRecorder({ quality, enableWebcam });

  // Attach webcam stream to video element
  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Derive showPreview from recorder state instead of setState-in-effect
  const showPreview = status === 'stopped' && !!previewBlob;


  const handleStop = async () => {
    await stopRecording();
  };

  const handleDiscard = async () => {
    await resetRecorder();
  };

  const handleUploaded = async () => {
    await resetRecorder();
  };

  const isActive = status === 'recording' || status === 'paused';

  // Status display
  const statusLabel = {
    idle: 'Ready to Record',
    countdown: 'Starting…',
    recording: 'Recording Live',
    paused: 'Paused',
    stopped: 'Stopped',
    error: 'Error',
  }[status];

  const statusColor = {
    idle: '#94a3b8',
    countdown: '#f59e0b',
    recording: '#ef4444',
    paused: '#f59e0b',
    stopped: '#94a3b8',
    error: '#ef4444',
  }[status];

  return (
    <>
      {/* Countdown overlay */}
      {status === 'countdown' && countdown !== null && (
        <CountdownOverlay count={countdown} />
      )}

      {/* Preview modal */}
      {showPreview && previewBlob && (
        <PreviewModal
          blob={previewBlob}
          duration={duration}
          lectureId={lectureId}
          onDiscard={handleDiscard}
          onUploaded={handleUploaded}
        />
      )}

      {/* Webcam PiP */}
      {webcamStream && !collapsed && (
        <div
          className="fixed bottom-[200px] right-6 z-[9996] w-36 h-24 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20"
          style={{ cursor: 'grab' }}
        >
          <video
            ref={webcamVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 right-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Main floating panel */}
      <div
        className="fixed bottom-6 right-6 z-[9997] flex flex-col"
        style={{
          width: collapsed ? '180px' : '288px',
          background: 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          boxShadow: status === 'recording'
            ? '0 0 0 2px rgba(239,68,68,0.5), 0 20px 60px rgba(0,0,0,0.5)'
            : '0 20px 60px rgba(0,0,0,0.4)',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: statusColor,
                boxShadow: status === 'recording' ? `0 0 8px ${statusColor}` : 'none',
                animation: status === 'recording' ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            {status === 'recording' && (
              <span className="text-[10px] font-bold text-red-400 tracking-widest">REC</span>
            )}
            <span className="text-white/80 text-xs font-medium">{statusLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Settings */}
            {(status === 'idle' || status === 'error') && (
              <button
                onClick={() => setShowSettings(s => !s)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Collapse */}
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition"
            >
              {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            {/* Settings Panel */}
            {showSettings && (status === 'idle' || status === 'error') && (
              <div className="px-3 pb-2 border-b border-white/8 space-y-2">
                {/* Quality */}
                <div>
                  <label className="text-white/40 text-[10px] uppercase tracking-wider block mb-1">Quality</label>
                  <div className="flex gap-1">
                    {(['720p', '1080p', '4K'] as RecordingQuality[]).map(q => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className="flex-1 py-1 rounded-lg text-xs font-semibold transition"
                        style={{
                          background: quality === q ? 'rgba(67,97,240,0.4)' : 'rgba(255,255,255,0.06)',
                          color: quality === q ? '#93affd' : 'rgba(255,255,255,0.5)',
                          border: quality === q ? '1px solid rgba(67,97,240,0.5)' : '1px solid transparent',
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Webcam */}
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-[10px] uppercase tracking-wider">Webcam PiP</span>
                  <button
                    onClick={() => setEnableWebcam(w => !w)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition"
                    style={{
                      background: enableWebcam ? 'rgba(67,97,240,0.3)' : 'rgba(255,255,255,0.06)',
                      color: enableWebcam ? '#93affd' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {enableWebcam ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                    {enableWebcam ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}

            {/* Timer + Waveform */}
            <div className="flex items-center justify-between px-3 py-2">
              <AudioWaveform level={audioLevel} active={status === 'recording'} />
              <span className="font-mono text-white font-bold text-base tabular-nums">
                {formatTime(duration)}
              </span>
            </div>

            {/* Pause Timeline */}
            {isActive && (
              <div className="px-3 pb-2">
                <div className="w-full bg-white/10 rounded-full h-1 relative overflow-hidden">
                  {/* Active fill */}
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '100%',
                      background: status === 'recording'
                        ? 'linear-gradient(90deg, #4361f0, #8b5cf6)'
                        : '#f59e0b',
                      animation: status === 'recording' ? 'progress-shimmer 2s linear infinite' : 'none',
                    }}
                  />
                  {/* Pause gaps */}
                  {pausedSegments.map((seg, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full bg-slate-800/80"
                      style={{
                        left: `${(seg.pausedAt / Math.max(duration, 1)) * 100}%`,
                        width: `${((seg.resumedAt - seg.pausedAt) / Math.max(duration, 1)) * 100}%`,
                      }}
                    />
                  ))}
                </div>
                <style>{`
                  @keyframes progress-shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                  }
                `}</style>
              </div>
            )}

            {/* Audio/Mic status */}
            <div className="flex items-center gap-1.5 px-3 pb-2">
              {status === 'recording' ? (
                <Mic className="w-3 h-3 text-green-400" />
              ) : (
                <MicOff className="w-3 h-3 text-white/30" />
              )}
              <span className="text-[10px] text-white/30">
                {status === 'recording' ? `Audio level: ${audioLevel}%` : 'Microphone off'}
              </span>
              <span className="ml-auto text-[10px] text-white/30">{quality}</span>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-3 mb-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5">
                {error}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2 px-3 pb-3">
              {(status === 'idle' || status === 'error' || status === 'stopped') && (
                <button
                  onClick={startRecording}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #4361f0, #6183fb)' }}
                >
                  <Play className="w-4 h-4" /> Start
                </button>
              )}

              {status === 'recording' && (
                <>
                  <button
                    onClick={pauseRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
                  >
                    <Pause className="w-4 h-4" /> Pause
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}
                  >
                    <Square className="w-4 h-4" /> Stop
                  </button>
                </>
              )}

              {status === 'paused' && (
                <>
                  <button
                    onClick={resumeRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}
                  >
                    <RotateCcw className="w-4 h-4" /> Resume
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}
                  >
                    <Square className="w-4 h-4" /> Stop
                  </button>
                </>
              )}

              {status === 'countdown' && (
                <div className="flex-1 flex items-center justify-center py-2.5 text-sm font-semibold text-amber-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Starting…
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
