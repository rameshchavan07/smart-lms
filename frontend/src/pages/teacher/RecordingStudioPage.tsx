import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Square, Pause, RotateCcw, UploadCloud, Download,
  ArrowLeft, Settings, Video, VideoOff, Mic, MicOff,
  X, Check, Loader2, ChevronDown, ChevronUp, Monitor, Scissors,
  Bookmark, Pencil, Volume2, VolumeX
} from 'lucide-react';
import { useScreenRecorder, type RecordingQuality } from '../../hooks/useScreenRecorder';
import api from '../../services/api';
import axios from 'axios';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import AnnotationOverlay from './AnnotationOverlay';


// ─── Constants ────────────────────────────────────────────────────────────
const FFMPEG_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
};

// ─── Audio Level Bar ───────────────────────────────────────────────────────
const AudioMeter: React.FC<{ level: number; active: boolean }> = ({ level, active }) => {
  const bars = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="flex items-end gap-[2px] h-8">
      {bars.map(i => {
        const threshold = (i / 20) * 100;
        const lit = active && level > threshold;
        const color = i < 10 ? '#10b981' : i < 15 ? '#f59e0b' : '#ef4444';
        return (
          <div
            key={i}
            className="w-2 rounded-sm transition-all duration-75"
            style={{
              height: `${Math.max(4, (i + 1) * 1.5)}px`,
              background: lit ? color : 'rgba(255,255,255,0.08)',
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Countdown Overlay ─────────────────────────────────────────────────────
const CountdownOverlay: React.FC<{ count: number }> = ({ count }) => (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
    <div
      key={count}
      className="text-[100px] font-black text-white leading-none"
      style={{ animation: 'countdown-pop 0.9s ease-out forwards' }}
    >
      {count}
    </div>
    <p className="text-white/60 text-base font-semibold tracking-widest uppercase mt-4">
      Recording starts…
    </p>
    <style>{`
      @keyframes countdown-pop {
        0%   { transform: scale(1.8); opacity: 0; }
        20%  { transform: scale(1);   opacity: 1; }
        80%  { transform: scale(1);   opacity: 1; }
        100% { transform: scale(0.5); opacity: 0; }
      }
    `}</style>
  </div>
);

// ─── Chapter type ──────────────────────────────────────────────────────────
export interface Chapter {
  id: number;
  time: number;   // seconds from recording start
  label: string;
}

// ─── Preview Panel ─────────────────────────────────────────────────────────
interface PreviewPanelProps {
  blob: Blob;
  duration: number;
  lectureId?: string;
  chapters?: Chapter[];
  onDiscard: () => void;
  onUploaded: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ blob, duration, lectureId, chapters = [], onDiscard, onUploaded }) => {
  const [currentBlob, setCurrentBlob] = useState(blob);
  const [currentDuration, setCurrentDuration] = useState(duration);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Trimming State
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(Math.floor(duration));
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [trimError, setTrimError] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());

  const abortRef = useRef<AbortController | null>(null);

  // Derive videoUrl during render (no state needed). A separate effect handles
  // cleanup only — no setState is called inside the effect body.
  const videoUrl = useMemo(() => URL.createObjectURL(currentBlob), [currentBlob]);
  useEffect(() => {
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  // Sync blob/duration props using the React-recommended "compare during render"
  // pattern. Calling setState conditionally *during* render (not inside an effect)
  // is explicitly supported by React and avoids cascading renders.
  const [prevBlob, setPrevBlob] = useState(blob);
  if (blob !== prevBlob) {
    setPrevBlob(blob);
    setCurrentBlob(blob);
    setCurrentDuration(duration);
    setTrimStart(0);
    setTrimEnd(Math.floor(duration));
  }

  const handleTrim = async () => {
    if (trimStart >= trimEnd || trimStart < 0 || trimEnd > currentDuration) {
      // FIX #4: Use inline error state instead of blocking alert().
      setTrimError('Invalid trim range. Please check start and end times.');
      return;
    }
    setTrimError(null);

    try {
      setIsTrimming(true);
      setTrimProgress(0);
      const ffmpeg = ffmpegRef.current;

      if (!ffmpeg.loaded) {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      // FIX #3: Store the progress handler so it can be removed after the operation,
      // preventing duplicate listeners from stacking up on repeated trims.
      const onProgress = ({ progress }: { progress: number }) => {
        setTrimProgress(Math.round(progress * 100));
      };
      ffmpeg.on('progress', onProgress);

      try {
        await ffmpeg.writeFile('input.webm', await fetchFile(currentBlob));

        const formatTimeArg = (secs: number) => new Date(secs * 1000).toISOString().slice(11, 23);

        await ffmpeg.exec([
          '-ss', formatTimeArg(trimStart),
          '-to', formatTimeArg(trimEnd),
          '-i', 'input.webm',
          '-c', 'copy',
          'output.webm'
        ]);

        const data = await ffmpeg.readFile('output.webm');
        const newBlob = new Blob([data as BlobPart], { type: 'video/webm' });
        setCurrentBlob(newBlob);
        const newDuration = trimEnd - trimStart;
        setCurrentDuration(newDuration);
        setTrimStart(0);
        setTrimEnd(Math.floor(newDuration));
      } finally {
        // Always remove the listener regardless of success or failure.
        ffmpeg.off('progress', onProgress);
      }
    } catch (e) {
      console.error(e);
      // FIX #4: Use inline error state instead of blocking alert().
      setTrimError('Error trimming video. Please try again.');
    } finally {
      setIsTrimming(false);
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `lecture-recording-${Date.now()}.webm`;
    a.click();
  };

  const handleUpload = async () => {
    if (!lectureId) { setUploadError('No lecture selected for upload.'); return; }
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    abortRef.current = new AbortController();

    try {
      const urlResponse = await api.post(API_ENDPOINTS.LECTURES.RECORDING_UPLOAD_URL(lectureId), {
        fileName: `recording-${lectureId}.webm`,
        mimeType: currentBlob.type || 'video/webm'
      });
      const uploadUrl = urlResponse.data.uploadUrl;

      const driveResponse = await axios.put(uploadUrl, currentBlob, {
        headers: { 'Content-Type': currentBlob.type || 'video/webm' },
        signal: abortRef.current.signal,
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      const fileId = driveResponse.data?.id;

      await api.post(API_ENDPOINTS.LECTURES.RECORDING_CONFIRM(lectureId), {
        fileId: fileId || '',
        fileName: `recording-${lectureId}.webm`,
        size: currentBlob.size,
        duration: currentDuration,
      });

      setUploadSuccess(true);
      setTimeout(() => onUploaded(), 2000);
    } catch (err: unknown) {
      if ((err as Error).name !== 'CanceledError') {
        const errorResponse = err as { response?: { data?: { message?: string } }, message?: string };
        const msg = errorResponse?.response?.data?.message || errorResponse.message || 'Upload failed. Please try again.';
        setUploadError(msg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-xl">Preview Recording</h3>
          <p className="text-white/40 text-sm mt-0.5">
            Duration: {formatTime(currentDuration)} · {(currentBlob.size / (1024 * 1024)).toFixed(1)} MB · WebM
          </p>
        </div>
        <button
          onClick={onDiscard}
          className="p-2 rounded-xl hover:bg-surface/10 text-white/40 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chapters in preview */}
      {chapters.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-surface/5 border border-white/10">
          <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Chapters</p>
          <div className="flex flex-col gap-1.5">
            {chapters.map(ch => (
              <div key={ch.id} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-primary/80 text-xs w-12 shrink-0">{formatTime(ch.time)}</span>
                <span className="text-white/70">{ch.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden bg-black flex-1 min-h-0 flex items-center justify-center">
        <video
          key={videoUrl} // Force re-render on url change to reset state
          src={videoUrl}
          controls
          className="w-full h-full max-h-[340px] outline-none"
        />
      </div>

      {/* Trim Controls */}
      {!isUploading && !uploadSuccess && (
        <div className="mt-4 p-4 rounded-xl bg-surface/5 border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span className="font-medium">Trim Video</span>
            {isTrimming && <span className="text-primary">{trimProgress}%</span>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-white/40">Start Time (sec)</label>
              <input
                type="number"
                min={0}
                max={trimEnd - 1}
                value={trimStart}
                onChange={e => setTrimStart(Number(e.target.value))}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-white/40">End Time (sec)</label>
              <input
                type="number"
                min={trimStart + 1}
                max={Math.floor(currentDuration)}
                value={trimEnd}
                onChange={e => setTrimEnd(Number(e.target.value))}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none"
              />
            </div>
            <button
              onClick={handleTrim}
              disabled={isTrimming || trimStart >= trimEnd || (trimStart === 0 && trimEnd === Math.floor(currentDuration))}
              className="mt-5 flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition disabled:opacity-50"
            >
              {isTrimming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
              Trim
            </button>
          </div>
          {trimError && (
            <div className="px-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {trimError}
            </div>
          )}
        </div>
      )}


      {/* Upload progress */}
      {isUploading && (
        <div className="mt-4 p-4 rounded-xl bg-surface/5 border border-white/10">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading to Google Drive…
            </span>
            <span className="font-mono">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-surface/10 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${uploadProgress}%`,
                background: 'linear-gradient(90deg, #4361f0, #8b5cf6)',
              }}
            />
          </div>
          <button
            onClick={() => { abortRef.current?.abort(); setIsUploading(false); }}
            className="mt-2 text-xs text-red-400 hover:text-red-300 transition"
          >
            Cancel upload
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Uploaded successfully to Google Drive!</span>
        </div>
      )}

      {uploadError && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onDiscard}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-surface/10 transition"
        >
          <X className="w-4 h-4" /> Discard
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-surface/10 hover:bg-surface/15 text-white transition"
        >
          <Download className="w-4 h-4" /> Download
        </button>
        <div className="flex-1" />
        {!uploadSuccess && !isUploading && (
          <button
            onClick={handleUpload}
            disabled={!lectureId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #4361f0, #8b5cf6)' }}
          >
            <UploadCloud className="w-4 h-4" /> Upload to Cloud
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
const RecordingStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [quality, setQuality] = useState<RecordingQuality>('720p');
  const [enableWebcam, setEnableWebcam] = useState(false);
  const [enableNoiseSuppression, setEnableNoiseSuppression] = useState(true);
  const [selectedLectureId, setSelectedLectureId] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(true);
  // Chapters / Bookmarks
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const chapterCounterRef = useRef(0);
  // Annotation overlay
  const [isAnnotating, setIsAnnotating] = useState(false);
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
  } = useScreenRecorder({ quality, enableWebcam, enableNoiseSuppression });

  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Derive showPreview directly from recorder state
  const showPreview = status === 'stopped' && !!previewBlob;

  const handleStop = useCallback(async () => { await stopRecording(); }, [stopRecording]);

  const handleDiscard = useCallback(async () => {
    setChapters([]);
    chapterCounterRef.current = 0;
    setIsAnnotating(false);
    await resetRecorder();
  }, [resetRecorder]);

  // ── Add chapter ──────────────────────────────────────────────────────────
  const addChapter = useCallback(() => {
    if (status !== 'recording' && status !== 'paused') return;
    chapterCounterRef.current += 1;
    const id = chapterCounterRef.current;
    setChapters(prev => [
      ...prev,
      { id, time: duration, label: `Chapter ${id}` },
    ]);
  }, [status, duration]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in an input / textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'b' || e.key === 'B') addChapter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addChapter]);

  const isActive = status === 'recording' || status === 'paused';
  const isIdle = status === 'idle' || status === 'error' || status === 'stopped';

  const statusMeta = {
    idle:      { label: 'Ready', dot: '#94a3b8', pulse: false },
    countdown: { label: 'Starting…', dot: '#f59e0b', pulse: true },
    recording: { label: 'Recording', dot: '#ef4444', pulse: true },
    paused:    { label: 'Paused', dot: '#f59e0b', pulse: false },
    stopped:   { label: 'Stopped', dot: '#94a3b8', pulse: false },
    error:     { label: 'Error', dot: '#ef4444', pulse: false },
  }[status];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0f1729 50%, #0a0f1e 100%)',
      }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-surface/10 text-white/60 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight flex items-center gap-2">
              🎬 Recording Studio
            </h1>
            <p className="text-white/40 text-xs">Standalone lecture recorder</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: statusMeta.dot,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: statusMeta.dot,
                animation: statusMeta.pulse ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            {statusMeta.label}
          </div>

          {/* Timer */}
          <div
            className="font-mono text-2xl font-bold tabular-nums"
            style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.3)' }}
          >
            {formatTime(duration)}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* Left: Preview / Recording area */}
        <div className="flex-1 flex flex-col p-6 relative">

          {/* Countdown overlay */}
          {status === 'countdown' && countdown !== null && (
            <CountdownOverlay count={countdown} />
          )}

          {/* Main preview box */}
          <div
            className="flex-1 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: status === 'recording'
                ? '2px solid rgba(239,68,68,0.5)'
                : '1px solid rgba(255,255,255,0.06)',
              boxShadow: status === 'recording' ? '0 0 40px rgba(239,68,68,0.1)' : 'none',
              transition: 'all 0.3s ease',
              minHeight: '300px',
            }}
          >
            {showPreview && previewBlob ? (
              <div className="w-full h-full p-6 flex flex-col">
                <PreviewPanel
                  blob={previewBlob}
                  duration={duration}
                  lectureId={selectedLectureId || undefined}
                  chapters={chapters}
                  onDiscard={handleDiscard}
                  onUploaded={() => { resetRecorder(); }}
                />
              </div>
            ) : (
              <>
                {/* Annotation overlay */}
                <AnnotationOverlay
                  active={isActive}
                  isAnnotating={isAnnotating}
                  onToggle={() => setIsAnnotating(a => !a)}
                />

                {/* Webcam PiP */}
                {webcamStream && (
                  <div className="absolute top-4 right-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
                    <video
                      ref={webcamVideoRef}
                      autoPlay muted playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}

                {/* Idle state */}
                {isIdle && !showPreview && (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
                      style={{ background: 'rgba(67,97,240,0.15)', border: '1px solid rgba(67,97,240,0.3)' }}
                    >
                      <Monitor className="w-10 h-10 text-brand-400" style={{ color: '#6183fb' }} />
                    </div>
                    <p className="text-white/40 text-sm max-w-xs">
                      Press <strong className="text-white/60">Start Recording</strong> to begin capturing your screen.
                      You'll be prompted to select a window or screen.
                    </p>
                    {error && (
                      <div className="mt-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-sm">
                        {error}
                      </div>
                    )}
                  </div>
                )}

                {/* Recording indicator */}
                {status === 'recording' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold text-red-400"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    REC · {formatTime(duration)}
                  </div>
                )}

                {/* Paused indicator */}
                {status === 'paused' && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                      <Pause className="w-8 h-8 text-amber-400" />
                    </div>
                    <p className="text-amber-400/80 text-sm font-semibold">Recording Paused</p>
                    <p className="text-white/30 text-xs">{formatTime(duration)} recorded so far</p>
                  </div>
                )}

                {/* Pause timeline bar */}
                {isActive && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="w-full bg-surface/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: '100%',
                          background: status === 'recording'
                            ? 'linear-gradient(90deg, #4361f0, #8b5cf6)'
                            : '#f59e0b',
                        }}
                      />
                      {pausedSegments.map((seg, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-full"
                          style={{
                            left: `${(seg.pausedAt / Math.max(duration, 1)) * 100}%`,
                            width: `${((seg.resumedAt - seg.pausedAt) / Math.max(duration, 1)) * 100}%`,
                            background: 'rgba(10,15,30,0.8)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-white/20 mt-1">
                      <span>0:00</span>
                      <span>{pausedSegments.length} pause{pausedSegments.length !== 1 ? 's' : ''}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Control buttons */}
          {!showPreview && (
            <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
              {isIdle && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-base font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #4361f0, #6183fb)',
                    boxShadow: '0 8px 24px rgba(67,97,240,0.4)',
                  }}
                >
                  <Play className="w-5 h-5" /> Start Recording
                </button>
              )}

              {status === 'countdown' && (
                <div className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-base font-bold text-amber-400"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Loader2 className="w-5 h-5 animate-spin" /> Preparing…
                </div>
              )}

              {status === 'recording' && (
                <>
                  <button
                    onClick={pauseRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 6px 20px rgba(245,158,11,0.3)' }}
                  >
                    <Pause className="w-5 h-5" /> Pause
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}
                  >
                    <Square className="w-5 h-5" /> Stop & Preview
                  </button>
                </>
              )}

              {status === 'paused' && (
                <>
                  <button
                    onClick={resumeRecording}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 6px 20px rgba(16,185,129,0.3)' }}
                  >
                    <RotateCcw className="w-5 h-5" /> Resume
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}
                  >
                    <Square className="w-5 h-5" /> Stop & Preview
                  </button>
                </>
              )}

              {/* Annotation toggle (only while active) */}
              {isActive && (
                <button
                  onClick={() => setIsAnnotating(a => !a)}
                  title="Toggle drawing mode (shortcut: D)"
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: isAnnotating
                      ? 'rgba(139,92,246,0.3)'
                      : 'rgba(255,255,255,0.08)',
                    color: isAnnotating ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                    border: isAnnotating
                      ? '1px solid rgba(139,92,246,0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <Pencil className="w-4 h-4" />
                  {isAnnotating ? 'Drawing…' : 'Annotate'}
                </button>
              )}

              {/* Add Chapter button (only while active) */}
              {isActive && (
                <button
                  onClick={addChapter}
                  title="Add chapter bookmark (shortcut: B)"
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(245,158,11,0.15)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  <Bookmark className="w-4 h-4" /> Chapter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Settings Panel */}
        <div
          className="w-72 shrink-0 flex flex-col"
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {/* Settings header */}
          <button
            onClick={() => setSettingsOpen(o => !o)}
            className="flex items-center justify-between px-5 py-4 hover:bg-surface/5 transition"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 text-white/70">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-semibold">Recording Settings</span>
            </div>
            {settingsOpen ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>

          {settingsOpen && (
            <div className="flex flex-col gap-5 px-5 py-5">

              {/* Lecture ID (optional link) */}
              <div>
                <label className="text-white/40 text-[11px] uppercase tracking-wider block mb-2">
                  Lecture ID (for cloud upload)
                </label>
                <input
                  value={selectedLectureId}
                  onChange={e => setSelectedLectureId(e.target.value)}
                  placeholder="Paste lecture ID…"
                  className="w-full px-3 py-2 rounded-xl text-sm text-white/80 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  disabled={isActive || status === 'countdown'}
                />
              </div>

              {/* Quality */}
              <div>
                <label className="text-white/40 text-[11px] uppercase tracking-wider block mb-2">
                  Video Quality
                </label>
                <div className="flex gap-2">
                  {(['720p', '1080p', '4K'] as RecordingQuality[]).map(q => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      disabled={isActive || status === 'countdown'}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: quality === q ? 'rgba(67,97,240,0.3)' : 'rgba(255,255,255,0.06)',
                        color: quality === q ? '#93affd' : 'rgba(255,255,255,0.4)',
                        border: quality === q ? '1px solid rgba(67,97,240,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Webcam */}
              <div>
                <label className="text-white/40 text-[11px] uppercase tracking-wider block mb-2">
                  Webcam Overlay (PiP)
                </label>
                <button
                  onClick={() => setEnableWebcam(w => !w)}
                  disabled={isActive || status === 'countdown'}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: enableWebcam ? 'rgba(67,97,240,0.2)' : 'rgba(255,255,255,0.06)',
                    border: enableWebcam ? '1px solid rgba(67,97,240,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-white/70">
                    {enableWebcam ? <Video className="w-4 h-4 text-brand-400" style={{ color: '#6183fb' }} /> : <VideoOff className="w-4 h-4" />}
                    {enableWebcam ? 'Enabled' : 'Disabled'}
                  </span>
                  <div
                    className="w-9 h-5 rounded-full relative transition-all"
                    style={{ background: enableWebcam ? '#4361f0' : 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-surface rounded-full shadow transition-all"
                      style={{ left: enableWebcam ? '18px' : '2px' }}
                    />
                  </div>
                </button>
              </div>

              {/* Noise Suppression */}
              <div>
                <label className="text-white/40 text-[11px] uppercase tracking-wider block mb-2">
                  Noise Suppression
                </label>
                <button
                  onClick={() => setEnableNoiseSuppression(n => !n)}
                  disabled={isActive || status === 'countdown'}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: enableNoiseSuppression ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                    border: enableNoiseSuppression ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-white/70">
                    {enableNoiseSuppression
                      ? <Volume2 className="w-4 h-4" style={{ color: '#34d399' }} />
                      : <VolumeX className="w-4 h-4" />}
                    {enableNoiseSuppression ? 'On (Recommended)' : 'Off (Raw mic)'}
                  </span>
                  <div
                    className="w-9 h-5 rounded-full relative transition-all"
                    style={{ background: enableNoiseSuppression ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-surface rounded-full shadow transition-all"
                      style={{ left: enableNoiseSuppression ? '18px' : '2px' }}
                    />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Audio Meter */}
          <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white/40 text-[11px] uppercase tracking-wider">
                {status === 'recording' ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                Audio Level
              </div>
              <span className="text-white/40 text-[11px] font-mono">{audioLevel}%</span>
            </div>
            <AudioMeter level={audioLevel} active={status === 'recording'} />
          </div>

          {/* Chapters list in sidebar */}
          {chapters.length > 0 && (
            <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3 h-3" /> Chapters ({chapters.length})
              </p>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                {chapters.map(ch => (
                  <div key={ch.id} className="flex items-center gap-2 group">
                    <span className="font-mono text-xs text-primary/70 w-11 shrink-0">{formatTime(ch.time)}</span>
                    {editingChapterId === ch.id ? (
                      <input
                        autoFocus
                        className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-0.5 text-xs text-white outline-none"
                        defaultValue={ch.label}
                        onBlur={e => {
                          const val = e.target.value.trim();
                          if (val) setChapters(prev => prev.map(c => c.id === ch.id ? { ...c, label: val } : c));
                          setEditingChapterId(null);
                        }}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      />
                    ) : (
                      <span
                        className="flex-1 text-xs text-white/60 cursor-pointer hover:text-white transition truncate"
                        onClick={() => setEditingChapterId(ch.id)}
                        title="Click to rename"
                      >
                        {ch.label}
                      </span>
                    )}
                    <button
                      onClick={() => setChapters(prev => prev.filter(c => c.id !== ch.id))}
                      className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Panel */}
          <div className="mt-auto px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Quality', value: quality },
                { label: 'Webcam', value: enableWebcam ? 'On' : 'Off' },
                { label: 'Noise Suppress', value: enableNoiseSuppression ? 'On' : 'Off' },
                { label: 'Duration', value: formatTime(duration) },
                { label: 'Pauses', value: `${pausedSegments.length}` },
                { label: 'Chapters', value: `${chapters.length}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-white/30">{label}</span>
                  <span className="text-white/60 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingStudioPage;
