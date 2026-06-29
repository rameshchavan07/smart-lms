import React, { useState } from 'react';
import { useScreenRecorder } from '../hooks/useScreenRecorder';
import { Play, Square, Pause, RotateCcw, UploadCloud, Loader2 } from 'lucide-react';
import api from '../services/api';

interface LectureRecorderUIProps {
  lectureId: string;
}

export const LectureRecorderUI: React.FC<LectureRecorderUIProps> = ({ lectureId }) => {
  const {
    status,
    error,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  } = useScreenRecorder();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    if (blob) {
      handleUpload(blob);
    }
  };

  const handleUpload = async (blob: Blob) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    const formData = new FormData();
    const file = new File([blob], `recording-${lectureId}.webm`, { type: 'video/webm' });
    formData.append('recording', file);
    formData.append('duration', duration.toString());

    try {
      await api.put(`/lectures/${lectureId}/recording`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      setUploadSuccess(true);
    } catch (err) {
      console.error('Failed to upload recording', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-72 z-50 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
          <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            {status === 'idle' ? 'Ready to Record' :
             status === 'recording' ? 'Recording Live...' :
             status === 'paused' ? 'Recording Paused' :
             'Recording Stopped'}
          </span>
        </div>
        <span className="font-mono text-sm font-medium text-slate-500 dark:text-slate-400">
          {formatTime(duration)}
        </span>
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2 mt-1">
        {status === 'idle' || status === 'error' ? (
          <button
            onClick={startRecording}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm font-medium transition"
          >
            <Play className="w-4 h-4" /> Start
          </button>
        ) : (
          <>
            {status === 'recording' ? (
              <button
                onClick={pauseRecording}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                <Pause className="w-4 h-4" /> Pause
              </button>
            ) : status === 'paused' ? (
              <button
                onClick={resumeRecording}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                <RotateCcw className="w-4 h-4" /> Resume
              </button>
            ) : null}

            {(status === 'recording' || status === 'paused') && (
              <button
                onClick={handleStop}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-medium transition"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
            )}
          </>
        )}
      </div>

      {isUploading && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading to Cloud...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
          <UploadCloud className="w-4 h-4" />
          Recording saved to Google Drive!
        </div>
      )}
    </div>
  );
};
