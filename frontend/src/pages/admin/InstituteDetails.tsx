import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { Card } from '../../components';
import { Building, Users, BookOpen, ChevronLeft, Shield, GraduationCap } from 'lucide-react';

export default function InstituteDetails() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'admins' | 'teachers' | 'students' | 'courses'>('admins');

  const { data: institute, isLoading, isError } = useQuery({
    queryKey: ['institute', id],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.INSTITUTES.BY_ID(id as string));
      return res.data.institute;
    }
  });

  if (isLoading) return <div className="p-8 text-center text-muted">Loading institute details...</div>;
  if (isError || !institute) return <div className="p-8 text-center text-red-500">Failed to load institute details.</div>;

  const admins = institute.users.filter((u: { role: string }) => u.role === 'ADMIN');
  const teachers = institute.users.filter((u: { role: string }) => u.role === 'TEACHER');
  const students = institute.users.filter((u: { role: string }) => u.role === 'STUDENT');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/institutes" className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Building className="w-6 h-6 text-brand-500" />
            {institute.name}
          </h1>
          <p className="text-muted text-sm mt-1">{institute.email} • {institute.phone}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted font-medium">Admins</p>
            <p className="text-2xl font-bold text-primary">{admins.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted font-medium">Teachers</p>
            <p className="text-2xl font-bold text-primary">{teachers.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted font-medium">Students</p>
            <p className="text-2xl font-bold text-primary">{students.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted font-medium">Courses</p>
            <p className="text-2xl font-bold text-primary">{institute.courses.length}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {[
            { id: 'admins', label: 'Administrators', icon: Shield, count: admins.length },
            { id: 'teachers', label: 'Teachers', icon: Users, count: teachers.length },
            { id: 'students', label: 'Students', icon: GraduationCap, count: students.length },
            { id: 'courses', label: 'Courses', icon: BookOpen, count: institute.courses.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'admins' | 'teachers' | 'students' | 'courses')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-500/10' 
                  : 'border-transparent text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="bg-black/10 dark:bg-white/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface border-b border-border text-muted font-medium">
              <tr>
                {activeTab !== 'courses' ? (
                  <>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    {activeTab === 'teachers' && <th className="px-6 py-4">Employee Code</th>}
                    {activeTab === 'teachers' && <th className="px-6 py-4">Specialization</th>}
                    {activeTab === 'students' && <th className="px-6 py-4">Enrollment No.</th>}
                    <th className="px-6 py-4">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4">Course Title</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Enrollments</th>
                    <th className="px-6 py-4">Lectures</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTab === 'admins' && admins.map(admin => (
                <tr key={admin.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{admin.firstName} {admin.lastName}</td>
                  <td className="px-6 py-4 text-muted">{admin.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${admin.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {activeTab === 'teachers' && teachers.map(teacher => (
                <tr key={teacher.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{teacher.firstName} {teacher.lastName}</td>
                  <td className="px-6 py-4 text-muted">{teacher.email}</td>
                  <td className="px-6 py-4 text-muted">{teacher.teacher?.employeeCode || 'N/A'}</td>
                  <td className="px-6 py-4 text-muted">{teacher.teacher?.specialization || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacher.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {activeTab === 'students' && students.map(student => (
                <tr key={student.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{student.firstName} {student.lastName}</td>
                  <td className="px-6 py-4 text-muted">{student.email}</td>
                  <td className="px-6 py-4 text-muted">{student.student?.enrollmentNumber || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {activeTab === 'courses' && institute.courses.map(course => (
                <tr key={course.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-primary">{course.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{course._count?.enrollments || 0}</td>
                  <td className="px-6 py-4 text-muted">{course._count?.lectures || 0}</td>
                </tr>
              ))}
              {((activeTab === 'admins' && admins.length === 0) ||
                (activeTab === 'teachers' && teachers.length === 0) ||
                (activeTab === 'students' && students.length === 0) ||
                (activeTab === 'courses' && institute.courses.length === 0)) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    No records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
