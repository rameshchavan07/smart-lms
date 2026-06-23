import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Video, Calendar, Plus, ExternalLink, ArrowLeft } from 'lucide-react';

interface LectureData {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
}

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lectures, setLectures] = useState<LectureData[]>([]);
  const [loading, setLoading] = useState(true);

  // New Lecture Form State
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  });

  const fetchLectures = async () => {
    try {
      // First try to fetch course info (we don't have a direct GET /courses/:id route yet, so we'll fetch lectures and rely on that)
      const { data } = await api.get(`/lectures/course/${id}`);
      setLectures(data.lectures);
    } catch (error) {
      console.error('Failed to fetch lectures', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLectures();
  }, [id]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/lectures/course/${id}`, formData);
      setShowCreate(false);
      fetchLectures();
    } catch (error) {
      console.error('Failed to create lecture', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Lectures</h1>
          <p className="text-slate-500 mt-1">Manage and join upcoming classes.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Scheduled Classes</h3>
          {user?.role === 'TEACHER' && (
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule New
            </button>
          )}
        </div>

        {showCreate && user?.role === 'TEACHER' && (
          <form onSubmit={handleCreateSubmit} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
            <h4 className="font-medium text-slate-900">Schedule a Live Class</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full border-slate-300 rounded-md border p-2 text-sm focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border-slate-300 rounded-md border p-2 text-sm focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                <input type="datetime-local" required value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} className="w-full border-slate-300 rounded-md border p-2 text-sm focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                <input type="datetime-local" required value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} className="w-full border-slate-300 rounded-md border p-2 text-sm focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white border border-slate-300 rounded text-slate-700 text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white text-sm">Create</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : lectures.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
            <Video className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-slate-500">No lectures scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lectures.map((lecture) => (
              <div key={lecture.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-4 mb-4 md:mb-0">
                  <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{lecture.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{lecture.description}</p>
                    <div className="text-xs font-medium text-indigo-600 mt-2">
                      {new Date(lecture.startTime).toLocaleString()} - {new Date(lecture.endTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/live/${lecture.id}`)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  {user?.role === 'TEACHER' ? 'Start Class' : 'Join Class'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
