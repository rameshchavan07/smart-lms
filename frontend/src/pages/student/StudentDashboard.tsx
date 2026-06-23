import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

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

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ready to learn, {user?.firstName}?</h1>
        <p className="text-slate-500 mt-1">Check your progress and upcoming assignments.</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Enrollments</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalEnrollments || 0}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-4">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Assignments Due</p>
            <h3 className="text-2xl font-bold text-slate-900">0</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Jump Back In</h3>
        <p className="text-slate-500 mb-4">You have {metrics?.totalEnrollments} courses waiting for you.</p>
        <Link to="/student/courses" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
          Go to My Courses
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
