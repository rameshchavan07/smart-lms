import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Megaphone, Users, Search, Loader2, CheckCheck, Paperclip, Smile, FileText, X, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface ChatUser {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role?: string;
  members?: unknown[];
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  createdAt: string;
  sender?: ChatUser;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

interface ChatAnnouncement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  course?: { title: string };
}

const TeacherCommunication: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'messages' | 'announcements'>('messages');
  
  // Messaging state
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Announcement state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementCourse, setAnnouncementCourse] = useState('All Courses');

  // --- Announcements Data ---
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
        courseId: announcementCourse === 'All Courses' ? undefined : announcementCourse 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'announcements'] });
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementCourse('All Courses');
      setActiveTab('announcements');
      toast.success('Announcement posted');
    }
  });

  // --- Messaging Data ---
  const { data: contactsData, isLoading: loadingContacts } = useQuery({
    queryKey: ['communications', 'contacts'],
    queryFn: async () => {
      const res = await api.get('/communications/contacts');
      return res.data.contacts;
    }
  });

  const allContacts = [...(contactsData?.peers || []), ...(contactsData?.teachers || []), ...(contactsData?.students || [])];
  const uniqueContacts = Array.from(new Map(allContacts.map(c => [c.id, c])).values());

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['communications', 'messages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat) return [];
      const res = await api.get(`/communications/messages/${selectedChat.id}`);
      return res.data.messages;
    },
    enabled: !!selectedChat
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });

    socketRef.current = newSocket;

    newSocket.on('receive_message', (newMessage: ChatMessage) => {
      queryClient.setQueryData(['communications', 'messages', selectedChat?.id], (old: ChatMessage[] | undefined) => {
        if (!old) return [newMessage];
        const isForCurrentGroup = selectedChat?.name && newMessage.groupId === selectedChat.id;
        const isForCurrentUser = !selectedChat?.name && (newMessage.senderId === selectedChat?.id || newMessage.receiverId === selectedChat?.id);
        
        if (isForCurrentGroup || isForCurrentUser) {
           if (!old.find((m: ChatMessage) => m.id === newMessage.id)) {
             return [...old, newMessage];
           }
        }
        return old;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedChat, queryClient]);

  useEffect(() => {
    if (socketRef.current && contactsData?.groups) {
      contactsData.groups.forEach((g: ChatUser) => {
        socketRef.current?.emit('join_group', g.id);
      });
    }
  }, [contactsData]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedChat) throw new Error('No chat selected');
      
      const formData = new FormData();
      formData.append('content', messageText);
      if (selectedChat.name) {
        formData.append('groupId', selectedChat.id);
      } else {
        formData.append('receiverId', selectedChat.id);
      }
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      return api.post('/communications/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (res) => {
      setMessageText('');
      setSelectedFile(null);
      // Optimistic update for sender
      if (res.data?.data) {
        const newMessage = res.data.data;
        queryClient.setQueryData(['communications', 'messages', selectedChat?.id], (old: ChatMessage[] | undefined) => {
          if (!old) return [newMessage];
          if (!old.find(m => m.id === newMessage.id)) {
            return [...old, newMessage];
          }
          return old;
        });
      }
    },
    onError: () => {
      toast.error('Failed to send message');
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
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder={`Search ${activeTab}...`} className="input pl-9 py-2 text-[13px] h-9 w-full" />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'messages' ? (
              <div className="flex flex-col">
                {loadingContacts ? (
                  <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></div>
                ) : (
                  <>
                    {/* Groups */}
                    {contactsData?.groups?.length > 0 && (
                      <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Group Chats</div>
                    )}
                    {contactsData?.groups?.map((g: ChatUser) => (
                      <button 
                        key={g.id}
                        onClick={() => setSelectedChat(g)}
                        className={`w-full text-left p-4 border-b transition-colors flex gap-3 ${selectedChat?.id === g.id ? 'bg-brand-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0">
                          <Users size={18} />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{g.members?.length} members</p>
                        </div>
                      </button>
                    ))}

                    {/* Direct Messages */}
                    {uniqueContacts.length > 0 && (
                      <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Students & Teachers</div>
                    )}
                    {uniqueContacts.map((c: ChatUser) => (
                      <button 
                        key={c.id}
                        onClick={() => setSelectedChat(c)}
                        className={`w-full text-left p-4 border-b transition-colors flex gap-3 ${selectedChat?.id === c.id ? 'bg-brand-500/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-[13px] flex-shrink-0 overflow-hidden">
                          {c.profileImage ? <img src={c.profileImage.startsWith('http') ? c.profileImage : `http://localhost:5000${c.profileImage}`} className="w-full h-full object-cover" /> : c.firstName?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{c.firstName} {c.lastName}</p>
                          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{c.role}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                {loadingAnnouncements ? (
                  <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></div>
                ) : announcements.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-gray-500">No announcements posted.</div>
                ) : announcements.map((a: ChatAnnouncement) => (
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
            selectedChat ? (
              <>
                <div className="p-3 border-b bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                  {selectedChat.name ? (
                    <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-[13px]">
                      <Users size={18} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-[13px] overflow-hidden">
                      {selectedChat.profileImage ? <img src={selectedChat.profileImage.startsWith('http') ? selectedChat.profileImage : `http://localhost:5000${selectedChat.profileImage}`} className="w-full h-full object-cover" /> : selectedChat.firstName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedChat.name ? selectedChat.name : `${selectedChat.firstName} ${selectedChat.lastName}`}
                    </p>
                    <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                      {selectedChat.name ? `${selectedChat.members?.length || 0} members` : selectedChat.role === 'TEACHER' ? 'Teacher' : 'Student'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2] dark:bg-[#0b141a]">
                  {loadingMessages ? (
                     <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#00a884]" /></div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="bg-[#ffeecd] dark:bg-[#182229] px-4 py-2 rounded-lg shadow-sm text-[12.5px] text-gray-600 dark:text-gray-400">
                        Messages are end-to-end encrypted. No one outside of this chat, not even SmartLMS, can read them.
                      </div>
                    </div>
                  ) : (
                    messages.map((m: ChatMessage) => {
                      const isSentByMe = !!user?.id && (m.senderId === user.id || m.sender?.id === user.id);
                      return (
                        <div key={m.id} className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'} mb-2`}>
                          <div className={`flex items-end gap-2 max-w-[75%] ${isSentByMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar for received messages OR for any group chat message if requested */}
                            {(!isSentByMe || selectedChat.name) && (
                              <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden shadow-sm">
                                {m.sender?.profileImage ? (
                                  <img src={m.sender.profileImage.startsWith('http') ? m.sender.profileImage : `http://localhost:5000${m.sender.profileImage}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-brand-500/10 text-brand-500 text-[12px] font-bold">
                                    {m.sender?.firstName?.[0] || 'U'}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}>
                              {/* Sender Name: Show above received messages OR for everyone in group chats */}
                              {(!isSentByMe || selectedChat.name) && m.sender && (
                                <span className="text-[11px] font-semibold mb-1 px-1 text-gray-500 dark:text-gray-400">
                                  {m.sender.firstName} {m.sender.lastName}
                                </span>
                              )}
                              
                              <div className={`p-2.5 px-4 rounded-2xl shadow-sm relative ${
                                isSentByMe 
                                  ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-br-none' 
                                  : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-bl-none'
                              }`}>
                                {/* Render files (images, PDFs, documents) */}
                                {m.fileUrl && (
                                  <div className="mb-2">
                                    {m.fileType?.startsWith('image/') ? (
                                      <a href={`http://localhost:5000${m.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                        <img src={`http://localhost:5000${m.fileUrl}`} alt={m.fileName} className="max-w-[200px] max-h-[200px] rounded object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                      </a>
                                    ) : (
                                      <div className={`flex items-center gap-3 p-2 rounded ${isSentByMe ? 'bg-black/5 dark:bg-black/20' : 'bg-black/5 dark:bg-white/5'}`}>
                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${isSentByMe ? 'bg-[#005c4b]/20 text-[#005c4b] dark:text-white' : 'bg-[#202c33]/10 text-gray-600 dark:text-gray-300'}`}>
                                          <FileText size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-2">
                                          <p className="text-[12px] font-medium truncate leading-tight">{m.fileName}</p>
                                          <p className="text-[10px] opacity-70 truncate">{m.fileType || 'Document'}</p>
                                        </div>
                                        <a href={`http://localhost:5000${m.fileUrl}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" download>
                                          <Download size={16} />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <p className="text-[14px] leading-relaxed break-words pb-1">{m.content}</p>
                                
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                    {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                  {isSentByMe && <CheckCheck size={13} className="text-[#53bdeb]" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {selectedFile && (
                  <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                    <div className="w-10 h-10 rounded bg-[#d9fdd3] dark:bg-[#005c4b] flex items-center justify-center text-[#111b21] dark:text-[#e9edef]">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-4 flex-shrink-0">
                  <button className="text-[#54656f] dark:text-[#aebac1] hover:text-gray-700 transition-colors">
                    <Smile size={24} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                  <button onClick={() => fileInputRef.current?.click()} className="text-[#54656f] dark:text-[#aebac1] hover:text-gray-700 transition-colors">
                    <Paperclip size={24} />
                  </button>
                  <input 
                    type="text" 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message" 
                    className="flex-1 h-10 text-[15px] rounded-lg px-4 bg-white dark:bg-[#2a3942] border-none focus:ring-0 text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && messageText.trim()) sendMessage.mutate();
                    }}
                  />
                  <button 
                    onClick={() => sendMessage.mutate()} 
                    disabled={(!messageText.trim() && !selectedFile) || sendMessage.isPending} 
                    className="text-[#54656f] dark:text-[#aebac1] hover:text-gray-700 transition-colors disabled:opacity-50 ml-1"
                  >
                    {sendMessage.isPending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-400">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Your Messages</h3>
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Select a conversation from the left to start messaging.</p>
              </div>
            )
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
                  {postAnnouncement.isPending ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                  Post Announcement
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
