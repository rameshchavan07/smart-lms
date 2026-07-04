import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Video, 
  Calendar, 
  Plus, 
  ExternalLink, 
  UploadCloud, 
  Loader2 
} from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { useAuth } from '../../contexts/AuthContext';
import { getDirectDriveUrl } from '../../utils/drive';
import UploadRecordingModal from '../../components/UploadRecordingModal';
import WatchRecordingModal from '../../components/WatchRecordingModal';

interface LectureData {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  thumbnailUrl?: string;
  recordingUrl?: string;
}

interface LecturesTabProps {
  courseId: string;
}

export const LecturesTab: React.FC<LecturesTabProps> = ({ courseId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateLecture, setShowCreateLecture] = useState(false);
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [selectedRecordingLecture, setSelectedRecordingLecture] = useState<{id: string, title: string} | null>(null);
  const [watchingLecture, setWatchingLecture] = useState<{id: string, title: string, recordingUrl: string} | null>(null);

  const { data: lectures = [], isLoading: lecturesLoading } = useQuery({
    queryKey: ['lectures', courseId],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.LECTURES.BY_COURSE(courseId));
      return data.lectures as LectureData[];
    }
  });

  const createLectureMutation = useMutation({
    mutationFn: async (newLecture: typeof lectureForm) => {
      return api.post(API_ENDPOINTS.LECTURES.BY_COURSE(courseId), newLecture);
    },
    onSuccess: () => {
      toast.success('Class scheduled successfully!');
      setShowCreateLecture(false);
      setLectureForm({ title: '', description: '', startTime: '', endTime: '' });
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to schedule class.');
    }
  });

  const uploadThumbnailMutation = useMutation({
    mutationFn: async ({ lectureId, file }: { lectureId: string, file: File }) => {
      const formData = new FormData();
      formData.append('thumbnail', file);
      return api.put(API_ENDPOINTS.LECTURES.THUMBNAIL(lectureId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Lecture thumbnail uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to upload thumbnail.');
    }
  });

  const handleLectureThumbnailUpload = (lectureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadThumbnailMutation.mutate({ lectureId, file });
  };

  const handleCreateLecture = (e: React.FormEvent) => {
    e.preventDefault();
    createLectureMutation.mutate(lectureForm);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Scheduled Classes</h3>
        {user?.role === 'TEACHER' && (
          <button 
            onClick={() => setShowCreateLecture(!showCreateLecture)}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule New
          </button>
        )}
      </div>

      {showCreateLecture && user?.role === 'TEACHER' && (
        <form onSubmit={handleCreateLecture} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 shadow-sm">
          <h4 className="font-semibold text-slate-900 text-sm">Schedule a Live Class</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text" 
                required 
                value={lectureForm.title} 
                onChange={(e) => setLectureForm({...lectureForm, title: e.target.value})} 
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input 
                type="text" 
                value={lectureForm.description} 
                onChange={(e) => setLectureForm({...lectureForm, description: e.target.value})} 
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
              <input 
                type="datetime-local" 
                required 
                value={lectureForm.startTime} 
                onChange={(e) => setLectureForm({...lectureForm, startTime: e.target.value})} 
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
              <input 
                type="datetime-local" 
                required 
                value={lectureForm.endTime} 
                onChange={(e) => setLectureForm({...lectureForm, endTime: e.target.value})} 
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setShowCreateLecture(false)} 
              className="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createLectureMutation.isPending}
              className="px-4 py-2 bg-blue-600 rounded-md text-white text-sm hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {createLectureMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      )}

      {lecturesLoading ? (
        <div className="text-center py-8 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
          <span className="text-xs mt-2 block">Loading lectures...</span>
        </div>
      ) : lectures.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Video className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No lectures scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lectures.map((lecture) => (
            <div key={lecture.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 transition">
              <div className="flex items-start gap-4 mb-4 md:mb-0">
                <div className="relative group h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 overflow-hidden">
                  {lecture.thumbnailUrl ? (
                    <img 
                      src={getDirectDriveUrl(lecture.thumbnailUrl)} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Calendar className="w-6 h-6" />
                  )}
                  
                  {user?.role === 'TEACHER' && (
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity text-[10px] font-bold">
                      Upload
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleLectureThumbnailUpload(lecture.id, e)} 
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{lecture.title}</h4>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{lecture.description}</p>
                  <div className="text-xs font-semibold text-indigo-600 mt-2 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded w-max">
                    {new Date(lecture.startTime).toLocaleString()} - {new Date(lecture.endTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                {!lecture.recordingUrl && (
                  <button 
                    onClick={() => navigate(`/live/${lecture.id}`)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {user?.role === 'TEACHER' ? 'Start Class' : 'Join Class'}
                  </button>
                )}
                {lecture.recordingUrl && (
                  <button
                    onClick={() => setWatchingLecture({ id: lecture.id, title: lecture.title, recordingUrl: lecture.recordingUrl! })}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition font-semibold text-sm shadow-sm"
                  >
                    <Video className="w-4 h-4" />
                    Watch Recording
                  </button>
                )}
                {user?.role === 'TEACHER' && (
                  <button
                    onClick={() => setSelectedRecordingLecture({ id: lecture.id, title: lecture.title })}
                    className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition font-semibold text-sm shadow-sm ${
                      lecture.recordingUrl 
                        ? 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700' 
                        : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    {lecture.recordingUrl ? 'Replace Recording' : 'Upload Recording'}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {selectedRecordingLecture && (
            <UploadRecordingModal
              lectureId={selectedRecordingLecture.id}
              lectureTitle={selectedRecordingLecture.title}
              isOpen={!!selectedRecordingLecture}
              onClose={() => setSelectedRecordingLecture(null)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['lectures', courseId] });
                toast.success('Recording uploaded successfully!');
                setSelectedRecordingLecture(null);
              }}
            />
          )}
          
          {watchingLecture && (
            <WatchRecordingModal
              isOpen={!!watchingLecture}
              onClose={() => setWatchingLecture(null)}
              recordingUrl={watchingLecture.recordingUrl}
              title={watchingLecture.title}
            />
          )}
        </div>
      )}
    </div>
  );
};
