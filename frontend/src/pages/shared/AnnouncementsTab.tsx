import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Megaphone, Loader2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  courseId: string | null;
  createdAt: string;
}

export const AnnouncementsTab: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['communications', 'announcements'],
    queryFn: async () => {
      const res = await api.get('/communications/announcements');
      return res.data.announcements as Announcement[];
    }
  });

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Filter announcements for this specific course or global announcements (courseId === null)
  const courseAnnouncements = announcements.filter(
    (a) => a.courseId === courseId || a.courseId === null
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Class Announcements</h2>
      </div>

      <div className="space-y-4">
        {courseAnnouncements.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed rounded-xl border-gray-300">
            <Megaphone size={32} className="mx-auto mb-3 opacity-50" />
            <p>No announcements for this class yet.</p>
          </div>
        ) : (
          courseAnnouncements.map((announcement) => (
            <div key={announcement.id} className="card p-6 border border-border rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-primary">{announcement.title}</h3>
                  <p className="text-xs text-secondary">{new Date(announcement.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-secondary whitespace-pre-wrap">{announcement.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
