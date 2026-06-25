import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import CreateCourseModal from '../../components/CreateCourseModal';
import { BookOpen, MoreVertical, Search, ShieldAlert, Loader2 } from 'lucide-react';
import { getDirectDriveUrl } from '../../utils/drive';

interface CourseData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  thumbnailUrl?: string;
  teacher?: {
    user: {
      firstName: string;
      lastName: string;
    }
  };
  _count: {
    enrollments: number;
    lectures: number;
  }
}

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingCourseId, setUploadingCourseId] = useState<string | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/courses${searchTerm ? `?search=${searchTerm}` : ''}`);
      setCourses(data.courses);
    } catch (error) {
      console.error('Failed to fetch courses', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchCourses();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`/courses/${id}`);
        fetchCourses();
      } catch (error) {
        console.error('Failed to delete course', error);
      }
    }
  };

  const handleThumbnailUpload = async (courseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('thumbnail', file);

    try {
      setUploadingCourseId(courseId);
      await api.put(`/courses/${courseId}/thumbnail`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Course thumbnail uploaded successfully!');
      fetchCourses();
    } catch (error) {
      console.error('Failed to upload thumbnail', error);
      alert('Failed to upload thumbnail. Please check connection and try again.');
    } finally {
      setUploadingCourseId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Course Management</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
        >
          <BookOpen className="w-4 h-4" />
          Create Course
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-16 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No courses found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search or create a new course.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Course Name</th>
                  <th className="px-6 py-4 text-left">Teacher</th>
                  <th className="px-6 py-4 text-left">Students</th>
                  <th className="px-6 py-4 text-left">Lectures</th>
                  <th className="px-6 py-4 text-left">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {course.thumbnailUrl ? (
                          <img 
                            src={getDirectDriveUrl(course.thumbnailUrl)} 
                            alt={course.title} 
                            className="h-10 w-10 object-cover rounded-md flex-shrink-0"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {course.title.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{course.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {course.teacher ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}` : <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs font-medium">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {course._count.enrollments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {course._count.lectures}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {uploadingCourseId === course.id ? (
                        <span className="inline-flex items-center gap-1 text-slate-500 mr-3">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        <label className="text-blue-500 hover:text-blue-700 cursor-pointer transition-colors mr-3">
                          Upload Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleThumbnailUpload(course.id, e)}
                            disabled={uploadingCourseId !== null}
                          />
                        </label>
                      )}
                      <button onClick={() => handleDelete(course.id)} className="text-red-400 hover:text-red-600 transition-colors mr-3">
                        Delete
                      </button>
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">
                        <MoreVertical className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateCourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchCourses();
        }}
      />
    </div>
  );
};

export default CourseManagement;
