import React from 'react';
import { MessageSquare, Loader2, Pin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface DiscussionData {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  course: { title: string };
  user: { firstName: string; lastName: string; role: string };
  _count: { replies: number };
}

const StudentCommunity: React.FC = () => {
  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['myDiscussions'],
    queryFn: async () => {
      const res = await api.get('/discussions/my-discussions');
      return res.data.discussions;
    }
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Community</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Engage in discussions across your enrolled courses.</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" /></div>
        ) : discussions.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-gray-500">No active discussions in your courses.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {discussions.map((d: DiscussionData) => (
              <div key={d.id} className="p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 font-bold text-[14px]">
                  {d.user?.firstName?.[0] || 'U'}{d.user?.lastName?.[0] || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-bold truncate flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      {d.isPinned && <Pin size={12} className="text-emerald-500" fill="currentColor" />}
                      {d.title}
                    </h3>
                    <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[12px] line-clamp-2 mt-1" style={{ color: 'var(--text-secondary)' }}>{d.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                      {d.course?.title}
                    </span>
                    <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <MessageSquare size={12} /> {d._count?.replies || 0} Replies
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCommunity;
