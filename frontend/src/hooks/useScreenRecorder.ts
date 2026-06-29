import { useState, useRef, useCallback } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped' | 'error';

export const useScreenRecorder = () => {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      // 1. Get Screen + System Audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // 2. Get Microphone Audio
      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        console.warn('Microphone permission denied, continuing without microphone.', e);
      }

      // 3. Mix audio tracks if both exist
      const combinedStream = new MediaStream();
      displayStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

      const hasDisplayAudio = displayStream.getAudioTracks().length > 0;
      const hasMicAudio = micStream && micStream.getAudioTracks().length > 0;

      if (hasDisplayAudio && hasMicAudio) {
        audioContext.current = new window.AudioContext();
        const dest = audioContext.current.createMediaStreamDestination();
        
        const displaySource = audioContext.current.createMediaStreamSource(new MediaStream(displayStream.getAudioTracks()));
        const micSource = audioContext.current.createMediaStreamSource(new MediaStream(micStream!.getAudioTracks()));
        
        displaySource.connect(dest);
        micSource.connect(dest);
        
        dest.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      } else if (hasDisplayAudio) {
        displayStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      } else if (hasMicAudio) {
        micStream!.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      }

      streamRef.current = combinedStream;
      chunks.current = [];

      // 4. Setup MediaRecorder
      const options = { mimeType: 'video/webm; codecs=vp8,opus' };
      mediaRecorder.current = new MediaRecorder(combinedStream, options);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      // Handle when user clicks "Stop sharing" on the browser native bar
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorder.current.start(1000); // collect 1s chunks
      setStatus('recording');
      
      // Start timer
      setDuration(0);
      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Failed to start recording', err);
      setError(err.message || 'Failed to start recording');
      setStatus('error');
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      setStatus('paused');
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      setStatus('recording');
      timerInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current) {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        const finalBlob = new Blob(chunks.current, { type: 'video/webm' });
        
        // Cleanup streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContext.current) {
          audioContext.current.close();
        }
        
        if (timerInterval.current) clearInterval(timerInterval.current);
        setStatus('stopped');
        resolve(finalBlob);
      };

      if (mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  return {
    status,
    error,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording
  };
};
