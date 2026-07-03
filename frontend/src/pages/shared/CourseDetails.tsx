import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { LecturesTab } from './LecturesTab';
import { MaterialsTab } from './MaterialsTab';
import { StudentsTab } from './StudentsTab';
import { QuizzesTab } from './QuizzesTab';
import { AssignmentsTab } from './AssignmentsTab';
import { DiscussionsTab } from './DiscussionsTab';
import { AnnouncementsTab } from './AnnouncementsTab';
import { AttendanceTab } from './AttendanceTab';

import { 
  Video, 
  ArrowLeft, 
  FileText, 
  Loader2,
  Award,
  Users,
  ClipboardList,
  CheckCircle,
  MessageSquare,
  Megaphone,
  UserCheck
} from 'lucide-react';

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  type TabType = 'lectures' | 'materials' | 'students' | 'assignments' | 'quizzes' | 'discussions' | 'announcements' | 'attendance';
  
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabs: TabType[] = ['lectures', 'materials', 'students', 'assignments', 'quizzes', 'discussions', 'announcements', 'attendance'];
    const tab = params.get('tab') as TabType;
    return tab && tabs.includes(tab) ? tab : 'lectures';
  });

  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);

  // Fetch progress (Students only)
  const { data: progress } = useQuery({
    queryKey: ['courseProgress', id],
    queryFn: async () => {
      const { data } = await api.get(`/progress/course/${id}`);
      return data.progress as number;
    },
    enabled: user?.role === 'STUDENT' && !!id,
  });

  const handleDownloadCertificate = async () => {
    try {
      setIsGeneratingCertificate(true);
      const response = await api.get(`/certificates/generate/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Certificate.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Failed to download certificate', error);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  if (!id) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Course Classroom</h1>
            <p className="text-slate-500 mt-1">Access live lectures and study materials.</p>
          </div>
        </div>

        {user?.role === 'STUDENT' && progress !== undefined && progress !== null && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6 min-w-[300px]">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">Course Progress</span>
                <span className="text-sm font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            
            {progress === 100 && (
              <button 
                onClick={handleDownloadCertificate}
                disabled={isGeneratingCertificate}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-amber-600 hover:to-amber-700 transition font-medium text-sm shadow-md disabled:opacity-50"
              >
                {isGeneratingCertificate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Certificate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 pb-[1px] scrollbar-hide">
        <button
          onClick={() => setActiveTab('lectures')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'lectures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Video className="w-4 h-4" />
          Live Lectures
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'materials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Study Materials
        </button>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Students
          </button>
        )}
        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Quizzes
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'discussions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Discussions
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          Announcements
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Attendance
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'lectures' && <LecturesTab courseId={id} />}
        {activeTab === 'materials' && <MaterialsTab courseId={id} />}
        {activeTab === 'students' && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && <StudentsTab courseId={id} />}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <AssignmentsTab courseId={id} />
          </div>
        )}
        {activeTab === 'quizzes' && <QuizzesTab courseId={id} />}
        {activeTab === 'discussions' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <DiscussionsTab courseId={id} />
          </div>
        )}
        {activeTab === 'announcements' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <AnnouncementsTab courseId={id} />
          </div>
        )}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <AttendanceTab courseId={id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
