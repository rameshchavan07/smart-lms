import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitute } from '../../contexts/InstituteContext';
import { Save, User, Shield, Loader2, Building, Palette, Mail, Upload } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';

const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const { refreshInstitute } = useInstitute();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'institute'>('profile');

  // Profile State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio] = useState(user?.profile?.bio || '');

  // Institute State
  const [instituteData, setInstituteData] = useState({
    themeColor: '',
    description: '',
    coverImageUrl: '',
    allowedEmailDomain: '',
    isPrivate: false,
    supportEmail: '',
    supportPhone: '',
    facebookUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    themeConfig: {
      primaryColor: '',
      secondaryColor: '',
      fontFamily: '',
    },
    terminologyMap: {
      Teacher: 'Teacher',
      Student: 'Student',
      Course: 'Course',
    },
    legalPages: {
      termsOfService: '',
      privacyPolicy: '',
    },
  });

  const { data: institute } = useQuery({
    queryKey: ['myInstituteSettings'],
    queryFn: async () => {
      const { data } = await api.get('/institutes/settings');
      return data.institute;
    },
    enabled: activeTab === 'institute',
  });

  // Sync fetched institute data to state
  const [prevInstitute, setPrevInstitute] = useState<Record<string, unknown> | null>(null);
  if (institute && institute !== prevInstitute) {
    setPrevInstitute(institute);
    setInstituteData({
      themeColor: institute.themeColor || '',
      description: institute.description || '',
      coverImageUrl: institute.coverImageUrl || '',
      allowedEmailDomain: institute.allowedEmailDomain || '',
      isPrivate: institute.isPrivate || false,
      supportEmail: institute.supportEmail || '',
      supportPhone: institute.supportPhone || '',
      facebookUrl: institute.facebookUrl || '',
      twitterUrl: institute.twitterUrl || '',
      linkedinUrl: institute.linkedinUrl || '',
      themeConfig: institute.themeConfig || { primaryColor: '', secondaryColor: '', fontFamily: '' },
      terminologyMap: institute.terminologyMap || { Teacher: 'Teacher', Student: 'Student', Course: 'Course' },
      legalPages: institute.legalPages || { termsOfService: '', privacyPolicy: '' },
    });
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      const res = await api.put(API_ENDPOINTS.USERS.PROFILE, { firstName, lastName, bio });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile updated successfully!');
    },
    onError: () => toast.error('Failed to update profile.'),
  });

  const updateInstituteSettings = useMutation({
    mutationFn: async () => {
      const res = await api.put('/institutes/settings', instituteData);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myInstituteSettings'] });
      await refreshInstitute();
      toast.success('Institute settings updated successfully!');
    },
    onError: () => toast.error('Failed to update institute settings.'),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post('/institutes/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['myInstituteSettings'] });
      await refreshInstitute();
      toast.success('Logo updated successfully!');
    },
    onError: () => toast.error('Failed to update logo.'),
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  const handleInstChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setInstituteData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setInstituteData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNestedChange = (
    category: 'themeConfig' | 'terminologyMap' | 'legalPages',
    field: string,
    value: string
  ) => {
    setInstituteData((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] as Record<string, string>),
        [field]: value,
      },
    }));
  };

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <div>
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Admin Settings</h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage your personal profile and institute preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors font-bold ${activeTab === 'profile' ? 'bg-black/5 dark:bg-surface/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-surface/5 text-muted'}`}
          >
            <User size={18} />
            Profile Info
          </button>
          <button 
            onClick={() => setActiveTab('institute')}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors font-bold ${activeTab === 'institute' ? 'bg-black/5 dark:bg-surface/5 text-brand-500' : 'hover:bg-black/5 dark:hover:bg-surface/5 text-muted'}`}
          >
            <Building size={18} />
            Institute Branding
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h2>
              
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
                  <input type="email" className="input w-full text-[13px] bg-black/5 dark:bg-surface/5 cursor-not-allowed" value={user?.email || ''} disabled />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending} className="btn btn-primary gap-2">
                  {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />} Save Changes
                </button>
              </div>
            </div>
          )}

          {/* INSTITUTE TAB */}
          {activeTab === 'institute' && (
            <div className="space-y-6">
              {/* Branding Section */}
              <div className="card">
                <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-primary"><Palette size={18} /> Branding & UI</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Institute Logo</label>
                    <div className="flex items-center gap-4">
                      <label className="btn btn-secondary gap-2 cursor-pointer relative overflow-hidden">
                        {uploadLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={16} />}
                        {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadLogoMutation.isPending} />
                      </label>
                      <span className="text-[12px] text-muted">Updates logo instantly</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Primary Theme Color (Hex code)</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={instituteData.themeConfig.primaryColor || instituteData.themeColor || '#6366f1'} onChange={(e) => handleNestedChange('themeConfig', 'primaryColor', e.target.value)} className="w-10 h-10 rounded border-0 bg-transparent p-0 cursor-pointer" />
                      <input type="text" placeholder="#6366f1" value={instituteData.themeConfig.primaryColor} onChange={(e) => handleNestedChange('themeConfig', 'primaryColor', e.target.value)} className="input w-full text-[13px]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Secondary Theme Color (Hex code)</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={instituteData.themeConfig.secondaryColor || '#10b981'} onChange={(e) => handleNestedChange('themeConfig', 'secondaryColor', e.target.value)} className="w-10 h-10 rounded border-0 bg-transparent p-0 cursor-pointer" />
                      <input type="text" placeholder="#10b981" value={instituteData.themeConfig.secondaryColor} onChange={(e) => handleNestedChange('themeConfig', 'secondaryColor', e.target.value)} className="input w-full text-[13px]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Font Family</label>
                    <input type="text" placeholder="e.g. Inter, sans-serif" value={instituteData.themeConfig.fontFamily || ''} onChange={(e) => handleNestedChange('themeConfig', 'fontFamily', e.target.value)} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Cover Image URL</label>
                    <input type="url" name="coverImageUrl" placeholder="https://..." value={instituteData.coverImageUrl} onChange={handleInstChange} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Institute Description (Shows on public pages)</label>
                    <textarea name="description" rows={3} value={instituteData.description} onChange={handleInstChange} className="input w-full text-[13px]" />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="card">
                <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-primary"><Shield size={18} /> Security & Access</h2>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-surface/5 transition-colors">
                    <input type="checkbox" name="isPrivate" checked={instituteData.isPrivate} onChange={handleInstChange} className="mt-1" />
                    <div>
                      <p className="font-bold text-[14px] text-primary">Private Registration Mode</p>
                      <p className="text-[12px] text-muted">If enabled, students cannot self-register directly. Their accounts will be marked as "Pending Approval" until you approve them.</p>
                    </div>
                  </label>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Allowed Email Domain (Optional)</label>
                    <input type="text" name="allowedEmailDomain" placeholder="e.g. harvard.edu" value={instituteData.allowedEmailDomain} onChange={handleInstChange} className="input w-full text-[13px]" />
                    <p className="text-[11px] text-muted mt-1">If provided, only users with this email domain can register.</p>
                  </div>
                </div>
              </div>

              {/* Terminology Section */}
              <div className="card">
                <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-primary">Terminology Mapping</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Teacher</label>
                    <input type="text" placeholder="e.g. Instructor" value={instituteData.terminologyMap?.Teacher || ''} onChange={(e) => handleNestedChange('terminologyMap', 'Teacher', e.target.value)} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Student</label>
                    <input type="text" placeholder="e.g. Learner" value={instituteData.terminologyMap?.Student || ''} onChange={(e) => handleNestedChange('terminologyMap', 'Student', e.target.value)} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Course</label>
                    <input type="text" placeholder="e.g. Program" value={instituteData.terminologyMap?.Course || ''} onChange={(e) => handleNestedChange('terminologyMap', 'Course', e.target.value)} className="input w-full text-[13px]" />
                  </div>
                </div>
              </div>

              {/* Legal & Compliance Section */}
              <div className="card">
                <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-primary">Legal & Compliance</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Terms of Service</label>
                    <textarea rows={4} placeholder="Paste your Terms of Service here..." value={instituteData.legalPages?.termsOfService || ''} onChange={(e) => handleNestedChange('legalPages', 'termsOfService', e.target.value)} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Privacy Policy</label>
                    <textarea rows={4} placeholder="Paste your Privacy Policy here..." value={instituteData.legalPages?.privacyPolicy || ''} onChange={(e) => handleNestedChange('legalPages', 'privacyPolicy', e.target.value)} className="input w-full text-[13px]" />
                  </div>
                </div>
              </div>

              {/* Communications Section */}
              <div className="card">
                <h2 className="text-[16px] font-bold mb-4 flex items-center gap-2 text-primary"><Mail size={18} /> Contact & Social</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Support Email</label>
                    <input type="email" name="supportEmail" value={instituteData.supportEmail} onChange={handleInstChange} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Support Phone</label>
                    <input type="text" name="supportPhone" value={instituteData.supportPhone} onChange={handleInstChange} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Facebook URL</label>
                    <input type="url" name="facebookUrl" value={instituteData.facebookUrl} onChange={handleInstChange} className="input w-full text-[13px]" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1 text-muted">Twitter URL</label>
                    <input type="url" name="twitterUrl" value={instituteData.twitterUrl} onChange={handleInstChange} className="input w-full text-[13px]" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 pb-8">
                <button onClick={() => updateInstituteSettings.mutate()} disabled={updateInstituteSettings.isPending} className="btn btn-primary gap-2">
                  {updateInstituteSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />} Save Institute Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
