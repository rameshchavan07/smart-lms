import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Flame, Star, Award } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { ErrorState, EmptyState } from '../../components';

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  xp: number;
  streak: number;
  avatar: string | null;
}

const Leaderboard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-leaderboard'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ANALYTICS.LEADERBOARD);
      return res.data.leaderboard as LeaderboardEntry[];
    },
  });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center border-2 border-yellow-400 shadow-sm"><Trophy className="w-4 h-4" /></div>;
      case 2:
        return <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center border-2 border-slate-300 shadow-sm"><Medal className="w-4 h-4" /></div>;
      case 3:
        return <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border-2 border-orange-300 shadow-sm"><Medal className="w-4 h-4" /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold">{rank}</div>;
    }
  };

  if (isError) {
    return <ErrorState message="Could not load leaderboard." onRetry={refetch} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2 py-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <Award className="w-16 h-16 mx-auto text-yellow-300 mb-2 drop-shadow-md" />
        <h1 className="text-3xl font-black tracking-tight drop-shadow">Hall of Fame</h1>
        <p className="text-indigo-100 font-medium opacity-90 max-w-lg mx-auto relative z-10">
          Compete with your peers, complete assignments, and earn XP to climb to the top!
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative z-10">
        {isLoading ? (
          <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : !data || data.length === 0 ? (
          <EmptyState title="No Leaders Yet" description="Complete quizzes and assignments to be the first!" icon={<Star />} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.map((entry) => (
              <li key={entry.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center gap-4">
                <div className="flex-shrink-0 w-12 flex justify-center">
                  {getRankBadge(entry.rank)}
                </div>
                <div className="flex-shrink-0">
                  {entry.avatar ? (
                    <img src={entry.avatar} alt={entry.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shadow-sm">
                      {entry.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">{entry.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      <Star className="w-3 h-3 fill-amber-500" /> {entry.xp} XP
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      <Flame className="w-3 h-3 fill-orange-500 text-orange-500" /> {entry.streak} Day Streak
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
