import React from 'react';
import { X } from 'lucide-react';
import LectureRecordingPlayer from './LectureRecordingPlayer';

interface WatchRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingUrl: string;
  title: string;
}

const WatchRecordingModal: React.FC<WatchRecordingModalProps> = ({ isOpen, onClose, recordingUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-black">
        <div className="px-4 py-3 flex justify-between items-center bg-zinc-900 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">{title} - Recording</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="w-full aspect-video bg-black relative">
          <LectureRecordingPlayer url={recordingUrl} />
        </div>
      </div>
    </div>
  );
};

export default WatchRecordingModal;
