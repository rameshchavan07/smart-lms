import React, { useState } from 'react';
import { Send, Search, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const StudentMessages: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Reusing admin endpoint or assuming we have a generic messaging endpoint
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['communications', 'messages'],
    queryFn: async () => {
      const res = await api.get('/communications/messages');
      return res.data.messages;
    }
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      return api.post('/communications/messages', { 
        receiverId: selectedUser?.id, 
        content: message 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications', 'messages'] });
      setMessage('');
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* ── Header ── */}
      <div className="flex-shrink-0">
        <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Messages</h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Communicate with teachers and peers.</p>
      </div>

      <div className="flex-1 card p-0 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Side - Inbox list */}
        <div className="w-full md:w-[280px] lg:w-[320px] border-r flex flex-col flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Search messages..." className="input pl-9 w-full text-[13px] h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-500" /></div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-gray-500">No messages found.</div>
            ) : (
              messages.map((m: any) => {
                const isSentByMe = m.senderId === user?.id;
                const otherUser = isSentByMe ? m.receiver : m.sender;
                
                return (
                  <button 
                    key={m.id}
                    onClick={() => setSelectedUser(otherUser)}
                    className="w-full text-left p-4 border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex gap-3" style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-[13px] flex-shrink-0">
                      {otherUser?.firstName?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-[13px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{otherUser?.firstName} {otherUser?.lastName}</p>
                      </div>
                      <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
                        {isSentByMe ? 'You: ' : ''}{m.content}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side - Chat area */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/[0.02] dark:bg-white/[0.02]">
          {selectedUser ? (
            <>
              <div className="p-4 border-b bg-white dark:bg-[#111] flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-[13px]">
                  {selectedUser?.firstName?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{selectedUser.role}</p>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {/* Simulated chat history based on messages filtered by selectedUser */}
                {messages.filter((m: any) => m.senderId === selectedUser.id || m.receiverId === selectedUser.id).map((m: any) => {
                  const isSentByMe = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl ${isSentByMe ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-white dark:bg-white/10 text-gray-800 dark:text-gray-100 rounded-tl-sm shadow-sm'}`}>
                        <p className="text-[13px]">{m.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isSentByMe ? 'text-white/70' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-white dark:bg-[#111] border-t flex items-center gap-2 flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..." 
                  className="input flex-1 h-10 text-[13px] rounded-full px-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && message.trim()) sendMessage.mutate();
                  }}
                />
                <button 
                  onClick={() => sendMessage.mutate()}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-400">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Your Messages</h3>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Select a conversation from the sidebar or start a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentMessages;
