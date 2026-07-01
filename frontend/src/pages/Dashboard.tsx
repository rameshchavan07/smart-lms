import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { Button, Card } from '../components';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-bg-subtle dark:bg-[#080d18] p-8">
      <Card className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted mt-1">Welcome back, {user?.firstName}!</p>
          </div>
          <Button 
            variant="ghost"
            onClick={logout}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
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
            <p className="text-lg font-medium text-emerald-600 dark:text-emerald-300 mt-2">Active {user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : 'User'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
