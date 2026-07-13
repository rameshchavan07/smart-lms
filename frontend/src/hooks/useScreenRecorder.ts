import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped' | 'error';
export type RecordingQuality = '720p' | '1080p' | '4K';

export interface PausedSegment {
  pausedAt: number;   // duration (seconds) when paused
  resumedAt: number;  // duration (seconds) when resumed
}

const DB_NAME = 'lms_recording_cache';
const DB_STORE = 'chunks';

// ─── IndexedDB helpers ────────────────────────────────────────────────────
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, { autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveChunkToDB(db: IDBDatabase, chunk: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).add(chunk);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadChunksFromDB(db: IDBDatabase): Promise<Blob[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result as Blob[]);
    req.onerror = () => reject(req.error);
  });
}

async function clearDB(db: IDBDatabase): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).clear();
    tx.oncomplete = () => resolve();
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────
export interface UseScreenRecorderOptions {
  quality?: RecordingQuality;
  enableWebcam?: boolean;
  enableNoiseSuppression?: boolean;
}

export const useScreenRecorder = (options: UseScreenRecorderOptions = {}) => {
  const { quality = '720p', enableWebcam = false, enableNoiseSuppression = true } = options;

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [pausedSegments, setPausedSegments] = useState<PausedSegment[]>([]);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamRef = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseStartDuration = useRef<number>(0);
  const dbRef = useRef<IDBDatabase | null>(null);

  const pipAnimFrameRef = useRef<number | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

  // Stable ref to stopRecording, so it can be called inside startRecording's onended
  // without creating a circular useCallback dependency
  const stopRecordingRef = useRef<() => Promise<Blob | null>>(() => Promise.resolve(null));

  // ── Audio Level Meter ──────────────────────────────────────────────────
  // Declared BEFORE useEffect so it can be used in the cleanup return
  const stopAudioMeter = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContext.current) audioContext.current.close().catch(() => {});
    audioContext.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startAudioMeter = useCallback((stream: MediaStream) => {
    try {
      audioContext.current = new window.AudioContext();
      analyserRef.current = audioContext.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const tick = () => {
        analyserRef.current!.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(Math.round((avg / 255) * 100));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn('Audio meter failed', e);
    }
  }, []);

  const cleanupPip = useCallback(() => {
    if (pipAnimFrameRef.current) cancelAnimationFrame(pipAnimFrameRef.current);
    pipAnimFrameRef.current = null;
    if (displayVideoRef.current) {
      displayVideoRef.current.pause();
      displayVideoRef.current.srcObject = null;
      displayVideoRef.current = null;
    }
    if (webcamVideoRef.current) {
      webcamVideoRef.current.pause();
      webcamVideoRef.current.srcObject = null;
      webcamVideoRef.current = null;
    }
    pipCanvasRef.current = null;
  }, []);

  // Open IndexedDB on mount; stopAudioMeter is declared above so cleanup is safe
  useEffect(() => {
    openDB().then(db => { dbRef.current = db; }).catch(console.warn);
    return () => {
      stopAudioMeter();
      cleanupPip();
    };
  }, [stopAudioMeter, cleanupPip]);

  // ── Stop ───────────────────────────────────────────────────────────────
  // Declared BEFORE startRecording so startRecording can safely reference
  // stopRecordingRef without creating a circular useCallback dependency
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current) { resolve(null); return; }

      mediaRecorder.current.onstop = async () => {
        // Try in-memory chunks first, fall back to IndexedDB
        let finalChunks = chunks.current;
        if (finalChunks.length === 0 && dbRef.current) {
          finalChunks = await loadChunksFromDB(dbRef.current);
        }

        const blob = new Blob(finalChunks, { type: 'video/webm' });
        setPreviewBlob(blob);

        // Cleanup all streams
        streamRef.current?.getTracks().forEach(t => t.stop());
        webcamRef.current?.getTracks().forEach(t => t.stop());
        setWebcamStream(null);
        webcamRef.current = null;

        stopAudioMeter();
        cleanupPip();
        if (timerInterval.current) clearInterval(timerInterval.current);
        setStatus('stopped');
        resolve(blob);
      };

      if (mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      } else {
        resolve(null);
      }
    });
  }, [stopAudioMeter, cleanupPip]);

  // Keep the ref in sync with the latest stopRecording
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // ── Start ──────────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setPreviewBlob(null);
      setPausedSegments([]);

      // 3-2-1 Countdown
      setStatus('countdown');
      for (let i = 3; i >= 1; i--) {
        setCountdown(i);
        await new Promise(r => setTimeout(r, 1000));
      }
      setCountdown(null);

      // Quality constraints
      const videoConstraints =
        quality === '4K'    ? { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 60 } } :
        quality === '1080p' ? { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } } :
                             { width: { ideal: 1280 }, height: { ideal: 720  }, frameRate: { ideal: 60 } };

      // 1. Screen + System Audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: true,
      });

      // 2. Microphone (with optional noise suppression / echo cancellation)
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: enableNoiseSuppression,
            echoCancellation: enableNoiseSuppression,
            autoGainControl: enableNoiseSuppression,
          },
        });
      } catch {
        console.warn('Microphone permission denied, continuing without mic.');
      }

      // 3. Webcam (optional)
      if (enableWebcam) {
        try {
          const cam = await navigator.mediaDevices.getUserMedia({ video: true });
          webcamRef.current = cam;
          setWebcamStream(cam);
        } catch {
          console.warn('Webcam permission denied.');
        }
      }

      // 4. Mix video (True PiP Compositing)
      const combinedStream = new MediaStream();
      const camStream = enableWebcam ? webcamRef.current : null;

      if (camStream) {
        const canvas = document.createElement('canvas');
        pipCanvasRef.current = canvas;
        const width = videoConstraints.width?.ideal || 1280;
        const height = videoConstraints.height?.ideal || 720;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        
        const displayVideo = document.createElement('video');
        displayVideo.srcObject = displayStream;
        displayVideo.muted = true;
        displayVideo.playsInline = true;
        displayVideoRef.current = displayVideo;
        
        const webcamVideo = document.createElement('video');
        webcamVideo.srcObject = camStream;
        webcamVideo.muted = true;
        webcamVideo.playsInline = true;
        webcamVideoRef.current = webcamVideo;

        await Promise.all([
          displayVideo.play().catch(() => {}),
          webcamVideo.play().catch(() => {})
        ]);

        const drawPip = () => {
          if (!ctx) return;
          ctx.drawImage(displayVideo, 0, 0, width, height);
          
          const camWidth = width * 0.2; // 20%
          const camHeight = (webcamVideo.videoHeight / Math.max(webcamVideo.videoWidth, 1)) * camWidth || (camWidth * 9/16);
          const padding = width * 0.02; // 2% padding
          
          const extendedCtx = ctx as CanvasRenderingContext2D & {
            roundRect?: (x: number, y: number, w: number, h: number, radii?: number | number[]) => void;
          };

          ctx.save();
          ctx.beginPath();
          if (extendedCtx.roundRect) {
            extendedCtx.roundRect(width - camWidth - padding, height - camHeight - padding, camWidth, camHeight, 16);
          } else {
            ctx.rect(width - camWidth - padding, height - camHeight - padding, camWidth, camHeight);
          }
          ctx.clip();
          ctx.drawImage(webcamVideo, width - camWidth - padding, height - camHeight - padding, camWidth, camHeight);
          ctx.restore();
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (extendedCtx.roundRect) {
            extendedCtx.roundRect(width - camWidth - padding, height - camHeight - padding, camWidth, camHeight, 16);
          } else {
            ctx.rect(width - camWidth - padding, height - camHeight - padding, camWidth, camHeight);
          }
          ctx.stroke();

          pipAnimFrameRef.current = requestAnimationFrame(drawPip);
        };
        drawPip();

        // 30 FPS for PiP video
        const canvasStream = canvas.captureStream(30);
        canvasStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
      } else {
        displayStream.getVideoTracks().forEach(t => combinedStream.addTrack(t));
      }

      // 5. Mix audio
      const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
      const hasMicAudio = micStream && micStream.getAudioTracks().length > 0;

      if (hasDisplayAudio && hasMicAudio) {
        const ctx = new window.AudioContext();
        const dest = ctx.createMediaStreamDestination();
        ctx.createMediaStreamSource(new MediaStream(displayStream.getAudioTracks())).connect(dest);
        ctx.createMediaStreamSource(new MediaStream(micStream!.getAudioTracks())).connect(dest);
        dest.stream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
      } else if (hasDisplayAudio) {
        displayStream.getAudioTracks().forEach(t => combinedStream.addTrack(t));
      } else if (hasMicAudio) {
        micStream!.getAudioTracks().forEach(t => combinedStream.addTrack(t));
      }

      streamRef.current = combinedStream;
      chunks.current = [];

      // Clear old cached chunks
      if (dbRef.current) await clearDB(dbRef.current);

      // 6. MediaRecorder
      const videoBitsPerSecond =
        quality === '4K' ? 8000000 : // 8 Mbps
        quality === '1080p' ? 5000000 : // 5 Mbps
        2500000; // 2.5 Mbps

      const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')
        ? 'video/webm; codecs=vp9,opus'
        : 'video/webm; codecs=vp8,opus';

      mediaRecorder.current = new MediaRecorder(combinedStream, { 
        mimeType,
        videoBitsPerSecond
      });

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.current.push(e.data);
          if (dbRef.current) saveChunkToDB(dbRef.current, e.data).catch(console.warn);
        }
      };

      // Use the ref so we don't create a circular useCallback dependency
      displayStream.getVideoTracks()[0].onended = () => { stopRecordingRef.current(); };

      mediaRecorder.current.start(1000);
      setStatus('recording');

      startAudioMeter(combinedStream);

      setDuration(0);
      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(msg);
      setStatus('error');
      setCountdown(null);
    }
  }, [quality, enableWebcam, enableNoiseSuppression, startAudioMeter]);

  // ── Pause ──────────────────────────────────────────────────────────────
  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.pause();
      setStatus('paused');
      if (timerInterval.current) clearInterval(timerInterval.current);
      stopAudioMeter();
      setDuration(prev => {
        pauseStartDuration.current = prev;
        return prev;
      });
    }
  }, [stopAudioMeter]);

  // ── Resume ─────────────────────────────────────────────────────────────
  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current?.state === 'paused') {
      mediaRecorder.current.resume();
      setStatus('recording');

      setDuration(prev => {
        setPausedSegments(segs => [...segs, { pausedAt: pauseStartDuration.current, resumedAt: prev }]);
        return prev;
      });

      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      if (streamRef.current) startAudioMeter(streamRef.current);
    }
  }, [startAudioMeter]);

  // ── Reset ──────────────────────────────────────────────────────────────
  const resetRecorder = async () => {
    cleanupPip();
    if (dbRef.current) await clearDB(dbRef.current);
    chunks.current = [];
    setPreviewBlob(null);
    setPausedSegments([]);
    setDuration(0);
    setCountdown(null);
    setAudioLevel(0);
    setError(null);
    setStatus('idle');
  };

  return {
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
  };
};
