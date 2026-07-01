import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Loader2, CheckCircle2, FileQuestion } from 'lucide-react';
import { Button } from '../../components';
import toast from 'react-hot-toast';

interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuizQuestion {
  id: string;
  text: string;
  marks: number;
  options: QuizOption[];
}

interface QuizData {
  id: string;
  title: string;
  description: string;
  durationMins: number | null;
  totalMarks: number;
  questions: QuizQuestion[];
}

interface Submission {
  id: string;
  totalScore: number;
  submittedAt: string;
  student: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    }
  }
}

const QuizView: React.FC = () => {
  const { quizId } = useParams<{ id: string; quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);

  // Student state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number, totalMarks: number } | null>(null);

  // Teacher state
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const fetchQuizAndData = async () => {
      try {
        const { data } = await api.get(`/quizzes/${quizId}`);
        setQuiz(data.quiz);

        if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
          const subRes = await api.get(`/quizzes/${quizId}/submissions`);
          setSubmissions(subRes.data.submissions);
        }
      } catch (err: unknown) {
        const error = err as { response?: { status?: number, data?: { message?: string } } };
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already submitted')) {
          // If student already submitted, maybe just show that
          toast.error('You have already submitted this quiz.');
        } else {
          toast.error('Failed to load quiz details.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuizAndData();
    }
  }, [quizId, user]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    // Check if all questions are answered
    const unanswered = quiz.questions.filter(q => !selectedAnswers[q.id]);
    if (unanswered.length > 0) {
      if (!window.confirm(`You have ${unanswered.length} unanswered questions. Are you sure you want to submit?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const answersArray = Object.keys(selectedAnswers).map(qId => ({
        questionId: qId,
        selectedOptionId: selectedAnswers[qId]
      }));

      const { data } = await api.post(`/quizzes/${quizId}/submit`, { answers: answersArray });
      toast.success('Quiz submitted successfully!');
      setResult({ score: data.score, totalMarks: data.totalMarks });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!quiz) {
    return <div className="text-center py-20 text-muted">Quiz not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-bg-subtle rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">{quiz.title}</h1>
          <p className="text-sm text-muted">{quiz.description}</p>
        </div>
      </div>

      {user?.role === 'STUDENT' ? (
        result ? (
          <div className="bg-surface rounded-xl shadow-sm border border-border p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-primary">Quiz Completed!</h2>
            <p className="text-muted">Your answers have been recorded.</p>
            <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 py-4">
              {result.score} / {result.totalMarks}
            </div>
            <Button onClick={() => navigate(-1)} variant="secondary">Return to Course</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted">Total Marks</p>
                <p className="font-bold text-lg text-primary">{quiz.totalMarks}</p>
              </div>
              {quiz.durationMins && (
                <div className="text-right">
                  <p className="text-sm text-muted">Duration</p>
                  <p className="font-bold text-lg text-primary">{quiz.durationMins} Mins</p>
                </div>
              )}
            </div>

            {quiz.questions.map((question, index) => (
              <div key={question.id} className="bg-surface rounded-xl shadow-sm border border-border p-6">
                <div className="flex justify-between items-start mb-4 gap-4">
                  <h3 className="font-semibold text-primary text-lg">
                    <span className="text-blue-600 mr-2">{index + 1}.</span> 
                    {question.text}
                  </h3>
                  <span className="bg-bg-subtle dark:bg-slate-700 text-secondary text-xs font-bold px-2 py-1 rounded whitespace-nowrap">
                    {question.marks} Marks
                  </span>
                </div>
                
                <div className="space-y-3">
                  {question.options.map(option => (
                    <label 
                      key={option.id} 
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAnswers[question.id] === option.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-border hover:bg-bg-subtle dark:hover:bg-slate-900/50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={question.id} 
                        value={option.id} 
                        checked={selectedAnswers[question.id] === option.id}
                        onChange={() => handleSelectOption(question.id, option.id)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-border-strong mr-3"
                      />
                      <span className="text-secondary">{option.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] flex justify-end gap-4 z-10 lg:pl-64">
              <Button onClick={handleSubmitQuiz} disabled={submitting} className="min-w-[150px]">
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        )
      ) : (
        // TEACHER VIEW
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm flex flex-col items-center justify-center text-center">
              <FileQuestion className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-sm text-muted">Questions</p>
              <p className="text-2xl font-bold text-primary">{quiz.questions.length}</p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-sm text-muted">Total Marks</p>
              <p className="text-2xl font-bold text-primary">{quiz.totalMarks}</p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-border shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded flex items-center justify-center mb-2 font-bold text-sm">
                #{submissions.length}
              </div>
              <p className="text-sm text-muted">Submissions</p>
              <p className="text-2xl font-bold text-primary">{submissions.length}</p>
            </div>
          </div>

          <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-bold text-primary">Student Submissions</h3>
            </div>
            {submissions.length === 0 ? (
              <div className="p-12 text-center text-muted">
                No submissions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-subtle border-b border-border">
                      <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider">Student Name</th>
                      <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                      <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Score</th>
                      <th className="p-4 text-xs font-semibold text-muted uppercase tracking-wider text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {submissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-bg-subtle dark:hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-primary">
                          {sub.student.user.firstName} {sub.student.user.lastName}
                        </td>
                        <td className="p-4 text-sm text-muted">
                          {sub.student.user.email}
                        </td>
                        <td className="p-4 text-sm font-bold text-emerald-600 text-right">
                          {sub.totalScore} / {quiz.totalMarks}
                        </td>
                        <td className="p-4 text-sm text-muted text-right">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizView;
