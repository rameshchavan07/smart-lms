import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d18] p-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.firstName}!</p>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400">Your Role</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-2">{user?.role}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
            <h3 className="font-semibold text-indigo-800 dark:text-indigo-400">Email Address</h3>
            <p className="text-lg font-medium text-indigo-600 dark:text-indigo-300 mt-2">{user?.email}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-400">Status</h3>
            <p className="text-lg font-medium text-emerald-600 dark:text-emerald-300 mt-2">Active Student</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
