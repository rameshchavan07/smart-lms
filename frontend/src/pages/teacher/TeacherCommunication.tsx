import React, { useState } from 'react';
import { Send, MessageSquare, Megaphone, Users, Search, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const TeacherCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>('messages');
  const [messageText, setMessageText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementCourse, setAnnouncementCourse] = useState('All Courses');
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['communications', 'messages'],
    queryFn: async () => {
      const res = await api.get('/communications/messages');
      return res.data.messages;
    }
  });

  const { data: announcements = [], isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['communications', 'announcements'],
    queryFn: async () => {
      const res = await api.get('/communications/announcements');
      return res.data.announcements;
    }
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      // Stub receiver id for now, in a real app this would be selected
      const mockReceiverId = messages.length > 0 ? messages[0].senderId : 'placeholder'; 
      return api.post('/communications/messages', { receiverId: mockReceiverId, content: messageText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'messages'] });
      setMessageText('');
    }
  });

  const postAnnouncement = useMutation({
    mutationFn: async () => {
      return api.post('/communications/announcements', { 
        title: announcementTitle, 
        content: announcementContent, 
        courseId: announcementCourse 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'announcements'] });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementCourse('All Courses');
      setActiveTab('announcements');
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Communication</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Message students and post class announcements.</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Sidebar / List */}
        <div className="card flex flex-col h-full overflow-hidden p-0 border" style={{ borderColor: 'var(--border)' }}>
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            <button 
              className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'messages' ? 'text-brand-500 border-b-2 border-brand-500 bg-brand-500/5' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('messages')}
            >
              <MessageSquare size={16} /> Messages
            </button>
            <button 
              className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'announcements' ? 'text-brand-500 border-b-2 border-brand-500 bg-brand-500/5' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('announcements')}
            >
              <Megaphone size={16} /> Announcements
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder={`Search ${activeTab}...`} className="input pl-9 py-2 text-[13px] h-9 w-full" />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'messages' ? (
              <div className="flex flex-col">
                {loadingMessages ? (
                  <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-gray-500">No messages found.</div>
                ) : messages.map((m: any) => (
                  <button key={m.id} className={`p-4 border-b text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${!m.isRead ? 'bg-brand-500/5' : ''}`} style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-[10px] font-bold uppercase">
                          {m.sender?.firstName?.[0] || 'U'}
                        </div>
                        <span className={`text-[13px] ${!m.isRead ? 'font-bold' : 'font-semibold'}`} style={{ color: 'var(--text-primary)' }}>{m.sender?.firstName} {m.sender?.lastName}</span>
                      </div>
                      <span className="text-[11px]" style={{ color: !m.isRead ? 'var(--brand-500)' : 'var(--text-muted)' }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[12px] truncate pl-8" style={{ color: !m.isRead ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.content}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {loadingAnnouncements ? (
                  <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></div>
                ) : announcements.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-gray-500">No announcements posted.</div>
                ) : announcements.map((a: any) => (
                  <button key={a.id} className="p-4 border-b text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-[13px] font-bold truncate pr-2" style={{ color: 'var(--text-primary)' }}>{a.title}</span>
                      <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 mb-2">
                      <Users size={12} style={{ color: 'var(--brand-500)' }} />
                      <span className="text-[11px] font-medium" style={{ color: 'var(--brand-500)' }}>{a.course?.title || 'All Courses'}</span>
                    </div>
                    <p className="text-[12px] line-clamp-2" style={{ color: 'var(--text-muted)' }}>{a.content}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Area (Composer / Detail view) */}
        <div className="lg:col-span-2 card flex flex-col h-full border p-0" style={{ borderColor: 'var(--border)' }}>
          {activeTab === 'messages' ? (
            <>
              {/* Message Header */}
              <div className="p-4 border-b flex items-center gap-3 bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">A</div>
                <div>
                  <h3 className="text-[15px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Alex Johnson</h3>
                  <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Student • Physics 101</p>
                </div>
              </div>
              
              {/* Chat Thread Placeholder */}
              <div className="flex-1 p-4 overflow-y-auto bg-[url('/noise.png')] opacity-90 space-y-4">
                <div className="flex justify-start">
                  <div className="max-w-[70%] p-3 rounded-2xl rounded-tl-sm bg-black/5 dark:bg-white/10 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                    Select a conversation from the left to start messaging.
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="input flex-1 py-2 text-[13px]" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button onClick={() => sendMessage.mutate()} disabled={!messageText || sendMessage.isPending} className="p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-50">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 flex flex-col h-full">
              <h2 className="text-[18px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>New Announcement</h2>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Target Audience</label>
                  <select className="input w-full text-[13px] h-10" value={announcementCourse} onChange={(e) => setAnnouncementCourse(e.target.value)}>
                    <option value="All Courses">All Courses</option>
                  </select>
                </div>
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
                  <Megaphone size={16} /> Post Announcement
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherCommunication;
