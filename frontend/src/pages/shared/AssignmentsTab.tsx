import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState, Button, Card } from '../../components';
import { FileText, Plus, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  _count: { submissions: number };
}

interface AssignmentSubmission {
  id: string;
  studentId: string;
  fileUrl: string;
  marks: number | null;
  feedback: string | null;
  submittedAt: string;
  student: { user: { firstName: string; lastName: string } };
}

export const AssignmentsTab: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  // Removed queryClient

  const [showCreate, setShowCreate] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<string | null>(null);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => api.get(`/assignments/course/${courseId}`).then(res => res.data.assignments as Assignment[]),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading assignments...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Assignments</h2>
        {isTeacher && (
          <Button variant="primary" onClick={() => setShowCreate(true)} className="btn-sm">
            <Plus size={16} className="mr-2" /> Create Assignment
          </Button>
        )}
      </div>

      {showCreate && isTeacher && (
        <CreateAssignmentModal courseId={courseId} onClose={() => setShowCreate(false)} />
      )}

      {viewingAssignment ? (
        <AssignmentSubmissions assignmentId={viewingAssignment} onBack={() => setViewingAssignment(null)} />
      ) : (
        <div className="grid gap-4">
          {assignments?.length === 0 ? (
            <EmptyState 
              icon={<FileText size={32} />}
              title="No Assignments"
              description="No assignments posted yet."
            />
          ) : (
            assignments?.map((assignment) => (
              <Card key={assignment.id} className="p-5 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-[15px]">{assignment.title}</h3>
                  <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-[12px] font-medium text-gray-500">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                      {assignment.totalMarks} Marks
                    </span>
                    {isTeacher && (
                      <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 dark:bg-green-900/30">
                        {assignment._count?.submissions || 0} Submissions
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {isTeacher ? (
                    <Button variant="secondary" onClick={() => setViewingAssignment(assignment.id)} className="btn-sm">
                      View Submissions
                    </Button>
                  ) : (
                    <StudentSubmission assignmentId={assignment.id} />
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const CreateAssignmentModal = ({ courseId, onClose }: { courseId: string, onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);

  const mutation = useMutation({
    mutationFn: () => api.post(`/assignments/course/${courseId}`, { title, description, dueDate: new Date(dueDate).toISOString(), totalMarks: Number(totalMarks) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', courseId] });
      toast.success('Assignment created');
      onClose();
    },
    onError: () => toast.error('Failed to create assignment'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <h3 className="text-lg font-bold mb-4">New Assignment</h3>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold mb-1">Title</label>
            <input required type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-1">Description</label>
            <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1">Due Date</label>
              <input required type="datetime-local" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-1">Total Marks</label>
              <input required type="number" min="1" className="input" value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudentSubmission = ({ assignmentId }: { assignmentId: string }) => {
  const [fileUrl, setFileUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: mySubmissions } = useQuery({
    queryKey: ['my-submissions'],
    queryFn: () => api.get('/assignments/my-submissions').then(r => r.data.submissions as AssignmentSubmission[])
  });

  const submission = mySubmissions?.find(s => s.id === assignmentId || (s as { assignmentId?: string }).assignmentId === assignmentId);

  const mutation = useMutation({
    mutationFn: () => api.post(`/assignments/${assignmentId}/submit`, { fileUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      toast.success('Submitted successfully');
      setFileUrl('');
    }
  });

  if (submission) {
    return (
      <div className="text-right">
        <div className="flex items-center justify-end gap-2 text-green-600 font-semibold text-[13px] mb-1">
          <CheckCircle2 size={16} /> Submitted
        </div>
        {submission.marks !== null ? (
          <div className="text-[14px] font-bold">Grade: {submission.marks}</div>
        ) : (
          <div className="text-[12px] text-gray-500">Pending grade</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input 
        type="text" 
        placeholder="Link to file (Google Drive URL)..." 
        className="input text-[12px] h-8 w-48"
        value={fileUrl}
        onChange={(e) => setFileUrl(e.target.value)}
      />
      <Button 
        variant="primary"
        onClick={() => { if(fileUrl) mutation.mutate(); else toast.error('Please provide a URL'); }} 
        className="btn-sm"
        disabled={mutation.isPending}
      >
        Submit Work
      </Button>
    </div>
  );
};

const AssignmentSubmissions = ({ assignmentId, onBack }: { assignmentId: string, onBack: () => void }) => {
  const queryClient = useQueryClient();
  const [grading, setGrading] = useState<string | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}/submissions`).then(r => r.data.submissions as AssignmentSubmission[])
  });

  const gradeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/assignments/submission/${id}/grade`, { marks: Number(marks), feedback }),
    onSuccess: () => {
      toast.success('Graded successfully');
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
      setGrading(null);
    }
  });

  return (
    <Card className="p-5 border-t-4" style={{ borderColor: 'var(--brand-500)' }}>
      <button onClick={onBack} className="text-[13px] font-semibold text-gray-500 hover:text-gray-900 mb-4">&larr; Back to Assignments</button>
      <h3 className="font-bold mb-4">Student Submissions</h3>
      {isLoading ? <p>Loading...</p> : submissions?.length === 0 ? <p className="text-gray-500">No submissions yet.</p> : (
        <div className="space-y-3">
          {submissions?.map(sub => (
            <div key={sub.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div>
                <p className="font-semibold text-[14px]">{sub.student.user.firstName} {sub.student.user.lastName}</p>
                <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="text-[12px] text-blue-600 flex items-center gap-1 mt-1">
                  <Download size={12} /> View Submission File
                </a>
              </div>
              <div className="text-right">
                {sub.marks !== null ? (
                  <div>
                    <span className="font-bold text-[14px]">Score: {sub.marks}</span>
                    {sub.feedback && <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] truncate">{sub.feedback}</p>}
                  </div>
                ) : (
                  grading === sub.id ? (
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder="Marks" className="input h-8 w-20 text-[12px]" value={marks} onChange={(e) => setMarks(e.target.value)} />
                      <input type="text" placeholder="Feedback (Optional)" className="input h-8 w-32 text-[12px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                      <Button variant="primary" onClick={() => gradeMutation.mutate(sub.id)} className="py-1 px-3 text-[12px]">Save</Button>
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={() => { setGrading(sub.id); setMarks(''); setFeedback(''); }} className="btn-sm">Grade</Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
