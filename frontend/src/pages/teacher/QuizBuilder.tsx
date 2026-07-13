import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Trash2, Save, ArrowLeft, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { Button, Modal } from '../../components';
import toast from 'react-hot-toast';

interface Option {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  marks: number;
  options: Option[];
}

const QuizBuilder: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMins, setDurationMins] = useState<number | ''>('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', marks: 1, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }
  ]);
  const [saving, setSaving] = useState(false);

  // AI Generator State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiText, setAiText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', marks: 1, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string | number | Option[]) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options.push({ text: '', isCorrect: false });
    setQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].text = value;
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === oIndex
    }));
    setQuestions(updated);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim()) return toast.error('Quiz title is required.');
    
    // Validate
    let totalMarks = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return toast.error(`Question ${i + 1} text is empty.`);
      if (q.options.length < 2) return toast.error(`Question ${i + 1} needs at least 2 options.`);
      
      const hasCorrect = q.options.some(o => o.isCorrect);
      if (!hasCorrect) return toast.error(`Question ${i + 1} must have a correct option selected.`);
      
      const hasEmptyOption = q.options.some(o => !o.text.trim());
      if (hasEmptyOption) return toast.error(`Question ${i + 1} has an empty option.`);

      totalMarks += q.marks;
    }

    setSaving(true);
    try {
      await api.post(API_ENDPOINTS.QUIZZES.BY_COURSE(courseId!), {
        title,
        description,
        durationMins: durationMins || null,
        totalMarks,
        questions
      });
      toast.success('Quiz created successfully!');
      navigate(-1);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic.trim() && !aiText.trim()) {
      return toast.error('Please provide a topic or text material.');
    }
    setIsGenerating(true);
    try {
      const res = await api.post(API_ENDPOINTS.QUIZZES.GENERATE_AI, {
        topic: aiTopic,
        text: aiText,
        numQuestions: 5
      });
      const generatedQuestions = res.data.questions;
      
      // If we only have the default empty question, replace it. Otherwise append.
      if (questions.length === 1 && !questions[0].text.trim()) {
        setQuestions(generatedQuestions);
      } else {
        setQuestions([...questions, ...generatedQuestions]);
      }
      
      toast.success('AI successfully generated questions!');
      setIsAiModalOpen(false);
      setAiTopic('');
      setAiText('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate quiz with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-bg-subtle rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Create New Quiz</h1>
          <p className="text-sm text-muted">Build a multiple-choice assessment for your students.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button 
          onClick={() => setIsAiModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0"
        >
          <Sparkles className="w-4 h-4" />
          Generate with AI
        </Button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Quiz Title</label>
          <input 
            type="text" 
            className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Midterm Exam"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Description (Optional)</label>
          <textarea 
            className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Instructions or topics covered..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="w-1/3">
          <label className="block text-sm font-medium text-secondary mb-1">Duration (Minutes)</label>
          <input 
            type="number" 
            min="1"
            className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Leave empty for no limit"
            value={durationMins}
            onChange={(e) => setDurationMins(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-surface rounded-xl shadow-sm border border-border p-6 relative">
            {questions.length > 1 && (
              <button 
                onClick={() => handleRemoveQuestion(qIndex)}
                className="absolute top-4 right-4 text-muted hover:text-red-500 transition-colors"
                title="Remove question"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex gap-4 mb-4 pr-8">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-secondary mb-1">Question {qIndex + 1}</label>
                <input 
                  type="text" 
                  className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What is the capital of France?"
                  value={q.text}
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-semibold text-secondary mb-1">Marks</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={q.marks}
                  onChange={(e) => handleQuestionChange(qIndex, 'marks', Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-border ml-2">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Options</label>
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <button 
                    onClick={() => handleSetCorrectOption(qIndex, oIndex)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      opt.isCorrect 
                        ? 'border-emerald-500 bg-emerald-500' 
                        : 'border-border-strong hover:border-emerald-400'
                    }`}
                    title="Mark as correct answer"
                  >
                    {opt.isCorrect && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                  <input 
                    type="text" 
                    className={`flex-1 border-border-strong bg-surface text-primary rounded-md border p-1.5 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      opt.isCorrect ? 'ring-1 ring-emerald-500/50 border-emerald-500/50' : ''
                    }`}
                    placeholder={`Option ${oIndex + 1}`}
                    value={opt.text}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                  />
                  {q.options.length > 2 && (
                    <button 
                      onClick={() => handleRemoveOption(qIndex, oIndex)}
                      className="text-muted hover:text-red-500"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <button 
                  onClick={() => handleAddOption(qIndex)}
                  className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button onClick={handleAddQuestion} variant="secondary" className="flex-1 border-dashed border-2 py-4">
          <Plus className="w-5 h-5 mr-2 inline" />
          Add Another Question
        </Button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 shadow-lg flex justify-end gap-4 z-10 lg:pl-64">
        <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        <Button onClick={handleSaveQuiz} disabled={saving} className="min-w-[150px]">
          {saving ? 'Saving...' : (
            <>
              <Save className="w-4 h-4 mr-2 inline" />
              Save Quiz
            </>
          )}
        </Button>
      </div>

      <Modal isOpen={isAiModalOpen} onClose={() => !isGenerating && setIsAiModalOpen(false)} title="✨ Generate Quiz with AI">
        <div className="space-y-4 p-2">
          <p className="text-sm text-muted">
            Provide a topic or paste study materials, and our AI will automatically generate a 5-question multiple choice quiz for you to review.
          </p>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Topic (Optional)</label>
            <input 
              type="text" 
              className="w-full border-border bg-surface text-primary rounded-md border p-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Photosynthesis"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Study Material Text (Optional)</label>
            <textarea 
              className="w-full border-border bg-surface text-primary rounded-md border p-2 focus:ring-purple-500 focus:border-purple-500"
              rows={4}
              placeholder="Paste lecture notes or reading material here..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsAiModalOpen(false)} disabled={isGenerating}>Cancel</Button>
            <Button 
              onClick={handleGenerateAI} 
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : <Sparkles className="w-4 h-4 mr-2 inline" />}
              {isGenerating ? 'Generating...' : 'Generate Questions'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

// Helper component since lucide X conflicts with other imports sometimes or just inline
const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default QuizBuilder;
