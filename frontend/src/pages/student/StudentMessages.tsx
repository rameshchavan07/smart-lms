import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Loader2, Users, Plus, X, CheckCheck, Paperclip, Smile, FileText, Download, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { Skeleton } from '../../components/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { getMediaUrl, getSocketUrl } from '../../utils/url';
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

const StudentMessages: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null); // can be User or Group
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch contacts and groups
  const { data: contactsData, isLoading: loadingContacts } = useQuery({
    queryKey: ['communications', 'contacts'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.COMMUNICATIONS.CONTACTS);
      return res.data.contacts;
    }
  });

  const allContacts = [...(contactsData?.peers || []), ...(contactsData?.teachers || []), ...(contactsData?.students || [])];
  // Deduplicate contacts
  const uniqueContacts = Array.from(new Map(allContacts.map(c => [c.id, c])).values());

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['communications', 'messages', selectedChat?.id],
    queryFn: async () => {
      if (!selectedChat) return [];
      const res = await api.get(API_ENDPOINTS.COMMUNICATIONS.MESSAGES_BY_ID(selectedChat.id));
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

    const newSocket = io(getSocketUrl(), {
      auth: { token }
    });

    socketRef.current = newSocket;

    newSocket.on('receive_message', (newMessage: ChatMessage) => {
      queryClient.setQueryData(['communications', 'messages', selectedChat?.id], (old: ChatMessage[] | undefined) => {
        if (!old) return [newMessage];
        // Check if message belongs to current chat
        const isForCurrentGroup = selectedChat?.name && newMessage.groupId === selectedChat.id;
        const isForCurrentUser = !selectedChat?.name && (newMessage.senderId === selectedChat?.id || newMessage.receiverId === selectedChat?.id);
        
        if (isForCurrentGroup || isForCurrentUser) {
           // Prevent duplicates
           if (!old.find((m: ChatMessage) => m.id === newMessage.id)) {
             return [...old, newMessage];
           }
        }
        return old;
      });
      // also invalidate to refresh contact list (latest message preview) if needed
    });

    newSocket.on('delete_message', ({ messageId }) => {
      queryClient.setQueryData(['communications', 'messages', selectedChat?.id], (old: ChatMessage[] | undefined) => {
        if (!old) return old;
        return old.filter((m: ChatMessage) => m.id !== messageId);
      });
    });

    newSocket.on('delete_group', ({ groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'contacts'] });
      if (selectedChat?.id === groupId) {
        setSelectedChat(null);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [selectedChat, queryClient]);

  // Join groups on load
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
      
      return api.post(API_ENDPOINTS.COMMUNICATIONS.SEND_MESSAGE, formData, {
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

  const createGroup = useMutation({
    mutationFn: async () => {
      return api.post(API_ENDPOINTS.COMMUNICATIONS.CREATE_GROUP, {
        name: groupName,
        memberIds: selectedGroupMembers
      });
    },
    onSuccess: (res) => {
      toast.success('Group created!');
      setIsCreatingGroup(false);
      setGroupName('');
      setSelectedGroupMembers([]);
      queryClient.invalidateQueries({ queryKey: ['communications', 'contacts'] });
      setSelectedChat(res.data.group);
      if (socketRef.current) socketRef.current.emit('join_group', res.data.group.id);
    },
    onError: () => {
      toast.error('Failed to create group');
    }
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      return api.delete(API_ENDPOINTS.COMMUNICATIONS.MESSAGES_BY_ID(messageId));
    },
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(['communications', 'messages', selectedChat?.id], (old: ChatMessage[] | undefined) => {
        if (!old) return old;
        return old.filter(m => m.id !== messageId);
      });
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    }
  });

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      return api.delete(API_ENDPOINTS.COMMUNICATIONS.GROUP_BY_ID(groupId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'contacts'] });
      setSelectedChat(null);
      toast.success('Group deleted');
    },
    onError: () => {
      toast.error('Failed to delete group');
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Messages</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Communicate with teachers and peers.</p>
        </div>
        <button onClick={() => setIsCreatingGroup(true)} className="btn btn-primary text-[13px] gap-2">
          <Plus size={16} /> New Group Chat
        </button>
      </div>

      <div className="flex-1 card p-0 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        {/* Left Side - Inbox list */}
        <div className="w-full md:w-[280px] lg:w-[320px] border-r flex flex-col flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search contacts & groups..." className="input pl-9 w-full text-[13px] h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex flex-col">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 flex flex-col justify-center">
                      <Skeleton className="h-3 w-32 mb-1.5" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </div>
                ))}
              </div>
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
                    className={`w-full text-left p-4 border-b transition-colors flex gap-3 ${selectedChat?.id === g.id ? 'bg-brand-500/10' : 'hover:bg-black/5 dark:hover:bg-surface/5'}`} style={{ borderColor: 'var(--border)' }}
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
                  <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Direct Messages</div>
                )}
                {uniqueContacts.map((c: ChatUser) => (
                  <button 
                    key={c.id}
                    onClick={() => setSelectedChat(c)}
                    className={`w-full text-left p-4 border-b transition-colors flex gap-3 ${selectedChat?.id === c.id ? 'bg-brand-500/10' : 'hover:bg-black/5 dark:hover:bg-surface/5'}`} style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-[13px] flex-shrink-0 overflow-hidden">
                      {c.profileImage ? <img src={getMediaUrl(c.profileImage)} className="w-full h-full object-cover" /> : c.firstName?.[0] || 'U'}
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
        </div>

        {/* Right Side - Chat area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/[0.02] dark:bg-surface/[0.02]">
          {selectedChat ? (
            <>
              <div className="p-3 border-b bg-bg-subtle flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                {selectedChat.name ? (
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-[13px]">
                    <Users size={18} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-[13px] overflow-hidden">
                    {selectedChat.profileImage ? <img src={getMediaUrl(selectedChat.profileImage)} className="w-full h-full object-cover" /> : selectedChat.firstName?.[0] || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedChat.name ? selectedChat.name : `${selectedChat.firstName} ${selectedChat.lastName}`}
                  </p>
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    {selectedChat.name ? `${selectedChat.members?.length || 0} members` : selectedChat.role === 'TEACHER' ? 'Teacher' : 'Student'}
                  </p>
                </div>
                {selectedChat.name && (user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                  <button 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this group?')) {
                        deleteGroup.mutate(selectedChat.id);
                      }
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Group"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-bg">
                {loadingMessages ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex w-full ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <Skeleton className="h-10 w-48 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="bg-surface-raised px-4 py-2 rounded-lg shadow-sm text-[12.5px] text-gray-600 dark:text-gray-400">
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
                                <img src={getMediaUrl(m.sender.profileImage)} className="w-full h-full object-cover" />
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
                                ? 'bg-brand-500 text-white rounded-br-none' 
                                : 'bg-surface border border-border text-primary rounded-bl-none'
                            }`}>
                              {/* Render files (images, PDFs, documents) */}
                              {m.fileUrl && (
                                <div className="mb-2">
                                  {m.fileType?.startsWith('image/') ? (
                                    <a href={getMediaUrl(m.fileUrl)} target="_blank" rel="noopener noreferrer">
                                      <img src={getMediaUrl(m.fileUrl)} alt={m.fileName} className="max-w-[200px] max-h-[200px] rounded object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                    </a>
                                  ) : (
                                    <div className={`flex items-center gap-3 p-2 rounded ${isSentByMe ? 'bg-black/5 dark:bg-black/20' : 'bg-black/5 dark:bg-surface/5'}`}>
                                      <div className={`w-8 h-8 rounded flex items-center justify-center ${isSentByMe ? 'bg-brand-500/20 text-brand-500 dark:text-white' : 'bg-bg-subtle text-secondary'}`}>
                                        <FileText size={16} />
                                      </div>
                                      <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-[12px] font-medium truncate leading-tight">{m.fileName}</p>
                                        <p className="text-[10px] opacity-70 truncate">{m.fileType || 'Document'}</p>
                                      </div>
                                      <a href={getMediaUrl(m.fileUrl)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-surface/10 transition-colors" download>
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
                                {(isSentByMe || user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
                                  <button 
                                    onClick={() => deleteMessage.mutate(m.id)} 
                                    className={`ml-1 transition-colors ${isSentByMe ? 'text-white/60 hover:text-white' : 'text-red-500/60 hover:text-red-500'}`} 
                                    title="Delete message"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                                {isSentByMe && <CheckCheck size={13} className="text-white/80 ml-0.5" />}
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
                <div className="p-3 bg-bg-subtle border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-10 h-10 rounded bg-brand-500/20 flex items-center justify-center text-brand-500">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{selectedFile.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-surface/10 text-gray-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="p-3 bg-bg-subtle flex items-center gap-4 flex-shrink-0">
                <button className="text-secondary hover:text-gray-700 transition-colors">
                  <Smile size={24} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                <button onClick={() => fileInputRef.current?.click()} className="text-secondary hover:text-gray-700 transition-colors">
                  <Paperclip size={24} />
                </button>
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message" 
                  className="flex-1 h-10 text-[15px] rounded-lg px-4 bg-surface border border-border focus:ring-0 text-primary placeholder-muted"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && messageText.trim()) sendMessage.mutate();
                  }}
                />
                <button 
                  onClick={() => sendMessage.mutate()} 
                  disabled={(!messageText.trim() && !selectedFile) || sendMessage.isPending} 
                  className="text-secondary hover:text-gray-700 transition-colors disabled:opacity-50 ml-1"
                >
                  {sendMessage.isPending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-surface/5 flex items-center justify-center mb-4 text-gray-400">
                <Users size={32} />
              </div>
              <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Your Messages</h3>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Select a conversation from the sidebar or start a new one.</p>
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {isCreatingGroup && (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center p-4">
            <div className="bg-surface dark:bg-[#1a1a1a] rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>New Group Chat</h2>
                <button onClick={() => setIsCreatingGroup(false)} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold mb-1" style={{ color: 'var(--text-muted)' }}>Group Name</label>
                  <input type="text" className="input w-full text-[13px]" placeholder="e.g. Study Group Alpha" value={groupName} onChange={e => setGroupName(e.target.value)} />
                </div>
                
                <div>
                  <label className="block text-[12px] font-bold mb-2" style={{ color: 'var(--text-muted)' }}>Select Members (Peers & Teachers)</label>
                  <div className="max-h-[200px] overflow-y-auto border rounded-xl p-2 space-y-1" style={{ borderColor: 'var(--border)' }}>
                    {uniqueContacts.map(c => (
                      <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-black/5 dark:hover:bg-surface/5 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedGroupMembers.includes(c.id)} 
                          onChange={(e) => {
                            if (e.target.checked) setSelectedGroupMembers(prev => [...prev, c.id]);
                            else setSelectedGroupMembers(prev => prev.filter(id => id !== c.id));
                          }}
                          className="w-4 h-4 rounded text-brand-500"
                        />
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-[11px] overflow-hidden">
                          {c.profileImage ? <img src={getMediaUrl(c.profileImage)} className="w-full h-full object-cover" /> : c.firstName?.[0] || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{c.firstName} {c.lastName}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{c.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => createGroup.mutate()}
                  disabled={!groupName.trim() || selectedGroupMembers.length === 0 || createGroup.isPending}
                  className="btn btn-primary w-full gap-2 mt-4"
                >
                  {createGroup.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMessages;
