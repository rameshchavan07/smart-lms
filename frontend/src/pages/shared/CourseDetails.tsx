import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import EnrollStudentModal from '../../components/EnrollStudentModal';
import UploadRecordingModal from '../../components/UploadRecordingModal';
import WatchRecordingModal from '../../components/WatchRecordingModal';
import SubmitAssignmentModal from '../../components/SubmitAssignmentModal';
import TakeQuizModal from '../../components/TakeQuizModal';
import ViewSubmissionsModal from '../../components/ViewSubmissionsModal';
import { getDirectDriveUrl } from '../../utils/drive';
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
  ClipboardList,
  CheckCircle
} from 'lucide-react';

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
  const { user } = useAuth();

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null || bytes === undefined) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const [activeTab, setActiveTab] = useState<'lectures' | 'materials' | 'students' | 'assignments' | 'quizzes'>('lectures');
  
  // Tab sync with query params (since clicking 'Submit' in student dashboard redirects to ?tab=assignments)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['lectures', 'materials', 'students', 'assignments', 'quizzes'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, []);
  
  // Lectures state
  const [lectures, setLectures] = useState<LectureData[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [showCreateLecture, setShowCreateLecture] = useState(false);
  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  });
  const [selectedRecordingLecture, setSelectedRecordingLecture] = useState<{id: string, title: string} | null>(null);
  const [watchingLecture, setWatchingLecture] = useState<{id: string, title: string, recordingUrl: string} | null>(null);

  // Materials state
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Enrolled Students state
  const [enrolledStudents, setEnrolledStudents] = useState<StudentEnrollmentData[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const fetchLectures = async () => {
    try {
      const { data } = await api.get(`/lectures/course/${id}`);
      setLectures(data.lectures);
    } catch (error) {
      console.error('Failed to fetch lectures', error);
    } finally {
      setLecturesLoading(false);
    }
  };

  const handleLectureThumbnailUpload = async (lectureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('thumbnail', file);

    try {
      setLecturesLoading(true);
      await api.put(`/lectures/${lectureId}/thumbnail`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Lecture thumbnail uploaded successfully!');
      fetchLectures();
    } catch (error: any) {
      console.error('Failed to upload lecture thumbnail', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload lecture thumbnail. Please try again.';
      alert(errorMessage);
    } finally {
      setLecturesLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data } = await api.get(`/study-materials/course/${id}`);
      setMaterials(data.materials);
    } catch (error) {
      console.error('Failed to fetch study materials', error);
    } finally {
      setMaterialsLoading(false);
    }
  };

  // Assignments state
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<any | null>(null);
  const [gradingAssignment, setGradingAssignment] = useState<any | null>(null);

  // Quizzes state
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [takingQuiz, setTakingQuiz] = useState<any | null>(null);

  const fetchAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const res = await api.get(`/assignments/course/${id}`);
      setAssignments(res.data.assignments);
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    setQuizzesLoading(true);
    try {
      const res = await api.get(`/quizzes/course/${id}`);
      setQuizzes(res.data.quizzes);
    } catch (error) {
      console.error('Failed to fetch quizzes', error);
    } finally {
      setQuizzesLoading(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      const { data } = await api.get(`/enrollments/course/${id}/students`);
      setEnrolledStudents(data.enrollments);
    } catch (error) {
      console.error('Failed to fetch enrolled students', error);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLectures();
      fetchMaterials();
      fetchAssignments();
      fetchQuizzes();
      if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
        fetchEnrolledStudents();
      }
    }
  }, [id, user]);

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/lectures/course/${id}`, lectureForm);
      setShowCreateLecture(false);
      setLectureForm({ title: '', description: '', startTime: '', endTime: '' });
      fetchLectures();
    } catch (error) {
      console.error('Failed to create lecture', error);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    const formData = new FormData();
    formData.append('title', materialTitle || selectedFile.name);
    formData.append('description', materialDescription);
    formData.append('file', selectedFile);

    try {
      await api.post(`/study-materials/course/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 min timeout for large files
      });
      setUploadSuccess(`"${selectedFile.name}" uploaded successfully to Google Drive!`);
      setShowUploadMaterial(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setSelectedFile(null);
      fetchMaterials();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Upload failed. Please try again.';
      console.error('Failed to upload study material:', error);
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;
    try {
      await api.delete(`/study-materials/${materialId}`);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to delete study material', error);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the course?')) return;
    try {
      await api.delete(`/enrollments/${id}/students/${studentId}`);
      fetchEnrolledStudents();
    } catch (error) {
      console.error('Failed to unenroll student', error);
    }
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
    return <FileText className="w-6 h-6 text-slate-400 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Classroom</h1>
          <p className="text-slate-500 mt-1">Access live lectures and study materials.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('lectures')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'lectures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
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
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Study Materials
        </button>
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Students
          </button>
        )}
        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Quizzes
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'lectures' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Scheduled Classes</h3>
            {user?.role === 'TEACHER' && (
              <button 
                onClick={() => setShowCreateLecture(!showCreateLecture)}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Schedule New
              </button>
            )}
          </div>

          {showCreateLecture && user?.role === 'TEACHER' && (
            <form onSubmit={handleCreateLecture} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 shadow-sm">
              <h4 className="font-semibold text-slate-900 text-sm">Schedule a Live Class</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
                  <input 
                    type="text" 
                    required 
                    value={lectureForm.title} 
                    onChange={(e) => setLectureForm({...lectureForm, title: e.target.value})} 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <input 
                    type="text" 
                    value={lectureForm.description} 
                    onChange={(e) => setLectureForm({...lectureForm, description: e.target.value})} 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={lectureForm.startTime} 
                    onChange={(e) => setLectureForm({...lectureForm, startTime: e.target.value})} 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={lectureForm.endTime} 
                    onChange={(e) => setLectureForm({...lectureForm, endTime: e.target.value})} 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateLecture(false)} 
                  className="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 rounded-md text-white text-sm hover:bg-blue-700 transition font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          {lecturesLoading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              <span className="text-xs mt-2 block">Loading lectures...</span>
            </div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Video className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No lectures scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lectures.map((lecture) => (
                <div key={lecture.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 transition">
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
                      <h4 className="font-bold text-slate-900 text-base">{lecture.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{lecture.description}</p>
                      <div className="text-xs font-semibold text-indigo-600 mt-2 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded w-max">
                        {new Date(lecture.startTime).toLocaleString()} - {new Date(lecture.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                    <button 
                      onClick={() => navigate(`/live/${lecture.id}`)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {user?.role === 'TEACHER' ? 'Start Class' : 'Join Class'}
                    </button>
                    {lecture.recordingUrl && (
                      <button
                        onClick={() => setWatchingLecture({ id: lecture.id, title: lecture.title, recordingUrl: lecture.recordingUrl! })}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition font-semibold text-sm shadow-sm"
                      >
                        <Video className="w-4 h-4" />
                        Watch Recording
                      </button>
                    )}
                    {user?.role === 'TEACHER' && (
                      <button
                        onClick={() => setSelectedRecordingLecture({ id: lecture.id, title: lecture.title })}
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-lg hover:bg-indigo-50 transition font-semibold text-sm shadow-sm"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Upload Recording
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {selectedRecordingLecture && (
                <UploadRecordingModal
                  lectureId={selectedRecordingLecture.id}
                  lectureTitle={selectedRecordingLecture.title}
                  isOpen={!!selectedRecordingLecture}
                  onClose={() => setSelectedRecordingLecture(null)}
                  onSuccess={() => {
                    fetchLectures();
                    alert('Recording uploaded successfully!');
                  }}
                />
              )}
              
              {watchingLecture && (
                <WatchRecordingModal
                  isOpen={!!watchingLecture}
                  onClose={() => setWatchingLecture(null)}
                  recordingUrl={watchingLecture.recordingUrl}
                  title={watchingLecture.title}
                />
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'materials' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Study Materials</h3>
            {user?.role === 'TEACHER' && (
              <button 
                onClick={() => { setShowUploadMaterial(!showUploadMaterial); setUploadError(null); setUploadSuccess(null); }}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Upload File
              </button>
            )}
          </div>

          {/* Success / Error Banners */}
          {uploadSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <span>Γ£à</span> {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <span>Γ¥î</span> <strong>Upload Failed:</strong> {uploadError}
            </div>
          )}

          {showUploadMaterial && user?.role === 'TEACHER' && (
            <form onSubmit={handleUploadMaterial} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 shadow-sm">
              <h4 className="font-semibold text-slate-900 text-sm">Upload Study Material</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Material Title</label>
                  <input 
                    type="text" 
                    placeholder="Enter document title (optional)" 
                    value={materialTitle} 
                    onChange={(e) => setMaterialTitle(e.target.value)} 
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description (optional)</label>
                  <textarea 
                    placeholder="Enter document description (optional)" 
                    value={materialDescription} 
                    onChange={(e) => setMaterialDescription(e.target.value)} 
                    rows={2}
                    className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select File</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PDF, DOCX, PPTX, ZIP (Max 100MB)</p>
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
                <button 
                  type="button" 
                  onClick={() => setShowUploadMaterial(false)} 
                  disabled={uploading}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 rounded-md text-white text-sm hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          )}

          {materialsLoading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              <span className="text-xs mt-2 block">Loading materials...</span>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No study materials uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-4 min-w-0">
                    {getFileIcon(material.fileType)}
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{material.title}</h4>
                      {material.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed bg-slate-100/50 p-1.5 rounded border border-slate-100 max-w-md">
                          {material.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5">
                        {material.fileSize ? `${formatFileSize(material.fileSize)} ΓÇó ` : ''}Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <a 
                      href={material.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Download/View"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    {user?.role === 'TEACHER' && (
                      <button 
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
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
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Enrolled Students</h3>
            <button 
              onClick={() => setShowEnrollModal(true)}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Enroll Student
            </button>
          </div>

          {studentsLoading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              <span className="text-xs mt-2 block">Loading enrolled students...</span>
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No students enrolled in this course yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-left">Student Name</th>
                    <th className="px-6 py-4 text-left">Email Address</th>
                    <th className="px-6 py-4 text-left">Enrolled Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {enrolledStudents.map((record) => (
                    <tr key={record.student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                            {record.student.user.firstName[0]}{record.student.user.lastName[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {record.student.user.firstName} {record.student.user.lastName}
                            </div>
                            <div className="text-xs text-slate-400">{record.student.enrollmentNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {record.student.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
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

          <EnrollStudentModal 
            isOpen={showEnrollModal} 
            onClose={() => setShowEnrollModal(false)} 
            courseId={id || ''}
            onSuccess={() => {
              setShowEnrollModal(false);
              fetchEnrolledStudents();
            }}
          />
        </div>
      ) : activeTab === 'assignments' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Assignments</h3>
          </div>
          {assignmentsLoading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No assignments available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map(assignment => {
                const isOverdue = new Date(assignment.dueDate) < new Date();
                return (
                  <div key={assignment.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 transition">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{assignment.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">{assignment.description}</p>
                      <div className={`text-xs font-semibold mt-2 px-2 py-0.5 rounded w-max ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                      {user?.role === 'TEACHER' ? (
                        <button 
                          onClick={() => setGradingAssignment(assignment)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700"
                        >
                          Grade Submissions
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSubmittingAssignment(assignment)}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700"
                        >
                          Submit Work
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {submittingAssignment && (
            <SubmitAssignmentModal
              isOpen={!!submittingAssignment}
              onClose={() => setSubmittingAssignment(null)}
              assignmentId={submittingAssignment?.id}
              assignmentTitle={submittingAssignment?.title}
              onSuccess={() => {
                fetchAssignments();
                alert('Successfully submitted!');
              }}
            />
          )}

          {gradingAssignment && (
            <ViewSubmissionsModal
              isOpen={!!gradingAssignment}
              onClose={() => setGradingAssignment(null)}
              assignmentId={gradingAssignment.id}
              assignmentTitle={gradingAssignment.title}
            />
          )}
        </div>
      ) : activeTab === 'quizzes' ? (
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
              {quizzes.map(quiz => (
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
                fetchQuizzes(); // Refresh to get updated status if needed, though status logic isn't fully there yet for quizzes
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CourseDetails;


