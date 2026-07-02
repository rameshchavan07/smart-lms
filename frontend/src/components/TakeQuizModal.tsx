import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import api from '../services/api';

interface TakeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
  onSuccess: () => void;
}

const TakeQuizModal: React.FC<TakeQuizModalProps> = ({ isOpen, onClose, quizId, quizTitle, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  interface QuizOption { id: string; text: string; }
  interface QuizQuestion { id: string; text: string; options: QuizOption[]; marks?: number; }
  interface QuizData { id: string; title: string; description: string; questions: QuizQuestion[]; }
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Map of questionId -> selectedOptionId
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{score: number, totalMarks: number} | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/quizzes/${quizId}`);
        setQuizData(res.data.quiz);
      } catch (err: unknown) {
        const errorResponse = err as { response?: { data?: { message?: string } } };
        setError(errorResponse.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && quizId) {
      fetchQuiz();
    }
  }, [isOpen, quizId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (!quizData) return;
    
    const formattedAnswers = Object.keys(answers).map(qId => ({
      questionId: qId,
      selectedOptionId: answers[qId]
    }));

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/quizzes/${quizId}/submit`, { answers: formattedAnswers });
      setResult({ score: res.data.score, totalMarks: res.data.totalMarks });
      onSuccess();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg-subtle shrink-0">
          <h2 className="text-lg font-bold text-primary">{quizTitle}</h2>
          {!result && (
            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-secondary">
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          ) : result ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-primary mb-2">Quiz Completed!</h3>
              <p className="text-secondary text-lg mb-8">
                You scored <strong className="text-primary">{result.score}</strong> out of <strong className="text-primary">{result.totalMarks}</strong>
              </p>
              <button 
                onClick={onClose}
                className="bg-brand-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-600 transition"
              >
                Close & Return
              </button>
            </div>
          ) : quizData ? (
            <div>
              <div className="flex justify-between text-sm text-secondary mb-6 font-medium">
                <span>Question {currentQuestionIndex + 1} of {quizData.questions?.length}</span>
                <span>{Object.keys(answers).length} Answered</span>
              </div>
              
              {quizData.questions && quizData.questions[currentQuestionIndex] && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-primary mb-6">
                    {quizData.questions[currentQuestionIndex].text}
                  </h3>
                  <div className="space-y-3">
                    {quizData.questions[currentQuestionIndex].options?.map((option: { id: string; text: string }) => {
                      const isSelected = answers[quizData.questions[currentQuestionIndex].id] === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(quizData.questions[currentQuestionIndex].id, option.id)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            isSelected 
                              ? 'border-brand-500 bg-brand-500/5' 
                              : 'border-border hover:border-brand-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-brand-500' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                          </div>
                          <span className={isSelected ? 'text-brand-600 font-medium' : 'text-primary'}>
                            {option.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-border">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-primary disabled:opacity-30 transition font-medium"
                >
                  <ChevronLeft size={20} /> Previous
                </button>
                
                {currentQuestionIndex < quizData.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-black/5 dark:bg-white/5 text-primary rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition font-semibold"
                  >
                    Next <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(answers).length < quizData.questions.length}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition font-bold disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TakeQuizModal;
