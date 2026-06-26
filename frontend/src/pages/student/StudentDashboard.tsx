import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Award, Flame, Tv, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, Badge } from '../../components';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<{totalEnrollments: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics/student');
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Failed to fetch student analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-14 w-80 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-xl" />
          ))}
        </div>
        <div className="h-60 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gamified Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-950/20 dark:to-red-950/20 p-6 rounded-2xl border border-orange-500/10 transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">You're on a 5-day learning streak this week. Keep going!</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-500 text-white font-extrabold px-4 py-2 rounded-2xl shadow-sm animate-pulse-slow">
          <Flame className="w-5 h-5 fill-current" />
          <span>5 DAY STREAK 🔥</span>
        </div>
      </div>

      {/* Progress Section */}
      <Card gradient className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Overall Term Progress</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500">Average syllabus completion rate across enrollments</p>
          </div>
          <span className="text-lg font-black text-primary-500">68% Completed</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-750 h-3.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-indigo-650 h-full rounded-full transition-all duration-500" style={{ width: '68%' }} />
        </div>
      </Card>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4 shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Active Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalEnrollments || 0}</h3>
          </div>
        </Card>
        
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-primary-500 dark:text-primary-400 mr-4 shadow-xs">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Assignments Due</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">2</h3>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-4 shadow-xs">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Lectures Attended</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">14</h3>
          </div>
        </Card>

        <Card hover className="flex items-center bg-red-500/5 dark:bg-red-950/5 border-red-200/50 dark:border-red-950/30">
          <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-650 dark:text-red-405 mr-4 relative">
            <Tv className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-550 rounded-full border-2 border-white dark:border-slate-800 animate-ping" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-655 dark:text-red-405 uppercase tracking-wider">Live Classes</p>
            <h3 className="text-sm font-extrabold text-red-655 dark:text-red-405 mt-1">1 Class Live Now</h3>
          </div>
        </Card>
      </div>

      {/* Dynamic Action Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Live Broadcast Card */}
        <Card className="flex flex-col justify-between border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/5 to-transparent">
          <div className="space-y-2">
            <Badge variant="live">LIVE CLASSROOM BROADCAST</Badge>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">CS 302: React Basics & State Hooks</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Lecturer: Dr. Sharma • Join to access shared whiteboards and live webcam workspace feed.</p>
          </div>
          <div className="pt-6">
            <Link 
              to="/student/courses" 
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Join Live Broadcast
            </Link>
          </div>
        </Card>

        {/* Courses Jumpin */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Jump Back In</h3>
            <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed">You are currently enrolled in {metrics?.totalEnrollments || 0} active course modules.</p>
          </div>
          <div className="pt-6">
            <Link 
              to="/student/courses" 
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-sm"
            >
              Go to My Courses
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
