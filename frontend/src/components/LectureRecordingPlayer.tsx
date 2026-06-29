import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings
} from 'lucide-react';

interface Chapter {
  time: number;   // seconds
  label: string;
}

interface LectureRecordingPlayerProps {
  url: string;
  chapters?: Chapter[];
}

const formatTime = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const LectureRecordingPlayer: React.FC<LectureRecordingPlayerProps> = ({ url, chapters = [] }) => {
  const isGoogleDrive = url.includes('drive.google.com');
  const embedUrl = isGoogleDrive ? url.replace('/view', '/preview') : url;

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [played, setPlayed] = useState(0);       // 0–1
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [hoveredChapter, setHoveredChapter] = useState<Chapter | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (playing) {
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => {
    return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current); };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && wrapperRef.current) {
      wrapperRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => setSeeking(true);
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  };

  const skip = (seconds: number) => {
    const current = (playerRef.current?.getCurrentTime() ?? 0);
    playerRef.current?.seekTo(Math.max(0, Math.min(duration, current + seconds)));
  };

  const currentChapter = chapters.findLast(c => c.time <= played * duration);

  if (isGoogleDrive) {
    return (
      <div className="relative pt-[56.25%] bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10">
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Lecture Recording"
        />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10 group"
      onMouseMove={showControlsTemporarily}
      onClick={() => setPlaying(p => !p)}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* React Player */}
      <div className="pt-[56.25%] relative">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(() => { const AnyPlayer = ReactPlayer as any; return (
          <AnyPlayer
            ref={playerRef}
            url={url}
            playing={playing}
            muted={muted}
            volume={volume}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            onProgress={(state: { played: number }) => { if (!seeking) setPlayed(state.played); }}
            onDuration={setDuration}
            onBuffer={() => setBuffering(true)}
            onBufferEnd={() => setBuffering(false)}
            onEnded={() => setPlaying(false)}
          />
          ); })()}
        </div>
      </div>

      {/* Buffering Spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Big play/pause button */}
      {!playing && !buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          >
            <Play className="w-9 h-9 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Chapter label */}
      {currentChapter && (
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          📖 {currentChapter.label}
        </div>
      )}

      {/* Controls overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-300"
        style={{
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          padding: '24px 16px 16px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Chapter markers on seek bar */}
        <div className="relative mb-1">
          {chapters.map((c, i) => (
            <div
              key={i}
              className="absolute top-0 w-1 h-3 rounded-full bg-amber-400/80 -translate-x-0.5 cursor-pointer"
              style={{ left: `${(c.time / Math.max(duration, 1)) * 100}%` }}
              onMouseEnter={() => setHoveredChapter(c)}
              onMouseLeave={() => setHoveredChapter(null)}
            />
          ))}
          {hoveredChapter && (
            <div
              className="absolute bottom-5 px-2 py-1 rounded-lg text-xs text-white pointer-events-none"
              style={{
                left: `${(hoveredChapter.time / Math.max(duration, 1)) * 100}%`,
                background: 'rgba(0,0,0,0.8)',
                transform: 'translateX(-50%)',
              }}
            >
              {hoveredChapter.label}
            </div>
          )}
        </div>

        {/* Seek bar */}
        <input
          type="range"
          min={0} max={1} step={0.001}
          value={played}
          onChange={handleSeekChange}
          onMouseDown={handleSeekMouseDown}
          onMouseUp={handleSeekMouseUp}
          className="w-full h-1 mb-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #4361f0 ${played * 100}%, rgba(255,255,255,0.2) ${played * 100}%)`,
          }}
        />

        {/* Bottom row */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={() => setPlaying(p => !p)}
            className="text-white hover:text-white/80 transition"
          >
            {playing ? <Pause className="w-5 h-5" fill="white" /> : <Play className="w-5 h-5" fill="white" />}
          </button>

          {/* Skip buttons */}
          <button onClick={() => skip(-10)} className="text-white/70 hover:text-white transition">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={() => skip(10)} className="text-white/70 hover:text-white transition">
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Volume */}
          <button
            onClick={() => setMuted(m => !m)}
            className="text-white/70 hover:text-white transition"
          >
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
            className="w-16 h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, white ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%)`,
            }}
          />

          {/* Time */}
          <span className="text-white/70 text-xs font-mono ml-1 tabular-nums">
            {formatTime(played * duration)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(s => !s)}
              className="flex items-center gap-1 text-white/70 hover:text-white text-xs font-medium transition"
            >
              <Settings className="w-3.5 h-3.5" />
              {playbackRate}×
            </button>
            {showSpeedMenu && (
              <div
                className="absolute bottom-7 right-0 rounded-xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setPlaybackRate(s); setShowSpeedMenu(false); }}
                    className="block w-full px-4 py-1.5 text-xs text-left transition"
                    style={{
                      color: playbackRate === s ? '#93affd' : 'rgba(255,255,255,0.7)',
                      background: playbackRate === s ? 'rgba(67,97,240,0.2)' : 'transparent',
                    }}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white/70 hover:text-white transition"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LectureRecordingPlayer;
