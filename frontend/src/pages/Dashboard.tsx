import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {user?.firstName}!</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-semibold text-blue-800">Your Role</h3>
            <p className="text-2xl font-bold text-blue-600 mt-2">{user?.role}</p>
          </div>
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="font-semibold text-indigo-800">Email Address</h3>
            <p className="text-lg font-medium text-indigo-600 mt-2">{user?.email}</p>
          </div>
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
            <h3 className="font-semibold text-emerald-800">Status</h3>
            <p className="text-lg font-medium text-emerald-600 mt-2">Active Student</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
