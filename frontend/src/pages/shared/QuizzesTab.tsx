import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import TakeQuizModal from '../../components/TakeQuizModal';

interface QuizzesTabProps {
  courseId: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  totalMarks: number;
  durationMins?: number;
}

export const QuizzesTab: React.FC<QuizzesTabProps> = ({ courseId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/course/${courseId}`);
      return data.quizzes as Quiz[];
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Quizzes</h3>
      </div>
      
      {quizzesLoading ? (
        <div className="text-center py-8 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <CheckCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No quizzes available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 transition">
              <div>
                <h4 className="font-bold text-slate-900 text-base">{quiz.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{quiz.description}</p>
                <div className="flex gap-2 mt-2">
                  <div className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded w-max">
                    {quiz.totalMarks} Marks
                  </div>
                  {quiz.durationMins && (
                    <div className="text-xs font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded w-max">
                      {quiz.durationMins} Mins
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex gap-2">
                {user?.role === 'TEACHER' ? (
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
                    View Results
                  </button>
                ) : (
                  <button 
                    onClick={() => setTakingQuiz(quiz)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Attempt Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {takingQuiz && (
        <TakeQuizModal
          isOpen={!!takingQuiz}
          onClose={() => setTakingQuiz(null)}
          quizId={takingQuiz.id}
          quizTitle={takingQuiz.title}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['quizzes', courseId] });
            setTakingQuiz(null);
          }}
        />
      )}
    </div>
  );
};
