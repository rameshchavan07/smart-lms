import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import CreateCourseModal from '../../components/CreateCourseModal';
import { BookOpen, MoreVertical, Search, ShieldAlert, Loader2 } from 'lucide-react';
import { getDirectDriveUrl } from '../../utils/drive';
import { Badge, Button, EmptyState, Modal, ConfirmDialog } from '../../components';
import toast from 'react-hot-toast';

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
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Custom Delete Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [courseIdToDelete, setCourseIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', debouncedSearchTerm],
    queryFn: async () => {
      const { data } = await api.get(`${API_ENDPOINTS.COURSES.BASE}${debouncedSearchTerm ? `?search=${debouncedSearchTerm}` : ''}`);
      return data.courses;
    }
  });

  const courses: CourseData[] = data || [];

  const confirmDelete = (id: string) => {
    setCourseIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      return api.delete(API_ENDPOINTS.COURSES.BY_ID(id));
    },
    onSuccess: () => {
      toast.success('Course deleted successfully.');
      setIsConfirmOpen(false);
      setCourseIdToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (error: unknown) => {
      console.error('Failed to delete course', error);
      toast.error('Failed to delete the course.');
    }
  });

  const handleDeleteExecute = () => {
    if (!courseIdToDelete) return;
    deleteMutation.mutate(courseIdToDelete);
  };

  const uploadThumbnailMutation = useMutation({
    mutationFn: ({ courseId, file }: { courseId: string, file: File }) => {
      const formData = new FormData();
      formData.append('thumbnail', file);
      return api.put(API_ENDPOINTS.COURSES.THUMBNAIL(courseId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      toast.success('Course thumbnail uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Failed to upload thumbnail. Please check connection.';
      console.error('Failed to upload thumbnail', error);
      toast.error(errorMessage);
    }
  });

  const handleThumbnailUpload = (courseId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadThumbnailMutation.mutate({ courseId, file });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Course Management</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Create Course
        </Button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-slate-205 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-border bg-bg-subtle/50 dark:bg-slate-850/20 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full border-slate-250 dark:border-slate-700 rounded-xl bg-surface shadow-sm focus:ring-primary-500/20 focus:border-primary-500 sm:text-sm px-3 py-2 border text-primary transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<ShieldAlert className="w-8 h-8 text-primary-500" />}
              title="No courses found"
              description="Try adjusting your search criteria or create a new learning module."
              actionLabel="Create Course"
              onAction={() => setIsModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-bg-subtle/50 dark:bg-slate-800/40 text-muted text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Course Name</th>
                  <th className="px-6 py-4 text-left">Teacher</th>
                  <th className="px-6 py-4 text-left">Students</th>
                  <th className="px-6 py-4 text-left">Lectures</th>
                  <th className="px-6 py-4 text-left">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-slate-200 dark:divide-slate-700">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-bg-subtle/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {course.thumbnailUrl ? (
                          <img 
                            src={getDirectDriveUrl(course.thumbnailUrl)} 
                            alt={course.title} 
                            className="h-10 w-10 object-cover rounded-xl flex-shrink-0 border border-border"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 flex-shrink-0 bg-primary-50 dark:bg-primary-950/40 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm shadow-xs border border-primary-100 dark:border-primary-900/10">
                            {course.title.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4 text-left">
                          <div className="text-sm font-semibold text-primary">{course.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary dark:text-slate-350">
                      {course.teacher ? (
                        <span className="font-semibold text-slate-850 dark:text-slate-200">
                          {course.teacher.user.firstName} {course.teacher.user.lastName}
                        </span>
                      ) : (
                        <Badge variant="warning">Unassigned</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary dark:text-slate-350">
                      {course._count.enrollments}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-secondary dark:text-slate-350">
                      {course._count.lectures}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold space-x-2">
                      {uploadThumbnailMutation.isPending ? (
                        <span className="inline-flex items-center gap-1.5 text-muted mr-3 text-xs">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        <label className="text-primary-500 hover:text-primary-700 cursor-pointer transition-colors mr-2">
                          Upload Image
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleThumbnailUpload(course.id, e)}
                            disabled={uploadThumbnailMutation.isPending}
                          />
                        </label>
                      )}
                      <Button 
                        variant="ghost" 
                        onClick={() => confirmDelete(course.id)} 
                        className="text-xs text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 px-3"
                      >
                        Delete
                      </Button>
                      <button className="text-muted hover:text-primary-500 transition-colors">
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
          toast.success('Course created successfully.');
          queryClient.invalidateQueries({ queryKey: ['courses'] });
        }}
      />

      {/* Custom Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Delete Course Module">
        <ConfirmDialog
          title="Confirm Course Deletion"
          message="Are you sure you want to delete this course module? All student enrollments, lectures, assignments, and study materials associated with it will be permanently deleted."
          onConfirm={handleDeleteExecute}
          onCancel={() => setIsConfirmOpen(false)}
          loading={deleteMutation.isPending}
          danger
        />
      </Modal>
    </div>
  );
};

export default CourseManagement;
