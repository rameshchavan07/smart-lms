import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import { useQuery, useMutation } from '@tanstack/react-query';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    durationMins: '30',
    totalMarks: '100'
  });

  const [questions, setQuestions] = useState([
    {
      text: '',
      marks: '10',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]
    }
  ]);

  const { data: courses = [] } = useQuery({
    queryKey: ['my-courses-quiz'],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.COURSES.MY_COURSES}?limit=100`);
      return res.data.enrollments.map((e: any) => e.course);
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        marks: '10',
        options: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: string | boolean) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = { ...updated[qIndex].options[oIndex], [field]: value };
    
    // If setting an option to correct, uncheck others for this question
    if (field === 'isCorrect' && value === true) {
      updated[qIndex].options.forEach((opt, idx) => {
        if (idx !== oIndex) opt.isCorrect = false;
      });
    }
    
    setQuestions(updated);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(API_ENDPOINTS.QUIZZES.BY_COURSE(formData.courseId), {
        title: formData.title,
        description: formData.description,
        durationMins: Number(formData.durationMins),
        totalMarks: Number(formData.totalMarks),
        questions: questions.map(q => ({
          text: q.text,
          marks: Number(q.marks),
          options: q.options
        }))
      });
    },
    onSuccess: () => {
      toast.success('Quiz created successfully');
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create quiz');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId) {
      setError('Please select a course');
      return;
    }

    // Basic validation
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`Question ${i + 1} is missing text`);
        return;
      }
      const hasCorrect = questions[i].options.some(o => o.isCorrect);
      if (!hasCorrect) {
        setError(`Question ${i + 1} must have at least one correct option`);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j].text.trim()) {
          setError(`Option ${j + 1} in Question ${i + 1} is empty`);
          return;
        }
      }
    }

    setError(null);
    mutation.mutate();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg-subtle shrink-0">
          <h2 className="text-lg font-bold text-primary">Create Quiz</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-secondary">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="quiz-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-primary mb-1">Course</label>
                <select 
                  required
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-brand-500 outline-none"
                >
                  <option value="">Select a course...</option>
                  {courses.map((c: { id: string, title: string }) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-primary mb-1">Quiz Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">Time Limit (mins)</label>
                  <input 
                    type="number" 
                    required min="1"
                    value={formData.durationMins}
                    onChange={(e) => setFormData({ ...formData, durationMins: e.target.value })}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-brand-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1">Total Marks</label>
                  <input 
                    type="number" 
                    required min="1"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Questions Builder */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-primary">Questions</h3>
                <button 
                  type="button" 
                  onClick={handleAddQuestion}
                  className="text-xs font-semibold bg-brand-500/10 text-brand-600 px-3 py-1.5 rounded-lg hover:bg-brand-500/20 flex items-center gap-1 transition"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>

              <div className="space-y-6">
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border border-border rounded-xl bg-bg/50">
                    <div className="flex justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <input 
                          type="text" 
                          required
                          placeholder={`Question ${qIndex + 1}`}
                          value={q.text}
                          onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-primary outline-none"
                        />
                      </div>
                      <div className="w-20">
                        <input 
                          type="number" 
                          required min="1" placeholder="Marks"
                          value={q.marks}
                          onChange={(e) => updateQuestion(qIndex, 'marks', e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-primary outline-none"
                        />
                      </div>
                      {questions.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-rose-500 hover:text-rose-600 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2 pl-4 border-l-2 border-brand-200">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name={`q-${qIndex}-correct`}
                            checked={opt.isCorrect}
                            onChange={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                            className="w-4 h-4 text-brand-600 cursor-pointer"
                          />
                          <input 
                            type="text" 
                            required
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt.text}
                            onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                            className={`flex-1 bg-surface border rounded-lg px-3 py-1.5 text-sm outline-none ${opt.isCorrect ? 'border-brand-500 bg-brand-50/10' : 'border-border'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-bg-subtle flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="quiz-form"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizModal;
