import React, { useState } from 'react';
import { Megaphone, MessageSquare, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const AdminCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements'>('announcements');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['communications', 'announcements'],
    queryFn: async () => {
      const res = await api.get('/communications/announcements');
      return res.data.announcements;
    }
  });

  const postAnnouncement = useMutation({
    mutationFn: async () => {
      return api.post('/communications/announcements', { 
        title: announcementTitle, 
        content: announcementContent, 
        courseId: 'All Courses' // Admin announcements are system-wide
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'announcements'] });
      setAnnouncementTitle('');
      setAnnouncementContent('');
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>System Communication</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Broadcast announcements to all users across the platform.</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden flex-col md:flex-row">
        {/* Left Side - History */}
        <div className="w-full md:w-[320px] lg:w-[380px] card p-0 flex flex-col flex-shrink-0">
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <button className="flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-colors bg-brand-500/10 text-brand-500">
              Announcements
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col">
              {loadingAnnouncements ? (
                <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-[12px] text-gray-500">No announcements posted.</div>
              ) : announcements.map((a: any) => (
                <div key={a.id} className="p-4 border-b text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[13px] font-bold truncate pr-2" style={{ color: 'var(--text-primary)' }}>{a.title}</span>
                    <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[12px] line-clamp-2" style={{ color: 'var(--text-muted)' }}>{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Composer */}
        <div className="flex-1 card flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-[14px] font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Megaphone size={16} className="text-brand-500" /> New Broadcast Announcement
            </h3>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>This announcement will be visible to everyone on the platform.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="space-y-4 flex-1 flex flex-col">
              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Title</label>
                <input type="text" placeholder="Announcement Title" className="input w-full text-[13px] h-10" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Message</label>
                <textarea placeholder="Write your announcement here..." className="input w-full text-[13px] flex-1 min-h-[200px] resize-none p-3" value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)}></textarea>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => postAnnouncement.mutate()} disabled={!announcementTitle || postAnnouncement.isPending} className="btn btn-primary px-6 gap-2">
                <Megaphone size={16} /> Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunication;
