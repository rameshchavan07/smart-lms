import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
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
  UserCheck,
  Trophy,
  Sparkles
} from 'lucide-react';

type TabType = 'lectures' | 'materials' | 'students' | 'assignments' | 'quizzes' | 'discussions' | 'announcements' | 'attendance';

const TABS: { id: TabType; label: string; icon: React.ElementType; restrict?: string[] }[] = [
  { id: 'lectures', label: 'Live Lectures', icon: Video },
  { id: 'materials', label: 'Study Materials', icon: FileText },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'quizzes', label: 'Quizzes', icon: CheckCircle },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'attendance', label: 'Attendance', icon: UserCheck },
  { id: 'students', label: 'Students', icon: Users, restrict: ['TEACHER', 'ADMIN'] },
];

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
      const { data } = await api.get(API_ENDPOINTS.PROGRESS.BY_COURSE(id as string));
      return data.progress as number;
    },
    enabled: user?.role === 'STUDENT' && !!id,
  });

  const handleDownloadCertificate = async () => {
    try {
      setIsGeneratingCertificate(true);
      const response = await api.get(API_ENDPOINTS.CERTIFICATES.GENERATE(id as string), {
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

  const visibleTabs = TABS.filter(tab => !tab.restrict || tab.restrict.includes(user?.role || ''));

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* ── Immersive Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-10 shadow-2xl border border-white/10"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            <button 
              onClick={() => navigate(-1)} 
              className="mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Course Classroom
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                Learning Portal
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-lg">
                Access live lectures, study materials, assignments, and track your progress all in one place.
              </p>
            </div>
          </div>

          {/* Progress Widget (Students Only) */}
          {user?.role === 'STUDENT' && progress !== undefined && progress !== null && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-xl border border-white/10 p-5 rounded-2xl w-full lg:w-80 shadow-xl relative overflow-hidden"
            >
              {progress === 100 && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 animate-pulse pointer-events-none" />
              )}
              
              <div className="relative z-10">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Progress</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-black text-white leading-none">{progress}%</span>
                      {progress === 100 && <Trophy className="w-5 h-5 text-amber-400" />}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-800/50 rounded-full h-3 mb-4 overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full relative ${progress === 100 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-brand-400 to-indigo-500'}`}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
                
                {/* Certificate Button */}
                {progress === 100 && (
                  <button 
                    onClick={handleDownloadCertificate}
                    disabled={isGeneratingCertificate}
                    className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all font-bold text-sm shadow-[0_4px_14px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isGeneratingCertificate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Award className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    )}
                    {isGeneratingCertificate ? 'Generating...' : 'Download Certificate'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Modern Pill Tabs ── */}
      <div className="relative flex overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 w-max">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2.5 whitespace-nowrap z-10 ${
                  isActive ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-slate-900 rounded-xl shadow-md -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Animated Content Area ── */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {activeTab === 'lectures' && <LecturesTab courseId={id} />}
            {activeTab === 'materials' && <MaterialsTab courseId={id} />}
            {activeTab === 'students' && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && <StudentsTab courseId={id} />}
            {activeTab === 'assignments' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <AssignmentsTab courseId={id} />
              </div>
            )}
            {activeTab === 'quizzes' && <QuizzesTab courseId={id} />}
            {activeTab === 'discussions' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <DiscussionsTab courseId={id} />
              </div>
            )}
            {activeTab === 'announcements' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <AnnouncementsTab courseId={id} />
              </div>
            )}
            {activeTab === 'attendance' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <AttendanceTab courseId={id} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
    </div>
  );
};

export default CourseDetails;
