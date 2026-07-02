import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import EnrollStudentModal from '../../components/EnrollStudentModal';
import { EmptyState, Button } from '../../components';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';
import { getDirectDriveUrl } from '../../utils/drive';
import AttendanceReportModal from '../../components/AttendanceReportModal';
import UploadRecordingModal from '../../components/UploadRecordingModal';
import { AssignmentsTab } from './AssignmentsTab';
import { DiscussionsTab } from './DiscussionsTab';
import toast from 'react-hot-toast';
import { 
  Video, 
  Calendar, 
  Plus, 
  ExternalLink, 
  ArrowLeft, 
  FileText, 
  Download, 
  Trash2, 
  FolderOpen, 
  UploadCloud, 
  Loader2,
  Users,
  UserMinus,
  CheckSquare,
  FileText as FileTextIcon,
  MessageCircle
} from 'lucide-react';

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  durationMins: number | null;
  totalMarks: number;
  _count: {
    questions: number;
    submissions: number;
  };
}

interface LectureData {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
  thumbnailUrl?: string;
  recordingUrl?: string;
}

interface MaterialData {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  uploadedAt: string;
}

interface StudentEnrollmentData {
  studentId: string;
  student: {
    id: string;
    enrollmentNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  enrolledAt: string;
}

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  const isValidTab = (tab: string | null): tab is 'lectures' | 'materials' | 'students' | 'quizzes' | 'assignments' | 'discussions' => {
    return ['lectures', 'materials', 'students', 'quizzes', 'assignments', 'discussions'].includes(tab || '');
  };
  
  const [activeTab, setActiveTab] = useState<'lectures' | 'materials' | 'students' | 'quizzes' | 'assignments' | 'discussions'>(
    isValidTab(tabParam) ? tabParam : 'lectures'
  );
  
  // React Query Data Fetching
  const { data: lectures = [], isLoading: lecturesLoading } = useQuery({
    queryKey: ['course', id, 'lectures'],
    queryFn: async () => {
      const { data } = await api.get(`/lectures/course/${id}`);
      return data.lectures as LectureData[];
    },
    enabled: !!id,
  });

  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['course', id, 'materials'],
    queryFn: async () => {
      const { data } = await api.get(`/study-materials/course/${id}`);
      return data.materials as MaterialData[];
    },
    enabled: !!id,
  });

  const { data: enrolledStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['course', id, 'students'],
    queryFn: async () => {
      const { data } = await api.get(`/enrollments/course/${id}/students`);
      return data.enrollments as StudentEnrollmentData[];
    },
    enabled: !!id && (user?.role === 'TEACHER' || user?.role === 'ADMIN'),
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ['course', id, 'quizzes'],
    queryFn: async () => {
      const { data } = await api.get(`/quizzes/course/${id}`);
      return data.quizzes as QuizData[];
    },
    enabled: !!id,
  });

  // UI State
  const [showCreateLecture, setShowCreateLecture] = useState(false);
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [editLectureId, setEditLectureId] = useState<string | null>(null);
  
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedLectureForAttendance, setSelectedLectureForAttendance] = useState<{ id: string, title: string } | null>(null);

  const [showUploadRecordingModal, setShowUploadRecordingModal] = useState(false);
  const [selectedLectureForRecording, setSelectedLectureForRecording] = useState<{ id: string, title: string } | null>(null);

  const [showDeleteLectureModal, setShowDeleteLectureModal] = useState(false);
  const [selectedLectureForDelete, setSelectedLectureForDelete] = useState<{ id: string, title: string } | null>(null);


  const [showDeleteRecordingModal, setShowDeleteRecordingModal] = useState(false);
  const [selectedLectureForDeleteRecording, setSelectedLectureForDeleteRecording] = useState<{ id: string, title: string } | null>(null);


  const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(false);
  const [selectedMaterialForDelete, setSelectedMaterialForDelete] = useState<{ id: string, title: string } | null>(null);


  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Mutations
  const createLectureMutation = useMutation({
    mutationFn: async (lectureData: typeof lectureForm) => {
      if (editLectureId) {
        return api.put(`/lectures/${editLectureId}`, lectureData);
      } else {
        return api.post(`/lectures/course/${id}`, lectureData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'lectures'] });
      setShowCreateLecture(false);
      setEditLectureId(null);
      setLectureForm({ title: '', description: '', startTime: '', endTime: '' });
    },
    onError: (error: unknown) => {
      console.error('Failed to save lecture', error);
    }
  });

  const uploadThumbnailMutation = useMutation({
    mutationFn: async ({ lectureId, file }: { lectureId: string, file: File }) => {
      const formData = new FormData();
      formData.append('thumbnail', file);
      return api.put(`/lectures/${lectureId}/thumbnail`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'lectures'] });
      alert('Lecture thumbnail uploaded successfully!');
    },
    onError: (error: unknown) => {
      console.error('Failed to upload lecture thumbnail', error);
      alert('Failed to upload lecture thumbnail. Please try again.');
    }
  });

  const uploadMaterialMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post(`/study-materials/course/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'materials'] });
      setUploadSuccess(`"${selectedFile?.name}" uploaded successfully to Google Drive!`);
      setShowUploadMaterial(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setSelectedFile(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      const msg = error?.response?.data?.message || error?.message || 'Upload failed. Please try again.';
      console.error('Failed to upload study material:', err);
      setUploadError(msg);
    }
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      return api.delete(`/study-materials/${materialId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'materials'] });
      toast.success(`"${selectedMaterialForDelete?.title}" deleted successfully.`);
      setShowDeleteMaterialModal(false);
      setSelectedMaterialForDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      console.error('Failed to delete study material', error);
      toast.error(error?.response?.data?.message || 'Failed to delete material.');
    }
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      return api.delete(`/lectures/${lectureId}/recording`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'lectures'] });
      toast.success(`Recording for "${selectedLectureForDeleteRecording?.title}" deleted successfully.`);
      setShowDeleteRecordingModal(false);
      setSelectedLectureForDeleteRecording(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      console.error('Failed to delete lecture recording', error);
      toast.error(error?.response?.data?.message || 'Failed to delete recording.');
    }
  });

  const deleteLectureMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      return api.delete(`/lectures/${lectureId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'lectures'] });
      toast.success(`Lecture "${selectedLectureForDelete?.title}" deleted successfully.`);
      setShowDeleteLectureModal(false);
      setSelectedLectureForDelete(null);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      console.error('Failed to delete lecture', error);
      toast.error(error?.response?.data?.message || 'Failed to delete lecture.');
    }
  });

  const unenrollStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return api.delete(`/enrollments/${id}/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id, 'students'] });
      toast.success('Student unenrolled successfully');
    },
    onError: (error: unknown) => {
      console.error('Failed to unenroll student', error);
      toast.error('Failed to unenroll student');
    }
  });

  // Handlers
  const handleLectureThumbnailUpload = (lectureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadThumbnailMutation.mutate({ lectureId, file });
  };

  const handleCreateLecture = (e: React.FormEvent) => {
    e.preventDefault();
    createLectureMutation.mutate(lectureForm);
  };

  const handleEditClick = (lecture: LectureData) => {
    setLectureForm({
      title: lecture.title,
      description: lecture.description,
      startTime: new Date(lecture.startTime).toISOString().slice(0, 16),
      endTime: new Date(lecture.endTime).toISOString().slice(0, 16)
    });
    setEditLectureId(lecture.id);
    setShowCreateLecture(true);
  };

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploadError(null);
    setUploadSuccess(null);
    const formData = new FormData();
    formData.append('title', materialTitle || selectedFile.name);
    formData.append('description', materialDescription);
    formData.append('file', selectedFile);

    uploadMaterialMutation.mutate(formData);
  };

  const handleDeleteMaterial = () => {
    if (!selectedMaterialForDelete) return;
    deleteMaterialMutation.mutate(selectedMaterialForDelete.id);
  };

  const handleDeleteLectureRecording = () => {
    if (!selectedLectureForDeleteRecording) return;
    deleteRecordingMutation.mutate(selectedLectureForDeleteRecording.id);
  };

  const handleDeleteLecture = () => {
    if (!selectedLectureForDelete) return;
    deleteLectureMutation.mutate(selectedLectureForDelete.id);
  };

  const handleUnenrollStudent = (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the course?')) return;
    unenrollStudentMutation.mutate(studentId);
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) {
      return <FileText className="w-6 h-6 text-rose-500 shrink-0" />;
    }
    if (type.includes('word') || type.includes('officedocument.wordprocessingml') || type.includes('docx') || type.includes('doc')) {
      return <FileText className="w-6 h-6 text-blue-500 shrink-0" />;
    }
    if (type.includes('presentation') || type.includes('powerpoint') || type.includes('pptx')) {
      return <FileText className="w-6 h-6 text-amber-500 shrink-0" />;
    }
    if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('compressed')) {
      return <FolderOpen className="w-6 h-6 text-yellow-600 shrink-0" />;
    }
    return <FileText className="w-6 h-6 text-muted shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-surface rounded-full border border-border hover:bg-bg-subtle transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Course Classroom</h1>
          <p className="text-muted mt-1">Access live lectures and study materials.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('lectures')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'lectures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted hover:text-secondary dark:hover:text-slate-200 dark:text-slate-300'
          }`}
        >
          <Video className="w-4 h-4" />
          Live Lectures
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'materials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted hover:text-secondary dark:hover:text-slate-200 dark:text-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          Study Materials
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted hover:text-secondary dark:hover:text-slate-200 dark:text-slate-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Assessments
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted hover:text-secondary dark:hover:text-slate-200 dark:text-slate-300'
          }`}
        >
          <FileTextIcon className="w-4 h-4" />
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'discussions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted hover:text-secondary dark:hover:text-slate-200 dark:text-slate-300'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Discussions
        </button>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-muted hover:text-secondary dark:hover:text-slate-200 dark:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Students
          </button>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'lectures' ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Scheduled Classes</h3>
            {user?.role === 'TEACHER' && (
              <Button 
                variant="primary"
                onClick={() => {
                  setEditLectureId(null);
                  setLectureForm({ title: '', description: '', startTime: '', endTime: '' });
                  setShowCreateLecture(!showCreateLecture);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule New
              </Button>
            )}
          </div>

          {showCreateLecture && user?.role === 'TEACHER' && (
            <form onSubmit={handleCreateLecture} className="mb-8 p-4 bg-bg-subtle border border-border rounded-lg space-y-4 shadow-sm">
              <h4 className="font-semibold text-primary text-sm">{editLectureId ? 'Edit Live Class' : 'Schedule a Live Class'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Title</label>
                  <input 
                    type="text" 
                    required 
                    value={lectureForm.title} 
                    onChange={(e) => setLectureForm({...lectureForm, title: e.target.value})} 
                    className="w-full border border-border-strong rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Description</label>
                  <input 
                    type="text" 
                    value={lectureForm.description} 
                    onChange={(e) => setLectureForm({...lectureForm, description: e.target.value})} 
                    className="w-full border border-border-strong rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Start Time</label>
                  <CustomDateTimePicker 
                    required 
                    value={lectureForm.startTime} 
                    onChange={(val) => setLectureForm({...lectureForm, startTime: val})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">End Time</label>
                  <CustomDateTimePicker 
                    required 
                    value={lectureForm.endTime} 
                    onChange={(val) => setLectureForm({...lectureForm, endTime: val})} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost"
                  type="button" 
                  onClick={() => setShowCreateLecture(false)} 
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  type="submit" 
                >
                  {editLectureId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          )}

          {lecturesLoading ? (
            <div className="text-center py-8 text-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted" />
              <span className="text-xs mt-2 block">Loading lectures...</span>
            </div>
          ) : lectures.length === 0 ? (
            <EmptyState 
              icon={<Video className="w-8 h-8" />} 
              title="No live classes"
              description="No lectures scheduled yet."
            />
          ) : (
            <div className="space-y-4">
              {lectures.map((lecture) => {
                const now = new Date();
                const start = new Date(lecture.startTime);
                const end = new Date(lecture.endTime);
                const isLive = now >= start && now <= end;
                const isEnded = now > end;

                return (
                  <div key={lecture.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-border rounded-xl hover:border-blue-200 hover:bg-bg-subtle/50 transition">
                    <div className="flex items-start gap-4 mb-4 md:mb-0">
                      <div className="relative group h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 overflow-hidden">
                        {lecture.thumbnailUrl ? (
                          <img 
                            src={getDirectDriveUrl(lecture.thumbnailUrl)} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Calendar className="w-6 h-6" />
                        )}
                        
                        {user?.role === 'TEACHER' && (
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity text-[10px] font-bold">
                            Upload
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleLectureThumbnailUpload(lecture.id, e)} 
                            />
                          </label>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-primary text-base">{lecture.title}</h4>
                          {isLive && (
                            <span className="flex items-center gap-1.5 badge badge-green uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              Live Now
                            </span>
                          )}
                          {isEnded && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bg-subtle text-muted uppercase tracking-wide">
                              Ended
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted mt-1 line-clamp-1">{lecture.description}</p>
                        <div className="text-xs font-semibold text-indigo-600 mt-2 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded w-max flex items-center gap-2">
                          {new Date(lecture.startTime).toLocaleString()} - {new Date(lecture.endTime).toLocaleTimeString()}
                          
                          {user?.role === 'TEACHER' && (
                            <>
                              <button 
                                onClick={() => handleEditClick(lecture)}
                                className="ml-2 text-indigo-500 hover:text-indigo-700 underline px-1 rounded-sm"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedLectureForDelete({ id: lecture.id, title: lecture.title });
                                  setShowDeleteLectureModal(true);
                                }}
                                className="ml-2 text-rose-500 hover:text-rose-700 underline px-1 rounded-sm"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0 w-full md:w-auto shrink-0">
                      {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                        <button 
                          onClick={() => {
                            setSelectedLectureForAttendance({ id: lecture.id, title: lecture.title });
                            setShowAttendanceModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition font-semibold text-sm border border-border text-secondary hover:bg-bg-subtle shadow-sm"
                        >
                          <Users className="w-4 h-4" />
                          Attendance
                        </button>
                      )}
                      {isEnded && user?.role === 'TEACHER' && (
                        <button 
                          onClick={() => {
                            setSelectedLectureForRecording({ id: lecture.id, title: lecture.title });
                            setShowUploadRecordingModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition font-semibold text-sm border border-border text-secondary hover:bg-bg-subtle shadow-sm"
                        >
                          <UploadCloud className="w-4 h-4" />
                          {lecture.recordingUrl ? 'Replace Recording' : 'Upload Recording'}
                        </button>
                      )}
                      {isEnded && lecture.recordingUrl && user?.role === 'TEACHER' && (
                        <button
                          onClick={() => {
                            setSelectedLectureForDeleteRecording({ id: lecture.id, title: lecture.title });
                            setShowDeleteRecordingModal(true);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition font-semibold text-sm border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 shadow-sm"
                          title="Delete recording"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Recording
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/live/${lecture.id}`)}
                        disabled={isEnded && !lecture.recordingUrl}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition font-semibold text-sm shadow-sm ${
                          isEnded
                            ? lecture.recordingUrl
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-bg-subtle text-muted cursor-not-allowed'
                            : isLive
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isEnded ? (
                          <>
                            <Video className="w-4 h-4" />
                            {lecture.recordingUrl ? 'Watch Recording' : 'Ended'}
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            {user?.role === 'TEACHER' ? 'Start Class' : 'Join Class'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'materials' ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Study Materials</h3>
            {user?.role === 'TEACHER' && (
              <Button 
                variant="primary"
                onClick={() => { setShowUploadMaterial(!showUploadMaterial); setUploadError(null); setUploadSuccess(null); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            )}
          </div>

          {/* Success / Error Banners */}
          {uploadSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <span>✅</span> {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <span>❌</span> <strong>Upload Failed:</strong> {uploadError}
            </div>
          )}

          {showUploadMaterial && user?.role === 'TEACHER' && (
            <form onSubmit={handleUploadMaterial} className="mb-8 p-4 bg-bg-subtle border border-border rounded-lg space-y-4 shadow-sm">
              <h4 className="font-semibold text-primary text-sm">Upload Study Material</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Material Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter document title (optional)" 
                    value={materialTitle} 
                    onChange={(e) => setMaterialTitle(e.target.value)} 
                    className="w-full border border-border-strong rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Description (optional)</label>
                  <textarea 
                    placeholder="Enter document description (optional)" 
                    value={materialDescription} 
                    onChange={(e) => setMaterialDescription(e.target.value)} 
                    rows={2}
                    className="w-full border border-border-strong rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">Select File</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-strong rounded-lg cursor-pointer bg-surface hover:bg-bg-subtle transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-muted mb-2" />
                        <p className="text-sm text-muted">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted mt-1">PDF, DOCX, PPTX, ZIP (Max 100MB)</p>
                      </div>
                      <input 
                        type="file" 
                        required 
                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-indigo-600 mt-2 font-semibold">
                      Selected file: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="ghost"
                  type="button" 
                  onClick={() => setShowUploadMaterial(false)} 
                  disabled={uploadMaterialMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  type="submit" 
                  loading={uploadMaterialMutation.isPending}
                >
                  Upload
                </Button>
              </div>
            </form>
          )}

          {materialsLoading ? (
            <div className="text-center py-8 text-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted" />
              <span className="text-xs mt-2 block">Loading materials...</span>
            </div>
          ) : materials.length === 0 ? (
            <EmptyState 
              icon={<FileText className="w-8 h-8" />}
              title="No materials"
              description="No study materials uploaded yet."
            />
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:border-blue-200 hover:bg-bg-subtle/50 transition">
                  <div className="flex items-center gap-4 min-w-0">
                    {getFileIcon(material.fileType)}
                    <div className="min-w-0">
                      <h4 className="font-bold text-primary text-sm truncate">{material.title}</h4>
                      {material.description && (
                        <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed bg-bg-subtle dark:bg-slate-700/50 p-1.5 rounded border border-border max-w-md">
                          {material.description}
                        </p>
                      )}
                      <p className="text-xs text-muted mt-1.5">
                        {material.fileSize ? `${formatFileSize(material.fileSize)} • ` : ''}Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <a 
                      href={material.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 text-muted hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Download/View"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    {user?.role === 'TEACHER' && (
                      <button 
                        onClick={() => {
                          setSelectedMaterialForDelete({ id: material.id, title: material.title });
                          setShowDeleteMaterialModal(true);
                        }}
                        className="p-2 text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                        title="Delete material"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'students' ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Enrolled Students</h3>
            <Button 
              variant="primary"
              onClick={() => setShowEnrollModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Enroll Student
            </Button>
          </div>

          {studentsLoading ? (
            <div className="text-center py-8 text-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted" />
              <span className="text-xs mt-2 block">Loading enrolled students...</span>
            </div>
          ) : enrolledStudents.length === 0 ? (
            <EmptyState 
              icon={<Users className="w-8 h-8" />}
              title="No students"
              description="No students enrolled in this course yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-bg-subtle text-muted text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left">Student Name</th>
                    <th className="px-6 py-4 text-left">Email Address</th>
                    <th className="px-6 py-4 text-left">Enrolled Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-slate-200">
                  {enrolledStudents.map((record) => (
                    <tr key={record.student.id} className="hover:bg-bg-subtle transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {record.student.user.firstName[0]}{record.student.user.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-primary">
                              {record.student.user.firstName} {record.student.user.lastName}
                            </div>
                            <div className="text-xs text-muted">{record.student.enrollmentNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                        {record.student.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {new Date(record.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleUnenrollStudent(record.student.id)} 
                          className="text-red-500 hover:text-red-700 font-medium hover:bg-red-50 p-2 rounded-lg transition"
                          title="Unenroll"
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'quizzes' ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Assessments</h3>
            {user?.role === 'TEACHER' && (
              <Button 
                variant="primary"
                onClick={() => navigate(`/teacher/courses/${id}/quizzes/new`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </Button>
            )}
          </div>

          {quizzesLoading ? (
            <div className="text-center py-8 text-muted">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted" />
              <span className="text-xs mt-2 block">Loading assessments...</span>
            </div>
          ) : quizzes.length === 0 ? (
            <EmptyState 
              icon={<CheckSquare className="w-8 h-8" />}
              title="No assessments"
              description="No assessments created yet."
            />
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-border rounded-xl hover:border-blue-200 hover:bg-bg-subtle/50 transition">
                  <div className="flex items-start gap-4 mb-4 md:mb-0">
                    <div className="relative group h-12 w-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 overflow-hidden">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-base">{quiz.title}</h4>
                      <p className="text-sm text-muted mt-1 line-clamp-1">{quiz.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-muted">
                        <span className="bg-bg-subtle dark:bg-slate-700 px-2 py-0.5 rounded">
                          {quiz._count.questions} Questions
                        </span>
                        <span className="bg-bg-subtle dark:bg-slate-700 px-2 py-0.5 rounded">
                          {quiz.totalMarks} Marks
                        </span>
                        {quiz.durationMins && (
                          <span className="bg-bg-subtle dark:bg-slate-700 px-2 py-0.5 rounded">
                            {quiz.durationMins} Mins
                          </span>
                        )}
                        {user?.role === 'TEACHER' && (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {quiz._count.submissions} Submissions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(user?.role === 'TEACHER' ? `/teacher/courses/${id}/quizzes/${quiz.id}` : `/student/courses/${id}/quizzes/${quiz.id}`)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition font-semibold text-sm shadow-sm shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {user?.role === 'TEACHER' ? 'View Details' : 'Take Quiz'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'assignments' && id ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <AssignmentsTab courseId={id} />
        </div>
      ) : activeTab === 'discussions' && id ? (
        <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
          <DiscussionsTab courseId={id} />
        </div>
      ) : null}

      <EnrollStudentModal 
        isOpen={showEnrollModal} 
        onClose={() => setShowEnrollModal(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['course', id, 'students'] });
          setShowEnrollModal(false);
        }}
        courseId={id || ''}
        enrolledStudentIds={enrolledStudents.map((s: StudentEnrollmentData) => s.studentId)}
      />
      {/* Attendance Modal */}
      {selectedLectureForAttendance && (
        <AttendanceReportModal
          lectureId={selectedLectureForAttendance.id}
          lectureTitle={selectedLectureForAttendance.title}
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}
      
      {/* Upload Recording Modal */}
      {selectedLectureForRecording && (
        <UploadRecordingModal
          lectureId={selectedLectureForRecording.id}
          lectureTitle={selectedLectureForRecording.title}
          isOpen={showUploadRecordingModal}
          onClose={() => setShowUploadRecordingModal(false)}
          onSuccess={() => {
            toast.success('Recording uploaded successfully!');
            queryClient.invalidateQueries({ queryKey: ['course', id, 'lectures'] });
          }}
        />
      )}

      {/* Delete Lecture Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteLectureModal}
        onClose={() => {
          if (!deleteLectureMutation.isPending) {
            setShowDeleteLectureModal(false);
            setSelectedLectureForDelete(null);
          }
        }}
        onConfirm={handleDeleteLecture}
        loading={deleteLectureMutation.isPending}
        title="Delete this lecture?"
        description={`"${selectedLectureForDelete?.title ?? ''}" will be permanently removed along with its recording and any materials.`}
        confirmLabel="Delete Lecture"
      />

      {/* Delete Recording Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteRecordingModal}
        onClose={() => {
          if (!deleteRecordingMutation.isPending) {
            setShowDeleteRecordingModal(false);
            setSelectedLectureForDeleteRecording(null);
          }
        }}
        onConfirm={handleDeleteLectureRecording}
        loading={deleteRecordingMutation.isPending}
        title="Delete this lecture recording?"
        description={`The video for "${selectedLectureForDeleteRecording?.title ?? ''}" will be permanently removed from Google Drive and the lecture. Students will no longer be able to watch it.`}
        confirmLabel="Delete Recording"
      />

      {/* Delete Material Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteMaterialModal}
        onClose={() => {
          if (!deleteMaterialMutation.isPending) {
            setShowDeleteMaterialModal(false);
            setSelectedMaterialForDelete(null);
          }
        }}
        onConfirm={handleDeleteMaterial}
        loading={deleteMaterialMutation.isPending}
        title="Delete this study material?"
        description={`"${selectedMaterialForDelete?.title ?? ''}" will be permanently removed from Google Drive and the course.`}
        confirmLabel="Delete Material"
      />
    </div>
  );
};

export default CourseDetails;
