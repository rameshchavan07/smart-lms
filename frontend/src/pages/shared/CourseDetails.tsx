import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import EnrollStudentModal from '../../components/EnrollStudentModal';
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
  UserMinus
} from 'lucide-react';

interface LectureData {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  meetingUrl: string;
}

interface MaterialData {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
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
  
  const [activeTab, setActiveTab] = useState<'lectures' | 'materials' | 'students'>('lectures');
  
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

  // Materials state
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
    const formData = new FormData();
    formData.append('title', materialTitle || selectedFile.name);
    formData.append('file', selectedFile);

    try {
      await api.post(`/study-materials/course/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setShowUploadMaterial(false);
      setMaterialTitle('');
      setSelectedFile(null);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to upload study material', error);
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
                    <div className="h-12 w-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{lecture.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{lecture.description}</p>
                      <div className="text-xs font-semibold text-indigo-600 mt-2 bg-indigo-50/50 border border-indigo-100/50 px-2 py-0.5 rounded w-max">
                        {new Date(lecture.startTime).toLocaleString()} - {new Date(lecture.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/live/${lecture.id}`)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm shadow-sm shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {user?.role === 'TEACHER' ? 'Start Class' : 'Join Class'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'materials' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Study Materials</h3>
            {user?.role === 'TEACHER' && (
              <button 
                onClick={() => setShowUploadMaterial(!showUploadMaterial)}
                className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Upload File
              </button>
            )}
          </div>

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
                      <p className="text-xs text-slate-400 mt-1">
                        Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
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
      )}
    </div>
  );
};

export default CourseDetails;


