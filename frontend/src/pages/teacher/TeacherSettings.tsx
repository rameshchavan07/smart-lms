import React, { useState } from 'react';
import { User, Bell, Shield, Save, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const TeacherSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profileImage || null);
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async () => {
      return api.put('/users/profile', { firstName, lastName });
    },
    onSuccess: () => {
      refreshUser();
      alert('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const updateAvatar = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/users/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      refreshUser();
    }
  });

  const handleSaveProfile = () => {
    updateProfile.mutate();
    if (avatarFile) {
      updateAvatar.mutate(avatarFile);
    }
  };

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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'bg-black/5 dark:bg-surface/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-surface/5'}`}
              onClick={() => setActiveTab('profile')}
              style={{ color: activeTab === 'profile' ? 'var(--brand-500)' : 'var(--text-secondary)' }}
            >
              <User size={18} /> Profile
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'bg-black/5 dark:bg-surface/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-surface/5'}`}
              onClick={() => setActiveTab('notifications')}
              style={{ color: activeTab === 'notifications' ? 'var(--brand-500)' : 'var(--text-secondary)' }}
            >
              <Bell size={18} /> Notifications
            </button>
            <button 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-black/5 dark:bg-surface/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-surface/5'}`}
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
                <div className="w-24 h-24 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 text-[32px] font-bold overflow-hidden shrink-0 relative group cursor-pointer" onClick={() => document.getElementById('teacher-avatar')?.click()}>
                  {avatarPreview ? (
                    <img src={avatarPreview.startsWith('http') || avatarPreview.startsWith('blob:') ? avatarPreview : `http://localhost:5000${avatarPreview}`} className="w-full h-full object-cover" />
                  ) : (
                    user?.firstName?.[0] || 'T'
                  )}
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-[12px]">Edit</div>
                </div>
                <div>
                  <input 
                    id="teacher-avatar" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAvatarFile(e.target.files[0]);
                        setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }} 
                  />
                  <button onClick={() => document.getElementById('teacher-avatar')?.click()} className="btn btn-outline btn-sm gap-2 mb-2">
                    <Upload size={14} /> Upload Avatar
                  </button>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>JPG, GIF or PNG. Max size 5MB.</p>
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
                  <input type="email" className="input w-full text-[13px] bg-black/5 dark:bg-surface/5 opacity-70" defaultValue={user?.email || ''} disabled />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Bio / Professional Summary</label>
                  <textarea className="input w-full text-[13px] min-h-[100px] p-3 resize-none" placeholder="Tell students a bit about yourself..."></textarea>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={handleSaveProfile} disabled={updateProfile.isPending || updateAvatar.isPending} className="btn btn-primary gap-2">
                  {(updateProfile.isPending || updateAvatar.isPending) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
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
                      <div className="w-11 h-6 bg-black/10 dark:bg-surface/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
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
