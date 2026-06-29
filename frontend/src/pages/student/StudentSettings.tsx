import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Save, User, Shield, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

const StudentSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  // Removed queryClient

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profileImage || null);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await api.put('/users/profile', { firstName, lastName, bio });
      return res.data;
    },
    onSuccess: () => {
      refreshUser();
      alert('Profile updated successfully!');
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

  const handleSave = () => {
    updateProfile.mutate();
    if (avatarFile) {
      updateAvatar.mutate(avatarFile);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Student Settings</h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your personal profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col - Navigation */}
        <div className="flex flex-col gap-2">
          <button className="flex items-center gap-3 p-3 rounded-xl text-left bg-black/5 dark:bg-white/5 font-bold" style={{ color: 'var(--text-primary)' }}>
            <User size={18} className="text-brand-500" />
            Profile Info
          </button>
          <button className="flex items-center gap-3 p-3 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/5 font-semibold transition-colors" style={{ color: 'var(--text-muted)' }}>
            <Shield size={18} />
            Security
          </button>
        </div>

        {/* Right Col - Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-[20px] overflow-hidden shrink-0 relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                {avatarPreview ? (
                  <img src={avatarPreview.startsWith('http') || avatarPreview.startsWith('blob:') ? avatarPreview : `http://localhost:5000${avatarPreview}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.firstName?.[0] || 'U'
                )}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-[10px]">Edit</div>
              </div>
              <input 
                id="avatar-upload" 
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
              <div>
                <h3 className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>Profile Picture</h3>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>JPG, PNG or WebP, max 5MB.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>First Name</label>
                  <input type="text" className="input w-full text-[13px]" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Last Name</label>
                  <input type="text" className="input w-full text-[13px]" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                <input type="email" className="input w-full text-[13px] bg-black/5 dark:bg-white/5 cursor-not-allowed" value={user?.email || ''} disabled />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Contact support to change your email address.</p>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Bio (Optional)</label>
                <textarea className="input w-full text-[13px] min-h-[100px] resize-none" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your teachers and peers a bit about yourself..." />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={handleSave}
                disabled={updateProfile.isPending || updateAvatar.isPending}
                className="btn btn-primary gap-2"
              >
                {(updateProfile.isPending || updateAvatar.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;
