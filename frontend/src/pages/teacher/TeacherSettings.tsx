import React, { useState } from 'react';
import { User, Bell, Shield, Save, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

const TeacherSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  const updateProfile = useMutation({
    mutationFn: async () => {
      return api.put('/users/profile', { firstName, lastName });
    },
    onSuccess: (data) => {
      // Refresh the page or update auth context to reflect new name
      window.location.reload(); // Quickest way to reflect user change globally for now
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div>
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your personal profile and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-black/5 dark:bg-white/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              onClick={() => setActiveTab('profile')}
              style={{ color: activeTab === 'profile' ? 'var(--brand-500)' : 'var(--text-secondary)' }}
            >
              <User size={18} /> Profile
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'bg-black/5 dark:bg-white/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              onClick={() => setActiveTab('notifications')}
              style={{ color: activeTab === 'notifications' ? 'var(--brand-500)' : 'var(--text-secondary)' }}
            >
              <Bell size={18} /> Notifications
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-black/5 dark:bg-white/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
              onClick={() => setActiveTab('security')}
              style={{ color: activeTab === 'security' ? 'var(--brand-500)' : 'var(--text-secondary)' }}
            >
              <Shield size={18} /> Security
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card space-y-6">
              <h2 className="text-[16px] font-bold border-b pb-4" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>Personal Information</h2>
              
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 text-[32px] font-bold">
                  {user?.firstName?.[0] || 'T'}
                </div>
                <div>
                  <button className="btn btn-outline btn-sm gap-2 mb-2">
                    <Upload size={14} /> Upload Avatar
                  </button>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>JPG, GIF or PNG. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>First Name</label>
                  <input type="text" className="input w-full text-[13px]" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Last Name</label>
                  <input type="text" className="input w-full text-[13px]" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                  <input type="email" className="input w-full text-[13px] bg-black/5 dark:bg-white/5 opacity-70" defaultValue={user?.email || ''} disabled />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Bio / Professional Summary</label>
                  <textarea className="input w-full text-[13px] min-h-[100px] p-3 resize-none" placeholder="Tell students a bit about yourself..."></textarea>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="btn btn-primary gap-2">
                  {updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card space-y-6">
              <h2 className="text-[16px] font-bold border-b pb-4" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { title: 'New Student Enrollments', desc: 'Get notified when a new student joins your course.' },
                  { title: 'Assignment Submissions', desc: 'Receive alerts when students submit assignments.' },
                  { title: 'Direct Messages', desc: 'Get an email when a student sends you a direct message.' },
                  { title: 'System Updates', desc: 'Important platform updates and maintenance notices.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={i !== 3} />
                      <div className="w-11 h-6 bg-black/10 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button className="btn btn-primary gap-2">
                  <Save size={16} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card space-y-6">
              <h2 className="text-[16px] font-bold border-b pb-4" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>Security Settings</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Current Password</label>
                  <input type="password" className="input w-full text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>New Password</label>
                  <input type="password" className="input w-full text-[13px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Confirm New Password</label>
                  <input type="password" className="input w-full text-[13px]" />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button className="btn btn-primary gap-2">
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;
