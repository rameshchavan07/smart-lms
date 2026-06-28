import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

export const NotificationBell: React.FC = () => {
  const { socket, connected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for new assignments
    socket.on('new_assignment', (data) => {
      setUnreadCount(prev => prev + 1);
      toast.success(`New Assignment posted in Course ${data.courseId}`);
    });

    // Listen for new discussions
    socket.on('new_discussion', (data) => {
      setUnreadCount(prev => prev + 1);
      toast(`New Discussion: ${data.discussion.title}`, { icon: '💬' });
    });

    // Listen for replies
    socket.on('new_reply', (data) => {
      toast(`New reply on a discussion thread!`, { icon: '💬' });
    });

    // Listen for assignment graded
    socket.on('assignment_graded', (data) => {
      setUnreadCount(prev => prev + 1);
      toast.success(`Your assignment "${data.assignmentTitle}" was graded: ${data.marks} marks!`, {
        duration: 6000,
      });
    });

    return () => {
      socket.off('new_assignment');
      socket.off('new_discussion');
      socket.off('new_reply');
      socket.off('assignment_graded');
    };
  }, [socket, connected]);

  return (
    <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition">
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
      )}
    </button>
  );
};
