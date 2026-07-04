import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { useAuth } from '../../contexts/AuthContext';
import { MessageCircle, Pin, Send, Plus, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Discussion {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; role: string };
  _count: { replies: number };
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; role: string };
}

export const DiscussionsTab: React.FC<{ courseId: string }> = ({ courseId }) => {
  // Removed user
  // Removed queryClient
  const [showCreate, setShowCreate] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);

  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['discussions', courseId],
    queryFn: () => api.get(API_ENDPOINTS.DISCUSSIONS.BY_COURSE(courseId!)).then(res => res.data.discussions as Discussion[])
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading discussions...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Q&A Discussions</h2>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary btn-sm gap-2">
          {showCreate ? 'Cancel' : <><Plus size={16} /> New Topic</>}
        </button>
      </div>

      {showCreate && (
        <CreateDiscussion courseId={courseId} onCreated={() => setShowCreate(false)} />
      )}

      {activeThread ? (
        <DiscussionThread threadId={activeThread} onBack={() => setActiveThread(null)} />
      ) : (
        <div className="space-y-4">
          {discussions?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed rounded-xl border-gray-300">
              <MessageCircle size={32} className="mx-auto mb-3 opacity-50" />
              <p>No discussion topics yet. Start one!</p>
            </div>
          ) : (
            discussions?.map((disc) => (
              <div 
                key={disc.id} 
                onClick={() => setActiveThread(disc.id)}
                className={`card p-4 cursor-pointer hover:border-gray-400 transition-all ${disc.isPinned ? 'border-l-4 border-l-[#f59e0b]' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {disc.isPinned && <Pin size={14} color="#f59e0b" fill="#f59e0b" />}
                      <h3 className="font-semibold text-[15px]">{disc.title}</h3>
                    </div>
                    <p className="text-[13px] text-gray-500 line-clamp-1">{disc.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-[11px] font-medium text-gray-400">
                      <span className="flex items-center gap-1"><User size={12}/> {disc.user.firstName} {disc.user.lastName}</span>
                      <span>•</span>
                      <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-brand-500">{disc._count.replies} Replies</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const CreateDiscussion = ({ courseId, onCreated }: { courseId: string, onCreated: () => void }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const createThread = useMutation({
    mutationFn: () => api.post(API_ENDPOINTS.DISCUSSIONS.BY_COURSE(courseId!), { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions', courseId] });
      toast.success('Discussion posted');
      onCreated();
    },
    onError: () => toast.error('Failed to post discussion')
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); createThread.mutate(); }} className="card p-5 space-y-4 border-2 border-brand-500">
      <div>
        <input required type="text" placeholder="Discussion Title..." className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <textarea required placeholder="What's on your mind?..." className="input min-h-[100px]" value={content} onChange={(e) => setContent(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={createThread.isPending}>Post Discussion</button>
      </div>
    </form>
  );
};

const DiscussionThread = ({ threadId, onBack }: { threadId: string, onBack: () => void }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['discussionThread', threadId],
    queryFn: () => api.get(API_ENDPOINTS.DISCUSSIONS.BY_ID(threadId)).then(r => r.data.discussion as Discussion & { replies: Reply[] }),
    enabled: !!threadId
  });

  const replyMutation = useMutation({
    mutationFn: () => api.post(API_ENDPOINTS.DISCUSSIONS.REPLY(threadId), { content: replyContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussionThread', threadId] });
      setReplyContent('');
    }
  });

  const pinMutation = useMutation({
    mutationFn: () => api.put(API_ENDPOINTS.DISCUSSIONS.PIN(threadId), { isPinned: !data?.isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussionThread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      toast.success('Pin status updated');
    }
  });

  if (isLoading || !data) return <p>Loading thread...</p>;

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 mb-2">&larr; Back to all discussions</button>
      
      {/* Original Post */}
      <div className="card p-5 border-l-4" style={{ borderColor: 'var(--brand-500)' }}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-[18px]">{data.title}</h3>
          {isTeacher && (
            <button onClick={() => pinMutation.mutate()} className={`btn btn-sm ${data.isPinned ? 'btn-primary' : 'btn-secondary'} gap-1`}>
              <Pin size={14} /> {data.isPinned ? 'Unpin' : 'Pin'}
            </button>
          )}
        </div>
        <p className="text-[14px] whitespace-pre-wrap text-gray-700 dark:text-gray-300">{data.content}</p>
        <div className="mt-4 flex items-center gap-2 text-[12px] text-gray-500">
          <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold">
            {data.user.firstName[0]}
          </div>
          <span className="font-semibold">{data.user.firstName} {data.user.lastName}</span>
          {data.user.role === 'TEACHER' && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">Instructor</span>}
          <span>•</span>
          <span>{new Date(data.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {/* Replies */}
      <div className="ml-8 space-y-3">
        {data.replies.map(reply => (
          <div key={reply.id} className="card p-4">
            <p className="text-[14px] whitespace-pre-wrap text-gray-700 dark:text-gray-300">{reply.content}</p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold">
                {reply.user.firstName[0]}
              </div>
              <span className="font-semibold">{reply.user.firstName} {reply.user.lastName}</span>
              {reply.user.role === 'TEACHER' && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[10px]">Instructor</span>}
              <span>•</span>
              <span>{new Date(reply.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Box */}
      <div className="ml-8 mt-4 flex gap-2">
        <textarea 
          placeholder="Write a reply..." 
          className="input min-h-[40px] py-2 flex-1"
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); replyMutation.mutate(); } }}
        />
        <button onClick={() => replyMutation.mutate()} disabled={!replyContent.trim() || replyMutation.isPending} className="btn btn-primary px-4">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
