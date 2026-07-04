import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import Button from './Button';

interface UploadRecordingModalProps {
  lectureId: string;
  lectureTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadRecordingModal: React.FC<UploadRecordingModalProps> = ({ 
  lectureId, 
  lectureTitle,
  isOpen, 
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('recording', selectedFile);

    try {
      await api.put(API_ENDPOINTS.LECTURES.RECORDING(lectureId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 5 min timeout for large video files
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } }, message?: string };
      const msg = errorResponse?.response?.data?.message || errorResponse.message || 'Failed to upload recording';
      setError(msg);
      console.error('Upload recording error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg)] w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>Upload Recording</h2>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{lectureTitle}</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Select Video File</label>
            <div className="flex items-center justify-center w-full">
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 transition ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">MP4, WEBM (Max 2GB)</p>
                </div>
                <input 
                  type="file" 
                  accept="video/mp4,video/webm,video/*"
                  required 
                  disabled={uploading}
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} 
                  className="hidden" 
                />
              </label>
            </div>
            {selectedFile && (
              <p className="text-xs text-indigo-600 mt-2 font-semibold">
                Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="ghost"
              type="button" 
              onClick={onClose} 
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              type="submit" 
              loading={uploading}
              disabled={!selectedFile || uploading}
            >
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadRecordingModal;
